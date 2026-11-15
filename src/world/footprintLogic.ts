import { BLOCK_IDS } from '../config/blockTypes.ts';

export type FootprintBlockLookup = {
  getBlock(x: number, y: number, z: number): number;
};

export function accumulateFootstepDistance(distance: number, traveled: number, spacing: number): {
  distanceSinceStep: number;
  shouldPlace: boolean;
} {
  const accumulated = distance + traveled;
  if (accumulated < spacing) return { distanceSinceStep: accumulated, shouldPlace: false };
  return { distanceSinceStep: accumulated % spacing, shouldPlace: true };
}

export function findRegolithSurfaceY(
  world: FootprintBlockLookup,
  x: number,
  startY: number,
  z: number
): number | null {
  let y = startY;
  while (y > 0 && world.getBlock(x, y, z) === BLOCK_IDS.AIR) y -= 1;
  return world.getBlock(x, y, z) === BLOCK_IDS.REGOLITH ? y : null;
}
