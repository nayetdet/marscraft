// @ts-nocheck
import { describe, expect, it } from 'vitest';
import { StoryDirector } from './StoryDirector.ts';
import { CARDS, commsCard, earthFarewell, replyCard } from './storyChapters.ts';
import { nextRocketJob, objectiveView } from './objectiveView.ts';
import { pixelIconSvg } from '../ui/pixelIcons.ts';
import { SCIENCE_CONFIG } from '../config/constants.ts';

function snap(overrides = {}) {
  return {
    hours: 15,
    insideHabitat: false,
    iceCount: 0,
    iceNeeded: 6,
    stormPhase: 'calm',
    stormsSurvived: 0,
    propellantPct: 0,
    dataSent: false,
    launched: false,
    ...overrides,
  };
}

function director() {
  const story = new StoryDirector({ replyDelayHours: 0.5, windowHours: 8, gameHoursPerSecond: 0.02 });
  story.start();
  return story;
}

// Faz os 5 passos do tutorial: o ato 2 (e a janela de lancamento) comeca na hora 16, com 1 gelo
// ja entregue no foguete
function reachAct2(story) {
  story.update(snap({ insideHabitat: true }));
  story.update(snap({ insideHabitat: true, earthCalls: 1 }));
  story.update(snap({ hours: 16, iceCount: 1 }));
  story.update(snap({ hours: 16, iceNeeded: 5 }));
  story.update(snap({ hours: 16, iceNeeded: 5, scanCount: 1 }));
}

// Avanca o diretor e devolve o que o painel desenha para o mesmo retrato
function step(story, overrides) {
  const s = snap(overrides);
  story.update(s);
  return objectiveView(story, s);
}

describe('nextRocketJob', () => {
  it('fetches ice, then loads it, while the tank still needs ice', () => {
    expect(nextRocketJob({ iceCount: 0, iceNeeded: 4 })).toBe('ice');
    expect(nextRocketJob({ iceCount: 2, iceNeeded: 4 })).toBe('load');
  });

  it('asks for a trip back to base after a delivery, until more ice is picked up', () => {
    expect(nextRocketJob({ iceCount: 0, iceNeeded: 4, needsBase: true })).toBe('base');
    expect(nextRocketJob({ iceCount: 1, iceNeeded: 4, needsBase: true })).toBe('load');
    expect(nextRocketJob({ iceNeeded: 0, needsBase: true })).toBe('data');
  });

  it('sends the data while the factory works, then only the storms are left', () => {
    expect(nextRocketJob({ iceNeeded: 0, propellantPct: 70 })).toBe('data');
    expect(nextRocketJob({ iceNeeded: 0, propellantPct: 70, dataSent: true })).toBe('fuel');
    expect(nextRocketJob({ iceNeeded: 0, propellantPct: 100, dataSent: true })).toBe('storms');
  });
});

