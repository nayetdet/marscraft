import { describe, it, expect } from 'vitest';
import { CREW_CONFIG, OXYGEN_PLANT_CONFIG, STATION_CONFIG } from '../config/constants.js';
import { Battery } from '../mission/energy.js';
import { CrewManager } from './CrewManager.js';
import { createStations } from './stations.js';
import { ELECTROLYSIS_WATER_L_PER_PERSON_SOL, OxygenPlant } from '../mission/oxygenPlant.js';
import { findRoute, routeLength } from './crewRails.js';

function makeBase(overrides = {}) {
  return {
    battery: new Battery(100),
    water: 50,
    maxWater: 100,
    food: 20,
    maxFood: 40,
    graywater: 0,
    playerDoseRate: 0,
    playerHealth: 20,
    playerHeal: 0,
    ...overrides,
  };
}

function makeCrew(size = 2, baseOverrides = {}) {
  const base = makeBase(baseOverrides);
  const crew = new CrewManager({ size, stations: createStations(), base });
  return { crew, base };
}

// Manda o tripulante para a estacao e espera ele chegar
function sendAndArrive(crew, id, task) {
  crew.assign(id, task);
  crew.updateMovement(60);
}

// Todos descansando: nenhuma estacao gasta energia, so as necessidades contam
function restAll(crew) {
  for (const m of crew.members) crew.assign(m.id, 'rest');
  crew.updateMovement(60);
}

