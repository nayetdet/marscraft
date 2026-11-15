// @ts-nocheck
import { describe, expect, it } from 'vitest';
import { StoryDirector } from './StoryDirector.ts';
import { objectiveView } from './objectiveView.ts';
import { objectiveTarget } from './waypoints.ts';
import { MissionSystem } from '../mission/MissionSystem.ts';
import { discoveryItem, pointsStillNeeded, sampleItem, scienceStep } from '../mission/sciencePackage.ts';
import { SCIENCE_CONFIG, STORY_CONFIG, WATER_SYSTEM_CONFIG } from '../config/constants.ts';
import { TUTORIAL_STEPS } from './tutorialSteps.ts';

const REPLY = 0.5;
const WINDOW = 8;

function snap(overrides = {}) {
  return {
    hours: 15,
    insideHabitat: false,
    iceCount: 0,
    stormPhase: 'calm',
    stormsSurvived: 0,
    propellantPct: 0,
    dataSent: false,
    launched: false,
    ...overrides,
  };
}

function started() {
  const director = new StoryDirector({
    replyDelayHours: REPLY,
    windowHours: WINDOW,
    gameHoursPerSecond: 0.02,
    comms: { millionKm: 198, oneWayMinutes: 11, dateIso: '2026-11-14' },
  });
  director.start(15);
  director.drainEvents();
  return director;
}

const cards = (director) => director.drainEvents().filter((e) => e.type === 'card').map((e) => e.card);

// Leva o diretor ate o comeco do ato 2 (com a resposta da Terra ja entregue)
function reachAct2(director) {
  director.update(snap({ insideHabitat: true }));
  director.update(snap({ insideHabitat: true, earthCalls: 1 }));
  director.update(snap({ hours: 15 + REPLY }));
  director.update(snap({ hours: 16, iceCount: 1 }));
  director.drainEvents();
}

