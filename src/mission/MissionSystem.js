import {
  ENERGY_CONFIG,
  MAV_CONFIG,
  MISSION_CONFIG,
  SURVIVAL_CONFIG,
} from '../config/constants.js';
import { Battery, solarChargePerHour } from './energy.js';
import { doseRateMsvPerHour, radiationDamage } from './radiation.js';
import { buildStormSchedule, stormStateAt } from './solarStorms.js';

const PROPELLANT_PER_ICE = 100 / MAV_CONFIG.ICE_BLOCKS_FOR_FULL_TANK;

// Converte pontos de O2 do jogo em kg: um sol inteiro respirando la fora = 0,84 kg (NASA BVAD)
export function oxygenPointsToKg(points) {
  const secondsPerSol = 24 / MISSION_CONFIG.GAME_HOURS_PER_SECOND;
  const pointsPerSol = SURVIVAL_CONFIG.OXYGEN_DRAIN_RATE * secondsPerSol;
  return (points / pointsPerSol) * MAV_CONFIG.OXYGEN_KG_PER_DAY;
}

export function mavProgress({ propellant, stormsSurvived, dataSent }) {
  const propellantPart = Math.min(1, propellant / 100);
  const stormsPart = Math.min(1, stormsSurvived / MAV_CONFIG.STORMS_TO_SURVIVE);
  const dataPart = dataSent ? 1 : 0;
  const overall = (propellantPart + stormsPart + dataPart) / 3;
  return {
    propellantPct: propellantPart * 100,
    stormsPct: stormsPart * 100,
    overallPct: overall * 100,
    ready: propellantPart >= 1 && stormsPart >= 1 && dataPart >= 1,
  };
}

// Energia, tempestades solares, radiacao e o MAV. Sem DOM nem Three.js, para testar com Vitest.
// O tempo vem do relogio do ceu em horas de jogo totais: (sol - 1) * 24 + hora do dia.
export class MissionSystem {
  // `stormsStarted: false` deixa o clima espacial calmo ate `startStorms()` (a historia so
  // solta as tempestades no ato 2, para nenhuma CME cair no meio do tutorial).
  constructor({ cmes, startHours, stormsStarted = true }) {
    this.battery = new Battery();
    this.cmes = cmes;
    this.stormsStarted = stormsStarted;
    this.schedule = stormsStarted ? buildStormSchedule(cmes, startHours) : [];
    this.lastHours = startHours;

    this.shieldOn = false;
    // Jogador dentro da bolha do escudo (shieldZone). O escudo só reduz a dose de quem está nela.
    this.insideShield = true;
    this.factoryOn = true;
    this.iceStock = 0; // blocos de gelo esperando na fabrica
    this.propellant = 0; // %
    this.dataSent = false;
    this.launched = false;

    this.stormsSurvived = 0;
    this.totalDoseMsv = 0;
    this.doseRate = doseRateMsvPerHour();
    this.chargeRate = 0;
    this.solarEnergyCollected = 0; // % de bateria somados
    this.oxygenProducedPoints = 0;
    this.iceDelivered = 0;

    this.storm = stormStateAt(this.schedule, startHours);
    this._phaseKey = this._keyFor(this.storm);
    this._diedDuringStorm = false;
    this._playedDuringStorm = false;
    this.events = [];
    // Filtros de ar gastos encarecem o O2 do habitat (gerador de O2 da tripulacao, issue #47)
    this.oxygenCostMultiplier = 1;
  }

  get progress() {
    return mavProgress(this);
  }

  // Avanca a missao ate `hours`. `active` = jogo rodando (sem pausa e jogador vivo):
  // so entao a radiacao atinge o jogador. Devolve o dano de radiacao a aplicar na vida.
  // `insideShield` = jogador dentro da bolha do escudo; fora dela o escudo ligado nao protege.
  update(hours, { insideHabitat = false, insideShield = true, active = true } = {}) {
    this.insideShield = insideShield;
    let remaining = hours - this.lastHours;
    let damage = 0;
    while (remaining > 1e-9) {
      const step = Math.min(remaining, MISSION_CONFIG.MAX_STEP_HOURS);
      this.lastHours += step;
      remaining -= step;
      damage += this._step(step, insideHabitat, active);
    }
    this.lastHours = Math.max(this.lastHours, hours);
    return damage;
  }

  _step(h, insideHabitat, active) {
    const timeOfDay = ((this.lastHours % 24) + 24) % 24;

    this.chargeRate = solarChargePerHour(timeOfDay);
    this.solarEnergyCollected += this.battery.add(this.chargeRate * h);

    if (this.shieldOn) {
      const need = ENERGY_CONFIG.SHIELD_DRAIN_PER_HOUR * h;
      if (this.battery.drain(need) + 1e-9 < need) {
        this.shieldOn = false;
        this._emit('shield-off-no-energy');
      }
    }

    this._runFactory(h);
    this._updateStormPhase();

    const multiplier = this.storm.phase === 'active' ? this.storm.storm.multiplier : 1;
    this.doseRate = doseRateMsvPerHour({ stormMultiplier: multiplier, insideHabitat, shieldOn: this.shieldOn && this.insideShield });
    if (!active) return 0;

    if (this.storm.phase === 'active') this._playedDuringStorm = true;
    this.totalDoseMsv += this.doseRate * h;
    return radiationDamage(this.doseRate, h);
  }

