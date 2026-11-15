import { SURVIVAL_CONFIG, TERRAIN_CONFIG, WORLD_CONFIG } from '../config/constants.js';

// Parede de poeira que marca a borda da area jogavel: um anel em volta do centro da base.
// Logica pura, usada pelo HUD (aviso), pelo visual (DustStormEffect) e pela parede invisivel.
// Nao machuca (issue #103): a tempestade de poeira de verdade e o clima (src/mission/dustWeather.js).

const CENTER = TERRAIN_CONFIG.BASE_CENTER;
const HALF_MAP_X = WORLD_CONFIG.SIZE_X / 2;
const HALF_MAP_Z = WORLD_CONFIG.SIZE_Z / 2;

export const DUST_STORM_CENTER = CENTER;
export const DUST_STORM_WALL_RADIUS = SURVIVAL_CONFIG.DUST_STORM_FATAL_RADIUS;
export const DUST_STORM_WORLD_RADIUS = Math.hypot(
  HALF_MAP_X + Math.abs(CENTER.x),
  HALF_MAP_Z + Math.abs(CENTER.z)
);
export function distanceFromBaseCenter(x, z) {
  return Math.hypot(x - CENTER.x, z - CENTER.z);
}

// Parede invisivel no raio FATAL: o jogador (ou o rover) volta para dentro do anel em vez de
// morrer no vento. Muda `pos` (x, z) e devolve true se precisou empurrar.
export function clampToPlayArea(pos) {
  const limit = SURVIVAL_CONFIG.DUST_STORM_FATAL_RADIUS;
  const dx = pos.x - CENTER.x;
  const dz = pos.z - CENTER.z;
  const dist = Math.hypot(dx, dz);
  if (dist <= limit) return false;
  pos.x = CENTER.x + (dx / dist) * limit;
  pos.z = CENTER.z + (dz / dist) * limit;
  return true;
}
