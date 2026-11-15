import { describe, it, expect } from 'vitest';
import {
  commandModel, formatClock, formatSpan, greenhouseModel, modelKey, powerModel, shelterModel,
} from './baseDisplayText.js';

function state(overrides = {}) {
  return {
    sol: 2, timeOfDay: 9.5, batteryPct: 64, chargeRate: 12, shieldOn: false,
    factoryOn: true, factoryBusy: false, greenhousePowered: true, dusty: false,
    storm: { phase: 'calm', hoursUntil: 5, hoursLeft: 0, speedKmS: 894, date: '01/11/2026' },
    doseRate: 0.005, totalDose: 1.26, water: 60, maxWater: 120, fields: { planted: 0, ready: 0, total: 9 }, inShelter: false, shelterWaterL: 20,
    donkiDate: '14/11/2026',
    ...overrides,
  };
}

describe('base display text', () => {
  it('formats the clock and time spans', () => {
    expect(formatClock(9.5)).toBe('09:30');
    expect(formatSpan(2.5)).toBe('2 h 30 min');
    expect(formatSpan(0.2)).toBe('12 min');
  });

  it('command screen says where the storm data comes from and never calls it live', () => {
    const calm = commandModel(state());
    expect(calm.mode).toBe('ok');
    expect(calm.footer).toContain('real data from 14/11/2026');
    expect(calm.footer.toLowerCase()).not.toContain('live');

    const active = commandModel(state({ storm: { phase: 'active', hoursUntil: 0, hoursLeft: 1.5, speedKmS: 894, date: '01/11/2026' } }));
    expect(active.mode).toBe('alert');
    expect(active.footer).toContain('894 km/s');
    expect(active.rows.at(-1).value).toContain('STORM NOW');
  });

  it('power map shows night, the shield and an empty battery', () => {
    const night = powerModel(state({ chargeRate: 0, batteryPct: 0, greenhousePowered: false, shieldOn: true }));
    const byLabel = Object.fromEntries(night.rows.map((r) => [r.label, r.value]));
    expect(byLabel['SUN IN']).toBe('NIGHT: 0');
    expect(byLabel['O2 MAKER']).toBe('NO POWER');
    expect(byLabel.SHIELD).toBe('ON');
    expect(night.mode).toBe('alert');
  });

  it('shelter meter tells the player where to stand during a storm', () => {
    const storm = { phase: 'active', hoursUntil: 0, hoursLeft: 2, speedKmS: 900, date: '05/11/2026' };
    expect(shelterModel(state({ storm })).rows.at(-1).value).toBe('STAND HERE!');
    expect(shelterModel(state({ storm, inShelter: true })).rows.at(-1).value).toBe('YOU ARE SAFE HERE');
    // Dentro do abrigo com a parede vazia a dose ainda machuca: o medidor nao chama de seguro
    const dry = shelterModel(state({ storm, inShelter: true, doseRate: 1.4, shelterWaterL: 0 }));
    expect(dry.rows.at(-1).value).toBe('ADD WATER TO THE WALL!');
    expect(shelterModel(state()).rows.at(-1).value).toBe('NO STORM');
    expect(shelterModel(state()).rows[2].value).toBe('20 L');
  });

  it('greenhouse screen counts planted and ready fields and only redraws when they change', () => {
    const empty = greenhouseModel(state());
    const growing = greenhouseModel(state({ fields: { planted: 3, ready: 1, total: 9 } }));
    expect(empty.rows[2].value).toBe('0/9 PLANTED');
    expect(empty.rows[3].value).toBe('NOTHING YET');
    expect(growing.rows[2].value).toBe('3/9 PLANTED');
    expect(growing.rows[3].value).toBe('1 READY');
    expect(modelKey(empty)).toBe(modelKey(greenhouseModel(state())));
    expect(modelKey(empty)).not.toBe(modelKey(growing));
  });
});
