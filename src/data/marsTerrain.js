// Elevacao real do terreno: recorte de um modelo digital de terreno HiRISE (sonda MRO da NASA).
// O JSON e gerado por scripts/fetch-mars-terrain.mjs. No recorte, a linha 0 e o norte e a
// coluna 0 e o oeste; no jogo, leste e +x e norte e -z.
import terrain from './marsTerrain.json';
import { TERRAIN_CONFIG } from '../config/constants.js';

const SIZE = terrain.size;
const HALF = SIZE / 2;
const heights = Uint8Array.from(atob(terrain.heights), (char) => char.charCodeAt(0));

const clampIndex = (value) => Math.min(SIZE - 1, Math.max(0, Math.floor(value) + HALF));

// Metros acima do ponto mais baixo do recorte
function rawHeight(x, z) {
  return heights[clampIndex(z) * SIZE + clampIndex(x)] * terrain.stepM;
}

// Nivel da base: media do chao real dentro do disco que o gerador aplaina
function meanHeightUnderBase() {
  const { BASE_CENTER, BASE_FLAT_RADIUS } = TERRAIN_CONFIG;
  let sum = 0;
  let count = 0;
  for (let x = Math.floor(BASE_CENTER.x - BASE_FLAT_RADIUS); x <= BASE_CENTER.x + BASE_FLAT_RADIUS; x += 1) {
    for (let z = Math.floor(BASE_CENTER.z - BASE_FLAT_RADIUS); z <= BASE_CENTER.z + BASE_FLAT_RADIUS; z += 1) {
      if (Math.hypot(x - BASE_CENTER.x, z - BASE_CENTER.z) >= BASE_FLAT_RADIUS) continue;
      sum += rawHeight(x, z);
      count += 1;
    }
  }
  return sum / count;
}

const REFERENCE = meanHeightUnderBase();

// Altura real do terreno na coluna (x, z) do mundo, em metros acima do nivel da base
export function terrainOffset(x, z) {
  return rawHeight(x, z) - REFERENCE;
}

// "4.47 S, 137.40 E"
export function formatCoords(lat, lonE) {
  return `${Math.abs(lat).toFixed(2)} ${lat < 0 ? 'S' : 'N'}, ${lonE.toFixed(2)} E`;
}

export const MARS_TERRAIN = {
  source: terrain.source,
  product: terrain.product,
  page: terrain.page,
  site: terrain.site,
  centerLat: terrain.centerLat,
  centerLonE: terrain.centerLonE,
  metersPerPixel: terrain.metersPerPixel,
  fetched: terrain.fetched,
};
