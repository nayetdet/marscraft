// @ts-nocheck
import { Battery } from '../mission/energy.ts';

// O que as estacoes da base (StationSystem, Airlock, academia, StationPanel) leem da missao:
// a bateria (a mesma do MissionSystem em src/mission/), o objetivo atual da historia e a luz
// da estufa. A energia, as tempestades e a radiacao em si moram em src/mission/MissionSystem.js.
export class ExpeditionState {
  constructor(battery = new Battery()) {
    this.battery = battery;
    // Objetivo atual da historia (src/story/StoryDirector.js), mostrado no computador da base
    this.objective = '';
    this.greenhousePowered = false;
  }

  get energy() {
    return this.battery.charge;
  }

  set energy(value) {
    this.battery.charge = Math.min(this.battery.capacity, Math.max(0, value));
  }

  // Tudo ou nada: so gasta se a bateria tiver o valor inteiro
  spend(amount) {
    return this.battery.spend(amount);
  }
}