describe('CrewManager needs', () => {
  it('starts with the chosen crew size, each one working at their own station (#48 roles)', () => {
    const { crew } = makeCrew(3);
    expect(crew.members.map((m) => m.name)).toEqual(CREW_CONFIG.NAMES.slice(0, 3));
    expect(crew.members.map((m) => m.role)).toEqual(['Flight Engineer', 'Botanist', 'Medical Officer']);
    expect(crew.members.map((m) => m.task)).toEqual(['oxygen', 'greenhouse', 'medbay']);
    expect(crew.members.every((m) => m.state === 'working')).toBe(true);
  });

  it('a specialist puts more effort into their own station', () => {
    const { crew } = makeCrew(2);
    const greenhouse = crew.stations.find((s) => s.kind === 'greenhouse');
    expect(crew.effortAt(greenhouse)).toBe(CREW_CONFIG.SPECIALIST_EFFORT); // Leo, botanico
    sendAndArrive(crew, 1, 'water');
    sendAndArrive(crew, 0, 'greenhouse');
    expect(crew.effortAt(greenhouse)).toBe(1); // Ana, engenheira, fora da especialidade
  });

  it('every crew member uses food, water and energy, so more crew uses more', () => {
    const one = makeCrew(1);
    const three = makeCrew(3);
    restAll(one.crew);
    restAll(three.crew);
    one.crew.update(1, 0);
    three.crew.update(1, 0);

    expect(20 - one.base.food).toBeCloseTo(CREW_CONFIG.FOOD_PER_HOUR);
    expect(20 - three.base.food).toBeCloseTo(3 * CREW_CONFIG.FOOD_PER_HOUR);
    expect(50 - three.base.water).toBeCloseTo(3 * CREW_CONFIG.WATER_L_PER_HOUR);
    // O gerador de O2 sem operador estraga um pouco, entao compara a proporcao 3 : 1
    const oneEnergy = 100 - one.base.battery.charge;
    expect(oneEnergy).toBeGreaterThanOrEqual(CREW_CONFIG.OXYGEN_ENERGY_PER_HOUR);
    expect(100 - three.base.battery.charge).toBeCloseTo(3 * oneEnergy);
    // A agua usada vira agua cinza, que o reciclador pode tratar
    expect(three.base.graywater).toBeCloseTo(3 * CREW_CONFIG.WATER_L_PER_HOUR);
  });

  it('on the gentle first sol the crew needs less air, water and food, but never nothing (issue #81)', () => {
    const normal = makeCrew(2);
    const gentle = makeCrew(2, { demandFactor: 0.6 });
    restAll(normal.crew);
    restAll(gentle.crew);
    normal.crew.update(1, 0);
    gentle.crew.update(1, 0);

    expect(20 - gentle.base.food).toBeCloseTo(0.6 * (20 - normal.base.food));
    expect(50 - gentle.base.water).toBeCloseTo(0.6 * (50 - normal.base.water));
    expect(gentle.base.graywater).toBeCloseTo(50 - gentle.base.water);
    expect(100 - gentle.base.battery.charge).toBeCloseTo(0.6 * (100 - normal.base.battery.charge));
    expect(gentle.base.food).toBeLessThan(20);
  });

  it('runs out of food: the crew member gets weak and says what is missing', () => {
    const { crew } = makeCrew(1, { food: 0 });
    crew.update(0.1, 0);
    expect(crew.members[0].state).toBe('weak');
    const weak = crew.drainEvents().find((e) => e.type === 'weak');
    expect(weak.lacking).toContain('food');
  });

  it('a weak crew member goes back to the task when supplies return', () => {
    const { crew, base } = makeCrew(1);
    sendAndArrive(crew, 0, 'water');
    base.food = 0;
    crew.update(0.1, 0);
    expect(crew.members[0].state).toBe('weak');

    base.food = 10;
    crew.update(0.1, 0);
    expect(crew.members[0].state).toBe('working');
    expect(crew.members[0].hoursStarved).toBe(0);
    expect(crew.drainEvents().map((e) => e.type)).toContain('recovered');
  });

  it('rests in the medical bay after too many hours without supplies, and still needs supplies (issue #111)', () => {
    const { crew, base } = makeCrew(1, { food: 0 });
    const member = crew.members[0];
    crew.update(CREW_CONFIG.BEDRIDDEN_AFTER_HOURS - 0.5, 0);
    expect(member.state).toBe('weak');
    crew.update(1, 0);
    expect(member.state).toBe('bedridden');
    expect(member.node).toBe('medbay');
    expect(member.canWork).toBe(false);
    const types = crew.drainEvents().map((e) => e.type);
    expect(types).toContain('bedridden');
    expect(types).not.toContain('evacuated');

    // Ninguem foi embora: quem esta de repouso continua bebendo, comendo e respirando
    base.food = 10;
    const water = base.water;
    const charge = base.battery.charge;
    crew.update(1, 0);
    expect(10 - base.food).toBeCloseTo(CREW_CONFIG.FOOD_PER_HOUR);
    expect(water - base.water).toBeCloseTo(CREW_CONFIG.WATER_L_PER_HOUR);
    expect(base.battery.charge).toBeLessThan(charge);
    expect(member.state).toBe('bedridden');
  });

  it('gets back to work after enough rest with air, water and food (issue #111)', () => {
    const { crew, base } = makeCrew(1, { food: 0 });
    const member = crew.members[0];
    crew.update(CREW_CONFIG.BEDRIDDEN_AFTER_HOURS + 0.5, 0);
    expect(member.state).toBe('bedridden');
    crew.drainEvents();

    base.food = 20;
    crew.update(CREW_CONFIG.BED_REST_HOURS - 0.5, 0);
    expect(member.state).toBe('bedridden');
    expect(crew.drainEvents().map((e) => e.type)).not.toContain('recovered');

    crew.update(1, 0);
    expect(crew.drainEvents().map((e) => e.type)).toContain('recovered');
    // Sai da enfermaria andando ate a tarefa que tinha, e so entao volta a trabalhar
    expect(member.state).toBe('walking');
    expect(member.route).toEqual(findRoute('medbay', 'oxygen'));
    crew.updateMovement(60);
    expect(member.state).toBe('working');
    expect(member.node).toBe('oxygen');
    expect(member.hoursStarved).toBe(0);
  });

  it('rest does not count while something is still missing (issue #111)', () => {
    const { crew, base } = makeCrew(1, { food: 0 });
    const member = crew.members[0];
    crew.update(CREW_CONFIG.BEDRIDDEN_AFTER_HOURS + 0.5, 0);
    crew.update(CREW_CONFIG.BED_REST_HOURS * 3, 0);
    expect(member.state).toBe('bedridden');
    expect(member.restHours).toBe(0);

    // Comida de volta por pouco tempo, depois falta de novo: o repouso feito fica guardado
    base.food = CREW_CONFIG.FOOD_PER_HOUR * 2;
    base.battery.charge = 100; // o ar tambem precisa estar em dia para o repouso contar
    crew.update(2, 0);
    expect(member.restHours).toBeCloseTo(2);
    crew.update(CREW_CONFIG.BED_REST_HOURS, 0);
    expect(member.state).toBe('bedridden');
    expect(member.restHours).toBeCloseTo(2);
  });

  it('recovers twice as fast with someone working at the medical bay (issue #111)', () => {
    expect(CREW_CONFIG.MEDIC_RECOVERY_SPEED).toBe(2);
    const bedridden = (crew) => {
      const patient = crew.members[0];
      patient.state = 'bedridden';
      patient.restHours = 0;
      return patient;
    };

    // Maya, a medica, comeca de plantao na enfermaria
    const cared = makeCrew(3);
    const patient = bedridden(cared.crew);
    cared.crew.update(CREW_CONFIG.BED_REST_HOURS / 2 - 0.25, 0);
    expect(patient.state).toBe('bedridden');
    cared.crew.update(0.5, 0);
    expect(patient.state).not.toBe('bedridden');

    // Sem ninguem na enfermaria o mesmo tempo nao basta
    const alone = makeCrew(2);
    const lonely = bedridden(alone.crew);
    alone.crew.update(CREW_CONFIG.BED_REST_HOURS / 2 + 0.25, 0);
    expect(lonely.state).toBe('bedridden');
    alone.crew.update(CREW_CONFIG.BED_REST_HOURS / 2, 0);
    expect(lonely.state).not.toBe('bedridden');

    // Quem esta de repouso nao conta como plantao de si mesmo
    const self = makeCrew(1);
    const only = bedridden(self.crew);
    only.task = 'medbay';
    self.crew.update(CREW_CONFIG.BED_REST_HOURS / 2 + 0.25, 0);
    expect(only.state).toBe('bedridden');
  });
});

