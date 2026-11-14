import { makeCanvasTexture } from './textureGenerator.js';

export function createCropTexture(type) {
  return makeCanvasTexture(ctx => {
    const rect = (c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
    if (type === 'potato') {
      rect('#795135', 3, 5, 10, 8); rect('#b78049', 2, 6, 12, 6);
      rect('#dca568', 4, 4, 7, 8); rect('#e9b97b', 5, 5, 4, 2);
      for (const [x,y] of [[4,8],[9,10],[10,6]]) rect('#715039', x,y,2,1);
    } else if (type === 'lettuce') {
      rect('#286139', 2, 6, 12, 7); rect('#4b9b42', 3, 3, 10, 10);
      rect('#8ac956', 5, 2, 6, 11); rect('#69b347', 2, 5, 4, 5);
      rect('#abd879', 7, 4, 2, 6); rect('#397c38', 4, 10, 2, 3); rect('#397c38', 10, 7, 2, 5);
    } else if (type === 'soy') {
      rect('#477534', 7, 1, 2, 13);
      for (const [x,y] of [[3,4],[8,2],[8,8]]) {
        rect('#477534', x,y,5,7); rect('#709e3d', x+1,y,3,6);
        rect('#c5d77c', x+1,y+1,2,2); rect('#c5d77c', x+1,y+4,2,2);
      }
    } else throw new Error(`Unknown crop texture: ${type}`);
  });
}
