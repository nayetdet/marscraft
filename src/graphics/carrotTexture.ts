// @ts-nocheck
import { makeCanvasTexture } from './textureGenerator.ts';

// A small transparent pixel-art sprite, shared by the inventory, hand and drops.
export function createCarrotTexture() {
  return makeCanvasTexture((ctx) => {
    ctx.fillStyle = '#245b2c';
    ctx.fillRect(7, 1, 2, 5); ctx.fillRect(3, 2, 3, 2); ctx.fillRect(10, 1, 3, 2);
    ctx.fillStyle = '#4b9b3e';
    ctx.fillRect(5, 3, 3, 3); ctx.fillRect(9, 3, 3, 2); ctx.fillRect(8, 0, 2, 3);
    ctx.fillStyle = '#a94416';
    ctx.fillRect(5, 5, 7, 2); ctx.fillRect(4, 7, 8, 3); ctx.fillRect(5, 10, 6, 2);
    ctx.fillRect(6, 12, 4, 2); ctx.fillRect(7, 14, 2, 1);
    ctx.fillStyle = '#ed7b20';
    ctx.fillRect(5, 6, 6, 4); ctx.fillRect(6, 10, 4, 3); ctx.fillRect(7, 13, 2, 1);
    ctx.fillStyle = '#ffad42';
    ctx.fillRect(6, 6, 2, 2); ctx.fillRect(6, 9, 2, 1); ctx.fillRect(7, 11, 2, 1);
    ctx.fillStyle = '#c65a19';
    ctx.fillRect(9, 8, 2, 1); ctx.fillRect(8, 12, 2, 1);
  });
}
