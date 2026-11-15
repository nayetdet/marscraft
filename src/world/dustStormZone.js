import { DUST_STORM_VISUAL_CONFIG, SURVIVAL_CONFIG, TERRAIN_CONFIG, WORLD_CONFIG } from '../config/constants.js';

// Raios de exposição usados pela sobrevivência e pelo HUD; o visual acompanha a borda física do mapa.

const CENTER = TERRAIN_CONFIG.BASE_CENTER;
const START = SURVIVAL_CONFIG.DUST_STORM_START_RADIUS;
const RANGE = SURVIVAL_CONFIG.DUST_STORM_FATAL_RADIUS - START;
const WARNING = SURVIVAL_CONFIG.DUST_STORM_WARNING_DISTANCE;
const HALF_MAP_X = WORLD_CONFIG.SIZE_X / 2;
const HALF_MAP_Z = WORLD_CONFIG.SIZE_Z / 2;

export const DUST_STORM_CENTER = CENTER;
// Usa o raio do círculo inscrito no mapa para a parede não ultrapassar seus limites.
export const DUST_STORM_WALL_RADIUS = Math.min(
  HALF_MAP_X - Math.abs(CENTER.x),
  HALF_MAP_Z - Math.abs(CENTER.z)
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

// O visual cresce apenas na aproximação da borda física do mapa.
export function dustStormVisualStrength(x, z) {
  return clamp01((distanceFromBaseCenter(x, z) - VISUAL_START) / VISUAL_RANGE);
}
