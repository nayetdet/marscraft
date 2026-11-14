import { STATION_CONFIG as C } from '../config/constants.js';

// All times, costs and penalties are scaled for gameplay.
export class StationSystem {
  constructor(mission) {
    this.mission = mission;
    this.filter = 100;
    this.co2 = 0;
    this.fitness = 100;
    this.boneDensity = 100;
    this.muscleStrength = 100;
    this.workoutCount = 0;
    this.dirtySuit = false;
    this.contaminated = false;
    this.science = 0;
    this.samples = 0;
    this.upgraded = false;
    this.toolUpgraded = false;
    this.analyzedSamples = 0;
    this.mavSent = false;
    this.messageKind = null;
    this.freshFood = C.FRESH_FOOD_DURATION;
    this.crop = null;
    this.messageTimer = 0;
    this.message = 'No transmission pending.';
    this.wasInside = false;
  }
  update(dt, inside, survival, outside = !inside) {
    if (outside) this.dirtySuit = true;
    if (inside && !this.wasInside && this.dirtySuit) this.contaminated = true;
    this.wasInside = inside;
    this.filter = Math.max(0, this.filter - C.FILTER_DECAY * dt);
    this.co2 = Math.max(0, Math.min(100, this.co2 + (this.filter <= 0 || this.mission.energy <= 0 ? C.CO2_RISE : -C.CO2_CLEAR) * dt));
    this.freshFood = Math.max(0, this.freshFood - dt);
    this.boneDensity = Math.max(0, this.boneDensity - C.FITNESS_DECAY * 1.15 * dt);
    this.muscleStrength = Math.max(0, this.muscleStrength - C.FITNESS_DECAY * dt);
    this.fitness = Math.max(0, this.fitness - C.FITNESS_DECAY * dt);
    if (this.crop && this.mission.greenhousePowered && !this.contaminated) this.crop.progress = Math.min(C.CROP_GROWTH_TIME, this.crop.progress + dt);
    if (inside && (this.contaminated || this.co2 >= 80)) survival.health = Math.max(0, survival.health - C.DUST_DAMAGE * dt);
    if (this.messageTimer > 0) {
      this.messageTimer = Math.max(0, this.messageTimer - dt);
      if (!this.messageTimer) {
        if (this.messageKind === 'mav') { this.mavSent = true; this.message = 'Mission Control: MAV science package received.'; }
        else this.message = 'Mission Control: message received. Use the storm shelter when a solar storm comes.';
        this.messageKind = null;
      }
    }
  }
  cleanSuit() {
    if (!this.dirtySuit) return 'Suit is already clean.';
    if (!this.mission.spend(C.DECONTAMINATION_COST)) return 'Not enough power.';
    this.dirtySuit = false;
    return 'Electrostatic cleaning complete. Enter the habitat.';
  }
  cleanBase() {
    if (!this.contaminated) return 'The habitat is clean.';
    if (!this.mission.spend(C.DECONTAMINATION_COST)) return 'Not enough power.';
    this.contaminated = false;
    return 'Habitat cleaning complete.';
  }
  replaceFilter() {
    if (this.filter >= 99) return 'Filter is still fresh.';
    if (!this.mission.spend(C.FILTER_COST)) return 'Not enough power.';
    this.filter = 100;
    return 'CO2 filter replaced.';
  }
  exercise(mode = 'treadmill') {
    if (!this.mission.spend(C.EXERCISE_COST)) return 'Not enough power.';
    this.workoutCount++;
    if (mode === 'bike') {
      this.muscleStrength = Math.min(100, this.muscleStrength + 48);
      this.boneDensity = Math.min(100, this.boneDensity + 26);
      this.fitness = Math.min(100, this.fitness + 40);
      return 'Cycle ergometer workout complete! Leg muscles and cardio stamina restored.';
    }
    this.boneDensity = Math.min(100, this.boneDensity + 48);
    this.muscleStrength = Math.min(100, this.muscleStrength + 28);
    this.fitness = Math.min(100, this.fitness + 40);
    return 'Space treadmill workout complete! Harness impact boosted bone density.';
  }
  treat(survival) {
    if (!this.mission.spend(C.TREATMENT_COST)) return 'Not enough power.';
    survival.health = Math.min(survival.maxStat, survival.health + 5);
    return 'Treatment restored health. Radiation dose cannot be erased.';
  }
  send() {
    if (this.messageTimer > 0) return 'Transmission already in progress.';
    if (!this.mission.spend(C.COMMS_COST)) return 'Not enough power.';
    this.messageTimer = C.COMMS_DELAY;
    this.messageKind = 'message';
    this.message = 'Transmission in progress; delay is accelerated for play.';
    return this.message;
  }
  plant(type, survival) {
    if (!['potato', 'lettuce', 'soy'].includes(type)) return 'Unknown crop.';
    if (this.crop) return 'Harvest the current crop first.';
    if (survival.water < C.CROP_WATER_COST) return 'Not enough water.';
    if (!this.mission.spend(C.CROP_ENERGY_COST)) return 'Not enough power.';
    survival.water -= C.CROP_WATER_COST;
    this.crop = { type, progress: 0 };
    return `Planted ${type}. Growth needs power and a clean greenhouse.`;
  }
  harvest(survival) {
    if (!this.crop || this.crop.progress < C.CROP_GROWTH_TIME) return 'The crop is not ready.';
    const type = this.crop.type;
    this.crop = null;
    this.freshFood = C.FRESH_FOOD_DURATION;
    survival.food = Math.min(survival.maxStat, survival.food + C.CROP_NUTRITION);
    return `Harvested ${type}. Fresh food restores nutrition and work speed.`;
  }
  sendMav() {
    if (this.mavSent) return 'MAV science package already received.';
    if (this.messageTimer > 0) return 'Transmission already in progress.';
    if (this.analyzedSamples < C.MAV_REQUIRED_SAMPLES) return `Analyze ${C.MAV_REQUIRED_SAMPLES} samples first.`;
    if (!this.mission.spend(C.MAV_TRANSMISSION_COST)) return 'Not enough power.';
    this.messageKind = 'mav';
    this.messageTimer = C.COMMS_DELAY;
    this.message = 'MAV data package in transit; game delay is accelerated.';
    return this.message;
  }
  upgradeTool() {
    if (this.toolUpgraded) return 'Tool upgrade already installed.';
    if (this.science < C.TOOL_UPGRADE_COST) return 'Not enough science points.';
    this.science -= C.TOOL_UPGRADE_COST;
    this.toolUpgraded = true;
    return 'Tool upgraded: collecting blocks is faster.';
  }
  upgrade() {
    if (this.upgraded) return 'Suit upgrade already installed.';
    if (this.science < C.UPGRADE_COST) return 'Not enough science points.';
    this.science -= C.UPGRADE_COST;
    this.upgraded = true;
    return 'Suit upgrade installed: outdoor radiation is reduced.';
  }
}
