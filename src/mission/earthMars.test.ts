// @ts-nocheck
import { describe, it, expect } from 'vitest';
import { earthMarsGeometry } from './earthMars.ts';

describe('Earth-Mars distance (JPL approximate positions)', () => {
  it('is close at opposition and far, behind the Sun, at conjunction', () => {
    // Oposicao de 16/01/2025: ~96 milhoes de km (~5,3 min de luz)
    const opposition = earthMarsGeometry(new Date('2025-01-16T00:00:00Z'));
    expect(opposition.distanceKm / 1e6).toBeGreaterThan(90);
    expect(opposition.distanceKm / 1e6).toBeLessThan(100);
    expect(opposition.sunAngleDeg).toBeGreaterThan(170);
    // Conjuncao solar de 09/01/2026: Marte atras do Sol, ~20 min de luz
    const conjunction = earthMarsGeometry(new Date('2026-01-09T00:00:00Z'));
    expect(conjunction.lightMinutes).toBeGreaterThan(19);
    expect(conjunction.sunAngleDeg).toBeLessThan(2);
  });
});
