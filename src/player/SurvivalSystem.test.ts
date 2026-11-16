// @ts-nocheck
import { CROP_ITEM_IDS, ITEM_DEFINITIONS } from '../config/blockTypes.ts';
import { describe, it, expect } from 'vitest';
import { BLOCK_IDS } from '../config/blockTypes.ts';
import { SurvivalSystem } from './SurvivalSystem.ts';
import { SURVIVAL_CONFIG, WATER_SYSTEM_CONFIG } from '../config/constants.ts';

describe('SurvivalSystem', () => {
  it('uses suit heat outside and recharges a docked suit with available base power', () => {
    const survival = new SurvivalSystem();
    const power = { energy: 0.04, spend(amount) { if (amount > this.energy) return false; this.energy -= amount; return true; } };
    const outside = { x: 35, y: 11, z: 35 };
    survival.updateSuitThermal(10, outside, -60, power);
    expect(survival.suitThermal).toBeCloseTo(100 - 10 * SURVIVAL_CONFIG.SUIT_THERMAL_DRAIN_PER_SECOND);
    survival.suitThermal = 0;
    survival.updateSuitThermal(1, outside, -60, power);
    expect(survival.health).toBeLessThan(survival.maxStat);
    survival.suitEquipped = false;
    survival.updateSuitThermal(1, { x: 0, y: 11.7, z: 0 }, -60, power);
    expect(survival.suitThermal).toBeCloseTo(2);
    expect(power.energy).toBeCloseTo(0);
    survival.updateSuitThermal(1, outside, -60, power);
    expect(survival.suitThermal).toBeCloseTo(2);
  });

  it('uses more heater charge in colder weather and none while inside', () => {
    const warm = new SurvivalSystem();
    const cold = new SurvivalSystem();
    const power = { energy: 100, spend: () => true };
    const outside = { x: 35, y: 11, z: 35 };
    warm.updateSuitThermal(10, outside, -60, power);
    cold.updateSuitThermal(10, outside, -120, power);
    expect(cold.suitThermal).toBeLessThan(warm.suitThermal);
    const before = cold.suitThermal;
    cold.updateSuitThermal(10, { x: 0, y: 11.7, z: 0 }, -120, power);
    expect(cold.suitThermal).toBe(before);
  });
  it('rapidly drains personal oxygen without a suit during a breach and causes damage when empty', () => {
    const survival = new SurvivalSystem();
    survival.suitEquipped = false;
    const inside = { x: 0, y: 11.7, z: 0 };
    survival.update(5, inside, 100, true);
    expect(survival.oxygen).toBe(10);
    survival.update(5, inside, 100, true);
    expect(survival.oxygen).toBe(0);
    expect(survival.health).toBeLessThan(survival.maxStat);
  });
  it('restores personal oxygen after a breach is sealed without a suit', () => {
    const survival = new SurvivalSystem();
    survival.suitEquipped = false;
    const inside = { x: 0, y: 11.7, z: 0 };
    survival.update(4, inside, 100, true);
    expect(survival.baseOxygen).toBe(80);
    expect(survival.oxygen).toBe(12);
    expect(survival.lastOxygenRefilled).toBe(0);
    survival.update(1, inside, 0, false);
    expect(survival.baseOxygen).toBe(80);
    expect(survival.oxygen).toBe(12);
    survival.update(1, inside, 100, false);
    expect(survival.baseOxygen).toBe(82);
    expect(survival.oxygen).toBe(16.5);
    expect(survival.lastOxygenRefilled).toBeCloseTo(4.9);
  });

  it('standing at the map edge or in the dust does not hurt: intact suit takes the drain and wears down (issue #103, #167)', () => {
    const survival = new SurvivalSystem();
    const farOut = { x: -4 + SURVIVAL_CONFIG.DUST_STORM_FATAL_RADIUS, y: 11, z: 0 };
    survival.update(10, farOut, 100, false);
    expect(survival.health).toBe(survival.maxStat);
    expect(survival.oxygen).toBe(survival.maxStat);
    expect(survival.suitOxygen).toBeLessThan(100);
    expect(survival.suitIntegrity).toBeLessThan(100);
  });

  it('protects personal oxygen while EVA suit is intact and keeps leaking base oxygen during a breach', () => {
    const survival = new SurvivalSystem();
    survival.update(2, { x: 35, y: 11, z: 35 }, 100, true);
    expect(survival.baseOxygen).toBe(90);
    expect(survival.oxygen).toBe(survival.maxStat);
    expect(survival.suitOxygen).toBeCloseTo(100 - 2 * SURVIVAL_CONFIG.SUIT_OXYGEN_DRAIN_PER_SECOND, 3);
  });

  it('drains personal oxygen once the EVA suit is worn out, like Minecraft armor durability', () => {
    const survival = new SurvivalSystem();
    survival.suitIntegrity = 0;
    survival.update(5, { x: 0, y: 11.7, z: 25 }, 100, false);
    expect(survival.oxygen).toBeCloseTo(survival.maxStat - 5 * SURVIVAL_CONFIG.BREACH_OXYGEN_DRAIN_RATE, 5);

    survival.update(2, { x: -18, y: 11.7, z: 0 }, 100, false);
    expect(survival.oxygen).toBeGreaterThan(survival.maxStat - 5 * SURVIVAL_CONFIG.OXYGEN_DRAIN_RATE);
  });

  it('drains personal oxygen at the same breach rate when all suit shields run out outside as when the base is breached', () => {
    const wornSuit = new SurvivalSystem();
    wornSuit.suitIntegrity = 0;
    wornSuit.update(4, { x: 35, y: 11, z: 35 }, 100, false);

    const breachedBase = new SurvivalSystem();
    breachedBase.suitOxygen = 0;
    breachedBase.update(4, { x: 0, y: 11.7, z: 0 }, 100, true);

    expect(wornSuit.oxygen).toBeCloseTo(breachedBase.oxygen, 5);
    expect(wornSuit.oxygen).toBeCloseTo(wornSuit.maxStat - 4 * SURVIVAL_CONFIG.BREACH_OXYGEN_DRAIN_RATE, 5);
  });

  it('starts with a journal that cannot be placed or consumed', () => {
    const survival = new SurvivalSystem();
    const index = survival.slots.findIndex((slot) => slot?.id === BLOCK_IDS.JOURNAL);
    expect(index).toBeGreaterThanOrEqual(0);
    expect(survival.slots[index].equipment).toBe(true);
    expect(survival.useBlockFromSlot(index)).toBe(false);
    expect(survival.slots[index].count).toBe(1);
  });

  it('a slow leak (act 2 cracked window) drains the base air slowly and stops at its floor', () => {
    const survival = new SurvivalSystem();
    const inside = { x: 0, y: 11, z: 0 };
    survival.slowLeak = { rate: 0.15, floor: 30 };
    survival.update(10, inside);
    expect(survival.baseOxygen).toBeCloseTo(100 - 1.5);
    for (let i = 0; i < 100; i++) {
      survival.water = survival.food = survival.maxStat; // a conta aqui e so do ar
      survival.update(10, inside);
    }
    expect(survival.baseOxygen).toBe(30);
    expect(survival.isDead).toBe(false);
    // Consertada a janela, o ar volta a encher
    survival.slowLeak = null;
    survival.update(1, inside);
    expect(survival.baseOxygen).toBeGreaterThan(30);
  });

  it('wears the suit faster outside while suitWearFactor is up (dust storm, act 2)', () => {
    const outside = { x: 60, y: 12, z: 60 };
    const wearAfter = (factor) => {
      const survival = new SurvivalSystem();
      survival.suitEquipped = true;
      survival.suitWearFactor = factor;
      survival.update(10, outside);
      return 100 - survival.suitIntegrity;
    };
    expect(wearAfter(1)).toBeGreaterThan(0);
    expect(wearAfter(2)).toBeCloseTo(wearAfter(1) * 2, 5);
  });

  it('keeps the scanner and greenhouse crops as distinct items', () => {
    const ids = [BLOCK_IDS.SCOPE, ...Object.values(CROP_ITEM_IDS)];
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('starts with the journal, shield remote, and carrots in the first three slots, without the scope', () => {
    const survival = new SurvivalSystem();
    expect(survival.slots[0]).toMatchObject({ id: BLOCK_IDS.JOURNAL, count: 1, equipment: true });
    expect(survival.slots[1]).toMatchObject({ id: BLOCK_IDS.SHIELD_REMOTE, count: 1, equipment: true });
    expect(survival.slots[2]).toMatchObject({ id: BLOCK_IDS.HYDRO_PLANT, count: 3 });
    expect(survival.countItem(BLOCK_IDS.SCOPE)).toBe(0);
    // A luneta entregue no ato 2 cai no primeiro espaco livre da hotbar.
    expect(survival.addBlockToInventory(BLOCK_IDS.SCOPE)).toBe(true);
    expect(survival.slots[3]).toMatchObject({ id: BLOCK_IDS.SCOPE, count: 1, equipment: true });
  });

  it('repairs a saved starter layout without losing items moved out of the first slots', () => {
    const survival = new SurvivalSystem();
    const savedBlock = { id: BLOCK_IDS.BASALT, name: 'Crater Rock', count: 7 };
    survival.inventorySlots = Array(36).fill(null);
    survival.inventorySlots[0] = null;
    survival.inventorySlots[1] = savedBlock;
    survival.inventorySlots[5] = { id: BLOCK_IDS.SHIELD_REMOTE, count: 1 };
    survival.inventorySlots[8] = { id: BLOCK_IDS.JOURNAL, count: 1 };
    survival.inventorySlots[12] = { id: BLOCK_IDS.HYDRO_PLANT, count: 2 };

    survival.restoreStarterInventoryLayout();

    expect(survival.inventorySlots.slice(0, 3).map((slot) => slot?.id)).toEqual([
      BLOCK_IDS.JOURNAL,
      BLOCK_IDS.SHIELD_REMOTE,
      BLOCK_IDS.HYDRO_PLANT,
    ]);
    expect(survival.countItem(BLOCK_IDS.BASALT)).toBe(7);
    expect(survival.countItem(BLOCK_IDS.HYDRO_PLANT)).toBe(2);
    expect(survival.slots).toEqual(survival.inventorySlots.slice(0, 9));
  });

  it('detects player inside Main White Habitat, Pressurized Tunnel, and Greenhouse Dome', () => {
    const survival = new SurvivalSystem();

    // Dentro do Módulo Principal Branco
    expect(survival.isPlayerInsideShip({ x: 0, y: 11.7, z: 0 })).toBe(true);

    // Dentro do Túnel Pressurizado de Conexão
    expect(survival.isPlayerInsideShip({ x: -10, y: 11.7, z: 0 })).toBe(true);

    // Dentro da Redoma de Estufa (x = -18, z = 0)
    expect(survival.isPlayerInsideShip({ x: -18, y: 11.7, z: 2 })).toBe(true);

    // Fora na superfície marciana
    expect(survival.isPlayerInsideShip({ x: 0, y: 11.7, z: 24 })).toBe(false);
  });

  it('drains suit O2 outside while protecting personal O2, and refills suit O2 inside the pressurized base', () => {
    const survival = new SurvivalSystem();

    survival.update(5.0, { x: 0, y: 11.7, z: 25 });
    const afterOutsideSuitO2 = survival.suitOxygen;
    expect(survival.oxygen).toBe(survival.maxStat);
    expect(afterOutsideSuitO2).toBeLessThan(100);

    survival.suitEquipped = false;
    survival.update(2.0, { x: -18, y: 11.7, z: 0 });
    expect(survival.suitOxygen).toBeGreaterThan(afterOutsideSuitO2);
  });

  it('auto-cleans CO2 scrubber when docked, accumulates dust outside, and repairs with power or emergency patch', () => {
    const survival = new SurvivalSystem();
    const outside = { x: 0, y: 11.7, z: 25 };
    const inside = { x: 0, y: 11.7, z: 0 };

    survival.update(10, outside, 100, false, { isMoving: true });
    expect(survival.suitScrubber).toBeLessThan(100);
    expect(survival.suitDust).toBeGreaterThan(0);

    const scrubberAfterEva = survival.suitScrubber;
    survival.suitEquipped = false;
    survival.update(2, inside, 100, false);
    expect(survival.suitScrubber).toBeGreaterThan(scrubberAfterEva);

    const power = { energy: 50, spend(amount) { if (this.energy < amount) return false; this.energy -= amount; return true; } };
    const cleaned = survival.cleanSuitDust(power);
    expect(cleaned.ok).toBe(true);
    expect(survival.suitDust).toBe(0);

    survival.suitIntegrity = 40;
    const repaired = survival.repairSuit(power);
    expect(repaired.ok).toBe(true);
    expect(survival.suitIntegrity).toBe(100);

    survival.suitIntegrity = 0;
    const lowPower = { energy: 0, spend: () => false };
    const patched = survival.repairSuit(lowPower);
    expect(patched.ok).toBe(true);
    expect(survival.suitIntegrity).toBe(35);
  });

  it('reports danger when health, oxygen, water, or food is critically low', () => {
    const survival = new SurvivalSystem();
    expect(survival.isInDanger).toBe(false);

    for (const stat of ['health', 'oxygen', 'water', 'food']) {
      survival[stat] = 5;
      expect(survival.isInDanger).toBe(true);
      survival[stat] = survival.maxStat;
      expect(survival.isInDanger).toBe(false);
    }
  });

  it('manages base water reserves and drinking from habitat dispenser', () => {
    const survival = new SurvivalSystem();
    expect(survival.baseWater).toBeGreaterThan(0);
    expect(survival.graywater).toBe(0);

    // Adiciona água à base
    const added = survival.addBaseWater(30);
    expect(added).toBe(30);

    // Simula sede
    survival.water = 5.0;
    const drinkResult = survival.drinkFromBaseDispenser();
    expect(drinkResult.success).toBe(true);
    expect(survival.water).toBe(survival.maxStat);
  });

  it('the base tank does not go down by itself: with nothing planted there is no irrigation (issue #101)', () => {
    const survival = new SurvivalSystem();
    const before = survival.baseWater;
    for (let i = 0; i < 600; i++) survival.update(1, { x: 0, y: 11.7, z: 0 });
    expect(survival.baseWater).toBe(before);
    expect(survival.graywater).toBe(0);
  });

  it('water drunk at the purifier becomes gray water for the recycler (issue #101)', () => {
    const survival = new SurvivalSystem();
    const before = survival.baseWater;
    survival.water = 5;
    expect(survival.drinkFromBaseDispenser().success).toBe(true);
    expect(before - survival.baseWater).toBe(WATER_SYSTEM_CONFIG.DRINK_AMOUNT_FROM_DISPENSER);
    expect(survival.graywater).toBe(WATER_SYSTEM_CONFIG.DRINK_AMOUNT_FROM_DISPENSER);
    expect(survival.graywater).toBe(2);

    // Tanque quase vazio: so vira agua cinza o que foi bebido de verdade
    survival.baseWater = 1.2;
    survival.graywater = 0;
    survival.water = 5;
    survival.drinkFromBaseDispenser();
    expect(survival.baseWater).toBe(0);
    expect(survival.graywater).toBeCloseTo(1.2);
  });
});

describe('harvested carrots', () => {
  it('stacks carrots in the backpack and refuses pickup when inventory is full', () => {
    const survival = new SurvivalSystem();
    const carrotIndex = survival.slots.findIndex((slot) => slot?.id === BLOCK_IDS.HYDRO_PLANT);
    const carrot = survival.slots[carrotIndex];
    survival.inventorySlots[carrotIndex] = null;
    survival.inventorySlots[9] = carrot;
    survival.slots = survival.inventorySlots.slice(0, 9);
    expect(survival.addHarvestedCrop()).toBe(true);
    expect(carrot.count).toBe(4);
    survival.inventorySlots.fill({ id: 999, count: 64 });
    expect(survival.addHarvestedCrop()).toBe(false);
  });

  it('consumes a carrot only when food or health needs replenishing', () => {
    const survival = new SurvivalSystem();
    const carrotIndex = survival.slots.findIndex((slot) => slot?.id === BLOCK_IDS.HYDRO_PLANT);
    expect(survival.consumeSlotItem(carrotIndex)).toContain('already full');
    expect(survival.slots[carrotIndex].count).toBe(3);
    survival.food = 10;
    expect(survival.consumeSlotItem(carrotIndex)).toContain('carrot');
    expect(survival.food).toBe(16);
    expect(survival.slots[carrotIndex].count).toBe(2);
  });

  it('does not heal when oxygen is empty, but still fills food', () => {
    const survival = new SurvivalSystem();
    const carrotIndex = survival.slots.findIndex((slot) => slot?.id === BLOCK_IDS.HYDRO_PLANT);
    survival.oxygen = 0;
    survival.health = 10;
    survival.food = 10;
    expect(survival.consumeSlotItem(carrotIndex)).toContain('No oxygen');
    expect(survival.health).toBe(10);
    expect(survival.food).toBe(16);
    expect(survival.slots[carrotIndex].count).toBe(2);
  });

  it('refuses to eat just for healing when oxygen is empty and food is full', () => {
    const survival = new SurvivalSystem();
    const carrotIndex = survival.slots.findIndex((slot) => slot?.id === BLOCK_IDS.HYDRO_PLANT);
    survival.oxygen = 0;
    survival.health = 10;
    expect(survival.consumeSlotItem(carrotIndex)).toContain('already full');
    expect(survival.health).toBe(10);
    expect(survival.slots[carrotIndex].count).toBe(3);
  });

  it('heals with normal oxygen even when food is full', () => {
    const survival = new SurvivalSystem();
    const carrotIndex = survival.slots.findIndex((slot) => slot?.id === BLOCK_IDS.HYDRO_PLANT);
    survival.health = 10;
    expect(survival.consumeSlotItem(carrotIndex)).toBe('You ate a Mars carrot (+Food)');
    expect(survival.health).toBe(12);
    expect(survival.slots[carrotIndex].count).toBe(2);
  });
});

describe('mission hooks', () => {
  it('oxygen refill inside the base is limited by the energy budget', () => {
    const survival = new SurvivalSystem();
    survival.oxygen = 5;
    survival.update(1.0, { x: 0, y: 11.7, z: 0 }, 0);
    expect(survival.oxygen).toBe(5);
    expect(survival.lastOxygenRefilled).toBe(0);
    expect(survival.oxygenNeedsPower).toBe(true);

    survival.update(1.0, { x: 0, y: 11.7, z: 0 }, 2);
    expect(survival.lastOxygenRefilled).toBeCloseTo(2);
    expect(survival.oxygen).toBeCloseTo(7);
  });

  it('takeDamage kills at zero health', () => {
    const survival = new SurvivalSystem();
    survival.takeDamage(5);
    expect(survival.health).toBe(15);
    survival.takeDamage(50);
    expect(survival.isDead).toBe(true);
  });

  it('counts and removes ice blocks from the inventory', () => {
    const survival = new SurvivalSystem();
    const iceId = BLOCK_IDS.MARS_ICE;
    survival.inventorySlots[3] = { id: iceId, name: 'ice', count: 5 };
    survival.inventorySlots[12] = { id: iceId, name: 'ice', count: 4 };
    expect(survival.countItem(iceId)).toBe(9);
    expect(survival.removeItems(iceId, 7)).toBe(7);
    expect(survival.countItem(iceId)).toBe(2);
    expect(survival.removeItems(iceId, 10)).toBe(2);
  });

  it('counts and spends old and fresh meteor ice as the same water resource', () => {
    const survival = new SurvivalSystem();
    survival.addBlockToInventory(BLOCK_IDS.MARS_ICE);
    survival.addBlockToInventory(BLOCK_IDS.METEOR_ICE);
    survival.addBlockToInventory(BLOCK_IDS.METEOR_ICE);

    expect(survival.countWaterIce()).toBe(3);
    expect(survival.removeWaterIce(2)).toBe(2);
    expect(survival.countItem(BLOCK_IDS.MARS_ICE)).toBe(0);
    expect(survival.countItem(BLOCK_IDS.METEOR_ICE)).toBe(1);
  });
});

describe('distinct crop inventory items', () => {
  it.each(Object.entries(CROP_ITEM_IDS))('collects, stacks and eats %s without turning into hull or carrot', (type, id) => {
    const survival = new SurvivalSystem();
    expect(survival.slots).toHaveLength(9);
    survival.addBlockToInventory(id); survival.addBlockToInventory(id);
    const index = survival.slots.findIndex(slot => slot?.id === id);
    expect(survival.countItem(id)).toBe(2);
    survival.food = 0;
    expect(survival.consumeSlotItem(index)).toContain(type);
    expect(survival.food).toBe(ITEM_DEFINITIONS.find(item => item.id === id).consumable.amount);
    expect(survival.countItem(id)).toBe(1);
    survival.food = survival.maxStat;
    expect(survival.consumeSlotItem(index)).toContain('already full');
    expect(survival.countItem(id)).toBe(1);
  });
});

describe('picking up a broken block', () => {
  // HYDRO_PLANT goes through addHarvestedCrop
  const keys = Object.keys(BLOCK_IDS).filter((key) => key !== 'AIR' && key !== 'HYDRO_PLANT');
  it.each(keys)('%s is collected as itself, never as another block', (key) => {
    const survival = new SurvivalSystem();
    const before = survival.countItem(BLOCK_IDS[key]);
    expect(survival.addBlockToInventory(BLOCK_IDS[key])).toBe(true);
    expect(survival.countItem(BLOCK_IDS[key])).toBe(before + 1);
    if (key !== 'NASA_HULL') expect(survival.countItem(BLOCK_IDS.NASA_HULL)).toBe(0);
  });
});
