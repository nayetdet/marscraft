import { SAMPLE_SITE_CONFIG } from '../../config/constants.ts';
import { SAMPLE_TYPES } from '../../data/sampleTypes.ts';
import { CLUES, CLUE_SAMPLES, clueDue, clueSentCounts, countClues, nextClueIndex, type ClueState } from '../../mission/clues.ts';
import { scienceStep } from '../../mission/sciencePackage.ts';
import { ActController, type StorySnapshot, type Waypoint } from './actTypes.ts';
import { ACT4_STEP_IDS, SAMPLE_FIELD_PLACE } from './act4Steps.ts';

// Ato 4 (issue #410): liga os passos de act4Steps.ts ao jogo. Ver actTypes.ts.
//
// O que ele escreve no retrato do jogo, a cada frame (sem alocar: vetores e objetos reaproveitados):
//   sampleFieldsDone, samplesAnalyzed, samplesInBag   lidos pelos passos do ato (act4Steps.ts)
//   sciencePointsFound   pontos achados nesta partida (esperando envio + enviados): o contador
//   objectiveTally       contagem que o painel do objetivo mostra no passo atual, ou null:
//                        por tipo na coleta e na analise ("SULFUR 2/3"), por pista no envio
//   nextClue, clueDue, scienceStep   a rotina das pistas (issue #344), agora por campo: uma pista
//                        so sai da lista de busca quando o campo dela esta vazio
//
// A seta do passo de coleta ('sample-field') aponta para a pedrinha mais perto que ainda esta
// la fora; como cada tipo fica num campo so, e o campo mais perto que ainda tem pedrinha.

export interface TallyRow {
  label: string;
  have: number;
  need: number;
}

const TYPE_INDEX = new Map(SAMPLE_TYPES.map((type, i) => [type.id, i]));
const CLUE_TYPE_INDEX = CLUES.map((clue) => TYPE_INDEX.get(clue.typeId) ?? -1);
const FIELD_LABELS = SAMPLE_TYPES.map((type) => `${type.short} FIELD`);
const zeros = () => SAMPLE_TYPES.map(() => 0);
const tally = (labels: string[]): TallyRow[] => labels.map((label) => ({ label, have: 0, need: SAMPLE_SITE_CONFIG.PER_TYPE }));

export class Act4Controller extends ActController {
  private collected = zeros(); // pedrinhas ja coletadas, por tipo (ordem de SAMPLE_TYPES)
  private total = zeros(); // pedrinhas que o mapa tem, por tipo
  private analyzed = zeros();
  private collectTally = tally(SAMPLE_TYPES.map((type) => type.short));
  private analyzeTally = tally(SAMPLE_TYPES.map((type) => type.short));
  private clueTally = tally(CLUES.map((clue) => clue.label));
  private clueSent: number[] = [];
  // Para a seta: 'todo' = o campo da pista ainda tem pedrinha la fora
  private fieldStates: ClueState[] = [];
  private science = { pendingPoints: 0, sentPoints: 0, rawSamples: 0, cluesToFind: 0, cluesInBag: 0, cluesUnsent: 0 };
  private fieldWaypoint: Waypoint = { x: 0, y: 0, z: 0, label: '' };

