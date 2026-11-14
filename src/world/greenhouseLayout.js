// Shared layout for the voxel beds and the plants placed on them.
export const GREENHOUSE_CENTER = Object.freeze({ x: -18, z: 0 });
export const GARDEN_CROP_BED = Object.freeze({ dx: 1, dz: 2 });
export const GREENHOUSE_MONITOR_POS = Object.freeze({ x: -16.5, y: 11.25, z: 1.85 });

export function isGreenhouseBed(dx, dz) {
  return dx !== 0 && dz !== 0 && !(dx === 1 && dz === 1) && Math.hypot(dx, dz) <= 6.2;
}

export function initialGreenhouseCrop(dx, dz) {
  if (dx === -2 && dz === 2) return 'carrot';
  if (dx === 2 && dz === -2) return 'potato';
  return null;
}

export function startsWithGreenhousePlant(dx, dz) {
  return initialGreenhouseCrop(dx, dz) !== null;
}
