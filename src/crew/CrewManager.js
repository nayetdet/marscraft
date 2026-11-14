import { CREW_CONFIG } from '../config/constants.js';
import { TASK_NODE, findRoute, routeLength } from './crewRails.js';
import { problemText } from './stations.js';

const TASKS = ['greenhouse', 'water', 'oxygen', 'rest'];

export class CrewMember {
  constructor(id, name) {
    this.id = id;
    this.name = name;
    this.task = 'rest';
    this.state = 'resting'; // idle | walking | working | resting | weak | evacuated
    this.node = TASK_NODE.rest;
    this.route = [this.node];
    this.distance = 0;
    this.routeLength = 0;
    this.hoursStarved = 0;
  }

  get isActive() {
    return this.state !== 'evacuated';
  }

  // Estado de quando ele nao esta fraco: andando, trabalhando ou descansando
  get dutyState() {
    if (this.distance < this.routeLength) return 'walking';
    return this.task === 'rest' ? 'resting' : 'working';
  }
}

// Tripulacao NPC: necessidades (do estoque compartilhado da base), ordens, estacoes e avisos.
// Sem Three.js nem DOM. O tempo chega em horas de jogo; o cooldown dos avisos, em segundos reais.
export class CrewManager {
  constructor({ size, stations, base }) {
    const count = Math.max(1, Math.min(CREW_CONFIG.MAX_CREW, size));
    this.members = CREW_CONFIG.NAMES.slice(0, count).map((name, i) => new CrewMember(i, name));
    this.stations = stations;
    this.base = base;
    this.events = [];
    this._lastAlertAt = new Map();
  }

  stationFor(task) {
    return this.stations.find((s) => s.kind === task) ?? null;
  }

  workersAt(station) {
    return this.members.filter((m) => m.state === 'working' && m.task === station.kind);
  }

  assign(memberId, task) {
    const member = this.members[memberId];
    if (!member || !TASKS.includes(task)) return { ok: false, reason: 'Unknown order.' };
    if (!member.isActive) return { ok: false, reason: `${member.name} went back to Earth.` };

    const station = this.stationFor(task);
    if (station && !station.canOperate(this.base)) {
      return { ok: false, reason: `${member.name}: I can't, the ${station.name} has no power.` };
    }

    member.task = task;
    member.route = findRoute(member.node, TASK_NODE[task]);
    member.routeLength = routeLength(member.route);
    member.distance = 0;
    if (member.state !== 'weak') member.state = member.dutyState;

    const message = task === 'rest'
      ? `${member.name}: Going to rest. I still need air, water and food.`
      : `${member.name}: On my way to the ${station.name}!`;
    return { ok: true, message };
  }

  updateMovement(dtSeconds) {
    for (const member of this.members) {
      if (member.state !== 'walking') continue;
      member.distance = Math.min(member.routeLength, member.distance + CREW_CONFIG.WALK_SPEED * dtSeconds);
      if (member.distance >= member.routeLength) {
        member.node = member.route.at(-1);
        member.state = member.dutyState;
      }
    }
  }

  // Avanca `hours` horas de jogo em passos pequenos (o avanco de tempo pela tecla T nao pula eventos)
  update(hours, nowSeconds) {
    let remaining = hours;
    while (remaining > 1e-9) {
      const step = Math.min(remaining, CREW_CONFIG.MAX_STEP_HOURS);
      remaining -= step;
      this._consume(step);
      for (const station of this.stations) station.update(step, this.workersAt(station).length, this.base);
    }
    this._sendAlerts(nowSeconds);
  }

  oxygenCostMultiplier() {
    return this.stationFor('oxygen')?.costMultiplier() ?? 1;
  }

  _consume(h) {
    const base = this.base;
    for (const member of this.members) {
      if (!member.isActive) continue;
      const lacking = [];

      const energyNeed = CREW_CONFIG.OXYGEN_ENERGY_PER_HOUR * this.oxygenCostMultiplier() * h;
      if (base.battery.drain(energyNeed) + 1e-9 < energyNeed) lacking.push('air');

      const waterNeed = CREW_CONFIG.WATER_L_PER_HOUR * h;
      const water = Math.min(base.water, waterNeed);
      base.water -= water;
      base.graywater += water;
      if (water + 1e-9 < waterNeed) lacking.push('water');

      const foodNeed = CREW_CONFIG.FOOD_PER_HOUR * h;
      const food = Math.min(base.food, foodNeed);
      base.food -= food;
      if (food + 1e-9 < foodNeed) lacking.push('food');

      if (lacking.length) this._starve(member, h, lacking);
      else this._recover(member);
    }
  }

  _starve(member, h, lacking) {
    member.hoursStarved += h;
    if (member.hoursStarved >= CREW_CONFIG.EVACUATE_AFTER_HOURS) {
      member.state = 'evacuated';
      this.events.push({ type: 'evacuated', member });
      return;
    }
    if (member.state !== 'weak') {
      member.state = 'weak';
      this.events.push({ type: 'weak', member, lacking });
    }
  }

  _recover(member) {
    member.hoursStarved = 0;
    if (member.state !== 'weak') return;
    member.state = member.dutyState;
    this.events.push({ type: 'recovered', member });
  }

  // "Quem cuida, avisa": so estacoes com alguem trabalhando mandam aviso pelo radio
  _sendAlerts(nowSeconds) {
    for (const station of this.stations) {
      const workers = this.workersAt(station);
      if (!workers.length) continue;
      const [problem] = station.problems(this.base);
      if (!problem) continue;
      const last = this._lastAlertAt.get(station.id);
      if (last !== undefined && nowSeconds - last < CREW_CONFIG.ALERT_COOLDOWN_S) continue;
      this._lastAlertAt.set(station.id, nowSeconds);
      this.events.push({ type: 'alert', member: workers[0], station, problem, text: problemText(station, problem) });
    }
  }

  drainEvents() {
    const events = this.events;
    this.events = [];
    return events;
  }
}
