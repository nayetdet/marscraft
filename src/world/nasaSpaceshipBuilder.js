import { isGreenhouseBed } from './greenhouseLayout.js';
import { BLOCK_IDS } from '../config/blockTypes.js';
import { WORLD_CONFIG } from '../config/constants.js';
import { HABITAT_LAYOUT, NORTH_WING, mainHabCell, northLinkBox } from './habitatLayout.js';

function fillBox(world, x1, y1, z1, x2, y2, z2, blockId) {
  for (let x = x1; x <= x2; x++) {
    for (let y = y1; y <= y2; y++) {
      for (let z = z1; z <= z2; z++) {
        world.setBlock(x, y, z, blockId, false);
      }
    }
  }
}

// 1. Módulo Hab Principal Branco da NASA. Ar em x = -6..12, z = -11..5 (HABITAT_LAYOUT), com os
// cantos chanfrados; o airlock, o tunel e a cupula continuam em volta de x = 0, z = 0.
function buildMainWhiteHabitat(world, groundY) {
  const floorY = groundY + 1; // y = 9
  const ceilY = groundY + 6;  // y = 14
  const H = HABITAT_LAYOUT;
  const west = H.MAIN_X_MIN - 1;
  const east = H.MAIN_X_MAX + 1;
  const north = H.MAIN_Z_MIN - 1;
  const south = H.MAIN_Z_MAX + 1;

  for (let x = west; x <= east; x++) {
    for (let z = north; z <= south; z++) {
      const cell = mainHabCell(x, z);
      if (!cell) continue;

      for (let y = floorY; y <= ceilY; y++) {
        if (y === floorY) {
          // Piso branco com caminhos de metal: airlock -> hub, tunel -> suporte de vida, hub -> ala norte
          const isPath = Math.abs(x) <= 1 || Math.abs(z) <= 1 || (x >= -4 && x <= -1 && z < 0);
          world.setBlock(x, y, z, isPath ? BLOCK_IDS.THRUSTER_METAL : BLOCK_IDS.NASA_HULL, false);
        } else if (y === ceilY) {
          // Teto branco com a claraboia da cupula e luminarias LED espalhadas
          const isLight = (x === -4 || x === 4 || x === 10) && (z === -8 || z === -4 || z === 3);
          if (Math.abs(x) <= 2 && Math.abs(z) <= 2) {
            world.setBlock(x, y, z, BLOCK_IDS.HAB_GLASS, false);
          } else {
            world.setBlock(x, y, z, isLight ? BLOCK_IDS.HAB_LIGHT : BLOCK_IDS.NASA_HULL, false);
          }
        } else if (cell === 'wall') {
          // Janelas panorâmicas nas paredes (y = 11 e 12)
          const isWindowHeight = y === floorY + 2 || y === floorY + 3;
          const isWindowSpan =
            (z === north && ((x >= 1 && x <= 2) || (x >= 10 && x <= 11))) ||
            (z === south && ((Math.abs(x) >= 3 && Math.abs(x) <= 5) || (x >= 8 && x <= 10))) ||
            (x === west && ((z >= -9 && z <= -5) || z === 4)) ||
            (x === east && ((z >= -9 && z <= -6) || (z >= 2 && z <= 4)));
          world.setBlock(x, y, z, isWindowHeight && isWindowSpan ? BLOCK_IDS.HAB_GLASS : BLOCK_IDS.NASA_HULL, false);
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
        const isPlanter = isGreenhouseBed(dx, dz);

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
    for (let z = -3; z <= 3; z++) {
      for (let y = floorY; y <= floorY + 4; y++) {
        if (y === floorY) {
          world.setBlock(x, y, z, BLOCK_IDS.THRUSTER_METAL, false);
        } else if (y === floorY + 4 || Math.abs(z) === 3) {
          world.setBlock(
            x,
            y,
            z,
            y === floorY + 2 && Math.abs(z) === 3 ? BLOCK_IDS.HAB_GLASS : BLOCK_IDS.NASA_HULL,
            false
          );
        } else {
          world.setBlock(x, y, z, BLOCK_IDS.AIR, false);
        }
      }
    }
  }
}

// 3. Foguete / Lander Branco de Ascensão da NASA no Lado Leste (x = 22, z = -3)
function buildNasaAscentLander(world, groundY) {
  const cx = 22;
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

// 4. Módulo Pressurizado de Academia & MedBay (Sudoeste: x = -12..-4, z = 7..13)
function buildGymModule(world, groundY) {
  const floorY = groundY + 1; // y = 9
  const ceilY = groundY + 6;  // y = 14

  // Sala principal da Academia (x: -12..-4, z: 7..13)
  for (let x = -12; x <= -4; x++) {
    for (let z = 7; z <= 13; z++) {
      const isWall = x === -12 || x === -4 || z === 7 || z === 13;
      for (let y = floorY; y <= ceilY; y++) {
        if (y === floorY) {
          const isWorkoutMat =
            (x >= -10 && x <= -6 && z >= 9 && z <= 11) ||
            (x >= -6 && x <= -5 && z === 8);
          world.setBlock(
            x,
            y,
            z,
            isWorkoutMat ? BLOCK_IDS.THRUSTER_METAL : BLOCK_IDS.NASA_HULL,
            false
          );
        } else if (y === ceilY) {
          if (x >= -9 && x <= -7 && z === 10) {
            world.setBlock(x, y, z, BLOCK_IDS.HAB_GLASS, false);
          } else if (
            (x === -10 && z === 10) ||
            (x === -6 && z === 10) ||
            (x === -8 && (z === 8 || z === 12))
          ) {
            world.setBlock(x, y, z, BLOCK_IDS.HAB_LIGHT, false);
          } else {
            world.setBlock(x, y, z, BLOCK_IDS.NASA_HULL, false);
          }
        } else if (isWall) {
          const isWindowHeight = y === floorY + 2 || y === floorY + 3;
          const isWindowSpan =
            (x === -12 && z >= 9 && z <= 11) ||
            (z === 13 && x >= -10 && x <= -6) ||
            (x === -4 && z >= 9 && z <= 11);
          world.setBlock(
            x,
            y,
            z,
            isWindowHeight && isWindowSpan ? BLOCK_IDS.HAB_GLASS : BLOCK_IDS.NASA_HULL,
            false
          );
        } else {
          world.setBlock(x, y, z, BLOCK_IDS.AIR, false);
        }
      }
    }
  }

  // Corredor pressurizado ligando o Sudoeste do Habitat Principal (z = 5) à Academia (z = 7)
  for (let z = 5; z <= 7; z++) {
    const xMax = z === 5 ? -5 : -4;
    for (let x = -7; x <= xMax; x++) {
      const isSideWall = x === -7 || (z >= 6 && x === -4);
      for (let y = floorY; y <= ceilY; y++) {
        if (y === floorY) {
          world.setBlock(
            x,
            y,
            z,
            isSideWall ? BLOCK_IDS.NASA_HULL : BLOCK_IDS.THRUSTER_METAL,
            false
          );
        } else if (y === ceilY) {
          world.setBlock(
            x,
            y,
            z,
            x === -5 && z === 6 ? BLOCK_IDS.HAB_LIGHT : BLOCK_IDS.NASA_HULL,
            false
          );
        } else if (isSideWall) {
          const isCorridorWindow =
            x === -7 && z === 6 && (y === floorY + 2 || y === floorY + 3);
          world.setBlock(
            x,
            y,
            z,
            isCorridorWindow ? BLOCK_IDS.HAB_GLASS : BLOCK_IDS.NASA_HULL,
            false
          );
        } else {
          world.setBlock(x, y, z, BLOCK_IDS.AIR, false);
        }
      }
    }
  }
}

// 5. Ala Norte (issue #56, ampliada): corredor central envidracado e quatro modulos separados
// (energia, cozinha, banheiro, oficina), cada um ligado por um corredor curto. A geometria vem
// de NORTH_WING (habitatLayout.js), a mesma que marca o ar pressurizado.
function buildNorthModule(world, groundY) {
  const floorY = groundY + 1; // y = 9
  const ceilY = groundY + 6; // y = 14
  const { SPINE, ROOMS, LINK_HEIGHT } = NORTH_WING;
  const isWindowY = (y) => y === floorY + 2 || y === floorY + 3;

  // Casco: caixa cheia um bloco maior que o ar, depois escavada por dentro
  const shell = (box, floorId) => {
    for (let x = box.xMin - 1; x <= box.xMax + 1; x++) {
      for (let z = box.zMin - 1; z <= box.zMax + 1; z++) {
        const inside = x >= box.xMin && x <= box.xMax && z >= box.zMin && z <= box.zMax;
        for (let y = floorY; y <= ceilY; y++) {
          world.setBlock(x, y, z, y === floorY && inside ? floorId : BLOCK_IDS.NASA_HULL, false);
        }
      }
    }
  };
  const carve = (box, height) => {
    for (let x = box.xMin; x <= box.xMax; x++) {
      for (let z = box.zMin; z <= box.zMax; z++) {
        for (let y = floorY + 1; y <= floorY + height; y++) world.setBlock(x, y, z, BLOCK_IDS.AIR, false);
      }
    }
  };
  const fullHeight = ceilY - floorY - 1;

  for (const room of ROOMS) shell(room, BLOCK_IDS.NASA_HULL);
  for (const room of ROOMS) shell(northLinkBox(room), BLOCK_IDS.THRUSTER_METAL);
  // O corredor central nao refaz a parede norte do habitat (z = -6): so abre a porta nela
  shell({ ...SPINE, zMax: SPINE.zMax - 1 }, BLOCK_IDS.THRUSTER_METAL);
  for (let x = SPINE.xMin; x <= SPINE.xMax; x++) world.setBlock(x, floorY, SPINE.zMax, BLOCK_IDS.THRUSTER_METAL, false);

  for (const room of ROOMS) {
    carve(room, fullHeight);
    const link = northLinkBox(room);
    // O ar do corredor curto atravessa as duas paredes (a do corredor central e a do modulo)
    carve({ ...link, xMin: link.xMin - 1, xMax: link.xMax + 1 }, LINK_HEIGHT);
    // Faixa de metal da porta ate o meio do modulo
    const midX = Math.round((room.xMin + room.xMax) / 2);
    for (let x = Math.min(midX, link.xMin); x <= Math.max(midX, link.xMax); x++) {
      if (x < room.xMin || x > room.xMax) continue;
      for (let z = room.door[0]; z <= room.door[1]; z++) world.setBlock(x, floorY, z, BLOCK_IDS.THRUSTER_METAL, false);
    }
  }
  carve(SPINE, fullHeight);

  // Janelas e luzes dos modulos
  for (const room of ROOMS) {
    const outerX = room.side === 'west' ? room.xMin - 1 : room.xMax + 1;
    const midX = Math.round((room.xMin + room.xMax) / 2);
    const midZ = Math.round((room.zMin + room.zMax) / 2);
    for (let y = floorY + 2; y <= floorY + 3; y++) {
      for (let z = midZ - 2; z <= midZ + 2; z++) world.setBlock(outerX, y, z, BLOCK_IDS.HAB_GLASS, false);
      for (let x = midX - 3; x <= midX + 3; x++) {
        world.setBlock(x, y, room.zMin - 1, BLOCK_IDS.HAB_GLASS, false);
        world.setBlock(x, y, room.zMax + 1, BLOCK_IDS.HAB_GLASS, false);
      }
    }
    for (const [dx, dz] of [[-3, -2], [3, -2], [-3, 2], [3, 2]]) {
      world.setBlock(midX + dx, ceilY, midZ + dz, BLOCK_IDS.HAB_LIGHT, false);
    }
    world.setBlock(midX, ceilY, midZ, BLOCK_IDS.HAB_GLASS, false);
  }

  // Corredor central: janelas dos dois lados (fora dos trechos com porta), luz e claraboia no teto
  const nearDoor = (z) => ROOMS.some((room) => z >= room.door[0] - 1 && z <= room.door[1] + 1);
  for (let z = SPINE.zMin; z <= SPINE.zMax - 2; z++) {
    const glassSpan = ((-z) % 4) < 2;
    if (glassSpan && !nearDoor(z)) {
      for (let y = floorY + 2; y <= floorY + 3; y++) {
        world.setBlock(SPINE.xMin - 1, y, z, BLOCK_IDS.HAB_GLASS, false);
        world.setBlock(SPINE.xMax + 1, y, z, BLOCK_IDS.HAB_GLASS, false);
      }
    }
    for (let x = SPINE.xMin; x <= SPINE.xMax; x++) {
      const inner = x > SPINE.xMin && x < SPINE.xMax;
      const id = nearDoor(z) ? (inner ? BLOCK_IDS.HAB_LIGHT : BLOCK_IDS.NASA_HULL) : glassSpan ? BLOCK_IDS.HAB_GLASS : BLOCK_IDS.NASA_HULL;
      world.setBlock(x, ceilY, z, id, false);
    }
  }
  for (let x = SPINE.xMin; x <= SPINE.xMax; x++) {
    for (let y = floorY + 2; y <= floorY + 3; y++) {
      if (isWindowY(y)) world.setBlock(x, y, SPINE.zMin - 1, BLOCK_IDS.HAB_GLASS, false);
    }
  }
}

export function buildNasaSpaceshipAndBase(world) {
  const groundY = WORLD_CONFIG.GROUND_LEVEL; // 8
  world.recordBaseWindows = true;
  buildMainWhiteHabitat(world, groundY);
  buildGreenhouseDome(world, groundY);
  buildGymModule(world, groundY);
  buildNorthModule(world, groundY);
  world.recordBaseWindows = false;
}