  // Comeca a fila de tempestades a partir de `hours`. Chamar de novo nao refaz a fila.
  startStorms(hours) {
    if (this.stormsStarted) return;
    this.stormsStarted = true;
    this.schedule = buildStormSchedule(this.cmes, hours);
    this.storm = stormStateAt(this.schedule, hours);
    this._phaseKey = this._keyFor(this.storm);
  }

  _runFactory(h) {
    if (!this.factoryOn || this.iceStock <= 0 || this.propellant >= 100) return;
    const hoursLeftInStock = this.iceStock * MAV_CONFIG.ISRU_HOURS_PER_ICE_BLOCK;
    const wanted = Math.min(h, hoursLeftInStock);
    const need = ENERGY_CONFIG.ISRU_DRAIN_PER_HOUR * wanted;
    const got = this.battery.drain(need);
    const workedHours = need > 0 ? wanted * (got / need) : 0;
    const iceUsed = workedHours / MAV_CONFIG.ISRU_HOURS_PER_ICE_BLOCK;
    this.iceStock = Math.max(0, this.iceStock - iceUsed);
    this.propellant = Math.min(100, this.propellant + iceUsed * PROPELLANT_PER_ICE);
    if (this.propellant >= 100 - 1e-6) {
      this.propellant = 100;
      this.iceStock = 0;
      this._emit('propellant-full');
    }
  }

  _keyFor(state) {
    return `${state.storm?.index ?? 'none'}:${state.phase}`;
  }

  _updateStormPhase() {
    const previous = this.storm;
    this.storm = stormStateAt(this.schedule, this.lastHours);
    const key = this._keyFor(this.storm);
    if (key === this._phaseKey) return;
    this._phaseKey = key;

    // A tempestade anterior acabou (passou de 'active' para outra fase)
    if (previous.phase === 'active' && !(this.storm.phase === 'active' && this.storm.storm === previous.storm)) {
      // So conta se o jogador estava jogando (nao pausado) e nao morreu durante ela
      if (this._diedDuringStorm) {
        this._emit('storm-failed', previous.storm);
      } else if (!this._playedDuringStorm) {
        this._emit('storm-missed', previous.storm);
      } else {
        this.stormsSurvived++;
        this._emit('storm-survived', previous.storm);
      }
      this._diedDuringStorm = false;
      this._playedDuringStorm = false;
    }

    if (this.storm.phase === 'warning') this._emit('storm-warning', this.storm.storm);
    if (this.storm.phase === 'active') {
      this._emit('storm-start', this.storm.storm);
    }
  }

  _emit(type, storm = null) {
    this.events.push({ type, storm });
  }

  drainEvents() {
    const events = this.events;
    this.events = [];
    return events;
  }

  // O2 que a bateria consegue pagar agora
  oxygenRefillBudget() {
    return this.battery.charge / (ENERGY_CONFIG.OXYGEN_COST_PER_POINT * this.oxygenCostMultiplier);
  }

  chargeOxygen(points) {
    if (points <= 0) return;
    this.battery.drain(points * ENERGY_CONFIG.OXYGEN_COST_PER_POINT * this.oxygenCostMultiplier);
    this.oxygenProducedPoints += points;
  }

  // Morrer durante a tempestade nao conta como ter sobrevivido a ela
  markDeath() {
    if (this.storm.phase === 'active') this._diedDuringStorm = true;
  }

  toggleShield() {
    if (!this.shieldOn && this.battery.charge <= 0) return false;
    this.shieldOn = !this.shieldOn;
    return true;
  }

  toggleFactory() {
    this.factoryOn = !this.factoryOn;
    return this.factoryOn;
  }

  // Quantos blocos de gelo ainda cabem no tanque (contando os que esperam na fabrica)
  iceNeeded() {
    const missing = (100 - this.propellant) / PROPELLANT_PER_ICE - this.iceStock;
    return Math.max(0, Math.ceil(missing - 1e-6));
  }

  deliverIce(count) {
    const accepted = Math.max(0, Math.min(count, this.iceNeeded()));
    this.iceStock += accepted;
    this.iceDelivered += accepted;
    return accepted;
  }

  sendData() {
    if (this.dataSent) return 'already-sent';
    if (!this.battery.spend(ENERGY_CONFIG.DATA_UPLOAD_COST)) return 'no-energy';
    this.dataSent = true;
    return 'sent';
  }

  ignite() {
    if (!this.progress.ready) return false;
    this.launched = true;
    return true;
  }
}
