import { describe, it, expect } from 'vitest';
import { DOSE_CONFIG, ENERGY_CONFIG, UTILITY_CONFIG } from '../config/constants.js';
import { MissionSystem } from './MissionSystem.js';
import { doseBreakdown, doseHistoryText } from './doseBudget.js';

// Teste com jogadores de 15/11/2026: com a bateria vazia a noite nao havia nada a fazer.
// O reator de fissao (Kilopower) e a saida: energia sem Sol, paga com dose de radiacao.
const night = () => new MissionSystem({ cmes: [], startHours: 20, stormsStarted: false });

describe('fission reactor (night power)', () => {
  it('starts off and adds nothing', () => {
    const mission = night();
    mission.battery.charge = 0;
    mission.update(22, { insideHabitat: true });
    expect(mission.reactorOn).toBe(false);
    expect(mission.battery.charge).toBe(0);
    expect(mission.doseBreakdown.reactor).toBe(0);
  });

  it('can be switched on with an empty battery and charges it with no Sun', () => {
    const mission = night();
    mission.battery.charge = 0;
    expect(mission.toggleReactor()).toBe(true);
    mission.update(22, { insideHabitat: true });
    expect(mission.chargeRate).toBe(0); // noite: os paineis nao geram nada
    expect(mission.battery.charge).toBeCloseTo(ENERGY_CONFIG.REACTOR_CHARGE_PER_HOUR * 2, 4);
    expect(mission.reactorEnergy).toBeCloseTo(mission.battery.charge, 6);
  });

  it('is not free: the dose bar climbs faster while it runs', () => {
    const off = night();
    const on = night();
    on.toggleReactor();
    off.update(26, { insideHabitat: true });
    on.update(26, { insideHabitat: true });
    expect(on.totalDoseMsv - off.totalDoseMsv).toBeCloseTo(DOSE_CONFIG.REACTOR_MSV_PER_HOUR * 6, 4);
    expect(on.doseBreakdown.reactor).toBeCloseTo(DOSE_CONFIG.REACTOR_MSV_PER_HOUR * 6, 4);
    // A dose normal da base continua na conta da base, nao na do reator
    expect(on.doseBreakdown.habitat).toBeCloseTo(off.doseBreakdown.habitat, 6);
    expect(on.missionDoseRate).toBeGreaterThan(off.missionDoseRate);
  });

  it('pays for the heater and the lights at night, but not for the factory or the shield', () => {
    const passiveNight = UTILITY_CONFIG.HEATER_NIGHT_PER_HOUR + UTILITY_CONFIG.GREENHOUSE_LIGHTS_PER_HOUR;
    expect(ENERGY_CONFIG.REACTOR_CHARGE_PER_HOUR).toBeGreaterThan(passiveNight);
    expect(ENERGY_CONFIG.REACTOR_CHARGE_PER_HOUR).toBeLessThan(ENERGY_CONFIG.ISRU_DRAIN_PER_HOUR);
    expect(ENERGY_CONFIG.REACTOR_CHARGE_PER_HOUR).toBeLessThan(ENERGY_CONFIG.SHIELD_DRAIN_PER_HOUR);
  });

  it('a whole night of reactor costs a visible but survivable slice of the dose budget', () => {
    const left = doseBreakdown({ transit: 0, eva: 0, storm: 0, habitat: 0 }).limit - night().totalDoseMsv;
    const oneNight = DOSE_CONFIG.REACTOR_MSV_PER_HOUR * 12;
    expect(oneNight / left).toBeGreaterThan(0.05);
    expect(oneNight / left).toBeLessThan(0.2);
  });

  it('shows up in the dose history only after it was used', () => {
    const mission = night();
    expect(doseHistoryText(mission.doseBreakdown)).not.toContain('Fission reactor');
    mission.toggleReactor();
    mission.update(23, { insideHabitat: true });
    expect(doseHistoryText(mission.doseBreakdown)).toContain('Fission reactor');
  });
});
