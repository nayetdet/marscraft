import type { MomentScene, MomentView } from '../story/firstTimeMoments.ts';
import { pixelIconSvg } from './pixelIcons.ts';
import './styles/firstTime.css';

// Animacao de "primeira vez" (src/story/firstTimeMoments.ts) e da recompensa "Space science on
// Earth" da estufa (issue #216): uma abertura curta no meio da tela (a palavra do momento e a
// cena dele se mexendo) e depois o card com o fato, na coluna da direita, com as frases entrando
// uma a uma. Cada momento tem a sua cor, os seus icones e o seu jeito de se mexer
// (`scene.motion`). Nao pausa o jogo e nao recebe toque.

const LEAVE_MS = 300; // igual as animacoes de saida do CSS
const SPARKS = 10;
const SPARK_RADIUS_PX = 120;
const TRACK_DOTS = 3;

// Planetas em pixel art 12x12: cada letra e uma cor
const PLANETS: Record<string, { colors: Record<string, string>; rows: string[] }> = {
  mars: {
    colors: { R: '#c8552d', D: '#8f3a1e', L: '#e58a5a' },
    rows: [
      '....RRRR....',
      '..RRLLRRRR..',
      '.RLLRRRRDRR.',
      '.RLRRRRDDRR.',
      'RRRRDRRRRRRR',
      'RRRDDRRRRLRR',
      'RRRRRRRRRRRR',
      'RRLRRRRDDRRD',
      '.RRRRRRDRRD.',
      '.RRRDRRRRDD.',
      '..RRRRRDDD..',
      '....DDDD....',
    ],
  },
  earth: {
    colors: { B: '#2f7fd1', G: '#4fbf6b', W: '#e9f4ff', N: '#1f5aa3' },
    rows: [
      '....WWBB....',
      '..BBGGBBWW..',
      '.BGGGGBBBBB.',
      '.BGGGBBBGGB.',
      'BBGGBBBGGGGB',
      'BBBGBBBGGGBB',
      'BWWBBBBBGGBB',
      'BBBBGGBBBBBN',
      '.BBGGGGBBBN.',
      '.BBBGGBBBNN.',
      '..BBBBWWNN..',
      '....NNNN....',
    ],
  },
};

function planetSvg(name: string): string {
  const { colors, rows } = PLANETS[name];
  const rects: string[] = [];
  rows.forEach((row, y) => {
    [...row].forEach((c, x) => {
      if (colors[c]) rects.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="${colors[c]}"/>`);
    });
  });
  return `<svg viewBox="0 0 12 12" shape-rendering="crispEdges" aria-hidden="true">${rects.join('')}</svg>`;
}

function el(tag: string, className: string, text = ''): HTMLElement {
  const node = document.createElement(tag);
  node.className = className;
  if (text) node.textContent = text;
  return node;
}

// Uma ponta da cena: um planeta colorido ou um icone do HUD na cor do momento
function artEl(name: string, end: 'from' | 'to'): HTMLElement {
  const isPlanet = Object.hasOwn(PLANETS, name);
  const art = el('span', `ft-art is-${end} ${isPlanet ? 'is-planet' : 'is-icon'}`);
  art.innerHTML = isPlanet ? planetSvg(name) : pixelIconSvg(name);
  return art;
}

// A cena do momento: de um lado, o caminho, do outro. O CSS mexe conforme `is-<motion>`.
function sceneEl(scene: MomentScene): HTMLElement {
  const node = el('div', `ft-scene is-${scene.motion}`);
  node.setAttribute('aria-hidden', 'true');
  const track = el('span', 'ft-track');
  for (let i = 0; i < TRACK_DOTS; i++) track.append(el('i', ''));
  node.append(artEl(scene.from, 'from'), track, artEl(scene.to, 'to'));
  return node;
}

export class FirstTimeHud {
  private cardEl: HTMLElement;
  private burstEl: HTMLElement;
  private timers: number[] = [];

  constructor() {
    this.cardEl = document.getElementById('first-time-card') as HTMLElement;
    this.burstEl = document.getElementById('first-time-burst') as HTMLElement;
  }

  // Abertura por `introMs`, depois o card por `cardMs`. Chamar de novo troca o momento na hora.
  show(view: MomentView, introMs: number, cardMs: number): void {
    this.timers.forEach((id) => clearTimeout(id));
    this.timers = [];
    this.cardEl.classList.add('hidden');
    this.cardEl.classList.remove('is-leaving');
    this.burstEl.classList.remove('is-leaving');
    this.cardEl.style.setProperty('--ft-accent', view.accent);
    this.burstEl.style.setProperty('--ft-accent', view.accent);

    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    if (reducedMotion) {
      this.burstEl.classList.add('hidden');
      this.showCard(view, cardMs);
      return;
    }
    this.renderBurst(view);
    this.later(introMs - LEAVE_MS, () => this.burstEl.classList.add('is-leaving'));
    this.later(introMs, () => {
      this.burstEl.classList.add('hidden');
      this.showCard(view, cardMs);
    });
  }

  private later(ms: number, fn: () => void): void {
    this.timers.push(window.setTimeout(fn, Math.max(0, ms)));
  }

  private renderBurst(view: MomentView): void {
    const sparks = el('div', 'ft-sparks');
    sparks.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < SPARKS; i++) {
      const angle = (i / SPARKS) * Math.PI * 2;
      const reach = SPARK_RADIUS_PX * (i % 2 ? 1 : 0.7);
      const spark = el('i', '');
      spark.style.setProperty('--dx', `${Math.round(Math.cos(angle) * reach)}px`);
      spark.style.setProperty('--dy', `${Math.round(Math.sin(angle) * reach * 0.6)}px`);
      sparks.append(spark);
    }
    const stamp = el('div', 'ft-stamp', view.stamp);
    stamp.classList.toggle('is-long', view.stamp.length > 11);
    this.burstEl.replaceChildren(sparks, stamp, sceneEl(view.scene), el('div', 'ft-burst-reason', view.reason));
    this.burstEl.classList.remove('hidden');
    void this.burstEl.offsetWidth; // reinicia as animacoes
  }

  private showCard(view: MomentView, cardMs: number): void {
    const titles = el('div', 'ft-titles');
    titles.append(el('small', '', view.stamp), el('strong', '', view.title));
    const head = el('header', 'ft-head');
    head.append(titles, sceneEl(view.scene));

    const lines = el('ul', 'ft-lines');
    view.lines.forEach((line, index) => {
      const row = el('li', `is-${line.tone}`);
      row.style.setProperty('--i', String(index));
      const icon = el('span', 'ft-icon');
      icon.setAttribute('aria-hidden', 'true');
      icon.innerHTML = pixelIconSvg(line.icon);
      row.append(icon, el('span', '', line.text));
      lines.append(row);
    });

    const timer = el('i', 'ft-timer');
    timer.setAttribute('aria-hidden', 'true');
    timer.style.setProperty('--ft-ms', `${cardMs}ms`);

    this.cardEl.replaceChildren(head, el('p', 'ft-reason', view.reason), lines, el('small', 'ft-source', `Source: ${view.source}`), timer);
    this.cardEl.classList.remove('hidden', 'is-leaving');
    void this.cardEl.offsetWidth;
    this.later(cardMs - LEAVE_MS, () => this.cardEl.classList.add('is-leaving'));
    this.later(cardMs, () => {
      this.cardEl.classList.remove('is-leaving');
      this.cardEl.classList.add('hidden');
    });
  }
}
