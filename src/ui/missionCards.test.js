import { describe, expect, it } from 'vitest';
import { RADIATION_CONFIG } from '../config/constants.js';
import { missionStatus, radiationTone, stormSourceShort } from './missionCards.js';

const STORM = { warningStart: 10, arrival: 14, end: 18, cme: { startTime: '2026-11-01T12:00Z', speedKmS: 894.4 } };
const FETCHED = '2026-11-14';

function fakeMission(overrides = {}) {
  return {
    battery: { percent: 80 },
    chargeRate: 1,
    shieldOn: false,
    insideShield: true,
    doseRate: 0.02,
    storm: { phase: 'calm', storm: null, hoursUntil: 5 },
    progress: { overallPct: 12.7, ready: false },
    ...overrides,
  };
}

describe('radiationTone', () => {
  it('turns red exactly when the dose starts to hurt', () => {
    expect(radiationTone(0.02)).toBe('ok');
    expect(radiationTone(RADIATION_CONFIG.WARN_MSV_PER_HOUR)).toBe('warn');
    expect(radiationTone(RADIATION_CONFIG.HARM_THRESHOLD_MSV_PER_HOUR - 0.01)).toBe('warn');
    expect(radiationTone(RADIATION_CONFIG.HARM_THRESHOLD_MSV_PER_HOUR)).toBe('danger');
  });
});

