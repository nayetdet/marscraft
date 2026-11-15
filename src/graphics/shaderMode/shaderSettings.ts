// @ts-nocheck
import { GRAPHICS_CONFIG } from '../../config/constants.ts';

// Preferencia salva: 'on' e 'off' sao escolhas do jogador; 'auto-off' e a protecao de desempenho
// que desligou sozinha (o jogador pode religar pelo menu). Sem escolha salva, começa desligado.
export const SHADER_PREF = Object.freeze({ ON: 'on', OFF: 'off', AUTO_OFF: 'auto-off' });

export function readShaderPref(storage) {
  try {
    const value = storage?.getItem(GRAPHICS_CONFIG.STORAGE_KEY);
    return Object.values(SHADER_PREF).includes(value) ? value : null;
  } catch {
    return null;
  }
}

export function writeShaderPref(storage, pref) {
  try {
    storage?.setItem(GRAPHICS_CONFIG.STORAGE_KEY, pref);
  } catch {
    // Sem armazenamento (aba privada): a escolha vale so nesta sessao
  }
}

// Decide se o jogo abre com shaders. A escolha salva do jogador sempre ganha; sem escolha,
// mantém desligado e deixa a protecao de desempenho em modo automatico.
export function resolveShaderMode({ pref }) {
  if (pref === SHADER_PREF.ON) return { enabled: true, auto: false };
  if (pref === SHADER_PREF.OFF) return { enabled: false, auto: false };
  if (pref === SHADER_PREF.AUTO_OFF) return { enabled: false, auto: true };
  return { enabled: false, auto: true };
}

// Mede a media de FPS com os shaders ligados e avisa (uma vez) quando ela fica baixa demais.
export class FrameBudgetGuard {
  constructor({
    minFps = GRAPHICS_CONFIG.GUARD_MIN_FPS,
    seconds = GRAPHICS_CONFIG.GUARD_SECONDS,
    warmupSeconds = GRAPHICS_CONFIG.GUARD_WARMUP_SECONDS,
  } = {}) {
    this.minFps = minFps;
    this.seconds = seconds;
    this.warmupSeconds = warmupSeconds;
    this.reset();
  }

  reset() {
    this._warmup = 0;
    this._time = 0;
    this._frames = 0;
  }

  // Devolve true quando a janela inteira ficou abaixo do minimo. Quadros muito longos (aba em
  // segundo plano, travada de carregamento) nao contam.
  sample(frameMs) {
    if (!(frameMs > 0) || frameMs > 400) return false;
    const seconds = frameMs / 1000;
    if (this._warmup < this.warmupSeconds) {
      this._warmup += seconds;
      return false;
    }
    this._time += seconds;
    this._frames++;
    if (this._time < this.seconds) return false;
    const fps = this._frames / this._time;
    this._time = 0;
    this._frames = 0;
    return fps < this.minFps;
  }
}
