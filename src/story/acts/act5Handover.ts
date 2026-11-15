import { ACT5_CONFIG } from '../../config/constants.ts';
import { SPEAKERS } from '../radioSpeakers.ts';

// Trade-off do ato 5 (issue #423): como deixar a base para a proxima tripulacao. Antes do IGNITE,
// um card mostra a base em 3 itens (agua no tanque, poeira nos paineis, campos plantados) e a
// escolha: decolar ja, ou arrumar a base, o que gasta horas da janela de lancamento. O boletim
// final diz como a base ficou. Logica pura: quem aplica a escolha e o Act5Controller.

// A base na hora do card e na hora da decolagem
export interface BaseState {
  waterL: number; // agua no tanque da base
  maxWaterL: number;
  panelDust: number; // poeira nos paineis solares, de 0 a 1
  fieldsPlanted: number; // campos da estufa com planta
  fieldsTotal: number;
}

export interface HandoverCheck {
  id: 'water' | 'panels' | 'fields';
  icon: string;
  ok: boolean;
  name: string; // como o item aparece no boletim
  text: string; // linha do card
}

const pct = (v: number) => Math.round(Math.max(0, Math.min(1, v)) * 100);

// Os 3 itens da base e se cada um esta pronto para quem vier depois (metas: regras de jogo)
export function handoverChecks(base: BaseState): HandoverCheck[] {
  const water = Math.round(base.waterL);
  return [
    {
      id: 'water',
      icon: 'drop',
      ok: base.waterL >= base.maxWaterL * ACT5_CONFIG.HANDOVER_WATER_FRACTION,
      name: 'water',
      text: `Water tank: ${water} of ${Math.round(base.maxWaterL)} L`,
    },
    {
      id: 'panels',
      icon: 'dust',
      ok: base.panelDust <= ACT5_CONFIG.HANDOVER_MAX_PANEL_DUST,
      name: 'clean panels',
      text: `Dust on solar panels: ${pct(base.panelDust)}%`,
    },
    {
      id: 'fields',
      icon: 'plant',
      ok: base.fieldsPlanted >= base.fieldsTotal * ACT5_CONFIG.HANDOVER_FIELDS_FRACTION,
      name: 'planted fields',
      text: `Fields planted: ${base.fieldsPlanted} of ${base.fieldsTotal}`,
    },
  ];
}

export const HANDOVER_CHOICES = { FLY_NOW: 'fly-now', TIDY: 'tidy-base' };

// O card de escolha, uma vez por partida, quando o foguete fica pronto. Nenhuma opcao e de graca:
// decolar ja deixa a base como esta; arrumar gasta horas da janela (custo vindo da constante).
export function handoverCard(base: BaseState) {
  return {
    title: 'LEAVING THE BASE',
    speaker: SPEAKERS.engineer,
    seconds: ACT5_CONFIG.HANDOVER_CARD_SECONDS,
    lines: handoverChecks(base).map((check) => ({ icon: check.icon, text: check.text })),
    choices: [
      { id: HANDOVER_CHOICES.FLY_NOW, key: '1', icon: 'rocket', name: 'FLY NOW', good: 'Keep all your window time', bad: 'The base stays as it is' },
      {
        id: HANDOVER_CHOICES.TIDY,
        key: '2',
        icon: 'home',
        name: 'TIDY THE BASE',
        good: 'Clean panels for the next crew',
        bad: `${ACT5_CONFIG.HANDOVER_WINDOW_HOURS} h less launch window`,
      },
    ],
    // Fato real, com fonte em docs/data/numeros-reais.md (Numeros da historia)
    source: 'Real: crews hand the Space Station to the next crew. People have lived there non-stop since 2000 (NASA)',
  };
}

// Linha do boletim: quantos dos 3 itens ficaram prontos. `stats.baseHandover` e a base na hora da
// decolagem (BaseState) mais `tidied` (a crianca escolheu arrumar). null se o foguete nao decolou.
export function handoverSummary(stats: { launched?: boolean; baseHandover?: (BaseState & { tidied?: boolean }) | null }) {
  if (!stats.launched || !stats.baseHandover) return null;
  const checks = handoverChecks(stats.baseHandover);
  const missing = checks.filter((check) => !check.ok).map((check) => check.name);
  const ready = checks.length - missing.length;
  return {
    ready,
    total: checks.length,
    tidied: Boolean(stats.baseHandover.tidied),
    allReady: missing.length === 0,
    text: missing.length === 0
      ? 'Base ready for the next crew: water, panels and fields'
      : `Base ready for the next crew: ${ready} of ${checks.length} (missing: ${missing.join(', ')})`,
  };
}
