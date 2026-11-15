// @ts-nocheck
import { SurvivalSystem } from '../player/SurvivalSystem.ts';
import { BLOCK_IDS, CROP_ITEM_IDS } from '../config/blockTypes.ts';
import { CROP_CONFIG, SCIENCE_CONFIG, STATION_CONFIG, TIME_SCALE_CONFIG, WATER_SYSTEM_CONFIG, CREW_CONFIG } from '../config/constants.ts';
import { describe, it, expect } from 'vitest';
import { ExpeditionState } from './ExpeditionState.ts';
import { StationSystem } from './StationSystem.ts';
import { GREENHOUSE_PLOTS } from '../world/greenhouseLayout.ts';
import { SAMPLE_TYPES } from '../data/sampleTypes.ts';

const player = () => ({ health: 20, maxStat: 20, takeDamage(amount) { this.health = Math.max(0, this.health - amount); } });
describe('base stations', () => {
  it('requires cleaning after an EVA and does not dirty a cleaned suit inside the airlock', () => {
    const station = new StationSystem(new ExpeditionState());
    station.update(1, false, player(), true);
    expect(station.dirtySuit).toBe(true);
    station.cleanSuit();
    station.update(1, false, player(), false);
    expect(station.dirtySuit).toBe(false);
    station.update(1, true, player(), false);
    expect(station.contaminated).toBe(false);
    station.update(1, false, player(), true);
    station.update(1, true, player(), false);
    expect(station.contaminated).toBe(true);
  });
  it('builds CO2 with a worn filter and stops the increase after maintenance', () => {
    const station = new StationSystem(new ExpeditionState());
    station.filter = 0;
    station.update(10, true, player(), false);
    const before = station.co2;
    expect(before).toBeGreaterThan(0);
    station.replaceFilter();
    station.update(1, true, player(), false);
    expect(station.co2).toBeLessThan(before);
  });
  it('charges for exercise and messages', () => {
    const mission = new ExpeditionState();
    const station = new StationSystem(mission);
    const before = mission.energy;
    station.exercise(); station.send();
    expect(mission.energy).toBeLessThan(before);
    expect(station.messageTimer).toBeGreaterThan(0);
  });
  it('decays bone density and muscle strength over time and restores them via treadmill and bike workouts', () => {
    const mission = new ExpeditionState();
    const station = new StationSystem(mission);
    station.update(1000, true, player(), false);
    expect(station.boneDensity).toBeLessThan(100);
    expect(station.muscleStrength).toBeLessThan(100);

    const boneBefore = station.boneDensity;
    expect(station.exercise('treadmill')).toMatch(/treadmill/i);
    expect(station.boneDensity).toBeGreaterThan(boneBefore);

    station.muscleStrength = 40;
    expect(station.exercise('bike')).toMatch(/Cycle ergometer/i);
    expect(station.muscleStrength).toBeGreaterThan(40);
  });
});

