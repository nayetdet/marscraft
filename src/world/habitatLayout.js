import { WORLD_CONFIG } from '../config/constants.js';

// Geometria interna da base construida em nasaSpaceshipBuilder.js, em coordenadas de bloco.
// O teste habitatLayout.test.js constroi a base de verdade e confere que todo volume
// marcado como pressurizado aqui e ar no mundo, para os dois arquivos nao dessincronizarem.
const FLOOR_Y = WORLD_CONFIG.GROUND_LEVEL + 1; // piso do habitat, tunel e estufa (y = 9)
const CEIL_Y = WORLD_CONFIG.GROUND_LEVEL + 6; // teto do habitat principal (y = 14)

export const HABITAT_LAYOUT = {
  FLOOR_Y,
  CEIL_Y,
  // Habitat principal: paredes em |x| = 7, |z| = 6 e nos cantos chanfrados |x| + |z| = 11.
  MAIN_HALF_X: 7,
  MAIN_HALF_Z: 6,
  MAIN_CHAMFER: 11,
  // Airlock sul: corredor de ar |x| <= 1, z = 6..8, tres blocos de altura.
  AIRLOCK_HALF_X: 1,
  AIRLOCK_Z_MIN: 6,
  AIRLOCK_Z_MAX: 8,
  AIRLOCK_HEIGHT: 3,
  // Cupula de observacao sobre o teto: ar em |x|, |z| <= 2, y = 15..17.
  CUPOLA_HALF: 2,
  CUPOLA_HEIGHT: 3,
  // Tunel ate a estufa: ar em x = -12..-7, |z| <= 1, tres blocos de altura.
  TUNNEL_X_MIN: -12,
  TUNNEL_X_MAX: -7,
  TUNNEL_HALF_Z: 1,
  TUNNEL_HEIGHT: 3,
  // Redoma da estufa: hemisferio levemente achatado (dy * 1.05) com casca de 0.65 bloco.
  DOME_X: -18,
  DOME_Z: 0,
  DOME_RADIUS: 7,
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
  // Corredor norte (issue #56): sai da parede norte do habitat entre os beliches e o console.
  // Ar em x = -3..-2, z = -10..-6 (atravessa as paredes z = -6 do habitat e z = -10 do modulo).
  NORTH_CORRIDOR_X_MIN: -3,
  NORTH_CORRIDOR_X_MAX: -2,
  NORTH_CORRIDOR_Z_MIN: -10,
  NORTH_CORRIDOR_Z_MAX: -6,
  // Modulo norte (energia, cozinha, banheiro, oficina): paredes em x = -12 e 8, z = -21 e -10;
  // ar em x = -11..7, z = -20..-11.
  NORTH_X_MIN: -11,
  NORTH_X_MAX: 7,
  NORTH_Z_MIN: -20,
  NORTH_Z_MAX: -11,
};

const L = HABITAT_LAYOUT;

function inMainHab(bx, by, bz) {
  if (by <= L.FLOOR_Y || by >= L.CEIL_Y) return false;
  const ax = Math.abs(bx);
  const az = Math.abs(bz);
  return ax < L.MAIN_HALF_X && az < L.MAIN_HALF_Z && ax + az < L.MAIN_CHAMFER;
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

function inNorthCorridor(bx, by, bz) {
  return inBox(bx, by, bz, L.NORTH_CORRIDOR_X_MIN, L.NORTH_CORRIDOR_X_MAX, L.NORTH_CORRIDOR_Z_MIN, L.NORTH_CORRIDOR_Z_MAX);
}

function inNorthModule(bx, by, bz) {
  return inBox(bx, by, bz, L.NORTH_X_MIN, L.NORTH_X_MAX, L.NORTH_Z_MIN, L.NORTH_Z_MAX);
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
    inNorthCorridor(bx, by, bz) ||
    inNorthModule(bx, by, bz)
  );
}

// Posicao do jogador (pes ou olhos) dentro da cabine do abrigo de tempestade.
export function isInsideShelter(x, z) {
  return x > L.SHELTER_X_MIN && x < L.SHELTER_X_MAX && z > L.SHELTER_Z_MIN && z < L.SHELTER_Z_MAX;
}
