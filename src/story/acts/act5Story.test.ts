// @ts-nocheck
import { describe, expect, it } from 'vitest';
import { STORY_CONFIG } from '../../config/constants.ts';
import { FREE_PLAY_ACT, StoryDirector } from '../StoryDirector.ts';
import { objectiveView } from '../objectiveView.ts';
import { CARDS } from '../storyChapters.ts';
import { pixelIconSvg } from '../../ui/pixelIcons.ts';

// Ato 5 (#411): a corrida final, a segunda janela e o modo livre depois do Continue
const WINDOW = STORY_CONFIG.WINDOW_HOURS;
const START = 15;

const snap = (extra = {}) => ({
  hours: START, insideHabitat: true, iceCount: 0, iceNeeded: 5, stormPhase: 'calm', stormsSurvived: 0,
  propellantPct: 0, dataSent: false, launched: false, ...extra,
});

const cardTitles = (director) => director.drainEvents().filter((e) => e.type === 'card').map((e) => e.card.title);

// Diretor ja na corrida final (os passos guiados pulados, como no Demo Tools)
function racing() {
  const director = new StoryDirector();
  director.start(snap());
  director.update(snap());
  director.skipTraining();
  director.drainEvents();
  return director;
}

describe('act 5: the final run', () => {
  it('opens the launch window only when the guided steps end', () => {
    const director = new StoryDirector();
    director.start(snap());
    director.update(snap());
    expect(director.act).toBe(1);
    expect(director.windowHoursLeft).toBeNull();
    expect(objectiveView(director, snap()).timer).toBeNull();
  });

  it('goes straight to the final run with the window open when the tutorial is skipped', () => {
    const director = new StoryDirector();
    director.start(snap());
    director.update(snap());
    expect(director.skipTraining()).toBe(true);
    expect(director.act).toBe(2);
    expect(director.launchWindow).toBe(1);
    expect(director.windowHoursLeft).toBeCloseTo(WINDOW);
    const events = director.drainEvents();
    expect(events.some((e) => e.type === 'start-storms')).toBe(true);
    expect(events.filter((e) => e.type === 'card').map((e) => e.card.title)).toContain('FILL THE ROCKET');
    director.update(snap({ hours: START + 1 }));
    expect(objectiveView(director, snap({ hours: START + 1 })).timer.fill).toBeCloseTo((WINDOW - 1) / WINDOW);
  });

  it('opens the run with a card about ice, the rocket and the deadline only', () => {
    const text = CARDS.act2.lines.map((line) => line.text).join(' ');
    expect(text).toMatch(/ice/i);
    expect(text).toMatch(/rocket/i);
    expect(text).toMatch(/window/i);
    expect(text).not.toMatch(/clue|science/i); // a ciencia e do ato 4
  });

  it('keeps its cards short, for 7 to 12 year olds, with icons that exist', () => {
    for (const card of [CARDS.act2, CARDS.secondWindow, CARDS.freePlay]) {
      expect(card.lines.length, card.title).toBeLessThanOrEqual(5);
      for (const line of card.lines) {
        expect(line.text.split(' ').length, line.text).toBeLessThanOrEqual(8);
        expect(() => pixelIconSvg(line.icon), line.text).not.toThrow();
      }
    }
  });
});

