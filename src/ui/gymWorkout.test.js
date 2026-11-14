import { describe, expect, it } from 'vitest';
import { GymWorkout } from './gymWorkout.js';

describe('gym equipment', () => {
  it('requires good timing on the treadmill', () => {
    const run = new GymWorkout('treadmill');
    expect(run.step('step', 10, 0).status).toBe('miss');
    expect(run.progress).toBe(0);
    for (let i = 1; i <= 4; i++) run.step('step', 50, i * 300);
    expect(run.progress).toBe(100);
  });
  it('requires alternating bike pedals and blocks rapid repeats', () => {
    const bike = new GymWorkout('bike');
    expect(bike.step('right', 0, 0).status).toBe('miss');
    expect(bike.step('left', 0, 300).status).toBe('hit');
    expect(bike.step('right', 0, 310).status).toBe('wait');
    expect(bike.step('left', 0, 600).status).toBe('miss');
    expect(bike.progress).toBe(20);
    for (const [i, side] of ['right', 'left', 'right', 'left'].entries()) bike.step(side, 0, 900 + i * 300);
    expect(bike.progress).toBe(100);
  });
});
