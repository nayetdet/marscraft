// @ts-nocheck
import { describe, expect, it } from 'vitest';
import { STORM_CONFIG } from '../../config/constants.ts';
import { MissionSystem } from '../../mission/MissionSystem.ts';
import { StoryDirector } from '../StoryDirector.ts';
import { tutorialStepById } from '../tutorialSteps.ts';
import { Act3Controller } from './Act3Controller.ts';
import { ACT3_FIRST_STEP_ID, ACT3_STEPS } from './act3Steps.ts';

// Uma CME real com destino a Marte, no formato do DONKI (a mesma dos testes do MissionSystem)
const cmes = [{
  id: 'cme', startTime: '2026-11-05T20:00Z', speedKmS: 900,
  headedToMars: true, marsArrivalTime: '2026-11-08T20:00Z', isGlancingBlow: false,
}];

function fakeEngine({ storms = cmes } = {}) {
  const mission = new MissionSystem({ cmes: storms, startHours: 12, stormsStarted: false });
  const utility = { crop: null, playerRationsMade: 0, playerCrop() { return this.crop; } };
  const tradeoffs = [];
  return { mission, utility, tradeoffs, _tradeoff: (trigger) => tradeoffs.push(trigger) };
}

const step = (id) => ACT3_STEPS.find((s) => s.id === id);
const apply = (s, example) => Object.assign(s, typeof example === 'function' ? example(s) : example);

describe('act 3 steps', () => {
  it('asks for shelter, plant, ration and gym, in this order', () => {
    expect(ACT3_STEPS.map((s) => s.id)).toEqual(['shelter-wall', 'hide-shelter', 'plant-seed', 'harvest-plant', 'make-ration', 'gym-workout']);
    expect(ACT3_STEPS[0].id).toBe(ACT3_FIRST_STEP_ID);
    expect(ACT3_STEPS.filter((s) => s.certificate).map((s) => s.certificate)).toEqual(['cert-shelter', 'cert-greenhouse', 'cert-gym']);
  });

  it('keeps the full tour steps of the same rooms, under their own ids', () => {
    for (const id of ['plant', 'cert-greenhouse', 'cert-gym', 'cert-shelter']) {
      expect(tutorialStepById(id)?.id).toBe(id);
      expect(ACT3_STEPS.some((s) => s.id === id)).toBe(false);
    }
  });

  it('the wall step ends when the wall gets water, or when it was already full', () => {
    const wall = step('shelter-wall');
    expect(wall.done({ shelterWaterL: 0 }, { shelterWaterL: 0 })).toBe(false);
    expect(wall.done({ shelterWaterL: 100 }, { shelterWaterL: 0 })).toBe(true);
    expect(wall.done({ shelterWaterL: 600 }, { shelterWaterL: 600 })).toBe(true);
  });

  it('the hide step ends when the storm is over, wherever the child is', () => {
    const hide = step('hide-shelter');
    expect(hide.done({ scriptedStormOver: false, stormPhase: 'active' }, {})).toBe(false);
    expect(hide.done({ scriptedStormOver: true, insideHabitat: false }, {})).toBe(true);
  });

  it('harvesting only counts with the plant in the bag, and the ration only when the cook made it', () => {
    expect(step('harvest-plant').done({ harvestCount: 3, plantInBag: false }, { harvestCount: 0 })).toBe(false);
    expect(step('harvest-plant').done({ plantInBag: true }, {})).toBe(true);
    expect(step('make-ration').done({ rationsMade: 0, mealCount: 4 }, { rationsMade: 0 })).toBe(false);
    expect(step('make-ration').done({ rationsMade: 1 }, { rationsMade: 0 })).toBe(true);
  });
});

describe('act 3 controller', () => {
  it('fills the fields the act 3 steps read', () => {
    const engine = fakeEngine();
    const act = new Act3Controller(engine);
    const s = {};
    act.fillSnapshot(s);
    expect(s).toEqual({ scriptedStormOver: false, plantInBag: false, rationsMade: 0 });
    engine.utility.crop = 'lettuce';
    engine.utility.playerRationsMade = 2;
    act.fillSnapshot(s);
    expect(s).toMatchObject({ plantInBag: true, rationsMade: 2 });
  });

  it('schedules the tutorial solar storm when the first step of the act starts, and only then', () => {
    const engine = fakeEngine();
    const act = new Act3Controller(engine);
    act.onStepStart('rover-ice', { hours: 20 });
    act.onStepStart('hide-shelter', { hours: 20 });
    expect(engine.mission.schedule).toHaveLength(0);

    act.onStepStart(ACT3_FIRST_STEP_ID, { hours: 30 });
    expect(engine.mission.schedule).toHaveLength(1);
    expect(engine.mission.schedule[0].warningStart).toBe(30 + STORM_CONFIG.FIRST_WARNING_AFTER_HOURS);
    expect(engine.mission.stormsStarted).toBe(false); // as tempestades reais ainda esperam

    const s = {};
    engine.mission.update(engine.mission.schedule[0].end + 0.01, { insideHabitat: true });
    act.fillSnapshot(s);
    expect(s.scriptedStormOver).toBe(true);
  });

  it('does not wait for a storm that never comes (no CME headed to Mars in the data)', () => {
    const engine = fakeEngine({ storms: [] });
    const act = new Act3Controller(engine);
    act.onStepStart(ACT3_FIRST_STEP_ID, { hours: 30 });
    const s = {};
    act.fillSnapshot(s);
    expect(s.scriptedStormOver).toBe(true);
  });

  it('walks the whole act with a director: storm at the start, the game drives the last steps', () => {
    const engine = fakeEngine();
    const act = new Act3Controller(engine);
    const director = new StoryDirector();
    const s = {
      hours: 15, insideHabitat: true, iceCount: 0, iceNeeded: 6, stormPhase: 'calm', stormsSurvived: 0,
      propellantPct: 0, dataSent: false, launched: false,
    };
    director.start(s);
    let last = null;
    const seen = [];
    for (let i = 0; i < 100 && director.step; i++) {
      const now = director.step;
      if (now.id !== last) {
        last = now.id;
        if (now.act === 3) seen.push(now.id);
        act.onStepStart(now.id, s);
      }
      // Os tres passos que dependem do jogo andam pelo jogo falso, nao pelo `example`
      if (now.id === 'hide-shelter') {
        expect(engine.mission.schedule).toHaveLength(1);
        engine.mission.update(engine.mission.schedule[0].end + 0.01, { insideHabitat: true });
      } else if (now.id === 'harvest-plant') {
        engine.utility.crop = 'lettuce';
      } else if (now.id === 'make-ration') {
        engine.utility.crop = null;
        engine.utility.playerRationsMade++;
      } else {
        apply(s, now.example);
      }
      act.fillSnapshot(s);
      director.update(s);
    }
    expect(seen).toEqual(ACT3_STEPS.map((x) => x.id));
    // Os modais de trade-off de agua e de comida, os mesmos do passeio completo
    expect(engine.tradeoffs).toEqual(['step:cert-shelter', 'step:plant']);
    expect(director.certificates).toEqual(expect.arrayContaining(['cert-shelter', 'cert-greenhouse', 'cert-gym']));
  });
});
