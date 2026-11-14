import { BLOCK_IDS } from '../config/blockTypes.js';
import { MAV_CONFIG, WATER_SYSTEM_CONFIG, WORLD_CONFIG } from '../config/constants.js';
import { HABITAT_LAYOUT } from './habitatLayout.js';

function noise2D(x, z) {
  return Math.sin(x * 0.045) * Math.cos(z * 0.045) * 2.1 + Math.sin((x + z) * 0.12) * 0.75;
}

// Retangulo aplainado para a ala norte (NORTH_WING) e os paineis solares a oeste dela
const NORTH_PAD = { xMin: -31, xMax: 17, zMin: -42, zMax: -8, blend: 2 };
// Idem para o dormitorio (EAST_WING) e para o foguete de ascensao, a leste e sudeste do habitat
const EAST_PAD = { xMin: 13, xMax: 30, zMin: -12, zMax: 14, blend: 2 };
const FLAT_PADS = [NORTH_PAD, EAST_PAD];

export function generateMartianTerrain(world) {
  const { halfX, halfZ } = world;
  const groundY = WORLD_CONFIG.GROUND_LEVEL;
  for (let x = -halfX; x < halfX; x += 1) {
    for (let z = -halfZ; z < halfZ; z += 1) {
      let height = groundY + noise2D(x, z);
      const iceDistance = Math.hypot(x - WATER_SYSTEM_CONFIG.ICE_CRATER_CENTER.x, z - WATER_SYSTEM_CONFIG.ICE_CRATER_CENTER.z);
      if (iceDistance < 11) {
        const rim = Math.exp(-Math.pow((iceDistance - 8.5) / 2.2, 2)) * 2.5;
        const bowl = iceDistance < 7.5 ? -Math.cos((iceDistance / 7.5) * (Math.PI / 2)) * 3.5 : 0;
        height += rim + bowl;
      }
      const baseDistance = Math.hypot(x + 4, z);
      if (baseDistance < 36) {
        const blend = Math.max(0, Math.min(1, (baseDistance - 28) / 8));
        height = groundY * (1 - blend) + height * blend;
      }
      const distLaunchPad = Math.hypot(x - MAV_CONFIG.PAD_POSITION.x, z - MAV_CONFIG.PAD_POSITION.z);
      const padFlat = MAV_CONFIG.PAD_RADIUS + 2;
      if (distLaunchPad < padFlat + 4) {
        const blend = Math.max(0, Math.min(1, (distLaunchPad - padFlat) / 4));
        height = groundY * (1 - blend) + height * blend;
      }
      if (baseDistance > 40) {
        const rimProgress = Math.min(1.2, (baseDistance - 40) / 10);
        height += Math.pow(rimProgress, 1.5) * 5.8;
      }
      // Terreno plano sob as alas norte e leste (fora do disco plano da base)
      for (const pad of FLAT_PADS) {
        const padDx = Math.max(pad.xMin - x, 0, x - pad.xMax);
        const padDz = Math.max(pad.zMin - z, 0, z - pad.zMax);
        const padDistance = Math.hypot(padDx, padDz);
        if (padDistance < pad.blend) {
          const blend = padDistance / pad.blend;
          height = groundY * (1 - blend) + height * blend;
        }
      }
      // Terreno plano sob a redoma da estufa, que passa do disco plano da base
      const domeEdge = Math.hypot(x - HABITAT_LAYOUT.DOME_X, z - HABITAT_LAYOUT.DOME_Z) - (HABITAT_LAYOUT.DOME_RADIUS + 2);
      if (domeEdge < 3) {
        const blend = Math.max(0, domeEdge / 3);
        height = groundY * (1 - blend) + height * blend;
      }
      const surfaceY = Math.min(world.sizeY - 2, Math.max(2, Math.floor(height)));
      for (let y = 0; y <= surfaceY; y += 1) {
        let id = BLOCK_IDS.REGOLITH;
        if (y === 0 || y < surfaceY - 3) id = BLOCK_IDS.BASALT;
        else if (iceDistance < 4.8 && y >= surfaceY - 1) id = BLOCK_IDS.MARS_ICE;
        else if (y < surfaceY - 1 || surfaceY > groundY + 3) id = BLOCK_IDS.SANDSTONE;
        world.setBlock(x, y, z, id, false);
      }
    }
  }
}
