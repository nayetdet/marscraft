// @ts-nocheck
import { describe, it, expect } from 'vitest';
import { BLOCK_IDS } from '../config/blockTypes.ts';
import { OXYGEN_PLANT_CONFIG as O } from '../config/constants.ts';
import { Battery } from './energy.ts';
import {
  ELECTROLYSIS_WATER_L_PER_PERSON_SOL,
  OxygenPlant,
  oxygenModeWarning,
  oxygenPointsToKg,
} from './oxygenPlant.ts';
import { oxygenPlantButtons, oxygenPlantText } from './oxygenText.ts';

function fakeInventory(regolith) {
  const items = { [BLOCK_IDS.REGOLITH]: regolith };
  return {
    items,
    countItem: (id) => items[id] ?? 0,
    removeItems: (id, n) => { items[id] -= n; },
  };
}

describe('OxygenPlant chemistry (issue #102)', () => {
  it('electrolysis splits 36 g of water for 32 g of oxygen: ~0.95 L per person per sol', () => {
    expect(O.WATER_KG_PER_O2_KG).toBeCloseTo(1.125);
    expect(ELECTROLYSIS_WATER_L_PER_PERSON_SOL).toBeCloseTo(0.945, 3);
    const plant = new OxygenPlant('electrolysis');
    expect(plant.crewWaterPerHour(1) * 24).toBeCloseTo(0.945, 3);
    // O ar do jogador segue a mesma razao: agua = 1,125 x kg de O2
    expect(plant.waterPerPoint()).toBeCloseTo(oxygenPointsToKg(1) * 1.125, 6);
  });

  it('MOXIE uses no water and costs more power per point', () => {
    const plant = new OxygenPlant('moxie');
    expect(plant.waterPerPoint()).toBe(0);
    expect(plant.crewWaterPerHour(4)).toBe(0);
    expect(plant.energyFactor).toBeGreaterThan(new OxygenPlant('electrolysis').energyFactor);
  });

  it('the Sabatier reactor gives back half of the electrolysis water', () => {
    const plant = new OxygenPlant('electrolysis');
    const before = plant.crewWaterPerHour(1);
    plant.sabatier = true;
    expect(plant.crewWaterPerHour(1)).toBeCloseTo(before * (1 - O.SABATIER_WATER_RETURN));
  });

  it('refill budget is limited by the tank in electrolysis and says why', () => {
    const plant = new OxygenPlant('electrolysis');
    expect(plant.refillBudget(10, { water: 0 })).toBe(0);
    expect(plant.limitedBy).toBe('water');
    expect(plant.refillBudget(0, { water: 50 })).toBe(0);
    expect(plant.limitedBy).toBe('power');
    expect(plant.refillBudget(10, { water: 50 })).toBe(10);
    expect(plant.limitedBy).toBe(null);
    plant.setMode('moxie');
    expect(plant.refillBudget(10, { water: 0 })).toBe(10);
  });

  it('switching modes explains the trade-off; unknown modes are ignored', () => {
    const plant = new OxygenPlant();
    expect(plant.mode).toBe('electrolysis');
    expect(plant.setMode('moxie')).toMatch(/more power/);
    expect(plant.mode).toBe('moxie');
    expect(plant.setMode('moxie')).toMatch(/already/);
    expect(plant.setMode('magic')).toBe('');
    expect(plant.mode).toBe('moxie');
    expect(plant.setMode('electrolysis')).toMatch(/water/);
  });

  it('crew air in electrolysis needs both water and power', () => {
    const plant = new OxygenPlant('electrolysis');
    const base = { battery: new Battery(100), water: 0 };
    expect(plant.supplyCrew(1, 0.75, base)).toBe(false);
    expect(base.battery.charge).toBe(100); // sem agua a maquina nao roda nem gasta energia
    base.water = 10;
    expect(plant.supplyCrew(1, 0.75, base)).toBe(true);
    expect(base.battery.charge).toBeCloseTo(100 - 0.75);
    expect(base.water).toBeCloseTo(10 - ELECTROLYSIS_WATER_L_PER_PERSON_SOL / 24);
  });

  it('printing the Sabatier reactor costs regolith and power, once', () => {
    const plant = new OxygenPlant();
    const battery = new Battery(50);
    expect(plant.buildSabatier({ battery, inventory: fakeInventory(1) })).toMatch(/regolith/);
    expect(plant.sabatier).toBe(false);
    const inventory = fakeInventory(O.SABATIER_REGOLITH);
    expect(plant.buildSabatier({ battery, inventory })).toMatch(/half of the water/);
    expect(plant.sabatier).toBe(true);
    expect(battery.charge).toBe(50 - O.SABATIER_POWER);
    expect(inventory.items[BLOCK_IDS.REGOLITH]).toBe(0);
    expect(plant.buildSabatier({ battery, inventory })).toMatch(/already/);
  });
});

describe('oxygenModeWarning', () => {
  it('warns only when the chosen mode drains the resource that is running out', () => {
    const water = new OxygenPlant('electrolysis');
    const moxie = new OxygenPlant('moxie');
    expect(oxygenModeWarning(water, { water: 5, batteryPct: 90 })).toBe('air-water-low');
    expect(oxygenModeWarning(water, { water: 50, batteryPct: 5 })).toBe(null);
    expect(oxygenModeWarning(moxie, { water: 50, batteryPct: 10 })).toBe('air-power-low');
    expect(oxygenModeWarning(moxie, { water: 2, batteryPct: 90 })).toBe(null);
    expect(oxygenModeWarning(undefined, { water: 0, batteryPct: 0 })).toBe(null);
  });
});

describe('oxygen panel text', () => {
  it('explains both machines to a kid and offers the switch', () => {
    const plant = new OxygenPlant();
    const text = oxygenPlantText(plant);
    expect(text).toContain('OXYGEN MACHINE: AIR FROM WATER');
    expect(text).toContain('Water is made of oxygen and hydrogen. This machine splits it so you can breathe the oxygen.');
    expect(text).toContain('This machine pulls oxygen out of Mars air. It needs no water, but a lot of power.');
    expect(text).toContain('0.95 L of water per person each sol');
    expect(text).toContain('game rules');
    const actions = oxygenPlantButtons(plant).map(([action, label]) => `${action}|${label}`);
    expect(actions).toEqual([
      'o2mode:electrolysis|Air from water (ON)',
      'o2mode:moxie|Air from Mars air',
      expect.stringMatching(/^buildSabatier\|/),
    ]);
    plant.sabatier = true;
    expect(oxygenPlantButtons(plant)).toHaveLength(2);
    expect(oxygenPlantText(plant)).toContain('0.47 L of water');
  });
});
