import { describe, expect, it } from 'vitest';
import { SURVIVAL_CONFIG, TERRAIN_CONFIG, WORLD_CONFIG } from '../config/constants.js';
import {
  DUST_STORM_WALL_RADIUS,
  clampToPlayArea,
  distanceFromBaseCenter,
  dustStormIntensity,
  dustStormProximity,
  dustStormVisualStrength,
} from './dustStormZone.js';

const { x: cx, z: cz } = TERRAIN_CONFIG.BASE_CENTER;
const START = SURVIVAL_CONFIG.DUST_STORM_START_RADIUS;
const FATAL = SURVIVAL_CONFIG.DUST_STORM_FATAL_RADIUS;
const WARNING = SURVIVAL_CONFIG.DUST_STORM_WARNING_DISTANCE;

describe('dust storm zone', () => {
  it('is calm at the base and fatal at the outer radius', () => {
    expect(dustStormIntensity(cx, cz)).toBe(0);
    expect(dustStormIntensity(cx + START, cz)).toBe(0);
    expect(dustStormIntensity(cx, cz + (START + FATAL) / 2)).toBeCloseTo(0.5);
    expect(dustStormIntensity(cx - FATAL - 5, cz)).toBe(1);
  });

  it('warns before the storm starts', () => {
    expect(dustStormProximity(cx + START - WARNING - 1, cz)).toBe(0);
    expect(dustStormProximity(cx + START - WARNING / 2, cz)).toBeCloseTo(0.5);
    expect(dustStormProximity(cx + START, cz)).toBe(1);
    expect(dustStormIntensity(cx + START - WARNING / 2, cz)).toBe(0);
  });

  it('starts the visuals before the wall so walking through it is never a hard edge', () => {
    expect(dustStormVisualStrength(cx + DUST_STORM_WALL_RADIUS, cz)).toBeGreaterThan(0);
    expect(dustStormVisualStrength(cx + START - WARNING, cz)).toBe(0);
  });

  it('places the dust wall at the nearest physical map edge', () => {
    const nearestMapEdge = Math.min(
      WORLD_CONFIG.SIZE_X / 2 - Math.abs(cx),
      WORLD_CONFIG.SIZE_Z / 2 - Math.abs(cz)
    );
    expect(DUST_STORM_WALL_RADIUS).toBeCloseTo(nearestMapEdge);
    expect(DUST_STORM_WALL_RADIUS).toBeGreaterThan(FATAL);
  });

  it('stops the player at an invisible wall instead of killing them (issue #103)', () => {
    const inside = { x: cx + START, z: cz };
    expect(clampToPlayArea(inside)).toBe(false);
    expect(inside.x).toBe(cx + START);
    const outside = { x: cx + FATAL + 10, z: cz + 3 };
    expect(clampToPlayArea(outside)).toBe(true);
    expect(distanceFromBaseCenter(outside.x, outside.z)).toBeCloseTo(FATAL);
  });
});
