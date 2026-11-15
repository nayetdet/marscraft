// @ts-nocheck
import { describe, expect, it } from 'vitest';
import { BLOCK_IDS } from '../../config/blockTypes.ts';
import { ACT2_CONFIG as C, DUST_WEATHER_CONFIG as D } from '../../config/constants.ts';
import { DustWeather } from '../../mission/dustWeather.ts';
import { SurvivalSystem } from '../../player/SurvivalSystem.ts';
import { buildNasaSpaceshipAndBase } from '../../world/nasaSpaceshipBuilder.ts';
import { objectiveTarget, routeWaypoint } from '../waypoints.ts';
import { objectiveView } from '../objectiveView.ts';
import { StoryDirector } from '../StoryDirector.ts';
import { ACT1_STEPS } from '../tutorialSteps.ts';
import { Act2Controller } from './Act2Controller.ts';
import { ACT2_PLACES, ACT2_STEPS } from './act2Steps.ts';
import { JOURNAL_LESSON, JournalLesson } from './act2Text.ts';

// Ato 2 (issue #408): os passos e o controlador, com um `engine` falso (so o que o ato usa)

function baseWorld() {
  const blocks = new Map();
  const key = (x, y, z) => `${Math.floor(x)},${Math.floor(y)},${Math.floor(z)}`;
  const world = {
    getBlock: (x, y, z) => blocks.get(key(x, y, z)) ?? BLOCK_IDS.AIR,
    setBlock: (x, y, z, id) => blocks.set(key(x, y, z), id),
  };
  buildNasaSpaceshipAndBase(world);
  return world;
}

function fakeEngine({ seed = 1 } = {}) {
  const crew = { members: [{ name: 'Ana' }, { name: 'Leo' }] };
  const lessonHud = {
    isVisible: false, shown: [], onNext: () => {},
    show(vignette, index) { this.isVisible = true; this.shown.push(index); },
    hide() { this.isVisible = false; },
    reposition() {},
  };
  const engine = {
    mission: { dustWeather: new DustWeather({ rng: () => 0.5 }) },
    survival: new SurvivalSystem(),
    world: baseWorld(),
    scanJournal: { missionScans: new Set(), get missionCount() { return this.missionScans.size; } },
    events: { seed, triggered: [], trigger(type, hours, params) { this.triggered.push({ type, hours, params }); return true; } },
    hud: { toasts: [], captions: [], showToast(text) { this.toasts.push(text); }, showCaption(text) { this.captions.push(text); }, renderHotbar() {} },
    storyHud: { cards: [], showCard(card) { this.cards.push(card); } },
    crew,
    crewAvatars: [{ member: crew.members[0], position: { x: 10, y: 10, z: -3 }, handoffs: 0, startHandoff() { this.handoffs++; } }],
    player: { pos: { x: 0, y: 10, z: 0 }, look: { x: 1, y: 0, z: 0 }, getLookDirection(out) { return out.set(this.look.x, this.look.y, this.look.z); } },
    story: { inTraining: true },
    scannerHud: { isJournalOpen: false, journalMode: 'discoveries' },
    journalLessonHud: lessonHud,
  };
  return { engine, act: new Act2Controller(engine), dust: engine.mission.dustWeather, lessonHud };
}

// Roda o clima e o controlador juntos, de `from` a `to` horas de jogo
function runHours(f, from, to, step = 0.05) {
  for (let t = from + step; t <= to + 1e-9; t += step) {
    f.dust.step(step, t);
    f.act.update(step * 50, { hours: t }, true);
  }
}

const snapshot = (f) => { const s = {}; f.act.fillSnapshot(s); return s; };