describe('CrewManager orders and movement', () => {
  it('walks to the station along the rails and then starts working', () => {
    const { crew } = makeCrew(1);
    const result = crew.assign(0, 'greenhouse');
    expect(result.ok).toBe(true);
    const member = crew.members[0];
    expect(member.state).toBe('walking');

    const seconds = routeLength(findRoute('oxygen', 'greenhouse')) / CREW_CONFIG.WALK_SPEED;
    crew.updateMovement(seconds * 0.5);
    expect(member.state).toBe('walking');
    crew.updateMovement(seconds * 0.6);
    expect(member.state).toBe('working');
    expect(member.node).toBe('greenhouse');
  });

  it('refuses a station without power and keeps the old task', () => {
    const { crew } = makeCrew(1, { battery: new Battery(0) });
    const result = crew.assign(0, 'greenhouse');
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/power/i);
    expect(crew.members[0].task).toBe('oxygen');
  });

  it('cannot give orders to someone resting in the medical bay (issue #111)', () => {
    const { crew } = makeCrew(1);
    crew.members[0].state = 'bedridden';
    const result = crew.assign(0, 'water');
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('Ana is too weak and must rest in the medical bay.');
    expect(result.reason).not.toMatch(/Earth/);
    expect(crew.members[0].task).toBe('oxygen');
  });

  it('someone resting in the medical bay does not operate any station (issue #111)', () => {
    const { crew } = makeCrew(1);
    const oxygen = crew.stations.find((s) => s.kind === 'oxygen');
    expect(crew.workersAt(oxygen)).toHaveLength(1);
    crew.members[0].state = 'bedridden';
    expect(crew.workersAt(oxygen)).toHaveLength(0);
    expect(crew.effortAt(oxygen)).toBe(0);
  });

  it('only crew members who are working count as operators', () => {
    const { crew } = makeCrew(1);
    const greenhouse = crew.stations.find((s) => s.kind === 'greenhouse');
    crew.assign(0, 'greenhouse');
    expect(crew.workersAt(greenhouse)).toHaveLength(0); // ainda andando
    crew.updateMovement(60);
    expect(crew.workersAt(greenhouse)).toHaveLength(1);
  });

  it('a staffed greenhouse feeds the crew; an empty one does not', () => {
    const staffed = makeCrew(1, { food: 10 });
    sendAndArrive(staffed.crew, 0, 'greenhouse');
    staffed.crew.update(1, 0);
    expect(staffed.base.food).toBeGreaterThan(10);

    const empty = makeCrew(1, { food: 10 });
    empty.crew.update(1, 0);
    expect(empty.base.food).toBeLessThan(10);
  });
});

