import { CROP_ITEM_IDS, ITEM_DEFINITIONS } from '../config/blockTypes.js';
import { describe, it, expect } from 'vitest';
import { BLOCK_IDS } from '../config/blockTypes.js';
import { SurvivalSystem } from './SurvivalSystem.js';

describe('SurvivalSystem', () => {
  it('leaks base and suit oxygen during a breach, then restores them using power after sealing', () => {
    const survival = new SurvivalSystem();
    const inside = { x: 0, y: 11.7, z: 0 };
    survival.update(4, inside, 100, true);
    expect(survival.baseOxygen).toBe(80);
    expect(survival.oxygen).toBe(16);
    expect(survival.lastOxygenRefilled).toBe(0);
    survival.update(1, inside, 0, false);
    expect(survival.baseOxygen).toBe(80);
    expect(survival.oxygen).toBe(16);
    survival.update(1, inside, 100, false);
    expect(survival.baseOxygen).toBe(82);
    expect(survival.oxygen).toBe(20);
    expect(survival.lastOxygenRefilled).toBeCloseTo(4.4);
  });

  it('keeps leaking base oxygen while the astronaut is outside', () => {
    const survival = new SurvivalSystem();
    survival.update(2, { x: 35, y: 11, z: 35 }, 100, true);
    expect(survival.baseOxygen).toBe(90);
    expect(survival.oxygen).toBeCloseTo(20 - 2 * (20 / 360));
  });

  it('starts with a journal that cannot be placed or consumed', () => {
    const survival = new SurvivalSystem();
    const index = survival.slots.findIndex((slot) => slot?.id === BLOCK_IDS.JOURNAL);
    expect(index).toBeGreaterThanOrEqual(0);
    expect(survival.slots[index].equipment).toBe(true);
    expect(survival.useBlockFromSlot(index)).toBe(false);
    expect(survival.slots[index].count).toBe(1);
  });

  it('keeps the scanner and greenhouse crops as distinct items', () => {
    const ids = [BLOCK_IDS.SCOPE, ...Object.values(CROP_ITEM_IDS)];
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('starts with the equipment before the carrots', () => {
    const survival = new SurvivalSystem();
    expect(survival.slots[0]?.id).toBe(BLOCK_IDS.SCOPE);
    expect(survival.slots[1]).toMatchObject({ id: BLOCK_IDS.SHIELD_REMOTE, count: 1, equipment: true });
    expect(survival.slots[2]?.id).toBe(BLOCK_IDS.JOURNAL);
    expect(survival.slots[3]?.id).toBe(BLOCK_IDS.HYDRO_PLANT);
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

  it('drains oxygen outside and refills oxygen inside the pressurized base', () => {
    const survival = new SurvivalSystem();

    survival.update(5.0, { x: 0, y: 11.7, z: 25 });
    const afterOutside = survival.oxygen;
    expect(afterOutside).toBeLessThan(survival.maxStat);

    survival.update(2.0, { x: -18, y: 11.7, z: 0 });
    expect(survival.oxygen).toBeGreaterThan(afterOutside);
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

  it('manages base water reserves, greenhouse hydration, and drinking from habitat dispenser', () => {
    const survival = new SurvivalSystem();
    expect(survival.baseWater).toBeGreaterThan(0);
    expect(survival.greenhouseHydration).toBe(100);

    // Adiciona água à base
    const added = survival.addBaseWater(30);
    expect(added).toBe(30);

    // Simula sede
    survival.water = 5.0;
    const drinkResult = survival.drinkFromBaseDispenser();
    expect(drinkResult.success).toBe(true);
    expect(survival.water).toBe(survival.maxStat);

    // Esgota a água e testa hidratação da estufa caindo
    survival.baseWater = 0;
    survival.update(10.0, { x: 0, y: 11.7, z: 0 });
    expect(survival.greenhouseHydration).toBeLessThan(100);
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

describe('habitat blocks without their own item', () => {
  it.each(['THRUSTER_METAL', 'SOLAR_PANEL', 'CONSOLE_SCREEN', 'RED_BEACON'])('%s is collected as a hull block, never as ice', (key) => {
    const survival = new SurvivalSystem();
    expect(survival.addBlockToInventory(BLOCK_IDS[key])).toBe(true);
    expect(survival.countItem(BLOCK_IDS.NASA_HULL)).toBe(1);
    expect(survival.countItem(BLOCK_IDS.MARS_ICE)).toBe(0);
  });
});
