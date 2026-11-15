import { describe, expect, it } from 'vitest';
import { BLOCK_IDS } from '../config/blockTypes.ts';
import { accumulateFootstepDistance, findRegolithSurfaceY } from './footprintLogic.ts';

describe('accumulateFootstepDistance', () => {
  it('places a print when the spacing threshold is reached', () => {
    expect(accumulateFootstepDistance(0.4, 0.32, 0.72)).toEqual({
      distanceSinceStep: 0,
      shouldPlace: true,
    });
  });

  it('keeps the remaining distance between steps', () => {
    const step = accumulateFootstepDistance(0.6, 0.2, 0.72);
    expect(step.shouldPlace).toBe(true);
    expect(step.distanceSinceStep).toBeCloseTo(0.08);
  });

  it('does not place a print before the threshold', () => {
    expect(accumulateFootstepDistance(0.2, 0.3, 0.72)).toEqual({
      distanceSinceStep: 0.5,
      shouldPlace: false,
    });
  });
});

describe('findRegolithSurfaceY', () => {
  const worldWith = (blocks: Map<number, number>) => ({
    getBlock: (_x: number, y: number, _z: number) => blocks.get(y) ?? BLOCK_IDS.AIR,
  });

  it('finds regolith below empty cells', () => {
    expect(findRegolithSurfaceY(worldWith(new Map([[8, BLOCK_IDS.REGOLITH]])), 2, 10, -3)).toBe(8);
  });

  it('rejects another solid surface', () => {
    expect(findRegolithSurfaceY(worldWith(new Map([[9, BLOCK_IDS.SANDSTONE]])), 2, 10, -3)).toBeNull();
  });

  it('returns null when no solid surface is below the player', () => {
    expect(findRegolithSurfaceY(worldWith(new Map()), 2, 10, -3)).toBeNull();
  });
});
