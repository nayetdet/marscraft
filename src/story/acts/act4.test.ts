// @ts-nocheck
import { describe, expect, it } from 'vitest';
import { SAMPLE_SITE_CONFIG, SCIENCE_CONFIG } from '../../config/constants.ts';
import { SAMPLE_TYPES } from '../../data/sampleTypes.ts';
import { CLUES } from '../../mission/clues.ts';
import { sampleItem, scienceStatus } from '../../mission/sciencePackage.ts';
import { placeSampleSites } from '../../world/sampleSites.ts';
import { StoryDirector } from '../StoryDirector.ts';
import { objectiveView, scienceCounter, scienceCounterText } from '../objectiveView.ts';
import { objectiveTarget, routeWaypoint } from '../waypoints.ts';
import { TUTORIAL_STEPS } from '../tutorialSteps.ts';
import { Act4Controller } from './Act4Controller.ts';
import { ACT4_STEPS, ACT4_STEP_IDS, SAMPLE_FIELD_PLACE, SAMPLE_FIELDS, SAMPLES_TOTAL } from './act4Steps.ts';

const PER_TYPE = SAMPLE_SITE_CONFIG.PER_TYPE;
const GOAL = SCIENCE_CONFIG.POINTS_TO_LAUNCH;
const byId = (id) => ACT4_STEPS.find((step) => step.id === id);

// Motor falso: so o que o Act4Controller le do GameEngine
function fakeEngine({ stepId = null, inTraining = true, detour = null } = {}) {
  const sites = placeSampleSites({ groundTop: () => 10 });
  const collected = new Set();
  const bag = new Map(); // itemId -> quantidade na mochila
  const analyzed = [];
  const sentIds = new Set();
  const engine = {
    sampleSites: { sites, isCollected: (id) => collected.has(id) },
    stations: {
      analyzed,
      rawSampleCount: () => [...bag.values()].reduce((sum, n) => sum + n, 0),
    },
    survival: { countItem: (itemId) => bag.get(itemId) ?? 0 },
    player: { pos: { x: 0, y: 10, z: 0 } },
    story: { step: stepId ? { id: stepId } : null, inTraining, detour },
    scienceStatus: () => scienceStatus(analyzed.map((sample, order) => sampleItem(order, sample)), { sentIds, usedIds: new Set() }),
  };
  // O que a crianca faz
  const collect = (site) => {
    const type = SAMPLE_TYPES.find((t) => t.id === site.typeId);
    collected.add(site.id);
    bag.set(type.itemId, (bag.get(type.itemId) ?? 0) + 1);
  };
  const analyzeAll = () => {
    for (const type of SAMPLE_TYPES) {
      for (let n = bag.get(type.itemId) ?? 0; n > 0; n -= 1) analyzed.push({ typeId: type.id, name: type.name, points: type.points });
      bag.delete(type.itemId);
    }
  };
  const sendAll = () => analyzed.forEach((_, order) => sentIds.add(`sample:${order}`));
  return { engine, sites, collect, analyzeAll, sendAll, setStep: (id) => { engine.story.step = id ? { id } : null; } };
}

const fill = (controller, extra = {}) => {
  const s = { iceForFullTank: 6, iceNeeded: 6, ...extra };
  controller.fillSnapshot(s);
  return s;
};

