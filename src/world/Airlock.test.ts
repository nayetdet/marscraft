// @ts-nocheck
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { Airlock } from './Airlock.ts';
import { ExpeditionState } from '../core/ExpeditionState.ts';
import { StationSystem } from '../core/StationSystem.ts';
import { MISSION_CONFIG as C } from '../config/constants.ts';

const away = { x: 5, z: 5 };
const outside = { x: 0.5, z: 11 };
const inChamber = { x: 0.5, z: 7.5 };
const run = (airlock, player, seconds) => {
  for (let t = 0; t < seconds; t += 0.1) airlock.update(0.1, player);
};

describe('airlock', () => {
  it('docks on entry and blocks an unsuited departure without blocking a return', () => {
    const airlock = new Airlock(new THREE.Scene(), [], new ExpeditionState());
    airlock.survival = { suitEquipped: true };
    const [inner, outer] = airlock.doors;
    airlock.update(0, { x: 0.5, z: 7 });
    airlock.update(0, { x: 0.5, z: inner.z - 0.1 });
    expect(airlock.survival.suitEquipped).toBe(false);
    expect(airlock.request(outer, { x: 0.5, z: 7 })).toContain('Equip EVA Suit');
    expect(airlock.pending).toBeNull();
    expect(airlock.request(outer, { x: 0.5, z: 10 })).not.toContain('Equip EVA Suit');
  });
  it('only opens a door after the cycle ends and interlocks the doors', () => {
    const colliders = [];
    const airlock = new Airlock(new THREE.Scene(), colliders, new ExpeditionState());
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
    const airlock = new Airlock(new THREE.Scene(), [], new ExpeditionState());
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
    const mission = new ExpeditionState();
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
    const mission = new ExpeditionState();
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

  // Segundos ate a porta pedida abrir por completo, com o jogador parado em `player`
  const secondsToOpen = (airlock, door, player) => {
    airlock.request(door, player);
    let elapsed = 0;
    while (door.openness < 1 && elapsed < 30) {
      airlock.update(0.05, player);
      elapsed += 0.05;
    }
    return elapsed;
  };
  // Airlock com o jogador na camara e a porta de dentro aberta, pronto para sair para Marte
  const readyToLeave = (energy) => {
    const mission = new ExpeditionState();
    const airlock = new Airlock(new THREE.Scene(), [], mission);
    airlock.request(airlock.doors[0], away);
    run(airlock, away, 2);
    mission.energy = energy;
    return { mission, airlock };
  };

  it('never locks the player out: with no power the door opens by hand, 3 s slower (issue #79)', () => {
    expect(C.AIRLOCK_MANUAL_EXTRA_SECONDS).toBe(3);

    // Saindo: da camara para Marte
    const powered = readyToLeave(50);
    const dead = readyToLeave(0);
    const poweredOut = secondsToOpen(powered.airlock, powered.airlock.doors[1], inChamber);
    const manualOut = secondsToOpen(dead.airlock, dead.airlock.doors[1], inChamber);
    expect(powered.airlock.doors[1].openness).toBe(1);
    expect(dead.airlock.doors[1].openness).toBe(1);
    expect(manualOut - poweredOut).toBeCloseTo(C.AIRLOCK_MANUAL_EXTRA_SECONDS, 1);
    expect(powered.mission.energy).toBe(50 - C.AIRLOCK_COST);
    expect(dead.mission.energy).toBe(0);

    // Voltando: de fora, com a base sem energia, abre a porta externa e depois a interna
    dead.airlock.request(dead.airlock.doors[1], outside); // fecha a porta externa atras de si
    run(dead.airlock, outside, 1);
    expect(dead.airlock.doors[1].openness).toBe(0);
    const manualBackOuter = secondsToOpen(dead.airlock, dead.airlock.doors[1], outside);
    expect(dead.airlock.doors[1].openness).toBe(1);
    expect(manualBackOuter).toBeGreaterThanOrEqual(C.AIRLOCK_MANUAL_EXTRA_SECONDS);

    const manualIn = secondsToOpen(dead.airlock, dead.airlock.doors[0], inChamber);
    powered.airlock.request(powered.airlock.doors[1], outside);
    run(powered.airlock, outside, 1);
    secondsToOpen(powered.airlock, powered.airlock.doors[1], outside);
    const poweredIn = secondsToOpen(powered.airlock, powered.airlock.doors[0], inChamber);
    expect(dead.airlock.doors[0].openness).toBe(1);
    expect(manualIn - poweredIn).toBeCloseTo(C.AIRLOCK_MANUAL_EXTRA_SECONDS, 1);
  });

  it('tells the player and the HUD that the door is being cranked by hand', () => {
    const mission = new ExpeditionState();
    mission.energy = 0;
    const airlock = new Airlock(new THREE.Scene(), [], mission);
    const events = [];
    airlock.onEvent = (type) => events.push(type);
    airlock.pressurized = false;

    expect(airlock.request(airlock.doors[1], outside)).toMatch(/by hand/);
    expect(airlock.manual).toBe(true);
    run(airlock, outside, C.AIRLOCK_MANUAL_EXTRA_SECONDS / 2);
    expect(airlock.status()).toMatchObject({ step: 'manual', manual: true });
    expect(airlock.doors[1].openness).toBe(0);
    expect(events).toEqual(['manual-open']);
    run(airlock, outside, C.AIRLOCK_MANUAL_EXTRA_SECONDS);
    expect(airlock.doors[1].openness).toBe(1);
    expect(events).toEqual(['manual-open', 'door-open']);

    // Com energia de novo o ciclo volta ao normal, sem manivela
    mission.energy = 50;
    airlock.request(airlock.doors[1], outside); // fecha
    run(airlock, outside, 1);
    expect(airlock.request(airlock.doors[1], outside)).not.toMatch(/by hand/);
    expect(airlock.manual).toBe(false);
    expect(airlock.steps).not.toContain('manual');
  });

  it('entering by hand still lets the dust in: no power means no suit cleaning', () => {
    const mission = new ExpeditionState();
    const stations = new StationSystem(mission);
    const events = [];
    const airlock = new Airlock(new THREE.Scene(), [], mission);
    airlock.stations = stations;
    airlock.onEvent = (type) => events.push(type);
    airlock.pressurized = false;
    stations.dirtySuit = true;
    mission.energy = 0;

    airlock.request(airlock.doors[0], inChamber);
    run(airlock, inChamber, 8);
    expect(airlock.doors[0].openness).toBe(1);
    expect(stations.dirtySuit).toBe(true);
    expect(events).toEqual(['clean-skipped', 'manual-open', 'door-open']);
  });
});

it('clips sliding leaves to the opening while leaving the frame intact', () => {
  const airlock = new Airlock(new THREE.Scene(), [], new ExpeditionState());
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

it('a grounded commander cannot open the outer door from inside, but can always come back in (issue #104)', () => {
  const airlock = new Airlock(new THREE.Scene(), [], new ExpeditionState());
  const [, outer] = airlock.doors;
  let grounded = 'Flight doctor: no more walks outside!';
  airlock.exitBlock = () => grounded;
  expect(airlock.request(outer, inChamber)).toBe(grounded);
  expect(airlock.pending).toBe(null);
  run(airlock, inChamber, C.AIRLOCK_CYCLE + 1);
  expect(outer.openness).toBe(0);

  // Quem ja esta la fora sempre consegue entrar
  expect(airlock.request(outer, outside)).not.toBe(grounded);
  expect(airlock.pending).toBe(outer);

  // Liberado (por exemplo, a caminhada final ate o foguete pronto): a porta volta a abrir
  grounded = null;
  const free = new Airlock(new THREE.Scene(), [], new ExpeditionState());
  free.exitBlock = () => grounded;
  free.request(free.doors[1], inChamber);
  run(free, inChamber, C.AIRLOCK_CYCLE + 1);
  expect(free.doors[1].openness).toBe(1);
});
