// @ts-nocheck
import { createCropTexture } from './cropTextures.ts';
import { renderBlockIsometricPreview } from './blockPreview.ts';
import * as THREE from 'three';
import { BLOCK_IDS, CROP_ITEM_IDS } from '../config/blockTypes.ts';
import { SAMPLE_TYPES } from '../data/sampleTypes.ts';
import { createSeededRandom, fillNoise, makeCanvasTexture } from './textureGenerator.ts';

const TILE = 16;

export function createBlockMaterials() {
  const materials = {};
  const previews = {};

  const atlasEntries = [];

  // Usa MeshLambertMaterial para visual 100% fosco (matte), claro e muito mais otimizado
  const register = (id, drawFn, matOptions = {}) => {
    const { texture } = makeCanvasTexture(drawFn);
    materials[id] = new THREE.MeshLambertMaterial({
      map: texture,
      ...matOptions,
    });
    previews[id] = renderBlockIsometricPreview(drawFn, {
      transparent: Boolean(matOptions.transparent),
      emissive: Boolean(matOptions.emissive),
    });
    atlasEntries.push({ id, drawFn, matOptions });
  };

  // 1. Areia Marciana (ferrugem empoeirado, grao de baixo contraste). A variacao de bloco para
  // bloco vem da cor por vertice (voxelShading.naturalTint), nao da textura.
  register(BLOCK_IDS.REGOLITH, (ctx) => {
    fillNoise(ctx, [182, 112, 74], 12, 101);
    const rand = createSeededRandom(102);
    for (let i = 0; i < 10; i++) {
      ctx.fillStyle = rand() > 0.5 ? '#a26440' : '#c68e68';
      ctx.fillRect(Math.floor(rand() * 16), Math.floor(rand() * 16), 1, 1);
    }
  });

  // 2. Rocha de Cratera (Cinza-terracota fosco mais claro)
  register(BLOCK_IDS.BASALT, (ctx) => {
    fillNoise(ctx, [128, 108, 94], 22, 202);
    ctx.fillStyle = '#6e5c4f';
    for (let y = 2; y < 16; y += 5) {
      ctx.fillRect(1, y, 6, 1);
      ctx.fillRect(9, y + 2, 5, 1);
    }
  });

  // Dark volcanic stone used by the larger block outcrops outside the habitat.
  register(BLOCK_IDS.DARK_BASALT, (ctx) => {
    fillNoise(ctx, [69, 75, 82], 20, 220);
    ctx.fillStyle = '#3f454c';
    for (let y = 2; y < 16; y += 5) {
      ctx.fillRect(1, y, 5, 1);
      ctx.fillRect(9, y + 2, 6, 1);
    }
    ctx.fillStyle = '#85878a';
    ctx.fillRect(3, 5, 1, 1);
    ctx.fillRect(12, 12, 1, 1);
    ctx.fillRect(7, 14, 1, 1);
  });

  // 3. Arenito das encostas (um pouco mais claro e amarelado que a areia, com faixas suaves)
  register(BLOCK_IDS.SANDSTONE, (ctx) => {
    fillNoise(ctx, [196, 130, 90], 14, 303);

    const rand = createSeededRandom(304);
    // Faixas sedimentares irregulares e sutis (quebradas para nao parecer madeira)
    const bandRows = [3, 4, 10, 11];
    for (const y of bandRows) {
      for (let x = 0; x < 16; x++) {
        if (rand() > 0.28) {
          ctx.fillStyle = y < 8 ? 'rgba(236, 190, 142, 0.16)' : 'rgba(150, 84, 44, 0.16)';
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }

    // Graos minerais e pequenas fissuras de arenito
    for (let i = 0; i < 12; i++) {
      const x = Math.floor(rand() * 16);
      const y = Math.floor(rand() * 16);
      ctx.fillStyle = rand() > 0.5 ? '#dba878' : '#a8683c';
      ctx.fillRect(x, y, 1, 1);
    }

    // Pequenos blocos de rocha compactada
    ctx.fillStyle = 'rgba(130, 72, 36, 0.16)';
    ctx.fillRect(2, 6, 2, 2);
    ctx.fillRect(10, 2, 2, 1);
    ctx.fillRect(12, 13, 2, 2);
    ctx.fillRect(5, 13, 1, 2);
  });

  // 4. Gelo de Agua Marciano (Azul claro brilhante)
  register(BLOCK_IDS.MARS_ICE, (ctx) => {
    fillNoise(ctx, [205, 240, 255], 18, 404);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(2, 2, 4, 1);
    ctx.fillRect(10, 8, 4, 1);
    ctx.fillRect(5, 12, 5, 1);
  });

  // 5. Casco Branco da Base NASA: painel branco levemente frio (compensa a luz alaranjada de Marte). A emenda fica so em duas
  // bordas (embaixo e a direita), entao a parede vira uma grade fina em vez de azulejo.
  register(BLOCK_IDS.NASA_HULL, (ctx) => {
    ctx.fillStyle = '#f5f8fc';
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 15, 1);
    ctx.fillStyle = '#d2dae4';
    ctx.fillRect(0, 15, 16, 1);
    ctx.fillRect(15, 0, 1, 16);
  });

  // 6. Bloco Termico Dourado / Detalhe NASA
  register(BLOCK_IDS.GOLD_FOIL, (ctx) => {
    fillNoise(ctx, [245, 196, 62], 26, 606);
    ctx.strokeStyle = '#d97706';
    ctx.strokeRect(0.5, 0.5, 15, 15);
  });

  // 7. Vidro da Redoma de Estufa e Janelas (Cristalino e leve)
  register(
    BLOCK_IDS.HAB_GLASS,
    (ctx) => {
      ctx.fillStyle = 'rgba(150, 205, 255, 0.30)';
      ctx.fillRect(0, 0, 16, 16);
      // Moldura cinza-azulada da redoma e das janelas
      ctx.fillStyle = 'rgba(196, 214, 230, 0.9)';
      ctx.fillRect(0, 0, 16, 1);
      ctx.fillRect(0, 15, 16, 1);
      ctx.fillRect(0, 0, 1, 16);
      ctx.fillRect(15, 0, 1, 16);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.fillRect(3, 3, 2, 1);
      ctx.fillRect(4, 4, 2, 1);
    },
    { transparent: true, opacity: 0.55 }
  );

  // 8. Painel Solar Fotovoltaico
  register(BLOCK_IDS.SOLAR_PANEL, (ctx) => {
    ctx.fillStyle = '#aab7c4';
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = '#263747';
    ctx.fillRect(1, 1, 14, 14);
    for (let y = 2; y < 14; y += 4) {
      for (let x = 2; x < 14; x += 4) {
        ctx.fillStyle = (x + y) % 8 === 0 ? '#18304a' : '#203c56';
        ctx.fillRect(x, y, 3, 3);
        ctx.fillStyle = '#688093';
        ctx.fillRect(x + 1, y, 1, 3);
      }
    }
  });

  // 9. Luminaria LED Branca de Habitat
  register(
    BLOCK_IDS.HAB_LIGHT,
    (ctx) => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 16, 16);
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(0, 0, 16, 2);
      ctx.fillRect(0, 14, 16, 2);
      ctx.fillRect(0, 0, 2, 16);
      ctx.fillRect(14, 0, 2, 16);
    },
    { emissive: new THREE.Color('#ffffff'), emissiveIntensity: 0.65 }
  );

  // 10. Estrutura Cinza Claro / Piso Técnico NASA
  register(BLOCK_IDS.THRUSTER_METAL, (ctx) => {
    fillNoise(ctx, [148, 163, 184], 14, 707);
    ctx.strokeStyle = '#94a3b8';
    ctx.strokeRect(0.5, 0.5, 15, 15);
  });

  // 11. Console / Base de Equipamento
  register(BLOCK_IDS.CONSOLE_SCREEN, (ctx) => {
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(2, 2, 12, 8);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(3, 4, 8, 2);
  });

  // 12. Canteiro de Terra Fértil / Batata de Marte (Estufa)
  register(BLOCK_IDS.HYDRO_PLANT, (ctx) => {
    fillNoise(ctx, [95, 68, 42], 18, 808);
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(3, 3, 4, 4);
    ctx.fillRect(9, 8, 4, 4);
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(4, 4, 2, 2);
    ctx.fillRect(10, 9, 2, 2);
  });

  // 13. Farol Laranja
  register(
    BLOCK_IDS.RED_BEACON,
    (ctx) => {
      ctx.fillStyle = '#fb923c';
      ctx.fillRect(0, 0, 16, 16);
      ctx.fillStyle = '#fff7ed';
      ctx.fillRect(4, 4, 8, 8);
    },
    { emissive: new THREE.Color('#fb923c'), emissiveIntensity: 0.8 }
  );

  // Food sprites are not voxel blocks and must not enter the terrain atlas.
  for (const [type, id] of Object.entries(CROP_ITEM_IDS)) {
    const { texture, dataUrl } = createCropTexture(type);
    materials[id] = new THREE.MeshLambertMaterial({ map: texture, transparent: true, alphaTest: .1 });
    previews[id] = dataUrl;
  }
  // Amostras do mapa (issue #270): so itens de mao, uma cor por tipo; tambem ficam fora do atlas.
  for (const sample of SAMPLE_TYPES) {
    materials[sample.itemId] = new THREE.MeshLambertMaterial({ color: sample.color, emissive: sample.glow, emissiveIntensity: 0.12 });
  }
  const atlas = createBlockAtlas(atlasEntries);

  return { materials, previews, atlas };
}

