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
  director.update(snap({ insideHabitat: true, atConsole: true }));
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

  it('starts act 1 with the welcome card and the first objective', () => {
    const director = new StoryDirector();
    director.start(15);
    expect(director.act).toBe(1);
    expect(director.objectiveId).toBe('enter-base');
    expect(director.objectiveText).toMatch(/inside the base/);
    const events = director.drainEvents();
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('card');
    expect(events[0].card.title).toMatch(/WELCOME TO MARS/);
  });

  it('walks the 3 tutorial steps without making the player wait for Earth', () => {
    const director = started();

    director.update(snap());
    expect(director.objectiveId).toBe('enter-base');

    director.update(snap({ insideHabitat: true }));
    expect(director.objectiveId).toBe('report');

    // Avisou a Terra: o proximo passo ja vale, e a resposta fica a caminho
    director.update(snap({ insideHabitat: true, atConsole: true }));
    expect(director.objectiveId).toBe('collect-ice');
    expect(director.replySecondsLeft).toBe(25); // 0,5 h / 0,02 h por s
    const sent = cards(director).at(-1);
    expect(sent.link).toEqual({ minutes: 11, millionKm: 198 });
    expect(sent.source).toMatch(/14\/11\/2026/);

    director.update(snap({ hours: 15 + REPLY / 2 }));
    expect(director.replySecondsLeft).toBe(13);
    expect(cards(director)).toHaveLength(0);
  });

  it('delivers the answer from Earth after the radio delay, whatever the player is doing', () => {
    const director = started();
    director.update(snap({ insideHabitat: true }));
    director.update(snap({ insideHabitat: true, atConsole: true }));
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
    director.update(snap({ insideHabitat: true, atConsole: true }));
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
    director.update(snap({ ...base, atConsole: true }));
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
    director.update(snap({ insideHabitat: true, atConsole: true }));
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

    director.update(snap({ hours: 21, stormPhase: 'calm', stormsSurvived: 1 }));
    expect(director.objectiveId).toBe('act2');

    // A segunda tempestade nao tem card nem objetivo guiado
    director.update(snap({ hours: 23, stormPhase: 'warning', stormsSurvived: 1 }));
    expect(director.objectiveId).toBe('act2');
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
