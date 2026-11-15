// @ts-nocheck
import { EVENTS_CONFIG } from '../config/constants.ts';

// Textos dos eventos aleatorios (issue #107). UI em ingles, para criancas de 7 a 12 anos, sem emoji.
// Cada card usa o formato da historia ({ title, lines, fact, source }, ver storyChapters.js) e traz
// um fato real com data e fonte, conferido na fonte citada (docs/data/numeros-reais.md).

export const EVENT_NAMES = {
  meteor: 'Meteor impact',
  marsquake: 'Marsquake',
  eclipse: 'Phobos eclipse',
  dustDevil: 'Dust devil',
  frost: 'Morning frost',
  aurora: 'Green aurora',
};

export const EVENT_FACTS = {
  meteor: {
    fact: 'Real event: on 24/12/2021 a space rock (a meteoroid) hit Mars. The InSight lander felt it as a magnitude 4 marsquake, and the MRO orbiter found the new crater, with boulder-size chunks of ice thrown out.',
    source: "NASA JPL, 27/10/2022: NASA's InSight Lander Detects Stunning Meteoroid Impact on Mars",
  },
  marsquake: {
    fact: 'Real event: the InSight lander felt more than 1,300 marsquakes. The biggest one, magnitude 5 (a medium quake), shook Mars on 04/05/2022.',
    source: "NASA JPL, 09/05/2022: NASA's InSight Records Monster Quake on Mars",
  },
  eclipse: {
    fact: 'Real event: on 02/04/2022 the Perseverance rover filmed Phobos, the bigger of the two small moons of Mars, crossing in front of the Sun. The eclipse lasted a little over 40 seconds.',
    source: "NASA JPL, 20/04/2022: NASA's Perseverance Rover Captures Video of Solar Eclipse on Mars",
  },
  dustDevil: {
    fact: "Real event: on 09/03/2005 the wind blew dust off the Spirit rover's solar panels and its power went up by about 50%. The next day Spirit filmed dust devils (small whirlwinds) nearby. Scientists think one may have helped, but nobody saw it happen.",
    source: 'NASA/JPL Mars Exploration Rover image release, 14/03/2005, and NASA Photojournal PIA03608',
  },
  frost: {
    fact: 'Real photo: on 13/09/1977 the Viking 2 lander took the first clear picture of frost on the ground of Mars. Scientists were not sure if it was water ice, dry ice (frozen carbon dioxide) or both.',
    source: 'NASA Photojournal PIA00530: Frost on Utopia Planitia',
  },
  aurora: {
    fact: 'Real event: after a big eruption on the Sun on 15/03/2024, the Perseverance rover detected a green aurora. It was the first time an aurora in visible light was seen from the surface of another planet.',
    source: 'NASA JPL, 14/05/2025: NASA Observes First Visible-light Auroras at Mars',
  },
};

const LINES = {
  meteor: [
    { icon: 'ice', text: 'A new crater opened outside' },
    { icon: 'ice', text: 'Fresh ice is showing inside it' },
    { icon: 'air', text: 'Going there costs suit air and dose' },
  ],
  eclipse: [
    { icon: 'sun', text: 'Phobos is passing in front of the Sun' },
    { icon: 'bolt', text: 'Solar panels make less power for a moment' },
    { icon: 'sun', text: 'Watch the Sun with your scope' },
  ],
  dustDevil: [
    { icon: 'storm', text: 'A spinning column of dust is moving' },
    { icon: 'bolt', text: 'Over the solar panels it can blow dust off' },
    { icon: 'air', text: 'Inside it you cannot see' },
  ],
  frost: [
    { icon: 'sun', text: 'Thin frost on the ground at sunrise' },
    { icon: 'clock', text: 'It goes away when the Sun gets higher' },
  ],
  aurora: [
    { icon: 'storm', text: 'You survived the solar storm' },
    { icon: 'moon', text: 'Its particles make the night sky glow' },
  ],
};

// Card do evento. `stationName`: estacao balancada pelo tremor.
export function eventCard(type, { stationName = 'base' } = {}) {
  const lines = type === 'marsquake'
    ? [
      { icon: 'home', text: 'The ground is shaking!' },
      { icon: 'down', text: `The ${stationName} got damaged` },
      { icon: 'bolt', text: 'Fix it: 3D printer in the workshop' },
    ]
    : LINES[type];
  return { title: EVENT_NAMES[type].toUpperCase(), lines, ...EVENT_FACTS[type], seconds: EVENTS_CONFIG.CARD_SECONDS };
}

// Lado da base em que um ponto esta. No jogo o norte e -z (a ala norte) e o leste e +x.
export function compassDirection(dx, dz) {
  const angle = Math.atan2(dx, -dz); // 0 = norte, cresce para o leste
  const names = ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest'];
  const index = Math.round(angle / (Math.PI / 4));
  return names[(index + 8) % 8];
}

export function meteorToast({ iceBlocks, distance, direction }) {
  return iceBlocks > 0
    ? `Impact! A new crater ${distance} blocks ${direction} of the base has ${iceBlocks} ice blocks showing. The ice sensor marks them in blue.`
    : `Impact! A new crater opened ${distance} blocks ${direction} of the base.`;
}

export function quakeToast({ stationName, lostPct }) {
  return `Marsquake! The ${stationName} lost ${lostPct}% health. Print a spare part in the workshop, or live with it.`;
}

// `cleanedPct`: quanto da poeira dos paineis saiu (null se o jogo ainda nao tem poeira nos paineis)
export function dustDevilPanelsToast(cleanedPct) {
  return cleanedPct > 0
    ? `The dust devil swept the solar field: ${cleanedPct}% of the panel dust blew away!`
    : 'The dust devil crossed the solar field.';
}

export const DUST_DEVIL_HIT_TOAST = 'You are inside the dust devil: you cannot see!';
export const ECLIPSE_END_TOAST = 'The eclipse is over: full sunlight is back on the panels.';

// Lista curta para a tela de vitoria: "Meteor impact, Marsquake x2"
export function eventsSummary(history) {
  if (!history.length) return 'none';
  const counts = new Map();
  for (const e of history) counts.set(e.type, (counts.get(e.type) ?? 0) + 1);
  return [...counts].map(([type, n]) => (n > 1 ? `${EVENT_NAMES[type]} x${n}` : EVENT_NAMES[type])).join(', ');
}
