// @ts-nocheck
import { describe, expect, it } from 'vitest';
import { StoryDirector } from './StoryDirector.ts';
import { objectiveView } from './objectiveView.ts';
import { objectiveTarget, routeWaypoint } from './waypoints.ts';
import { CERTIFICATES, certificateBadge } from './storyChapters.ts';
import { CORE_STEPS, STEP_COLORS, TUTORIAL_STEPS, TUTORIAL_STEP_IDS, stepCard } from './tutorialSteps.ts';
import { ZONE_COLORS } from '../base/basePosters.ts';
import { pixelIconSvg } from '../ui/pixelIcons.ts';

// Tutorial guiado (teste com jogadores de 15/11/2026): um passo por vez, do basico ao avancado
function snap(overrides = {}) {
  return {
    hours: 15, insideHabitat: false, iceCount: 0, iceNeeded: 10, stormPhase: 'calm',
    stormsSurvived: 0, propellantPct: 0, dataSent: false, launched: false,
    drinkCount: 0, mealCount: 0, earthCalls: 0, powerChecks: 0, plantCount: 0, harvestCount: 0,
    workoutCount: 0, washCount: 0, shelterWaterL: 0, roverDrives: 0, roverIceKg: 0, scanCount: 0,
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
  ['wash', { washCount: 1 }],
  ['cert-shelter', { shelterWaterL: 10 }],
  ['rover-drive', { roverDrives: 1 }],
  ['rover-ice', { roverIceKg: 10 }],
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
    before.update(snap({ insideHabitat: true }));
    before.update(snap({ insideHabitat: true, earthCalls: 1 }));
    expect(before.objectiveId).toBe('collect-ice');
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
    expect(certificateBadge(shelter, { shelterWaterL: 10 }).line).toMatch(/10 L wall blocks 56%/);
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

  it('has unique ids and keeps the 3 core steps for a skipped tutorial', () => {
    expect(new Set(TUTORIAL_STEP_IDS).size).toBe(TUTORIAL_STEPS.length);
    expect(CORE_STEPS.map((step) => step.id)).toEqual(['enter-base', 'report', 'collect-ice']);
  });
});

describe('tutorial places', () => {
  it('calls Earth at the radio terminal, away from the rover console', () => {
    expect(objectiveTarget('report')).toBe('science');
    expect(objectiveTarget('rover-drive')).toBe('console');
  });

  it('routes the indoor stations through the airlock from outside', () => {
    for (const place of ['powerroom', 'greenhouse', 'gym', 'shelter', 'water', 'kitchen', 'bathroom', 'science', 'console']) {
      expect(routeWaypoint(place, false)).toBe('airlock');
      expect(routeWaypoint(place, true)).toBe(place);
    }
  });

  it('points the rover at the ice crater directly: the driver is not walking out', () => {
    expect(routeWaypoint(objectiveTarget('rover-ice'), false)).toBe('ice');
  });
});
