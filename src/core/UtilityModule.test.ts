// @ts-nocheck
import { describe, it, expect } from 'vitest';
import { BLOCK_IDS } from '../config/blockTypes.ts';
import { CREW_CONFIG, ENERGY_CONFIG, MISSION_CONFIG, STATION_CONFIG, UTILITY_CONFIG as U } from '../config/constants.ts';
import { Battery } from '../mission/energy.ts';
import { UtilityModule } from './UtilityModule.ts';

function setup({ night = false, charge = 80 } = {}) {
  const items = { [BLOCK_IDS.HYDRO_PLANT]: 1, [BLOCK_IDS.REGOLITH]: 3 };
  const survival = {
    maxStat: 20, food: 5, health: 10, baseWater: 10, maxBaseWater: 100,
    countItem: (id) => items[id] ?? 0,
    removeItems: (id, n) => { items[id] -= n; return n; },
  };
  const mission = { battery: new Battery(charge), chargeRate: night ? 0 : 10, factoryOn: true, iceStock: 0, propellant: 0, shieldOn: false };
  const stations = { filter: 100 };
  // Agua limpa e agua cinza no mesmo tanque do jogador, como em createBaseStock
  const base = {
    food: 3, graywater: 0,
    get water() { return survival.baseWater; },
    set water(liters) { survival.baseWater = liters; },
    get maxWater() { return survival.maxBaseWater; },
  };
  return { utility: new UtilityModule({ mission, survival, stations, base }), survival, mission, stations, base, items };
}

