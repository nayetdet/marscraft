import { SURVIVAL_CONFIG } from '../config/constants.js';

/**
 * Formats a duration in seconds as a compact EVA remaining-time label (e.g. "3m 45s").
 */
export function formatRemainingTime(seconds) {
  const clamped = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  if (mins <= 0) return `${secs}s`;
  return `${mins}m ${String(secs).padStart(2, '0')}s`;
}

/**
 * Returns the color tone for suit O2 (%): green > 50, yellow <= 50, blinking red < 20.
 */
export function getSuitO2Tone(o2Pct) {
  if (o2Pct < 20) return 'critical';
  if (o2Pct <= 50) return 'warn';
  return 'ok';
}

function lowIsBadTone(pct, warnAt = 50, critAt = 20) {
  if (pct < critAt) return 'critical';
  if (pct <= warnAt) return 'warn';
  return 'ok';
}

/**
 * Computes normalized suit telemetry, wear status, and Suitport diagnostic labels.
 */
export function getSuitTelemetryView(survival, {
  outsideTempC = -60,
  batteryPercent = 100,
  suitUpgraded = false,
  dirtySuit = false,
  airlockPressurized = true,
  airlockDoorOpen = false,
} = {}) {
  const s = survival ?? {};
  const equipped = Boolean(s.suitEquipped);
  const o2Pct = Math.round(Math.max(0, Math.min(100, s.suitOxygen ?? 100)));
  const thermalPct = Math.round(Math.max(0, Math.min(100, s.suitThermal ?? 100)));
  const scrubberPct = Math.round(Math.max(0, Math.min(100, s.suitScrubber ?? 100)));
  const dustPct = Math.round(Math.max(0, Math.min(100, s.suitDust ?? 0)));
  const integrityPct = Math.round(Math.max(0, Math.min(100, s.suitIntegrity ?? 100)));
  const wearPct = Math.max(0, 100 - integrityPct);

  const drainRate = Math.max(0.01, s.suitO2DrainRate ?? SURVIVAL_CONFIG.SUIT_OXYGEN_DRAIN_PER_SECOND);
  const o2EtaSec = (s.suitOxygen ?? 100) / drainRate;
  const o2EtaText = formatRemainingTime(o2EtaSec);
  const o2Tone = getSuitO2Tone(o2Pct);
  const o2HudValue = `${o2Pct}% ~ ${o2EtaText}`;

  const rechargingBase = (!equipped || Boolean(s.insidePressurizedShip)) && !s.baseBreached;
  let o2DockText;
  if (o2Pct >= 100) {
    o2DockText = 'CHARGED 100%';
  } else if (rechargingBase && !s.oxygenNeedsPower) {
    o2DockText = `RECHARGING... ${o2Pct}% -> 100%`;
  } else if (s.oxygenNeedsPower) {
    o2DockText = `NO POWER (${o2Pct}%)`;
  } else {
    o2DockText = `${o2Pct}% ~ ${o2EtaText}`;
  }

  const thermalTone = lowIsBadTone(thermalPct, 50, 20);
  const refTemp = Math.round(Number.isFinite(outsideTempC) ? outsideTempC : SURVIVAL_CONFIG.SUIT_THERMAL_COLD_REFERENCE_C);
  let thermalDockText;
  if (thermalPct >= 80) {
    thermalDockText = `${thermalPct}% (${refTemp}°C NIGHT READY)`;
  } else if (!equipped && batteryPercent > 0.5) {
    thermalDockText = `RECHARGING... ${thermalPct}% -> 100%`;
  } else if (thermalPct >= SURVIVAL_CONFIG.SUIT_THERMAL_MIN_READY) {
    thermalDockText = `${thermalPct}% (${refTemp}°C STANDBY)`;
  } else {
    thermalDockText = `${thermalPct}% (LOW THERMAL)`;
  }

  const scrubberTone = lowIsBadTone(scrubberPct, 50, 20);
  const scrubberDockText = !equipped && scrubberPct < 100
    ? `AUTO-CLEANING ${scrubberPct}% -> 100%`
    : `${scrubberPct}% READY`;

  const isDusty = Boolean(dirtySuit) || dustPct >= 10;
  const dustTone = dustPct >= 60 ? 'critical' : isDusty ? 'warn' : 'ok';
  const dustStatus = isDusty ? `DUSTY (${dustPct}%)` : 'CLEAN';

  const integrityTone = integrityPct <= 0 ? 'critical' : lowIsBadTone(integrityPct, 55, 25);
  const protectsO2 = Boolean(equipped && (s.suitIntegrity ?? 100) > 0 && (s.suitOxygen ?? 100) > 0);

  const hasMinO2 = (s.suitOxygen ?? 100) >= SURVIVAL_CONFIG.SUIT_OXYGEN_MIN_READY;
  const hasMinThermal = (s.suitThermal ?? 100) >= SURVIVAL_CONFIG.SUIT_THERMAL_MIN_READY;
  const hasMinScrubber = (s.suitScrubber ?? 100) >= SURVIVAL_CONFIG.SUIT_SCRUBBER_MIN_READY;
  const hasIntegrity = (s.suitIntegrity ?? 100) > 0;
  const minSystemsReady = hasIntegrity && hasMinO2 && hasMinThermal && hasMinScrubber;
  const emergencyReady = hasIntegrity && batteryPercent <= 0.5;

  let readyReason = 'SYSTEMS READY';
  if (!hasIntegrity) readyReason = 'REPAIR SUIT WEAR [R]';
  else if (!hasMinO2) readyReason = `CHARGING O2 (${o2Pct}% / ${SURVIVAL_CONFIG.SUIT_OXYGEN_MIN_READY}%)`;
  else if (!hasMinThermal) readyReason = `CHARGING THERMAL (${thermalPct}% / ${SURVIVAL_CONFIG.SUIT_THERMAL_MIN_READY}%)`;
  else if (!hasMinScrubber) readyReason = `CLEANING CO2 (${scrubberPct}% / ${SURVIVAL_CONFIG.SUIT_SCRUBBER_MIN_READY}%)`;

  const canEquipAtSuitport = airlockPressurized && !airlockDoorOpen && !equipped && (minSystemsReady || emergencyReady);
  let equipPromptLabel;
  if (!airlockPressurized || airlockDoorOpen) {
    equipPromptLabel = 'CLOSE OUTER DOOR & PRESSURIZE';
  } else if (equipped) {
    equipPromptLabel = '[F] DOCK EVA SUIT';
  } else if (minSystemsReady) {
    equipPromptLabel = '[F] EQUIP SUIT & START EVA';
  } else if (emergencyReady) {
    equipPromptLabel = '[F] EQUIP SUIT (EMERGENCY EVA)';
  } else {
    equipPromptLabel = readyReason;
  }

  return {
    equipped,
    upgraded: Boolean(suitUpgraded),
    o2Pct,
    o2EtaText,
    o2HudValue,
    o2Tone,
    o2DockText,
    thermalPct,
    thermalTone,
    thermalDockText,
    scrubberPct,
    scrubberTone,
    scrubberDockText,
    dustPct,
    isDusty,
    dustTone,
    dustStatus,
    integrityPct,
    wearPct,
    integrityTone,
    protectsO2,
    minSystemsReady,
    emergencyReady,
    canEquipAtSuitport,
    readyReason,
    equipPromptLabel,
  };
}
