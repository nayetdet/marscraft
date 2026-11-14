# Visual Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the outdoor view readable and less flat: new ground palette, separated sky and ground, baked corner shadows, lighter hull texture and scattered rocks.

**Architecture:** One shared mechanism, per-vertex colors on the opaque block atlas, carries both the natural-block tint and the ambient occlusion. Pure shading math lives in `src/world/voxelShading.js`; `VoxelWorld._rebuildChunk` writes the colors. Sky, fog and lights are tuned in `src/sky/`. Rocks are one `InstancedMesh`.

**Tech Stack:** JavaScript ES modules, Three.js 0.181, Vite 6, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-14-visual-pass-design.md`

## Global Constraints

- Zero per-frame cost: no shadow maps, no allocation inside `update`.
- Colors are art, not data: nothing here is labelled as NASA data.
- Do not change the base geometry or the interior layout.
- Color values in this plan are starting points; each task ends with before/after screenshots and the values are tuned against them.
- Screenshots: `playwright-core` with system Chrome against the dev server on port 5310, using `window.__minemars` (see the memory note "validacao-visual-headless").
- Conventional Commits; branch `feat/visual-pass`.

---

### Task 1: Ground palette and natural tint

**Files:** create `src/world/voxelShading.js`, `src/world/voxelShading.test.js`; modify `src/world/VoxelWorld.js`, `src/graphics/blockMaterials.js`.

**Interfaces — produces:**
- `naturalTint(id: number, x: number, y: number, z: number): number`
- `FaceBuffer.addFace(x, y, z, face, rect, shades)` where `shades` is an array of 4 brightness factors (one per corner); the geometry gains a `color` attribute.
- Atlas material created with `vertexColors: true`.

- [ ] **Step 1: Failing test** (`src/world/voxelShading.test.js`):

```js
import { describe, it, expect } from 'vitest';
import { naturalTint } from './voxelShading.js';
import { BLOCK_IDS } from '../config/blockTypes.js';

describe('naturalTint', () => {
  it('leaves built blocks untouched', () => {
    expect(naturalTint(BLOCK_IDS.NASA_HULL, 3, 9, 4)).toBe(1);
    expect(naturalTint(BLOCK_IDS.HAB_LIGHT, -7, 12, 0)).toBe(1);
  });

  it('is deterministic and stays in a narrow range for ground blocks', () => {
    for (const id of [BLOCK_IDS.REGOLITH, BLOCK_IDS.SANDSTONE, BLOCK_IDS.BASALT]) {
      for (let i = 0; i < 400; i += 1) {
        const x = (i * 37) % 224 - 112;
        const z = (i * 91) % 224 - 112;
        const y = 6 + (i % 14);
        const tint = naturalTint(id, x, y, z);
        expect(tint).toBe(naturalTint(id, x, y, z));
        expect(tint).toBeGreaterThan(0.8);
        expect(tint).toBeLessThan(1.2);
      }
    }
  });

  it('gets lighter with height on average', () => {
    const mean = (y) => {
      let sum = 0;
      for (let i = 0; i < 500; i += 1) sum += naturalTint(BLOCK_IDS.REGOLITH, (i * 37) % 224 - 112, y, (i * 91) % 224 - 112);
      return sum / 500;
    };
    expect(mean(18)).toBeGreaterThan(mean(7) + 0.08);
  });
});
```

- [ ] **Step 2:** `npx vitest run src/world/voxelShading.test.js` → FAIL (module missing).

- [ ] **Step 3: Implement** `src/world/voxelShading.js`:

```js
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
```

- [ ] **Step 4:** tests pass.

- [ ] **Step 5: Wire the color attribute.** In `VoxelWorld.js`: `FaceBuffer` gets `this.colors = []`; `addFace(x, y, z, face, rect, shades)` pushes `shades[i]` three times per corner (r, g, b); `toGeometry` sets `color` as `Float32BufferAttribute(this.colors, 3)`. In `_rebuildChunk`, compute `const tint = naturalTint(id, wx, iy, wz)` once per block and pass `[tint, tint, tint, tint]` (a reused array). In `blockMaterials.js`, add `vertexColors: true` to the atlas `MeshLambertMaterial`. In `VoxelWorld.test.js`, add a test that the opaque chunk geometry has a `color` attribute with `count === position.count`.

- [ ] **Step 6: New ground textures** in `blockMaterials.js`: regolith `fillNoise(ctx, [186, 106, 66], 12, 101)` with 10 speckles in `#a85c38` / `#c98660`; sandstone `fillNoise(ctx, [204, 136, 90], 14, 303)` with the band alphas reduced to 0.14 and grains `#dba878` / `#a8683c`.

