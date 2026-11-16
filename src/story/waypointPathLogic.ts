import { BLOCK_IDS } from '../config/blockTypes.ts';
import { ROVER_CONFIG, WAYPOINT_PATH_CONFIG } from '../config/constants.ts';
import { HABITAT_LAYOUT, isInsidePressurizedVolume } from '../world/habitatLayout.ts';

export type Point2D = {
  x: number;
  z: number;
};

export type PathCollider = {
  minX: number;
  maxX: number;
  minY?: number;
  maxY?: number;
  minZ: number;
  maxZ: number;
  roverNoCollide?: boolean;
};

export type PathWorldLookup = {
  sizeX: number;
  sizeY: number;
  sizeZ: number;
  halfX: number;
  halfZ: number;
  getBlock(x: number, y: number, z: number): number;
};

export type PathDash = {
  x0: number;
  z0: number;
  x1: number;
  z1: number;
  y: number;
  rx: number;
  rz: number;
  alpha: number;
};

export type FindPathOptions = {
  world: PathWorldLookup;
  startX: number;
  startY: number;
  startZ: number;
  targetX: number;
  targetZ: number;
  inside: boolean;
  roverActive: boolean;
  colliders?: readonly PathCollider[];
  ignoredColliders?: ReadonlySet<PathCollider> | null;
  maxNodes?: number;
};

export type DashSampleOptions = {
  world: PathWorldLookup;
  polyline: readonly Point2D[];
  inside: boolean;
  refY: number;
  roverActive: boolean;
  time: number;
  maxDashes?: number;
};

const COLLIDER_CLEARANCE = 0.22;
const GOAL_SEARCH_RADIUS = 6;
const STEP_UP_FOOT = 1.05;
const STEP_DOWN_MAX = 2.5;
const ELEVATION_PENALTY = 0.45;
const LOS_SAMPLE_STEP = 0.35;
const LOS_LATERAL_PAD = 0.22;

const NEIGHBOR_DX = [-1, 1, 0, 0, -1, -1, 1, 1];
const NEIGHBOR_DZ = [0, 0, -1, 1, -1, 1, -1, 1];
const NEIGHBOR_COST = [1, 1, 1, 1, Math.SQRT2, Math.SQRT2, Math.SQRT2, Math.SQRT2];

/**
 * Reusable typed-array scratchpad for grid A* so pathfinding allocates nothing per frame.
 */
export class PathfinderScratch {
  capacity = 0;
  stamp = 1;
  gScore = new Float32Array(0);
  fScore = new Float32Array(0);
  parent = new Int32Array(0);
  seenStamp = new Uint32Array(0);
  closedStamp = new Uint32Array(0);
  heap = new Int32Array(0);
  heapPos = new Int32Array(0);
  groundStamp = new Uint32Array(0);
  groundY = new Int16Array(0);
  rawCells: Point2D[] = [];
  smoothed: Point2D[] = [];
  dashes: PathDash[] = [];
  cumLen: number[] = [];

  ensure(cellCount: number): void {
    if (cellCount <= this.capacity) return;
    this.capacity = cellCount;
    this.gScore = new Float32Array(cellCount);
    this.fScore = new Float32Array(cellCount);
    this.parent = new Int32Array(cellCount);
    this.seenStamp = new Uint32Array(cellCount);
    this.closedStamp = new Uint32Array(cellCount);
    this.heap = new Int32Array(cellCount);
    this.heapPos = new Int32Array(cellCount);
    this.groundStamp = new Uint32Array(cellCount);
    this.groundY = new Int16Array(cellCount);
  }
}

export function isInsideBaseOrRamp(bx: number, bz: number): boolean {
  if (isInsidePressurizedVolume(bx + 0.5, HABITAT_LAYOUT.FLOOR_Y + 1.5, bz + 0.5)) return true;
  return (
    Math.abs(bx) <= HABITAT_LAYOUT.AIRLOCK_HALF_X
    && bz >= HABITAT_LAYOUT.AIRLOCK_Z_MIN
    && bz <= HABITAT_LAYOUT.AIRLOCK_Z_MAX + 2
  );
}

