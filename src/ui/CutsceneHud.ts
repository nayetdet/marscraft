// @ts-nocheck
// Camada das animacoes (chegada e decolagem): barras de cinema, legenda, titulo grande,
// fade de tela cheia e o botao de pular. Enquanto ela esta ativa, o HUD do jogo some
// (classe `cutscene-active` no body).
import { getLanguage, translate } from './i18n.ts';

const FADE_OUT_MS = 800;

export class CutsceneHud {
  constructor({ onSkip }) {
    const $ = (id) => document.getElementById(id);
    this.layerEl = $('cutscene-layer');
    this.fadeEl = $('cutscene-fade');
    this.captionEl = $('cutscene-caption');
    this.titleEl = $('cutscene-title');
    this.titleMainEl = $('cutscene-title-main');
    this.titleSubEl = $('cutscene-title-sub');

    this.isShown = false;
    this._opacity = -1;
    this._color = '';
    this._hideTimer = null;

    $('cutscene-skip').addEventListener('click', () => {
      if (this.isShown) onSkip();
    });
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Enter' && this.isShown) {
        e.preventDefault();
        onSkip();
      }
    });
  }

  show() {
    clearTimeout(this._hideTimer);
    this.isShown = true;
    document.body.classList.add('cutscene-active');
    this.layerEl.classList.remove('hidden', 'is-ending');
  }

  // O fade que estiver na tela some sozinho (transicao CSS) e so depois a camada sai
  hide() {
    this.isShown = false;
    document.body.classList.remove('cutscene-active');
    this.setCaption(null);
    this.layerEl.classList.add('is-ending');
    this.fadeEl.style.opacity = '0';
    this._opacity = 0;
    clearTimeout(this._hideTimer);
    this._hideTimer = setTimeout(() => {
      this.layerEl.classList.add('hidden');
      this.layerEl.classList.remove('is-ending');
    }, FADE_OUT_MS + 50);
  }

  // caption: { text, sub?, big?, side?, place? } ou null. `side` poe o titulo grande na esquerda
  // da tela. `place` e a etiqueta do passeio pela base: o nome do lugar fica sobre a imagem e a
  // frase (`sub`) vai na barra de baixo.
  setCaption(caption) {
    const language = getLanguage();
    const place = Boolean(caption?.place);
    const big = Boolean(caption?.big) || place;
    this.captionEl.textContent = !caption ? '' : place ? translate(caption.sub ?? '', language) : big ? '' : translate(caption.text, language);
    this.titleEl.classList.toggle('hidden', !big);
    this.titleEl.classList.toggle('is-side', Boolean(caption?.side));
    this.titleEl.classList.toggle('is-place', place);
    if (big) {
      this.titleMainEl.textContent = translate(caption.text, language);
      this.titleSubEl.textContent = place ? '' : translate(caption.sub ?? '', language);
      // Reinicia a animacao de "pulso" a cada numero da contagem
      this.titleEl.classList.remove('is-popping');
      void this.titleEl.offsetWidth;
      this.titleEl.classList.add('is-popping');
    }
  }

  setFade(opacity, color) {
    const rounded = Math.round(opacity * 50) / 50;
    if (rounded !== this._opacity) {
      this._opacity = rounded;
      this.fadeEl.style.opacity = String(rounded);
    }
    if (color !== this._color) {
      this._color = color;
      this.fadeEl.style.background = color;
    }
  }
}
