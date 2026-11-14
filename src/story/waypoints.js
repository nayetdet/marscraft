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

// Lugar que o objetivo pede: 'airlock' | 'console' | 'ice' | 'mav' | null (nenhum lugar)
export function objectiveTarget(objectiveId, { iceCount = 0, iceNeeded = 0 } = {}) {
  switch (objectiveId) {
    case 'enter-base':
    case 'return-base':
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
      // Tanque incompleto: com gelo na mochila, leve ao foguete; sem gelo, va buscar na cratera
      if (iceNeeded <= 0) return null;
      return iceCount > 0 ? 'mav' : 'ice';
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
