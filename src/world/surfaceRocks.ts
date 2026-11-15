// @ts-nocheck
// Pedras pequenas espalhadas pelo terreno. E decoracao: a posicao e sorteada por semente fixa,
// nao vem de dado real, e as pedras nao tem colisao. O formato do terreno continua sendo o dado
// real (src/data/marsTerrain.js); por isso nada disto entra na tela "NASA Data".
import * as THREE from 'three';
import { BLOCK_IDS } from '../config/blockTypes.ts';
import { SURVIVAL_CONFIG, TERRAIN_CONFIG } from '../config/constants.ts';
import { createSeededRandom } from '../graphics/textureGenerator.ts';
import { isBuildZone } from './terrainGenerator.ts';

const SEED = 4242;
const CLUSTER_TRIES = 1200;
const MIN_SIZE = 0.14;
const MAX_SIZE = 0.42;
const ROCK_COLORS = [0x8a5a44, 0x7a5240, 0x96664c, 0x6e4c3e];
// Alem da parede de poeira o jogador nao chega e a nevoa esconde tudo: nao vale desenhar pedra la
const MAX_DISTANCE = SURVIVAL_CONFIG.DUST_STORM_FATAL_RADIUS + 10;

const NATURAL_GROUND = new Set([BLOCK_IDS.REGOLITH, BLOCK_IDS.SANDSTONE]);

// Voxel outcrops make the landscape feel rocky at a distance, with irregular silhouettes
// built from the same breakable blocks used elsewhere in the world.
export function addVoxelOutcrops(world) {
  const rand = createSeededRandom(SEED + 1);
  const { x: baseX, z: baseZ } = TERRAIN_CONFIG.BASE_CENTER;
  const occupied = new Set();
  let placed = 0;

  for (let attempt = 0; attempt < 220 && placed < 48; attempt += 1) {
    const angle = rand() * Math.PI * 2;
    const radius = 41 + Math.sqrt(rand()) * 48;
    const cx = Math.round(baseX + Math.cos(angle) * radius);
    const cz = Math.round(baseZ + Math.sin(angle) * radius);
    if (Math.abs(cx) > world.halfX - 5 || Math.abs(cz) > world.halfZ - 5 || isBuildZone(cx, cz)) continue;

    const coreHeight = 2 + Math.floor(rand() * 3);
    const footprint = [];
    for (let dx = -2; dx <= 2; dx += 1) {
      for (let dz = -2; dz <= 2; dz += 1) {
        const distance = Math.abs(dx) + Math.abs(dz);
        if (distance > 3 || rand() < (distance === 0 ? 0.02 : 0.34 + distance * 0.1)) continue;
        footprint.push({ dx, dz, distance });
      }
    }
    if (footprint.length < 4) continue;

    const cells = [];
    let valid = true;
    for (const { dx, dz, distance } of footprint) {
      const x = cx + dx;
      const z = cz + dz;
      const key = `${x},${z}`;
      const top = naturalGroundTop(world, x, z);
      if (occupied.has(key) || isBuildZone(x, z) || top < 0) {
        valid = false;
        break;
      }
      cells.push({ x, z, top, distance, key });
    }
    if (!valid) continue;

    for (const cell of cells) {
      occupied.add(cell.key);
      const height = Math.max(1, coreHeight - Math.floor(cell.distance / 1.5) - (rand() < 0.23 ? 1 : 0));
      for (let dy = 0; dy < height; dy += 1) {
        const variation = rand();
        const id = variation < 0.62 ? BLOCK_IDS.DARK_BASALT
          : variation < 0.94 ? BLOCK_IDS.BASALT
            : BLOCK_IDS.SANDSTONE;
        world.setBlock(cell.x, cell.top + dy, cell.z, id, false);
      }
    }
    placed += 1;
  }
  return placed;
}

// y do topo do bloco solido mais alto da coluna, ou -1 se o topo nao for chao natural
export function naturalGroundTop(world, x, z) {
  for (let y = world.sizeY - 1; y >= 0; y -= 1) {
    const id = world.getBlock(x, y, z);
    if (id === BLOCK_IDS.AIR) continue;
    return NATURAL_GROUND.has(id) ? y + 1 : -1;
  }
  return -1;
}

// Sorteia as pedras: [{ x, y, z, size, squash, yaw, tilt, color }]. Funcao pura (sem Three.js na saida).
export function scatterRocks(world) {
  const rand = createSeededRandom(SEED);
  const rocks = [];
  for (let i = 0; i < CLUSTER_TRIES; i += 1) {
    const cx = (rand() - 0.5) * world.sizeX;
    const cz = (rand() - 0.5) * world.sizeZ;
    // Cada sorteio vira um grupinho de 1 a 3 pedras proximas
    const count = 1 + Math.floor(rand() * 3);
    for (let k = 0; k < count; k += 1) {
      const x = cx + (k === 0 ? 0 : (rand() - 0.5) * 2.4);
      const z = cz + (k === 0 ? 0 : (rand() - 0.5) * 2.4);
      const size = MIN_SIZE + rand() * rand() * (MAX_SIZE - MIN_SIZE);
      const squash = 0.55 + rand() * 0.35;
      const yaw = rand() * Math.PI * 2;
      const tilt = (rand() - 0.5) * 0.6;
      const color = ROCK_COLORS[Math.floor(rand() * ROCK_COLORS.length)];
      if (isBuildZone(x, z)) continue;
      if (Math.hypot(x - TERRAIN_CONFIG.BASE_CENTER.x, z - TERRAIN_CONFIG.BASE_CENTER.z) > MAX_DISTANCE) continue;
      const top = naturalGroundTop(world, Math.floor(x), Math.floor(z));
      if (top < 0) continue;
      // Meio enterrada: o centro fica um pouco acima do chao
      rocks.push({ x, y: top + size * squash * 0.35, z, supportY: top - 1, size, squash, yaw, tilt, color });
    }
  }
  return rocks;
}

