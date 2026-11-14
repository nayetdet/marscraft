import { describe, it, expect } from 'vitest';
import { SurvivalSystem } from './SurvivalSystem.js';

describe('SurvivalSystem', () => {
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
    const carrot = survival.slots[4];
    survival.inventorySlots[4] = null;
    survival.inventorySlots[9] = carrot;
    survival.slots = survival.inventorySlots.slice(0, 9);
    expect(survival.addHarvestedCrop()).toBe(true);
    expect(carrot.count).toBe(6);
    survival.inventorySlots.fill({ id: 999, count: 64 });
    expect(survival.addHarvestedCrop()).toBe(false);
  });

  it('consumes a carrot only when food or health needs replenishing', () => {
    const survival = new SurvivalSystem();
    expect(survival.consumeSlotItem(4)).toContain('already full');
    expect(survival.slots[4].count).toBe(5);
    survival.food = 10;
    expect(survival.consumeSlotItem(4)).toContain('carrot');
    expect(survival.food).toBe(16);
    expect(survival.slots[4].count).toBe(4);
  });

  it('does not heal when oxygen is empty, but still fills food', () => {
    const survival = new SurvivalSystem();
    survival.oxygen = 0;
    survival.health = 10;
    survival.food = 10;
    expect(survival.consumeSlotItem(4)).toContain('No oxygen');
    expect(survival.health).toBe(10);
    expect(survival.food).toBe(16);
    expect(survival.slots[4].count).toBe(4);
  });

  it('refuses to eat just for healing when oxygen is empty and food is full', () => {
    const survival = new SurvivalSystem();
    survival.oxygen = 0;
    survival.health = 10;
    expect(survival.consumeSlotItem(4)).toContain('already full');
    expect(survival.health).toBe(10);
    expect(survival.slots[4].count).toBe(5);
  });

  it('heals with normal oxygen even when food is full', () => {
    const survival = new SurvivalSystem();
    survival.health = 10;
    expect(survival.consumeSlotItem(4)).toBe('You ate a Mars carrot (+Food)');
    expect(survival.health).toBe(12);
    expect(survival.slots[4].count).toBe(4);
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
    const iceId = survival.slots[3].id;
    survival.inventorySlots[12] = { id: iceId, name: 'ice', count: 4 };
    expect(survival.countItem(iceId)).toBe(9);
    expect(survival.removeItems(iceId, 7)).toBe(7);
    expect(survival.countItem(iceId)).toBe(2);
    expect(survival.removeItems(iceId, 10)).toBe(2);
  });
});
