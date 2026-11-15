// @ts-nocheck
import { describe, expect, it } from 'vitest';
import { MissionLog, formatSolTime, solOf } from './missionLog.ts';

describe('formatSolTime', () => {
  it('turns game hours into sol and clock time', () => {
    expect(formatSolTime(0)).toBe('Sol 1, 00:00');
    expect(formatSolTime(24 + 21 + 10 / 60)).toBe('Sol 2, 21:10');
    expect(solOf(47.9)).toBe(2);
    expect(solOf(48)).toBe(3);
  });
});

describe('MissionLog', () => {
  it('links a consequence to the decision that caused it', () => {
    const log = new MissionLog();
    const off = log.decision('You turned the heater off.', { hours: 45.2, key: 'heater', weight: 3 });
    const froze = log.consequence('The pipes froze.', { hours: 47.7, causeKey: 'heater' });
    expect(froze.kind).toBe('consequence');
    expect(froze.causeId).toBe(off.id);
    expect(log.causeOf(froze)).toBe(off);
    expect(off.effectIds).toEqual([froze.id]);
    expect(froze.time).toBe('Sol 2, 23:42');
  });

  it('turns a consequence without an open decision into a plain event', () => {
    const log = new MissionLog();
    const entry = log.consequence('The pipes froze.', { hours: 3, causeKey: 'heater' });
    expect(entry.kind).toBe('event');
    expect(entry.causeId).toBeNull();
  });

  it('stops linking after a decision is closed', () => {
    const log = new MissionLog();
    log.decision('Heater off', { hours: 1, key: 'heater' });
    log.closeDecision('heater');
    expect(log.consequence('Froze', { hours: 2, causeKey: 'heater' }).causeId).toBeNull();
  });

  it('merges quick repeated clicks into one decision', () => {
    const log = new MissionLog();
    const first = log.decision('Wall: 10 L', { hours: 5, key: 'shelter', mergeHours: 1 });
    const second = log.decision('Wall: 20 L', { hours: 5.3, key: 'shelter', mergeHours: 1 });
    expect(second).toBe(first);
    expect(first.text).toBe('Wall: 20 L');
    expect(log.entries).toHaveLength(1);
    const later = log.decision('Wall: 30 L', { hours: 7, key: 'shelter', mergeHours: 1 });
    expect(later).not.toBe(first);
  });

  it('accepts entries from other systems through add()', () => {
    const log = new MissionLog();
    log.lastHours = 30;
    const entry = log.add({ text: 'A dust devil passed by.' });
    expect(entry.kind).toBe('event');
    expect(entry.sol).toBe(2);
  });

  it('keeps only the newest entries', () => {
    const log = new MissionLog({ maxEntries: 3 });
    for (let i = 0; i < 5; i++) log.add({ text: `e${i}`, hours: i });
    expect(log.entries.map((e) => e.text)).toEqual(['e2', 'e3', 'e4']);
  });

  it('writes an end-of-sol summary with the 3 numbers and the heaviest decision', () => {
    const log = new MissionLog();
    log.decision('Lights off', { hours: 10, key: 'lights', weight: 2 });
    log.decision('Heater off', { hours: 20, key: 'heater', weight: 3 });
    log.consequence('Pipes froze', { hours: 21, causeKey: 'heater', weight: 3 });
    const summary = log.endSol(1, { energyIn: 163.6, energyOut: 150.2, waterIn: 3.04, waterOut: 12.66, doseMsv: 0.5 });
    expect(summary.kind).toBe('summary');
    expect(summary.sol).toBe(1);
    expect(summary.time).toBe('Sol 1, 23:59');
    expect(summary.numbers).toEqual({ energyIn: 164, energyOut: 150, waterIn: 3, waterOut: 12.7, doseMsv: 0.5, topDecision: 'Heater off' });
  });

  it('lists sols newest first', () => {
    const log = new MissionLog();
    log.add({ text: 'a', hours: 2 });
    log.add({ text: 'b', hours: 50 });
    log.add({ text: 'c', hours: 30 });
    expect(log.sols()).toEqual([3, 2, 1]);
    expect(log.entriesForSol(2).map((e) => e.text)).toEqual(['c']);
  });
});
