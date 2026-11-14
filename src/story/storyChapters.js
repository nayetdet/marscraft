import { formatDateDMY } from '../mission/missionText.js';

// Textos da historia (UI em ingles, para criancas de 7 a 12 anos, sem emoji).
// So dados: quem decide quando cada coisa aparece e o StoryDirector.

export const CARDS = {
  welcome: {
    title: 'SUIT COMPUTER',
    text: 'Welcome to Mars, Commander! Your suit has only a little oxygen, so go inside the base. The base runs on solar power: the battery charges by day and drains at night.',
  },
  inside: {
    title: 'BASE COMPUTER',
    text: 'You are safe inside. The base makes oxygen for you, but every breath uses battery power. Now tell Earth that you landed.',
  },
  firstJob: {
    title: 'MISSION CONTROL',
    text: 'We hear you, Commander! First job: go outside and bring 1 block of ice into the base. On Mars, ice is water, air and rocket fuel.',
  },
  act2: {
    title: 'MISSION CONTROL',
    text: 'Great work! Now get ready to come home: fill the MAV rocket with fuel made from ice, survive 3 solar storms and send your science to Earth. Every job uses the same battery, so choose well!',
  },
  stormGuide: {
    title: 'SOLAR STORM WARNING',
    text: 'A solar storm is coming! Two ways to stay safe: hide inside the base (safe, but you stop working outside), or turn on the shield [R] (you keep working, but it eats your battery).',
  },
  window: {
    title: 'MISSION CONTROL',
    text: 'The launch window is open! Earth and Mars are lined up for the trip home. Fill the tank, send your science data and launch before the window closes.',
  },
};

// Titulo de cada ato, mostrado em cima do objetivo
export const ACT_TITLES = {
  1: 'PART 1 OF 3: ARRIVAL',
  2: 'PART 2 OF 3: GET READY TO GO HOME',
  3: 'PART 3 OF 3: LAUNCH WINDOW',
};

// Card do primeiro relatorio pelo radio. A distancia e o atraso vem do CommsLink (o mesmo radio
// do terminal da base): { millionKm, oneWayMinutes, dateIso } calculados para a data real do jogo.
export function commsCard({ millionKm, oneWayMinutes, dateIso }) {
  return {
    title: 'RADIO',
    text: `Message sent! Earth is ${millionKm} million km away today. Radio waves need ${oneWayMinutes} minutes to get there and ${oneWayMinutes} more to come back. Nobody on Earth can help you right away: you decide!`,
    source: `Distance calculated for ${formatDateDMY(dateIso)} from NASA/JPL planet orbits`,
  };
}

export const OBJECTIVES = {
  'enter-base': 'Go inside the base through the airlock',
  report: 'Tell Mission Control you landed: go to the command console',
  'await-reply': 'Waiting for Earth to answer',
  'collect-ice': 'Go outside and collect 1 block of Martian ice (white crater behind the base, X 22 / Z -22)',
  'return-base': 'Bring the ice back inside the base',
  act2: 'Fill the MAV with fuel made from ice and survive 3 solar storms',
  'storm-guide': 'Get safe: go inside the base or turn on the shield [R]',
  fuel: 'Fill the MAV fuel tank with ice',
  'send-data': 'Send your science data to Earth: press [G] at the command console',
  ignite: 'Go to the MAV rocket and press IGNITE',
  done: 'Liftoff! You are going home',
  failed: 'The launch window closed',
};

export const WINDOW_CLOSED = {
  title: 'The launch window closed',
  text: 'Earth and Mars only line up for the trip home about every 26 months. The crew must wait on Mars for the next window. Real missions plan every sol around this deadline!',
  source: 'Mars launch windows: about every 26 months (NASA)',
};
