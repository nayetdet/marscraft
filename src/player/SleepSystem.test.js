import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SleepSystem } from './SleepSystem.js';
import { SLEEP_CONFIG } from '../config/constants.js';

describe('SleepSystem', () => {
  let engine;

  beforeEach(() => {
    engine = {
      survival: {
        insidePressurizedShip: true,
        baseBreached: false,
        food: 20,
        water: 20,
        health: 20,
        takeDamage: vi.fn(),
      },
      world: {
        brokenBaseWindows: new Set(),
      },
      mission: {
        battery: { level: 80 },
        storm: { phase: 'quiet' },
        update: vi.fn(),
      },
      sky: {
        timeOfDay: 22,
        solCount: 1,
        advanceTime: vi.fn(function (dt) {
          this.timeOfDay = (this.timeOfDay + dt) % 24;
        }),
        getFormattedTime: vi.fn(() => ({ clockText: 'Sol 1 — 22:00' })),
      },
      crew: {
        update: vi.fn(),
      },
      utility: {
        update: vi.fn(),
      },
      stations: {
        update: vi.fn(),
      },
      hud: {
        showToast: vi.fn(),
      },
      _skyHours: vi.fn(function () {
        return (this.sky.solCount - 1) * 24 + this.sky.timeOfDay;
      }),
    };
  });

  it('allows sleeping when inside a sealed, pressurized base', () => {
    const sleep = new SleepSystem(engine);
    const check = sleep.canSleep();
    expect(check.allowed).toBe(true);
  });

  it('refuses sleep when outside the habitat', () => {
    engine.survival.insidePressurizedShip = false;
    const sleep = new SleepSystem(engine);
    const check = sleep.canSleep();
    expect(check.allowed).toBe(false);
    expect(check.reason).toContain('Habitat unpressurized');
  });

  it('refuses sleep during a hull breach or broken windows', () => {
    engine.survival.baseBreached = true;
    const sleep = new SleepSystem(engine);
    expect(sleep.canSleep().allowed).toBe(false);

    engine.survival.baseBreached = false;
    engine.world.brokenBaseWindows.add('chunk_0_1');
    expect(sleep.canSleep().allowed).toBe(false);
  });

  it('refuses sleep during an active solar storm', () => {
    engine.mission.storm.phase = 'active';
    const sleep = new SleepSystem(engine);
    const check = sleep.canSleep();
    expect(check.allowed).toBe(false);
    expect(check.reason).toContain('active solar storm');
  });

  it('refuses sleep when life support battery is dead', () => {
    engine.mission.battery.level = 0;
    const sleep = new SleepSystem(engine);
    const check = sleep.canSleep();
    expect(check.allowed).toBe(false);
    expect(check.reason).toContain('offline');
  });

  it('calculates hours until sunrise correctly', () => {
    engine.sky.timeOfDay = 22; // Sunrise is at 6
    const sleep = new SleepSystem(engine);
    expect(sleep.getHoursUntilSunrise()).toBe(8);

    engine.sky.timeOfDay = 4;
    expect(sleep.getHoursUntilSunrise()).toBe(2);

    engine.sky.timeOfDay = 6;
    expect(sleep.getHoursUntilSunrise()).toBe(24);
  });

  it('tracks fatigue: fatigued after >24h awake, restored after sleep', () => {
    const sleep = new SleepSystem(engine);
    sleep.lastSleepSkyHours = 0;

    // 10 hours awake: not fatigued
    engine._skyHours = () => 10;
    expect(sleep.isFatigued).toBe(false);
    expect(sleep.getWorkSpeedMultiplier()).toBe(1.0);

    // 25 hours awake (>24h): fatigued!
    engine._skyHours = () => 25;
    expect(sleep.isFatigued).toBe(true);
    expect(sleep.getWorkSpeedMultiplier()).toBe(SLEEP_CONFIG.FATIGUE_SPEED_PENALTY);

    // After sleeping 2 hours: clears fatigue
    sleep.elapsedHours = 2.0;
    sleep.finishSleep();
    expect(sleep.lastSleepSkyHours).toBe(25);
    expect(sleep.isFatigued).toBe(false);
    expect(sleep.getWorkSpeedMultiplier()).toBe(1.0);
  });

  it('drains food and water during sleep and advances game systems', () => {
    const sleep = new SleepSystem(engine);
    sleep.startSleep(2.0); // 2 hour nap
    expect(sleep.isSleeping).toBe(true);

    // Simulate entire sleep animation in one step
    sleep.update(SLEEP_CONFIG.ANIMATION_DURATION_SEC);

    expect(sleep.isSleeping).toBe(false);
    expect(engine.survival.food).toBeCloseTo(20 - 2.0 * SLEEP_CONFIG.FOOD_DRAIN_PER_HOUR, 1);
    expect(engine.survival.water).toBeCloseTo(20 - 2.0 * SLEEP_CONFIG.WATER_DRAIN_PER_HOUR, 1);
    expect(engine.sky.advanceTime).toHaveBeenCalled();
    expect(engine.mission.update).toHaveBeenCalled();
    expect(engine.crew.update).toHaveBeenCalled();
    expect(engine.utility.update).toHaveBeenCalled();
  });

  it('interrupts sleep when a solar storm warning appears', () => {
    const sleep = new SleepSystem(engine);
    sleep.startSleep(8.0);

    // Midway through sleep, storm warning triggers
    engine.mission.storm.phase = 'warning';
    sleep.update(0.5);

    expect(sleep.isSleeping).toBe(false);
    expect(sleep.interrupted).toBe(true);
    expect(sleep.interruptReason).toContain('Solar storm warning');
  });

  it('interrupts sleep if the base power is completely depleted', () => {
    const sleep = new SleepSystem(engine);
    sleep.startSleep(8.0);

    engine.mission.battery.level = 0;
    sleep.update(0.5);

    expect(sleep.isSleeping).toBe(false);
    expect(sleep.interrupted).toBe(true);
    expect(sleep.interruptReason).toContain('Base power alert');
  });
});
