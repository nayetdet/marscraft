import * as THREE from 'three';
import { WORLD_CONFIG, WATER_SYSTEM_CONFIG } from '../config/constants.js';

export class RoverController {
  constructor({ roverGroup, wheels = [], world, camera, colliders = [] }) {
    this.roverGroup = roverGroup;
    this.wheels = wheels;
    this.world = world;
    this.camera = camera;
    this.colliders = colliders;

    this.isActive = false;
    this.cameraMode = 'third_person'; // 'third_person' | 'mastcam'

    // Posição e orientação inicial a partir do modelo 3D
    this.pos = new THREE.Vector3();
    if (this.roverGroup) {
      this.pos.copy(this.roverGroup.position);
      this.yaw = this.roverGroup.rotation.y || 0;
    } else {
      this.pos.set(7.5, 9, 10.5);
      this.yaw = 0;
    }

    this.pitch = 0;
    this.roll = 0;
    this.cameraYaw = this.yaw;
    this.cameraPitch = -0.22;
    this.speed = 0;
    this.maxForwardSpeed = 6.2;
    this.maxReverseSpeed = 2.8;
    this.acceleration = 7.2;
    this.deceleration = 3.8;
    this.brakeDeceleration = 9.0;
    this.turnSpeed = 1.55;

    this.battery = 98.5;
    this.distanceTraveled = 0;

    // Carga de Gelo e Perfuração Robótica
    this.iceCargo = 0;
    this.maxIceCargo = WATER_SYSTEM_CONFIG.ICE_CARGO_MAX;
    this.drillCooldown = 0;

    // Cache de vetores para evitar alocações constantes no loop
    this._forward = new THREE.Vector3();
    this._camTargetPos = new THREE.Vector3();
    this._camLookAt = new THREE.Vector3();
    this._camLookDir = new THREE.Vector3();
    this._wheelBase = 2.7; // distância entre eixos dianteiro e traseiro
    this._trackWidth = 2.4; // largura entre rodas
  }

  getTerrainHeight(x, z) {
    if (!this.world) return WORLD_CONFIG.GROUND_LEVEL + 1;
    const ix = Math.floor(x);
    const iz = Math.floor(z);

    // Varre de cima para baixo procurando o bloco sólido de topo
    for (let y = Math.min(38, this.world.sizeY - 1); y >= 0; y--) {
      const blockId = this.world.getBlock(ix, y, iz);
      // Se não for ar nem vidro, é superfície sólida
      if (blockId !== 0 && blockId !== 7) {
        return y + 1;
      }
    }
    return WORLD_CONFIG.GROUND_LEVEL + 1;
  }

  isPositionBlocked(nextX, nextZ, currentY) {
    // 1. Limite circular da cratera
    const distFromCenter = Math.hypot(nextX, nextZ);
    if (distFromCenter >= WORLD_CONFIG.CRATER_RADIUS - 3.2) {
      return true;
    }

    // 2. Não subir em degraus mais altos que a capacidade do rover (paredes da base, rochas verticais)
    const targetHeight = this.getTerrainHeight(nextX, nextZ);
    if (targetHeight - currentY > 1.15) {
      return true;
    }

    // 3. Área construída da base principal para evitar atravessar paredes do habitat
    if (
      nextX >= -9.0 &&
      nextX <= 9.0 &&
      nextZ >= -7.0 &&
      nextZ <= 10.2 &&
      targetHeight >= WORLD_CONFIG.GROUND_LEVEL + 2
    ) {
      return true;
    }

    // Área da Redoma de Estufa (x: -25 .. -11, z: -8 .. 8)
    const distToDome = Math.hypot(nextX + 18, nextZ);
    if (distToDome < 8.2) {
      return true;
    }

    // Use the same static construction colliders as the astronaut. The rover has
    // a wider footprint, so expand each AABB by its half-width on the ground.
    const roverRadius = 1.15;
    for (const collider of this.colliders) {
      const insideCurrent =
        this.pos.x >= collider.minX - roverRadius &&
        this.pos.x <= collider.maxX + roverRadius &&
        this.pos.z >= collider.minZ - roverRadius &&
        this.pos.z <= collider.maxZ + roverRadius;
      const insideNext =
        nextX >= collider.minX - roverRadius &&
        nextX <= collider.maxX + roverRadius &&
        nextZ >= collider.minZ - roverRadius &&
        nextZ <= collider.maxZ + roverRadius;

      // The rover begins next to the unloading dock. Let it drive out if its
      // spawn footprint overlaps a collider, but never let it enter from outside.
      if (!insideCurrent && insideNext) return true;
    }

    return false;
  }

