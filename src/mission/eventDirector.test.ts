// @ts-nocheck
import { describe, it, expect } from 'vitest';
import { EVENTS_CONFIG } from '../config/constants.ts';
import {
  EventDirector,
  buildEventSchedule,
  createRng,
  inWindow,
  nextWindowHours,
  normalizeSeed,
  seedFromSearch,
} from './eventDirector.ts';

const STEP = 0.02; // horas de jogo por passo da simulacao (2 s reais)

// Roda o diretor de `from` ate `to` e devolve os eventos que sairam, com a hora de cada um
function simulate(director, from, to, blockedAt = () => false) {
  const log = [];
  for (let h = from; h <= to; h += STEP) {
    director.update(h, { blocked: blockedAt(h) });
    for (const e of director.drainEvents()) log.push({ ...e, at: h });
  }
  return log;
}

describe('createRng', () => {
  it('repeats the same sequence for the same seed and differs for another seed', () => {
    const a = createRng(42);
    const b = createRng(42);
    const c = createRng(43);
    const seqA = Array.from({ length: 5 }, a);
    expect(Array.from({ length: 5 }, b)).toEqual(seqA);
    expect(Array.from({ length: 5 }, c)).not.toEqual(seqA);
    for (const v of seqA) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('seeds', () => {
  it('reads ?seed= from the URL and ignores bad values', () => {
    expect(seedFromSearch('?seed=123')).toBe(123);
    expect(seedFromSearch('?admin&seed=77')).toBe(77);
    expect(seedFromSearch('?seed=abc')).toBeNull();
    expect(seedFromSearch('?seed=0')).toBeNull();
    expect(seedFromSearch('')).toBeNull();
    expect(normalizeSeed(1234567)).toBeGreaterThan(0);
    expect(normalizeSeed(1234567)).toBeLessThan(1000000);
  });
});

describe('buildEventSchedule', () => {
  it('gives the same schedule for the same seed', () => {
    expect(buildEventSchedule(123, 30)).toEqual(buildEventSchedule(123, 30));
  });

  it('gives different schedules for different seeds', () => {
    const a = buildEventSchedule(123, 30).map((e) => `${e.type}@${e.hours.toFixed(3)}`);
    const b = buildEventSchedule(456, 30).map((e) => `${e.type}@${e.hours.toFixed(3)}`);
    expect(a).not.toEqual(b);
  });

  it('starts after the first delay, never repeats a type back to back and keeps the gap', () => {
    const [minFirst] = EVENTS_CONFIG.FIRST_DELAY_HOURS;
    const [minGap] = EVENTS_CONFIG.GAP_HOURS;
    for (const seed of [1, 7, 99, 2024, 31337]) {
      const events = buildEventSchedule(seed, 50);
      expect(events.length).toBeGreaterThan(10);
      expect(events[0].hours).toBeGreaterThanOrEqual(50 + minFirst);
      for (let i = 1; i < events.length; i++) {
        expect(events[i].type).not.toBe(events[i - 1].type);
        expect(events[i].hours - (events[i - 1].hours + events[i - 1].durationHours)).toBeGreaterThanOrEqual(minGap - 1e-9);
      }
      for (const e of events) {
        expect(EVENTS_CONFIG.RANDOM_TYPES).toContain(e.type);
        expect(inWindow(e.type, e.hours)).toBe(true);
      }
    }
  });

  it('uses every random event type over a long game', () => {
    const types = new Set(buildEventSchedule(5, 0).map((e) => e.type));
    expect([...types].sort()).toEqual([...EVENTS_CONFIG.RANDOM_TYPES].sort());
  });
});

describe('time windows', () => {
  it('puts the eclipse in daylight, frost at sunrise and the aurora at night', () => {
    expect(inWindow('eclipse', 12)).toBe(true);
    expect(inWindow('eclipse', 22)).toBe(false);
    expect(inWindow('frost', 24 * 3 + 6)).toBe(true);
    expect(inWindow('aurora', 23)).toBe(true);
    expect(inWindow('aurora', 2)).toBe(true);
    expect(inWindow('aurora', 12)).toBe(false);
    expect(inWindow('meteor', 3)).toBe(true);
    expect(nextWindowHours('eclipse', 20)).toBeCloseTo(24 + 9);
    expect(nextWindowHours('aurora', 30)).toBeCloseTo(44);
  });
});

describe('EventDirector', () => {
  it('fires nothing during act 1 (before start)', () => {
    const director = new EventDirector({ seed: 3 });
    expect(simulate(director, 0, 60)).toEqual([]);
  });

  it('plays the same events at the same hours for the same seed', () => {
    const run = (seed) => {
      const d = new EventDirector({ seed });
      d.start(10);
      return simulate(d, 10, 60).map((e) => `${e.type}:${e.event.type}@${e.at.toFixed(2)}`);
    };
    expect(run(11)).toEqual(run(11));
    expect(run(11)).not.toEqual(run(12));
  });

  it('keeps one event at a time with a minimum gap between them', () => {
    const director = new EventDirector({ seed: 8 });
    director.start(5);
    const log = simulate(director, 5, 120);
    expect(log.length).toBeGreaterThan(8);
    let activeCount = 0;
    let lastEnd = null;
    for (const entry of log) {
      if (entry.type === 'event-start') {
        activeCount++;
        expect(activeCount).toBe(1);
        if (lastEnd !== null) expect(entry.at - lastEnd).toBeGreaterThanOrEqual(EVENTS_CONFIG.MIN_GAP_HOURS - STEP);
        expect(inWindow(entry.event.type, entry.at)).toBe(true);
      } else {
        activeCount--;
        lastEnd = entry.at;
      }
    }
  });

  it('waits for a solar storm to pass before starting an event', () => {
    const director = new EventDirector({ seed: 21 });
    director.start(0);
    const first = director.nextEvent.hours;
    // Tempestade cobrindo a hora do primeiro evento e mais 1 hora
    const stormEnd = first + 1;
    const log = simulate(director, 0, first + 3, (h) => h >= first - 0.5 && h < stormEnd);
    const start = log.find((e) => e.type === 'event-start');
    expect(start.at).toBeGreaterThanOrEqual(stormEnd);
  });

  it('lets demo buttons start an event right away, even in act 1', () => {
    const director = new EventDirector({ seed: 4 });
    expect(director.trigger('meteor', 2)).toBe(true);
    expect(director.trigger('nope', 2)).toBe(false);
    // A historia pode fixar parte do sorteio: o redemoinho do ato 2 sempre cruza os paineis
    for (let i = 0; i < 6; i++) {
      const story = new EventDirector({ seed: 100 + i });
      story.trigger('dustDevil', 1, { crossesPanels: true });
      story.update(1);
      expect(story.active).toMatchObject({ type: 'dustDevil', params: { crossesPanels: true } });
    }
    director.update(2);
    const [start] = director.drainEvents();
    expect(start.type).toBe('event-start');
    expect(start.event.type).toBe('meteor');
    expect(start.event.manual).toBe(true);
    expect(director.active.type).toBe('meteor');
    director.update(2 + start.event.durationHours);
    expect(director.drainEvents()[0].type).toBe('event-end');
    expect(director.active).toBeNull();
    expect(director.history.map((e) => e.type)).toEqual(['meteor']);
  });

  it('schedules an aurora for the next night after a solar storm', () => {
    const director = new EventDirector({ seed: 6 });
    director.requestAurora(12);
    director.requestAurora(12.5); // so uma aurora na fila
    expect(director.queue.filter((e) => e.type === 'aurora')).toHaveLength(1);
    director.update(19);
    expect(director.drainEvents()).toEqual([]);
    director.update(20.01);
    const [start] = director.drainEvents();
    expect(start.event.type).toBe('aurora');
  });
});
