import { DUST_WEATHER_CONFIG as D } from '../config/constants.js';

// Tempestade de poeira como clima no tempo (issue #103). Logica pura, sem DOM nem Three.js.
// Fases: clear (ceu limpo) -> warning (a estacao do tempo ve a frente de poeira) -> storm ->
// clearing (a poeira baixa) -> clear. A opacidade do ar (tau) e a poeira nos paineis
// (panelDust, 0 a 1) multiplicam a geracao solar. Ninguem se machuca com o vento: o ar de
// Marte e fino demais para derrubar alguem. O perigo e a falta de energia.

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const lerp = (a, b, t) => a + (b - a) * t;
const between = ([min, max], rng) => min + (max - min) * rng();

// Fracao da geracao solar que passa pelo ar com opacidade `tau` (regra de jogo): 1 no ceu
// limpo, SOLAR_FACTOR_AT_RECORD no recorde real (10,8), em linha reta entre os dois
export function tauSolarFactor(tau) {
  const t = clamp01((tau - D.TAU_CLEAR) / (D.TAU_RECORD - D.TAU_CLEAR));
  return 1 - (1 - D.SOLAR_FACTOR_AT_RECORD) * t;
}

// Fracao que os paineis convertem com `panelDust` de poeira em cima (0 = limpo)
export function panelDustFactor(panelDust) {
  return 1 - D.PANEL_DUST_MAX_LOSS * clamp01(panelDust);
}

// Rajada (m/s) -> poeira que o vento tira dos paineis (regra de jogo)
export function windCleaning(gustMs) {
  return Math.max(0, gustMs - D.WIND_CLEAN_GUST_MS) * D.WIND_CLEAN_PER_MS;
}

export class DustWeather {
  // `rng`: sorteio (Math.random no jogo; fixo nos testes). `started: false` deixa o ceu limpo
  // ate `start()` (a historia solta o clima no ato 2, longe do tutorial).
  constructor({ rng = Math.random, startHours = 0, started = false } = {}) {
    this.rng = rng;
    this.phase = 'clear';
    this.tau = D.TAU_CLEAR;
    this.peakTau = D.TAU_CLEAR;
    this.panelDust = D.START_PANEL_DUST;
    this.hours = startHours;
    this.phaseStart = startHours;
    this.phaseEnd = Infinity;
    this.nextStormAt = Infinity; // chegada da proxima tempestade (horas de jogo)
    this.started = false;
    this.events = [];
    if (started) this.start(startHours);
  }

  start(hours) {
    if (this.started) return;
    this.started = true;
    this.nextStormAt = hours + between(D.FIRST_STORM_AFTER_HOURS, this.rng);
  }

  // Fracao da geracao solar que sobra com o ar e os paineis de agora
  get solarFactor() {
    return tauSolarFactor(this.tau) * panelDustFactor(this.panelDust);
  }

  // 0 a 1: quanto o ceu escurece (visual)
  get haze() {
    return clamp01((this.tau - D.TAU_CLEAR) / (D.HAZE_FULL_TAU - D.TAU_CLEAR));
  }

  // 0 a 1 durante o aviso: a frente de poeira se aproximando no horizonte (visual)
  get frontProgress() {
    if (this.phase !== 'warning') return 0;
    return clamp01((this.hours - this.phaseStart) / Math.max(1e-6, this.phaseEnd - this.phaseStart));
  }

  // Horas de jogo ate a tempestade chegar (no aviso) ou ate a fase atual acabar
  get hoursUntilStorm() {
    return Math.max(0, this.nextStormAt - this.hours);
  }

  get hoursLeftInPhase() {
    return Math.max(0, this.phaseEnd - this.hours);
  }

  // Avanca `h` horas de jogo, ate `hours` (horas totais). Chamar em passos curtos.
  step(h, hours) {
    this.hours = hours;
    this._advancePhase();
    this.tau = this._tauNow();
    const rate = this.phase === 'storm' ? D.PANEL_DUST_STORM_PER_HOUR : D.PANEL_DUST_PER_HOUR;
    this.panelDust = clamp01(this.panelDust + rate * h);
  }