  toggleCameraMode() {
    this.cameraMode = this.cameraMode === 'third_person' ? 'mastcam' : 'third_person';
  }

  look(dx, dy, sensitivity = 0.0021) {
    this.cameraYaw -= dx * sensitivity;
    this.cameraPitch = THREE.MathUtils.clamp(this.cameraPitch - dy * sensitivity, -1.15, 1.15);
  }

  activate() {
    this.isActive = true;
    this.speed = 0;
    // Enter with the chase camera aligned to the rover, then let mouse look offset it.
    this.cameraYaw = this.yaw;
    this.cameraPitch = -0.22;
  }

  deactivate() {
    this.isActive = false;
    this.speed = 0;
  }

  canCollectIce() {
    const distToIceCrater = Math.hypot(
      this.pos.x - WATER_SYSTEM_CONFIG.ICE_CRATER_CENTER.x,
      this.pos.z - WATER_SYSTEM_CONFIG.ICE_CRATER_CENTER.z
    );
    const blockBelow = this.world?.getBlock(
      Math.floor(this.pos.x),
      Math.floor(this.pos.y) - 1,
      Math.floor(this.pos.z)
    );
    // Id 4 é MARS_ICE
    return distToIceCrater <= 10.5 || blockBelow === 4;
  }

  canUnloadIce() {
    const distToDepot = Math.hypot(
      this.pos.x - WATER_SYSTEM_CONFIG.ICE_DEPOT_POS.x,
      this.pos.z - WATER_SYSTEM_CONFIG.ICE_DEPOT_POS.z
    );
    return distToDepot <= 5.8 && this.iceCargo > 0;
  }

  collectIce() {
    if (!this.canCollectIce()) {
      return { success: false, reason: 'No water ice nearby. Navigate to Northeast Ice Crater!' };
    }
    if (this.iceCargo >= this.maxIceCargo) {
      return { success: false, reason: `Ice hold is full (${this.maxIceCargo}kg). Offload at Habitat Bay!` };
    }

    const amount = Math.min(WATER_SYSTEM_CONFIG.ICE_PER_DRILL, this.maxIceCargo - this.iceCargo);
    this.iceCargo += amount;
    this.drillCooldown = 0.8;
    this.battery = Math.max(5, this.battery - 1.2);

    return {
      success: true,
      amount,
      total: this.iceCargo,
      message: `Drill active! Collected +${amount}kg Water Ice (${this.iceCargo}/${this.maxIceCargo}kg)`,
    };
  }

  unloadIce() {
    if (!this.canUnloadIce()) {
      return { success: false, reason: 'Not in range of base water converter intake.' };
    }

    const offloaded = this.iceCargo;
    this.iceCargo = 0;
    return {
      success: true,
      amount: offloaded,
      message: `Offloaded ${offloaded}kg ice to base! Converted to ${offloaded}L Purified Water.`,
    };
  }

