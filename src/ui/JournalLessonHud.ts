import './styles/journalLesson.css';
import type { JournalVignette } from '../story/acts/act2Text.ts';
import { getLanguage, translate } from './i18n.ts';

// Aula do diario (ato 2, issue #408): um circulo em volta de uma parte da tela do diario e um
// card com seta explicando o que ela faz. Uma vinheta por vez; OK, Enter ou toque avancam.
// So desenha: a ordem das vinhetas e do JournalLesson (src/story/acts/act2Text.ts).

const RING_PAD = 8; // px de folga entre o alvo e o circulo
const CARD_GAP = 18; // px entre o circulo e o card

export class JournalLessonHud {
  onNext: () => void = () => {};
  isVisible = false;

  private root = document.getElementById('journal-lesson');
  private ring = document.getElementById('journal-lesson-ring');
  private card = document.getElementById('journal-lesson-card');
  private titleEl = document.getElementById('journal-lesson-title');
  private textEl = document.getElementById('journal-lesson-text');
  private countEl = document.getElementById('journal-lesson-count');
  private okButton = document.getElementById('journal-lesson-ok');
  private target = '';

  constructor() {
    this.okButton?.addEventListener('click', (event) => {
      event.stopPropagation();
      this.onNext();
    });
    // Enter avanca a aula (na captura: o diario e o jogo nao recebem a tecla)
    document.addEventListener('keydown', (event) => {
      if (!this.isVisible || event.key !== 'Enter') return;
      event.preventDefault();
      event.stopPropagation();
      this.onNext();
    }, true);
    window.addEventListener('resize', () => this.reposition());
  }

  show(vignette: JournalVignette, index: number, total: number): void {
    if (!this.root) return;
    this.isVisible = true;
    this.target = vignette.target;
    const language = getLanguage();
    if (this.titleEl) this.titleEl.textContent = translate(vignette.title, language);
    if (this.textEl) this.textEl.textContent = translate(vignette.text, language);
    if (this.countEl) this.countEl.textContent = `${index + 1} / ${total}`;
    this.root.classList.remove('hidden');
    this.reposition();
  }

  hide(): void {
    if (!this.isVisible) return;
    this.isVisible = false;
    this.root?.classList.add('hidden');
  }

  // Poe o circulo em volta do alvo e o card logo abaixo (ou acima, se nao couber).
  // O diario abre com uma animacao, entao o Act2Controller chama isto de novo por alguns instantes.
  reposition(): void {
    if (!this.isVisible || !this.ring || !this.card || !this.root) return;
    const el = this.target ? document.querySelector(this.target) : null;
    const rect = el?.getBoundingClientRect();
    const width = window.innerWidth;
    const height = window.innerHeight;
    const found = Boolean(rect && rect.width > 0 && rect.height > 0);
    this.root.classList.toggle('no-target', !found);
    const cardRect = this.card.getBoundingClientRect();
    if (!found || !rect) {
      this.card.style.left = `${Math.max(8, (width - cardRect.width) / 2)}px`;
      this.card.style.top = `${Math.max(8, (height - cardRect.height) / 2)}px`;
      return;
    }
    const top = Math.max(4, rect.top - RING_PAD);
    const left = Math.max(4, rect.left - RING_PAD);
    const ringWidth = Math.min(width - 4, rect.right + RING_PAD) - left;
    const ringHeight = Math.min(height - 4, rect.bottom + RING_PAD) - top;
    this.ring.style.left = `${left}px`;
    this.ring.style.top = `${top}px`;
    this.ring.style.width = `${ringWidth}px`;
    this.ring.style.height = `${ringHeight}px`;

    const below = top + ringHeight + CARD_GAP + cardRect.height <= height - 8;
    this.root.classList.toggle('card-above', !below);
    const cardTop = below ? top + ringHeight + CARD_GAP : Math.max(8, top - CARD_GAP - cardRect.height);
    const center = left + ringWidth / 2;
    const cardLeft = Math.max(8, Math.min(width - cardRect.width - 8, center - cardRect.width / 2));
    this.card.style.left = `${cardLeft}px`;
    this.card.style.top = `${cardTop}px`;
    // A seta do card aponta para o meio do circulo
    this.card.style.setProperty('--arrow-x', `${Math.max(16, Math.min(cardRect.width - 16, center - cardLeft))}px`);
  }
}
