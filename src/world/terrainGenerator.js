import { BLOCK_IDS } from '../config/blockTypes.js';
import { MAV_CONFIG, TERRAIN_CONFIG, WATER_SYSTEM_CONFIG, WORLD_CONFIG } from '../config/constants.js';
import { terrainOffset } from '../data/marsTerrain.js';
import { HABITAT_LAYOUT } from './habitatLayout.js';

// Retangulo aplainado para a ala norte (NORTH_WING) e os paineis solares a oeste dela
const NORTH_PAD = { xMin: -31, xMax: 17, zMin: -42, zMax: -8, blend: 2 };

// O relevo e real: elevacao HiRISE de uma cratera em Gale, 1 bloco ~ 1 m (src/data/marsTerrain.js).
// So sao alterados os trechos nivelados para as construcoes e a cratera de gelo, que e do jogo.
export function generateMartianTerrain(world) {
  const { halfX, halfZ } = world;
  const groundY = WORLD_CONFIG.GROUND_LEVEL;
  for (let x = -halfX; x < halfX; x += 1) {
    for (let z = -halfZ; z < halfZ; z += 1) {
      // + 0.5 para o Math.floor do fim arredondar a altura real para o bloco mais proximo
      let height = groundY + 0.5 + terrainOffset(x, z);
      const iceDistance = Math.hypot(x - WATER_SYSTEM_CONFIG.ICE_CRATER_CENTER.x, z - WATER_SYSTEM_CONFIG.ICE_CRATER_CENTER.z);
      if (iceDistance < 11) {
        const rim = Math.exp(-Math.pow((iceDistance - 8.5) / 2.2, 2)) * 2.5;
        const bowl = iceDistance < 7.5 ? -Math.cos((iceDistance / 7.5) * (Math.PI / 2)) * 3.5 : 0;
        height += rim + bowl;
      }
      const baseDistance = Math.hypot(x - TERRAIN_CONFIG.BASE_CENTER.x, z - TERRAIN_CONFIG.BASE_CENTER.z);
      if (baseDistance < TERRAIN_CONFIG.BASE_BLEND_RADIUS) {
        const blendWidth = TERRAIN_CONFIG.BASE_BLEND_RADIUS - TERRAIN_CONFIG.BASE_FLAT_RADIUS;
        const blend = Math.max(0, Math.min(1, (baseDistance - TERRAIN_CONFIG.BASE_FLAT_RADIUS) / blendWidth));
        height = groundY * (1 - blend) + height * blend;
      }
      const distLaunchPad = Math.hypot(x - MAV_CONFIG.PAD_POSITION.x, z - MAV_CONFIG.PAD_POSITION.z);
      const padFlat = MAV_CONFIG.PAD_RADIUS + 2;
      if (distLaunchPad < padFlat + 4) {
        const blend = Math.max(0, Math.min(1, (distLaunchPad - padFlat) / 4));
        height = groundY * (1 - blend) + height * blend;
      }
      // Terreno plano sob a ala norte e o campo solar (fora do disco plano da base)
      const padDx = Math.max(NORTH_PAD.xMin - x, 0, x - NORTH_PAD.xMax);
      const padDz = Math.max(NORTH_PAD.zMin - z, 0, z - NORTH_PAD.zMax);
      const padDistance = Math.hypot(padDx, padDz);
      if (padDistance < NORTH_PAD.blend) {
        const blend = padDistance / NORTH_PAD.blend;
        height = groundY * (1 - blend) + height * blend;
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
