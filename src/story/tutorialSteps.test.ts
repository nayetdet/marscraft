// @ts-nocheck
import { describe, expect, it } from 'vitest';
import { BLOCK_IDS, HOTBAR_BLOCKS } from '../config/blockTypes.ts';
import { StoryDirector } from './StoryDirector.ts';
import { objectiveView } from './objectiveView.ts';
import { objectiveTarget, routeWaypoint } from './waypoints.ts';
import { CERTIFICATES, certificateBadge } from './storyChapters.ts';
import { ACT1_STEPS, CORE_STEPS, STEP_COLORS, TUTORIAL_STEPS, TUTORIAL_STEP_IDS, detourCard, stepCard, tutorialStepById } from './tutorialSteps.ts';
import { PLANT_NEEDS, TUTORIAL_DETOURS, detourById, findDetours } from './tutorialDetours.ts';
import { GYM_NEEDS } from './acts/act3Gym.ts';
import {
  CREW_CONFIG, CROP_CONFIG, ENERGY_CONFIG, RADIATION_CONFIG, ROVER_CONFIG, STATION_CONFIG, STORY_CONFIG,
  UTILITY_CONFIG, WATER_SYSTEM_CONFIG,
} from '../config/constants.ts';
import { ZONE_COLORS } from '../base/basePosters.ts';
import { pixelIconSvg } from '../ui/pixelIcons.ts';

// Tutorial guiado (teste com jogadores de 15/11/2026): um passo por vez, do basico ao avancado
function snap(overrides = {}) {
  return {
    hours: 15, insideHabitat: false, iceCount: 0, iceNeeded: 10, stormPhase: 'calm',
    stormsSurvived: 0, propellantPct: 0, dataSent: false, launched: false,
    drinkCount: 0, mealCount: 0, earthCalls: 0, powerChecks: 0, plantCount: 0, harvestCount: 0,
    workoutCount: 0, shelterWaterL: 0, roverDrives: 0, roverIceKg: 0, scanCount: 0,
    ...overrides,
  };
}

// O que a crianca faz em cada passo, na ordem do tutorial
const ACTIONS = [
  ['enter-base', { insideHabitat: true }],
  ['drink', { drinkCount: 1 }],
  ['eat', { mealCount: 1 }],
  ['report', { earthCalls: 1 }],
  ['cert-power', { powerChecks: 1 }],
  ['plant', { plantCount: 1 }],
  ['cert-greenhouse', { harvestCount: 1 }],
  ['cert-gym', { workoutCount: 1 }],
  ['cert-shelter', { shelterWaterL: 10 }],
  ['rover-drive', { roverDrives: 1 }],
  ['rover-ice', { roverIceKg: 10 }],
  ['suit-up', { suitEquipped: true }],
  ['collect-ice', { iceCount: 1 }],
  ['load-rocket', { iceCount: 0, iceNeeded: 9 }],
  ['scan', { scanCount: 1 }],
];

function tutorial() {
  const director = new StoryDirector({ training: true, replyDelayHours: 0.5 });
  director.start(snap());
  return director;
}

// Faz os primeiros `count` passos e devolve o retrato acumulado
function play(director, count) {
  const state = snap();
  for (const [, change] of ACTIONS.slice(0, count)) {
    Object.assign(state, change);
    director.update({ ...state });
  }
  return state;
}

const STARTING_CARROTS = HOTBAR_BLOCKS.find((item) => item.id === BLOCK_IDS.HYDRO_PLANT)?.initialCount ?? 0;

