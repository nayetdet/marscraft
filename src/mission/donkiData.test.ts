// @ts-nocheck
import { describe, it, expect } from 'vitest';
import { marsImpact, summarizeCme } from '../../scripts/fetch-donki-cme.mjs';
import sample from '../../docs/data/samples/donki-cme-2026-11-sample.json';
import donki from '../data/donkiCme.json';

// A amostra e a resposta real do DONKI salva em docs/data/samples (duas CMEs de 01/11/2026)
describe('fetch-donki-cme (issue #99)', () => {
  const [toElsewhere, toMars] = sample.items;

  it('reads the Mars impact predicted by the NASA model, with arrival and glancing blow', () => {
    expect(marsImpact(toElsewhere)).toBeNull();
    expect(marsImpact(toMars).impact).toMatchObject({
      location: 'Mars', arrivalTime: '2026-11-07T06:00Z', isGlancingBlow: true,
    });
  });

  it('keeps only CMEs headed to Mars, with what the game needs', () => {
    expect(summarizeCme(toElsewhere)).toBeNull();
    expect(summarizeCme(toMars)).toEqual({
      id: '2026-11-01T19:00:00-CME-001',
      startTime: '2026-11-01T19:00Z',
      speedKmS: 357,
      type: 'S',
      headedToMars: true,
      marsArrivalTime: '2026-11-07T06:00Z',
      isGlancingBlow: true,
      link: 'https://ccmc.gsfc.nasa.gov/DONKI/view/CME/49358/-1',
    });
  });

  it('the embedded file has that same CME, untouched', () => {
    expect(donki.cmes).toContainEqual(summarizeCme(toMars));
  });

  it('ignores an arrival listed for another place or before the CME left the Sun', () => {
    const other = { ...toMars, cmeAnalyses: [{ speed: 500, type: 'C', enlilList: [{ impactList: [{ location: 'STEREO A', arrivalTime: '2026-11-05T10:00Z' }] }] }] };
    expect(summarizeCme(other)).toBeNull();
    const backwards = { ...toMars, cmeAnalyses: [{ speed: 500, type: 'C', enlilList: [{ impactList: [{ location: 'Mars', arrivalTime: '2026-10-30T00:00Z' }] }] }] };
    expect(summarizeCme(backwards)).toBeNull();
  });
});
