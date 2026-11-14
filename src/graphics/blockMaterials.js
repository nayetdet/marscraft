import * as THREE from 'three';
import { BLOCK_IDS } from '../config/blockTypes.js';
import { createSeededRandom, fillNoise, makeCanvasTexture } from './textureGenerator.js';

export function createBlockMaterials() {
  const materials = {};
  const previews = {};

  // Usa MeshLambertMaterial para visual 100% fosco (matte), claro e muito mais otimizado
  const register = (id, drawFn, matOptions = {}) => {
    const { texture, dataUrl } = makeCanvasTexture(drawFn);
    materials[id] = new THREE.MeshLambertMaterial({
      map: texture,
      ...matOptions,
    });
    previews[id] = dataUrl;
  };

  // 1. Areia Marciana (Alaranjado vivo, claro e fosco)
  register(BLOCK_IDS.REGOLITH, (ctx) => {
    fillNoise(ctx, [242, 152, 72], 24, 101);
    const rand = createSeededRandom(102);
    for (let i = 0; i < 24; i++) {
      ctx.fillStyle = rand() > 0.5 ? '#e08438' : '#ffba75';
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

  // 3. Arenito Alaranjado Claro (Camadas laranja-ocre suaves)
  register(BLOCK_IDS.SANDSTONE, (ctx) => {
    const layers = ['#f5a256', '#e69145', '#fab36e', '#d98236', '#f09a4d'];
    for (let y = 0; y < 16; y++) {
      ctx.fillStyle = layers[y % layers.length];
      ctx.fillRect(0, y, 16, 1);
    }
    const rand = createSeededRandom(303);
    for (let i = 0; i < 25; i++) {
      ctx.fillStyle = 'rgba(120, 60, 15, 0.15)';
      ctx.fillRect(Math.floor(rand() * 16), Math.floor(rand() * 16), 2, 1);
    }
  });

  // 4. Gelo de Agua Marciano (Azul claro brilhante)
  register(BLOCK_IDS.MARS_ICE, (ctx) => {
    fillNoise(ctx, [205, 240, 255], 18, 404);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(2, 2, 4, 1);
    ctx.fillRect(10, 8, 4, 1);
    ctx.fillRect(5, 12, 5, 1);
  });

  // 5. Casco Branco da Base NASA (Branco fosco limpo estilo módulos da NASA)
  register(BLOCK_IDS.NASA_HULL, (ctx) => {
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 16, 16);
    ctx.strokeStyle = '#dce3ec';
    ctx.strokeRect(0.5, 0.5, 15, 15);
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(2, 2, 12, 12);
    // Detalhe sutil de rebite cinza claro
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(2, 2, 1, 1);
    ctx.fillRect(13, 2, 1, 1);
    ctx.fillRect(2, 13, 1, 1);
    ctx.fillRect(13, 13, 1, 1);
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
      ctx.fillStyle = 'rgba(210, 245, 255, 0.22)';
      ctx.fillRect(0, 0, 16, 16);
      // Moldura branca limpa da redoma
      ctx.fillStyle = 'rgba(248, 250, 252, 0.85)';
      ctx.fillRect(0, 0, 16, 1);
      ctx.fillRect(0, 15, 16, 1);
      ctx.fillRect(0, 0, 1, 16);
      ctx.fillRect(15, 0, 1, 16);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.fillRect(3, 3, 2, 1);
      ctx.fillRect(4, 4, 2, 1);
    },
    { transparent: true, opacity: 0.48 }
  );

  // 8. Painel Solar Fotovoltaico
  register(BLOCK_IDS.SOLAR_PANEL, (ctx) => {
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = '#2563eb';
    for (let y = 1; y < 15; y += 4) {
      for (let x = 1; x < 15; x += 4) {
        ctx.fillRect(x, y, 3, 3);
      }
    }
    ctx.fillStyle = '#93c5fd';
    ctx.fillRect(0, 7, 16, 1);
    ctx.fillRect(7, 0, 1, 16);
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

  return { materials, previews };
}
