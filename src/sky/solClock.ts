const HOURS_PER_SOL = 24;
const DAYLIGHT_START = 4;
const DAYLIGHT_HOURS = 16;
const NIGHT_HOURS = HOURS_PER_SOL - DAYLIGHT_HOURS;

// Mapeia 24 horas do sol para o percurso do Sol: 16 h de dia e 8 h de noite.
export function getSolarAngle(timeOfDay: number): number {
  const hour = ((timeOfDay % HOURS_PER_SOL) + HOURS_PER_SOL) % HOURS_PER_SOL;
  if (hour >= DAYLIGHT_START && hour < DAYLIGHT_START + DAYLIGHT_HOURS) {
    return ((hour - DAYLIGHT_START) / DAYLIGHT_HOURS) * Math.PI;
  }

  const nightHoursPassed =
    hour >= DAYLIGHT_START + DAYLIGHT_HOURS
      ? hour - (DAYLIGHT_START + DAYLIGHT_HOURS)
      : hour + NIGHT_HOURS / 2;
  return Math.PI + (nightHoursPassed / NIGHT_HOURS) * Math.PI;
}

// Avanca o relogio do ceu em `deltaHours` horas de jogo. Um avanco grande (painel de admin,
// dormir) pode cruzar varias viradas de sol: cada uma soma 1 ao contador e a hora volta para 0-24.
export function advanceSolClock(
  timeOfDay: number,
  solCount: number,
  deltaHours: number
): { timeOfDay: number; solCount: number } {
  const total = timeOfDay + Math.max(0, deltaHours);
  const solsPassed = Math.floor(total / HOURS_PER_SOL);
  return {
    timeOfDay: total - solsPassed * HOURS_PER_SOL,
    solCount: solCount + solsPassed,
  };
}
