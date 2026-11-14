import { describe, it, expect } from 'vitest';
import { resolveScanTarget, rayBoxDistance, baseModuleAt, collectScanBlocks } from './scanTargeting.js';
import { buildNasaSpaceshipAndBase } from '../world/nasaSpaceshipBuilder.js';
import { BLOCK_IDS } from '../config/blockTypes.js';

function createMapWorld() {
  const blocks = new Map();
  const key = (x, y, z) => `${Math.floor(x)},${Math.floor(y)},${Math.floor(z)}`;
  return {
    getBlock: (x, y, z) => blocks.get(key(x, y, z)) ?? BLOCK_IDS.AIR,
    setBlock: (x, y, z, id) => blocks.set(key(x, y, z), id),
  };
}

function baseWorld() {
  const world = createMapWorld();
  buildNasaSpaceshipAndBase(world);
  return world;
}

const norm = (x, y, z) => {
  const l = Math.hypot(x, y, z);
  return { x: x / l, y: y / l, z: z / l };
};
const NORTH = { x: 0, y: 0, z: -1 };

function scan(world, origin, dir, extra = {}) {
  return resolveScanTarget({ world, origin, dir, maxDist: 80, ...extra })?.id ?? null;
}

describe('resolveScanTarget: terrain', () => {
  it.each([
    [BLOCK_IDS.REGOLITH, 'regolith'],
    [BLOCK_IDS.SANDSTONE, 'sandstone'],
    [BLOCK_IDS.BASALT, 'crater-rock'],
    [BLOCK_IDS.MARS_ICE, 'water-ice'],
  ])('identifies block %i as %s', (block, id) => {
    const world = createMapWorld();
    world.setBlock(20, 10, 15, block);
    expect(scan(world, { x: 20.5, y: 10.5, z: 25.5 }, NORTH)).toBe(id);
  });

  it('calls terrain near the edge of the world the crater rim', () => {
    const world = createMapWorld();
    world.setBlock(0, 12, -45, BLOCK_IDS.SANDSTONE);
    expect(scan(world, { x: 0.5, y: 12.5, z: -20 }, NORTH)).toBe('crater-rim');
  });

  it('keeps ice as water ice even far from the center', () => {
    const world = createMapWorld();
    world.setBlock(0, 12, -45, BLOCK_IDS.MARS_ICE);
    expect(scan(world, { x: 0.5, y: 12.5, z: -20 }, NORTH)).toBe('water-ice');
  });

  it('ignores targets beyond the scan range', () => {
    const world = createMapWorld();
    world.setBlock(0, 10, -60, BLOCK_IDS.REGOLITH);
    expect(resolveScanTarget({ world, origin: { x: 0.5, y: 10.5, z: 30 }, dir: NORTH, maxDist: 80 })).toBeNull();
  });
});

describe('resolveScanTarget: base modules', () => {
  const world = baseWorld();

  it.each([
    // x = 2 é a parede do airlock; em x = 0 o raio passa pela porta aberta até o habitat.
    ['airlock', { x: 2.5, y: 11.5, z: 15 }],
    ['habitat', { x: 5.5, y: 11.5, z: 15 }],
    // The gym wing now stands between z = 10 and the tunnel.
    ['tunnel', { x: -9.5, y: 11.5, z: 5 }],
    ['greenhouse', { x: -17.5, y: 11.5, z: 20 }],
    ['cupola', { x: 0.5, y: 16.5, z: 20 }],
  ])('identifies the %s up close', (id, origin) => {
    expect(scan(world, origin, NORTH)).toBe(id);
  });

  it('shows the whole outpost when looking at the base from far away', () => {
    expect(scan(world, { x: 5.5, y: 11.5, z: 45 }, NORTH)).toBe('base');
  });

  it('ignores structures the player built away from the base', () => {
    const w = createMapWorld();
    w.setBlock(30, 10, 20, BLOCK_IDS.NASA_HULL);
    expect(scan(w, { x: 30.5, y: 10.5, z: 30 }, NORTH)).toBeNull();
  });

  it('maps wall blocks to the module they enclose', () => {
    expect(baseModuleAt(7, 11, 0)).toBe('habitat');
    expect(baseModuleAt(0, 11, 8)).toBe('airlock');
    expect(baseModuleAt(-10, 13, 2)).toBe('tunnel');
    expect(baseModuleAt(3, 17, 3)).toBe('cupola');
    expect(baseModuleAt(-18, 15, 0)).toBe('greenhouse');
    expect(baseModuleAt(-22, 11, -21)).toBe('habitat');
    expect(baseModuleAt(17, 11, -20)).toBe('habitat');
    expect(baseModuleAt(-3, 11, -38)).toBe('habitat');
    expect(baseModuleAt(30, 10, 30)).toBeNull();
  });
});

