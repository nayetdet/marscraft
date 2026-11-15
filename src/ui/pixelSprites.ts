// Desenhos coloridos 12x12 em pixel art para as cenas das animacoes de "primeira vez"
// (FirstTimeHud). Cada letra de uma linha e uma cor de `colors`; '.' e vazio.
// Os icones de uma cor so do HUD continuam em pixelIcons.ts.

export const SPRITE_SIZE = 12;

export interface PixelSprite {
  colors: Record<string, string>;
  rows: string[];
}

export const PIXEL_SPRITES: Record<string, PixelSprite> = {
  mars: {
    colors: { R: '#c8552d', D: '#8f3a1e', L: '#e58a5a' },
    rows: [
      '....RRRR....',
      '..RRLLRRRR..',
      '.RLLRRRRDRR.',
      '.RLRRRRDDRR.',
      'RRRRDRRRRRRR',
      'RRRDDRRRRLRR',
      'RRRRRRRRRRRR',
      'RRLRRRRDDRRD',
      '.RRRRRRDRRD.',
      '.RRRDRRRRDD.',
      '..RRRRRDDD..',
      '....DDDD....',
    ],
  },
  earth: {
    colors: { B: '#2f7fd1', G: '#4fbf6b', W: '#e9f4ff', N: '#1f5aa3' },
    rows: [
      '....WWBB....',
      '..BBGGBBWW..',
      '.BGGGGBBBBB.',
      '.BGGGBBBGGB.',
      'BBGGBBBGGGGB',
      'BBBGBBBGGGBB',
      'BWWBBBBBGGBB',
      'BBBBGGBBBBBN',
      '.BBGGGGBBBN.',
      '.BBBGGBBBNN.',
      '..BBBBWWNN..',
      '....NNNN....',
    ],
  },
  // Bloco de gelo
  ice: {
    colors: { W: '#eaf9ff', L: '#9fe3f5', B: '#5cc3e6', D: '#2f8fbf' },
    rows: [
      '............',
      '..WWWWWWWW..',
      '.WLLLLLLLLB.',
      '.WLWWLLLLLB.',
      '.WLWLLLLLLB.',
      '.WLLLLLLLLB.',
      '.WLLLLLLBLB.',
      '.WLLLLLBBLB.',
      '.WLLLLLLLLB.',
      '.WLLLLLLLLB.',
      '.BBBBBBBBBD.',
      '............',
    ],
  },
  // Gota de agua
  drop: {
    colors: { W: '#e9f6ff', L: '#8fd3f7', B: '#3fa3e8', D: '#1f6fb8' },
    rows: [
      '.....BB.....',
      '.....BB.....',
      '....BLLB....',
      '....BLLB....',
      '...BLLLLB...',
      '..BLWLLLLB..',
      '..BLWLLLLB..',
      '.BLWLLLLLBD.',
      '.BLLLLLLLBD.',
      '.BLLLLLLBBD.',
      '..BBBBBBDD..',
      '...DDDDDD...',
    ],
  },
  heart: {
    colors: { R: '#f0483e', L: '#ff8a80', D: '#a82a2a', W: '#ffd6d2' },
    rows: [
      '............',
      '..RRR..RRR..',
      '.RLLRRRRRRR.',
      '.RLWRRRRRRD.',
      '.RLRRRRRRRD.',
      '.RRRRRRRRRD.',
      '..RRRRRRRD..',
      '...RRRRRD...',
      '....RRRD....',
      '.....RD.....',
      '............',
      '............',
    ],
  },
  // Cenoura de Marte
  food: {
    colors: { O: '#f28c38', D: '#c2611c', G: '#4fbf6b', L: '#ffb56b' },
    rows: [
      '........GG.G',
      '.......GGGG.',
      '......OGGG..',
      '.....OOOG.G.',
      '....OLOOD...',
      '...OLOODD...',
      '..OLOOOD....',
      '..OOOOD.....',
      '.OOOOD......',
      '.OODD.......',
      '.DD.........',
      '............',
    ],
  },
  sun: {
    colors: { Y: '#ffe45c', O: '#ffb02e', W: '#fff7c2' },
    rows: [
      '.....OO.....',
      '.O...OO...O.',
      '..O......O..',
      '....YYYY....',
      '...YWWYYY...',
      'OO.YWYYYY.OO',
      'OO.YYYYYY.OO',
      '...YYYYYO...',
      '....YYOO....',
      '..O......O..',
      '.O...OO...O.',
      '.....OO.....',
    ],
  },
  battery: {
    colors: { S: '#c3c9c7', K: '#2a323a', G: '#78d99b', L: '#b6f5c8' },
    rows: [
      '....SSSS....',
      '..SSSSSSSS..',
      '..SKKKKKKS..',
      '..SKKKKKKS..',
      '..SGGGGGGS..',
      '..SGLGGGGS..',
      '..SGGGGGGS..',
      '..SGLGGGGS..',
      '..SGGGGGGS..',
      '..SGGGGGGS..',
      '..SSSSSSSS..',
      '............',
    ],
  },
  // Semente com um brotinho
  seed: {
    colors: { B: '#b07a44', D: '#7a4f28', L: '#d9a86c', G: '#4fbf6b' },
    rows: [
      '............',
      '......GG....',
      '.....GG.....',
      '.....G......',
      '....BBBB....',
      '...BLLBBB...',
      '..BLLBBBBD..',
      '..BLBBBBBD..',
      '..BBBBBBBD..',
      '...BBBBDD...',
      '....DDDD....',
      '............',
    ],
  },
  // Muda na terra
  plant: {
    colors: { G: '#4fbf6b', L: '#9be8a8', D: '#2e8b4a', B: '#8a5a2c' },
    rows: [
      '............',
      '..GG....GG..',
      '.GLLG..GLLG.',
      '.GLLLGGLLLG.',
      '..GGLGDLGG..',
      '....GGDG....',
      '.....DD.....',
      '.....DD.....',
      '.....DD.....',
      '..BBBBBBBB..',
      '.BBBBBBBBBB.',
      '............',
    ],
  },
  dumbbell: {
    colors: { S: '#c3c9c7', D: '#7d868c', R: '#f0483e', K: '#a82a2a' },
    rows: [
      '............',
      '............',
      '.RR......RR.',
      'RRRR....RRRR',
      'RRRRSSSSRRRR',
      'RRRRSSSSRRRR',
      'RKKRDDDDRKKR',
      'RKKR....RKKR',
      '.KK......KK.',
      '............',
      '............',
      '............',
    ],
  },
  // A base (habitat)
  home: {
    colors: { W: '#e9eef0', S: '#aeb8bd', D: '#6f7b82', B: '#65d3ed', O: '#e07a4a' },
    rows: [
      '............',
      '....WWWW....',
      '..WWWWWWWW..',
      '.WWSSSSSSWW.',
      '.WSSSSSSSSD.',
      'WWSBBSSBBSDD',
      'WSSBBSSBBSSD',
      'WSSSSSSSSSSD',
      'WSSSSOOSSSSD',
      'WSSSSOOSSSSD',
      'DDDDDDDDDDDD',
      '............',
    ],
  },
  shield: {
    colors: { P: '#b79cff', L: '#e1d6ff', D: '#7a5cd6', W: '#ffffff' },
    rows: [
      '............',
      '.PPPPPPPPPP.',
      '.PLLLLLLLLD.',
      '.PLWWLLLLLD.',
      '.PLWLLLLLLD.',
      '.PLLLLLLLLD.',
      '.PLLLLLLLLD.',
      '..PLLLLLLD..',
      '..PLLLLLLD..',
      '...PLLLLD...',
      '....PDDD....',
      '.....DD.....',
    ],
  },
  rover: {
    colors: { W: '#e9eef0', S: '#aeb8bd', K: '#2a323a', D: '#7d868c', O: '#e07a4a', B: '#65d3ed', Y: '#ffe45c' },
    rows: [
      '.........BB.',
      '.........BB.',
      '.........S..',
      '..YYYY...S..',
      '.WWWWWWWWWW.',
      '.WSSSSSSSSW.',
      '.WOOSSSSOOW.',
      '..SSSSSSSS..',
      '.KKK.KK.KKK.',
      '.KDK.KK.KDK.',
      '.KKK.KK.KKK.',
      '............',
    ],
  },
  rocket: {
    colors: { W: '#e9eef0', S: '#aeb8bd', R: '#f0483e', B: '#65d3ed', O: '#ffb02e', Y: '#ffe45c' },
    rows: [
      '.....WW.....',
      '....WWWW....',
      '....WWSS....',
      '...WWBBSS...',
      '...WWBBSS...',
      '...WWWSSS...',
      '...WWWSSS...',
      '..RWWWSSSR..',
      '.RRWWWSSSRR.',
      '.RR.OOOO.RR.',
      '.....YY.....',
      '............',
    ],
  },
  // Tempestade solar: o Sol soltando particulas
  storm: {
    colors: { Y: '#ffe45c', O: '#ffb02e', W: '#fff7c2', R: '#f0483e' },
    rows: [
      '....OOOO....',
      '..OOYYYYOO..',
      '.OYYYYYYYYO.',
      '.OYYWWYYYYO.',
      'OYYYWYYYYYYO',
      'OYYYYYYYYYYO',
      '.OYYYYYYYYO.',
      '..OOYYYYOO..',
      '..R.OOOO.R..',
      '.R...R....R.',
      '....R...R...',
      '...R.....R..',
    ],
  },
};

const cache = new Map<string, string>();

export function hasPixelSprite(name: string): boolean {
  return Object.hasOwn(PIXEL_SPRITES, name);
}

export function pixelSpriteSvg(name: string): string {
  let svg = cache.get(name);
  if (svg === undefined) {
    const { colors, rows } = PIXEL_SPRITES[name];
    const rects: string[] = [];
    rows.forEach((row, y) => {
      [...row].forEach((c, x) => {
        if (colors[c]) rects.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="${colors[c]}"/>`);
      });
    });
    svg = `<svg viewBox="0 0 ${SPRITE_SIZE} ${SPRITE_SIZE}" shape-rendering="crispEdges" aria-hidden="true">${rects.join('')}</svg>`;
    cache.set(name, svg);
  }
  return svg;
}
