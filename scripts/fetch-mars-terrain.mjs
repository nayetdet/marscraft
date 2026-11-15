// Baixa um recorte do modelo digital de terreno HiRISE (sonda MRO) e grava src/data/marsTerrain.json.
// Uso: node scripts/fetch-mars-terrain.mjs
// O arquivo inteiro tem 471 MB; o servidor aceita Range, entao so as linhas do recorte sao baixadas (~6 MB).
import { writeFile } from 'node:fs/promises';

const PRODUCT = 'DTEEC_010573_1755_010639_1755_U01';
const IMG_URL = `https://www.uahirise.org/PDS/DTM/PSP/ORB_010500_010599/PSP_010573_1755_PSP_010639_1755/${PRODUCT}.IMG`;
const PAGE_URL = 'https://www.uahirise.org/dtm/PSP_010573_1755';
// Centro do recorte: cratera de ~180 m em Aeolis Palus, no fundo da cratera Gale.
// A escolha esta em docs/superpowers/specs/2026-11-14-real-terrain-gale-design.md.
const CENTER = { lat: -4.474328, lonE: 137.403232 };
const SIZE = 224; // = WORLD_CONFIG.SIZE_X e SIZE_Z
const STEP_M = 0.1; // alturas gravadas em Uint8: cobre 25,5 m de relevo
const MISSING_BELOW = -1e30; // o MISSING_CONSTANT do PDS e um float muito negativo

async function fetchRange(start, end) {
  const response = await fetch(IMG_URL, { headers: { Range: `bytes=${start}-${end}` } });
  if (response.status !== 206) throw new Error(`HiRISE respondeu ${response.status} (esperado 206)`);
  return Buffer.from(await response.arrayBuffer());
}

// Rotulo PDS3: linhas "CHAVE = valor <UNIDADE>"; vale a primeira ocorrencia de cada chave
const label = new Map();
for (const line of (await fetchRange(0, 8191)).toString('latin1').split(/\r?\n/)) {
  const eq = line.indexOf('=');
  const key = line.slice(0, eq).trim();
  if (eq > 0 && !label.has(key)) label.set(key, line.slice(eq + 1).trim());
}
const num = (key) => {
  const value = parseFloat(label.get(key));
  if (Number.isNaN(value)) throw new Error(`Rotulo sem ${key}`);
  return value;
};

if (label.get('SAMPLE_TYPE') !== 'PC_REAL' || num('SAMPLE_BITS') !== 32) throw new Error('Amostra nao e float de 32 bits');
if (!String(label.get('MAP_PROJECTION_TYPE')).includes('EQUIRECTANGULAR')) throw new Error('Projecao inesperada');

const recordBytes = num('RECORD_BYTES');
const headerBytes = (num('^IMAGE') - 1) * recordBytes;
const pixelsPerDegree = num('MAP_RESOLUTION');
const cosCenterLat = Math.cos((num('CENTER_LATITUDE') * Math.PI) / 180);
// Equirretangular do rotulo: a linha cresce para o sul e a coluna para o leste
const centerRow = Math.round(num('LINE_PROJECTION_OFFSET') - CENTER.lat * pixelsPerDegree);
const centerCol = Math.round(num('SAMPLE_PROJECTION_OFFSET') + (CENTER.lonE - num('CENTER_LONGITUDE')) * pixelsPerDegree * cosCenterLat);
const row0 = centerRow - SIZE / 2;
const col0 = centerCol - SIZE / 2;
if (row0 < 0 || col0 < 0 || row0 + SIZE > num('LINES') || col0 + SIZE > num('LINE_SAMPLES')) throw new Error('Recorte fora do produto');

const data = await fetchRange(headerBytes + row0 * recordBytes, headerBytes + (row0 + SIZE) * recordBytes - 1);
const elevation = new Float32Array(SIZE * SIZE);
let min = Infinity;
let max = -Infinity;
for (let row = 0; row < SIZE; row += 1) {
  for (let col = 0; col < SIZE; col += 1) {
    const value = data.readFloatLE(row * recordBytes + (col0 + col) * 4);
    if (value < MISSING_BELOW) throw new Error(`Pixel sem dado na linha ${row}, coluna ${col}`);
    elevation[row * SIZE + col] = value;
    if (value < min) min = value;
    if (value > max) max = value;
  }
}
if (max - min > 255 * STEP_M) throw new Error(`Relevo de ${(max - min).toFixed(1)} m nao cabe em Uint8 com passo de ${STEP_M} m`);

const heights = Buffer.alloc(SIZE * SIZE);
for (let i = 0; i < elevation.length; i += 1) heights[i] = Math.round((elevation[i] - min) / STEP_M);

const round = (value, digits) => Number(value.toFixed(digits));
const output = {
  source: 'NASA Mars Reconnaissance Orbiter, HiRISE Digital Terrain Model (NASA/JPL-Caltech/University of Arizona)',
  product: PRODUCT,
  url: IMG_URL,
  page: PAGE_URL,
  site: 'Small crater in Aeolis Palus, on the floor of Gale Crater',
  centerLat: CENTER.lat,
  centerLonE: CENTER.lonE,
  metersPerPixel: round(num('MAP_SCALE'), 4),
  size: SIZE,
  order: 'rows north to south, columns west to east',
  fetched: new Date().toISOString().slice(0, 10),
  minElevationM: round(min, 2),
  maxElevationM: round(max, 2),
  stepM: STEP_M,
  heights: heights.toString('base64'),
};

await writeFile(new URL('../src/data/marsTerrain.json', import.meta.url), `${JSON.stringify(output, null, 2)}\n`);
console.log(`Recorte ${SIZE}x${SIZE} em linha ${row0}, coluna ${col0}: ${output.minElevationM} a ${output.maxElevationM} m.`);
