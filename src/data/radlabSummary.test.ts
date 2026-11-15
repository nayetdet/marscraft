// @ts-nocheck
import { describe, expect, it } from 'vitest';
import summary from './radlabSummary.json';
import { RADIATION_CONFIG } from '../config/constants.ts';
import { marsSurfaceMedian, marsVsStationText, radlabBars, timesStation } from './radlabSummary.ts';
import { REAL_VS_GAME } from './realVsGame.ts';

describe('radlabSummary', () => {
  it('was written by the fetch script with a collection date and the RadLab queries', () => {
    expect(Number.isNaN(Date.parse(summary.retrieved))).toBe(false);
    expect(summary.series.map((s) => s.id).sort()).toEqual(['iss', 'mars', 'moon', 'orion']);
    for (const s of summary.series) {
      expect(s.query).toMatch(/^https:\/\/visualization\.osdr\.nasa\.gov\/radlab\/api\/\?/);
      expect(s.n).toBeGreaterThan(0);
      expect(s.median).toBeGreaterThan(0);
    }
  });

  it('the game dose constant comes from the Curiosity median in the JSON', () => {
    expect(RADIATION_CONFIG.MARS_SURFACE_DOSE_UGY_PER_HOUR).toBe(marsSurfaceMedian());
    expect(marsSurfaceMedian()).toBeCloseTo(6.93, 1);
  });

  it('compares each place with the Space Station', () => {
    expect(timesStation('iss')).toBe(1);
    expect(marsVsStationText()).toBe('Mars: about 1.5 times the Space Station');
    const bars = radlabBars();
    expect(bars.map((b) => b.id)).toEqual(['iss', 'mars', 'moon', 'orion']);
    expect(Math.max(...bars.map((b) => b.widthPct))).toBe(100);
    expect(bars.every((b, i) => i === 0 || b.median >= bars[i - 1].median)).toBe(true);
  });
});

describe('REAL_VS_GAME', () => {
  it('every row says the game value, the real value and why', () => {
    expect(REAL_VS_GAME.length).toBeGreaterThanOrEqual(5);
    for (const row of REAL_VS_GAME) {
      for (const key of ['topic', 'game', 'real', 'why', 'source']) expect(row[key]).toBeTruthy();
    }
    expect(REAL_VS_GAME.find((r) => r.topic === 'Gravity').real).toMatch(/3\.71/);
  });
});
