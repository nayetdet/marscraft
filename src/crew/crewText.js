import { CREW_CONFIG } from '../config/constants.js';

const NEED_TEXT = {
  air: 'air (the battery pays for it)',
  water: 'water',
  food: 'food',
};

// Mensagem de radio (toast) para cada evento do CrewManager
export function crewEventMessage(event) {
  const name = event.member?.name ?? 'Crew';
  switch (event.type) {
    case 'weak': {
      const needs = event.lacking.map((need) => NEED_TEXT[need] ?? need).join(' and ');
      return `${name}: I'm too weak to work. We need ${needs}!`;
    }
    case 'recovered':
      return `${name}: Thanks, Commander! I'm back to work.`;
    case 'evacuated':
      return `${name} was too weak and flew back to Earth to recover.`;
    case 'alert':
      return `${name}: ${event.text}`;
    default:
      return null;
  }
}

// O que a tripulacao inteira gasta em 1 sol (24 horas de jogo), so para respirar, beber e comer
export function dailyCrewNeeds(size) {
  return {
    food: size * CREW_CONFIG.FOOD_PER_HOUR * 24,
    water: size * CREW_CONFIG.WATER_L_PER_HOUR * 24,
    battery: size * CREW_CONFIG.OXYGEN_ENERGY_PER_HOUR * 24,
  };
}