describe('act 4 steps (issue #410)', () => {
  it('goes suit, collect, analyze, send, with new ids that do not repeat act 1', () => {
    expect(ACT4_STEPS.map((step) => step.id)).toEqual(['suit-for-samples', 'collect-samples', 'analyze-samples', 'send-science']);
    const old = new Set(TUTORIAL_STEPS.map((step) => step.id));
    for (const step of ACT4_STEPS) {
      expect(old.has(step.id), step.id).toBe(false);
      expect(step.act).toBe(4);
      expect(step.example).toBeDefined();
    }
    expect(SAMPLE_FIELDS).toBe(5);
    expect(SAMPLES_TOTAL).toBe(15);
  });

  it('finishes each step only with the whole job done', () => {
    expect(byId(ACT4_STEP_IDS.suit).done({ suitEquipped: false }, {})).toBe(false);
    expect(byId(ACT4_STEP_IDS.suit).done({ suitEquipped: true }, {})).toBe(true);

    const collect = byId(ACT4_STEP_IDS.collect);
    expect(collect.done({}, {})).toBe(false);
    expect(collect.done({ sampleFieldsDone: SAMPLE_FIELDS - 1 }, {})).toBe(false);
    expect(collect.done({ sampleFieldsDone: SAMPLE_FIELDS }, {})).toBe(true);

    const analyze = byId(ACT4_STEP_IDS.analyze);
    expect(analyze.done({ sampleFieldsDone: SAMPLE_FIELDS, samplesAnalyzed: SAMPLES_TOTAL - 1, samplesInBag: 1 }, {})).toBe(false);
    expect(analyze.done({ sampleFieldsDone: SAMPLE_FIELDS, samplesAnalyzed: SAMPLES_TOTAL, samplesInBag: 0 }, {})).toBe(true);
    // Nada analisado ainda: a mochila vazia nao fecha o passo
    expect(analyze.done({ sampleFieldsDone: SAMPLE_FIELDS, samplesAnalyzed: 0, samplesInBag: 0 }, {})).toBe(false);
    // Uma amostra se perdeu: com a mochila vazia o passo nao prende a crianca
    expect(analyze.done({ sampleFieldsDone: SAMPLE_FIELDS, samplesAnalyzed: SAMPLES_TOTAL - 1, samplesInBag: 0 }, {})).toBe(true);

    const send = byId(ACT4_STEP_IDS.send);
    expect(send.done({ dataSent: false, sciencePointsSent: GOAL }, {})).toBe(false);
    expect(send.done({ dataSent: true }, {})).toBe(true);
  });

  it('charges for the science: analysis and upload need battery', () => {
    expect(byId(ACT4_STEP_IDS.analyze).needs).toEqual([{ resource: 'power', amount: SCIENCE_CONFIG.ANALYZE_POWER_COST }]);
    expect(byId(ACT4_STEP_IDS.send).needs[0]).toMatchObject({ resource: 'power' });
    expect(byId(ACT4_STEP_IDS.analyze).lines.some((line) => line.text.includes(`${SCIENCE_CONFIG.ANALYZE_POWER_COST}%`))).toBe(true);
    expect(byId(ACT4_STEP_IDS.send).lines.some((line) => line.text.includes(`${GOAL} points`))).toBe(true);
  });

  it('points the arrow at the suitport, the sample field (through the airlock) and the science terminal', () => {
    expect(objectiveTarget(ACT4_STEP_IDS.suit, {})).toBe('suitport');
    expect(objectiveTarget(ACT4_STEP_IDS.collect, {})).toBe(SAMPLE_FIELD_PLACE);
    expect(routeWaypoint(SAMPLE_FIELD_PLACE, true)).toBe('airlock');
    expect(routeWaypoint(SAMPLE_FIELD_PLACE, false)).toBe(SAMPLE_FIELD_PLACE);
    expect(objectiveTarget(ACT4_STEP_IDS.analyze, {})).toBe('science');
    expect(objectiveTarget(ACT4_STEP_IDS.send, {})).toBe('science');
  });
});

