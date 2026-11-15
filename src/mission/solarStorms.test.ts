// @ts-nocheck
import { describe, it, expect } from 'vitest';
import {
  buildStormSchedule, leadTimeHours, marsBoundCmes, rescheduleStorms, stormStateAt, stormTotalDoseUGy,
} from './solarStorms.ts';
import { RADIATION_CONFIG, SPACE_WEATHER_CONFIG, STORM_CONFIG } from '../config/constants.ts';
import donki from '../data/donkiCme.json';

const toMars = (id, startTime, marsArrivalTime, speedKmS, isGlancingBlow = false) =>
  ({ id, startTime, marsArrivalTime, speedKmS, isGlancingBlow, headedToMars: true });

const cmes = [
  { id: 'to-earth', startTime: '2026-11-01T00:00Z', speedKmS: 1500, headedToMars: false },
  toMars('fast', '2026-11-02T00:00Z', '2026-11-04T12:00Z', 900),
  { id: 'no-arrival', startTime: '2026-11-02T12:00Z', speedKmS: 800, headedToMars: true },
  toMars('slow', '2026-11-03T00:00Z', '2026-11-08T00:00Z', 350, true),
];

describe('leadTimeHours', () => {
  it('is the trip NASA predicted for that CME, shrunk to a few seconds of game time', () => {
    const scale = STORM_CONFIG.WARNING_REAL_HOURS_PER_GAME_HOUR;
    expect(leadTimeHours(cmes[3])).toBeCloseTo(120 / scale); // 5 dias
    // Viagem mais curta = menos aviso, mas nunca abaixo do minimo
    expect(leadTimeHours(cmes[1])).toBeLessThan(leadTimeHours(cmes[3])); // 2 dias e 12 h
    expect(leadTimeHours(cmes[1])).toBe(STORM_CONFIG.MIN_WARNING_HOURS);
  });

  it('matches the real prediction saved from DONKI: left 01/11 19:00Z, Mars on 07/11 06:00Z', () => {
    const cme = donki.cmes.find((c) => c.id === '2026-11-01T19:00:00-CME-001');
    expect(cme.marsArrivalTime).toBe('2026-11-07T06:00Z');
    // 5 dias e 11 horas reais = 131 h -> 131 / 250 horas de jogo (~26 s reais de aviso)
    expect(leadTimeHours(cme)).toBeCloseTo(131 / STORM_CONFIG.WARNING_REAL_HOURS_PER_GAME_HOUR, 6);
  });
});

describe('stormTotalDoseUGy', () => {
  it('is a game rule that grows with the CME speed and is weaker for a glancing blow', () => {
    const slow = stormTotalDoseUGy({ speedKmS: 400 });
    const fast = stormTotalDoseUGy({ speedKmS: 1000 });
    expect(fast).toBeGreaterThan(slow);
    expect(stormTotalDoseUGy({ speedKmS: 1000, isGlancingBlow: true })).toBeLessThan(fast);
  });

  it('never goes above the biggest storm Curiosity ever measured: 8,100 uGy (NASA, 20/05/2024)', () => {
    const RECORD_STORM_DOSE_UGY = 8100;
    expect(RADIATION_CONFIG.STORM_DOSE_MAX_UGY).toBe(RECORD_STORM_DOSE_UGY);
    for (const speedKmS of [100, 357, 726, 1200, 2500, 5000]) {
      expect(stormTotalDoseUGy({ speedKmS })).toBeLessThanOrEqual(RECORD_STORM_DOSE_UGY);
    }
    for (const storm of buildStormSchedule(donki.cmes, 0)) {
      // A dose total la fora, sem protecao: taxa x duracao
      expect(storm.doseUGyPerHour * (storm.end - storm.arrival)).toBeLessThanOrEqual(RECORD_STORM_DOSE_UGY + 1e-6);
    }
  });

  it('never goes below the storm that doubled the surface dose for two days (NASA JPL, 11/09/2017)', () => {
    const doubledForTwoDays = 2 * RADIATION_CONFIG.MARS_SURFACE_DOSE_UGY_PER_HOUR * 48;
    expect(RADIATION_CONFIG.STORM_DOSE_MIN_UGY).toBeCloseTo(doubledForTwoDays, 0);
    expect(stormTotalDoseUGy({ speedKmS: 50 })).toBe(RADIATION_CONFIG.STORM_DOSE_MIN_UGY);
  });
});