  fillSnapshot(s: StorySnapshot): void {
    const engine = this.engine;
    const markers = engine.sampleSites;
    if (!markers || !engine.stations) return;

    // Coleta: pedrinhas de cada tipo que ja sairam do mapa
    this.collected.fill(0);
    this.total.fill(0);
    for (const site of markers.sites) {
      const i = TYPE_INDEX.get(site.typeId);
      if (i === undefined) continue;
      this.total[i] += 1;
      if (markers.isCollected(site.id)) this.collected[i] += 1;
    }
    // Analise: amostras do mapa que ja passaram pelo monitor de ciencia (o regolito nao conta)
    this.analyzed.fill(0);
    for (const sample of engine.stations.analyzed) {
      const i = TYPE_INDEX.get(sample.typeId);
      if (i !== undefined) this.analyzed[i] += 1;
    }

    let fieldsDone = 0;
    let analyzedTotal = 0;
    let inBag = 0;
    for (let i = 0; i < SAMPLE_TYPES.length; i += 1) {
      const need = this.total[i];
      if (this.collected[i] >= need) fieldsDone += 1;
      analyzedTotal += Math.min(this.analyzed[i], need);
      inBag += engine.survival.countItem(SAMPLE_TYPES[i].itemId);
      this.collectTally[i].have = this.collected[i];
      this.collectTally[i].need = need;
      this.analyzeTally[i].have = Math.min(this.analyzed[i], need);
      this.analyzeTally[i].need = need;
    }
    s.sampleFieldsDone = fieldsDone;
    s.samplesAnalyzed = analyzedTotal;
    s.samplesInBag = inBag;

    const status = engine.scienceStatus();
    s.sciencePointsFound = status.pendingPoints + status.sentPoints;

    // Pistas (issue #344) por campo: a seta e o painel so mandam buscar a pista cujo campo ainda
    // tem pedrinha. Durante os passos guiados quem manda e o passo: a rotina "uma pista a cada 2
    // blocos de gelo" nao disputa a seta.
    for (let c = 0; c < CLUES.length; c += 1) {
      const i = CLUE_TYPE_INDEX[c];
      this.fieldStates[c] = i >= 0 && this.collected[i] < this.total[i] ? 'todo' : 'bag';
    }
    const guided = Boolean(engine.story?.inTraining);
    s.nextClue = nextClueIndex(this.fieldStates);
    s.clueDue = !guided && clueDue(this.fieldStates, (s.iceForFullTank ?? 0) - (s.iceNeeded ?? 0), s.iceNeeded ?? 0);
    const sci = this.science;
    sci.pendingPoints = status.pendingPoints;
    sci.sentPoints = status.sentPoints;
    sci.rawSamples = engine.stations.rawSampleCount(engine.survival);
    sci.cluesToFind = countClues(this.fieldStates, 'todo');
    sci.cluesInBag = 0;
    for (let c = 0; c < CLUES.length; c += 1) {
      const i = CLUE_TYPE_INDEX[c];
      if (i >= 0 && engine.survival.countItem(SAMPLE_TYPES[i].itemId) > 0) sci.cluesInBag += 1;
    }
    sci.cluesUnsent = CLUES.length - countClues(status.clues, 'sent');
    s.scienceStep = scienceStep(sci);

    // Contagem do painel do objetivo, so nos passos deste ato (e fora de um desvio)
    const stepId = engine.story?.detour ? null : engine.story?.step?.id;
    if (stepId === ACT4_STEP_IDS.collect) s.objectiveTally = this.collectTally;
    else if (stepId === ACT4_STEP_IDS.analyze) s.objectiveTally = this.analyzeTally;
    else if (stepId === ACT4_STEP_IDS.send) {
      clueSentCounts(status, this.clueSent);
      for (let c = 0; c < CLUES.length; c += 1) {
        this.clueTally[c].have = this.clueSent[c];
        this.clueTally[c].need = CLUE_SAMPLES;
      }
      s.objectiveTally = this.clueTally;
    } else s.objectiveTally = null;
  }

  // 'sample-field': a pedrinha mais perto do jogador que ainda esta la fora
  waypoint(place: string): Waypoint | null {
    if (place !== SAMPLE_FIELD_PLACE) return null;
    const markers = this.engine.sampleSites;
    const pos = this.engine.player?.pos;
    if (!markers || !pos) return null;
    let best = null;
    let bestDistance = Infinity;
    for (const site of markers.sites) {
      if (markers.isCollected(site.id)) continue;
      const distance = Math.hypot(site.x - pos.x, site.z - pos.z);
      if (distance < bestDistance) { best = site; bestDistance = distance; }
    }
    if (!best) return null;
    const target = this.fieldWaypoint;
    target.x = best.x + 0.5;
    target.y = best.y + 2.2;
    target.z = best.z + 0.5;
    target.label = FIELD_LABELS[TYPE_INDEX.get(best.typeId) ?? 0] ?? 'SAMPLE FIELD';
    return target;
  }
}
