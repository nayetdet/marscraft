import { describe, it, expect } from 'vitest';
import { STATION_CONFIG } from '../config/constants.js';
import { Battery } from '../mission/energy.js';
import { Greenhouse, WaterRecycler, OxygenGenerator, createStations, problemText } from './stations.js';

function makeBase(overrides = {}) {
  return {
    battery: new Battery(100),
    water: 50,
    maxWater: 100,
    hydration: 100,
    food: 0,
    maxFood: 40,
    graywater: 0,
    ...overrides,
  };
}

describe('station maintenance', () => {
  it('breaks down slowly without an operator', () => {
    const station = new OxygenGenerator();
    const base = makeBase();
    station.update(2, 0, base);
    expect(station.health).toBeCloseTo(1 - 2 * STATION_CONFIG.DEGRADE_PER_HOUR);
    expect(station.operating).toBe(false);
    expect(base.battery.charge).toBe(100);
  });

  it('an operator repairs it and the work costs energy', () => {
    const station = new OxygenGenerator();
    station.health = 0.2;
    const base = makeBase();
    station.update(1, 1, base);
    expect(station.health).toBeCloseTo(0.2 + STATION_CONFIG.REPAIR_PER_HOUR);
    expect(station.operating).toBe(true);
    expect(base.battery.charge).toBeCloseTo(100 - STATION_CONFIG.WORK_ENERGY_PER_HOUR);
  });

  it('cannot work without power and keeps breaking down', () => {
    const station = new WaterRecycler();
    const base = makeBase({ battery: new Battery(0) });
    expect(station.canOperate(base)).toBe(false);
    station.update(1, 1, base);
    expect(station.operating).toBe(false);
    expect(station.health).toBeCloseTo(1 - STATION_CONFIG.DEGRADE_PER_HOUR);
    expect(station.problems(base)).toContain('no-power');
  });
});

describe('Greenhouse', () => {
  it('makes food only when operated and the plants have water', () => {
    const greenhouse = new Greenhouse();
    const base = makeBase();
    greenhouse.update(1, 1, base);
    expect(base.food).toBeCloseTo(STATION_CONFIG.GREENHOUSE_FOOD_PER_HOUR);

    const dry = makeBase({ hydration: STATION_CONFIG.GREENHOUSE_MIN_HYDRATION - 1 });
    greenhouse.update(1, 1, dry);
    expect(dry.food).toBe(0);
    expect(greenhouse.problems(dry)).toContain('no-water');

    const alone = makeBase();
    greenhouse.update(1, 0, alone);
    expect(alone.food).toBe(0);
  });

  it('does not overfill the food store', () => {
    const greenhouse = new Greenhouse();
    const base = makeBase({ food: 39.9 });
    greenhouse.update(1, 1, base);
    expect(base.food).toBe(40);
  });
});

describe('WaterRecycler', () => {
  it('turns used water back into clean water at 98%', () => {
    const recycler = new WaterRecycler();
    const base = makeBase({ graywater: 1, water: 10 });
    recycler.update(1, 1, base);
    expect(base.graywater).toBeCloseTo(0);
    expect(base.water).toBeCloseTo(10 + STATION_CONFIG.WATER_RECOVERY);
  });

  it('is limited by its rate and by the tank size', () => {
    const recycler = new WaterRecycler();
    const base = makeBase({ graywater: 100, water: 0 });
    recycler.update(1, 1, base);
    expect(base.graywater).toBeCloseTo(100 - STATION_CONFIG.WATER_RECYCLE_L_PER_HOUR);

    const full = makeBase({ graywater: 100, water: 99.5 });
    recycler.update(1, 1, full);
    expect(full.water).toBe(100);
  });

  it('warns when the tank is almost empty', () => {
    const recycler = new WaterRecycler();
    expect(recycler.problems(makeBase({ water: 1 }))).toContain('tank-low');
    expect(recycler.problems(makeBase({ water: 50 }))).toEqual([]);
  });
});

describe('OxygenGenerator', () => {
  it('saturated filters make oxygen cost more energy', () => {
    const generator = new OxygenGenerator();
    expect(generator.costMultiplier()).toBe(1);
    generator.health = 0;
    expect(generator.costMultiplier()).toBe(STATION_CONFIG.OXYGEN_MAX_COST_MULTIPLIER);
    generator.health = 0.4;
    expect(generator.problems(makeBase())).toContain('needs-care');
  });
});

describe('createStations and problemText', () => {
  it('creates one station of each kind with a readable message per problem', () => {
    const stations = createStations();
    expect(stations.map((s) => s.kind).sort()).toEqual(['greenhouse', 'oxygen', 'water']);
    for (const station of stations) {
      for (const problem of ['no-power', 'needs-care', 'no-water', 'tank-low']) {
        expect(problemText(station, problem)).toMatch(/\w/);
      }
    }
  });
});
