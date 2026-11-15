// @ts-nocheck
import { BLOCK_IDS, HOTBAR_BLOCKS, ITEM_DEFINITIONS } from '../config/blockTypes.ts';
import { SURVIVAL_CONFIG, WATER_SYSTEM_CONFIG } from '../config/constants.ts';
import { isInsidePressurizedVolume } from '../world/habitatLayout.ts';

export class SurvivalSystem {
  constructor() {
    this.maxStat = SURVIVAL_CONFIG.MAX_STAT;
    this.resetStats();
    this.resetInventory();
  }

  resetStats() {
    this.health = this.maxStat;
    this.oxygen = this.maxStat;
    this.suitEquipped = true;
    this.suitThermal = 100;
    this.suitOxygen = 100;
    this.suitScrubber = 100;
    this.suitDust = 0;
    this.suitIntegrity = 100;
    this.suitO2DrainRate = SURVIVAL_CONFIG.SUIT_OXYGEN_DRAIN_PER_SECOND;
    this.suitO2Warned30 = false;
    this.suitWornWarned = false;
    this.baseOxygen = 100;
    this.baseBreached = false;
    this.water = this.maxStat;
    this.food = this.maxStat;
    this.isDead = false;
    this.deathCause = null;
    this.deathDetail = null;
    this.damageFeedbackCause = null;
    this.damageFeedbackDetail = null;
    this.damageFeedbackTime = 0;
    this.insidePressurizedShip = false;

    // Sistema de Água Potável e Irrigação da Base
    this.baseWater = WATER_SYSTEM_CONFIG.INITIAL_BASE_WATER;
    this.maxBaseWater = WATER_SYSTEM_CONFIG.MAX_BASE_WATER;
    // Agua usada (bebida, lavada, transpirada pelas plantas) esperando o reciclador da base
    this.graywater = 0;
  }

  get suitWear() {
    return Math.max(0, Math.min(100, 100 - this.suitIntegrity));
  }

  get isSuitProtectingO2() {
    return Boolean(this.suitEquipped && this.suitIntegrity > 0 && this.suitOxygen > 0);
  }

  resetInventory() {
    this.slots = HOTBAR_BLOCKS.slice(0, 9).map((b) => b.initialCount > 0 ? ({
      id: b.id,
      name: b.name,
      count: b.initialCount,
      consumable: b.consumable,
      equipment: b.equipment ?? false,
    }) : null);
    // The first nine inventory spaces are the hotbar; the rest are backpack slots.
    this.inventorySlots = [...this.slots, ...Array(27).fill(null)];
  }

  swapInventorySlots(fromIndex, toIndex) {
    if (fromIndex === toIndex) return this.inventorySlots;
    [this.inventorySlots[fromIndex], this.inventorySlots[toIndex]] = [
      this.inventorySlots[toIndex],
      this.inventorySlots[fromIndex],
    ];
    this.slots = this.inventorySlots.slice(0, 9);
    return this.inventorySlots;
  }

  isPlayerInsideShip(pos) {
    // Habitat, airlock, cupula, tunel e estufa, ajustados ao interior real da base.
    return isInsidePressurizedVolume(pos.x, pos.y, pos.z);
  }

  updateSuitThermal(dt, playerPos, outsideC, power) {
    if (this.isDead || dt <= 0) return;
    if (!this.suitEquipped) {
      const charge = Math.min(100 - this.suitThermal, SURVIVAL_CONFIG.SUIT_THERMAL_CHARGE_PER_SECOND * dt,
        power.energy / SURVIVAL_CONFIG.SUIT_THERMAL_ENERGY_PER_PERCENT);
      if (charge > 0 && power.spend(charge * SURVIVAL_CONFIG.SUIT_THERMAL_ENERGY_PER_PERCENT)) this.suitThermal += charge;
    } else if (!this.isPlayerInsideShip(playerPos)) {
      const cold = Math.max(0, (SURVIVAL_CONFIG.SUIT_THERMAL_COLD_REFERENCE_C - outsideC) / SURVIVAL_CONFIG.SUIT_THERMAL_COLD_RANGE_C);
      const rate = SURVIVAL_CONFIG.SUIT_THERMAL_DRAIN_PER_SECOND * Math.min(SURVIVAL_CONFIG.SUIT_THERMAL_MAX_COLD_MULTIPLIER, 1 + cold);
      const unprotected = Math.max(0, dt - this.suitThermal / rate);
      this.suitThermal = Math.max(0, this.suitThermal - rate * dt);
      if (unprotected > 0) this.takeDamage(unprotected * SURVIVAL_CONFIG.SUIT_THERMAL_DAMAGE_PER_SECOND, 'BIOLOGICAL_COLLAPSE', 'suit-cold');
    }
  }

