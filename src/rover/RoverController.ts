// @ts-nocheck
import * as THREE from 'three';
import { ROVER_CONFIG, WORLD_CONFIG, WATER_SYSTEM_CONFIG } from '../config/constants.ts';
import { HABITAT_LAYOUT } from '../world/habitatLayout.ts';

export class RoverController {
  // `basePower` = bateria da base ({ drain(amount) -> quanto saiu }): e ela que paga a carga do rover
  constructor({ roverGroup, wheels = [], world, camera, colliders = [], basePower = null }) {
    this.roverGroup = roverGroup;
    this.basePower = basePower;
    this.wheels = wheels;
    this.world = world;
    this.camera = camera;
    this.colliders = colliders;

    this.isActive = false;

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

    this.battery = ROVER_CONFIG.START_BATTERY;
    this.isCharging = false;
    this.distanceTraveled = 0;

    // Carga de Gelo e Perfuração Robótica ISRU (extração térmica de água)
    this.iceCargo = 0;
    this.maxIceCargo = WATER_SYSTEM_CONFIG.ICE_CARGO_MAX;
    this.visualWaterCargo = 0;
    this.drillCooldown = 0;
    this.unloadCooldown = 0;
    this.armDeploy = 0;
    this.drillStage = 'idle';
    this._animTime = 0;

    // Cache de vetores para evitar alocações constantes no loop
    this._forward = new THREE.Vector3();
    this._camTargetPos = new THREE.Vector3();
    this._camLookAt = new THREE.Vector3();
    this._camLookDir = new THREE.Vector3();
    this._wheelBase = 2.7; // distância entre eixos dianteiro e traseiro
    this._trackWidth = 2.4; // largura entre rodas

    if (this.roverGroup) {
      this._buildWaterExtractorRig();
    }
  }

  _buildWaterExtractorRig() {
    if (this.roverGroup.userData.waterExtractor) {
      this.rig = this.roverGroup.userData.waterExtractor;
      return;
    }

    const addPart = (parent, w, h, d, mat, x, y, z, rx = 0, ry = 0, rz = 0) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      m.position.set(x, y, z);
      if (rx || ry || rz) m.rotation.set(rx, ry, rz);
      parent.add(m);
      return m;
    };

    const mats = {
      armGray: new THREE.MeshLambertMaterial({ color: 0xcbd5e1 }),
      darkMetal: new THREE.MeshLambertMaterial({ color: 0x334155 }),
      charcoal: new THREE.MeshLambertMaterial({ color: 0x1e293b }),
      augerSteel: new THREE.MeshLambertMaterial({ color: 0xe2e8f0 }),
      heaterMat: new THREE.MeshLambertMaterial({
        color: 0xf59e0b,
        emissive: 0xd97706,
        emissiveIntensity: 0.15,
      }),
      bellGlass: new THREE.MeshLambertMaterial({
        color: 0x7dd3fc,
        transparent: true,
        opacity: 0.45,
      }),
      waterCrest: new THREE.MeshLambertMaterial({
        color: 0x38bdf8,
        emissive: 0x0ea5e9,
        emissiveIntensity: 0.5,
      }),
      iceCrystal: new THREE.MeshLambertMaterial({
        color: 0xb8ecff,
        emissive: 0x38bdf8,
        emissiveIntensity: 0.4,
      }),
    };

    // 1. Braço robótico articulado frontal (baseado no sistema ISRU RedWater da NASA/Honeybee Robotics)
    const armPivot = new THREE.Group();
    armPivot.position.set(-0.45, 0.92, -1.32);
    armPivot.rotation.x = 0.22; // recolhido durante a condução
    this.roverGroup.add(armPivot);

    // Junta do ombro + lança articulada + tubulação térmica aquecida
    addPart(armPivot, 0.26, 0.24, 0.26, mats.darkMetal, 0, 0, 0);
    addPart(armPivot, 0.16, 0.16, 0.92, mats.armGray, 0, 0, -0.46);
    addPart(armPivot, 0.07, 0.07, 0.92, mats.darkMetal, 0.09, 0.08, -0.46);

