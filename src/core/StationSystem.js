import { CROP_ITEM_IDS } from '../config/blockTypes.js';
import { STATION_CONFIG as C, CROP_CONFIG, WATER_SYSTEM_CONFIG, CREW_CONFIG } from '../config/constants.js';
import { GREENHOUSE_PLOTS } from '../world/greenhouseLayout.js';

const RADIO_SILENT = 'Radio silent: the Sun is between Mars and Earth (solar conjunction). You must decide on your own until it passes.';

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
    // Um cultivo por campo da estufa (GREENHOUSE_PLOTS). `crop` e o do campo selecionado no monitor.
    this.plots = GREENHOUSE_PLOTS.map(() => ({ crop: null }));
    this.selectedPlot = 0;
    // Algum campo parou de crescer por falta de agua no tanque da base
    this.cropsThirsty = false;
    this.harvestCount = 0;
    this.cropCollection = new Set();
    this.harvestBaskets = Object.fromEntries(Object.keys(CROP_CONFIG).map(type => [type, 0]));
    this.crewHarvestTimer = 0;
    this.discoveryIndex = -1;
    this.messageTimer = 0;
    this.message = 'No transmission pending.';
    this.wasInside = false;
  }
  get crop() {
    return this.plots[this.selectedPlot].crop;
  }
  set crop(value) {
    this.plots[this.selectedPlot].crop = value;
  }
  selectPlot(index) {
    if (this.plots[index]) this.selectedPlot = index;
  }
  // Agua (litros do tanque da base, bebidos enquanto a planta cresce) e energia (% de bateria,
  // ao plantar) de `type` no campo: a receita vezes o tamanho do campo
  plotCost(type, plotIndex = this.selectedPlot) {
    const size = GREENHOUSE_PLOTS[plotIndex].yield;
    return { water: CROP_CONFIG[type].water * size, energy: CROP_CONFIG[type].energy * size, items: size };
  }
  hasGrowingCrops() {
    return this.plots.some(({ crop }) => crop && crop.progress < CROP_CONFIG[crop.type].seconds);
  }
  readyPlotCount() {
    return this.plots.filter(({ crop }) => crop && crop.progress >= CROP_CONFIG[crop.type].seconds).length;
  }
  plantedPlotCount() {
    return this.plots.filter(({ crop }) => crop).length;
  }
  // Todos os campos crescem juntos (quem chama ja checou energia e poeira). A planta bebe do
  // tanque da base (`tank.baseWater`) so enquanto cresce, e a maior parte dessa agua volta pelo
  // ar e vira agua cinza (`tank.graywater`); o resto fica na comida. Com o tanque vazio o campo
  // para de crescer ate a agua voltar.
  growCrops(dt, tank) {
    this.cropsThirsty = false;
    this.plots.forEach(({ crop }, index) => {
      if (!crop) return;
      const recipe = CROP_CONFIG[crop.type];
      const seconds = Math.min(dt, recipe.seconds - crop.progress);
      if (seconds <= 0) return;
      const need = this.plotCost(crop.type, index).water * (seconds / recipe.seconds);
      const drunk = Math.min(need, Math.max(0, tank.baseWater));
      if (drunk + 1e-9 < need) this.cropsThirsty = true;
      if (drunk <= 0) return;
      tank.baseWater -= drunk;
      tank.graywater += drunk * WATER_SYSTEM_CONFIG.CROP_WATER_RETURN;
      const progress = crop.progress + seconds * (drunk / need);
      crop.progress = progress >= recipe.seconds - 1e-9 ? recipe.seconds : progress;
    });
  }
  update(dt, inside, survival, outside = !inside) {
    if (outside) this.dirtySuit = true;
    if (inside && !this.wasInside && this.dirtySuit) this.contaminated = true;
    this.wasInside = inside;
    this.filter = Math.max(0, this.filter - C.FILTER_DECAY * dt);
    // O lavador de CO2 e suporte de vida: com a bateria vazia o RTG ainda o mantem ligado (issue #85)
    this.co2 = Math.max(0, Math.min(100, this.co2 + (this.filter <= 0 ? C.CO2_RISE : -C.CO2_CLEAR) * dt));
    this.freshFood = Math.max(0, this.freshFood - dt);
    this.boneDensity = Math.max(0, this.boneDensity - C.FITNESS_DECAY * 1.15 * dt);
    this.muscleStrength = Math.max(0, this.muscleStrength - C.FITNESS_DECAY * dt);
    this.fitness = Math.max(0, this.fitness - C.FITNESS_DECAY * dt);
    if (this.mission.greenhousePowered && !this.contaminated) this.growCrops(dt, survival);
    else this.cropsThirsty = false; // parado por luz ou poeira, nao por sede
    if (inside && (this.contaminated || this.co2 >= 80)) {
      // Com o RTG (issue #85) o CO2 so sobe com o filtro cheio, nunca por falta de bateria
      if (typeof survival?.takeDamage === 'function') {
        survival.takeDamage(C.DUST_DAMAGE * dt, 'BIOLOGICAL_COLLAPSE', this.contaminated ? 'contaminated-air' : 'bad-base-air');
      } else if (survival) {
        survival.health = Math.max(0, survival.health - C.DUST_DAMAGE * dt);
      }
    }
    if (this.messageTimer > 0) {
      this.messageTimer = Math.max(0, this.messageTimer - dt);
      if (!this.messageTimer) {
        if (this.messageKind === 'mav') { this.mavSent = true; this.message = 'Mission Control: MAV science package received.'; }
        else this.message = `Mission Control: ${this.pendingAdvice ?? 'message received. Use the storm shelter when a solar storm comes.'}`;
        this.arrived = this.message; // o motor mostra um aviso e limpa
        this.pendingAdvice = null;
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
  // Pergunta ao Controle da Missao. `delaySeconds` = ida e volta da luz (CommsLink);
  // `advice` = resposta calculada com a situacao de AGORA, que chega atrasada.
  send({ delaySeconds = C.COMMS_DELAY, blackout = false, advice = null } = {}) {
    if (blackout) return RADIO_SILENT;
    if (this.messageTimer > 0) return 'Transmission already in progress.';
    if (!this.mission.spend(C.COMMS_COST)) return 'Not enough power.';
    this.messageTimer = delaySeconds;
    this.messageKind = 'message';
    this.pendingAdvice = advice;
    this.message = `Question sent. The answer needs about ${Math.round(delaySeconds)} s (game time) to come back.`;
    return this.message;
  }
  plant(type, survival, plotIndex = this.selectedPlot) {
    if (!Object.hasOwn(CROP_CONFIG, type)) return 'Unknown crop.';
    const plot = this.plots[plotIndex];
    if (!plot) return 'Unknown field.';
    if (plot.crop) return 'Harvest the current crop first.';
    const cost = this.plotCost(type, plotIndex);
    // A agua sai do tanque da base, nao da sede do jogador (issue #101)
    if (survival.baseWater < cost.water) return 'Not enough water in the base tank.';
    if (!this.mission.spend(cost.energy)) return 'Not enough power.';
    plot.crop = { type, progress: 0 };
    return `Planted ${type}. It drinks ${cost.water} L from the base tank while it grows, and needs light and a clean greenhouse.`;
  }
  harvest(survival, spawnDrop, plotIndex = this.selectedPlot) {
    const plot = this.plots[plotIndex];
    const crop = plot?.crop;
    if (!crop || crop.progress < CROP_CONFIG[crop.type].seconds) return 'The crop is not ready.';
    const type = crop.type;
    const id = CROP_ITEM_IDS[type];
    const items = GREENHOUSE_PLOTS[plotIndex].yield;
    if (spawnDrop) {
      for (let i = 0; i < items; i++) spawnDrop(id, i);
    } else {
      if (!survival.addBlockToInventory(id)) return 'Inventory is full. Make room before harvesting.';
      for (let i = 1; i < items; i++) survival.addBlockToInventory(id);
    }
    this.harvestCount++;
    this.cropCollection.add(type);
    this.discoveryIndex++;
    plot.crop = null;
    this.freshFood = C.FRESH_FOOD_DURATION;

    return `Harvested ${type}. Pick up your harvest and use it to eat. A real NASA study is now in your field notebook!`;
  }
  updateCrewHarvest(dt, workerPresent) {
    if (!workerPresent) { this.crewHarvestTimer = 0; return; }
    this.crewHarvestTimer += dt;
    while (this.crewHarvestTimer >= CREW_CONFIG.GREENHOUSE_HARVEST_INTERVAL) {
      this.crewHarvestTimer -= CREW_CONFIG.GREENHOUSE_HARVEST_INTERVAL;
      const index = this.plots.findIndex(({ crop }) => crop && crop.progress >= CROP_CONFIG[crop.type].seconds);
      if (index < 0) continue;
      const type = this.plots[index].crop.type;
      this.harvest(null, () => { this.harvestBaskets[type]++; }, index);
    }
  }
  collectBasket(type, survival) {
    if (!Object.hasOwn(this.harvestBaskets, type)) return 'Unknown basket.';
    let collected = 0;
    while (this.harvestBaskets[type] > 0 && survival.addBlockToInventory(CROP_ITEM_IDS[type])) {
      this.harvestBaskets[type]--;
      collected++;
    }
    if (!collected) return this.harvestBaskets[type] ? 'Inventory full. Make room to collect the harvest.' : `The ${type} basket is empty.`;
    return `Collected ${collected} ${type}.${this.harvestBaskets[type] ? ' The rest is in the basket.' : ''}`;
  }
  sendMav({ delaySeconds = C.COMMS_DELAY, blackout = false } = {}) {
    if (this.mavSent) return 'MAV science package already received.';
    if (blackout) return RADIO_SILENT;
    if (this.messageTimer > 0) return 'Transmission already in progress.';
    if (this.analyzedSamples < C.MAV_REQUIRED_SAMPLES) return `Analyze ${C.MAV_REQUIRED_SAMPLES} samples first.`;
    if (!this.mission.spend(C.MAV_TRANSMISSION_COST)) return 'Not enough power.';
    this.messageKind = 'mav';
    this.messageTimer = delaySeconds;
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
