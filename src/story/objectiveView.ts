// @ts-nocheck
import { MAV_CONFIG, SCIENCE_CONFIG } from '../config/constants.ts';
import { formatHours } from '../mission/missionText.ts';
import { STEP_COLORS, tutorialStepById } from './tutorialSteps.ts';

// O que o painel do objetivo desenha, de cima para baixo:
//   1. a meta da partida, sempre a vista (encher o foguete e voltar para casa), com o foguete em
//      degraus: cada bloco de gelo entregue acende um;
//   2. o que fazer agora: um icone grande com 2 ou 3 palavras e, no tutorial, uma linha dizendo
//      onde ir e o que apertar;
//   3. onde a crianca esta: "STEP 4/15" no tutorial ou a volta de trabalho que se repete.
// Funcoes puras: o StoryHud so pinta o resultado.

export const GOAL_TITLE = 'GOAL: FLY HOME';

// A volta de trabalho (atos 2 e 3), que se repete ate o tanque encher: buscar gelo, levar ao
// foguete e voltar a base para recarregar o ar
const LOOP_STEPS = [
  { id: 'ice', icon: 'ice' },
  { id: 'load', icon: 'rocket' },
  { id: 'base', icon: 'home' },
];

const TASKS = {
  'storm-guide': { icon: 'shield', label: 'GET SAFE', key: null },
  'send-data': { icon: 'radio', label: 'SEND SCIENCE' },
  ignite: { icon: 'rocket', label: 'LAUNCH!' },
  done: { icon: 'rocket', label: 'LIFTOFF!' },
  failed: { icon: 'clock', label: 'WINDOW CLOSED' },
};
const GET_ICE = { icon: 'ice', label: 'GET ICE' };
const LOAD_ROCKET = { icon: 'rocket', label: 'LOAD THE ROCKET' };
const BACK_TO_BASE = { icon: 'home', label: 'BACK TO BASE' };
const MAKING_FUEL = { icon: 'bolt', label: 'MAKING FUEL' };
const SURVIVE = { icon: 'storm', label: 'SURVIVE THE STORMS' };
const ANALYZE_ROCKS = { icon: 'rock', label: 'ANALYZE SAMPLES', hint: 'Science terminal: press F, then ANALYZE' };
// Um objeto por quantidade que falta, criado uma vez (o painel roda a cada frame)
const SCAN_TASKS = new Map();
function scanTask(left) {
  if (!SCAN_TASKS.has(left)) {
    SCAN_TASKS.set(left, {
      icon: 'scope',
      label: left > 0 ? `FIND ${left} SCIENCE ${left === 1 ? 'POINT' : 'POINTS'}` : 'FIND SCIENCE',
      hint: 'Scan new things with the scope, or bring glowing samples to the lab',
    });
  }
  return SCAN_TASKS.get(left);
}

// O que a ciencia pede agora (issues #105 e #269): achar pontos (escanear ou coletar amostras),
// analisar amostras ou enviar. `s.scienceStep` vem de sciencePackage.scienceStep(); sem ele
// (testes antigos), enviar. `s.sciencePointsLeft` = pontos que ainda faltam achar.
export function scienceTask(s = {}) {
  if (s.scienceStep === 'scan') return scanTask(s.sciencePointsLeft ?? 0);
  if (s.scienceStep === 'analyze') return ANALYZE_ROCKS;
  return TASKS['send-data'];
}

// Trabalho mais util agora para deixar o foguete pronto (atos 2 e 3):
// 'ice' (buscar gelo) | 'load' (levar o gelo ao foguete) | 'base' (voltar a base depois da
// entrega) | 'data' (ciencia: escanear, analisar ou enviar) | 'fuel' (fabrica trabalhando) | 'storms'.
// `needsBase` vem do StoryDirector: acabou de entregar gelo e ainda nao voltou a base.
export function nextRocketJob({ iceCount = 0, iceNeeded = 0, propellantPct = 0, dataSent = false, needsBase = false } = {}) {
  if (iceNeeded > 0) return iceCount > 0 ? 'load' : needsBase ? 'base' : 'ice';
  if (!dataSent) return 'data';
  return propellantPct < 100 ? 'fuel' : 'storms';
}

const JOB_TASKS = { ice: GET_ICE, load: LOAD_ROCKET, base: BACK_TO_BASE, fuel: MAKING_FUEL, storms: SURVIVE };