describe('CrewManager alerts', () => {
  it('only a staffed station sends radio alerts, with a cooldown', () => {
    // Agua que ainda da para o tripulante beber, mas nao para regar as plantas
    const { crew } = makeCrew(1, { water: STATION_CONFIG.GREENHOUSE_WATER_L_PER_FOOD / 2 });
    crew.update(0.1, 0);
    expect(crew.drainEvents().filter((e) => e.type === 'alert')).toHaveLength(0);

    sendAndArrive(crew, 0, 'greenhouse');
    crew.update(0.1, 100);
    const alerts = crew.drainEvents().filter((e) => e.type === 'alert');
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toMatchObject({ problem: 'no-water', member: crew.members[0] });

    crew.update(0.1, 100 + CREW_CONFIG.ALERT_COOLDOWN_S - 1);
    expect(crew.drainEvents().filter((e) => e.type === 'alert')).toHaveLength(0);
    crew.update(0.1, 100 + CREW_CONFIG.ALERT_COOLDOWN_S + 1);
    expect(crew.drainEvents().filter((e) => e.type === 'alert')).toHaveLength(1);
  });
});

describe('CrewManager medical officer', () => {
  it('without the medical officer on duty nobody warns about radiation', () => {
    const solo = makeCrew(2, { playerDoseRate: 99 });
    solo.crew.update(0.1, 0);
    expect(solo.crew.drainEvents().some((e) => e.problem === 'radiation-high')).toBe(false);

    const withDoctor = makeCrew(3, { playerDoseRate: 99 });
    withDoctor.crew.update(0.1, 0);
    const alert = withDoctor.crew.drainEvents().find((e) => e.problem === 'radiation-high');
    expect(alert.member.name).toBe('Maya');
  });

  it('the medical officer on duty builds up healing for the commander', () => {
    const { crew, base } = makeCrew(3);
    crew.update(1, 0);
    expect(base.playerHeal).toBeGreaterThan(0);
  });
});

describe('CrewManager oxygen', () => {
  it('worn air filters make breathing cost more energy for the crew', () => {
    const fresh = makeCrew(1);
    const worn = makeCrew(1);
    restAll(fresh.crew);
    restAll(worn.crew);
    worn.crew.stations.find((s) => s.kind === 'oxygen').health = 0;
    expect(fresh.crew.oxygenCostMultiplier()).toBe(1);
    expect(worn.crew.oxygenCostMultiplier()).toBe(STATION_CONFIG.OXYGEN_MAX_COST_MULTIPLIER);

    fresh.crew.update(0.05, 0);
    worn.crew.update(0.05, 0);
    const freshUsed = 100 - fresh.base.battery.charge;
    const wornUsed = 100 - worn.base.battery.charge;
    expect(wornUsed).toBeGreaterThan(freshUsed);
  });
});