  getTelemetry() {
    let headingDeg = THREE.MathUtils.radToDeg(-this.yaw) % 360;
    if (headingDeg < 0) headingDeg += 360;

    const cardinals = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const cardIdx = Math.round(headingDeg / 45) % 8;

    return {
      speedKmh: Math.abs(this.speed * 3.6).toFixed(1),
      speedMs: Math.abs(this.speed).toFixed(1),
      headingDeg: Math.round(headingDeg),
      headingCard: cardinals[cardIdx],
      x: this.pos.x.toFixed(1),
      y: (this.pos.y - 0.5).toFixed(1),
      z: this.pos.z.toFixed(1),
      battery: Math.max(1, Math.min(100, Math.round(this.battery))),
      distanceTraveled: Math.round(this.distanceTraveled),
      cameraMode: this.cameraMode,
      iceCargo: this.iceCargo,
      maxIceCargo: this.maxIceCargo,
      canCollectIce: this.canCollectIce(),
      canUnloadIce: this.canUnloadIce(),
      isDrilling: this.drillCooldown > 0,
    };
  }

  update(dt, keys = {}) {
    if (!this.roverGroup) return;

    if (this.drillCooldown > 0) {
      this.drillCooldown = Math.max(0, this.drillCooldown - dt);
    }

    if (this.isActive) {
      let throttle = 0;
      if (keys['KeyW'] || keys['ArrowUp']) throttle += 1;
      if (keys['KeyS'] || keys['ArrowDown']) throttle -= 1;

      let steer = 0;
      if (keys['KeyA'] || keys['ArrowLeft']) steer += 1;
      if (keys['KeyD'] || keys['ArrowRight']) steer -= 1;

      // Acceleration and braking are kept separate so direction changes feel deliberate.
      if (throttle > 0) {
        const rate = this.speed < 0 ? this.brakeDeceleration : this.acceleration;
        this.speed = Math.min(this.maxForwardSpeed, this.speed + rate * dt);
        this.battery = Math.max(5, this.battery - dt * 0.04);
      } else if (throttle < 0) {
        const rate = this.speed > 0 ? this.brakeDeceleration : this.acceleration;
        this.speed = Math.max(-this.maxReverseSpeed, this.speed - rate * dt);
        this.battery = Math.max(5, this.battery - dt * 0.04);
      } else {
        // Atrito / freio na areia
        if (this.speed > 0) {
          this.speed = Math.max(0, this.speed - this.deceleration * dt);
        } else if (this.speed < 0) {
          this.speed = Math.min(0, this.speed + this.deceleration * dt);
        }
      }

      // Steering scales with speed: responsive while moving, without spinning in place.
      if (steer !== 0) {
        const turnDir = steer;
        const reverseFactor = this.speed < -0.1 ? -1 : 1;
        const speedRatio = Math.min(1, Math.abs(this.speed) / this.maxForwardSpeed);
        const steeringGrip = 0.18 + speedRatio * 0.82;
        this.yaw += turnDir * this.turnSpeed * steeringGrip * dt * reverseFactor;
      }

      // Recarga lenta de bateria por painéis solares
      if (throttle === 0 && this.battery < 100) {
        this.battery = Math.min(100, this.battery + dt * 0.02);
      }

      // Movimentação linear
      if (Math.abs(this.speed) > 0.01) {
        const moveDist = this.speed * dt;
        const sinYaw = Math.sin(this.yaw);
        const cosYaw = Math.cos(this.yaw);

        // O rover tem a frente apontando para -Z quando yaw = 0
        const dx = -sinYaw * moveDist;
        const dz = -cosYaw * moveDist;

        const nextX = this.pos.x + dx;
        const nextZ = this.pos.z + dz;

        // Sweep the path instead of testing just the destination. This prevents clipping
        // through narrow terrain edges when a frame takes longer than usual.
        const steps = Math.max(1, Math.ceil(Math.abs(moveDist) / 0.2));
        let isBlocked = false;
        for (let step = 1; step <= steps; step += 1) {
          const progress = step / steps;
          if (this.isPositionBlocked(this.pos.x + dx * progress, this.pos.z + dz * progress, this.pos.y)) {
            isBlocked = true;
            break;
          }
        }

        if (!isBlocked) {
          this.pos.x = nextX;
          this.pos.z = nextZ;
          this.distanceTraveled += Math.abs(moveDist);

          // Rotate wheels only for movement that actually happened.
          const wheelRotDelta = moveDist / 0.325;
          for (const wheel of this.wheels) {
            wheel.rotation.x += wheelRotDelta;
          }
        } else {
          this.speed = 0;
        }
      }
    }

    // Amostra terreno em volta para ajustar suspensão, pitch e roll
    const sinYaw = Math.sin(this.yaw);
    const cosYaw = Math.cos(this.yaw);

    const halfL = this._wheelBase * 0.5;
    const halfW = this._trackWidth * 0.5;

    // Posições dos cantos no terreno
    const frontX = this.pos.x - sinYaw * halfL;
    const frontZ = this.pos.z - cosYaw * halfL;
    const rearX = this.pos.x + sinYaw * halfL;
    const rearZ = this.pos.z + cosYaw * halfL;

    const leftX = this.pos.x - cosYaw * halfW;
    const leftZ = this.pos.z + sinYaw * halfW;
    const rightX = this.pos.x + cosYaw * halfW;
    const rightZ = this.pos.z - sinYaw * halfW;

    const hFront = this.getTerrainHeight(frontX, frontZ);
    const hRear = this.getTerrainHeight(rearX, rearZ);
    const hLeft = this.getTerrainHeight(leftX, leftZ);
    const hRight = this.getTerrainHeight(rightX, rightZ);

    const targetY = (hFront + hRear + hLeft + hRight) * 0.25;

    // Suavização da suspensão
    this.pos.y += (targetY - this.pos.y) * Math.min(1.0, dt * 10);

    // In Three.js, a positive X rotation lifts the rover's visible front (-Z).
    // Use the front-to-rear height difference so it tilts uphill, not downhill.
    const targetPitch = Math.atan2(hFront - hRear, this._wheelBase);
    // Three.js positive Z rotation lowers the rover's local left side (+X maps up
    // for positive roll). Invert the terrain delta so the higher side rises.
    const targetRoll = Math.atan2(hRight - hLeft, this._trackWidth);

    this.pitch += (targetPitch - this.pitch) * Math.min(1.0, dt * 8);
    this.roll += (targetRoll - this.roll) * Math.min(1.0, dt * 8);

    // Aplica transformações no modelo 3D do rover
    this.roverGroup.position.copy(this.pos);
    this.roverGroup.rotation.order = 'YXZ';
    this.roverGroup.rotation.y = this.yaw;
    this.roverGroup.rotation.x = this.pitch;
    this.roverGroup.rotation.z = this.roll;

    // Se estiver no controle do rover, posiciona a câmera
    if (this.isActive && this.camera) {
      this._updateCamera(dt);
    }
  }

