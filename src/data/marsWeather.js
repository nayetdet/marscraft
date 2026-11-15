import insightWeather from './insightWeather.json';
import { WEATHER_CONFIG } from '../config/constants.js';

// Clima real do InSight (issue #108). Unico lugar que le src/data/insightWeather.json, gerado
// por scripts/fetch-insight-weather.mjs. Cada sol do jogo usa um sol real, em sequencia
// (sol 1 do jogo = primeiro sol do arquivo), repetindo depois do ultimo.
// Rotulo honesto: sempre "real data from InSight", nunca "today" nem "live" (o InSight
// encerrou em 2022 e o feed arquivado e sempre o mesmo).

export const INSIGHT_SOLS = insightWeather.sols;
export const INSIGHT_FETCHED = insightWeather.fetched;

// Extremos de todos os sols do arquivo: o aquecedor gasta o minimo no sol mais quente e o
// maximo no mais frio
export const WEATHER_RANGE = {
  coldestC: Math.min(...INSIGHT_SOLS.map((s) => s.tempC.min)),
  warmestC: Math.max(...INSIGHT_SOLS.map((s) => s.tempC.max)),
};

const mean = (values) => values.reduce((a, b) => a + b, 0) / values.length;
// Media dos sols do arquivo: ar (C) e pressao (Pa). Pressao ao nivel do mar na Terra: 101.325 Pa
// (valor padrao de fisica, nao e dado de Marte).
export const INSIGHT_AVG_C = mean(INSIGHT_SOLS.map((s) => s.tempC.avg));
export const INSIGHT_PRESSURE_PA = mean(INSIGHT_SOLS.filter((s) => s.pressurePa).map((s) => s.pressurePa.avg));
export const INSIGHT_PRESSURE_PCT_EARTH = (INSIGHT_PRESSURE_PA / 101325) * 100;

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const firstDay = new Date(INSIGHT_SOLS[0].firstUtc);
// "October 2020": quando o InSight mediu este clima (rotulo honesto, nunca "today")
export const INSIGHT_MONTH = `${MONTHS[firstDay.getUTCMonth()]} ${firstDay.getUTCFullYear()}`;

const pad2 = (n) => String(n).padStart(2, '0');
const clamp01 = (v) => Math.max(0, Math.min(1, v));

// "2020-10-20T19:11:55Z" -> "20/10/2020"
function dateDMY(iso) {
  const d = new Date(iso);
  return `${pad2(d.getUTCDate())}/${pad2(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`;
}

// Indice do sol do jogo (0 = sol 1) a partir das horas de jogo totais
function solIndex(gameHours) {
  return Math.floor(gameHours / 24);
}

function entryFor(index) {
  const n = INSIGHT_SOLS.length;
  return INSIGHT_SOLS[((index % n) + n) % n];
}

// Sol real que o sol do jogo usa: { sol, date, minC, maxC, avgC, gustMs, windAvgMs, pressurePa }
export function solWeather(gameHours) {
  const e = entryFor(solIndex(gameHours));
  return {
    sol: e.sol,
    date: dateDMY(e.firstUtc),
    minC: e.tempC.min,
    maxC: e.tempC.max,
    avgC: e.tempC.avg,
    gustMs: e.windMs.gust,
    windAvgMs: e.windMs.avg,
    pressurePa: e.pressurePa?.avg ?? null,
  };
}

// Meia onda de cosseno de `a` (em t = 0) ate `b` (em t = 1)
function ease(a, b, t) {
  return a + (b - a) * (1 - Math.cos(Math.PI * clamp01(t))) / 2;
}

// Temperatura do ar la fora (C). Sobe da minima do sol (COLDEST_HOUR) ate a maxima
// (WARMEST_HOUR) e desce ate a minima do sol seguinte: a curva nao pula na meia-noite.
// A forma e aproximacao de jogo; a minima e a maxima sao as reais de cada sol.
export function outsideTemperatureC(gameHours) {
  const { COLDEST_HOUR: cold, WARMEST_HOUR: warm } = WEATHER_CONFIG;
  const index = solIndex(gameHours);
  const hour = gameHours - index * 24;
  const today = entryFor(index).tempC;
  if (hour >= cold && hour < warm) return ease(today.min, today.max, (hour - cold) / (warm - cold));
  const night = 24 - (warm - cold); // horas de esfriar, da maxima ate a minima seguinte
  if (hour >= warm) return ease(today.max, entryFor(index + 1).tempC.min, (hour - warm) / night);
  const yesterday = entryFor(index - 1).tempC;
  return ease(yesterday.max, today.min, (hour + 24 - warm) / night);
}

// 0 no ar mais quente do arquivo, 1 no mais frio: quanto o aquecedor precisa trabalhar
export function coldFraction(tempC) {
  return clamp01((WEATHER_RANGE.warmestC - tempC) / (WEATHER_RANGE.warmestC - WEATHER_RANGE.coldestC));
}

export function formatTempC(tempC) {
  return `${Math.round(tempC)} C`;
}