describe('StoryDirector', () => {
  it('does nothing before it starts', () => {
    const director = new StoryDirector();
    director.update(snap({ insideHabitat: true }));
    expect(director.act).toBe(0);
    expect(director.objectiveText).toBe('');
    expect(director.drainEvents()).toEqual([]);
  });

  it('starts act 1 with the first step card and the first objective', () => {
    const director = new StoryDirector();
    director.start(15);
    expect(director.act).toBe(1);
    expect(director.objectiveId).toBe('enter-base');
    expect(director.objectiveText).toMatch(/inside the base/);
    const events = director.drainEvents();
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('card');
    expect(events[0].card.title).toBe('STEP 1/3: ENTER THE BASE');
    expect(events[0].card.step).toBe(true);
  });

  it('walks the 3 core steps without making the player wait for Earth', () => {
    const director = started();

    director.update(snap());
    expect(director.objectiveId).toBe('enter-base');

    director.update(snap({ insideHabitat: true }));
    expect(director.objectiveId).toBe('report');

    // Avisou a Terra: o proximo passo ja vale, e a resposta fica a caminho
    director.update(snap({ insideHabitat: true, earthCalls: 1 }));
    expect(director.objectiveId).toBe('collect-ice');
    expect(director.replySecondsLeft).toBe(25); // 0,5 h / 0,02 h por s
    const shown = cards(director);
    const sent = shown.find((card) => card.title === 'MESSAGE SENT');
    // O balao do passo seguinte vem logo depois do aviso do radio
    expect(shown.at(-1).title).toBe('STEP 3/3: GET 1 ICE');
    expect(sent.link).toEqual({ minutes: 11, millionKm: 198 });
    expect(sent.source).toMatch(/14\/11\/2026/);

    director.update(snap({ hours: 15 + REPLY / 2 }));
    expect(director.replySecondsLeft).toBe(13);
    expect(cards(director)).toHaveLength(0);
  });

  it('delivers the answer from Earth after the radio delay, whatever the player is doing', () => {
    const director = started();
    director.update(snap({ insideHabitat: true }));
    director.update(snap({ insideHabitat: true, earthCalls: 1 }));
    director.drainEvents();

    director.update(snap({ hours: 15 + REPLY }));
    expect(director.replySecondsLeft).toBeNull();
    const reply = cards(director);
    expect(reply).toHaveLength(1);
    expect(reply[0].title).toMatch(/EARTH ANSWERED/);
    expect(reply[0].lines.some((line) => /22 min/.test(line.text))).toBe(true);

    // A resposta chega uma vez so
    director.update(snap({ hours: 16 }));
    expect(cards(director)).toHaveLength(0);
  });

  it('still delivers the answer when the ice is collected before it arrives', () => {
    const director = started();
    director.update(snap({ insideHabitat: true }));
    director.update(snap({ insideHabitat: true, earthCalls: 1 }));
    director.update(snap({ hours: 15.1, iceCount: 1 }));
    expect(director.act).toBe(2);
    director.drainEvents();

    director.update(snap({ hours: 15 + REPLY, iceCount: 1 }));
    expect(cards(director).map((card) => card.title)).toEqual(['EARTH ANSWERED']);
  });

  it('only counts ice collected after the objective started', () => {
    const director = started();
    const base = { insideHabitat: true, iceCount: 3 };
    director.update(snap(base));
    director.update(snap({ ...base, earthCalls: 1 }));
    expect(director.objectiveId).toBe('collect-ice');

    // As 3 que ja estavam na mochila nao contam
    director.update(snap({ iceCount: 3, hours: 16 }));
    expect(director.objectiveId).toBe('collect-ice');

    // Gastou uma e pegou outra: a contagem voltou a 3, mas houve coleta
    director.update(snap({ iceCount: 2, hours: 16.1 }));
    director.update(snap({ iceCount: 3, hours: 16.2 }));
    expect(director.act).toBe(2);
  });

  it('opens act 2 as soon as the ice is collected and starts the storms once', () => {
    const director = started();
    director.update(snap({ insideHabitat: true }));
    director.update(snap({ insideHabitat: true, earthCalls: 1 }));
    director.update(snap({ hours: 15 + REPLY }));
    director.drainEvents();

    // Ainda la fora, com o gelo na mao: nao precisa voltar para a base
    director.update(snap({ hours: 16, iceCount: 1 }));
    expect(director.act).toBe(2);
    expect(director.objectiveId).toBe('act2');
    const events = director.drainEvents();
    expect(events.filter((e) => e.type === 'start-storms')).toHaveLength(1);
    expect(events.some((e) => e.type === 'card' && /FILL THE ROCKET/.test(e.card.title))).toBe(true);

    director.update(snap({ hours: 16.3, iceCount: 1 }));
    expect(director.drainEvents().filter((e) => e.type === 'start-storms')).toHaveLength(0);
  });

  it('guides only the first solar storm, with both choices and their costs', () => {
    const director = started();
    reachAct2(director);

    director.update(snap({ hours: 17, stormPhase: 'warning' }));
    expect(director.objectiveId).toBe('storm-guide');
    const guide = cards(director);
    expect(guide).toHaveLength(1);
    expect(guide[0].choices.map((choice) => choice.name)).toEqual(['HIDE', 'SHIELD']);
    for (const choice of guide[0].choices) {
      expect(choice.good).toBeTruthy();
      expect(choice.bad).toBeTruthy();
    }

    director.update(snap({ hours: 18, stormPhase: 'active' }));
    expect(director.objectiveId).toBe('storm-guide');
    expect(director.drainEvents()).toHaveLength(0);

    // A tempestade do tutorial paga a exigencia: a janela de lancamento abre
    director.update(snap({ hours: 21, stormPhase: 'calm', stormsSurvived: 1 }));
    expect(director.act).toBe(3);
    director.drainEvents();

    // Uma tempestade real depois disso nao tem card guiado
    director.update(snap({ hours: 23, stormPhase: 'warning', stormsSurvived: 1 }));
    expect(director.drainEvents()).toHaveLength(0);
  });

  it('asks for a trip back to base after each ice delivery', () => {
    const director = started();
    reachAct2(director);

    // Com o gelo na mao (ou sem ter entregue nada), ninguem manda voltar
    let s = snap({ hours: 16.5, iceCount: 1, iceNeeded: 10 });
    director.update(s);
    expect(s.needsBase).toBe(false);

    // Entregou no foguete: o tanque pede um bloco a menos
    s = snap({ hours: 16.6, iceCount: 0, iceNeeded: 9 });
    director.update(s);
    expect(director.needsBase).toBe(true);
    expect(s.needsBase).toBe(true);

    // Continua valendo ate entrar na base
    s = snap({ hours: 16.7, iceNeeded: 9 });
    director.update(s);
    expect(s.needsBase).toBe(true);
    s = snap({ hours: 16.8, insideHabitat: true, iceNeeded: 9 });
    director.update(s);
    expect(s.needsBase).toBe(false);
  });

  it('drops the trip back to base when the player picks up more ice first', () => {
    const director = started();
    reachAct2(director);
    director.update(snap({ hours: 16.5, iceCount: 1, iceNeeded: 10 }));
    director.update(snap({ hours: 16.6, iceCount: 0, iceNeeded: 9 }));
    expect(director.needsBase).toBe(true);

    director.update(snap({ hours: 16.7, iceCount: 2, iceNeeded: 9 }));
    expect(director.needsBase).toBe(false);
  });

  it('opens the launch window in act 3 and orders the last jobs', () => {
    const director = started();
    reachAct2(director);
    expect(director.windowHoursLeft).toBeNull();

    director.update(snap({ hours: 40, stormsSurvived: 3, propellantPct: 60 }));
    expect(director.act).toBe(3);
    expect(director.windowHoursLeft).toBeCloseTo(WINDOW);
    expect(director.objectiveId).toBe('fuel');
    expect(director.drainEvents().some((e) => e.type === 'card' && /LAUNCH WINDOW OPEN/.test(e.card.title))).toBe(true);

    director.update(snap({ hours: 42, stormsSurvived: 3, propellantPct: 100 }));
    expect(director.objectiveId).toBe('send-data');
    expect(director.windowHoursLeft).toBeCloseTo(WINDOW - 2);

    director.update(snap({ hours: 43, stormsSurvived: 3, propellantPct: 100, dataSent: true }));
    expect(director.objectiveId).toBe('ignite');
  });

  it('keeps asking for science until the points goal is sent, guiding find, analyze and send (issues #105, #269)', () => {
    const director = started();
    reachAct2(director);
    const mission = new MissionSystem({ cmes: [], startHours: 0 });
    mission.battery.charge = 100;
    const GOAL = SCIENCE_CONFIG.POINTS_TO_LAUNCH;
    const found = [];
    let rawSamples = 0;
    // O mesmo retrato que o GameEngine monta, com a ciencia desta partida
    const frame = (hours) => {
      const status = mission.scienceStatus(found);
      const state = { pendingPoints: status.pendingPoints, sentPoints: status.sentPoints, rawSamples };
      const s = snap({ hours, stormsSurvived: 3, propellantPct: 100, iceNeeded: 0, dataSent: mission.dataSent,
        scienceStep: scienceStep(state), sciencePointsLeft: pointsStillNeeded(state), sciencePointsSent: status.sentPoints });
      director.update(s);
      return { s, view: objectiveView(director, s), target: objectiveTarget(director.objectiveId, s) };
    };

    // Nada escaneado nem analisado: enviar nao conclui nada e o painel pede para achar ciencia
    expect(mission.sendData(found).status).toBe('empty');
    let f = frame(40);
    expect(director.objectiveId).toBe('send-data');
    expect(f.view.task).toMatchObject({ icon: 'scope', label: `FIND ${GOAL} SCIENCE POINTS` });
    expect(f.view.goals).toMatchObject({ sciencePoints: 0, scienceGoal: GOAL, dataSent: false });
    expect(f.target).toBeNull();

    // Amostra coletada la fora: a seta leva ao laboratorio para analisar
    rawSamples = 1;
    f = frame(40.5);
    expect(f.view.task).toMatchObject({ icon: 'rock', label: 'ANALYZE SAMPLES' });
    expect(f.target).toBe('science');

    // Pontos na mao bastam: enviar
    rawSamples = 0;
    found.push(sampleItem(0, { typeId: 'sample-sulfur', name: 'Sulfur', points: 4 }));
    for (let i = 0; i < GOAL - 4; i += 1) found.push(discoveryItem({ id: `thing-${i}`, title: `Thing ${i}`, category: 'base' }));
    f = frame(41);
    expect(f.view.task.label).toBe('SEND SCIENCE');
    expect(f.target).toBe('science');
    expect(director.objectiveId).toBe('send-data');

    expect(mission.sendData(found)).toMatchObject({ status: 'sent', dataSent: true });
    f = frame(41.5);
    expect(f.view.goals).toMatchObject({ sciencePoints: GOAL, dataSent: true });
    expect(director.objectiveId).toBe('ignite');
  });

  it('ends the story when the MAV launches, keeping the time left', () => {
    const director = started();
    reachAct2(director);
    director.update(snap({ hours: 40, stormsSurvived: 3, propellantPct: 100, dataSent: true }));
    director.update(snap({ hours: 43, stormsSurvived: 3, propellantPct: 100, dataSent: true, launched: true }));
    expect(director.objectiveId).toBe('done');
    expect(director.windowHoursLeft).toBeCloseTo(WINDOW - 3);

    // Depois do lancamento a janela nao fecha mais
    director.update(snap({ hours: 60, stormsSurvived: 3, launched: true }));
    expect(director.objectiveId).toBe('done');
    expect(director.drainEvents().some((e) => e.type === 'window-closed')).toBe(false);
  });

  it('closes the window once when time runs out without a launch', () => {
    const director = started();
    reachAct2(director);
    director.update(snap({ hours: 40, stormsSurvived: 3 }));
    director.drainEvents();

    director.update(snap({ hours: 40 + WINDOW, stormsSurvived: 3 }));
    expect(director.objectiveId).toBe('failed');
    expect(director.windowHoursLeft).toBe(0);
    expect(director.drainEvents().filter((e) => e.type === 'window-closed')).toHaveLength(1);

    director.update(snap({ hours: 60, stormsSurvived: 3 }));
    expect(director.drainEvents()).toHaveLength(0);
  });
});

