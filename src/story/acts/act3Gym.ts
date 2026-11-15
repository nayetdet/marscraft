import { ACT3_CONFIG, STATION_CONFIG, SURVIVAL_CONFIG } from '../../config/constants.ts';
import type { TutorialNeed } from '../tutorialDetours.ts';

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

// O passo da academia nao pode travar (issue #421): alem da bateria da base, ele pede comida e
// agua nas barras da crianca. Se faltar, o desvio (tutorialDetours.ts) manda comer ou beber e
// depois o passo volta. Vale para o passo do ato 3 (`gym-workout`) e o do passeio (`cert-gym`).
export const GYM_STEP_ID = 'gym-workout';
const BODY_NEEDS = workoutNeeds(SURVIVAL_CONFIG.MAX_STAT);
export const GYM_NEEDS: readonly TutorialNeed[] = Object.freeze([
  { resource: 'power', amount: STATION_CONFIG.EXERCISE_COST },
  { resource: 'bodyFood', amount: BODY_NEEDS.food },
  { resource: 'bodyWater', amount: BODY_NEEDS.water },
]);

// Pular o treino (issue #421). Corpo fraco = ossos ou preparo abaixo do limite. Tres custos, com
// a mesma regra: o trabalho fica mais lento (GameEngine.getWorkSpeed), a vida so se recupera ate
// um teto (SurvivalSystem.healCap) e, na decolagem, a tripulacao carrega a crianca ate o foguete
// (boardingCutscene.ts). Regra de jogo: quanto osso se perde em 0,38 g ninguem mediu.
export interface BodyShape {
  fitness?: number;
  boneDensity?: number;
}

const level = (value: number | undefined): number => (Number.isFinite(value) ? (value as number) : 100);

export function isBodyWeak(body: BodyShape | null | undefined): boolean {
  if (!body) return false;
  return level(body.fitness) < ACT3_CONFIG.WEAK_BODY_BELOW || level(body.boneDensity) < ACT3_CONFIG.WEAK_BODY_BELOW;
}

// Ate onde a vida se recupera (pontos da barra). O teto nunca tira vida: quem esta acima dele
// continua acima, so nao recupera mais do que isso depois de se machucar.
export function healCapFor(body: BodyShape | null | undefined, maxStat: number): number {
  return isBodyWeak(body) ? maxStat * ACT3_CONFIG.WEAK_HEAL_CAP_PCT / 100 : maxStat;
}

const SLOWER_PCT = Math.round((1 - ACT3_CONFIG.WEAK_WORK_SPEED) * 100);

// Aviso do HUD enquanto o corpo esta fraco
export const WEAK_BODY_WARNING = `Weak body: work ${SLOWER_PCT}% slower, health stops at ${ACT3_CONFIG.WEAK_HEAL_CAP_PCT}%. Train in the gym!`;

// Card TRAIN NOW x LATER (issue #421), quando o passo da academia comeca, uma vez por partida. E
// informativo: a crianca escolhe agindo (treinar ou nao), e as duas respostas so fecham o card.
// Os custos vem das constantes. O fato das 2 horas por dia e o de 1 % por mes sao da NASA
// (docs/data/numeros-reais.md); o que acontece em Marte e regra de jogo, e o card diz isso.
export const GYM_NOW_ID = 'gym-now';
export const GYM_LATER_ID = 'gym-later';

const GYM_TITLE = 'GYM: NOW OR LATER?';
const GYM_LINE_BONES = 'Low gravity makes bones weak';
const GYM_LINE_STATION = 'Space Station crews train 2 hours a day';
const GYM_LINE_ROCKET = 'Weak at liftoff? The crew carries you';
const GYM_NOW_NAME = 'TRAIN NOW';
const GYM_LATER_NAME = 'LATER';
const GYM_NOW_GOOD = 'Strong body, full work speed';
const GYM_NOW_BAD = `−${WORKOUT_COST.foodPct}% food, −${WORKOUT_COST.waterPct}% water, ${WORKOUT_COST.hours} hours`;
const GYM_LATER_GOOD = 'Keep your food, water and time';
const GYM_LATER_BAD = `Work ${SLOWER_PCT}% slower, health stops at ${ACT3_CONFIG.WEAK_HEAL_CAP_PCT}%`;
const GYM_SOURCE = 'Bones and training: NASA, Space Station. On Mars nobody measured it: game rule';

export function gymChoiceCard() {
  return {
    title: GYM_TITLE,
    seconds: ACT3_CONFIG.GYM_CARD_SECONDS,
    lines: [
      { icon: 'down', text: GYM_LINE_BONES },
      { icon: 'clock', text: GYM_LINE_STATION },
      { icon: 'rocket', text: GYM_LINE_ROCKET },
    ],
    choices: [
      { id: GYM_NOW_ID, key: '1', icon: 'heart', name: GYM_NOW_NAME, good: GYM_NOW_GOOD, bad: GYM_NOW_BAD },
      { id: GYM_LATER_ID, key: '2', icon: 'clock', name: GYM_LATER_NAME, good: GYM_LATER_GOOD, bad: GYM_LATER_BAD },
    ],
    source: GYM_SOURCE,
  };
}