    // 2. Carro vertical de perfuração e extração térmica na ponta do braço
    const drillCarriage = new THREE.Group();
    drillCarriage.position.set(0, 0, -0.92);
    drillCarriage.rotation.x = -0.22; // mantém a broca apontando verticalmente para o gelo
    armPivot.add(drillCarriage);

    // Cabeçote motorizado percussivo-rotativo
    addPart(drillCarriage, 0.3, 0.28, 0.3, mats.darkMetal, 0, 0.08, 0);
    addPart(drillCarriage, 0.12, 0.42, 0.12, mats.armGray, 0, -0.14, 0);

    // Campânula térmica selada (evita que a água sublime para a atmosfera rarefeita de Marte)
    const thermalBell = new THREE.Group();
    thermalBell.position.set(0, -0.26, 0);
    drillCarriage.add(thermalBell);
    addPart(thermalBell, 0.36, 0.08, 0.36, mats.darkMetal, 0, 0.08, 0);
    addPart(thermalBell, 0.34, 0.18, 0.34, mats.bellGlass, 0, -0.02, 0);
    const heaterRing = addPart(thermalBell, 0.38, 0.06, 0.38, mats.heaterMat, 0, -0.1, 0);

    // Broca helicoidal (auger) que gira e perfura o depósito de gelo
    const drillBit = new THREE.Group();
    drillBit.position.set(0, -0.16, 0);
    drillCarriage.add(drillBit);
    addPart(drillBit, 0.1, 0.44, 0.1, mats.augerSteel, 0, -0.18, 0);
    addPart(drillBit, 0.2, 0.05, 0.06, mats.darkMetal, 0, -0.12, 0, 0, 0.4, 0);
    addPart(drillBit, 0.06, 0.05, 0.2, mats.darkMetal, 0, -0.22, 0, 0, 0.4, 0);
    addPart(drillBit, 0.2, 0.05, 0.06, mats.darkMetal, 0, -0.32, 0, 0, 0.4, 0);
    addPart(drillBit, 0.08, 0.1, 0.08, mats.charcoal, 0, -0.42, 0);

    // 5. Partículas 3D de fragmentos de gelo na broca + jato de descarga na base
    const iceCuttings = [];
    for (let i = 0; i < 8; i++) {
      const p = addPart(this.roverGroup, 0.08, 0.08, 0.08, mats.iceCrystal, -0.45, 0.15, -2.2);
      p.visible = false;
      iceCuttings.push(p);
    }

    const unloadDrops = [];
    for (let i = 0; i < 6; i++) {
      const d = addPart(this.roverGroup, 0.12, 0.12, 0.12, mats.waterCrest, -0.36, 1.6, 0.9);
      d.visible = false;
      unloadDrops.push(d);
    }

    this.rig = {
      mats,
      armPivot,
      drillCarriage,
      thermalBell,
      heaterRing,
      drillBit,
      iceCuttings,
      unloadDrops,
    };
    this.roverGroup.userData.waterExtractor = this.rig;
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
    // 1. Não subir em degraus mais altos que a capacidade do rover (paredes da base, rochas verticais)
    const targetHeight = this.getTerrainHeight(nextX, nextZ);
    if (targetHeight - currentY > ROVER_CONFIG.MAX_STEP_HEIGHT) {
      return true;
    }

    // 2. Área construída da base principal para evitar atravessar paredes do habitat
    if (
      nextX >= -9.0 &&
      nextX <= 9.0 &&
      nextZ >= -7.0 &&
      nextZ <= 10.2 &&
      targetHeight >= WORLD_CONFIG.GROUND_LEVEL + 2
    ) {
      return true;
    }

    // Área da Redoma de Estufa (o vidro não conta como parede na checagem de altura)
    const distToDome = Math.hypot(nextX - (HABITAT_LAYOUT.DOME_X + 0.5), nextZ - (HABITAT_LAYOUT.DOME_Z + 0.5));
    if (distToDome < HABITAT_LAYOUT.DOME_RADIUS + 1.2) {
      return true;
    }

