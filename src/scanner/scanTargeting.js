import { BLOCK_IDS } from '../config/blockTypes.js';
import { raycastVoxel } from '../world/voxelRaycaster.js';
import { HABITAT_LAYOUT as L } from '../world/habitatLayout.js';

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
};

// Foguete de ascensão em nasaSpaceshipBuilder.js (centro x = 14, z = -3, plataforma de 9x9).
const LANDER = { X_MIN: 10, X_MAX: 18, Z_MIN: -7, Z_MAX: 1 };

// Diz a qual módulo da base pertence um bloco estrutural (paredes incluídas), ou null.
export function baseModuleAt(bx, by, bz) {
  if (bx >= LANDER.X_MIN && bx <= LANDER.X_MAX && bz >= LANDER.Z_MIN && bz <= LANDER.Z_MAX) {
    return 'lander';
  }
  const ax = Math.abs(bx);
  const az = Math.abs(bz);
  // Cúpula sobre o teto: ar em |x|,|z| <= CUPOLA_HALF, mais 1 bloco de parede.
  if (by > L.CEIL_Y && ax <= L.CUPOLA_HALF + 1 && az <= L.CUPOLA_HALF + 1) return 'cupola';
  // Airlock sul: corredor de ar |x| <= AIRLOCK_HALF_X, paredes 1 bloco além.
  if (bz >= L.AIRLOCK_Z_MIN && bz <= L.AIRLOCK_Z_MAX && ax <= L.AIRLOCK_HALF_X + 1 && by <= L.FLOOR_Y + L.AIRLOCK_HEIGHT + 1) {
    return 'airlock';
  }
  if (ax <= L.MAIN_HALF_X && az <= L.MAIN_HALF_Z && ax + az <= L.MAIN_CHAMFER && by <= L.CEIL_Y) return 'habitat';
  if (bx >= L.TUNNEL_X_MIN && bx <= L.TUNNEL_X_MAX && az <= L.TUNNEL_HALF_Z + 1 && by <= L.FLOOR_Y + L.TUNNEL_HEIGHT + 1) {
    return 'tunnel';
  }
  if (Math.hypot(bx - L.DOME_X, bz - L.DOME_Z) <= L.DOME_RADIUS + 0.5 && by >= L.FLOOR_Y) return 'greenhouse';
  return null;
}

// Módulos que formam a base habitada (o foguete fica de fora da visão geral "base").
const OUTPOST_MODULES = new Set(['habitat', 'airlock', 'tunnel', 'greenhouse', 'cupola']);

function classifyBlock(hit) {
  const terrainId = TERRAIN_BLOCKS[hit.block];
  const module = baseModuleAt(hit.x, hit.y, hit.z);

  if (terrainId) {
    // O foguete pousa numa plataforma de basalto: ela é parte do foguete, não terreno solto.
    if (module === 'lander' && hit.y >= L.FLOOR_Y - 1) return 'lander';
    if (terrainId !== 'water-ice' && Math.hypot(hit.x, hit.z) > SCAN_TARGETING_CONFIG.CRATER_RIM_RADIUS) {
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
    if (obj.scanId) return { id: obj.scanId, distance };
    const p = {
      x: origin.x + dir.x * distance,
      y: origin.y + dir.y * distance,
      z: origin.z + dir.z * distance,
    };
    const module = baseModuleAt(Math.floor(p.x), Math.floor(p.y), Math.floor(p.z));
    return module ? { id: module, distance } : null;
  }

  if (voxelHit.hit) {
    const id = classifyBlock(voxelHit);
    return id ? { id, distance: voxelHit.distance } : null;
  }

  const skyId = resolveSky(dir, skyBodies);
  return skyId ? { id: skyId, distance: Infinity } : null;
}
