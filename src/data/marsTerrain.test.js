import { describe, it, expect } from 'vitest';
import terrain from './marsTerrain.json';
import { MARS_TERRAIN, formatCoords, terrainOffset } from './marsTerrain.js';
import { TERRAIN_CONFIG, WORLD_CONFIG } from '../config/constants.js';

const HALF = WORLD_CONFIG.SIZE_X / 2;
const { BASE_CENTER, BASE_FLAT_RADIUS } = TERRAIN_CONFIG;

describe('real Mars terrain (HiRISE)', () => {
  it('embeds one height per world column, with source and collection date', () => {
    expect(terrain.size).toBe(WORLD_CONFIG.SIZE_X);
    expect(terrain.size).toBe(WORLD_CONFIG.SIZE_Z);
    expect(atob(terrain.heights).length).toBe(terrain.size * terrain.size);
    expect(terrain.product).toMatch(/^DTEEC_/);
    expect(terrain.fetched).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(MARS_TERRAIN.product).toBe(terrain.product);
    expect(MARS_TERRAIN.fetched).toBe(terrain.fetched);
  });

  // Valores lidos direto do arquivo da NASA em 14/11/2026, com leste = +x e norte = -z.
  // Se a orientacao do recorte inverter, estes pontos deixam de bater.
  it('matches spot heights read from the NASA file', () => {
    for (const [x, z, meters] of [[64, 64, 5.03], [96, 8, 4.83], [-70, -60, 5.13], [100, -40, 7.02], [70, -70, 8.26]]) {
      expect(Math.abs(terrainOffset(x, z) - meters)).toBeLessThan(0.15);
    }
  });

  it('is level on average under the base, with little to cut or fill', () => {
    let sum = 0;
    let count = 0;
    let worst = 0;
    for (let x = -HALF; x < HALF; x += 1) {
      for (let z = -HALF; z < HALF; z += 1) {
        if (Math.hypot(x - BASE_CENTER.x, z - BASE_CENTER.z) >= BASE_FLAT_RADIUS) continue;
        const offset = terrainOffset(x, z);
        sum += offset;
        count += 1;
        worst = Math.max(worst, Math.abs(offset));
      }
    }
    expect(Math.abs(sum / count)).toBeLessThan(0.01);
    expect(worst).toBeLessThan(3);
  });

  it('has a crater rim at least 4 m above the base in 8 directions', () => {
    for (let dir = 0; dir < 8; dir += 1) {
      const angle = (dir * Math.PI) / 4;
      let highest = -Infinity;
      for (let d = 40; d < 110; d += 1) {
        highest = Math.max(highest, terrainOffset(Math.round(BASE_CENTER.x + Math.cos(angle) * d), Math.round(BASE_CENTER.z + Math.sin(angle) * d)));
      }
      expect(highest).toBeGreaterThan(4);
    }
  });

  it('keeps the whole world between -3 m and +14 m, and clamps outside it', () => {
    let lowest = Infinity;
    let highest = -Infinity;
    for (let x = -HALF; x < HALF; x += 1) {
      for (let z = -HALF; z < HALF; z += 1) {
        const offset = terrainOffset(x, z);
        lowest = Math.min(lowest, offset);
        highest = Math.max(highest, offset);
      }
    }
    expect(lowest).toBeGreaterThan(-3);
    expect(highest).toBeLessThan(14);
    expect(terrainOffset(HALF + 50, 0)).toBe(terrainOffset(HALF - 1, 0));
  });

  it('formats coordinates for the UI', () => {
    expect(formatCoords(-4.474328, 137.403232)).toBe('4.47 S, 137.40 E');
    expect(formatCoords(18.4447, 77.4509)).toBe('18.44 N, 77.45 E');
  });
});
