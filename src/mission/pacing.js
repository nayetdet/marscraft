import { PACING_CONFIG } from '../config/constants.js';

// Fracao do consumo passivo normal da base em `hours` (horas de jogo desde o inicio do sol 1).
// O primeiro sol e mais brando, para a crianca conhecer a base antes de a conta apertar; depois
// a exigencia sobe aos poucos ate o normal (issue #81). Vale para o ar, a agua e a comida da
// tripulacao, o trabalho nas estacoes, o aquecedor e a luz da estufa. Nao muda a producao.
export function passiveDemandFactor(hours) {
  const { FIRST_SOL_DEMAND_FACTOR: first, RAMP_SOLS, HOURS_PER_SOL } = PACING_CONFIG;
  const sinceFirstSol = hours - HOURS_PER_SOL;
  if (sinceFirstSol <= 0) return first;
  const rampHours = RAMP_SOLS * HOURS_PER_SOL;
  if (rampHours <= 0 || sinceFirstSol >= rampHours) return 1;
  return first + (1 - first) * (sinceFirstSol / rampHours);
}
