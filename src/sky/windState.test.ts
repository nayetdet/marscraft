import { describe, expect, it } from 'vitest';
import { createWindState, updateWindState } from './windState.ts';

describe('windState', () => {
  it('produces normalized wind vectors and bounded gust/intensity metrics', () => {
    const state = createWindState();
    for (let t = 0; t < 120; t += 1.5) {
      updateWindState(state, { time: t, haze: 0, edgeStrength: 0, windAvgMs: 6, gustMs: 16 });
      expect(Math.hypot(state.dirX, state.dirZ)).toBeCloseTo(1, 5);
      expect(state.gust).toBeGreaterThanOrEqual(0);
      expect(state.gust).toBeLessThanOrEqual(1);
      expect(state.intensity).toBeGreaterThanOrEqual(0);
      expect(state.intensity).toBeLessThanOrEqual(1);
      expect(state.speed).toBeGreaterThan(0);
    }
  });

  it('increases intensity and speed during dust storms and high InSight gusts', () => {
    const calm = createWindState();
    const storm = createWindState();
    updateWindState(calm, { time: 5, haze: 0, edgeStrength: 0, windAvgMs: 3, gustMs: 8 });
    updateWindState(storm, { time: 5, haze: 1, edgeStrength: 0, windAvgMs: 12, gustMs: 25 });
    expect(storm.intensity).toBeGreaterThan(calm.intensity);
    expect(storm.speed).toBeGreaterThan(calm.speed);
  });
});