// Issue #102: a tripulacao respira no mesmo modo do gerador de O2 escolhido pelo jogador
describe('CrewManager air follows the oxygen machine mode (issue #102)', () => {
  function crewWithPlant(mode, baseOverrides = {}) {
    const plant = new OxygenPlant(mode);
    const { crew, base } = makeCrew(2, { oxygenPlant: plant, ...baseOverrides });
    restAll(crew); // ninguem trabalhando: so as necessidades gastam
    return { crew, base, plant };
  }

  it('air from water spends crew water at the real ratio (~0.95 L per person per sol)', () => {
    const { crew, base, plant } = crewWithPlant('electrolysis', { water: 50 });
    crew.update(24, 0);
    expect(plant.waterUsedL).toBeCloseTo(2 * ELECTROLYSIS_WATER_L_PER_PERSON_SOL, 3);
    // A agua da eletrolise sai do ciclo; a que eles bebem vai para a agua cinza
    expect(base.water + base.graywater + plant.waterUsedL).toBeCloseTo(50, 6);
  });

  it('air from Mars air spends no water but more power', () => {
    const water = crewWithPlant('electrolysis', { water: 50 });
    const moxie = crewWithPlant('moxie', { water: 50 });
    water.crew.update(10, 0);
    moxie.crew.update(10, 0);
    expect(moxie.plant.waterUsedL).toBe(0);
    expect(moxie.base.water + moxie.base.graywater).toBeCloseTo(50, 6);
    // Sem operador o gerador estraga igual nos dois casos: compara a proporcao
    const waterPower = 100 - water.base.battery.charge;
    const moxiePower = 100 - moxie.base.battery.charge;
    expect(waterPower).toBeGreaterThanOrEqual(2 * 10 * CREW_CONFIG.OXYGEN_ENERGY_PER_HOUR);
    expect(moxiePower).toBeCloseTo(waterPower * OXYGEN_PLANT_CONFIG.MOXIE_ENERGY_FACTOR);
  });

  it('night with no sun: with little battery only air from water keeps the crew breathing', () => {
    const lackingAir = (mode) => {
      const { crew } = crewWithPlant(mode, { battery: new Battery(40), water: 50 });
      crew.update(12, 0); // a noite inteira, sem Sol para recarregar
      return crew.drainEvents().some((e) => e.type === 'weak' && e.lacking.includes('air'));
    };
    expect(lackingAir('electrolysis')).toBe(false);
    expect(lackingAir('moxie')).toBe(true);
  });

  it('empty tank: only air from Mars air keeps the crew breathing', () => {
    const lackingAir = (mode) => {
      const { crew } = crewWithPlant(mode, { water: 0 });
      crew.update(1, 0);
      return crew.drainEvents().some((e) => e.type === 'weak' && e.lacking.includes('air'));
    };
    expect(lackingAir('electrolysis')).toBe(true);
    expect(lackingAir('moxie')).toBe(false);
  });

  it('the engineer at the oxygen machine warns when the mode drains the resource running out', () => {
    const low = makeCrew(2, { oxygenPlant: new OxygenPlant('electrolysis'), water: 4 });
    low.crew.update(0.01, 0);
    const waterAlert = low.crew.drainEvents().find((e) => e.type === 'alert' && e.station.kind === 'oxygen');
    expect(waterAlert.problem).toBe('air-water-low');
    expect(waterAlert.member.name).toBe('Ana');
    expect(waterAlert.text).toMatch(/Mars air/);

    const moxie = makeCrew(2, { oxygenPlant: new OxygenPlant('moxie'), battery: new Battery(10) });
    moxie.crew.update(0.01, 0);
    const powerAlert = moxie.crew.drainEvents().find((e) => e.type === 'alert' && e.station.kind === 'oxygen');
    expect(powerAlert.problem).toBe('air-power-low');
    expect(powerAlert.text).toMatch(/Air from water/);
  });
});
