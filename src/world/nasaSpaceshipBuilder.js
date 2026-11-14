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

function buildLandingPadAndLegs(world, groundY) {
  // Marcas de queima no solo de basalto sob os propulsores
  for (let x = -5; x <= 5; x++) {
    for (let z = -5; z <= 5; z++) {
      if (Math.hypot(x, z) <= 5.5) {
        world.setBlock(x, groundY, z, BLOCK_IDS.BASALT, false);
      }
    }
  }

  // Faróis de perímetro da pista de pouso
  const padCorners = [
    [-10, -10],
    [10, -10],
    [-10, 10],
    [10, 10],
  ];
  for (const [px, pz] of padCorners) {
    world.setBlock(px, groundY + 1, pz, BLOCK_IDS.THRUSTER_METAL, false);
    world.setBlock(px, groundY + 2, pz, BLOCK_IDS.RED_BEACON, false);
  }

  // 4 Sapatas hidráulicas de pouso
  const legPositions = [
    [-5, -5],
    [5, -5],
    [-5, 5],
    [5, 5],
  ];
  for (const [lx, lz] of legPositions) {
    fillBox(world, lx - 1, groundY + 1, lz - 1, lx + 1, groundY + 1, lz + 1, BLOCK_IDS.THRUSTER_METAL);
    fillBox(world, lx, groundY + 2, lz, lx, groundY + 4, lz, BLOCK_IDS.THRUSTER_METAL);
    world.setBlock(lx, groundY + 3, lz, BLOCK_IDS.GOLD_FOIL, false);
  }

  // 4 Campânulas dos motores foguete
  const nozzles = [
    [-2, -2],
    [2, -2],
    [-2, 2],
    [2, 2],
  ];
  for (const [nx, nz] of nozzles) {
    world.setBlock(nx, groundY + 2, nz, BLOCK_IDS.THRUSTER_METAL, false);
    world.setBlock(nx, groundY + 3, nz, BLOCK_IDS.GOLD_FOIL, false);
  }
}

function buildDeck1ScienceAndAirlock(world, groundY) {
  const d1Floor = groundY + 4;
  const d1Ceil = groundY + 9;

  for (let x = -5; x <= 5; x++) {
    for (let z = -5; z <= 5; z++) {
      if (Math.abs(x) === 5 && Math.abs(z) === 5) continue;

      for (let y = d1Floor; y <= d1Ceil; y++) {
        const isOuterRing =
          Math.abs(x) === 5 ||
          Math.abs(z) === 5 ||
          (Math.abs(x) === 4 && Math.abs(z) === 4);

        if (y === d1Floor) {
          world.setBlock(x, y, z, BLOCK_IDS.GOLD_FOIL, false);
        } else if (y === d1Ceil) {
          world.setBlock(x, y, z, BLOCK_IDS.NASA_HULL, false);
        } else if (isOuterRing) {
          if ((y === d1Floor + 2 || y === d1Floor + 3) && (Math.abs(x) <= 2 || Math.abs(z) <= 2)) {
            world.setBlock(x, y, z, BLOCK_IDS.HAB_GLASS, false);
          } else if (y === d1Floor + 1) {
            world.setBlock(x, y, z, BLOCK_IDS.GOLD_FOIL, false);
          } else {
            world.setBlock(x, y, z, BLOCK_IDS.NASA_HULL, false);
          }
        } else {
          world.setBlock(x, y, z, BLOCK_IDS.AIR, false);
        }
      }
    }
  }

  // Iluminação, Hidroponia e Consoles do Deck 1
  world.setBlock(0, d1Ceil, 0, BLOCK_IDS.HAB_LIGHT, false);
  world.setBlock(-3, d1Ceil, 0, BLOCK_IDS.HAB_LIGHT, false);
  world.setBlock(3, d1Ceil, 0, BLOCK_IDS.HAB_LIGHT, false);
  fillBox(world, -4, d1Floor + 1, -2, -4, d1Floor + 1, 2, BLOCK_IDS.HYDRO_PLANT);
  fillBox(world, 4, d1Floor + 1, -2, 4, d1Floor + 2, 1, BLOCK_IDS.CONSOLE_SCREEN);

  // Airlock e Rampa Sul
  fillBox(world, -2, d1Floor, 5, 2, d1Floor + 4, 7, BLOCK_IDS.NASA_HULL);
  fillBox(world, -1, d1Floor + 1, 5, 1, d1Floor + 3, 7, BLOCK_IDS.AIR);
  world.setBlock(0, d1Floor + 4, 6, BLOCK_IDS.HAB_LIGHT, false);

  for (let step = 0; step < 4; step++) {
    const sz = 11 - step;
    const sy = groundY + 1 + step;
    fillBox(world, -1, groundY + 1, sz, 1, sy, sz, BLOCK_IDS.THRUSTER_METAL);
    world.setBlock(-2, sy + 1, sz, BLOCK_IDS.GOLD_FOIL, false);
    world.setBlock(2, sy + 1, sz, BLOCK_IDS.GOLD_FOIL, false);
  }

  // Escada interna para o Deck 2
  fillBox(world, -1, d1Ceil, -3, 1, d1Ceil, -1, BLOCK_IDS.AIR);
  for (let s = 0; s < 5; s++) {
    world.setBlock(0, d1Floor + 1 + s, 1 - s, BLOCK_IDS.THRUSTER_METAL, false);
  }
}