  _updateCamera(dt) {
    const sinYaw = Math.sin(this.cameraYaw);
    const cosYaw = Math.cos(this.cameraYaw);
    const cosPitch = Math.cos(this.cameraPitch);
    const lookDir = this._camLookDir.set(
      -sinYaw * cosPitch,
      Math.sin(this.cameraPitch),
      -cosYaw * cosPitch
    );

    if (this.cameraMode === 'mastcam') {
      // Visão em 1ª pessoa no mastro da Mastcam do Rover
      const mastOffsetLocal = new THREE.Vector3(0.45, 2.45, -1.15);
      mastOffsetLocal.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);

      const eyePos = this.pos.clone().add(mastOffsetLocal);
      this.camera.position.copy(eyePos);

      const lookDist = 12.0;
      this._camLookAt.copy(eyePos).addScaledVector(lookDir, lookDist);
      this.camera.lookAt(this._camLookAt);
    } else {
      // Visão em 3ª pessoa tática atrás e acima do rover
      const distBehind = 5.2;
      this._camLookAt.set(this.pos.x, this.pos.y + 1.0, this.pos.z);
      this._camTargetPos.copy(this._camLookAt).addScaledVector(lookDir, -distBehind);

      // Suaviza a posição da câmera
      this.camera.position.lerp(this._camTargetPos, Math.min(1.0, dt * 12));
      this.camera.lookAt(this._camLookAt);
    }
  }
}
