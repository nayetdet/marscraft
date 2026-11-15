import { DUST_STORM_VISUAL_CONFIG, SURVIVAL_CONFIG, TERRAIN_CONFIG, WORLD_CONFIG } from '../config/constants.js';

// Parede de poeira que marca a borda da area jogavel: um anel em volta do centro da base.
// Logica pura, usada pelo HUD (aviso), pelo visual (DustStormEffect) e pela parede invisivel.
// Nao machuca (issue #103): a tempestade de poeira de verdade e o clima (src/mission/dustWeather.js).

const CENTER = TERRAIN_CONFIG.BASE_CENTER;
const START = SURVIVAL_CONFIG.DUST_STORM_START_RADIUS;
const RANGE = SURVIVAL_CONFIG.DUST_STORM_FATAL_RADIUS - START;
const WARNING = SURVIVAL_CONFIG.DUST_STORM_WARNING_DISTANCE;
const HALF_MAP_X = WORLD_CONFIG.SIZE_X / 2;
const HALF_MAP_Z = WORLD_CONFIG.SIZE_Z / 2;

export const DUST_STORM_CENTER = CENTER;
export const DUST_STORM_WALL_RADIUS = SURVIVAL_CONFIG.DUST_STORM_FATAL_RADIUS;
export const DUST_STORM_MIDDLE_WALL_RADIUS = START + RANGE / 2;
export const DUST_STORM_WORLD_RADIUS = Math.hypot(
  HALF_MAP_X + Math.abs(CENTER.x),
  HALF_MAP_Z + Math.abs(CENTER.z)
);
const VISUAL_START = DUST_STORM_WALL_RADIUS - DUST_STORM_VISUAL_CONFIG.VISUAL_LEAD;
const VISUAL_RANGE = DUST_STORM_WALL_RADIUS - VISUAL_START;

const clamp01 = (v) => Math.max(0, Math.min(1, v));

export function distanceFromBaseCenter(x, z) {
  return Math.hypot(x - CENTER.x, z - CENTER.z);
}

// 0 dentro da area segura, 1 no raio fatal
export function dustStormIntensity(x, z) {
  return clamp01((distanceFromBaseCenter(x, z) - START) / RANGE);
}

// 0 longe da borda, 1 no inicio da tempestade: serve para avisar antes de entrar nela
export function dustStormProximity(x, z) {
  return clamp01((distanceFromBaseCenter(x, z) - (START - WARNING)) / WARNING);
}

// A névoa cresce em duas etapas entre a primeira frente e a borda externa.
export function dustStormVisualStrength(x, z) {
  return clamp01((distanceFromBaseCenter(x, z) - VISUAL_START) / VISUAL_RANGE);
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
