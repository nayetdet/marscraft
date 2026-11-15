// @ts-nocheck
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { HABITAT_LAYOUT } from '../world/habitatLayout.ts';
import { CROP_CONFIG } from '../config/constants.ts';
import { GREENHOUSE_BASKETS, GREENHOUSE_PLOTS, PLOT_PLANT_CELLS } from '../world/greenhouseLayout.ts';
import { buildGreenhouseFields, cropGrowthLook } from './greenhouseFields.ts';

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

describe('greenhouse field planting feedback', () => {
  // Cor da primeira bandeja do campo: pula as celulas dos campos anteriores (24 vertices por caixa)
  const soilColorOf = (scene, fields, plotIndex) => {
    const colors = scene.getObjectByName('greenhouse-soil').geometry.attributes.color;
    const start = fields.cellCounts.slice(0, plotIndex).reduce((a, b) => a + b, 0) * 24;
    return [colors.getX(start), colors.getY(start), colors.getZ(start)];
  };
  const build = () => {
    const scene = new THREE.Scene();
    return { scene, fields: buildGreenhouseFields(scene) };
  };
  const emptyPlots = () => GREENHOUSE_PLOTS.map(() => ({ crop: null }));

  it('darkens the soil of the whole planted field and dries it again after harvest', () => {
    const { scene, fields } = build();
    const dry = soilColorOf(scene, fields, 1);
    const plots = emptyPlots();
    plots[1].crop = { type: 'lettuce', progress: 0 };
    fields.update(plots);
    const wet = soilColorOf(scene, fields, 1);
    expect(wet[0] + wet[1] + wet[2]).toBeLessThan(dry[0] + dry[1] + dry[2]);
    expect(soilColorOf(scene, fields, 2)).toEqual(dry);

    plots[1].crop = null;
    fields.update(plots);
    expect(soilColorOf(scene, fields, 1)).toEqual(dry);
  });

  it('shows a sprout above the soil on every tray right after planting', () => {
    const { scene, fields } = build();
    const plots = emptyPlots();
    plots[5].crop = { type: 'soy', progress: 0 };
    fields.update(plots);
    const sprout = scene.getObjectByName('greenhouse-crop-sprout');
    expect(sprout.visible).toBe(true);
    expect(sprout.count).toBe(PLOT_PLANT_CELLS[5].length);
    expect(scene.getObjectByName('greenhouse-crop-soy').visible).toBe(false);

    // O broto fica acima da terra (0,07) e alto o bastante para ser visto de longe
    sprout.geometry.computeBoundingBox();
    const matrix = new THREE.Matrix4();
    sprout.getMatrixAt(0, matrix);
    const box = sprout.geometry.boundingBox.clone().applyMatrix4(matrix);
    expect(box.max.y).toBeGreaterThan(0.07 + 0.2);
  });

  it('swaps the sprout for the crop as it grows and marks ready fields', () => {
    const { scene, fields } = build();
    const plots = emptyPlots();
    plots[1].crop = { type: 'potato', progress: CROP_CONFIG.potato.seconds * 0.6 };
    plots[2].crop = { type: 'lettuce', progress: CROP_CONFIG.lettuce.seconds };
    plots[0].crop = { type: 'soy', progress: CROP_CONFIG.soy.seconds };
    fields.update(plots);
    expect(scene.getObjectByName('greenhouse-crop-sprout').visible).toBe(false);
    expect(scene.getObjectByName('greenhouse-crop-potato').count).toBe(PLOT_PLANT_CELLS[1].length);
    expect(scene.getObjectByName('greenhouse-crop-lettuce').count).toBe(PLOT_PLANT_CELLS[2].length);
    // Pronto: o campo 2 e o canteiro do jardim (campo 0); o campo 1 ainda cresce
    const markers = scene.getObjectByName('greenhouse-ready-markers');
    expect(markers.visible).toBe(true);
    expect(markers.count).toBe(2);
  });
});

describe('cropGrowthLook', () => {
  it('starts as a visible sprout, then grows the crop to full size', () => {
    const s = CROP_CONFIG.lettuce.seconds;
    const start = cropGrowthLook(0, s);
    expect(start.stage).toBe('sprout');
    expect(start.scale).toBeGreaterThanOrEqual(0.5);
    expect(cropGrowthLook(s * 0.5, s).stage).toBe('growing');
    expect(cropGrowthLook(s * 0.5, s).scale).toBeLessThan(cropGrowthLook(s * 0.9, s).scale);
    expect(cropGrowthLook(s, s)).toEqual({ stage: 'ready', scale: 1 });
  });
});