/**
 * Returns the walkable floor top Y (blockY + 1) at grid cell (bx, bz), or null if blocked/out of bounds.
 */
export function findWalkableFloorY(
  world: PathWorldLookup,
  bx: number,
  bz: number,
  inside: boolean,
  refY: number
): number | null {
  if (bx < -world.halfX || bx >= world.halfX || bz < -world.halfZ || bz >= world.halfZ) return null;

  if (inside) {
    if (!isInsideBaseOrRamp(bx, bz)) return null;
    const inCupola = refY > HABITAT_LAYOUT.CEIL_Y
      && Math.abs(bx) <= HABITAT_LAYOUT.CUPOLA_HALF
      && Math.abs(bz) <= HABITAT_LAYOUT.CUPOLA_HALF;
    const scanTop = inCupola
      ? Math.min(world.sizeY - 1, Math.floor(refY))
      : Math.min(world.sizeY - 1, HABITAT_LAYOUT.FLOOR_Y + 2);
    const scanBottom = inCupola ? HABITAT_LAYOUT.CEIL_Y : 0;
    for (let y = scanTop; y >= scanBottom; y -= 1) {
      if (world.getBlock(bx, y, bz) !== BLOCK_IDS.AIR) {
        const floorY = y + 1;
        if (
          floorY + 1 < world.sizeY
          && world.getBlock(bx, floorY, bz) === BLOCK_IDS.AIR
          && world.getBlock(bx, floorY + 1, bz) === BLOCK_IDS.AIR
        ) {
          return floorY;
        }
        return null;
      }
    }
    return null;
  }

  // Outside: never walk onto interior floor/roof blocks of pressurized modules.
  if (isInsidePressurizedVolume(bx + 0.5, HABITAT_LAYOUT.FLOOR_Y + 1.5, bz + 0.5)) return null;
  for (let y = world.sizeY - 1; y >= 0; y -= 1) {
    if (world.getBlock(bx, y, bz) !== BLOCK_IDS.AIR) return y + 1;
  }
  return null;
}

/**
 * Queries the surface Y directly below continuous world coordinate (x, z) for placing ground dashes.
 */
export function queryGroundSurfaceY(
  world: PathWorldLookup,
  x: number,
  z: number,
  inside: boolean,
  refY: number
): number {
  const bx = Math.floor(x);
  const bz = Math.floor(z);
  if (bx < -world.halfX || bx >= world.halfX || bz < -world.halfZ || bz >= world.halfZ) return refY;

  if (inside) {
    const inCupola = refY > HABITAT_LAYOUT.CEIL_Y
      && Math.abs(bx) <= HABITAT_LAYOUT.CUPOLA_HALF
      && Math.abs(bz) <= HABITAT_LAYOUT.CUPOLA_HALF;
    const scanTop = inCupola
      ? Math.min(world.sizeY - 1, Math.floor(refY))
      : Math.min(world.sizeY - 1, HABITAT_LAYOUT.FLOOR_Y + 2);
    for (let y = scanTop; y >= 0; y -= 1) {
      if (world.getBlock(bx, y, bz) !== BLOCK_IDS.AIR) return y + 1;
    }
    return HABITAT_LAYOUT.FLOOR_Y + 1;
  }

  for (let y = world.sizeY - 1; y >= 0; y -= 1) {
    if (world.getBlock(bx, y, bz) !== BLOCK_IDS.AIR) return y + 1;
  }
  return refY;
}

