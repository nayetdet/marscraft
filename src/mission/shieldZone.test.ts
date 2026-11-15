// @ts-nocheck
import { describe, it, expect } from 'vitest';
import { isInsideShieldZone, SHIELD_ZONE } from './shieldZone.ts';
import { EAST_WING, HABITAT_LAYOUT as L, NORTH_WING, northLinkBox } from '../world/habitatLayout.ts';
import { MAV_CONFIG, WATER_SYSTEM_CONFIG } from '../config/constants.ts';

const ROOF_Y = L.CEIL_Y + 1; // topo do telhado dos modulos

// Cantos externos (com a parede) de um volume de ar, na altura do telhado
function roofCorners({ xMin, xMax, zMin, zMax }, y = ROOF_Y) {
  const xs = [xMin - 1, xMax + 2];
  const zs = [zMin - 1, zMax + 2];
  return xs.flatMap((x) => zs.map((z) => ({ x, y, z })));
}

describe('isInsideShieldZone', () => {
  it.each([
    ['main habitat', { x: 0, y: 11, z: 0 }],
    ['cupola', { x: 0, y: L.CEIL_Y + L.CUPOLA_HEIGHT + 1, z: 0 }],
    ['greenhouse', { x: -18, y: 11, z: 0 }],
    ['ascent vehicle', { x: MAV_CONFIG.PAD_POSITION.x, y: 11, z: MAV_CONFIG.PAD_POSITION.z }],
    ['fuel plant', { x: MAV_CONFIG.PAD_POSITION.x + 4.6, y: 10, z: MAV_CONFIG.PAD_POSITION.z - 1.2 }],
    ['solar panels', { x: -27, y: 10, z: -23 }],
    ['ice depot', { x: 5.5, y: 10, z: 9.5 }],
    ['gym', { x: -8, y: 11, z: 10 }],
  ])('protects the %s', (_, pos) => {
    expect(isInsideShieldZone(pos)).toBe(true);
  });

  it('covers every module of the base up to its roof', () => {
    const boxes = [
      { xMin: L.MAIN_X_MIN, xMax: L.MAIN_X_MAX, zMin: L.MAIN_Z_MIN, zMax: L.MAIN_Z_MAX },
      { xMin: L.GYM_X_MIN, xMax: L.GYM_X_MAX, zMin: L.GYM_Z_MIN, zMax: L.GYM_Z_MAX },
      { xMin: L.TUNNEL_X_MIN, xMax: L.TUNNEL_X_MAX, zMin: -L.TUNNEL_HALF_Z, zMax: L.TUNNEL_HALF_Z },
      NORTH_WING.SPINE,
      ...NORTH_WING.ROOMS,
      ...NORTH_WING.ROOMS.map(northLinkBox),
      EAST_WING.ROOM,
      EAST_WING.LINK,
    ];
    const outside = boxes.flatMap((b) => roofCorners(b)).filter((p) => !isInsideShieldZone(p));
    expect(outside).toEqual([]);
  });

  it('covers the whole greenhouse dome', () => {
    const top = L.FLOOR_Y + L.DOME_RADIUS / L.DOME_Y_SQUASH;
    expect(isInsideShieldZone({ x: L.DOME_X, y: top, z: L.DOME_Z })).toBe(true);
    for (let a = 0; a < 32; a++) {
      const t = (a / 32) * Math.PI * 2;
      const rim = { x: L.DOME_X + L.DOME_RADIUS * Math.cos(t), y: L.FLOOR_Y, z: L.DOME_Z + L.DOME_RADIUS * Math.sin(t) };
      expect(isInsideShieldZone(rim)).toBe(true);
    }
  });

  it('covers the launch pad and the top of the rocket', () => {
    const { x, z } = MAV_CONFIG.PAD_POSITION;
    expect(isInsideShieldZone({ x, y: L.FLOOR_Y + 8.75, z })).toBe(true);
    for (const [dx, dz] of [[-3.6, -3.6], [-3.6, 3.6], [3.6, -3.6], [3.6, 3.6]]) {
      expect(isInsideShieldZone({ x: x + dx, y: L.FLOOR_Y, z: z + dz })).toBe(true);
    }
  });

  it('leaves the water ice outside, so mining in a storm stays risky', () => {
    const ice = WATER_SYSTEM_CONFIG.ICE_CRATER_CENTER;
    for (let a = 0; a < 16; a++) {
      const t = (a / 16) * Math.PI * 2;
      // Blocos de gelo ficam a ate 4.8 blocos do centro da cratera (terrainGenerator)
      expect(isInsideShieldZone({ x: ice.x + 4.8 * Math.cos(t), y: 9, z: ice.z + 4.8 * Math.sin(t) })).toBe(false);
    }
  });

  it.each([
    ['crater rim', { x: 0, y: 12, z: 45 }],
    ['high above the habitat', { x: 1, y: SHIELD_ZONE.DOMES[0].CENTER.y + SHIELD_ZONE.DOMES[0].RADIUS + 1, z: 1 }],
  ])('does not protect the %s', (_, pos) => {
    expect(isInsideShieldZone(pos)).toBe(false);
  });
});
