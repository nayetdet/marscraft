import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { GameEngine } from './GameEngine.js';
import { MISSION_CONFIG } from '../config/constants.js';

describe('greenhouse regrowth', () => {
  it('harvests once, pauses without power and restores the crop after growing', () => {
    const engine = Object.create(GameEngine.prototype);
    const plant = new THREE.Group();
    const collider = {};
    plant.userData.collider = collider;
    engine.plants = [plant];
    engine.customColliders = [collider];
    engine.growingCrops = [];
    engine.expedition = { greenhousePowered: false };
    expect(engine._harvestCrop(plant)).toBe(true);
    expect(engine._harvestCrop(plant)).toBe(false);
    engine._growCrops(MISSION_CONFIG.CROP_GROWTH_TIME);
    expect(engine.plants).toHaveLength(0);
    expect(plant.scale.x).toBe(0.25);
    engine.expedition.greenhousePowered = true;
    engine._growCrops(MISSION_CONFIG.CROP_GROWTH_TIME);
    expect(engine.plants).toEqual([plant]);
    expect(engine.customColliders).toEqual([collider]);
    expect(plant.scale.x).toBe(1);
  });
});
