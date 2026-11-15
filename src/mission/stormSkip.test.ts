import { describe, expect, it } from 'vitest';
import { MISSION_CONFIG, RADIATION_CONFIG, STORM_CONFIG, STORM_SKIP_CONFIG, SURVIVAL_CONFIG, WATER_SYSTEM_CONFIG } from '../config/constants.ts';
import { advanceSleep, createSleepSession } from '../player/sleep.ts';
import { makeStorm, stormStateAt } from './solarStorms.ts';
import {
  STORM_SKIP_PANEL_LINE,
  stormSkipButtonLabel,
  stormSkipHours,
  stormSkipNeedsCost,
  stormSkipStatus,
  stormSkipSummary,
  wallMissingLiters,
} from './stormSkip.ts';

const FULL = RADIATION_CONFIG.SHELTER_WALL_MAX_L;

describe('storm fast wait: when it is allowed (issue #228)', () => {
  it('needs a storm, a full wall and the player inside the shelter', () => {
    expect(stormSkipStatus({ phase: 'warning', wallL: FULL, insideShelter: true })).toEqual({ allowed: true, blocker: null, missingL: 0 });
    expect(stormSkipStatus({ phase: 'active', wallL: FULL, insideShelter: true }).allowed).toBe(true);
    expect(stormSkipStatus({ phase: 'calm', wallL: FULL, insideShelter: true }).blocker).toBe('no-storm');
    expect(stormSkipStatus({ phase: 'active', wallL: FULL, insideShelter: false }).blocker).toBe('not-inside');
  });

  it('a wall that is not full blocks it and says how many liters are missing', () => {
    const step = RADIATION_CONFIG.SHELTER_FILL_STEP_L;
    const status = stormSkipStatus({ phase: 'active', wallL: FULL - step, insideShelter: true });
    expect(status).toEqual({ allowed: false, blocker: 'wall-not-full', missingL: step });
    expect(stormSkipButtonLabel(status)).toContain(`${step} more L`);
    expect(stormSkipStatus({ phase: 'active', wallL: 0, insideShelter: true }).missingL).toBe(FULL);
    expect(wallMissingLiters(FULL - 1e-9)).toBe(0);
  });

  it('the full wall costs more than half of the base tank: water you cannot drink', () => {
    expect(FULL).toBeGreaterThan(WATER_SYSTEM_CONFIG.MAX_BASE_WATER / 2);
    expect(FULL).toBeLessThanOrEqual(WATER_SYSTEM_CONFIG.MAX_BASE_WATER);
    expect(FULL).toBeGreaterThan(WATER_SYSTEM_CONFIG.INITIAL_BASE_WATER);
    expect(FULL % RADIATION_CONFIG.SHELTER_FILL_STEP_L).toBe(0);
    expect(STORM_SKIP_PANEL_LINE).toContain(`FULL wall (${FULL} L)`);
    expect(STORM_SKIP_PANEL_LINE).toMatch(/still uses power and you still get hungry and thirsty/);
  });

  it('every disabled button explains why', () => {
    expect(stormSkipButtonLabel(stormSkipStatus({ phase: 'calm', wallL: FULL, insideShelter: true }))).toMatch(/no solar storm/);
    expect(stormSkipButtonLabel(stormSkipStatus({ phase: 'active', wallL: FULL, insideShelter: false }))).toMatch(/inside the shelter/);
    expect(stormSkipButtonLabel(stormSkipStatus({ phase: 'active', wallL: FULL, insideShelter: true }))).toMatch(/time runs fast/);
  });
});

