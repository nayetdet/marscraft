import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { BLOCK_IDS } from '../config/blockTypes.ts';
import { WAYPOINT_PATH_CONFIG, WORLD_CONFIG } from '../config/constants.ts';
import { isInsidePressurizedVolume } from '../world/habitatLayout.ts';
import { buildNasaSpaceshipAndBase } from '../world/nasaSpaceshipBuilder.ts';
import { WaypointPath } from './WaypointPath.ts';
import {
  PathfinderScratch,
  buildPathDashes,
  findGroundPath,
  isInsideBaseOrRamp,
  type PathCollider,
  type PathWorldLookup,
} from './waypointPathLogic.ts';

type TestWorld = PathWorldLookup & {
  setBlock(x: number, y: number, z: number, id: number): void;
};

function createFlatBaseWorld(): TestWorld {
  const blocks = new Map<string, number>();
  const key = (x: number, y: number, z: number) => `${Math.floor(x)},${Math.floor(y)},${Math.floor(z)}`;
  const groundY = WORLD_CONFIG.GROUND_LEVEL;
  const world = {
    sizeX: 112,
    sizeY: WORLD_CONFIG.SIZE_Y,
    sizeZ: 112,
    halfX: 56,
    halfZ: 56,
    getBlock(x: number, y: number, z: number): number {
      const ix = Math.floor(x);
      const iy = Math.floor(y);
      const iz = Math.floor(z);
      const k = key(ix, iy, iz);
      if (blocks.has(k)) return blocks.get(k)!;
      if (iy <= groundY) return BLOCK_IDS.REGOLITH;
      return BLOCK_IDS.AIR;
    },
    setBlock(x: number, y: number, z: number, id: number): void {
      blocks.set(key(x, y, z), id);
    },
  };
  buildNasaSpaceshipAndBase(world);
  return world;
}