  get isInDanger() {
    return (
      this.health <= SURVIVAL_CONFIG.DANGER_THRESHOLD ||
      this.oxygen <= SURVIVAL_CONFIG.DANGER_THRESHOLD ||
      this.water <= SURVIVAL_CONFIG.DANGER_THRESHOLD ||
      this.food <= SURVIVAL_CONFIG.DANGER_THRESHOLD
    );
  }

  // maxOxygenRefill: quanto O2 a bateria da base consegue pagar neste frame (sem energia = 0)
  update(dt, playerPos, maxOxygenRefill = Infinity, baseBreached = false, { isMoving = false } = {}) {
    this.lastOxygenRefilled = 0;
    this.damageFeedbackTime = Math.max(0, this.damageFeedbackTime - dt);
    if (this.isDead) return;

    this.insidePressurizedShip = this.isPlayerInsideShip(playerPos);
    this.baseBreached = baseBreached;
    if (baseBreached) {
      this.baseOxygen = Math.max(0, this.baseOxygen - SURVIVAL_CONFIG.BASE_OXYGEN_LEAK_RATE * dt);
    } else {
      // Base oxygen recovery consumes the same energy budget as the suit refill.
      const recovered = Math.min(100 - this.baseOxygen, SURVIVAL_CONFIG.BASE_OXYGEN_REFILL_RATE * dt, maxOxygenRefill * 100 / this.maxStat);
      this.baseOxygen += recovered;
      this.lastOxygenRefilled = recovered * this.maxStat / 100;
    }

    const pointsPerPct = this.maxStat / 100;
    if (this.insidePressurizedShip && !baseBreached) {
      const personalRefill = Math.max(0, Math.min(
        this.maxStat - this.oxygen,
        SURVIVAL_CONFIG.OXYGEN_REFILL_RATE * dt,
        Math.max(0, maxOxygenRefill - this.lastOxygenRefilled)
      ));
      this.lastOxygenRefilled += personalRefill;
      this.oxygen += personalRefill;

      const suitRefillPct = Math.max(0, Math.min(
        100 - this.suitOxygen,
        SURVIVAL_CONFIG.SUIT_OXYGEN_RECHARGE_PER_SECOND * dt,
        Math.max(0, maxOxygenRefill - this.lastOxygenRefilled) / pointsPerPct
      ));
      this.lastOxygenRefilled += suitRefillPct * pointsPerPct;
      this.suitOxygen += suitRefillPct;

      if (!this.suitEquipped) {
        this.suitScrubber = Math.min(100, this.suitScrubber + SURVIVAL_CONFIG.SUIT_SCRUBBER_CLEAN_PER_SECOND * dt);
      }

      if (this.suitOxygen > SURVIVAL_CONFIG.SUIT_OXYGEN_WARN_THRESHOLD + 5) {
        this.suitO2Warned30 = false;
      }
      this.suitO2DrainRate = SURVIVAL_CONFIG.SUIT_OXYGEN_DRAIN_PER_SECOND;
      this.oxygenNeedsPower = (this.oxygen < this.maxStat - 0.01 || this.suitOxygen < 99.9) && maxOxygenRefill <= 0;
    } else {
      this.oxygenNeedsPower = false;
      if (this.suitEquipped) {
        if (!this.insidePressurizedShip) {
          const dustRate = SURVIVAL_CONFIG.SUIT_DUST_ACCUM_PER_SECOND
            * (isMoving ? SURVIVAL_CONFIG.SUIT_DUST_MOVE_MULTIPLIER : 1);
          this.suitDust = Math.min(100, this.suitDust + dustRate * dt);

          this.suitScrubber = Math.max(0, this.suitScrubber - SURVIVAL_CONFIG.SUIT_SCRUBBER_DRAIN_PER_SECOND * dt);

          const dustWearFactor = 1 + (this.suitDust / 100) * (SURVIVAL_CONFIG.SUIT_WEAR_DUST_MULTIPLIER - 1);
          const wearRate = SURVIVAL_CONFIG.SUIT_WEAR_PER_SECOND * dustWearFactor;
          this.suitIntegrity = Math.max(0, this.suitIntegrity - wearRate * dt);
        }

        const scrubberLow = SURVIVAL_CONFIG.SUIT_SCRUBBER_LOW_THRESHOLD;
        const scrubberPenalty = this.suitScrubber < scrubberLow
          ? 1 + 0.5 * (1 - this.suitScrubber / scrubberLow)
          : 1;
        const baseSuitDrain = this.insidePressurizedShip && baseBreached
          ? SURVIVAL_CONFIG.BREACH_OXYGEN_DRAIN_RATE / pointsPerPct
          : SURVIVAL_CONFIG.SUIT_OXYGEN_DRAIN_PER_SECOND * scrubberPenalty;
        this.suitO2DrainRate = baseSuitDrain;

        const suitWasProtecting = this.isSuitProtectingO2;
        this.suitOxygen = Math.max(0, this.suitOxygen - baseSuitDrain * dt);

        // Minecraft-armor rule: while the EVA suit is intact and has suit O2, personal O2 is protected.
        // Once the suit wears out (0% integrity) or runs out of suit O2, personal O2 drains.
        if (!suitWasProtecting || this.suitIntegrity <= 0 || this.suitOxygen <= 0) {
          const personalDrain = this.insidePressurizedShip && baseBreached
            ? SURVIVAL_CONFIG.BREACH_OXYGEN_DRAIN_RATE
            : SURVIVAL_CONFIG.OXYGEN_DRAIN_RATE;
          this.oxygen = Math.max(0, this.oxygen - personalDrain * dt);
        }
      } else {
        this.suitO2DrainRate = SURVIVAL_CONFIG.SUIT_OXYGEN_DRAIN_PER_SECOND;
        const personalDrain = this.insidePressurizedShip
          ? SURVIVAL_CONFIG.NO_SUIT_BASE_OXYGEN_DRAIN_RATE
          : SURVIVAL_CONFIG.OXYGEN_DRAIN_RATE * SURVIVAL_CONFIG.SUIT_NO_SUIT_O2_DRAIN_MULTIPLIER;
        this.oxygen = Math.max(0, this.oxygen - personalDrain * dt);
      }
    }

    this.water = Math.max(0, this.water - SURVIVAL_CONFIG.WATER_DRAIN_RATE * dt);
    this.food = Math.max(0, this.food - SURVIVAL_CONFIG.FOOD_DRAIN_RATE * dt);

    // Regeneração natural se comida e água estiverem altas (estilo Minecraft)
    if (this.food >= 16 && this.water >= 12 && this.canHeal() && this.health < this.maxStat) {
      this.health = Math.min(this.maxStat, this.health + 0.35 * dt);
    }

    // Apply hazards separately so the one that removes the last health point is recorded.
    const damageSources = [];
    const noBreathableO2 = this.isSuitProtectingO2
      ? false
      : (this.insidePressurizedShip && !baseBreached ? this.baseOxygen <= 0 : this.oxygen <= 0);
    if (noBreathableO2) {
      damageSources.push({
        rate: SURVIVAL_CONFIG.STARVE_DAMAGE_RATE * 1.6,
        cause: this.oxygenNeedsPower ? 'POWER_FAILURE' : 'OXYGEN_DEPLETION',
        detail: this.oxygenNeedsPower ? 'life-support-power' : 'oxygen-depleted',
      });
    }
    if (this.water <= 0) {
      damageSources.push({ rate: SURVIVAL_CONFIG.STARVE_DAMAGE_RATE, cause: 'BIOLOGICAL_COLLAPSE', detail: 'water-depleted' });
    }
    if (this.food <= 0) {
      damageSources.push({ rate: SURVIVAL_CONFIG.STARVE_DAMAGE_RATE * 0.8, cause: 'BIOLOGICAL_COLLAPSE', detail: 'food-depleted' });
    }
    // A borda do mapa (parede de poeira) nao machuca (issue #103): o vento de Marte e fraco
    // demais para ferir alguem. O que limita a distancia e o ar do traje.

    for (const source of damageSources) this.takeDamage(source.rate * dt, source.cause, source.detail);
  }

