import { describe, it, expect } from 'vitest';
import { BLOCK_IDS } from '../config/blockTypes.js';
import { CREW_CONFIG, MISSION_CONFIG, STATION_CONFIG, UTILITY_CONFIG as U } from '../config/constants.js';
import { Battery } from '../mission/energy.js';
import { UtilityModule } from './UtilityModule.js';

function setup({ night = false, charge = 80 } = {}) {
  const items = { [BLOCK_IDS.HYDRO_PLANT]: 1, [BLOCK_IDS.REGOLITH]: 3 };
  const survival = {
    maxStat: 20, food: 5, health: 10, baseWater: 10, maxBaseWater: 100,
    countItem: (id) => items[id] ?? 0,
    removeItems: (id, n) => { items[id] -= n; return n; },
  };
  const mission = { battery: new Battery(charge), chargeRate: night ? 0 : 10, factoryOn: true, iceStock: 0, propellant: 0, shieldOn: false };
  const stations = { freshFood: 0, filter: 100 };
  const base = { food: 3, graywater: 0 };
  return { utility: new UtilityModule({ mission, survival, stations, base }), survival, mission, stations, base, items };
}

describe('north module (issue #56, part B)', () => {
  it('heater costs more at night, and turning it off at night freezes the base', () => {
    const { utility, mission } = setup({ night: true });
    utility.update(1);
    expect(mission.battery.charge).toBeCloseTo(80 - U.HEATER_NIGHT_PER_HOUR);
    expect(utility.cold).toBe(false);
    utility.toggle('heater');
    utility.update(1);
    expect(utility.cold).toBe(true);
    expect(utility.washUp()).toMatch(/frozen/);
  });

  it('a ration feeds you but empties the shared pantry; a fresh meal costs water, power and a carrot', () => {
    const { utility, survival, base, stations, items } = setup();
    utility.eatRation();
    expect(base.food).toBe(2);
    utility.cookMeal();
    expect(items[BLOCK_IDS.HYDRO_PLANT]).toBe(0);
    expect(survival.baseWater).toBe(10 - U.MEAL_WATER_L);
    expect(stations.freshFood).toBe(STATION_CONFIG.FRESH_FOOD_DURATION);
  });

  it('washing turns clean water into gray water and a worn filter recovers less', () => {
    const { utility, base } = setup();
    utility.washUp();
    expect(base.graywater).toBe(U.WASH_WATER_L);
    utility.waterFilter = 10;
    expect(utility.waterRecovery).toBeLessThan(STATION_CONFIG.WATER_RECOVERY);
  });

  it('the power panel shows the greenhouse lights at their real rate per game hour (issue #110)', () => {
    const { utility } = setup();
    const loads = utility.loads({ crewSize: 2, operatingStations: 1 });
    const lights = loads.find(([name]) => name === 'Greenhouse lights');
    expect(lights[1]).toBe(2.5);
    expect(lights[1]).toBe(U.GREENHOUSE_LIGHTS_PER_HOUR);
    // O que o motor desconta em 1 hora de jogo (100 s reais) e o que o painel mostra
    const secondsPerGameHour = 1 / MISSION_CONFIG.GAME_HOURS_PER_SECOND;
    expect(secondsPerGameHour).toBe(100);
    expect(utility.greenhouseLightsCost(secondsPerGameHour)).toBeCloseTo(lights[1]);
    // O total do painel e a soma das linhas ligadas
    const total = loads.reduce((sum, [, rate, on]) => sum + (on ? rate : 0), 0);
    expect(total).toBeCloseTo(
      2 * CREW_CONFIG.OXYGEN_ENERGY_PER_HOUR + STATION_CONFIG.WORK_ENERGY_PER_HOUR
      + U.GREENHOUSE_LIGHTS_PER_HOUR + U.HEATER_DAY_PER_HOUR,
    );
  });

  it('the 3D printer spends regolith and power to fix the most worn station', () => {
    const { utility, mission, items } = setup();
    const stations = [{ name: 'greenhouse', health: 0.9 }, { name: 'water recycler', health: 0.2 }];
    expect(utility.printPart(stations)).toMatch(/water recycler/);
    expect(stations[1].health).toBe(1);
    expect(items[BLOCK_IDS.REGOLITH]).toBe(0);
    expect(mission.battery.charge).toBe(80 - U.PRINT_POWER);
  });
});
