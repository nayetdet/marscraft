import { RADIATION_CONFIG } from '../config/constants.js';

// Dose normal na superficie de Marte em mSv por hora (uGy/h x fator de qualidade / 1000)
export const BASE_DOSE_MSV_PER_HOUR =
  (RADIATION_CONFIG.MARS_SURFACE_DOSE_UGY_PER_HOUR * RADIATION_CONFIG.QUALITY_FACTOR) / 1000;

// Fracao da dose que atravessa a parede de agua do abrigo (1 = parede vazia).
// Interpola a curva do PREDICCS em g/cm2 de agua.
export function shelterDoseFactor(waterL) {
  const curve = RADIATION_CONFIG.SHELTER_WATER_CURVE;
  const gcm2 = Math.max(0, waterL) * RADIATION_CONFIG.SHELTER_G_CM2_PER_L;
  for (let i = 1; i < curve.length; i++) {
    const [x1, y1] = curve[i];
    if (gcm2 <= x1) {
      const [x0, y0] = curve[i - 1];
      return y0 + ((gcm2 - x0) / (x1 - x0)) * (y1 - y0);
    }
  }
  return curve[curve.length - 1][1];
}

// uGy -> mSv com o fator de qualidade medio medido na superficie de Marte
export function uGyToMsv(uGy) {
  return (uGy * RADIATION_CONFIG.QUALITY_FACTOR) / 1000;
}

// `stormDoseUGyPerHour` = dose da tempestade ativa la fora (0 em calmaria: fica a dose normal).
// `shelterWaterL` so conta quando o jogador esta dentro do abrigo (0 fora dele).
export function doseRateMsvPerHour({ stormDoseUGyPerHour = 0, insideHabitat = false, shieldOn = false, shelterWaterL = 0 } = {}) {
  let rate = Math.max(BASE_DOSE_MSV_PER_HOUR, uGyToMsv(stormDoseUGyPerHour));
  if (insideHabitat) rate *= RADIATION_CONFIG.HABITAT_FACTOR;
  if (shieldOn) rate *= RADIATION_CONFIG.SHIELD_FACTOR;
  if (shelterWaterL > 0) rate *= shelterDoseFactor(shelterWaterL);
  return rate;
}

// Pontos de vida perdidos em `hours` horas de jogo com essa taxa de dose
export function radiationDamage(doseRate, hours) {
  const excess = Math.max(0, doseRate - RADIATION_CONFIG.HARM_THRESHOLD_MSV_PER_HOUR);
  return excess * hours * RADIATION_CONFIG.DAMAGE_PER_EXCESS_MSV;
}
