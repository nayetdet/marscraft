import { BLOCK_IDS } from '../config/blockTypes.js';
import { MAV_CONFIG, WORLD_CONFIG } from '../config/constants.js';

function noise2D(x, z) {
  return Math.sin(x * 0.045) * Math.cos(z * 0.045) * 2.1 + Math.sin((x + z) * 0.12) * 0.75;
}

// Retangulo aplainado para a ala norte (NORTH_WING) e os paineis solares a oeste dela
const NORTH_PAD = { xMin: -27, xMax: 11, zMin: -38, zMax: -8, blend: 3 };

export function generateMartianTerrain(world) {
  const { halfX, halfZ } = world;
  const groundY = WORLD_CONFIG.GROUND_LEVEL;
  for (let x = -halfX; x < halfX; x += 1) {
    for (let z = -halfZ; z < halfZ; z += 1) {
      let height = groundY + noise2D(x, z);
      const iceDistance = Math.hypot(x - 22, z + 22);
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
      // Terreno plano sob a ala norte e o campo solar (fora do disco plano da base)
      const padDx = Math.max(NORTH_PAD.xMin - x, 0, x - NORTH_PAD.xMax);
      const padDz = Math.max(NORTH_PAD.zMin - z, 0, z - NORTH_PAD.zMax);
      const padDistance = Math.hypot(padDx, padDz);
      if (padDistance < NORTH_PAD.blend) {
        const blend = padDistance / NORTH_PAD.blend;
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
