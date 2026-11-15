// @ts-nocheck
import { describe, expect, it } from 'vitest';
import { ACT3_CONFIG, STATION_CONFIG, STORY_CONFIG, SURVIVAL_CONFIG, WATER_SYSTEM_CONFIG } from '../../config/constants.ts';
import { ExpeditionState } from '../../core/ExpeditionState.ts';
import { StationSystem } from '../../core/StationSystem.ts';
import { missionReport } from '../../mission/missionReport.ts';
import { SurvivalSystem } from '../../player/SurvivalSystem.ts';
import { pixelIconSvg } from '../../ui/pixelIcons.ts';
import { checkTranslationCoverage, translate } from '../../ui/i18n.ts';
import { TUTORIAL_DETOURS, findDetours } from '../tutorialDetours.ts';
import { tutorialStepById } from '../tutorialSteps.ts';
import { objectiveTarget } from '../waypoints.ts';
import { Act3Controller } from './Act3Controller.ts';
import { ACT3_STEPS } from './act3Steps.ts';
import {
  BOARDING_CAPTIONS, CARRIED_REPORT, CARRIED_TEXT, GYM_ES, GYM_LATER_ID, GYM_LATER_TOAST, GYM_NEEDS, GYM_NOW_ID, GYM_NOW_TOAST,
  GYM_PT_BR, GYM_STEP_ID, TOO_HUNGRY, TOO_THIRSTY, WALKED_REPORT, WALKED_TEXT, WEAK_BODY_WARNING, WORKOUT_COST, WORKOUT_COST_TEXT,
  boardingSummary, gymChoiceCard, gymChoiceToast, healCapFor, isBodyWeak, shouldAskGym, workoutBlocker, workoutNeeds,
} from './act3Gym.ts';

const MAX = SURVIVAL_CONFIG.MAX_STAT;

// As barras da crianca, como o StationSystem as usa (o SurvivalSystem de verdade tem o mesmo formato)
function body({ food = MAX, water = MAX } = {}) {
  return {
    food, water, maxStat: MAX,
    spendNeeds(f, w) { this.food = Math.max(0, this.food - f); this.water = Math.max(0, this.water - w); },
  };
}

function gym({ food = MAX, water = MAX } = {}) {
  const mission = new ExpeditionState();
  const station = new StationSystem(mission);
  const passed = [];
  station.body = body({ food, water });
  station.passHours = (hours) => passed.push(hours);
  return { mission, station, passed };
}

