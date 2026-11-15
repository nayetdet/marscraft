// Briefing da missao: as telas curtas que aparecem no primeiro Play, antes do pouso, e mostram
// os trade-offs do jogo (quem desenha e o MissionBriefingHud). Cada tela e um recurso no meio e
// tres pontas: 'pick' = o recurso so paga uma coisa por vez; 'gain' = o que voce ganha;
// 'cost' = o que voce paga. Pouco texto de proposito: uma palavra e uma frase curta por tela.
// Os desenhos sao os de src/ui/pixelSprites.ts.

export type BriefingTone = 'pick' | 'gain' | 'cost';

export interface BriefingTarget {
  art: string;
  label: string;
  tone: BriefingTone;
}

export interface BriefingSlide {
  id: string;
  word: string;
  line: string;
  accent: string;
  source: string;
  targets: BriefingTarget[];
}

// Limites de texto (cobertos por teste): a crianca le rapido e volta para o jogo
export const BRIEFING_LIMITS = Object.freeze({ LINE_WORDS: 7, LABEL_CHARS: 9, TARGETS: 3 });

export const BRIEFING_TAGLINE = 'Every choice has a cost.';

export const BRIEFING_SLIDES: readonly BriefingSlide[] = Object.freeze([
  {
    id: 'power',
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
    id: 'water',
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
]);
