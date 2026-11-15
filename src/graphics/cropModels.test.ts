// @ts-nocheck
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { createCropItemModel, createCropPlantModel } from './cropModels.ts';

describe('voxel crop silhouettes', () => {
  it('gives every food and plant its own geometry and a ground-level growing origin', () => {
    const signatures = new Set();
    for (const type of ['potato', 'lettuce', 'soy']) {
      const plant = createCropPlantModel(type);
      const food = createCropItemModel(type);
      expect(plant.name).toBe(type + '-plant');
      expect(food.name).toBe(type + '-food');
      signatures.add(JSON.stringify(food.children.map(mesh => [mesh.position.toArray(), mesh.scale.toArray()])));
      const mature = new THREE.Box3().setFromObject(plant);
      plant.scale.y = .2;
      const seedling = new THREE.Box3().setFromObject(plant);
      expect(seedling.max.y).toBeLessThan(mature.max.y);
      expect(seedling.min.y).toBeGreaterThanOrEqual(0);
    }
    expect(signatures.size).toBe(3);
  });
});
