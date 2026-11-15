import { pixelIconSvg } from './pixelIcons.ts';
import './styles/earthFact.css';

// Recompensa "Space science on Earth" (issue #216): uma abertura curta no meio da tela
// (DISCOVERY! e o sinal indo de Marte para a Terra) e depois o card com o fato, na coluna da
// direita, com as frases entrando uma a uma. Nao pausa o jogo e nao recebe toque.

export interface EarthFactLine {
  icon: string;
  text: string;
  side: 'mars' | 'earth' | 'space'; // cor do icone: a base, a Terra ou a Estacao Espacial
}

export interface EarthFactView {
  title: string;
  reason: string;
  lines: EarthFactLine[];
  source: string;
}

const LEAVE_MS = 300; // igual as animacoes de saida do CSS
const SPARKS = 10;
const SPARK_RADIUS_PX = 120;

// Planetas em pixel art 12x12: cada letra e uma cor
const PLANETS = {
  mars: {
    colors: { R: '#c8552d', D: '#8f3a1e', L: '#e58a5a' } as Record<string, string>,
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
    colors: { B: '#2f7fd1', G: '#4fbf6b', W: '#e9f4ff', N: '#1f5aa3' } as Record<string, string>,
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

function planetSvg(name: keyof typeof PLANETS): string {
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

// Marte -> sinal -> Terra. O ponto do sinal anda sozinho pelo CSS.
function linkEl(): HTMLElement {
  const link = el('div', 'ef-link');
  link.setAttribute('aria-hidden', 'true');
  const mars = el('span', 'ef-planet is-mars');
  mars.innerHTML = planetSvg('mars');
  const earth = el('span', 'ef-planet is-earth');
  earth.innerHTML = planetSvg('earth');
  const beam = el('span', 'ef-beam');
  beam.append(el('i', ''));
  link.append(mars, beam, earth);
  return link;
}

export class EarthFactHud {
  private cardEl: HTMLElement;
  private burstEl: HTMLElement;
  private timers: number[] = [];

  constructor() {
    this.cardEl = document.getElementById('earth-fact') as HTMLElement;
    this.burstEl = document.getElementById('earth-fact-burst') as HTMLElement;
  }

  // Abertura por `introMs`, depois o card por `cardMs`. Chamar de novo troca o fato na hora.
  show(view: EarthFactView, introMs: number, cardMs: number): void {
    this.timers.forEach((id) => clearTimeout(id));
    this.timers = [];
    this.cardEl.classList.add('hidden');
    this.cardEl.classList.remove('is-leaving');
    this.burstEl.classList.remove('is-leaving');

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

  private renderBurst(view: EarthFactView): void {
    const sparks = el('div', 'ef-sparks');
    sparks.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < SPARKS; i++) {
      const angle = (i / SPARKS) * Math.PI * 2;
      const reach = SPARK_RADIUS_PX * (i % 2 ? 1 : 0.7);
      const spark = el('i', '');
      spark.style.setProperty('--dx', `${Math.round(Math.cos(angle) * reach)}px`);
      spark.style.setProperty('--dy', `${Math.round(Math.sin(angle) * reach * 0.6)}px`);
      sparks.append(spark);
    }
    this.burstEl.replaceChildren(sparks, el('div', 'ef-stamp', 'DISCOVERY!'), linkEl(), el('div', 'ef-burst-reason', view.reason));
    this.burstEl.classList.remove('hidden');
    void this.burstEl.offsetWidth; // reinicia as animacoes
  }

  private showCard(view: EarthFactView, cardMs: number): void {
    const titles = el('div', 'ef-titles');
    titles.append(el('small', '', 'DISCOVERY!'), el('strong', '', view.title));
    const head = el('header', 'ef-head');
    head.append(titles, linkEl());

    const lines = el('ul', 'ef-lines');
    view.lines.forEach((line, index) => {
      const row = el('li', `is-${line.side}`);
      row.style.setProperty('--i', String(index));
      const icon = el('span', 'ef-icon');
      icon.setAttribute('aria-hidden', 'true');
      icon.innerHTML = pixelIconSvg(line.icon);
      row.append(icon, el('span', '', line.text));
      lines.append(row);
    });

    const timer = el('i', 'ef-timer');
    timer.setAttribute('aria-hidden', 'true');
    timer.style.setProperty('--ef-ms', `${cardMs}ms`);

    this.cardEl.replaceChildren(head, el('p', 'ef-reason', view.reason), lines, el('small', 'ef-source', `Source: ${view.source}`), timer);
    this.cardEl.classList.remove('hidden', 'is-leaving');
    void this.cardEl.offsetWidth;
    this.later(cardMs - LEAVE_MS, () => this.cardEl.classList.add('is-leaving'));
    this.later(cardMs, () => {
      this.cardEl.classList.remove('is-leaving');
      this.cardEl.classList.add('hidden');
    });
  }
}
