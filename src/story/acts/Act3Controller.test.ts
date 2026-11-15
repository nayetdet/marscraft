// @ts-nocheck
import { describe, expect, it } from 'vitest';
import { STORM_CONFIG } from '../../config/constants.ts';
import { MissionSystem } from '../../mission/MissionSystem.ts';
import { StoryDirector } from '../StoryDirector.ts';
import { tutorialStepById } from '../tutorialSteps.ts';
import { Act3Controller } from './Act3Controller.ts';
import { ENERGY_CONFIG, MISSION_CONFIG } from '../../config/constants.ts';
import { UtilityModule } from '../../core/UtilityModule.ts';
import { pixelIconSvg } from '../../ui/pixelIcons.ts';
import { LIGHTS_OFF_ID, LIGHTS_ON_ID, crossedSunset, nightLightsCard, nightLightsToast } from './act3NightLights.ts';
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

// Trade-off da luz da estufa a noite (issue #420)
describe('act 3 night lights choice', () => {
  const SUNSET = ENERGY_CONFIG.SUNSET_WARNING_HOUR;

  // Base de verdade (missao e modulo norte), sem tripulacao: aquecedor e luz da estufa ligados
  function nightEngine({ charge = 90 } = {}) {
    const mission = new MissionSystem({ cmes: [], startHours: SUNSET - 0.1, stormsStarted: false });
    mission.battery.charge = charge;
    const survival = { baseWater: 100, maxBaseWater: 1000, countItem: () => 0 };
    const base = { food: 0, graywater: 0, water: 100, maxWater: 1000 };
    const utility = new UtilityModule({ mission, survival, stations: {}, base });
    const stations = { plantCount: 0, growing: false, hasGrowingCrops() { return this.growing; } };
    const cards = [];
    return { mission, utility, stations, cards, storyHud: { showCard: (card) => cards.push(card) } };
  }

  it('asks once, at the first sunset with a plant of the child still growing', () => {
    const engine = nightEngine();
    const act = new Act3Controller(engine);
    const day = (n) => {
      act.update(0.016, { hours: n * 24 + SUNSET - 0.1 }, true);
      act.update(0.016, { hours: n * 24 + SUNSET + 0.01 }, true);
    };
    day(0); // sem planta: nada
    expect(engine.cards).toHaveLength(0);
    engine.stations.plantCount = 1;
    day(1); // plantou, mas ja colheu: nada
    expect(engine.cards).toHaveLength(0);
    engine.stations.growing = true;
    act.update(0.016, { hours: 2 * 24 + 12 }, true); // meio-dia nao e por do sol
    expect(engine.cards).toHaveLength(0);
    day(2);
    expect(engine.cards).toHaveLength(1);
    day(3); // uma vez por partida
    expect(engine.cards).toHaveLength(1);
    expect(crossedSunset(null, SUNSET + 1)).toBe(false);
  });

  it('offers LIGHTS ON and LIGHTS OFF, each with a cost and the battery forecast', () => {
    const card = nightLightsCard({ on: 12, off: 29 });
    expect(card.choices.map((c) => [c.key, c.id, c.name])).toEqual([['1', LIGHTS_ON_ID, 'LIGHTS ON'], ['2', LIGHTS_OFF_ID, 'LIGHTS OFF']]);
    expect(card.choices[0].bad).toContain('12%');
    expect(card.choices[1].good).toContain('29%');
    for (const choice of card.choices) {
      expect(choice.good).toBeTruthy();
      expect(choice.bad).toBeTruthy(); // nenhuma opcao e de graca
      expect(() => pixelIconSvg(choice.icon)).not.toThrow();
    }
    for (const line of card.lines) {
      expect(line.text.split(' ').length).toBeLessThanOrEqual(8);
      expect(() => pixelIconSvg(line.icon)).not.toThrow();
    }
    expect(card.source).toMatch(/game/i); // a previsao e regra de jogo, nao dado da NASA
    expect(nightLightsToast(true)).not.toBe(nightLightsToast(false));
  });

  it('forecasts the battery the base really has at sunrise, lights on and lights off', () => {
    const step = MISSION_CONFIG.MAX_STEP_HOURS;
    const end = 24 + MISSION_CONFIG.SUNRISE_HOUR;
    const results = {};
    for (const lightsOn of [true, false]) {
      const engine = nightEngine();
      const { mission, utility } = engine;
      mission.update(SUNSET, { insideHabitat: true, active: false });
      const forecast = new Act3Controller(engine).nightForecast(SUNSET);
      utility.greenhouseLightsOn = lightsOn;
      // A noite inteira, como o GameEngine faz: o Sol carrega, o aquecedor e a luz gastam
      const steps = Math.round((end - SUNSET) / step);
      for (let i = 1; i <= steps; i++) {
        mission.update(SUNSET + i * step, { insideHabitat: true, active: false });
        utility.update(step);
        if (utility.greenhouseLightsOn) mission.battery.spend(utility.greenhouseLightsCost(step / MISSION_CONFIG.GAME_HOURS_PER_SECOND));
      }
      const real = mission.battery.percent;
      results[lightsOn ? 'on' : 'off'] = { forecast: forecast[lightsOn ? 'on' : 'off'], real };
      expect(Math.abs(forecast[lightsOn ? 'on' : 'off'] - real)).toBeLessThanOrEqual(1);
      expect(real).toBeGreaterThan(0);
    }
    // Luz acesa a noite inteira custa bateria de verdade
    expect(results.on.real).toBeLessThan(results.off.real - 10);
    expect(results.on.forecast).toBeLessThan(results.off.forecast);
  });
});
