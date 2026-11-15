import { SCIENCE_CONFIG } from '../config/constants.ts';
import { CLUE_SAMPLES, allCluesSent, clueStates, cluesUnsentText, isClueItem, type ClueState } from './clues.ts';

// Ciencia para a Terra em UMA moeda so: pontos de ciencia (issues #105 e #269). Logica pura, sem
// DOM. Cada coisa que a crianca acha e um item com nome e pontos:
//   - descoberta do scanner nesta partida (rara, do ceu ou da paisagem, vale mais);
//   - amostra analisada no laboratorio (pontos por tipo, src/data/sampleTypes.ts).
// Um item pode estar: esperando (to send), enviado para a Terra (sent) ou gasto numa melhoria do
// laboratorio (used). O foguete so decola com POINTS_TO_LAUNCH pontos ENVIADOS.
//
// Envio: custo base (ligar o radio e falar com o orbitador) + um tanto por item. Cada envio leva
// no maximo MAX_ITEMS_PER_UPLOAD itens (uma passagem do orbitador carrega pouco dado). Pode enviar
// em partes, mas cada parte paga o custo base de novo. Todos os numeros sao escala de jogo.

export type ScienceKind = 'discovery' | 'sample';

export interface ScienceItem {
  id: string; // 'scan:<id da ficha>' ou 'sample:<ordem da analise>'
  kind: ScienceKind;
  name: string;
  points: number;
  icon: string; // id da ficha do scanner ou do tipo de amostra (o painel escolhe o desenho)
  rare?: boolean;
}

export interface ScienceLedger {
  sentIds: ReadonlySet<string>;
  usedIds: ReadonlySet<string>;
}

export interface ScienceStatus {
  pending: ScienceItem[];
  sent: ScienceItem[];
  used: ScienceItem[];
  pendingPoints: number;
  sentPoints: number;
  usedPoints: number;
  goal: number;
  // Pistas da missao (issue #344), na ordem de CLUES: 'todo' | 'bag' (menos de 3 amostras
  // analisadas) | 'found' (as 3 esperam o envio) | 'sent' (as 3 na Terra)
  clues: ClueState[];
  cluesSent: boolean;
  met: boolean; // a Terra ja tem os pontos E as 3 pistas que o foguete pede
}

export interface SciencePackage {
  upload: ScienceItem[];
  items: number;
  points: number;
  cost: number;
  leftAfter: number; // itens que ficam para o proximo envio
  pendingPoints: number;
  sentPoints: number;
  goal: number;
  metNow: boolean;
  metAfter: boolean;
}

export type ScienceStep = null | 'send' | 'analyze' | 'scan' | 'clue';

type Config = typeof SCIENCE_CONFIG;
const EMPTY_LEDGER: ScienceLedger = { sentIds: new Set(), usedIds: new Set() };

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
const discoveryWord = (n: number) => `${n} ${n === 1 ? 'discovery' : 'discoveries'}`;
export const pointsWord = (n: number) => `${n} ${n === 1 ? 'point' : 'points'}`;

export const pointsOf = (items: readonly ScienceItem[]) => items.reduce((sum, item) => sum + item.points, 0);

// "3 discoveries, 1 sample": contagem para a tela de vitoria
export function scienceCountText(discoveries: number, samples: number): string {
  return `${discoveryWord(discoveries)}, ${plural(samples, 'sample')}`;
}

// Pontos de uma descoberta do scanner: ceu e paisagem sao raras
export function discoveryPoints(category: string, config: Config = SCIENCE_CONFIG): number {
  return config.RARE_DISCOVERY_CATEGORIES.includes(category) ? config.POINTS_PER_RARE_DISCOVERY : config.POINTS_PER_DISCOVERY;
}

export function discoveryItem(entry: { id: string; title: string; category: string }, config: Config = SCIENCE_CONFIG): ScienceItem {
  const points = discoveryPoints(entry.category, config);
  return { id: `scan:${entry.id}`, kind: 'discovery', name: entry.title, points, icon: entry.id, rare: points > config.POINTS_PER_DISCOVERY };
}

