// @ts-nocheck
// Icones 8x8 em pixel art para os cards do HUD. Cada 'X' vira um pixel preenchido com currentColor.
const ICONS = {
  temperature: [
    '...XX...',
    '..X..X..',
    '..X.XX..',
    '..X.XX..',
    '..X.XX..',
    '.XXXXXX.',
    '.XXXXXX.',
    '..XXXX..',
  ],
  dust: [
    '..X...X.',
    'X...X...',
    '...XXX..',
    '.XXXXXX.',
    'XXXXXXXX',
    '.XXXXXX.',
    '...X..X.',
    '.X......',
  ],
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

// Icones da historia (painel do objetivo e cards)
ICONS.door = [
  '.XXXXXX.',
  '.X....X.',
  '.X....X.',
  '.X....X.',
  '.X..X.X.',
  '.X....X.',
  '.X....X.',
  '.XXXXXX.',
];

// Mensagem pelo radio (balao de fala)
ICONS.radio = [
  '.XXXXXX.',
  'XXXXXXXX',
  'X.XX.XX.',
  'XXXXXXXX',
  '.XXXXXX.',
  '..XX....',
  '.XX.....',
  '........',
];

// Bloco de gelo (cubo)
ICONS.ice = [
  '..XXXXXX',
  '.X....XX',
  'XXXXXX.X',
  'X....X.X',
  'X.X..X.X',
  'X....XX.',
  'XXXXXX..',
  '........',
];

ICONS.clock = [
  '..XXXX..',
  '.X....X.',
  'X..X...X',
  'X..X...X',
  'X..XXX.X',
  'X......X',
  '.X....X.',
  '..XXXX..',
];

// Abrigo: a base
ICONS.home = [
  '...XX...',
  '..XXXX..',
  '.XXXXXX.',
  'XXXXXXXX',
  '.XXXXXX.',
  '.XX..XX.',
  '.XX..XX.',
  '.XX..XX.',
];

ICONS.check = [
  '........',
  '.......X',
  '......XX',
  'X....XX.',
  'XX..XX..',
  '.XXXX...',
  '..XX....',
  '........',
];

// Medalha do certificado de cadete (issue #88) e coracao da saude
ICONS.medal = [
  '.XX..XX.',
  '..X..X..',
  '...XX...',
  '..XXXX..',
  '.XX..XX.',
  '.X.XX.X.',
  '.XX..XX.',
  '..XXXX..',
];

ICONS.heart = [
  '........',
  '.XX..XX.',
  'XXXXXXXX',
  'XXXXXXXX',
  '.XXXXXX.',
  '..XXXX..',
  '...XX...',
  '........',
];

// Mars carrot (boletim do cadete, issue #90)
ICONS.food = [
  '....X.X.',
  '....XXXX',
  '..XXXX..',
  '.XXXXX..',
  '.XXXX...',
  'XXXX....',
  'XXX.....',
  'X.......',
];

// Luneta do scanner (lupa): escanear coisas para o pacote de ciencia
ICONS.scope = [
  '.XXXX...',
  'X....X..',
  'X....X..',
  'X....X..',
  '.XXXX...',
  '....XX..',
  '.....XX.',
  '......XX',
];

// Amostra de rocha (regolito) para analisar
ICONS.rock = [
  '........',
  '...XX...',
  '..XXXX..',
  '.XX.XXX.',
  'XXXXX.XX',
  'XX.XXXXX',
  'XXXXXXXX',
  '.XXXXXX.',
];

// Cenas das animacoes de "primeira vez" (src/story/firstTimeMoments.ts)
ICONS.rover = [
  '......X.',
  '......X.',
  '.XXXXXX.',
  'XXXXXXXX',
  'XXXXXXXX',
  '.X.XX.X.',
  'XXX..XXX',
  '.X....X.',
];

ICONS.dumbbell = [
  '........',
  'XX....XX',
  'XX....XX',
  'XXXXXXXX',
  'XXXXXXXX',
  'XX....XX',
  'XX....XX',
  '........',
];

ICONS.battery = [
  '..XXXX..',
  '.XXXXXX.',
  '.X....X.',
  '.X.XX.X.',
  '.X.XX.X.',
  '.X.XX.X.',
  '.X....X.',
  '.XXXXXX.',
];

ICONS.seed = [
  '....XX..',
  '...XX...',
  '...X....',
  '..XXXX..',
  '.XXXXXX.',
  '.XXXXXX.',
  '..XXXX..',
  '........',
];

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
