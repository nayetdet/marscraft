# Real Mars Terrain (Gale, HiRISE) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the procedural terrain height with the real elevation of a small crater inside Gale Crater, at 1 block ≈ 1 meter.

**Architecture:** A Node script downloads a 224 × 224 window of a NASA HiRISE digital terrain model using HTTP `Range` and writes `src/data/marsTerrain.json`. A small access module decodes it and exposes `terrainOffset(x, z)`. `terrainGenerator.js` uses that instead of the sine noise and the synthetic rim; the existing flattening pads stay.

**Tech Stack:** JavaScript ES modules, Vite 6, Vitest, Node 22 (global `fetch`, `atob`).

**Spec:** `docs/superpowers/specs/2026-11-14-real-terrain-gale-design.md`

## Global Constraints

- All balance numbers live in `src/config/constants.js`.
- UI text in English, for 7 to 12 year olds, no emoji, no NASA logo.
- Embedded data is labelled "Real data from DD/MM/YYYY", never "live".
- Game axes: east is `+x`, north is `-z`. World is 224 × 48 × 224, `GROUND_LEVEL` is 8.
- Product: `DTEEC_010573_1755_010639_1755_U01`; window center 4.474328°S, 137.403232°E; resolution 1.0118 m per pixel, so UI says "about 1 meter".
- Conventional Commits. Never push to `main`.
- Run commands from the worktree `C:/Users/deric/orca/workspaces/nasa-space-apps/terreno-real`.

## File Structure

| File | Responsibility |
|---|---|
| `scripts/fetch-mars-terrain.mjs` (new) | Download the window and write the JSON |
| `src/data/marsTerrain.json` (new, generated) | Heights and source metadata |
| `src/data/marsTerrain.js` (new) | Decode the JSON; `terrainOffset`, `MARS_TERRAIN`, `formatCoords` |
| `src/data/marsTerrain.test.js` (new) | Data shape, orientation, rim, range |
| `src/config/constants.js` (modify) | `TERRAIN_CONFIG` with the base pad geometry |
| `src/world/terrainGenerator.js` (modify) | Use real height; drop noise and synthetic rim |
| `src/world/terrainGenerator.test.js` (modify) | Real heights outside the pads; flat MAV pad and landing site |
| `index.html`, `src/ui/MenuScreens.js` (modify) | "Ground" row on the NASA Data screen |
| `docs/data/apis-nasa.md`, `docs/data/numeros-reais.md`, `docs/game/estado-atual-e-gaps.md`, `AGENTS.md` (modify) | Source, numbers, state, code map |

---

### Task 1: Fetch script and embedded data

**Files:**
- Create: `scripts/fetch-mars-terrain.mjs`
- Create (generated): `src/data/marsTerrain.json`

**Interfaces:**
- Produces: `src/data/marsTerrain.json` with keys `source`, `product`, `url`, `page`, `site`, `centerLat`, `centerLonE`, `metersPerPixel`, `size` (224), `order`, `fetched` (`YYYY-MM-DD`), `minElevationM`, `maxElevationM`, `stepM` (0.1), `heights` (base64 of 224 × 224 `Uint8`, row 0 = north, column 0 = west; elevation = `minElevationM + value * stepM`).

- [ ] **Step 1: Write the script**

```js
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
```

- [ ] **Step 2: Run it**

Run: `node scripts/fetch-mars-terrain.mjs`
Expected: `Recorte 224x224 em linha 6902, coluna 3319: -4448.12 a -4435.46 m.` (elevations may differ in the last digit). The row and column must be exactly 6902 and 3319.

- [ ] **Step 3: Check the file**

Run: `node -e "const t=JSON.parse(require('fs').readFileSync('src/data/marsTerrain.json','utf8'));console.log(t.size,t.metersPerPixel,t.fetched,Buffer.from(t.heights,'base64').length)"`
Expected: `224 1.0118 2026-11-14 50176`

- [ ] **Step 4: Commit**

```bash
git add scripts/fetch-mars-terrain.mjs src/data/marsTerrain.json
git commit -m "feat: embed real Gale Crater elevation from the HiRISE terrain model"
```

---

### Task 2: Access module

**Files:**
- Modify: `src/config/constants.js` (after `WORLD_CONFIG`)
- Create: `src/data/marsTerrain.js`
- Test: `src/data/marsTerrain.test.js`

