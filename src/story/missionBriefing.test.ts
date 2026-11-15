import { describe, expect, it } from 'vitest';
import { hasPixelSprite } from '../ui/pixelSprites.ts';
import { BRIEFING_LIMITS, BRIEFING_SLIDES, BRIEFING_TAGLINE } from './missionBriefing.ts';

const words = (text: string) => text.trim().split(/\s+/).length;

describe('mission briefing', () => {
  it('keeps every slide short enough for a child to read fast', () => {
    expect(BRIEFING_SLIDES.length).toBeLessThanOrEqual(3);
    expect(words(BRIEFING_TAGLINE)).toBeLessThanOrEqual(BRIEFING_LIMITS.LINE_WORDS);
    for (const slide of BRIEFING_SLIDES) {
      expect(words(slide.word), slide.id).toBe(1);
      expect(words(slide.line), slide.id).toBeLessThanOrEqual(BRIEFING_LIMITS.LINE_WORDS);
      expect(slide.targets, slide.id).toHaveLength(BRIEFING_LIMITS.TARGETS);
      for (const target of slide.targets) {
        expect(target.label.length, `${slide.id}: ${target.label}`).toBeLessThanOrEqual(BRIEFING_LIMITS.LABEL_CHARS);
      }
    }
  });

  it('has a colored sprite for every drawing', () => {
    for (const slide of BRIEFING_SLIDES) {
      expect(hasPixelSprite(slide.source), `${slide.id}: ${slide.source}`).toBe(true);
      for (const target of slide.targets) expect(hasPixelSprite(target.art), `${slide.id}: ${target.art}`).toBe(true);
    }
  });

  it('never shows a free choice: a slide is all "pick one", or it has a cost', () => {
    for (const slide of BRIEFING_SLIDES) {
      const tones = slide.targets.map((target) => target.tone);
      const allPick = tones.every((tone) => tone === 'pick');
      expect(allPick || tones.includes('cost'), slide.id).toBe(true);
    }
  });

  it('uses unique slide ids and a valid accent color', () => {
    expect(new Set(BRIEFING_SLIDES.map((slide) => slide.id)).size).toBe(BRIEFING_SLIDES.length);
    for (const slide of BRIEFING_SLIDES) expect(slide.accent, slide.id).toMatch(/^#[0-9a-f]{6}$/);
  });
});