describe('missionStatus', () => {
  it('prioritizes the red window breach alert until the base is sealed', () => {
    const mission = fakeMission({ battery: { percent: 5 }, storm: { phase: 'active', storm: STORM, hoursLeft: 2 } });
    const damaged = missionStatus(mission, FETCHED, { brokenWindows: 2 });
    expect(damaged.air.tone).toBe('danger');
    expect(missionStatus(mission, FETCHED, { brokenWindows: 1, baseOxygen: 65 }).air.pct).toBe(65);
    expect(damaged.alerts[0]).toMatchObject({ id: 'breach', tone: 'danger' });
    expect(missionStatus(fakeMission(), FETCHED, { brokenWindows: 0 }).alerts).toEqual([]);
  });
  it('shows the resources and no alerts when everything is calm', () => {
    const s = missionStatus(fakeMission(), FETCHED);
    expect(s.power).toEqual({ pct: 80, tone: 'ok', trend: 'up' });
    expect(s.radiation).toMatchObject({ level: 1, word: 'LOW', icon: 'radiation' });
    expect(s.alerts).toEqual([]);
  });

  it('points the power trend down at night', () => {
    expect(missionStatus(fakeMission({ chargeRate: 0 }), FETCHED).power.trend).toBe('down');
  });

  it('turns a storm warning into a countdown alert with the real data source', () => {
    const s = missionStatus(fakeMission({ storm: { phase: 'warning', storm: STORM, hoursUntil: 1 } }), FETCHED);
    expect(s.alerts).toHaveLength(1);
    expect(s.alerts[0]).toMatchObject({ id: 'storm', tone: 'warn', title: 'Solar storm in 1h 00m', fill: 0.25 });
    expect(s.alerts[0].source).toBe('Real NASA DONKI data from 14/11/2026: CME of 01/11/2026, 894 km/s');
  });

  it('tells the kid to hide during a storm, or to stay in the bubble when shielded', () => {
    const storm = { phase: 'active', storm: STORM, hoursUntil: 0, hoursLeft: 2 };
    const open = missionStatus(fakeMission({ storm, doseRate: 5 }), FETCHED);
    expect(open.alerts[0]).toMatchObject({ tone: 'danger', fill: 0.5 });
    expect(open.alerts[0].text).toContain('storm shelter');
    expect(open.alerts.map((a) => a.id)).not.toContain('radiation');

    const safe = missionStatus(fakeMission({ storm, doseRate: 0.1, shieldOn: true }), FETCHED);
    expect(safe.radiation).toMatchObject({ word: 'SHIELD', tone: 'shield', icon: 'shield' });
    expect(safe.alerts[0].text).toContain('Stay in the bubble');

    const sheltered = missionStatus(fakeMission({ storm, doseRate: 1, insideShelter: true, shelterWaterL: 30 }), FETCHED);
    expect(sheltered.alerts[0].text).toContain('30 L of water');
  });

  it('warns when the shield is on but the player left the bubble', () => {
    const s = missionStatus(fakeMission({ shieldOn: true, insideShield: false, doseRate: 0.05 }), FETCHED);
    expect(s.radiation.word).toBe('LOW');
    expect(s.alerts.map((a) => a.id)).toEqual(['bubble']);
  });

  it('flags an almost empty battery and shows one alert at a time', () => {
    const s = missionStatus(fakeMission({
      battery: { percent: 10 },
      chargeRate: 0,
      shieldOn: true,
      insideShield: false,
      storm: { phase: 'warning', storm: STORM, hoursUntil: 2 },
    }), FETCHED);
    expect(s.power.tone).toBe('danger');
    // O aviso de tempestade (amarelo) espera: primeiro o perigo
    expect(s.alerts.map((a) => a.id)).toEqual(['power']);
  });

  it('puts what hurts now (red) before warnings (yellow)', () => {
    const s = missionStatus(fakeMission({ shieldOn: true, insideShield: false }), FETCHED, { water: 6, co2: 85 });
    expect(s.alerts.map((a) => a.id)).toEqual(['air', 'water']);
  });

  it('celebrates when the rocket is ready', () => {
    const s = missionStatus(fakeMission({ progress: { overallPct: 100, ready: true } }), FETCHED);
    expect(s.alerts[0]).toMatchObject({ id: 'rocket', tone: 'ok' });
  });

  it('shows base water in liters and base O2 as clean air', () => {
    const s = missionStatus(fakeMission(), FETCHED, { water: 37.4, maxWater: 100, co2: 12 });
    expect(s.water).toEqual({ liters: 37, pct: 37, tone: 'ok', greenhouseDry: false });
    expect(s.air).toEqual({ pct: 88, tone: 'ok' });
  });

  it('warns about bad air with the station thresholds', () => {
    expect(missionStatus(fakeMission(), FETCHED, { co2: 45 }).air.tone).toBe('warn');
    const bad = missionStatus(fakeMission(), FETCHED, { co2: 85 });
    expect(bad.air.tone).toBe('danger');
    expect(bad.alerts[0]).toMatchObject({ id: 'air', tone: 'danger' });
    expect(missionStatus(fakeMission(), FETCHED, { contaminated: true }).alerts[0].title).toBe('Dust in the base!');
  });

  it('asks for ice when the base water is almost empty, and says so when the plants stopped', () => {
    expect(missionStatus(fakeMission(), FETCHED, { water: 18 }).water.tone).toBe('warn');
    const empty = missionStatus(fakeMission(), FETCHED, { water: 6 });
    expect(empty.alerts.map((a) => a.id)).toEqual(['water']);
    expect(empty.alerts[0].text).toMatch(/rover/);
    expect(empty.water.greenhouseDry).toBe(false);
    const dry = missionStatus(fakeMission(), FETCHED, { water: 0, greenhouseDry: true });
    expect(dry.water.greenhouseDry).toBe(true);
    expect(dry.alerts.map((a) => a.id)).toEqual(['water']);
    expect(dry.alerts[0].title).toMatch(/plants stopped/);
  });

  it('points to the recycler when used water is waiting to be cleaned (issue #101)', () => {
    const s = missionStatus(fakeMission(), FETCHED, { water: 4, graywater: 12 });
    expect(s.alerts[0]).toMatchObject({ id: 'water', tone: 'danger' });
    expect(s.alerts[0].text).toMatch(/water recycler/);
  });

  it('formats a short source line', () => {
    expect(stormSourceShort(STORM, FETCHED)).toContain('14/11/2026');
  });

  it('says LIVE in the storm card only after a fetch that worked (issue #100)', () => {
    const fetchedAt = new Date(2026, 10, 14, 18, 40).toISOString();
    expect(stormSourceShort(STORM, { live: true, fetchedAt })).toBe('LIVE from NASA DONKI, fetched 18:40: CME of 01/11/2026, 894 km/s');
    expect(stormSourceShort(STORM, { live: false, fetchedAt: '2026-11-14' })).toBe('Real NASA DONKI data from 14/11/2026: CME of 01/11/2026, 894 km/s');
    const sepStorm = { ...STORM, cme: null, kind: 'sep', sep: { eventTime: '2025-11-15T03:42Z', seenBy: ['STEREO A'] } };
    expect(stormSourceShort(sepStorm, { live: true, fetchedAt })).toBe('LIVE from NASA DONKI, fetched 18:40: SEP of 15/11/2025');
  });
});
