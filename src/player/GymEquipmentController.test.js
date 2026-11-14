import { describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { GymEquipmentController } from './GymEquipmentController.js';
import { MissionSystem as ExpeditionState } from '../core/MissionSystem.js';
import { StationSystem as HabitatStationSystem } from '../core/StationSystem.js';

describe('GymEquipmentController (in-world 3D treadmill & exercise bike)', () => {
  function createSetup() {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 100);
    const player = {
      pos: new THREE.Vector3(-7.5, 11.7, 10.2),
      vel: new THREE.Vector3(),
      isMoving: false,
    };
    const expedition = new ExpeditionState();
    const stations = new HabitatStationSystem(expedition);
    stations.boneDensity = 42;
    stations.muscleStrength = 45;
    stations.fitness = 43.5;

    const hud = { showToast: vi.fn() };
    const onPlaySound = vi.fn();
    const onDismount = vi.fn();

    const controller = new GymEquipmentController({
      scene,
      camera,
      player,
      stations,
      expedition,
      hud,
      onPlaySound,
      onDismount,
    });

    return { controller, stations, expedition, player, camera, hud, onPlaySound, onDismount };
  }

  it('mounts the exercise bike, positions the 3D astronaut on the saddle, and pedals on [SPACE] until 100%', () => {
    const { controller, stations, onPlaySound, hud } = createSetup();

    controller.mount('bike');
    expect(controller.isActive).toBe(true);
    expect(controller.mode).toBe('bike');
    expect(controller.avatar.group.visible).toBe(true);
    expect(controller.avatar.group.position.x).toBeCloseTo(-5.8, 2);
    expect(controller.avatar.group.position.z).toBeCloseTo(10.82, 2);

    // 7 presses of [SPACE] reach 87.5% progress and animate the legs/arms
    for (let i = 0; i < 7; i++) {
      controller.triggerRep();
    }
    expect(controller.progress).toBeCloseTo(87.5, 2);
    controller.update(0.05);
    expect(controller.avatar.armL.rotation.x).toBeLessThan(-0.8); // hands reaching handlebars

    // 8th press of [SPACE] reaches 100%, completing the set and boosting muscle & bone density
    const prevMuscle = stations.muscleStrength;
    const prevBone = stations.boneDensity;
    controller.triggerRep();

    expect(controller.progress).toBe(0);
    expect(stations.muscleStrength).toBeGreaterThan(prevMuscle);
    expect(stations.boneDensity).toBeGreaterThan(prevBone);
    expect(onPlaySound).toHaveBeenCalled();
    expect(hud.showToast).toHaveBeenCalled();
  });

  it('mounts the space treadmill, runs in 3D on [SPACE], and dismounts back onto the gym floor', () => {
    const { controller, stations, player, onDismount } = createSetup();

    controller.mount('treadmill');
    expect(controller.isActive).toBe(true);
    expect(controller.mode).toBe('treadmill');
    expect(controller.avatar.group.visible).toBe(true);
    expect(controller.avatar.group.position.x).toBeCloseTo(-9.2, 2);

    const prevBone = stations.boneDensity;
    for (let i = 0; i < 8; i++) {
      controller.triggerRep();
    }
    expect(stations.boneDensity).toBeGreaterThan(prevBone);

    controller.dismount();
    expect(controller.isActive).toBe(false);
    expect(controller.avatar.group.visible).toBe(false);
    expect(player.pos.x).toBeCloseTo(-7.6, 2);
    expect(onDismount).toHaveBeenCalledOnce();
  });
});