// Junta as texturas dos blocos opacos num atlas para que cada chunk do mundo
// seja desenhado com um unico material (um draw call por chunk, em vez de um por tipo).
function createBlockAtlas(entries) {
  const opaque = entries.filter((e) => !e.matOptions.transparent);
  const cols = Math.ceil(Math.sqrt(opaque.length));
  const rows = Math.ceil(opaque.length / cols);
  const atlasW = cols * TILE;
  const atlasH = rows * TILE;

  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = atlasW;
  colorCanvas.height = atlasH;
  const colorCtx = colorCanvas.getContext('2d');

  // Mapa emissivo em espaco linear: preto = sem brilho, cor = emissive * intensidade
  const emissiveCanvas = document.createElement('canvas');
  emissiveCanvas.width = atlasW;
  emissiveCanvas.height = atlasH;
  const emissiveCtx = emissiveCanvas.getContext('2d');
  emissiveCtx.fillStyle = '#000000';
  emissiveCtx.fillRect(0, 0, atlasW, atlasH);

  // Pequena margem para o filtro Nearest nunca amostrar o tile vizinho
  const eps = 0.01 / TILE;
  const uvRects = {};

  opaque.forEach(({ id, drawFn, matOptions }, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const px = col * TILE;
    const py = row * TILE;

    colorCtx.save();
    colorCtx.translate(px, py);
    colorCtx.beginPath();
    colorCtx.rect(0, 0, TILE, TILE);
    colorCtx.clip();
    drawFn(colorCtx);
    colorCtx.restore();

    if (matOptions.emissive) {
      const e = matOptions.emissive.clone().multiplyScalar(matOptions.emissiveIntensity ?? 1);
      const to8 = (v) => Math.round(Math.min(1, Math.max(0, v)) * 255);
      emissiveCtx.fillStyle = `rgb(${to8(e.r)},${to8(e.g)},${to8(e.b)})`;
      emissiveCtx.fillRect(px, py, TILE, TILE);
    }

    // CanvasTexture usa flipY: a linha 0 do canvas fica em v = 1
    uvRects[id] = {
      u0: col / cols + eps,
      u1: (col + 1) / cols - eps,
      v0: 1 - (row + 1) / rows + eps,
      v1: 1 - row / rows - eps,
    };
  });

  const map = new THREE.CanvasTexture(colorCanvas);
  map.magFilter = THREE.NearestFilter;
  map.minFilter = THREE.NearestFilter;
  map.generateMipmaps = false;
  map.colorSpace = THREE.SRGBColorSpace;

  const emissiveMap = new THREE.CanvasTexture(emissiveCanvas);
  emissiveMap.magFilter = THREE.NearestFilter;
  emissiveMap.minFilter = THREE.NearestFilter;
  emissiveMap.generateMipmaps = false;
  emissiveMap.colorSpace = THREE.NoColorSpace;

  // vertexColors: cada vertice carrega tinta do bloco x sombra de canto (VoxelWorld._shadeFace)
  const material = new THREE.MeshLambertMaterial({
    map,
    emissive: new THREE.Color(0xffffff),
    emissiveMap,
    vertexColors: true,
  });

  return { material, uvRects };
}