describe('findGroundPath', () => {
  it('routes inside the base from main habitat to kitchen without crossing Mars outside', () => {
    const world = createFlatBaseWorld();
    const scratch = new PathfinderScratch();
    const path = findGroundPath(scratch, {
      world,
      startX: 0.5,
      startY: 10,
      startZ: 0.5,
      targetX: 13.1,
      targetZ: -16.2,
      inside: true,
      roverActive: false,
    });

    expect(path.length).toBeGreaterThanOrEqual(3);
    const last = path[path.length - 1];
    expect(Math.hypot(last.x - 13.1, last.z - -16.2)).toBeLessThan(2);

    // Every sample along the path stays strictly inside the base
    for (let i = 0; i < path.length - 1; i += 1) {
      const a = path[i];
      const b = path[i + 1];
      const steps = Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / 0.5);
      for (let s = 0; s <= steps; s += 1) {
        const t = steps === 0 ? 0 : s / steps;
        const x = a.x + (b.x - a.x) * t;
        const z = a.z + (b.z - a.z) * t;
        expect(isInsideBaseOrRamp(Math.floor(x), Math.floor(z))).toBe(true);
      }
    }
  });

  it('routes from greenhouse dome through west tunnel and airlock to the outer door', () => {
    const world = createFlatBaseWorld();
    const scratch = new PathfinderScratch();
    const airlockDoors: PathCollider[] = [
      { minX: -1, maxX: 2, minY: 10, maxY: 13, minZ: 5.99, maxZ: 6.31 },
      { minX: -1, maxX: 2, minY: 10, maxY: 13, minZ: 8.69, maxZ: 9.01 },
    ];
    const ignored = new Set<PathCollider>(airlockDoors);

    const path = findGroundPath(scratch, {
      world,
      startX: -27,
      startY: 10,
      startZ: 0,
      targetX: 0.5,
      targetZ: 9.35,
      inside: true,
      roverActive: false,
      colliders: airlockDoors,
      ignoredColliders: ignored,
    });

    expect(path.length).toBeGreaterThanOrEqual(2);
    const last = path[path.length - 1];
    expect(Math.hypot(last.x - 0.5, last.z - 9.35)).toBeLessThan(1.5);
    // Must pass through the west tunnel (x around -10, |z| <= 2) and stay inside the base
    let passedTunnel = false;
    for (let i = 0; i < path.length - 1; i += 1) {
      const a = path[i];
      const b = path[i + 1];
      const steps = Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / 0.5);
      for (let s = 0; s <= steps; s += 1) {
        const t = steps === 0 ? 0 : s / steps;
        const x = a.x + (b.x - a.x) * t;
        const z = a.z + (b.z - a.z) * t;
        expect(isInsideBaseOrRamp(Math.floor(x), Math.floor(z))).toBe(true);
        if (x >= -14 && x <= -7 && Math.abs(z) <= 2.5) passedTunnel = true;
      }
    }
    expect(passedTunnel).toBe(true);
  });

  it('routes from main habitat into the southwest gym via the gym corridor', () => {
    const world = createFlatBaseWorld();
    const scratch = new PathfinderScratch();
    const path = findGroundPath(scratch, {
      world,
      startX: 2.5,
      startY: 10,
      startZ: 0.5,
      targetX: -7.5,
      targetZ: 10.2,
      inside: true,
      roverActive: false,
    });

    expect(path.length).toBeGreaterThanOrEqual(3);
    const last = path[path.length - 1];
    expect(Math.hypot(last.x - -7.5, last.z - 10.2)).toBeLessThan(1.5);
  });

  it('routes around the outside of the base instead of crossing onto the base roof', () => {
    const world = createFlatBaseWorld();
    const scratch = new PathfinderScratch();
    const path = findGroundPath(scratch, {
      world,
      startX: 0.5,
      startY: 9,
      startZ: -30,
      targetX: 0.5,
      targetZ: 14,
      inside: false,
      roverActive: false,
    });

    expect(path.length).toBeGreaterThanOrEqual(3);
    const last = path[path.length - 1];
    expect(Math.hypot(last.x - 0.5, last.z - 14)).toBeLessThan(1.5);

    for (let i = 0; i < path.length - 1; i += 1) {
      const a = path[i];
      const b = path[i + 1];
      const steps = Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / 0.5);
      for (let s = 0; s <= steps; s += 1) {
        const t = steps === 0 ? 0 : s / steps;
        const x = a.x + (b.x - a.x) * t;
        const z = a.z + (b.z - a.z) * t;
        expect(isInsidePressurizedVolume(x, 10.5, z)).toBe(false);
      }
    }
  });

  it('navigates around furniture colliders and snaps targets inside walls/rockets to the nearest walkable cell', () => {
    const world = createFlatBaseWorld();
    const scratch = new PathfinderScratch();
    const tableCollider: PathCollider = { minX: 4.7, maxX: 7.3, minY: 10, maxY: 11.5, minZ: -6.75, maxZ: -5.25 };
    // Target is embedded inside the north habitat wall (z = -12)
    const path = findGroundPath(scratch, {
      world,
      startX: 6.0,
      startY: 10,
      startZ: -2.0,
      targetX: 6.0,
      targetZ: -12.0,
      inside: true,
      roverActive: false,
      colliders: [tableCollider],
    });

    expect(path.length).toBeGreaterThanOrEqual(3);
    // Must not pass through the middle of the table (z in [-6.5, -5.5] at x=6)
    for (let i = 0; i < path.length - 1; i += 1) {
      const a = path[i];
      const b = path[i + 1];
      const steps = Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / 0.25);
      for (let s = 0; s <= steps; s += 1) {
        const t = steps === 0 ? 0 : s / steps;
        const x = a.x + (b.x - a.x) * t;
        const z = a.z + (b.z - a.z) * t;
        const inTable = x > 4.8 && x < 7.2 && z > -6.6 && z < -5.4;
        expect(inTable).toBe(false);
      }
    }
    const last = path[path.length - 1];
    expect(last.z).toBeGreaterThanOrEqual(-11);
  });

  it('avoids 2-block cliffs on foot while allowing 2-block climbs for the rover', () => {
    const world = createFlatBaseWorld();
    // Build a 2-block-high cliff wall at z = 20 from x = -4 to x = 4
    for (let x = -4; x <= 4; x += 1) {
      world.setBlock(x, 9, 20, BLOCK_IDS.REGOLITH);
      world.setBlock(x, 10, 20, BLOCK_IDS.REGOLITH);
    }

    const scratch = new PathfinderScratch();
    const footPath = findGroundPath(scratch, {
      world,
      startX: 0.5,
      startY: 9,
      startZ: 15.5,
      targetX: 0.5,
      targetZ: 24.5,
      inside: false,
      roverActive: false,
    });
    // On foot, must detour past |x| > 4
    expect(footPath.some((p) => Math.abs(p.x) > 4)).toBe(true);

    const roverPath = findGroundPath(scratch, {
      world,
      startX: 0.5,
      startY: 9,
      startZ: 15.5,
      targetX: 0.5,
      targetZ: 24.5,
      inside: false,
      roverActive: true,
    });
    // Rover has MAX_STEP_HEIGHT = 2.15 so it can go straight over the 2-block ridge
    expect(roverPath.every((p) => Math.abs(p.x) <= 1.5)).toBe(true);
  });
});