describe('guided tutorial', () => {
  it('has one action for every step, in the same order', () => {
    expect(ACTIONS.map(([id]) => id)).toEqual(TUTORIAL_STEP_IDS);
  });

  it('opens with step 1 and one card: where to go and what to press', () => {
    const director = tutorial();
    expect(director.objectiveId).toBe('enter-base');
    const events = director.drainEvents();
    expect(events).toHaveLength(1);
    expect(events[0].card).toMatchObject({ step: true, title: `STEP 1/${TUTORIAL_STEPS.length}: ENTER THE BASE` });
  });

  it('moves one step at a time, only when the child does what the step asks', () => {
    const director = tutorial();
    const state = snap();
    ACTIONS.forEach(([id, change], i) => {
      expect(director.objectiveId).toBe(id);
      expect(director.stepIndex).toBe(i);
      // Sem fazer a tarefa, o passo nao anda
      director.update({ ...state, hours: state.hours + 1 });
      expect(director.objectiveId).toBe(id);
      director.drainEvents();

      Object.assign(state, change);
      director.update({ ...state });
      const titles = director.drainEvents().filter((e) => e.type === 'card').map((e) => e.card.title);
      const next = TUTORIAL_STEPS[i + 1];
      if (next) expect(titles).toContain(`STEP ${i + 2}/${TUTORIAL_STEPS.length}: ${next.label}`);
    });
    expect(director.act).toBe(2);
    expect(director.objectiveId).toBe('act2');
    expect(director.inTraining).toBe(false);
  });

  it('only counts what the child does after the step starts', () => {
    const director = tutorial();
    // Ja tinha conferido a bateria 3 vezes antes de o passo pedir
    const state = { ...play(director, 3), powerChecks: 3, earthCalls: 1 };
    director.update({ ...state });
    expect(director.objectiveId).toBe('cert-power');
    director.update({ ...state });
    expect(director.objectiveId).toBe('cert-power');
    director.update({ ...state, powerChecks: 4 });
    expect(director.objectiveId).toBe('plant');
  });

  it('calling Earth sends the message and the answer arrives during the next steps', () => {
    const director = tutorial();
    const state = play(director, 3);
    director.drainEvents();
    director.update({ ...state, earthCalls: 1 });
    expect(director.objectiveId).toBe('cert-power');
    expect(director.replySecondsLeft).toBe(25);
    const titles = director.drainEvents().filter((e) => e.type === 'card').map((e) => e.card.title);
    expect(titles[0]).toBe('MESSAGE SENT');

    director.update({ ...state, earthCalls: 1, hours: 15.5 });
    expect(director.drainEvents().map((e) => e.card?.title)).toEqual(['EARTH ANSWERED']);
  });

  it('gives a certificate on 4 steps and a short sound cue on the others', () => {
    const director = tutorial();
    play(director, ACTIONS.length);
    const events = director.drainEvents();
    const badges = events.filter((e) => e.type === 'certificate').map((e) => e.badge.name);
    expect(badges).toEqual(['ENGINEERING', 'SPACE BOTANY', 'HEALTH IN 0.38g', 'RADIATION SHIELDING']);
    expect(director.certificates).toEqual(CERTIFICATES.map((c) => c.id));
    expect(events.filter((e) => e.type === 'step-done')).toHaveLength(TUTORIAL_STEPS.length - 4);
  });

  it('starts the storms only when the whole tutorial is done', () => {
    const director = tutorial();
    const state = play(director, ACTIONS.length - 1);
    expect(director.drainEvents().some((e) => e.type === 'start-storms')).toBe(false);
    director.update({ ...state, scanCount: 1 });
    const events = director.drainEvents();
    expect(events.filter((e) => e.type === 'start-storms')).toHaveLength(1);
    const titles = events.filter((e) => e.type === 'card').map((e) => e.card.title);
    expect(titles).toEqual(['TRAINING COMPLETE', 'FILL THE ROCKET']);
  });

  it('can be skipped from the demo menu, before or during the tutorial', () => {
    const during = tutorial();
    play(during, 4);
    during.drainEvents();
    expect(during.skipTraining()).toBe(true);
    expect(during.act).toBe(2);
    expect(during.objectiveId).toBe('act2');
    expect(during.drainEvents().filter((e) => e.type === 'start-storms')).toHaveLength(1);
    expect(during.skipTraining()).toBe(false);

    const before = new StoryDirector({ training: true });
    expect(before.skipTraining()).toBe(false);
    before.start(snap());
    expect(before.steps).toBe(CORE_STEPS);
    before.update(snap({ earthCalls: 1 }));
    expect(before.objectiveId).toBe('rover-drive');
  });

  it('shows the step, its hint and its number in the objective panel', () => {
    const director = tutorial();
    const state = play(director, 3);
    const view = objectiveView(director, state);
    expect(view.task).toMatchObject({ icon: 'radio', label: 'CALL EARTH' });
    expect(view.task.hint).toMatch(/CALL EARTH/);
    expect(view.progress).toEqual({ now: 4, total: TUTORIAL_STEPS.length });
    expect(view.color).toBe(STEP_COLORS.radio);
    expect(view.steps).toBeNull();
  });

  it('runs a simulated radiation pulse on the shielding certificate', () => {
    const shelter = CERTIFICATES.find((c) => c.id === 'cert-shelter');
    expect(certificateBadge(shelter, { shelterWaterL: 100 }).line).toMatch(/100 L wall blocks 48%/);
  });
});

