import * as THREE from 'three';
import { BLOCK_IDS } from '../config/blockTypes.js';
import { PHYSICS_CONFIG, WORLD_CONFIG } from '../config/constants.js';

export class PlayerPhysics {
  constructor(world, customColliders = []) {
    this.world = world;
    this.customColliders = customColliders;

    this.pos = new THREE.Vector3(
      PHYSICS_CONFIG.SPAWN_POS.x,
      PHYSICS_CONFIG.SPAWN_POS.y,
      PHYSICS_CONFIG.SPAWN_POS.z
    );
    this.vel = new THREE.Vector3(0, 0, 0);
    this.yaw = PHYSICS_CONFIG.SPAWN_YAW;
    this.pitch = PHYSICS_CONFIG.SPAWN_PITCH;

    this.height = PHYSICS_CONFIG.PLAYER_HEIGHT;
    this.radius = PHYSICS_CONFIG.PLAYER_RADIUS;
    this.onGround = false;
    this.isMoving = false;
  }

  resetToShipRamp() {
    this.pos.set(
      PHYSICS_CONFIG.SPAWN_POS.x,
      PHYSICS_CONFIG.SPAWN_POS.y + 0.5,
      PHYSICS_CONFIG.SPAWN_POS.z - 1.0
    );
    this.vel.set(0, 0, 0);
    this.yaw = PHYSICS_CONFIG.SPAWN_YAW;
    this.pitch = PHYSICS_CONFIG.SPAWN_PITCH;
  }

  getLookDirection() {
    const dir = new THREE.Vector3(0, 0, -1);
    const euler = new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ');
    dir.applyEuler(euler);
    return dir.normalize();
  }

  overlapsBlock(bx, by, bz) {
    const hitsPlayer =
      bx + 1 > this.pos.x - this.radius &&
      bx < this.pos.x + this.radius &&
      by + 1 > this.pos.y - this.height &&
      by < this.pos.y + 0.15 &&
      bz + 1 > this.pos.z - this.radius &&
      bz < this.pos.z + this.radius;

    if (hitsPlayer) return true;

    for (const box of this.customColliders) {
      const overlapsObj =
        bx + 1 > box.minX &&
        bx < box.maxX &&
        by + 1 > box.minY &&
        by < box.maxY &&
        bz + 1 > box.minZ &&
        bz < box.maxZ;
      if (overlapsObj) return true;
    }

    return false;
  }

  _hitsCustomCollider(pos) {
    const pMinX = pos.x - this.radius;
    const pMaxX = pos.x + this.radius;
    const pMinY = pos.y - this.height + 0.05;
    const pMaxY = pos.y + 0.1;
    const pMinZ = pos.z - this.radius;
    const pMaxZ = pos.z + this.radius;

    for (const box of this.customColliders) {
      if (
        pMaxX > box.minX &&
        pMinX < box.maxX &&
        pMaxY > box.minY &&
        pMinY < box.maxY &&
        pMaxZ > box.minZ &&
        pMinZ < box.maxZ
      ) {
        return true;
      }
    }
    return false;
  }

  _checkCollision(pos) {
    const distFromCenter = Math.hypot(pos.x, pos.z);
    if (distFromCenter >= WORLD_CONFIG.CRATER_RADIUS - 2.5) {
      return true;
    }

    if (this._hitsCustomCollider(pos)) {
      return true;
    }

    const minX = Math.floor(pos.x - this.radius);
    const maxX = Math.floor(pos.x + this.radius);
    const minY = Math.floor(pos.y - this.height);
    const maxY = Math.floor(pos.y - 0.1);
    const minZ = Math.floor(pos.z - this.radius);
    const maxZ = Math.floor(pos.z + this.radius);

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        for (let z = minZ; z <= maxZ; z++) {
          if (this.world.getBlock(x, y, z) !== BLOCK_IDS.AIR) {
            return true;
          }
        }
      }
    }
    return false;
  }

  update(dt, keys) {
    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));

    const moveDir = new THREE.Vector3();
    if (keys['KeyW'] || keys['ArrowUp']) moveDir.add(forward);
    if (keys['KeyS'] || keys['ArrowDown']) moveDir.sub(forward);
    if (keys['KeyD'] || keys['ArrowRight']) moveDir.add(right);
    if (keys['KeyA'] || keys['ArrowLeft']) moveDir.sub(right);

    this.isMoving = moveDir.lengthSq() > 0 && this.onGround;
    if (moveDir.lengthSq() > 0) moveDir.normalize();

    const speed = PHYSICS_CONFIG.WALK_SPEED;
    this.vel.x = moveDir.x * speed;
    this.vel.z = moveDir.z * speed;

    this.vel.y -= PHYSICS_CONFIG.MARS_GRAVITY * dt;
    if (keys['Space'] && this.onGround) {
      this.vel.y = PHYSICS_CONFIG.JUMP_SPEED;
      this.onGround = false;
    }

    const nextPos = this.pos.clone();

    // X axis
    nextPos.x += this.vel.x * dt;
    if (!this._checkCollision(nextPos)) {
      this.pos.x = nextPos.x;
    }

    // Z axis
    nextPos.copy(this.pos);
    nextPos.z += this.vel.z * dt;
    if (!this._checkCollision(nextPos)) {
      this.pos.z = nextPos.z;
    }

    // Eixo Y
    nextPos.copy(this.pos);
    nextPos.y += this.vel.y * dt;
    if (this._checkCollision(nextPos)) {
      if (this.vel.y < 0) this.onGround = true;
      this.vel.y = 0;
    } else {
      this.pos.y = nextPos.y;
      this.onGround = false;
    }

    if (this.pos.y < 4) {
      this.resetToShipRamp();
    }
  }
}
