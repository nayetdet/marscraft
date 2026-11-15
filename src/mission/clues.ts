import { SAMPLE_SITE_CONFIG, SCIENCE_CONFIG } from '../config/constants.ts';
import type { ScienceItem } from './sciencePackage.ts';

// As 3 pistas da missao (issue #344). A pergunta e a que o Curiosity foi responder em Gale:
// "Was Gale crater a lake? Could tiny life live there?". Cada pista e um tipo de amostra do mapa
// (src/data/sampleTypes.ts) que responde a um pedaco dela. Logica pura, sem DOM.
//
// Honestidade com o dado: os fatos sao reais (fontes em sampleTypes.ts e em
// docs/data/numeros-reais.md, secao "Pistas da missao"); qual amostra vira pista, onde ela fica
// no mapa e a ordem sao regra de jogo. O gelo e do Phoenix, nao de Gale: a ficha dele avisa.

export interface Clue {
  id: string;
  typeId: string; // id em SAMPLE_TYPES
  label: string; // 2 palavras, em letras grandes no painel
  answer: string; // o que a pista responde, numa frase curta
}

export const CLUES: Clue[] = [
  { id: 'water-now', typeId: 'sample-ice-core', label: 'WATER NOW', answer: 'Mars still has water: it is frozen' },
  { id: 'old-lake', typeId: 'sample-mudstone', label: 'OLD LAKE', answer: 'This rock was mud in a lake' },
  { id: 'life-ingredient', typeId: 'sample-sulfur', label: 'LIFE INGREDIENT', answer: 'Sulfur is one ingredient life needs' },
];

// O que a Terra conclui com as 3 pistas (tela de vitoria)
export const CLUES_ANSWER = 'Gale was a lake, good for life';

// Ato 4 (issue #410): cada pista pede TODAS as amostras do tipo dela (o campo inteiro, regra de jogo)
export const CLUE_SAMPLES = SAMPLE_SITE_CONFIG.PER_TYPE;

// Onde a pista esta: 'todo' (nada coletado) | 'bag' (alguma amostra coletada ou analisada, mas
// ainda nao as CLUE_SAMPLES) | 'found' (as CLUE_SAMPLES analisadas, esperando o envio) |
// 'sent' (a Terra ja tem as CLUE_SAMPLES)
export type ClueState = 'todo' | 'bag' | 'found' | 'sent';

export const isClueType = (typeId: string) => CLUES.some((clue) => clue.typeId === typeId);

// Item de ciencia que e a amostra de uma pista (o `icon` de uma amostra e o tipo dela)
export const isClueItem = (item: ScienceItem) => item.kind === 'sample' && isClueType(item.icon);

type ScienceLists = { pending?: readonly ScienceItem[]; sent?: readonly ScienceItem[] };

function countSamples(items: readonly ScienceItem[], typeId: string): number {
  let total = 0;
  for (const item of items) if (item.kind === 'sample' && item.icon === typeId) total += 1;
  return total;
}

// Estado de cada pista, na ordem de CLUES. `pending` e `sent` vem de scienceStatus();
// `inBag(typeId)` diz se ha uma amostra daquele tipo na mochila, ainda sem analise.
// Escreve em `out` (o motor chama a cada frame e reaproveita o vetor).
export function clueStates(
  { pending = [], sent = [] }: ScienceLists = {},
  inBag: (typeId: string) => boolean = () => false,
  out: ClueState[] = [],
  needed: number = CLUE_SAMPLES,
): ClueState[] {
  for (let i = 0; i < CLUES.length; i += 1) {
    const typeId = CLUES[i].typeId;
    const home = countSamples(sent, typeId);
    const analyzed = home + countSamples(pending, typeId);
    out[i] = home >= needed ? 'sent' : analyzed >= needed ? 'found' : analyzed > 0 || inBag(typeId) ? 'bag' : 'todo';
  }
  out.length = CLUES.length;
  return out;
}

// Quantas amostras de cada pista a Terra ja tem (0 a CLUE_SAMPLES), na ordem de CLUES: o painel
// mostra "OLD LAKE 2/3". Escreve em `out`.
export function clueSentCounts({ sent = [] }: ScienceLists = {}, out: number[] = [], needed: number = CLUE_SAMPLES): number[] {
  for (let i = 0; i < CLUES.length; i += 1) out[i] = Math.min(needed, countSamples(sent, CLUES[i].typeId));
  out.length = CLUES.length;
  return out;
}

export const allCluesSent = (states: readonly ClueState[]) => states.length === CLUES.length && states.every((state) => state === 'sent');
export const countClues = (states: readonly ClueState[], state: ClueState) => states.filter((s) => s === state).length;

// Proxima pista para buscar la fora (indice em CLUES), ou -1 se nenhuma falta coletar
export function nextClueIndex(states: readonly ClueState[]): number {
  return states.findIndex((state) => state === 'todo');
}

// Hora de desviar ate a proxima pista? A rotina mistura as duas metas na mesma saida: uma pista
// a cada ICE_PER_CLUE_TRIP blocos de gelo entregues. Com o tanque ja cheio de gelo, sempre.
// `iceLoaded` = blocos ja entregues no foguete; `iceNeeded` = quantos ainda faltam.
export function clueDue(states: readonly ClueState[], iceLoaded: number, iceNeeded: number, config = SCIENCE_CONFIG): boolean {
  const next = nextClueIndex(states);
  if (next < 0) return false;
  if (iceNeeded <= 0) return true;
  const collected = CLUES.length - countClues(states, 'todo');
  return collected < Math.floor(iceLoaded / config.ICE_PER_CLUE_TRIP);
}

// "OLD LAKE and LIFE INGREDIENT": pistas que a Terra ainda nao tem
export function cluesUnsentText(states: readonly ClueState[]): string {
  return CLUES.filter((_, i) => states[i] !== 'sent').map((clue) => clue.label).join(' and ');
}
