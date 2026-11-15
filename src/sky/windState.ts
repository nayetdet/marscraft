import { DUST_STORM_VISUAL_CONFIG, DUST_WEATHER_CONFIG, WIND_AMBIENCE_CONFIG } from '../config/constants.ts';

export interface WindState {
  dirX: number;
  dirZ: number;
  speed: number;
  gust: number;
  intensity: number;
}

export interface WindInput {
  time: number;
  haze?: number;
  edgeStrength?: number;
  windAvgMs?: number;
  gustMs?: number;
}

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));

const BASE_WIND_ANGLE = Math.atan2(DUST_WEATHER_CONFIG.WEATHER_WIND.z, DUST_WEATHER_CONFIG.WEATHER_WIND.x);

export function createWindState(): WindState {
  const len = Math.hypot(DUST_WEATHER_CONFIG.WEATHER_WIND.x, DUST_WEATHER_CONFIG.WEATHER_WIND.z) || 1;
  return {
    dirX: DUST_WEATHER_CONFIG.WEATHER_WIND.x / len,
    dirZ: DUST_WEATHER_CONFIG.WEATHER_WIND.z / len,
    speed: DUST_STORM_VISUAL_CONFIG.WIND_SPEED * 0.45,
    gust: 0,
    intensity: 0.25,
  };
}

/**
 * Updates a reusable WindState from elapsed time, storm haze, map-edge strength,
 * and real InSight wind/gust measurements (no allocations per frame).
 */
export function updateWindState(out: WindState, input: WindInput): WindState {
  const time = Number.isFinite(input.time) ? input.time : 0;
  const haze = clamp01(input.haze ?? 0);
  const edge = clamp01(input.edgeStrength ?? 0);

  // Real InSight wind averages ~4-9 m/s with gusts up to ~18-26 m/s.
  const windAvgMs = Math.max(0, input.windAvgMs ?? 6);
  const gustMs = Math.max(windAvgMs, input.gustMs ?? 14);
  const baseCalmed = clamp01(windAvgMs / 14);
  const gustCeiling = clamp01((gustMs - 6) / 20);

  // Smooth multi-harmonic Martian gust envelope: calm breeze punctuated by sweeping gusts.
  const slowWave = 0.5 + 0.5 * Math.sin(time * 0.19);
  const pulseWave = 0.5 + 0.5 * Math.sin(time * 0.53 + 1.4);
  const microWave = 0.5 + 0.5 * Math.sin(time * 1.17 + 2.7);
  const gustRaw = slowWave * 0.45 + slowWave * pulseWave * 0.4 + pulseWave * microWave * 0.15;
  const gust = clamp01(Math.pow(gustRaw, 1.35) * (0.45 + 0.55 * gustCeiling) + haze * 0.35 + edge * 0.25);

  // Slight organic meander in wind direction around prevailing InSight/storm wind.
  const angleOffset = Math.sin(time * 0.11) * 0.22 + Math.sin(time * 0.31 + 0.9) * 0.09;
  const angle = BASE_WIND_ANGLE + angleOffset;
  out.dirX = Math.cos(angle);
  out.dirZ = Math.sin(angle);

  const intensity = clamp01(0.22 + baseCalmed * 0.28 + gust * 0.45 + haze * 0.45 + edge * 0.3);
  out.gust = gust;
  out.intensity = intensity;
  out.speed = WIND_AMBIENCE_CONFIG.STREAK_MIN_SPEED
    + (WIND_AMBIENCE_CONFIG.STREAK_MAX_SPEED - WIND_AMBIENCE_CONFIG.STREAK_MIN_SPEED) * intensity;

  return out;
}