describe('act 2 steps', () => {
  it('follow the spec order, and none is done on an empty snapshot', () => {
    expect(ACT2_STEPS.map((step) => step.id)).toEqual(['clean-panels', 'get-scope', 'find-leak', 'fix-window', 'scan-three', 'journal-lesson']);
    for (const step of ACT2_STEPS) expect(step.done({}, {}), step.id).toBe(false);
  });

  it('CLEAN THE PANELS needs both: the storm over and the panels clean', () => {
    const step = ACT2_STEPS[0];
    expect(step.done({ act2StormOver: true, act2PanelsClean: false }, {})).toBe(false);
    expect(step.done({ act2StormOver: false, act2PanelsClean: true }, {})).toBe(false);
    expect(step.done({ act2StormOver: true, act2PanelsClean: true }, {})).toBe(true);
  });

  it('the arrow sends the child outside to the panels and back inside to the engineer', () => {
    expect(routeWaypoint(objectiveTarget('clean-panels', {}), true)).toBe('airlock');
    expect(routeWaypoint(objectiveTarget('clean-panels', {}), false)).toBe(ACT2_PLACES.panels);
    expect(routeWaypoint(objectiveTarget('get-scope', {}), true)).toBe(ACT2_PLACES.engineer);
    expect(routeWaypoint(objectiveTarget('get-scope', {}), false)).toBe('airlock');
    expect(routeWaypoint(objectiveTarget('fix-window', {}), true)).toBe(ACT2_PLACES.repair);
    expect(objectiveTarget('find-leak', {})).toBeNull();
  });

  it('SCAN 3 THINGS shows the 3 targets in the objective panel and checks each one', () => {
    const f = fakeEngine();
    const director = new StoryDirector();
    director.start({});
    // Anda ate o passo scan-three com os exemplos dos passos anteriores
    const state = {};
    for (const step of [...ACT1_STEPS, ...ACT2_STEPS]) {
      if (step.id === 'scan-three') break;
      Object.assign(state, typeof step.example === 'function' ? step.example({ iceCount: 0, iceNeeded: 6, ...state }) : step.example);
      director.update({ hours: 1, iceCount: 0, iceNeeded: 6, ...state });
    }
    expect(director.step.id).toBe('scan-three');
    f.engine.scanJournal.missionScans.add('regolith');
    const s = { hours: 1, iceCount: 0, iceNeeded: 6, ...state };
    f.act.fillSnapshot(s);
    const view = objectiveView(director, s);
    expect(view.task.label).toBe('SCAN 3 THINGS');
    expect(view.loop).toBe(false);
    expect(view.steps).toEqual([{ icon: 'rock', state: 'done' }, { icon: 'moon', state: 'todo' }, { icon: 'home', state: 'todo' }]);
  });
});

describe('Act2Controller: scripted dust storm', () => {
  it('starts the storm with the step, with a short warning and the clean-or-wait card', () => {
    const f = fakeEngine();
    f.act.onStepStart('clean-panels', {});
    expect(f.dust.phase).toBe('warning');
    expect(f.dust.hoursUntilStorm).toBeCloseTo(C.STORY_DUST_STORM_LEAD_HOURS);
    expect(f.engine.storyHud.cards[0].choices.map((choice) => choice.name)).toEqual(['CLEAN NOW', 'WAIT INSIDE']);
    // As duas opcoes tem custo, e nenhuma e escolhida por botao: a crianca escolhe agindo
    for (const choice of f.engine.storyHud.cards[0].choices) {
      expect(choice.bad).toBeTruthy();
      expect(choice.id).toBeUndefined();
    }
    // Comecar de novo nao reinicia nada
    f.act.onStepStart('clean-panels', {});
    expect(f.engine.storyHud.cards).toHaveLength(1);
  });

  it('dirties the panels for real, sends the dust devil across the field once and ends sooner than a drawn storm', () => {
    const f = fakeEngine();
    f.act.onStepStart('clean-panels', {});
    const stormStart = C.STORY_DUST_STORM_LEAD_HOURS;
    runHours(f, 0, stormStart + 0.1);
    expect(f.dust.phase).toBe('storm');
    expect(f.engine.events.triggered).toEqual([]);
    expect(snapshot(f).act2StormOver).toBe(false);

    runHours(f, stormStart + 0.1, stormStart + C.STORY_DUST_STORM_HOURS - 0.1);
    expect(f.engine.events.triggered).toHaveLength(1);
    expect(f.engine.events.triggered[0]).toMatchObject({ type: 'dustDevil', params: { crossesPanels: true } });
    expect(f.dust.panels.every((dust) => dust > 0.5)).toBe(true);
    expect(C.STORY_DUST_STORM_HOURS).toBeLessThan(D.STORM_HOURS[0]);

    runHours(f, stormStart + C.STORY_DUST_STORM_HOURS - 0.1, stormStart + C.STORY_DUST_STORM_HOURS + 0.2);
    expect(f.dust.phase).toBe('clearing');
    const s = snapshot(f);
    expect(s.act2StormOver).toBe(true);
    expect(s.act2PanelsClean).toBe(false);
  });

  it('the step only ends with the storm over and every panel brushed, one by one', () => {
    const f = fakeEngine();
    const step = ACT2_STEPS[0];
    f.act.onStepStart('clean-panels', {});
    runHours(f, 0, C.STORY_DUST_STORM_LEAD_HOURS + 0.5);
    // Limpar no meio da tempestade: fica limpo agora, mas ela suja de novo
    for (let i = 0; i < f.dust.panels.length; i++) while (f.dust.cleanPanel(i) > 0);
    expect(snapshot(f).act2PanelsClean).toBe(true);
    expect(step.done(snapshot(f), {})).toBe(false);
    runHours(f, C.STORY_DUST_STORM_LEAD_HOURS + 0.5, C.STORY_DUST_STORM_LEAD_HOURS + C.STORY_DUST_STORM_HOURS + 0.2);
    expect(step.done(snapshot(f), {})).toBe(false);
    // O redemoinho limpa 2; os outros 3 a crianca limpa a mao
    f.dust.sweepPanels(2);
    expect(step.done(snapshot(f), {})).toBe(false);
    for (let i = 0; i < f.dust.panels.length; i++) while (f.dust.cleanPanel(i) > 0);
    expect(step.done(snapshot(f), {})).toBe(true);
  });

  it('wears the suit faster only while the dust storm lasts', () => {
    const f = fakeEngine();
    f.act.update(0.016, { hours: 0 }, true);
    expect(f.engine.survival.suitWearFactor).toBe(1);
    f.act.onStepStart('clean-panels', {});
    runHours(f, 0, C.STORY_DUST_STORM_LEAD_HOURS + 0.2);
    expect(f.engine.survival.suitWearFactor).toBe(C.STORM_SUIT_WEAR_MULTIPLIER);
    runHours(f, C.STORY_DUST_STORM_LEAD_HOURS + 0.2, C.STORY_DUST_STORM_LEAD_HOURS + C.STORY_DUST_STORM_HOURS + 0.2);
    expect(f.engine.survival.suitWearFactor).toBe(1);
  });

  it('leaves the drawn storms off until the mission starts', () => {
    const f = fakeEngine();
    f.act.onStepStart('clean-panels', {});
    runHours(f, 0, C.STORY_DUST_STORM_LEAD_HOURS + C.STORY_DUST_STORM_HOURS + D.CLEARING_HOURS + 0.5);
    expect(f.dust.phase).toBe('clear');
    expect(f.dust.started).toBe(false);
    expect(f.dust.nextStormAt).toBe(Infinity);
    f.dust.start(20);
    expect(f.dust.nextStormAt).toBeGreaterThan(20);
  });
});