  // Comida nao substitui ar: sem oxigenio suficiente, nada recupera vida.
  canHeal() {
    if (this.oxygen <= SURVIVAL_CONFIG.HEAL_MIN_OXYGEN) return false;
    if (this.insidePressurizedShip && !this.baseBreached) {
      return this.baseOxygen > 0;
    }
    if (this.isSuitProtectingO2) {
      return this.suitOxygen > (SURVIVAL_CONFIG.HEAL_MIN_OXYGEN / this.maxStat) * 100;
    }
    return true;
  }

  hasBreathableOxygen(points) {
    if (this.isSuitProtectingO2) {
      const pctCost = (points / this.maxStat) * 100;
      return this.suitOxygen > pctCost + 5;
    }
    return this.oxygen > points + 1;
  }

  spendBreathableOxygen(points) {
    if (this.isSuitProtectingO2) {
      const pctCost = (points / this.maxStat) * 100;
      this.suitOxygen = Math.max(0, this.suitOxygen - pctCost);
      return;
    }
    this.oxygen = Math.max(0, this.oxygen - points);
  }

  repairSuit(power = null) {
    if (this.suitIntegrity >= 99.5) {
      this.suitIntegrity = 100;
      this.suitWornWarned = false;
      return { ok: false, message: 'EVA suit integrity is already at 100%.' };
    }
    const cost = SURVIVAL_CONFIG.SUIT_REPAIR_POWER_COST;
    if (power && power.energy >= cost) {
      power.spend(cost);
      this.suitIntegrity = 100;
      this.suitWornWarned = false;
      return { ok: true, message: `EVA suit seals & armor repaired to 100% (-${cost}% power).` };
    }
    // Emergency patch if battery is too low so the player can never get softlocked inside.
    if (this.suitIntegrity <= 0) {
      this.suitIntegrity = 35;
      this.suitWornWarned = false;
      return { ok: true, message: 'Low power: applied emergency patch (35% integrity). Restore power for full repair.' };
    }
    return { ok: false, message: `Need ${cost}% base power for full suit repair.` };
  }

