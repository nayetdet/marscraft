import { describe, it, expect } from 'vitest';
import { crewEventMessage, dailyCrewNeeds } from './crewText.js';
import { CREW_CONFIG } from '../config/constants.js';

const ana = { name: 'Ana' };

describe('crewEventMessage', () => {
  it('says who is talking and what is missing', () => {
    expect(crewEventMessage({ type: 'weak', member: ana, lacking: ['water', 'food'] }))
      .toBe("Ana: I'm too weak to work. We need water and food!");
    expect(crewEventMessage({ type: 'weak', member: ana, lacking: ['air'] })).toMatch(/battery/);
    expect(crewEventMessage({ type: 'recovered', member: ana })).toMatch(/^Ana:/);
    expect(crewEventMessage({ type: 'evacuated', member: ana })).toMatch(/Earth/);
    expect(crewEventMessage({ type: 'alert', member: ana, text: 'Commander, help!' })).toBe('Ana: Commander, help!');
    expect(crewEventMessage({ type: 'unknown', member: ana })).toBeNull();
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
