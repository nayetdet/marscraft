import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { Airlock } from './Airlock.js';
import { MissionSystem } from '../core/MissionSystem.js';
import { StationSystem } from '../core/StationSystem.js';
import { MISSION_CONFIG as C } from '../config/constants.js';

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
    run(airlock, inChamber, C.AIRLOCK_CYCLE / 2);
    expect(inner.openness).toBe(0);
    expect(outer.openness).toBe(0);
    expect(airlock.status().step).toBe('depressurize');
    expect(airlock.vapor.visible).toBe(true);
    run(airlock, inChamber, C.AIRLOCK_CYCLE + 0.5);
    expect(outer.openness).toBe(1);
    expect(airlock.pressurized).toBe(false);
    expect(colliders).toContain(inner.collider);
    expect(colliders).not.toContain(outer.collider);
  });

  it('plays door and decompression events in sequence after both doors close', () => {
    const airlock = new Airlock(new THREE.Scene(), [], new MissionSystem());
    const events = [];
    airlock.onEvent = (type) => events.push(type);
    const [inner, outer] = airlock.doors;

    airlock.request(inner, away);
    run(airlock, away, 1);
    expect(events).toEqual(['door-open']);

    airlock.request(outer, inChamber);
    expect(events).toEqual(['door-open', 'door-close']);
    let elapsed = 0;
    while (!events.includes('depressurize') && elapsed < 2) {
      airlock.update(0.1, inChamber);
      elapsed += 0.1;
    }
    expect(inner.openness).toBe(0);
    expect(outer.openness).toBe(0);
    expect(events).toEqual(['door-open', 'door-close', 'depressurize']);

    run(airlock, inChamber, C.AIRLOCK_CYCLE + 1);
    expect(outer.openness).toBe(1);
    expect(events).toEqual(['door-open', 'door-close', 'depressurize', 'door-open']);
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
    run(airlock, inChamber, 0.2 + C.AIRLOCK_CYCLE + C.SUIT_CLEAN_TIME / 2);
    expect(airlock.status().step).toBe('clean');
    expect(inner.openness).toBe(0);
    run(airlock, inChamber, C.SUIT_CLEAN_TIME + 0.5);
    expect(inner.openness).toBe(1);
    expect(stations.dirtySuit).toBe(false);
    expect(events).toEqual(['depressurize', 'door-open', 'door-close', 'suit-cleaned', 'door-open']);
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
    expect(events).toEqual(['clean-skipped', 'door-open']);
  });

  it('refuses a cycle with no power', () => {
    const mission = new MissionSystem();
    mission.energy = 0;
    const airlock = new Airlock(new THREE.Scene(), [], mission);
    expect(airlock.request(airlock.doors[0], away)).toMatch(/energy/);
  });
});

it('clips sliding leaves to the opening while leaving the frame intact', () => {
  const airlock = new Airlock(new THREE.Scene(), [], new MissionSystem());
  for (const door of airlock.doors) {
    const panel = door.left.children[0];
    const planes = panel.material.clippingPlanes;
    expect(planes).toHaveLength(2);
    expect(planes.every(plane => plane.distanceToPoint(new THREE.Vector3(.5, 11, door.z)) >= 0)).toBe(true);
    expect(planes.some(plane => plane.distanceToPoint(new THREE.Vector3(-2, 11, door.z)) < 0)).toBe(true);
    expect(planes.some(plane => plane.distanceToPoint(new THREE.Vector3(3, 11, door.z)) < 0)).toBe(true);
    expect(door.group.children[2].material.clippingPlanes).toBeNull();
    door.target = 1;
    run(airlock, away, 2);
    expect(door.openness).toBe(1);
    door.group.updateMatrixWorld(true);
    for (const leaf of [door.left, door.right]) {
      const vertices = leaf.children[0].geometry.attributes.position;
      for (let i = 0; i < vertices.count; i++) {
        const point = new THREE.Vector3().fromBufferAttribute(vertices, i).applyMatrix4(leaf.children[0].matrixWorld);
        expect(planes.some(plane => plane.distanceToPoint(point) < 0)).toBe(true);
      }
    }
  }
});
