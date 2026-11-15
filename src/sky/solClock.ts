// @ts-nocheck
const HOURS_PER_SOL = 24;

// Avanca o relogio do ceu em `deltaHours` horas de jogo. Um avanco grande (painel de admin,
// dormir) pode cruzar varias viradas de sol: cada uma soma 1 ao contador e a hora volta para 0-24.
export function advanceSolClock(timeOfDay, solCount, deltaHours) {
  const total = timeOfDay + Math.max(0, deltaHours);
  const solsPassed = Math.floor(total / HOURS_PER_SOL);
  return {
    timeOfDay: total - solsPassed * HOURS_PER_SOL,
    solCount: solCount + solsPassed,
  };
}
