// @ts-nocheck
import { describe, expect, it } from 'vitest';
import { formatRemainingTime, getSuitO2Tone, getSuitTelemetryView } from './suitTelemetry.ts';
import { SURVIVAL_CONFIG } from '../config/constants.ts';

describe('suitTelemetry', () => {
  it('formats remaining suit O2 time including the 94% ~ 3m 45s reference case', () => {
    expect(formatRemainingTime(225.6)).toBe('3m 45s');
    expect(formatRemainingTime(45)).toBe('45s');
    expect(formatRemainingTime(-10)).toBe('0s');

    const view = getSuitTelemetryView({
      suitEquipped: true,
      suitOxygen: 94,
      suitO2DrainRate: SURVIVAL_CONFIG.SUIT_OXYGEN_DRAIN_PER_SECOND,
    });
    expect(view.o2HudValue).toBe('94% ~ 3m 45s');
  });

  it('assigns O2 tones: green > 50, yellow <= 50, blinking red < 20', () => {
    expect(getSuitO2Tone(51)).toBe('ok');
    expect(getSuitO2Tone(50)).toBe('warn');
    expect(getSuitO2Tone(20)).toBe('warn');
    expect(getSuitO2Tone(19)).toBe('critical');
  });

  it('formats Suitport diagnostics for recharging, thermal night readiness, perchlorates, and wear', () => {
    const recharging = getSuitTelemetryView(
      {
        suitEquipped: false,
        suitOxygen: 85,
        suitThermal: 92,
        suitScrubber: 80,
        suitDust: 4,
        suitIntegrity: 75,
      },
      { outsideTempC: -60, dirtySuit: false, airlockPressurized: true, airlockDoorOpen: false },
    );

    expect(recharging.o2DockText).toBe('RECHARGING... 85% -> 100%');
    expect(recharging.thermalDockText).toBe('92% (-60°C NIGHT READY)');
    expect(recharging.scrubberDockText).toBe('AUTO-CLEANING 80% -> 100%');
    expect(recharging.dustStatus).toBe('CLEAN');
    expect(recharging.wearPct).toBe(25);
    expect(recharging.integrityPct).toBe(75);
    expect(recharging.minSystemsReady).toBe(true);
    expect(recharging.equipPromptLabel).toBe('[F] EQUIP SUIT & START EVA');

    const dustyWorn = getSuitTelemetryView(
      {
        suitEquipped: true,
        suitOxygen: 100,
        suitThermal: 100,
        suitScrubber: 100,
        suitDust: 24,
        suitIntegrity: 0,
      },
      { dirtySuit: true },
    );
    expect(dustyWorn.o2DockText).toBe('CHARGED 100%');
    expect(dustyWorn.dustStatus).toBe('DUSTY (24%)');
    expect(dustyWorn.protectsO2).toBe(false);
    expect(dustyWorn.wearPct).toBe(100);
  });

  it('gates suit equipping until minimum levels or repair are satisfied, with emergency low-battery fallback', () => {
    const lowO2 = getSuitTelemetryView(
      {
        suitEquipped: false,
        suitOxygen: 15,
        suitThermal: 90,
        suitScrubber: 90,
        suitIntegrity: 100,
      },
      { batteryPercent: 80, airlockPressurized: true, airlockDoorOpen: false },
    );
    expect(lowO2.minSystemsReady).toBe(false);
    expect(lowO2.canEquipAtSuitport).toBe(false);
    expect(lowO2.equipPromptLabel).toContain('CHARGING O2');

    const emergency = getSuitTelemetryView(
      {
        suitEquipped: false,
        suitOxygen: 15,
        suitThermal: 90,
        suitScrubber: 90,
        suitIntegrity: 80,
      },
      { batteryPercent: 0, airlockPressurized: true, airlockDoorOpen: false },
    );
    expect(emergency.emergencyReady).toBe(true);
    expect(emergency.canEquipAtSuitport).toBe(true);
    expect(emergency.equipPromptLabel).toBe('[F] EQUIP SUIT (EMERGENCY EVA)');

    const worn = getSuitTelemetryView({
      suitEquipped: false,
      suitOxygen: 100,
      suitThermal: 100,
      suitScrubber: 100,
      suitIntegrity: 0,
    });
    expect(worn.canEquipAtSuitport).toBe(false);
    expect(worn.equipPromptLabel).toBe('REPAIR SUIT WEAR [R]');

    const unsafeAirlock = getSuitTelemetryView(
      { suitEquipped: false, suitOxygen: 100, suitThermal: 100, suitScrubber: 100, suitIntegrity: 100 },
      { airlockPressurized: false, airlockDoorOpen: true },
    );
    expect(unsafeAirlock.canEquipAtSuitport).toBe(false);
    expect(unsafeAirlock.equipPromptLabel).toBe('CLOSE OUTER DOOR & PRESSURIZE');
  });
});
