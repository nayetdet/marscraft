import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { GameEngine } from './GameEngine.js';
import { GREENHOUSE_MONITOR_POS } from '../world/greenhouseLayout.js';

describe('greenhouse', () => {
  it('removes a harvested plant without regrowing it for free', () => {
    const engine = Object.create(GameEngine.prototype);
    const parent = new THREE.Group();
    const plant = new THREE.Group();
    const collider = {};
    parent.add(plant);
    plant.userData.collider = collider;
    engine.plants = [plant];
    engine.customColliders = [collider];
    expect(engine._harvestCrop(plant)).toBe(true);
    expect(engine._harvestCrop(plant)).toBe(false);
    expect(engine.plants).toHaveLength(0);
    expect(engine.customColliders).toHaveLength(0);
    expect(parent.children).toHaveLength(0);
  });

  it('targets the greenhouse food monitor only when looking at it instead of anywhere in the dome', () => {
    const engine = Object.create(GameEngine.prototype);
    engine.airlock = { doors: [] };
    engine._interactionDir = new THREE.Vector3();
    engine._interactionOffset = new THREE.Vector3();
    engine._interactionPoint = new THREE.Vector3();
    const pos = new THREE.Vector3(-15.7, 11.75, 0.3);
    const lookAtMonitor = new THREE.Vector3(
      GREENHOUSE_MONITOR_POS.x - pos.x,
      GREENHOUSE_MONITOR_POS.y - pos.y,
      GREENHOUSE_MONITOR_POS.z - pos.z
    ).normalize();
    engine.player = {
      pos,
      getLookDirection: (target) => target.copy(lookAtMonitor),
    };
    expect(engine._getInteraction()?.type).toBe('greenhouse');

    // Looking away in the greenhouse does not trigger the food monitor
    engine.player.getLookDirection = (target) => target.set(0, 0, -1);
    expect(engine._getInteraction()).toBeNull();
  });
});
