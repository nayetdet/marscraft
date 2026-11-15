// @ts-nocheck
import { MISSION_CONFIG, SLEEP_CONFIG, STORM_SKIP_CONFIG } from '../config/constants.ts';
import { isInsideShieldZone } from '../mission/shieldZone.ts';
import { stormSkipHours, stormSkipNeedsCost, stormSkipStatus, stormSkipSummary } from '../mission/stormSkip.ts';
import { requestRawPointerLock } from '../player/mouseLook.ts';
import {
  ASTRONAUT_SLEEP_FACT,
  SLEEP_BLOCK_TEXT,
  SLEEP_MODES,
  advanceSleep,
  awakeHoursAfterSleep,
  createSleepSession,
  isTired,
  plannedSleepHours,
  sleepBlocker,
  sleepNeedsCost,
  wakeReason,
  wakeSummary,
} from '../player/sleep.ts';
import { SleepHud } from '../ui/SleepHud.ts';
import { EAST_WING, HABITAT_LAYOUT, isInsideShelter } from '../world/habitatLayout.ts';

const BUNK_Y = HABITAT_LAYOUT.FLOOR_Y + 1.7; // colchao de baixo do beliche
// Texto da tela escura durante a espera rapida da tempestade (issue #228)
const STORM_WAIT_LABEL = 'Waiting out the storm behind the water wall...';

// Pontos de [F] dos tres beliches do dormitorio (GameEngine._getInteraction)
export const BUNK_INTERACTIONS = EAST_WING.BUNKS.map(({ x, z }) => Object.freeze({
  type: 'bunk', x, y: BUNK_Y, z, minDot: 0.75, label: 'Press F: Sleep',
}));

// Dormir no beliche (issue #109): substitui a tecla T. Liga as regras puras de src/player/sleep.js
// ao relogio do ceu, a missao, ao modulo norte e as estacoes da base. Enquanto o jogador dorme,
// tudo que anda pelo relogio do jogo continua andando, em passos pequenos, e um perigo critico
// (aviso de tempestade, vazamento ou alarme) acorda o jogador naquele passo.
export class SleepController {
  constructor(engine) {
    this.engine = engine;
    this.session = null;
    this._batteryBefore = 0;
    this._awakeAtBedtime = 0;
    this._sleptBefore = false;
    this._wasTired = false;
    // Hora (do relogio total do ceu) em que o jogador "acordou" pela ultima vez
    this.awakeSinceHours = engine._skyHours();
    this.hud = new SleepHud({
      onChoose: (mode) => this.start(mode),
      onCancel: () => this.closeChooser(),
    });
    this._world = { step: (h) => this._step(h) };
  }

  get isPanelOpen() {
    return this.hud.isOpen;
  }

  get isSleeping() {
    return this.session !== null;
  }

  get awakeHours() {
    return Math.max(0, this.engine._skyHours() - this.awakeSinceHours);
  }

  get isTired() {
    return !this.isSleeping && isTired(this.awakeHours);
  }

  _alarm() {
    const { stations, utility, mission } = this.engine;
    // With an empty battery the heater cannot prevent the habitat from getting cold. That
    // condition should not keep the crew awake when sleeping is the only way to reach sunrise.
    if (utility.cold && mission.battery.charge > 0) return 'The base is freezing: turn the heater on before you sleep.';
    if (stations.co2 >= SLEEP_CONFIG.CO2_ALARM) return 'The CO2 alarm is on: replace the air filter before you sleep.';
    if (stations.contaminated) return 'There is dust in the habitat: clean it before you sleep.';
    return null;
  }

  _blocker() {
    const { survival, mission, player } = this.engine;
    return sleepBlocker({
      insideBase: survival.isPlayerInsideShip(player.pos),
      baseBreached: this.engine.world.brokenBaseBlocks.size > 0,
      baseOxygen: survival.baseOxygen,
      stormPhase: mission.storm.phase,
      alarm: Boolean(this._alarm()),
      food: survival.food,
      water: survival.water,
    });
  }

