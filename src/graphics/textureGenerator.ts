// @ts-nocheck
import * as THREE from 'three';

export function createSeededRandom(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function makeCanvasTexture(drawFn, width = 16, height = 16) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  drawFn(ctx);

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return { texture, dataUrl: canvas.toDataURL() };
}

export function fillNoise(ctx, baseRgb, variance, seed) {
  const rand = createSeededRandom(seed);
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const delta = (rand() - 0.5) * variance;
      const r = Math.max(0, Math.min(255, Math.round(baseRgb[0] + delta)));
      const g = Math.max(0, Math.min(255, Math.round(baseRgb[1] + delta * 0.85)));
      const b = Math.max(0, Math.min(255, Math.round(baseRgb[2] + delta * 0.7)));
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }
}