function buildDeck2CockpitAndArrays(world, groundY) {
  const d1Ceil = groundY + 9;
  const d2Floor = d1Ceil;
  const d2Ceil = d1Ceil + 5;

  for (let x = -4; x <= 4; x++) {
    for (let z = -4; z <= 4; z++) {
      if (Math.abs(x) === 4 && Math.abs(z) === 4) continue;

      for (let y = d2Floor + 1; y <= d2Ceil; y++) {
        const isEdge =
          Math.abs(x) === 4 ||
          Math.abs(z) === 4 ||
          (Math.abs(x) === 3 && Math.abs(z) === 3);

        if (y === d2Ceil) {
          if (Math.abs(x) <= 2 && Math.abs(z) <= 2) {
            world.setBlock(x, y, z, BLOCK_IDS.HAB_GLASS, false);
          } else {
            world.setBlock(x, y, z, BLOCK_IDS.NASA_HULL, false);
          }
        } else if (isEdge) {
          if (y === d2Floor + 2 || y === d2Floor + 3) {
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

  fillBox(world, -2, d2Floor + 1, -3, 2, d2Floor + 1, -3, BLOCK_IDS.CONSOLE_SCREEN);
  world.setBlock(-2, d2Floor + 4, 0, BLOCK_IDS.HAB_LIGHT, false);
  world.setBlock(2, d2Floor + 4, 0, BLOCK_IDS.HAB_LIGHT, false);

  // Asas Solares Fotovoltaicas
  fillBox(world, -13, d1Ceil, -2, -6, d1Ceil, 2, BLOCK_IDS.SOLAR_PANEL);
  fillBox(world, -13, d1Ceil, 0, -6, d1Ceil, 0, BLOCK_IDS.THRUSTER_METAL);
  fillBox(world, 6, d1Ceil, -2, 13, d1Ceil, 2, BLOCK_IDS.SOLAR_PANEL);
  fillBox(world, 6, d1Ceil, 0, 13, d1Ceil, 0, BLOCK_IDS.THRUSTER_METAL);

  // Antena de Espaço Profundo apontada para a Terra
  fillBox(world, 0, d2Ceil + 1, 0, 0, d2Ceil + 6, 0, BLOCK_IDS.THRUSTER_METAL);
  world.setBlock(0, d2Ceil + 7, 0, BLOCK_IDS.RED_BEACON, false);
  fillBox(world, -1, d2Ceil + 4, -1, 1, d2Ceil + 5, -1, BLOCK_IDS.GOLD_FOIL);
}

function buildMarsRover(world, groundY) {
  const rx = 12;
  const rz = 9;
  world.setBlock(rx - 2, groundY + 1, rz - 1, BLOCK_IDS.THRUSTER_METAL, false);
  world.setBlock(rx + 2, groundY + 1, rz - 1, BLOCK_IDS.THRUSTER_METAL, false);
  world.setBlock(rx - 2, groundY + 1, rz + 1, BLOCK_IDS.THRUSTER_METAL, false);
  world.setBlock(rx + 2, groundY + 1, rz + 1, BLOCK_IDS.THRUSTER_METAL, false);
  fillBox(world, rx - 1, groundY + 2, rz - 1, rx + 1, groundY + 2, rz + 1, BLOCK_IDS.GOLD_FOIL);
  fillBox(world, rx - 1, groundY + 3, rz, rx, groundY + 3, rz + 1, BLOCK_IDS.SOLAR_PANEL);
  world.setBlock(rx + 1, groundY + 3, rz - 1, BLOCK_IDS.THRUSTER_METAL, false);
  world.setBlock(rx + 1, groundY + 4, rz - 1, BLOCK_IDS.CONSOLE_SCREEN, false);
}

export function buildNasaSpaceshipAndBase(world) {
  const groundY = WORLD_CONFIG.GROUND_LEVEL;
  buildLandingPadAndLegs(world, groundY);
  buildDeck1ScienceAndAirlock(world, groundY);
  buildDeck2CockpitAndArrays(world, groundY);
  buildMarsRover(world, groundY);
}
