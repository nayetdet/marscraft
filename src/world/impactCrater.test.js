import { describe, it, expect, beforeAll } from 'vitest';
import { BLOCK_IDS } from '../config/blockTypes.js';
import { EVENTS_CONFIG, TERRAIN_CONFIG, WORLD_CONFIG } from '../config/constants.js';
import { findExposedIce } from '../scanner/iceSensor.js';
import { carveImpactCrater, findImpactSite } from './impactCrater.js';
import { generateMartianTerrain, isBuildZone } from './terrainGenerator.js';

// Mundo em array, igual ao VoxelWorld, com o terreno real (a base fica toda dentro de isBuildZone)
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
    baseWindows: new Set(),
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

let world;
beforeAll(() => {
  world = createArrayWorld();
  generateMartianTerrain(world);
}, 60000);

describe('findImpactSite', () => {
  it('lands in the ring around the base, outside built areas and away from the player', () => {
    for (let i = 0; i < 12; i++) {
      const params = { angle: i * 0.53, distance: (i * 0.29) % 1 };
      const player = { x: -4 + Math.cos(i * 0.53) * 43, z: Math.sin(i * 0.53) * 43 };
      const site = findImpactSite(world, params, [player]);
      expect(site).not.toBeNull();
      const r = Math.hypot(site.x - TERRAIN_CONFIG.BASE_CENTER.x, site.z - TERRAIN_CONFIG.BASE_CENTER.z);
      expect(r).toBeGreaterThanOrEqual(EVENTS_CONFIG.METEOR_MIN_DISTANCE - 1);
      expect(r).toBeLessThanOrEqual(EVENTS_CONFIG.METEOR_MAX_DISTANCE + 1);
      expect(isBuildZone(site.x, site.z)).toBe(false);
      expect(Math.hypot(site.x - player.x, site.z - player.z)).toBeGreaterThanOrEqual(EVENTS_CONFIG.METEOR_MIN_PLAYER_DISTANCE);
    }
  }, 30000);

  it('is the same place for the same params', () => {
    const params = { angle: 2.1, distance: 0.4 };
    expect(findImpactSite(world, params)).toEqual(findImpactSite(world, params));
  });
});

describe('carveImpactCrater', () => {
  it('digs a bowl with exposed ice that the ice sensor can find', () => {
    const site = findImpactSite(world, { angle: 0.8, distance: 0.5 });
    expect(findExposedIce(world, site, 6)).toHaveLength(0); // antes: nenhum gelo ali
    const { iceBlocks, cells } = carveImpactCrater(world, site);
    expect(iceBlocks).toBeGreaterThan(5);
    expect(cells.length).toBeGreaterThan(40);
    const exposed = findExposedIce(world, site, 6);
    expect(exposed.length).toBeGreaterThanOrEqual(iceBlocks);
    // O centro da cratera ficou mais baixo que a borda
    const top = (x, z) => {
      for (let y = world.sizeY - 1; y >= 0; y--) if (world.getBlock(x, y, z) !== BLOCK_IDS.AIR) return y;
      return -1;
    };
    const rim = site.x + EVENTS_CONFIG.METEOR_CRATER_RADIUS + 1;
    expect(top(site.x, site.z)).toBeLessThan(top(rim, site.z));
    expect(world.getBlock(site.x, top(site.x, site.z), site.z)).toBe(BLOCK_IDS.MARS_ICE);
  }, 30000);
});
