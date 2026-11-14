// Icones 8x8 em pixel art para os cards do HUD. Cada 'X' vira um pixel preenchido com currentColor.
const ICONS = {
  bolt: [
    '....XXX.',
    '...XXX..',
    '..XXX...',
    '.XXXXXX.',
    '...XXX..',
    '..XXX...',
    '.XXX....',
    '.XX.....',
  ],
  radiation: [
    '.XX..XX.',
    'XXX..XXX',
    'XXX..XXX',
    '...XX...',
    '...XX...',
    '..XXXX..',
    '.XXXXXX.',
    '..XXXX..',
  ],
  shield: [
    '.XXXXXX.',
    'XXXXXXXX',
    'XXX..XXX',
    'XXX..XXX',
    '.XXXXXX.',
    '.XXXXXX.',
    '..XXXX..',
    '...XX...',
  ],
  storm: [
    '..XXXX..',
    '.XXXXXX.',
    'XXXXXXXX',
    'XXXXXXXX',
    '.XXXXXX.',
    '..X..X..',
    '.X..X..X',
    'X..X..X.',
  ],
  rocket: [
    '...XX...',
    '..XXXX..',
    '..X..X..',
    '..XXXX..',
    '..XXXX..',
    '.XXXXXX.',
    'X.XXXX.X',
    '..X..X..',
  ],
  sun: [
    'X..XX..X',
    '.X....X.',
    '...XX...',
    'X.XXXX.X',
    'X.XXXX.X',
    '...XX...',
    '.X....X.',
    'X..XX..X',
  ],
  moon: [
    '..XXX...',
    '.XXX....',
    'XXX.....',
    'XXX.....',
    'XXX.....',
    'XXXX...X',
    '.XXXXXX.',
    '..XXXX..',
  ],
};

ICONS.drop = [
  '...XX...',
  '...XX...',
  '..XXXX..',
  '.XXXXXX.',
  '.XXXXXX.',
  'XXXXXXXX',
  '.XXXXXX.',
  '..XXXX..',
];

// Bolhas de ar (O2 da base)
ICONS.air = [
  '.....XX.',
  '....X..X',
  '.XX..XX.',
  'X..X....',
  'X..X.XX.',
  '.XX.X..X',
  '....X..X',
  '.....XX.',
];

// Planta murcha: aparece quando a estufa esta sem agua
ICONS.plant = [
  '.XX.....',
  'XXX..XX.',
  '.X..XXXX',
  '..X.X...',
  '...X....',
  '...X....',
  '..XXXX..',
  '..XXXX..',
];

ICONS.up = [
  '...XX...',
  '..XXXX..',
  '.XXXXXX.',
  'XXXXXXXX',
  '..XXXX..',
  '..XXXX..',
  '..XXXX..',
  '........',
];
ICONS.down = [...ICONS.up].reverse();

const cache = new Map();

export function pixelIconSvg(name) {
  if (!cache.has(name)) {
    const rects = [];
    ICONS[name].forEach((row, y) => {
      [...row].forEach((c, x) => {
        if (c === 'X') rects.push(`<rect x="${x}" y="${y}" width="1" height="1"/>`);
      });
    });
    cache.set(name, `<svg viewBox="0 0 8 8" shape-rendering="crispEdges" fill="currentColor" aria-hidden="true">${rects.join('')}</svg>`);
  }
  return cache.get(name);
}
