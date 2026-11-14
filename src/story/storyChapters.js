import { STORY_CONFIG } from '../config/constants.js';
import { formatDateDMY } from '../mission/missionText.js';

// Textos da historia (UI em ingles, para criancas de 7 a 12 anos, sem emoji).
// So dados: quem decide quando cada coisa aparece e o StoryDirector.
//
// Um card e mais desenho do que texto: { title, lines?, choices?, link?, source? }
//   lines:   [{ icon, text }]  frases curtas, cada uma com um icone (pixelIcons.js)
//   choices: [{ icon, name, key?, good, bad }]  duas opcoes lado a lado, com o ganho e o custo
//   link:    { minutes, millionKm }  desenho do sinal de radio indo de Marte ate a Terra

export const CARDS = {
  welcome: {
    title: 'WELCOME TO MARS',
    lines: [
      { icon: 'air', text: 'Your suit air is low' },
      { icon: 'door', text: 'Go inside the base' },
    ],
  },
  inside: {
    title: 'SAFE INSIDE',
    lines: [
      { icon: 'air', text: 'The base makes your air' },
      { icon: 'bolt', text: 'Making air uses battery' },
      { icon: 'radio', text: 'Now call Earth' },
    ],
  },
  act2: {
    title: 'GET READY TO GO HOME',
    lines: [
      { icon: 'rocket', text: 'Fill the rocket with ice fuel' },
      { icon: 'storm', text: `Survive ${STORY_CONFIG.STORMS_FOR_WINDOW} solar storms` },
      { icon: 'radio', text: 'Send your science to Earth' },
      { icon: 'bolt', text: 'One battery for it all: choose!' },
    ],
  },
  stormGuide: {
    title: 'SOLAR STORM COMING',
    choices: [
      { icon: 'home', name: 'HIDE', good: 'Safest spot', bad: 'No work outside' },
      { icon: 'shield', name: 'SHIELD', key: 'R', good: 'Keep working', bad: 'Eats battery' },
    ],
  },
  window: {
    title: 'LAUNCH WINDOW OPEN',
    lines: [
      { icon: 'rocket', text: 'Fill the tank' },
      { icon: 'radio', text: 'Send your data' },
      { icon: 'clock', text: 'Launch before time runs out' },
    ],
  },
};

// Nome curto de cada ato, ao lado das 3 bolinhas de progresso
export const ACT_TITLES = {
  1: 'ARRIVAL',
  2: 'GET READY',
  3: 'LAUNCH WINDOW',
};

// Card do primeiro relatorio pelo radio. A distancia e o atraso vem do CommsLink (o mesmo radio
// do terminal da base): { millionKm, oneWayMinutes, dateIso } calculados para a data real do jogo.
export function commsCard({ millionKm, oneWayMinutes, dateIso }) {
  return {
    title: 'MESSAGE SENT',
    link: { minutes: oneWayMinutes, millionKm },
    lines: [
      { icon: 'clock', text: 'Earth cannot help fast: you decide' },
      { icon: 'ice', text: 'Do not wait: go get 1 ice' },
    ],
    source: `Distance calculated for ${formatDateDMY(dateIso)} from NASA/JPL planet orbits`,
  };
}

// A resposta da Terra chega depois, com o jogador ja no trabalho seguinte: e assim que o atraso
// aparece no jogo, sem ninguem ficar parado esperando.
export function replyCard({ oneWayMinutes }) {
  return {
    title: 'EARTH ANSWERED',
    lines: [
      { icon: 'radio', text: 'We hear you, Commander!' },
      { icon: 'clock', text: `Real radio trip: ${oneWayMinutes * 2} min there and back` },
    ],
  };
}

// Frase curta de cada objetivo (terminal da base). O painel do objetivo mostra a versao em
// icones: src/story/objectiveView.js.
export const OBJECTIVES = {
  'enter-base': 'Go inside the base',
  report: 'Call Earth at the command console',
  'collect-ice': 'Get 1 block of ice from the ice crater',
  act2: 'Get the rocket ready to go home',
  'storm-guide': 'Get safe: hide inside or turn on the shield [R]',
  fuel: 'Fill the rocket with ice',
  'send-data': 'Send your science data to Earth [G]',
  ignite: 'Go to the rocket and press IGNITE',
  done: 'Liftoff! You are going home',
  failed: 'The launch window closed',
};

export const WINDOW_CLOSED = {
  title: 'The launch window closed',
  text: 'Earth and Mars only line up for the trip home about every 26 months. The crew must wait on Mars for the next window. Real missions plan every sol around this deadline!',
  source: 'Mars launch windows: about every 26 months (NASA)',
};