export function shouldAskGym({ asked, stepId }: { asked: boolean; stepId: string }): boolean {
  return !asked && stepId === GYM_STEP_ID;
}

export const GYM_NOW_TOAST = 'Follow the arrow to the gym. Each set costs food, water and 2 hours.';
export const GYM_LATER_TOAST = 'You can wait. With a weak body you work slower and heal less. The gym step stays open.';

// Aviso depois da resposta do card (null = o id nao e deste card)
export function gymChoiceToast(id: string): string | null {
  if (id === GYM_NOW_ID) return GYM_NOW_TOAST;
  if (id === GYM_LATER_ID) return GYM_LATER_TOAST;
  return null;
}

// Como a crianca chegou ao foguete (issue #421): andando, ou carregada pela tripulacao se o corpo
// estava fraco na decolagem. Aparece na cena antes da decolagem, na tela de vitoria e no boletim.
export const BOARDING_ROW_LABEL = 'Your body at liftoff';
export const WALKED_TEXT = 'You walked to the rocket';
export const CARRIED_TEXT = 'The crew carried you to the rocket';
export const WALKED_REPORT = `${WALKED_TEXT}: strong bones`;
export const CARRIED_REPORT = `${CARRIED_TEXT}: weak bones`;

export interface BoardingSummary {
  walked: boolean;
  short: string; // linha da tela de vitoria
  text: string; // linha do boletim
}

// `walkedToRocket`: true ou false, gravado na decolagem (GameEngine._launchMav). Sem decolagem
// (tela de janela fechada) nao ha linha.
export function boardingSummary(stats: { launched?: boolean; walkedToRocket?: boolean | null }): BoardingSummary | null {
  if (!stats?.launched || typeof stats.walkedToRocket !== 'boolean') return null;
  return stats.walkedToRocket
    ? { walked: true, short: WALKED_TEXT, text: WALKED_REPORT }
    : { walked: false, short: CARRIED_TEXT, text: CARRIED_REPORT };
}

// Legendas da cena da ida ate o foguete (boardingCutscene.ts)
export const BOARDING_CAPTIONS = Object.freeze({
  walkTitle: 'STRONG BONES',
  walkSub: 'You trained: you walk to the rocket.',
  carryTitle: 'WEAK BONES',
  carrySub: 'You skipped the gym: the crew carries you.',
  rule: 'Game rule: nobody has measured bones in Mars gravity.',
});

// Traducoes dos textos acima (as chaves sao as frases em ingles; entram no catalogo de i18n.ts)
export const GYM_PT_BR: Record<string, string> = {
  [WEAK_BODY_WARNING]: `Corpo fraco: trabalho ${SLOWER_PCT}% mais lento, a vida para em ${ACT3_CONFIG.WEAK_HEAL_CAP_PCT}%. Treine na academia!`,
  [GYM_TITLE]: 'ACADEMIA: AGORA OU DEPOIS?',
  [GYM_LINE_STATION]: 'Na Estação Espacial treinam 2 horas por dia',
  [GYM_LINE_ROCKET]: 'Fraco na decolagem? A tripulação carrega você',
  [GYM_NOW_NAME]: 'TREINAR AGORA',
  [GYM_LATER_NAME]: 'DEPOIS',
  [GYM_NOW_GOOD]: 'Corpo forte, trabalho na velocidade normal',
  [GYM_NOW_BAD]: `−${WORKOUT_COST.foodPct}% de comida, −${WORKOUT_COST.waterPct}% de água, ${WORKOUT_COST.hours} horas`,
  [GYM_LATER_GOOD]: 'Guarda sua comida, água e tempo',
  [GYM_LATER_BAD]: `Trabalho ${SLOWER_PCT}% mais lento, a vida para em ${ACT3_CONFIG.WEAK_HEAL_CAP_PCT}%`,
  [GYM_SOURCE]: 'Ossos e treino: NASA, Estação Espacial. Em Marte ninguém mediu: regra do jogo',
  [GYM_NOW_TOAST]: 'Siga a seta até a academia. Cada série gasta comida, água e 2 horas.',
  [GYM_LATER_TOAST]: 'Você pode esperar. Com o corpo fraco você trabalha mais devagar e se recupera menos. O passo da academia continua aberto.',
  'Too hungry to train: get a ration from the cook and eat it': 'Fome demais para treinar: pegue uma ração com o cozinheiro e coma',
  'Too hungry to train': 'Fome demais para treinar',
  'Too thirsty to train: drink water at the water tap': 'Sede demais para treinar: beba água na torneira',
  'Too thirsty to train': 'Sede demais para treinar',
  [BOARDING_ROW_LABEL]: 'Seu corpo na decolagem',
  [WALKED_TEXT]: 'Você foi andando até o foguete',
  [CARRIED_TEXT]: 'A tripulação carregou você até o foguete',
  [WALKED_REPORT]: 'Você foi andando até o foguete: ossos fortes',
  [CARRIED_REPORT]: 'A tripulação carregou você até o foguete: ossos fracos',
  [BOARDING_CAPTIONS.walkTitle]: 'OSSOS FORTES',
  [BOARDING_CAPTIONS.walkSub]: 'Você treinou: vai andando até o foguete.',
  [BOARDING_CAPTIONS.carryTitle]: 'OSSOS FRACOS',
  [BOARDING_CAPTIONS.carrySub]: 'Você pulou a academia: a tripulação carrega você.',
  [BOARDING_CAPTIONS.rule]: 'Regra do jogo: ninguém mediu os ossos na gravidade de Marte.',
  [TOO_HUNGRY]: 'Fome demais para treinar: coma primeiro.',
  [TOO_THIRSTY]: 'Sede demais para treinar: beba primeiro.',
  [WORKOUT_COST_TEXT]: `Cada série: −${WORKOUT_COST.power}% de energia, −${WORKOUT_COST.foodPct}% de comida, −${WORKOUT_COST.waterPct}% de água, ${WORKOUT_COST.hours} horas`,
};

