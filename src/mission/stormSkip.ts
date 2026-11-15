import { MISSION_CONFIG, RADIATION_CONFIG, STORM_SKIP_CONFIG, SURVIVAL_CONFIG } from '../config/constants.ts';

// Espera rapida da tempestade solar dentro do abrigo (issue #228). Regras puras, sem DOM nem
// Three.js: quando a crianca pode usar, ate que hora o relogio corre e o que ela gasta no caminho.
// Quem faz o relogio correr e o SleepController, com o mesmo motor do sono: a base, a tripulacao
// e a dose da tempestade continuam andando, so mais rapido. Nada e pulado e nada sai de graca:
// para liberar a espera a parede precisa estar cheia, e agua na parede nao serve para beber.

export type StormPhase = 'calm' | 'warning' | 'active';

export type StormSkipBlocker = 'no-storm' | 'not-inside' | 'wall-not-full';

export interface StormSkipInput {
  phase: StormPhase;
  wallL: number;
  insideShelter: boolean;
}

export interface StormSkipStatus {
  allowed: boolean;
  blocker: StormSkipBlocker | null;
  // Litros que faltam para a parede ficar cheia (0 com a parede cheia)
  missingL: number;
}

// Motivo que interrompe a espera antes do fim da tempestade (as mesmas chaves de wakeReason, do
// sono, menos a propria tempestade) ou 'dead'
export type StormSkipStop = 'battery' | 'breach' | 'crew' | 'hungry' | 'thirsty' | 'dead';

const isStorm = (phase: StormPhase): boolean => phase === 'warning' || phase === 'active';

export function wallMissingLiters(wallL: number): number {
  const missing = RADIATION_CONFIG.SHELTER_WALL_MAX_L - Math.max(0, wallL);
  // Folga de ponto flutuante: 599,9999 L conta como cheia
  return missing <= 1e-6 ? 0 : missing;
}

// A espera rapida so vale com tempestade a caminho ou em Marte, a crianca dentro do abrigo e a
// parede de agua cheia. Sem tempestade o botao explica isso; a parede incompleta vem por ultimo
// para o botao poder dizer quantos litros faltam.
export function stormSkipStatus({ phase, wallL, insideShelter }: StormSkipInput): StormSkipStatus {
  const missingL = wallMissingLiters(wallL);
  const blocker: StormSkipBlocker | null = !isStorm(phase)
    ? 'no-storm'
    : missingL > 0
      ? 'wall-not-full'
      : !insideShelter ? 'not-inside' : null;
  return { allowed: blocker === null, blocker, missingL };
}

// Horas de jogo que o relogio corre: ate o fim da tempestade (mais uma folga para ja parar na
// calmaria). Comecando no aviso, a espera atravessa o aviso e a tempestade inteira.
export function stormSkipHours(stormEndHours: number, nowHours: number): number {
  const left = stormEndHours - nowHours;
  if (!(left > 0)) return 0;
  return left + STORM_SKIP_CONFIG.END_MARGIN_HOURS;
}

// Fome e sede gastas em `hours` horas de jogo de espera. A crianca fica acordada, entao e a
// mesma taxa de quem espera a tempestade no relogio normal (SURVIVAL_CONFIG), nao a do sono.
export function stormSkipNeedsCost(hours: number): { food: number; water: number } {
  const seconds = Math.max(0, hours) / MISSION_CONFIG.GAME_HOURS_PER_SECOND;
  return { food: seconds * SURVIVAL_CONFIG.FOOD_DRAIN_RATE, water: seconds * SURVIVAL_CONFIG.WATER_DRAIN_RATE };
}

export const STORM_SKIP_ACTION = 'WAIT OUT THE STORM';

// Texto do botao do painel do abrigo: quando esta desligado, diz o que falta
export function stormSkipButtonLabel(status: StormSkipStatus): string {
  if (status.blocker === 'no-storm') return `${STORM_SKIP_ACTION} (no solar storm right now)`;
  if (status.blocker === 'wall-not-full') return `${STORM_SKIP_ACTION} (the wall needs ${Math.ceil(status.missingL)} more L)`;
  if (status.blocker === 'not-inside') return `${STORM_SKIP_ACTION} (step inside the shelter first)`;
  return `${STORM_SKIP_ACTION} (time runs fast)`;
}

// Frase do painel do abrigo com a regra e o que ela custa. Continua o paragrafo da troca
// ("Water in the wall is water you cannot drink", StationPanel._shelterText). Curta de proposito:
// o painel precisa caber numa tela de 720 px sem esconder os botoes. Quantos litros faltam fica
// no botao (stormSkipButtonLabel).
export const STORM_SKIP_PANEL_LINE = `With a FULL wall (${RADIATION_CONFIG.SHELTER_WALL_MAX_L} L) you can wait out a solar storm in here with the clock running fast: the base still uses power and you still get hungry and thirsty.`;

export const STORM_SKIP_STOP_TEXT: Readonly<Record<StormSkipStop, string>> = Object.freeze({
  battery: 'The battery ran out, so you stopped waiting!',
  breach: 'The base is losing air, so you stopped waiting!',
  crew: 'An alarm is on in the base, so you stopped waiting.',
  hungry: 'You got too hungry to keep waiting.',
  thirsty: 'You got too thirsty to keep waiting.',
  dead: '',
});

function formatWaited(hours: number): string {
  const total = Math.max(1, Math.round(hours * 60));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

// Card de uma linha no fim da espera: "The solar storm is over. You waited 36 min ..."
export function stormSkipSummary({ waitedHours, batteryBefore, batteryAfter, stop = null }: {
  waitedHours: number;
  batteryBefore: number;
  batteryAfter: number;
  stop?: StormSkipStop | null;
}): string {
  const head = stop ? STORM_SKIP_STOP_TEXT[stop] : 'The solar storm is over.';
  return `${head} You waited ${formatWaited(waitedHours)} of game time behind the water wall. Battery ${Math.round(batteryBefore)}% -> ${Math.round(batteryAfter)}%.`;
}