  // [F] no beliche
  openChooser() {
    const engine = this.engine;
    const blocked = this._blocker();
    if (blocked) {
      engine.hud.showToast(blocked === 'alarm' ? this._alarm() : SLEEP_BLOCK_TEXT[blocked], 5000);
      return;
    }
    const timeOfDay = engine.sky.timeOfDay;
    const option = (mode) => {
      const hours = plannedSleepHours(mode, timeOfDay);
      return { hours, ...sleepNeedsCost(hours) };
    };
    if (engine.input.isTouchMode) engine.input.keys = {};
    this.hud.openChooser({ sunrise: option(SLEEP_MODES.SUNRISE), nap: option(SLEEP_MODES.NAP) });
    if (document.pointerLockElement) document.exitPointerLock();
  }

  closeChooser() {
    if (!this.hud.isOpen) return;
    this.hud.closeChooser();
    this._relock();
  }

  _relock() {
    const { input, renderer } = this.engine;
    if (!input.isTouchMode) requestRawPointerLock(renderer.domElement);
  }

  start(mode) {
    const engine = this.engine;
    this.hud.closeChooser();
    this._relock();
    const hours = plannedSleepHours(mode, engine.sky.timeOfDay);
    if (hours <= 0 || this._blocker()) return;
    this.session = createSleepSession(hours);
    this._batteryBefore = engine.mission.battery.percent;
    this._awakeAtBedtime = this.awakeHours;
    engine.input.keys = {};
    engine.player.vel.set(0, 0, 0);
    engine.player.isMoving = false;
    this.hud.showSleeping(this._clockText(), 0);
  }

  // Espera rapida da tempestade solar no abrigo (issue #228): pode usar agora? (stormSkip.ts)
  stormSkipStatus() {
    const { survival, mission, player } = this.engine;
    return stormSkipStatus({
      phase: mission.storm.phase,
      wallL: mission.shelterWaterL,
      insideShelter: survival.insidePressurizedShip && isInsideShelter(player.pos.x, player.pos.z),
    });
  }

  // Botao WAIT OUT THE STORM do painel do abrigo. Usa o mesmo motor do sono: o relogio corre ate
  // o fim da tempestade e a base anda junto, passo a passo (dose atras da parede, bateria,
  // tripulacao, plantas, fome e sede). Devolve true se a espera comecou.
  startStormSkip() {
    const engine = this.engine;
    if (this.session || engine.survival.isDead || !this.stormSkipStatus().allowed) return false;
    const hours = stormSkipHours(engine.mission.storm.storm.end, engine._skyHours());
    if (hours <= 0) return false;
    this.session = createSleepSession(hours);
    this.session.kind = 'storm';
    // Um alarme que ja estava ligado nao interrompe a espera: a crianca escolheu esperar com ele.
    // So um alarme novo (ou a bateria, um vazamento, a fome ou a sede) para o relogio.
    this.session.alarmAtStart = Boolean(this._alarm());
    this._batteryBefore = engine.mission.battery.percent;
    engine.input.keys = {};
    engine.player.vel.set(0, 0, 0);
    engine.player.isMoving = false;
    this.hud.showSleeping(this._clockText(), 0, STORM_WAIT_LABEL);
    return true;
  }

  // Um passo de sono: a base anda `h` horas de jogo. Devolve o motivo para acordar ou null.
  _step(h) {
    const { sky, mission, survival, stations, utility, expedition, player, world } = this.engine;
    const seconds = h / MISSION_CONFIG.GAME_HOURS_PER_SECOND;
    sky.advanceTime(h);
    const eventsBefore = mission.events.length;
    const damage = mission.update(this.engine._skyHours(), {
      insideHabitat: true,
      insideShield: isInsideShieldZone(player.pos),
      insideShelter: isInsideShelter(player.pos.x, player.pos.z),
      active: true,
    });
    survival.takeDamage(damage, 'RADIATION_OVERDOSE', 'solar-radiation');
    // Modulo norte (aquecedor, filtro), radio e estacoes da base andam como acordado
    this.engine._updateUtility();
    const greenhouseLit = utility.greenhouseLightsOn && !utility.cold && !utility.greenhousePaused;
    expedition.greenhousePowered = greenhouseLit && expedition.spend(utility.greenhouseLightsCost(seconds));
    stations.update(seconds, true, survival, false);
    // Na espera da tempestade a crianca esta acordada: fome e sede no ritmo normal, nao no do sono
    const stormSkip = this.session?.kind === 'storm';
    const cost = stormSkip ? stormSkipNeedsCost(h) : sleepNeedsCost(h);
    survival.spendNeeds(cost.food, cost.water);
    if (survival.isDead) return 'dead';

    const events = [];
    // A tempestade chegar e o que a espera quer ver: so o sono acorda com ela
    if (!stormSkip) for (let i = eventsBefore; i < mission.events.length; i++) events.push(mission.events[i].type);
    return wakeReason({
      events,
      baseBreached: world.brokenBaseBlocks.size > 0,
      crewAlert: Boolean(this._alarm()) && !this.session?.alarmAtStart,
      food: survival.food,
      water: survival.water,
    });
  }

