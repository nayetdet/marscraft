import { STORY_CONFIG } from '../config/constants.js';
import { formatDateDMY } from '../mission/missionText.js';
import { shelterDoseFactor } from '../mission/radiation.js';

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
      { icon: 'rocket', text: 'Mission: fill the rocket, fly home' },
      { icon: 'air', text: 'First: your suit air is low' },
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
  // A rotina que se repete ate o tanque encher. Tempestades e dados entram depois, cada um na
  // sua hora (card da primeira tempestade, tarefa SEND DATA), para ensinar uma coisa por vez.
  act2: {
    title: 'FILL THE ROCKET',
    lines: [
      { icon: 'ice', text: 'Get ice at the crater' },
      { icon: 'rocket', text: 'Load it into the rocket' },
      { icon: 'home', text: 'Go back to base for air' },
      { icon: 'bolt', text: 'Air and fuel share one battery' },
    ],
  },
  // Treino de cadete (issue #88): os 4 certificados, um por linha
  training: {
    title: 'CADET TRAINING',
    lines: [
      { icon: 'bolt', text: 'Engineering: check the battery' },
      { icon: 'plant', text: 'Botany: harvest 1 plant' },
      { icon: 'heart', text: 'Health: do 1 workout' },
      { icon: 'shield', text: 'Shielding: fill the water wall' },
    ],
  },
  trainingDone: {
    title: 'CADET CERTIFIED',
    lines: [
      { icon: 'medal', text: '4 of 4 certificates!' },
      { icon: 'ice', text: 'Now go outside: get 1 ice' },
    ],
  },
  stormGuide: {
    title: 'SOLAR STORM COMING',
    lines: [{ icon: 'storm', text: `Survive ${STORY_CONFIG.STORMS_FOR_WINDOW} storms, then you can launch` }],
    choices: [
      { icon: 'home', name: 'HIDE', good: 'Shelter with water wall', bad: 'No work outside' },
      { icon: 'shield', name: 'SHIELD', good: 'Keep working', bad: 'Eats battery' },
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

// Treino de cadete (issue #88): 4 certificados curtos dentro da base, cada um dado por um papel
// da tripulacao, na ordem do caminho (console -> energia -> estufa -> academia -> abrigo).
// `place` = lugar da seta (src/story/waypoints.js). O StoryDirector decide quando cada um vale.
export const CERTIFICATES = [
  {
    id: 'cert-power',
    name: 'ENGINEERING',
    mentor: 'Flight Engineer',
    icon: 'bolt',
    place: 'powerroom',
    task: 'CHECK THE BATTERY',
    fact: 'Sun by day, battery and RTG by night',
    source: 'Mars gets 43% of Earth sunlight (NASA Mars Fact Sheet). RTG: about 110 W day and night (NASA MMRTG).',
  },
  {
    id: 'cert-greenhouse',
    name: 'SPACE BOTANY',
    mentor: 'Botanist',
    icon: 'plant',
    place: 'greenhouse',
    task: 'HARVEST 1 PLANT',
    fact: 'Plants grow food with no soil',
    source: 'CSA: Food production on the Moon and in remote areas. NASA Veggie grew lettuce on the Space Station.',
  },
  {
    id: 'cert-gym',
    name: 'HEALTH IN 0.38g',
    mentor: 'Medical Officer',
    icon: 'heart',
    place: 'gym',
    task: 'DO 1 WORKOUT',
    fact: 'Low gravity makes bones weak: train',
    source: 'Mars gravity: 38% of Earth (NASA). Bones lose about 1% a month in space without exercise (NASA).',
  },
  {
    id: 'cert-shelter',
    name: 'RADIATION SHIELDING',
    mentor: 'Medical Officer',
    icon: 'shield',
    place: 'shelter',
    task: 'FILL THE WATER WALL',
    fact: 'Water blocks radiation from the Sun',
    source: 'Simulated pulse from Curiosity RAD data (NASA RadLab). Water shielding: PREDICCS model.',
  },
];

export const CERTIFICATE_IDS = CERTIFICATES.map((cert) => cert.id);

export function certificateById(id) {
  return CERTIFICATES.find((cert) => cert.id === id) ?? null;
}

// Selo de certificado (aparece no meio da tela). O de blindagem roda um pulso de radiacao
// simulado: quanto a parede de agua que o cadete encheu corta da dose (curva do PREDICCS).
export function certificateBadge(cert, { shelterWaterL = 0 } = {}) {
  const line = cert.id === 'cert-shelter'
    ? `Test pulse: your ${Math.round(shelterWaterL)} L wall blocks ${Math.round((1 - shelterDoseFactor(shelterWaterL)) * 100)}% of it`
    : cert.fact;
  return { icon: cert.icon, title: 'CERTIFICATE UNLOCKED', name: cert.name, mentor: cert.mentor, line, source: cert.source };
}

// Card do primeiro relatorio pelo radio. A distancia e o atraso vem do CommsLink (o mesmo radio
// do terminal da base): { millionKm, oneWayMinutes, dateIso } calculados para a data real do jogo.
// Com o treino de cadete (issue #88), a espera da resposta vira hora de treinar.
export function commsCard({ millionKm, oneWayMinutes, dateIso }, { training = false } = {}) {
  return {
    title: 'MESSAGE SENT',
    link: { minutes: oneWayMinutes, millionKm },
    lines: [
      { icon: 'clock', text: 'Earth cannot help fast: you decide' },
      training
        ? { icon: 'medal', text: 'While you wait: cadet training' }
        : { icon: 'ice', text: 'Do not wait: go get 1 ice' },
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
  'cert-power': 'Cadet training: check the battery in the power room',
  'cert-greenhouse': 'Cadet training: harvest 1 plant at the food monitor',
  'cert-gym': 'Cadet training: do 1 workout in the gym',
  'cert-shelter': 'Cadet training: fill the storm shelter water wall',
  act2: 'Get the rocket ready to go home',
  'storm-guide': 'Get safe: storm shelter with water in its wall, or the Shield Remote',
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
