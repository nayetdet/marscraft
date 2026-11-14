// Contas de sombreamento dos voxels, sem Three.js: a cor de cada vertice de face e
// tinta do bloco x oclusao. Tudo e calculado uma vez, quando o chunk e montado.
import { BLOCK_IDS } from '../config/blockTypes.js';
import { WORLD_CONFIG } from '../config/constants.js';

const NATURAL = new Set([BLOCK_IDS.REGOLITH, BLOCK_IDS.SANDSTONE, BLOCK_IDS.BASALT]);

// Inteiros -> [0, 1), sempre igual para a mesma entrada
function hash3(x, y, z) {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(z | 0, 2147483647);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

const smooth = (t) => t * t * (3 - 2 * t);

// Ruido suave em manchas de `cell` blocos, em [0, 1)
function patchNoise(x, z, cell) {
  const fx = x / cell;
  const fz = z / cell;
  const x0 = Math.floor(fx);
  const z0 = Math.floor(fz);
  const tx = smooth(fx - x0);
  const tz = smooth(fz - z0);
  const a = hash3(x0, 0, z0);
  const b = hash3(x0 + 1, 0, z0);
  const c = hash3(x0, 0, z0 + 1);
  const d = hash3(x0 + 1, 0, z0 + 1);
  return (a + (b - a) * tx) * (1 - tz) + (c + (d - c) * tx) * tz;
}

const BLOCK_VARIATION = 0.08; // +-4 % por bloco: quebra a repeticao da textura
const PATCH_VARIATION = 0.12; // +-6 % em manchas largas
const PATCH_CELL = 20;
const HEIGHT_LOW = WORLD_CONFIG.GROUND_LEVEL - 1; // fundo da cratera
const HEIGHT_HIGH = WORLD_CONFIG.GROUND_LEVEL + 11; // borda
const HEIGHT_DARK = -0.08;
const HEIGHT_LIGHT = 0.06;

// Fator de brilho do bloco: 1 para o que foi construido; perto de 1 para o chao natural
export function naturalTint(id, x, y, z) {
  if (!NATURAL.has(id)) return 1;
  const height = Math.max(0, Math.min(1, (y - HEIGHT_LOW) / (HEIGHT_HIGH - HEIGHT_LOW)));
  return 1
    + (hash3(x, y, z) - 0.5) * BLOCK_VARIATION
    + (patchNoise(x, z, PATCH_CELL) - 0.5) * PATCH_VARIATION
    + HEIGHT_DARK + (HEIGHT_LIGHT - HEIGHT_DARK) * height;
}

// Oclusao de ambiente classica de voxels: quanto do canto esta tampado por blocos vizinhos.
// 3 = canto aberto, 0 = canto fechado pelos dois lados.
export function vertexOcclusion(side1, side2, corner) {
  if (side1 && side2) return 0;
  return 3 - (side1 ? 1 : 0) - (side2 ? 1 : 0) - (corner ? 1 : 0);
}

// Brilho de cada nivel de oclusao
export const OCCLUSION_BRIGHTNESS = [0.56, 0.72, 0.87, 1];
