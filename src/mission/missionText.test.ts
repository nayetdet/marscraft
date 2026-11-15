// @ts-nocheck
import { describe, it, expect } from 'vitest';
import {
  NO_STORM_DATA_TEXT, bulletinText, donkiCredit, donkiLabel, formatDateDMY, formatDose, formatHours, radiationStatusText, stormEventMessage, stormStatusText,
} from './missionText.ts';

describe('missionText', () => {
  it('formats dates as DD/MM/YYYY', () => {
    expect(formatDateDMY('2026-11-05T20:00Z')).toBe('05/11/2026');
    expect(formatDateDMY('2026-11-14')).toBe('14/11/2026');
  });

  it('formats game hours', () => {
    expect(formatHours(2.0833)).toBe('2h 05m');
    expect(formatHours(-1)).toBe('0h 00m');
  });

  it('formats doses with sensible precision', () => {
    expect(formatDose(0.0211)).toBe('0.02 mSv');
    expect(formatDose(3.456)).toBe('3.5 mSv');
    expect(formatDose(57.4)).toBe('57 mSv');
  });

  it('storm warnings cite the real CME and say "real data", never "live"', () => {
    const storm = { leadHours: 2.9, cme: { startTime: '2026-11-01T00:00Z', speedKmS: 894, marsArrivalTime: '2026-11-03T21:36Z' } };
    const msg = stormEventMessage({ type: 'storm-warning', storm }, '2026-11-14');
    expect(msg).toContain('01/11/2026');
    expect(msg).toContain('894 km/s');
    expect(msg).toContain('real data from 14/11/2026');
    expect(msg.toLowerCase()).not.toContain('live');
  });

  it('storm warnings give the arrival NASA predicted and the game time left (issue #99)', () => {
    const storm = { leadHours: 5.46, cme: { startTime: '2026-11-01T19:00Z', speedKmS: 357, marsArrivalTime: '2026-11-07T06:00Z' } };
    const msg = stormEventMessage({ type: 'storm-warning', storm, hoursUntil: 5.46 }, '2026-11-14');
    expect(msg).toContain("NASA's model said it would reach Mars on 07/11/2026");
    expect(msg).toContain('5h 28m');
    expect(msg).toContain('headed to Mars');
    // Tempestade adiantada pelo controle de demo: vale o tempo de jogo que falta de verdade
    const demo = stormEventMessage({ type: 'storm-warning', storm, hoursUntil: 0.2 }, '2026-11-14');
    expect(demo).toContain('0h 12m');
  });

  it('no storm message claims a dose without a source (issue #99)', () => {
    const storm = { leadHours: 3, cme: { startTime: '2026-11-01T19:00Z', speedKmS: 357, marsArrivalTime: '2026-11-07T06:00Z' } };
    for (const type of ['storm-warning', 'storm-start', 'storm-survived', 'storm-failed', 'storm-missed']) {
      expect(stormEventMessage({ type, storm }, '2026-11-14')).not.toMatch(/hundreds|thousand|times higher/i);
    }
  });

  it('says so when the data has no storm headed to Mars (issue #99)', () => {
    const text = stormStatusText({ phase: 'calm', storm: null, hoursUntil: Infinity }, '2026-11-14', true);
    expect(text).toContain(NO_STORM_DATA_TEXT);
    expect(NO_STORM_DATA_TEXT).toBe('No storms headed to Mars in this data.');
  });

  it('the mission computer shows the same storm as the HUD, with its source (issue #110)', () => {
    const storm = { cme: { startTime: '2026-11-09T05:00Z', speedKmS: 726, marsArrivalTime: '2026-11-12T08:00Z' } };
    const warning = stormStatusText({ phase: 'warning', storm, hoursUntil: 1.5 }, '2026-11-14');
    expect(warning).toContain('reaches Mars in 1h 30m');
    expect(warning).toContain('12/11/2026');
    expect(warning).toContain('09/11/2026');
    expect(warning).toContain('726 km/s');
    const active = stormStatusText({ phase: 'active', storm, hoursUntil: 0, hoursLeft: 2 }, '2026-11-14');
    expect(active).toContain('ACTIVE, 2h 00m left');
    expect(stormStatusText({ phase: 'calm', storm: null, hoursUntil: Infinity }, '2026-11-14')).toMatch(/none on the way/);
    // Em calmaria nao adianta a proxima CME da fila
    expect(stormStatusText({ phase: 'calm', storm, hoursUntil: 4 }, '2026-11-14')).not.toContain('726');
  });

  it('the mission computer shows the dose in mSv, like the rest of the game (issue #110)', () => {
    const text = radiationStatusText({ doseRate: 0.0211, totalDoseMsv: 3.456 });
    expect(text).toContain('0.02 mSv per hour');
    expect(text).toContain('3.5 mSv');
    expect(text).toContain('600 mSv');
    expect(text).not.toMatch(/unit unconfirmed|%/);
    // Issue #104: a frase que explica "dose" e a escala de jogo declarada
    expect(text).toContain('Dose is how much radiation your body has collected. It only goes up.');
    expect(text).toContain('GAME SCALE');
  });
});

