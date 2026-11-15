// @ts-nocheck
import { describe, it, expect } from 'vitest';
import { crewEventMessage, dailyCrewNeeds } from './crewText.ts';
import { CREW_CONFIG } from '../config/constants.ts';

const ana = { name: 'Ana' };

describe('crewEventMessage', () => {
  it('says who is talking and what is missing', () => {
    expect(crewEventMessage({ type: 'weak', member: ana, lacking: ['water', 'food'] }))
      .toBe("Ana: I'm too weak to work. We need water and food!");
    expect(crewEventMessage({ type: 'weak', member: ana, lacking: ['air'] })).toMatch(/battery/);
    expect(crewEventMessage({ type: 'recovered', member: ana })).toMatch(/^Ana:/);
    expect(crewEventMessage({ type: 'bedridden', member: ana }))
      .toBe('Ana is too weak and must rest in the medical bay. Bring air, water and food back so Ana can get better.');
    expect(crewEventMessage({ type: 'alert', member: ana, text: 'Commander, help!' })).toBe('Ana: Commander, help!');
    expect(crewEventMessage({ type: 'unknown', member: ana })).toBeNull();
  });

  it('never says a crew member went back to Earth: the only way home is the rocket (issue #111)', () => {
    const events = [
      { type: 'weak', member: ana, lacking: ['air', 'water', 'food'] },
      { type: 'recovered', member: ana },
      { type: 'bedridden', member: ana },
      { type: 'alert', member: ana, text: 'Commander, help!' },
    ];
    for (const event of events) expect(crewEventMessage(event)).not.toMatch(/Earth/i);
    // O evento antigo nao existe mais
    expect(crewEventMessage({ type: 'evacuated', member: ana })).toBeNull();
  });
});

describe('dailyCrewNeeds', () => {
  it('scales the needs of one sol (24 game hours) with the crew size', () => {
    const one = dailyCrewNeeds(1);
    const three = dailyCrewNeeds(3);
    expect(one.food).toBeCloseTo(CREW_CONFIG.FOOD_PER_HOUR * 24);
    expect(three.water).toBeCloseTo(3 * one.water);
    expect(three.battery).toBeCloseTo(3 * one.battery);
  });
});
