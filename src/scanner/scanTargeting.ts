// @ts-nocheck
import { BLOCK_IDS } from '../config/blockTypes.ts';
import { raycastVoxel } from '../world/voxelRaycaster.ts';
import { HABITAT_LAYOUT as L, NORTH_WING, mainHabCell, northLinkBox } from '../world/habitatLayout.ts';

// Resolve o que está na mira da luneta. Função pura (sem Three.js nem DOM) para testar com Vitest.
// Ordem: objetos 3D (AABBs com scanId) e voxel competem pela distância; sem acerto, testa o céu.

export const SCAN_TARGETING_CONFIG = {
  // A mais que isso de um bloco da base, a ficha é da base inteira em vez do módulo.
  BASE_OVERVIEW_DISTANCE: 25,
  // Blocos de terreno além deste raio do centro são a borda da cratera.
  CRATER_RIM_RADIUS: 40,
  // Olhando acima disso (componente y da direção) sem acertar nada, é a atmosfera.
  MIN_ATMOSPHERE_DIR_Y: 0.02,
};

const TERRAIN_BLOCKS = {
  [BLOCK_IDS.REGOLITH]: 'regolith',
  [BLOCK_IDS.SANDSTONE]: 'sandstone',
  [BLOCK_IDS.BASALT]: 'crater-rock',
  [BLOCK_IDS.MARS_ICE]: 'water-ice',
  [BLOCK_IDS.METEOR_ICE]: 'meteor-ice',
};

const ICE_TERRAIN_IDS = new Set(['water-ice', 'meteor-ice']);

// Diz a qual módulo da base pertence um bloco estrutural (paredes incluídas), ou null.
export function baseModuleAt(bx, by, bz) {
  const ax = Math.abs(bx);
  const az = Math.abs(bz);
  // Exercise and medbay wing.
  if (bx >= -12 && bx <= -4 && bz >= 7 && bz <= 13 && by >= L.FLOOR_Y && by <= L.CEIL_Y) return 'gym';
  // Full corridor footprint, including the two side walls built outside the air volume.
  if (by >= L.FLOOR_Y && by <= L.CEIL_Y && bz >= 5 && bz <= 7 &&
      ((bz === 5 && bx >= -7 && bx <= -5) || (bz >= 6 && bx >= -7 && bx <= -4))) return 'gym';
  // Match the expanded north wing's actual shell, spine and connecting corridors.
  if (by >= L.FLOOR_Y && by <= L.CEIL_Y) {
    const { SPINE, ROOMS } = NORTH_WING;
    if (bx >= SPINE.xMin - 1 && bx <= SPINE.xMax + 1 && bz >= SPINE.zMin - 1 && bz <= SPINE.zMax) return 'habitat';
    for (const room of ROOMS) {
      if (bx >= room.xMin - 1 && bx <= room.xMax + 1 && bz >= room.zMin - 1 && bz <= room.zMax + 1) return 'habitat';
      const link = northLinkBox(room);
      if (bx >= link.xMin - 1 && bx <= link.xMax + 1 && bz >= link.zMin - 1 && bz <= link.zMax + 1) return 'habitat';
    }
  }
  if (bx >= -4 && bx <= -1 && bz >= -9 && bz <= -6 && by >= L.FLOOR_Y && by <= L.CEIL_Y) return 'tunnel';
  // Cúpula sobre o teto: ar em |x|,|z| <= CUPOLA_HALF, mais 1 bloco de parede.
  if (by > L.CEIL_Y && ax <= L.CUPOLA_HALF + 1 && az <= L.CUPOLA_HALF + 1) return 'cupola';
  // Airlock sul: corredor de ar |x| <= AIRLOCK_HALF_X, paredes 1 bloco além.
  if (bz >= L.AIRLOCK_Z_MIN && bz <= L.AIRLOCK_Z_MAX && ax <= L.AIRLOCK_HALF_X + 1 && by <= L.FLOOR_Y + L.AIRLOCK_HEIGHT + 1) {
    return 'airlock';
  }
  if (mainHabCell(bx, bz) && by <= L.CEIL_Y) return 'habitat';
  if (bx >= L.TUNNEL_X_MIN && bx <= L.TUNNEL_X_MAX && az <= L.TUNNEL_HALF_Z + 1 && by <= L.FLOOR_Y + L.TUNNEL_HEIGHT + 1) {
    return 'tunnel';
  }
  if (Math.hypot(bx - L.DOME_X, bz - L.DOME_Z) <= L.DOME_RADIUS + 0.5 && by >= L.FLOOR_Y) return 'greenhouse';
  return null;
}

