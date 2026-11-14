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
    const survival = { ...player(), water: 10, food: 5 };
    expect(station.plant(type, survival)).toMatch(/Planted/);
    expect(survival.water).toBe(8);
    mission.greenhousePowered = false;
    station.update(60, true, survival, false);
    expect(station.crop.progress).toBe(0);
    mission.greenhousePowered = true;
    station.update(60, true, survival, false);
    expect(station.harvest(survival)).toMatch(/Harvested/);
    expect(survival.food).toBeGreaterThan(5);
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
