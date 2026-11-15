// @ts-nocheck
import { describe, expect, it } from 'vitest';
import { BLOCK_IDS } from '../../config/blockTypes.ts';
import { ACT2_CONFIG as C } from '../../config/constants.ts';
import { UtilityModule } from '../../core/UtilityModule.ts';
import { CrewManager } from '../../crew/CrewManager.ts';
import { createStations } from '../../crew/stations.ts';
import { Battery } from '../../mission/energy.ts';
import { SurvivalSystem } from '../../player/SurvivalSystem.ts';
import { translate } from '../../ui/i18n.ts';
import { buildNasaSpaceshipAndBase } from '../../world/nasaSpaceshipBuilder.ts';
import { Act2Controller } from './Act2Controller.ts';
import { ACT2_PLACES, ACT2_STEPS } from './act2Steps.ts';
import { CREW_HELP_CARD, CREW_HELPERS, CrewHelp, DEFAULT_HELPER_ID, HELP_BOTANIST_ID, HELP_WATER_ID } from './act2CrewHelp.ts';

// Trade-off do ato 2 (issue #415): quem sai do posto para ajudar no conserto da janela

const WATER = CREW_HELPERS[HELP_WATER_ID];
const BOTANIST = CREW_HELPERS[HELP_BOTANIST_ID];
const FIX_WINDOW = ACT2_STEPS.find((step) => step.id === 'fix-window');

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

// Motor falso com a tripulacao de verdade (8 pessoas, cada uma no seu posto) e o modulo da base
function setup() {
  const survival = new SurvivalSystem();
  const base = {
    food: 3, graywater: 20,
    get water() { return survival.baseWater; },
    set water(liters) { survival.baseWater = liters; },
    get maxWater() { return survival.maxBaseWater; },
  };
  const mission = { battery: new Battery(80), chargeRate: 10, factoryOn: false, iceStock: 0, propellant: 0, shieldOn: false };
  const utility = new UtilityModule({ mission, survival, stations: { filter: 100 }, base });
  const crew = new CrewManager({ size: 8, stations: createStations(), base, ambient: true });
  const engine = {
    mission, survival, utility, crew,
    world: baseWorld(),
    scanJournal: { missionScans: new Set(), get missionCount() { return this.missionScans.size; } },
    events: { seed: 1, trigger: () => true },
    hud: { toasts: [], captions: [], showToast(text) { this.toasts.push(text); }, showCaption(text) { this.captions.push(text); }, renderHotbar() {} },
    storyHud: { cards: [], showCard(card) { this.cards.push(card); } },
    crewAvatars: crew.members.map((member, i) => ({ member, position: { x: 10 + i, y: 10, z: -3 }, handoffs: 0, startHandoff() { this.handoffs++; } })),
    player: { pos: { x: 0, y: 10, z: 0 }, getLookDirection: (out) => out.set(1, 0, 0) },
    story: { inTraining: true },
  };
  const act = new Act2Controller(engine);
  // A janela racha e a crianca ja achou a rachadura: comeca o passo do conserto
  act.onStepStart('get-scope', {});
  act.leak.found = true;
  act.onStepStart('fix-window', {});
  return { engine, act, utility, base, crew, survival };
}

const snapshot = (f) => { const s = {}; f.act.fillSnapshot(s); return s; };

// Faz o conserto inteiro com quem foi escolhido: espera o vidro, [F] na pessoa, [F] na janela
function repairWith(f, helper, hours = 1) {
  const member = f.crew.members[helper.memberIndex];
  f.act.update(C.STORY_REPAIR_FETCH_SECONDS + 0.1, { hours }, true);
  expect(f.act.waypoint(ACT2_PLACES.repair)).toMatchObject({ label: helper.waypointLabel, x: 10 + helper.memberIndex });
  for (const other of f.crew.members) {
    expect(f.act.interactionPrompt(other)).toBe(other === member ? helper.promptGlass : null);
  }
  f.act.interact();
  expect(f.engine.crewAvatars[helper.memberIndex].handoffs).toBe(1);
  expect(f.engine.hud.captions.at(-1)).toBe(helper.glassGiven);
  expect(f.survival.countItem(BLOCK_IDS.HAB_GLASS)).toBe(1);
  const leak = f.act.leak;
  f.engine.player.pos = { x: leak.x + 0.5, y: 10, z: leak.z + 0.5 };
  expect(FIX_WINDOW.done(snapshot(f))).toBe(false);
  f.act.interact();
  expect(f.survival.countItem(BLOCK_IDS.HAB_GLASS)).toBe(0);
  expect(f.survival.slowLeak).toBeNull();
}

