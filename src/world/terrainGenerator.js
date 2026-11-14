import { BLOCK_IDS } from '../config/blockTypes.js';
import { MAV_CONFIG, WORLD_CONFIG } from '../config/constants.js';

function noise2D(x, z) {
  const s1 = Math.sin(x * 0.06) * Math.cos(z * 0.06) * 2.2;
  const s2 = Math.sin((x + z) * 0.13) * 0.9;
  return s1 + s2;
}

export function generateMartianTerrain(world) {
  const { halfX, halfZ } = world;
  const groundY = WORLD_CONFIG.GROUND_LEVEL; // 8
  const craterRadius = WORLD_CONFIG.CRATER_RADIUS; // 50

  for (let x = -halfX; x < halfX; x++) {
    for (let z = -halfZ; z < halfZ; z++) {
      const distFromCenter = Math.hypot(x, z);
      let h = groundY + noise2D(x, z);

      // Sub-cratera com Gelo de Água a Nordeste (22, -22)
      const distIceCrater = Math.hypot(x - 22, z + 22);
      if (distIceCrater < 11) {
        const rim = Math.exp(-Math.pow((distIceCrater - 8.5) / 2.2, 2)) * 2.5;
        const bowl =
          distIceCrater < 7.5 ? -Math.cos((distIceCrater / 7.5) * (Math.PI / 2)) * 3.5 : 0;
        h += rim + bowl;
      }

      // Nivelamento amplo para a Base Branca da NASA e a Redoma de Estufa
      const distBaseArea = Math.hypot(x + 4, z);
      if (distBaseArea < 24) {
        const blend = Math.max(0, Math.min(1, (distBaseArea - 18) / 6));
        h = groundY * (1 - blend) + h * blend;
      }

      // Plataforma de lancamento plana para o MAV
      const distLaunchPad = Math.hypot(x - MAV_CONFIG.PAD_POSITION.x, z - MAV_CONFIG.PAD_POSITION.z);
      const padFlat = MAV_CONFIG.PAD_RADIUS + 2;
      if (distLaunchPad < padFlat + 4) {
        const blend = Math.max(0, Math.min(1, (distLaunchPad - padFlat) / 4));
        h = groundY * (1 - blend) + h * blend;
      }

      // Borda da Cratera baixa e suave (apenas 5 a 6 blocos de elevação para não tampar os planetas no céu!)
      if (distFromCenter > 40) {
        const wallProgress = Math.min(1.2, (distFromCenter - 40) / (craterRadius - 40));
        const gentleRidge = Math.pow(wallProgress, 1.5) * 5.8;
        h += gentleRidge;
      }

      const surfaceY = Math.min(world.sizeY - 2, Math.max(2, Math.floor(h)));

      for (let y = 0; y <= surfaceY; y++) {
        let blockId = BLOCK_IDS.REGOLITH;
        if (y === 0) {
          blockId = BLOCK_IDS.BASALT;
        } else if (distIceCrater < 4.8 && y >= surfaceY - 1) {
          blockId = BLOCK_IDS.MARS_ICE;
        } else if (distFromCenter > 43 && y >= surfaceY - 1) {
          blockId = BLOCK_IDS.SANDSTONE;
        } else if (y < surfaceY - 3) {
          blockId = BLOCK_IDS.BASALT;
        } else if (y < surfaceY - 1 || surfaceY > groundY + 3) {
          blockId = BLOCK_IDS.SANDSTONE;
        }
        world.setBlock(x, y, z, blockId, false);
      }
    }
  }
}