export function segmentIntersectsAabb2D(
  x1: number,
  z1: number,
  x2: number,
  z2: number,
  minX: number,
  maxX: number,
  minZ: number,
  maxZ: number
): boolean {
  let tMin = 0;
  let tMax = 1;
  const dx = x2 - x1;
  const dz = z2 - z1;

  if (Math.abs(dx) < 1e-8) {
    if (x1 < minX || x1 > maxX) return false;
  } else {
    const invDx = 1 / dx;
    let t1 = (minX - x1) * invDx;
    let t2 = (maxX - x1) * invDx;
    if (t1 > t2) {
      const tmp = t1;
      t1 = t2;
      t2 = tmp;
    }
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return false;
  }

  if (Math.abs(dz) < 1e-8) {
    if (z1 < minZ || z1 > maxZ) return false;
  } else {
    const invDz = 1 / dz;
    let t1 = (minZ - z1) * invDz;
    let t2 = (maxZ - z1) * invDz;
    if (t1 > t2) {
      const tmp = t1;
      t1 = t2;
      t2 = tmp;
    }
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return false;
  }

  return true;
}

function isColliderBlockingY(collider: PathCollider, minFloorY: number, maxFloorY: number): boolean {
  const cMinY = collider.minY ?? 0;
  const cMaxY = collider.maxY ?? 999;
  return cMaxY > minFloorY + 0.08 && cMinY < maxFloorY + 1.68;
}

function isCellBlockedByColliders(
  cx: number,
  cz: number,
  floorY: number,
  colliders: readonly PathCollider[],
  ignored: ReadonlySet<PathCollider> | null | undefined,
  roverActive: boolean,
  startX: number,
  startZ: number
): boolean {
  for (let i = 0; i < colliders.length; i += 1) {
    const c = colliders[i];
    if (ignored?.has(c)) continue;
    if (roverActive && c.roverNoCollide) continue;
    if (!isColliderBlockingY(c, floorY, floorY)) continue;
    if (
      cx + COLLIDER_CLEARANCE > c.minX
      && cx - COLLIDER_CLEARANCE < c.maxX
      && cz + COLLIDER_CLEARANCE > c.minZ
      && cz - COLLIDER_CLEARANCE < c.maxZ
    ) {
      // Allow exiting a collider the player/rover currently overlaps at spawn/start.
      if (
        startX + COLLIDER_CLEARANCE > c.minX
        && startX - COLLIDER_CLEARANCE < c.maxX
        && startZ + COLLIDER_CLEARANCE > c.minZ
        && startZ - COLLIDER_CLEARANCE < c.maxZ
      ) {
        continue;
      }
      return true;
    }
  }
  return false;
}

function isSegmentBlockedByColliders(
  x1: number,
  z1: number,
  x2: number,
  z2: number,
  minFloorY: number,
  maxFloorY: number,
  colliders: readonly PathCollider[],
  ignored: ReadonlySet<PathCollider> | null | undefined,
  roverActive: boolean,
  startX: number,
  startZ: number
): boolean {
  const segMinX = Math.min(x1, x2) - COLLIDER_CLEARANCE;
  const segMaxX = Math.max(x1, x2) + COLLIDER_CLEARANCE;
  const segMinZ = Math.min(z1, z2) - COLLIDER_CLEARANCE;
  const segMaxZ = Math.max(z1, z2) + COLLIDER_CLEARANCE;

  for (let i = 0; i < colliders.length; i += 1) {
    const c = colliders[i];
    if (ignored?.has(c)) continue;
    if (roverActive && c.roverNoCollide) continue;
    if (c.maxX < segMinX || c.minX > segMaxX || c.maxZ < segMinZ || c.minZ > segMaxZ) continue;
    if (!isColliderBlockingY(c, minFloorY, maxFloorY)) continue;
    if (
      startX + COLLIDER_CLEARANCE > c.minX
      && startX - COLLIDER_CLEARANCE < c.maxX
      && startZ + COLLIDER_CLEARANCE > c.minZ
      && startZ - COLLIDER_CLEARANCE < c.maxZ
    ) {
      continue;
    }
    if (
      segmentIntersectsAabb2D(
        x1,
        z1,
        x2,
        z2,
        c.minX - COLLIDER_CLEARANCE,
        c.maxX + COLLIDER_CLEARANCE,
        c.minZ - COLLIDER_CLEARANCE,
        c.maxZ + COLLIDER_CLEARANCE
      )
    ) {
      return true;
    }
  }
  return false;
}

