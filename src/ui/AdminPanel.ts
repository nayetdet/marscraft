// @ts-nocheck
import { HABITAT_LAYOUT } from '../world/habitatLayout.ts';
import { MAV_CONFIG, RADIATION_CONFIG, WATER_SYSTEM_CONFIG } from '../config/constants.ts';
import { requestRawPointerLock } from '../player/mouseLook.ts';
import { BLOCK_IDS } from '../config/blockTypes.ts';

// Painel de admin para testar a base sem esperar o jogo: forcar tempestade, mexer na bateria,
// na agua, no tempo e teleportar para as salas. Abre com F8 no `npm run dev` ou com `?admin`
// na URL (que tambem mostra o botao ADMIN para touch). Nao aparece para quem so joga.
const EYE_INSIDE = HABITAT_LAYOUT.FLOOR_Y + 1 + 1.75; // olhos em pe no piso do habitat
const EYE_OUTSIDE = 10.75; // SPAWN_POS.y, na rampa
const DROP = 16; // alto o bastante para cair no terreno sem prender em bloco

const TELEPORTS = [
  ['Storm shelter', 4.3, EYE_INSIDE, 4.8, -Math.PI / 2],
  ['Comms terminal', 9, EYE_INSIDE, -8.6, 0],
  ['Habitat center', 0.5, EYE_INSIDE, 1, 0],
  ['Power & heat room', -12, EYE_INSIDE, -21.5, Math.PI / 2],
  ['Kitchen', 8, EYE_INSIDE, -21.5, -Math.PI / 2],
  ['Airlock', 0.5, EYE_INSIDE, 7.5, Math.PI],
  ['Greenhouse', -21.6, EYE_INSIDE, 0.9, 2.66],
  ['Crew quarters', 19.5, EYE_INSIDE, -7, -Math.PI / 2],
  ['Gym', -8, EYE_INSIDE, 10, Math.PI],
  ['Outside ramp', 0, EYE_OUTSIDE, 11.5, 0],
  ['MAV pad', MAV_CONFIG.PAD_POSITION.x - 6, DROP, MAV_CONFIG.PAD_POSITION.z, -Math.PI / 2],
  ['Ice crater', WATER_SYSTEM_CONFIG.ICE_CRATER_CENTER.x, DROP, WATER_SYSTEM_CONFIG.ICE_CRATER_CENTER.z + 6, 0],
];

function isEnabled() {
  return process.env.NODE_ENV === 'development' || new URLSearchParams(window.location.search).has('admin');
}

