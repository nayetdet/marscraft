// Momentos de "primeira vez": a primeira vez que a crianca faz cada acao principal do jogo
// (pegar gelo, beber agua, ligar para a Terra...) ganha uma animacao curta e um fato real, uma
// vez por partida. Logica pura: quem desenha e o FirstTimeHud.
//
// Os fatos vem de docs/data/numeros-reais.md e docs/data/protecao-radiacao.md (os mesmos numeros
// das fichas do scanner). Frases curtas, para 7 a 12 anos.

export type MomentTone = 'mars' | 'earth' | 'space'; // cor do icone: a base, a Terra, o espaco

// Como a cena da abertura se mexe (cada uma tem a sua animacao no CSS)
export type SceneMotion = 'beam' | 'pour' | 'grow' | 'pulse' | 'charge' | 'drive' | 'recycle';

export interface MomentLine {
  icon: string; // nome em src/ui/pixelIcons.ts
  tone: MomentTone;
  text: string;
}

export interface MomentScene {
  from: string; // desenho colorido de src/ui/pixelSprites.ts
  to: string;
  motion: SceneMotion;
}

// O que o FirstTimeHud desenha
export interface MomentView {
  stamp: string; // palavra grande da abertura
  title: string;
  reason: string;
  lines: MomentLine[];
  source: string;
  scene: MomentScene;
  accent: string; // cor do momento
}

// Contadores lidos do jogo (o snapshot da historia, GameEngine._storySnapshot)
export interface MomentCounts {
  iceCount: number;
  roverIceKg: number;
  drinkCount: number;
  mealCount: number;
  earthCalls: number;
  powerChecks: number;
  plantCount: number;
  workoutCount: number;
  washCount: number;
  shelterWaterL: number;
  roverDrives: number;
  iceDelivered: number;
  stormsSurvived: number;
}

export interface FirstTimeMoment extends MomentView {
  id: string;
  keys: (keyof MomentCounts)[]; // o momento acontece quando qualquer um destes contadores sobe
}

