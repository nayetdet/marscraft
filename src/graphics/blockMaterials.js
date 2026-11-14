import * as THREE from 'three';
import { BLOCK_IDS } from '../config/blockTypes.js';
import { createSeededRandom, fillNoise, makeCanvasTexture } from './textureGenerator.js';

export function createBlockMaterials() {
  const materials = {};
  const previews = {};

  const register = (id, drawFn, matOptions = {}) => {
    const { texture, dataUrl } = makeCanvasTexture(drawFn);
    materials[id] = new THREE.MeshStandardMaterial({
      map: texture,
      ...matOptions,
    });
    previews[id] = dataUrl;
  };

  // 1. Regolito / Areia Marciana (Tom alaranjado/ocre autêntico de Marte)
  register(
    BLOCK_IDS.REGOLITH,
    (ctx) => {
      fillNoise(ctx, [218, 136, 62], 32, 101);
      const rand = createSeededRandom(102);
      for (let i = 0; i < 28; i++) {
        ctx.fillStyle = rand() > 0.5 ? '#c47432' : '#f0a860';
        ctx.fillRect(Math.floor(rand() * 16), Math.floor(rand() * 16), 1, 1);
      }
    },
    { roughness: 0.92, metalness: 0.04 }
  );

  // 2. Basalto de Cratera (Paredão da cratera e rochas escuras)
  register(
    BLOCK_IDS.BASALT,
    (ctx) => {
      fillNoise(ctx, [92, 74, 62], 26, 202);
      ctx.fillStyle = '#4a3b31';
      for (let y = 2; y < 16; y += 5) {
        ctx.fillRect(1, y, 6, 1);
        ctx.fillRect(9, y + 2, 5, 1);
      }
    },
    { roughness: 0.88, metalness: 0.1 }
  );

  // 3. Arenito Alaranjado Ocre (Camadas sedimentares marcianas)
  register(
    BLOCK_IDS.SANDSTONE,
    (ctx) => {
      const layers = ['#e09248', '#cc7e39', '#eba45e', '#b86c2c', '#d98841'];
      for (let y = 0; y < 16; y++) {
        ctx.fillStyle = layers[y % layers.length];
        ctx.fillRect(0, y, 16, 1);
      }
      const rand = createSeededRandom(303);
      for (let i = 0; i < 36; i++) {
        ctx.fillStyle = 'rgba(70, 35, 10, 0.2)';
        ctx.fillRect(Math.floor(rand() * 16), Math.floor(rand() * 16), 2, 1);
      }
    },
    { roughness: 0.85 }
  );

  // 4. Gelo de Água Marciano
  register(
    BLOCK_IDS.MARS_ICE,
    (ctx) => {
      fillNoise(ctx, [185, 228, 250], 22, 404);
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.fillRect(2, 2, 4, 1);
      ctx.fillRect(10, 8, 4, 1);
      ctx.fillRect(5, 12, 5, 1);
    },
    { roughness: 0.25, metalness: 0.1 }
  );

  // 5. Casco Pressurizado NASA
  register(
    BLOCK_IDS.NASA_HULL,
    (ctx) => {
      ctx.fillStyle = '#e5e9f0';
      ctx.fillRect(0, 0, 16, 16);
      ctx.strokeStyle = '#9aa5b4';
      ctx.strokeRect(0.5, 0.5, 15, 15);
      ctx.fillStyle = '#cfd6e0';
      ctx.fillRect(2, 2, 12, 12);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(2, 2, 1, 1);
      ctx.fillRect(13, 2, 1, 1);
      ctx.fillRect(2, 13, 1, 1);
      ctx.fillRect(13, 13, 1, 1);
      ctx.fillStyle = '#e07b24';
      ctx.fillRect(2, 7, 12, 2);
    },
    { roughness: 0.35, metalness: 0.45 }
  );

  // 6. Isolamento Térmico Dourado (Kapton)
  register(
    BLOCK_IDS.GOLD_FOIL,
    (ctx) => {
      fillNoise(ctx, [230, 175, 35], 45, 606);
      ctx.strokeStyle = '#b45309';
      ctx.strokeRect(0.5, 0.5, 15, 15);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(3, 3, 2, 2);
      ctx.fillRect(11, 10, 2, 2);
    },
    { roughness: 0.28, metalness: 0.78 }
  );

  // 7. Vidro Blindado Espacial
  register(
    BLOCK_IDS.HAB_GLASS,
    (ctx) => {
      ctx.fillStyle = 'rgba(125, 211, 252, 0.28)';
      ctx.fillRect(0, 0, 16, 16);
      ctx.fillStyle = '#334155';
      ctx.fillRect(0, 0, 16, 2);
      ctx.fillRect(0, 14, 16, 2);
      ctx.fillRect(0, 0, 2, 16);
      ctx.fillRect(14, 0, 2, 16);
      ctx.fillStyle = 'rgba(224, 242, 254, 0.75)';
      ctx.fillRect(3, 3, 2, 1);
      ctx.fillRect(4, 4, 2, 1);
      ctx.fillRect(5, 5, 1, 1);
    },
    { transparent: true, opacity: 0.62, roughness: 0.15, metalness: 0.2 }
  );

  // 8. Painel Solar Fotovoltaico
  register(
    BLOCK_IDS.SOLAR_PANEL,
    (ctx) => {
      ctx.fillStyle = '#0f2942';
      ctx.fillRect(0, 0, 16, 16);
      ctx.fillStyle = '#1d4ed8';
      for (let y = 1; y < 15; y += 4) {
        for (let x = 1; x < 15; x += 4) {
          ctx.fillRect(x, y, 3, 3);
        }
      }
      ctx.fillStyle = '#93c5fd';
      ctx.fillRect(0, 7, 16, 1);
      ctx.fillRect(7, 0, 1, 16);
    },
    { roughness: 0.22, metalness: 0.6 }
  );

  // 9. Luminária LED de Habitat
  register(
    BLOCK_IDS.HAB_LIGHT,
    (ctx) => {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, 16, 16);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(0, 0, 16, 2);
      ctx.fillRect(0, 14, 16, 2);
      ctx.fillRect(0, 0, 2, 16);
      ctx.fillRect(14, 0, 2, 16);
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(3, 3, 10, 10);
    },
    { emissive: new THREE.Color('#fde68a'), emissiveIntensity: 0.9, roughness: 0.2 }
  );

  // 10. Metal de Propulsor / Trem de Pouso
  register(
    BLOCK_IDS.THRUSTER_METAL,
    (ctx) => {
      fillNoise(ctx, [45, 52, 64], 20, 707);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, 16, 2);
      ctx.fillRect(0, 7, 16, 2);
      ctx.fillRect(0, 14, 16, 2);
    },
    { roughness: 0.45, metalness: 0.75 }
  );

  // 11. Console Computador NASA
  register(
    BLOCK_IDS.CONSOLE_SCREEN,
    (ctx) => {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, 16, 16);
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(2, 2, 12, 7);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(3, 4, 4, 1);
      ctx.fillRect(3, 6, 7, 1);
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(11, 4, 2, 3);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(2, 11, 2, 2);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(6, 11, 2, 2);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(10, 11, 3, 2);
    },
    { emissive: new THREE.Color('#0ea5e9'), emissiveIntensity: 0.45, roughness: 0.3 }
  );

  // 12. Cultivo Hidropônico / Batata Marciana
  register(
    BLOCK_IDS.HYDRO_PLANT,
    (ctx) => {
      ctx.fillStyle = '#5c4028';
      ctx.fillRect(0, 0, 16, 16);
      fillNoise(ctx, [42, 148, 62], 36, 808);
      ctx.fillStyle = '#86efac';
      ctx.fillRect(3, 3, 3, 3);
      ctx.fillRect(9, 6, 4, 3);
      ctx.fillRect(5, 10, 3, 2);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(7, 12, 3, 2);
    },
    { roughness: 0.65 }
  );

  // 13. Farol de Sinalização
  register(
    BLOCK_IDS.RED_BEACON,
    (ctx) => {
      ctx.fillStyle = '#7c2d12';
      ctx.fillRect(0, 0, 16, 16);
      ctx.fillStyle = '#f97316';
      ctx.fillRect(2, 2, 12, 12);
      ctx.fillStyle = '#ffedd5';
      ctx.fillRect(5, 5, 6, 6);
    },
    { emissive: new THREE.Color('#f97316'), emissiveIntensity: 1.1, roughness: 0.2 }
  );

  return { materials, previews };
}