describe('greenhouse and science progression', () => {
  it('lets the greenhouse worker harvest ripe plots periodically and keeps uncollected food in baskets', () => {
    const station = new StationSystem(new ExpeditionState());
    station.plots[1].crop = { type: 'potato', progress: CROP_CONFIG.potato.seconds };
    station.plots[2].crop = { type: 'soy', progress: 0 };
    const interval = CREW_CONFIG.GREENHOUSE_HARVEST_INTERVAL;
    station.updateCrewHarvest(interval, false);
    expect(station.plots[1].crop).not.toBeNull();
    station.updateCrewHarvest(interval - 1, true);
    expect(station.harvestBaskets.potato).toBe(0);
    station.updateCrewHarvest(1, true);
    expect(station.harvestBaskets.potato).toBe(GREENHOUSE_PLOTS[1].yield);
    expect(station.plots[1].crop).toBeNull();
    expect(station.plots[2].crop).not.toBeNull();
    let capacity = 1;
    const survival = { addBlockToInventory: id => id === CROP_ITEM_IDS.potato && capacity-- > 0 };
    expect(station.collectBasket('potato', survival)).toMatch(/rest is in the basket/);
    expect(station.harvestBaskets.potato).toBe(GREENHOUSE_PLOTS[1].yield - 1);
    expect(station.collectBasket('potato', survival)).toMatch(/full/i);
  });
  it.each(['potato', 'lettuce', 'soy'])('grows %s with power and harvests fresh food', type => {
    // Acelerado pela excecao declarada (issue #229): proporcional aos dias reais, e ainda em segundos
    expect(CROP_CONFIG[type].seconds).toBe(Math.round(CROP_CONFIG[type].realDays / TIME_SCALE_CONFIG.CROP_REAL_DAYS_PER_GAME_SECOND));
    expect(CROP_CONFIG[type].seconds).toBeLessThanOrEqual(20);
    const mission = new ExpeditionState();
    const station = new StationSystem(mission);
    const survival = new SurvivalSystem();
    survival.baseWater = 100; survival.water = 7; survival.food = 5;
    expect(station.plant(type, survival)).toMatch(/Planted/);
    // Plantar nao gasta a sede do jogador, e a planta ainda nao bebeu nada
    expect(survival.water).toBe(7);
    expect(survival.baseWater).toBe(100);
    mission.greenhousePowered = false;
    station.update(60, true, survival, false);
    expect(station.crop.progress).toBe(0);
    expect(survival.baseWater).toBe(100);
    mission.greenhousePowered = true;
    station.update(CROP_CONFIG[type].seconds, true, survival, false);
    // Crescendo, o tanque da base cai pelo custo mostrado no painel
    expect(survival.baseWater).toBeCloseTo(100 - CROP_CONFIG[type].water);
    expect(survival.water).toBe(7);
    expect(station.harvest(survival)).toMatch(/Harvested/);
    expect(survival.food).toBe(5);
    expect(survival.countItem(CROP_ITEM_IDS[type])).toBe(1);
    expect(station.crop).toBeNull();
  });
  it('analyzes a regolith sample collected outside, paying the rock and power', () => {
    const mission = new ExpeditionState();
    const station = new StationSystem(mission);
    const survival = new SurvivalSystem();
    survival.inventorySlots.fill(null);
    expect(station.analyzeSample(survival)).toMatch(/Nothing to analyze/);
    station.samples = 1;
    expect(station.analyzeSample(survival)).toMatch(/Collect regolith/);
    survival.addBlockToInventory(BLOCK_IDS.REGOLITH);
    expect(station.rawSampleCount(survival)).toBe(1);
    const before = mission.energy;
    expect(station.analyzeSample(survival)).toMatch(/\+1 science point/);
    expect(station.analyzedSamples).toBe(1);
    expect(station.samples).toBe(0);
    expect(station.analyzed[0]).toMatchObject({ typeId: 'regolith', points: SCIENCE_CONFIG.REGOLITH_POINTS });
    expect(survival.countItem(BLOCK_IDS.REGOLITH)).toBe(0);
    expect(mission.energy).toBeCloseTo(before - SCIENCE_CONFIG.ANALYZE_POWER_COST);
  });
  it('counts plain regolith only once, so exploring the map is worth it (issue #270)', () => {
    const mission = new ExpeditionState();
    const station = new StationSystem(mission);
    const survival = new SurvivalSystem();
    survival.inventorySlots.fill(null);
    station.samples = 2;
    survival.addBlockToInventory(BLOCK_IDS.REGOLITH);
    survival.addBlockToInventory(BLOCK_IDS.REGOLITH);
    station.analyzeSample(survival);
    const before = mission.energy;
    expect(station.analyzeSample(survival)).toMatch(/already studied plain regolith/);
    expect(station.analyzedSamples).toBe(1);
    expect(station.rawSampleCount(survival)).toBe(0);
    expect(mission.energy).toBe(before);
    for (const type of SAMPLE_TYPES) expect(type.points).toBeGreaterThan(SCIENCE_CONFIG.REGOLITH_POINTS);
  });
  it('analyzes map samples first, best one first, and remembers the type for its fact card', () => {
    const mission = new ExpeditionState();
    const station = new StationSystem(mission);
    const survival = new SurvivalSystem();
    survival.inventorySlots.fill(null);
    const [sand, , sulfur] = SAMPLE_TYPES;
    expect(survival.addBlockToInventory(sand.itemId)).toBe(true);
    expect(survival.addBlockToInventory(sulfur.itemId)).toBe(true);
    expect(station.rawSampleCount(survival)).toBe(2);
    const before = mission.energy;
    expect(station.analyzeSample(survival)).toMatch(new RegExp(`\\+${sulfur.points} science points`));
    expect(station.lastAnalyzedType).toBe(sulfur);
    expect(survival.countItem(sulfur.itemId)).toBe(0);
    expect(mission.energy).toBeCloseTo(before - SCIENCE_CONFIG.ANALYZE_POWER_COST);
    station.analyzeSample(survival);
    expect(station.analyzed.map((sample) => sample.typeId)).toEqual([sulfur.id, sand.id]);
    expect(station.rawSampleCount(survival)).toBe(0);
  });
  it('keeps map samples in the bag: they cannot be placed or dropped', () => {
    const survival = new SurvivalSystem();
    survival.inventorySlots.fill(null);
    survival.slots = survival.inventorySlots.slice(0, 9);
    survival.addBlockToInventory(SAMPLE_TYPES[0].itemId);
    expect(survival.useBlockFromSlot(0)).toBe(false);
    expect(survival.countItem(SAMPLE_TYPES[0].itemId)).toBe(1);
  });
  it('pays lab upgrades with science points that were not sent to Earth', () => {
    const station = new StationSystem(new ExpeditionState());
    expect(station.upgrade(() => 0)).toMatch(/Not enough science points/);
    expect(station.upgraded).toBe(false);
    const asked = [];
    expect(station.upgrade((cost) => { asked.push(cost); return cost; })).toMatch(/Suit upgrade installed/);
    expect(station.upgradeTool((cost) => { asked.push(cost); return cost; })).toMatch(/Tool upgraded/);
    expect(asked).toEqual([SCIENCE_CONFIG.SUIT_UPGRADE_POINTS, SCIENCE_CONFIG.TOOL_UPGRADE_POINTS]);
    expect(station.upgrade(() => 4)).toMatch(/already installed/);
  });
  it('refuses to analyze without power and keeps the sample', () => {
    const mission = new ExpeditionState();
    mission.battery.charge = 0;
    const station = new StationSystem(mission);
    const survival = new SurvivalSystem();
    survival.inventorySlots.fill(null);
    survival.addBlockToInventory(BLOCK_IDS.REGOLITH);
    station.samples = 1;
    expect(station.analyzeSample(survival)).toBe('Not enough power.');
    expect(station.analyzedSamples).toBe(0);
    expect(survival.countItem(BLOCK_IDS.REGOLITH)).toBe(1);
  });
  it('has no dead MAV transmission left: the science package goes through the mission radio', () => {
    const station = new StationSystem(new ExpeditionState());
    expect(station.sendMav).toBeUndefined();
    expect(station.mavSent).toBeUndefined();
  });
  it('does not grow a crop in a contaminated base', () => {
    const mission = new ExpeditionState();
    const station = new StationSystem(mission);
    const survival = { ...player(), baseWater: 100, graywater: 0, food: 5 };
    station.plant('soy', survival);
    mission.greenhousePowered = true;
    station.contaminated = true;
    station.update(60, true, survival, false);
    expect(station.crop.progress).toBe(0);
    expect(survival.baseWater).toBe(100);
  });
});

