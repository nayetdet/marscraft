import { BLOCK_IDS } from '../config/blockTypes.js';
import { CREW_CONFIG, ENERGY_CONFIG, MISSION_CONFIG, STATION_CONFIG, UTILITY_CONFIG as U } from '../config/constants.js';

// Regras do modulo norte (issue #56, parte B). Sem DOM nem Three.js, para testar com Vitest.
// Nenhuma acao e de graca: tudo cobra energia, agua, comida da despensa ou regolito.
//   B1/B2 energia e aquecimento: aquecedor, luz da estufa e corte de carga
//   B3 cozinha: racao (acaba, e a tripulacao come da mesma despensa) x refeicao fresca
//   B4 banheiro: lavar e cozinhar viram agua cinza; o filtro do processador se gasta
//   B5 oficina: impressora 3D usa regolito para consertar estacoes
export class UtilityModule {
  constructor({ mission, survival, stations, base }) {
    this.mission = mission; // MissionSystem (bateria, escudo, fabrica)
    this.survival = survival; // jogador, agua da base, inventario
    this.stations = stations; // StationSystem (filtro de CO2, comida fresca)
    this.base = base; // estoque da tripulacao (racoes, agua cinza)
    this.heaterOn = true;
    this.greenhouseLightsOn = true;
    this.waterFilter = 100;
    this.cold = false; // aquecedor desligado de noite: canos e estufa congelam
    this.heaterDrawPerHour = 0;
  }

  get isNight() {
    return this.mission.chargeRate <= 0;
  }

  // Taxa real de recuperacao de agua: 98 % com filtro bom, menos com filtro gasto
  get waterRecovery() {
    return STATION_CONFIG.WATER_RECOVERY * (this.waterFilter < U.WORN_FILTER ? U.WORN_RECOVERY : 1);
  }

  update(hours) {
    if (hours <= 0) return;
    this.waterFilter = Math.max(0, this.waterFilter - U.FILTER_WEAR_PER_HOUR * hours);
    this.heaterDrawPerHour = 0;
    if (this.heaterOn) {
      const rate = this.isNight ? U.HEATER_NIGHT_PER_HOUR : U.HEATER_DAY_PER_HOUR;
      const need = rate * hours;
      const got = this.mission.battery.drain(need);
      this.heaterDrawPerHour = rate;
      // Bateria vazia: o aquecedor para mesmo ligado
      this.cold = this.isNight && got + 1e-9 < need;
    } else {
      this.cold = this.isNight;
    }
  }

  toggle(system) {
    if (system === 'heater') {
      this.heaterOn = !this.heaterOn;
      return this.heaterOn ? 'Heater ON: pipes and plants stay warm. Uses power, more at night.' : 'Heater OFF: saves power, but at night the water pipes and the greenhouse freeze.';
    }
    if (system === 'lights') {
      this.greenhouseLightsOn = !this.greenhouseLightsOn;
      return this.greenhouseLightsOn ? 'Greenhouse lights ON: plants grow again.' : 'Greenhouse lights OFF: saves power, but the plants stop growing.';
    }
    if (system === 'factory') {
      this.mission.factoryOn = !this.mission.factoryOn;
      return this.mission.factoryOn ? 'Fuel factory ON: turns ice into rocket fuel. Uses a lot of power.' : 'Fuel factory OFF: saves power, but the rocket stops filling.';
    }
    if (system === 'shield') {
      if (!this.mission.toggleShield()) return 'The battery is empty: the shield cannot turn on.';
      return this.mission.shieldOn ? 'Radiation shield ON.' : 'Radiation shield OFF.';
    }
    return '';
  }

  // % de bateria que a luz da estufa gasta em `seconds` segundos reais. E o unico lugar que
  // converte a taxa por hora de jogo para o relogio real (MISSION_CONFIG.GAME_HOURS_PER_SECOND).
  greenhouseLightsCost(seconds) {
    return U.GREENHOUSE_LIGHTS_PER_HOUR * seconds * MISSION_CONFIG.GAME_HOURS_PER_SECOND;
  }

