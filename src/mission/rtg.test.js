import { describe, it, expect } from 'vitest';
import { ENERGY_CONFIG } from '../config/constants.js';
import { Battery, smoothNetRate } from './energy.js';
import { MissionSystem } from './MissionSystem.js';
import { StationSystem } from '../core/StationSystem.js';
import { ExpeditionState } from '../core/ExpeditionState.js';

// Issue #85: baterias para a noite e um RTG que mantem so o suporte de vida
describe('RTG life support power', () => {
  it('pays life support from the RTG first, then from the battery', () => {
    const battery = new Battery(10);
    battery.addLifeSupportPower(1, 5);
    expect(battery.drainLifeSupport(3)).toBeCloseTo(3);
    expect(battery.lifeSupportCredit).toBe(0);
    expect(battery.charge).toBeCloseTo(8);
  });

  it('keeps only a small buffer: unused RTG power is lost, never charges the battery', () => {
    const battery = new Battery(0);
    battery.addLifeSupportPower(100, 0.5);
    expect(battery.lifeSupportCredit).toBe(0.5);
    expect(battery.charge).toBe(0);
    // Fabrica, blindagem e luzes gastam pelo `drain` normal: o RTG nao paga
    expect(battery.drain(1)).toBe(0);
  });

  it('keeps making the astronaut air all night with an empty battery', () => {
    const mission = new MissionSystem({ cmes: [], startHours: 18, stormsStarted: false });
    mission.battery.charge = 0;
    let refilled = 0;
    for (let h = 18; h < 30; h += 0.01) {
      mission.update(h);
      const budget = mission.oxygenRefillBudget();
      const points = Math.min(budget, 0.01);
      mission.chargeOxygen(points);
      refilled += points;
    }
    expect(mission.standby).toBe(true);
    expect(refilled).toBeGreaterThan(0);
    // Toda essa producao de ar veio do RTG: a bateria continua vazia ate o Sol voltar
    expect(mission.battery.charge).toBeLessThan(ENERGY_CONFIG.STANDBY_BELOW);
  });

  it('counts the hours spent on standby while playing', () => {
    const mission = new MissionSystem({ cmes: [], startHours: 20, stormsStarted: false });
    mission.battery.charge = 0;
    mission.update(22, { active: true });
    expect(mission.standbyHours).toBeCloseTo(2);
  });

  it('warns once before sunset with the battery charge', () => {
    const mission = new MissionSystem({ cmes: [], startHours: 15, stormsStarted: false });
    mission.update(17);
    const events = mission.drainEvents().filter((e) => e.type === 'sunset-soon');
    expect(events).toHaveLength(1);
    expect(events[0].batteryPct).toBeGreaterThan(0);
  });

  it('keeps the CO2 scrubber running on the RTG when the battery is empty', () => {
    const expedition = new ExpeditionState(new Battery(0));
    const station = new StationSystem(expedition);
    station.update(20, true, { health: 20, baseWater: 0, graywater: 0 }, false);
    expect(station.co2).toBe(0);
  });
});

describe('smoothNetRate', () => {
  it('starts at the first measured rate and moves toward new rates', () => {
    const first = smoothNetRate(null, 1, 0.1);
    expect(first).toBeCloseTo(10);
    const next = smoothNetRate(first, -0.3, 0.1, 0.3);
    expect(next).toBeLessThan(first);
    expect(next).toBeGreaterThan(-3);
  });

  it('ignores frames where game time did not move', () => {
    expect(smoothNetRate(5, 2, 0)).toBe(5);
  });
});