describe('resolveScanTarget: 3D objects', () => {
  const box = (scanId, z) => ({ scanId, minX: -1, maxX: 1, minY: 9, maxY: 12, minZ: z - 1, maxZ: z + 1 });

  it('uses the scanId of the object in front of the voxel terrain', () => {
    const world = createMapWorld();
    world.setBlock(0, 10, -10, BLOCK_IDS.REGOLITH);
    expect(scan(world, { x: 0, y: 10.5, z: 10 }, NORTH, { objects: [box('rover', 0)] })).toBe('rover');
  });

  it('lets a closer block hide the object behind it', () => {
    const world = createMapWorld();
    world.setBlock(0, 10, 5, BLOCK_IDS.REGOLITH);
    expect(scan(world, { x: 0.5, y: 10.5, z: 10 }, NORTH, { objects: [box('rover', 0)] })).toBe('regolith');
  });

  it('classifies untagged objects by the base module they sit in', () => {
    const world = createMapWorld();
    const furniture = { minX: 3, maxX: 5, minY: 10, maxY: 11.5, minZ: -2, maxZ: -1 };
    expect(scan(world, { x: 4, y: 11, z: 4 }, NORTH, { objects: [furniture] })).toBe('habitat');
  });

  it('falls through an untagged prop outside the base to the voxel target behind it', () => {
    const world = createMapWorld();
    world.setBlock(0, 10, -10, BLOCK_IDS.REGOLITH);
    const prop = { minX: -1, maxX: 1, minY: 9, maxY: 12, minZ: 0, maxZ: 1 };
    expect(scan(world, { x: 0, y: 10.5, z: 10 }, NORTH, { objects: [prop] })).toBe('habitat');
  });

  it('keeps the MAV rocket and its control factory scannable as the ascent vehicle', () => {
    const rocket = { ...box('lander', 0) };
    expect(scan(createMapWorld(), { x: 0, y: 10.5, z: 10 }, NORTH, { objects: [rocket] })).toBe('lander');
  });

  it('ignores a box that contains the camera', () => {
    const world = createMapWorld();
    world.setBlock(0, 10, -10, BLOCK_IDS.BASALT);
    const around = { scanId: 'greenhouse', minX: -2, maxX: 2, minY: 8, maxY: 13, minZ: -2, maxZ: 2 };
    expect(scan(world, { x: 0.5, y: 10.5, z: 0 }, NORTH, { objects: [around] })).toBe('crater-rock');
  });
});

describe('resolveScanTarget: sky', () => {
  const world = createMapWorld();
  const earthDir = norm(-0.28, 0.32, -0.9);
  const moonDir = norm(-0.28 + 0.045, 0.32, -0.9);
  const skyBodies = [
    { id: 'earth', dir: earthDir, radius: 0.035 },
    { id: 'moon', dir: moonDir, radius: 0.02 },
  ];
  const origin = { x: 0, y: 20, z: 0 };

  it('locks onto the body under the crosshair', () => {
    expect(scan(world, origin, earthDir, { skyBodies })).toBe('earth');
    expect(scan(world, origin, moonDir, { skyBodies })).toBe('moon');
  });

  it('falls back to the atmosphere when looking up at empty sky', () => {
    expect(scan(world, origin, norm(0.5, 0.6, 0.2), { skyBodies })).toBe('atmosphere');
  });

  it('finds nothing when looking down into the void', () => {
    expect(scan(world, origin, norm(0.2, -0.5, 0.3), { skyBodies })).toBeNull();
  });

  it('does not see a sky body through terrain', () => {
    // Parede em z = -6 bem na frente da Terra.
    const w = createMapWorld();
    for (let x = -5; x <= 3; x++) {
      for (let y = 18; y <= 26; y++) w.setBlock(x, y, -6, BLOCK_IDS.REGOLITH);
    }
    expect(scan(w, origin, earthDir, { skyBodies })).toBe('regolith');
  });
});