describe('gym trade-off (#421): what a workout costs', () => {
  it('costs 10% food, 15% water, 2 hours and the battery of STATION_CONFIG.EXERCISE_COST', () => {
    expect(WORKOUT_COST).toEqual({ power: STATION_CONFIG.EXERCISE_COST, foodPct: 10, waterPct: 15, hours: 2 });
    expect(WORKOUT_COST.power).toBe(STATION_CONFIG.EXERCISE_COST);
    expect(workoutNeeds(MAX)).toEqual({ food: MAX * 0.1, water: MAX * 0.15 });

    const { mission, station, passed } = gym();
    const energy = mission.energy;
    expect(station.exercise('treadmill')).toMatch(/treadmill/i);
    expect(mission.energy).toBeCloseTo(energy - STATION_CONFIG.EXERCISE_COST, 6);
    expect(station.body.food).toBeCloseTo(MAX * 0.9, 6);
    expect(station.body.water).toBeCloseTo(MAX * 0.85, 6);
    expect(passed).toEqual([2]);
    expect(station.workoutCount).toBe(1);
  });

  it('the bike costs the same as the treadmill', () => {
    const { mission, station, passed } = gym();
    const energy = mission.energy;
    station.exercise('bike');
    expect(mission.energy).toBeCloseTo(energy - STATION_CONFIG.EXERCISE_COST, 6);
    expect(station.body.food).toBeCloseTo(MAX * 0.9, 6);
    expect(station.body.water).toBeCloseTo(MAX * 0.85, 6);
    expect(passed).toEqual([2]);
  });

  it('is blocked without food or water, and then nothing is spent', () => {
    const hungry = gym({ food: MAX * 0.1 - 0.01 });
    const energy = hungry.mission.energy;
    expect(hungry.station.exercise()).toBe(TOO_HUNGRY);
    expect(hungry.mission.energy).toBe(energy);
    expect(hungry.station.body.water).toBe(MAX);
    expect(hungry.passed).toEqual([]);
    expect(hungry.station.workoutCount).toBe(0);

    const thirsty = gym({ water: MAX * 0.15 - 0.01 });
    expect(thirsty.station.exercise('bike')).toBe(TOO_THIRSTY);
    expect(thirsty.station.body.food).toBe(MAX);
    expect(thirsty.station.workoutCount).toBe(0);

    // Exatamente o custo ja basta, e sem as barras (testes antigos) nao ha bloqueio
    expect(workoutBlocker(body({ food: MAX * 0.1, water: MAX * 0.15 }))).toBeNull();
    expect(workoutBlocker(null)).toBeNull();
  });

  it('without battery the workout does not spend food, water or time', () => {
    const { mission, station, passed } = gym();
    mission.energy = 1;
    expect(station.exercise()).toBe('Not enough power.');
    expect(station.body.food).toBe(MAX);
    expect(station.body.water).toBe(MAX);
    expect(passed).toEqual([]);
  });

  it('the real SurvivalSystem pays the food and the water', () => {
    const survival = new SurvivalSystem();
    const station = new StationSystem(new ExpeditionState());
    station.body = survival;
    station.exercise();
    expect(survival.food).toBeCloseTo(MAX * 0.9, 6);
    expect(survival.water).toBeCloseTo(MAX * 0.85, 6);
  });

  it('the gym panel shows the three costs and the battery, in 3 languages', () => {
    expect(WORKOUT_COST_TEXT).toBe(`Each set: −${STATION_CONFIG.EXERCISE_COST}% power, −10% food, −15% water, 2 hours`);
    expect(translate(WORKOUT_COST_TEXT, 'pt-BR')).toBe(`Cada série: −${STATION_CONFIG.EXERCISE_COST}% de energia, −10% de comida, −15% de água, 2 horas`);
    expect(translate(WORKOUT_COST_TEXT, 'es')).toBe(`Cada serie: −${STATION_CONFIG.EXERCISE_COST}% de energía, −10% de comida, −15% de agua, 2 horas`);
    expect(translate(TOO_HUNGRY, 'pt-BR')).not.toBe(TOO_HUNGRY);
    expect(translate(TOO_THIRSTY, 'es')).not.toBe(TOO_THIRSTY);
  });
});