describe('garden choices and discoveries', () => {
  it('does not charge water or replace a crop when planting fails', () => {
    const mission = new ExpeditionState();
    const station = new StationSystem(mission);
    const survival = { ...player(), baseWater: 100, graywater: 0, food: 0 };
    mission.energy = 0;
    station.plant('soy', survival);
    expect(survival.baseWater).toBe(100);
    expect(station.crop).toBeNull();
    mission.energy = 100;
    station.plant('lettuce', survival);
    const energy = mission.energy;
    station.plant('soy', survival);
    expect(mission.energy).toBe(energy);
    expect(station.crop.type).toBe('lettuce');
  });
  it('unlocks discoveries only after paid crops finish, and tracks distinct harvests', () => {
    const mission = new ExpeditionState();
    const station = new StationSystem(mission);
    const survival = new SurvivalSystem();
    survival.baseWater = 200; survival.food = 0;
    for (const type of ['lettuce', 'potato', 'soy']) {
      station.plant(type, survival);
      station.harvest(survival);
      expect(station.crop).not.toBeNull();
      mission.greenhousePowered = true;
      station.update(CROP_CONFIG[type].seconds, true, survival, false);
      station.harvest(survival);
    }
    expect(station.cropCollection.size).toBe(3);
    expect(station.harvestCount).toBe(3);
    expect(station.discoveryIndex).toBe(2);
  });
});

