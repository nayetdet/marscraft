import { formatHours } from '../mission/missionText.js';
import { ACT_TITLES } from './storyChapters.js';

// O que o painel do objetivo desenha: um icone grande com 2 ou 3 palavras, e o progresso em
// bolinhas, barras e marcas em vez de frases. Funcoes puras: o StoryHud so pinta o resultado.

// Os 3 passos do tutorial (ato 1), na ordem
const ARRIVAL_STEPS = [
  { id: 'enter-base', icon: 'door' },
  { id: 'report', icon: 'radio' },
  { id: 'collect-ice', icon: 'ice' },
];

const TASKS = {
  'enter-base': { icon: 'door', label: 'ENTER THE BASE' },
  report: { icon: 'radio', label: 'CALL EARTH' },
  'collect-ice': { icon: 'ice', label: 'GET 1 ICE' },
  'storm-guide': { icon: 'shield', label: 'GET SAFE', key: 'R' },
  'send-data': { icon: 'radio', label: 'SEND DATA', key: 'G' },
  ignite: { icon: 'rocket', label: 'LAUNCH!' },
  done: { icon: 'rocket', label: 'LIFTOFF!' },
  failed: { icon: 'clock', label: 'WINDOW CLOSED' },
};
const GET_ICE = { icon: 'ice', label: 'GET ICE' };
const LOAD_ROCKET = { icon: 'rocket', label: 'LOAD THE ROCKET' };
const MAKING_FUEL = { icon: 'bolt', label: 'MAKING FUEL' };
const SURVIVE = { icon: 'storm', label: 'SURVIVE THE STORMS' };

// Trabalho mais util agora para deixar o foguete pronto (atos 2 e 3):
// 'ice' (buscar gelo) | 'load' (levar o gelo ao foguete) | 'data' | 'fuel' (fabrica trabalhando) | 'storms'
export function nextRocketJob({ iceCount = 0, iceNeeded = 0, propellantPct = 0, dataSent = false } = {}) {
  if (iceNeeded > 0) return iceCount > 0 ? 'load' : 'ice';
  if (!dataSent) return 'data';
  return propellantPct < 100 ? 'fuel' : 'storms';
}

const JOB_TASKS = { ice: GET_ICE, load: LOAD_ROCKET, data: TASKS['send-data'], fuel: MAKING_FUEL, storms: SURVIVE };

function taskFor(objectiveId, s) {
  if (objectiveId === 'act2' || objectiveId === 'fuel') return JOB_TASKS[nextRocketJob(s)];
  return TASKS[objectiveId] ?? null;
}

// story: StoryDirector; s: o mesmo retrato do jogo que o diretor le.
// Devolve null enquanto a historia nao comecou.
export function objectiveView(story, s) {
  const task = taskFor(story.objectiveId, s);
  if (!task) return null;

  let steps = null;
  let goals = null;
  if (story.act === 1) {
    const now = ARRIVAL_STEPS.findIndex((step) => step.id === story.objectiveId);
    steps = ARRIVAL_STEPS.map((step, i) => ({ icon: step.icon, state: i < now ? 'done' : i === now ? 'now' : 'todo' }));
  } else {
    goals = {
      fuelPct: Math.floor(Math.min(100, s.propellantPct)),
      storms: Math.min(s.stormsSurvived, story.stormsForWindow),
      stormsNeeded: story.stormsForWindow,
      dataSent: Boolean(s.dataSent),
    };
  }

  // A janela de lancamento fechando (ato 3)
  let timer = null;
  if (story.act === 3 && story.windowHoursLeft !== null && story.objectiveId !== 'done') {
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
    actName: ACT_TITLES[story.act] ?? '',
    task,
    steps,
    goals,
    timer,
    signal,
  };
}
