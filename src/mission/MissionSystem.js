import {
  DOSE_CONFIG,
  ENERGY_CONFIG,
  MAV_CONFIG,
  MISSION_CONFIG,
  STORM_CONFIG,
  RADIATION_CONFIG,
} from '../config/constants.js';
import { Battery, solarChargePerHour } from './energy.js';
import { doseRateMsvPerHour, missionDoseMsvPerHour, radiationDamage } from './radiation.js';
import { DOSE_LIMIT_MSV, createDoseLedger, doseBreakdown, doseSourceFor } from './doseBudget.js';
import { OxygenPlant } from './oxygenPlant.js';
import { buildStormSchedule, rescheduleStorms, stormStateAt } from './solarStorms.js';
import { DustWeather } from './dustWeather.js';

const PROPELLANT_PER_ICE = 100 / MAV_CONFIG.ICE_BLOCKS_FOR_FULL_TANK;

// Converte pontos de O2 do jogo em kg (mora em oxygenPlant.js, junto da conta da agua)
export { oxygenPointsToKg } from './oxygenPlant.js';

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
  // `seps`: SEPs reais do fetch ao vivo do DONKI (issue #100); vazio no dado embutido.
  constructor({ cmes, seps = [], startHours, stormsStarted = true, rng = Math.random }) {
    this.battery = new Battery();
    this.cmes = cmes;
    this.seps = seps;
    this.stormsStarted = stormsStarted;
    this.schedule = stormsStarted ? buildStormSchedule(cmes, startHours, undefined, seps) : [];
    this.lastHours = startHours;

    this.shieldOn = false;
    // Jogador dentro da bolha do escudo (shieldZone). O escudo só reduz a dose de quem está nela.
    this.insideShield = true;
    // Abrigo de tempestade (issue #56): litros guardados na parede de agua e jogador dentro dele
    this.shelterWaterL = 0;
    this.insideShelter = false;
    this.factoryOn = true;
    this.iceStock = 0; // blocos de gelo esperando na fabrica
    this.propellant = 0; // %
    this.dataSent = false;
    this.launched = false;

    this.stormsSurvived = 0;
    // Dose acumulada (issue #104): comeca com a viagem ate Marte e nunca desce.
    // `totalDoseMsv` = soma de `dose`; `missionDoseRate` = mSv por hora de jogo que entram na barra.
    this.dose = createDoseLedger();
    this.totalDoseMsv = this.dose.transit;
    // Dose na escala real (sem viagem nem GAME_FACTOR): e o que o boletim do cadete (#90) compara
    this.realDoseMsv = 0;
    this.missionDoseRate = 0;
    this.suitUpgraded = false;
    this._doseWarned = false;
    this._doseLimitPassed = false;
    this.doseRate = doseRateMsvPerHour();
    this.chargeRate = 0;
    this.solarEnergyCollected = 0; // % de bateria somados
    this.oxygenProducedPoints = 0;
    this.iceDelivered = 0;
    // Horas de jogo com a bateria vazia (maquinas em espera, so o RTG mantem o ar). Boletim #90.
    this.standbyHours = 0;
    // Tempestades: horas jogadas nelas e, dessas, horas protegido (dose abaixo do dano). Boletim #90.
    this.stormHours = 0;
    this.protectedStormHours = 0;

    // Tempestade de poeira e poeira nos paineis (issue #103). Comeca junto com as tempestades
    // solares: a historia solta o clima no ato 2, longe do tutorial.
    this.dustWeather = new DustWeather({ rng, startHours, started: stormsStarted });

    this.storm = stormStateAt(this.schedule, startHours);
    this._phaseKey = this._keyFor(this.storm);
    this._diedDuringStorm = false;
    this._playedDuringStorm = false;
    this.events = [];
    // Filtros de ar gastos encarecem o O2 do habitat (gerador de O2 da tripulacao, issue #47)
    this.oxygenCostMultiplier = 1;
    // Gerador de O2: eletrolise (agua) ou MOXIE (ar de Marte), issue #102
    this.oxygenPlant = new OxygenPlant();
  }

  // A fila de tempestades comecou, mas os dados nao tem nenhuma CME com destino a Marte
  get noStormData() {
    return this.stormsStarted && this.schedule.length === 0;
  }

  // Tempestades que contam para o foguete e para a janela de lancamento. Sem nenhuma CME para
  // Marte nos dados nao ha o que sobreviver: a exigencia cai, em vez de travar a partida.
  get stormCredit() {
    return this.noStormData ? MAV_CONFIG.STORMS_TO_SURVIVE : this.stormsSurvived;
  }

  get progress() {
    return mavProgress({ propellant: this.propellant, stormsSurvived: this.stormCredit, dataSent: this.dataSent });
  }

  // Avanca a missao ate `hours`. `active` = jogo rodando (sem pausa e jogador vivo):
  // so entao a radiacao atinge o jogador. Devolve o dano de radiacao a aplicar na vida.
  // `insideShield` = jogador dentro da bolha do escudo; fora dela o escudo ligado nao protege.
  // `suitUpgraded` = traje melhorado na estacao: reduz a dose somada la fora.
  update(hours, { insideHabitat = false, insideShield = true, insideShelter = false, active = true, suitUpgraded = false } = {}) {
    this.insideShield = insideShield;
    this.insideShelter = insideShelter;
    this.suitUpgraded = suitUpgraded;
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
    const previousTime = ((((this.lastHours - h) % 24) + 24) % 24);
    const timeOfDay = ((this.lastHours % 24) + 24) % 24;

    this.dustWeather.step(h, this.lastHours);
    this.chargeRate = solarChargePerHour(timeOfDay, this.dustWeather.solarFactor);
    this.solarEnergyCollected += this.battery.add(this.chargeRate * h);
    // O RTG gera de dia e de noite, so para o suporte de vida (issue #85)
    this.battery.addLifeSupportPower(
      ENERGY_CONFIG.RTG_LIFE_SUPPORT_PER_HOUR * h,
      ENERGY_CONFIG.RTG_LIFE_SUPPORT_PER_HOUR * ENERGY_CONFIG.RTG_BUFFER_HOURS,
    );
    const sunset = ENERGY_CONFIG.SUNSET_WARNING_HOUR;
    if (previousTime < sunset && timeOfDay >= sunset) {
      this.events.push({ type: 'sunset-soon', storm: null, hoursUntil: null, batteryPct: this.battery.percent });
    }

    if (this.shieldOn) {
      const need = ENERGY_CONFIG.SHIELD_DRAIN_PER_HOUR * h;
      if (this.battery.drain(need) + 1e-9 < need) {
        this.shieldOn = false;
        this._emit('shield-off-no-energy');
      }
    }

    this._runFactory(h);
    this._updateStormPhase();

    const stormActive = this.storm.phase === 'active';
    const stormDoseUGyPerHour = stormActive ? this.storm.storm.doseUGyPerHour : 0;
    const shieldOn = this.shieldOn && this.insideShield;
    const shelterWaterL = this.insideShelter ? this.shelterWaterL : 0;
    this.doseRate = doseRateMsvPerHour({ stormDoseUGyPerHour, insideHabitat, shieldOn, shelterWaterL });
    this.missionDoseRate = missionDoseMsvPerHour({
      stormDoseUGyPerHour, insideHabitat, shieldOn, shelterWaterL, suitUpgraded: this.suitUpgraded,
    });
    if (!active) return 0;

    if (this.standby) this.standbyHours += h;
    if (stormActive) {
      this._playedDuringStorm = true;
      this.stormHours += h;
      if (this.doseRate < RADIATION_CONFIG.HARM_THRESHOLD_MSV_PER_HOUR) this.protectedStormHours += h;
    }
    this.realDoseMsv += this.doseRate * h;
    this.addDose(this.missionDoseRate * h, doseSourceFor({ stormActive, insideHabitat }));
    return radiationDamage(this.doseRate, h);
  }

  // Soma dose na fonte `source` ('eva', 'storm', 'habitat'). Nunca desce.
  addDose(msv, source = 'eva') {
    if (!(msv > 0)) return;
    this.dose[source] += msv;
    this.totalDoseMsv += msv;
    if (!this._doseWarned && this.totalDoseMsv >= DOSE_LIMIT_MSV * DOSE_CONFIG.WARN_FRACTION) {
      this._doseWarned = true;
      if (this.totalDoseMsv < DOSE_LIMIT_MSV) this._emit('dose-warning');
    }
    if (!this._doseLimitPassed && this.totalDoseMsv >= DOSE_LIMIT_MSV) {
      this._doseLimitPassed = true;
      this._emit('dose-limit');
    }
  }

  // Acima do limite de carreira a medica de voo proibe novas saidas do comandante
  get grounded() {
    return this.totalDoseMsv >= DOSE_LIMIT_MSV;
  }

  // { transit, eva, storm, habitat, total, limit, fraction, grounded } para telas e boletim (#90)
  get doseBreakdown() {
    return doseBreakdown(this.dose);
  }

  // Painel de admin: volta a dose para so a viagem
  resetDose() {
    this.dose = createDoseLedger();
    this.totalDoseMsv = this.dose.transit;
    this._doseWarned = false;
    this._doseLimitPassed = false;
  }

  // Comeca a fila de tempestades a partir de `hours`. Chamar de novo nao refaz a fila.
  startStorms(hours) {
    if (this.stormsStarted) return;
    this.stormsStarted = true;
    this.dustWeather.start(hours);
    this.schedule = buildStormSchedule(this.cmes, hours, undefined, this.seps);
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

    if (this.storm.phase === 'warning') this._emit('storm-warning', this.storm.storm, this.storm.hoursUntil);
    if (this.storm.phase === 'active') {
      this._emit('storm-start', this.storm.storm);
    }
  }

  // Controle de demo: adianta a proxima tempestade para daqui a `leadHours` horas de jogo.
  // Usa a mesma CME real da fila; so o relogio muda. Devolve false se ja ha tempestade ativa.
  triggerStormSoon(leadHours = STORM_CONFIG.DEMO_LEAD_HOURS) {
    if (this.storm.phase === 'active') return false;
    const now = this.lastHours;
    this.startStorms(now); // a historia so solta as tempestades no ato 2; o controle de demo nao espera
    const next = this.schedule.find((storm) => storm.end > now);
    if (!next) return false;
    const arrival = now + leadHours;
    if (next.arrival <= arrival) return true; // ja chega antes disso
    next.warningStart = Math.min(next.warningStart, now);
    next.arrival = arrival;
    next.end = arrival + STORM_CONFIG.DURATION_HOURS;
    return true;
  }

  // `hoursUntil` = horas de jogo ate a tempestade chegar (so no aviso)
  _emit(type, storm = null, hoursUntil = null) {
    this.events.push({ type, storm, hoursUntil });
  }

  drainEvents() {
    const events = this.events;
    this.events = [];
    return events;
  }

  // Bateria vazia: fabrica, luzes e estacoes param; o RTG ainda paga o ar (issue #85)
  get standby() {
    return this.battery.percent < ENERGY_CONFIG.STANDBY_BELOW;
  }

  // % de bateria por ponto de O2 no modo atual do gerador (MOXIE custa mais que a eletrolise)
  oxygenEnergyPerPoint() {
    return ENERGY_CONFIG.OXYGEN_COST_PER_POINT * this.oxygenCostMultiplier * this.oxygenPlant.energyFactor;
  }

  // O2 que a bateria (e, na eletrolise, o tanque `tank.water`) consegue pagar agora
  oxygenRefillBudget(tank = null) {
    return this.oxygenPlant.refillBudget(this.battery.lifeSupportAvailable / this.oxygenEnergyPerPoint(), tank);
  }

  chargeOxygen(points, tank = null) {
    if (points <= 0) return;
    // O RTG paga o ar antes da bateria (#85); no modo eletrolise o tanque paga a agua (#102)
    this.battery.drainLifeSupport(points * this.oxygenEnergyPerPoint());
    this.oxygenPlant.useWaterForPoints(points, tank);
    this.oxygenProducedPoints += points;
  }

  // Painel de admin: forca o aviso, a tempestade ou o fim dela agora
  forceStorm(target) {
    this.schedule = rescheduleStorms(this.schedule, this.lastHours, target);
    this._updateStormPhase();
    return this.storm.phase;
  }

  // Morrer durante a tempestade nao conta como ter sobrevivido a ela
  markDeath() {
    if (this.storm.phase === 'active') this._diedDuringStorm = true;
  }

  // Move agua do tanque da base (`tank.baseWater`) para a parede do abrigo. Agua na parede
  // protege da radiacao, mas nao serve para beber nem para a estufa.
  fillShelterWall(tank) {
    const room = RADIATION_CONFIG.SHELTER_WALL_MAX_L - this.shelterWaterL;
    if (room <= 0) return 'The water wall is already full.';
    const liters = Math.min(RADIATION_CONFIG.SHELTER_FILL_STEP_L, room, tank.baseWater);
    if (liters < 1) return 'The base water tank is empty. Bring ice with the rover first.';
    tank.baseWater -= liters;
    this.shelterWaterL += liters;
    return `Moved ${Math.round(liters)} L into the wall. Less water to drink, more protection.`;
  }

  drainShelterWall(tank) {
    if (this.shelterWaterL <= 0) return 'The water wall is already empty.';
    const room = tank.maxBaseWater - tank.baseWater;
    const liters = Math.min(RADIATION_CONFIG.SHELTER_FILL_STEP_L, this.shelterWaterL, room);
    if (liters < 1) return 'The base water tank is full.';
    tank.baseWater += liters;
    this.shelterWaterL -= liters;
    return `Moved ${Math.round(liters)} L back to the tank. More water to drink, less protection.`;
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
