// @ts-nocheck
import { describe, expect, it } from 'vitest';
import { SCIENCE_CONFIG, STATION_CONFIG } from '../../config/constants.ts';
import { missionReport } from '../../mission/missionReport.ts';
import { translate } from '../../ui/i18n.ts';
import { Act2Controller } from './Act2Controller.ts';
import { ACT2_STEPS } from './act2Steps.ts';
import { SUIT_CHOICE_CARD, SUIT_RADIATION_CUT_PERCENT, shouldShowSuitChoice, suitTradeSummary } from './act2SuitChoice.ts';

// Trade-off do ato 2 (issue #417): gastar ciencia no traje ou mandar para a Terra

const REPORT_STATS = {
  hoursPlayed: 60, sols: 3, deaths: 0, stormHours: 9, protectedStormHours: 9, totalDoseMsv: 0.4,
  boneDensity: 95, muscleStrength: 95, workoutCount: 4, harvestCount: 5, cropVariety: 3, iceDelivered: 10, standbyHours: 0,
  discoveries: 14, scanTotal: 24, sampleTypes: 3, samplesAnalyzed: 4, sciencePointsSent: 20, sciencePointsGoal: 10,
};

function controller() {
  const engine = { storyHud: { cards: [], showCard(card) { this.cards.push(card); } } };
  return { engine, act: new Act2Controller(engine) };
}

describe('suit or Earth (issue #417)', () => {
  it('the card comes once per game, right after the 3 scans', () => {
    expect(ACT2_STEPS.map((step) => step.id)).toContain('scan-three');
    expect(shouldShowSuitChoice('scan-three', false)).toBe(true);
    expect(shouldShowSuitChoice('scan-three', true)).toBe(false);
    expect(shouldShowSuitChoice('fix-window', false)).toBe(false);

    const { engine, act } = controller();
    act.onStepDone('fix-window', {});
    expect(engine.storyHud.cards).not.toContain(SUIT_CHOICE_CARD);
    act.onStepDone('scan-three', {});
    expect(engine.storyHud.cards.at(-1)).toBe(SUIT_CHOICE_CARD);
    // O passo terminando de novo (ou os seguintes) nao repete o card
    act.onStepDone('scan-three', {});
    act.onStepDone('journal-lesson', {});
    expect(engine.storyHud.cards.filter((card) => card === SUIT_CHOICE_CARD)).toHaveLength(1);
  });

  it('the card only informs: both options show a gain and a cost, and none locks the game', () => {
    expect(SUIT_RADIATION_CUT_PERCENT).toBe(Math.round((1 - STATION_CONFIG.SUIT_RADIATION_DAMAGE_FACTOR) * 100));
    expect(SUIT_CHOICE_CARD.choices).toHaveLength(2);
    for (const choice of SUIT_CHOICE_CARD.choices) {
      // Sem `id`: o card nao espera resposta (a escolha e feita no terminal de ciencia)
      expect(choice.id).toBeUndefined();
      expect(choice.good && choice.bad).toBeTruthy();
      for (const text of [choice.name, choice.good, choice.bad]) expect(text.split(' ').length).toBeLessThanOrEqual(8);
    }
    expect(SUIT_CHOICE_CARD.choices[0].good).toContain(`${SUIT_RADIATION_CUT_PERCENT}%`);
    expect(SUIT_CHOICE_CARD.choices[0].bad).toContain(`${SCIENCE_CONFIG.SUIT_UPGRADE_POINTS} points`);
    expect(SUIT_CHOICE_CARD.source).toMatch(/Game rule/);
    // Uma tecla de escolha de outro card nao e deste trade-off
    expect(controller().act.onCardChoice('upgrade-suit')).toBeNull();
  });

  it('report line with no points spent: no upgrade, more science for Earth', () => {
    const trade = missionReport({ ...REPORT_STATS, sciencePointsUsed: 0, suitUpgraded: false }).suitTrade;
    expect(trade).toEqual({ usedPoints: 0, upgraded: false, text: 'No suit upgrade: full radiation outside, more science for Earth' });
  });

  it('report line with points spent says what the number counts: every lab upgrade', () => {
    const suit = missionReport({ ...REPORT_STATS, sciencePointsUsed: 4, suitUpgraded: true }).suitTrade;
    expect(suit).toMatchObject({ usedPoints: 4, upgraded: true });
    expect(suit.text).toBe(`Lab upgrades used 4 science pts. Suit: ${SUIT_RADIATION_CUT_PERCENT}% less radiation outside`);
    // Traje e ferramenta: a soma e das duas melhorias, e a frase nao diz que foi so o traje
    const both = suitTradeSummary({ sciencePointsUsed: 8, suitUpgraded: true });
    expect(both.text).toMatch(/^Lab upgrades used 8 science pts\./);
    // So a ferramenta: pontos gastos, traje sem melhoria
    const tool = suitTradeSummary({ sciencePointsUsed: 4, suitUpgraded: false });
    expect(tool).toMatchObject({ usedPoints: 4, upgraded: false, text: 'Lab upgrades used 4 science pts. No suit upgrade' });
  });

  it('report without the game data has no line, and odd numbers do not break it', () => {
    expect(missionReport(REPORT_STATS).suitTrade).toBeNull();
    expect(suitTradeSummary({})).toBeNull();
    expect(suitTradeSummary({ sciencePointsUsed: NaN, suitUpgraded: false }).usedPoints).toBe(0);
    expect(suitTradeSummary({ sciencePointsUsed: -3, suitUpgraded: true }).usedPoints).toBe(0);
  });

  it('every text of the trade-off is in the pt-BR and es catalogs', () => {
    const texts = [SUIT_CHOICE_CARD.title, SUIT_CHOICE_CARD.source, ...SUIT_CHOICE_CARD.lines.map((line) => line.text)];
    for (const choice of SUIT_CHOICE_CARD.choices) texts.push(choice.name, choice.good, choice.bad);
    texts.push(
      suitTradeSummary({ sciencePointsUsed: 0, suitUpgraded: false }).text,
      suitTradeSummary({ sciencePointsUsed: 4, suitUpgraded: true }).text,
      suitTradeSummary({ sciencePointsUsed: 4, suitUpgraded: false }).text,
    );
    for (const text of texts) {
      expect(translate(text, 'pt-BR'), text).not.toBe(text);
      expect(translate(text, 'es'), text).not.toBe(text);
    }
    expect(translate('Lab upgrades used 8 science pts. Suit: 35% less radiation outside', 'pt-BR'))
      .toBe('Melhorias do laboratório gastaram 8 pts de ciência. Traje: 35% menos radiação lá fora');
  });
});
