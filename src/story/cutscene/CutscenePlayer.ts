// @ts-nocheck
import { activeCaption, sampleScalar } from './timeline.ts';

// Toca uma animacao por vez. A definicao (`def`) descreve a cena:
//   { duration, captions, fade?, fadeColor?, runsUnlocked?, update(t, dt), onEnd() }
// `update` move a camera e os objetos; o player cuida do tempo, das legendas, do fade e do fim.
// `hud`: { show(), hide(), setCaption(caption | null), setFade(opacity, color) }
export class CutscenePlayer {
  constructor({ hud }) {
    this.hud = hud;
    this.def = null;
    this.time = 0;
    this._caption = null;
  }

  get isActive() {
    return this.def !== null;
  }

  // A animacao de decolagem roda com o mouse solto (o painel do MAV estava aberto)
  get runsUnlocked() {
    return Boolean(this.def?.runsUnlocked);
  }

  play(def) {
    if (this.def) this._finish();
    this.def = def;
    this.time = 0;
    this._caption = null;
    this.hud.show();
    this.hud.setCaption(null);
    this._apply(0);
  }

  update(dt) {
    if (!this.def) return;
    this.time = Math.min(this.def.duration, this.time + dt);
    this._apply(dt);
    if (this.time >= this.def.duration) this._finish();
  }

  skip() {
    if (this.def) this._finish();
  }

  _apply(dt) {
    const def = this.def;
    def.update(this.time, dt);

    const caption = activeCaption(def.captions, this.time);
    if (caption !== this._caption) {
      this._caption = caption;
      this.hud.setCaption(caption);
    }
    if (def.fade) this.hud.setFade(sampleScalar(def.fade, this.time), def.fadeColor ?? '#000');
  }

  _finish() {
    const def = this.def;
    this.def = null;
    this._caption = null;
    this.hud.hide();
    def.onEnd?.();
  }
}