describe('who leaves their post to help (issue #415)', () => {
  it('each helper on the card is the crew member who really stands at the machine that stops', () => {
    const { crew } = setup();
    expect(crew.members[WATER.memberIndex].task).toBe('water');
    expect(WATER.station).toBe('recycler');
    expect(crew.members[BOTANIST.memberIndex].task).toBe('greenhouse');
    expect(BOTANIST.station).toBe('greenhouse');
    // Quem pergunta pelo radio (a engenheira, no gerador de O2) nao e uma das opcoes
    expect(crew.members[0].task).toBe('oxygen');
    expect(CREW_HELP_CARD.choices.map((choice) => choice.id)).toEqual([HELP_WATER_ID, HELP_BOTANIST_ID]);
    expect(DEFAULT_HELPER_ID).toBe(HELP_WATER_ID);
  });

  it('shows the card with two helpers, each with a gain and a cost, in short lines', () => {
    const f = setup();
    expect(f.engine.storyHud.cards.at(-1)).toBe(CREW_HELP_CARD);
    expect(f.act.crewHelp.asking).toBe(true);
    for (const choice of CREW_HELP_CARD.choices) {
      expect(choice.key).toMatch(/^[12]$/);
      for (const text of [choice.name, choice.good, choice.bad]) expect(text.split(' ').length).toBeLessThanOrEqual(8);
    }
    expect(CREW_HELP_CARD.source).toMatch(/NASA Inspector General.*game rule/);
    // Antes da escolha ninguem traz vidro e nada para
    expect(f.utility.recyclerPaused || f.utility.greenhousePaused).toBe(false);
    expect(f.act.stationWarning).toBeNull();
    f.act.update(C.STORY_REPAIR_FETCH_SECONDS + 5, { hours: 1 }, true);
    for (const member of f.crew.members) expect(f.act.interactionPrompt(member)).toBeNull();
  });

  it('water tech path: the recycler stops, the window gets fixed, and the recycler runs again', () => {
    const f = setup();
    expect(f.act.onCardChoice(HELP_WATER_ID)).toBe(true);
    expect(f.utility.recyclerPaused).toBe(true);
    expect(f.utility.greenhousePaused).toBe(false);
    expect(f.act.stationWarning).toBe(WATER.warning);
    expect(f.engine.hud.toasts.at(-1)).toBe(WATER.stopped);
    // O custo aparece nos recursos: a agua cinza nao volta ao tanque enquanto a maquina esta parada
    const dirty = f.base.graywater;
    f.utility._recycleWater(0.5);
    expect(f.base.graywater).toBe(dirty);

    repairWith(f, WATER);
    expect(FIX_WINDOW.done(snapshot(f))).toBe(true);

    // 1 h de jogo depois da escolha a pessoa volta e a maquina anda sozinha
    f.act.update(0.1, { hours: 1 + C.CREW_HELP_HOURS - 0.05 }, true);
    expect(f.utility.recyclerPaused).toBe(true);
    f.act.update(0.1, { hours: 1 + C.CREW_HELP_HOURS + 0.05 }, true);
    expect(f.utility.recyclerPaused).toBe(false);
    expect(f.act.stationWarning).toBeNull();
    expect(f.engine.hud.toasts.at(-1)).toBe(WATER.resumed);
    f.utility._recycleWater(0.5);
    expect(f.base.graywater).toBeLessThan(dirty);
  });

  it('botanist path: the greenhouse stops, the window gets fixed, and the plants grow again', () => {
    const f = setup();
    expect(f.act.onCardChoice(HELP_BOTANIST_ID)).toBe(true);
    expect(f.utility.greenhousePaused).toBe(true);
    expect(f.utility.recyclerPaused).toBe(false);
    expect(f.act.stationWarning).toBe(BOTANIST.warning);
    expect(f.engine.hud.captions.at(-1)).toBe(BOTANIST.coming);
    // A outra maquina segue trabalhando: a agua cinza continua sendo limpa
    const dirty = f.base.graywater;
    f.utility._recycleWater(0.5);
    expect(f.base.graywater).toBeLessThan(dirty);

    repairWith(f, BOTANIST);
    expect(FIX_WINDOW.done(snapshot(f))).toBe(true);

    f.act.update(0.1, { hours: 1 + C.CREW_HELP_HOURS + 0.05 }, true);
    expect(f.utility.greenhousePaused).toBe(false);
    expect(f.act.stationWarning).toBeNull();
    expect(f.engine.hud.toasts.at(-1)).toBe(BOTANIST.resumed);
  });

  it('with no answer the default helper comes after the wait, and the step still ends', () => {
    const f = setup();
    // Jogo pausado: o tempo da resposta nao anda
    f.act.update(C.CREW_HELP_DEFAULT_SECONDS + 1, { hours: 1 }, false);
    expect(f.act.crewHelp.asking).toBe(true);
    f.act.update(C.CREW_HELP_DEFAULT_SECONDS - 1, { hours: 1 }, true);
    expect(f.act.crewHelp.asking).toBe(true);
    f.act.update(2, { hours: 1 }, true);
    expect(f.act.crewHelp.helper).toBe(CREW_HELPERS[DEFAULT_HELPER_ID]);
    expect(f.utility.recyclerPaused).toBe(true);
    // Uma tecla atrasada no card nao troca quem ja veio nem para outra maquina
    expect(f.act.onCardChoice(HELP_BOTANIST_ID)).toBe(true);
    expect(f.utility.greenhousePaused).toBe(false);
    repairWith(f, WATER);
    expect(FIX_WINDOW.done(snapshot(f))).toBe(true);
  });

  it('ignores choices from other cards and never stops two machines', () => {
    const f = setup();
    expect(f.act.onCardChoice('shield')).toBeNull();
    f.act.onCardChoice(HELP_BOTANIST_ID);
    f.act.onCardChoice(HELP_WATER_ID);
    expect(f.utility.greenhousePaused).toBe(true);
    expect(f.utility.recyclerPaused).toBe(false);
  });

  it('skipping the tutorial with the card open stops nothing', () => {
    const f = setup();
    f.act.onMissionStart({});
    f.act.update(C.CREW_HELP_DEFAULT_SECONDS + 1, { hours: 1 }, true);
    expect(f.act.crewHelp.helper).toBeNull();
    expect(f.utility.recyclerPaused || f.utility.greenhousePaused).toBe(false);
  });

  it('a base without the helpers on the card still gets the glass from the engineer', () => {
    const f = setup();
    f.crew.members.length = 2;
    f.act.onStepStart('fix-window', {});
    expect(f.act.crewHelp.asking).toBe(false);
    f.act.update(C.STORY_REPAIR_FETCH_SECONDS + 0.1, { hours: 1 }, true);
    expect(f.act.interactionPrompt(f.crew.members[0])).toBe(WATER.promptGlass);
  });

  it('a stop in progress survives saving and reloading the game', () => {
    const f = setup();
    f.act.onCardChoice(HELP_BOTANIST_ID);
    f.act.update(0.1, { hours: 5 }, true);
    f.act.update(0.1, { hours: 5.4 }, true);
    const saved = JSON.parse(JSON.stringify(f.act.saveState()));
    expect(saved.id).toBe(HELP_BOTANIST_ID);
    expect(saved.hoursLeft).toBeCloseTo(C.CREW_HELP_HOURS - 0.4);

    // Partida recarregada: outro motor, mesma parada, pelo tempo que faltava
    const loaded = setup();
    loaded.act.restoreState(saved);
    expect(loaded.utility.greenhousePaused).toBe(true);
    expect(loaded.act.stationWarning).toBe(BOTANIST.warning);
    loaded.act.update(0.1, { hours: 0 }, true);
    loaded.act.update(0.1, { hours: saved.hoursLeft - 0.05 }, true);
    expect(loaded.utility.greenhousePaused).toBe(true);
    loaded.act.update(0.1, { hours: saved.hoursLeft + 0.05 }, true);
    expect(loaded.utility.greenhousePaused).toBe(false);

    // Sem parada, save antigo ou estragado: nada para
    expect(new CrewHelp().saveState()).toBeNull();
    for (const bad of [null, undefined, {}, { id: 'nobody', hoursLeft: 1 }, { id: HELP_WATER_ID, hoursLeft: 0 }, { id: HELP_WATER_ID, hoursLeft: 'x' }]) {
      const other = setup();
      other.act.restoreState(bad);
      expect(other.utility.recyclerPaused || other.utility.greenhousePaused).toBe(false);
    }
    // Um save mexido nunca deixa a maquina parada por mais que a regra do jogo
    const long = new CrewHelp();
    long.restore({ id: HELP_WATER_ID, hoursLeft: 999 });
    expect(long.saveState().hoursLeft).toBe(C.CREW_HELP_HOURS);
  });

  it('every text of the trade-off is in the pt-BR and es catalogs', () => {
    const texts = [CREW_HELP_CARD.title, CREW_HELP_CARD.source, ...CREW_HELP_CARD.lines.map((line) => line.text)];
    for (const choice of CREW_HELP_CARD.choices) texts.push(choice.name, choice.good, choice.bad);
    for (const helper of [WATER, BOTANIST]) {
      texts.push(helper.waypointLabel, helper.coming, helper.promptGlass, helper.glassGiven, helper.stopped, helper.warning, helper.resumed);
    }
    texts.push(FIX_WINDOW.label, FIX_WINDOW.hint, FIX_WINDOW.objective, ...FIX_WINDOW.lines.map((line) => line.text));
    for (const text of texts) {
      expect(translate(text, 'pt-BR'), text).not.toBe(text);
      expect(translate(text, 'es'), text).not.toBe(text);
    }
    // Na tela a dica do [F] vira "Press F: ..." (HudManager.setInteractionPrompt)
    const onScreen = WATER.promptGlass.replace(/^\[F\]\s*/, 'Press F: ');
    expect(translate(onScreen, 'pt-BR')).toBe('Aperte F: Pegar o vidro novo da janela com a técnica da água');
    expect(translate(onScreen, 'es')).toBe('Pulsa F: Recoger el vidrio nuevo de la ventana con la técnica del agua');
    expect(translate('Press F: Replace the cracked window (uses 1 glass)', 'pt-BR')).toBe('Aperte F: Trocar a janela rachada (gasta 1 vidro)');
  });
});
