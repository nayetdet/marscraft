import { MISSION_CONFIG as C } from '../config/constants.js';
import { RESEARCH_DATA } from '../data/missionResearch.js';

// Rates and timings are game-scaled, not scientific measurements.
export class MissionSystem {
  constructor() {
    this.energy = C.START_ENERGY;
    this.radiation = 0;
    this.elapsed = 0;
    // Objetivo atual da historia (src/story/StoryDirector.js), mostrado no computador da base
    this.objective = '';
    this.greenhousePowered = false;
  }
  spend(amount) {
    if (this.energy < amount) return false;
    this.energy -= amount;
    return true;
  }
  update(dt, hour, inside, oxygenNeedsRefill) {
    const sunlight = Math.max(0, Math.sin((hour - 6) * Math.PI / 12));
    this.energy = Math.min(C.MAX_ENERGY, this.energy + sunlight * C.SOLAR_RATE * dt);
    this.greenhousePowered = this.energy >= C.GREENHOUSE_RATE * dt;
    if (this.greenhousePowered) this.energy -= C.GREENHOUSE_RATE * dt;
    const refill = inside && oxygenNeedsRefill && this.spend(C.OXYGEN_ENERGY_RATE * dt);
    this.elapsed += dt;
    const phase = this.elapsed % C.STORM_INTERVAL;
    const storm = phase >= C.STORM_INTERVAL - C.STORM_DURATION;
    const warning = !storm && phase >= C.STORM_INTERVAL - C.STORM_DURATION - C.STORM_WARNING;
    if (!inside) this.radiation = Math.min(100, this.radiation + (storm ? C.STORM_RADIATION_RATE * RESEARCH_DATA.cme.speedKmS / 894 : C.RADIATION_RATE * RESEARCH_DATA.radiation.median / 6.929) * dt);
    return { refill, storm, warning };
  }
}
