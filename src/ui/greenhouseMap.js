import { CROP_CONFIG } from '../config/constants.js';
import { HABITAT_LAYOUT, domeFloorCell } from '../world/habitatLayout.js';
import { GARDEN_PLOT, GREENHOUSE_MONITOR_POS, GREENHOUSE_CENTER, GREENHOUSE_PLOTS, plotIndexAt } from '../world/greenhouseLayout.js';

// Pixel-art voxel top-down preview of the greenhouse for the PLANT FOOD modal.
// Pure SVG string generator with crispEdges (tested directly in Vitest). North is up, tunnel is right.
// `plots` = StationSystem.plots ([{ crop: null | { type, progress } }]).

export const CROP_MAP_COLORS = { lettuce: '#86efac', potato: '#e0a458', soy: '#4ade80' };

const TILE = 8; // pixels per voxel block
const R = HABITAT_LAYOUT.DOME_RADIUS;

// Precompute static voxel floor & plot geometry once at module load
const STATIC_FLOOR_RECTS = [];
const PLOT_CELLS = GREENHOUSE_PLOTS.map(() => []);
const PLOT_LOOKUP = GREENHOUSE_PLOTS.map(() => new Set());

for (let dz = -R; dz <= R; dz++) {
  for (let dx = -R; dx <= R; dx++) {
    const plotIdx = plotIndexAt(dx, dz);
    if (plotIdx >= 0) {
      PLOT_CELLS[plotIdx].push([dx, dz]);
      PLOT_LOOKUP[plotIdx].add(`${dx},${dz}`);
      continue;
    }
    const dist = Math.hypot(dx, dz);
    const inTunnelOpening = dx >= 13 && Math.abs(dz) <= 2;
    if (dist > R + 0.4 && !inTunnelOpening) continue;
    const cell = inTunnelOpening ? 'walk' : domeFloorCell(dx, dz);
    const checker = (dx + dz) & 1;
    let fill = '#273f49';
    if (cell === 'ring') fill = checker ? '#cbd5e1' : '#b2becb';
    else if (cell === 'plaza') fill = checker ? '#3e5c69' : '#344e5a';
    else if (cell === 'walk') fill = checker ? '#253c46' : '#2d4752';
    STATIC_FLOOR_RECTS.push(`<rect x="${dx * TILE}" y="${dz * TILE}" width="${TILE}" height="${TILE}" fill="${fill}"/>`);
  }
}

// Tunnel extension to the main habitat on the east side
for (let dx = R + 1; dx <= R + 4; dx++) {
  for (let dz = -3; dz <= 3; dz++) {
    const checker = (dx + dz) & 1;
    const isWall = Math.abs(dz) === 3;
    const fill = isWall ? (checker ? '#cbd5e1' : '#94a3b8') : (checker ? '#253c46' : '#2d4752');
    STATIC_FLOOR_RECTS.push(`<rect x="${dx * TILE}" y="${dz * TILE}" width="${TILE}" height="${TILE}" fill="${fill}"/>`);
  }
}
// Central dome ceiling light pixel accent
STATIC_FLOOR_RECTS.push(`<rect x="1" y="1" width="6" height="6" fill="#fef08a" fill-opacity="0.75"/>`);

// Precompute voxel outline segments for each plot (only edges bordering non-plot cells)
const PLOT_OUTLINES = PLOT_CELLS.map((cells, i) => {
  const set = PLOT_LOOKUP[i];
  const segs = [];
  for (const [dx, dz] of cells) {
    const x0 = dx * TILE;
    const y0 = dz * TILE;
    const x1 = x0 + TILE;
    const y1 = y0 + TILE;
    if (!set.has(`${dx},${dz - 1}`)) segs.push(`M${x0} ${y0}H${x1}`);
    if (!set.has(`${dx},${dz + 1}`)) segs.push(`M${x0} ${y1}H${x1}`);
    if (!set.has(`${dx - 1},${dz}`)) segs.push(`M${x0} ${y0}V${y1}`);
    if (!set.has(`${dx + 1},${dz}`)) segs.push(`M${x1} ${y0}V${y1}`);
  }
  return segs.join('');
});

// Visual center (in pixels) for each plot's icon/label
const PLOT_CENTERS = GREENHOUSE_PLOTS.map((def, i) => {
  if (def.kind === 'garden') {
    const cx = ((GARDEN_PLOT.dxMin + GARDEN_PLOT.dxMax + 1) / 2) * TILE;
    const cy = ((GARDEN_PLOT.dzMin + GARDEN_PLOT.dzMax + 1) / 2) * TILE;
    return [cx, cy];
  }
  // SE inner plot (A2) wraps around the garden bed: place badge on its clean right wing
  if (def.kind === 'inner' && def.sx > 0 && def.sz > 0) {
    return [6 * TILE, 3.8 * TILE];
  }
  const cells = PLOT_CELLS[i];
  const avgX = cells.reduce((s, [dx]) => s + dx + 0.5, 0) / cells.length;
  const avgZ = cells.reduce((s, [, dz]) => s + dz + 0.5, 0) / cells.length;
  return [Math.round(avgX * TILE), Math.round(avgZ * TILE)];
});