describe('Act2Controller: hidden leak, scope and repair', () => {
  function withLeak(seed = 1) {
    const f = fakeEngine({ seed });
    f.act.onStepDone('clean-panels', {});
    f.act.onStepStart('get-scope', {});
    return f;
  }

  it('cracks one window from the list when the panels are done: still glass, slow leak, no marker', () => {
    const f = withLeak();
    const leak = f.act.leak;
    expect(C.STORY_LEAK_WINDOWS).toContainEqual({ x: leak.x, y: leak.y, z: leak.z });
    expect(f.engine.world.getBlock(leak.x, leak.y, leak.z)).toBe(BLOCK_IDS.HAB_GLASS);
    expect(leak.pane.size).toBeGreaterThan(1);
    expect(f.engine.survival.slowLeak).toEqual({ rate: C.STORY_LEAK_RATE, floor: C.STORY_LEAK_FLOOR });
    expect(f.act.leakAlert).toBe('hidden');
    expect(snapshot(f)).toMatchObject({ act2LeakFound: false, act2LeakFixed: false });
    // A semente escolhe a janela; todas as da lista existem na base
    const picked = new Set([1, 2, 3].map((seed) => { const w = withLeak(seed).act.leak; return `${w.x},${w.z}`; }));
    expect(picked.size).toBe(C.STORY_LEAK_WINDOWS.length);
    for (const w of C.STORY_LEAK_WINDOWS) expect(f.engine.world.getBlock(w.x, w.y, w.z), `${w.x},${w.z}`).toBe(BLOCK_IDS.HAB_GLASS);
  });

  it('the engineer hands over the scope with [F]; nobody else does', () => {
    const f = withLeak();
    expect(snapshot(f).act2HasScope).toBe(false);
    expect(f.act.interactionPrompt(null)).toBeNull();
    expect(f.act.interactionPrompt(f.engine.crew.members[1])).toBeNull();
    expect(f.act.interactionPrompt(f.engine.crew.members[0])).toBe('[F] Get the scope from Ana');
    f.act.interact();
    expect(f.engine.survival.countItem(BLOCK_IDS.SCOPE)).toBe(1);
    expect(f.engine.crewAvatars[0].handoffs).toBe(1);
    expect(snapshot(f).act2HasScope).toBe(true);
    expect(f.act.waypoint(ACT2_PLACES.engineer)).toMatchObject({ x: 10, z: -3 });
  });

  const scanFor = (f, hit, seconds) => {
    let state = null;
    for (let t = 0; t < seconds; t += 0.1) state = f.act.scanWindow(0.1, { id: 'habitat', hit }, true);
    return state;
  };

  it('scanning a window answers WINDOW OK or CRACKED WINDOW; only the cracked one ends the search', () => {
    const f = withLeak();
    const leak = f.act.leak;
    const other = C.STORY_LEAK_WINDOWS.find((w) => w.x !== leak.x || w.z !== leak.z);
    // Fora do passo, a luneta num vidro e um scan normal
    expect(f.act.scanWindow(0.1, { id: 'habitat', hit: other }, true)).toBeNull();
    f.act.onStepStart('find-leak', {});
    // Parede nao e janela, e sem segurar o botao nada acontece
    expect(f.act.scanWindow(0.1, { id: 'habitat', hit: { x: other.x, y: other.y - 2, z: other.z } }, true)).toBeNull();
    expect(f.act.scanWindow(0.1, { id: 'habitat', hit: other }, false)).toBeNull();

    const half = scanFor(f, other, C.WINDOW_SCAN_SECONDS / 2);
    expect(half.done).toBe(false);
    expect(half.entry.title).toBe('BASE WINDOW');
    const ok = scanFor(f, other, C.WINDOW_SCAN_SECONDS);
    expect(ok).toMatchObject({ done: true, entry: { title: 'WINDOW OK' } });
    expect(ok.entry.status).toMatch(/^Window OK\. The leak sounds \d+ blocks away$/);
    expect(f.act.leakAlert).toBe('hidden');

    // Qualquer bloco da janela rachada vale, nao so o do meio
    const edge = { x: leak.x, y: leak.y + 1, z: leak.z };
    expect(f.engine.world.getBlock(edge.x, edge.y, edge.z)).toBe(BLOCK_IDS.HAB_GLASS);
    const cracked = scanFor(f, edge, C.WINDOW_SCAN_SECONDS + 0.2);
    expect(cracked).toMatchObject({ done: true, entry: { title: 'CRACKED WINDOW' } });
    expect(f.act.leakAlert).toBe('found');
    expect(snapshot(f).act2LeakFound).toBe(true);
    // O passo seguinte comeca e a resposta continua na luneta ate a mira sair da janela
    f.act.onStepStart('fix-window', {});
    expect(f.act.scanWindow(0.1, { id: 'habitat', hit: edge }, true)).toMatchObject({ done: true, entry: { title: 'CRACKED WINDOW' } });
    expect(f.act.scanWindow(0.1, { id: 'habitat', hit: other }, true)).toBeNull();
    expect(f.act.scanWindow(0.1, { id: 'habitat', hit: edge }, true)).toBeNull();
    f.act.onStepDone('find-leak', {});
    expect(f.engine.storyHud.cards.at(-1).source).toMatch(/ultrasonic leak detector.*NASA/);
  });

  it('the engineer brings 1 glass after a short wait, and [F] on the cracked window stops the leak', () => {
    const f = withLeak();
    const leak = f.act.leak;
    const engineer = f.engine.crew.members[0];
    f.act.leak.found = true;
    f.act.onStepStart('fix-window', {});
    f.act.onCardChoice('help-water'); // #415: base de teste com 2 pessoas, o engenheiro entrega
    // Enquanto o engenheiro busca o vidro, a seta mostra a janela achada
    expect(f.act.interactionPrompt(engineer)).toBeNull();
    expect(f.act.waypoint(ACT2_PLACES.repair).label).toBe('CRACKED WINDOW');
    f.act.update(C.STORY_REPAIR_FETCH_SECONDS + 0.1, { hours: 1 }, true);
    expect(f.act.waypoint(ACT2_PLACES.repair).label).toBe('WATER TECH');
    expect(f.act.interactionPrompt(engineer)).toBe('[F] Get the new window glass from the water tech');
    f.act.interact();
    expect(f.engine.survival.countItem(BLOCK_IDS.HAB_GLASS)).toBe(1);

    // Com o vidro, a seta volta para a janela; longe dela nao ha o que trocar
    expect(f.act.waypoint(ACT2_PLACES.repair)).toMatchObject({ label: 'CRACKED WINDOW', x: leak.x + 0.5, z: leak.z + 0.5 });
    expect(f.act.interactionPrompt(engineer)).toBeNull();
    f.engine.player.pos = { x: leak.x + 0.5, y: 10, z: leak.z + 0.5 };
    expect(f.act.interactionPrompt(null)).toBe('[F] Replace the cracked window (uses 1 glass)');
    f.act.interact();
    expect(f.engine.survival.countItem(BLOCK_IDS.HAB_GLASS)).toBe(0);
    expect(f.engine.survival.slowLeak).toBeNull();
    expect(f.engine.world.getBlock(leak.x, leak.y, leak.z)).toBe(BLOCK_IDS.HAB_GLASS);
    expect(f.act.leakAlert).toBeNull();
    expect(snapshot(f).act2LeakFixed).toBe(true);
    expect(f.act.interactionPrompt(null)).toBeNull();
  });

  it('the scripted leak never empties the base air', () => {
    const f = withLeak();
    const inside = { x: 0, y: 11, z: 0 };
    const survival = f.engine.survival;
    for (let i = 0; i < 2000; i++) {
      survival.water = survival.food = survival.maxStat; // a conta aqui e so do ar
      survival.update(1, inside);
    }
    expect(survival.baseOxygen).toBe(C.STORY_LEAK_FLOOR);
    expect(survival.isDead).toBe(false);
    expect(survival.health).toBe(survival.maxStat);
  });

  it('skipping the tutorial hands over the scope and leaves no leak behind', () => {
    const f = withLeak();
    f.act.onMissionStart({});
    expect(f.engine.survival.countItem(BLOCK_IDS.SCOPE)).toBe(1);
    expect(f.engine.survival.slowLeak).toBeNull();
    expect(f.act.leakAlert).toBeNull();
    expect(f.act.interactionPrompt(f.engine.crew.members[0])).toBeNull();
    // Quem ja tem a luneta nao ganha outra
    f.act.onMissionStart({});
    expect(f.engine.survival.countItem(BLOCK_IDS.SCOPE)).toBe(1);
  });
});

