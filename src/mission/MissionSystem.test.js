import { describe, it, expect } from 'vitest';
import { MissionSystem, mavProgress, oxygenPointsToKg } from './MissionSystem.js';
import { ENERGY_CONFIG, MAV_CONFIG } from '../config/constants.js';

const cmes = [{ id: 'cme', startTime: '2026-11-05T20:00Z', speedKmS: 900 }];

function createMission(startHours = 12) {
  return new MissionSystem({ cmes, startHours });
}

describe('mavProgress', () => {
  it('averages the three requirements and is ready only when all are done', () => {
    expect(mavProgress({ propellant: 0, stormsSurvived: 0, dataSent: false }).overallPct).toBe(0);
    const half = mavProgress({ propellant: 50, stormsSurvived: 0, dataSent: true });
    expect(half.overallPct).toBeCloseTo(50);
    expect(half.ready).toBe(false);
    expect(mavProgress({ propellant: 100, stormsSurvived: 3, dataSent: true }).ready).toBe(true);
  });
});

describe('MissionSystem energy', () => {
  it('charges in daylight and not at night', () => {
    const day = createMission(12);
    day.battery.charge = 10;
    day.update(13);
    expect(day.battery.charge).toBeGreaterThan(10);

    const night = createMission(0);
    night.battery.charge = 10;
    night.update(2);
    expect(night.battery.charge).toBe(10);
  });

  it('worn air filters (crew oxygen generator) make habitat oxygen cost more', () => {
    const mission = createMission(0);
    mission.battery.charge = 6;
    mission.oxygenCostMultiplier = 2;
    expect(mission.oxygenRefillBudget()).toBeCloseTo(6 / (2 * ENERGY_CONFIG.OXYGEN_COST_PER_POINT));
    mission.chargeOxygen(1);
    expect(mission.battery.charge).toBeCloseTo(6 - 2 * ENERGY_CONFIG.OXYGEN_COST_PER_POINT);
  });

  it('oxygen refill is limited by the battery and costs energy', () => {
    const mission = createMission(0);
    mission.battery.charge = 3;
    expect(mission.oxygenRefillBudget()).toBeCloseTo(3 / ENERGY_CONFIG.OXYGEN_COST_PER_POINT);
    mission.chargeOxygen(2);
    expect(mission.battery.charge).toBeCloseTo(0);
    expect(mission.oxygenProducedPoints).toBe(2);
  });

  it('the shield only lowers the dose of a player inside its bubble', () => {
    const mission = createMission(12);
    mission.battery.charge = 100;
    mission.update(12.1, { insideShield: true });
    const unshielded = mission.doseRate;
    mission.toggleShield();
    mission.update(12.2, { insideShield: true });
    expect(mission.doseRate).toBeLessThan(unshielded);
    mission.update(12.3, { insideShield: false });
    expect(mission.doseRate).toBeCloseTo(unshielded);
    expect(mission.insideShield).toBe(false);
  });

  it('the shield drains energy and turns itself off when the battery is empty', () => {
    const mission = createMission(0);
    mission.battery.charge = 5;
    mission.toggleShield();
    mission.update(2);
    expect(mission.shieldOn).toBe(false);
    expect(mission.drainEvents().some((e) => e.type === 'shield-off-no-energy')).toBe(true);
  });

  it('data upload costs energy and needs enough charge', () => {
    const mission = createMission(0);
    mission.battery.charge = ENERGY_CONFIG.DATA_UPLOAD_COST - 1;
    expect(mission.sendData()).toBe('no-energy');
    mission.battery.charge = 100;
    expect(mission.sendData()).toBe('sent');
    expect(mission.battery.charge).toBe(100 - ENERGY_CONFIG.DATA_UPLOAD_COST);
    expect(mission.sendData()).toBe('already-sent');
  });
});

