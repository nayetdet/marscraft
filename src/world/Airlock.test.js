import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { Airlock } from './Airlock.js';
import { MissionSystem } from '../core/MissionSystem.js';
import { StationSystem } from '../core/StationSystem.js';

const away = { x: 5, z: 5 };
const outside = { x: 0.5, z: 11 };
const inChamber = { x: 0.5, z: 7.5 };
const run = (airlock, player, seconds) => {
  for (let t = 0; t < seconds; t += 0.1) airlock.update(0.1, player);
};

describe('airlock', () => {
  it('only opens a door after the cycle ends and interlocks the doors', () => {
    const colliders = [];
    const airlock = new Airlock(new THREE.Scene(), colliders, new MissionSystem());
    const [inner, outer] = airlock.doors;
    airlock.request(inner, away);
    run(airlock, away, 2);
    expect(inner.openness).toBe(1);
    expect(colliders).not.toContain(inner.collider);

    // Para abrir para Marte, o ar sai primeiro: a porta de fora so abre depois do ciclo
    airlock.request(outer, inChamber);
    run(airlock, inChamber, 1);
    expect(inner.openness).toBe(0);
    expect(outer.openness).toBe(0);
    expect(airlock.status().step).toBe('depressurize');
    expect(airlock.vapor.visible).toBe(true);
    run(airlock, inChamber, 4);
    expect(outer.openness).toBe(1);
    expect(airlock.pressurized).toBe(false);
    expect(colliders).toContain(inner.collider);
    expect(colliders).not.toContain(outer.collider);
  });

  it('refills with air and cleans a dusty suit before opening to the base', () => {
    const mission = new MissionSystem();
    const stations = new StationSystem(mission);
    const events = [];
    const airlock = new Airlock(new THREE.Scene(), [], mission);
    airlock.stations = stations;
    airlock.onEvent = (type) => events.push(type);
    const [inner, outer] = airlock.doors;
    airlock.request(outer, outside);
    run(airlock, outside, 5);
    stations.dirtySuit = true;

    airlock.request(inner, inChamber);
    run(airlock, inChamber, 4);
    expect(airlock.status().step).toBe('clean');
    expect(inner.openness).toBe(0);
    run(airlock, inChamber, 3);
    expect(inner.openness).toBe(1);
    expect(stations.dirtySuit).toBe(false);
    expect(events).toEqual(['suit-cleaned']);
  });

  it('lets the dust in when there is no power to clean the suit', () => {
    const mission = new MissionSystem();
    const stations = new StationSystem(mission);
    const events = [];
    const airlock = new Airlock(new THREE.Scene(), [], mission);
    airlock.stations = stations;
    airlock.onEvent = (type) => events.push(type);
    airlock.pressurized = false;
    stations.dirtySuit = true;
    mission.energy = 1.5; // paga o ciclo (1), mas nao a limpeza (2)

    airlock.request(airlock.doors[0], inChamber);
    run(airlock, inChamber, 6);
    expect(airlock.doors[0].openness).toBe(1);
    expect(stations.dirtySuit).toBe(true);
    expect(events).toEqual(['clean-skipped']);
  });

  it('refuses a cycle with no power', () => {
    const mission = new MissionSystem();
    mission.energy = 0;
    const airlock = new Airlock(new THREE.Scene(), [], mission);
    expect(airlock.request(airlock.doors[0], away)).toMatch(/energy/);
  });
});