  cleanSuitDust(power = null) {
    if (this.suitDust < 1) {
      this.suitDust = 0;
      return { ok: false, message: 'EVA suit is already clean.' };
    }
    const cost = SURVIVAL_CONFIG.SUIT_CLEAN_POWER_COST;
    if (power && !power.spend(cost)) {
      return { ok: false, message: `Need ${cost}% base power for electrostatic cleaning.` };
    }
    this.suitDust = 0;
    return { ok: true, message: 'Electrostatic perchlorate cleaning complete (0% dust).' };
  }

  // Fome e sede gastas fora do relogio real do quadro (horas de jogo dormindo, issue #109)
  spendNeeds(food, water) {
    if (this.isDead) return;
    this.food = Math.max(0, this.food - Math.max(0, food));
    this.water = Math.max(0, this.water - Math.max(0, water));
  }

  takeDamage(amount, cause = 'BIOLOGICAL_COLLAPSE', detail = cause) {
    if (this.isDead || amount <= 0) return;
    if (this.suitEquipped && !this.insidePressurizedShip && (cause === 'RADIATION_OVERDOSE' || detail === 'suit-cold')) {
      this.suitIntegrity = Math.max(0, this.suitIntegrity - amount * 1.5);
    }
    this.health = Math.max(0, this.health - amount);
    this.damageFeedbackCause = cause;
    this.damageFeedbackDetail = detail;
    this.damageFeedbackTime = SURVIVAL_CONFIG.DAMAGE_FEEDBACK_SECONDS;
    if (this.health <= 0) {
      this.isDead = true;
      this.deathCause = cause;
      this.deathDetail = detail;
    }
  }

  countItem(blockId) {
    return this.inventorySlots.reduce((total, item) => total + (item?.id === blockId ? item.count : 0), 0);
  }

  // Tira ate `count` itens do inventario (hotbar primeiro) e devolve quantos saiu
  removeItems(blockId, count) {
    let removed = 0;
    for (let index = 0; index < this.inventorySlots.length; index++) {
      if (removed >= count) break;
      const item = this.inventorySlots[index];
      if (item?.id !== blockId) continue;
      const take = Math.min(item.count, count - removed);
      item.count -= take;
      removed += take;
      if (item.count <= 0) {
        this.inventorySlots[index] = null;
        if (index < this.slots.length) this.slots[index] = null;
      }
    }
    return removed;
  }

