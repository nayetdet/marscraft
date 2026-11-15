// @ts-nocheck
import { describe, expect, it, vi } from 'vitest';
import { ACT5_CONFIG, STORY_CONFIG } from '../../config/constants.ts';
import { missionReport } from '../../mission/missionReport.ts';
import { pixelIconSvg } from '../../ui/pixelIcons.ts';
import { StoryDirector } from '../StoryDirector.ts';
import { Act5Controller } from './Act5Controller.ts';
import { HANDOVER_CHOICES, handoverCard, handoverChecks, handoverSummary } from './act5Handover.ts';

// Trade-off do ato 5 (#423): como deixar a base para a proxima tripulacao
const COST = ACT5_CONFIG.HANDOVER_WINDOW_HOURS;
const WINDOW = STORY_CONFIG.WINDOW_HOURS;
const START = 15;

const READY = { waterL: 400, maxWaterL: 500, panelDust: 0.05, fieldsPlanted: 4, fieldsTotal: 6 };
const MESSY = { waterL: 60, maxWaterL: 500, panelDust: 0.6, fieldsPlanted: 1, fieldsTotal: 6 };

const snap = (extra = {}) => ({
  hours: START, insideHabitat: false, iceCount: 0, iceNeeded: 0, stormPhase: 'calm', stormsSurvived: 1,
  propellantPct: 100, dataSent: true, launched: false, ...extra,
});

describe('act 5 handover: the state of the base', () => {
  it('checks the water tank, the panel dust and the planted fields', () => {
    expect(handoverChecks(READY).map((check) => [check.id, check.ok])).toEqual([['water', true], ['panels', true], ['fields', true]]);
    expect(handoverChecks(MESSY).map((check) => check.ok)).toEqual([false, false, false]);
    expect(handoverChecks(MESSY).map((check) => check.text)).toEqual([
      'Water tank: 60 of 500 L',
      'Dust on solar panels: 60%',
      'Fields planted: 1 of 6',
    ]);
  });

  it('uses the goals from ACT5_CONFIG', () => {
    const edge = {
      waterL: 500 * ACT5_CONFIG.HANDOVER_WATER_FRACTION,
      maxWaterL: 500,
      panelDust: ACT5_CONFIG.HANDOVER_MAX_PANEL_DUST,
      fieldsPlanted: 6 * ACT5_CONFIG.HANDOVER_FIELDS_FRACTION,
      fieldsTotal: 6,
    };
    expect(handoverChecks(edge).every((check) => check.ok)).toBe(true);
    expect(handoverChecks({ ...edge, waterL: edge.waterL - 1 })[0].ok).toBe(false);
    expect(handoverChecks({ ...edge, panelDust: edge.panelDust + 0.01 })[1].ok).toBe(false);
    expect(handoverChecks({ ...edge, fieldsPlanted: edge.fieldsPlanted - 1 })[2].ok).toBe(false);
  });
});

describe('act 5 handover: the choice card', () => {
  const card = handoverCard(MESSY);

  it('shows the base in 3 short lines with icons that exist', () => {
    expect(card.lines).toHaveLength(3);
    for (const line of card.lines) {
      expect(line.text.split(' ').length, line.text).toBeLessThanOrEqual(8);
      expect(() => pixelIconSvg(line.icon), line.text).not.toThrow();
    }
  });

  it('offers two choices, each with a gain and a cost', () => {
    expect(card.choices.map((choice) => choice.id)).toEqual([HANDOVER_CHOICES.FLY_NOW, HANDOVER_CHOICES.TIDY]);
    expect(card.choices.map((choice) => choice.key)).toEqual(['1', '2']);
    for (const choice of card.choices) {
      expect(choice.good, choice.name).toBeTruthy();
      expect(choice.bad, choice.name).toBeTruthy();
      expect(() => pixelIconSvg(choice.icon), choice.name).not.toThrow();
    }
  });

  it('takes the cost of tidying from the constant, not from a fixed number', () => {
    expect(card.choices[1].bad).toBe(`${COST} h less launch window`);
  });

  it('cites the real fact with its NASA source', () => {
    expect(card.source).toMatch(/Space Station/);
    expect(card.source).toMatch(/NASA/);
  });
});

