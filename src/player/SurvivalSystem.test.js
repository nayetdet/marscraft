import { describe, it, expect } from 'vitest';
import { SurvivalSystem } from './SurvivalSystem.js';

describe('SurvivalSystem', () => {
  it('detects player inside Main White Habitat, Pressurized Tunnel, and Greenhouse Dome', () => {
    const survival = new SurvivalSystem();

    // Dentro do Módulo Principal Branco
    expect(survival.isPlayerInsideShip({ x: 0, y: 11.7, z: 0 })).toBe(true);

    // Dentro do Túnel Pressurizado de Conexão
    expect(survival.isPlayerInsideShip({ x: -10, y: 11.7, z: 0 })).toBe(true);

    // Dentro da Redoma de Estufa (x = -18, z = 0)
    expect(survival.isPlayerInsideShip({ x: -18, y: 11.7, z: 2 })).toBe(true);

    // Fora na superfície marciana
    expect(survival.isPlayerInsideShip({ x: 0, y: 11.7, z: 24 })).toBe(false);
  });

  it('drains oxygen outside and refills oxygen inside the pressurized base', () => {
    const survival = new SurvivalSystem();

    survival.update(5.0, { x: 0, y: 11.7, z: 25 });
    const afterOutside = survival.oxygen;
    expect(afterOutside).toBeLessThan(survival.maxStat);

    survival.update(2.0, { x: -18, y: 11.7, z: 0 });
    expect(survival.oxygen).toBeGreaterThan(afterOutside);
  });
});
