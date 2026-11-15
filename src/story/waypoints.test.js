import { describe, expect, it } from 'vitest';
import { WAYPOINT_LABELS, objectiveTarget, routeWaypoint } from './waypoints.js';

describe('objectiveTarget', () => {
  it('points each act 1 objective at its place', () => {
    expect(objectiveTarget('enter-base')).toBe('airlock');
    expect(objectiveTarget('report')).toBe('console');
    expect(objectiveTarget('collect-ice')).toBe('ice');
  });

  it('sends the player for ice, then to the rocket, while the tank needs ice', () => {
    expect(objectiveTarget('act2', { iceCount: 0, iceNeeded: 6 })).toBe('ice');
    expect(objectiveTarget('act2', { iceCount: 2, iceNeeded: 6 })).toBe('mav');
    // Depois da entrega, a seta leva de volta a base
    expect(objectiveTarget('act2', { iceCount: 0, iceNeeded: 5, needsBase: true })).toBe('airlock');
    expect(objectiveTarget('fuel', { iceCount: 0, iceNeeded: 1 })).toBe('ice');
    expect(objectiveTarget('fuel', { iceCount: 1, iceNeeded: 1 })).toBe('mav');
  });

  it('points at the science terminal once the tank needs no more ice and the science is not sent', () => {
    expect(objectiveTarget('act2', { iceCount: 3, iceNeeded: 0 })).toBe('science');
    expect(objectiveTarget('fuel', { iceNeeded: 0, propellantPct: 80, scienceStep: 'send' })).toBe('science');
    expect(objectiveTarget('fuel', { iceNeeded: 0, propellantPct: 80, scienceStep: 'analyze' })).toBe('science');
    // Escanear vale em qualquer lugar com a luneta: sem seta
    expect(objectiveTarget('act2', { iceNeeded: 0, scienceStep: 'scan' })).toBeNull();
  });

  it('has no place to point at while the factory works or only storms are left', () => {
    expect(objectiveTarget('act2', { iceNeeded: 0, dataSent: true, propellantPct: 80 })).toBeNull();
    expect(objectiveTarget('act2', { iceNeeded: 0, dataSent: true, propellantPct: 100 })).toBeNull();
  });

  it('covers the storm and the last jobs', () => {
    expect(objectiveTarget('storm-guide')).toBe('airlock');
    expect(objectiveTarget('send-data')).toBe('science');
    expect(objectiveTarget('send-data', { scienceStep: 'analyze' })).toBe('science');
    expect(objectiveTarget('send-data', { scienceStep: 'scan' })).toBeNull();
    expect(objectiveTarget('ignite')).toBe('mav');
    expect(objectiveTarget('done')).toBeNull();
    expect(objectiveTarget('failed')).toBeNull();
    expect(objectiveTarget(null)).toBeNull();
  });

  it('has a label for every place', () => {
    for (const place of ['airlock', 'console', 'science', 'ice', 'mav']) {
      expect(WAYPOINT_LABELS[place]).toBeTruthy();
    }
  });
});

describe('routeWaypoint', () => {
  it('points at nothing without a target', () => {
    expect(routeWaypoint(null, true)).toBeNull();
    expect(routeWaypoint(null, false)).toBeNull();
  });

  it('routes outdoor places through the airlock while the player is inside', () => {
    expect(routeWaypoint('ice', true)).toBe('airlock');
    expect(routeWaypoint('mav', true)).toBe('airlock');
    expect(routeWaypoint('ice', false)).toBe('ice');
    expect(routeWaypoint('mav', false)).toBe('mav');
  });

  it('routes indoor places through the airlock while the player is outside', () => {
    expect(routeWaypoint('console', false)).toBe('airlock');
    expect(routeWaypoint('console', true)).toBe('console');
  });

  it('drops the airlock arrow once the player is inside', () => {
    expect(routeWaypoint('airlock', false)).toBe('airlock');
    expect(routeWaypoint('airlock', true)).toBeNull();
  });
});
