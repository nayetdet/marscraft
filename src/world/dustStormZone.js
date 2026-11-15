import { DUST_STORM_VISUAL_CONFIG, SURVIVAL_CONFIG, TERRAIN_CONFIG } from '../config/constants.js';

// Zona da tempestade de poeira que cerca a area jogavel: um anel em volta do centro da base.
// Logica pura, usada pela sobrevivencia (dano), pelo HUD (aviso) e pelo visual (DustStormEffect).

const CENTER = TERRAIN_CONFIG.BASE_CENTER;
const START = SURVIVAL_CONFIG.DUST_STORM_START_RADIUS;
const RANGE = SURVIVAL_CONFIG.DUST_STORM_FATAL_RADIUS - START;
const WARNING = SURVIVAL_CONFIG.DUST_STORM_WARNING_DISTANCE;
const VISUAL_START = START - DUST_STORM_VISUAL_CONFIG.VISUAL_LEAD;
const VISUAL_RANGE = SURVIVAL_CONFIG.DUST_STORM_FATAL_RADIUS - VISUAL_START;

export const DUST_STORM_CENTER = CENTER;
export const DUST_STORM_WALL_RADIUS = START + DUST_STORM_VISUAL_CONFIG.WALL_RADIUS_OFFSET;

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

// Forca do visual (neblina, cupula, particulas): comeca um pouco antes da tempestade, na parede
export function dustStormVisualStrength(x, z) {
  return clamp01((distanceFromBaseCenter(x, z) - VISUAL_START) / VISUAL_RANGE);
}
