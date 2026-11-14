import * as THREE from 'three';
import { BLOCK_IDS } from '../config/blockTypes.js';
import { WORLD_CONFIG } from '../config/constants.js';
import { generateMartianTerrain } from './terrainGenerator.js';
import { buildNasaSpaceshipAndBase } from './nasaSpaceshipBuilder.js';
import { raycastVoxel } from './voxelRaycaster.js';

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