export const FIRST_TIME_MOMENTS: FirstTimeMoment[] = [
  {
    id: 'ice',
    keys: ['iceCount', 'roverIceKg'],
    stamp: 'FIRST ICE!',
    title: 'WATER FROM MARS',
    reason: 'You dug up your first ice',
    accent: '#65d3ed',
    scene: { from: 'ice', to: 'drop', motion: 'pour' },
    lines: [
      { icon: 'ice', tone: 'mars', text: 'Mars hides water ice under the ground' },
      { icon: 'drop', tone: 'mars', text: '1 kg of ice melts into about 1 liter of water' },
    ],
    source: 'NASA Science: Mars. NASA life support baseline values (BVAD)',
  },
  {
    id: 'drink',
    keys: ['drinkCount'],
    stamp: 'FIRST SIP!',
    title: 'WATER TO LIVE',
    reason: 'You drank from the base tank',
    accent: '#58b8ee',
    scene: { from: 'drop', to: 'heart', motion: 'pour' },
    lines: [
      { icon: 'drop', tone: 'space', text: 'An astronaut needs 2.5 to 3.5 liters of water a day' },
      { icon: 'home', tone: 'mars', text: 'Every sip comes out of the base tank' },
    ],
    source: 'NASA life support baseline values (BVAD)',
  },
  {
    id: 'meal',
    keys: ['mealCount'],
    stamp: 'FIRST MEAL!',
    title: 'SPACE FOOD',
    reason: 'You ate your first meal on Mars',
    accent: '#ff9a5c',
    scene: { from: 'food', to: 'heart', motion: 'pulse' },
    lines: [
      { icon: 'food', tone: 'space', text: 'An astronaut eats about 1.8 kg of food a day' },
      { icon: 'plant', tone: 'mars', text: 'The greenhouse grows more, but it costs water and power' },
    ],
    source: 'NASA life support baseline values (BVAD)',
  },
  {
    id: 'radio',
    keys: ['earthCalls'],
    stamp: 'FIRST CALL!',
    title: 'TALKING TO EARTH',
    reason: 'You called Mission Control',
    accent: '#ffc94a',
    scene: { from: 'mars', to: 'earth', motion: 'beam' },
    lines: [
      { icon: 'radio', tone: 'mars', text: 'Radio waves need 3 to 22 minutes to reach Earth' },
      { icon: 'clock', tone: 'earth', text: 'The answer takes just as long to come back' },
    ],
    source: 'NASA Mars Fact Sheet',
  },
  {
    id: 'power',
    keys: ['powerChecks'],
    stamp: 'POWER CHECK!',
    title: 'SUN POWER',
    reason: 'You opened the power panel',
    accent: '#ffe45c',
    scene: { from: 'sun', to: 'battery', motion: 'charge' },
    lines: [
      { icon: 'sun', tone: 'mars', text: 'Mars gets about 43% of the sunlight Earth gets' },
      { icon: 'moon', tone: 'mars', text: 'At night the panels make nothing: the battery takes over' },
    ],
    source: 'NASA Mars Fact Sheet',
  },
  {
    id: 'plant',
    keys: ['plantCount'],
    stamp: 'FIRST SEED!',
    title: 'SPACE FARMING',
    reason: 'You planted your first crop',
    accent: '#78d99b',
    scene: { from: 'seed', to: 'plant', motion: 'grow' },
    lines: [
      { icon: 'plant', tone: 'space', text: 'Astronauts grew lettuce on the Space Station' },
      { icon: 'drop', tone: 'mars', text: 'Your plant drinks from the base tank while it grows' },
    ],
    source: 'NASA Veggie on the Space Station',
  },
  {
    id: 'workout',
    keys: ['workoutCount'],
    stamp: 'FIRST WORKOUT!',
    title: 'STRONG ON MARS',
    reason: 'You finished your first workout',
    accent: '#ff6860',
    scene: { from: 'dumbbell', to: 'heart', motion: 'pulse' },
    lines: [
      { icon: 'down', tone: 'mars', text: 'Mars gravity is only 0.38 of Earth gravity' },
      { icon: 'heart', tone: 'space', text: 'Daily exercise keeps muscles and bones strong' },
    ],
    source: 'NASA Mars Fact Sheet. NASA International Space Station',
  },
  {
    id: 'wash',
    keys: ['washCount'],
    stamp: 'ALL CLEAN!',
    title: 'WATER COMES BACK',
    reason: 'You washed up for the first time',
    accent: '#58b8ee',
    scene: { from: 'drop', to: 'home', motion: 'recycle' },
    lines: [
      { icon: 'drop', tone: 'mars', text: 'Used water goes to the gray water tank' },
      { icon: 'up', tone: 'space', text: 'The Space Station cleans 98% of its water to use again' },
    ],
    source: 'NASA: Space Station water recovery system (2023)',
  },
  {
    id: 'shelter',
    keys: ['shelterWaterL'],
    stamp: 'SHELTER READY!',
    title: 'A WALL OF WATER',
    reason: 'You filled the storm shelter wall',
    accent: '#b79cff',
    scene: { from: 'drop', to: 'shield', motion: 'pour' },
    lines: [
      { icon: 'shield', tone: 'space', text: 'On the Orion spaceship the crew piles cargo around them in a solar storm' },
      { icon: 'drop', tone: 'mars', text: 'Wall water is water you cannot drink' },
    ],
    source: 'NASA Orion storm shelter (Artemis)',
  },
  {
    id: 'rover',
    keys: ['roverDrives'],
    stamp: 'FIRST DRIVE!',
    title: 'ROBOT ON WHEELS',
    reason: 'You drove the rover',
    accent: '#e07a4a',
    scene: { from: 'rover', to: 'ice', motion: 'drive' },
    lines: [
      { icon: 'rover', tone: 'mars', text: 'NASA rover Curiosity weighs about 899 kg, like a car' },
      { icon: 'clock', tone: 'mars', text: 'Its top speed is 0.14 km/h, slower than walking' },
    ],
    source: 'NASA Curiosity rover',
  },
  {
    id: 'fuel',
    keys: ['iceDelivered'],
    stamp: 'ROCKET FUEL!',
    title: 'ICE TO FUEL',
    reason: 'You loaded ice into the rocket',
    accent: '#ff9a5c',
    scene: { from: 'ice', to: 'rocket', motion: 'charge' },
    lines: [
      { icon: 'ice', tone: 'mars', text: 'Water ice can become rocket fuel and oxygen' },
      { icon: 'air', tone: 'mars', text: 'MOXIE made oxygen from Mars air in 2021' },
    ],
    source: 'NASA Science: Mars. NASA Perseverance rover (MOXIE)',
  },
  {
    id: 'storm',
    keys: ['stormsSurvived'],
    stamp: 'STORM SURVIVED!',
    title: 'SOLAR STORM',
    reason: 'You made it through a solar storm',
    accent: '#ffc451',
    scene: { from: 'storm', to: 'shield', motion: 'pulse' },
    lines: [
      { icon: 'storm', tone: 'mars', text: 'In 2024 Curiosity measured its biggest solar storm on Mars' },
      { icon: 'radiation', tone: 'mars', text: 'It was like 30 chest X-rays at once' },
    ],
    source: 'NASA, 2024 (Curiosity RAD)',
  },
];

const EPSILON = 1e-6;

// Segue os contadores e avisa quando um deles sobe pela primeira vez. Chamado a cada quadro:
// nao aloca nada.
export class FirstTimeMoments {
  seen = new Set<string>();
  private base: MomentCounts | null = null;

  // Devolve o momento que acabou de acontecer, ou null. Um por chamada: se dois acontecerem
  // juntos, o segundo sai na chamada seguinte.
  observe(counts: MomentCounts): FirstTimeMoment | null {
    if (!this.base) {
      this.base = { ...counts }; // primeira leitura: so guarda o ponto de partida
      return null;
    }
    for (const moment of FIRST_TIME_MOMENTS) {
      if (this.seen.has(moment.id)) continue;
      for (const key of moment.keys) {
        if (counts[key] > this.base[key] + EPSILON) {
          this.seen.add(moment.id);
          return moment;
        }
      }
    }
    return null;
  }
}

// A linha do diario de bordo [J]
export function momentLogText(moment: MomentView): string {
  return `${moment.title}: ${moment.lines.map((line) => line.text).join('. ')}. (${moment.source})`;
}
