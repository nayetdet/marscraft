import {
  BLOCK_IDS,
} from '../config/blockTypes.js';
import {
  MAV_CONFIG,
  MISSION_CONFIG,
  OXYGEN_PLANT_CONFIG as O,
  SURVIVAL_CONFIG,
} from '../config/constants.js';

// Gerador de O2 da base com dois modos reais e custos opostos (issue #102).
// Sem DOM nem Three.js, para testar com Vitest. O mesmo modo vale para o ar do jogador
// (MissionSystem) e para o ar da tripulacao (CrewManager).
//   electrolysis: parte a agua (2 H2O -> 2 H2 + O2). Pouca energia, gasta agua do tanque.
//   moxie: tira o O2 do CO2 do ar de Marte. Nao gasta agua, gasta muito mais energia.

export const OXYGEN_MODES = ['electrolysis', 'moxie'];

export const OXYGEN_MODE_INFO = {
  electrolysis: {
    label: 'Air from water',
    machine: 'OGA electrolysis',
    screen: 'FROM WATER',
    powerLabel: 'Crew air: water',
    kid: 'Water is made of oxygen and hydrogen. This machine splits it so you can breathe the oxygen.',
    energyFactor: O.ELECTROLYSIS_ENERGY_FACTOR,
  },
  moxie: {
    label: 'Air from Mars air',
    machine: 'MOXIE',
    screen: 'FROM MARS AIR',
    powerLabel: 'Crew air: Mars air',
    kid: 'This machine pulls oxygen out of Mars air. It needs no water, but a lot of power.',
    energyFactor: O.MOXIE_ENERGY_FACTOR,
  },
};

// Converte pontos de O2 do jogo em kg: um sol inteiro respirando la fora = 0,84 kg (NASA BVAD)
export function oxygenPointsToKg(points) {
  const secondsPerSol = 24 / MISSION_CONFIG.GAME_HOURS_PER_SECOND;
  const pointsPerSol = SURVIVAL_CONFIG.OXYGEN_DRAIN_RATE * secondsPerSol;
  return (points / pointsPerSol) * MAV_CONFIG.OXYGEN_KG_PER_DAY;
}

// Litros de agua que a eletrolise parte para fazer `kg` de O2 (36 g de agua -> 32 g de O2)
export function electrolysisWaterL(kgO2) {
  return kgO2 * O.WATER_KG_PER_O2_KG;
}

// Litros de agua por pessoa por sol de ar feito por eletrolise (~0,945 L)
export const ELECTROLYSIS_WATER_L_PER_PERSON_SOL = electrolysisWaterL(O.O2_KG_PER_PERSON_DAY);

// O modo escolhido esta gastando o recurso que esta acabando? Devolve o problema da estacao de O2
// ('air-water-low' ou 'air-power-low') ou null. `plant` ausente = sem aviso.
export function oxygenModeWarning(plant, { water, batteryPct }) {
  if (!plant) return null;
  if (plant.mode === 'electrolysis' && water < O.LOW_WATER_WARN_L) return 'air-water-low';
  if (plant.mode === 'moxie' && batteryPct < O.LOW_BATTERY_WARN_PCT) return 'air-power-low';
  return null;
}

export class OxygenPlant {
  constructor(mode = 'electrolysis') {
    this.mode = OXYGEN_MODES.includes(mode) ? mode : 'electrolysis';
    this.sabatier = false; // reator de Sabatier montado (devolve parte da agua)
    this.waterUsedL = 0; // agua que a eletrolise ja tirou do tanque (liquido, depois do Sabatier)
    this.oxygenKg = 0; // O2 feito pelo gerador (jogador + tripulacao)
    // Por que o ar do jogador parou: 'power' (bateria vazia), 'water' (tanque vazio) ou null
    this.limitedBy = null;
  }

  get info() {
    return OXYGEN_MODE_INFO[this.mode];
  }

  get usesWater() {
    return this.mode === 'electrolysis';
  }

  // Multiplica o custo de energia do O2 (jogador e tripulacao)
  get energyFactor() {
    return this.info.energyFactor;
  }

  // Fracao da agua da eletrolise que fica perdida (o Sabatier devolve o resto)
  get waterLossFraction() {
    return this.sabatier ? 1 - O.SABATIER_WATER_RETURN : 1;
  }

