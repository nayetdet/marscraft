import { drawPixelGrid, type PixelPalette } from './pixelArt.ts';
import { makeCanvasTexture } from './textureGenerator.ts';

type CropTextureType = 'potato' | 'lettuce' | 'soy';

const CROP_SPRITES: Record<CropTextureType, { palette: PixelPalette; grid: readonly string[] }> = {
  potato: {
    palette: {
      k: '#3d2514',
      d: '#7d502d',
      p: '#a66e3d',
      l: '#c48b54',
      h: '#d4a16e',
      e: '#5c381c',
      g: '#356b2e',
      y: '#5ca149',
    },
    grid: [
      '................',
      '.......gg.......',
      '......gyyg......',
      '.....kkkkkk.....',
      '....kllllllk....',
      '...klhhllllpk...',
      '..klhhlllellpk..',
      '..kllllllplppk..',
      '.klllelpppppdpk.',
      '.kllppppppddppk.',
      '.kpppppddppdedk.',
      '..kpppddppdddk..',
      '...kkdddddddk...',
      '.....kkkkkkk....',
      '................',
      '................',
    ],
  },
  lettuce: {
    palette: {
      k: '#17331e',
      d: '#235931',
      g: '#387d41',
      l: '#56a34d',
      h: '#7cc267',
      w: '#a8d48c',
    },
    grid: [
      '................',
      '.....kk..kk.....',
      '....khhkkhhk....',
      '...khlglglhlk...',
      '..khlgggggglhk..',
      '.kdlgglhhlgdgdk.',
      '.kdgghhllhhggdk.',
      '.kdgghlwwlhggdk.',
      '.kddglhwwhlggdk.',
      '..kdgglwwlggdk..',
      '..kddgwwwwgddk..',
      '...kddgwwgddk...',
      '....kddwwddk....',
      '.....kkwwkk.....',
      '.......kk.......',
      '................',
    ],
  },
  soy: {
    palette: {
      k: '#1c3316',
      d: '#365e29',
      g: '#538738',
      l: '#72a647',
      b: '#9cc260',
      h: '#b8d47b',
    },
    grid: [
      '................',
      '.......kkk......',
      '......kdlk......',
      '.....kkddkk.....',
      '....kglkkgk.....',
      '...klbhkklbk....',
      '..kglbgkklbhk...',
      '..kdlbhk.kglbk..',
      '..kdlbgk.kdlbhk.',
      '...kdlbk.kdlbgk.',
      '...kdgdk..kdlbk.',
      '....kdk...kdgdk.',
      '.....k.....kdk..',
      '............k...',
      '................',
      '................',
    ],
  },
};

export function createCropTexture(type: CropTextureType) {
  const sprite = CROP_SPRITES[type];
  if (!sprite) throw new Error(`Unknown crop texture: ${type}`);
  return makeCanvasTexture((ctx) => {
    drawPixelGrid(ctx, sprite.grid, sprite.palette);
  });
}