  // Chamado a cada quadro enquanto dorme. O sono espera com o jogo pausado (Esc ou retrato).
  update(dt) {
    const session = this.session;
    if (!session) return;
    const { input } = this.engine;
    const stormSkip = session.kind === 'storm';
    if (input.isLocked && !input.isPortraitRequired) {
      if (stormSkip) advanceSleep(session, STORM_SKIP_CONFIG.CLOCK_HOURS_PER_SECOND * dt, this._world, STORM_SKIP_CONFIG.STEP_HOURS);
      else advanceSleep(session, SLEEP_CONFIG.CLOCK_HOURS_PER_SECOND * dt, this._world);
    }
    this.hud.showSleeping(this._clockText(), session.sleptHours, stormSkip ? STORM_WAIT_LABEL : undefined);
    if (!session.done) return;
    if (stormSkip) this._endStormSkip();
    else this._wake();
  }

  // Fim da espera da tempestade: a crianca nao dormiu, entao o cansaco nao muda
  _endStormSkip() {
    const engine = this.engine;
    const session = this.session;
    this.session = null;
    this.hud.hideSleeping();
    if (engine.survival.isDead) return;
    this.hud.showWakeCard(stormSkipSummary({
      waitedHours: session.sleptHours,
      batteryBefore: this._batteryBefore,
      batteryAfter: engine.mission.battery.percent,
      stop: session.wakeReason,
    }));
  }

  _wake() {
    const engine = this.engine;
    const session = this.session;
    this.session = null;
    this.hud.hideSleeping();
    const left = awakeHoursAfterSleep(this._awakeAtBedtime, session.sleptHours);
    this.awakeSinceHours = engine._skyHours() - left;
    if (engine.survival.isDead) return;
    const line = wakeSummary({
      sleptHours: session.sleptHours,
      batteryBefore: this._batteryBefore,
      batteryAfter: engine.mission.battery.percent,
      reason: session.wakeReason,
    });
    this.hud.showWakeCard(line, this._sleptBefore ? '' : ASTRONAUT_SLEEP_FACT);
    this._sleptBefore = true;
    // Estudo real de sono do OSDR no diario (issue #106): revela um por noite dormida
    engine.missionLogFeed?._reveal('sleep', engine._skyHours());
  }

  _clockText() {
    const { sky } = this.engine;
    const total = Math.floor(sky.timeOfDay * 60);
    const hh = String(Math.floor(total / 60)).padStart(2, '0');
    const mm = String(total % 60).padStart(2, '0');
    return `Sol ${sky.solCount} - ${hh}:${mm}`;
  }

  // Texto do #station-warning quando o cansaco deixa o trabalho mais lento (chamado a cada
  // quadro de jogo). Na hora em que o jogador fica cansado, tambem avisa com um toast.
  updateWarning() {
    const tired = this.isTired;
    if (tired && !this._wasTired) {
      this.engine.hud.showToast('You have been awake for more than 1 sol (a Mars day). Tired people work slower: sleep in a bunk in the Crew Quarters!', 7000);
    }
    this._wasTired = tired;
    return tired ? 'Tired: more than 1 sol awake, work is slower. Sleep in a bunk in the Crew Quarters!' : '';
  }
}