function octileHeuristic(dx: number, dz: number): number {
  const adx = Math.abs(dx);
  const adz = Math.abs(dz);
  return Math.max(adx, adz) + (Math.SQRT2 - 1) * Math.min(adx, adz);
}

/**
 * Computes a smoothed 2D ground path from (startX, startZ) to (targetX, targetZ),
 * navigating around terrain cliffs, habitat walls, doorways, and colliders.
 */
export function findGroundPath(scratch: PathfinderScratch, options: FindPathOptions): Point2D[] {
  const {
    world,
    startX,
    startY,
    startZ,
    targetX,
    targetZ,
    inside,
    roverActive,
    colliders = [],
    ignoredColliders = null,
    maxNodes = WAYPOINT_PATH_CONFIG.MAX_SEARCH_NODES,
  } = options;

  const sizeX = world.sizeX;
  const sizeZ = world.sizeZ;
  const totalCells = sizeX * sizeZ;
  scratch.ensure(totalCells);
  scratch.stamp += 1;
  const stamp = scratch.stamp;

  const maxStepUp = roverActive ? ROVER_CONFIG.MAX_STEP_HEIGHT : STEP_UP_FOOT;

  const toIdx = (bx: number, bz: number): number => (bz + world.halfZ) * sizeX + (bx + world.halfX);

  const evalCell = (bx: number, bz: number): number => {
    if (bx < -world.halfX || bx >= world.halfX || bz < -world.halfZ || bz >= world.halfZ) return -1;
    const idx = toIdx(bx, bz);
    if (scratch.groundStamp[idx] === stamp) return scratch.groundY[idx];

    scratch.groundStamp[idx] = stamp;
    const floorY = findWalkableFloorY(world, bx, bz, inside, startY);
    if (floorY === null) {
      scratch.groundY[idx] = -1;
      return -1;
    }
    if (isCellBlockedByColliders(bx + 0.5, bz + 0.5, floorY, colliders, ignoredColliders, roverActive, startX, startZ)) {
      scratch.groundY[idx] = -1;
      return -1;
    }
    scratch.groundY[idx] = floorY;
    return floorY;
  };

  const startBx = Math.max(-world.halfX, Math.min(world.halfX - 1, Math.floor(startX)));
  const startBz = Math.max(-world.halfZ, Math.min(world.halfZ - 1, Math.floor(startZ)));
  const startIdx = toIdx(startBx, startBz);

  let startFloorY = evalCell(startBx, startBz);
  if (startFloorY < 0) {
    // Always allow stepping out from the player's current cell.
    const rawY = findWalkableFloorY(world, startBx, startBz, inside, startY);
    startFloorY = rawY !== null ? rawY : Math.round(startY);
    scratch.groundStamp[startIdx] = stamp;
    scratch.groundY[startIdx] = startFloorY;
  }

  const rawGoalBx = Math.max(-world.halfX, Math.min(world.halfX - 1, Math.floor(targetX)));
  const rawGoalBz = Math.max(-world.halfZ, Math.min(world.halfZ - 1, Math.floor(targetZ)));

  let goalBx = rawGoalBx;
  let goalBz = rawGoalBz;
  let goalSnapped = false;

  if (evalCell(goalBx, goalBz) < 0) {
    let bestDistSq = Infinity;
    let found = false;
    for (let r = 1; r <= GOAL_SEARCH_RADIUS; r += 1) {
      for (let dz = -r; dz <= r; dz += 1) {
        for (let dx = -r; dx <= r; dx += 1) {
          if (Math.abs(dx) !== r && Math.abs(dz) !== r) continue;
          const cx = rawGoalBx + dx;
          const cz = rawGoalBz + dz;
          if (evalCell(cx, cz) < 0) continue;
          const dSq = (cx + 0.5 - targetX) ** 2 + (cz + 0.5 - targetZ) ** 2;
          if (dSq < bestDistSq) {
            bestDistSq = dSq;
            goalBx = cx;
            goalBz = cz;
            found = true;
          }
        }
      }
      if (found) break;
    }
    goalSnapped = true;
  }

  const goalIdx = toIdx(goalBx, goalBz);
  const goalFloorY = evalCell(goalBx, goalBz);

  const out = scratch.smoothed;
  out.length = 0;

  if (goalFloorY < 0 || startIdx === goalIdx) {
    out.push({ x: startX, z: startZ });
    if (goalFloorY >= 0) {
      out.push({ x: goalSnapped ? goalBx + 0.5 : targetX, z: goalSnapped ? goalBz + 0.5 : targetZ });
    }
    return out;
  }

  // Binary min-heap operations
  let heapSize = 0;
  const swapHeap = (a: number, b: number): void => {
    const nodeA = scratch.heap[a];
    const nodeB = scratch.heap[b];
    scratch.heap[a] = nodeB;
    scratch.heap[b] = nodeA;
    scratch.heapPos[nodeB] = a;
    scratch.heapPos[nodeA] = b;
  };
  const siftUp = (pos: number): void => {
    let i = pos;
    while (i > 0) {
      const parentPos = (i - 1) >> 1;
      if (scratch.fScore[scratch.heap[i]] >= scratch.fScore[scratch.heap[parentPos]]) break;
      swapHeap(i, parentPos);
      i = parentPos;
    }
  };
  const siftDown = (pos: number): void => {
    let i = pos;
    for (;;) {
      const left = (i << 1) + 1;
      const right = left + 1;
      let smallest = i;
      if (left < heapSize && scratch.fScore[scratch.heap[left]] < scratch.fScore[scratch.heap[smallest]]) smallest = left;
      if (right < heapSize && scratch.fScore[scratch.heap[right]] < scratch.fScore[scratch.heap[smallest]]) smallest = right;
      if (smallest === i) break;
      swapHeap(i, smallest);
      i = smallest;
    }
  };
  const pushHeap = (idx: number): void => {
    scratch.heap[heapSize] = idx;
    scratch.heapPos[idx] = heapSize;
    heapSize += 1;
    siftUp(heapSize - 1);
  };
  const popHeap = (): number => {
    const top = scratch.heap[0];
    heapSize -= 1;
    if (heapSize > 0) {
      const last = scratch.heap[heapSize];
      scratch.heap[0] = last;
      scratch.heapPos[last] = 0;
      siftDown(0);
    }
    return top;
  };

  scratch.seenStamp[startIdx] = stamp;
  scratch.gScore[startIdx] = 0;
  scratch.fScore[startIdx] = octileHeuristic(goalBx - startBx, goalBz - startBz);
  scratch.parent[startIdx] = -1;
  pushHeap(startIdx);

  let bestIdx = startIdx;
  let bestH = scratch.fScore[startIdx];
  let reachedGoal = false;
  let expansions = 0;

  while (heapSize > 0 && expansions < maxNodes) {
    const currIdx = popHeap();
    if (currIdx === goalIdx) {
      reachedGoal = true;
      break;
    }
    scratch.closedStamp[currIdx] = stamp;
    expansions += 1;

    const currGz = Math.floor(currIdx / sizeX);
    const currGx = currIdx - currGz * sizeX;
    const currBx = currGx - world.halfX;
    const currBz = currGz - world.halfZ;
    const currY = scratch.groundY[currIdx];
    const currG = scratch.gScore[currIdx];

    const hCurr = octileHeuristic(goalBx - currBx, goalBz - currBz);
    if (hCurr < bestH) {
      bestH = hCurr;
      bestIdx = currIdx;
    }

    for (let dir = 0; dir < 8; dir += 1) {
      const dx = NEIGHBOR_DX[dir];
      const dz = NEIGHBOR_DZ[dir];
      const nBx = currBx + dx;
      const nBz = currBz + dz;
      const nY = evalCell(nBx, nBz);
      if (nY < 0) continue;

      if (nY - currY > maxStepUp || currY - nY > STEP_DOWN_MAX) continue;

      // Prevent diagonal corner-cutting across blocked or cliff cells.
      if (dx !== 0 && dz !== 0) {
        const adj1Y = evalCell(currBx + dx, currBz);
        const adj2Y = evalCell(currBx, currBz + dz);
        if (adj1Y < 0 || adj2Y < 0) continue;
        if (adj1Y - currY > maxStepUp || currY - adj1Y > STEP_DOWN_MAX) continue;
        if (adj2Y - currY > maxStepUp || currY - adj2Y > STEP_DOWN_MAX) continue;
      }

      if (
        colliders.length > 0
        && isSegmentBlockedByColliders(
          currBx + 0.5,
          currBz + 0.5,
          nBx + 0.5,
          nBz + 0.5,
          Math.min(currY, nY),
          Math.max(currY, nY),
          colliders,
          ignoredColliders,
          roverActive,
          startX,
          startZ
        )
      ) {
        continue;
      }

      const nIdx = toIdx(nBx, nBz);
      if (scratch.closedStamp[nIdx] === stamp) continue;

      const stepCost = NEIGHBOR_COST[dir] + Math.abs(nY - currY) * ELEVATION_PENALTY;
      const tentativeG = currG + stepCost;

      if (scratch.seenStamp[nIdx] !== stamp) {
        scratch.seenStamp[nIdx] = stamp;
        scratch.parent[nIdx] = currIdx;
        scratch.gScore[nIdx] = tentativeG;
        scratch.fScore[nIdx] = tentativeG + octileHeuristic(goalBx - nBx, goalBz - nBz);
        pushHeap(nIdx);
      } else if (tentativeG < scratch.gScore[nIdx]) {
        scratch.parent[nIdx] = currIdx;
        scratch.gScore[nIdx] = tentativeG;
        scratch.fScore[nIdx] = tentativeG + octileHeuristic(goalBx - nBx, goalBz - nBz);
        siftUp(scratch.heapPos[nIdx]);
      }
    }
  }

  const endIdx = reachedGoal ? goalIdx : bestIdx;
  if (endIdx === startIdx) {
    out.push({ x: startX, z: startZ });
    out.push({ x: goalSnapped ? goalBx + 0.5 : targetX, z: goalSnapped ? goalBz + 0.5 : targetZ });
    return out;
  }

  // Reconstruct reversed cell chain
  const cells = scratch.rawCells;
  cells.length = 0;
  let trace = endIdx;
  while (trace !== -1) {
    const gz = Math.floor(trace / sizeX);
    const gx = trace - gz * sizeX;
    cells.push({ x: gx - world.halfX + 0.5, z: gz - world.halfZ + 0.5 });
    trace = scratch.parent[trace];
  }
  cells.reverse();

  // Anchor endpoints to exact continuous start / goal coordinates when safe
  cells[0].x = startX;
  cells[0].z = startZ;
  if (reachedGoal && !goalSnapped) {
    cells[cells.length - 1].x = targetX;
    cells[cells.length - 1].z = targetZ;
  }

  // Greedy string-pulling (line-of-sight smoothing) on the walkable grid
  const hasLineOfSight = (a: Point2D, b: Point2D): boolean => {
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const dist = Math.hypot(dx, dz);
    if (dist < 1e-4) return true;
    const steps = Math.max(2, Math.ceil(dist / LOS_SAMPLE_STEP));
    const nx = (-dz / dist) * LOS_LATERAL_PAD;
    const nz = (dx / dist) * LOS_LATERAL_PAD;

    let minY = Infinity;
    let maxY = -Infinity;
    let prevY = evalCell(Math.floor(a.x), Math.floor(a.z));
    if (prevY < 0) prevY = startFloorY;

    for (let s = 0; s <= steps; s += 1) {
      const t = s / steps;
      const px = a.x + dx * t;
      const pz = a.z + dz * t;
      const centerY = evalCell(Math.floor(px), Math.floor(pz));
      if (centerY < 0) return false;
      if (centerY - prevY > maxStepUp || prevY - centerY > STEP_DOWN_MAX) return false;
      prevY = centerY;
      if (centerY < minY) minY = centerY;
      if (centerY > maxY) maxY = centerY;

      // Check lateral clearance so smoothed corners don't clip walls or cliffs
      if (s > 0 && s < steps) {
        const ly = evalCell(Math.floor(px + nx), Math.floor(pz + nz));
        const ry = evalCell(Math.floor(px - nx), Math.floor(pz - nz));
        if (ly < 0 || ry < 0) return false;
        if (Math.abs(ly - centerY) > maxStepUp || Math.abs(ry - centerY) > maxStepUp) return false;
      }
    }

    if (
      colliders.length > 0
      && isSegmentBlockedByColliders(
        a.x,
        a.z,
        b.x,
        b.z,
        minY,
        maxY,
        colliders,
        ignoredColliders,
        roverActive,
        startX,
        startZ
      )
    ) {
      return false;
    }
    return true;
  };

  out.push({ x: cells[0].x, z: cells[0].z });
  let anchor = 0;
  while (anchor < cells.length - 1) {
    let farthest = anchor + 1;
    for (let probe = cells.length - 1; probe > anchor + 1; probe -= 1) {
      if (hasLineOfSight(cells[anchor], cells[probe])) {
        farthest = probe;
        break;
      }
    }
    out.push({ x: cells[farthest].x, z: cells[farthest].z });
    anchor = farthest;
  }

  return out;
}

