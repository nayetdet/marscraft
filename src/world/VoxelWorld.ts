// @ts-nocheck
import { createCropItemModel } from '../graphics/cropModels.ts';
import * as THREE from 'three';
import { encodeWorldEdits, restoreWorldEdits } from './worldSave.ts';
import { BLOCK_IDS, CROP_TYPES_BY_ID } from '../config/blockTypes.ts';
import { BLOCK_INTERACTION_CONFIG, WORLD_CONFIG } from '../config/constants.ts';
import { generateMartianTerrain } from './terrainGenerator.ts';
import { buildNasaSpaceshipAndBase } from './nasaSpaceshipBuilder.ts';
import { raycastVoxel } from './voxelRaycaster.ts';
import { makeCanvasTexture } from '../graphics/textureGenerator.ts';
import { OCCLUSION_BRIGHTNESS, naturalTint, vertexOcclusion } from './voxelShading.ts';
import { addVoxelOutcrops, createSurfaceOutcrops, createSurfaceRocks, removeSurfaceRocksSupportedBy } from './surfaceRocks.ts';
import { HABITAT_LAYOUT } from './habitatLayout.ts';

const CHUNK_SIZE = WORLD_CONFIG.MESH_CHUNK_SIZE;

// Cada face: normal, vizinho a checar e 4 cantos em ordem anti-horaria vista de fora
// (inferior-esquerdo, inferior-direito, superior-direito, superior-esquerdo).
// "u" e "v" sao os dois eixos do plano da face (0 = x, 1 = y, 2 = z), usados na oclusao dos cantos.
const FACES = [
  { dir: [1, 0, 0], u: 1, v: 2, corners: [[1, 0, 1], [1, 0, 0], [1, 1, 0], [1, 1, 1]] },
  { dir: [-1, 0, 0], u: 1, v: 2, corners: [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]] },
  { dir: [0, 1, 0], u: 0, v: 2, corners: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]] },
  { dir: [0, -1, 0], u: 0, v: 2, corners: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]] },
  { dir: [0, 0, 1], u: 0, v: 1, corners: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]] },
  { dir: [0, 0, -1], u: 0, v: 1, corners: [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]] },
];

// Buffers reaproveitados pelo montador de chunks (nada e alocado por face)
const UNSHADED = [1, 1, 1, 1];
const _shades = [1, 1, 1, 1];
const _levels = [3, 3, 3, 3];
const _cell = [0, 0, 0];

class FaceBuffer {
  constructor() {
    this.positions = [];
    this.normals = [];
    this.uvs = [];
    this.colors = [];
    this.indices = [];
  }

  // "shades": brilho de cada um dos 4 cantos. "flip" troca a diagonal do quadrado para a
  // sombra de canto nao ficar torta.
  addFace(x, y, z, face, rect, shades = UNSHADED, flip = false) {
    const base = this.positions.length / 3;
    const [nx, ny, nz] = face.dir;
    const c = face.corners;
    for (let i = 0; i < 4; i++) {
      this.positions.push(x + c[i][0], y + c[i][1], z + c[i][2]);
      this.normals.push(nx, ny, nz);
      this.colors.push(shades[i], shades[i], shades[i]);
    }
    this.uvs.push(rect.u0, rect.v0, rect.u1, rect.v0, rect.u1, rect.v1, rect.u0, rect.v1);
    if (flip) this.indices.push(base + 1, base + 2, base + 3, base + 1, base + 3, base);
    else this.indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }

  toGeometry() {
    if (this.indices.length === 0) return null;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(this.positions, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(this.normals, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(this.uvs, 2));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(this.colors, 3));
    geo.setIndex(this.indices);
    geo.computeBoundingSphere();
    return geo;
  }
}

const FULL_UV = { u0: 0, u1: 1, v0: 0, v1: 1 };

