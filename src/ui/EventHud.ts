// @ts-nocheck
import './styles/events.css';

// Parte de tela dos eventos aleatorios (issue #107): a poeira que fecha a visao quando o
// redemoinho pega o jogador. Os cards dos eventos usam o card de radio da historia (StoryHud).
export class EventHud {
  constructor() {
    this.dustEl = document.createElement('div');
    this.dustEl.id = 'event-dust-overlay';
    this.dustEl.className = 'event-dust-overlay';
    this.dustEl.setAttribute('aria-hidden', 'true');
    document.body.appendChild(this.dustEl);
    this._dustLeft = 0;
    this._shown = false;
  }

  blind(seconds) {
    this._dustLeft = Math.max(this._dustLeft, seconds);
  }

  update(dt) {
    if (this._dustLeft > 0) this._dustLeft = Math.max(0, this._dustLeft - dt);
    const show = this._dustLeft > 0;
    if (show === this._shown) return;
    this._shown = show;
    this.dustEl.classList.toggle('is-on', show);
  }
}
