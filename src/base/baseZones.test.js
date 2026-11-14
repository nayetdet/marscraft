import { describe, it, expect } from 'vitest';
import { STORM_SHELTER_ZONE, isInsideStormShelter } from './baseZones.js';
import { isInsidePressurizedVolume } from '../world/habitatLayout.js';

describe('storm shelter zone', () => {
  it('contains its own centre and excludes the hub and the command console', () => {
    const z = STORM_SHELTER_ZONE;
    expect(isInsideStormShelter({ x: (z.minX + z.maxX) / 2, z: (z.minZ + z.maxZ) / 2 })).toBe(true);
    expect(isInsideStormShelter({ x: 0, z: 1 })).toBe(false);
    expect(isInsideStormShelter({ x: 0, z: -3.6 })).toBe(false);
  });

  it('sits completely inside the pressurized main habitat', () => {
    const z = STORM_SHELTER_ZONE;
    for (const x of [z.minX + 0.01, z.maxX - 0.01]) {
      for (const zz of [z.minZ + 0.01, z.maxZ - 0.01]) {
        expect(isInsidePressurizedVolume(x, 11.6, zz)).toBe(true);
      }
    }
  });
});
