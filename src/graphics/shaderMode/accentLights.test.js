import { describe, expect, it } from 'vitest';
import { isInsidePressurizedVolume } from '../../world/habitatLayout.js';
import { ACCENT_LIGHTS, accentIntensity } from './accentLights.js';

describe('accentIntensity', () => {
  it('keeps a fixed light at its base intensity', () => {
    const light = { intensity: 7, pulse: 0, speed: 0 };
    expect(accentIntensity(light, 0)).toBe(7);
    expect(accentIntensity(light, 123.4)).toBe(7);
  });

  it('pulses between (1 - pulse) and 1 times the base intensity', () => {
    const light = { intensity: 10, pulse: 0.5, speed: 2 };
    let min = Infinity;
    let max = -Infinity;
    for (let t = 0; t < 10; t += 0.01) {
      const value = accentIntensity(light, t);
      min = Math.min(min, value);
      max = Math.max(max, value);
    }
    expect(max).toBeCloseTo(10, 2);
    expect(min).toBeCloseTo(5, 2);
  });
});

describe('ACCENT_LIGHTS', () => {
  const byId = Object.fromEntries(ACCENT_LIGHTS.map((light) => [light.id, light]));

  it('has unique ids and sane numbers', () => {
    expect(Object.keys(byId)).toHaveLength(ACCENT_LIGHTS.length);
    for (const light of ACCENT_LIGHTS) {
      expect(light.intensity).toBeGreaterThan(0);
      expect(light.distance).toBeGreaterThan(0);
      expect(light.pulse).toBeGreaterThanOrEqual(0);
      expect(light.pulse).toBeLessThan(1);
      expect(light.pos).toHaveLength(3);
    }
  });

  it('keeps the indoor lights inside the base and the outdoor ones outside', () => {
    expect(isInsidePressurizedVolume(...byId.console.pos)).toBe(true);
    expect(isInsidePressurizedVolume(...byId.grow.pos)).toBe(true);
    expect(isInsidePressurizedVolume(...byId.airlock.pos)).toBe(false);
    expect(isInsidePressurizedVolume(...byId.pad.pos)).toBe(false);
  });
});