// Módulos que formam a base habitada (o foguete fica de fora da visão geral "base").
const OUTPOST_MODULES = new Set(['habitat', 'airlock', 'tunnel', 'greenhouse', 'cupola', 'gym']);

// Classifica um bloco sem levar a distância em conta (a visão geral "base" é decidida fora).
function classifyBlockAt(block, x, y, z) {
  const terrainId = TERRAIN_BLOCKS[block];
  const module = baseModuleAt(x, y, z);
  if (terrainId) {
    if (!ICE_TERRAIN_IDS.has(terrainId) && Math.hypot(x, z) > SCAN_TARGETING_CONFIG.CRATER_RIM_RADIUS) return 'crater-rim';
    return terrainId;
  }
  if (block === BLOCK_IDS.HYDRO_PLANT) return 'greenhouse';
  return module;
}

function classifyBlock(hit) {
  const terrainId = TERRAIN_BLOCKS[hit.block];
  const module = baseModuleAt(hit.x, hit.y, hit.z);

  if (terrainId) {
    // O foguete pousa numa plataforma de basalto: ela é parte do foguete, não terreno solto.
    if (!ICE_TERRAIN_IDS.has(terrainId) && Math.hypot(hit.x, hit.z) > SCAN_TARGETING_CONFIG.CRATER_RIM_RADIUS) {
      return 'crater-rim';
    }
    return terrainId;
  }

  if (hit.block === BLOCK_IDS.HYDRO_PLANT) return 'greenhouse';
  if (!module) return null; // Estrutura construída pelo jogador fora da base.
  if (OUTPOST_MODULES.has(module) && hit.distance > SCAN_TARGETING_CONFIG.BASE_OVERVIEW_DISTANCE) return 'base';
  return module;
}

// Interseção raio x AABB (método das placas). Devolve a distância de entrada ou null.
export function rayBoxDistance(origin, dir, box, maxDist) {
  let tMin = 0;
  let tMax = maxDist;
  for (const axis of ['X', 'Y', 'Z']) {
    const o = origin[axis.toLowerCase()];
    const d = dir[axis.toLowerCase()];
    const min = box[`min${axis}`];
    const max = box[`max${axis}`];
    if (Math.abs(d) < 1e-9) {
      if (o < min || o > max) return null;
      continue;
    }
    let t1 = (min - o) / d;
    let t2 = (max - o) / d;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return null;
  }
  return tMin;
}

function nearestObjectHit(origin, dir, objects, maxDist) {
  let best = null;
  for (const obj of objects) {
    // Caixa que contém a câmera (ex.: dentro da estufa) não deve tapar a visão.
    if (
      origin.x >= obj.minX && origin.x <= obj.maxX &&
      origin.y >= obj.minY && origin.y <= obj.maxY &&
      origin.z >= obj.minZ && origin.z <= obj.maxZ
    ) continue;
    const t = rayBoxDistance(origin, dir, obj, maxDist);
    if (t !== null && (!best || t < best.distance)) best = { distance: t, obj };
  }
  return best;
}

function angleBetween(a, b) {
  const dot = a.x * b.x + a.y * b.y + a.z * b.z;
  return Math.acos(Math.min(1, Math.max(-1, dot)));
}

