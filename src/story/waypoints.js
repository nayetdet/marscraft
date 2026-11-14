import { nextRocketJob } from './objectiveView.js';

// Para onde a seta do objetivo aponta. Funcoes puras: o GameEngine sabe a posicao de cada
// lugar no mundo, e aqui so se decide QUAL lugar vale para o objetivo atual.

export const WAYPOINT_LABELS = {
  airlock: 'AIRLOCK',
  console: 'COMMAND CONSOLE',
  ice: 'ICE CRATER',
  mav: 'MAV ROCKET',
};

// Lugares que ficam dentro da base: de fora, o caminho ate eles passa pelo airlock
const INDOOR = new Set(['console']);

// Lugar de cada trabalho do foguete (nextRocketJob); fabrica trabalhando e tempestades nao tem lugar
const JOB_PLACES = { ice: 'ice', load: 'mav', data: 'console' };

// Lugar que o objetivo pede: 'airlock' | 'console' | 'ice' | 'mav' | null (nenhum lugar).
// `s` e o retrato do jogo ({ iceCount, iceNeeded, propellantPct, dataSent }).
export function objectiveTarget(objectiveId, s = {}) {
  switch (objectiveId) {
    case 'enter-base':
    case 'storm-guide':
      return 'airlock';
    case 'report':
    case 'send-data':
      return 'console';
    case 'collect-ice':
      return 'ice';
    case 'ignite':
      return 'mav';
    case 'act2':
    case 'fuel':
      // A seta segue o mesmo trabalho que o painel do objetivo mostra
      return JOB_PLACES[nextRocketJob(s)] ?? null;
    default:
      return null;
  }
}

// Lugar para onde a seta aponta AGORA. A base so tem uma entrada, entao o caminho entre
// dentro e fora passa sempre pelo airlock.
export function routeWaypoint(target, insideHabitat) {
  if (!target) return null;
  if (target === 'airlock') return insideHabitat ? null : 'airlock';
  if (INDOOR.has(target)) return insideHabitat ? target : 'airlock';
  return insideHabitat ? 'airlock' : target;
}
