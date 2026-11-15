// @ts-nocheck
import { describe, it, expect } from 'vitest';
import { EVENTS_CONFIG } from '../config/constants.ts';
import { EVENT_FACTS, compassDirection, eventCard, eventsSummary, meteorToast, quakeToast } from './eventText.ts';

const ALL_TYPES = [...EVENTS_CONFIG.RANDOM_TYPES, 'aurora'];
const DATE = /\d{2}\/\d{2}\/\d{4}/;

describe('event cards', () => {
  it('every event has a real fact with a date and a source', () => {
    for (const type of ALL_TYPES) {
      const card = eventCard(type, { stationName: 'water recycler' });
      expect(card.title).toBeTruthy();
      expect(card.lines.length).toBeGreaterThan(0);
      expect(card.fact).toMatch(DATE);
      expect(card.source).toBeTruthy();
      expect(EVENT_FACTS[type]).toBeTruthy();
    }
  });

  it('names the damaged station in the marsquake card', () => {
    const card = eventCard('marsquake', { stationName: 'oxygen generator' });
    expect(card.lines.map((l) => l.text).join(' ')).toContain('oxygen generator');
  });

  it('uses no emoji', () => {
    const text = JSON.stringify(ALL_TYPES.map((t) => eventCard(t)));
    expect(text).not.toMatch(/\p{Extended_Pictographic}/u);
  });
});

describe('event messages', () => {
  it('points to the side of the base (north is -z, east is +x)', () => {
    expect(compassDirection(0, -10)).toBe('north');
    expect(compassDirection(10, 0)).toBe('east');
    expect(compassDirection(0, 10)).toBe('south');
    expect(compassDirection(-10, 0)).toBe('west');
    expect(compassDirection(7, 7)).toBe('southeast');
  });

  it('builds the toasts and the victory summary', () => {
    expect(meteorToast({ iceBlocks: 12, distance: 30, direction: 'east' })).toContain('12 ice blocks');
    expect(quakeToast({ stationName: 'medical bay', lostPct: 35 })).toContain('35%');
    expect(eventsSummary([])).toBe('none');
    expect(eventsSummary([{ type: 'meteor' }, { type: 'marsquake' }, { type: 'meteor' }])).toBe('Meteor impact x2, Marsquake');
  });
});