function samplePolylineAt(
  polyline: readonly Point2D[],
  cumLen: readonly number[],
  s: number,
  out: Point2D
): void {
  const lastIdx = polyline.length - 1;
  if (s <= 0) {
    out.x = polyline[0].x;
    out.z = polyline[0].z;
    return;
  }
  if (s >= cumLen[lastIdx]) {
    out.x = polyline[lastIdx].x;
    out.z = polyline[lastIdx].z;
    return;
  }
  // Linear scan from segment 0 (polylines after string-pulling usually have 2..15 segments)
  for (let i = 0; i < lastIdx; i += 1) {
    const startS = cumLen[i];
    const endS = cumLen[i + 1];
    if (s <= endS) {
      const segLen = endS - startS;
      const t = segLen > 1e-6 ? (s - startS) / segLen : 0;
      out.x = polyline[i].x + (polyline[i + 1].x - polyline[i].x) * t;
      out.z = polyline[i].z + (polyline[i + 1].z - polyline[i].z) * t;
      return;
    }
  }
  out.x = polyline[lastIdx].x;
  out.z = polyline[lastIdx].z;
}

const _p0: Point2D = { x: 0, z: 0 };
const _pMid: Point2D = { x: 0, z: 0 };
const _p1: Point2D = { x: 0, z: 0 };

