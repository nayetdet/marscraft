// @ts-nocheck
import { describe, it, expect } from 'vitest';
import { isInsidePressurizedVolume } from './habitatLayout.ts';
import { buildNasaSpaceshipAndBase } from './nasaSpaceshipBuilder.ts';
import { BLOCK_IDS } from '../config/blockTypes.ts';

function createMapWorld() {
  const blocks = new Map();
  const key = (x, y, z) => `${Math.floor(x)},${Math.floor(y)},${Math.floor(z)}`;
  return {
    getBlock: (x, y, z) => blocks.get(key(x, y, z)) ?? BLOCK_IDS.AIR,
    setBlock: (x, y, z, id) => blocks.set(key(x, y, z), id),
    has: (x, y, z) => blocks.has(key(x, y, z)),
  };
}

describe('isInsidePressurizedVolume', () => {
  it('only marks blocks that the base builder carved out as air', () => {
    const world = createMapWorld();
    buildNasaSpaceshipAndBase(world);
    const wrong = [];
    for (let x = -45; x <= 32; x++) {
      for (let y = 0; y <= 30; y++) {
        for (let z = -50; z <= 30; z++) {
          if (!isInsidePressurizedVolume(x + 0.5, y + 0.5, z + 0.5)) continue;
          // Precisa ser um bloco que o construtor tocou e deixou como ar.
          if (!world.has(x, y, z) || world.getBlock(x, y, z) !== BLOCK_IDS.AIR) wrong.push([x, y, z]);
        }
      }
    }
    expect(wrong).toEqual([]);
  });

  it.each([
    ['main habitat', 0.5, 11.7, 0.5],
    ['main habitat, jumping', 3.5, 13.4, 2.5],
    ['observation cupola', 0.5, 16.7, 0.5],
    ['airlock corridor', 0.5, 11.7, 7.5],
    ['pressurized tunnel', -9.5, 11.7, 0.5],
    ['greenhouse dome', -17.5, 11.7, 2.5],
    ['greenhouse dome, high up near the centre', -26.5, 20.7, 0.5],
    ['gym corridor', -5.5, 11.7, 6.5],
    ['gym module', -8.5, 11.7, 10.5],
    ['main habitat, new north-east corner', 10.5, 11.7, -9.5],
    ['north spine corridor', -2.5, 11.7, -28.5],
    ['power module', -15.5, 11.7, -20.5],
    ['link to the kitchen', 2.5, 11.7, -21.5],
    ['workshop module', 11.5, 11.7, -34.5],
    ['link to the crew quarters', 15.5, 11.7, -7.5],
    ['crew quarters module', 23.5, 11.7, -5.5],
  ])('counts the %s as pressurized', (_, x, y, z) => {
    expect(isInsidePressurizedVolume(x, y, z)).toBe(true);
  });

  it.each([
    ['on the habitat roof', 5.5, 16.7, 0.5],
    ['outside next to the airlock', 4.5, 11.7, 7.5],
    ['outside in a chamfered corner', 12.5, 11.7, 5.5],
    ['on the tunnel roof', -9.5, 15.7, 0.5],
    ['above the side of the greenhouse dome', -17.5, 22.7, 5.5],
    ['on the open surface', 0.5, 11.7, 24.5],
    ['outside, south of the crew quarters link', 15.5, 11.7, -3.5],
    ['outside between the power and bathroom modules', -15.5, 11.7, -27.5],
    ['outside between the spine and the kitchen', 2.5, 11.7, -17.5],
  ])('does not count standing %s as pressurized', (_, x, y, z) => {
    expect(isInsidePressurizedVolume(x, y, z)).toBe(false);
  });
});
