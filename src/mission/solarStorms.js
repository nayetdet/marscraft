import { RADIATION_CONFIG, STORM_CONFIG } from '../config/constants.js';

// Horas de jogo entre a CME sair do Sol e chegar a Marte (tempo de aviso)
export function leadTimeHours(speedKmS) {
  const realHours = STORM_CONFIG.SUN_MARS_DISTANCE_KM / speedKmS / 3600;
  return realHours / STORM_CONFIG.REAL_HOURS_PER_GAME_HOUR;
}

// Quantas vezes a dose normal durante a tempestade
export function stormMultiplier(speedKmS) {
  const raw = speedKmS * RADIATION_CONFIG.STORM_MULTIPLIER_PER_KMS;
  return Math.min(RADIATION_CONFIG.STORM_MULTIPLIER_MAX, Math.max(RADIATION_CONFIG.STORM_MULTIPLIER_MIN, raw));
}

// Fila de tempestades a partir das CMEs reais, em ordem cronologica, repetindo a lista se acabar.
// Cada tempestade: aviso -> chegada (aviso + tempo de viagem) -> fim (chegada + duracao).
export function buildStormSchedule(cmes, startHours, count = 24) {
  const candidates = cmes.filter((cme) => cme.speedKmS >= STORM_CONFIG.MIN_SPEED_KMS);
  if (candidates.length === 0) return [];

  const schedule = [];
  let warningStart = startHours + STORM_CONFIG.FIRST_WARNING_AFTER_HOURS;
  for (let i = 0; i < count; i++) {
    const cme = candidates[i % candidates.length];
    const leadHours = leadTimeHours(cme.speedKmS);
    const arrival = warningStart + leadHours;
    const end = arrival + STORM_CONFIG.DURATION_HOURS;
    schedule.push({
      index: i,
      cme,
      leadHours,
      multiplier: stormMultiplier(cme.speedKmS),
      warningStart,
      arrival,
      end,
    });
    warningStart = end + STORM_CONFIG.GAP_BETWEEN_STORMS_HOURS;
  }
  return schedule;
}

// Fase atual: 'calm' (antes do aviso), 'warning' (CME a caminho) ou 'active' (tempestade em Marte)
export function stormStateAt(schedule, hours) {
  for (const storm of schedule) {
    if (hours < storm.warningStart) return { phase: 'calm', storm, hoursUntil: storm.arrival - hours };
    if (hours < storm.arrival) return { phase: 'warning', storm, hoursUntil: storm.arrival - hours };
    if (hours < storm.end) return { phase: 'active', storm, hoursUntil: 0, hoursLeft: storm.end - hours };
  }
  return { phase: 'calm', storm: null, hoursUntil: Infinity };
}

// Painel de admin (testes): move a tempestade atual ou a proxima, e todas as seguintes, para que
// `target` comece agora: 'warning' (aviso), 'active' (tempestade) ou 'end' (acabou).
export function rescheduleStorms(schedule, hours, target) {
  const i = schedule.findIndex((storm) => hours < storm.end);
  if (i < 0) return schedule;
  const storm = schedule[i];
  const anchor = target === 'warning' ? storm.warningStart : target === 'active' ? storm.arrival : storm.end;
  const delta = hours - anchor - 1e-6;
  return schedule.map((s, j) => (j < i ? s : {
    ...s,
    warningStart: s.warningStart + delta,
    arrival: s.arrival + delta,
    end: s.end + delta,
  }));
}