export function createSurfaceRocks(world) {
  const rocks = scatterRocks(world);
  // Icosaedro de 20 triangulos: com escala e giro diferentes em cada pedra, le como pedra.
  // (Um octaedro de 8 triangulos sairia mais barato, mas fica com cara de piramide.)
  const geometry = new THREE.IcosahedronGeometry(1, 0);
  const material = new THREE.MeshLambertMaterial({ flatShading: true });
  const mesh = new THREE.InstancedMesh(geometry, material, rocks.length);
  const rocksBySupport = new Map();

  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  rocks.forEach((rock, i) => {
    dummy.position.set(rock.x, rock.y, rock.z);
    dummy.rotation.set(rock.tilt, rock.yaw, rock.tilt * 0.5);
    dummy.scale.set(rock.size, rock.size * rock.squash, rock.size * (0.75 + rock.squash * 0.4));
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    mesh.setColorAt(i, color.setHex(rock.color));

    const supportKey = `${Math.floor(rock.x)},${rock.supportY},${Math.floor(rock.z)}`;
    const supportedRocks = rocksBySupport.get(supportKey) ?? [];
    supportedRocks.push(i);
    rocksBySupport.set(supportKey, supportedRocks);
  });
  mesh.userData.rocksBySupport = rocksBySupport;
  mesh.userData.rocks = rocks;
  mesh.userData.rockTransform = dummy;
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.computeBoundingSphere();
  return mesh;
}

export function removeSurfaceRocksSupportedBy(mesh, x, y, z, onRemove = () => {}) {
  const key = `${Math.floor(x)},${Math.floor(y)},${Math.floor(z)}`;
  const indices = mesh?.userData?.rocksBySupport?.get(key);
  if (!indices) return 0;

  const transform = mesh.userData.rockTransform;
  for (const index of indices) {
    onRemove(mesh.userData.rocks[index]);
    mesh.getMatrixAt(index, transform.matrix);
    transform.matrix.makeScale(0, 0, 0);
    mesh.setMatrixAt(index, transform.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
  mesh.userData.rocksBySupport.delete(key);
  return indices.length;
}

const OUTCROP_SEED = 9091;
const OUTCROP_TRIES = 520;
const OUTCROP_COLORS = [0x6e4b3c, 0x5c4237, 0x7e5540, 0x8d634a];

// Lajes baixas e afloramentos rochosos esparsos fora das zonas construidas (1 InstancedMesh).
export function createSurfaceOutcrops(world) {
  const rand = createSeededRandom(OUTCROP_SEED);
  const outcrops = [];
  for (let i = 0; i < OUTCROP_TRIES; i += 1) {
    const x = (rand() - 0.5) * world.sizeX;
    const z = (rand() - 0.5) * world.sizeZ;
    const width = 0.42 + rand() * 0.58;
    const height = 0.08 + rand() * 0.11;
    const depth = width * (0.65 + rand() * 0.55);
    const yaw = rand() * Math.PI * 2;
    const tilt = (rand() - 0.5) * 0.18;
    const color = OUTCROP_COLORS[Math.floor(rand() * OUTCROP_COLORS.length)];
    if (isBuildZone(x, z)) continue;
    if (Math.hypot(x - TERRAIN_CONFIG.BASE_CENTER.x, z - TERRAIN_CONFIG.BASE_CENTER.z) > MAX_DISTANCE) continue;
    const top = naturalGroundTop(world, Math.floor(x), Math.floor(z));
    if (top < 0) continue;
    outcrops.push({ x, y: top + height * 0.25, z, supportY: top - 1, width, height, depth, yaw, tilt, color });
  }

  const geometry = new THREE.DodecahedronGeometry(1, 0);
  const material = new THREE.MeshLambertMaterial({ flatShading: true });
  const mesh = new THREE.InstancedMesh(geometry, material, outcrops.length);
  const rocksBySupport = new Map();
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();

  outcrops.forEach((slab, i) => {
    dummy.position.set(slab.x, slab.y, slab.z);
    dummy.rotation.set(slab.tilt, slab.yaw, slab.tilt * 0.4);
    dummy.scale.set(slab.width, slab.height, slab.depth);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    mesh.setColorAt(i, color.setHex(slab.color));

    const supportKey = `${Math.floor(slab.x)},${slab.supportY},${Math.floor(slab.z)}`;
    const list = rocksBySupport.get(supportKey) ?? [];
    list.push(i);
    rocksBySupport.set(supportKey, list);
  });

  mesh.userData.rocksBySupport = rocksBySupport;
  mesh.userData.rocks = outcrops;
  mesh.userData.rockTransform = dummy;
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.computeBoundingSphere();
  return mesh;
}
