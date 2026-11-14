import { RADIATION_CONFIG } from '../config/constants.js';

// Dose normal na superficie de Marte em mSv por hora (uGy/h x fator de qualidade / 1000)
export const BASE_DOSE_MSV_PER_HOUR =
  (RADIATION_CONFIG.MARS_SURFACE_DOSE_UGY_PER_HOUR * RADIATION_CONFIG.QUALITY_FACTOR) / 1000;

export function doseRateMsvPerHour({ stormMultiplier = 1, insideHabitat = false, shieldOn = false } = {}) {
  let rate = BASE_DOSE_MSV_PER_HOUR * stormMultiplier;
  if (insideHabitat) rate *= RADIATION_CONFIG.HABITAT_FACTOR;
  if (shieldOn) rate *= RADIATION_CONFIG.SHIELD_FACTOR;
  return rate;
}

// Pontos de vida perdidos em `hours` horas de jogo com essa taxa de dose
export function radiationDamage(doseRate, hours) {
  const excess = Math.max(0, doseRate - RADIATION_CONFIG.HARM_THRESHOLD_MSV_PER_HOUR);
  return excess * hours * RADIATION_CONFIG.DAMAGE_PER_EXCESS_MSV;
}
