import { describe, expect, it } from 'vitest';
import { StoryDirector } from './StoryDirector.js';

const REPLY = 0.5;
const WINDOW = 8;

function snap(overrides = {}) {
  return {
    hours: 15,
    insideHabitat: false,
    iceCount: 0,
    atConsole: false,
    stormPhase: 'calm',
    stormsSurvived: 0,
    propellantPct: 0,
    dataSent: false,
    launched: false,
    ...overrides,
  };
}

function started() {
  const director = new StoryDirector({ replyDelayHours: REPLY, windowHours: WINDOW });
  director.start(15);
  director.drainEvents();
  return director;
}

// Leva o diretor ate o comeco do ato 2 e devolve a hora em que isso aconteceu
function reachAct2(director) {
  director.update(snap({ insideHabitat: true }));
  director.update(snap({ insideHabitat: true, atConsole: true }));
  director.update(snap({ insideHabitat: true, hours: 15 + REPLY }));
  director.update(snap({ hours: 16, iceCount: 1 }));
  director.update(snap({ hours: 16.2, iceCount: 1, insideHabitat: true }));
  director.drainEvents();
  return 16.2;
}

describe('StoryDirector', () => {
  it('does nothing before it starts', () => {
    const director = new StoryDirector();
    director.update(snap({ insideHabitat: true }));
    expect(director.act).toBe(0);
    expect(director.objectiveText).toBe('');
    expect(director.drainEvents()).toEqual([]);
  });

  it('starts act 1 with the welcome card and the first objective', () => {
    const director = new StoryDirector();
    director.start(15);
    expect(director.act).toBe(1);
    expect(director.objectiveId).toBe('enter-base');
    expect(director.objectiveText).toMatch(/inside the base/);
    const events = director.drainEvents();
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('card');
    expect(events[0].card.text).toMatch(/Welcome to Mars/);
  });

  it('walks through act 1: enter, report, wait for the delayed reply', () => {
    const director = started();

    director.update(snap());
    expect(director.objectiveId).toBe('enter-base');

    director.update(snap({ insideHabitat: true }));
    expect(director.objectiveId).toBe('report');

    director.update(snap({ insideHabitat: true, atConsole: true }));
    expect(director.objectiveId).toBe('await-reply');
    const cards = director.drainEvents().filter((e) => e.type === 'card');
    expect(cards.at(-1).card.text).toMatch(/million km/);

    // Metade do atraso: ainda esperando, com os minutos de jogo que faltam
    director.update(snap({ insideHabitat: true, hours: 15 + REPLY / 2 }));
    expect(director.objectiveId).toBe('await-reply');
    expect(director.objectiveText).toMatch(/15 min/);

    director.update(snap({ insideHabitat: true, hours: 15 + REPLY }));
    expect(director.objectiveId).toBe('collect-ice');
  });

  it('only counts ice collected after the objective started', () => {
    const director = started();
    const base = { insideHabitat: true, iceCount: 3 };
    director.update(snap(base));
    director.update(snap({ ...base, atConsole: true }));
    director.update(snap({ ...base, hours: 15 + REPLY }));
    expect(director.objectiveId).toBe('collect-ice');

    // As 3 que ja estavam na mochila nao contam
    director.update(snap({ iceCount: 3, hours: 16 }));
    expect(director.objectiveId).toBe('collect-ice');

    // Gastou uma e pegou outra: a contagem voltou a 3, mas houve coleta
    director.update(snap({ iceCount: 2, hours: 16.1 }));
    director.update(snap({ iceCount: 3, hours: 16.2 }));
    expect(director.objectiveId).toBe('return-base');
  });

  it('opens act 2 when the ice comes home and starts the storms once', () => {
    const director = started();
    director.update(snap({ insideHabitat: true }));
    director.update(snap({ insideHabitat: true, atConsole: true }));
    director.update(snap({ insideHabitat: true, hours: 15 + REPLY }));
    director.update(snap({ hours: 16, iceCount: 1 }));
    director.drainEvents();

    director.update(snap({ hours: 16.2, iceCount: 1, insideHabitat: true }));
    expect(director.act).toBe(2);
    const events = director.drainEvents();
    expect(events.filter((e) => e.type === 'start-storms')).toHaveLength(1);
    expect(events.some((e) => e.type === 'card' && /come home/.test(e.card.text))).toBe(true);

    director.update(snap({ hours: 16.3, insideHabitat: true }));
    expect(director.drainEvents().filter((e) => e.type === 'start-storms')).toHaveLength(0);
  });

  it('shows the act 2 checklist in the objective', () => {
    const director = started();
    reachAct2(director);
    director.update(snap({ hours: 17, propellantPct: 40.6, stormsSurvived: 1 }));
    expect(director.objectiveId).toBe('act2');
    expect(director.objectiveText).toMatch(/Fuel 40%/);
    expect(director.objectiveText).toMatch(/Storms 1\/3/);
  });

  it('guides only the first solar storm', () => {
    const director = started();
    reachAct2(director);

    director.update(snap({ hours: 17, stormPhase: 'warning' }));
    expect(director.objectiveId).toBe('storm-guide');
    expect(director.drainEvents().filter((e) => e.type === 'card')).toHaveLength(1);

    director.update(snap({ hours: 18, stormPhase: 'active' }));
    expect(director.objectiveId).toBe('storm-guide');
    expect(director.drainEvents()).toHaveLength(0);

    director.update(snap({ hours: 21, stormPhase: 'calm', stormsSurvived: 1 }));
    expect(director.objectiveId).toBe('act2');

    // A segunda tempestade nao tem card nem objetivo guiado
    director.update(snap({ hours: 23, stormPhase: 'warning', stormsSurvived: 1 }));
    expect(director.objectiveId).toBe('act2');
    expect(director.drainEvents()).toHaveLength(0);
  });

  it('opens the launch window in act 3 and orders the last jobs', () => {
    const director = started();
    reachAct2(director);
    expect(director.windowHoursLeft).toBeNull();

    director.update(snap({ hours: 40, stormsSurvived: 3, propellantPct: 60 }));
    expect(director.act).toBe(3);
    expect(director.windowHoursLeft).toBeCloseTo(WINDOW);
    expect(director.objectiveId).toBe('fuel');
    expect(director.drainEvents().some((e) => e.type === 'card' && /launch window is open/.test(e.card.text))).toBe(true);

    director.update(snap({ hours: 42, stormsSurvived: 3, propellantPct: 100 }));
    expect(director.objectiveId).toBe('send-data');
    expect(director.windowHoursLeft).toBeCloseTo(WINDOW - 2);
    expect(director.objectiveText).toMatch(/Window closes in 6h 00m/);

    director.update(snap({ hours: 43, stormsSurvived: 3, propellantPct: 100, dataSent: true }));
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
