import { BLOCK_IDS, HOTBAR_BLOCKS } from '../config/blockTypes.js';
import { SURVIVAL_CONFIG, WATER_SYSTEM_CONFIG } from '../config/constants.js';
import { isInsidePressurizedVolume } from '../world/habitatLayout.js';

export class SurvivalSystem {
  constructor() {
    this.maxStat = SURVIVAL_CONFIG.MAX_STAT;
    this.resetStats();
    this.resetInventory();
  }

  resetStats() {
    this.health = this.maxStat;
    this.oxygen = this.maxStat;
    this.water = this.maxStat;
    this.food = this.maxStat;
    this.isDead = false;
    this.insidePressurizedShip = false;
    this.dustStormIntensity = 0;

    // Sistema de Água Potável e Irrigação da Base
    this.baseWater = WATER_SYSTEM_CONFIG.INITIAL_BASE_WATER;
    this.maxBaseWater = WATER_SYSTEM_CONFIG.MAX_BASE_WATER;
    this.greenhouseHydration = 100;
  }

  resetInventory() {
    this.slots = HOTBAR_BLOCKS.map((b) => b.initialCount > 0 ? ({
      id: b.id,
      name: b.name,
      count: b.initialCount,
      consumable: b.consumable,
    }) : null);
    const foodIndex = this.slots.findIndex((slot) => slot?.consumable?.type === 'food');
    if (foodIndex > 0) {
      [this.slots[0], this.slots[foodIndex]] = [this.slots[foodIndex], this.slots[0]];
    }
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

  // maxOxygenRefill: quanto O2 a bateria da base consegue pagar neste frame (sem energia = 0)
  update(dt, playerPos, maxOxygenRefill = Infinity) {
    this.lastOxygenRefilled = 0;
    if (this.isDead) return;

    this.insidePressurizedShip = this.isPlayerInsideShip(playerPos);
    const distanceFromBase = Math.hypot(playerPos.x + 4, playerPos.z);
    const stormRange = SURVIVAL_CONFIG.DUST_STORM_FATAL_RADIUS - SURVIVAL_CONFIG.DUST_STORM_START_RADIUS;
    this.dustStormIntensity = this.insidePressurizedShip
      ? 0
      : Math.max(0, Math.min(1, (distanceFromBase - SURVIVAL_CONFIG.DUST_STORM_START_RADIUS) / stormRange));

    if (this.insidePressurizedShip) {
      this.lastOxygenRefilled = Math.max(0, Math.min(
        this.maxStat - this.oxygen,
        SURVIVAL_CONFIG.OXYGEN_REFILL_RATE * dt,
        maxOxygenRefill
      ));
      this.oxygen += this.lastOxygenRefilled;
      this.oxygenNeedsPower = this.oxygen < this.maxStat - 0.01 && maxOxygenRefill <= 0;
    } else {
      this.oxygenNeedsPower = false;
      this.oxygen = Math.max(
        0,
        this.oxygen - SURVIVAL_CONFIG.OXYGEN_DRAIN_RATE * dt
      );
    }

    this.water = Math.max(0, this.water - SURVIVAL_CONFIG.WATER_DRAIN_RATE * dt);
    this.food = Math.max(0, this.food - SURVIVAL_CONFIG.FOOD_DRAIN_RATE * dt);

    // Irrigação da estufa a partir da reserva de água da base
    if (this.baseWater > 0) {
      const waterUsed = WATER_SYSTEM_CONFIG.GREENHOUSE_WATER_CONSUMPTION * dt;
      this.baseWater = Math.max(0, this.baseWater - waterUsed);
      this.greenhouseHydration = Math.min(100, this.greenhouseHydration + dt * 2.5);
    } else {
      this.greenhouseHydration = Math.max(0, this.greenhouseHydration - dt * 0.9);
    }

    // Regeneração natural se comida e água estiverem altas (estilo Minecraft)
    if (this.food >= 16 && this.water >= 12 && this.canHeal() && this.health < this.maxStat) {
      this.health = Math.min(this.maxStat, this.health + 0.35 * dt);
    }

    // Dano por falta de Oxigênio, Água ou Comida
    let damageRate = 0;
    if (this.oxygen <= 0) damageRate += SURVIVAL_CONFIG.STARVE_DAMAGE_RATE * 1.6;
    if (this.water <= 0) damageRate += SURVIVAL_CONFIG.STARVE_DAMAGE_RATE;
    if (this.food <= 0) damageRate += SURVIVAL_CONFIG.STARVE_DAMAGE_RATE * 0.8;
    // The first gusts are a warning. Exposure hurts only after the storm has
    // become strong enough that the player should already be heading back.
    const damagingStorm = Math.max(0, (this.dustStormIntensity - 0.55) / 0.45);
    if (damagingStorm > 0) {
      damageRate += damagingStorm * SURVIVAL_CONFIG.DUST_STORM_DAMAGE_RATE;
    }

    if (damageRate > 0) {
      this.health = Math.max(0, this.health - damageRate * dt);
      if (this.health <= 0) {
        this.isDead = true;
      }
    }
  }

  // Comida nao substitui ar: sem oxigenio suficiente, nada recupera vida.
  canHeal() {
    return this.oxygen > SURVIVAL_CONFIG.HEAL_MIN_OXYGEN;
  }

  takeDamage(amount) {
    if (this.isDead || amount <= 0) return;
    this.health = Math.max(0, this.health - amount);
    if (this.health <= 0) this.isDead = true;
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
    // Special habitat blocks become hull blocks in the inventory.
    const block = HOTBAR_BLOCKS.find((item) => item.id === blockId) ?? HOTBAR_BLOCKS[5];
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
      if (!this.canHeal()) return 'You ate a Mars carrot (+Food). No oxygen! Food cannot heal you, go back to the base';
      return 'You ate a Mars carrot (+Food)';
    }

    return null;
  }

  useBlockFromSlot(slotIndex) {
    const slot = this.slots[slotIndex];
    if (!slot || slot.count <= 0) return false;
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
    this.water = this.maxStat;
    return {
      success: true,
      message: `Drank clean water from habitat purifier (+Hydration full). Base reserve: ${Math.round(this.baseWater)}L`,
    };
  }

  harvestGreenhouseCrop() {
    if (this.greenhouseHydration < 20) {
      return { success: false, message: 'Crops are dry! Supply water to the habitat to irrigate.' };
    }
    // Id 12 é HYDRO_PLANT
    const added = this.addBlockToInventory(12);
    if (added) {
      return {
        success: true,
        message: 'Harvested a fresh carrot from the irrigated greenhouse (+1 Food item)!',
      };
    }
    return { success: false, message: 'Inventory is full.' };
  }
}