describe('Act4Controller (issue #410)', () => {
  it('does nothing without a game behind it', () => {
    const controller = new Act4Controller({});
    const s = {};
    expect(() => controller.fillSnapshot(s)).not.toThrow();
    expect(s).toEqual({});
    expect(controller.waypoint(SAMPLE_FIELD_PLACE)).toBeNull();
    expect(controller.waypoint('airlock')).toBeNull();
  });

  it('counts the samples by type while the child collects, in any order', () => {
    const game = fakeEngine({ stepId: ACT4_STEP_IDS.collect });
    const controller = new Act4Controller(game.engine);
    let s = fill(controller);
    expect(s).toMatchObject({ sampleFieldsDone: 0, samplesAnalyzed: 0, samplesInBag: 0, sciencePointsFound: 0 });
    expect(s.objectiveTally.map((row) => `${row.label} ${row.have}/${row.need}`)).toEqual(SAMPLE_TYPES.map((type) => `${type.short} 0/${PER_TYPE}`));

    // 2 de enxofre e 1 de areia, fora de ordem
    const sulfur = game.sites.filter((site) => site.typeId === 'sample-sulfur');
    const sand = game.sites.filter((site) => site.typeId === 'sample-dune-sand');
    game.collect(sulfur[2]);
    game.collect(sand[0]);
    game.collect(sulfur[0]);
    const tallyBefore = s.objectiveTally;
    s = fill(controller);
    expect(s.objectiveTally).toBe(tallyBefore); // o mesmo vetor, reaproveitado
    expect(s.objectiveTally.find((row) => row.label === 'SULFUR')).toMatchObject({ have: 2, need: PER_TYPE });
    expect(s.objectiveTally.find((row) => row.label === 'DUNE SAND')).toMatchObject({ have: 1, need: PER_TYPE });
    expect(s).toMatchObject({ sampleFieldsDone: 0, samplesInBag: 3 });
    expect(byId(ACT4_STEP_IDS.collect).done(s, {})).toBe(false);

    game.collect(sulfur[1]);
    expect(fill(controller).sampleFieldsDone).toBe(1);
    for (const site of game.sites) if (!game.engine.sampleSites.isCollected(site.id)) game.collect(site);
    s = fill(controller);
    expect(s).toMatchObject({ sampleFieldsDone: SAMPLE_FIELDS, samplesInBag: SAMPLES_TOTAL });
    expect(byId(ACT4_STEP_IDS.collect).done(s, {})).toBe(true);
  });

  it('follows the analysis and the upload, and shows each clue as n/3 while sending', () => {
    const game = fakeEngine({ stepId: ACT4_STEP_IDS.analyze });
    const controller = new Act4Controller(game.engine);
    for (const site of game.sites) game.collect(site);
    let s = fill(controller);
    expect(byId(ACT4_STEP_IDS.analyze).done(s, {})).toBe(false);
    expect(s.objectiveTally.every((row) => row.have === 0 && row.need === PER_TYPE)).toBe(true);

    game.analyzeAll();
    s = fill(controller);
    expect(s).toMatchObject({ samplesAnalyzed: SAMPLES_TOTAL, samplesInBag: 0, sciencePointsFound: 42 });
    expect(s.objectiveTally.every((row) => row.have === PER_TYPE)).toBe(true);
    expect(byId(ACT4_STEP_IDS.analyze).done(s, {})).toBe(true);

    game.setStep(ACT4_STEP_IDS.send);
    s = fill(controller);
    expect(s.objectiveTally.map((row) => `${row.label} ${row.have}/${row.need}`)).toEqual(CLUES.map((clue) => `${clue.label} 0/${PER_TYPE}`));
    expect(s.scienceStep).toBe('send');
    game.sendAll();
    s = fill(controller);
    expect(s.objectiveTally.every((row) => row.have === PER_TYPE)).toBe(true);
    expect(s.scienceStep).toBeNull();
    expect(s.sciencePointsFound).toBe(42);
  });

  it('shows no tally outside its steps or during a detour', () => {
    const game = fakeEngine({ stepId: 'rover-ice' });
    const controller = new Act4Controller(game.engine);
    expect(fill(controller).objectiveTally).toBeNull();
    game.setStep(ACT4_STEP_IDS.suit);
    expect(fill(controller).objectiveTally).toBeNull();
    game.setStep(ACT4_STEP_IDS.collect);
    game.engine.story.detour = { id: 'need-power' };
    expect(fill(controller).objectiveTally).toBeNull();
  });

  it('points the arrow at the closest field that still has a rock', () => {
    const game = fakeEngine({ stepId: ACT4_STEP_IDS.collect });
    const controller = new Act4Controller(game.engine);
    const near = (pos) => [...game.sites].filter((site) => !game.engine.sampleSites.isCollected(site.id))
      .sort((a, b) => Math.hypot(a.x - pos.x, a.z - pos.z) - Math.hypot(b.x - pos.x, b.z - pos.z))[0];
    const pos = game.engine.player.pos;
    const first = near(pos);
    const target = controller.waypoint(SAMPLE_FIELD_PLACE);
    expect(target).toMatchObject({ x: first.x + 0.5, z: first.z + 0.5 });
    expect(target.label).toBe(`${SAMPLE_TYPES.find((type) => type.id === first.typeId).short} FIELD`);
    expect(controller.waypoint(SAMPLE_FIELD_PLACE)).toBe(target); // objeto reaproveitado

    // Campo vazio: a seta passa para o proximo campo
    for (const site of game.sites.filter((site) => site.typeId === first.typeId)) game.collect(site);
    const next = near(pos);
    expect(next.typeId).not.toBe(first.typeId);
    expect(controller.waypoint(SAMPLE_FIELD_PLACE)).toMatchObject({ x: next.x + 0.5, z: next.z + 0.5 });
    // O jogador anda: vale o campo mais perto de onde ele esta
    const far = game.sites.filter((site) => !game.engine.sampleSites.isCollected(site.id)).at(-1);
    pos.x = far.x;
    pos.z = far.z;
    expect(controller.waypoint(SAMPLE_FIELD_PLACE)).toMatchObject({ x: far.x + 0.5, z: far.z + 0.5 });

    for (const site of game.sites) game.collect(site);
    expect(controller.waypoint(SAMPLE_FIELD_PLACE)).toBeNull();
  });

  it('keeps the old clue routine (one clue every 2 ice blocks) away from the arrow during the guided steps', () => {
    const game = fakeEngine({ stepId: ACT4_STEP_IDS.collect, inTraining: true });
    const controller = new Act4Controller(game.engine);
    const delivered = { iceForFullTank: 6, iceNeeded: 6 - SCIENCE_CONFIG.ICE_PER_CLUE_TRIP };
    // Nos passos guiados quem manda e o passo
    expect(fill(controller, delivered).clueDue).toBe(false);
    // Na corrida final (ou com o tutorial pulado) a rotina volta, agora por campo
    game.engine.story.inTraining = false;
    game.setStep(null);
    let s = fill(controller, delivered);
    expect(s).toMatchObject({ clueDue: true, nextClue: 0, scienceStep: 'clue' });
    // Campo do gelo coletado pela metade: a pista ainda e a proxima
    const ice = game.sites.filter((site) => site.typeId === CLUES[0].typeId);
    game.collect(ice[0]);
    expect(fill(controller, delivered).nextClue).toBe(0);
    game.collect(ice[1]);
    game.collect(ice[2]);
    s = fill(controller, delivered);
    expect(s).toMatchObject({ nextClue: 1, clueDue: false });
    // Tudo coletado: nada mais para buscar, falta analisar
    for (const site of game.sites) if (!game.engine.sampleSites.isCollected(site.id)) game.collect(site);
    s = fill(controller, { iceForFullTank: 6, iceNeeded: 0 });
    expect(s).toMatchObject({ nextClue: -1, clueDue: false, scienceStep: 'analyze' });
  });
});

