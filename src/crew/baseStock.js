import { CREW_CONFIG, STATION_CONFIG } from '../config/constants.js';

// Estoque compartilhado da base visto pela tripulacao. A agua limpa e a agua cinza vivem no
// SurvivalSystem (um tanque so para jogador, tripulacao e plantas) e a energia na bateria da
// missao; a comida da despensa fica aqui. Tambem expoe o estado do comandante para a enfermaria.
export function createBaseStock({ survival, mission }) {
  return {
    battery: mission.battery,
    get water() { return survival.baseWater; },
    set water(liters) { survival.baseWater = liters; },
    get maxWater() { return survival.maxBaseWater; },
    food: CREW_CONFIG.START_FOOD,
    maxFood: CREW_CONFIG.MAX_FOOD,
    get graywater() { return survival.graywater; },
    set graywater(liters) { survival.graywater = liters; },
    // Modulo norte (issue #56): o motor atualiza a cada frame a partir do UtilityModule
    frozen: false,
    greenhouseDark: false,
    waterRecovery: STATION_CONFIG.WATER_RECOVERY,
    // Ritmo (issue #81): fracao do consumo passivo normal; o motor atualiza a cada frame
    demandFactor: 1,
    get playerDoseRate() { return mission.doseRate; },
    get playerHealth() { return survival.health; },
    playerHeal: 0,
  };
}
