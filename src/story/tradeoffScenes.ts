// Cenas de trade-off: o modal curto e animado que aparece na hora em que a crianca vai fazer
// uma tarefa (ou quando um evento chega) e mostra o que aquela escolha custa. Quem desenha e o
// TradeoffHud (src/ui/TradeoffHud.ts); quem avisa a hora e o GameEngine, com um gatilho:
//   'step:<id>'      o passo do tutorial comecou (ids em tutorialSteps.ts)
//   'dust-warning'   aviso de tempestade de poeira
//   'storm-warning'  aviso de tempestade solar
//   'event:<tipo>'   evento sorteado de Marte comecou (eventDirector.ts)
//   'sunset'         o Sol esta para se por
//   'sleep'          a crianca foi dormir no beliche
// Regras (cobertas por teste):
// - nada e explicado antes da hora nem duas vezes: cada cena aparece UMA vez por partida
//   (TradeoffLedger), e a segunda vez que a situacao chega a crianca resolve sozinha;
// - nenhuma cena repete o trade-off de outra (um meteoro traz gelo la fora: e o mesmo
//   trade-off de OUTSIDE, entao nao tem cena propria);
// - pouco texto: uma palavra (ou duas) e uma frase curta.
// Cada cena e um recurso no meio e duas ou tres pontas: 'pick' = so da para pagar uma por vez;
// 'gain' = o que voce ganha; 'cost' = o que voce paga. Os desenhos sao os de pixelSprites.ts.

export type TradeoffTone = 'pick' | 'gain' | 'cost';

export interface TradeoffTarget {
  art: string;
  label: string;
  tone: TradeoffTone;
}

export interface TradeoffScene {
  id: string;
  triggers: string[];
  word: string;
  line: string;
  accent: string;
  source: string;
  targets: TradeoffTarget[];
  // Cena de emergencia: o modal fecha sozinho (STORY_CONFIG.URGENT_TRADEOFF_SECONDS), porque o
  // relogio da tempestade continua andando com ele aberto (issue #135)
  urgent?: boolean;
}

// Limites de texto: a crianca le rapido e volta para o jogo
export const TRADEOFF_LIMITS = Object.freeze({ WORD_WORDS: 2, LINE_WORDS: 7, LABEL_CHARS: 9, MIN_TARGETS: 2, MAX_TARGETS: 3 });

