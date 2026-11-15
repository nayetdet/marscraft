// @ts-nocheck
import { describe, it, expect } from 'vitest';
import { DUST_WEATHER_CONFIG as D } from '../config/constants.ts';
import { DustWeather, panelDustFactor, tauSolarFactor, windCleaning } from './dustWeather.ts';

const fixedRng = () => 0.5;

function run(weather, from, to, step = 0.05) {
  for (let t = from + step; t <= to + 1e-9; t += step) weather.step(step, t);
}

describe('dust storm weather (issue #103)', () => {
  it('clear sky lets all the sunlight through; the real record tau keeps only the game floor', () => {
    expect(tauSolarFactor(D.TAU_CLEAR)).toBe(1);
    expect(tauSolarFactor(D.TAU_RECORD)).toBeCloseTo(D.SOLAR_FACTOR_AT_RECORD);
    expect(tauSolarFactor(50)).toBeCloseTo(D.SOLAR_FACTOR_AT_RECORD); // nunca zero de dia
  });

  it('dusty panels make less power, but never zero', () => {
    expect(panelDustFactor(0)).toBe(1);
    expect(panelDustFactor(1)).toBeCloseTo(1 - D.PANEL_DUST_MAX_LOSS);
    expect(panelDustFactor(1)).toBeGreaterThan(0);
  });

  it('stays clear until the story starts the weather', () => {
    const w = new DustWeather({ rng: fixedRng, startHours: 0 });
    run(w, 0, 60);
    expect(w.phase).toBe('clear');
  });

  it('goes clear -> warning -> storm -> clearing -> clear, and the tau rises and falls', () => {
    const w = new DustWeather({ rng: fixedRng, startHours: 0, started: true });
    const arrival = (D.FIRST_STORM_AFTER_HOURS[0] + D.FIRST_STORM_AFTER_HOURS[1]) / 2;
    run(w, 0, arrival - D.WARNING_HOURS - 0.1);
    expect(w.phase).toBe('clear');
    run(w, arrival - D.WARNING_HOURS - 0.1, arrival - 0.5);
    expect(w.phase).toBe('warning');
    expect(w.frontProgress).toBeGreaterThan(0);
    expect(w.drainEvents().map((e) => e.type)).toEqual(['dust-warning']);

    run(w, arrival - 0.5, arrival + D.RAMP_HOURS + 0.1);
    expect(w.phase).toBe('storm');
    expect(w.tau).toBeGreaterThanOrEqual(D.PEAK_TAU_MIN);
    expect(w.tau).toBeLessThanOrEqual(D.TAU_RECORD);
    expect(w.haze).toBe(1);

    const stormEnd = arrival + (D.STORM_HOURS[0] + D.STORM_HOURS[1]) / 2;
    run(w, arrival + D.RAMP_HOURS + 0.1, stormEnd + 0.5);
    expect(w.phase).toBe('clearing');
    run(w, stormEnd + 0.5, stormEnd + D.CLEARING_HOURS + 0.5);
    expect(w.phase).toBe('clear');
    expect(w.tau).toBe(D.TAU_CLEAR);
    expect(w.drainEvents().map((e) => e.type)).toEqual(['dust-start', 'dust-clearing', 'dust-end']);
  });

  it('panels get dusty slowly on clear days and fast in a storm', () => {
    const calm = new DustWeather({ rng: fixedRng });
    run(calm, 0, 10);
    expect(calm.panelDust).toBeCloseTo(D.START_PANEL_DUST + D.PANEL_DUST_PER_HOUR * 10, 3);

    const storm = new DustWeather({ rng: fixedRng });
    storm.force('storm');
    run(storm, 0, 4);
    expect(storm.phase).toBe('storm');
    expect(storm.panelDust).toBeGreaterThan(calm.panelDust);
  });

  it('keeps the dust of each panel: the average is what the solar field loses (act 2)', () => {
    const w = new DustWeather({ rng: fixedRng });
    expect(w.panels).toHaveLength(5);
    expect(w.panels.every((dust) => dust === D.START_PANEL_DUST)).toBe(true);
    w.panels = [1, 0, 0, 0, 0];
    expect(w.panelDust).toBeCloseTo(0.2);
    expect(w.solarFactor).toBeCloseTo(panelDustFactor(0.2));
    // Atribuir a media (admin e testes) vale para todos
    w.panelDust = 0.9;
    expect(w.panels).toEqual([0.9, 0.9, 0.9, 0.9, 0.9]);
  });

  it('brushes one panel at a time and leaves the others alone', () => {
    const w = new DustWeather({ rng: fixedRng });
    w.panelDust = 0.6;
    expect(w.cleanPanel(2)).toBeCloseTo(D.CLEAN_STEP);
    expect(w.panels[2]).toBeCloseTo(0.6 - D.CLEAN_STEP);
    expect(w.panels[0]).toBe(0.6);
    expect(w.panelsBelow(0.1)).toBe(false);
    while (w.cleanPanel(2) > 0);
    expect(w.panels[2]).toBe(0);
    expect(w.cleanPanel(2)).toBe(0);
    expect(w.cleanPanel(99)).toBe(0);
    for (const i of [0, 1, 3, 4]) while (w.cleanPanel(i) > 0);
    expect(w.panelsBelow(0.1)).toBe(true);
  });

  it('the dust devil sweeps 2 of the 5 panels clean: the ones next to where it crosses', () => {
    const w = new DustWeather({ rng: fixedRng });
    w.panelDust = 0.8;
    expect(w.sweepPanels(2, 3.2)).toBe(2);
    expect(w.panels).toEqual([0.8, 0.8, 0.8, 0, 0]);
    w.panelDust = 0.8;
    expect(w.sweepPanels(2)).toBe(2); // sem lugar: o meio da fileira
    expect(w.panels).toEqual([0.8, 0, 0, 0.8, 0.8]);
    expect(w.panelDust).toBeCloseTo(0.48);
  });

  it('runs a scripted storm (act 2): short warning, short storm, dirtier panels, then the usual clearing', () => {
    const w = new DustWeather({ rng: fixedRng });
    w.panelDust = 0.1;
    expect(w.force('warning', 0.5, { stormHours: 1.5, rampHours: 0.3, peakTau: 9, dustPerHour: 0.4 })).toBe('warning');
    run(w, 0, 0.6);
    expect(w.phase).toBe('storm');
    expect(w.hoursLeftInPhase).toBeCloseTo(1.4);
    run(w, 0.6, 1.9);
    expect(w.tau).toBeCloseTo(9);
    expect(w.panels.every((dust) => dust > 0.6)).toBe(true);
    run(w, 1.9, 2.1);
    expect(w.phase).toBe('clearing');
    // A proxima tempestade volta a ser sorteada
    expect(w.script).toBeNull();
  });

  it('cleaning removes a fixed amount of dust; strong real gusts clean a bit, calm air does not', () => {
    const w = new DustWeather({ rng: fixedRng });
    w.panelDust = 0.6;
    expect(w.cleanPanels()).toBeCloseTo(D.CLEAN_STEP);
    expect(w.panelDust).toBeCloseTo(0.6 - D.CLEAN_STEP);
    w.panelDust = 0.1;
    expect(w.cleanPanels()).toBeCloseTo(0.1);
    expect(w.cleanPanels()).toBe(0);

    expect(windCleaning(D.WIND_CLEAN_GUST_MS - 2)).toBe(0);
    expect(windCleaning(26.9)).toBeGreaterThan(0); // rajada real do sol 676 do InSight
    w.panelDust = 0.5;
    expect(w.applyWindGust(26.9)).toBeCloseTo(windCleaning(26.9));
  });

  it('admin can force the warning, the storm and the end', () => {
    const w = new DustWeather({ rng: fixedRng });
    expect(w.force('warning')).toBe('warning');
    expect(w.force('storm')).toBe('storm');
    expect(w.force('end')).toBe('clearing');
    expect(w.drainEvents().map((e) => e.type)).toEqual(['dust-warning', 'dust-start', 'dust-clearing']);
  });
});