describe('gym trade-off (#421): the gym step never gets stuck', () => {
  const full = { batteryCharge: 100, baseWaterL: 500, foodStock: 3, roverBattery: 100 };
  const ids = (needs, s, active) => findDetours(needs, s, active).map((d) => d.id);

  it('the act 3 step and the full tour step ask for battery, food and water', () => {
    const act3 = ACT3_STEPS.find((s) => s.id === GYM_STEP_ID);
    expect(act3.needs).toEqual([...GYM_NEEDS]);
    expect(tutorialStepById('cert-gym').needs).toEqual([...GYM_NEEDS]);
    const needs = workoutNeeds(MAX);
    expect(GYM_NEEDS).toEqual([
      { resource: 'power', amount: STATION_CONFIG.EXERCISE_COST },
      { resource: 'bodyFood', amount: needs.food },
      { resource: 'bodyWater', amount: needs.water },
    ]);
  });

  it('a hungry child is sent to eat, a thirsty one to drink, and then the step comes back', () => {
    expect(ids(GYM_NEEDS, { ...full, playerFood: MAX, playerWater: MAX })).toEqual([]);
    expect(ids(GYM_NEEDS, { ...full, playerFood: 0, playerWater: MAX })).toEqual(['need-eat']);
    expect(ids(GYM_NEEDS, { ...full, playerFood: MAX, playerWater: 1 })).toEqual(['need-drink']);
    // Depois de comer 1 racao e de beber 1 gole o passo volta, mesmo vindo do desvio
    expect(ids(GYM_NEEDS, { ...full, playerFood: 6, playerWater: MAX }, new Set(['bodyFood']))).toEqual([]);
    expect(STORY_CONFIG.DETOUR_RESUME_EXTRA.bodyFood).toBe(0);
    expect(STORY_CONFIG.DETOUR_RESUME_EXTRA.bodyWater).toBe(0);
  });

  it('the detour is the same rule that blocks the workout', () => {
    for (const food of [0, 1, 1.99, 2, 2.01, 10]) {
      for (const water of [0, 2.99, 3, 3.01, 10]) {
        const blocked = workoutBlocker(body({ food, water })) !== null;
        const detour = ids(GYM_NEEDS, { ...full, playerFood: food, playerWater: water }).length > 0;
        expect(detour, `food ${food}, water ${water}`).toBe(blocked);
      }
    }
  });

  it('with an empty pantry or an empty tank, the deepest detour says where to get it', () => {
    expect(ids(GYM_NEEDS, { ...full, playerFood: 0, playerWater: MAX, foodStock: 0 })).toEqual(['need-eat', 'need-food']);
    expect(ids(GYM_NEEDS, { ...full, playerFood: MAX, playerWater: 0, baseWaterL: 0 })).toEqual(['need-drink', 'need-water']);
    expect(TUTORIAL_DETOURS.bodyFood.needs).toEqual([{ resource: 'food', amount: STORY_CONFIG.TUTORIAL_RATIONS_NEEDED }]);
    expect(TUTORIAL_DETOURS.bodyWater.needs).toEqual([{ resource: 'water', amount: WATER_SYSTEM_CONFIG.DRINK_AMOUNT_FROM_DISPENSER }]);
  });

  it('the arrow points to the kitchen and to the water tap', () => {
    expect(objectiveTarget('need-eat', {})).toBe('kitchen');
    expect(objectiveTarget('need-drink', {})).toBe('water');
  });

  it('the act 3 controller reports the bars of the child', () => {
    const act = new Act3Controller({ mission: {}, utility: { playerCrop: () => null }, survival: { food: 4, water: 7 } });
    const s = {};
    act.fillSnapshot(s);
    expect(s.playerFood).toBe(4);
    expect(s.playerWater).toBe(7);
    // Sem jogador (testes antigos) o recurso fica desconhecido e nao ha desvio
    const bare = {};
    new Act3Controller({ mission: {}, utility: { playerCrop: () => null } }).fillSnapshot(bare);
    expect(findDetours(GYM_NEEDS, bare)).toEqual([]);
  });
});

