import { describe, it, expect } from 'vitest';
import { findExposedIce } from './iceSensor.js';
import { BLOCK_IDS } from '../config/blockTypes.js';

function createMapWorld() {
  const blocks = new Map();
  const key = (x, y, z) => `${x},${y},${z}`;
  return {
    sizeY: 20,
    getBlock: (x, y, z) => blocks.get(key(x, y, z)) ?? BLOCK_IDS.AIR,
    setBlock: (x, y, z, id) => blocks.set(key(x, y, z), id),
  };
}

function fillCube(world, cx, cy, cz, id) {
  for (let x = cx - 1; x <= cx + 1; x++) {
    for (let y = cy - 1; y <= cy + 1; y++) {
      for (let z = cz - 1; z <= cz + 1; z++) world.setBlock(x, y, z, id);
    }
  }
}

describe('findExposedIce', () => {
  it('finds ice touching the air and skips ice buried in rock', () => {
    const world = createMapWorld();
    world.setBlock(3, 5, 3, BLOCK_IDS.MARS_ICE);
    fillCube(world, -5, 5, -5, BLOCK_IDS.BASALT);
    world.setBlock(-5, 5, -5, BLOCK_IDS.MARS_ICE); // cercado por basalto

    expect(findExposedIce(world, { x: 0, z: 0 }, 10)).toEqual([{ x: 3, y: 5, z: 3 }]);
  });

  it('only looks inside the radius and respects the block limit', () => {
    const world = createMapWorld();
    world.setBlock(30, 5, 0, BLOCK_IDS.MARS_ICE);
    expect(findExposedIce(world, { x: 0, z: 0 }, 10)).toEqual([]);

    for (let i = 0; i < 5; i++) world.setBlock(i, 5, 0, BLOCK_IDS.MARS_ICE);
    expect(findExposedIce(world, { x: 0, z: 0 }, 10, 3)).toHaveLength(3);
  });
});
