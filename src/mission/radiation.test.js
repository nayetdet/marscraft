import { describe, it, expect } from 'vitest';
import { BASE_DOSE_MSV_PER_HOUR, doseRateMsvPerHour, radiationDamage } from './radiation.js';

describe('radiation', () => {
  it('base dose comes from Curiosity RAD (6.93 uGy/h x quality factor 3.05)', () => {
    expect(BASE_DOSE_MSV_PER_HOUR).toBeCloseTo(0.0211, 4);
  });

  it('habitat and shield each cut the dose', () => {
    const outside = doseRateMsvPerHour({ stormMultiplier: 900 });
    const inside = doseRateMsvPerHour({ stormMultiplier: 900, insideHabitat: true });
    const insideShielded = doseRateMsvPerHour({ stormMultiplier: 900, insideHabitat: true, shieldOn: true });
    expect(inside).toBeLessThan(outside);
    expect(insideShielded).toBeLessThan(inside);
  });

  it('normal Mars radiation does not hurt, an unshielded storm outside does', () => {
    expect(radiationDamage(doseRateMsvPerHour(), 10)).toBe(0);
    const stormOutside = doseRateMsvPerHour({ stormMultiplier: 900 });
    expect(radiationDamage(stormOutside, 1)).toBeGreaterThan(0);
    const stormInsideShielded = doseRateMsvPerHour({ stormMultiplier: 900, insideHabitat: true, shieldOn: true });
    expect(radiationDamage(stormInsideShielded, 1)).toBe(0);
  });
});

describe('storm shelter', () => {
  it('keeps even the fastest storm below the harm threshold, but only inside the habitat', () => {
    const fastest = { stormMultiplier: 1000 };
    const inHabitat = doseRateMsvPerHour({ ...fastest, insideHabitat: true });
    const inShelter = doseRateMsvPerHour({ ...fastest, insideHabitat: true, insideShelter: true });
    expect(radiationDamage(inHabitat, 1)).toBeGreaterThan(0);
    expect(radiationDamage(inShelter, 1)).toBe(0);
    expect(doseRateMsvPerHour({ ...fastest, insideShelter: true })).toBe(doseRateMsvPerHour(fastest));
  });
});
