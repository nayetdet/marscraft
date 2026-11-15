// @ts-nocheck
import { DUST_WEATHER_CONFIG as D } from '../config/constants.ts';
import { SOLAR_FIELD } from '../world/habitatLayout.ts';

// Tempestade de poeira como clima no tempo (issue #103). Logica pura, sem DOM nem Three.js.
// Fases: clear (ceu limpo) -> warning (a estacao do tempo ve a frente de poeira) -> storm ->
// clearing (a poeira baixa) -> clear. A opacidade do ar (tau) e a poeira nos paineis
// (panelDust, 0 a 1) multiplicam a geracao solar. Ninguem se machuca com o vento: o ar de
// Marte e fino demais para derrubar alguem. O perigo e a falta de energia.
// A poeira e guardada por painel (`panels`, um valor por painel do campo solar, ato 2 #408):
// `panelDust` e a media, que e o que a geracao solar e as telas da base leem.

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
  constructor({ rng = Math.random, startHours = 0, started = false, panelCount = SOLAR_FIELD.count } = {}) {
    this.rng = rng;
    this.panels = new Array(panelCount).fill(0);
    // Tempestade roteirizada (ato 2): duracao, pico e poeira por hora proprios. null = sorteada.
    this.script = null;
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

  // Media da poeira dos paineis (0 a 1)
  get panelDust() {
    let sum = 0;
    for (let i = 0; i < this.panels.length; i++) sum += this.panels[i];
    return sum / this.panels.length;
  }

  // Admin e testes: a mesma poeira em todos os paineis
  set panelDust(value) {
    this.panels.fill(clamp01(value));
  }

  // Todos os paineis com menos poeira que `limit`?
  panelsBelow(limit) {
    for (let i = 0; i < this.panels.length; i++) if (this.panels[i] >= limit) return false;
    return true;
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
    // A tempestade e a poeira do dia a dia sujam todos os paineis por igual
    const rate = this.phase === 'storm' ? this.script?.dustPerHour ?? D.PANEL_DUST_STORM_PER_HOUR : D.PANEL_DUST_PER_HOUR;
    for (let i = 0; i < this.panels.length; i++) this.panels[i] = clamp01(this.panels[i] + rate * h);
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
        this.peakTau = this.script?.peakTau ?? between([D.PEAK_TAU_MIN, D.TAU_RECORD], this.rng);
        this._enter('storm', this.phaseEnd, this.phaseEnd + (this.script?.stormHours ?? between(D.STORM_HOURS, this.rng)));
        this._emit('dust-start');
      } else if (this.phase === 'storm') {
        if (this.hours < this.phaseEnd) return;
        this._enter('clearing', this.phaseEnd, this.phaseEnd + D.CLEARING_HOURS);
        this.script = null;
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
    if (this.phase === 'storm') return lerp(D.TAU_CLEAR, this.peakTau, clamp01(elapsed / (this.script?.rampHours ?? D.RAMP_HOURS)));
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
  // `script` (so com 'warning'): tempestade roteirizada da historia, com numeros proprios
  // { stormHours, peakTau, rampHours, dustPerHour }. Vale so para a proxima tempestade.
  force(target, leadHours = D.DEMO_LEAD_HOURS, script = null) {
    this.started = true;
    const now = this.hours;
    if (target === 'warning') {
      if (this.phase === 'storm') return this.phase;
      this.script = script;
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
        this.script = null;
        this._enter('clearing', now, now + D.CLEARING_HOURS);
        this._emit('dust-clearing');
      }
    }
    this.tau = this._tauNow();
    return this.phase;
  }

  // Tira ate `amount` de poeira de TODOS os paineis. Devolve quanto saiu, na media.
  cleanPanels(amount = D.CLEAN_STEP) {
    let removed = 0;
    for (let i = 0; i < this.panels.length; i++) removed += this.cleanPanel(i, amount);
    return removed / this.panels.length;
  }

  // Limpeza a mao: tira CLEAN_STEP de poeira de UM painel. Devolve quanto saiu (0 = ja estava limpo).
  cleanPanel(index, amount = D.CLEAN_STEP) {
    const dust = this.panels[index];
    if (dust === undefined) return 0;
    const removed = Math.min(dust, amount);
    this.panels[index] = dust - removed;
    return removed;
  }

  // Redemoinho: limpa por inteiro os `count` paineis mais perto de `nearIndex` (o painel por onde
  // ele cruza a fileira; pode ser fracionario). Devolve quantos paineis ele limpou.
  sweepPanels(count, nearIndex = (this.panels.length - 1) / 2) {
    const order = this.panels.map((_, i) => i).sort((a, b) => Math.abs(a - nearIndex) - Math.abs(b - nearIndex) || a - b);
    const swept = order.slice(0, Math.max(0, count));
    for (const i of swept) this.panels[i] = 0;
    return swept.length;
  }

  // Rajada do sol (m/s, dado real do InSight): vento forte tira um pouco da poeira de todos
  applyWindGust(gustMs) {
    return this.cleanPanels(windCleaning(gustMs));
  }
}