export const TRADEOFF_SCENES: readonly TradeoffScene[] = Object.freeze([
  {
    id: 'earth',
    triggers: ['step:report'],
    word: 'EARTH',
    line: 'Earth can help. The answer is slow.',
    accent: '#7fb4ff',
    source: 'mars',
    targets: [
      { art: 'earth', label: 'HELP', tone: 'gain' },
      { art: 'battery', label: 'POWER', tone: 'cost' },
    ],
  },
  {
    id: 'power',
    triggers: ['step:cert-power'],
    word: 'POWER',
    line: "One battery. It can't run everything.",
    accent: '#ffd24a',
    source: 'battery',
    targets: [
      { art: 'plant', label: 'PLANTS', tone: 'pick' },
      { art: 'shield', label: 'SHIELD', tone: 'pick' },
      { art: 'rocket', label: 'FUEL', tone: 'pick' },
    ],
  },
  {
    id: 'food',
    triggers: ['step:plant'],
    word: 'FOOD',
    line: 'Plants feed you. They drink first.',
    accent: '#7be08a',
    source: 'seed',
    targets: [
      { art: 'food', label: 'FOOD', tone: 'gain' },
      { art: 'drop', label: 'WATER', tone: 'cost' },
      { art: 'battery', label: 'POWER', tone: 'cost' },
    ],
  },
  {
    id: 'water',
    triggers: ['step:cert-shelter'],
    word: 'WATER',
    line: 'Every drop has three jobs.',
    accent: '#6fc8ff',
    source: 'drop',
    targets: [
      { art: 'heart', label: 'DRINK', tone: 'pick' },
      { art: 'plant', label: 'GROW', tone: 'pick' },
      { art: 'shield', label: 'WALL', tone: 'pick' },
    ],
  },
  {
    id: 'outside',
    triggers: ['step:collect-ice'],
    word: 'OUTSIDE',
    line: 'Ice is out there. So is danger.',
    accent: '#ff9a4a',
    source: 'rover',
    targets: [
      { art: 'ice', label: 'ICE', tone: 'gain' },
      { art: 'air', label: 'AIR', tone: 'cost' },
      { art: 'storm', label: 'RADIATION', tone: 'cost' },
    ],
  },
  {
    id: 'night',
    triggers: ['sunset'],
    word: 'NIGHT',
    line: 'No Sun at night. Heat drains power.',
    accent: '#b79cff',
    source: 'home',
    targets: [
      { art: 'sun', label: 'HEAT', tone: 'gain' },
      { art: 'battery', label: 'POWER', tone: 'cost' },
    ],
  },
  {
    id: 'sleep',
    triggers: ['sleep'],
    word: 'SLEEP',
    line: 'Sleep skips time. You still eat.',
    accent: '#9fb0ff',
    source: 'heart',
    targets: [
      { art: 'sun', label: 'MORNING', tone: 'gain' },
      { art: 'food', label: 'FOOD', tone: 'cost' },
      { art: 'drop', label: 'WATER', tone: 'cost' },
    ],
  },
  {
    id: 'dust',
    triggers: ['dust-warning'],
    word: 'DUST STORM',
    line: 'Dust hides the Sun. Save power.',
    accent: '#e0a060',
    source: 'battery',
    targets: [
      { art: 'home', label: 'HEAT', tone: 'pick' },
      { art: 'plant', label: 'PLANTS', tone: 'pick' },
      { art: 'rocket', label: 'FUEL', tone: 'pick' },
    ],
  },
  {
    id: 'solar',
    triggers: ['storm-warning'],
    urgent: true,
    word: 'SOLAR STORM',
    line: 'Three ways to hide. Each one costs.',
    accent: '#ff7a6b',
    source: 'storm',
    targets: [
      { art: 'shield', label: 'SHIELD', tone: 'pick' },
      { art: 'home', label: 'SHELTER', tone: 'pick' },
      { art: 'drop', label: 'WALL', tone: 'pick' },
    ],
  },
  {
    id: 'quake',
    triggers: ['event:marsquake'],
    word: 'MARSQUAKE',
    line: 'Fixing a machine costs power.',
    accent: '#f0c060',
    source: 'home',
    targets: [
      { art: 'battery', label: 'POWER', tone: 'cost' },
      { art: 'mars', label: 'ROCK', tone: 'cost' },
    ],
  },
]);

// A cena de um gatilho, ou null se a situacao nao tem trade-off novo para mostrar
export function sceneForTrigger(trigger: string): TradeoffScene | null {
  return TRADEOFF_SCENES.find((scene) => scene.triggers.includes(trigger)) ?? null;
}

// Livro das cenas ja vistas e fila das que esperam a vez. Logica pura (sem DOM): o TradeoffHud
// guarda `seenIds` no navegador e abre a cena que `next()` devolve.
export class TradeoffLedger {
  private seen: Set<string>;
  private queue: TradeoffScene[] = [];

  constructor(seenIds: Iterable<string> = []) {
    this.seen = new Set(seenIds);
  }

  // Pede a cena do gatilho. Cena ja vista (ou ja na fila) nao entra de novo. true = entrou.
  request(trigger: string): boolean {
    const scene = sceneForTrigger(trigger);
    if (!scene || this.seen.has(scene.id) || this.queue.includes(scene)) return false;
    this.queue.push(scene);
    return true;
  }

  get hasPending(): boolean {
    return this.queue.length > 0;
  }

  // Tira a proxima cena da fila e ja marca como vista
  next(): TradeoffScene | null {
    const scene = this.queue.shift() ?? null;
    if (scene) this.seen.add(scene.id);
    return scene;
  }

  get seenIds(): string[] {
    return [...this.seen];
  }
}
