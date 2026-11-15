import { GREENHOUSE_PLOT_YIELD } from '../config/constants.js';
import { DOME_FLOOR, HABITAT_LAYOUT, domeFloorCell } from './habitatLayout.js';

// Shared layout for the voxel beds and the plants placed on them.
// The dome centre and radius live in HABITAT_LAYOUT; everything here is relative to that centre.
export const GREENHOUSE_CENTER = Object.freeze({ x: HABITAT_LAYOUT.DOME_X, z: HABITAT_LAYOUT.DOME_Z });

// Garden plot: 2 x 2 soil beds south of the east walkway, right behind the food monitor.
// Offsets in blocks from the dome centre. The crop chosen on the monitor grows on GARDEN_CROP_BED.
export const GARDEN_PLOT = Object.freeze({ dxMin: 3, dxMax: 4, dzMin: 3, dzMax: 4 });
const PLOT = GARDEN_PLOT;
export const GARDEN_CROP_BED = Object.freeze({ dx: 3, dz: 3 });

// Food monitor on the south edge of the east walkway, facing whoever walks in from the tunnel.
export const GREENHOUSE_MONITOR_POS = Object.freeze({
  x: GREENHOUSE_CENTER.x + 4.6,
  y: 11.25,
  z: GREENHOUSE_CENTER.z + 2.45,
});
// Along the far west edge, opposite the tunnel entrance.
export const GREENHOUSE_BASKETS = Object.freeze(['potato', 'lettuce', 'soy'].map((type, i) => Object.freeze({
  type, x: GREENHOUSE_CENTER.x - 11.5, y: HABITAT_LAYOUT.FLOOR_Y + 1.3, z: GREENHOUSE_CENTER.z - 1.1 + i * 1.1,
})));

export function isGreenhouseBed(dx, dz) {
  return dx >= PLOT.dxMin && dx <= PLOT.dxMax && dz >= PLOT.dzMin && dz <= PLOT.dzMax;
}

// Every part of the plantation can be planted. Plot 0 is the garden bed next to the monitor;
// then come four inner fields (A1..A4) and four outer fields (B1..B4), one per quadrant,
// clockwise from the north-east. `yield` multiplies both the planting cost and the harvest.
const QUADRANTS = [
  { label: 'north-east', sx: 1, sz: -1 },
  { label: 'south-east', sx: 1, sz: 1 },
  { label: 'south-west', sx: -1, sz: 1 },
  { label: 'north-west', sx: -1, sz: -1 },
];
const fieldPlots = (kind, letter, title) => QUADRANTS.map((q, quadrant) => Object.freeze({
  id: `${letter}${quadrant + 1}`,
  name: `${title}, ${q.label}`,
  kind,
  quadrant,
  sx: q.sx,
  sz: q.sz,
  yield: GREENHOUSE_PLOT_YIELD[kind],
}));
export const GREENHOUSE_PLOTS = Object.freeze([
  Object.freeze({ id: 'G', name: 'Garden bed', kind: 'garden', yield: GREENHOUSE_PLOT_YIELD.garden }),
  ...fieldPlots('inner', 'A', 'Inner field'),
  ...fieldPlots('outer', 'B', 'Outer field'),
]);

// Index in GREENHOUSE_PLOTS of the plot that owns the floor cell (dx, dz), or -1 for walkways.
export function plotIndexAt(dx, dz) {
  if (isGreenhouseBed(dx, dz)) return 0;
  if (domeFloorCell(dx, dz) !== 'field') return -1;
  const ring = Math.hypot(dx, dz) < DOME_FLOOR.INNER_R ? 0 : 1;
  const quadrant = QUADRANTS.findIndex((q) => Math.sign(dx) === q.sx && Math.sign(dz) === q.sz);
  return 1 + ring * QUADRANTS.length + quadrant;
}

// Trays where a plot's crop shows a plant: one plant per item the harvest gives, so what the
// player sees growing is what they collect. Field plants are spread evenly around the dome.
export const PLOT_PLANT_CELLS = Object.freeze(GREENHOUSE_PLOTS.map((plot, index) => {
  if (index === 0) return Object.freeze([Object.freeze({ dx: GARDEN_CROP_BED.dx, dz: GARDEN_CROP_BED.dz })]);
  const cells = [];
  const R = HABITAT_LAYOUT.DOME_RADIUS;
  for (let dx = -R; dx <= R; dx++) {
    for (let dz = -R; dz <= R; dz++) {
      if (plotIndexAt(dx, dz) === index) cells.push({ dx, dz, angle: Math.atan2(dz + 0.5, dx + 0.5) });
    }
  }
  cells.sort((a, b) => a.angle - b.angle);
  return Object.freeze(Array.from({ length: plot.yield }, (_, i) => {
    const { dx, dz } = cells[Math.floor(((i + 0.5) * cells.length) / plot.yield)];
    return Object.freeze({ dx, dz });
  }));
}));
