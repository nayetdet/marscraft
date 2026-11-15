import { DUST_STORM_VISUAL_CONFIG, SURVIVAL_CONFIG, TERRAIN_CONFIG } from '../config/constants.js';

// Parede de poeira que marca a borda da area jogavel: um anel em volta do centro da base.
// Logica pura, usada pelo HUD (aviso), pelo visual (DustStormEffect) e pela parede invisivel.
// Nao machuca (issue #103): a tempestade de poeira de verdade e o clima (src/mission/dustWeather.js).

const CENTER = TERRAIN_CONFIG.BASE_CENTER;
const EDGE_FOG_START = SURVIVAL_CONFIG.DUST_STORM_FATAL_RADIUS - DUST_STORM_VISUAL_CONFIG.EDGE_FOG_LEAD;
const EDGE_FOG_RANGE = SURVIVAL_CONFIG.DUST_STORM_FATAL_RADIUS - EDGE_FOG_START;
export const DUST_STORM_CENTER = CENTER;
export const DUST_STORM_WALL_RADIUS = SURVIVAL_CONFIG.DUST_STORM_FATAL_RADIUS;

// Gradua a nevoa sentida pelo jogador ao se aproximar da barreira; nao aplica dano.
export function dustStormVisualStrength(x, z) {
  const distance = distanceFromBaseCenter(x, z);
  const progress = Math.max(0, Math.min(1, (distance - EDGE_FOG_START) / EDGE_FOG_RANGE));
  return progress * progress * (3 - 2 * progress);
}

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
