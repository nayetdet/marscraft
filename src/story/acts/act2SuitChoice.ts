import { SCIENCE_CONFIG, STATION_CONFIG } from '../../config/constants.ts';
import { SPEAKERS } from '../radioSpeakers.ts';

// Trade-off do ato 2 (issue #417): gastar ciencia no traje ou mandar para a Terra. A mecanica ja
// existia (StationSystem.upgrade gasta pontos ainda nao enviados; pickForSpend nunca gasta amostra
// de pista). Aqui moram o card que apresenta a escolha, logo depois dos 3 primeiros scans, e a
// linha do boletim final com o efeito. Logica pura: quem mostra o card e o Act2Controller.
//
// Nenhuma opcao e de graca: ponto gasto no traje nunca chega a Terra; ponto enviado gasta bateria
// e o traje fica sem a protecao extra. O custo e o corte de radiacao sao regra de jogo.

// Quanto o traje melhorado corta da radiacao la fora, em % (SUIT_RADIATION_DAMAGE_FACTOR)
export const SUIT_RADIATION_CUT_PERCENT = Math.round((1 - STATION_CONFIG.SUIT_RADIATION_DAMAGE_FACTOR) * 100);

// Card de radio do engenheiro. So informa (opcoes sem `id`): a escolha e feita no terminal de
// ciencia e radio. Formato dos cards em storyChapters.ts.
export const SUIT_CHOICE_CARD = {
  title: 'SUIT OR EARTH?',
  speaker: SPEAKERS.engineer,
  lines: [
    { icon: 'scope', text: 'Your scans are science points' },
    { icon: 'check', text: 'Choose at the science & radio terminal' },
  ],
  choices: [
    { icon: 'wrench', name: 'UPGRADE SUIT', good: `${SUIT_RADIATION_CUT_PERCENT}% less radiation outside`, bad: `${SCIENCE_CONFIG.SUIT_UPGRADE_POINTS} points never reach Earth` },
    { icon: 'radio', name: 'SEND TO EARTH', good: 'Points count for the rocket', bad: 'Each upload eats battery' },
  ],
  source: 'Game rule: the suit upgrade and its cost are not NASA data.',
};

// O card aparece uma vez por partida, quando o passo dos 3 scans termina
export function shouldShowSuitChoice(stepId: string, shown: boolean): boolean {
  return stepId === 'scan-three' && !shown;
}

export interface SuitTradeSummary {
  usedPoints: number; // ciencia gasta nas melhorias do laboratorio, traje e ferramenta (nao enviada)
  upgraded: boolean;
  text: string;
}

// Linha do boletim final: ciencia que ficou em Marte contra a protecao ganha. `sciencePointsUsed`
// soma todas as melhorias do laboratorio (traje e ferramenta), e a frase diz isso: o jogo nao
// guarda quanto cada uma gastou. null quando o boletim nao recebeu os dados (tela sem partida).
export function suitTradeSummary(stats: { sciencePointsUsed?: number; suitUpgraded?: boolean }): SuitTradeSummary | null {
  if (typeof stats?.suitUpgraded !== 'boolean') return null;
  const usedPoints = Number.isFinite(stats.sciencePointsUsed) ? Math.max(0, Number(stats.sciencePointsUsed)) : 0;
  const upgraded = stats.suitUpgraded;
  let text = 'No suit upgrade: full radiation outside, more science for Earth';
  if (upgraded) text = `Lab upgrades used ${usedPoints} science pts. Suit: ${SUIT_RADIATION_CUT_PERCENT}% less radiation outside`;
  else if (usedPoints > 0) text = `Lab upgrades used ${usedPoints} science pts. No suit upgrade`;
  return { usedPoints, upgraded, text };
}