describe('storm fast wait: how far the clock runs (issue #228)', () => {
  const storm = makeStorm({ index: 0, sep: { id: 'test' }, warningStart: 10, leadHours: 0.5 });

  it('runs to the end of the storm, never past the calm that follows', () => {
    expect(stormSkipHours(storm.end, storm.arrival)).toBeCloseTo(STORM_CONFIG.DURATION_HOURS + STORM_SKIP_CONFIG.END_MARGIN_HOURS);
    // Do aviso: atravessa o aviso e a tempestade inteira
    expect(stormSkipHours(storm.end, storm.warningStart)).toBeCloseTo(0.5 + STORM_CONFIG.DURATION_HOURS + STORM_SKIP_CONFIG.END_MARGIN_HOURS);
    expect(stormSkipHours(storm.end, storm.end + 1)).toBe(0);
    expect(STORM_SKIP_CONFIG.END_MARGIN_HOURS).toBeLessThan(STORM_CONFIG.GAP_BETWEEN_STORMS_HOURS);
  });

  it('the storm is lived, not cancelled: every step of it happens, and the clock stops in the calm', () => {
    let hours = storm.warningStart + 0.1;
    const phases = new Set<string>();
    const world = {
      step(h: number) {
        hours += h;
        phases.add(stormStateAt([storm], hours).phase);
        return null;
      },
    };
    const session = createSleepSession(stormSkipHours(storm.end, hours));
    // Um quadro so anda o que a taxa permite
    advanceSleep(session, STORM_SKIP_CONFIG.CLOCK_HOURS_PER_SECOND / 60, world, STORM_SKIP_CONFIG.STEP_HOURS);
    expect(session.done).toBe(false);
    advanceSleep(session, 100, world, STORM_SKIP_CONFIG.STEP_HOURS);
    expect(session.done).toBe(true);
    expect(phases.has('warning')).toBe(true);
    expect(phases.has('active')).toBe(true);
    expect(stormStateAt([storm], hours).phase).toBe('calm');
    expect(hours).toBeCloseTo(storm.end + STORM_SKIP_CONFIG.END_MARGIN_HOURS);
  });

  it('a problem in the base stops the wait at that step, with the storm still on', () => {
    let hours = storm.arrival;
    const world = { step(h: number) { hours += h; return hours > storm.arrival + 0.05 ? 'battery' : null; } };
    const session = createSleepSession(stormSkipHours(storm.end, hours));
    advanceSleep(session, 100, world, STORM_SKIP_CONFIG.STEP_HOURS);
    expect(session.wakeReason).toBe('battery');
    expect(stormStateAt([storm], hours).phase).toBe('active');
  });

  it('is faster than the normal clock, in steps small enough to sample the storm many times', () => {
    expect(STORM_SKIP_CONFIG.CLOCK_HOURS_PER_SECOND).toBeGreaterThan(MISSION_CONFIG.GAME_HOURS_PER_SECOND);
    expect(STORM_CONFIG.DURATION_HOURS / STORM_SKIP_CONFIG.STEP_HOURS).toBeGreaterThanOrEqual(5);
  });
});

describe('storm fast wait: nothing is free (issue #228)', () => {
  it('hunger and thirst are the same as waiting on the normal clock', () => {
    const seconds = 1 / MISSION_CONFIG.GAME_HOURS_PER_SECOND;
    const cost = stormSkipNeedsCost(1);
    expect(cost.food).toBeCloseTo(seconds * SURVIVAL_CONFIG.FOOD_DRAIN_RATE);
    expect(cost.water).toBeCloseTo(seconds * SURVIVAL_CONFIG.WATER_DRAIN_RATE);
    expect(stormSkipNeedsCost(0)).toEqual({ food: 0, water: 0 });
    expect(stormSkipNeedsCost(-1)).toEqual({ food: 0, water: 0 });
  });

  it('the end card tells how long it took and what the battery paid', () => {
    expect(stormSkipSummary({ waitedHours: 0.6, batteryBefore: 62, batteryAfter: 55.4 }))
      .toBe('The solar storm is over. You waited 36 min of game time behind the water wall. Battery 62% -> 55%.');
    expect(stormSkipSummary({ waitedHours: 0.1, batteryBefore: 5, batteryAfter: 0, stop: 'battery' })).toMatch(/^The battery ran out/);
  });
});