**Interfaces:**
- Consumes: `src/data/marsTerrain.json` (Task 1).
- Produces:
  - `TERRAIN_CONFIG = { BASE_CENTER: { x: -4, z: 0 }, BASE_FLAT_RADIUS: 28, BASE_BLEND_RADIUS: 36 }` in `constants.js`.
  - `terrainOffset(x: number, z: number): number`: meters above the base level at world column (`x`, `z`); clamps outside the world.
  - `MARS_TERRAIN`: `{ source, product, page, site, centerLat, centerLonE, metersPerPixel, fetched }`.
  - `formatCoords(lat: number, lonE: number): string`, for example `'4.47 S, 137.40 E'`.

- [ ] **Step 1: Add the pad geometry to `src/config/constants.js`**, right after the `WORLD_CONFIG` block:

```js
// Disco nivelado sob a base (terrainGenerator.js). O nivel de referencia do terreno real
// (src/data/marsTerrain.js) e a media das alturas reais dentro do raio plano.
export const TERRAIN_CONFIG = {
  BASE_CENTER: { x: -4, z: 0 },
  BASE_FLAT_RADIUS: 28,
  BASE_BLEND_RADIUS: 36,
};
```

- [ ] **Step 2: Write the failing test** in `src/data/marsTerrain.test.js`:

```js
import { describe, it, expect } from 'vitest';
import terrain from './marsTerrain.json';
import { MARS_TERRAIN, formatCoords, terrainOffset } from './marsTerrain.js';
import { TERRAIN_CONFIG, WORLD_CONFIG } from '../config/constants.js';

const HALF = WORLD_CONFIG.SIZE_X / 2;
const { BASE_CENTER, BASE_FLAT_RADIUS } = TERRAIN_CONFIG;

describe('real Mars terrain (HiRISE)', () => {
  it('embeds one height per world column, with source and collection date', () => {
    expect(terrain.size).toBe(WORLD_CONFIG.SIZE_X);
    expect(terrain.size).toBe(WORLD_CONFIG.SIZE_Z);
    expect(atob(terrain.heights).length).toBe(terrain.size * terrain.size);
    expect(terrain.product).toMatch(/^DTEEC_/);
    expect(terrain.fetched).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(MARS_TERRAIN.product).toBe(terrain.product);
    expect(MARS_TERRAIN.fetched).toBe(terrain.fetched);
  });

  // Valores lidos direto do arquivo da NASA em 14/11/2026, com leste = +x e norte = -z.
  // Se a orientacao do recorte inverter, estes pontos deixam de bater.
  it('matches spot heights read from the NASA file', () => {
    for (const [x, z, meters] of [[64, 64, 5.03], [96, 8, 4.83], [-70, -60, 5.13], [100, -40, 7.02], [70, -70, 8.26]]) {
      expect(Math.abs(terrainOffset(x, z) - meters)).toBeLessThan(0.15);
    }
  });

  it('is level on average under the base, with little to cut or fill', () => {
    let sum = 0;
    let count = 0;
    let worst = 0;
    for (let x = -HALF; x < HALF; x += 1) {
      for (let z = -HALF; z < HALF; z += 1) {
        if (Math.hypot(x - BASE_CENTER.x, z - BASE_CENTER.z) >= BASE_FLAT_RADIUS) continue;
        const offset = terrainOffset(x, z);
        sum += offset;
        count += 1;
        worst = Math.max(worst, Math.abs(offset));
      }
    }
    expect(Math.abs(sum / count)).toBeLessThan(0.01);
    expect(worst).toBeLessThan(3);
  });

  it('has a crater rim at least 4 m above the base in 8 directions', () => {
    for (let dir = 0; dir < 8; dir += 1) {
      const angle = (dir * Math.PI) / 4;
      let highest = -Infinity;
      for (let d = 40; d < 110; d += 1) {
        highest = Math.max(highest, terrainOffset(Math.round(BASE_CENTER.x + Math.cos(angle) * d), Math.round(BASE_CENTER.z + Math.sin(angle) * d)));
      }
      expect(highest).toBeGreaterThan(4);
    }
  });

  it('keeps the whole world between -3 m and +14 m, and clamps outside it', () => {
    for (let x = -HALF; x < HALF; x += 1) {
      for (let z = -HALF; z < HALF; z += 1) {
        const offset = terrainOffset(x, z);
        expect(offset).toBeGreaterThan(-3);
        expect(offset).toBeLessThan(14);
      }
    }
    expect(terrainOffset(HALF + 50, 0)).toBe(terrainOffset(HALF - 1, 0));
  });

  it('formats coordinates for the UI', () => {
    expect(formatCoords(-4.474328, 137.403232)).toBe('4.47 S, 137.40 E');
    expect(formatCoords(18.4447, 77.4509)).toBe('18.44 N, 77.45 E');
  });
});
```

- [ ] **Step 3: Run the test to see it fail**

Run: `npx vitest run src/data/marsTerrain.test.js`
Expected: FAIL, cannot resolve `./marsTerrain.js`.