describe('MissionSystem propellant', () => {
  it('turns delivered ice into propellant using energy', () => {
    const mission = createMission(0);
    mission.battery.charge = 100;
    expect(mission.deliverIce(2)).toBe(2);
    mission.update(2 * MAV_CONFIG.ISRU_HOURS_PER_ICE_BLOCK);
    expect(mission.propellant).toBeCloseTo(200 / MAV_CONFIG.ICE_BLOCKS_FOR_FULL_TANK);
    expect(mission.battery.charge).toBeLessThan(100);
  });

  it('stops without energy and when the factory is off', () => {
    const mission = createMission(0);
    mission.battery.charge = 0;
    mission.deliverIce(1);
    mission.update(1);
    expect(mission.propellant).toBe(0);

    mission.battery.charge = 100;
    mission.toggleFactory();
    mission.update(2);
    expect(mission.propellant).toBe(0);
  });

  it('does not accept more ice than the tank needs', () => {
    const mission = createMission(0);
    expect(mission.deliverIce(50)).toBe(MAV_CONFIG.ICE_BLOCKS_FOR_FULL_TANK);
    expect(mission.deliverIce(1)).toBe(0);
  });
});

describe('MissionSystem storms', () => {
  it('warns, starts, and counts a storm as survived when the player lives', () => {
    const mission = createMission(0);
    const storm = mission.schedule[0];
    mission.update(storm.warningStart + 0.01);
    expect(mission.drainEvents().map((e) => e.type)).toContain('storm-warning');

    mission.update(storm.arrival + 0.01, { insideHabitat: true });
    expect(mission.drainEvents().map((e) => e.type)).toContain('storm-start');
    expect(mission.doseRate).toBeGreaterThan(0.1);

    mission.update(storm.end + 0.01, { insideHabitat: true });
    expect(mission.drainEvents().map((e) => e.type)).toContain('storm-survived');
    expect(mission.stormsSurvived).toBe(1);
  });

  it('dying during the storm does not count', () => {
    const mission = createMission(0);
    const storm = mission.schedule[0];
    mission.update(storm.arrival + 0.01);
    mission.markDeath();
    mission.update(storm.end + 0.01);
    expect(mission.stormsSurvived).toBe(0);
    expect(mission.drainEvents().map((e) => e.type)).toContain('storm-failed');
  });

  it('a storm outside without shield hurts, and the dose adds up', () => {
    const mission = createMission(0);
    const storm = mission.schedule[0];
    mission.update(storm.arrival + 0.01);
    const damage = mission.update(storm.arrival + 0.51);
    expect(damage).toBeGreaterThan(0);
    expect(mission.totalDoseMsv).toBeGreaterThan(1);
  });

  it('a big time jump (T key) still goes through the storm', () => {
    const mission = createMission(0);
    mission.update(mission.schedule[0].end + 0.5, { insideHabitat: true });
    const types = mission.drainEvents().map((e) => e.type);
    expect(types).toEqual(expect.arrayContaining(['storm-warning', 'storm-start', 'storm-survived']));
  });

  it('paused time moves storms but does not add dose, and a paused storm does not count', () => {
    const mission = createMission(0);
    const storm = mission.schedule[0];
    const damage = mission.update(storm.end - 0.1, { active: false });
    expect(damage).toBe(0);
    expect(mission.totalDoseMsv).toBe(0);
    mission.update(storm.end + 0.1, { active: false });
    expect(mission.stormsSurvived).toBe(0);
    expect(mission.drainEvents().map((e) => e.type)).toContain('storm-missed');
  });
});

describe('MissionSystem launch', () => {
  it('ignites only when everything is ready', () => {
    const mission = createMission(0);
    expect(mission.ignite()).toBe(false);
    mission.propellant = 100;
    mission.stormsSurvived = 3;
    mission.dataSent = true;
    expect(mission.ignite()).toBe(true);
    expect(mission.launched).toBe(true);
  });
});

describe('oxygenPointsToKg', () => {
  it('one sol of breathing outside equals 0.84 kg of O2', () => {
    expect(oxygenPointsToKg(0.32 * 1200)).toBeCloseTo(0.84);
  });
});
