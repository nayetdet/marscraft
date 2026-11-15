import { SPEAKERS } from '../radioSpeakers.ts';
import { ACT2_ENGINEER_NAME } from './act2Steps.ts';

// Textos do ato 2 (issue #408): cards de radio, falas do engenheiro, avisos e a aula do diario.
// UI em ingles, para criancas de 7 a 12 anos, sem emoji. So dados: quem decide quando cada
// coisa aparece e o Act2Controller.

const NAME = ACT2_ENGINEER_NAME;

export const ACT2_CARDS = {
  // Limpar agora ou esperar: so informa (sem `id` nas opcoes). A crianca escolhe agindo.
  cleanChoice: {
    title: 'DUST ON THE PANELS',
    speaker: SPEAKERS.engineer,
    lines: [{ icon: 'dust', text: 'Clean now or wait? You decide' }],
    choices: [
      { icon: 'wrench', name: 'CLEAN NOW', good: 'Keeps the power up', bad: 'Suit wears, dust comes back' },
      { icon: 'clock', name: 'WAIT INSIDE', good: 'Suit stays whole', bad: 'Battery drops all storm' },
    ],
    // O desgaste dobrado na tempestade e regra de jogo; o fato real e o da poeira lunar
    source: 'Real: Moon dust wore down the Apollo spacesuits (NASA/TM-2005-213610). The storm rule is a game rule.',
  },
  // A rachadura achada: o fato real do detector de vazamento da Estacao Espacial
  leakFound: {
    title: 'YOU FOUND THE LEAK',
    speaker: SPEAKERS.engineer,
    lines: [
      { icon: 'check', text: 'This window is cracked' },
      { icon: 'wrench', text: 'Now choose who brings new glass' },
      { icon: 'radio', text: 'Space Station crews hunt leaks by sound' },
    ],
    source: 'Real: in 2020 the Space Station crew used an ultrasonic leak detector to find an air leak (NASA).',
  },
  // A Terra nao esta no ceu agora: qualquer alvo do ceu vale
  earthHidden: {
    title: 'EARTH IS NOT UP',
    speaker: SPEAKERS.comms,
    lines: [
      { icon: 'moon', text: 'Earth is below the horizon right now' },
      { icon: 'check', text: 'Scan the Sun or a moon instead' },
    ],
  },
};

export const ACT2_TEXT = {
  promptScope: `[F] Get the scope from ${NAME}`,
  promptGlass: `[F] Get the new window glass from ${NAME}`,
  promptRepair: '[F] Replace the cracked window (uses 1 glass)',
  scopeGiven: `${NAME}: Here is your scope. Scan the windows to find the leak!`,
  glassComing: `${NAME}: I am getting new glass. Come and take it!`,
  glassGiven: `${NAME}: Here is the glass. Put it on the cracked window!`,
  windowFixed: 'Window replaced! The base stopped losing air.',
  leakStarted: 'The dust storm cracked a window: the base is losing air!',
  scopeAdded: 'The scope is now in your hotbar.',
  windowOk: (blocks: number) => `Window OK. The leak sounds ${blocks} blocks away`,
  windowCracked: 'CRACKED! The air is leaking here',
};

// Alvos que a luneta mostra ao escanear um vidro (ScannerHud.update le `state.entry`)
export const WINDOW_SCAN_ENTRIES = {
  scanning: { title: 'BASE WINDOW', category: 'base', status: '' },
  ok: { title: 'WINDOW OK', category: 'base', status: '' },
  cracked: { title: 'CRACKED WINDOW', category: 'base', status: ACT2_TEXT.windowCracked },
};

// Aula do diario (passo journal-lesson): 3 vinhetas, uma por vez, cada uma com um circulo e uma
// seta sobre uma parte da tela do diario. `target`: seletor CSS do que o circulo cerca.
export interface JournalVignette {
  target: string;
  title: string;
  text: string;
}

export const JOURNAL_LESSON: JournalVignette[] = [
  { target: '#journal-progress', title: 'YOUR PROGRESS', text: 'This counts everything you found. Fill it to rank up!' },
  { target: '.journal-modes', title: 'THE PAGES', text: 'FINDS shows your scans. LOG keeps your choices. The other two show real NASA science.' },
  { target: '.journal-card.ready, .journal-card', title: 'A FIND CARD', text: 'Each scan becomes a card. Pick one to read its real facts.' },
];

// Em que vinheta a aula esta. Logica pura: quem desenha e o JournalLessonHud.
export class JournalLesson {
  index = 0;
  done = false;
  readonly total: number;

  constructor(total: number = JOURNAL_LESSON.length) {
    this.total = total;
  }

  get vignette(): JournalVignette | null {
    return this.done ? null : JOURNAL_LESSON[this.index] ?? null;
  }

  // OK, Enter ou toque: vai para a proxima vinheta; na ultima, a aula acaba. Devolve `done`.
  next(): boolean {
    if (this.done) return true;
    this.index++;
    if (this.index >= this.total) this.done = true;
    return this.done;
  }
}
