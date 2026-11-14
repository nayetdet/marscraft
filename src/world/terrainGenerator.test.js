import { describe, it, expect } from 'vitest';
import { generateMartianTerrain } from './terrainGenerator.js';
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
    sizeX,
    sizeY,
    sizeZ,
    halfX,
    halfZ,
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

describe('Martian Terrain & NASA Base Builder', () => {
  it('generates a flat central landing zone and an open surrounding terrain', () => {
    const world = createArrayWorld();
    generateMartianTerrain(world, 0x4d415253);

    // Zona central da base nivelada em GROUND_LEVEL
    expect(world.getBlock(0, WORLD_CONFIG.GROUND_LEVEL, 0)).not.toBe(BLOCK_IDS.AIR);
    expect(world.getBlock(0, WORLD_CONFIG.GROUND_LEVEL + 1, 0)).toBe(BLOCK_IDS.AIR);

    // Terreno aberto até os limites do mundo.
    expect(world.getBlock(0, 20, -48)).toBe(BLOCK_IDS.AIR);
  });

  it('builds White NASA Habitat, Greenhouse Dome planters, and Ascent Lander', () => {
    const world = createArrayWorld();
    generateMartianTerrain(world, 0x4d415253);
    buildNasaSpaceshipAndBase(world);

    const floorY = WORLD_CONFIG.GROUND_LEVEL + 1;

    // Parede branca do Habitat Principal
    expect(world.getBlock(0, floorY + 1, -6)).toBe(BLOCK_IDS.NASA_HULL);
    // Interior do Habitat livre (Ar)
    expect(world.getBlock(0, floorY + 2, 0)).toBe(BLOCK_IDS.AIR);
    // Canteiros de plantação dentro da Redoma de Estufa (x = -16, z = 2) e corredor central (-18, z = 2)
    expect(world.getBlock(-18, floorY, 2)).toBe(BLOCK_IDS.NASA_HULL);
    expect(world.getBlock(-16, floorY, 2)).toBe(BLOCK_IDS.HYDRO_PLANT);
  });
});