// `order` = posicao da amostra na lista de analises desta partida
export function sampleItem(order: number, sample: { typeId: string; name: string; points: number }): ScienceItem {
  return { id: `sample:${order}`, kind: 'sample', name: sample.name, points: sample.points, icon: sample.typeId };
}

// Separa os itens da partida em: esperando, enviados e gastos
export function scienceStatus(items: readonly ScienceItem[], ledger: ScienceLedger = EMPTY_LEDGER, config: Config = SCIENCE_CONFIG): ScienceStatus {
  const pending: ScienceItem[] = [];
  const sent: ScienceItem[] = [];
  const used: ScienceItem[] = [];
  for (const item of items) {
    if (ledger.sentIds.has(item.id)) sent.push(item);
    else if (ledger.usedIds.has(item.id)) used.push(item);
    else pending.push(item);
  }
  const sentPoints = pointsOf(sent);
  const clues = clueStates({ pending, sent });
  const cluesSent = allCluesSent(clues);
  return {
    pending, sent, used,
    pendingPoints: pointsOf(pending),
    sentPoints,
    usedPoints: pointsOf(used),
    goal: config.POINTS_TO_LAUNCH,
    clues,
    cluesSent,
    met: sentPoints >= config.POINTS_TO_LAUNCH && cluesSent,
  };
}

// O que o proximo envio leva e quanto custa. Os itens que valem mais vao primeiro.
export function sciencePackage(items: readonly ScienceItem[], ledger: ScienceLedger = EMPTY_LEDGER, config: Config = SCIENCE_CONFIG): SciencePackage {
  const status = scienceStatus(items, ledger, config);
  const upload = [...status.pending].sort((a, b) => b.points - a.points).slice(0, config.MAX_ITEMS_PER_UPLOAD);
  const points = pointsOf(upload);
  return {
    upload,
    items: upload.length,
    points,
    cost: upload.length > 0 ? config.UPLOAD_BASE_COST + upload.length * config.UPLOAD_COST_PER_ITEM : 0,
    leftAfter: status.pending.length - upload.length,
    pendingPoints: status.pendingPoints,
    sentPoints: status.sentPoints,
    goal: status.goal,
    metNow: status.met,
    metAfter: status.sentPoints + points >= config.POINTS_TO_LAUNCH
      && allCluesSent(clueStates({ sent: [...status.sent, ...upload] })),
  };
}

// Itens que pagam uma melhoria de `cost` pontos, ou null se os pontos que esperam nao bastam.
// Gasta primeiro os itens que valem menos e nao leva item que nao precisa.
export function pickForSpend(pending: readonly ScienceItem[], cost: number): ScienceItem[] | null {
  // A amostra de uma pista nunca e gasta: sem ela na Terra o foguete nao decola (issue #344)
  const spendable = pending.filter((item) => !isClueItem(item));
  if (pointsOf(spendable) < cost) return null;
  const picked: ScienceItem[] = [];
  let total = 0;
  for (const item of [...spendable].sort((a, b) => a.points - b.points)) {
    if (total >= cost) break;
    picked.push(item);
    total += item.points;
  }
  // Tira os menores que sobraram depois de entrar um item grande
  for (let i = 0; i < picked.length;) {
    if (total - picked[i].points >= cost) {
      total -= picked[i].points;
      picked.splice(i, 1);
    } else {
      i += 1;
    }
  }
  return picked;
}

// Proximo passo da ciencia para o objetivo e a seta: null (meta ja enviada) | 'send' (o que esta
// na mao ja fecha a meta) | 'analyze' (tem amostra coletada esperando a analise) | 'scan'.
// `rawSamples` = amostras coletadas la fora e ainda nao analisadas.
// Pistas (issue #344): `cluesToFind` = ainda la fora; `cluesInBag` = coletadas, sem analise;
// `cluesUnsent` = a Terra ainda nao tem. Sem elas (0), vale so a conta dos pontos.
export function scienceStep(
  { pendingPoints = 0, sentPoints = 0, rawSamples = 0, cluesToFind = 0, cluesInBag = 0, cluesUnsent = 0 } = {},
  config: Config = SCIENCE_CONFIG,
): ScienceStep {
  const pointsMet = sentPoints >= config.POINTS_TO_LAUNCH;
  if (pointsMet && cluesUnsent === 0) return null;
  if (cluesToFind > 0) return 'clue';
  if (cluesInBag > 0) return 'analyze';
  if (sentPoints + pendingPoints >= config.POINTS_TO_LAUNCH) return 'send';
  if (rawSamples > 0) return 'analyze';
  return 'scan';
}