/**
 * Generates ground-hugging dashed quads along a 2D polyline.
 * Dashes stay anchored toward the target while gently flowing forward so they never drag with player feet.
 */
export function buildPathDashes(scratch: PathfinderScratch, options: DashSampleOptions): PathDash[] {
  const {
    world,
    polyline,
    inside,
    refY,
    roverActive,
    time,
    maxDashes = WAYPOINT_PATH_CONFIG.MAX_DASHES,
  } = options;

  const dashes = scratch.dashes;
  dashes.length = 0;
  if (polyline.length < 2) return dashes;

  const cumLen = scratch.cumLen;
  cumLen.length = polyline.length;
  cumLen[0] = 0;
  for (let i = 1; i < polyline.length; i += 1) {
    cumLen[i] = cumLen[i - 1] + Math.hypot(polyline[i].x - polyline[i - 1].x, polyline[i].z - polyline[i - 1].z);
  }

  const totalLen = cumLen[polyline.length - 1];
  const hideDist = roverActive ? WAYPOINT_PATH_CONFIG.HIDE_DISTANCE_ROVER : WAYPOINT_PATH_CONFIG.HIDE_DISTANCE_FOOT;
  if (totalLen < hideDist) return dashes;

  const fadeStart = roverActive ? WAYPOINT_PATH_CONFIG.FADE_IN_START_ROVER : WAYPOINT_PATH_CONFIG.FADE_IN_START_FOOT;
  const endPad = WAYPOINT_PATH_CONFIG.FADE_OUT_END;
  if (totalLen - endPad <= fadeStart + 0.15) return dashes;

  const dashLen = WAYPOINT_PATH_CONFIG.DASH_LENGTH;
  const cycle = dashLen + WAYPOINT_PATH_CONFIG.DASH_GAP;
  const phase = (time * WAYPOINT_PATH_CONFIG.FLOW_SPEED) % cycle;

  // u = distance from target along path: u = k * cycle - phase => s = totalLen + phase - k * cycle
  const kMax = Math.floor((totalLen + phase - fadeStart) / cycle);
  const kMin = Math.max(0, Math.ceil((phase + endPad - dashLen * 0.5) / cycle));

  for (let k = kMax; k >= kMin; k -= 1) {
    if (dashes.length >= maxDashes) break;
    const sMid = totalLen + phase - k * cycle;
    const rawS0 = sMid - dashLen * 0.5;
    const rawS1 = sMid + dashLen * 0.5;
    if (rawS1 <= fadeStart || rawS0 >= totalLen - endPad) continue;

    const s0 = Math.max(fadeStart, rawS0);
    const s1 = Math.min(totalLen - endPad, rawS1);
    if (s1 - s0 < 0.12) continue;

    const clampedMid = (s0 + s1) * 0.5;
    samplePolylineAt(polyline, cumLen, s0, _p0);
    samplePolylineAt(polyline, cumLen, clampedMid, _pMid);
    samplePolylineAt(polyline, cumLen, s1, _p1);

    const dx = _p1.x - _p0.x;
    const dz = _p1.z - _p0.z;
    const segLen = Math.hypot(dx, dz);
    if (segLen < 1e-4) continue;

    const fx = dx / segLen;
    const fz = dz / segLen;
    const rx = -fz;
    const rz = fx;

    const y0 = queryGroundSurfaceY(world, _p0.x, _p0.z, inside, refY);
    const yMid = queryGroundSurfaceY(world, _pMid.x, _pMid.z, inside, refY);
    const y1 = queryGroundSurfaceY(world, _p1.x, _p1.z, inside, refY);
    const y = Math.max(y0, yMid, y1) + WAYPOINT_PATH_CONFIG.SURFACE_OFFSET_Y;

    const fadeIn = Math.max(0, Math.min(1, (clampedMid - fadeStart) / WAYPOINT_PATH_CONFIG.FADE_IN_RANGE));
    const fadeOut = Math.max(0, Math.min(1, (totalLen - endPad - clampedMid) / WAYPOINT_PATH_CONFIG.FADE_OUT_RANGE));
    const alpha = WAYPOINT_PATH_CONFIG.OPACITY * fadeIn * fadeOut;
    if (alpha <= 0.005) continue;

    dashes.push({
      x0: _p0.x,
      z0: _p0.z,
      x1: _p1.x,
      z1: _p1.z,
      y,
      rx,
      rz,
      alpha,
    });
  }

  return dashes;
}