// Issue #237: falta um recurso para o passo -> o tutorial manda buscar e depois volta ao passo
describe('StoryDirector: tutorial resource detours', () => {
  const DRINK = WATER_SYSTEM_CONFIG.DRINK_AMOUNT_FROM_DISPENSER;
  const RESUME = DRINK + STORY_CONFIG.DETOUR_RESUME_EXTRA.water;
  const FULL = { baseWaterL: 25, batteryCharge: 80, foodStock: 10, roverBattery: 100, roverActive: false };
  const TOTAL = TUTORIAL_STEPS.length;
  const state = (overrides = {}) => snap({ ...FULL, insideHabitat: true, ...overrides });

  // Tutorial no passo 2 (beber agua), com a base como em `overrides`
  function atDrink(overrides = {}) {
    const director = new StoryDirector({ training: true });
    director.start(snap({ ...FULL }));
    director.update(state(overrides));
    return director;
  }

  it('with enough resources the step shows as always, and no detour ever starts', () => {
    const director = atDrink();
    expect(director.detour).toBeNull();
    expect(director.objectiveId).toBe('drink');
    const titles = cards(director).map((card) => card.title);
    expect(titles).toEqual([`STEP 1/${TOTAL}: ENTER THE BASE`, `STEP 2/${TOTAL}: DRINK WATER`]);
    for (let i = 0; i < 20; i++) director.update(state({ baseWaterL: 25 - i * 0.5 }));
    expect(director.detour).toBeNull();
    expect(director.drainEvents()).toEqual([]);
  });

  it('starts the detour when the step begins without the resource: only the detour card shows', () => {
    const director = atDrink({ baseWaterL: 0 });
    expect(director.stepIndex).toBe(1);
    expect(director.detour.id).toBe('need-water');
    expect(director.objectiveId).toBe('need-water');
    expect(director.objectiveText).toMatch(/drill ice with the rover/);
    const titles = cards(director).map((card) => card.title);
    expect(titles).toEqual([`STEP 1/${TOTAL}: ENTER THE BASE`, 'FIRST: GET WATER']);
  });

  it('interrupts a step that is already running when the resource runs out', () => {
    const director = atDrink();
    director.drainEvents();
    director.update(state({ baseWaterL: DRINK - 0.5 }));
    expect(director.objectiveId).toBe('need-water');
    expect(cards(director).map((card) => card.title)).toEqual(['FIRST: GET WATER']);
  });

  it('the panel and the arrow show the detour, keeping the step number', () => {
    const director = atDrink({ baseWaterL: 0 });
    const s = state({ baseWaterL: 0 });
    const view = objectiveView(director, s);
    expect(view.task.label).toBe('GET WATER');
    expect(view.task.hint).toMatch(/Rover console/);
    expect(view.progress).toEqual({ now: 2, total: TOTAL });
    expect(objectiveTarget(director.objectiveId, s)).toBe('console');
    expect(objectiveTarget(director.objectiveId, { ...s, roverActive: true })).toBe('ice');
  });

  it('shows the detour card once per interruption, not every frame', () => {
    const director = atDrink({ baseWaterL: 0 });
    director.drainEvents();
    for (let i = 0; i < 30; i++) director.update(state({ baseWaterL: i * 0.05 }));
    expect(director.drainEvents()).toEqual([]);
    expect(director.objectiveId).toBe('need-water');
  });

  it('comes back to the same step when the resource is back, without restarting anything', () => {
    const director = atDrink({ baseWaterL: 0 });
    director.drainEvents();
    director.update(state({ baseWaterL: RESUME, roverDrives: 1, roverIceKg: 10 }));
    expect(director.detour).toBeNull();
    expect(director.stepIndex).toBe(1);
    expect(director.objectiveId).toBe('drink');
    expect(director.objectiveText).toBe('Drink water at the water tap');
    expect(cards(director).map((card) => card.title)).toEqual([`STEP 2/${TOTAL}: DRINK WATER`]);
    // O passo continua valendo: beber agora fecha o passo e abre o seguinte
    director.update(state({ baseWaterL: RESUME - DRINK, roverDrives: 1, roverIceKg: 10, drinkCount: 1 }));
    expect(director.stepIndex).toBe(2);
    expect(director.objectiveId).toBe('eat');
  });

  it('does not flicker: between the minimum and the resume level the detour stays', () => {
    const director = atDrink({ baseWaterL: 0 });
    director.drainEvents();
    for (let i = 0; i < 10; i++) {
      director.update(state({ baseWaterL: DRINK + (i % 2) * 0.5 }));
      expect(director.objectiveId).toBe('need-water');
    }
    expect(director.drainEvents()).toEqual([]);
    // E de volta ao passo, um gole de planta abaixo do nivel de retomada nao reabre o desvio
    director.update(state({ baseWaterL: RESUME }));
    director.update(state({ baseWaterL: RESUME - 0.5 }));
    expect(director.objectiveId).toBe('drink');
  });

  it('keeps the progress made before the interruption (the baseline is not reset)', () => {
    const director = new StoryDirector({ training: true });
    director.start(snap({ ...FULL }));
    const done = { insideHabitat: true, drinkCount: 1, mealCount: 1, earthCalls: 1, powerChecks: 1, plantCount: 1, harvestCount: 1, workoutCount: 1, washCount: 1 };
    const steps = ['drinkCount', 'mealCount', 'earthCalls', 'powerChecks', 'plantCount', 'harvestCount', 'workoutCount', 'washCount'];
    const s = state();
    director.update({ ...s });
    for (const key of steps) {
      s[key] = done[key];
      director.update({ ...s });
    }
    expect(director.objectiveId).toBe('cert-shelter');
    director.drainEvents();
    // O tanque seca no meio do passo da parede de agua
    director.update({ ...s, baseWaterL: 0 });
    expect(director.objectiveId).toBe('need-water');
    director.update({ ...s, baseWaterL: 20 });
    expect(director.objectiveId).toBe('cert-shelter');
    director.drainEvents();
    director.update({ ...s, baseWaterL: 10, shelterWaterL: 10 });
    const events = director.drainEvents();
    expect(events.filter((e) => e.type === 'certificate')).toHaveLength(1);
    expect(director.certificates.filter((id) => id === 'cert-shelter')).toHaveLength(1);
    expect(director.objectiveId).toBe('rover-drive');
  });

  it('a step that gets done during the detour advances normally, with no extra certificate', () => {
    const director = atDrink({ baseWaterL: 0 });
    director.drainEvents();
    director.update(state({ baseWaterL: 0, drinkCount: 1 }));
    expect(director.detour).toBeNull();
    expect(director.stepIndex).toBe(2);
    expect(director.certificates).toEqual([]);
    const events = director.drainEvents();
    expect(events.filter((e) => e.type === 'step-done')).toEqual([{ type: 'step-done', id: 'drink' }]);
    expect(events.filter((e) => e.type === 'card').map((e) => e.card.title)).toEqual([`STEP 3/${TOTAL}: EAT A MEAL`]);
  });

  it('switches to the deeper detour when getting the resource needs another one', () => {
    const director = atDrink({ baseWaterL: 0, roverBattery: 0 });
    expect(director.objectiveId).toBe('need-rover-power');
    director.drainEvents();
    director.update(state({ baseWaterL: 0, roverBattery: 100 }));
    expect(director.objectiveId).toBe('need-water');
    expect(cards(director).map((card) => card.title)).toEqual(['FIRST: GET WATER']);
  });

  it('skipping the tutorial in the middle of a detour leaves no detour behind', () => {
    const director = atDrink({ baseWaterL: 0 });
    expect(director.skipTraining()).toBe(true);
    expect(director.detour).toBeNull();
    expect(director.objectiveId).toBe('act2');
    director.update(state({ baseWaterL: 0 }));
    expect(director.objectiveId).toBe('act2');
  });
});