- [ ] **Step 7:** `npm test`; before/after screenshots (aerial, ground close, base front); tune; commit `feat: dustier ground palette with per-block and height tint`.

---

### Task 2: Sky, fog and light

**Files:** modify `src/sky/atmosphereShader.js`, `src/sky/MarsSkySystem.js`, `src/world/VoxelWorld.js`.

- [ ] **Step 1:** In the fragment shader set `dayZenith = vec3(0.70, 0.52, 0.36)`, `dayHorizon = vec3(0.93, 0.82, 0.68)` and the below-horizon day color to `vec3(0.60, 0.36, 0.24)`.
- [ ] **Step 2:** In `MarsSkySystem.js` set `FOG_DAY_COLOR` to `0xe6cba6`; ambient `0.72 → 0.5` (and the update formula `0.5 + day*0.35 → 0.36 + day*0.22`), hemisphere update `0.55 + day*0.55 → 0.5 + day*0.45`, sun `0.45 + day*0.95 → 0.5 + day*1.25`.
- [ ] **Step 3:** `horizonGround` color `0x8d4b31 → 0x9a5a3c` (match the new regolith under fog).
- [ ] **Step 4:** Screenshots: noon, sunset, night, interior of the habitat and of the dome. The interior must stay readable; tune light values if not. `npm test`. Commit `feat: pale dusty horizon and stronger sun for readable terrain`.

---

### Task 3: Baked ambient occlusion

**Files:** modify `src/world/voxelShading.js`, `src/world/voxelShading.test.js`, `src/world/VoxelWorld.js`, `src/world/VoxelWorld.test.js`.

**Interfaces — produces:** `vertexOcclusion(side1: boolean, side2: boolean, corner: boolean): 0|1|2|3`, `OCCLUSION_BRIGHTNESS: number[4]`.

- [ ] **Step 1: Failing tests:**

```js
import { OCCLUSION_BRIGHTNESS, vertexOcclusion } from './voxelShading.js';

describe('vertexOcclusion', () => {
  it('follows the classic voxel table', () => {
    expect(vertexOcclusion(false, false, false)).toBe(3);
    expect(vertexOcclusion(true, false, false)).toBe(2);
    expect(vertexOcclusion(false, false, true)).toBe(2);
    expect(vertexOcclusion(true, false, true)).toBe(1);
    expect(vertexOcclusion(true, true, false)).toBe(0);
    expect(vertexOcclusion(true, true, true)).toBe(0);
  });

  it('maps levels to increasing brightness ending at 1', () => {
    expect(OCCLUSION_BRIGHTNESS).toHaveLength(4);
    expect(OCCLUSION_BRIGHTNESS[3]).toBe(1);
    for (let i = 1; i < 4; i += 1) expect(OCCLUSION_BRIGHTNESS[i]).toBeGreaterThan(OCCLUSION_BRIGHTNESS[i - 1]);
  });
});
```

- [ ] **Step 2: Implement:**

