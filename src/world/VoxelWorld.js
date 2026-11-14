import * as THREE from 'three';
import { BLOCK_IDS } from '../config/blockTypes.js';
import { BLOCK_INTERACTION_CONFIG, WORLD_CONFIG } from '../config/constants.js';
import { generateMartianTerrain } from './terrainGenerator.js';
import { buildNasaSpaceshipAndBase } from './nasaSpaceshipBuilder.js';
import { raycastVoxel } from './voxelRaycaster.js';
import { makeCanvasTexture } from '../graphics/textureGenerator.js';

const CHUNK_SIZE = 16;

// Cada face: normal, vizinho a checar e 4 cantos em ordem anti-horaria vista de fora
// (inferior-esquerdo, inferior-direito, superior-direito, superior-esquerdo).
const FACES = [
  { dir: [1, 0, 0], corners: [[1, 0, 1], [1, 0, 0], [1, 1, 0], [1, 1, 1]] },
  { dir: [-1, 0, 0], corners: [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]] },
  { dir: [0, 1, 0], corners: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]] },
  { dir: [0, -1, 0], corners: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]] },
  { dir: [0, 0, 1], corners: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]] },
  { dir: [0, 0, -1], corners: [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]] },
];

class FaceBuffer {
  constructor() {
    this.positions = [];
    this.normals = [];
    this.uvs = [];
    this.indices = [];
  }

  addFace(x, y, z, face, rect) {
    const base = this.positions.length / 3;
    const [nx, ny, nz] = face.dir;
    const c = face.corners;
    for (let i = 0; i < 4; i++) {
      this.positions.push(x + c[i][0], y + c[i][1], z + c[i][2]);
      this.normals.push(nx, ny, nz);
    }
    this.uvs.push(rect.u0, rect.v0, rect.u1, rect.v0, rect.u1, rect.v1, rect.u0, rect.v1);
    this.indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }

