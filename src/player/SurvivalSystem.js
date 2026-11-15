import { BLOCK_IDS, HOTBAR_BLOCKS, ITEM_DEFINITIONS } from '../config/blockTypes.js';
import { SURVIVAL_CONFIG, WATER_SYSTEM_CONFIG } from '../config/constants.js';
import { isInsidePressurizedVolume } from '../world/habitatLayout.js';
import { dustStormIntensity, dustStormProximity } from '../world/dustStormZone.js';

export class SurvivalSystem {
  constructor() {
    this.maxStat = SURVIVAL_CONFIG.MAX_STAT;
    this.resetStats();
    this.resetInventory();
  }

  resetStats() {
    this.health = this.maxStat;
    this.oxygen = this.maxStat;
    this.baseOxygen = 100;
    this.baseBreached = false;
    this.water = this.maxStat;
    this.food = this.maxStat;
    this.isDead = false;
    this.deathCause = null;
    this.deathDetail = null;
    this.insidePressurizedShip = false;
    this.dustStormIntensity = 0;
    this.dustStormProximity = 0;

    // Sistema de Água Potável e Irrigação da Base
    this.baseWater = WATER_SYSTEM_CONFIG.INITIAL_BASE_WATER;
    this.maxBaseWater = WATER_SYSTEM_CONFIG.MAX_BASE_WATER;
    // Agua usada (bebida, lavada, transpirada pelas plantas) esperando o reciclador da base
    this.graywater = 0;
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

  get isInDanger() {
    return (
      this.health <= SURVIVAL_CONFIG.DANGER_THRESHOLD ||
      this.oxygen <= SURVIVAL_CONFIG.DANGER_THRESHOLD ||
      this.water <= SURVIVAL_CONFIG.DANGER_THRESHOLD ||
      this.food <= SURVIVAL_CONFIG.DANGER_THRESHOLD
    );
  }

  // maxOxygenRefill: quanto O2 a bateria da base consegue pagar neste frame (sem energia = 0)
  update(dt, playerPos, maxOxygenRefill = Infinity, baseBreached = false) {
    this.lastOxygenRefilled = 0;
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
    this.dustStormIntensity = this.insidePressurizedShip ? 0 : dustStormIntensity(playerPos.x, playerPos.z);
    this.dustStormProximity = this.insidePressurizedShip ? 0 : dustStormProximity(playerPos.x, playerPos.z);

    if (this.insidePressurizedShip && !baseBreached) {
      const suitRefill = Math.max(0, Math.min(
        this.maxStat - this.oxygen,
        SURVIVAL_CONFIG.OXYGEN_REFILL_RATE * dt,
        Math.max(0, maxOxygenRefill - this.lastOxygenRefilled)
      ));
      this.lastOxygenRefilled += suitRefill;
      this.oxygen += suitRefill;
      this.oxygenNeedsPower = this.oxygen < this.maxStat - 0.01 && maxOxygenRefill <= 0;
    } else {
      this.oxygenNeedsPower = false;
      this.oxygen = Math.max(
        0,
        this.oxygen - (this.insidePressurizedShip && baseBreached ? SURVIVAL_CONFIG.BREACH_OXYGEN_DRAIN_RATE : SURVIVAL_CONFIG.OXYGEN_DRAIN_RATE) * dt
      );
    }

    this.water = Math.max(0, this.water - SURVIVAL_CONFIG.WATER_DRAIN_RATE * dt);
    this.food = Math.max(0, this.food - SURVIVAL_CONFIG.FOOD_DRAIN_RATE * dt);

    // Regeneração natural se comida e água estiverem altas (estilo Minecraft)
    if (this.food >= 16 && this.water >= 12 && this.canHeal() && this.health < this.maxStat) {
      this.health = Math.min(this.maxStat, this.health + 0.35 * dt);
    }

    // Apply hazards separately so the one that removes the last health point is recorded.
    const damageSources = [];
    if (this.oxygen <= 0) {
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
    // The first gusts are a warning. Exposure hurts only after the storm has
    // become strong enough that the player should already be heading back.
    const damageStart = SURVIVAL_CONFIG.DUST_STORM_DAMAGE_START;
    const damagingStorm = Math.max(0, (this.dustStormIntensity - damageStart) / (1 - damageStart));
    if (damagingStorm > 0) {
      damageSources.push({ rate: damagingStorm * SURVIVAL_CONFIG.DUST_STORM_DAMAGE_RATE, cause: 'BIOLOGICAL_COLLAPSE', detail: 'dust-storm-exposure' });
    }

    for (const source of damageSources) this.takeDamage(source.rate * dt, source.cause, source.detail);
  }

  // Comida nao substitui ar: sem oxigenio suficiente, nada recupera vida.
  canHeal() {
    return this.oxygen > SURVIVAL_CONFIG.HEAL_MIN_OXYGEN;
  }

  takeDamage(amount, cause = 'BIOLOGICAL_COLLAPSE', detail = cause) {
    if (this.isDead || amount <= 0) return;
    this.health = Math.max(0, this.health - amount);
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
    for (const item of this.inventorySlots) {
      if (removed >= count) break;
      if (item?.id !== blockId) continue;
      const take = Math.min(item.count, count - removed);
      item.count -= take;
      removed += take;
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
    this.inventorySlots[emptyIndex] = { id: block.id, name: block.name, count: 1, consumable: block.consumable };
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
    return true;
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