const FLOOR_SVG = STATIC_FLOOR_RECTS.join('');

// Crisp pixel-art crop icons centered at (0, 0)
function cropIconSvg(type, scale = 1) {
  let rects = '';
  if (type === 'lettuce') {
    rects = '<rect x="-5" y="-4" width="10" height="8" fill="#166534"/>'
      + '<rect x="-4" y="-5" width="8" height="9" fill="#22c55e"/>'
      + '<rect x="-3" y="-3" width="6" height="6" fill="#86efac"/>'
      + '<rect x="-1" y="-2" width="2" height="3" fill="#dcfce7"/>';
  } else if (type === 'potato') {
    rects = '<rect x="-5" y="-2" width="10" height="6" fill="#78350f"/>'
      + '<rect x="-4" y="-3" width="8" height="6" fill="#b45309"/>'
      + '<rect x="-3" y="-2" width="5" height="4" fill="#eab308"/>'
      + '<rect x="-2" y="-6" width="4" height="3" fill="#22c55e"/>'
      + '<rect x="0" y="-7" width="3" height="2" fill="#86efac"/>';
  } else if (type === 'soy') {
    rects = '<rect x="-1" y="-6" width="2" height="12" fill="#15803d"/>'
      + '<rect x="-5" y="-4" width="4" height="6" fill="#22c55e"/>'
      + '<rect x="-4" y="-3" width="2" height="2" fill="#bef264"/>'
      + '<rect x="-4" y="0" width="2" height="1" fill="#bef264"/>'
      + '<rect x="1" y="-2" width="4" height="6" fill="#22c55e"/>'
      + '<rect x="2" y="-1" width="2" height="2" fill="#bef264"/>'
      + '<rect x="2" y="2" width="2" height="1" fill="#bef264"/>';
  }
  return `<g class="gh-map-crop" transform="scale(${scale})">${rects}</g>`;
}

// Mini pixel sprout drawn inside every voxel soil tile of a planted bed
function tileSproutSvg(dx, dz, type, pct) {
  const x = dx * TILE;
  const y = dz * TILE;
  const mature = pct >= 50;
  if (type === 'lettuce') {
    return mature
      ? `<rect x="${x + 1}" y="${y + 1}" width="6" height="6" fill="#22c55e"/><rect x="${x + 2}" y="${y + 2}" width="4" height="4" fill="#86efac"/>`
      : `<rect x="${x + 2}" y="${y + 2}" width="4" height="4" fill="#4ade80"/>`;
  }
  if (type === 'potato') {
    return mature
      ? `<rect x="${x + 1}" y="${y + 2}" width="6" height="4" fill="#22c55e"/><rect x="${x + 2}" y="${y + 4}" width="4" height="2" fill="#d97706"/>`
      : `<rect x="${x + 2}" y="${y + 2}" width="4" height="3" fill="#4ade80"/><rect x="${x + 3}" y="${y + 5}" width="2" height="2" fill="#b45309"/>`;
  }
  return mature
    ? `<rect x="${x + 2}" y="${y + 1}" width="4" height="6" fill="#16a34a"/><rect x="${x + 1}" y="${y + 2}" width="2" height="3" fill="#a3e635"/><rect x="${x + 5}" y="${y + 3}" width="2" height="3" fill="#a3e635"/>`
    : `<rect x="${x + 3}" y="${y + 2}" width="2" height="4" fill="#22c55e"/><rect x="${x + 2}" y="${y + 3}" width="4" height="2" fill="#84cc16"/>`;
}

export function plotStatus(plot) {
  if (!plot?.crop) return { state: 'empty', label: '', pct: 0 };
  const pct = Math.floor((plot.crop.progress / CROP_CONFIG[plot.crop.type].seconds) * 100);
  return pct >= 100 ? { state: 'ready', label: 'READY', pct: 100 } : { state: 'growing', label: `${pct}%`, pct };
}

// Short per-plot label (also used by live progress updates without re-rendering the SVG)
export function plotMapLabel(plot) {
  return plotStatus(plot).label;
}

function canAffordPlot(def, options) {
  const { selectedCrop, water, energy } = options;
  if (!selectedCrop || !Object.hasOwn(CROP_CONFIG, selectedCrop)) return true;
  if (typeof water !== 'number' || typeof energy !== 'number') return true;
  const recipe = CROP_CONFIG[selectedCrop];
  return water >= recipe.water * def.yield && energy >= recipe.energy * def.yield;
}

