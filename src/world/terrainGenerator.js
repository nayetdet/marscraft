import { BLOCK_IDS } from '../config/blockTypes.js';
import { WORLD_CONFIG } from '../config/constants.js';

function noise2D(x, z) {
  const s1 = Math.sin(x * 0.065) * Math.cos(z * 0.065) * 2.8;
  const s2 = Math.sin((x + z) * 0.14) * 1.2;
  const s3 = Math.cos(x * 0.27 - z * 0.22) * 0.6;
  return s1 + s2 + s3;
}

export function generateMartianTerrain(world) {
  const { halfX, halfZ } = world;
  const groundY = WORLD_CONFIG.GROUND_LEVEL;
  const craterRadius = WORLD_CONFIG.CRATER_RADIUS; // 43

  for (let x = -halfX; x < halfX; x++) {
    for (let z = -halfZ; z < halfZ; z++) {
      const distFromCenter = Math.hypot(x, z);
      let h = groundY + noise2D(x, z);

      // Sub-cratera interna com depósito de Gelo de Água a Noroeste (-22, -20)
      const distIceCrater = Math.hypot(x + 22, z + 20);
      if (distIceCrater < 12) {
        const rim = Math.exp(-Math.pow((distIceCrater - 9.5) / 2.2, 2)) * 3.2;
        const bowl =
          distIceCrater < 8.5 ? -Math.cos((distIceCrater / 8.5) * (Math.PI / 2)) * 4.5 : 0;
        h += rim + bowl;
      }

      // Nivelamento na área central de pouso da Nave NASA
      if (distFromCenter < 16) {
        const blend = Math.max(0, Math.min(1, (distFromCenter - 9) / 7));
        h = groundY * (1 - blend) + h * blend;
      }

      // PAREDÃO DA GRANDE CRATERA NAS BORDAS DO MAPA (impede o jogador de sair do mundo)
      if (distFromCenter > 32) {
        const wallProgress = Math.min(1.35, (distFromCenter - 32) / (craterRadius - 32));
        const cliffBoost = Math.pow(wallProgress, 1.85) * 24;
        h += cliffBoost;
      }

      const surfaceY = Math.min(world.sizeY - 2, Math.max(2, Math.floor(h)));

      for (let y = 0; y <= surfaceY; y++) {
        let blockId = BLOCK_IDS.REGOLITH;
        if (y === 0) {
          blockId = BLOCK_IDS.BASALT;
        } else if (distIceCrater < 5.0 && y >= surfaceY - 1 && distFromCenter < 33) {
          // Gelo de Água para minerar no modo Survival
          blockId = BLOCK_IDS.MARS_ICE;
        } else if (distFromCenter > 36 && y > groundY + 6) {
          // Paredão estratificado da grande cratera (arenito alaranjado + rocha de cratera)
          blockId = y % 4 === 0 ? BLOCK_IDS.BASALT : BLOCK_IDS.SANDSTONE;
        } else if (y < surfaceY - 3) {
          blockId = BLOCK_IDS.BASALT;
        } else if (y < surfaceY - 1 || surfaceY > 14) {
          blockId = BLOCK_IDS.SANDSTONE;
        }
        world.setBlock(x, y, z, blockId, false);
      }
    }
  }
}
