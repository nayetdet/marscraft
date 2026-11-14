import { SurvivalSystem } from '../player/SurvivalSystem.js';
import { CROP_ITEM_IDS } from '../config/blockTypes.js';
import { CROP_CONFIG } from '../config/constants.js';
import { describe, it, expect } from 'vitest';
import { MissionSystem } from './MissionSystem.js';
import { StationSystem } from './StationSystem.js';

const player = () => ({ health: 20, maxStat: 20 });
describe('base stations', () => {
  it('requires cleaning after an EVA and does not dirty a cleaned suit inside the airlock', () => {
    const station = new StationSystem(new MissionSystem());
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
    const station = new StationSystem(new MissionSystem());
    station.filter = 0;
    station.update(10, true, player(), false);
    const before = station.co2;
    expect(before).toBeGreaterThan(0);
    station.replaceFilter();
    station.update(1, true, player(), false);
    expect(station.co2).toBeLessThan(before);
  });
  it('charges for exercise and messages', () => {
    const mission = new MissionSystem();
    const station = new StationSystem(mission);
    const before = mission.energy;
    station.exercise(); station.send();
    expect(mission.energy).toBeLessThan(before);
    expect(station.messageTimer).toBeGreaterThan(0);
  });
  it('decays bone density and muscle strength over time and restores them via treadmill and bike workouts', () => {
    const mission = new MissionSystem();
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
  it.each(['potato', 'lettuce', 'soy'])('grows %s with power and harvests fresh food', type => {
    const mission = new MissionSystem();
    const station = new StationSystem(mission);
    const survival = new SurvivalSystem();
    survival.water = 10; survival.food = 5;
    expect(station.plant(type, survival)).toMatch(/Planted/);
    expect(survival.water).toBe(10 - CROP_CONFIG[type].water);
    mission.greenhousePowered = false;
    station.update(60, true, survival, false);
    expect(station.crop.progress).toBe(0);
    mission.greenhousePowered = true;
    station.update(CROP_CONFIG[type].seconds, true, survival, false);
    expect(station.harvest(survival)).toMatch(/Harvested/);
    expect(survival.food).toBe(5);
    expect(survival.countItem(CROP_ITEM_IDS[type])).toBe(1);
    expect(station.crop).toBeNull();
  });
  it('requires researched samples and delivers the MAV package only after the delay', () => {
    const station = new StationSystem(new MissionSystem());
    expect(station.sendMav()).toMatch(/Analyze/);
    station.analyzedSamples = 2;
    expect(station.sendMav()).toMatch(/transit/);
    expect(station.mavSent).toBe(false);
    station.update(40, true, player(), false);
    expect(station.mavSent).toBe(true);
  });
  it('does not grow a crop in a contaminated base', () => {
    const mission = new MissionSystem();
    const station = new StationSystem(mission);
    const survival = { ...player(), water: 10, food: 5 };
    station.plant('soy', survival);
    mission.greenhousePowered = true;
    station.contaminated = true;
    station.update(60, true, survival, false);
    expect(station.crop.progress).toBe(0);
  });
});

describe('garden choices and discoveries', () => {
  it('does not charge water or replace a crop when planting fails', () => {
    const mission = new MissionSystem();
    const station = new StationSystem(mission);
    const survival = { ...player(), water: 10, food: 0 };
    mission.energy = 0;
    station.plant('soy', survival);
    expect(survival.water).toBe(10);
    expect(station.crop).toBeNull();
    mission.energy = 100;
    station.plant('lettuce', survival);
    const energy = mission.energy;
    station.plant('soy', survival);
    expect(mission.energy).toBe(energy);
    expect(station.crop.type).toBe('lettuce');
  });
  it('unlocks discoveries only after paid crops finish, and tracks distinct harvests', () => {
    const mission = new MissionSystem();
    const station = new StationSystem(mission);
    const survival = new SurvivalSystem();
    survival.water = 20; survival.food = 0;
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
  const station = new StationSystem(new MissionSystem());
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
