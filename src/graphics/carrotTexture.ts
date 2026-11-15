import { drawPixelGrid, type PixelPalette } from './pixelArt.ts';
import { makeCanvasTexture } from './textureGenerator.ts';

const CARROT_PALETTE: PixelPalette = {
  k: '#3e1e0f',
  d: '#a6471b',
  o: '#cf6323',
  l: '#e38039',
  h: '#eba159',
  g: '#1b3d20',
  m: '#2f7037',
  b: '#4a9948',
  y: '#6eb85f',
};

const CARROT_GRID: readonly string[] = [
  '...........gg...',
  '..........gbygg.',
  '........ggmbbbyg',
  '.......gybbmmmbg',
  '........gmbbmmg.',
  '.......kkkkmgk..',
  '......klhlomok..',
  '.....klhloook...',
  '.....klooodok...',
  '....klooodook...',
  '....kooodddk....',
  '...koodddkk.....',
  '..kodddkk.......',
  '..kodkk.........',
  '.kddk...........',
  '.kkk............',
];

/** Minimalist 16x16 pixel-art carrot sprite shared by inventory, hand, and world drops. */
export function createCarrotTexture() {
  return makeCanvasTexture((ctx) => {
    drawPixelGrid(ctx, CARROT_GRID, CARROT_PALETTE);
  });
}
