// @ts-nocheck
import { RADIATION_CONFIG, SPACE_WEATHER_CONFIG, STORM_CONFIG } from '../config/constants.ts';

const REAL_HOUR_MS = 3600 * 1000;
const clamp01 = (v) => Math.max(0, Math.min(1, v));

// Horas de jogo entre a CME sair do Sol e chegar a Marte (tempo de aviso). Vem da chegada
// prevista pelo modelo da NASA para aquela CME (`marsArrivalTime`), nao de uma conta nossa.
export function leadTimeHours(cme) {
  const realHours = (Date.parse(cme.marsArrivalTime) - Date.parse(cme.startTime)) / REAL_HOUR_MS;
  if (!(realHours > 0)) return realHours / STORM_CONFIG.WARNING_REAL_HOURS_PER_GAME_HOUR;
  return Math.max(STORM_CONFIG.MIN_WARNING_HOURS, realHours / STORM_CONFIG.WARNING_REAL_HOURS_PER_GAME_HOUR);
}

// So viram tempestade as CMEs que a NASA previu que chegariam a Marte
export function marsBoundCmes(cmes) {
  return cmes.filter((cme) => cme.headedToMars && cme.marsArrivalTime && leadTimeHours(cme) > 0);
}

// Dose total (uGy) que a tempestade entrega la fora, sem protecao. E regra do jogo: quanto mais
// rapida a CME, mais forte, e golpe de raspao vale menos. O resultado fica sempre entre os dois
// eventos reais medidos pelo Curiosity (RADIATION_CONFIG.STORM_DOSE_MIN_UGY e _MAX_UGY).
export function stormTotalDoseUGy(cme) {
  const R = RADIATION_CONFIG;
  const speedPart = clamp01((cme.speedKmS - R.STORM_SPEED_MIN_KMS) / (R.STORM_SPEED_MAX_KMS - R.STORM_SPEED_MIN_KMS));
  const strength = speedPart * (cme.isGlancingBlow ? R.STORM_GLANCING_FACTOR : 1);
  return R.STORM_DOSE_MIN_UGY + (R.STORM_DOSE_MAX_UGY - R.STORM_DOSE_MIN_UGY) * strength;
}

// Uma tempestade a partir de uma CME real (ou de uma SEP real, com `sep`), com o aviso em `warningStart`.
// Cada tempestade: aviso -> chegada (aviso + `leadHours`) -> fim (chegada + duracao).
// Sem `leadHours`, o aviso e a viagem prevista pela NASA (CME) ou o aviso curto da SEP.
export function makeStorm({ index, cme = null, sep = null, warningStart, leadHours }) {
  const lead = leadHours ?? (sep ? SPACE_WEATHER_CONFIG.SEP_WARNING_HOURS : leadTimeHours(cme));
  const arrival = warningStart + lead;
  const totalDoseUGy = sep ? RADIATION_CONFIG.STORM_DOSE_MIN_UGY : stormTotalDoseUGy(cme);
  const storm = {
    index,
    cme,
    leadHours: lead,
    totalDoseUGy,
    // A dose total e entregue ao longo da tempestade (uGy por hora de jogo)
    doseUGyPerHour: totalDoseUGy / STORM_CONFIG.DURATION_HOURS,
    warningStart,
    arrival,
    end: arrival + STORM_CONFIG.DURATION_HOURS,
  };
  if (sep) Object.assign(storm, { kind: 'sep', sep });
  return storm;
}

// Primeira hora em que um novo aviso pode comecar depois da fila: calmaria depois da ultima
// tempestade e no maximo MAX_STORMS_PER_GAME_DAY avisos em qualquer janela de 24 h de jogo.
export function nextStormSlot(schedule, hours) {
  const last = schedule[schedule.length - 1];
  if (!last) return hours;
  const dailyLimitSpacing = STORM_CONFIG.GAME_DAY_HOURS / STORM_CONFIG.MAX_STORMS_PER_GAME_DAY
    + STORM_CONFIG.DAILY_SPACING_EPSILON_HOURS;
  return Math.max(hours, last.end + STORM_CONFIG.GAP_BETWEEN_STORMS_HOURS, last.warningStart + dailyLimitSpacing);
}

