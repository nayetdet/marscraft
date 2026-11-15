import { describe, expect, it } from 'vitest';
import { STORY_CONFIG } from '../config/constants.ts';
import { CARDS } from '../story/storyChapters.ts';
import { TUTORIAL_STEPS } from '../story/tutorialSteps.ts';
import { typedChars } from './typewriter.ts';

describe('typedChars', () => {
  it('starts empty and types at the given speed', () => {
    expect(typedChars(0, 40, 50, 1.2)).toBe(0);
    expect(typedChars(0.1, 40, 50, 1.2)).toBe(5);
    expect(typedChars(0.5, 40, 50, 1.2)).toBe(25);
  });

  it('stops at the full text', () => {
    expect(typedChars(0.8, 40, 50, 1.2)).toBe(40);
    expect(typedChars(60, 40, 50, 1.2)).toBe(40);
    expect(typedChars(1, 0, 50, 1.2)).toBe(0);
  });

  it('speeds up long text so a card never takes longer than the cap', () => {
    expect(typedChars(1.2, 300, 50, 1.2)).toBe(300);
    expect(typedChars(0.6, 300, 50, 1.2)).toBe(150);
  });

  it('is fast for kids: 40 to 60 letters a second, and every card done in under 1.5 s', () => {
    const { CARD_TYPE_CHARS_PER_SECOND: speed, CARD_TYPE_MAX_SECONDS: cap } = STORY_CONFIG;
    expect(speed).toBeGreaterThanOrEqual(40);
    expect(speed).toBeLessThanOrEqual(60);
    expect(cap).toBeLessThanOrEqual(1.5);
    const cards: { lines?: { text: string }[] }[] = [...Object.values(CARDS), ...TUTORIAL_STEPS];
    for (const card of cards) {
      const total = (card.lines ?? []).reduce((sum, line) => sum + line.text.length, 0);
      expect(typedChars(cap, total, speed, cap)).toBe(total);
    }
  });
});