describe('act 5 handover: the report line', () => {
  it('has no line when the rocket did not lift off', () => {
    expect(handoverSummary({ launched: false, baseHandover: READY })).toBeNull();
    expect(handoverSummary({ launched: true })).toBeNull();
  });

  it('says the base is ready when the 3 items are done', () => {
    expect(handoverSummary({ launched: true, baseHandover: { ...READY, tidied: true } })).toMatchObject({
      ready: 3, total: 3, allReady: true, tidied: true,
      text: 'Base ready for the next crew: water, panels and fields',
    });
  });

  it('counts what is ready and names what is missing', () => {
    const summary = handoverSummary({ launched: true, baseHandover: { ...MESSY, panelDust: 0 } });
    expect(summary).toMatchObject({ ready: 1, total: 3, allReady: false, tidied: false });
    expect(summary.text).toBe('Base ready for the next crew: 1 of 3 (missing: water, planted fields)');
  });

  it('is part of the cadet report', () => {
    const stats = {
      hoursPlayed: 30, sols: 2, deaths: 0, stormHours: 0, protectedStormHours: 0, totalDoseMsv: 0.2,
      boneDensity: 90, muscleStrength: 90, workoutCount: 1, harvestCount: 1, cropVariety: 1,
      iceDelivered: 6, standbyHours: 0, launched: true, launchWindow: 1, baseHandover: MESSY,
    };
    expect(missionReport(stats).handover.text).toMatch(/^Base ready for the next crew: 0 of 3/);
    expect(missionReport({ ...stats, launched: false }).handover).toBeNull();
  });
});

describe('StoryDirector.spendWindow', () => {
  function racing() {
    const director = new StoryDirector();
    director.start(snap());
    director.update(snap());
    director.skipTraining();
    director.drainEvents();
    return director;
  }

  it('takes hours from the open launch window', () => {
    const director = racing();
    director.update(snap({ hours: START + 4 }));
    expect(director.spendWindow(COST)).toBe(true);
    expect(director.windowHoursLeft).toBeCloseTo(WINDOW - 4 - COST);
    // O relogio segue da janela mais curta e fecha mais cedo
    director.update(snap({ hours: START + WINDOW - COST + 0.1 }));
    expect(director.objectiveId).toBe('failed');
  });

  it('refuses when the window does not have that much time left', () => {
    const director = racing();
    director.update(snap({ hours: START + WINDOW - 1 }));
    expect(director.spendWindow(COST)).toBe(false);
    expect(director.windowHoursLeft).toBeCloseTo(1);
  });

  it('refuses outside the final run', () => {
    const before = new StoryDirector();
    before.start(snap());
    before.update(snap());
    expect(before.spendWindow(COST)).toBe(false); // passos guiados: nao ha janela
    const after = racing();
    after.update(snap({ hours: START + 2, launched: true }));
    expect(after.spendWindow(COST)).toBe(false); // ja decolou
  });
});

