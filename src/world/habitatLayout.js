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
    inGreenhouseDome(bx, by, bz)
  );
}