describe('act 4 in the objective panel (issue #410)', () => {
  const play = (director, s) => { director.update(s); return objectiveView(director, s); };
  const snap = (extra = {}) => ({ hours: 15, insideHabitat: true, iceCount: 0, iceNeeded: 6, stormPhase: 'calm', stormsSurvived: 0, propellantPct: 0, dataSent: false, launched: false, ...extra });

  // Um diretor ja no primeiro passo do ato 4
  function atAct4() {
    const director = new StoryDirector();
    director.start(snap());
    const state = {};
    for (let i = 0; i < 100 && director.step && director.step.act !== 4; i += 1) {
      const step = director.step;
      Object.assign(state, typeof step.example === 'function' ? step.example(snap(state)) : step.example);
      director.update(snap(state));
    }
    // O traje pode ter ficado vestido desde o ato 1: o teste comeca sem ele
    state.suitEquipped = false;
    return { director, state };
  }

  it('walks the 4 steps in order, with the step number inside the act', () => {
    const { director, state } = atAct4();
    let view = play(director, snap(state));
    expect(director.step.id).toBe(ACT4_STEP_IDS.suit);
    expect(view.task.label).toBe('SUIT UP AGAIN');
    expect(view.progress).toEqual({ now: 1, total: 4 });
    expect(director.drainEvents().some((event) => event.type === 'card' && event.card.title === 'ACT 4 - STEP 1/4: SUIT UP AGAIN')).toBe(true);

    view = play(director, snap({ ...state, suitEquipped: true }));
    expect(director.step.id).toBe(ACT4_STEP_IDS.collect);
    expect(view.progress).toEqual({ now: 2, total: 4 });

    // Voltar a base para recarregar o ar nao desfaz nada: o passo continua
    view = play(director, snap({ ...state, suitEquipped: false, sampleFieldsDone: 2 }));
    expect(director.step.id).toBe(ACT4_STEP_IDS.collect);

    play(director, snap({ ...state, sampleFieldsDone: SAMPLE_FIELDS, samplesInBag: SAMPLES_TOTAL, batteryCharge: 80 }));
    expect(director.step.id).toBe(ACT4_STEP_IDS.analyze);
    play(director, snap({ ...state, sampleFieldsDone: SAMPLE_FIELDS, samplesAnalyzed: SAMPLES_TOTAL, samplesInBag: 0, batteryCharge: 80 }));
    expect(director.step.id).toBe(ACT4_STEP_IDS.send);
    expect(director.act).toBe(1);

    play(director, snap({ ...state, dataSent: true, batteryCharge: 80 }));
    expect(director.step).toBeNull();
    expect(director.act).toBe(2); // a corrida final
  });

  it('sends the child to save power when the battery cannot pay for the analysis', () => {
    const { director, state } = atAct4();
    play(director, snap({ ...state, suitEquipped: true }));
    const view = play(director, snap({ ...state, sampleFieldsDone: SAMPLE_FIELDS, samplesInBag: SAMPLES_TOTAL, batteryCharge: 0 }));
    expect(director.step.id).toBe(ACT4_STEP_IDS.analyze);
    expect(director.detour?.id).toBe('need-power');
    expect(view.task.label).toBe('SAVE POWER');
  });

  it('draws the tally of the step and the science counter', () => {
    const { director, state } = atAct4();
    play(director, snap({ ...state, suitEquipped: true }));
    const tally = SAMPLE_TYPES.map((type, i) => ({ label: type.short, have: i === 2 ? 2 : 0, need: PER_TYPE }));
    const view = play(director, snap({ ...state, objectiveTally: tally, sciencePointsFound: 12, sciencePointsSent: 8 }));
    expect(view.tally).toBe(tally);
    expect(view.science).toEqual({ found: 12, sent: 8, goal: GOAL });
    expect(scienceCounterText(view.science)).toBe(`SCIENCE 12 | SENT 8/${GOAL}`);
    // Sem contagem no retrato, o painel nao desenha nenhuma
    expect(play(director, snap(state)).tally).toBeNull();
  });

  it('shows the science counter from act 2 on, or as soon as there is a point', () => {
    const act1 = { act: 1, step: { id: 'report' } };
    expect(scienceCounter(act1, {})).toBeNull();
    expect(scienceCounter(act1, { sciencePointsFound: 2 })).toEqual({ found: 2, sent: 0, goal: GOAL });
    expect(scienceCounter({ act: 1, step: { id: 'x', act: 2 } }, {})).toEqual({ found: 0, sent: 0, goal: GOAL });
    expect(scienceCounter({ act: 2, step: null }, { sciencePointsSent: 31, sciencePointsFound: 35 })).toEqual({ found: 35, sent: 31, goal: GOAL });
    // Nunca mostra menos achados do que enviados
    expect(scienceCounter({ act: 2 }, { sciencePointsSent: 9 })).toEqual({ found: 9, sent: 9, goal: GOAL });
  });
});
