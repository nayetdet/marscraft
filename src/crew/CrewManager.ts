// @ts-nocheck
import { CREW_CONFIG } from '../config/constants.ts';
import { TASK_NODE, findRoute, routeLength } from './crewRails.ts';
import { problemText } from './stations.ts';

const TASKS = ['greenhouse', 'water', 'oxygen', 'medbay', 'rest'];

export class CrewMember {
  // role = { title, specialties }: papeis da issue #48. Comeca trabalhando na sua estacao.
  constructor(id, name, role) {
    this.id = id;
    this.name = name;
    this.role = role.title;
    this.specialties = role.specialties;
    this.task = role.specialties[0];
    this.state = 'working'; // walking | working | resting | weak | bedridden
    this.node = TASK_NODE[this.task];
    this.route = [this.node];
    this.distance = 0;
    this.routeLength = 0;
    this.hoursStarved = 0;
    this.restHours = 0; // horas de repouso ja cumpridas na enfermaria
  }

  effortAt(kind) {
    return this.specialties.includes(kind) ? CREW_CONFIG.SPECIALIST_EFFORT : 1;
  }

  // De repouso na enfermaria: nao trabalha nem recebe ordens, mas continua precisando de ar,
  // agua e comida. Ninguem volta para a Terra antes do foguete (issue #111).
  get canWork() {
    return this.state !== 'bedridden';
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
  constructor({ size, stations, base, ambient = false }) {
    const count = Math.max(1, Math.min(CREW_CONFIG.MAX_CREW, size));
    this.members = CREW_CONFIG.NAMES.slice(0, count).map((name, i) => new CrewMember(i, name, CREW_CONFIG.ROLES[i]));
    this.stations = stations;
    this.base = base;
    this.events = [];
    this._lastAlertAt = new Map();
    this.ambient = ambient;
    if (!ambient) return;
    // Roamers use corridor and exploration nodes only; fixed station nodes are never destinations.
    const roamingZones = [
      ['quarters', 'dormLink', 'dormDoor'],
      ['tunnelWest', 'tunnelEast', 'hub'],
      ['dormDoor', 'hub', 'tunnelEast'],
      ['tunnelWest', 'tunnelEast', 'dormLink'],
    ];
    const fixedStations = ['oxygen', 'greenhouse', 'water', 'medbay'];
    this.members.forEach((member, index) => {
      const fixed = index < fixedStations.length;
      const destination = fixed ? fixedStations[index] : 'rest';
      member.stationary = fixed;
      member.dialogue = {
        oxygen: 'This oxygen machine can split water, or pull oxygen out of Mars air with more power. Pick the mode in Life Support.',
        greenhouse: 'Plants grow food here, but they need water, warmth, and light.',
        water: 'The recycler cleans used water so the habitat can use it again.',
        medbay: 'The medbay is where we check our health and recover after a tough trip outside.',
        rest: 'The habitat protects us from the cold, thin air, and radiation outside.',
      }[destination];
      member.ambientPause = 0;
      member.task = destination;
      if (fixed) {
        // Spawn fixed crew directly at their post; they should never walk there.
        member.node = TASK_NODE[destination];
        member.route = [member.node];
        member.routeLength = 0;
      } else {
        const zoneIndex = index - fixedStations.length;
        member.ambientNodes = roamingZones[zoneIndex % roamingZones.length];
        // Start in separate corners, then circulate within each roamer's own area.
        const starts = ['quarters', 'tunnelWest', 'dormDoor', 'tunnelEast'];
        const stops = ['dormDoor', 'tunnelEast', 'hub', 'tunnelWest'];
        member.node = starts[zoneIndex % starts.length];
        const firstStop = stops[zoneIndex % stops.length];
        member.route = findRoute(member.node, firstStop);
        member.routeLength = routeLength(member.route);
      }
      member.distance = 0;
      member.state = member.routeLength > 0 ? 'walking' : 'resting';
    });
  }

  stationFor(task) {
    return this.stations.find((s) => s.kind === task) ?? null;
  }

  workersAt(station) {
    return this.members.filter((m) => m.state === 'working' && m.task === station.kind);
  }

  effortAt(station) {
    return this.workersAt(station).reduce((sum, m) => sum + m.effortAt(station.kind), 0);
  }

  assign(memberId, task) {
    const member = this.members[memberId];
    if (!member || !TASKS.includes(task)) return { ok: false, reason: 'Unknown order.' };
    if (!member.canWork) return { ok: false, reason: `${member.name} is too weak and must rest in the medical bay.` };

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
      if (this.ambient && member.stationary) continue;
      if (member.state !== 'walking') {
        if (!this.ambient) continue;
        member.ambientPause = (member.ambientPause ?? 0) + dtSeconds;
        const pauseTarget = member.ambientPauseTarget ?? 4;
        if (member.ambientPause >= pauseTarget) {
          member.ambientPause = 0;
          member.ambientPauseTarget = 2.4 + Math.random() * 3.2;
          const choices = member.ambientNodes.filter((destination) => destination !== member.node);
          const destination = choices[Math.floor(Math.random() * choices.length)];
          member.route = findRoute(member.node, destination);
          member.routeLength = routeLength(member.route);
          member.distance = 0;
          member.state = member.routeLength > 0 ? 'walking' : 'resting';
        }
        continue;
      }
      member.distance = Math.min(member.routeLength, member.distance + CREW_CONFIG.WALK_SPEED * dtSeconds);
      if (member.distance >= member.routeLength) {
        member.node = member.route.at(-1);
        member.state = this.ambient ? 'resting' : member.dutyState;
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
      for (const station of this.stations) station.update(step, this.effortAt(station), this.base);
    }
    this._sendAlerts(nowSeconds);
  }

  oxygenCostMultiplier() {
    return this.stationFor('oxygen')?.costMultiplier() ?? 1;
  }

  _consume(h) {
    const base = this.base;
    for (const member of this.members) {
      const lacking = [];

      // Ar da tripulacao no modo do gerador (#102); o RTG paga antes da bateria (#85)
      if (!this._breathe(h)) lacking.push('air');

      const waterNeed = CREW_CONFIG.WATER_L_PER_HOUR * h * (base.demandFactor ?? 1);
      const water = Math.min(base.water, waterNeed);
      base.water -= water;
      base.graywater += water;
      if (water + 1e-9 < waterNeed) lacking.push('water');

      const foodNeed = CREW_CONFIG.FOOD_PER_HOUR * h * (base.demandFactor ?? 1);
      const food = Math.min(base.food, foodNeed);
      base.food -= food;
      if (food + 1e-9 < foodNeed) lacking.push('food');

      if (lacking.length) this._starve(member, h, lacking);
      else this._recover(member, h);
    }
  }

  // Ar de um tripulante por `h` horas, no mesmo modo do gerador de O2 do jogador (issue #102):
  // eletrolise gasta energia e agua do tanque; MOXIE so energia, mas mais. Sem gerador na base
  // (testes antigos) o ar e pago so em energia.
  _breathe(h) {
    const base = this.base;
    const personHours = h * (base.demandFactor ?? 1);
    const energyPerPersonHour = CREW_CONFIG.OXYGEN_ENERGY_PER_HOUR * this.oxygenCostMultiplier();
    if (base.oxygenPlant) return base.oxygenPlant.supplyCrew(personHours, energyPerPersonHour, base);
    const energyNeed = energyPerPersonHour * personHours;
    return base.battery.drainLifeSupport(energyNeed) + 1e-9 >= energyNeed;
  }

  _starve(member, h, lacking) {
    member.hoursStarved += h;
    if (member.state === 'bedridden') return; // sem recurso o repouso nao rende
    if (member.hoursStarved >= CREW_CONFIG.BEDRIDDEN_AFTER_HOURS) {
      this._putToBed(member);
      return;
    }
    if (member.state !== 'weak') {
      member.state = 'weak';
      this.events.push({ type: 'weak', member, lacking });
    }
  }

  // Fraco demais para trabalhar: fica de repouso na enfermaria, ao lado do posto de quem cuida
  _putToBed(member) {
    member.state = 'bedridden';
    member.restHours = 0;
    member.node = TASK_NODE.medbay;
    member.route = findRoute(TASK_NODE.medbay, 'hub');
    member.routeLength = CREW_CONFIG.BED_REST_OFFSET;
    member.distance = CREW_CONFIG.BED_REST_OFFSET;
    this.events.push({ type: 'bedridden', member });
  }

  // Alguem (que nao o proprio doente) trabalhando na enfermaria
  _medicOnDuty(patient) {
    return this.members.some((m) => m !== patient && m.state === 'working' && m.task === 'medbay');
  }

  // Passo com ar, agua e comida em dia
  _recover(member, h) {
    member.hoursStarved = 0;
    if (member.state === 'bedridden') {
      const speed = this._medicOnDuty(member) ? CREW_CONFIG.MEDIC_RECOVERY_SPEED : 1;
      member.restHours += h * speed;
      if (member.restHours + 1e-9 < CREW_CONFIG.BED_REST_HOURS) return;
      // Repouso cumprido: sai da enfermaria e volta para a tarefa que tinha
      member.restHours = 0;
      member.route = findRoute(TASK_NODE.medbay, TASK_NODE[member.task]);
      member.routeLength = routeLength(member.route);
      member.distance = 0;
      member.state = member.dutyState;
      this.events.push({ type: 'recovered', member });
      return;
    }
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