describe('act 5: Continue after the window closed', () => {
  function closed() {
    const director = racing();
    director.update(snap({ hours: START + WINDOW + 0.5 }));
    expect(director.objectiveId).toBe('failed');
    expect(director.drainEvents().filter((e) => e.type === 'window-closed')).toHaveLength(1);
    return director;
  }

  it('does not reopen a window that is still open', () => {
    const director = racing();
    director.update(snap({ hours: START + 2 }));
    expect(director.reopenWindow(START + 2)).toBe(false);
    expect(director.launchWindow).toBe(1);
  });

  it('opens a whole new window in the same world', () => {
    const director = closed();
    const now = START + WINDOW + 0.5;
    expect(director.reopenWindow(now)).toBe(true);
    expect(director.act).toBe(2);
    expect(director.launchWindow).toBe(2);
    expect(director.windowHoursLeft).toBeCloseTo(WINDOW);
    expect(director.objectiveId).toBe('act2');
    expect(cardTitles(director)).toEqual(['A NEW LAUNCH WINDOW']);

    // A corrida volta a andar: o relogio conta de novo e o objetivo aponta para o que falta
    director.update(snap({ hours: now + 3 }));
    expect(director.windowHoursLeft).toBeCloseTo(WINDOW - 3);
    expect(director.objectiveId).toBe('fuel');
    expect(objectiveView(director, snap({ hours: now + 3 })).timer).not.toBeNull();
  });

  it('lets the child lift off in the second window', () => {
    const director = closed();
    const now = START + WINDOW + 0.5;
    director.reopenWindow(now);
    director.update(snap({ hours: now + 4, launched: true }));
    expect(director.objectiveId).toBe('done');
    expect(director.launchWindow).toBe(2);
    expect(director.windowHoursLeft).toBeCloseTo(WINDOW - 4);
  });

  it('closes the second window too, and a third one can open', () => {
    const director = closed();
    const now = START + WINDOW + 0.5;
    director.reopenWindow(now);
    director.drainEvents();
    director.update(snap({ hours: now + WINDOW + 1 }));
    expect(director.objectiveId).toBe('failed');
    expect(director.drainEvents().filter((e) => e.type === 'window-closed')).toHaveLength(1);
    expect(director.reopenWindow(now + WINDOW + 1)).toBe(true);
    expect(director.launchWindow).toBe(3);
  });
});

describe('act 5: free play after Continue on the victory screen', () => {
  function launched() {
    const director = racing();
    director.update(snap({ hours: START + 5, launched: true }));
    expect(director.objectiveId).toBe('done');
    return director;
  }

  it('is not available before liftoff', () => {
    const director = racing();
    director.update(snap({ hours: START + 1 }));
    expect(director.enterFreePlay()).toBe(false);
    expect(director.freePlay).toBe(false);
  });

  it('has no objective, no window and no deadline', () => {
    const director = launched();
    expect(director.enterFreePlay()).toBe(true);
    expect(director.act).toBe(FREE_PLAY_ACT);
    expect(director.freePlay).toBe(true);
    expect(director.inTraining).toBe(false);
    expect(director.windowHoursLeft).toBeNull();
    expect(director.objectiveId).toBeNull();
    expect(director.objectiveText).toBe('');
    expect(cardTitles(director)).toEqual(['FREE PLAY']);
    expect(objectiveView(director, snap({ launched: true }))).toBeNull();
  });

  it('never closes a window or guides again, however long the child plays', () => {
    const director = launched();
    director.enterFreePlay();
    director.drainEvents();
    director.update(snap({ hours: START + WINDOW * 10, launched: true, stormPhase: 'warning' }));
    expect(director.drainEvents()).toEqual([]);
    expect(director.objectiveId).toBeNull();
    expect(director.windowHoursLeft).toBeNull();
    expect(director.enterFreePlay()).toBe(false); // ja esta no modo livre
    expect(director.reopenWindow()).toBe(false);
  });

  it('starts in free play when a saved game had already lifted off', () => {
    // Partida reaberta: a historia nem comecou (act 0) e o save diz que o foguete ja decolou
    const director = new StoryDirector();
    expect(director.enterFreePlay()).toBe(true);
    expect(director.freePlay).toBe(true);
    director.start(snap()); // a chegada nao recomeca a historia
    expect(director.act).toBe(FREE_PLAY_ACT);
    director.update(snap({ launched: true }));
    expect(director.objectiveId).toBeNull();
    expect(director.skipTraining()).toBe(false);
    expect(director.freePlay).toBe(true);
  });
});