- [ ] **Step 4: Write `src/data/marsTerrain.js`**

```js
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
```

- [ ] **Step 5: Run the test to see it pass**

Run: `npx vitest run src/data/marsTerrain.test.js`
Expected: 6 tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/config/constants.js src/data/marsTerrain.js src/data/marsTerrain.test.js
git commit -m "feat: access module for the real terrain elevation"
```

---

### Task 3: Terrain generator uses the real elevation

**Files:**
- Modify: `src/world/terrainGenerator.js`
- Test: `src/world/terrainGenerator.test.js`

**Interfaces:**
- Consumes: `terrainOffset(x, z)` from `src/data/marsTerrain.js`; `TERRAIN_CONFIG` from `src/config/constants.js`.
- Produces: `generateMartianTerrain(world)` with the same signature.

- [ ] **Step 1: Write the failing tests.** In `src/world/terrainGenerator.test.js`, change the imports and add two tests inside the `describe` block:

```js
import { CUTSCENE_CONFIG, MAV_CONFIG, WORLD_CONFIG } from '../config/constants.js';
import { terrainOffset } from '../data/marsTerrain.js';
```

```js
  // y do bloco solido mais alto da coluna
  function surfaceY(world, x, z) {
    let y = world.sizeY - 1;
    while (y > 0 && world.getBlock(x, y, z) === BLOCK_IDS.AIR) y -= 1;
    return y;
  }

  it('follows the real elevation outside the levelled pads', () => {
    const world = createArrayWorld();
    generateMartianTerrain(world);

    // Pontos longe da base, do MAV, da ala norte, da estufa e da cratera de gelo
    for (const [x, z] of [[64, 64], [96, 8], [-70, -60], [100, -40]]) {
      expect(surfaceY(world, x, z)).toBe(WORLD_CONFIG.GROUND_LEVEL + Math.round(terrainOffset(x, z)));
    }
    // A borda real da cratera fica bem acima da base
    expect(surfaceY(world, 100, -40)).toBeGreaterThanOrEqual(WORLD_CONFIG.GROUND_LEVEL + 6);
  });

  it('keeps the MAV pad and the cutscene landing site at ground level', () => {
    const world = createArrayWorld();
    generateMartianTerrain(world);

    const pad = MAV_CONFIG.PAD_POSITION;
    const site = CUTSCENE_CONFIG.LANDING_SITE;
    expect(surfaceY(world, pad.x, pad.z)).toBe(WORLD_CONFIG.GROUND_LEVEL);
    expect(surfaceY(world, site.x, site.z)).toBe(WORLD_CONFIG.GROUND_LEVEL);
  });
```

- [ ] **Step 2: Run to see the first new test fail**

Run: `npx vitest run src/world/terrainGenerator.test.js`
Expected: `follows the real elevation outside the levelled pads` FAILS (the procedural terrain does not match the data).

- [ ] **Step 3: Change `src/world/terrainGenerator.js`.**

Replace the imports and delete `noise2D`:

```js
import { BLOCK_IDS } from '../config/blockTypes.js';
import { MAV_CONFIG, TERRAIN_CONFIG, WATER_SYSTEM_CONFIG, WORLD_CONFIG } from '../config/constants.js';
import { terrainOffset } from '../data/marsTerrain.js';
import { HABITAT_LAYOUT } from './habitatLayout.js';
```

Add a comment above `generateMartianTerrain`:

```js
// O relevo e real: elevacao HiRISE de uma cratera em Gale, 1 bloco ~ 1 m (src/data/marsTerrain.js).
// So sao alterados os trechos nivelados para as construcoes e a cratera de gelo, que e do jogo.
```

Inside the loop, replace the first line and the base disc block:

```js
      // + 0.5 para o Math.floor do fim arredondar a altura real para o bloco mais proximo
      let height = groundY + 0.5 + terrainOffset(x, z);
```

```js
      const baseDistance = Math.hypot(x - TERRAIN_CONFIG.BASE_CENTER.x, z - TERRAIN_CONFIG.BASE_CENTER.z);
      if (baseDistance < TERRAIN_CONFIG.BASE_BLEND_RADIUS) {
        const blendWidth = TERRAIN_CONFIG.BASE_BLEND_RADIUS - TERRAIN_CONFIG.BASE_FLAT_RADIUS;
        const blend = Math.max(0, Math.min(1, (baseDistance - TERRAIN_CONFIG.BASE_FLAT_RADIUS) / blendWidth));
        height = groundY * (1 - blend) + height * blend;
      }
```

Delete the synthetic rim block:

```js
      if (baseDistance > 40) {
        const rimProgress = Math.min(1.2, (baseDistance - 40) / 10);
        height += Math.pow(rimProgress, 1.5) * 5.8;
      }