// Depois do tutorial, so viram tempestade os eventos que estao acontecendo agora na vida real,
// segundo o fetch ao vivo do DONKI:
// - CME: ja saiu do Sol e ainda esta a caminho de Marte, ou chegou ha menos de
//   CME_ACTIVE_AFTER_ARRIVAL_HOURS. O aviso e o que falta da viagem real, encolhido como em
//   leadTimeHours (no minimo MIN_WARNING_HOURS, para a crianca chegar ao abrigo).
// - SEP: medida ha menos de SEP_ACTIVE_HOURS, com o aviso curto de sempre.
// Devolve [{ id, cme, sep, leadHours }], na ordem em que os eventos comecaram.
export function liveStormEvents({ cmes = [], seps = [] } = {}, nowMs) {
  const W = SPACE_WEATHER_CONFIG;
  const events = [];
  for (const cme of marsBoundCmes(cmes)) {
    const startMs = Date.parse(cme.startTime);
    const arrivalMs = Date.parse(cme.marsArrivalTime);
    if (!(nowMs >= startMs && nowMs < arrivalMs + W.CME_ACTIVE_AFTER_ARRIVAL_HOURS * REAL_HOUR_MS)) continue;
    const realHoursLeft = Math.max(0, (arrivalMs - nowMs) / REAL_HOUR_MS);
    const leadHours = Math.max(STORM_CONFIG.MIN_WARNING_HOURS, realHoursLeft / STORM_CONFIG.WARNING_REAL_HOURS_PER_GAME_HOUR);
    events.push({ id: `cme:${cme.id}`, cme, sep: null, leadHours, startMs });
  }
  for (const sep of seps) {
    const startMs = Date.parse(sep.eventTime);
    if (!(nowMs >= startMs && nowMs < startMs + W.SEP_ACTIVE_HOURS * REAL_HOUR_MS)) continue;
    events.push({ id: `sep:${sep.id}`, cme: null, sep, leadHours: W.SEP_WARNING_HOURS, startMs });
  }
  return events.sort((a, b) => a.startMs - b.startMs).map(({ startMs, ...event }) => event);
}

// Fila de tempestades a partir das CMEs reais com destino a Marte, em ordem cronologica,
// repetindo a lista se acabar. Sem nenhuma CME para Marte a fila fica vazia: o jogo nao usa
// CMEs que iam para outro lugar.
// `seps`: SEPs reais do fetch ao vivo (issue #100). Com elas, a cada SEP_EVERY_N_STORMS a
// tempestade vira um pico de SEP com aviso curto (`kind: 'sep'`, `cme: null`). Sem SEP, nada muda.
export function buildStormSchedule(cmes, startHours, count = 24, seps = []) {
  const candidates = marsBoundCmes(cmes);
  if (candidates.length === 0) return [];

  const W = SPACE_WEATHER_CONFIG;
  const schedule = [];
  let warningStart = startHours + STORM_CONFIG.FIRST_WARNING_AFTER_HOURS;
  let cmeIndex = 0;
  let sepIndex = 0;
  for (let i = 0; i < count; i++) {
    const isSep = seps.length > 0 && i % W.SEP_EVERY_N_STORMS === W.SEP_EVERY_N_STORMS - 1;
    const storm = isSep
      ? makeStorm({ index: i, sep: seps[sepIndex++ % seps.length], warningStart })
      : makeStorm({ index: i, cme: candidates[cmeIndex++ % candidates.length], warningStart });
    schedule.push(storm);
    warningStart = nextStormSlot(schedule, warningStart);
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