  // Litros de agua por ponto de O2 do jogador (0 no MOXIE)
  waterPerPoint() {
    if (!this.usesWater) return 0;
    return electrolysisWaterL(oxygenPointsToKg(1)) * this.waterLossFraction;
  }

  // Litros de agua por hora de jogo para o ar de `people` tripulantes (0 no MOXIE)
  crewWaterPerHour(people = 1) {
    if (!this.usesWater) return 0;
    return (people * ELECTROLYSIS_WATER_L_PER_PERSON_SOL / 24) * this.waterLossFraction;
  }

  setMode(mode) {
    if (!OXYGEN_MODES.includes(mode)) return '';
    if (mode === this.mode) return `The oxygen machine is already on ${this.info.label}.`;
    this.mode = mode;
    return mode === 'moxie'
      ? 'Oxygen machine: AIR FROM MARS AIR (MOXIE). The water tank is safe, but each breath costs more power.'
      : 'Oxygen machine: AIR FROM WATER (electrolysis). Cheap on power, but it uses water from the base tank.';
  }

  // Pontos de O2 que a bateria e o tanque conseguem pagar agora.
  // `powerBudget` = pontos que a bateria paga; `tank` = { water } (null = ignora a agua).
  refillBudget(powerBudget, tank = null) {
    const perPoint = tank ? this.waterPerPoint() : 0;
    const waterBudget = perPoint > 0 ? Math.max(0, tank.water) / perPoint : Infinity;
    if (powerBudget <= 0) this.limitedBy = 'power';
    else if (waterBudget <= 0) this.limitedBy = 'water';
    else this.limitedBy = null;
    return Math.max(0, Math.min(powerBudget, waterBudget));
  }

  // Tira do tanque a agua de `points` pontos de O2 do jogador
  useWaterForPoints(points, tank) {
    this.oxygenKg += oxygenPointsToKg(points);
    if (!tank) return 0;
    return this._takeWater(points * this.waterPerPoint(), tank);
  }

  // Ar de `personHours` (tripulantes x horas) para a tripulacao. `energyPerPersonHour` ja inclui
  // filtros gastos e o ritmo do primeiro sol. Devolve true se o ar saiu inteiro.
  supplyCrew(personHours, energyPerPersonHour, base) {
    if (personHours <= 0) return true;
    const waterNeed = this.crewWaterPerHour(personHours);
    // Sem agua suficiente a eletrolise so faz a parte que da, e so gasta energia por essa parte
    const share = waterNeed > 0 ? Math.min(1, Math.max(0, base.water) / waterNeed) : 1;
    const energyNeed = energyPerPersonHour * this.energyFactor * personHours * share;
    // O RTG paga o ar antes da bateria (issue #85)
    const gotEnergy = base.battery.drainLifeSupport ? base.battery.drainLifeSupport(energyNeed) : base.battery.drain(energyNeed);
    const powered = energyNeed > 0 ? gotEnergy / energyNeed : 1;
    const made = share * powered;
    this._takeWater(waterNeed * made, base);
    this.oxygenKg += (personHours / 24) * O.O2_KG_PER_PERSON_DAY * made;
    return made > 1 - 1e-6;
  }

  // Monta o reator de Sabatier com regolito (impressora 3D) e energia. `inventory` tem
  // countItem/removeItems (SurvivalSystem).
  buildSabatier({ battery, inventory }) {
    if (this.sabatier) return 'The Sabatier reactor is already working.';
    if (inventory.countItem(BLOCK_IDS.REGOLITH) < O.SABATIER_REGOLITH) {
      return `Collect ${O.SABATIER_REGOLITH} regolith blocks outside to print the Sabatier reactor.`;
    }
    if (!battery.spend(O.SABATIER_POWER)) return 'Not enough power to print the Sabatier reactor.';
    inventory.removeItems(BLOCK_IDS.REGOLITH, O.SABATIER_REGOLITH);
    this.sabatier = true;
    return 'Sabatier reactor built! It mixes leftover hydrogen with the CO2 we breathe out and gives back half of the water.';
  }

  _takeWater(liters, tank) {
    const used = Math.min(Math.max(0, tank.water), Math.max(0, liters));
    tank.water -= used;
    this.waterUsedL += used;
    return used;
  }
}
