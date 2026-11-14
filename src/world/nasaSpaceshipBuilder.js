import { BLOCK_IDS } from '../config/blockTypes.js';
import { WORLD_CONFIG } from '../config/constants.js';

function fillBox(world, x1, y1, z1, x2, y2, z2, blockId) {
  for (let x = x1; x <= x2; x++) {
    for (let y = y1; y <= y2; y++) {
      for (let z = z1; z <= z2; z++) {
        world.setBlock(x, y, z, blockId, false);
      }
    }
  }
}

// 1. Módulo Hab Principal Branco da NASA (x: -7..7, z: -6..6)
function buildMainWhiteHabitat(world, groundY) {
  const floorY = groundY + 1; // y = 9
  const ceilY = groundY + 6;  // y = 14

  for (let x = -7; x <= 7; x++) {
    for (let z = -6; z <= 6; z++) {
      // Cantos chanfrados para formato octogonal de módulo espacial da NASA
      if (Math.abs(x) + Math.abs(z) >= 12) continue;

      for (let y = floorY; y <= ceilY; y++) {
        const isWall =
          Math.abs(x) === 7 ||
          Math.abs(z) === 6 ||
          Math.abs(x) + Math.abs(z) === 11;

        if (y === floorY) {
          // Piso branco limpo com corredor técnico central
          const isCenterPath = Math.abs(x) <= 1 || Math.abs(z) <= 1;
          world.setBlock(
            x,
            y,
            z,
            isCenterPath ? BLOCK_IDS.THRUSTER_METAL : BLOCK_IDS.NASA_HULL,
            false
          );
        } else if (y === ceilY) {
          // Teto branco com claraboias de vidro e luminárias LED
          if (Math.abs(x) <= 2 && Math.abs(z) <= 2) {
            world.setBlock(x, y, z, BLOCK_IDS.HAB_GLASS, false);
          } else if ((Math.abs(x) === 4 && z === 0) || (x === 0 && Math.abs(z) === 3)) {
            world.setBlock(x, y, z, BLOCK_IDS.HAB_LIGHT, false);
          } else {
            world.setBlock(x, y, z, BLOCK_IDS.NASA_HULL, false);
          }
        } else if (isWall) {
          // Janelas panorâmicas nas paredes (y = 11 e 12)
          const isWindowHeight = y === floorY + 2 || y === floorY + 3;
          const isWindowSpan =
            (Math.abs(x) >= 3 && Math.abs(x) <= 5 && Math.abs(z) === 6) ||
            (Math.abs(z) >= 2 && Math.abs(z) <= 4 && Math.abs(x) === 7);

          if (isWindowHeight && isWindowSpan) {
            world.setBlock(x, y, z, BLOCK_IDS.HAB_GLASS, false);
          } else {
            world.setBlock(x, y, z, BLOCK_IDS.NASA_HULL, false);
          }
        } else {
          world.setBlock(x, y, z, BLOCK_IDS.AIR, false);
        }
      }
    }
  }

  // Entrada Principal / Airlock Branco no Lado Sul (z = 6..9)
  fillBox(world, -2, floorY, 6, 2, floorY + 4, 8, BLOCK_IDS.NASA_HULL);
  fillBox(world, -1, floorY + 1, 6, 1, floorY + 3, 8, BLOCK_IDS.AIR);
  world.setBlock(0, floorY + 4, 7, BLOCK_IDS.HAB_LIGHT, false);

  // Rampa larga de acesso (z = 9..10)
  fillBox(world, -2, floorY, 9, 2, floorY, 10, BLOCK_IDS.THRUSTER_METAL);

  // Segundo Andar: Cúpula de Observação Astronômica no Teto (y = 15..18)
  const cupFloor = ceilY;
  const cupCeil = ceilY + 4;
  for (let x = -3; x <= 3; x++) {
    for (let z = -3; z <= 3; z++) {
      if (Math.abs(x) === 3 && Math.abs(z) === 3) continue;
      for (let y = cupFloor + 1; y <= cupCeil; y++) {
        const isEdge = Math.abs(x) === 3 || Math.abs(z) === 3;
        if (y === cupCeil) {
          world.setBlock(x, y, z, BLOCK_IDS.HAB_GLASS, false);
        } else if (isEdge) {
          world.setBlock(
            x,
            y,
            z,
            y >= cupFloor + 2 ? BLOCK_IDS.HAB_GLASS : BLOCK_IDS.NASA_HULL,
            false
          );
        } else {
          world.setBlock(x, y, z, BLOCK_IDS.AIR, false);
        }
      }
    }
  }
}

