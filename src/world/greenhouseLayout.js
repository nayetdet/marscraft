import { HABITAT_LAYOUT } from './habitatLayout.js';

// Shared layout for the voxel beds and the plants placed on them.
// The dome centre and radius live in HABITAT_LAYOUT; everything here is relative to that centre.
export const GREENHOUSE_CENTER = Object.freeze({ x: HABITAT_LAYOUT.DOME_X, z: HABITAT_LAYOUT.DOME_Z });

// Garden plot: 2 x 2 soil beds south of the east walkway, right behind the food monitor.
// Offsets in blocks from the dome centre. The crop chosen on the monitor grows on GARDEN_CROP_BED.
const PLOT = Object.freeze({ dxMin: 3, dxMax: 4, dzMin: 3, dzMax: 4 });
export const GARDEN_CROP_BED = Object.freeze({ dx: 3, dz: 3 });

// Food monitor on the south edge of the east walkway, facing whoever walks in from the tunnel.
export const GREENHOUSE_MONITOR_POS = Object.freeze({
  x: GREENHOUSE_CENTER.x + 4.6,
  y: 11.25,
  z: GREENHOUSE_CENTER.z + 2.45,
});

export function isGreenhouseBed(dx, dz) {
  return dx >= PLOT.dxMin && dx <= PLOT.dxMax && dz >= PLOT.dzMin && dz <= PLOT.dzMax;
}

export function initialGreenhouseCrop(dx, dz) {
  if (dx === 4 && dz === 4) return 'carrot';
  if (dx === 3 && dz === 4) return 'potato';
  return null;
}

export function startsWithGreenhousePlant(dx, dz) {
  return initialGreenhouseCrop(dx, dz) !== null;
}
