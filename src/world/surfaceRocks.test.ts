// @ts-nocheck
import { describe, it, expect } from 'vitest';
import { addVoxelOutcrops, scatterRocks } from './surfaceRocks.ts';
import { generateMartianTerrain, isBuildZone } from './terrainGenerator.ts';
import { buildNasaSpaceshipAndBase } from './nasaSpaceshipBuilder.ts';
import { BLOCK_IDS } from '../config/blockTypes.ts';
import { SURFACE_ROCK_CONFIG, WORLD_CONFIG } from '../config/constants.ts';

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

function createFlatOutcropWorld() {
  const { SIZE_X: sizeX, SIZE_Y: sizeY, SIZE_Z: sizeZ, GROUND_LEVEL } = WORLD_CONFIG;
  const halfX = sizeX / 2;
  const halfZ = sizeZ / 2;
  const blocks = new Map();
  const columns = [];
  let previousColumnKey = null;

  const keyFor = (x, y, z) => `${Math.floor(x)},${Math.floor(y)},${Math.floor(z)}`;
  const world = {
    sizeX, sizeY, sizeZ, halfX, halfZ, columns,
    getBlock(x, y, z) {
      const ix = Math.floor(x);
      const iy = Math.floor(y);
      const iz = Math.floor(z);
      if (Math.abs(ix) >= halfX || Math.abs(iz) >= halfZ || iy < 0 || iy >= sizeY) return BLOCK_IDS.AIR;
      const stored = blocks.get(keyFor(ix, iy, iz));
      if (stored !== undefined) return stored;
      return iy === GROUND_LEVEL - 1 ? BLOCK_IDS.REGOLITH : BLOCK_IDS.AIR;
    },
    setBlock(x, y, z, id) {
      const ix = Math.floor(x);
      const iy = Math.floor(y);
      const iz = Math.floor(z);
      blocks.set(keyFor(ix, iy, iz), id);
      const columnKey = `${ix},${iz}`;
      if (columnKey !== previousColumnKey) {
        columns.push({ x: ix, z: iz, height: 0 });
        previousColumnKey = columnKey;
      }
      columns[columns.length - 1].height += 1;
    },
  };
  return world;
}

describe('surface rocks', () => {
  const world = createArrayWorld();
  generateMartianTerrain(world);
  buildNasaSpaceshipAndBase(world);
  const rocks = scatterRocks(world);

  it('scatters a good number of small rocks, always the same ones', () => {
    expect(rocks.length).toBeGreaterThan(500);
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

  it('creates fewer, deterministic voxel outcrops with a tapered stalagmite profile', () => {
    const firstWorld = createFlatOutcropWorld();
    const count = addVoxelOutcrops(firstWorld);
    const secondWorld = createFlatOutcropWorld();
    const repeatedCount = addVoxelOutcrops(secondWorld);

    expect(count).toBeGreaterThan(0);
    expect(count).toBe(SURFACE_ROCK_CONFIG.VOXEL_OUTCROP_MAX_COUNT);
    expect(count).toBeLessThan(48);
    expect(count).toBeLessThanOrEqual(SURFACE_ROCK_CONFIG.VOXEL_OUTCROP_MAX_COUNT);
    expect(repeatedCount).toBe(count);
    expect(secondWorld.columns).toEqual(firstWorld.columns);
    expect(firstWorld.columns).toHaveLength(count * 9);

    for (let i = 0; i < firstWorld.columns.length; i += 9) {
      const heights = firstWorld.columns.slice(i, i + 9).map((column) => column.height).sort((a, b) => a - b);
      expect(heights.slice(0, 4)).toEqual(
        Array(4).fill(SURFACE_ROCK_CONFIG.VOXEL_OUTCROP_CORNER_HEIGHT),
      );
      expect(heights.slice(4, 8)).toEqual(
        Array(4).fill(SURFACE_ROCK_CONFIG.VOXEL_OUTCROP_SIDE_HEIGHT),
      );
      expect(heights[8]).toBeGreaterThanOrEqual(SURFACE_ROCK_CONFIG.VOXEL_OUTCROP_TIP_HEIGHT_MIN);
      expect(heights[8]).toBeLessThan(
        SURFACE_ROCK_CONFIG.VOXEL_OUTCROP_TIP_HEIGHT_MIN + SURFACE_ROCK_CONFIG.VOXEL_OUTCROP_TIP_HEIGHT_VARIATION,
      );
      for (const column of firstWorld.columns.slice(i, i + 9)) {
        expect(isBuildZone(column.x, column.z)).toBe(false);
      }
    }
  });
});
