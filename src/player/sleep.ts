// @ts-nocheck
import { MISSION_CONFIG, SLEEP_CONFIG } from '../config/constants.ts';

// Regras puras do sono no beliche (issue #109). Sem DOM nem Three.js, para testar com Vitest.
// O GameEngine liga isso ao relogio do ceu, a missao e a base (GameEngine._updateSleep).

export const SLEEP_MODES = Object.freeze({ SUNRISE: 'sunrise', NAP: 'nap' });

// Por que o jogador nao consegue dormir agora (null = pode dormir)
export const SLEEP_BLOCK_TEXT = Object.freeze({
  outside: 'You can only sleep in a bunk inside the base.',
  'no-air': 'The base is losing air. Fix the leak before you sleep!',
  storm: 'A solar storm is coming. Stay awake and get to the storm shelter!',
  battery: 'The battery is empty. Life support needs power while you sleep.',
  alarm: 'An alarm is on in the base. Fix it before you sleep.',
  hungry: 'You are too hungry to sleep. Eat something first.',
  thirsty: 'You are too thirsty to sleep. Drink some water first.',
});

// O que acordou o jogador antes da hora
export const WAKE_TEXT = Object.freeze({
  storm: 'A solar storm warning woke you up!',
  battery: 'The battery ran out and the alarm woke you up!',
  breach: 'The base is losing air! You woke up.',
  crew: 'The crew woke you up: an alarm is on in the base.',
  hungry: 'Your growling stomach woke you up.',
  thirsty: 'You woke up thirsty.',
});

// Sol abaixo do horizonte (18h-6h no relogio do jogo)
export function isNightHour(timeOfDay) {
  const t = ((timeOfDay % 24) + 24) % 24;
  return t >= SLEEP_CONFIG.NIGHT_FROM_HOUR || t < MISSION_CONFIG.SUNRISE_HOUR;
}

// Horas de jogo ate o proximo nascer do sol (0 < h <= 24)
export function hoursUntilSunrise(timeOfDay) {
  const h = (((MISSION_CONFIG.SUNRISE_HOUR - timeOfDay) % 24) + 24) % 24;
  return h === 0 ? 24 : h;
}

// Quantas horas o jogador quer dormir. "Ate o nascer do sol" so vale de noite (de dia = 0).
export function plannedSleepHours(mode, timeOfDay) {
  if (mode === SLEEP_MODES.NAP) return SLEEP_CONFIG.NAP_HOURS;
  if (mode === SLEEP_MODES.SUNRISE) return isNightHour(timeOfDay) ? hoursUntilSunrise(timeOfDay) : 0;
  return 0;
}

// Fome e sede gastas em `hours` horas de jogo dormindo: proporcional as horas dormidas
export function sleepNeedsCost(hours) {
  const h = Math.max(0, hours);
  return { food: h * SLEEP_CONFIG.FOOD_PER_HOUR, water: h * SLEEP_CONFIG.WATER_PER_HOUR };
}

// Da para deitar agora? Devolve o motivo (chave de SLEEP_BLOCK_TEXT) ou null.
export function sleepBlocker({
  insideBase, baseBreached = false, baseOxygen = 100, stormPhase = 'none',
  batteryCharge = 1, alarm = false, food = Infinity, water = Infinity,
}) {
  if (!insideBase) return 'outside';
  if (baseBreached || baseOxygen < SLEEP_CONFIG.MIN_BASE_OXYGEN) return 'no-air';
  if (stormPhase === 'warning' || stormPhase === 'active') return 'storm';
  if (batteryCharge <= 0) return 'battery';
  if (alarm) return 'alarm';
  if (food <= SLEEP_CONFIG.WAKE_NEED_LEVEL) return 'hungry';
  if (water <= SLEEP_CONFIG.WAKE_NEED_LEVEL) return 'thirsty';
  return null;
}

// Algo neste passo acorda o jogador? `events` = tipos de evento da missao que sairam no passo.
// Devolve o motivo (chave de WAKE_TEXT) ou null.
export function wakeReason({
  events = [], batteryCharge = 1, baseBreached = false, crewAlert = false,
  food = Infinity, water = Infinity,
}) {
  if (events.includes('storm-warning') || events.includes('storm-start')) return 'storm';
  if (baseBreached) return 'breach';
  if (batteryCharge <= 0) return 'battery';
  if (crewAlert) return 'crew';
  if (food <= SLEEP_CONFIG.WAKE_NEED_LEVEL) return 'hungry';
  if (water <= SLEEP_CONFIG.WAKE_NEED_LEVEL) return 'thirsty';
  return null;
}

export function createSleepSession(plannedHours) {
  return { plannedHours, sleptHours: 0, wakeReason: null, done: plannedHours <= 0 };
}

// Avanca o sono no maximo `maxHours` horas de jogo, em passos de ate `stepHours`.
// `world.step(h)` anda a base (relogio, missao, fome e sede) e devolve o motivo para acordar
// (ou null). Se algo acordar o jogador, o sono para no fim daquele passo: o relogio fica na
// hora do evento, nao no fim do sono planejado.
export function advanceSleep(session, maxHours, world, stepHours = SLEEP_CONFIG.STEP_HOURS) {
  let budget = maxHours;
  while (!session.done && budget > 1e-9) {
    const step = Math.min(stepHours, budget, session.plannedHours - session.sleptHours);
    if (step <= 1e-9) break;
    const reason = world.step(step);
    session.sleptHours += step;
    budget -= step;
    if (reason) {
      session.wakeReason = reason;
      session.done = true;
    }
  }
  if (session.sleptHours >= session.plannedHours - 1e-9) session.done = true;
  return session;
}

// Horas "acordado" que sobram depois de dormir `sleptHours`
export function awakeHoursAfterSleep(awakeHours, sleptHours) {
  return Math.max(0, awakeHours - sleptHours * SLEEP_CONFIG.REST_PER_HOUR_SLEPT);
}

// Mais de um sol inteiro acordado: o trabalho fica mais lento
export function isTired(awakeHours) {
  return awakeHours > SLEEP_CONFIG.TIRED_AFTER_HOURS;
}

function formatSleptHours(hours) {
  const total = Math.round(hours * 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

// Card de uma linha ao acordar: "You slept 7 h. Battery 62% -> 41%."
export function wakeSummary({ sleptHours, batteryBefore, batteryAfter, reason = null }) {
  const line = `You slept ${formatSleptHours(sleptHours)}. Battery ${Math.round(batteryBefore)}% -> ${Math.round(batteryAfter)}%.`;
  return reason ? `${WAKE_TEXT[reason]} ${line}` : line;
}

// Fato real mostrado na primeira vez que o jogador dorme
export const ASTRONAUT_SLEEP_FACT = `Real fact: astronauts on the Space Shuttle and the Space Station slept only about ${SLEEP_CONFIG.ASTRONAUT_SLEEP_HOURS} hours a night, even with ${SLEEP_CONFIG.ASTRONAUT_SCHEDULED_SLEEP_HOURS} hours planned for sleep. Tired people make more mistakes. (Study of 85 astronauts, Barger et al., 2014)`;