describe('north module (issue #56, part B)', () => {
  it('prepares rations only from harvested basket stock, with a cook and enough power', () => {
    const { utility, stations, base, mission } = setup();
    base.food = 0;
    base.maxFood = 2;
    stations.harvestBaskets = { potato: 1, lettuce: 1, soy: 0 };
    utility.updateRations(U.RATION_PREP_SECONDS, false);
    expect(base.food).toBe(0);
    expect(utility.updateRations(U.RATION_PREP_SECONDS, true)).toBe('potato');
    expect(base.food).toBe(1);
    expect(stations.harvestBaskets).toEqual({ potato: 0, lettuce: 1, soy: 0 });
    expect(mission.battery.charge).toBeCloseTo(80 - U.RATION_PREP_POWER);
    utility.eatRation();
    expect(utility.eatenRationCrop).toBe('potato');
    mission.battery.charge = 0;
    utility.updateRations(U.RATION_PREP_SECONDS, true);
    expect(stations.harvestBaskets.lettuce).toBe(1);
    expect(base.food).toBe(0);
  });
  it('heater costs more at night, and turning it off at night freezes the base', () => {
    const { utility, mission } = setup({ night: true });
    utility.update(1);
    expect(mission.battery.charge).toBeCloseTo(80 - U.HEATER_NIGHT_PER_HOUR);
    expect(utility.cold).toBe(false);
    utility.toggle('heater');
    utility.update(1);
    expect(utility.cold).toBe(true);
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

  it('takeRation puts a Space Ration into inventory and respects empty pantry and full inventory', () => {
    const { utility, survival, base } = setup();
    const added: number[] = [];
    let allowAdd = true;
    survival.addBlockToInventory = (id: number) => {
      if (!allowAdd) return false;
      added.push(id);
      return true;
    };

    base.food = 0;
    expect(utility.takeRation()).toMatchObject({ ok: false, reason: 'empty' });

    base.food = 2;
    allowAdd = false;
    expect(utility.takeRation()).toMatchObject({ ok: false, reason: 'full' });
    expect(base.food).toBe(2);

    allowAdd = true;
    utility.rationIngredients.push('soy');
    const res = utility.takeRation();
    expect(res).toMatchObject({ ok: true, crop: 'soy', remaining: 1 });
    expect(added).toEqual([BLOCK_IDS.RATION]);
    expect(base.food).toBe(1);
  });

  it('a ration feeds you but empties the shared pantry', () => {
    const { utility, base } = setup();
    utility.eatRation();
    expect(base.food).toBe(2);
  });

  // Ato 3 (#409): [F] no cozinheiro com planta na mochila, sem painel
  it('the cook turns one plant from your bag into one ration, for power and time', () => {
    const { utility, survival, mission, base, items } = setup();
    const added = [];
    let room = false;
    survival.addBlockToInventory = (id) => { if (room) added.push(id); return room; };
    items[BLOCK_IDS.LETTUCE] = 2;
    expect(utility.playerCrop()).toBe('lettuce');

    const start = utility.startPlayerRation();
    expect(start).toMatchObject({ ok: true, crop: 'lettuce' });
    expect(items[BLOCK_IDS.LETTUCE]).toBe(1);
    expect(mission.battery.charge).toBeCloseTo(80 - U.RATION_PREP_POWER);
    expect(base.food).toBe(3); // a despensa da tripulacao nao muda
    expect(utility.startPlayerRation()).toMatchObject({ ok: false, reason: 'busy' });
    expect(items[BLOCK_IDS.LETTUCE]).toBe(1);

    expect(utility.updatePlayerRation(U.RATION_PREP_SECONDS / 2)).toBeNull();
    expect(utility.playerRationSecondsLeft).toBeCloseTo(U.RATION_PREP_SECONDS / 2);
    // Pronta com a mochila cheia: espera ate caber, sem perder a racao
    expect(utility.updatePlayerRation(U.RATION_PREP_SECONDS)).toBeNull();
    expect(utility.playerRationsMade).toBe(0);
    room = true;
    expect(utility.updatePlayerRation(0.016)).toBe('lettuce');
    expect(added).toEqual([BLOCK_IDS.RATION]);
    expect(utility.playerRationsMade).toBe(1);
    expect(utility.updatePlayerRation(1)).toBeNull();
  });

  it('the cook needs a plant and battery power: nothing is taken when one is missing', () => {
    const { utility, mission, items } = setup();
    // A cenoura de Marte que ja vem na mochila nao e planta colhida: o cozinheiro nao a pede
    expect(items[BLOCK_IDS.HYDRO_PLANT]).toBe(1);
    expect(utility.playerCrop()).toBeNull();
    expect(utility.startPlayerRation()).toMatchObject({ ok: false, reason: 'no-plant' });
    items[BLOCK_IDS.SOY] = 1;
    mission.battery.charge = 0;
    expect(utility.startPlayerRation()).toMatchObject({ ok: false, reason: 'power' });
    expect(items[BLOCK_IDS.SOY]).toBe(1);
    mission.battery.charge = 50;
    expect(utility.startPlayerRation()).toMatchObject({ ok: true, crop: 'soy' });
    expect(items[BLOCK_IDS.SOY]).toBe(0);
    expect(items[BLOCK_IDS.HYDRO_PLANT]).toBe(1);
    expect(mission.battery.charge).toBeCloseTo(50 - U.RATION_PREP_POWER);
  });

  it('the recycler cleans gray water by itself, gives back 98% and charges the battery per liter', () => {
    const { utility, survival, base, mission } = setup();
    utility.toggle('heater'); // aquecedor desligado de dia: so o reciclador gasta bateria
    base.graywater = 100;
    utility.update(1);
    const treated = STATION_CONFIG.WATER_RECYCLE_L_PER_HOUR;
    expect(base.graywater).toBeCloseTo(100 - treated);
    expect(survival.baseWater).toBeCloseTo(10 + treated * STATION_CONFIG.WATER_RECOVERY);
    expect(mission.battery.charge).toBeCloseTo(80 - treated * U.RECYCLER_POWER_PER_L);
    expect(utility.waterRecycledL).toBeCloseTo(treated * STATION_CONFIG.WATER_RECOVERY);
    // O painel de energia mostra o que o reciclador gasta
    const loads = Object.fromEntries(utility.loads().map(([name, rate]) => [name, rate]));
    expect(loads['Water recycler']).toBeCloseTo(treated * U.RECYCLER_POWER_PER_L);
  });

  it('the recycler stops with frozen pipes or an empty battery, and never overfills the tank', () => {
    // Canos congelados: aquecedor desligado de noite
    const frozen = setup({ night: true });
    frozen.utility.toggle('heater');
    frozen.base.graywater = 10;
    frozen.utility.update(1);
    expect(frozen.utility.cold).toBe(true);
    expect(frozen.base.graywater).toBe(10);
    expect(frozen.survival.baseWater).toBe(10);

    // Bateria vazia: nada e limpo e o painel mostra gasto zero
    const dead = setup({ charge: 0 });
    dead.utility.toggle('heater');
    dead.base.graywater = 10;
    dead.utility.update(1);
    expect(dead.base.graywater).toBe(10);
    expect(dead.utility.recyclerDrawPerHour).toBe(0);

    // Tanque quase cheio: so limpa o que cabe
    const full = setup();
    full.utility.toggle('heater');
    full.survival.baseWater = 99.5;
    full.base.graywater = 10;
    full.utility.update(1);
    expect(full.survival.baseWater).toBeCloseTo(100);
    expect(full.base.graywater).toBeGreaterThan(9);
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
});
