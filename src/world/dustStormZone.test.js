import { describe, expect, it } from 'vitest';
import { DUST_STORM_VISUAL_CONFIG, SURVIVAL_CONFIG, TERRAIN_CONFIG, WORLD_CONFIG } from '../config/constants.js';
import {
  DUST_STORM_WALL_RADIUS,
  clampToPlayArea,
  distanceFromBaseCenter,
  dustStormVisualStrength,
} from './dustStormZone.js';

const { x: cx, z: cz } = TERRAIN_CONFIG.BASE_CENTER;
const FATAL = SURVIVAL_CONFIG.DUST_STORM_FATAL_RADIUS;

describe('dust storm zone', () => {
  it('makes the player fog gradually denser near the harmless boundary', () => {
    const start = FATAL - DUST_STORM_VISUAL_CONFIG.EDGE_FOG_LEAD;
    expect(dustStormVisualStrength(cx + start - 1, cz)).toBe(0);
    expect(dustStormVisualStrength(cx + (start + FATAL) / 2, cz)).toBeCloseTo(0.5);
    expect(dustStormVisualStrength(cx + FATAL, cz)).toBe(1);
    expect(dustStormVisualStrength(cx + FATAL + 10, cz)).toBe(1);
  });

  it('places one dust wall at the nearest physical map edge', () => {
    const nearestMapEdge = Math.min(
      WORLD_CONFIG.SIZE_X / 2 - Math.abs(cx),
      WORLD_CONFIG.SIZE_Z / 2 - Math.abs(cz)
    );
    expect(DUST_STORM_WALL_RADIUS).toBeCloseTo(nearestMapEdge);
    expect(DUST_STORM_WALL_RADIUS).toBeCloseTo(FATAL);
  });

  it('stops the player at an invisible wall instead of killing them (issue #103)', () => {
    const inside = { x: cx + FATAL - 1, z: cz };
    expect(clampToPlayArea(inside)).toBe(false);
    expect(inside.x).toBe(cx + FATAL - 1);
    const outside = { x: cx + FATAL + 10, z: cz + 3 };
    expect(clampToPlayArea(outside)).toBe(true);
    expect(distanceFromBaseCenter(outside.x, outside.z)).toBeCloseTo(FATAL);
  });
});
