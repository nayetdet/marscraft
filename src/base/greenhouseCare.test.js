import { describe, expect, it } from 'vitest';
import { EARTH_CARDS, earthCard, growthChecks, plantsStalled } from './greenhouseCare.js';

const GOOD = { lightsOn: true, powered: true, cold: false, waterL: 40, thirsty: false, recovery: 0.98, contaminated: false };

describe('greenhouse care (issue #89)', () => {
  it('shows the 3 things plants need, all OK in a healthy greenhouse', () => {
    const checks = growthChecks(GOOD);
    expect(checks.map((c) => c.id)).toEqual(['light', 'water', 'dust']);
    expect(checks.every((c) => c.ok)).toBe(true);
    expect(checks[1].detail).toMatch(/98% recycled/);
    expect(plantsStalled(GOOD)).toBe(false);
  });

  it('says what is wrong and stalls the plants when one care is missing', () => {
    expect(growthChecks({ ...GOOD, lightsOn: false })[0]).toMatchObject({ ok: false, detail: 'Lights OFF in the power room' });
    expect(growthChecks({ ...GOOD, cold: true })[0].detail).toMatch(/heater/);
    expect(growthChecks({ ...GOOD, thirsty: true })[1].ok).toBe(false);
    expect(growthChecks({ ...GOOD, contaminated: true })[2].ok).toBe(false);
    expect(plantsStalled({ ...GOOD, powered: false })).toBe(true);
  });

  it('rotates at least 3 Mars-to-Earth cards, one per harvest', () => {
    expect(EARTH_CARDS.length).toBeGreaterThanOrEqual(3);
    const titles = new Set([1, 2, 3].map((n) => earthCard(n).lines[0].text));
    expect(titles.size).toBe(3);
    expect(earthCard(EARTH_CARDS.length + 1)).toBe(earthCard(1));
    for (const card of EARTH_CARDS) expect(card.source).toBeTruthy();
  });
});
