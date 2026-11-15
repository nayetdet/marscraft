import { SCIENCE_CONFIG } from '../config/constants.ts';
import { SAMPLE_TYPES, type SampleType } from '../data/sampleTypes.ts';
import { isClueType } from './clues.ts';

// Trade-off do ato 4 (issue #422): analisar a amostra aqui ou levar o tubo para a Terra.
// Cada amostra coletada tem dois destinos, e um exclui o outro:
//   ANALYZE HERE   pontos agora: contam para a meta de decolagem e pagam melhorias;
//   TUBE TO EARTH  a amostra crua vai lacrada no foguete: vale mais pontos, mas so no boletim
//                  final. Nao conta para a meta, nao paga melhoria e pede mais gelo no tanque.
// Logica pura, sem DOM.
//
// Honestidade com o dado: o fato real e so este, ja citado em docs/data/numeros-reais.md: o
// Perseverance lacra amostras em tubos para uma futura viagem ate a Terra (NASA, Mars 2020).
// Quanto o tubo vale a mais (TUBE_POINTS_FACTOR), o gelo extra e o numero de tubos sao regra de jogo.
//
// Amostra de pista (issue #344) nao vai no tubo: a Terra precisa das 3 amostras de cada pista
// pelo radio para responder a pergunta da missao, e o mapa nao tem amostra de pista sobrando.

export interface TubeSample {
  typeId: string; // id em SAMPLE_TYPES
  name: string;
  points: number; // pontos que a amostra daria na analise
}

type Config = typeof SCIENCE_CONFIG;

// Pontos de uma amostra que viaja no tubo (so no boletim final)
export function tubePoints(sample: { points: number }, config: Config = SCIENCE_CONFIG): number {
  return sample.points * config.TUBE_POINTS_FACTOR;
}

export function tubesPoints(tubes: readonly { points: number }[], config: Config = SCIENCE_CONFIG): number {
  let total = 0;
  for (const tube of tubes) total += tubePoints(tube, config);
  return total;
}

export const canTube = (typeId: string) => !isClueType(typeId);

// Amostra crua da mochila que iria para o proximo tubo: a que vale mais, entre as que nao sao
// pista. `countItem(itemId)` = quantas ha na mochila. null = nenhuma serve.
export function pickTubeSample(countItem: (itemId: number) => number): SampleType | null {
  let best: SampleType | null = null;
  for (const type of SAMPLE_TYPES) {
    if (!canTube(type.id) || countItem(type.itemId) <= 0) continue;
    if (!best || type.points > best.points) best = type;
  }
  return best;
}

// Amostras cruas da mochila que podem ir num tubo
export function tubeableCount(countItem: (itemId: number) => number): number {
  let total = 0;
  for (const type of SAMPLE_TYPES) if (canTube(type.id)) total += countItem(type.itemId);
  return total;
}

export interface TubeChoice {
  name: string;
  analyzePoints: number; // agora
  tubePoints: number; // so no boletim final
  icePerTube: number;
  tubesLeft: number; // lugares livres no foguete
}

// Os dois numeros lado a lado, para o monitor de ciencia. null = nenhuma amostra da mochila pode
// ir num tubo (ou o foguete nao tem mais lugar).
export function tubeChoice(countItem: (itemId: number) => number, tubesLoaded: number, config: Config = SCIENCE_CONFIG): TubeChoice | null {
  const type = pickTubeSample(countItem);
  const tubesLeft = config.MAX_SAMPLE_TUBES - tubesLoaded;
  if (!type || tubesLeft <= 0) return null;
  return { name: type.name, analyzePoints: type.points, tubePoints: tubePoints(type, config), icePerTube: config.ICE_PER_SAMPLE_TUBE, tubesLeft };
}

// Por que o botao de carregar tubo nao fez nada
export function noTubeSampleText(hasClueSample: boolean): string {
  return hasClueSample
    ? 'Clue samples cannot go in a tube: Earth needs them by radio. Analyze them at the science terminal.'
    : 'No sample to seal. Bring a glowing sample from outside, and do not analyze it.';
}

export function tubeLoadedText(sample: { name: string; points: number }, config: Config = SCIENCE_CONFIG): string {
  return `${sample.name} sealed in a tube: +${tubePoints(sample, config)} points in your final report, none now. The rocket needs +${config.ICE_PER_SAMPLE_TUBE} ice.`;
}