  // Lista de consumidores em % de bateria por hora de jogo, para o painel de distribuicao
  loads({ crewSize = 0, operatingStations = 0 } = {}) {
    const m = this.mission;
    const factoryRunning = m.factoryOn && m.iceStock > 0 && m.propellant < 100;
    return [
      ['Crew oxygen', crewSize * CREW_CONFIG.OXYGEN_ENERGY_PER_HOUR, true],
      ['Crew at work', operatingStations * STATION_CONFIG.WORK_ENERGY_PER_HOUR, true],
      ['Greenhouse lights', U.GREENHOUSE_LIGHTS_PER_HOUR, this.greenhouseLightsOn],
      ['Heater', this.isNight ? U.HEATER_NIGHT_PER_HOUR : U.HEATER_DAY_PER_HOUR, this.heaterOn],
      ['Radiation shield', ENERGY_CONFIG.SHIELD_DRAIN_PER_HOUR, m.shieldOn],
      ['Fuel factory', factoryRunning ? ENERGY_CONFIG.ISRU_DRAIN_PER_HOUR : 0, m.factoryOn],
    ];
  }

  eatRation() {
    const s = this.survival;
    if (this.base.food < 1) return 'The pantry is empty! Grow food in the greenhouse.';
    if (s.food >= s.maxStat - 0.5) return 'You are not hungry.';
    this.base.food -= 1;
    s.food = Math.min(s.maxStat, s.food + U.RATION_FOOD);
    return `Ate a packaged ration. ${Math.floor(this.base.food)} left for the whole crew.`;
  }

  cookMeal() {
    const s = this.survival;
    if (s.countItem(BLOCK_IDS.HYDRO_PLANT) < 1) return 'You need a carrot from the greenhouse to cook.';
    if (s.baseWater < U.MEAL_WATER_L) return 'Not enough water in the base tank.';
    if (this.cold) return 'The kitchen water is frozen. Turn the heater on.';
    if (!this.mission.battery.spend(U.MEAL_POWER)) return 'Not enough power to cook.';
    s.removeItems(BLOCK_IDS.HYDRO_PLANT, 1);
    s.baseWater -= U.MEAL_WATER_L;
    this.base.graywater += U.MEAL_WATER_L;
    s.food = s.maxStat;
    s.health = Math.min(s.maxStat, s.health + U.MEAL_HEAL);
    this.stations.freshFood = STATION_CONFIG.FRESH_FOOD_DURATION;
    return 'Cooked a fresh meal: full and healthy, and you work faster for a while!';
  }

  washUp() {
    const s = this.survival;
    if (this.cold) return 'The pipes are frozen. Turn the heater on.';
    if (s.baseWater < U.WASH_WATER_L) return 'Not enough water in the base tank.';
    s.baseWater -= U.WASH_WATER_L;
    this.base.graywater += U.WASH_WATER_L;
    s.health = Math.min(s.maxStat, s.health + U.WASH_HEAL);
    return `Washed up. ${U.WASH_WATER_L} L went to the gray water tank: the recycler will clean it to drink again.`;
  }

  serviceFilter() {
    if (this.waterFilter >= 95) return 'The water filter is still fresh.';
    if (!this.mission.battery.spend(U.FILTER_SERVICE_POWER)) return 'Not enough power.';
    this.waterFilter = 100;
    return 'Water filter cleaned: the recycler gets back 98% of the water again.';
  }

  // Conserta a estacao da tripulacao mais gasta (ou o filtro de CO2, se nao houver tripulacao)
  printPart(crewStations = []) {
    const s = this.survival;
    const worst = crewStations.reduce((a, b) => (!a || b.health < a.health ? b : a), null);
    const needsFix = (worst && worst.health < 0.95) || this.stations.filter < 95;
    if (!needsFix) return 'Nothing is broken right now.';
    if (s.countItem(BLOCK_IDS.REGOLITH) < U.PRINT_REGOLITH) return `Collect ${U.PRINT_REGOLITH} regolith blocks outside to print a part.`;
    if (!this.mission.battery.spend(U.PRINT_POWER)) return 'Not enough power to print.';
    s.removeItems(BLOCK_IDS.REGOLITH, U.PRINT_REGOLITH);
    if (worst && worst.health < 0.95) {
      worst.health = 1;
      return `Printed a spare part from regolith: the ${worst.name} is fixed!`;
    }
    this.stations.filter = 100;
    return 'Printed a new CO2 filter frame from regolith!';
  }
}
