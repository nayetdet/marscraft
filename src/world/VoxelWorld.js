import * as THREE from 'three';
import { BLOCK_IDS } from '../config/blockTypes.js';
import { BLOCK_INTERACTION_CONFIG, WORLD_CONFIG } from '../config/constants.js';
import { generateMartianTerrain } from './terrainGenerator.js';
import { buildNasaSpaceshipAndBase } from './nasaSpaceshipBuilder.js';
import { raycastVoxel } from './voxelRaycaster.js';
import { makeCanvasTexture } from '../graphics/textureGenerator.js';

export class VoxelWorld {
  constructor(scene, materials) {
    this.scene = scene;
    this.materials = materials;

    this.sizeX = WORLD_CONFIG.SIZE_X;
    this.sizeY = WORLD_CONFIG.SIZE_Y;
    this.sizeZ = WORLD_CONFIG.SIZE_Z;
    this.halfX = this.sizeX / 2;
    this.halfZ = this.sizeZ / 2;

    this.data = new Uint8Array(this.sizeX * this.sizeY * this.sizeZ);
    this.worldGroup = new THREE.Group();
    this.scene.add(this.worldGroup);
    this.dropGroup = new THREE.Group();
    this.scene.add(this.dropGroup);
    this.drops = [];
    this.breakParticles = [];
    this.dropGeometry = new THREE.BoxGeometry(
      BLOCK_INTERACTION_CONFIG.DROP_SIZE,
      BLOCK_INTERACTION_CONFIG.DROP_SIZE,
      BLOCK_INTERACTION_CONFIG.DROP_SIZE
    );
    this.particleGeometry = new THREE.BoxGeometry(0.13, 0.13, 0.13);
    this.breakOverlay = this._createBreakOverlay();
    this.scene.add(this.breakOverlay);

    generateMartianTerrain(this);
    buildNasaSpaceshipAndBase(this);
    this.rebuildMeshes();
  }

  _index(x, y, z) {
    const ix = Math.floor(x) + this.halfX;
    const iy = Math.floor(y);
    const iz = Math.floor(z) + this.halfZ;
    if (ix < 0 || ix >= this.sizeX || iy < 0 || iy >= this.sizeY || iz < 0 || iz >= this.sizeZ) {
      return -1;
    }
    return iy * this.sizeX * this.sizeZ + iz * this.sizeX + ix;
  }

  getBlock(x, y, z) {
    const idx = this._index(x, y, z);
    return idx === -1 ? BLOCK_IDS.AIR : this.data[idx];
  }

  setBlock(x, y, z, id, rebuild = false) {
    const idx = this._index(x, y, z);
    if (idx === -1) return false;
    this.data[idx] = id;
    if (rebuild) {
      this.rebuildMeshes();
    }
    return true;
  }

  breakBlock(x, y, z) {
    const blockId = this.getBlock(x, y, z);
    if (blockId === BLOCK_IDS.AIR) return BLOCK_IDS.AIR;

    this.clearBreakCracks();
    this.setBlock(x, y, z, BLOCK_IDS.AIR, false);
    this.rebuildMeshes();
    this._spawnBreakParticles(x, y, z, blockId);
    this._spawnDrop(x, y, z, blockId);
    return blockId;
  }

