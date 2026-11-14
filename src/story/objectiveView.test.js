import { describe, expect, it } from 'vitest';
import { StoryDirector } from './StoryDirector.js';
import { CARDS, commsCard, replyCard } from './storyChapters.js';
import { nextRocketJob, objectiveView } from './objectiveView.js';
import { pixelIconSvg } from '../ui/pixelIcons.js';

function snap(overrides = {}) {
  return {
    hours: 15,
    insideHabitat: false,
    iceCount: 0,
    iceNeeded: 10,
    atConsole: false,
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

  it('shows the 3 tutorial steps with the current one highlighted', () => {
    const story = director();
    let view = step(story);
    expect(view.act).toBe(1);
    expect(view.actName).toBe('ARRIVAL');
    expect(view.task).toMatchObject({ icon: 'door', label: 'ENTER THE BASE' });
    expect(view.steps.map((s) => s.state)).toEqual(['now', 'todo', 'todo']);
    expect(view.goals).toBeNull();
    expect(view.timer).toBeNull();
    expect(view.signal).toBeNull();

    view = step(story, { insideHabitat: true });
    expect(view.task.label).toBe('CALL EARTH');
    expect(view.steps.map((s) => s.state)).toEqual(['done', 'now', 'todo']);
  });

  it('shows the answer from Earth travelling while the next step is already on', () => {
    const story = director();
    step(story, { insideHabitat: true });
    let view = step(story, { insideHabitat: true, atConsole: true });
    expect(view.task.label).toBe('GET 1 ICE');
    expect(view.steps.map((s) => s.state)).toEqual(['done', 'done', 'now']);
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

  it('shows the three rocket goals in act 2 and the most useful job', () => {
    const story = director();
    step(story, { insideHabitat: true });
    step(story, { insideHabitat: true, atConsole: true });
    let view = step(story, { hours: 16, iceCount: 1 });
    expect(view.act).toBe(2);
    expect(view.steps).toBeNull();
    expect(view.task.label).toBe('LOAD THE ROCKET');
    expect(view.goals).toEqual({ fuelPct: 0, storms: 0, stormsNeeded: 3, dataSent: false });

    view = step(story, { hours: 17, iceCount: 0, iceNeeded: 6, propellantPct: 40.6, stormsSurvived: 1 });
    expect(view.task.label).toBe('GET ICE');
    expect(view.goals).toMatchObject({ fuelPct: 40, storms: 1 });

    view = step(story, { hours: 18, iceNeeded: 0, propellantPct: 90, stormsSurvived: 1 });
    expect(view.task).toMatchObject({ label: 'SEND DATA', key: 'G' });

    view = step(story, { hours: 19, iceNeeded: 0, propellantPct: 100, stormsSurvived: 1, dataSent: true });
    expect(view.task.label).toBe('SURVIVE THE STORMS');
    expect(view.goals.dataSent).toBe(true);
  });

  it('asks the player to get safe during the guided storm', () => {
    const story = director();
    step(story, { insideHabitat: true });
    step(story, { insideHabitat: true, atConsole: true });
    step(story, { hours: 16, iceCount: 1 });
    const view = step(story, { hours: 17, stormPhase: 'warning' });
    expect(view.task).toMatchObject({ icon: 'shield', label: 'GET SAFE', key: 'R' });
  });

  it('shows the launch window running out in act 3', () => {
    const story = director();
    step(story, { insideHabitat: true });
    step(story, { insideHabitat: true, atConsole: true });
    step(story, { hours: 16, iceCount: 1 });
    let view = step(story, { hours: 40, stormsSurvived: 3, iceNeeded: 0, propellantPct: 100, dataSent: true });
    expect(view.act).toBe(3);
    expect(view.task.label).toBe('LAUNCH!');
    expect(view.timer).toMatchObject({ icon: 'clock', label: '8h 00m', tone: 'warn' });
    expect(view.timer.fill).toBeCloseTo(1);

    view = step(story, { hours: 47, stormsSurvived: 3, iceNeeded: 0, propellantPct: 100, dataSent: true });
    expect(view.timer).toMatchObject({ label: '1h 00m', tone: 'danger' });
    expect(view.timer.fill).toBeCloseTo(0.125);

    view = step(story, { hours: 47.5, stormsSurvived: 3, propellantPct: 100, dataSent: true, launched: true });
    expect(view.task.label).toBe('LIFTOFF!');
    expect(view.timer).toBeNull();
  });
});

describe('story cards', () => {
  const all = [...Object.values(CARDS), commsCard({ millionKm: 198, oneWayMinutes: 11, dateIso: '2026-11-14' }), replyCard({ oneWayMinutes: 11 })];

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
});
