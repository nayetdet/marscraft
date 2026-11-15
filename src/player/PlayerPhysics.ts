// @ts-nocheck
import * as THREE from 'three';
import { BLOCK_IDS } from '../config/blockTypes.ts';
import { CREW_CONFIG, PHYSICS_CONFIG } from '../config/constants.ts';

const _lookEuler = new THREE.Euler(0, 0, 0, 'YXZ');

export class PlayerPhysics {
  constructor(world, customColliders = []) {
    this.world = world;
    this.customColliders = customColliders;
    this.crewAvatars = [];

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
    this.justLandedFromJump = false;
    this._jumpInProgress = false;
    this.isMoving = false;

    this._forward = new THREE.Vector3();
    this._right = new THREE.Vector3();
    this._moveDir = new THREE.Vector3();
    this._nextPos = new THREE.Vector3();
  }

  resetToShipRamp() {
    this.height = PHYSICS_CONFIG.PLAYER_HEIGHT;
    this.pos.set(
      PHYSICS_CONFIG.SPAWN_POS.x,
      PHYSICS_CONFIG.SPAWN_POS.y,
      PHYSICS_CONFIG.SPAWN_POS.z
    );
    this.vel.set(0, 0, 0);
    this.justLandedFromJump = false;
    this._jumpInProgress = false;
    this.yaw = PHYSICS_CONFIG.SPAWN_YAW;
    this.pitch = PHYSICS_CONFIG.SPAWN_PITCH;
  }

  stopJumpMomentum() {
    this.vel.y = 0;
    this._jumpInProgress = false;
  }

  getLookDirection(target = new THREE.Vector3()) {
    _lookEuler.set(this.pitch, this.yaw, 0, 'YXZ');
    return target.set(0, 0, -1).applyEuler(_lookEuler);
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
    if (this._hitsCustomCollider(pos)) {
      return true;
    }

    const minX = Math.floor(pos.x - this.radius);
    const maxX = Math.floor(pos.x + this.radius);
    const minY = Math.floor(pos.y - this.height);
    // pos.y is the eye position; include the space above it for head collisions.
    const maxY = Math.floor(pos.y + 0.1);
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

  _hitsCrew(pos) {
    for (const avatar of this.crewAvatars) {
      if (!avatar.group.visible) continue;
      const crew = avatar.position;
      if (pos.y - this.height >= crew.y + PHYSICS_CONFIG.PLAYER_HEIGHT || pos.y + 0.1 <= crew.y) continue;
      const dx = pos.x - crew.x;
      const dz = pos.z - crew.z;
      const distanceSq = dx * dx + dz * dz;
      const oldDx = this.pos.x - crew.x;
      const oldDz = this.pos.z - crew.z;
      // Allow a player already overlapping a moving crew member to move away.
      if (distanceSq < CREW_CONFIG.COLLISION_DISTANCE ** 2 && distanceSq < oldDx * oldDx + oldDz * oldDz) return true;
    }
    return false;
  }

  update(dt, keys, preserveHorizontalVelocity = false) {
    this.justLandedFromJump = false;
    const forward = this._forward.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = this._right.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw));

    const moveDir = this._moveDir.set(0, 0, 0);
    if (keys['KeyW'] || keys['ArrowUp']) moveDir.add(forward);
    if (keys['KeyS'] || keys['ArrowDown']) moveDir.sub(forward);
    if (keys['KeyD'] || keys['ArrowRight']) moveDir.add(right);
    if (keys['KeyA'] || keys['ArrowLeft']) moveDir.sub(right);

    const hasMoveInput = moveDir.lengthSq() > 0;
    const hasHorizontalMomentum = preserveHorizontalVelocity && (this.vel.x !== 0 || this.vel.z !== 0);
    this.isMoving = (hasMoveInput || hasHorizontalMomentum) && this.onGround;
    if (hasMoveInput) moveDir.normalize();

    if (!preserveHorizontalVelocity) {
      const sprinting = keys['Sprint'] || keys['ShiftLeft'] || keys['ShiftRight'];
      const speed = sprinting ? PHYSICS_CONFIG.SPRINT_SPEED : PHYSICS_CONFIG.WALK_SPEED;
      this.vel.x = moveDir.x * speed;
      this.vel.z = moveDir.z * speed;
    }

    this.vel.y -= PHYSICS_CONFIG.MARS_GRAVITY * dt;
    if (keys['Space'] && this.onGround) {
      this.vel.y = PHYSICS_CONFIG.JUMP_SPEED;
      this.onGround = false;
      this._jumpInProgress = true;
    }

    const nextPos = this._nextPos.copy(this.pos);

    // X axis
    nextPos.x += this.vel.x * dt;
    if (!this._checkCollision(nextPos) && !this._hitsCrew(nextPos)) {
      this.pos.x = nextPos.x;
    }

    // Z axis
    nextPos.copy(this.pos);
    nextPos.z += this.vel.z * dt;
    if (!this._checkCollision(nextPos) && !this._hitsCrew(nextPos)) {
      this.pos.z = nextPos.z;
    }

    // Eixo Y
    nextPos.copy(this.pos);
    nextPos.y += this.vel.y * dt;
    if (this._checkCollision(nextPos)) {
      if (this.vel.y < 0) {
        this.onGround = true;
        this.justLandedFromJump = this._jumpInProgress;
        this._jumpInProgress = false;
      }
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