```js
// Oclusao de ambiente classica de voxels: quanto do canto esta tampado por blocos vizinhos.
// 3 = canto aberto, 0 = canto fechado pelos dois lados.
export function vertexOcclusion(side1, side2, corner) {
  if (side1 && side2) return 0;
  return 3 - (side1 ? 1 : 0) - (side2 ? 1 : 0) - (corner ? 1 : 0);
}

export const OCCLUSION_BRIGHTNESS = [0.56, 0.72, 0.87, 1];
```

- [ ] **Step 3: Mesher.** Each `FACES` entry gains the two tangent axes implied by its corners. For corner `c` of a face with normal `n`, the three neighbors are in the layer `block + n`: `side1 = +/-u`, `side2 = +/-v`, `corner = +/-u +/-v`, where the sign is `+1` when the corner coordinate on that axis is 1 and `-1` when it is 0. A neighbor occludes when it is neither `AIR` nor `HAB_GLASS`. `addFace` receives the 4 shades (`tint × OCCLUSION_BRIGHTNESS[level]`) and, when `level[0] + level[2] < level[1] + level[3]`, emits indices `(base+1, base+2, base+3, base+1, base+3, base)` instead of the default diagonal. Glass faces get shades of 1.
- [ ] **Step 4:** `_markDirtyAround` also marks the diagonal chunks when the block sits on a chunk corner.
- [ ] **Step 5: Test** in `VoxelWorld.test.js`: build a tiny L-shaped arrangement with `setBlock(..., true)` and assert that the minimum color of the chunk geometry is below the color of an isolated block's vertices.
- [ ] **Step 6:** Measure `rebuildMeshes` time before and after (console timing in the browser run); screenshots; `npm test`; commit `feat: baked ambient occlusion on voxel faces`.

---

### Task 4: Hull and glass textures

**Files:** modify `src/graphics/blockMaterials.js`.

- [ ] **Step 1:** Hull: fill `#f1f0ec`; seams of 1 px only on the bottom and right edges in `#d6d4cd`; one faint highlight line on the top edge `#faf9f6`; no rivets.
- [ ] **Step 2:** Glass: fill `rgba(150, 205, 255, 0.30)`, frame `rgba(196, 214, 230, 0.9)`, material opacity `0.48 → 0.55`.
- [ ] **Step 3:** Screenshots of the base front, dome and interior; `npm test`; commit `feat: lighter hull panel seams and bluer glass`.

---

### Task 5: Scattered rocks

**Files:** create `src/world/surfaceRocks.js`; modify `src/world/terrainGenerator.js`, `src/world/terrainGenerator.test.js`, `src/world/VoxelWorld.js`.

**Interfaces — produces:** `isBuildZone(x: number, z: number): boolean` from `terrainGenerator.js`; `createSurfaceRocks(world): THREE.InstancedMesh` from `surfaceRocks.js`.

- [ ] **Step 1: Failing test** for `isBuildZone`: true at `(-4, 0)`, at the MAV pad, at the ice crater center, at `(-12, -22)` (north wing) and at `(20, 0)` (east wing); false at `(64, 64)`, `(-70, -60)` and `(100, -40)`.
- [ ] **Step 2: Implement** `isBuildZone` with the same constants the generator uses (base blend radius, MAV pad radius + 6, flat pads + blend, dome radius + 5, ice crater radius 12).
- [ ] **Step 3: `createSurfaceRocks(world)`:** seeded random (`createSeededRandom(4242)`); up to 900 tries; each picks integer `(x, z)`, skips build zones, finds the top solid block, skips unless it is regolith or sandstone; places a `DodecahedronGeometry(1, 0)` instance with non-uniform scale 0.15 to 0.45 m, random rotation, half sunk; material `MeshLambertMaterial({ color: 0x8a5a44, flatShading: true })`. Return the mesh; `VoxelWorld` adds it to the scene after `rebuildMeshes()`.
- [ ] **Step 4:** Screenshots (ground close, rim view, aerial); `npm test`; `npm run build`; commit `feat: scattered surface rocks outside the build zones`.
