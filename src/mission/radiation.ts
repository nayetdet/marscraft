// @ts-nocheck
import { DOSE_CONFIG, RADIATION_CONFIG, STORM_CONFIG } from '../config/constants.ts';

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
  return Math.max(BASE_DOSE_MSV_PER_HOUR, uGyToMsv(stormDoseUGyPerHour))
    * protectionFactor({ insideHabitat, shieldOn, shelterWaterL });
}

// Fracao da dose que passa pelas protecoes. O traje melhorado so conta la fora.
export function protectionFactor({ insideHabitat = false, shieldOn = false, shelterWaterL = 0, suitUpgraded = false } = {}) {
  let factor = 1;
  if (insideHabitat) factor *= RADIATION_CONFIG.HABITAT_FACTOR;
  if (shieldOn) factor *= RADIATION_CONFIG.SHIELD_FACTOR;
  if (shelterWaterL > 0) factor *= shelterDoseFactor(shelterWaterL);
  if (suitUpgraded && !insideHabitat) factor *= DOSE_CONFIG.SUIT_FACTOR;
  return factor;
}

// Dose normal da superficie no relogio das tempestades (1 hora de jogo = 1 dia real)
export const CALM_DAY_DOSE_MSV = BASE_DOSE_MSV_PER_HOUR * STORM_CONFIG.REAL_HOURS_PER_GAME_HOUR;

// Dose que entra na barra da missao, em mSv por hora de jogo (issue #104, ESCALA DE JOGO).
// Calmaria e tempestade ficam no mesmo relogio e tudo e multiplicado por DOSE_CONFIG.GAME_FACTOR,
// com as mesmas protecoes de doseRateMsvPerHour (habitat, escudo, abrigo) e o traje melhorado.
export function missionDoseMsvPerHour({ stormDoseUGyPerHour = 0, ...protection } = {}) {
  return Math.max(CALM_DAY_DOSE_MSV, uGyToMsv(stormDoseUGyPerHour))
    * protectionFactor(protection) * DOSE_CONFIG.GAME_FACTOR;
}

// Pontos de vida perdidos em `hours` horas de jogo com essa taxa de dose
export function radiationDamage(doseRate, hours) {
  const excess = Math.max(0, doseRate - RADIATION_CONFIG.HARM_THRESHOLD_MSV_PER_HOUR);
  return excess * hours * RADIATION_CONFIG.DAMAGE_PER_EXCESS_MSV;
}
