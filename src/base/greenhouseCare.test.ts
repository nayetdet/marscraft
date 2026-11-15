// @ts-nocheck
import { describe, expect, it } from 'vitest';
import { pixelIconSvg } from '../ui/pixelIcons.ts';
import { EARTH_CARDS, EARTH_FACT_TITLE, EarthFacts, earthFactLogText, earthFactView, growthChecks, plantsStalled } from './greenhouseCare.ts';

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

  it('keeps a sourced Mars-to-Earth fact for each crop, plus a bonus', () => {
    expect(EARTH_CARDS.map((c) => c.crop)).toEqual(['lettuce', 'potato', 'soy', null]);
    for (const card of EARTH_CARDS) {
      expect(card.source).toBeTruthy();
      for (const line of card.lines) {
        expect(pixelIconSvg(line.icon)).toContain('<rect');
        expect(['mars', 'earth', 'space']).toContain(line.side);
      }
      expect(earthFactView(card)).toEqual({ title: EARTH_FACT_TITLE, reason: card.reason, lines: card.lines, source: card.source });
      expect(earthFactLogText(card)).toContain(card.lines[0].text);
      expect(earthFactLogText(card)).toContain(card.source);
    }
  });
});

describe('space science on Earth facts as a discovery reward (issue #216)', () => {
  it('rewards only the first player harvest of each crop', () => {
    const facts = new EarthFacts();
    expect(facts.onPlayerHarvest('lettuce').id).toBe('lettuce');
    expect(facts.onPlayerHarvest('lettuce')).toBeNull();
    expect(facts.onPlayerHarvest('lettuce')).toBeNull();
    expect(facts.onPlayerHarvest('potato').id).toBe('potato');
    expect(facts.onPlayerHarvest('potato')).toBeNull();
  });

  it('gives the bonus fact on the harvest after every crop was grown, then nothing more', () => {
    const facts = new EarthFacts();
    const shown = ['lettuce', 'potato', 'soy'].map((type) => facts.onPlayerHarvest(type).id);
    expect(shown).toEqual(['lettuce', 'potato', 'soy']);
    expect(facts.onPlayerHarvest('soy').id).toBe('bonus');
    for (let i = 0; i < 20; i++) {
      for (const type of ['lettuce', 'potato', 'soy']) expect(facts.onPlayerHarvest(type)).toBeNull();
    }
    expect(facts.seen.size).toBe(EARTH_CARDS.length);
  });

  it('never repeats a fact in the same game', () => {
    const facts = new EarthFacts();
    const ids = [];
    for (let i = 0; i < 30; i++) {
      const card = facts.onPlayerHarvest(['soy', 'lettuce', 'potato'][i % 3]);
      if (card) ids.push(card.id);
    }
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toHaveLength(EARTH_CARDS.length);
  });

  it('ignores a crop it does not know', () => {
    expect(new EarthFacts().onPlayerHarvest('wheat')).toBeNull();
  });
});