describe('buildPathDashes', () => {
  it('generates yellow low-opacity dashes slightly above the floor and hides when already at target', () => {
    const world = createFlatBaseWorld();
    const scratch = new PathfinderScratch();

    const dashes = buildPathDashes(scratch, {
      world,
      polyline: [
        { x: 0.5, z: 0.5 },
        { x: 0.5, z: -10.5 },
      ],
      inside: true,
      refY: 10,
      roverActive: false,
      time: 0.5,
    });

    expect(dashes.length).toBeGreaterThan(5);
    for (const d of dashes) {
      expect(d.alpha).toBeGreaterThan(0);
      expect(d.alpha).toBeLessThanOrEqual(WAYPOINT_PATH_CONFIG.OPACITY + 1e-6);
      expect(d.y).toBeCloseTo(10 + WAYPOINT_PATH_CONFIG.SURFACE_OFFSET_Y, 4);
      const len = Math.hypot(d.x1 - d.x0, d.z1 - d.z0);
      expect(len).toBeGreaterThan(0.1);
      expect(len).toBeLessThanOrEqual(WAYPOINT_PATH_CONFIG.DASH_LENGTH + 1e-4);
    }

    const nearDashes = buildPathDashes(scratch, {
      world,
      polyline: [
        { x: 0.5, z: 0.5 },
        { x: 0.5, z: -0.5 },
      ],
      inside: true,
      refY: 10,
      roverActive: false,
      time: 0.5,
    });
    expect(nearDashes).toEqual([]);
  });

  it('renders into a single low-opacity yellow Three.js mesh and hides cleanly', () => {
    const world = createFlatBaseWorld();
    const scene = new THREE.Scene();
    const pathMesh = new WaypointPath(scene);

    pathMesh.update({
      dt: 0.1,
      target: { x: 13.1, y: 12, z: -16.2 },
      startX: 0.5,
      startY: 10,
      startZ: 0.5,
      inside: true,
      roverActive: false,
      world,
    });

    expect(pathMesh.mesh.visible).toBe(true);
    expect(pathMesh.mesh.geometry.drawRange.count).toBeGreaterThan(0);
    const mat = pathMesh.mesh.material as THREE.MeshBasicMaterial;
    expect(mat.transparent).toBe(true);
    expect(mat.color.getHex()).toBe(WAYPOINT_PATH_CONFIG.COLOR);

    pathMesh.hide();
    expect(pathMesh.mesh.visible).toBe(false);
    expect(pathMesh.mesh.geometry.drawRange.count).toBe(0);
  });
});