  addHarvestedCrop() {
    const slot = this.inventorySlots.find((item) => item?.id === BLOCK_IDS.HYDRO_PLANT && item.count < 64);
    if (slot) {
      slot.count++;
      return true;
    }
    const emptyIndex = this.inventorySlots.findIndex((item) => !item);
    if (emptyIndex < 0) return false;
    const crop = HOTBAR_BLOCKS.find((item) => item.id === BLOCK_IDS.HYDRO_PLANT);
    this.inventorySlots[emptyIndex] = { id: crop.id, name: crop.name, count: 1, consumable: crop.consumable };
    this.slots = this.inventorySlots.slice(0, 9);
    return true;
  }

  addBlockToInventory(blockId) {
    // Every breakable block has its own item, so the drop is the block that was broken.
    // Hull is only a fallback for an id without an item. Looked up by id, never by position.
    const block = ITEM_DEFINITIONS.find((item) => item.id === blockId)
      ?? ITEM_DEFINITIONS.find((item) => item.id === BLOCK_IDS.NASA_HULL);
    const slot = this.inventorySlots.find((item) => item?.id === block.id && item.count < 64);
    if (slot) { slot.count++; return true; }
    const emptyIndex = this.inventorySlots.findIndex((item) => !item || item.count <= 0);
    if (emptyIndex < 0) return false;
    this.inventorySlots[emptyIndex] = { id: block.id, name: block.name, count: 1, consumable: block.consumable, equipment: block.equipment ?? false };
    this.slots = this.inventorySlots.slice(0, 9);
    return true;
  }

  consumeSlotItem(slotIndex) {
    const slot = this.slots[slotIndex];
    if (!slot || slot.count <= 0 || !slot.consumable) return null;

    if (slot.consumable.type === 'water') {
      if (this.water >= this.maxStat - 0.5) return 'Your water level is already full';
      this.water = Math.min(this.maxStat, this.water + slot.consumable.amount);
      slot.count--;
      if (slot.count <= 0) this._clearInventorySlot(slotIndex);
      return 'You drank Martian ice water (+Water)';
    }

    if (slot.consumable.type === 'food') {
      const heals = Boolean(slot.consumable.heal) && this.canHeal() && this.health < this.maxStat - 0.5;
      if (this.food >= this.maxStat - 0.5 && !heals) {
        return 'Your food level is already full';
      }
      this.food = Math.min(this.maxStat, this.food + slot.consumable.amount);
      if (heals) {
        this.health = Math.min(this.maxStat, this.health + slot.consumable.heal);
      }
      slot.count--;
      if (slot.count <= 0) this._clearInventorySlot(slotIndex);
      const foodName = slot.id === BLOCK_IDS.HYDRO_PLANT ? 'Mars carrot' : slot.name.split(' (')[0];
      if (!this.canHeal()) return `You ate a ${foodName} (+Food). No oxygen! Food cannot heal you, go back to the base`;
      return `You ate a ${foodName} (+Food)`;
    }

    return null;
  }

  useBlockFromSlot(slotIndex) {
    const slot = this.slots[slotIndex];
    if (!slot || slot.count <= 0 || slot.equipment) return false;
    slot.count--;
    if (slot.count <= 0) this._clearInventorySlot(slotIndex);
    return true;
  }

  _clearInventorySlot(slotIndex) {
    this.slots[slotIndex] = null;
    this.inventorySlots[slotIndex] = null;
  }

  addBaseWater(liters) {
    const prev = this.baseWater;
    this.baseWater = Math.min(this.maxBaseWater, this.baseWater + liters);
    return Math.round(this.baseWater - prev);
  }

  drinkFromBaseDispenser() {
    if (this.baseWater < 1.0) {
      return { success: false, message: 'Base water reservoir is dry! Collect ice with the Rover.' };
    }
    if (this.water >= this.maxStat - 0.5) {
      return { success: false, message: 'Your hydration is already full.' };
    }

    const consumed = Math.min(this.baseWater, WATER_SYSTEM_CONFIG.DRINK_AMOUNT_FROM_DISPENSER);
    this.baseWater -= consumed;
    // A agua bebida nao some: vira agua cinza e o reciclador da base limpa de novo
    this.graywater += consumed;
    this.water = this.maxStat;
    return {
      success: true,
      message: `Drank clean water from habitat purifier (+Hydration full). Base reserve: ${Math.round(this.baseWater)}L. The used water goes to the recycler.`,
    };
  }
}