describe('Act5Controller: how to leave the base', () => {
  function readyEngine({ panelDust = 0.6, hours = START + 4 } = {}) {
    const story = new StoryDirector();
    story.start(snap());
    story.update(snap());
    story.skipTraining();
    story.drainEvents();
    story.update(snap({ hours }));
    const dustWeather = {
      panelDust,
      cleanPanels(amount) { const removed = Math.min(this.panelDust, amount); this.panelDust -= removed; return removed; },
    };
    const engine = {
      story,
      mission: { dustWeather },
      survival: { baseWater: 60, maxBaseWater: 500 },
      stations: { plots: [{ crop: { type: 'potato' } }, { crop: null }, { crop: null }, { crop: null }] },
      storyHud: { cards: [], showCard(card) { this.cards.push(card); } },
      hud: { showToast: vi.fn() },
      audio: { playUiError: vi.fn(), playUiConfirm: vi.fn() },
    };
    return engine;
  }

  it('shows the card once, when the rocket is ready, with the base as it is', () => {
    const engine = readyEngine();
    const act5 = new Act5Controller(engine);
    expect(engine.story.objectiveId).toBe('ignite');
    act5.update(0.016, snap(), false); // jogo pausado: ainda nao
    expect(engine.storyHud.cards).toHaveLength(0);
    act5.update(0.016, snap(), true);
    act5.update(0.016, snap(), true);
    expect(engine.storyHud.cards).toHaveLength(1);
    expect(engine.storyHud.cards[0].title).toBe('LEAVING THE BASE');
    expect(engine.storyHud.cards[0].lines.map((line) => line.text)).toEqual([
      'Water tank: 60 of 500 L',
      'Dust on solar panels: 60%',
      'Fields planted: 1 of 4',
    ]);
  });

  it('does not show the card while the rocket still needs something', () => {
    const engine = readyEngine();
    engine.story.update(snap({ hours: START + 5, propellantPct: 50, iceNeeded: 3 }));
    new Act5Controller(engine).update(0.016, snap(), true);
    expect(engine.storyHud.cards).toHaveLength(0);
  });

  it('FLY NOW keeps the window and leaves the base as it is', () => {
    const engine = readyEngine();
    const act5 = new Act5Controller(engine);
    const left = engine.story.windowHoursLeft;
    expect(act5.onCardChoice(HANDOVER_CHOICES.FLY_NOW)).toBe(true);
    expect(engine.story.windowHoursLeft).toBe(left);
    expect(engine.mission.dustWeather.panelDust).toBe(0.6);
    expect(act5.handoverStats()).toMatchObject({ tidied: false, panelDust: 0.6, waterL: 60, fieldsPlanted: 1, fieldsTotal: 4 });
  });

  it('TIDY THE BASE cleans the panels and costs launch window time', () => {
    const engine = readyEngine();
    const act5 = new Act5Controller(engine);
    const left = engine.story.windowHoursLeft;
    expect(act5.onCardChoice(HANDOVER_CHOICES.TIDY)).toBe(true);
    expect(engine.story.windowHoursLeft).toBeCloseTo(left - COST);
    expect(engine.mission.dustWeather.panelDust).toBe(0);
    expect(act5.handoverStats()).toMatchObject({ tidied: true, panelDust: 0 });
    expect(handoverChecks(act5.handoverStats())[1].ok).toBe(true);
  });

  it('refuses to tidy, and keeps the card open, without enough window left', () => {
    const engine = readyEngine({ hours: START + WINDOW - 1 });
    const act5 = new Act5Controller(engine);
    expect(act5.onCardChoice(HANDOVER_CHOICES.TIDY)).toBe(false);
    expect(engine.mission.dustWeather.panelDust).toBe(0.6);
    expect(engine.story.windowHoursLeft).toBeCloseTo(1);
    expect(engine.audio.playUiError).toHaveBeenCalled();
    expect(act5.handoverStats().tidied).toBe(false);
  });

  it('charges nothing when the panels are already clean', () => {
    const engine = readyEngine({ panelDust: 0 });
    const act5 = new Act5Controller(engine);
    const left = engine.story.windowHoursLeft;
    expect(act5.onCardChoice(HANDOVER_CHOICES.TIDY)).toBe(true);
    expect(engine.story.windowHoursLeft).toBe(left);
    expect(act5.handoverStats().tidied).toBe(false);
  });

  it('leaves the choices of other cards alone', () => {
    const act5 = new Act5Controller(readyEngine());
    expect(act5.onCardChoice('hide')).toBeNull();
    expect(act5.onCardChoice('shield')).toBeNull();
  });
});