const isRocketWork = (objectiveId) => objectiveId === 'act2' || objectiveId === 'fuel';

function stepStates(steps, now) {
  return steps.map((step, i) => ({ icon: step.icon, state: i < now ? 'done' : i === now ? 'now' : 'todo' }));
}

// O foguete em degraus: `loaded` blocos de gelo ja entregues e, deles, `fuel` ja viraram combustivel
function rocketMeter(s) {
  // Tubos de amostra no foguete pedem mais gelo (issue #105)
  const total = s.iceForFullTank ?? MAV_CONFIG.ICE_BLOCKS_FOR_FULL_TANK;
  const fuel = Math.min(total, Math.floor(((s.propellantPct ?? 0) / 100) * total + 1e-6));
  const loaded = Math.max(fuel, total - Math.min(total, s.iceNeeded ?? total));
  return { total, loaded, fuel };
}

// story: StoryDirector; s: o mesmo retrato do jogo que o diretor le.
// Devolve null enquanto a historia nao comecou.
export function objectiveView(story, s) {
  // Tutorial guiado (ato 1): a tarefa e o passo atual, com a dica de onde ir e o que apertar
  const step = story.act === 1 ? tutorialStepById(story.objectiveId) : null;
  const rocketWork = isRocketWork(story.objectiveId);
  const job = rocketWork ? nextRocketJob(s) : null;
  const task = step
    ? step
    : job === 'data' || story.objectiveId === 'send-data'
      ? scienceTask(s)
      : rocketWork ? JOB_TASKS[job] : TASKS[story.objectiveId] ?? null;
  if (!task) return null;

  // Depois do tutorial, a volta de trabalho enquanto o tanque pede gelo
  let steps = null;
  let loop = false;
  const now = LOOP_STEPS.findIndex((item) => item.id === job);
  if (now >= 0) {
    steps = stepStates(LOOP_STEPS, now);
    loop = true;
  }
  // "STEP 4/15": onde a crianca esta no tutorial
  const progress = step ? { now: story.stepIndex + 1, total: story.steps.length } : null;
  // Cor da secao da base a que o passo pertence (null fora do tutorial)
  const color = step ? STEP_COLORS[step.zone] : null;

  // O que mais o lancamento pede, alem do tanque cheio (so aparece do ato 2 em diante)
  const goals = story.act === 1
    ? null
    : {
        storms: Math.min(s.stormsSurvived, story.stormsNeeded),
        stormsNeeded: story.stormsNeeded,
        dataSent: Boolean(s.dataSent),
        // "6/10": pontos de ciencia ja enviados para a Terra, da meta que o foguete pede
        sciencePoints: Math.min(s.sciencePointsSent ?? 0, SCIENCE_CONFIG.POINTS_TO_LAUNCH),
        scienceGoal: SCIENCE_CONFIG.POINTS_TO_LAUNCH,
      };

  // A janela de lancamento fechando (ato 2)
  let timer = null;
  if (story.act >= 2 && story.windowHoursLeft !== null && story.objectiveId !== 'done') {
    const fill = story.windowHours > 0 ? story.windowHoursLeft / story.windowHours : 0;
    timer = { icon: 'clock', label: formatHours(story.windowHoursLeft), fill, tone: fill <= 0.25 ? 'danger' : 'warn' };
  }

  // Mensagem de radio viajando: `progress` vai de 0 a 1 na ida e volta; ate 0,5 ela esta indo
  // para a Terra, depois a resposta esta voltando. `position` e onde o sinal esta (0 = Marte, 1 = Terra).
  let signal = null;
  if (story.replySecondsLeft !== null) {
    const total = story.replyDelayHours / story.gameHoursPerSecond;
    const progress = Math.max(0, Math.min(1, total > 0 ? 1 - story.replySecondsLeft / total : 1));
    const returning = progress >= 0.5;
    signal = {
      seconds: story.replySecondsLeft,
      progress,
      returning,
      position: returning ? (1 - progress) * 2 : progress * 2,
      label: returning ? 'EARTH IS ANSWERING' : 'MESSAGE ON ITS WAY',
    };
  }

  return {
    act: story.act,
    goal: GOAL_TITLE,
    rocket: rocketMeter(s),
    task,
    progress,
    color,
    steps,
    loop,
    goals,
    timer,
    signal,
  };
}
