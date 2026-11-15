const TILE = 16;
const SIZE = 32;

export interface BlockPreviewOptions {
  transparent?: boolean;
  emissive?: boolean;
}

/**
 * Projects a 16x16 block texture canvas onto a crisp, matte 32x32 pixel-art
 * isometric cube with clean directional face shading and a soft dark outline.
 */
export function renderBlockIsometricPreview(
  drawFn: (ctx: CanvasRenderingContext2D) => void,
  options: BlockPreviewOptions = {},
): string {
  const tileCanvas = document.createElement('canvas');
  tileCanvas.width = TILE;
  tileCanvas.height = TILE;
  const tileCtx = tileCanvas.getContext('2d');
  if (!tileCtx) return '';
  drawFn(tileCtx);
  const src = tileCtx.getImageData(0, 0, TILE, TILE).data;

  const outCanvas = document.createElement('canvas');
  outCanvas.width = SIZE;
  outCanvas.height = SIZE;
  const outCtx = outCanvas.getContext('2d');
  if (!outCtx) return '';

  const img = outCtx.createImageData(SIZE, SIZE);
  const dst = img.data;
  const filled = new Uint8Array(SIZE * SIZE);

  const topShade = options.emissive ? 0.98 : 0.96;
  const leftShade = options.emissive ? 0.86 : 0.80;
  const rightShade = options.emissive ? 0.72 : 0.64;

  for (let py = 0; py < SIZE; py++) {
    for (let px = 0; px < SIZE; px++) {
      let u = -1;
      let v = -1;
      let shade = 1;
      let face: 'top' | 'left' | 'right' | null = null;

      // Top face (diamond with top vertex at (16, 2), halfW = 14, halfH = 7)
      const rxTop = px + 0.5 - 16;
      const ryTop = py + 0.5 - 2;
      const uTop = (rxTop / 14 + ryTop / 7) * 0.5;
      const vTop = (ryTop / 7 - rxTop / 14) * 0.5;
      if (uTop >= 0 && uTop < 1 && vTop >= 0 && vTop < 1) {
        u = uTop;
        v = vTop;
        shade = topShade;
        face = 'top';
      } else {
        // Left face (parallelogram from (2, 9) to (16, 16), height 14)
        const rxLeft = px + 0.5 - 2;
        const ryLeft = py + 0.5 - 9;
        const uLeft = rxLeft / 14;
        const vLeft = (ryLeft - rxLeft * 0.5) / 14;
        if (uLeft >= 0 && uLeft < 1 && vLeft >= 0 && vLeft < 1) {
          u = uLeft;
          v = vLeft;
          shade = leftShade;
          face = 'left';
        } else {
          // Right face (parallelogram from (16, 16) to (30, 9), height 14)
          const rxRight = px + 0.5 - 16;
          const ryRight = py + 0.5 - 16;
          const uRight = rxRight / 14;
          const vRight = (ryRight + rxRight * 0.5) / 14;
          if (uRight >= 0 && uRight < 1 && vRight >= 0 && vRight < 1) {
            u = uRight;
            v = vRight;
            shade = rightShade;
            face = 'right';
          }
        }
      }

      if (!face) continue;

      const tx = Math.min(TILE - 1, Math.max(0, Math.floor(u * TILE)));
      const ty = Math.min(TILE - 1, Math.max(0, Math.floor(v * TILE)));
      const si = (ty * TILE + tx) * 4;
      const di = (py * SIZE + px) * 4;

      let r = src[si];
      let g = src[si + 1];
      let b = src[si + 2];
      let a = src[si + 3];

      if (options.transparent && a < 220) {
        const bgR = face === 'top' ? 46 : face === 'left' ? 32 : 22;
        const bgG = face === 'top' ? 92 : face === 'left' ? 70 : 52;
        const bgB = face === 'top' ? 126 : face === 'left' ? 98 : 76;
        const alpha = a / 255;
        r = Math.round(r * alpha + bgR * (1 - alpha));
        g = Math.round(g * alpha + bgG * (1 - alpha));
        b = Math.round(b * alpha + bgB * (1 - alpha));
        a = 228;
      }

      dst[di] = Math.min(255, Math.round(r * shade));
      dst[di + 1] = Math.min(255, Math.round(g * shade));
      dst[di + 2] = Math.min(255, Math.round(b * shade));
      dst[di + 3] = a;
      if (a > 20) filled[py * SIZE + px] = 1;
    }
  }

  // Soft 1px outline around the cube silhouette
  for (let py = 0; py < SIZE; py++) {
    for (let px = 0; px < SIZE; px++) {
      const idx = py * SIZE + px;
      if (filled[idx]) continue;
      const hasNeighbor =
        (px > 0 && filled[idx - 1]) ||
        (px < SIZE - 1 && filled[idx + 1]) ||
        (py > 0 && filled[idx - SIZE]) ||
        (py < SIZE - 1 && filled[idx + SIZE]);
      if (hasNeighbor) {
        const di = idx * 4;
        dst[di] = 20;
        dst[di + 1] = 24;
        dst[di + 2] = 30;
        dst[di + 3] = 165;
      }
    }
  }

  outCtx.putImageData(img, 0, 0);
  return outCanvas.toDataURL();
}