describe('objectiveView', () => {
  it('draws nothing before the story starts', () => {
    expect(objectiveView(new StoryDirector(), snap())).toBeNull();
  });

  it('shows the current tutorial step with its hint and its number', () => {
    const story = director();
    let view = step(story);
    expect(view.act).toBe(1);
    expect(view.task).toMatchObject({ icon: 'door', label: 'ENTER THE BASE' });
    expect(view.task.hint).toMatch(/[Pp]ress F/);
    expect(view.progress).toEqual({ now: 1, total: 5 });
    expect(view.steps).toBeNull();
    expect(view.loop).toBe(false);
    // A meta e o foguete vazio aparecem desde o primeiro passo
    expect(view.goal).toBe('GOAL: FLY HOME');
    expect(view.rocket).toEqual({ total: 6, loaded: 0, fuel: 0 });
    expect(view.goals).toBeNull();
    expect(view.timer).toBeNull();
    expect(view.signal).toBeNull();

    view = step(story, { insideHabitat: true });
    expect(view.task.label).toBe('CALL EARTH');
    expect(view.progress).toEqual({ now: 2, total: 5 });
  });

  it('shows the answer from Earth travelling while the next step is already on', () => {
    const story = director();
    step(story, { insideHabitat: true });
    let view = step(story, { insideHabitat: true, earthCalls: 1 });
    expect(view.task.label).toBe('GET 1 ICE');
    expect(view.progress).toEqual({ now: 3, total: 5 });
    expect(view.timer).toBeNull();
    expect(view.signal).toMatchObject({ seconds: 25, returning: false, label: 'MESSAGE ON ITS WAY' });
    expect(view.signal.position).toBeCloseTo(0);

    // Um quarto do caminho: o sinal esta no meio da ida
    view = step(story, { hours: 15.125 });
    expect(view.signal.returning).toBe(false);
    expect(view.signal.position).toBeCloseTo(0.48);

    // Passou da metade: a resposta esta voltando da Terra para Marte
    view = step(story, { hours: 15.375 });
    expect(view.signal).toMatchObject({ seconds: 7, returning: true, label: 'EARTH IS ANSWERING' });
    expect(view.signal.position).toBeCloseTo(0.56);

    view = step(story, { hours: 15.5 });
    expect(view.signal).toBeNull();
  });

  it('repeats the work loop in act 2: get ice, load the rocket, back to base', () => {
    const story = director();
    reachAct2(story);
    let view = step(story, { hours: 16.1, iceCount: 1, iceNeeded: 5 });
    expect(view.act).toBe(2);
    expect(view.loop).toBe(true);
    expect(view.task.label).toBe('LOAD THE ROCKET');
    expect(view.steps).toEqual([
      { icon: 'ice', state: 'done' },
      { icon: 'rocket', state: 'now' },
      { icon: 'home', state: 'todo' },
    ]);
    expect(view.goals).toMatchObject({ storms: 0, stormsNeeded: 1, dataSent: false, clues: null });
    expect(view.progress).toBeNull(); // o numero do passo so existe no tutorial

    // Entregou o gelo: o degrau acende e o passo seguinte e voltar a base
    view = step(story, { hours: 16.2, iceCount: 0, iceNeeded: 4 });
    expect(view.task).toMatchObject({ icon: 'home', label: 'BACK TO BASE' });
    expect(view.steps.map((s) => s.state)).toEqual(['done', 'done', 'now']);
    expect(view.rocket).toEqual({ total: 6, loaded: 2, fuel: 0 });

    // De volta a base, a volta recomeca
    view = step(story, { hours: 16.4, insideHabitat: true, iceNeeded: 4 });
    expect(view.task.label).toBe('GET ICE');
    expect(view.steps.map((s) => s.state)).toEqual(['now', 'todo', 'todo']);

    // Gelo entregue (azul) vai virando combustivel (verde) com a fabrica ligada
    view = step(story, { hours: 17, iceNeeded: 2, propellantPct: 34, stormsSurvived: 1 });
    expect(view.rocket).toEqual({ total: 6, loaded: 4, fuel: 2 });
    expect(view.goals).toMatchObject({ storms: 1 });
  });

  it('leaves the loop when the tank has all its ice', () => {
    const story = director();
    reachAct2(story);

    let view = step(story, { hours: 18, iceNeeded: 0, propellantPct: 90, stormsSurvived: 0 });
    expect(view.task).toMatchObject({ label: 'SEND SCIENCE' });
    expect(view.steps).toBeNull();
    expect(view.loop).toBe(false);
    expect(view.rocket).toEqual({ total: 6, loaded: 6, fuel: 5 });

    view = step(story, { hours: 19, iceNeeded: 0, propellantPct: 100, stormsSurvived: 0, dataSent: true });
    expect(view.task.label).toBe('SURVIVE THE STORMS');
    expect(view.rocket.fuel).toBe(6);
    expect(view.goals.dataSent).toBe(true);
  });

  it('asks the player to get safe during the guided storm', () => {
    const story = director();
    reachAct2(story);
    const view = step(story, { hours: 17, stormPhase: 'warning' });
    expect(view.task).toMatchObject({ icon: 'shield', label: 'GET SAFE', key: null });
    expect(view.steps).toBeNull();
  });

  it('shows the launch window running out from the start of act 2', () => {
    const story = director();
    reachAct2(story);
    // A janela abre com o ato 2 (hora 16) e dura 8 h neste teste
    let view = step(story, { hours: 16, iceNeeded: 5 });
    expect(view.act).toBe(2);
    expect(view.timer).toMatchObject({ icon: 'clock', label: '8h 00m', tone: 'warn' });
    expect(view.timer.fill).toBeCloseTo(1);

    view = step(story, { hours: 23, stormsSurvived: 3, iceNeeded: 0, propellantPct: 100, dataSent: true });
    expect(view.task.label).toBe('LAUNCH!');
    expect(view.timer).toMatchObject({ label: '1h 00m', tone: 'danger' });
    expect(view.timer.fill).toBeCloseTo(0.125);

    view = step(story, { hours: 23.5, stormsSurvived: 3, propellantPct: 100, dataSent: true, launched: true });
    expect(view.task.label).toBe('LIFTOFF!');
    expect(view.timer).toBeNull();
  });
});

describe('story cards', () => {
  const all = [...Object.values(CARDS), commsCard({ millionKm: 198, oneWayMinutes: 11, dateIso: '2026-11-14' }), replyCard({ oneWayMinutes: 11 }),
    earthFarewell({ sentPoints: 12, discoveries: 3, samples: 2, oneWayMinutes: 11 })];

  it('keeps every line short and gives it an icon that exists', () => {
    for (const card of all) {
      expect(card.title.split(' ').length).toBeLessThanOrEqual(5);
      for (const line of card.lines ?? []) {
        expect(line.text.split(' ').length).toBeLessThanOrEqual(8);
        expect(() => pixelIconSvg(line.icon)).not.toThrow();
      }
      for (const choice of card.choices ?? []) expect(() => pixelIconSvg(choice.icon)).not.toThrow();
    }
  });

  it('closes the story with a message from Earth that names the science sent and the radio delay', () => {
    const card = earthFarewell({ sentPoints: 12, discoveries: 3, samples: 1, oneWayMinutes: 11 });
    expect(card.title).toBe('MESSAGE FROM EARTH');
    expect(card.lines.map((line) => line.text)).toContain('Earth got your science: 12 points');
    expect(card.lines.map((line) => line.text)).toContain('3 discoveries and 1 sample');
    expect(card.note).toMatch(/11 min/);
    // Sem nada contado, a linha das descobertas some
    expect(earthFarewell({ sentPoints: 10 }).lines).toHaveLength(3);
  });
});