it('keeps a ripe crop when the inventory is full and drops the right item when harvesting to the world', () => {
  const station = new StationSystem(new ExpeditionState());
  const survival = new SurvivalSystem();
  survival.inventorySlots.fill({ id: 1, count: 64 });
  station.crop = { type: 'soy', progress: CROP_CONFIG.soy.seconds };
  expect(station.harvest(survival)).toMatch(/full/);
  expect(station.crop.type).toBe('soy');
  expect(station.harvestCount).toBe(0);
  let dropped;
  station.harvest(survival, id => { dropped = id; });
  expect(dropped).toBe(CROP_ITEM_IDS.soy);
  expect(station.crop).toBeNull();
  expect(station.harvestCount).toBe(1);
});

describe('greenhouse fields', () => {
  const setup = () => {
    const mission = new ExpeditionState();
    const station = new StationSystem(mission);
    const survival = new SurvivalSystem();
    survival.baseWater = 200;
    mission.greenhousePowered = true;
    return { mission, station, survival };
  };

  it('every field of the plantation can hold its own crop at the same time', () => {
    const { station, survival } = setup();
    expect(station.plots).toHaveLength(GREENHOUSE_PLOTS.length);
    station.selectPlot(0);
    station.plant('lettuce', survival);
    station.selectPlot(1);
    expect(station.crop).toBeNull();
    expect(station.plant('potato', survival)).toMatch(/Planted/);
    expect(station.plots[0].crop.type).toBe('lettuce');
    expect(station.plots[1].crop.type).toBe('potato');
    expect(station.plantedPlotCount()).toBe(2);

    station.update(CROP_CONFIG.lettuce.seconds, true, survival, false);
    expect(station.readyPlotCount()).toBe(1);
    expect(station.hasGrowingCrops()).toBe(true);
  });

  it('a bigger field costs more water and power and gives more meals', () => {
    const { mission, station, survival } = setup();
    const outer = GREENHOUSE_PLOTS.findIndex((plot) => plot.kind === 'outer');
    const size = GREENHOUSE_PLOTS[outer].yield;
    expect(size).toBeGreaterThan(1);
    const energyBefore = mission.energy;
    station.selectPlot(outer);
    station.plant('lettuce', survival);
    expect(energyBefore - mission.energy).toBeCloseTo(CROP_CONFIG.lettuce.energy * size);

    station.update(CROP_CONFIG.lettuce.seconds, true, survival, false);
    expect(survival.baseWater).toBeCloseTo(200 - CROP_CONFIG.lettuce.water * size);
    const dropped = [];
    station.harvest(survival, (id) => dropped.push(id));
    expect(dropped).toEqual(Array(size).fill(CROP_ITEM_IDS.lettuce));
    expect(station.crop).toBeNull();
  });

  it('refuses a big field when the water is not enough, and takes nothing', () => {
    const { mission, station, survival } = setup();
    survival.baseWater = 20;
    const energyBefore = mission.energy;
    station.selectPlot(GREENHOUSE_PLOTS.findIndex((plot) => plot.kind === 'outer'));
    expect(station.plant('soy', survival)).toMatch(/water/);
    expect(survival.baseWater).toBe(20);
    expect(mission.energy).toBe(energyBefore);
    expect(station.crop).toBeNull();
  });
});

