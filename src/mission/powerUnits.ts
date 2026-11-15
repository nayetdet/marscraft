import { ENERGY_CONFIG, TIME_SCALE_CONFIG } from '../config/constants.ts';

// Energia em unidade real (issue #229). A bateria do jogo e medida em %, sem tamanho fisico.
// Para a crianca (e para nos) compararmos com o mundo real, existe UMA regua declarada: o reator
// do jogo vale uma unidade Kilopower de 10 kW (NASA, 2018). Dela saem os kW e os kWh de tudo.
//
// Honestidade com o dado: so a potencia do Kilopower e a do MMRTG sao reais. As proporcoes entre
// os consumos do jogo continuam sendo escala de jogo, e esta conta mostra justamente o quanto:
// o gerador nuclear do jogo, nesta regua, vale varios MMRTGs de verdade. O HUD continua em %.

// kW que valem 1 % de bateria por hora de jogo
export const KW_PER_PERCENT_PER_HOUR = TIME_SCALE_CONFIG.REACTOR_KW / ENERGY_CONFIG.REACTOR_CHARGE_PER_HOUR;

// Tamanho da bateria cheia, em kWh
export const BATTERY_KWH = ENERGY_CONFIG.BATTERY_CAPACITY * KW_PER_PERCENT_PER_HOUR;

// % de bateria por hora de jogo -> kW
export function percentPerHourToKw(percentPerHour: number): number {
  return percentPerHour * KW_PER_PERCENT_PER_HOUR;
}

// % de bateria -> kWh
export function percentToKwh(percent: number): number {
  return percent * KW_PER_PERCENT_PER_HOUR;
}

// Potencia do campo solar com o Sol a pino em Marte, em kW
export const SOLAR_PEAK_KW = percentPerHourToKw(ENERGY_CONFIG.PANEL_PEAK_CHARGE_EARTH_PER_HOUR * ENERGY_CONFIG.MARS_SUNLIGHT_FRACTION);

// Gerador nuclear do jogo (RTG), em kW, e quantos MMRTGs de verdade isso seria
export const RTG_KW = percentPerHourToKw(ENERGY_CONFIG.RTG_LIFE_SUPPORT_PER_HOUR);
export const RTG_IN_REAL_MMRTGS = Math.round(RTG_KW / TIME_SCALE_CONFIG.MMRTG_KW);