    // Use the same static construction colliders as the astronaut. The rover has
    // a wider footprint, so expand each AABB by its half-width on the ground.
    const roverRadius = 1.15;
    for (const collider of this.colliders) {
      if (collider.roverNoCollide) continue;

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

  _distanceToDepot() {
    return Math.hypot(
      this.pos.x - WATER_SYSTEM_CONFIG.ICE_DEPOT_POS.x,
      this.pos.z - WATER_SYSTEM_CONFIG.ICE_DEPOT_POS.z
    );
  }

  canUnloadIce() {
    return this._distanceToDepot() <= 5.8 && this.iceCargo > 0;
  }

  // Bateria baixa: o rover anda devagar e nao perfura ate carregar no deposito da base
  get isBatteryLow() {
    return this.battery < ROVER_CONFIG.LOW_BATTERY;
  }

  isAtChargingDepot() {
    return this._distanceToDepot() <= ROVER_CONFIG.CHARGE_RADIUS;
  }

  // Carrega parado no deposito, e cada 1 % do rover sai da bateria da base. Sem bateria da
  // base (ou com ela vazia) nao ha carga: o rover nao tem mais recarga de graca.
  _charge(dt, throttle) {
    this.isCharging = false;
    if (throttle !== 0 || !this.basePower || this.battery >= 100 || !this.isAtChargingDepot()) return;
    const wanted = Math.min(100 - this.battery, ROVER_CONFIG.CHARGE_PER_SECOND * dt);
    const paid = this.basePower.drain(wanted * ROVER_CONFIG.BASE_COST_PER_ROVER_PERCENT);
    if (paid <= 0) return;
    this.battery = Math.min(100, this.battery + paid / ROVER_CONFIG.BASE_COST_PER_ROVER_PERCENT);
    this.isCharging = true;
  }

  collectIce() {
    if (!this.canCollectIce()) {
      return { success: false, reason: 'No water ice nearby. Navigate to Northeast Ice Crater!' };
    }
    if (this.iceCargo >= this.maxIceCargo) {
      return { success: false, reason: `Ice hold is full (${this.maxIceCargo}kg). Offload at Habitat Bay!` };
    }
    if (this.isBatteryLow) {
      return { success: false, reason: 'Rover battery too low to drill. Park at the base depot to charge.' };
    }

    const prevCargo = this.iceCargo;
    const amount = Math.min(WATER_SYSTEM_CONFIG.ICE_PER_DRILL, this.maxIceCargo - this.iceCargo);
    if (this.drillCooldown <= 0) {
      this.visualWaterCargo = prevCargo;
    }
    this.iceCargo += amount;
    this.drillCooldown = 1.65;
    this.unloadCooldown = 0;
    this.drillStage = this.armDeploy > 0.65 ? 'extract' : 'deploy';
    this.battery = Math.max(0, this.battery - ROVER_CONFIG.DRILL_DRAIN);

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
    this.visualWaterCargo = Math.max(this.visualWaterCargo, offloaded);
    this.iceCargo = 0;
    this.drillCooldown = 0;
    this.unloadCooldown = 1.2;
    this.drillStage = 'unload';
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

    const targetRatio = this.maxIceCargo > 0 ? this.iceCargo / this.maxIceCargo : 0;
    const isAnimating = this.drillCooldown > 0 || this.unloadCooldown > 0;
    const waterFillRatio = isAnimating && this.maxIceCargo > 0
      ? THREE.MathUtils.clamp(this.visualWaterCargo / this.maxIceCargo, 0, 1)
      : targetRatio;

    return {
      speedKmh: Math.abs(this.speed * 3.6).toFixed(1),
      speedMs: Math.abs(this.speed).toFixed(1),
      headingDeg: Math.round(headingDeg),
      headingCard: cardinals[cardIdx],
      x: this.pos.x.toFixed(1),
      y: (this.pos.y - 0.5).toFixed(1),
      z: this.pos.z.toFixed(1),
      battery: Math.max(0, Math.min(100, Math.round(this.battery))),
      lowBattery: this.isBatteryLow,
      isCharging: this.isCharging,
      distanceTraveled: Math.round(this.distanceTraveled),
      iceCargo: this.iceCargo,
      maxIceCargo: this.maxIceCargo,
      waterFillRatio,
      targetFillRatio: targetRatio,
      canCollectIce: this.canCollectIce(),
      canUnloadIce: this.canUnloadIce(),
      isDrilling: this.drillCooldown > 0,
      isUnloading: this.unloadCooldown > 0,
      drillStage: this.drillStage,
    };
  }

  _updateWaterExtractionAnimation(dt) {
    this._animTime += dt;
    const rig = this.rig;

    if (this.drillCooldown > 0) {
      if (this.drillCooldown > 0.34) {
        this.armDeploy = Math.min(1, this.armDeploy + dt * 4.5);
        this.drillStage = this.armDeploy < 0.7 ? 'deploy' : 'extract';
      } else {
        this.armDeploy = Math.max(0, this.armDeploy - dt * 3.4);
        this.drillStage = 'retract';
      }
      if (this.armDeploy >= 0.45) {
        const rate = Math.max(8, (this.iceCargo - this.visualWaterCargo) / Math.max(0.22, this.drillCooldown - 0.25));
        this.visualWaterCargo = Math.min(this.iceCargo, this.visualWaterCargo + rate * dt);
      }
    } else if (this.unloadCooldown > 0) {
      this.armDeploy = Math.max(0, this.armDeploy - dt * 4.0);
      this.drillStage = 'unload';
      const drainRate = Math.max(15, this.maxIceCargo / 0.95);
      this.visualWaterCargo = Math.max(0, this.visualWaterCargo - drainRate * dt);
    } else {
      this.armDeploy = Math.max(0, this.armDeploy - dt * 4.0);
      this.drillStage = 'idle';
      this.visualWaterCargo += (this.iceCargo - this.visualWaterCargo) * Math.min(1, dt * 10);
    }

    if (!rig) return;

    // 1. Articulação do braço robótico e carro vertical da broca
    const armAngle = THREE.MathUtils.lerp(0.22, -0.34, this.armDeploy);
    rig.armPivot.rotation.x = armAngle;
    rig.drillCarriage.rotation.x = -armAngle;
    rig.drillCarriage.position.y = -0.2 * this.armDeploy;

    const isExtracting = this.drillCooldown > 0.28 && this.armDeploy > 0.55;

    // 2. Rotação da broca helicoidal (auger) + percussão no gelo + anel térmico aquecendo
    if (isExtracting) {
      rig.drillBit.rotation.y += dt * 32;
      rig.drillBit.position.y = -0.16 + Math.sin(this._animTime * 58) * 0.026;
      rig.mats.heaterMat.emissiveIntensity = 0.72 + Math.sin(this._animTime * 20) * 0.25;
      rig.mats.bellGlass.opacity = 0.68 + Math.sin(this._animTime * 16) * 0.14;
    } else {
      rig.drillBit.position.y = -0.16;
      rig.mats.heaterMat.emissiveIntensity = 0.15;
      rig.mats.bellGlass.opacity = 0.45;
    }

    // 3. Fragmentos de gelo saltando ao redor da broca durante a perfuração
    for (let i = 0; i < rig.iceCuttings.length; i++) {
      const p = rig.iceCuttings[i];
      if (!isExtracting) {
        p.visible = false;
        continue;
      }
      p.visible = true;
      const cycle = (this._animTime * 3.4 + i * 0.125) % 1;
      const angle = i * ((Math.PI * 2) / rig.iceCuttings.length) + this._animTime * 2.2;
      const radius = 0.14 + cycle * 0.34;
      const height = Math.sin(cycle * Math.PI) * 0.36;
      p.position.set(
        -0.45 + Math.cos(angle) * radius,
        0.06 + height,
        -2.2 + Math.sin(angle) * radius
      );
      p.rotation.set(cycle * 6, angle, cycle * 4);
    }

    // Partículas de descarga no depósito da base.
    const isUnloading = this.unloadCooldown > 0;
    for (let i = 0; i < rig.unloadDrops.length; i++) {
      const d = rig.unloadDrops[i];
      if (!isUnloading) {
        d.visible = false;
        continue;
      }
      d.visible = true;
      const t = (this._animTime * 2.8 + i / rig.unloadDrops.length) % 1;
      d.position.set(
        -0.36 + t * 0.36,
        1.68 + Math.sin(t * Math.PI) * 0.28 - t * 0.65,
        0.75 + t * 1.15
      );
    }
  }

  update(dt, keys = {}) {
    if (!this.roverGroup) return;

    if (this.drillCooldown > 0) {
      this.drillCooldown = Math.max(0, this.drillCooldown - dt);
    }
    if (this.unloadCooldown > 0) {
      this.unloadCooldown = Math.max(0, this.unloadCooldown - dt);
    }

    this._updateWaterExtractionAnimation(dt);

    let throttle = 0;
    if (this.isActive) {
      if (keys['KeyW'] || keys['ArrowUp']) throttle += 1;
      if (keys['KeyS'] || keys['ArrowDown']) throttle -= 1;

      let steer = 0;
      if (keys['KeyA'] || keys['ArrowLeft']) steer += 1;
      if (keys['KeyD'] || keys['ArrowRight']) steer -= 1;

      // Dirigir gasta a bateria; com ela baixa o rover so se arrasta (mas nunca para de vez)
      const speedFactor = this.isBatteryLow ? ROVER_CONFIG.LOW_BATTERY_SPEED_FACTOR : 1;
      if (throttle !== 0) {
        this.battery = Math.max(0, this.battery - ROVER_CONFIG.DRIVE_DRAIN_PER_SECOND * dt);
      }

      // Acceleration and braking are kept separate so direction changes feel deliberate.
      if (throttle > 0) {
        const rate = this.speed < 0 ? this.brakeDeceleration : this.acceleration;
        this.speed = Math.min(this.maxForwardSpeed * speedFactor, this.speed + rate * dt);
      } else if (throttle < 0) {
        const rate = this.speed > 0 ? this.brakeDeceleration : this.acceleration;
        this.speed = Math.max(-this.maxReverseSpeed * speedFactor, this.speed - rate * dt);
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

    // Parado no deposito da base (dirigido ou estacionado), o rover carrega da bateria da base
    this._charge(dt, throttle);

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

    // Aplica transformações no modelo 3D do rover (com vibração mecânica real durante a perfuração)
    const drillShake = this.drillCooldown > 0.28 && this.armDeploy > 0.55
      ? Math.sin(this._animTime * 52) * 0.012
      : 0;
    this.roverGroup.position.set(this.pos.x, this.pos.y + drillShake, this.pos.z);
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
    // Durante a perfuração, desloca levemente o enquadramento para mostrar o braço extrator
    const viewYaw = this.cameraYaw + this.armDeploy * 0.42;
    const viewPitch = THREE.MathUtils.clamp(this.cameraPitch - this.armDeploy * 0.06, -1.15, 1.15);
    const sinYaw = Math.sin(viewYaw);
    const cosYaw = Math.cos(viewYaw);
    const cosPitch = Math.cos(viewPitch);
    const lookDir = this._camLookDir.set(
      -sinYaw * cosPitch,
      Math.sin(viewPitch),
      -cosYaw * cosPitch
    );

    // Third-person chase camera stays behind and above the rover.
    const distBehind = 5.2 - this.armDeploy * 0.7;
    this._camLookAt.set(this.pos.x, this.pos.y + 1.0, this.pos.z);
    this._camTargetPos.copy(this._camLookAt).addScaledVector(lookDir, -distBehind);

    // Smooth the camera position to avoid abrupt movement over rough terrain.
    this.camera.position.lerp(this._camTargetPos, Math.min(1.0, dt * 12));
    this.camera.lookAt(this._camLookAt);
  }
}