describe('live space weather labels (issue #100)', () => {
  const fetchedAt = new Date(2026, 10, 14, 9, 5).toISOString(); // 09:05 no horario local
  const LIVE = { live: true, fetchedAt };
  const EMBEDDED = { live: false, fetchedAt: '2026-11-15' };
  const cmeStorm = { leadHours: 2.9, cme: { startTime: '2026-11-01T00:00Z', speedKmS: 894, marsArrivalTime: '2026-11-03T21:36Z' } };
  const sepStorm = { kind: 'sep', leadHours: 0.25, cme: null, sep: { eventTime: '2025-11-15T03:42Z', seenBy: ['STEREO A'] } };

  it('says LIVE with the fetch time only after a fetch that worked', () => {
    expect(donkiLabel(LIVE)).toBe('LIVE from NASA DONKI, fetched 09:05');
    expect(donkiLabel(EMBEDDED)).toBe('real data from 15/11/2026');
    expect(donkiLabel('2026-11-15')).toBe('real data from 15/11/2026');
    expect(donkiCredit(LIVE)).toBe('LIVE from NASA DONKI, fetched 09:05');
    expect(donkiCredit(EMBEDDED)).toBe('NASA DONKI, real data from 15/11/2026');
  });

  it('storm warning and mission computer carry the same honest label', () => {
    expect(stormEventMessage({ type: 'storm-warning', storm: cmeStorm }, LIVE)).toContain('(LIVE from NASA DONKI, fetched 09:05)');
    const embedded = stormEventMessage({ type: 'storm-warning', storm: cmeStorm }, EMBEDDED);
    expect(embedded).toContain('(NASA DONKI, real data from 15/11/2026)');
    expect(embedded).not.toMatch(/live/i);
    expect(stormStatusText({ phase: 'active', storm: cmeStorm, hoursLeft: 1 }, LIVE)).toContain('LIVE from NASA DONKI');
  });

  it('an SEP storm explains the short warning and cites the real SEP', () => {
    const msg = stormEventMessage({ type: 'storm-warning', storm: sepStorm, hoursUntil: 0.25 }, LIVE);
    expect(msg).toMatch(/SEP/);
    expect(msg).toMatch(/very short/);
    expect(msg).toContain('15/11/2025');
    expect(msg).toContain('STEREO A');
    expect(msg).toContain('LIVE from NASA DONKI');
    expect(stormStatusText({ phase: 'warning', storm: sepStorm, hoursUntil: 0.2 }, LIVE)).toContain('SEP');
  });

  it('turns a DONKI bulletin into one short line a kid can read', () => {
    expect(bulletinText({ type: 'CME', issueTime: '2026-11-13T16:25Z', url: 'u' }))
      .toBe('NASA space weather bulletin, 13/11: CME (a giant cloud of particles from the Sun)');
    expect(bulletinText({ type: 'XYZ', issueTime: '2026-11-13T16:25Z', url: 'u' })).toContain(': XYZ');
    expect(bulletinText(null)).toBe('');
  });
});