describe('gym trade-off (#421): skipping the gym', () => {
  it('a weak body is bones or fitness under the limit', () => {
    expect(ACT3_CONFIG.WEAK_BODY_BELOW).toBe(40);
    expect(isBodyWeak({ fitness: 100, boneDensity: 100 })).toBe(false);
    expect(isBodyWeak({ fitness: 40, boneDensity: 40 })).toBe(false);
    expect(isBodyWeak({ fitness: 39.9, boneDensity: 100 })).toBe(true);
    expect(isBodyWeak({ fitness: 100, boneDensity: 39.9 })).toBe(true);
    expect(isBodyWeak(null)).toBe(false);
  });

  it('with a weak body health only recovers up to 70% of the bar', () => {
    expect(healCapFor({ fitness: 100, boneDensity: 100 }, MAX)).toBe(MAX);
    expect(healCapFor({ fitness: 100, boneDensity: 10 }, MAX)).toBe(MAX * 0.7);

    const survival = new SurvivalSystem();
    const station = new StationSystem(new ExpeditionState());
    const inside = { x: 0, y: 11.7, z: 0 };
    station.boneDensity = 10;
    station.update(0.1, true, survival, false);
    expect(survival.healCap).toBe(MAX * 0.7);
    survival.health = MAX * 0.5;
    for (let i = 0; i < 60; i++) survival.update(1, inside, 100, false);
    expect(survival.health).toBeCloseTo(MAX * 0.7, 6);

    // Treinar tira o teto: a vida volta a encher
    station.exercise('treadmill');
    station.exercise('treadmill');
    station.update(0.1, true, survival, false);
    expect(survival.healCap).toBe(MAX);
    for (let i = 0; i < 60; i++) { survival.food = MAX; survival.water = MAX; survival.update(1, inside, 100, false); }
    expect(survival.health).toBe(MAX);
  });

  it('the cap never takes health away, so it never kills the child by itself', () => {
    const survival = new SurvivalSystem();
    const station = new StationSystem(new ExpeditionState());
    station.boneDensity = 0;
    station.fitness = 0;
    station.update(0.1, true, survival, false);
    for (let i = 0; i < 30; i++) survival.update(1, { x: 0, y: 11.7, z: 0 }, 100, false);
    expect(survival.health).toBe(MAX);
    expect(survival.isDead).toBe(false);
    // O tratamento da enfermaria tambem para no teto, sem baixar quem esta acima dele
    station.treat(survival);
    expect(survival.health).toBe(MAX);
    survival.health = MAX * 0.6;
    station.treat(survival);
    expect(survival.health).toBe(MAX * 0.7);
  });

  it('the warning says both costs, in 3 languages', () => {
    expect(WEAK_BODY_WARNING).toBe('Weak body: work 40% slower, health stops at 70%. Train in the gym!');
    expect(translate(WEAK_BODY_WARNING, 'pt-BR')).toContain('40% mais lento');
    expect(translate(WEAK_BODY_WARNING, 'es')).toContain('40% más lento');
  });
});

describe('gym trade-off (#421): the TRAIN NOW x LATER card', () => {
  it('shows the cost of each option, from the constants', () => {
    const card = gymChoiceCard();
    expect(card.seconds).toBe(ACT3_CONFIG.GYM_CARD_SECONDS);
    expect(card.choices.map((c) => c.id)).toEqual([GYM_NOW_ID, GYM_LATER_ID]);
    expect(card.choices.map((c) => c.name)).toEqual(['TRAIN NOW', 'LATER']);
    expect(card.choices[0].bad).toBe(`−${ACT3_CONFIG.WORKOUT_FOOD_PCT}% food, −${ACT3_CONFIG.WORKOUT_WATER_PCT}% water, ${ACT3_CONFIG.WORKOUT_HOURS} hours`);
    expect(card.choices[1].bad).toBe(`Work ${Math.round((1 - ACT3_CONFIG.WEAK_WORK_SPEED) * 100)}% slower, health stops at ${ACT3_CONFIG.WEAK_HEAL_CAP_PCT}%`);
    // Nenhuma opcao e de graca: as duas tem um lado ruim
    for (const choice of card.choices) {
      expect(choice.good).toBeTruthy();
      expect(choice.bad).toBeTruthy();
      expect(pixelIconSvg(choice.icon)).not.toBe('');
    }
  });

  it('keeps the lines short and says what is NASA data and what is a game rule', () => {
    const card = gymChoiceCard();
    expect(card.lines.length).toBeLessThanOrEqual(3);
    for (const line of card.lines) {
      expect(line.text.split(' ').length, line.text).toBeLessThanOrEqual(8);
      expect(pixelIconSvg(line.icon)).not.toBe('');
    }
    for (const choice of card.choices) {
      expect(choice.good.split(' ').length, choice.good).toBeLessThanOrEqual(8);
      expect(choice.bad.split(' ').length, choice.bad).toBeLessThanOrEqual(8);
    }
    expect(card.lines.some((line) => line.text.includes('2 hours a day'))).toBe(true);
    expect(card.source).toContain('NASA');
    expect(card.source).toContain('nobody measured');
    expect(card.source).toContain('game rule');
  });

  it('appears once per game, when the gym step of act 3 starts', () => {
    expect(shouldAskGym({ asked: false, stepId: GYM_STEP_ID })).toBe(true);
    expect(shouldAskGym({ asked: true, stepId: GYM_STEP_ID })).toBe(false);
    expect(shouldAskGym({ asked: false, stepId: 'make-ration' })).toBe(false);

    const cards = [];
    const act = new Act3Controller({ mission: {}, utility: {}, storyHud: { showCard: (card) => cards.push(card) } });
    act.onStepStart('make-ration', {});
    expect(cards).toEqual([]);
    act.onStepStart(GYM_STEP_ID, {});
    act.onStepStart(GYM_STEP_ID, {});
    expect(cards.map((card) => card.title)).toEqual(['GYM: NOW OR LATER?']);
    expect(act.gymAsked).toBe(true);
  });

  it('both answers only inform: the child chooses by training or not', () => {
    expect(gymChoiceToast(GYM_NOW_ID)).toBe(GYM_NOW_TOAST);
    expect(gymChoiceToast(GYM_LATER_ID)).toBe(GYM_LATER_TOAST);
    expect(gymChoiceToast('lights-on')).toBeNull();
  });

  it('every text of the card is in the 3 languages', () => {
    const card = gymChoiceCard();
    const texts = [card.title, card.source, GYM_NOW_TOAST, GYM_LATER_TOAST,
      ...card.lines.map((line) => line.text),
      ...card.choices.flatMap((c) => [c.name, c.good, c.bad])];
    for (const text of texts) {
      expect(translate(text, 'pt-BR'), text).not.toBe(text);
      expect(translate(text, 'es'), text).not.toBe(text);
    }
    expect(Object.keys(GYM_PT_BR).sort()).toEqual(Object.keys(GYM_ES).sort());
    expect(checkTranslationCoverage()).toEqual({ 'pt-BR': [], es: [] });
  });
});