describe('buildStormSchedule', () => {
  it('uses only CMEs that NASA predicted would reach Mars', () => {
    expect(marsBoundCmes(cmes).map((c) => c.id)).toEqual(['fast', 'slow']);
    const schedule = buildStormSchedule(cmes, 10, 4);
    expect(schedule.map((s) => s.cme.id)).toEqual(['fast', 'slow', 'fast', 'slow']);
    expect(schedule.every((s) => s.cme.headedToMars)).toBe(true);
  });

  it('warns for as long as the predicted trip and chains storms without overlap', () => {
    const schedule = buildStormSchedule(cmes, 10, 4);
    expect(schedule[0].warningStart).toBe(10 + STORM_CONFIG.FIRST_WARNING_AFTER_HOURS);
    for (const [i, storm] of schedule.entries()) {
      expect(storm.arrival - storm.warningStart).toBeCloseTo(leadTimeHours(storm.cme));
      expect(storm.end - storm.arrival).toBeCloseTo(STORM_CONFIG.DURATION_HOURS);
      if (i > 0) expect(storm.warningStart).toBeCloseTo(schedule[i - 1].end + STORM_CONFIG.GAP_BETWEEN_STORMS_HOURS);
    }
  });

  it('stays empty when no CME was headed to Mars, instead of using the others', () => {
    const fastButElsewhere = [{ speedKmS: 2000, startTime: '2026-11-01T00:00Z', headedToMars: false }];
    expect(buildStormSchedule(fastButElsewhere, 0)).toEqual([]);
    expect(buildStormSchedule([], 0)).toEqual([]);
  });

  it('the embedded DONKI data has the Mars arrival of every CME and gives a queue of real Mars storms', () => {
    expect(donki.cmes.length).toBeGreaterThan(0);
    for (const cme of donki.cmes) {
      expect(cme.headedToMars).toBe(true);
      expect(Date.parse(cme.marsArrivalTime)).toBeGreaterThan(Date.parse(cme.startTime));
      expect(typeof cme.isGlancingBlow).toBe('boolean');
    }
    const schedule = buildStormSchedule(donki.cmes, 15.2);
    expect(schedule.length).toBeGreaterThan(3);
    expect(schedule.every((s) => s.cme.headedToMars)).toBe(true);
    // fim da 3a tempestade em menos de 2,5 sols de jogo
    expect(schedule[2].end - 15.2).toBeLessThan(60);
  });
});

describe('stormStateAt', () => {
  it('goes calm -> warning -> active -> calm', () => {
    const [storm] = buildStormSchedule(cmes, 0, 1);
    expect(stormStateAt([storm], storm.warningStart - 0.1).phase).toBe('calm');
    const warning = stormStateAt([storm], storm.warningStart + 0.1);
    expect(warning.phase).toBe('warning');
    expect(warning.hoursUntil).toBeCloseTo(storm.arrival - storm.warningStart - 0.1);
    expect(stormStateAt([storm], storm.arrival + 0.1).phase).toBe('active');
    expect(stormStateAt([storm], storm.end + 0.1)).toMatchObject({ phase: 'calm', storm: null });
  });
});

describe('admin storm controls', () => {
  it('moves the next storm so the chosen phase starts now', () => {
    const schedule = buildStormSchedule(cmes, 0, 3);
    for (const [target, phase] of [['warning', 'warning'], ['active', 'active'], ['end', 'calm']]) {
      const moved = rescheduleStorms(schedule, 0.5, target);
      expect(stormStateAt(moved, 0.5).phase).toBe(phase);
    }
  });
});

describe('SEP storms from live DONKI data (issue #100)', () => {
  const seps = [{ id: 'sep-1', eventTime: '2025-11-15T03:42Z', seenBy: ['STEREO A'] }];

  it('without a real SEP nothing changes: every storm is a CME, no SEP is made up', () => {
    expect(buildStormSchedule(cmes, 10, 6, [])).toEqual(buildStormSchedule(cmes, 10, 6));
    expect(buildStormSchedule(cmes, 10, 6).some((s) => s.sep || s.kind === 'sep')).toBe(false);
  });

  it('with a real SEP, every Nth storm is an SEP spike with a short warning', () => {
    const N = SPACE_WEATHER_CONFIG.SEP_EVERY_N_STORMS;
    const schedule = buildStormSchedule(cmes, 10, 2 * N, seps);
    const sepStorms = schedule.filter((s) => s.kind === 'sep');
    expect(sepStorms.map((s) => s.index)).toEqual([N - 1, 2 * N - 1]);
    for (const storm of sepStorms) {
      expect(storm.cme).toBeNull();
      expect(storm.sep).toBe(seps[0]);
      expect(storm.arrival - storm.warningStart).toBeCloseTo(SPACE_WEATHER_CONFIG.SEP_WARNING_HOURS);
      // Menor que qualquer aviso de CME real: as particulas chegam quase na velocidade da luz
      expect(storm.leadHours).toBeLessThan(Math.min(...marsBoundCmes(donki.cmes).map(leadTimeHours)));
      // O DONKI nao da a forca da SEP em Marte: usa a menor tempestade real do Curiosity
      expect(storm.totalDoseUGy).toBe(RADIATION_CONFIG.STORM_DOSE_MIN_UGY);
    }
    // As CMEs seguem a ordem delas, sem pular nenhuma por causa das SEPs
    expect(schedule.filter((s) => s.cme).map((s) => s.cme.id)).toEqual(['fast', 'slow', 'fast', 'slow']);
  });

  it('keeps the SEP when the admin panel moves the storms', () => {
    const schedule = buildStormSchedule(cmes, 0, 3, seps);
    const moved = rescheduleStorms(schedule, 0, 'warning');
    expect(moved[2].sep).toBe(seps[0]);
  });
});
