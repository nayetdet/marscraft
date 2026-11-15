import { BRIEFING_SLIDES, BRIEFING_TAGLINE } from '../story/missionBriefing.ts';
import type { BriefingSlide, BriefingTarget } from '../story/missionBriefing.ts';
import { pixelSpriteSvg } from './pixelSprites.ts';
import './styles/briefing.css';

// Briefing da missao (src/story/missionBriefing.ts): um modal por cima do menu, no primeiro
// Play, com uma tela animada por trade-off. O recurso fica a esquerda e manda pontinhos para
// tres pontas; nas telas "pick" as pontas acendem uma de cada vez (so da para pagar uma).
// O botao final e o gesto do usuario que comeca o jogo (trava o mouse), por isso `onStart`
// roda dentro do proprio clique. Esc so fecha e volta ao menu.

const TONE_SIGN: Record<BriefingTarget['tone'], string> = { pick: '', gain: '+', cost: '-' };

function el(tag: string, className: string, text = ''): HTMLElement {
  const node = document.createElement(tag);
  node.className = className;
  if (text) node.textContent = text;
  return node;
}

function artEl(name: string, className: string): HTMLElement {
  const art = el('span', className);
  art.setAttribute('aria-hidden', 'true');
  art.innerHTML = pixelSpriteSvg(name);
  return art;
}

export class MissionBriefingHud {
  private root: HTMLElement;
  private slideEl: HTMLElement;
  private stepsEl: HTMLElement;
  private backBtn: HTMLButtonElement;
  private nextBtn: HTMLButtonElement;
  private index = 0;
  private onStart: (() => void) | null = null;

  constructor() {
    this.root = document.getElementById('mission-briefing') as HTMLElement;
    this.slideEl = this.root.querySelector('.mb-slide') as HTMLElement;
    this.stepsEl = this.root.querySelector('.mb-steps') as HTMLElement;
    this.backBtn = this.root.querySelector('.mb-back') as HTMLButtonElement;
    this.nextBtn = this.root.querySelector('.mb-next') as HTMLButtonElement;
    const skipBtn = this.root.querySelector('.mb-skip') as HTMLButtonElement;

    this.stepsEl.replaceChildren(...BRIEFING_SLIDES.map(() => el('i', '')));
    this.backBtn.addEventListener('click', () => this.go(this.index - 1));
    this.nextBtn.addEventListener('click', () => {
      if (this.index < BRIEFING_SLIDES.length - 1) this.go(this.index + 1);
      else this.finish();
    });
    skipBtn.addEventListener('click', () => this.finish());
    // Na captura: com o briefing aberto, as teclas nao chegam ao jogo nem ao menu
    document.addEventListener('keydown', (e) => this.onKey(e), true);
  }

  get isOpen(): boolean {
    return !this.root.classList.contains('hidden');
  }

  // Abre na primeira tela. `onStart` roda no clique (ou tecla) que termina ou pula o briefing.
  open(onStart: () => void): void {
    this.onStart = onStart;
    this.root.classList.remove('hidden');
    this.go(0);
    this.nextBtn.focus();
  }

  close(): void {
    this.root.classList.add('hidden');
    this.onStart = null;
  }

  private finish(): void {
    const start = this.onStart;
    this.close();
    start?.();
  }

  private onKey(e: KeyboardEvent): void {
    if (!this.isOpen) return;
    if (e.code === 'Escape') {
      // Sem comecar o jogo: o navegador nao deixa travar o mouse a partir do Esc
      e.preventDefault();
      e.stopImmediatePropagation();
      this.close();
      return;
    }
    const focused = document.activeElement;
    const onButton = focused instanceof HTMLButtonElement && this.root.contains(focused);
    if (e.code === 'ArrowRight') {
      if (!e.repeat) this.nextBtn.click();
    } else if (e.code === 'ArrowLeft') {
      if (!e.repeat) this.go(this.index - 1);
    } else if (e.code === 'Enter' || e.code === 'Space') {
      if (onButton) return; // o botao em foco ja recebe o clique do teclado
      if (!e.repeat) this.nextBtn.click();
    } else {
      return; // Tab, F5 e as outras teclas seguem o caminho normal
    }
    e.preventDefault();
    e.stopImmediatePropagation();
  }

  private go(index: number): void {
    this.index = Math.max(0, Math.min(BRIEFING_SLIDES.length - 1, index));
    const slide = BRIEFING_SLIDES[this.index];
    const isLast = this.index === BRIEFING_SLIDES.length - 1;
    this.root.style.setProperty('--mb-accent', slide.accent);
    [...this.stepsEl.children].forEach((dot, i) => dot.classList.toggle('is-on', i <= this.index));
    this.backBtn.disabled = this.index === 0;
    this.nextBtn.textContent = isLast ? 'Start mission' : 'Next';
    this.root.setAttribute('aria-label', `Mission briefing: ${slide.word}`);
    this.renderSlide(slide, isLast);
  }

  private renderSlide(slide: BriefingSlide, isLast: boolean): void {
    const rows = el('div', 'mb-rows');
    slide.targets.forEach((target, i) => {
      const row = el('div', `mb-row is-${target.tone}`);
      row.style.setProperty('--i', String(i));
      const track = el('span', 'mb-track');
      track.append(el('i', ''));
      const sign = TONE_SIGN[target.tone];
      row.append(track, artEl(target.art, 'mb-art'), el('b', '', sign ? `${sign} ${target.label}` : target.label));
      rows.append(row);
    });
    const scene = el('div', 'mb-scene');
    scene.append(artEl(slide.source, 'mb-source'), rows);

    const text = el('div', 'mb-text');
    text.append(el('h2', 'mb-word', slide.word), el('p', 'mb-line', slide.line));
    if (isLast) text.append(el('p', 'mb-tagline', BRIEFING_TAGLINE));

    this.slideEl.replaceChildren(scene, text);
    this.slideEl.classList.remove('is-in');
    void this.slideEl.offsetWidth; // reinicia a animacao de entrada
    this.slideEl.classList.add('is-in');
  }
}