  toGeometry() {
    if (this.indices.length === 0) return null;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(this.positions, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(this.normals, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(this.uvs, 2));
    geo.setIndex(this.indices);
    geo.computeBoundingSphere();
    return geo;
  }
}

const FULL_UV = { u0: 0, u1: 1, v0: 0, v1: 1 };

export class VoxelWorld {
  constructor(scene, materials, atlas) {
    this.scene = scene;
    this.materials = materials;
    this.atlas = atlas;

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


    this.chunksX = Math.ceil(this.sizeX / CHUNK_SIZE);
    this.chunksZ = Math.ceil(this.sizeZ / CHUNK_SIZE);
    this.chunks = [];
    for (let cz = 0; cz < this.chunksZ; cz++) {
      for (let cx = 0; cx < this.chunksX; cx++) {
        this.chunks.push({ cx, cz, opaqueMesh: null, glassMesh: null });
      }
    }
    this.dirtyChunks = new Set();

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

  // Igual a getBlock, mas trata o lado de fora do mundo (bordas e fundo) como solido,
  // para nao gerar faces que ninguem consegue ver. Acima do teto continua sendo ar.
  _getBlockForMeshing(ix, iy, iz) {
    if (iy >= this.sizeY) return BLOCK_IDS.AIR;
    if (ix < 0 || ix >= this.sizeX || iy < 0 || iz < 0 || iz >= this.sizeZ) {
      return BLOCK_IDS.BASALT;
    }
    return this.data[iy * this.sizeX * this.sizeZ + iz * this.sizeX + ix];
  }

  setBlock(x, y, z, id, rebuild = false) {
    const idx = this._index(x, y, z);
    if (idx === -1) return false;
    this.data[idx] = id;
    if (rebuild) {
      this._markDirtyAround(Math.floor(x) + this.halfX, Math.floor(z) + this.halfZ);
      this._rebuildDirtyChunks();
    }
    return true;
  }

  breakBlock(x, y, z) {
    const blockId = this.getBlock(x, y, z);
    if (blockId === BLOCK_IDS.AIR) return BLOCK_IDS.AIR;

    this.clearBreakCracks();
    // Reconstroi so o chunk do bloco (e o vizinho, se estiver na borda)
    this.setBlock(x, y, z, BLOCK_IDS.AIR, true);
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
    this.breakOverlay.scale.set(1, 1, 1);
    this.breakOverlay.material = this.breakMaterials[stage];
    this.breakOverlay.visible = true;
  }

  updateCropBreakCracks(plant, progress) {
    const stage = Math.max(1, Math.min(9, Math.ceil(progress * 9)));
    const bounds = new THREE.Box3().setFromObject(plant);
    bounds.getCenter(this.breakOverlay.position);
    bounds.getSize(this.breakOverlay.scale);
    this.breakOverlay.scale.multiplyScalar(1.012);
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

  // Marca o chunk do bloco e, se ele estiver na borda, o chunk vizinho (a face dele muda)
  _markDirtyAround(ix, iz) {
    const cx = Math.floor(ix / CHUNK_SIZE);
    const cz = Math.floor(iz / CHUNK_SIZE);
    const lx = ix - cx * CHUNK_SIZE;
    const lz = iz - cz * CHUNK_SIZE;
    this._markDirty(cx, cz);
    if (lx === 0) this._markDirty(cx - 1, cz);
    if (lx === CHUNK_SIZE - 1) this._markDirty(cx + 1, cz);
    if (lz === 0) this._markDirty(cx, cz - 1);
    if (lz === CHUNK_SIZE - 1) this._markDirty(cx, cz + 1);
  }

  _markDirty(cx, cz) {
    if (cx < 0 || cx >= this.chunksX || cz < 0 || cz >= this.chunksZ) return;
    this.dirtyChunks.add(cz * this.chunksX + cx);
  }

  _rebuildDirtyChunks() {
    for (const chunkIdx of this.dirtyChunks) {
      this._rebuildChunk(this.chunks[chunkIdx]);
    }
    this.dirtyChunks.clear();
  }

  rebuildMeshes() {
    for (const chunk of this.chunks) {
      this._rebuildChunk(chunk);
    }
    this.dirtyChunks.clear();
  }

  _rebuildChunk(chunk) {
    const GLASS = BLOCK_IDS.HAB_GLASS;
    const AIR = BLOCK_IDS.AIR;
    const { uvRects } = this.atlas;
    const opaque = new FaceBuffer();
    const glass = new FaceBuffer();

    const x0 = chunk.cx * CHUNK_SIZE;
    const z0 = chunk.cz * CHUNK_SIZE;
    const x1 = Math.min(x0 + CHUNK_SIZE, this.sizeX);
    const z1 = Math.min(z0 + CHUNK_SIZE, this.sizeZ);

    for (let iy = 0; iy < this.sizeY; iy++) {
      for (let iz = z0; iz < z1; iz++) {
        for (let ix = x0; ix < x1; ix++) {
          const id = this.data[iy * this.sizeX * this.sizeZ + iz * this.sizeX + ix];
          if (id === AIR) continue;

          const isGlass = id === GLASS;
          const rect = isGlass ? FULL_UV : uvRects[id];
          if (!rect) continue;
          const target = isGlass ? glass : opaque;
          const wx = ix - this.halfX;
          const wz = iz - this.halfZ;

          for (const face of FACES) {
            const nb = this._getBlockForMeshing(ix + face.dir[0], iy + face.dir[1], iz + face.dir[2]);
            // Bloco opaco aparece atras de ar ou vidro; vidro so aparece contra o ar
            const visible = isGlass ? nb === AIR : nb === AIR || nb === GLASS;
            if (visible) target.addFace(wx, iy, wz, face, rect);
          }
        }
      }
    }

    chunk.opaqueMesh = this._swapChunkMesh(chunk.opaqueMesh, opaque.toGeometry(), this.atlas.material);
    chunk.glassMesh = this._swapChunkMesh(chunk.glassMesh, glass.toGeometry(), this.materials[GLASS]);
  }

  _swapChunkMesh(mesh, geometry, material) {
    if (mesh) {
      mesh.geometry.dispose();
      if (!geometry) {
        this.worldGroup.remove(mesh);
        return null;
      }
      mesh.geometry = geometry;
      return mesh;
    }
    if (!geometry) return null;
    const created = new THREE.Mesh(geometry, material);
    created.matrixAutoUpdate = false;
    this.worldGroup.add(created);
    return created;
  }

  raycast(origin, direction, maxDist) {
    return raycastVoxel(this, origin, direction, maxDist);
  }
}
