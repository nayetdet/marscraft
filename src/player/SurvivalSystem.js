import { HOTBAR_BLOCKS } from '../config/blockTypes.js';
import { SURVIVAL_CONFIG } from '../config/constants.js';

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
  }

  resetInventory() {
    this.slots = HOTBAR_BLOCKS.map((b) => ({
      id: b.id,
      name: b.name,
      count: b.initialCount,
      consumable: b.consumable,
    }));
  }

  isPlayerInsideShip(pos) {
    // 1. Interior do Módulo Hab Branco Principal da NASA
    const inMainHab =
      Math.abs(pos.x) <= 6.8 &&
      pos.z >= -5.8 &&
      pos.z <= 8.2 &&
      pos.y >= 9.2 &&
      pos.y <= 18.8;

    // 2. Túnel Pressurizado de Conexão
    const inTunnel =
      pos.x >= -12.5 &&
      pos.x <= -6.5 &&
      Math.abs(pos.z) <= 2.2 &&
      pos.y >= 9.2 &&
      pos.y <= 14.0;

    // 3. Redoma de Estufa para Plantações (x = -18, z = 0, raio 7)
    const inGreenhouseDome =
      Math.hypot(pos.x + 18, pos.z) <= 6.8 &&
      pos.y >= 9.2 &&
      pos.y <= 16.5;

    return inMainHab || inTunnel || inGreenhouseDome;
  }

  update(dt, playerPos) {
    if (this.isDead) return;

    this.insidePressurizedShip = this.isPlayerInsideShip(playerPos);

    if (this.insidePressurizedShip) {
      this.oxygen = Math.min(
        this.maxStat,
        this.oxygen + SURVIVAL_CONFIG.OXYGEN_REFILL_RATE * dt
      );
    } else {
      this.oxygen = Math.max(
        0,
        this.oxygen - SURVIVAL_CONFIG.OXYGEN_DRAIN_RATE * dt
      );
    }

    this.water = Math.max(0, this.water - SURVIVAL_CONFIG.WATER_DRAIN_RATE * dt);
    this.food = Math.max(0, this.food - SURVIVAL_CONFIG.FOOD_DRAIN_RATE * dt);

    // Regeneração natural se comida e água estiverem altas (estilo Minecraft)
    if (this.food >= 16 && this.water >= 12 && this.oxygen > 5 && this.health < this.maxStat) {
      this.health = Math.min(this.maxStat, this.health + 0.35 * dt);
    }

    // Dano por falta de Oxigênio, Água ou Comida
    let damageRate = 0;
    if (this.oxygen <= 0) damageRate += SURVIVAL_CONFIG.STARVE_DAMAGE_RATE * 1.6;
    if (this.water <= 0) damageRate += SURVIVAL_CONFIG.STARVE_DAMAGE_RATE;
    if (this.food <= 0) damageRate += SURVIVAL_CONFIG.STARVE_DAMAGE_RATE * 0.8;

    if (damageRate > 0) {
      this.health = Math.max(0, this.health - damageRate * dt);
      if (this.health <= 0) {
        this.isDead = true;
      }
    }
  }

  addBlockToInventory(blockId) {
    const slot = this.slots.find((s) => s.id === blockId);
    if (slot) {
      slot.count = Math.min(64, slot.count + 1);
      return true;
    }
    // Blocos especiais da nave (metal, console, farol) viram Bloco da Nave no inventário
    const hullSlot = this.slots[5];
    if (hullSlot) {
      hullSlot.count = Math.min(64, hullSlot.count + 1);
    }
    return true;
  }

  consumeSlotItem(slotIndex) {
    const slot = this.slots[slotIndex];
    if (!slot || slot.count <= 0 || !slot.consumable) return null;

    if (slot.consumable.type === 'water') {
      if (this.water >= this.maxStat - 0.5) return 'Sua sede ja esta cheia';
      this.water = Math.min(this.maxStat, this.water + slot.consumable.amount);
      slot.count--;
      return 'Voce bebeu Agua de Gelo Marciano (+Agua)';
    }

    if (slot.consumable.type === 'food') {
      if (this.food >= this.maxStat - 0.5 && this.health >= this.maxStat - 0.5) {
        return 'Sua fome ja esta cheia';
      }
      this.food = Math.min(this.maxStat, this.food + slot.consumable.amount);
      if (slot.consumable.heal) {
        this.health = Math.min(this.maxStat, this.health + slot.consumable.heal);
      }
      slot.count--;
      return 'Voce comeu Batata de Marte (+Comida)';
    }

    return null;
  }

  useBlockFromSlot(slotIndex) {
    const slot = this.slots[slotIndex];
    if (!slot || slot.count <= 0) return false;
    slot.count--;
    return true;
  }
}
