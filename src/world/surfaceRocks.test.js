import { describe, it, expect } from 'vitest';
import { scatterRocks } from './surfaceRocks.js';
import { generateMartianTerrain, isBuildZone } from './terrainGenerator.js';
import { buildNasaSpaceshipAndBase } from './nasaSpaceshipBuilder.js';
import { BLOCK_IDS } from '../config/blockTypes.js';
import { WORLD_CONFIG } from '../config/constants.js';

function createArrayWorld() {
  const sizeX = WORLD_CONFIG.SIZE_X;
  const sizeY = WORLD_CONFIG.SIZE_Y;
  const sizeZ = WORLD_CONFIG.SIZE_Z;
  const halfX = sizeX / 2;
  const halfZ = sizeZ / 2;
  const data = new Uint8Array(sizeX * sizeY * sizeZ);
  const index = (x, y, z) => {
    const ix = Math.floor(x) + halfX;
    const iy = Math.floor(y);
    const iz = Math.floor(z) + halfZ;
    if (ix < 0 || ix >= sizeX || iy < 0 || iy >= sizeY || iz < 0 || iz >= sizeZ) return -1;
    return iy * sizeX * sizeZ + iz * sizeX + ix;
  };
  return {
    sizeX, sizeY, sizeZ, halfX, halfZ,
    getBlock(x, y, z) {
      const idx = index(x, y, z);
      return idx === -1 ? BLOCK_IDS.AIR : data[idx];
    },
    setBlock(x, y, z, id) {
      const idx = index(x, y, z);
      if (idx !== -1) data[idx] = id;
    },
  };
}

describe('surface rocks', () => {
  const world = createArrayWorld();
  generateMartianTerrain(world);
  buildNasaSpaceshipAndBase(world);
  const rocks = scatterRocks(world);

  it('scatters a good number of small rocks, always the same ones', () => {
    expect(rocks.length).toBeGreaterThan(800);
    expect(scatterRocks(world)).toEqual(rocks);
    for (const rock of rocks) {
      expect(rock.size).toBeGreaterThan(0.1);
      expect(rock.size).toBeLessThan(0.45);
    }
  });

  it('keeps rocks out of the build zones and on top of natural ground', () => {
    for (const rock of rocks) {
      expect(isBuildZone(rock.x, rock.z)).toBe(false);
      const bx = Math.floor(rock.x);
      const bz = Math.floor(rock.z);
      const below = world.getBlock(bx, Math.floor(rock.y) - 1, bz);
      expect([BLOCK_IDS.REGOLITH, BLOCK_IDS.SANDSTONE]).toContain(below);
      expect(world.getBlock(bx, Math.floor(rock.y), bz)).toBe(BLOCK_IDS.AIR);
    }
  });
});
