import { pixelGridToSvgRects, type PixelPalette } from '../graphics/pixelArt.ts';

export type StatIconType = 'heart' | 'oxygen' | 'water' | 'food' | 'fire' | 'radiation';

const STAT_GRIDS: Record<StatIconType, readonly string[]> = {
  heart: [
    '..........',
    '.kkk..kkk.',
    'kmmmkkmmmk',
    'kmmmmmmmmk',
    'kmmmmmmmdk',
    '.kmmmmmdk.',
    '..kmmmdk..',
    '...kmdk...',
    '....kk....',
    '..........',
  ],
  oxygen: [
    '..kkkkkk..',
    '.kmmmmmmk.',
    'kmhmmmmmmk',
    'kmmmmmmmdk',
    'kmmmmmmmdk',
    'kmmmmmmmdk',
    'kmmmmmdddk',
    '.kmdddddk.',
    '..kkkkkk..',
    '..........',
  ],
  water: [
    '....kk....',
    '...kmmk...',
    '...kmmk...',
    '..kmmmmk..',
    '.kmhmmmmk.',
    '.kmmmmmdk.',
    '.kmmmmddk.',
    '.kmmmdddk.',
    '..kddddk..',
    '...kkkk...',
  ],
  food: [
    '......kkk.',
    '.....kllgk',
    '....kkggk.',
    '...kmmmgk.',
    '..kmmmmdk.',
    '..kmmmddk.',
    '.kmmmddk..',
    '.kmmddk...',
    '.kddkk....',
    '..kk......',
  ],
  fire: [
    '.kkkkkkkk.',
    'kmmmmmmmmk',
    'kmmmmmmmmk',
    'kmmmmmmmmk',
    'kmmmmmmmdk',
    'kmmmmmmmdk',
    '.kmmmmmdk.',
    '.kmmmdddk.',
    '..kddddk..',
    '...kkkk...',
  ],
  radiation: [
    '.kkk..kkk.',
    'kmmmkkmmmk',
    'kmmk..kmmk',
    '.kk.kk.kk.',
    '...kmmk...',
    '...kmmk...',
    '..kmmmmk..',
    '..kmmmmdk.',
    '...kkkkk..',
    '..........',
  ],
};

const OUTLINE_PALETTE: PixelPalette = { k: '#1c1d21' };

const EMPTY_PALETTE: PixelPalette = {
  m: '#44413c',
  h: '#4c4944',
  d: '#36332f',
  g: '#383632',
  l: '#44413c',
};

const FILL_PALETTE: PixelPalette = {
  m: 'currentColor',
  h: 'rgba(255, 255, 255, 0.20)',
  d: 'rgba(0, 0, 0, 0.18)',
  g: '#3b823f',
  l: '#58a852',
};

const ICON_CACHE = new Map<StatIconType, string>();

/**
 * Returns crisp, minimalist 10x10 layered pixel-art SVG markup for HUD survival stat icons.
 * Layers (`px-outline`, `px-empty`, `px-fill`) allow clean full, half, and empty states.
 */
export function getStatIconSvg(type: StatIconType): string {
  const cached = ICON_CACHE.get(type);
  if (cached) return cached;

  const grid = STAT_GRIDS[type];
  const outlineRects = pixelGridToSvgRects(grid, OUTLINE_PALETTE);
  const emptyRects = pixelGridToSvgRects(grid, EMPTY_PALETTE);
  // Paint base body under subtle highlight/shadow accents so overlays tint currentColor cleanly.
  const baseBodyGrid = grid.map((row) => row.replace(/[hd]/g, 'm'));
  const baseBodyRects = pixelGridToSvgRects(baseBodyGrid, {
    m: 'currentColor',
    g: FILL_PALETTE.g,
    l: FILL_PALETTE.l,
  });
  const accentRects = pixelGridToSvgRects(grid, {
    h: FILL_PALETTE.h,
    d: FILL_PALETTE.d,
  });

  const svg =
    `<svg viewBox="0 0 10 10" shape-rendering="crispEdges" aria-hidden="true">` +
    `<g class="px-outline">${outlineRects}</g>` +
    `<g class="px-empty">${emptyRects}</g>` +
    `<g class="px-fill"><rect x="0" y="0" width="10" height="10" fill="rgba(0,0,0,0)"/>${baseBodyRects}${accentRects}</g>` +
    `</svg>`;

  ICON_CACHE.set(type, svg);
  return svg;
}
