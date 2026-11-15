// @ts-nocheck
import { describe, expect, it } from 'vitest';
import { BLOCK_IDS } from '../config/blockTypes.ts';
import { DOSE_CONFIG, ENERGY_CONFIG, MAV_CONFIG, STORY_CONFIG, WATER_SYSTEM_CONFIG } from '../config/constants.ts';
import { GameEngine } from '../core/GameEngine.ts';
import { missionReport } from '../mission/missionReport.ts';
import { SurvivalSystem } from '../player/SurvivalSystem.ts';
import { translate } from '../ui/i18n.ts';
import {
  FIRST_ICE_NO_ICE_TOAST, FIRST_ICE_ROCKET_ID, FIRST_ICE_ROCKET_TOAST, FIRST_ICE_TANK_ID, firstIceBatteryPct, firstIceCard,
  firstIceSummary, firstIceTankToast, firstIceWaterL, restoreFirstIce, saveFirstIce, shouldAskFirstIce,
} from './firstIceChoice.ts';
import { tutorialStepById } from './tutorialSteps.ts';

// Trade-off do ato 1 (issue #413): o primeiro gelo vai para o tanque da base ou para o foguete

const LOAD_ROCKET = tutorialStepById('load-rocket');

const REPORT_STATS = {
  hoursPlayed: 60, sols: 3, deaths: 0, stormHours: 9, protectedStormHours: 9, totalDoseMsv: 0.4,
  boneDensity: 95, muscleStrength: 95, workoutCount: 4, harvestCount: 5, cropVariety: 3, iceDelivered: 10, standbyHours: 0,
  discoveries: 14, scanTotal: 24, sampleTypes: 3, samplesAnalyzed: 4, sciencePointsSent: 20, sciencePointsGoal: 10,
};

// So o que `_onFirstIceChoice` usa do motor, com a mochila e o tanque de verdade
function engineWithIce(blocks = 1) {
  const engine = Object.create(GameEngine.prototype);
  engine.survival = new SurvivalSystem();
  for (let i = 0; i < blocks; i++) engine.survival.addBlockToInventory(BLOCK_IDS.METEOR_ICE);
  engine.hud = { toasts: [], selectedSlot: 0, showToast(text) { this.toasts.push(text); }, renderHotbar() {} };
  engine.playerHand = { setHeldBlock() {} };
  return engine;
}

