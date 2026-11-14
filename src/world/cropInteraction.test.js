import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { removeCrop, targetCrop } from './cropInteraction.js';

describe('crop interaction', () => {
  it('selects a plant before the ground, but not through a nearer block', () => {
    const plant = new THREE.Group();
    plant.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1)));
    plant.position.z = -2;
    plant.updateMatrixWorld(true);
    const origin = new THREE.Vector3();
    const direction = new THREE.Vector3(0, 0, -1);
    expect(targetCrop([plant], origin, direction, 5, { hit: true, distance: 3 }).plant).toBe(plant);
    const wall = { hit: true, distance: 1 };
    expect(targetCrop([plant], origin, direction, 5, wall)).toBe(wall);
    expect(targetCrop([plant], origin, direction, 1, { hit: false }).hit).toBe(false);
  });

  it('removes the plant and its collision box exactly once', () => {
    const parent = new THREE.Group();
    const plant = new THREE.Group();
    const collider = {};
    plant.userData.collider = collider;
    parent.add(plant);
    const plants = [plant];
    const colliders = [collider];
    expect(removeCrop(plant, plants, colliders)).toBe(true);
    expect(parent.children).toHaveLength(0);
    expect(plants).toHaveLength(0);
    expect(colliders).toHaveLength(0);
    expect(removeCrop(plant, plants, colliders)).toBe(false);
  });
});
