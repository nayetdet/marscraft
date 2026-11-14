import { HABITAT_LAYOUT } from '../world/habitatLayout.js';
import { MAV_CONFIG, RADIATION_CONFIG, WATER_SYSTEM_CONFIG } from '../config/constants.js';
import { requestRawPointerLock } from '../player/mouseLook.js';
import { BLOCK_IDS } from '../config/blockTypes.js';
import './styles/admin.css';

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
  ['Bathroom', -12, EYE_INSIDE, -35.5, Math.PI / 2],
  ['Workshop', 8, EYE_INSIDE, -35.5, -Math.PI / 2],
  ['Airlock', 0.5, EYE_INSIDE, 7.5, Math.PI],
  ['Greenhouse', -15.7, EYE_INSIDE, 0.3, 2.66],
  ['Gym & medbay', -8, EYE_INSIDE, 10, Math.PI],
  ['Outside ramp', 0, EYE_OUTSIDE, 11.5, 0],
  ['MAV pad', MAV_CONFIG.PAD_POSITION.x - 6, DROP, MAV_CONFIG.PAD_POSITION.z, -Math.PI / 2],
  ['Ice crater', WATER_SYSTEM_CONFIG.ICE_CRATER_CENTER.x, DROP, WATER_SYSTEM_CONFIG.ICE_CRATER_CENTER.z + 6, 0],
];

function isEnabled() {
  return import.meta.env.DEV || new URLSearchParams(window.location.search).has('admin');
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
      }
    });
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
      ${group('Radio to Earth', [['radio:on', 'Solar conjunction now'], ['radio:off', 'End conjunction']])}
      ${group('Power', [['power:100', 'Battery 100%'], ['power:15', 'Battery 15%'], ['power:0', 'Battery 0%']])}
      ${group('Water', [['water:add', 'Base tank +20 L'], ['water:empty', 'Base tank 0 L'], ['wall:full', 'Shelter wall full'], ['wall:empty', 'Shelter wall empty']])}
      ${group('Astronaut', [['me:refill', 'Refill astronaut'], ['me:dose', 'Reset radiation dose'], ['me:hurt', 'Health to 25%']])}
      ${group('Base', [['base:dirtySuit', 'Dusty suit'], ['base:contaminate', 'Dust in habitat'], ['base:clean', 'Clean suit + habitat'], ['base:filter', 'CO2 filter 0%']])}
      ${group('North module', [['north:waterFilter', 'Water filter 10%'], ['north:pantry', 'Pantry +10 rations'], ['north:wear', 'Crew stations 30%'], ['north:regolith', '+6 regolith'], ['north:carrot', '+3 carrots']])}
      ${group('Time', [['time:1', '+1 hour'], ['time:day', 'Skip to 08:00'], ['time:night', 'Skip to 21:00']])}
      ${group('Teleport', TELEPORTS.map(([name], i) => [`tp:${i}`, name]))}
    `;
  }

  _run(action) {
    const { mission, survival, stations, sky, player } = this.engine;
    const [kind, arg] = action.split(':');
    switch (kind) {
      case 'storm':
        return `Storm phase is now: ${mission.forceStorm(arg).toUpperCase()}`;
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
          return 'Astronaut refilled.';
        }
        if (arg === 'dose') { mission.totalDoseMsv = 0; return 'Radiation dose reset.'; }
        survival.health = survival.maxStat * 0.25;
        return 'Health set to 25%.';
      case 'base':
        if (arg === 'dirtySuit') stations.dirtySuit = true;
        else if (arg === 'contaminate') stations.contaminated = true;
        else if (arg === 'filter') stations.filter = 0;
        else { stations.dirtySuit = false; stations.contaminated = false; }
        return 'Base state changed.';
      case 'north': {
        const { utility, crewStock, crew } = this.engine;
        if (arg === 'waterFilter') utility.waterFilter = 10;
        else if (arg === 'pantry') crewStock.food = Math.min(crewStock.maxFood, crewStock.food + 10);
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
        const target = arg === 'day' ? 8 : arg === 'night' ? 21 : null;
        const delta = target === null ? 1 : ((target - sky.timeOfDay) % 24 + 24) % 24;
        sky.advanceTime(delta);
        return `Time moved forward ${delta.toFixed(1)} h.`;
      }
      case 'tp': {
        const [name, x, y, z, yaw] = TELEPORTS[Number(arg)];
        player.pos.set(x, y, z);
        player.vel.set(0, 0, 0);
        player.yaw = yaw;
        player.pitch = 0;
        return `Teleported to: ${name}. Close the panel to play.`;
      }
      default:
        return '';
    }
  }

  _renderStatus() {
    const { mission, survival, sky, player } = this.engine;
    const { phase, hoursUntil, hoursLeft, storm } = mission.storm;
    const stormLine = phase === 'active'
      ? `ACTIVE, ${hoursLeft.toFixed(2)} h left (x${Math.round(storm.multiplier)} dose)`
      : phase === 'warning' ? `WARNING, arrives in ${hoursUntil.toFixed(2)} h` : `calm, next in ${Number.isFinite(hoursUntil) ? hoursUntil.toFixed(1) : '-'} h`;
    const hh = Math.floor(sky.timeOfDay);
    const mm = String(Math.floor((sky.timeOfDay - hh) * 60)).padStart(2, '0');
    this.status.textContent = [
      `Sol ${sky.solCount}  ${String(hh).padStart(2, '0')}:${mm}`,
      `Storm: ${stormLine}`,
      `Dose rate: ${mission.doseRate.toFixed(3)} mSv/h   Total: ${mission.totalDoseMsv.toFixed(2)} mSv`,
      `Inside habitat: ${survival.insidePressurizedShip ? 'yes' : 'no'}   In shelter: ${mission.insideShelter ? 'yes' : 'no'}   Shield: ${mission.shieldOn ? 'on' : 'off'}`,
      `Battery: ${mission.battery.percent.toFixed(0)}%   Base tank: ${Math.round(survival.baseWater)} L   Wall: ${Math.round(mission.shelterWaterL)} L`,
      `Health: ${Math.round(survival.health)}/${survival.maxStat}   O2: ${Math.round(survival.oxygen)}`,
      `Radio: ${this.engine.comms.blackout ? 'SILENT' : 'ok'}   Earth: ${Math.round(this.engine.comms.distanceKm / 1e6)} Mkm, ${this.engine.comms.lightMinutes.toFixed(1)} min one way`,
      `Heater: ${this.engine.utility.heaterOn ? 'on' : 'off'}${this.engine.utility.cold ? ' (FREEZING)' : ''}   Water filter: ${Math.round(this.engine.utility.waterFilter)}%   Pantry: ${Math.floor(this.engine.crewStock.food)}`,
      `Position: ${player.pos.x.toFixed(1)}, ${player.pos.y.toFixed(1)}, ${player.pos.z.toFixed(1)}`,
    ].join('\n');
  }
}
