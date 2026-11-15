// @ts-nocheck
import { describe, expect, it } from 'vitest';
import { advanceSolClock, getSolarAngle } from './solClock.ts';

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

describe('solar day length', () => {
  it('sets sunrise at 04:00, noon at 12:00 and sunset at 20:00', () => {
    expect(getSolarAngle(4)).toBeCloseTo(0);
    expect(getSolarAngle(12)).toBeCloseTo(Math.PI / 2);
    expect(getSolarAngle(20)).toBeCloseTo(Math.PI);
  });

  it('keeps the Sun below the horizon for 8 hours through midnight', () => {
    expect(getSolarAngle(0)).toBeCloseTo((Math.PI * 3) / 2);
    expect(getSolarAngle(23)).toBeGreaterThan(Math.PI);
    expect(getSolarAngle(23)).toBeLessThan((Math.PI * 3) / 2);
  });

  it('repeats the same solar cycle every 24 hours', () => {
    expect(getSolarAngle(28)).toBeCloseTo(getSolarAngle(4));
    expect(getSolarAngle(-4)).toBeCloseTo(getSolarAngle(20));
  });
});
