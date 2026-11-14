import { WORLD_CONFIG } from '../config/constants.js';

// Geometria interna da base construida em nasaSpaceshipBuilder.js, em coordenadas de bloco.
// O teste habitatLayout.test.js constroi a base de verdade e confere que todo volume
// marcado como pressurizado aqui e ar no mundo, para os dois arquivos nao dessincronizarem.
const FLOOR_Y = WORLD_CONFIG.GROUND_LEVEL + 1; // piso do habitat, tunel e estufa (y = 9)
const CEIL_Y = WORLD_CONFIG.GROUND_LEVEL + 6; // teto do habitat principal (y = 14)

export const HABITAT_LAYOUT = {
  FLOOR_Y,
  CEIL_Y,
  // Habitat principal: ar em x = -6..12, z = -11..5; paredes um bloco para fora, com os quatro
  // cantos chanfrados (ver mainHabCell). O airlock, o tunel e a cupula ficam perto de x = 0, z = 0.
  MAIN_X_MIN: -6,
  MAIN_X_MAX: 12,
  MAIN_Z_MIN: -11,
  MAIN_Z_MAX: 5,
  // Airlock sul: corredor de ar |x| <= 1, z = 6..8, tres blocos de altura.
  AIRLOCK_HALF_X: 1,
  AIRLOCK_Z_MIN: 6,
  AIRLOCK_Z_MAX: 8,
  AIRLOCK_HEIGHT: 3,
  // Cupula de observacao sobre o teto: ar em |x|, |z| <= 2, y = 15..17.
  CUPOLA_HALF: 2,
  CUPOLA_HEIGHT: 3,
  // Tunel ate a estufa: ar em x = -14..-7, |z| <= 2 (cinco blocos de largura), tres de altura.
  TUNNEL_X_MIN: -14,
  TUNNEL_X_MAX: -7,
  TUNNEL_HALF_Z: 2,
  TUNNEL_HEIGHT: 3,
  // Redoma da estufa: hemisferio levemente achatado (dy * 1.05) com casca de 0.65 bloco.
  DOME_X: -27,
  DOME_Z: 0,
  DOME_RADIUS: 14,
  DOME_SHELL: 0.65,
  DOME_Y_SQUASH: 1.05,
  // Corredor pressurizado Sudoeste ate o Modulo da Academia: ar em x = -6..-5, z = 5..7, y = 10..13.
  GYM_CORRIDOR_X_MIN: -6,
  GYM_CORRIDOR_X_MAX: -5,
  GYM_CORRIDOR_Z_MIN: 5,
  GYM_CORRIDOR_Z_MAX: 7,
  // Modulo da Academia (Gym & MedBay): paredes em x = -12 e -4, z = 7 e 13; ar em x = -11..-5, z = 8..12, y = 10..13.
  GYM_X_MIN: -11,
  GYM_X_MAX: -5,
  GYM_Z_MIN: 8,
  GYM_Z_MAX: 12,
  // Abrigo de tempestade (issue #56): cabine aberta para oeste no canto sudeste do habitat,
  // entre a bancada do laboratorio e o airlock. Coordenadas do mundo (nao de bloco).
  SHELTER_X_MIN: 2.85,
  SHELTER_X_MAX: 5.75,
  SHELTER_Z_MIN: 3.85,
  SHELTER_Z_MAX: 5.8,
};

// Ala norte (issue #56, ampliada): um corredor central com janelas sai da parede norte do
// habitat e liga quatro modulos separados, cada um com a sua funcao. Entre eles fica Marte.
// Coordenadas de bloco do AR de cada volume (as paredes ficam um bloco para fora).
// `door` = faixa em z do corredor curto que liga o modulo ao corredor central.
export const NORTH_WING = {
  // Corredor central com 4 blocos de largura; corredores curtos com 4 de largura e 4 de comprimento
  SPINE: { xMin: -4, xMax: -1, zMin: -37, zMax: -12 },
  ROOMS: [
    { id: 'power', name: 'POWER & HEAT', side: 'west', xMin: -21, xMax: -11, zMin: -25, zMax: -17, door: [-23, -20] },
    { id: 'kitchen', name: 'KITCHEN', side: 'east', xMin: 6, xMax: 16, zMin: -25, zMax: -17, door: [-23, -20] },
    { id: 'bathroom', name: 'BATHROOM', side: 'west', xMin: -21, xMax: -11, zMin: -39, zMax: -31, door: [-37, -34] },
    { id: 'workshop', name: 'WORKSHOP', side: 'east', xMin: 6, xMax: 16, zMin: -39, zMax: -31, door: [-37, -34] },
  ],
  // Altura livre dos corredores curtos (3 blocos): sobra parede em cima para a placa da sala
  LINK_HEIGHT: 3,
};

// Ar do corredor curto de um modulo: vai da parede do corredor central ate a parede do modulo
export function northLinkBox(room) {
  const { SPINE } = NORTH_WING;
  return room.side === 'west'
    ? { xMin: room.xMax + 1, xMax: SPINE.xMin - 1, zMin: room.door[0], zMax: room.door[1] }
    : { xMin: SPINE.xMax + 1, xMax: room.xMin - 1, zMin: room.door[0], zMax: room.door[1] };
}

const L = HABITAT_LAYOUT;

