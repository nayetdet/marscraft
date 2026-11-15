import { describe, it, expect } from 'vitest';
import { RADIATION_CONFIG, STORM_CONFIG } from '../config/constants.js';
import { BASE_DOSE_MSV_PER_HOUR, doseRateMsvPerHour, radiationDamage, shelterDoseFactor, uGyToMsv } from './radiation.js';

// Dose por hora de jogo, la fora, da tempestade mais fraca e da mais forte do jogo
const WEAKEST = RADIATION_CONFIG.STORM_DOSE_MIN_UGY / STORM_CONFIG.DURATION_HOURS;
const STRONGEST = RADIATION_CONFIG.STORM_DOSE_MAX_UGY / STORM_CONFIG.DURATION_HOURS;
const STORM = 1800; // uma tempestade forte, em uGy por hora de jogo

describe('radiation', () => {
  it('base dose comes from Curiosity RAD (6.93 uGy/h x quality factor 3.05)', () => {
    expect(BASE_DOSE_MSV_PER_HOUR).toBeCloseTo(0.0211, 4);
    expect(uGyToMsv(1000)).toBeCloseTo(3.05);
    expect(doseRateMsvPerHour()).toBeCloseTo(BASE_DOSE_MSV_PER_HOUR);
  });

  it('a storm replaces the normal dose with the dose of its particles', () => {
    expect(doseRateMsvPerHour({ stormDoseUGyPerHour: STORM })).toBeCloseTo(uGyToMsv(STORM));
  });

  it('habitat and shield each cut the dose', () => {
    const outside = doseRateMsvPerHour({ stormDoseUGyPerHour: STORM });
    const inside = doseRateMsvPerHour({ stormDoseUGyPerHour: STORM, insideHabitat: true });
    const insideShielded = doseRateMsvPerHour({ stormDoseUGyPerHour: STORM, insideHabitat: true, shieldOn: true });
    expect(inside).toBeLessThan(outside);
    expect(insideShielded).toBeLessThan(inside);
  });

  it('normal Mars radiation does not hurt, an unshielded storm outside does', () => {
    expect(radiationDamage(doseRateMsvPerHour(), 10)).toBe(0);
    const stormOutside = doseRateMsvPerHour({ stormDoseUGyPerHour: STORM });
    expect(radiationDamage(stormOutside, 1)).toBeGreaterThan(0);
    const stormInsideShielded = doseRateMsvPerHour({ stormDoseUGyPerHour: STORM, insideHabitat: true, shieldOn: true });
    expect(radiationDamage(stormInsideShielded, 1)).toBe(0);
  });
});

describe('storm balance (issue #99, game rules)', () => {
  const hurts = (options) => radiationDamage(doseRateMsvPerHour(options), 1) > 0;

  it('every storm hurts outside without protection, even the weakest', () => {
    expect(hurts({ stormDoseUGyPerHour: WEAKEST })).toBe(true);
    expect(hurts({ stormDoseUGyPerHour: STRONGEST })).toBe(true);
  });

  it('the habitat alone protects only in part: fine in a weak storm, not in a strong one', () => {
    expect(hurts({ stormDoseUGyPerHour: WEAKEST, insideHabitat: true })).toBe(false);
    expect(hurts({ stormDoseUGyPerHour: STRONGEST, insideHabitat: true })).toBe(true);
  });

  it('the shelter with a full water wall and the shield inside the habitat are safe in any storm', () => {
    const fullWall = RADIATION_CONFIG.SHELTER_WALL_MAX_L;
    expect(hurts({ stormDoseUGyPerHour: STRONGEST, insideHabitat: true, shelterWaterL: fullWall })).toBe(false);
    expect(hurts({ stormDoseUGyPerHour: STRONGEST, insideHabitat: true, shieldOn: true })).toBe(false);
  });

  it('the strongest storm is deadly outside well before it ends', () => {
    const damagePerHour = radiationDamage(doseRateMsvPerHour({ stormDoseUGyPerHour: STRONGEST }), 1);
    expect(damagePerHour * STORM_CONFIG.DURATION_HOURS).toBeGreaterThan(20); // vida cheia = 20
  });
});

describe('storm shelter water wall', () => {
  it('blocks more radiation with more water and needs water to help at all', () => {
    expect(shelterDoseFactor(0)).toBe(1);
    expect(shelterDoseFactor(4)).toBeCloseTo(0.58);
    expect(shelterDoseFactor(40)).toBeCloseTo(0.17);
    const inside = doseRateMsvPerHour({ stormDoseUGyPerHour: STORM, insideHabitat: true });
    const sheltered = doseRateMsvPerHour({ stormDoseUGyPerHour: STORM, insideHabitat: true, shelterWaterL: 40 });
    expect(sheltered).toBeLessThan(inside * 0.2);
  });
});
