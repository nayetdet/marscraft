import { CREW_CONFIG, STATION_CONFIG } from '../config/constants.js';

// Estoque compartilhado da base visto pela tripulacao. A agua e a irrigacao vivem no
// SurvivalSystem (PR #41) e a energia na bateria da missao (PR #44); comida e agua cinza
// da tripulacao ficam aqui. Tambem expoe o estado do comandante para a enfermaria.
export function createBaseStock({ survival, mission }) {
  return {
    battery: mission.battery,
    get water() { return survival.baseWater; },
    set water(liters) { survival.baseWater = liters; },
    get maxWater() { return survival.maxBaseWater; },
    get hydration() { return survival.greenhouseHydration; },
    food: CREW_CONFIG.START_FOOD,
    maxFood: CREW_CONFIG.MAX_FOOD,
    graywater: 0,
    // Modulo norte (issue #56): o motor atualiza a cada frame a partir do UtilityModule
    frozen: false,
    greenhouseDark: false,
    waterRecovery: STATION_CONFIG.WATER_RECOVERY,
    get playerDoseRate() { return mission.doseRate; },
    get playerHealth() { return survival.health; },
    playerHeal: 0,
  };
}
