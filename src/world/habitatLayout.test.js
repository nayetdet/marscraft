import { describe, it, expect } from 'vitest';
import { isInsidePressurizedVolume } from './habitatLayout.js';
import { buildNasaSpaceshipAndBase } from './nasaSpaceshipBuilder.js';
import { BLOCK_IDS } from '../config/blockTypes.js';

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
    for (let x = -30; x <= 30; x++) {
      for (let y = 0; y <= 30; y++) {
        for (let z = -40; z <= 30; z++) {
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
    ['gym corridor', -5.5, 11.7, 6.5],
    ['gym module', -8.5, 11.7, 10.5],
    ['north spine corridor', -2.5, 11.7, -24.5],
    ['power module', -12.5, 11.7, -16.5],
    ['link to the kitchen', 1.5, 11.7, -16.5],
    ['workshop module', 7.5, 11.7, -30.5],
  ])('counts the %s as pressurized', (_, x, y, z) => {
    expect(isInsidePressurizedVolume(x, y, z)).toBe(true);
  });

  it.each([
    ['on the habitat roof', 5.5, 16.7, 0.5],
    ['outside next to the airlock', 4.5, 11.7, 7.5],
    ['outside in a chamfered corner', -5.5, 11.7, -5.5],
    ['on the tunnel roof', -9.5, 15.7, 0.5],
    ['on the side of the greenhouse dome', -17.5, 15.7, 5.5],
    ['on the open surface', 0.5, 11.7, 24.5],
    ['outside between the power and bathroom modules', -12.5, 11.7, -23.5],
    ['outside between the spine and the kitchen', 1.5, 11.7, -13.5],
  ])('does not count standing %s as pressurized', (_, x, y, z) => {
    expect(isInsidePressurizedVolume(x, y, z)).toBe(false);
  });
});