describe('tutorial step texts', () => {
  it('keeps every card short, for 7 to 12 year olds, with icons that exist', () => {
    TUTORIAL_STEPS.forEach((step, i) => {
      const card = stepCard(step, i, TUTORIAL_STEPS.length);
      expect(step.label.split(' ').length).toBeLessThanOrEqual(4);
      expect(step.hint.length, step.hint).toBeLessThanOrEqual(60);
      expect(card.lines.length).toBeLessThanOrEqual(3);
      expect(() => pixelIconSvg(step.icon)).not.toThrow();
      for (const line of card.lines) {
        expect(line.text.split(' ').length, line.text).toBeLessThanOrEqual(8);
        expect(() => pixelIconSvg(line.icon)).not.toThrow();
      }
    });
  });

  it('paints each step with the color of its base section, the same as the room signs', () => {
    for (const step of TUTORIAL_STEPS) {
      const color = STEP_COLORS[step.zone];
      expect(color, step.id).toMatch(/^#[0-9a-f]{6}$/);
      expect(stepCard(step, 0, 1).color).toBe(color);
    }
    const colorOf = (id) => STEP_COLORS[TUTORIAL_STEPS.find((step) => step.id === id).zone];
    expect(colorOf('plant')).toBe(ZONE_COLORS.greenhouse);
    expect(colorOf('cert-gym')).toBe(ZONE_COLORS.gym);
    expect(colorOf('cert-shelter')).toBe(ZONE_COLORS.shelter);
    expect(colorOf('enter-base')).toBe(ZONE_COLORS.airlock);
    // Passos seguidos nunca tem a mesma cor, a nao ser no mesmo lugar (estufa e rover)
    TUTORIAL_STEPS.slice(1).forEach((step, i) => {
      const before = TUTORIAL_STEPS[i];
      if (step.zone !== before.zone) expect(STEP_COLORS[step.zone], step.id).not.toBe(STEP_COLORS[before.zone]);
    });
  });

  it('has unique ids and keeps the 6 steps of act 1 as the default tutorial', () => {
    expect(new Set(TUTORIAL_STEP_IDS).size).toBe(TUTORIAL_STEPS.length);
    expect(ACT1_STEPS.map((step) => step.id)).toEqual(['report', 'rover-drive', 'rover-ice', 'suit-up', 'collect-ice', 'load-rocket']);
    // Os atos 2, 3 e 4 vem depois, na mesma lista (src/story/acts/)
    expect(CORE_STEPS.slice(0, ACT1_STEPS.length)).toEqual(ACT1_STEPS);
  });
});

describe('tutorial places', () => {
  it('calls Earth at the radio terminal, away from the rover console', () => {
    expect(objectiveTarget('report')).toBe('science');
    expect(objectiveTarget('rover-drive')).toBe('console');
  });

  it('routes the indoor stations through the airlock from outside', () => {
    for (const place of ['powerroom', 'greenhouse', 'gym', 'shelter', 'water', 'kitchen', 'science', 'console']) {
      expect(routeWaypoint(place, false)).toBe('airlock');
      expect(routeWaypoint(place, true)).toBe(place);
    }
  });

  it('points the rover at the ice crater directly: the driver is not walking out', () => {
    expect(routeWaypoint(objectiveTarget('rover-ice'), false)).toBe('ice');
  });
});

// Issue #237: passo que gasta um recurso manda a crianca busca-lo quando a base nao tem
describe('tutorial resource detours: the data', () => {
  const detours = Object.values(TUTORIAL_DETOURS);
  const stepsWithNeeds = TUTORIAL_STEPS.filter((step) => step.needs);

  it('every resource a step or a detour needs has a detour that says where to get it', () => {
    const needs = [...stepsWithNeeds, ...detours].flatMap((task) => task.needs ?? []);
    expect(needs.length).toBeGreaterThan(0);
    for (const need of needs) {
      expect(TUTORIAL_DETOURS[need.resource], need.resource).toBeDefined();
      expect(TUTORIAL_DETOURS[need.resource].resource).toBe(need.resource);
      expect(need.amount).toBeGreaterThan(0);
      expect(STORY_CONFIG.DETOUR_RESUME_EXTRA[need.resource]).toBeGreaterThanOrEqual(0);
    }
  });

  it('covers every step that spends water, power, food or rover battery, with the game costs', () => {
    const needs = Object.fromEntries(stepsWithNeeds.map((step) => [step.id, step.needs]));
    expect(needs.drink).toEqual([{ resource: 'water', amount: WATER_SYSTEM_CONFIG.DRINK_AMOUNT_FROM_DISPENSER }]);
    expect(needs.eat).toEqual([{ resource: 'food', amount: STORY_CONFIG.TUTORIAL_RATIONS_NEEDED }]);
    expect(needs.report).toEqual([{ resource: 'power', amount: STATION_CONFIG.COMMS_COST }]);
    expect(needs.plant).toBe(PLANT_NEEDS);
    expect(needs['cert-greenhouse']).toBe(PLANT_NEEDS);
    // Academia (#421): bateria da base, e comida e agua das barras da crianca
    expect(needs['cert-gym']).toEqual([...GYM_NEEDS]);
    expect(GYM_NEEDS[0]).toEqual({ resource: 'power', amount: STATION_CONFIG.EXERCISE_COST });
    expect(needs['cert-shelter']).toEqual([{ resource: 'water', amount: RADIATION_CONFIG.SHELTER_FILL_MIN_L }]);
    expect(needs['rover-ice']).toEqual([{ resource: 'roverPower', amount: ROVER_CONFIG.LOW_BATTERY }]);
    // Plantar: a semente mais barata no menor campo
    expect(PLANT_NEEDS).toEqual([
      { resource: 'water', amount: CROP_CONFIG.lettuce.water },
      { resource: 'power', amount: CROP_CONFIG.lettuce.energy },
    ]);
  });

  it('a fresh base has enough of everything: no detour on a normal first run', () => {
    const fresh = {
      baseWaterL: WATER_SYSTEM_CONFIG.INITIAL_BASE_WATER, batteryCharge: ENERGY_CONFIG.START_CHARGE,
      // Como no GameEngine: racoes da despensa mais as plantas que a crianca traz na mochila
      foodStock: CREW_CONFIG.START_FOOD + STARTING_CARROTS, roverBattery: ROVER_CONFIG.START_BATTERY,
    };
    for (const step of TUTORIAL_STEPS) expect(findDetours(step.needs, fresh), step.id).toEqual([]);
  });

  it('every detour sends the child to a place the tutorial already points at', () => {
    const places = new Set(TUTORIAL_STEPS.map((step) => step.place).filter(Boolean));
    for (const detour of detours) {
      expect(places.has(detour.place), detour.id).toBe(true);
      if (detour.roverPlace) expect(places.has(detour.roverPlace), detour.id).toBe(true);
      expect(routeWaypoint(objectiveTarget(detour.id), true)).toBe(detour.place);
      expect(tutorialStepById(detour.id)).toBe(detour);
      expect(detourById(detour.id)).toBe(detour);
    }
    expect(TUTORIAL_STEP_IDS.some((id) => detourById(id))).toBe(false);
  });

  it('the water detour follows the rover: console inside, ice crater while driving', () => {
    expect(objectiveTarget('need-water', {})).toBe('console');
    expect(routeWaypoint(objectiveTarget('need-water', { roverActive: true }), false)).toBe('ice');
    // O console do rover fica dentro da base: de fora, a seta passa pelo airlock
    expect(routeWaypoint(objectiveTarget('need-water', {}), false)).toBe('airlock');
  });

  it('keeps detour texts short, for 7 to 12 year olds, with icons and colors that exist', () => {
    for (const detour of detours) {
      expect(pixelIconSvg(detour.icon), detour.id).not.toBe('');
      expect(STEP_COLORS[detour.zone], detour.id).toMatch(/^#[0-9a-f]{6}$/i);
      expect(detour.label.split(' ').length).toBeLessThanOrEqual(3);
      expect(detour.hint.length).toBeLessThanOrEqual(80);
      expect(detour.lines.length).toBeLessThanOrEqual(3);
      for (const line of detour.lines) {
        expect(pixelIconSvg(line.icon), `${detour.id}: ${line.icon}`).not.toBe('');
        expect(line.text.length).toBeLessThanOrEqual(50);
      }
      expect(detourCard(detour)).toMatchObject({ step: true, title: `FIRST: ${detour.label}`, color: STEP_COLORS[detour.zone] });
      expect(detourCard(detour).stepId).toBeUndefined();
    }
  });

  it('a detour that needs another resource sends the child to the deepest one first', () => {
    const dryAndFlat = { baseWaterL: 0, roverBattery: 0 };
    expect(findDetours(tutorialStepById('drink').needs, dryAndFlat).map((d) => d.id)).toEqual(['need-water', 'need-rover-power']);
    expect(findDetours(tutorialStepById('drink').needs, { baseWaterL: 0, roverBattery: 100 }).map((d) => d.id)).toEqual(['need-water']);
    // Sem comida, sem agua e com o rover carregado: primeiro a agua, que a planta vai beber
    expect(findDetours(tutorialStepById('eat').needs, { foodStock: 0, baseWaterL: 0, batteryCharge: 100, roverBattery: 100 }).map((d) => d.id))
      .toEqual(['need-food', 'need-water']);
  });

  it('a resource the game did not report never starts a detour', () => {
    for (const step of TUTORIAL_STEPS) expect(findDetours(step.needs, {})).toEqual([]);
    expect(findDetours(undefined, { baseWaterL: 0 })).toEqual([]);
  });

  it('leaving a detour asks for a little more than entering it, so the task does not flicker', () => {
    const need = tutorialStepById('drink').needs;
    const amount = WATER_SYSTEM_CONFIG.DRINK_AMOUNT_FROM_DISPENSER;
    const extra = STORY_CONFIG.DETOUR_RESUME_EXTRA.water;
    expect(extra).toBeGreaterThan(0);
    const between = { baseWaterL: amount + extra / 2, roverBattery: 100 };
    expect(findDetours(need, between)).toEqual([]);
    expect(findDetours(need, between, new Set(['water'])).map((d) => d.id)).toEqual(['need-water']);
    expect(findDetours(need, { baseWaterL: amount + extra, roverBattery: 100 }, new Set(['water']))).toEqual([]);
    // Uma descarga do rover ja tira a crianca do desvio
    expect(WATER_SYSTEM_CONFIG.ICE_PER_DRILL * WATER_SYSTEM_CONFIG.LITERS_PER_KG_ICE).toBeGreaterThanOrEqual(amount + extra);
  });
});
