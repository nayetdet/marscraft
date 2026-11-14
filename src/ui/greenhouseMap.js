import { CROP_CONFIG } from '../config/constants.js';
import { DOME_FLOOR, HABITAT_LAYOUT } from '../world/habitatLayout.js';
import { GARDEN_PLOT, GREENHOUSE_MONITOR_POS, GREENHOUSE_CENTER, GREENHOUSE_PLOTS } from '../world/greenhouseLayout.js';

// Mapa da estufa visto de cima, para o monitor de comida: cada campo e uma area clicavel.
// Funcao pura (so monta o SVG em texto), para testar com Vitest. Norte em cima, tunel a direita.
// `plots` = StationSystem.plots ([{ crop: null | { type, progress } }]).

export const CROP_MAP_COLORS = { lettuce: '#86efac', potato: '#e0a458', soy: '#22c55e' };

const SIZE = 100; // raio da redoma em unidades do SVG
const K = SIZE / HABITAT_LAYOUT.DOME_RADIUS;
const round = (n) => Math.round(n * 10) / 10;

// Coroa circular entre dois raios (com fill-rule evenodd)
function annulus(r0, r1) {
  const ring = (r) => `M ${round(r)} 0 A ${round(r)} ${round(r)} 0 1 0 ${round(-r)} 0 A ${round(r)} ${round(r)} 0 1 0 ${round(r)} 0 Z`;
  return `${ring(r1)} ${ring(r0)}`;
}

export function plotStatus(plot) {
  if (!plot?.crop) return { state: 'empty', label: '', pct: 0 };
  const pct = Math.floor((plot.crop.progress / CROP_CONFIG[plot.crop.type].seconds) * 100);
  return pct >= 100 ? { state: 'ready', label: 'READY', pct: 100 } : { state: 'growing', label: `${pct}%`, pct };
}

// Texto curto de um campo no mapa (tambem usado para atualizar o SVG sem redesenhar tudo)
export function plotMapLabel(plot) {
  return plotStatus(plot).label;
}

export function greenhouseMapSvg(plots, selected) {
  const walk = (DOME_FLOOR.WALK_HALF + 0.5) * K;
  const far = SIZE + 6;
  const inner = [DOME_FLOOR.PLAZA_R * K, DOME_FLOOR.INNER_R * K];
  const outer = [DOME_FLOOR.RING_R * K, (HABITAT_LAYOUT.DOME_RADIUS - DOME_FLOOR.FIELD_MARGIN) * K];

  const clips = [[1, -1], [1, 1], [-1, 1], [-1, -1]].map(([sx, sz], i) => {
    const x = sx > 0 ? walk : -far;
    const y = sz > 0 ? walk : -far;
    return `<clipPath id="ghq-${i}"><rect x="${round(x)}" y="${round(y)}" width="${round(far - walk)}" height="${round(far - walk)}"/></clipPath>`;
  }).join('');

  const shapes = GREENHOUSE_PLOTS.map((def, i) => {
    const status = plotStatus(plots[i]);
    const crop = plots[i]?.crop;
    const classes = ['gh-plot', `is-${status.state}`, i === selected ? 'is-selected' : ''].filter(Boolean).join(' ');
    const style = crop ? ` style="--crop:${CROP_MAP_COLORS[crop.type]}"` : '';
    const aria = `${def.name}: ${crop ? `${crop.type} ${status.label}` : 'empty'}`;
    let shape;
    let tx;
    let ty;
    if (def.kind === 'garden') {
      const x = GARDEN_PLOT.dxMin * K;
      const y = GARDEN_PLOT.dzMin * K;
      const w = (GARDEN_PLOT.dxMax - GARDEN_PLOT.dxMin + 1) * K;
      shape = `<rect x="${round(x)}" y="${round(y)}" width="${round(w)}" height="${round(w)}"/>`;
      tx = x + w / 2;
      ty = y + w / 2 - 1;
    } else {
      const [r0, r1] = def.kind === 'inner' ? inner : outer;
      shape = `<path d="${annulus(r0, r1)}" fill-rule="evenodd" clip-path="url(#ghq-${def.quadrant})"/>`;
      const mid = ((r0 + r1) / 2) * Math.SQRT1_2;
      tx = def.sx * mid;
      ty = def.sz * mid - 2;
      // O jardim fica dentro do campo de dentro a sudeste: o rotulo desse campo desce um pouco
      if (def.kind === 'inner' && def.sx > 0 && def.sz > 0) {
        tx = 24;
        ty = 45;
      }
    }
    return `<g class="${classes}" data-action="plot:${i}" role="button" tabindex="0" aria-label="${aria}"${style}>${shape}`
      + `<text class="gh-plot-id" x="${round(tx)}" y="${round(ty)}">${def.id}</text>`
      + `<text class="gh-plot-pct" data-plot-pct="${i}" x="${round(tx)}" y="${round(ty + 10)}">${status.label}</text></g>`;
  });
  // O jardim fica por cima do campo de dentro a sudeste, entao e desenhado por ultimo
  const drawn = [...shapes.slice(1), shapes[0]].join('');

  const monitorX = (GREENHOUSE_MONITOR_POS.x - GREENHOUSE_CENTER.x - 0.5) * K;
  const monitorY = (GREENHOUSE_MONITOR_POS.z - GREENHOUSE_CENTER.z - 0.5) * K;
  return `<svg class="gh-map" viewBox="-112 -112 224 224" role="group" aria-label="Greenhouse seen from above: pick a field">`
    + `<defs>${clips}</defs>`
    + `<circle class="gh-map-dome" r="${SIZE}"/>`
    + `<circle class="gh-map-plaza" r="${round(inner[0] - 3)}"/>`
    + drawn
    + `<rect class="gh-map-you" x="${round(monitorX - 4)}" y="${round(monitorY - 4)}" width="8" height="8"/>`
    + `<text class="gh-map-note" x="0" y="-102">N</text>`
    + `<text class="gh-map-note" x="96" y="3" text-anchor="end">TUNNEL</text>`
    + `</svg>`;
}