describe('greenhouse water (issue #101)', () => {
  const setup = (baseWater = 200) => {
    const mission = new ExpeditionState();
    const station = new StationSystem(mission);
    const survival = new SurvivalSystem();
    survival.baseWater = baseWater;
    mission.greenhousePowered = true;
    return { mission, station, survival };
  };

  it('uses no water at all while nothing is planted', () => {
    const { station, survival } = setup();
    station.update(600, true, survival, false);
    expect(survival.baseWater).toBe(200);
    expect(survival.graywater).toBe(0);
    expect(station.cropsThirsty).toBe(false);
  });

  it('stops drinking once the crop is ready', () => {
    const { station, survival } = setup();
    station.plant('potato', survival);
    station.update(CROP_CONFIG.potato.seconds, true, survival, false);
    const afterGrowth = survival.baseWater;
    station.update(600, true, survival, false);
    expect(survival.baseWater).toBe(afterGrowth);
  });

  it('after a full cycle with the recycler running, only the water left in the food is lost', () => {
    const { station, survival } = setup();
    const liters = CROP_CONFIG.soy.water;
    const keptInFood = liters * (1 - WATER_SYSTEM_CONFIG.CROP_WATER_RETURN);
    station.plant('soy', survival);
    station.update(CROP_CONFIG.soy.seconds, true, survival, false);
    expect(station.harvest(survival)).toMatch(/Harvested/);
    // A agua transpirada espera o reciclador como agua cinza; nada some alem da que ficou na comida
    expect(survival.graywater).toBeCloseTo(liters - keptInFood);
    expect(survival.baseWater + survival.graywater).toBeCloseTo(200 - keptInFood);
    // O reciclador devolve a agua cinza com a taxa da Estacao Espacial (98 %)
    const recycled = survival.graywater * STATION_CONFIG.WATER_RECOVERY;
    expect(survival.baseWater + recycled).toBeCloseTo(200 - keptInFood - (liters - keptInFood) * (1 - STATION_CONFIG.WATER_RECOVERY));
  });

  it('an empty tank pauses the fields until water comes back', () => {
    const { station, survival } = setup(30);
    const outer = GREENHOUSE_PLOTS.findIndex((plot) => plot.kind === 'outer');
    station.selectPlot(outer);
    expect(station.plant('lettuce', survival)).toMatch(/Planted/); // 10 L x 3 = 30 L
    survival.baseWater = 15; // alguem bebeu a agua antes de a planta crescer
    station.update(CROP_CONFIG.lettuce.seconds, true, survival, false);
    expect(survival.baseWater).toBeCloseTo(0);
    expect(station.cropsThirsty).toBe(true);
    expect(station.readyPlotCount()).toBe(0);
    const stuck = station.crop.progress;
    expect(stuck).toBeCloseTo(CROP_CONFIG.lettuce.seconds / 2);
    station.update(60, true, survival, false);
    expect(station.crop.progress).toBeCloseTo(stuck);

    survival.addBaseWater(100);
    station.update(CROP_CONFIG.lettuce.seconds, true, survival, false);
    expect(station.cropsThirsty).toBe(false);
    expect(station.readyPlotCount()).toBe(1);
  });

  it('is paused by missing light, not by thirst, when the lights are off', () => {
    const { mission, station, survival } = setup(0);
    station.crop = { type: 'lettuce', progress: 0 };
    station.update(1, true, survival, false);
    expect(station.cropsThirsty).toBe(true);
    mission.greenhousePowered = false;
    station.update(1, true, survival, false);
    expect(station.cropsThirsty).toBe(false);
  });
});