describe('Act2Controller: three scans and the journal lesson', () => {
  it('wants one Mars target, one sky target and one base target scanned in this mission', () => {
    const f = fakeEngine();
    const scans = f.engine.scanJournal.missionScans;
    expect(snapshot(f)).toMatchObject({ act2ScanMars: false, act2ScanSky: false, act2ScanBase: false });
    scans.add('crater-rim'); // paisagem tambem e Marte
    scans.add('habitat');
    expect(snapshot(f)).toMatchObject({ act2ScanMars: true, act2ScanSky: false, act2ScanBase: true });
    expect(ACT2_STEPS[4].done(snapshot(f), {})).toBe(false);
    scans.add('phobos'); // sem a Terra no ceu, qualquer alvo do ceu vale
    expect(ACT2_STEPS[4].done(snapshot(f), {})).toBe(true);
  });

  it('JournalLesson walks 3 vignettes and ends on the last one', () => {
    const lesson = new JournalLesson();
    expect(JOURNAL_LESSON).toHaveLength(3);
    expect(lesson.vignette).toBe(JOURNAL_LESSON[0]);
    expect(lesson.next()).toBe(false);
    expect(lesson.next()).toBe(false);
    expect(lesson.vignette).toBe(JOURNAL_LESSON[2]);
    expect(lesson.next()).toBe(true);
    expect(lesson.vignette).toBeNull();
    expect(lesson.next()).toBe(true);
  });

  it('shows the lesson when the journal opens, one vignette at a time, once per game', () => {
    const f = fakeEngine();
    f.act.onStepStart('journal-lesson', {});
    f.act.update(0.016, { hours: 1 }, true);
    expect(f.lessonHud.isVisible).toBe(false);

    f.engine.scannerHud.isJournalOpen = true;
    f.act.update(0.016, { hours: 1 }, true);
    expect(f.lessonHud.shown).toEqual([0]);
    f.lessonHud.onNext();
    expect(f.lessonHud.shown).toEqual([0, 1]);
    // Fechar o diario no meio guarda onde a aula parou
    f.engine.scannerHud.isJournalOpen = false;
    f.act.update(0.016, { hours: 1 }, true);
    expect(f.lessonHud.isVisible).toBe(false);
    f.engine.scannerHud.isJournalOpen = true;
    f.act.update(0.016, { hours: 1 }, true);
    expect(f.lessonHud.shown).toEqual([0, 1, 1]);
    f.lessonHud.onNext();
    expect(snapshot(f).act2JournalLessonDone).toBe(false);
    f.lessonHud.onNext();
    expect(f.lessonHud.isVisible).toBe(false);
    expect(snapshot(f).act2JournalLessonDone).toBe(true);
    // Depois de vista, nao volta
    f.act.update(0.016, { hours: 1 }, true);
    expect(f.lessonHud.isVisible).toBe(false);
  });
});