export const GYM_ES: Record<string, string> = {
  [WEAK_BODY_WARNING]: `Cuerpo débil: trabajo ${SLOWER_PCT}% más lento, la vida se detiene en ${ACT3_CONFIG.WEAK_HEAL_CAP_PCT}%. ¡Entrena en el gimnasio!`,
  [GYM_TITLE]: 'GIMNASIO: ¿AHORA O DESPUÉS?',
  [GYM_LINE_STATION]: 'En la Estación Espacial entrenan 2 horas al día',
  [GYM_LINE_ROCKET]: '¿Débil en el despegue? La tripulación te lleva',
  [GYM_NOW_NAME]: 'ENTRENAR AHORA',
  [GYM_LATER_NAME]: 'DESPUÉS',
  [GYM_NOW_GOOD]: 'Cuerpo fuerte, trabajo a velocidad normal',
  [GYM_NOW_BAD]: `−${WORKOUT_COST.foodPct}% de comida, −${WORKOUT_COST.waterPct}% de agua, ${WORKOUT_COST.hours} horas`,
  [GYM_LATER_GOOD]: 'Guardas tu comida, agua y tiempo',
  [GYM_LATER_BAD]: `Trabajo ${SLOWER_PCT}% más lento, la vida se detiene en ${ACT3_CONFIG.WEAK_HEAL_CAP_PCT}%`,
  [GYM_SOURCE]: 'Huesos y entrenamiento: NASA, Estación Espacial. En Marte nadie lo midió: regla del juego',
  [GYM_NOW_TOAST]: 'Sigue la flecha hasta el gimnasio. Cada serie gasta comida, agua y 2 horas.',
  [GYM_LATER_TOAST]: 'Puedes esperar. Con el cuerpo débil trabajas más lento y te recuperas menos. El paso del gimnasio sigue abierto.',
  'Too hungry to train: get a ration from the cook and eat it': 'Demasiada hambre para entrenar: pide una ración al cocinero y cómela',
  'Too hungry to train': 'Demasiada hambre para entrenar',
  'Too thirsty to train: drink water at the water tap': 'Demasiada sed para entrenar: bebe agua en el grifo',
  'Too thirsty to train': 'Demasiada sed para entrenar',
  [BOARDING_ROW_LABEL]: 'Tu cuerpo en el despegue',
  [WALKED_TEXT]: 'Caminaste hasta el cohete',
  [CARRIED_TEXT]: 'La tripulación te llevó hasta el cohete',
  [WALKED_REPORT]: 'Caminaste hasta el cohete: huesos fuertes',
  [CARRIED_REPORT]: 'La tripulación te llevó hasta el cohete: huesos débiles',
  [BOARDING_CAPTIONS.walkTitle]: 'HUESOS FUERTES',
  [BOARDING_CAPTIONS.walkSub]: 'Entrenaste: caminas hasta el cohete.',
  [BOARDING_CAPTIONS.carryTitle]: 'HUESOS DÉBILES',
  [BOARDING_CAPTIONS.carrySub]: 'Te saltaste el gimnasio: la tripulación te lleva.',
  [BOARDING_CAPTIONS.rule]: 'Regla del juego: nadie midió los huesos en la gravedad de Marte.',
  [TOO_HUNGRY]: 'Demasiada hambre para entrenar: come primero.',
  [TOO_THIRSTY]: 'Demasiada sed para entrenar: bebe primero.',
  [WORKOUT_COST_TEXT]: `Cada serie: −${WORKOUT_COST.power}% de energía, −${WORKOUT_COST.foodPct}% de comida, −${WORKOUT_COST.waterPct}% de agua, ${WORKOUT_COST.hours} horas`,
};
