// @ts-nocheck
import { describe, it, expect } from 'vitest';
import { MISSION_CONFIG, SLEEP_CONFIG, STORM_CONFIG } from '../config/constants.ts';
import { MissionSystem } from '../mission/MissionSystem.ts';
import {
  SLEEP_MODES,
  advanceSleep,
  awakeHoursAfterSleep,
  createSleepSession,
  hoursUntilSunrise,
  isNightHour,
  isTired,
  plannedSleepHours,
  sleepBlocker,
  sleepNeedsCost,
  wakeReason,
  wakeSummary,
} from './sleep.ts';

// CME com impacto direto em Marte 3 dias depois (3 horas de jogo de aviso)
const cmes = [{
  id: 'cme', startTime: '2026-11-05T20:00Z', speedKmS: 900,
  headedToMars: true, marsArrivalTime: '2026-11-08T20:00Z', isGlancingBlow: false,
}];

// Liga o sono puro a uma missao de verdade e as barras do jogador, como o GameEngine faz
function sleepingWorld({ startHours, food = 20, water = 20, batteryCharge = 80 }) {
  const mission = new MissionSystem({ cmes, startHours });
  mission.battery.charge = batteryCharge;
  const state = { hours: startHours, food, water, mission };
  state.step = (h) => {
    state.hours += h;
    const before = mission.events.length;
    mission.update(state.hours, { insideHabitat: true });
    const cost = sleepNeedsCost(h);
    state.food = Math.max(0, state.food - cost.food);
    state.water = Math.max(0, state.water - cost.water);
    return wakeReason({
      events: mission.events.slice(before).map((e) => e.type),
      food: state.food,
      water: state.water,
    });
  };
  return state;
}

describe('sleep schedule', () => {
  it('knows when it is night and how long until sunrise', () => {
    expect(isNightHour(21)).toBe(true);
    expect(isNightHour(3)).toBe(true);
    expect(isNightHour(12)).toBe(false);
    expect(hoursUntilSunrise(21)).toBe(9);
    expect(hoursUntilSunrise(2)).toBe(4);
    expect(hoursUntilSunrise(MISSION_CONFIG.SUNRISE_HOUR)).toBe(24);
  });

  it('sleeps until sunrise only at night; a nap is always 2 hours', () => {
    expect(plannedSleepHours(SLEEP_MODES.SUNRISE, 22)).toBe(8);
    expect(plannedSleepHours(SLEEP_MODES.SUNRISE, 12)).toBe(0);
    expect(plannedSleepHours(SLEEP_MODES.NAP, 12)).toBe(SLEEP_CONFIG.NAP_HOURS);
  });
});

describe('sleep cost', () => {
  it('hunger and thirst drop in proportion to the hours slept', () => {
    const one = sleepNeedsCost(1);
    const nine = sleepNeedsCost(9);
    expect(one.food).toBeGreaterThan(0);
    expect(one.water).toBeGreaterThan(0);
    expect(nine.food).toBeCloseTo(one.food * 9);
    expect(nine.water).toBeCloseTo(one.water * 9);
    expect(sleepNeedsCost(0)).toEqual({ food: 0, water: 0 });
  });

  it('sleeping until sunrise uses food and water for every hour of the night', () => {
    const world = sleepingWorld({ startHours: 21 });
    const session = createSleepSession(plannedSleepHours(SLEEP_MODES.SUNRISE, 21));
    // Sem tempestade na fila ate de manha: a primeira so avisa 1 h depois do inicio da fila
    world.mission.schedule = [];
    advanceSleep(session, 100, world);
    expect(session.wakeReason).toBe(null);
    expect(session.sleptHours).toBeCloseTo(9);
    expect(world.hours).toBeCloseTo(30); // 6h do sol seguinte
    expect(20 - world.food).toBeCloseTo(9 * SLEEP_CONFIG.FOOD_PER_HOUR);
    expect(20 - world.water).toBeCloseTo(9 * SLEEP_CONFIG.WATER_PER_HOUR);
  });

  it('the base keeps using power at night while the player sleeps', () => {
    const world = sleepingWorld({ startHours: 21 });
    world.mission.schedule = [];
    world.mission.shieldOn = true;
    const before = world.mission.battery.charge;
    advanceSleep(createSleepSession(4), 100, world);
    expect(world.mission.battery.charge).toBeLessThan(before);
  });

  it('lets the player sleep through the night when the battery is already empty', () => {
    const world = sleepingWorld({ startHours: 21, batteryCharge: 0 });
    world.mission.schedule = [];
    const session = createSleepSession(plannedSleepHours(SLEEP_MODES.SUNRISE, 21));

    advanceSleep(session, 100, world);

    expect(session.done).toBe(true);
    expect(session.wakeReason).toBe(null);
    expect(session.sleptHours).toBeCloseTo(9);
    expect(world.hours).toBeCloseTo(30); // 6 a.m.; the panels begin charging after sunrise
  });
});