  _createBreakOverlay() {
    const textures = Array.from({ length: 10 }, (_, stage) => this._createCrackTexture(stage));
    this.breakMaterials = textures.map((texture) => new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    }));
    const overlay = new THREE.Mesh(new THREE.BoxGeometry(1.012, 1.012, 1.012), this.breakMaterials[0]);
    overlay.visible = false;
    overlay.renderOrder = 10;
    return overlay;
  }

  _createCrackTexture(stage) {
    const crackPixels = [
      [8, 0], [8, 1], [7, 2], [8, 2], [7, 3], [6, 4], [7, 4], [6, 5],
      [5, 6], [6, 6], [4, 7], [5, 7], [4, 8], [3, 9], [4, 9], [2, 10],
      [3, 10], [2, 11], [1, 12], [2, 12], [1, 13], [0, 14], [8, 4], [9, 5],
      [10, 5], [10, 6], [11, 7], [12, 7], [12, 8], [13, 9], [14, 9], [14, 10],
      [7, 8], [8, 9], [8, 10], [9, 11], [9, 12], [10, 13], [11, 14], [12, 15],
    ];
    const visiblePixels = Math.ceil((crackPixels.length * stage) / 9);
    return makeCanvasTexture((ctx) => {
      ctx.clearRect(0, 0, 16, 16);
      ctx.fillStyle = 'rgba(20, 13, 10, 0.82)';
      for (let i = 0; i < visiblePixels; i++) {
        const [x, y] = crackPixels[i];
        ctx.fillRect(x, y, 1, 1);
      }
    }).texture;
  }

  updateBreakCracks(x, y, z, progress) {
    const stage = Math.max(1, Math.min(9, Math.ceil(progress * 9)));
    this.breakOverlay.position.set(x + 0.5, y + 0.5, z + 0.5);
    this.breakOverlay.material = this.breakMaterials[stage];
    this.breakOverlay.visible = true;
  }

  clearBreakCracks() {
    this.breakOverlay.visible = false;
  }

  _createEffectMaterial(blockId, opacity = 1) {
    const material = this.materials[blockId].clone();
    material.transparent = opacity < 1;
    material.opacity = opacity;
    material.depthWrite = opacity >= 1;
    return material;
  }

  _spawnBreakParticles(x, y, z, blockId) {
    for (let i = 0; i < BLOCK_INTERACTION_CONFIG.BREAK_PARTICLE_COUNT; i++) {
      const mesh = new THREE.Mesh(this.particleGeometry, this._createEffectMaterial(blockId, 0.9));
      mesh.position.set(x + 0.5, y + 0.5, z + 0.5);
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      this.dropGroup.add(mesh);
      this.breakParticles.push({
        mesh,
        age: 0,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 3.4,
          Math.random() * 2.4 + 0.6,
          (Math.random() - 0.5) * 3.4
        ),
      });
    }
  }

  _spawnDrop(x, y, z, blockId) {
    const mesh = new THREE.Mesh(this.dropGeometry, this._createEffectMaterial(blockId));
    mesh.position.set(x + 0.5, y + 0.65, z + 0.5);
    mesh.rotation.set(Math.random(), Math.random() * Math.PI, 0);
    this.dropGroup.add(mesh);
    this.drops.push({
      blockId,
      mesh,
      velocity: new THREE.Vector3((Math.random() - 0.5) * 1.8, 2.2, (Math.random() - 0.5) * 1.8),
      age: 0,
      grounded: false,
      bobOffset: Math.random() * Math.PI * 2,
      groundY: 0,
    });
  }

  _removeEffect(mesh) {
    this.dropGroup.remove(mesh);
    mesh.material.dispose();
  }

  updateDrops(dt, playerPos) {
    const collected = [];

    for (let i = this.breakParticles.length - 1; i >= 0; i--) {
      const particle = this.breakParticles[i];
      particle.age += dt;
      particle.velocity.y -= BLOCK_INTERACTION_CONFIG.DROP_GRAVITY * dt;
      particle.mesh.position.addScaledVector(particle.velocity, dt);
      particle.mesh.rotation.x += dt * 12;
      particle.mesh.rotation.y += dt * 9;
      particle.mesh.material.opacity = Math.max(0, 1 - particle.age / BLOCK_INTERACTION_CONFIG.BREAK_PARTICLE_LIFETIME);
      if (particle.age >= BLOCK_INTERACTION_CONFIG.BREAK_PARTICLE_LIFETIME) {
        this._removeEffect(particle.mesh);
        this.breakParticles.splice(i, 1);
      }
    }

    for (let i = this.drops.length - 1; i >= 0; i--) {
      const drop = this.drops[i];
      drop.age += dt;
      const { position } = drop.mesh;

      if (!drop.grounded) {
        drop.velocity.y -= BLOCK_INTERACTION_CONFIG.DROP_GRAVITY * dt;
        position.addScaledVector(drop.velocity, dt);
        drop.velocity.x *= 0.9;
        drop.velocity.z *= 0.9;
        const groundBlock = this.getBlock(
          Math.floor(position.x),
          Math.floor(position.y - BLOCK_INTERACTION_CONFIG.DROP_SIZE / 2),
          Math.floor(position.z)
        );
        if (groundBlock !== BLOCK_IDS.AIR && drop.velocity.y <= 0) {
          drop.grounded = true;
          drop.groundY = Math.floor(position.y - BLOCK_INTERACTION_CONFIG.DROP_SIZE / 2) + 1 + BLOCK_INTERACTION_CONFIG.DROP_SIZE / 2;
          position.y = drop.groundY;
          drop.velocity.set(0, 0, 0);
        }
      } else {
        position.y = drop.groundY + Math.sin(drop.age * 4 + drop.bobOffset) * 0.06;
      }

      drop.mesh.rotation.y += dt * 3.8;
      const dx = position.x - playerPos.x;
      const dy = position.y - (playerPos.y - 1.05);
      const dz = position.z - playerPos.z;
      const isClose = dx * dx + dy * dy + dz * dz < BLOCK_INTERACTION_CONFIG.DROP_PICKUP_RADIUS ** 2;
      if (isClose || drop.age >= BLOCK_INTERACTION_CONFIG.DROP_LIFETIME) {
        if (isClose) collected.push(drop.blockId);
        this._removeEffect(drop.mesh);
        this.drops.splice(i, 1);
      }
    }

    return collected;
  }

  _isBlockOccluded(x, y, z) {
    const neighbors = [
      [1, 0, 0],
      [-1, 0, 0],
      [0, 1, 0],
      [0, -1, 0],
      [0, 0, 1],
      [0, 0, -1],
    ];
    for (const [dx, dy, dz] of neighbors) {
      const nb = this.getBlock(x + dx, y + dy, z + dz);
      if (nb === BLOCK_IDS.AIR || nb === BLOCK_IDS.HAB_GLASS) {
        return false;
      }
    }
    return true;
  }

  rebuildMeshes() {
    while (this.worldGroup.children.length > 0) {
      const child = this.worldGroup.children[0];
      child.geometry.dispose();
      this.worldGroup.remove(child);
    }

    const buckets = {};
    for (let x = -this.halfX; x < this.halfX; x++) {
      for (let y = 0; y < this.sizeY; y++) {
        for (let z = -this.halfZ; z < this.halfZ; z++) {
          const id = this.getBlock(x, y, z);
          if (id === BLOCK_IDS.AIR || this._isBlockOccluded(x, y, z)) continue;

          if (!buckets[id]) buckets[id] = [];
          buckets[id].push(x, y, z);
        }
      }
    }

    const boxGeo = new THREE.BoxGeometry(1, 1, 1);
    const dummy = new THREE.Object3D();

    for (const [idStr, coords] of Object.entries(buckets)) {
      const id = Number(idStr);
      const mat = this.materials[id];
      if (!mat) continue;

      const count = coords.length / 3;
      const instMesh = new THREE.InstancedMesh(boxGeo, mat, count);
      for (let i = 0; i < count; i++) {
        dummy.position.set(
          coords[i * 3] + 0.5,
          coords[i * 3 + 1] + 0.5,
          coords[i * 3 + 2] + 0.5
        );
        dummy.updateMatrix();
        instMesh.setMatrixAt(i, dummy.matrix);
      }
      instMesh.instanceMatrix.needsUpdate = true;
      this.worldGroup.add(instMesh);
    }
  }

  raycast(origin, direction, maxDist) {
    return raycastVoxel(this, origin, direction, maxDist);
  }
}
