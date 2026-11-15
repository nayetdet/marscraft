import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { HABITAT_LAYOUT } from '../world/habitatLayout.js';
import { GREENHOUSE_BASKETS } from '../world/greenhouseLayout.js';
import { buildGreenhouseFields } from './greenhouseFields.js';

describe('greenhouse harvest baskets', () => {
  it('builds floor-aligned baskets with crop item models that reveal progressively with stock', () => {
    const scene = new THREE.Scene();
    const fields = buildGreenhouseFields(scene);
    const floorY = HABITAT_LAYOUT.FLOOR_Y + 1;

    for (const { type } of GREENHOUSE_BASKETS) {
      const basket = scene.getObjectByName(`harvest-basket-${type}`);
      expect(basket).toBeDefined();

      const foodItems = basket.children.filter((child) => child.name === `${type}-food`);
      expect(foodItems.length).toBe(8);
      expect(foodItems.every((item) => !item.visible)).toBe(true);

      // Frame sits cleanly on the greenhouse floor and leaves space between adjacent baskets
      const frame = basket.children.find((child) => child.isMesh);
      const frameBox = new THREE.Box3().setFromObject(frame);
      expect(frameBox.min.y).toBeGreaterThanOrEqual(floorY - 1e-4);
      expect(frameBox.max.z - frameBox.min.z).toBeLessThan(1.0);

      // Every food item stays above the burlap liner and inside the basket walls
      for (const item of foodItems) {
        item.updateMatrixWorld(true);
        const itemBox = new THREE.Box3().setFromObject(item);
        expect(itemBox.min.y).toBeGreaterThanOrEqual(floorY + 0.12);
        expect(itemBox.min.x).toBeGreaterThan(frameBox.min.x + 0.03);
        expect(itemBox.max.x).toBeLessThan(frameBox.max.x - 0.03);
        expect(itemBox.min.z).toBeGreaterThan(frameBox.min.z + 0.03);
        expect(itemBox.max.z).toBeLessThan(frameBox.max.z - 0.03);
      }
    }

    const getVisibleCounts = () => Object.fromEntries(
      GREENHOUSE_BASKETS.map(({ type }) => {
        const basket = scene.getObjectByName(`harvest-basket-${type}`);
        const count = basket.children.filter((child) => child.name === `${type}-food` && child.visible).length;
        return [type, count];
      })
    );

    fields.update([], { stock: { potato: 1, lettuce: 4, soy: 20 }, stalled: true });
    expect(getVisibleCounts()).toEqual({ potato: 1, lettuce: 4, soy: 8 });

    fields.update([], { stock: { potato: 0, lettuce: 2, soy: 0 }, stalled: false });
    expect(getVisibleCounts()).toEqual({ potato: 0, lettuce: 2, soy: 0 });
  });
});