// Pontos que ainda faltam achar (alem dos que ja esperam o envio) para fechar a meta
export function pointsStillNeeded({ pendingPoints = 0, sentPoints = 0 } = {}, config: Config = SCIENCE_CONFIG): number {
  return Math.max(0, config.POINTS_TO_LAUNCH - sentPoints - pendingPoints);
}

// "Science sent: 6 / 10 points": a mesma frase no painel de ciencia, no MAV e no objetivo
export function scienceGoalText(sentPoints: number, config: Config = SCIENCE_CONFIG): string {
  return `Science sent: ${sentPoints} / ${config.POINTS_TO_LAUNCH} points`;
}

// Texto curto do que falta para a meta (painel de ciencia e painel do MAV)
// `clues`: estado das pistas (ScienceStatus.clues); sem ele, vale so a conta dos pontos.
export function scienceMissingText(
  { pendingPoints = 0, sentPoints = 0, clues = null as readonly ClueState[] | null } = {},
  config: Config = SCIENCE_CONFIG,
): string {
  const cluesLeft = clues && !allCluesSent(clues) ? cluesUnsentText(clues) : '';
  const cluesNote = cluesLeft ? ` Earth also needs the 3 clues (${CLUE_SAMPLES} samples each). Still missing: ${cluesLeft}.` : '';
  if (sentPoints >= config.POINTS_TO_LAUNCH) {
    return cluesLeft
      ? `Enough points are home, but Earth still needs these clues: ${cluesLeft}. Each clue is ${CLUE_SAMPLES} samples of one kind: find the glowing samples, analyze them and send them.`
      : 'Enough science is home. Extra uploads still count for your report.';
  }
  const goal = `The rocket needs ${pointsWord(config.POINTS_TO_LAUNCH)} of science sent to Earth.`;
  if (sentPoints + pendingPoints >= config.POINTS_TO_LAUNCH) return `${goal} You have enough: send it.${cluesNote}`;
  const missing = pointsStillNeeded({ pendingPoints, sentPoints }, config);
  return `${goal} Still missing: ${pointsWord(missing)}. Scan new things with the scope or analyze samples from the map.${cluesNote}`;
}

// Frase do botao de envio: o custo muda com o tamanho do pacote
export function uploadButtonLabel(pkg: SciencePackage): string {
  if (pkg.items === 0) return 'Send science to Earth (nothing new to send)';
  return `Send ${plural(pkg.items, 'item')} = ${pointsWord(pkg.points)} to Earth (${pkg.cost}% power)`;
}

export interface UploadResult {
  status: 'sent' | 'empty' | 'no-energy';
  items: number;
  points: number;
  cost: number;
  leftAfter: number;
  sentPoints: number;
  dataSent: boolean;
}

// Resposta de MissionSystem.sendData() em texto para a crianca
export function uploadResultText(result: UploadResult, config: Config = SCIENCE_CONFIG): string {
  if (result.status === 'empty') return 'Nothing new to send. Scan things with the scope or analyze samples first.';
  if (result.status === 'no-energy') return `Not enough power: this upload needs ${result.cost}% of the battery. Wait for the Sun.`;
  const later = result.leftAfter > 0 ? ` ${plural(result.leftAfter, 'more item')} wait for the next orbiter pass.` : '';
  const goal = result.dataSent
    ? ' Earth has enough of your science!'
    : ` ${scienceGoalText(result.sentPoints, config)}.`;
  return `Sent ${plural(result.items, 'item')} (+${pointsWord(result.points)}) to a Mars orbiter, which passes it on to Earth (-${result.cost}% power).${later}${goal}`;
}