function resolveSky(dir, skyBodies) {
  let best = null;
  for (const body of skyBodies) {
    const angle = angleBetween(dir, body.dir);
    if (angle <= body.radius && (!best || angle < best.angle)) best = { id: body.id, angle };
  }
  if (best) return best.id;
  return dir.y > SCAN_TARGETING_CONFIG.MIN_ATMOSPHERE_DIR_Y ? 'atmosphere' : null;
}

/**
 * @param {object} params
 * @param {{getBlock: Function}} params.world
 * @param {{x,y,z}} params.origin posição da câmera
 * @param {{x,y,z}} params.dir direção normalizada da mira
 * @param {Array} params.objects AABBs {minX..maxZ, scanId}; sem scanId, o alvo vem do módulo da base no ponto atingido
 * @param {Array} params.skyBodies {id, dir (normalizada, da câmera ao astro), radius (raio angular em rad)}
 * @param {number} params.maxDist alcance do scan em blocos
 * @returns {{id: string, distance: number} | null}
 */
export function resolveScanTarget({ world, origin, dir, objects = [], skyBodies = [], maxDist }) {
  const voxelHit = raycastVoxel(world, origin, dir, maxDist);
  const objectHit = nearestObjectHit(origin, dir, objects, maxDist);

  if (objectHit && (!voxelHit.hit || objectHit.distance <= voxelHit.distance)) {
    const { obj, distance } = objectHit;
    if (obj.scanId) return { id: obj.scanId, distance, hit: null };
    const p = {
      x: origin.x + dir.x * distance,
      y: origin.y + dir.y * distance,
      z: origin.z + dir.z * distance,
    };
    const module = baseModuleAt(Math.floor(p.x), Math.floor(p.y), Math.floor(p.z));
    if (module) return { id: module, distance, hit: null };
    // Unlabelled scenery (chairs, consoles, etc.) can sit in front of a scannable
    // voxel. Let the voxel result below decide instead of making scenery a dead end.
    if (!voxelHit.hit) return null;
  }

  if (voxelHit.hit) {
    const id = classifyBlock(voxelHit);
    return id ? { id, distance: voxelHit.distance, hit: { x: voxelHit.x, y: voxelHit.y, z: voxelHit.z } } : null;
  }

  const skyId = resolveSky(dir, skyBodies);
  return skyId ? { id: skyId, distance: Infinity, hit: null } : null;
}

// Região que contém a base inteira (habitat, túnel, estufa, cúpula e foguete), em blocos.
// Includes the north wing, which extends to z = -21, as well as the greenhouse and MAV pad.
const BASE_REGION = { X_MIN: -24, X_MAX: 20, Y_MIN: 8, Y_MAX: 22, Z_MIN: -42, Z_MAX: 14 };
const PATCH_RADIUS = 3; // terreno: mancha em volta do bloco mirado
const NEIGHBORS = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
const MARS_ICE_SCAN_RADIUS = 10; // Covers the natural deposit, which is 4.8 blocks from its center.
const METEOR_ICE_SCAN_RADIUS = 20; // Covers the crater and ejecta field when aiming at its edge.
const ICE_SCAN_VERTICAL_RADIUS = 8;

function isExposed(world, x, y, z) {
  return NEIGHBORS.some(([dx, dy, dz]) => world.getBlock(x + dx, y + dy, z + dz) === BLOCK_IDS.AIR);
}

/**
 * Blocos visíveis (com face para o ar) que formam o alvo, para o efeito de scan pintar o
 * objeto inteiro. Módulos da base e o foguete: todos os blocos daquele módulo. Terreno e borda
 * da cratera: a mancha do mesmo tipo em volta do bloco mirado. Alvos sem bloco: lista vazia.
 */
