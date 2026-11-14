import { STORY_CONFIG } from '../config/constants.js';
import { WINDOW_CLOSED } from '../story/storyChapters.js';

// Tempo minimo de um card na tela quando ja existe outro na fila
const MIN_CARD_SECONDS = 5;

// UI da historia: o card de radio (mensagens do Controle da Missao, nao pausa o jogo)
// e a tela final de quando a janela de lancamento fecha.
export class StoryHud {
  constructor({ cardSeconds = STORY_CONFIG.CARD_SECONDS } = {}) {
    const $ = (id) => document.getElementById(id);
    this.cardSeconds = cardSeconds;

    this.cardEl = $('story-card');
    this.titleEl = $('story-card-title');
    this.textEl = $('story-card-text');
    this.sourceEl = $('story-card-source');
    this.windowOverlayEl = $('window-overlay');

    this.queue = [];
    this.current = null;
    this.timer = 0;
    this.isWindowClosedShown = false;

    $('story-card-ok').addEventListener('click', () => this.dismiss());
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Enter' && this.current) this.dismiss();
    });
    $('window-play-again-btn').addEventListener('click', () => window.location.reload());
  }

  // card: { title, text, source? }. Os cards entram numa fila, um por vez.
  showCard(card) {
    this.queue.push(card);
    if (!this.current) {
      this._next();
      return;
    }
    // Com outro card esperando, o atual so fica o tempo minimo de leitura
    const shown = this.cardSeconds - this.timer;
    this.timer = Math.min(this.timer, Math.max(0, MIN_CARD_SECONDS - shown));
  }

  // Conta o tempo do card so enquanto o jogo roda, para ninguem perder a mensagem no pause
  update(dt) {
    if (!this.current) return;
    this.timer -= dt;
    if (this.timer <= 0) this._next();
  }

  dismiss() {
    if (this.current) this._next();
  }

  clearCards() {
    this.queue.length = 0;
    this.current = null;
    this.cardEl.classList.add('hidden');
  }

  showWindowClosed() {
    this.isWindowClosedShown = true;
    this.clearCards();
    document.getElementById('window-title').textContent = WINDOW_CLOSED.title;
    document.getElementById('window-text').textContent = WINDOW_CLOSED.text;
    document.getElementById('window-source').textContent = WINDOW_CLOSED.source;
    this.windowOverlayEl.classList.remove('hidden');
  }

  _next() {
    this.current = this.queue.shift() ?? null;
    if (!this.current) {
      this.cardEl.classList.add('hidden');
      return;
    }
    this.timer = this.cardSeconds;
    this.titleEl.textContent = this.current.title;
    this.textEl.textContent = this.current.text;
    this.sourceEl.textContent = this.current.source ?? '';
    this.cardEl.classList.remove('hidden');
    // Reinicia a animacao de entrada quando um card troca pelo seguinte
    this.cardEl.classList.remove('is-entering');
    void this.cardEl.offsetWidth;
    this.cardEl.classList.add('is-entering');
  }
}