// Planta do piso da estufa, em blocos a partir do centro da redoma (dx, dz):
// 'ring' (fundacao), 'plaza' (praca central), 'walk' (cruz de 5 blocos, anel de caminhada e
// borda) e 'field' (bandejas de cultivo de cenario, em dois aneis). Os canteiros de terra onde
// se planta de verdade ficam em greenhouseLayout.js (isGreenhouseBed).
export function domeFloorCell(dx, dz) {
  const r = Math.hypot(dx, dz);
  if (r > L.DOME_RADIUS - 0.8) return 'ring';
  if (r < 4.5) return 'plaza';
  if (Math.abs(dx) <= 2 || Math.abs(dz) <= 2) return 'walk';
  if (r < 7.5) return 'field';
  if (r < 8.8) return 'walk';
  return r <= L.DOME_RADIUS - 1.9 ? 'field' : 'walk';
}

// Diz se a coluna (bx, bz) do habitat principal e 'air', 'wall' ou nada (null).
// Regra dos cantos: a 1 passo do canto fica fora, a 2 passos e parede (octogono alongado).
export function mainHabCell(bx, bz) {
  const cx = Math.min(bx - (L.MAIN_X_MIN - 1), L.MAIN_X_MAX + 1 - bx);
  const cz = Math.min(bz - (L.MAIN_Z_MIN - 1), L.MAIN_Z_MAX + 1 - bz);
  if (cx < 0 || cz < 0 || cx + cz < 2) return null;
  return cx === 0 || cz === 0 || cx + cz === 2 ? 'wall' : 'air';
}

function inMainHab(bx, by, bz) {
  if (by <= L.FLOOR_Y || by >= L.CEIL_Y) return false;
  return mainHabCell(bx, bz) === 'air';
}

function inAirlock(bx, by, bz) {
  return (
    Math.abs(bx) <= L.AIRLOCK_HALF_X &&
    bz >= L.AIRLOCK_Z_MIN &&
    bz <= L.AIRLOCK_Z_MAX &&
    by > L.FLOOR_Y &&
    by <= L.FLOOR_Y + L.AIRLOCK_HEIGHT
  );
}

function inCupola(bx, by, bz) {
  return (
    Math.abs(bx) <= L.CUPOLA_HALF &&
    Math.abs(bz) <= L.CUPOLA_HALF &&
    by > L.CEIL_Y &&
    by <= L.CEIL_Y + L.CUPOLA_HEIGHT
  );
}

function inTunnel(bx, by, bz) {
  return (
    bx >= L.TUNNEL_X_MIN &&
    bx <= L.TUNNEL_X_MAX &&
    Math.abs(bz) <= L.TUNNEL_HALF_Z &&
    by > L.FLOOR_Y &&
    by <= L.FLOOR_Y + L.TUNNEL_HEIGHT
  );
}

function inGreenhouseDome(bx, by, bz) {
  const dy = by - L.FLOOR_Y;
  if (dy < 1) return false;
  const dist = Math.hypot(bx - L.DOME_X, dy * L.DOME_Y_SQUASH, bz - L.DOME_Z);
  return dist < L.DOME_RADIUS - L.DOME_SHELL;
}

function inGymCorridor(bx, by, bz) {
  return (
    bx >= L.GYM_CORRIDOR_X_MIN &&
    bx <= L.GYM_CORRIDOR_X_MAX &&
    bz >= L.GYM_CORRIDOR_Z_MIN &&
    bz <= L.GYM_CORRIDOR_Z_MAX &&
    by > L.FLOOR_Y &&
    by < L.CEIL_Y
  );
}

function inGymModule(bx, by, bz) {
  return (
    bx >= L.GYM_X_MIN &&
    bx <= L.GYM_X_MAX &&
    bz >= L.GYM_Z_MIN &&
    bz <= L.GYM_Z_MAX &&
    by > L.FLOOR_Y &&
    by < L.CEIL_Y
  );
}

function inBox(bx, by, bz, xMin, xMax, zMin, zMax) {
  return bx >= xMin && bx <= xMax && bz >= zMin && bz <= zMax && by > L.FLOOR_Y && by < L.CEIL_Y;
}

function inNorthWing(bx, by, bz) {
  const { SPINE, ROOMS, LINK_HEIGHT } = NORTH_WING;
  if (inBox(bx, by, bz, SPINE.xMin, SPINE.xMax, SPINE.zMin, SPINE.zMax)) return true;
  for (const room of ROOMS) {
    if (inBox(bx, by, bz, room.xMin, room.xMax, room.zMin, room.zMax)) return true;
    const link = northLinkBox(room);
    if (by <= L.FLOOR_Y + LINK_HEIGHT && inBox(bx, by, bz, link.xMin, link.xMax, link.zMin, link.zMax)) return true;
  }
  return false;
}

// Recebe a posicao dos olhos do jogador e diz se ela esta num bloco de ar pressurizado.
export function isInsidePressurizedVolume(x, y, z) {
  const bx = Math.floor(x);
  const by = Math.floor(y);
  const bz = Math.floor(z);
  return (
    inMainHab(bx, by, bz) ||
    inAirlock(bx, by, bz) ||
    inCupola(bx, by, bz) ||
    inTunnel(bx, by, bz) ||
    inGreenhouseDome(bx, by, bz) ||
    inGymCorridor(bx, by, bz) ||
    inGymModule(bx, by, bz) ||
    inNorthWing(bx, by, bz)
  );
}

// Posicao do jogador (pes ou olhos) dentro da cabine do abrigo de tempestade.
export function isInsideShelter(x, z) {
  return x > L.SHELTER_X_MIN && x < L.SHELTER_X_MAX && z > L.SHELTER_Z_MIN && z < L.SHELTER_Z_MAX;
}