describe('gym trade-off (#421): walking or carried to the rocket', () => {
  it('the report line follows the body at liftoff', () => {
    expect(boardingSummary({ launched: true, walkedToRocket: true })).toEqual({ walked: true, short: WALKED_TEXT, text: WALKED_REPORT });
    expect(boardingSummary({ launched: true, walkedToRocket: false })).toEqual({ walked: false, short: CARRIED_TEXT, text: CARRIED_REPORT });
    expect(WALKED_TEXT).toBe('You walked to the rocket');
    expect(CARRIED_TEXT).toBe('The crew carried you to the rocket');
  });

  it('there is no line without a liftoff', () => {
    expect(boardingSummary({ launched: false, walkedToRocket: true })).toBeNull();
    expect(boardingSummary({ launched: true, walkedToRocket: null })).toBeNull();
    expect(boardingSummary({ launched: true })).toBeNull();
  });

  it('the mission report carries the line', () => {
    const stats = {
      hoursPlayed: 10, sols: 1, deaths: 0, stormHours: 0, protectedStormHours: 0, totalDoseMsv: 0,
      boneDensity: 20, muscleStrength: 20, workoutCount: 0, harvestCount: 0, cropVariety: 0,
      iceDelivered: 6, standbyHours: 0, launched: true, launchWindow: 1,
    };
    expect(missionReport({ ...stats, walkedToRocket: false }).boarding.text).toBe(CARRIED_REPORT);
    expect(missionReport({ ...stats, walkedToRocket: true }).boarding.walked).toBe(true);
    expect(missionReport({ ...stats, launched: false }).boarding).toBeNull();
  });

  it('the lines and the captions are in the 3 languages', () => {
    for (const text of [WALKED_TEXT, CARRIED_TEXT, WALKED_REPORT, CARRIED_REPORT, ...Object.values(BOARDING_CAPTIONS)]) {
      expect(translate(text, 'pt-BR'), text).not.toBe(text);
      expect(translate(text, 'es'), text).not.toBe(text);
    }
    expect(BOARDING_CAPTIONS.rule).toContain('nobody has measured');
  });
});