  _advancePhase() {
    // Um passo longo pode atravessar mais de uma fase
    for (let guard = 0; guard < 4; guard++) {
      if (this.phase === 'clear') {
        if (this.hours < this.nextStormAt - D.WARNING_HOURS) return;
        this._enter('warning', this.nextStormAt - D.WARNING_HOURS, this.nextStormAt);
        this._emit('dust-warning');
      } else if (this.phase === 'warning') {
        if (this.hours < this.phaseEnd) return;
        this.peakTau = between([D.PEAK_TAU_MIN, D.TAU_RECORD], this.rng);
        this._enter('storm', this.phaseEnd, this.phaseEnd + between(D.STORM_HOURS, this.rng));
        this._emit('dust-start');
      } else if (this.phase === 'storm') {
        if (this.hours < this.phaseEnd) return;
        this._enter('clearing', this.phaseEnd, this.phaseEnd + D.CLEARING_HOURS);
        this._emit('dust-clearing');
      } else {
        if (this.hours < this.phaseEnd) return;
        this._enter('clear', this.phaseEnd, Infinity);
        this.nextStormAt = this.hours + between(D.GAP_BETWEEN_STORMS_HOURS, this.rng);
        this._emit('dust-end');
      }
    }
  }

  _enter(phase, start, end) {
    this.phase = phase;
    this.phaseStart = start;
    this.phaseEnd = end;
  }

  _tauNow() {
    const elapsed = this.hours - this.phaseStart;
    if (this.phase === 'storm') return lerp(D.TAU_CLEAR, this.peakTau, clamp01(elapsed / D.RAMP_HOURS));
    if (this.phase === 'clearing') return lerp(this.peakTau, D.TAU_CLEAR, clamp01(elapsed / D.CLEARING_HOURS));
    return D.TAU_CLEAR;
  }

  _emit(type) {
    this.events.push({ type });
  }

  drainEvents() {
    const events = this.events;
    this.events = [];
    return events;
  }

  // Admin e controles de demo: 'warning' (aviso agora, chega em `leadHours`), 'storm' (agora)
  // ou 'end' (a poeira comeca a baixar). Devolve a fase nova.
  force(target, leadHours = D.DEMO_LEAD_HOURS) {
    this.started = true;
    const now = this.hours;
    if (target === 'warning') {
      if (this.phase === 'storm') return this.phase;
      this.nextStormAt = now + leadHours;
      this._enter('warning', now, this.nextStormAt);
      this._emit('dust-warning');
    } else if (target === 'storm') {
      if (this.phase !== 'storm') {
        this.nextStormAt = now;
        this._enter('warning', now, now);
        this._advancePhase();
      }
    } else if (target === 'end' && (this.phase === 'storm' || this.phase === 'warning')) {
      if (this.phase === 'warning') {
        this._enter('clear', now, Infinity);
        this.nextStormAt = now + between(D.GAP_BETWEEN_STORMS_HOURS, this.rng);
      } else {
        this.peakTau = this.tau;
        this._enter('clearing', now, now + D.CLEARING_HOURS);
        this._emit('dust-clearing');
      }
    }
    this.tau = this._tauNow();
    return this.phase;
  }

  // Limpeza a mao: tira CLEAN_STEP de poeira. Devolve quanto saiu (0 = ja estava limpo).
  cleanPanels() {
    const removed = Math.min(this.panelDust, D.CLEAN_STEP);
    this.panelDust -= removed;
    return removed;
  }

  // Rajada do sol (m/s, dado real do InSight): vento forte tira um pouco da poeira
  applyWindGust(gustMs) {
    const removed = Math.min(this.panelDust, windCleaning(gustMs));
    this.panelDust -= removed;
    return removed;
  }
}