describe('rayBoxDistance', () => {
  const box = { minX: -1, maxX: 1, minY: -1, maxY: 1, minZ: -6, maxZ: -4 };

  it('returns the entry distance', () => {
    expect(rayBoxDistance({ x: 0, y: 0, z: 0 }, NORTH, box, 100)).toBeCloseTo(4);
  });

  it('misses boxes off to the side or out of range', () => {
    expect(rayBoxDistance({ x: 3, y: 0, z: 0 }, NORTH, box, 100)).toBeNull();
    expect(rayBoxDistance({ x: 0, y: 0, z: 0 }, NORTH, box, 3)).toBeNull();
  });
});

describe('collectScanBlocks', () => {
  it('collects every visible block of the scanned module and nothing else', () => {
    const world = baseWorld();
    const blocks = collectScanBlocks(world, { id: 'habitat', hit: null });
    expect(blocks.length).toBeGreaterThan(50);
    expect(blocks.every((b) => baseModuleAt(b.x, b.y, b.z) === 'habitat')).toBe(true);
  });

  it('collects all outpost modules for the whole base but leaves the rocket out', () => {
    const world = baseWorld();
    const blocks = collectScanBlocks(world, { id: 'base', hit: null });
    const modules = new Set(blocks.map((b) => baseModuleAt(b.x, b.y, b.z)));
    expect(modules.has('habitat')).toBe(true);
    expect(modules.has('greenhouse')).toBe(true);
    expect(modules.has('tunnel')).toBe(true);
    expect(modules.has('gym')).toBe(true);
    expect(blocks.some((b) => b.x <= -12 && b.z >= 7 && b.z <= 13)).toBe(true);
    expect(blocks.some((b) => b.z <= -20)).toBe(true);
    expect(blocks.some((b) => b.z <= -40)).toBe(true);
    expect(modules.has('lander')).toBe(false);
  });

  it('collects the exercise and medbay wing as its own scan target', () => {
    const world = baseWorld();
    const blocks = collectScanBlocks(world, { id: 'gym', hit: null });
    const collected = new Set(blocks.map(({ x, y, z }) => `${x},${y},${z}`));
    let visibleGymBlocks = 0;
    for (let x = -12; x <= -4; x++) {
      for (let y = 9; y <= 14; y++) {
        for (let z = 7; z <= 13; z++) {
          if (world.getBlock(x, y, z) === BLOCK_IDS.AIR) continue;
          visibleGymBlocks++;
          expect(collected.has(`${x},${y},${z}`), `missing visible gym block ${x},${y},${z}`).toBe(true);
        }
      }
    }
    expect(visibleGymBlocks).toBeGreaterThan(20);
    expect(blocks.every((b) => baseModuleAt(b.x, b.y, b.z) === 'gym')).toBe(true);
    expect(blocks.some((b) => b.x === -7 && b.z === 5)).toBe(true);
    expect(blocks.some((b) => b.x === -4 && b.z === 7)).toBe(true);
  });

  it('collects the exposed patch of the same terrain around the aimed block', () => {
    const world = createMapWorld();
    for (let x = -5; x <= 5; x++) {
      for (let z = -5; z <= 5; z++) {
        world.setBlock(x, 8, z, BLOCK_IDS.REGOLITH);
        world.setBlock(x, 7, z, BLOCK_IDS.REGOLITH); // enterrado entre regolito e basalto: não aparece
        world.setBlock(x, 6, z, BLOCK_IDS.BASALT);
      }
    }
    world.setBlock(1, 8, 0, BLOCK_IDS.BASALT);
    const blocks = collectScanBlocks(world, { id: 'regolith', hit: { x: 0, y: 8, z: 0 } });
    expect(blocks).toHaveLength(7 * 7 - 1);
    expect(blocks.every((b) => b.y === 8 && Math.abs(b.x) <= 3 && Math.abs(b.z) <= 3)).toBe(true);
  });

  it('returns nothing for targets without blocks', () => {
    expect(collectScanBlocks(createMapWorld(), { id: 'earth', hit: null })).toEqual([]);
    expect(collectScanBlocks(createMapWorld(), null)).toEqual([]);
  });
});
