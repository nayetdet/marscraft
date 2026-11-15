// @ts-nocheck
import { describe, expect, it } from 'vitest';
import { StoryDirector } from '../StoryDirector.ts';
import { ACT1_STEPS, CORE_STEPS, STEP_COLORS, stepCard, stepNumber, tutorialStepById } from '../tutorialSteps.ts';
import { playGuidedSteps } from '../storyTestKit.ts';
import { pixelIconSvg } from '../../ui/pixelIcons.ts';
import { ACT2_STEPS } from './act2Steps.ts';
import { ACT3_STEPS } from './act3Steps.ts';
import { ACT4_STEPS } from './act4Steps.ts';
import { createActControllers } from './index.ts';

// Regras que valem para os passos guiados de todos os atos (o ato 1 e os de src/story/acts/)
const snap = (extra = {}) => ({
  hours: 15, insideHabitat: true, iceCount: 0, iceNeeded: 6, stormPhase: 'calm', stormsSurvived: 0,
  propellantPct: 0, dataSent: false, launched: false, ...extra,
});

describe('guided steps of every act', () => {
  it('lists act 1 first, then acts 2, 3 and 4, with unique ids', () => {
    expect(CORE_STEPS).toEqual([...ACT1_STEPS, ...ACT2_STEPS, ...ACT3_STEPS, ...ACT4_STEPS]);
    const ids = CORE_STEPS.map((step) => step.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const [act, steps] of [[2, ACT2_STEPS], [3, ACT3_STEPS], [4, ACT4_STEPS]]) {
      for (const step of steps) expect(step.act, step.id).toBe(act);
    }
    for (const step of CORE_STEPS) expect(tutorialStepById(step.id), step.id).toBe(step);
  });

  it('keeps every card short, for 7 to 12 year olds, with a color and icons that exist', () => {
    CORE_STEPS.forEach((step, i) => {
      const number = stepNumber(CORE_STEPS, i);
      const card = stepCard(step, number.now - 1, number.total, number.act);
      expect(step.label.split(' ').length, step.id).toBeLessThanOrEqual(4);
      expect(step.hint.length, step.hint).toBeLessThanOrEqual(60);
      expect(step.objective, step.id).toBeTruthy();
      expect(card.lines.length, step.id).toBeGreaterThan(0);
      expect(card.lines.length, step.id).toBeLessThanOrEqual(3);
      expect(STEP_COLORS[step.zone], step.id).toMatch(/^#[0-9a-f]{6}$/);
      expect(() => pixelIconSvg(step.icon), step.id).not.toThrow();
      for (const line of card.lines) {
        expect(line.text.split(' ').length, line.text).toBeLessThanOrEqual(8);
        expect(() => pixelIconSvg(line.icon), line.text).not.toThrow();
      }
    });
  });

  it('numbers the steps inside their own act', () => {
    expect(stepNumber(CORE_STEPS, 0)).toEqual({ act: 1, now: 1, total: ACT1_STEPS.length });
    expect(stepCard(ACT1_STEPS[0], 0, ACT1_STEPS.length).title).toBe('STEP 1/6: CALL EARTH');
    CORE_STEPS.forEach((step, i) => {
      const number = stepNumber(CORE_STEPS, i);
      expect(number.act, step.id).toBe(step.act ?? 1);
      expect(number.now, step.id).toBeGreaterThanOrEqual(1);
      expect(number.now, step.id).toBeLessThanOrEqual(number.total);
      const title = stepCard(step, number.now - 1, number.total, number.act).title;
      if (number.act > 1) expect(title, step.id).toMatch(new RegExp(`^ACT ${number.act} - STEP ${number.now}/${number.total}: `));
    });
  });

  it('every step finishes with its own example, and the last one opens the final race', () => {
    const director = new StoryDirector();
    director.start(snap());
    const seen = [];
    const state = playGuidedSteps({
      get act() { return director.act; },
      get step() { if (director.step && seen.at(-1) !== director.step.id) seen.push(director.step.id); return director.step; },
      update: (s) => director.update(s),
    }, snap);
    expect(seen).toEqual(CORE_STEPS.map((step) => step.id));
    expect(director.act).toBe(2);
    expect(director.step).toBeNull();
    expect(director.windowHoursLeft).not.toBeNull();
    expect(state).toBeTypeOf('object');
  });

  it('has one controller per act that does nothing until the act overrides it', () => {
    const controllers = createActControllers({});
    expect(controllers).toHaveLength(4);
    for (const act of controllers) {
      expect(() => { act.fillSnapshot({}); act.onStepStart('x', {}); act.onStepDone('x', {}); act.onMissionStart({}); act.update(0.016, {}, true); }).not.toThrow();
      expect(act.waypoint('nowhere')).toBeNull();
    }
  });
});
