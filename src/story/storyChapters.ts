// @ts-nocheck
import { formatDateDMY } from '../mission/missionText.ts';
import { CLUES_ANSWER } from '../mission/clues.ts';
import { shelterDoseFactor } from '../mission/radiation.ts';
import { STORY_CONFIG } from '../config/constants.ts';
import { SPEAKERS } from './radioSpeakers.ts';

// Textos da historia (UI em ingles, para criancas de 7 a 12 anos, sem emoji).
// So dados: quem decide quando cada coisa aparece e o StoryDirector.
//
// Um card e mais desenho do que texto: { title, lines?, choices?, link?, source?, speaker?, seconds? }
//   lines:   [{ icon, text }]  frases curtas, cada uma com um icone (pixelIcons.js)
//   choices: [{ icon, name, good, bad, id?, key? }]  duas opcoes lado a lado, com o ganho e o custo.
//            Com `id` e `key` a opcao e escolhida na hora pela tecla (ou pelo toque), sem parar o
//            jogo: quem aplica a escolha e o GameEngine (_onCardChoice)
//   link:    { minutes, millionKm }  desenho do sinal de radio indo de Marte ate a Terra
//   speaker: quem da tripulacao fala no radio (radioSpeakers.ts); sem ele fala o oficial de comunicacao
//   seconds: tempo do card na tela; sem ele vale STORY_CONFIG.CARD_SECONDS

// Os baloes do tutorial (ato 1) ficam em src/story/tutorialSteps.ts, um por passo.
export const CARDS = {
  // A missao inteira num card: a rotina que se repete ate o tanque encher, a ciencia e o prazo.
  // A janela de lancamento ja esta aberta. A tempestade tem o card dela, na hora em que chega.
  act2: {
    title: 'FILL THE ROCKET',
    speaker: SPEAKERS.engineer,
    lines: [
      { icon: 'ice', text: 'Get ice at the crater' },
      { icon: 'rocket', text: 'Load it into the rocket' },
      { icon: 'rock', text: 'Find 3 clues: was Mars alive?' },
      { icon: 'radio', text: 'Send the clues to Earth' },
      { icon: 'clock', text: 'Launch before the window closes' },
    ],
  },
  // Fim do tutorial guiado: dai em diante o jogo e a rotina de encher o foguete
  trainingDone: {
    title: 'TRAINING COMPLETE',
    speaker: SPEAKERS.engineer,
    lines: [
      { icon: 'medal', text: 'You know the whole base!' },
      { icon: 'storm', text: 'Now solar storms can come' },
    ],
  },
  stormGuide: {
    title: 'SOLAR STORM COMING',
    // Radiacao e assunto da medica da tripulacao
    speaker: SPEAKERS.medic,
    lines: [{ icon: 'storm', text: 'Stay safe: the launch window keeps running' }],
    // Escolha na hora, andando: [1] ou [2] (issue #135). Nenhuma e de graca.
    choices: [
      { id: 'hide', key: '1', icon: 'home', name: 'HIDE', good: 'Shelter with water wall', bad: 'No work outside' },
      { id: 'shield', key: '2', icon: 'shield', name: 'SHIELD', good: 'Keep working', bad: 'Eats battery' },
    ],
  },
};

// Certificados de cadete (issue #88): 4 passos do tutorial guiado (tutorialSteps.ts, campo
// `certificate`) entregam um selo, cada um dado por um papel da tripulacao.
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
// O desenho mostra o atraso real; a espera no jogo e encolhida (COMMS_CONFIG).
export function commsCard({ millionKm, oneWayMinutes, dateIso }) {
  return {
    title: 'MESSAGE SENT',
    speaker: SPEAKERS.comms,
    // Fecha sozinho quando o pacote do desenho chega na Terra
    seconds: STORY_CONFIG.COMMS_CARD_SECONDS,
    link: { minutes: oneWayMinutes, millionKm },
    lines: [
      { icon: 'clock', text: 'Earth cannot help fast: you decide' },
      { icon: 'check', text: 'Do not wait: keep going' },
    ],
    source: `Distance calculated for ${formatDateDMY(dateIso)} from NASA/JPL planet orbits`,
  };
}

// A resposta da Terra chega depois, com o jogador ja no trabalho seguinte: e assim que o atraso
// aparece no jogo, sem ninguem ficar parado esperando.
export function replyCard({ oneWayMinutes }) {
  return {
    title: 'EARTH ANSWERED',
    speaker: SPEAKERS.comms,
    lines: [
      { icon: 'radio', text: 'We hear you, Commander!' },
      { icon: 'clock', text: `Real radio trip: ${oneWayMinutes * 2} min there and back` },
    ],
  };
}

// Epilogo: a ultima mensagem da Terra, na tela de vitoria. Fecha a historia com o mesmo atraso de
// radio que a abriu (CALL EARTH) e diz o que a ciencia enviada valeu. `sentPoints`, `discoveries` e
// `samples` sao a ciencia que chegou a Terra nesta partida; `oneWayMinutes` vem do CommsLink.
// `cluesSent`: as 3 pistas da missao chegaram (issue #344): a Terra responde a pergunta da missao.
export function earthFarewell({ sentPoints = 0, discoveries = 0, samples = 0, oneWayMinutes = 0, cluesSent = false } = {}) {
  const found = [];
  if (discoveries > 0) found.push(`${discoveries} ${discoveries === 1 ? 'discovery' : 'discoveries'}`);
  if (samples > 0) found.push(`${samples} ${samples === 1 ? 'sample' : 'samples'}`);
  return {
    title: 'MESSAGE FROM EARTH',
    lines: [
      { icon: 'radio', text: 'We saw the liftoff. Well done, Commander!' },
      { icon: 'scope', text: `Earth got your science: ${sentPoints} points` },
      ...(found.length > 0 ? [{ icon: 'check', text: found.join(' and ') }] : []),
      ...(cluesSent ? [{ icon: 'rock', text: `Your 3 clues say: ${CLUES_ANSWER}` }] : []),
      { icon: 'home', text: 'Now the 7-month trip home' },
    ],
    note: `This message left Earth ${oneWayMinutes} min before you read it`,
  };
}

// Frase curta de cada objetivo (terminal da base). As dos passos do tutorial ficam em
// tutorialSteps.ts (`objective`). O painel do objetivo mostra a versao em icones:
// src/story/objectiveView.ts.
export const OBJECTIVES = {
  act2: 'Get the rocket ready to go home',
  'storm-guide': 'Get safe: storm shelter with water in its wall, or the Shield Remote',
  fuel: 'Fill the rocket with ice',
  'send-data': 'Find the 3 clues and send your science to Earth from the science & radio terminal',
  ignite: 'Go to the rocket and press IGNITE',
  done: 'Liftoff! You are going home',
  failed: 'The launch window closed',
};

export const WINDOW_CLOSED = {
  title: 'The launch window closed',
  text: 'Earth and Mars only line up for the trip home about every 26 months. The crew must wait on Mars for the next window. Real missions plan every sol around this deadline!',
  source: 'Mars launch windows: about every 26 months (NASA)',
};
