import { describe, it, expect } from 'vitest';
import { BLOCK_IDS } from '../config/blockTypes.js';
import { CREW_CONFIG, ENERGY_CONFIG, MISSION_CONFIG, STATION_CONFIG, UTILITY_CONFIG as U } from '../config/constants.js';
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

  it('heater cost follows the real InSight air: more at 05:00 (coldest) than at 20:00 of the same sol (issue #108)', () => {
    const { utility, mission } = setup();
    mission.lastHours = 24 + 5;
    const dawn = utility.heaterRatePerHour;
    mission.lastHours = 24 + 20;
    const evening = utility.heaterRatePerHour;
    mission.lastHours = 24 + 14;
    const afternoon = utility.heaterRatePerHour;
    expect(dawn).toBeGreaterThan(evening);
    expect(evening).toBeGreaterThan(afternoon);
    // Os dois valores antigos viram os extremos
    expect(dawn).toBeLessThanOrEqual(U.HEATER_NIGHT_PER_HOUR);
    expect(afternoon).toBeGreaterThanOrEqual(U.HEATER_DAY_PER_HOUR);
    // O painel mostra o mesmo gasto que o aquecedor tira da bateria
    mission.lastHours = 24 + 5;
    const heater = utility.loads().find(([name]) => name === 'Heater');
    expect(heater[1]).toBeCloseTo(dawn);
    const before = mission.battery.charge;
    utility.update(0.01);
    expect(before - mission.battery.charge).toBeCloseTo(dawn * 0.01);
  });

  it('a ration feeds you but empties the shared pantry; a fresh meal costs water, power and a carrot', () => {
    const { utility, survival, base, stations, items } = setup();
    utility.eatRation();
    expect(base.food).toBe(2);
    utility.cookMeal();
    expect(items[BLOCK_IDS.HYDRO_PLANT]).toBe(0);
    expect(survival.baseWater).toBe(10 - U.MEAL_WATER_L);
    // A agua de cozinhar entra no ciclo, como a de lavar (issue #101)
    expect(base.graywater).toBe(U.MEAL_WATER_L);
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
    expect(lights[1]).toBe(U.GREENHOUSE_LIGHTS_PER_HOUR);
    // O que o motor desconta em 1 hora de jogo (50 s reais) e o que o painel mostra
    const secondsPerGameHour = 1 / MISSION_CONFIG.GAME_HOURS_PER_SECOND;
    expect(secondsPerGameHour).toBe(50);
    expect(utility.greenhouseLightsCost(secondsPerGameHour)).toBeCloseTo(lights[1]);
    // O total do painel e a soma das linhas ligadas
    const total = loads.reduce((sum, [, rate, on]) => sum + (on ? rate : 0), 0);
    expect(total).toBeCloseTo(
      2 * CREW_CONFIG.OXYGEN_ENERGY_PER_HOUR + STATION_CONFIG.WORK_ENERGY_PER_HOUR
      + U.GREENHOUSE_LIGHTS_PER_HOUR + U.HEATER_DAY_PER_HOUR,
    );
  });

  it('the power room still works with a dead battery, so the player can shed load and recover (issue #79)', () => {
    const { utility, mission } = setup({ night: true, charge: 0 });
    utility.update(1);
    expect(utility.cold).toBe(true); // sem energia o aquecedor nao aquece
    // Cortar carga nao gasta energia: os interruptores respondem mesmo com 0 %
    expect(utility.toggle('heater')).toMatch(/Heater OFF/);
    expect(utility.toggle('lights')).toMatch(/lights OFF/);
    expect(utility.toggle('factory')).toMatch(/factory OFF/);
    expect(utility.heaterOn).toBe(false);
    expect(utility.greenhouseLightsOn).toBe(false);
    expect(mission.factoryOn).toBe(false);
    const used = utility.loads().reduce((sum, [, rate, on]) => sum + (on ? rate : 0), 0);
    expect(used).toBe(0);
    // O Sol volta e a bateria carrega de novo; os sistemas podem ser religados
    mission.battery.add(30);
    expect(utility.toggle('heater')).toMatch(/Heater ON/);
  });

  it('on the gentle first sol the base draws less and the panel shows what it really draws (issue #81)', () => {
    const { utility, mission } = setup({ night: true });
    utility.demandFactor = 0.6;
    utility.update(1);
    expect(mission.battery.charge).toBeCloseTo(80 - 0.6 * U.HEATER_NIGHT_PER_HOUR);
    const loads = Object.fromEntries(utility.loads({ crewSize: 2, operatingStations: 2 }).map(([name, rate]) => [name, rate]));
    expect(loads.Heater).toBeCloseTo(0.6 * U.HEATER_NIGHT_PER_HOUR);
    expect(loads['Greenhouse lights']).toBeCloseTo(0.6 * U.GREENHOUSE_LIGHTS_PER_HOUR);
    expect(loads['Crew air: water']).toBeCloseTo(0.6 * 2 * CREW_CONFIG.OXYGEN_ENERGY_PER_HOUR);
    expect(loads['Crew at work']).toBeCloseTo(0.6 * 2 * STATION_CONFIG.WORK_ENERGY_PER_HOUR);
    expect(utility.greenhouseLightsCost(1 / MISSION_CONFIG.GAME_HOURS_PER_SECOND)).toBeCloseTo(0.6 * U.GREENHOUSE_LIGHTS_PER_HOUR);
    // As escolhas do jogador custam o mesmo: so o consumo passivo e mais brando
    expect(loads['Radiation shield']).toBe(ENERGY_CONFIG.SHIELD_DRAIN_PER_HOUR);
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