// 2. Túnel Pressurizado Branco + Redoma de Estufa Geodésica (Lado Oeste: x = -18, z = 0)
function buildGreenhouseDome(world, groundY) {
  const floorY = groundY + 1; // y = 9
  const domeCenterX = -18;
  const domeCenterZ = 0;
  const domeRadius = 7;

  // Redoma Hemisférica de Vidro com Arcos Brancos Estruturais
  for (let dx = -domeRadius; dx <= domeRadius; dx++) {
    for (let dz = -domeRadius; dz <= domeRadius; dz++) {
      const horizDist = Math.hypot(dx, dz);
      if (horizDist > domeRadius + 0.4) continue;

      const x = domeCenterX + dx;
      const z = domeCenterZ + dz;

      // Piso da Redoma
      if (horizDist <= domeRadius - 0.8) {
        // Canteiros de plantação hidropônica em fileiras com corredor central
        const isWalkway = Math.abs(dz) <= 1 || Math.abs(dx) <= 1;
        const isPlanter =
          !isWalkway &&
          horizDist <= domeRadius - 1.6 &&
          (Math.abs(dz) === 2 || Math.abs(dz) === 3 || Math.abs(dz) === 4);

        world.setBlock(
          x,
          floorY,
          z,
          isPlanter ? BLOCK_IDS.HYDRO_PLANT : BLOCK_IDS.NASA_HULL,
          false
        );
      } else {
        // Anel branco de fundação da estufa
        world.setBlock(x, floorY, z, BLOCK_IDS.NASA_HULL, false);
        world.setBlock(x, floorY + 1, z, BLOCK_IDS.NASA_HULL, false);
      }

      // Cúpula esférica de vidro acima do piso
      for (let dy = 1; dy <= domeRadius; dy++) {
        const sphereDist = Math.hypot(dx, dy * 1.05, dz);
        const y = floorY + dy;

        if (sphereDist >= domeRadius - 0.65 && sphereDist <= domeRadius + 0.45) {
          // Nervuras brancas geodésicas no meridiano central (dx === 0 ou dz === 0)
          const isWhiteRib =
            dy === 1 ||
            (Math.abs(dx) === 0 && dy < domeRadius) ||
            (Math.abs(dz) === 0 && dy < domeRadius);

          world.setBlock(
            x,
            y,
            z,
            isWhiteRib ? BLOCK_IDS.NASA_HULL : BLOCK_IDS.HAB_GLASS,
            false
          );
        } else if (sphereDist < domeRadius - 0.65) {
          world.setBlock(x, y, z, BLOCK_IDS.AIR, false);
        }
      }
    }
  }

  // Luminária central no topo da Redoma de Estufa
  world.setBlock(domeCenterX, floorY + domeRadius, domeCenterZ, BLOCK_IDS.HAB_LIGHT, false);

  // Túnel Branco Pressurizado ligando o Habitat Principal (x = -7) à Redoma de Estufa (x = -11)
  for (let x = -12; x <= -7; x++) {
    for (let z = -2; z <= 2; z++) {
      for (let y = floorY; y <= floorY + 4; y++) {
        if (y === floorY) {
          world.setBlock(x, y, z, BLOCK_IDS.THRUSTER_METAL, false);
        } else if (y === floorY + 4 || Math.abs(z) === 2) {
          world.setBlock(
            x,
            y,
            z,
            y === floorY + 2 && Math.abs(z) === 2 ? BLOCK_IDS.HAB_GLASS : BLOCK_IDS.NASA_HULL,
            false
          );
        } else {
          world.setBlock(x, y, z, BLOCK_IDS.AIR, false);
        }
      }
    }
  }
}

// 3. Foguete / Lander Branco de Ascensão da NASA no Lado Leste (x = 14, z = -3)
function buildNasaAscentLander(world, groundY) {
  const cx = 14;
  const cz = -3;

  // Plataforma de pouso
  fillBox(world, cx - 4, groundY, cz - 4, cx + 4, groundY, cz + 4, BLOCK_IDS.BASALT);

  // 4 Sapatas de pouso
  const legs = [
    [-3, -3],
    [3, -3],
    [-3, 3],
    [3, 3],
  ];
  for (const [lx, lz] of legs) {
    world.setBlock(cx + lx, groundY + 1, cz + lz, BLOCK_IDS.THRUSTER_METAL, false);
    world.setBlock(cx + lx, groundY + 2, cz + lz, BLOCK_IDS.THRUSTER_METAL, false);
  }

  // Estágio base dourado (Kapton) + Corpo cilíndrico branco do foguete NASA
  fillBox(world, cx - 2, groundY + 2, cz - 2, cx + 2, groundY + 3, cz + 2, BLOCK_IDS.GOLD_FOIL);
  fillBox(world, cx - 2, groundY + 4, cz - 2, cx + 2, groundY + 8, cz + 2, BLOCK_IDS.NASA_HULL);
  // Janela da cápsula
  world.setBlock(cx, groundY + 7, cz + 2, BLOCK_IDS.HAB_GLASS, false);
  // Cone do nariz branco + sinalizador
  fillBox(world, cx - 1, groundY + 9, cz - 1, cx + 1, groundY + 10, cz + 1, BLOCK_IDS.NASA_HULL);
  world.setBlock(cx, groundY + 11, cz, BLOCK_IDS.THRUSTER_METAL, false);
  world.setBlock(cx, groundY + 12, cz, BLOCK_IDS.RED_BEACON, false);
}

export function buildNasaSpaceshipAndBase(world) {
  const groundY = WORLD_CONFIG.GROUND_LEVEL; // 8
  buildMainWhiteHabitat(world, groundY);
  buildGreenhouseDome(world, groundY);
  buildNasaAscentLander(world, groundY);
}
