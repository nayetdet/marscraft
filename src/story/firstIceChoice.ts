import { DOSE_CONFIG, ENERGY_CONFIG, MAV_CONFIG, STORY_CONFIG, WATER_SYSTEM_CONFIG } from '../config/constants.ts';
import { SPEAKERS } from './radioSpeakers.ts';

// Trade-off do ato 1 (issue #413): o primeiro gelo vai para onde? Com o primeiro gelo na mao (o
// passo `collect-ice` acabou), um card de radio pergunta TANK x ROCKET, uma vez por partida.
// Nenhuma opcao e de graca: no tanque da base o gelo vira agua (beber e fazer ar) e o foguete
// fica sem esse bloco; no foguete ele vira combustivel, o que gasta bateria, e a base fica sem
// essa agua. Quem nao escolhe segue o caminho de sempre (levar o gelo ao foguete).
// Logica pura (sem DOM nem Three.js): quem mostra o card e aplica a escolha e o GameEngine.

export const FIRST_ICE_TANK_ID = 'first-ice-tank';
export const FIRST_ICE_ROCKET_ID = 'first-ice-rocket';

export type FirstIceChoice = typeof FIRST_ICE_TANK_ID | typeof FIRST_ICE_ROCKET_ID;

// Agua que um bloco de gelo da mao vale no tanque da base (L). Um bloco do foguete ja vale uma
// perfuracao do rover (DOSE_CONFIG.ROVER_ICE_KG_PER_MAV_BLOCK): aqui vale a mesma coisa.
export function firstIceWaterL(): number {
  return STORY_CONFIG.FIRST_ICE_BLOCKS * DOSE_CONFIG.ROVER_ICE_KG_PER_MAV_BLOCK * WATER_SYSTEM_CONFIG.LITERS_PER_KG_ICE;
}

// Bateria que a fabrica de combustivel gasta para transformar esse gelo (% da bateria)
export function firstIceBatteryPct(): number {
  const pct = STORY_CONFIG.FIRST_ICE_BLOCKS * ENERGY_CONFIG.ISRU_DRAIN_PER_HOUR * MAV_CONFIG.ISRU_HOURS_PER_ICE_BLOCK;
  return Math.round(pct * 10) / 10;
}

// O card aparece uma vez por partida, quando o passo de pegar o gelo termina com gelo na mochila
export function shouldAskFirstIce({ asked, stepId, iceCount }: { asked: boolean; stepId: string; iceCount: number }): boolean {
  return !asked && stepId === 'collect-ice' && iceCount > 0;
}

// Textos com numero, em funcoes: o catalogo de idiomas (src/ui/i18nFirstIce.ts) usa as mesmas
// para montar as chaves, entao mudar uma constante nao deixa texto sem traducao.
export const firstIceTankGood = (): string => `+${firstIceWaterL()} L to drink and breathe`;
export const firstIceRocketBad = (): string => `Uses ${firstIceBatteryPct()}% battery, no new water`;

// Card de radio com a escolha ([1] ou [2], ou toque). Formato dos cards em storyChapters.ts.
export function firstIceCard() {
  return {
    title: 'YOUR FIRST ICE',
    speaker: SPEAKERS.engineer,
    seconds: STORY_CONFIG.FIRST_ICE_CARD_SECONDS,
    lines: [
      { icon: 'ice', text: 'One ice block, two jobs: pick one' },
      { icon: 'air', text: '36 g of water make 32 g of oxygen' },
    ],
    choices: [
      { id: FIRST_ICE_TANK_ID, key: '1', icon: 'drop', name: 'TANK', good: firstIceTankGood(), bad: 'The rocket waits for this block' },
      { id: FIRST_ICE_ROCKET_ID, key: '2', icon: 'rocket', name: 'ROCKET', good: 'Fuel to fly home sooner', bad: firstIceRocketBad() },
    ],
    // Fato real, com fonte em docs/data/numeros-reais.md (OGA, eletrolise)
    source: 'Real: the Space Station makes oxygen from water (NASA OGA)',
  };
}

// Aviso depois da escolha: o que ela custa. `addedL` = agua que entrou de verdade no tanque.
// O numero muda quando o tanque esta quase cheio: o catalogo traduz por padrao (i18n.ts).
export function firstIceTankToast(addedL: number): string {
  return `Ice in the base tank: +${Math.round(addedL)} L of water. The rocket still needs this block.`;
}
export const FIRST_ICE_ROCKET_TOAST = 'Take the ice to the rocket: follow the arrow. Making fuel uses battery.';
export const FIRST_ICE_NO_ICE_TOAST = 'No ice in your backpack.';

// Linha do boletim final: para onde foi o primeiro gelo. null se a crianca nao escolheu no card.
export const firstIceTankReport = (): string => `First ice: base tank (+${firstIceWaterL()} L of water, rocket waited)`;
export const firstIceRocketReport = (): string => `First ice: rocket fuel (${firstIceBatteryPct()}% battery, no new water)`;

export function firstIceSummary(stats: { firstIceChoice?: string | null }) {
  if (stats.firstIceChoice === FIRST_ICE_TANK_ID) return { choice: FIRST_ICE_TANK_ID, text: firstIceTankReport() };
  if (stats.firstIceChoice === FIRST_ICE_ROCKET_ID) return { choice: FIRST_ICE_ROCKET_ID, text: firstIceRocketReport() };
  return null;
}

// Partida salva (GameEngine._saveGame): o card nao reaparece e a escolha continua valendo no
// boletim depois de recarregar. Save antigo ou estragado: nada perguntado, nada escolhido.
export function saveFirstIce(asked: unknown, choice: unknown): { asked: boolean; choice: FirstIceChoice | null } {
  const valid = choice === FIRST_ICE_TANK_ID || choice === FIRST_ICE_ROCKET_ID;
  return { asked: Boolean(asked) || valid, choice: valid ? (choice as FirstIceChoice) : null };
}

export function restoreFirstIce(saved: { asked?: unknown; choice?: unknown } | null | undefined) {
  return saveFirstIce(saved?.asked === true, saved?.choice);
}