export class AdminPanel {
  constructor(engine) {
    this.engine = engine;
    this.isOpen = false;
    this.enabled = isEnabled();
    if (!this.enabled) return;

    this.el = document.createElement('div');
    this.el.id = 'admin-panel';
    this.el.className = 'admin-panel hidden';
    this.el.innerHTML = this._markup();
    document.body.appendChild(this.el);
    this.status = this.el.querySelector('#admin-status');
    this.feedback = this.el.querySelector('#admin-feedback');

    this.el.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-admin]');
      if (!button) return;
      if (button.dataset.admin === 'close') { this.close(); return; }
      this.feedback.textContent = this._run(button.dataset.admin) ?? '';
      this._renderStatus();
    });

    if (new URLSearchParams(window.location.search).has('admin')) {
      this.toggleButton = document.createElement('button');
      this.toggleButton.type = 'button';
      this.toggleButton.className = 'admin-toggle';
      this.toggleButton.textContent = 'ADMIN';
      this.toggleButton.addEventListener('click', () => this.toggle());
      document.body.appendChild(this.toggleButton);
    }

    window.addEventListener('keydown', (e) => {
      if (e.code === 'F8') {
        e.preventDefault();
        this.toggle();
      } else if (e.code === 'Escape' && this.isOpen) {
        this.close();
      } else if (e.code === 'KeyT' && !e.repeat && !this.isOpen && this._isPlaying()) {
        // Atalho de teste: o jogo normal passa o tempo dormindo no beliche (issue #109)
        this.engine.sky.advanceTime(1.5);
        this.engine.hud.showToast('Admin: time advanced (+1h 30m on Mars)');
      }
    });
  }

  _isPlaying() {
    const { input, survival, sleep, cutscenes } = this.engine;
    return Boolean(input?.isLocked) && !survival.isDead && !sleep?.isSleeping && !sleep?.isPanelOpen && !cutscenes?.isActive;
  }

  toggle() {
    if (this.isOpen) this.close();
    else this.open();
  }

  open() {
    if (!this.enabled || this.isOpen) return;
    this.isOpen = true;
    this.el.classList.remove('hidden');
    if (this.engine.input?.isTouchMode) this.engine.input.keys = {};
    if (document.pointerLockElement) document.exitPointerLock();
    this._renderStatus();
    this._timer = setInterval(() => this._renderStatus(), 250);
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.el.classList.add('hidden');
    clearInterval(this._timer);
    if (!this.engine.input?.isTouchMode) requestRawPointerLock(this.engine.renderer.domElement);
  }

  _markup() {
    const group = (title, buttons) => `
      <section class="admin-group"><h3>${title}</h3><div class="admin-buttons">${buttons
        .map(([id, label]) => `<button type="button" class="mc-btn admin-btn" data-admin="${id}">${label}</button>`)
        .join('')}</div></section>`;
    return `
      <header class="admin-head"><strong>ADMIN / TEST PANEL</strong><button type="button" class="mc-btn admin-btn" data-admin="close">Close [F8]</button></header>
      <pre id="admin-status" class="admin-status"></pre>
      <p id="admin-feedback" class="admin-feedback" role="status"></p>
      ${group('Solar storm', [['storm:warning', 'Warning now'], ['storm:active', 'Storm now'], ['storm:end', 'End storm']])}
      ${group('Dust storm (weather)', [['dust:warning', 'Warning now'], ['dust:storm', 'Dust storm now'], ['dust:end', 'End dust storm'], ['dust:dirty', 'Panels 90% dusty'], ['dust:clean', 'Panels clean']])}
      ${group('Radio to Earth', [['radio:on', 'Solar conjunction now'], ['radio:off', 'End conjunction']])}
      ${group('Power', [['power:100', 'Battery 100%'], ['power:15', 'Battery 15%'], ['power:0', 'Battery 0%']])}
      ${group('Water', [['water:add', 'Base tank +20 L'], ['water:empty', 'Base tank 0 L'], ['wall:full', 'Shelter wall full'], ['wall:empty', 'Shelter wall empty']])}
      ${group('Astronaut', [['me:refill', 'Refill astronaut'], ['me:dose', 'Reset radiation dose'], ['me:doseLimit', 'Dose over the limit'], ['me:hurt', 'Health to 25%']])}
      ${group('Base', [['base:dirtySuit', 'Dusty suit'], ['base:contaminate', 'Dust in habitat'], ['base:clean', 'Clean suit + habitat'], ['base:filter', 'CO2 filter 0%']])}
      ${group('North module', [['north:pantry', 'Pantry +10 rations'], ['north:wear', 'Crew stations 30%'], ['north:regolith', '+6 regolith'], ['north:carrot', '+3 carrots']])}
      ${group('Mars events (issue #107)', [['event:meteor', 'Meteor'], ['event:marsquake', 'Marsquake'], ['event:eclipse', 'Phobos eclipse'], ['event:dustDevil', 'Dust devil'], ['event:frost', 'Frost'], ['event:aurora', 'Aurora']])}
      ${group('Time', [['time:1', '+1 hour [T: +1.5 h]'], ['time:day', 'Skip to 08:00'], ['time:night', 'Skip to 21:00'], ['time:tired', 'Awake 25 h (tired)']])}
      ${group('Teleport', TELEPORTS.map(([name], i) => [`tp:${i}`, name]))}
    `;
  }

  _run(action) {
    const { mission, survival, stations, sky, player } = this.engine;
    const [kind, arg] = action.split(':');
    switch (kind) {
      case 'storm':
        return `Storm phase is now: ${mission.forceStorm(arg).toUpperCase()}`;
      case 'dust': {
        const dust = mission.dustWeather;
        if (arg === 'dirty') { dust.panelDust = 0.9; return 'Solar panels 90% dusty.'; }
        if (arg === 'clean') { dust.panelDust = 0; return 'Solar panels clean.'; }
        return `Dust weather is now: ${dust.force(arg).toUpperCase()}`;
      }
      case 'radio':
        this.engine.comms.forceConjunction(arg === 'on');
        return arg === 'on' ? 'Radio silent (simulated solar conjunction).' : 'Radio contact is back.';
      case 'power':
        mission.battery.charge = mission.battery.capacity * Number(arg) / 100;
        return `Battery set to ${arg}%.`;
      case 'water':
        survival.baseWater = arg === 'add' ? Math.min(survival.maxBaseWater, survival.baseWater + 20) : 0;
        return `Base tank: ${Math.round(survival.baseWater)} L.`;
      case 'wall':
        mission.shelterWaterL = arg === 'full' ? RADIATION_CONFIG.SHELTER_WALL_MAX_L : 0;
        return `Shelter wall: ${mission.shelterWaterL} L (free, tank not touched).`;
      case 'me':
        if (arg === 'refill') {
          survival.isDead = false;
          survival.health = survival.oxygen = survival.water = survival.food = survival.maxStat;
          survival.suitOxygen = 100;
          survival.suitScrubber = 100;
          survival.suitDust = 0;
          survival.suitIntegrity = 100;
          survival.suitThermal = 100;
          survival.suitO2Warned30 = false;
          survival.suitWornWarned = false;
          return 'Astronaut refilled.';
        }
        if (arg === 'dose') { mission.resetDose(); return 'Radiation dose reset to the trip dose.'; }
        if (arg === 'doseLimit') {
          mission.addDose(RADIATION_CONFIG.CAREER_LIMIT_MSV + 1 - mission.totalDoseMsv);
          return 'Dose over the limit: the outer airlock door stays shut.';
        }
        survival.health = survival.maxStat * 0.25;
        return 'Health set to 25%.';
      case 'base':
        if (arg === 'dirtySuit') {
          stations.dirtySuit = true;
          survival.suitDust = Math.max(survival.suitDust, 50);
        } else if (arg === 'contaminate') stations.contaminated = true;
        else if (arg === 'filter') stations.filter = 0;
        else {
          stations.dirtySuit = false;
          stations.contaminated = false;
          survival.suitDust = 0;
        }
        return 'Base state changed.';
      case 'north': {
        const { utility, crewStock, crew } = this.engine;
        if (arg === 'pantry') crewStock.food = Math.min(crewStock.maxFood, crewStock.food + 10);
        else if (arg === 'wear') for (const st of crew?.stations ?? []) st.health = 0.3;
        else {
          const id = arg === 'regolith' ? BLOCK_IDS.REGOLITH : BLOCK_IDS.HYDRO_PLANT;
          const count = arg === 'regolith' ? 6 : 3;
          for (let i = 0; i < count; i++) {
            if (arg === 'carrot') survival.addHarvestedCrop();
            else survival.addBlockToInventory(id);
          }
          this.engine.hud.renderHotbar(survival.slots);
        }
        return 'North module state changed.';
      }
      case 'time': {
        if (arg === 'tired') {
          this.engine.sleep.awakeSinceHours = this.engine._skyHours() - 25;
          return 'You have been awake for 25 h: work is slower until you sleep.';
        }
        const target = arg === 'day' ? 8 : arg === 'night' ? 21 : null;
        const delta = target === null ? 1 : ((target - sky.timeOfDay) % 24 + 24) % 24;
        sky.advanceTime(delta);
        return `Time moved forward ${delta.toFixed(1)} h.`;
      }
      case 'event':
        return this.engine.triggerEvent(arg);
      case 'tp': {
        const [name, x, y, z, yaw] = TELEPORTS[Number(arg)];
        player.pos.set(x, y, z);
        player.vel.set(0, 0, 0);
        player.yaw = yaw;
        player.pitch = 0;
        survival.suitEquipped = !survival.isPlayerInsideShip(player.pos);
        return `Teleported to: ${name}. Close the panel to play.`;
      }
      default:
        return '';
    }
  }

  // Semente da partida e agenda dos eventos aleatorios (issue #107)
  _eventsLine() {
    const { events } = this.engine;
    if (!events) return '';
    const hours = this.engine._skyHours();
    const next = events.nextEvent;
    const state = events.active
      ? `ACTIVE ${events.active.type}`
      : !events.started ? 'waiting for act 2' : next ? `next ${next.type} in ${(next.hours - hours).toFixed(1)} h` : 'none left';
    return `Events: seed ${events.seed} (?seed=${events.seed})   ${state}`;
  }

  _renderStatus() {
    const { mission, survival, sky, player } = this.engine;
    const { phase, hoursUntil, hoursLeft, storm } = mission.storm;
    const stormLine = phase === 'active'
      ? `ACTIVE, ${hoursLeft.toFixed(2)} h left (${Math.round(storm.totalDoseUGy)} uGy total outside)`
      : phase === 'warning' ? `WARNING, arrives in ${hoursUntil.toFixed(2)} h` : `calm, next in ${Number.isFinite(hoursUntil) ? hoursUntil.toFixed(1) : '-'} h`;
    const hh = Math.floor(sky.timeOfDay);
    const mm = String(Math.floor((sky.timeOfDay - hh) * 60)).padStart(2, '0');
    this.status.textContent = [
      `Sol ${sky.solCount}  ${String(hh).padStart(2, '0')}:${mm}`,
      `Storm: ${stormLine}`,
      `Dust: ${mission.dustWeather.phase} tau ${mission.dustWeather.tau.toFixed(1)}  panels ${Math.round(mission.dustWeather.panelDust * 100)}%  sun x${mission.dustWeather.solarFactor.toFixed(2)}  heater ${this.engine.utility.heaterRatePerHour.toFixed(2)}%/h`,
      `Dose rate: ${mission.doseRate.toFixed(3)} mSv/h   Total: ${mission.totalDoseMsv.toFixed(2)} mSv`,
      `Inside habitat: ${survival.insidePressurizedShip ? 'yes' : 'no'}   In shelter: ${mission.insideShelter ? 'yes' : 'no'}   Shield: ${mission.shieldOn ? 'on' : 'off'}`,
      `Battery: ${mission.battery.percent.toFixed(0)}%   Base tank: ${Math.round(survival.baseWater)} L   Wall: ${Math.round(mission.shelterWaterL)} L`,
      `Health: ${Math.round(survival.health)}/${survival.maxStat}   O2: ${Math.round(survival.oxygen)}   Suit: O2 ${Math.round(survival.suitOxygen)}% Wear ${Math.round(survival.suitWear)}% CO2 ${Math.round(survival.suitScrubber)}% Dust ${Math.round(survival.suitDust)}%`,
      `Radio: ${this.engine.comms.blackout ? 'SILENT' : 'ok'}   Earth: ${Math.round(this.engine.comms.distanceKm / 1e6)} Mkm, ${this.engine.comms.lightMinutes.toFixed(1)} min one way`,
      `Heater: ${this.engine.utility.heaterOn ? 'on' : 'off'}${this.engine.utility.cold ? ' (FREEZING)' : ''}   Pantry: ${Math.floor(this.engine.crewStock.food)}`,
      this._eventsLine(),
      `Position: ${player.pos.x.toFixed(1)}, ${player.pos.y.toFixed(1)}, ${player.pos.z.toFixed(1)}`,
    ].join('\n');
  }
}
