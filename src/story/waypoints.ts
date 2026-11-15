// @ts-nocheck
import { nextRocketJob } from './objectiveView.ts';
import { tutorialStepById } from './tutorialSteps.ts';

// Para onde a seta do objetivo aponta. Funcoes puras: o GameEngine sabe a posicao de cada
// lugar no mundo, e aqui so se decide QUAL lugar vale para o objetivo atual.

export const WAYPOINT_LABELS = {
  airlock: 'AIRLOCK',
  console: 'ROVER CONSOLE',
  science: 'SCIENCE & RADIO',
  ice: 'ICE CRATER',
  mav: 'MAV ROCKET',
  // Lugares do tutorial guiado
  greenhouse: 'FOOD MONITOR',
  gym: 'GYM',
  water: 'WATER TAP',
  kitchen: 'KITCHEN',
  bathroom: 'BATHROOM',
};

// Lugares que ficam dentro da base: de fora, o caminho ate eles passa pelo airlock
const INDOOR = new Set(['console', 'science', 'shelter', 'powerroom', 'lifeSupport', 'recycler', 'brokenWindow', 'greenhouse', 'gym', 'water', 'kitchen', 'bathroom']);

// Lugar de cada trabalho do foguete (nextRocketJob); fabrica trabalhando e tempestades nao tem lugar
const JOB_PLACES = { ice: 'ice', load: 'mav', base: 'airlock' };

// Ciencia (issue #105): analisar e enviar acontecem no terminal de ciencia e radio. Escanear vale
// em qualquer lugar com a luneta, entao a seta some.
function sciencePlace(s) {
  return s.scienceStep === 'scan' ? null : 'science';
}

function tutorialTarget(task, s) {
  if (!task) return null;
  return (s.roverActive && task.roverPlace) || task.place || null;
}

// Lugar que o objetivo pede (uma chave de WAYPOINT_LABELS ou do GameEngine) ou null (nenhum lugar).
// `s` e o retrato do jogo ({ iceCount, iceNeeded, propellantPct, dataSent, needsBase, scienceStep }).
export function objectiveTarget(objectiveId, s = {}) {
  switch (objectiveId) {
    case 'storm-guide':
      return 'airlock';
    case 'send-data':
      return sciencePlace(s);
    case 'ignite':
      return 'mav';
    case 'act2':
    case 'fuel':
      // A seta segue o mesmo trabalho que o painel do objetivo mostra
      return nextRocketJob(s) === 'data' ? sciencePlace(s) : JOB_PLACES[nextRocketJob(s)] ?? null;
    default:
      // Passos do tutorial guiado: cada um tem o seu lugar (ou nenhum). Um desvio (issue #237)
      // pode ter outro lugar enquanto a crianca dirige o rover (`roverPlace`).
      return tutorialTarget(tutorialStepById(objectiveId), s);
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
