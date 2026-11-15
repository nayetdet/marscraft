import { RADIATION_CONFIG, STATION_CONFIG, WATER_SYSTEM_CONFIG } from '../config/constants.js';

// Estacoes da base que a tripulacao opera. Sem Three.js nem DOM, para testar com Vitest.
// `base` e o estoque compartilhado: { battery, water, maxWater, food, maxFood, graywater }
// mais o estado do comandante para a enfermaria: { playerDoseRate, playerHealth, playerHeal }.
// Modelo de manutencao: sem operador a estacao estraga devagar (health cai); com operador ela
// e consertada e produz, mas o trabalho gasta energia da bateria. Nenhuma ordem e de graca.
// `effort` = soma do esforco de quem trabalha ali (especialista rende CREW_CONFIG.SPECIALIST_EFFORT).
export class Station {
  constructor({ id, kind, name, workNode }) {
    this.id = id;
    this.kind = kind;
    this.name = name;
    this.workNode = workNode;
    this.health = 1;
    this.operating = false;
  }

  canOperate(base) {
    return base.battery.charge > 0;
  }

  update(hours, effort, base) {
    this.operating = false;
    if (effort > 0 && this.canOperate(base)) {
      const need = STATION_CONFIG.WORK_ENERGY_PER_HOUR * hours;
      const share = need > 0 ? base.battery.drain(need) / need : 0;
      if (share > 0) {
        this.operating = true;
        const workHours = hours * share * effort;
        this.health = Math.min(1, this.health + STATION_CONFIG.REPAIR_PER_HOUR * workHours);
        this.produce(workHours, base);
        return;
      }
    }
    this.health = Math.max(0, this.health - STATION_CONFIG.DEGRADE_PER_HOUR * hours);
  }

  // Producao de cada tipo de estacao (so roda com operador e energia)
  produce() {}

  problems(base) {
    const list = [];
    if (!this.canOperate(base)) list.push('no-power');
    if (this.health < STATION_CONFIG.LOW_HEALTH) list.push('needs-care');
    return list;
  }
}

export class Greenhouse extends Station {
  constructor() {
    super({ id: 'greenhouse', kind: 'greenhouse', name: 'greenhouse', workNode: 'greenhouse' });
  }

  // As plantas da tripulacao bebem do mesmo tanque que os campos do jogador (issue #101):
  // cada racao gasta agua, e a maior parte volta como agua cinza (transpiracao condensada).
  hasWater(base) {
    return base.water >= STATION_CONFIG.GREENHOUSE_WATER_L_PER_FOOD;
  }

  produce(hours, base) {
    if (!this.hasWater(base)) return;
    if (base.frozen || base.greenhouseDark) return; // modulo norte: frio ou luz cortada
    const perFood = STATION_CONFIG.GREENHOUSE_WATER_L_PER_FOOD;
    const wanted = STATION_CONFIG.GREENHOUSE_FOOD_PER_HOUR * this.health * hours;
    const grown = Math.min(wanted, Math.max(0, base.maxFood - base.food), base.water / perFood);
    if (grown <= 0) return;
    const water = grown * perFood;
    base.water -= water;
    base.graywater += water * WATER_SYSTEM_CONFIG.CROP_WATER_RETURN;
    base.food = Math.min(base.maxFood, base.food + grown);
  }

  problems(base) {
    const list = super.problems(base);
    if (!this.hasWater(base)) list.push('no-water');
    if (base.frozen) list.push('frozen');
    else if (base.greenhouseDark) list.push('lights-off');
    return list;
  }
}

export class WaterRecycler extends Station {
  constructor() {
    super({ id: 'water', kind: 'water', name: 'water recycler', workNode: 'water' });
  }

  produce(hours, base) {
    if (base.frozen) return; // canos congelados (aquecedor desligado a noite)
    const treated = Math.min(base.graywater, STATION_CONFIG.WATER_RECYCLE_L_PER_HOUR * this.health * hours);
    base.graywater -= treated;
    base.water = Math.min(base.maxWater, base.water + treated * (base.waterRecovery ?? STATION_CONFIG.WATER_RECOVERY));
  }

  problems(base) {
    const list = super.problems(base);
    if (base.frozen) list.push('frozen');
    if (base.water < STATION_CONFIG.LOW_WATER_L) list.push('tank-low');
    return list;
  }
}

export class OxygenGenerator extends Station {
  constructor() {
    super({ id: 'oxygen', kind: 'oxygen', name: 'oxygen generator', workNode: 'oxygen' });
  }

  // Filtros de CO2 saturados (health baixa) deixam o O2 da base mais caro em energia
  costMultiplier() {
    return 1 + (STATION_CONFIG.OXYGEN_MAX_COST_MULTIPLIER - 1) * (1 - this.health);
  }
}

export class MedBay extends Station {
  constructor() {
    super({ id: 'medbay', kind: 'medbay', name: 'medical bay', workNode: 'medbay' });
  }

  // Cura que o motor aplica no comandante quando ele esta dentro da base
  produce(hours, base) {
    base.playerHeal += STATION_CONFIG.MEDBAY_HEAL_PER_HOUR * this.health * hours;
  }

  // A medica vigia o comandante: sem ela de plantao, ninguem avisa da radiacao
  problems(base) {
    const list = super.problems(base);
    if (base.playerDoseRate >= RADIATION_CONFIG.HARM_THRESHOLD_MSV_PER_HOUR) list.unshift('radiation-high');
    if (base.playerHealth < STATION_CONFIG.MEDBAY_LOW_HEALTH) list.push('health-low');
    return list;
  }
}

export function createStations() {
  return [new Greenhouse(), new WaterRecycler(), new OxygenGenerator(), new MedBay()];
}

const PROBLEM_TEXT = {
  'no-power': (s) => `Commander, the ${s.name} has no power! The battery is empty.`,
  'needs-care': (s) => (s.kind === 'oxygen'
    ? 'Commander, the air filters are full. Making oxygen now costs more energy!'
    : `Commander, the ${s.name} is breaking down. It needs care.`),
  'no-water': () => 'Commander, the plants are dry! The base water tank is empty.',
  'tank-low': () => 'Commander, the water tank is almost empty! Bring ice with the rover.',
  'radiation-high': () => 'Commander, your radiation dose is too high! Get inside the base or use the Shield Remote to turn on the shield.',
  'health-low': () => 'Commander, you are hurt! Come to the medical bay inside the base.',
  frozen: (s) => `Commander, it is freezing! The ${s.name} stopped. Turn the heater on in the power room.`,
  'lights-off': () => 'Commander, the greenhouse lights are off. The plants stopped growing.',
};

export function problemText(station, problem) {
  return (PROBLEM_TEXT[problem] ?? (() => `Commander, the ${station.name} has a problem.`))(station);
}
