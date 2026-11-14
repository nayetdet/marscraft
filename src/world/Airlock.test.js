import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { Airlock } from './Airlock.js';
import { MissionSystem } from '../core/MissionSystem.js';

const away = { x: 5, z: 5 };
describe('airlock', () => {
  it('cycles and interlocks the doors while updating collision', () => {
    const colliders = [];
    const airlock = new Airlock(new THREE.Scene(), colliders, new MissionSystem());
    const [inner, outer] = airlock.doors;
    airlock.request(inner, away);
    expect(inner.target).toBe(1);
    airlock.update(0.2, away);
    expect(inner.openness).toBe(1);
    expect(airlock.vapor.visible).toBe(true);
    for (let i = 0; i < 50; i++) airlock.update(0.1, away);
    expect(inner.openness).toBe(1);
    expect(colliders).not.toContain(inner.collider);
    airlock.request(outer, away);
    for (let i = 0; i < 50; i++) airlock.update(0.1, away);
    expect(inner.openness).toBe(0);
    expect(outer.openness).toBe(1);
    expect(colliders).toContain(inner.collider);
    expect(colliders).not.toContain(outer.collider);
  });
  it('refuses a cycle with no power', () => {
    const mission = new MissionSystem();
    mission.energy = 0;
    const airlock = new Airlock(new THREE.Scene(), [], mission);
    expect(airlock.request(airlock.doors[0], away)).toMatch(/energy/);
  });
});