describe('waking up early', () => {
  it('a storm warning in the middle of the night wakes the player before the storm arrives', () => {
    // Fila de tempestades comeca na hora 0: aviso na hora 1, chegada 3 h depois
    const world = sleepingWorld({ startHours: 0 });
    const storm = world.mission.schedule[0];
    expect(storm.warningStart).toBe(STORM_CONFIG.FIRST_WARNING_AFTER_HOURS);
    const session = createSleepSession(plannedSleepHours(SLEEP_MODES.SUNRISE, 0));
    expect(session.plannedHours).toBe(6);

    advanceSleep(session, 100, world);
    expect(session.wakeReason).toBe('storm');
    expect(session.done).toBe(true);
    // O relogio para no passo do aviso, nao no fim do sono
    expect(world.hours).toBeGreaterThanOrEqual(storm.warningStart);
    expect(world.hours).toBeLessThan(storm.warningStart + SLEEP_CONFIG.STEP_HOURS + 1e-9);
    expect(world.hours).toBeLessThan(storm.arrival);
    expect(world.mission.storm.phase).toBe('warning');
  });

  it('stops the clock at the event even when many steps run in one frame', () => {
    let hours = 0;
    const world = { step: (h) => { hours += h; return hours >= 2.5 - 1e-9 ? 'battery' : null; } };
    const session = createSleepSession(9);
    advanceSleep(session, 1, world); // um quadro
    expect(session.done).toBe(false);
    expect(hours).toBeCloseTo(1);
    advanceSleep(session, 100, world);
    expect(session.wakeReason).toBe('battery');
    expect(hours).toBeCloseTo(2.5);
    expect(session.sleptHours).toBeCloseTo(2.5);
  });

  it('does not wake for an empty battery, but still wakes for critical hazards', () => {
    expect(wakeReason({ batteryCharge: 0 })).toBe(null);
    expect(wakeReason({ baseBreached: true })).toBe('breach');
    expect(wakeReason({ crewAlert: true })).toBe('crew');
    expect(wakeReason({ food: SLEEP_CONFIG.WAKE_NEED_LEVEL })).toBe('hungry');
    expect(wakeReason({ water: SLEEP_CONFIG.WAKE_NEED_LEVEL - 1 })).toBe('thirsty');
    expect(wakeReason({ events: ['storm-start'] })).toBe('storm');
    expect(wakeReason({ events: ['propellant-full'], batteryCharge: 50, food: 20, water: 20 })).toBe(null);
  });

  it('a hungry sleeper wakes up early with the clock stopped there', () => {
    const world = sleepingWorld({ startHours: 21, food: 8 });
    world.mission.schedule = [];
    const session = createSleepSession(9);
    advanceSleep(session, 100, world);
    expect(session.wakeReason).toBe('hungry');
    expect(session.sleptHours).toBeLessThan(9);
    expect(world.food).toBeLessThanOrEqual(SLEEP_CONFIG.WAKE_NEED_LEVEL);
  });
});

describe('who can sleep', () => {
  const ok = { insideBase: true, baseOxygen: 100, batteryCharge: 50, food: 20, water: 20 };

  it('only inside the base with air', () => {
    expect(sleepBlocker(ok)).toBe(null);
    expect(sleepBlocker({ ...ok, insideBase: false })).toBe('outside');
    expect(sleepBlocker({ ...ok, baseBreached: true })).toBe('no-air');
    expect(sleepBlocker({ ...ok, baseOxygen: SLEEP_CONFIG.MIN_BASE_OXYGEN - 1 })).toBe('no-air');
  });

  it('not during a storm warning, with an alarm, or an empty stomach', () => {
    expect(sleepBlocker({ ...ok, stormPhase: 'warning' })).toBe('storm');
    expect(sleepBlocker({ ...ok, stormPhase: 'active' })).toBe('storm');
    expect(sleepBlocker({ ...ok, batteryCharge: 0 })).toBe(null);
    expect(sleepBlocker({ ...ok, alarm: true })).toBe('alarm');
    expect(sleepBlocker({ ...ok, food: 2 })).toBe('hungry');
    expect(sleepBlocker({ ...ok, water: 2 })).toBe('thirsty');
  });
});

describe('staying awake', () => {
  it('more than one sol awake makes the astronaut tired; sleep pays it back', () => {
    expect(isTired(SLEEP_CONFIG.TIRED_AFTER_HOURS)).toBe(false);
    expect(isTired(SLEEP_CONFIG.TIRED_AFTER_HOURS + 1)).toBe(true);
    expect(isTired(awakeHoursAfterSleep(30, 9))).toBe(false);
    expect(awakeHoursAfterSleep(30, 9)).toBe(3);
    expect(awakeHoursAfterSleep(30, 2)).toBe(24);
  });
});

describe('wake card', () => {
  it('is one line with the hours slept and the battery change', () => {
    expect(wakeSummary({ sleptHours: 7, batteryBefore: 62.4, batteryAfter: 41.2 }))
      .toBe('You slept 7 h. Battery 62% -> 41%.');
    expect(wakeSummary({ sleptHours: 1.5, batteryBefore: 50, batteryAfter: 48, reason: 'storm' }))
      .toBe('A solar storm warning woke you up! You slept 1 h 30 min. Battery 50% -> 48%.');
  });
});