export class VoxelWorld {
  constructor(scene, materials, atlas, carrotTexture) {
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
    // Visual-only distant ground prevents the finite terrain from revealing void
    // beyond the crater rim. It has no collision and sits below the playable map.
    this.horizonGround = new THREE.Mesh(
      new THREE.CircleGeometry(1100, 96),
      new THREE.MeshLambertMaterial({ color: 0x9a6040, side: THREE.DoubleSide })
    );
    this.horizonGround.rotation.x = -Math.PI / 2;
    this.horizonGround.position.y = -3;
    this.horizonGround.frustumCulled = false;
    this.scene.add(this.horizonGround);
    this.dropGroup = new THREE.Group();
    this.scene.add(this.dropGroup);
    this.drops = [];
    this.breakParticles = [];
    this.dropGeometry = new THREE.BoxGeometry(
      BLOCK_INTERACTION_CONFIG.DROP_SIZE,
      BLOCK_INTERACTION_CONFIG.DROP_SIZE,
      BLOCK_INTERACTION_CONFIG.DROP_SIZE
    );
    this.carrotGeometry = new THREE.PlaneGeometry(0.5, 0.5);
    this.carrotMaterial = carrotTexture && new THREE.MeshLambertMaterial({ map: carrotTexture, transparent: true, alphaTest: 0.1, side: THREE.DoubleSide });
    this.particleGeometry = new THREE.BoxGeometry(0.13, 0.13, 0.13);
    this.surfaceRockParticleGeometry = new THREE.IcosahedronGeometry(1, 0);
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
    this.baseBlocks = new Set();
    this.brokenBaseBlocks = new Set();

    generateMartianTerrain(this);
    buildNasaSpaceshipAndBase(this);
    // Blocos que o jogador mudou (quebrou ou colocou): so eles vao para o save (worldSave.ts)
    this.editedBlocks = new Set();
    try {
      const saved = JSON.parse(window.localStorage.getItem('marscraft-save-v1') || 'null');
      restoreWorldEdits(this.data, saved, this.editedBlocks);
    } catch { /* Ignore unavailable or malformed saves. */ }
    this.trackEdits = true;
    for (const idx of this.baseBlocks) {
      if (this.data[idx] === BLOCK_IDS.AIR) {
        this.baseBlocks.delete(idx);
        this.brokenBaseBlocks.add(idx);
      }
    }
    addVoxelOutcrops(this);
    this.rebuildMeshes();
    // Pedras decorativas e lajes baixas sobre o terreno natural (sem colisao)
    this.surfaceRocks = createSurfaceRocks(this);
    this.surfaceOutcrops = createSurfaceOutcrops(this);
    this.scene.add(this.surfaceRocks, this.surfaceOutcrops);
  }

  exportSave() { return encodeWorldEdits(this.data, this.editedBlocks); }

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

  _getBlockForMeshing(ix, iy, iz) {
    if (iy >= this.sizeY) return BLOCK_IDS.AIR;
    if (ix < 0 || ix >= this.sizeX || iy < 0 || iz < 0 || iz >= this.sizeZ) return BLOCK_IDS.BASALT;
    return this.data[iy * this.sizeX * this.sizeZ + iz * this.sizeX + ix];
  }

