// @ts-nocheck
import { describe, expect, it } from 'vitest';
import { advanceSolClock } from './solClock.ts';

describe('sol clock', () => {
  it('keeps the same sol while the day has not ended', () => {
    expect(advanceSolClock(9, 1, 2.5)).toEqual({ timeOfDay: 11.5, solCount: 1 });
  });

  it('starts a new sol at midnight', () => {
    const clock = advanceSolClock(23.5, 3, 1);
    expect(clock.solCount).toBe(4);
    expect(clock.timeOfDay).toBeCloseTo(0.5);
  });

  it('counts every sol crossed by a long jump (issue #110)', () => {
    const clock = advanceSolClock(9, 1, 50);
    expect(clock.solCount).toBe(3);
    expect(clock.timeOfDay).toBeCloseTo(11);
    expect(clock.timeOfDay).toBeLessThan(24);
  });

  it('never runs backwards', () => {
    expect(advanceSolClock(9, 2, -5)).toEqual({ timeOfDay: 9, solCount: 2 });
  });
});
