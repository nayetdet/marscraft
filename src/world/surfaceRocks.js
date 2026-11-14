// Pedras pequenas espalhadas pelo terreno. E decoracao: a posicao e sorteada por semente fixa,
// nao vem de dado real, e as pedras nao tem colisao. O formato do terreno continua sendo o dado
// real (src/data/marsTerrain.js); por isso nada disto entra na tela "NASA Data".
import * as THREE from 'three';
import { BLOCK_IDS } from '../config/blockTypes.js';
import { createSeededRandom } from '../graphics/textureGenerator.js';
import { isBuildZone } from './terrainGenerator.js';

const SEED = 4242;
const CLUSTER_TRIES = 1500;
const MIN_SIZE = 0.14;
const MAX_SIZE = 0.42;
const ROCK_COLORS = [0x8a5a44, 0x7a5240, 0x96664c, 0x6e4c3e];

const NATURAL_GROUND = new Set([BLOCK_IDS.REGOLITH, BLOCK_IDS.SANDSTONE]);

// y do topo do bloco solido mais alto da coluna, ou -1 se o topo nao for chao natural
function naturalGroundTop(world, x, z) {
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
      const top = naturalGroundTop(world, Math.floor(x), Math.floor(z));
      if (top < 0) continue;
      // Meio enterrada: o centro fica um pouco acima do chao
      rocks.push({ x, y: top + size * squash * 0.35, z, size, squash, yaw, tilt, color });
    }
  }
  return rocks;
}

export function createSurfaceRocks(world) {
  const rocks = scatterRocks(world);
  const geometry = new THREE.IcosahedronGeometry(1, 0);
  const material = new THREE.MeshLambertMaterial({ flatShading: true });
  const mesh = new THREE.InstancedMesh(geometry, material, rocks.length);

  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  rocks.forEach((rock, i) => {
    dummy.position.set(rock.x, rock.y, rock.z);
    dummy.rotation.set(rock.tilt, rock.yaw, rock.tilt * 0.5);
    dummy.scale.set(rock.size, rock.size * rock.squash, rock.size * (0.75 + rock.squash * 0.4));
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    mesh.setColorAt(i, color.setHex(rock.color));
  });
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.computeBoundingSphere();
  return mesh;
}