export function greenhouseMapSvg(plots, selected = -1, options = {}) {
  const shapes = GREENHOUSE_PLOTS.map((def, i) => {
    const status = plotStatus(plots[i]);
    const crop = plots[i]?.crop;
    const locked = status.state === 'empty' && !canAffordPlot(def, options);
    const classes = [
      'gh-plot',
      `is-${status.state}`,
      i === selected ? 'is-selected' : '',
      locked ? 'is-locked' : '',
    ].filter(Boolean).join(' ');
    const style = crop ? ` style="--crop:${CROP_MAP_COLORS[crop.type]}"` : '';
    const aria = `${def.name} (${def.yield}x): ${crop ? `${crop.type} ${status.label}` : locked ? 'not enough water or power' : 'empty, tap or drop crop to plant'}`;

    const cells = PLOT_CELLS[i];
    const soilTiles = cells.map(([dx, dz]) => {
      const x = dx * TILE;
      const y = dz * TILE;
      return `<rect class="gh-bed-tile" x="${x}" y="${y}" width="${TILE}" height="${TILE}"/>`
        + `<rect class="gh-bed-furrow" x="${x + 1}" y="${y + 3}" width="${TILE - 2}" height="1"/>`
        + `<rect class="gh-bed-furrow" x="${x + 1}" y="${y + 6}" width="${TILE - 2}" height="1"/>`
        + (crop ? tileSproutSvg(dx, dz, crop.type, status.pct) : '');
    }).join('');

    const outline = `<path class="gh-bed-edge" d="${PLOT_OUTLINES[i]}" fill="none"/>`;
    const [tx, ty] = PLOT_CENTERS[i];

    let badge = '';
    if (crop) {
      const iconScale = def.kind === 'garden' ? 0.9 : 1.15;
      const boxW = def.kind === 'garden' ? 20 : 28;
      const boxH = def.kind === 'garden' ? 18 : 22;
      const iconDy = def.kind === 'garden' ? -3 : -4;
      const textDy = def.kind === 'garden' ? 8 : 10;
      badge = `<rect class="gh-badge-bg" x="${tx - boxW / 2}" y="${ty - boxH / 2}" width="${boxW}" height="${boxH}"/>`
        + `<g transform="translate(${tx}, ${ty + iconDy})">${cropIconSvg(crop.type, iconScale)}</g>`
        + `<text class="gh-plot-pct" data-plot-pct="${i}" x="${tx}" y="${ty + textDy}">${status.label}</text>`;
    } else {
      const boxW = def.kind === 'garden' ? 14 : 20;
      const boxH = def.kind === 'garden' ? 14 : 18;
      const plusDy = def.kind === 'garden' ? -1 : -1;
      const yieldDy = def.kind === 'garden' ? 6 : 7;
      badge = `<rect class="gh-badge-bg is-empty" x="${tx - boxW / 2}" y="${ty - boxH / 2}" width="${boxW}" height="${boxH}"/>`
        + `<text class="gh-plot-plus" x="${tx}" y="${ty + plusDy}">${locked ? '·' : '+'}</text>`
        + `<text class="gh-plot-yield" data-plot-pct="${i}" x="${tx}" y="${ty + yieldDy}">${def.yield}x</text>`;
    }

    return `<g class="${classes}" data-action="plot:${i}" data-plot-id="${def.id}" role="button" tabindex="0" aria-label="${aria}"${style}>`
      + soilTiles
      + outline
      + badge
      + `</g>`;
  });

  // Draw the garden bed last so its border layers cleanly on top of the SE corner
  const drawn = [...shapes.slice(1), shapes[0]].join('');

  const monitorPx = Math.round((GREENHOUSE_MONITOR_POS.x - GREENHOUSE_CENTER.x) * TILE);
  const monitorPy = Math.round((GREENHOUSE_MONITOR_POS.z - GREENHOUSE_CENTER.z) * TILE);

  return `<svg class="gh-map" viewBox="-122 -128 274 250" shape-rendering="crispEdges" role="group" aria-label="Pixelated top-down greenhouse: drag a crop or tap a bed to plant">`
    + FLOOR_SVG
    + drawn
    // Monitor & player marker on the east walkway
    + `<rect class="gh-map-you" x="${monitorPx - 4}" y="${monitorPy - 4}" width="8" height="8"/>`
    + `<rect x="${monitorPx - 2}" y="${monitorPy - 2}" width="4" height="4" fill="#0f172a"/>`
    + `<text class="gh-map-you-label" x="${monitorPx}" y="${monitorPy - 6}">YOU</text>`
    + `<text class="gh-map-note" x="4" y="-116">N</text>`
    + `<text class="gh-map-note" x="${(R + 2.5) * TILE}" y="6">HAB</text>`
    + `</svg>`;
}