describe('first ice: base tank or rocket (issue #413)', () => {
  it('asks once per game, when the ice step ends with ice in the backpack', () => {
    expect(shouldAskFirstIce({ asked: false, stepId: 'collect-ice', iceCount: 1 })).toBe(true);
    expect(shouldAskFirstIce({ asked: true, stepId: 'collect-ice', iceCount: 1 })).toBe(false);
    expect(shouldAskFirstIce({ asked: false, stepId: 'collect-ice', iceCount: 0 })).toBe(false);
    expect(shouldAskFirstIce({ asked: false, stepId: 'load-rocket', iceCount: 1 })).toBe(false);
  });

  it('the card shows both options with the real cost from the constants', () => {
    const liters = STORY_CONFIG.FIRST_ICE_BLOCKS * DOSE_CONFIG.ROVER_ICE_KG_PER_MAV_BLOCK * WATER_SYSTEM_CONFIG.LITERS_PER_KG_ICE;
    const battery = STORY_CONFIG.FIRST_ICE_BLOCKS * ENERGY_CONFIG.ISRU_DRAIN_PER_HOUR * MAV_CONFIG.ISRU_HOURS_PER_ICE_BLOCK;
    expect(firstIceWaterL()).toBe(liters);
    expect(firstIceBatteryPct()).toBeCloseTo(battery, 1);
    const card = firstIceCard();
    expect(card.choices.map((choice) => [choice.id, choice.key])).toEqual([[FIRST_ICE_TANK_ID, '1'], [FIRST_ICE_ROCKET_ID, '2']]);
    expect(card.choices[0].good).toContain(`+${liters} L`);
    expect(card.choices[1].bad).toContain(`${firstIceBatteryPct()}%`);
    // Nenhuma opcao e de graca, e cada frase cabe no card
    for (const choice of card.choices) {
      expect(choice.good && choice.bad).toBeTruthy();
      for (const text of [choice.name, choice.good, choice.bad]) expect(text.split(' ').length).toBeLessThanOrEqual(8);
    }
    expect(card.source).toMatch(/NASA OGA/);
  });

  it('TANK pours the ice into the base tank and the rocket step ends without the block', () => {
    const engine = engineWithIce();
    engine.survival.baseWater = 40;
    expect(engine._onCardChoice(FIRST_ICE_TANK_ID)).toBe(true);
    expect(engine.survival.countWaterIce()).toBe(0);
    expect(engine.survival.baseWater).toBe(40 + firstIceWaterL());
    expect(engine._firstIceChoice).toBe(FIRST_ICE_TANK_ID);
    expect(engine.hud.toasts.at(-1)).toBe(firstIceTankToast(firstIceWaterL()));
    // O foguete nao recebeu nada (iceNeeded igual), mas o passo termina
    const firstIceToTank = engine._firstIceChoice === FIRST_ICE_TANK_ID;
    expect(LOAD_ROCKET.done({ iceNeeded: 6, firstIceToTank }, { iceNeeded: 6 })).toBe(true);
  });

  it('ROCKET keeps the ice in the backpack and the step ends only when the rocket is loaded', () => {
    const engine = engineWithIce();
    const water = engine.survival.baseWater;
    expect(engine._onCardChoice(FIRST_ICE_ROCKET_ID)).toBe(true);
    expect(engine.survival.countWaterIce()).toBe(1);
    expect(engine.survival.baseWater).toBe(water);
    expect(engine._firstIceChoice).toBe(FIRST_ICE_ROCKET_ID);
    expect(engine.hud.toasts.at(-1)).toBe(FIRST_ICE_ROCKET_TOAST);
    const firstIceToTank = engine._firstIceChoice === FIRST_ICE_TANK_ID;
    expect(LOAD_ROCKET.done({ iceNeeded: 6, firstIceToTank }, { iceNeeded: 6 })).toBe(false);
    expect(LOAD_ROCKET.done({ iceNeeded: 5, firstIceToTank }, { iceNeeded: 6 })).toBe(true);
  });

  it('TANK with no ice left changes nothing and records no choice', () => {
    const engine = engineWithIce(0);
    const water = engine.survival.baseWater;
    expect(engine._onCardChoice(FIRST_ICE_TANK_ID)).toBe(true);
    expect(engine.survival.baseWater).toBe(water);
    expect(engine._firstIceChoice ?? null).toBeNull();
    expect(engine.hud.toasts.at(-1)).toBe(FIRST_ICE_NO_ICE_TOAST);
  });

  it('with the tank almost full the toast says how much really went in, in the 3 languages', () => {
    const engine = engineWithIce();
    engine.survival.baseWater = engine.survival.maxBaseWater - 3;
    engine._onCardChoice(FIRST_ICE_TANK_ID);
    const toast = engine.hud.toasts.at(-1);
    expect(toast).toBe('Ice in the base tank: +3 L of water. The rocket still needs this block.');
    expect(translate(toast, 'pt-BR')).toBe('Gelo no tanque da base: +3 L de água. O foguete ainda precisa deste bloco.');
    expect(translate(toast, 'es')).toBe('Hielo en el tanque de la base: +3 L de agua. El cohete aún necesita este bloque.');
    expect(translate(firstIceTankToast(firstIceWaterL()), 'pt-BR')).toContain(`+${firstIceWaterL()} L de água`);
  });

  it('the final report says where the first ice went, or nothing if the card was not answered', () => {
    const tank = missionReport({ ...REPORT_STATS, firstIceChoice: FIRST_ICE_TANK_ID }).firstIce;
    expect(tank).toMatchObject({ choice: FIRST_ICE_TANK_ID });
    expect(tank.text).toBe(`First ice: base tank (+${firstIceWaterL()} L of water, rocket waited)`);
    const rocket = missionReport({ ...REPORT_STATS, firstIceChoice: FIRST_ICE_ROCKET_ID }).firstIce;
    expect(rocket.text).toBe(`First ice: rocket fuel (${firstIceBatteryPct()}% battery, no new water)`);
    expect(missionReport({ ...REPORT_STATS, firstIceChoice: null }).firstIce).toBeNull();
    expect(missionReport(REPORT_STATS).firstIce).toBeNull();
    expect(firstIceSummary({ firstIceChoice: 'something-else' })).toBeNull();
  });

  it('the choice is saved with the game: after a reload the card does not come back', () => {
    const saved = JSON.parse(JSON.stringify(saveFirstIce(true, FIRST_ICE_TANK_ID)));
    const loaded = restoreFirstIce(saved);
    expect(loaded).toEqual({ asked: true, choice: FIRST_ICE_TANK_ID });
    expect(shouldAskFirstIce({ asked: loaded.asked, stepId: 'collect-ice', iceCount: 1 })).toBe(false);
    expect(firstIceSummary({ firstIceChoice: loaded.choice }).choice).toBe(FIRST_ICE_TANK_ID);
    // Card visto e nao respondido: nao reaparece, e o boletim fica sem a linha
    expect(restoreFirstIce(saveFirstIce(true, undefined))).toEqual({ asked: true, choice: null });
    // Save antigo ou estragado: partida nova para o card
    for (const bad of [null, undefined, {}, { asked: 'yes' }, { choice: 'first-ice-moon' }]) {
      expect(restoreFirstIce(bad)).toEqual({ asked: false, choice: null });
    }
    // Uma escolha valida conta como card ja visto
    expect(restoreFirstIce({ choice: FIRST_ICE_ROCKET_ID })).toEqual({ asked: true, choice: FIRST_ICE_ROCKET_ID });
  });

  it('every text of the trade-off is in the pt-BR and es catalogs', () => {
    const card = firstIceCard();
    const texts = [card.title, card.source, ...card.lines.map((line) => line.text), FIRST_ICE_ROCKET_TOAST, FIRST_ICE_NO_ICE_TOAST];
    for (const choice of card.choices) texts.push(choice.name, choice.good, choice.bad);
    for (const id of [FIRST_ICE_TANK_ID, FIRST_ICE_ROCKET_ID]) texts.push(firstIceSummary({ firstIceChoice: id }).text);
    for (const liters of [0, 1, 7, firstIceWaterL()]) texts.push(firstIceTankToast(liters));
    for (const text of texts) {
      expect(translate(text, 'pt-BR'), text).not.toBe(text);
      expect(translate(text, 'es'), text).not.toBe(text);
    }
  });
});
