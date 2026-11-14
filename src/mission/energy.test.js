import { describe, it, expect } from 'vitest';
import { Battery, solarChargePerHour, sunElevation } from './energy.js';
import { ENERGY_CONFIG } from '../config/constants.js';

describe('sunElevation', () => {
  it('is zero at night and peaks at noon', () => {
    expect(sunElevation(0)).toBe(0);
    expect(sunElevation(3)).toBe(0);
    expect(sunElevation(22)).toBe(0);
    expect(sunElevation(12)).toBeCloseTo(1, 5);
    expect(sunElevation(9)).toBeGreaterThan(0);
    expect(sunElevation(9)).toBeLessThan(1);
  });
});

describe('solarChargePerHour', () => {
  it('uses the real 43% Mars sunlight fraction at noon and gives nothing at night', () => {
    const expectedPeak = ENERGY_CONFIG.PANEL_PEAK_CHARGE_EARTH_PER_HOUR * 0.43;
    expect(solarChargePerHour(12)).toBeCloseTo(expectedPeak, 5);
    expect(solarChargePerHour(1)).toBe(0);
  });
});

describe('Battery', () => {
  it('never goes above capacity or below zero', () => {
    const battery = new Battery(90, 100);
    expect(battery.add(30)).toBe(10);
    expect(battery.charge).toBe(100);
    expect(battery.drain(150)).toBe(100);
    expect(battery.charge).toBe(0);
  });

  it('spend is all-or-nothing', () => {
    const battery = new Battery(20, 100);
    expect(battery.spend(35)).toBe(false);
    expect(battery.charge).toBe(20);
    expect(battery.spend(15)).toBe(true);
    expect(battery.charge).toBe(5);
  });
});