  setBlock(x, y, z, id, rebuild = false) {
    const idx = this._index(x, y, z);
    if (idx === -1) return false;
    this.data[idx] = id;
    if (this.trackEdits) this.editedBlocks.add(idx);
    if (this.recordBaseBlocks) {
      if (id !== BLOCK_IDS.AIR && Math.floor(y) > HABITAT_LAYOUT.FLOOR_Y) this.baseBlocks.add(idx);
      else this.baseBlocks.delete(idx);
    } else if (this.baseBlocks.has(idx)) {
      if (id === BLOCK_IDS.AIR) this.brokenBaseBlocks.add(idx);
      else this.brokenBaseBlocks.delete(idx);
    }
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
    removeSurfaceRocksSupportedBy(this.surfaceRocks, x, y, z, (rock) => this._spawnSurfaceRockBreakParticles(rock));
    removeSurfaceRocksSupportedBy(this.surfaceOutcrops, x, y, z);
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

  _spawnSurfaceRockBreakParticles(rock) {
    for (let i = 0; i < BLOCK_INTERACTION_CONFIG.SURFACE_ROCK_BREAK_PARTICLE_COUNT; i++) {
      const size = rock.size * (
        BLOCK_INTERACTION_CONFIG.SURFACE_ROCK_BREAK_PARTICLE_MIN_SIZE
        + Math.random() * BLOCK_INTERACTION_CONFIG.SURFACE_ROCK_BREAK_PARTICLE_SIZE_VARIANCE
      );
      const mesh = new THREE.Mesh(
        this.surfaceRockParticleGeometry,
        new THREE.MeshLambertMaterial({ color: rock.color, transparent: true, opacity: 0.95, depthWrite: false })
      );
      mesh.position.set(rock.x, rock.y, rock.z);
      mesh.scale.set(size, size * rock.squash, size);
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      this.dropGroup.add(mesh);
      this.breakParticles.push({
        mesh,
        age: 0,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * BLOCK_INTERACTION_CONFIG.SURFACE_ROCK_BREAK_PARTICLE_HORIZONTAL_SPEED,
          Math.random() * BLOCK_INTERACTION_CONFIG.SURFACE_ROCK_BREAK_PARTICLE_UPWARD_SPEED
            + BLOCK_INTERACTION_CONFIG.SURFACE_ROCK_BREAK_PARTICLE_MIN_UPWARD_SPEED,
          (Math.random() - 0.5) * BLOCK_INTERACTION_CONFIG.SURFACE_ROCK_BREAK_PARTICLE_HORIZONTAL_SPEED
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

  spawnCropDrop(position, blockId = BLOCK_IDS.HYDRO_PLANT) {
    const type = CROP_TYPES_BY_ID[blockId];
    const mesh = type ? createCropItemModel(type) : new THREE.Mesh(this.carrotGeometry, this.carrotMaterial.clone());
    if (type) { mesh.scale.setScalar(.65); mesh.userData.sharedCropModel = true; }
    mesh.position.copy(position);
    mesh.position.y += 0.35;
    this.dropGroup.add(mesh);
    this.drops.push({
      blockId, mesh,
      velocity: new THREE.Vector3(0, 1.5, 0), age: 0, grounded: false,
      bobOffset: Math.random() * Math.PI * 2, groundY: 0,
      pickupDelay: BLOCK_INTERACTION_CONFIG.CROP_PICKUP_DELAY,
    });
  }

  spawnPlayerDrop(position, yaw, blockId) {
    if (blockId === BLOCK_IDS.HYDRO_PLANT || CROP_TYPES_BY_ID[blockId]) {
      this.spawnCropDrop(position, blockId);
    } else {
      this._spawnDrop(position.x - 0.5, position.y - 0.65, position.z - 0.5, blockId);
    }
    const drop = this.drops[this.drops.length - 1];
    drop.pickupDelay = BLOCK_INTERACTION_CONFIG.PLAYER_DROP_PICKUP_DELAY;
    drop.waitingForPlayerToLeave = true;
    drop.velocity.set(-Math.sin(yaw) * 3, 1.5, -Math.cos(yaw) * 3);
  }

  _removeEffect(mesh) {
    this.dropGroup.remove(mesh);
    if (!mesh.userData.sharedCropModel) mesh.material.dispose();
  }

  updateDrops(dt, playerPos, collect = () => true) {
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

      const halfSize = (drop.blockId === BLOCK_IDS.HYDRO_PLANT || CROP_TYPES_BY_ID[drop.blockId]) && drop.pickupDelay ? 0.25 : BLOCK_INTERACTION_CONFIG.DROP_SIZE / 2;
      if (!drop.grounded) {
        drop.velocity.y -= BLOCK_INTERACTION_CONFIG.DROP_GRAVITY * dt;
        position.addScaledVector(drop.velocity, dt);
        drop.velocity.x *= 0.9;
        drop.velocity.z *= 0.9;
        const groundBlock = this.getBlock(
          Math.floor(position.x),
          Math.floor(position.y - halfSize),
          Math.floor(position.z)
        );
        if (groundBlock !== BLOCK_IDS.AIR && drop.velocity.y <= 0) {
          drop.grounded = true;
          drop.groundY = Math.floor(position.y - halfSize) + 1 + halfSize;
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
      const pickupDelayPassed = drop.age >= (drop.pickupDelay || 0);
      if (drop.waitingForPlayerToLeave && pickupDelayPassed && !isClose) {
        drop.waitingForPlayerToLeave = false;
      }
      const pickedUp = isClose && pickupDelayPassed && !drop.waitingForPlayerToLeave && collect(drop.blockId);
      if (pickedUp || drop.age >= BLOCK_INTERACTION_CONFIG.DROP_LIFETIME) {
        if (pickedUp) collected.push(drop.blockId);
        this._removeEffect(drop.mesh);
        this.drops.splice(i, 1);
      }
    }

    return collected;
  }

  // Marca o chunk do bloco e, se ele estiver na borda, os chunks vizinhos: a face deles muda,
  // e a sombra de canto alcanca tambem o vizinho na diagonal
  _markDirtyAround(ix, iz) {
    const cx = Math.floor(ix / CHUNK_SIZE);
    const cz = Math.floor(iz / CHUNK_SIZE);
    const lx = ix - cx * CHUNK_SIZE;
    const lz = iz - cz * CHUNK_SIZE;
    const dx = lx === 0 ? -1 : lx === CHUNK_SIZE - 1 ? 1 : 0;
    const dz = lz === 0 ? -1 : lz === CHUNK_SIZE - 1 ? 1 : 0;
    this._markDirty(cx, cz);
    if (dx) this._markDirty(cx + dx, cz);
    if (dz) this._markDirty(cx, cz + dz);
    if (dx && dz) this._markDirty(cx + dx, cz + dz);
  }

  // Bloco que faz sombra de canto: tudo que e opaco (ar e vidro nao)
  _occludes(ix, iy, iz) {
    const id = this._getBlockForMeshing(ix, iy, iz);
    return id !== BLOCK_IDS.AIR && id !== BLOCK_IDS.HAB_GLASS;
  }

  // Preenche _shades (brilho dos 4 cantos da face) e devolve se a diagonal deve ser trocada.
  // Cada canto olha 3 vizinhos na camada a frente da face: os dois lados e a quina.
  _shadeFace(ix, iy, iz, face, tint) {
    _cell[0] = ix + face.dir[0];
    _cell[1] = iy + face.dir[1];
    _cell[2] = iz + face.dir[2];
    const { u, v } = face;
    for (let i = 0; i < 4; i++) {
      const su = face.corners[i][u] ? 1 : -1;
      const sv = face.corners[i][v] ? 1 : -1;
      _cell[u] += su;
      const side1 = this._occludes(_cell[0], _cell[1], _cell[2]);
      _cell[v] += sv;
      const corner = this._occludes(_cell[0], _cell[1], _cell[2]);
      _cell[u] -= su;
      const side2 = this._occludes(_cell[0], _cell[1], _cell[2]);
      _cell[v] -= sv;
      _levels[i] = vertexOcclusion(side1, side2, corner);
      _shades[i] = tint * OCCLUSION_BRIGHTNESS[_levels[i]];
    }
    // A diagonal liga o par de cantos mais claro
    return _levels[0] + _levels[2] < _levels[1] + _levels[3];
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

  // Refaz de uma vez a malha dos chunks de varias colunas mudadas com setBlock(..., false)
  // (cratera do meteoro, issue #107). cells = [[x, z], ...]
  rebuildColumns(cells) {
    for (const [x, z] of cells) this._markDirtyAround(Math.floor(x) + this.halfX, Math.floor(z) + this.halfZ);
    this._rebuildDirtyChunks();
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
          const tint = isGlass ? 1 : naturalTint(id, wx, iy, wz);

          for (const face of FACES) {
            const nb = this._getBlockForMeshing(ix + face.dir[0], iy + face.dir[1], iz + face.dir[2]);
            // Bloco opaco aparece atras de ar ou vidro; vidro so aparece contra o ar
            const visible = isGlass ? nb === AIR : nb === AIR || nb === GLASS;
            if (!visible) continue;
            if (isGlass) {
              target.addFace(wx, iy, wz, face, rect);
            } else {
              const flip = this._shadeFace(ix, iy, iz, face, tint);
              target.addFace(wx, iy, wz, face, rect, _shades, flip);
            }
          }
        }
      }
    }

    chunk.opaqueMesh = this._swapChunkMesh(chunk.opaqueMesh, opaque.toGeometry(), this.atlas.material);
    chunk.glassMesh = this._swapChunkMesh(chunk.glassMesh, glass.toGeometry(), this.materials[GLASS]);
    // Sombra do Sol (modo Shaders): os blocos fazem e recebem sombra; o vidro so recebe, entao
    // a luz entra pelas janelas. Sem uma luz com castShadow, as marcas nao tem efeito.
    if (chunk.opaqueMesh) chunk.opaqueMesh.castShadow = chunk.opaqueMesh.receiveShadow = true;
    if (chunk.glassMesh) chunk.glassMesh.receiveShadow = true;
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