```

Leave the ice crater, MAV pad, north pad, dome and block-filling code as they are.

- [ ] **Step 4: Run the terrain tests**

Run: `npx vitest run src/world/terrainGenerator.test.js`
Expected: 4 tests pass.

- [ ] **Step 5: Run the whole suite**

Run: `npm test`
Expected: all test files pass.

- [ ] **Step 6: Commit**

```bash
git add src/world/terrainGenerator.js src/world/terrainGenerator.test.js
git commit -m "feat: terrain follows the real elevation of a crater in Gale"
```

---

### Task 4: Attribution in the game and docs

**Files:**
- Modify: `index.html` (the `info-list` inside `#sources-screen`)
- Modify: `src/ui/MenuScreens.js`
- Modify: `docs/data/apis-nasa.md`, `docs/data/numeros-reais.md`, `docs/game/estado-atual-e-gaps.md`, `AGENTS.md`

**Interfaces:**
- Consumes: `MARS_TERRAIN`, `formatCoords` from `src/data/marsTerrain.js`; `formatDateDMY` from `src/mission/missionText.js`.

- [ ] **Step 1: Add the row to `index.html`**, right after the "Radiation" row:

```html
            <div class="info-row"><b>Ground</b><span>The shape of the land is real. It is a small crater inside Gale Crater on Mars (<span id="sources-terrain-coords"></span>), measured from orbit by HiRISE, a camera on NASA's Mars Reconnaissance Orbiter. One block is about 1 meter. Real data from <span id="sources-terrain-date"></span>. The flat ground under the base and the ice pit were shaped for the game.</span></div>
```

- [ ] **Step 2: Fill the two spans in `src/ui/MenuScreens.js`.** Add the imports at the top and two lines after the `sources-donki-date` line:

```js
import { MARS_TERRAIN, formatCoords } from '../data/marsTerrain.js';
import { formatDateDMY } from '../mission/missionText.js';
```

```js
    document.getElementById('sources-terrain-coords').textContent = formatCoords(MARS_TERRAIN.centerLat, MARS_TERRAIN.centerLonE);
    document.getElementById('sources-terrain-date').textContent = formatDateDMY(MARS_TERRAIN.fetched);
```

- [ ] **Step 3: Update the docs.**

`docs/data/apis-nasa.md`: in section 5 (Mars Trek), add under the tiles bullet that the elevation tiles (`Gale_DEM_SMG_1m`) are 8-bit PNG with steps of about 20 m, that the Jezero elevation models have no tiles and that the ArcGIS ImageServer did not answer on 2026-11-14. Add a new section "HiRISE DTM: elevação real a 1 m" with the product URL, the PDS3 label fields used (`RECORD_BYTES`, `^IMAGE`, `MAP_RESOLUTION`, `LINE_PROJECTION_OFFSET`, `SAMPLE_PROJECTION_OFFSET`, `CENTER_LATITUDE`, `CENTER_LONGITUDE`), the `Range` trick, the Jezero product (`DTEEC_045994_1985_046060_1985_U01`) as an untested-in-game alternative, and the credit line "NASA/JPL-Caltech/University of Arizona".

`docs/data/numeros-reais.md`: add a row to the table that holds the DONKI row: terrain window 224 × 224 m at 4.4743°S, 137.4032°E, 1.0118 m per pixel, about 12.7 m of relief, source `src/data/marsTerrain.json` generated by `node scripts/fetch-mars-terrain.mjs`.

`docs/game/estado-atual-e-gaps.md`: in the systems table, change the "Mundo voxel" row to say the relief is the real HiRISE elevation; fix the "Dados reais da NASA" row to ✅ listing DONKI, RadLab and the HiRISE terrain.

`AGENTS.md`: change the `terrainGenerator.js` line of the code map to `cratera real de Gale (elevação HiRISE em src/data/marsTerrain.json) + áreas niveladas da base`; add HiRISE to the source list of design principle 5.

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 5: Visual check in the browser**

Run `npx vite --port 5199` and open `http://localhost:5199/nasa-space-apps/?admin`. Check: the menu "NASA Data" screen shows the Ground row with `4.47 S, 137.40 E` and `14/11/2026`; walk from the base to the rim in every direction; the MAV, the ice crater, the rover drive and the arrival cutscene sit on the ground; nothing floats or is buried. Also check one landscape mobile viewport (844 × 390).

- [ ] **Step 6: Commit**

```bash
git add index.html src/ui/MenuScreens.js docs AGENTS.md
git commit -m "docs: credit the HiRISE terrain in the game and in the data docs"
```
