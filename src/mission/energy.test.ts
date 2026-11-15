// @ts-nocheck
import { describe, it, expect } from 'vitest';
import { Battery, batteryAtSunrise, solarChargePerHour, sunElevation } from './energy.ts';
import { DUST_WEATHER_CONFIG, ENERGY_CONFIG, MISSION_CONFIG, UTILITY_CONFIG } from '../config/constants.ts';
import { MissionSystem } from './MissionSystem.ts';
import { DustWeather } from './dustWeather.ts';

// Issue #420: a previsao do card LIGHTS ON x LIGHTS OFF tem que bater com a bateria de verdade
describe('batteryAtSunrise (night forecast)', () => {
  const SUNSET = ENERGY_CONFIG.SUNSET_WARNING_HOUR;
  const BASE = 5; // % por hora que a base gasta sem a luz da estufa (numero do teste)
  const LIGHTS = UTILITY_CONFIG.GREENHOUSE_LIGHTS_PER_HOUR;

  // A noite de verdade: o MissionSystem carrega com o Sol e a base gasta a cada passo
  function playNight(drainPerHour, charge) {
    const mission = new MissionSystem({ cmes: [], startHours: SUNSET, stormsStarted: false });
    mission.battery.charge = charge;
    const step = MISSION_CONFIG.MAX_STEP_HOURS;
    const end = 24 + MISSION_CONFIG.SUNRISE_HOUR;
    const steps = Math.round((end - SUNSET) / step);
    for (let i = 1; i <= steps; i++) {
      mission.update(SUNSET + i * step, { insideHabitat: true, active: false });
      mission.battery.drain(drainPerHour * step);
    }
    return mission.battery.charge;
  }

  it('matches the real battery at sunrise, with the greenhouse lights on and off', () => {
    for (const drain of [BASE, BASE + LIGHTS]) {
      // A poeira de agora entra na conta, como no jogo (Act3Controller.nightForecast)
      const weatherFactor = new MissionSystem({ cmes: [], startHours: SUNSET, stormsStarted: false }).dustWeather.solarFactor;
      const forecast = batteryAtSunrise({ charge: 90, timeOfDay: SUNSET, drainPerHour: drain, weatherFactor });
      expect(Math.abs(forecast - playNight(drain, 90))).toBeLessThanOrEqual(1);
      expect(forecast).toBeGreaterThan(0);
      expect(forecast).toBeLessThan(90);
    }
  });

  it('lights on all night cost their hourly rate times the hours until sunrise', () => {
    const on = batteryAtSunrise({ charge: 90, timeOfDay: SUNSET, drainPerHour: BASE + LIGHTS });
    const off = batteryAtSunrise({ charge: 90, timeOfDay: SUNSET, drainPerHour: BASE });
    expect(off - on).toBeCloseTo(LIGHTS * (24 + MISSION_CONFIG.SUNRISE_HOUR - SUNSET), 1);
  });

  it('never goes below empty or above full, and takes a drain that changes with the hour', () => {
    expect(batteryAtSunrise({ charge: 10, timeOfDay: SUNSET, drainPerHour: 50 })).toBe(0);
    expect(batteryAtSunrise({ charge: 100, timeOfDay: 9, drainPerHour: 0 })).toBe(100);
    const colder = batteryAtSunrise({ charge: 90, timeOfDay: 20, drainPerHour: (elapsed) => (elapsed > 5 ? 4 : 2) });
    expect(colder).toBeCloseTo(90 - 5 * 2 - 5 * 4, 0);
  });
});

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

describe('dust storm and solar power (issue #103)', () => {
  it('generation drops by the weather factor during a dust storm and comes back after it', () => {
    const weather = new DustWeather({ rng: () => 0.5 });
    weather.panelDust = 0;
    const clear = solarChargePerHour(12, weather.solarFactor);
    expect(clear).toBeCloseTo(solarChargePerHour(12), 5);

    weather.force('storm');
    for (let t = 0.05; t <= 2; t += 0.05) weather.step(0.05, t);
    weather.panelDust = 0;
    const storm = solarChargePerHour(12, weather.solarFactor);
    expect(storm).toBeLessThan(clear * 0.5);
    expect(storm).toBeGreaterThanOrEqual(clear * DUST_WEATHER_CONFIG.SOLAR_FACTOR_AT_RECORD - 1e-9);

    weather.force('end');
    for (let t = 2.05; t <= 2 + DUST_WEATHER_CONFIG.CLEARING_HOURS + 0.1; t += 0.05) weather.step(0.05, t);
    weather.panelDust = 0;
    expect(weather.phase).toBe('clear');
    expect(solarChargePerHour(12, weather.solarFactor)).toBeCloseTo(clear, 5);
  });

  it('cleaning the panels brings the power back', () => {
    const weather = new DustWeather();
    weather.panelDust = 1;
    const dusty = solarChargePerHour(12, weather.solarFactor);
    while (weather.cleanPanels() > 0);
    expect(solarChargePerHour(12, weather.solarFactor)).toBeGreaterThan(dusty * 2);
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
