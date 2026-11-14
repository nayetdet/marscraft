import { describe, it, expect } from 'vitest';
import { buildStormSchedule, leadTimeHours, stormMultiplier, stormStateAt } from './solarStorms.js';
import { STORM_CONFIG } from '../config/constants.js';
import donki from '../data/donkiCme.json';

const cmes = [
  { id: 'slow', startTime: '2026-11-01T00:00Z', speedKmS: 300 },
  { id: 'fast', startTime: '2026-11-02T00:00Z', speedKmS: 900 },
  { id: 'medium', startTime: '2026-11-03T00:00Z', speedKmS: 600 },
];

describe('leadTimeHours', () => {
  it('faster CMEs arrive sooner (Sun-Mars distance / speed, 1 real day = 1 game hour)', () => {
    // 227.9e6 km / 900 km/s = 70.3 h reais = ~2.9 h de jogo
    expect(leadTimeHours(900)).toBeCloseTo(227.9e6 / 900 / 3600 / 24, 6);
    expect(leadTimeHours(900)).toBeLessThan(leadTimeHours(500));
  });
});

describe('stormMultiplier', () => {
  it('stays in the hundreds-to-a-thousand range', () => {
    expect(stormMultiplier(100)).toBe(250);
    expect(stormMultiplier(894)).toBe(894);
    expect(stormMultiplier(3000)).toBe(1000);
  });
});

describe('buildStormSchedule', () => {
  it('skips slow CMEs and chains storms without overlap', () => {
    const schedule = buildStormSchedule(cmes, 10, 4);
    expect(schedule.map((s) => s.cme.id)).toEqual(['fast', 'medium', 'fast', 'medium']);
    expect(schedule[0].warningStart).toBe(10 + STORM_CONFIG.FIRST_WARNING_AFTER_HOURS);
    for (let i = 1; i < schedule.length; i++) {
      expect(schedule[i].warningStart).toBeCloseTo(schedule[i - 1].end + STORM_CONFIG.GAP_BETWEEN_STORMS_HOURS);
      expect(schedule[i].arrival).toBeGreaterThan(schedule[i].warningStart);
    }
  });

  it('returns no storms when no CME is fast enough', () => {
    expect(buildStormSchedule([{ speedKmS: 300 }], 0)).toEqual([]);
  });

  it('three storms fit in a reasonable session with the real embedded DONKI data', () => {
    const schedule = buildStormSchedule(donki.cmes, 15.2);
    expect(schedule.length).toBeGreaterThan(3);
    // fim da 3a tempestade em menos de 2 sols de jogo (~40 min reais sem usar a tecla T)
    expect(schedule[2].end - 15.2).toBeLessThan(48);
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