export function collectScanBlocks(world, target, maxBlocks = Infinity) {
  if (!target) return [];
  const blocks = [];
  const add = (x, y, z) => {
    if (blocks.length < maxBlocks) blocks.push({ x, y, z });
  };

  const wantsModule = target.id === 'base' || ['habitat', 'airlock', 'tunnel', 'greenhouse', 'cupola', 'gym', 'lander'].includes(target.id);
  if (wantsModule) {
    const R = BASE_REGION;
    for (let x = R.X_MIN; x <= R.X_MAX; x++) {
      for (let y = R.Y_MIN; y <= R.Y_MAX; y++) {
        for (let z = R.Z_MIN; z <= R.Z_MAX; z++) {
          const block = world.getBlock(x, y, z);
          if (block === BLOCK_IDS.AIR) continue;
          const id = classifyBlockAt(block, x, y, z);
          const matches = target.id === 'base' ? OUTPOST_MODULES.has(id) : id === target.id;
          // Gym scan traces every structural voxel, including blocks pressed against
          // the ground or another wall block; AIR-only exposure was dropping them.
          if (matches && (target.id === 'gym' || isExposed(world, x, y, z))) add(x, y, z);
        }
      }
    }
    return blocks;
  }

  if (!target.hit) return blocks;
  const { x: hx, y: hy, z: hz } = target.hit;

  if (target.id === 'water-ice' || target.id === 'meteor-ice') {
    const iceType = world.getBlock(hx, hy, hz);
    if (target.id === 'water-ice' && iceType === BLOCK_IDS.MARS_ICE) {
      const radiusSq = MARS_ICE_SCAN_RADIUS * MARS_ICE_SCAN_RADIUS;
      for (let x = hx - MARS_ICE_SCAN_RADIUS; x <= hx + MARS_ICE_SCAN_RADIUS; x++) {
        for (let z = hz - MARS_ICE_SCAN_RADIUS; z <= hz + MARS_ICE_SCAN_RADIUS; z++) {
          const dx = x - hx;
          const dz = z - hz;
          if (dx * dx + dz * dz > radiusSq) continue;
          for (let y = hy - ICE_SCAN_VERTICAL_RADIUS; y <= hy + ICE_SCAN_VERTICAL_RADIUS; y++) {
            if (world.getBlock(x, y, z) === iceType && isExposed(world, x, y, z)) add(x, y, z);
          }
        }
      }
      return blocks;
    }

    if (target.id === 'meteor-ice' && iceType === BLOCK_IDS.METEOR_ICE) {
      const radiusSq = METEOR_ICE_SCAN_RADIUS * METEOR_ICE_SCAN_RADIUS;
      for (let x = hx - METEOR_ICE_SCAN_RADIUS; x <= hx + METEOR_ICE_SCAN_RADIUS; x++) {
        for (let z = hz - METEOR_ICE_SCAN_RADIUS; z <= hz + METEOR_ICE_SCAN_RADIUS; z++) {
          const dx = x - hx;
          const dz = z - hz;
          if (dx * dx + dz * dz > radiusSq) continue;
          for (let y = hy - ICE_SCAN_VERTICAL_RADIUS; y <= hy + ICE_SCAN_VERTICAL_RADIUS; y++) {
            if (world.getBlock(x, y, z) === iceType && isExposed(world, x, y, z)) add(x, y, z);
          }
        }
      }
      return blocks;
    }
  }

  for (let x = hx - PATCH_RADIUS; x <= hx + PATCH_RADIUS; x++) {
    for (let y = hy - PATCH_RADIUS; y <= hy + PATCH_RADIUS; y++) {
      for (let z = hz - PATCH_RADIUS; z <= hz + PATCH_RADIUS; z++) {
        const block = world.getBlock(x, y, z);
        if (block === BLOCK_IDS.AIR || classifyBlockAt(block, x, y, z) !== target.id) continue;
        if (isExposed(world, x, y, z)) add(x, y, z);
      }
    }
  }
  return blocks;
}
