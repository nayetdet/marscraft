import { ACT3_CONFIG, STATION_CONFIG } from '../../config/constants.ts';

// Trade-off do ato 3 (issue #421): academia agora ou depois. Treinar deixa de custar so bateria:
// gasta tambem comida e agua (as barras da crianca) e horas do relogio de Marte. Logica pura (sem
// DOM nem Three.js): quem cobra e o StationSystem.exercise; quem mostra e o painel da academia.
// Os valores sao regra de jogo (ACT3_CONFIG), nao dado da NASA.

export interface WorkoutCost {
  power: number; // % da bateria da base
  foodPct: number; // % da barra de comida da crianca
  waterPct: number; // % da barra de agua da crianca
  hours: number; // horas de jogo que o relogio anda
}

export const WORKOUT_COST: Readonly<WorkoutCost> = Object.freeze({
  power: STATION_CONFIG.EXERCISE_COST,
  foodPct: ACT3_CONFIG.WORKOUT_FOOD_PCT,
  waterPct: ACT3_CONFIG.WORKOUT_WATER_PCT,
  hours: ACT3_CONFIG.WORKOUT_HOURS,
});

export const TOO_HUNGRY = 'Too hungry to train: eat first.';
export const TOO_THIRSTY = 'Too thirsty to train: drink first.';

// Linha de custos do painel da academia, mostrada antes de a crianca treinar
export const WORKOUT_COST_TEXT = `Each set: −${WORKOUT_COST.power}% power, −${WORKOUT_COST.foodPct}% food, −${WORKOUT_COST.waterPct}% water, ${WORKOUT_COST.hours} hours`;

// Pontos de barra (0 a maxStat) que um treino gasta
export function workoutNeeds(maxStat: number): { food: number; water: number } {
  return { food: maxStat * WORKOUT_COST.foodPct / 100, water: maxStat * WORKOUT_COST.waterPct / 100 };
}

// Por que a crianca nao pode treinar agora (null = pode). Sem as barras (testes antigos, sem
// jogador) nao ha bloqueio. Comer e beber resolvem: o treino nunca fica travado para sempre.
export function workoutBlocker(body: { food: number; water: number; maxStat: number } | null | undefined): string | null {
  if (!body) return null;
  if (body.food < body.maxStat * WORKOUT_COST.foodPct / 100) return TOO_HUNGRY;
  if (body.water < body.maxStat * WORKOUT_COST.waterPct / 100) return TOO_THIRSTY;
  return null;
}

// Traducoes dos textos acima (as chaves sao as frases em ingles; entram no catalogo de i18n.ts)
export const GYM_PT_BR: Record<string, string> = {
  [TOO_HUNGRY]: 'Fome demais para treinar: coma primeiro.',
  [TOO_THIRSTY]: 'Sede demais para treinar: beba primeiro.',
  [WORKOUT_COST_TEXT]: `Cada série: −${WORKOUT_COST.power}% de energia, −${WORKOUT_COST.foodPct}% de comida, −${WORKOUT_COST.waterPct}% de água, ${WORKOUT_COST.hours} horas`,
};

export const GYM_ES: Record<string, string> = {
  [TOO_HUNGRY]: 'Demasiada hambre para entrenar: come primero.',
  [TOO_THIRSTY]: 'Demasiada sed para entrenar: bebe primero.',
  [WORKOUT_COST_TEXT]: `Cada serie: −${WORKOUT_COST.power}% de energía, −${WORKOUT_COST.foodPct}% de comida, −${WORKOUT_COST.waterPct}% de agua, ${WORKOUT_COST.hours} horas`,
};
