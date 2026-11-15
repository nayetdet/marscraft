import { CROP_CONFIG, GREENHOUSE_PLOT_YIELD, ROVER_CONFIG, STORY_CONFIG, WATER_SYSTEM_CONFIG } from '../config/constants.ts';

// Desvios do tutorial guiado (issue #237). Alguns passos gastam um recurso da base (agua, energia,
// comida, bateria do rover). Se a base nao tem o minimo, a crianca ficava presa sem saber o que
// fazer. Agora o passo declara o que precisa (`needs`, em tutorialSteps.ts) e, enquanto faltar,
// o StoryDirector troca a tarefa por um desvio: onde buscar aquele recurso. Quando o recurso
// volta, o passo volta sozinho, do ponto em que estava.
//
// So dados: uma linha por recurso, com como ler quanto a base tem no retrato do jogo e a tarefa
// do desvio (os mesmos campos de um passo do tutorial: label, hint, place, icon, lines, objective).
// Um desvio tambem pode precisar de outro recurso (`needs`): buscar agua com o rover pede bateria
// no rover. Ai vale o desvio mais fundo, que e o que a crianca consegue fazer agora.

// `bodyFood` e `bodyWater` (issue #421) sao as barras da crianca, nao recursos da base: o treino
// da academia gasta comida e agua dela, entao o passo da academia manda comer ou beber antes.
export type TutorialResource = 'water' | 'power' | 'food' | 'roverPower' | 'bodyFood' | 'bodyWater';

export interface TutorialNeed {
  resource: TutorialResource;
  // Minimo para o passo funcionar, na unidade do recurso (L, % de bateria, porcoes)
  amount: number;
}

// Parte do retrato do jogo (GameEngine._updateStory) que os desvios leem. Campo ausente =
// recurso desconhecido, que conta como suficiente: sem a informacao nao ha desvio.
export interface ResourceSnapshot {
  baseWaterL?: number; // agua limpa no tanque da base
  batteryCharge?: number; // bateria da base, na mesma unidade dos custos (%)
  foodStock?: number; // racoes na despensa + plantas colhidas na mochila
  roverBattery?: number; // bateria do rover (%)
  roverActive?: boolean; // a crianca esta dirigindo o rover
  playerFood?: number; // barra de comida da crianca, em pontos (issue #421)
  playerWater?: number; // barra de agua da crianca, em pontos (issue #421)
}

export interface TutorialLine {
  icon: string;
  text: string;
}

export interface TutorialDetour {
  id: string; // objectiveId enquanto o desvio vale
  resource: TutorialResource;
  zone: string; // cor do painel e do balao (STEP_COLORS em tutorialSteps.ts)
  icon: string;
  label: string;
  hint: string;
  place: string; // lugar da seta (src/story/waypoints.ts)
  roverPlace?: string; // lugar da seta enquanto a crianca dirige o rover
  objective: string;
  lines: readonly TutorialLine[];
  needs?: readonly TutorialNeed[];
  read: (s: ResourceSnapshot) => number;
}

const known = (value: number | undefined): number => (typeof value === 'number' ? value : Infinity);

const cheapestCrop = (key: 'water' | 'energy'): number =>
  Math.min(...Object.values(CROP_CONFIG).map((crop) => crop[key])) * Math.min(...Object.values(GREENHOUSE_PLOT_YIELD));

// Plantar a semente mais barata no menor campo: a planta bebe a agua enquanto cresce e a luz da
// estufa usa bateria, entao plantar e colher pedem o mesmo minimo
export const PLANT_NEEDS: readonly TutorialNeed[] = Object.freeze([
  { resource: 'water', amount: cheapestCrop('water') },
  { resource: 'power', amount: cheapestCrop('energy') },
]);

export const TUTORIAL_DETOURS: Readonly<Record<TutorialResource, TutorialDetour>> = Object.freeze({
  // Agua: o rover perfura gelo na cratera e descarrega na base, onde o gelo vira agua do tanque.
  // O console do rover funciona desde o comeco do jogo, antes do passo que o ensina.
  water: {
    id: 'need-water',
    resource: 'water',
    zone: 'ice',
    icon: 'ice',
    label: 'GET WATER',
    hint: 'Rover console: press F. Drill ice (SPACE), unload it at the base (SPACE)',
    place: 'console',
    roverPlace: 'ice',
    objective: 'The base tank is almost empty: drill ice with the rover and bring it to the base',
    lines: [
      { icon: 'drop', text: 'The base water tank is almost empty' },
      { icon: 'home', text: 'ROVER CONSOLE: press F, drive to the ICE CRATER' },
      { icon: 'ice', text: 'Drill ice (SPACE), unload it at the base' },
    ],
    // O rover so perfura com a bateria acima do nivel baixo
    needs: [{ resource: 'roverPower', amount: ROVER_CONFIG.LOW_BATTERY }],
    read: (s) => known(s.baseWaterL),
  },
  // Energia: so o Sol (e o reator, na sala de energia) carrega a bateria. O que a crianca pode
  // fazer e desligar o que gasta e esperar.
  power: {
    id: 'need-power',
    resource: 'power',
    zone: 'power',
    icon: 'bolt',
    label: 'SAVE POWER',
    hint: 'Power room: press F, switch things OFF. The Sun fills the battery',
    place: 'powerroom',
    objective: 'The battery is almost empty: switch things off in the power room and wait for the Sun',
    lines: [
      { icon: 'bolt', text: 'The battery is almost empty' },
      { icon: 'check', text: 'POWER ROOM: press F, switch OFF what you can' },
      { icon: 'sun', text: 'The solar panels fill it when the Sun is up' },
    ],
    read: (s) => known(s.batteryCharge),
  },
  // Comida: a despensa enche devagar com a horta da tripulacao; a crianca pode plantar e colher
  // a propria planta e cozinhar na cozinha.
  food: {
    id: 'need-food',
    resource: 'food',
    zone: 'greenhouse',
    icon: 'plant',
    label: 'GROW FOOD',
    hint: 'Food monitor: press F, plant a seed, then HARVEST and pick it up',
    place: 'greenhouse',
    objective: 'The pantry is empty: plant a seed, harvest it and pick it up',
    lines: [
      { icon: 'food', text: 'The pantry is empty' },
      { icon: 'plant', text: 'FOOD MONITOR: plant a seed, then HARVEST' },
      { icon: 'check', text: 'Pick up your plant: you can cook it in the KITCHEN' },
    ],
    needs: PLANT_NEEDS,
    read: (s) => known(s.foodStock),
  },
  // Bateria do rover: carrega parado no deposito ao lado da base, usando a bateria da base
  roverPower: {
    id: 'need-rover-power',
    resource: 'roverPower',
    zone: 'rover',
    icon: 'bolt',
    label: 'CHARGE THE ROVER',
    hint: 'Rover console: press F. Park the rover next to the base to charge',
    place: 'console',
    objective: 'The rover battery is too low to drill: park it next to the base to charge',
    lines: [
      { icon: 'bolt', text: 'The rover battery is too low to drill' },
      { icon: 'home', text: 'Drive back and park next to the base' },
      { icon: 'clock', text: 'It charges there, using the base battery' },
    ],
    read: (s) => known(s.roverBattery),
  },
  // Fome da crianca (issue #421): o treino gasta comida da barra dela. O cozinheiro entrega a
  // racao; se a despensa esta vazia, vale o desvio da comida (plantar e colher).
  bodyFood: {
    id: 'need-eat',
    resource: 'bodyFood',
    zone: 'kitchen',
    icon: 'food',
    label: 'EAT A MEAL',
    hint: 'Kitchen: press F on the cook, then eat the ration',
    place: 'kitchen',
    objective: 'Too hungry to train: get a ration from the cook and eat it',
    lines: [
      { icon: 'heart', text: 'Too hungry to train' },
      { icon: 'food', text: 'KITCHEN: press F on the cook' },
      { icon: 'check', text: 'Pick the ration, then right-click to eat' },
    ],
    needs: [{ resource: 'food', amount: STORY_CONFIG.TUTORIAL_RATIONS_NEEDED }],
    read: (s) => known(s.playerFood),
  },
  // Sede da crianca (issue #421): o treino gasta agua da barra dela. A torneira usa o tanque da
  // base; com o tanque vazio, vale o desvio da agua (gelo com o rover).
  bodyWater: {
    id: 'need-drink',
    resource: 'bodyWater',
    zone: 'water',
    icon: 'drop',
    label: 'DRINK WATER',
    hint: 'Water tap: press F',
    place: 'water',
    objective: 'Too thirsty to train: drink water at the water tap',
    lines: [
      { icon: 'heart', text: 'Too thirsty to train' },
      { icon: 'drop', text: 'Go to the WATER TAP: press F' },
      { icon: 'home', text: 'It comes from the base tank' },
    ],
    needs: [{ resource: 'water', amount: WATER_SYSTEM_CONFIG.DRINK_AMOUNT_FROM_DISPENSER }],
    read: (s) => known(s.playerWater),
  },
});

const DETOUR_LIST: readonly TutorialDetour[] = Object.values(TUTORIAL_DETOURS);

export function detourById(id: string): TutorialDetour | null {
  return DETOUR_LIST.find((detour) => detour.id === id) ?? null;
}

const NO_DETOUR: readonly TutorialDetour[] = Object.freeze([]);
// Um desvio pode pedir outro, e so: a tabela nao tem ciclos, e isto garante que nunca tera laco
const MAX_CHAIN = DETOUR_LIST.length;

// Desvios que valem agora para uma lista de necessidades, do mais de fora ao mais fundo (o
// ultimo e o que aparece para a crianca). Lista vazia = nada falta.
// `active`: recursos dos desvios que ja estavam valendo. Para sair de um desvio o recurso precisa
// passar um pouco do minimo (STORY_CONFIG.DETOUR_RESUME_EXTRA): sem isso, a tarefa ficaria
// piscando entre o passo e o desvio a cada gole de agua das plantas.
export function findDetours(
  needs: readonly TutorialNeed[] | undefined,
  s: ResourceSnapshot,
  active: ReadonlySet<TutorialResource> = new Set(),
  depth = 0,
): readonly TutorialDetour[] {
  if (!needs || depth >= MAX_CHAIN) return NO_DETOUR;
  for (const need of needs) {
    const detour = TUTORIAL_DETOURS[need.resource];
    const target = need.amount + (active.has(need.resource) ? STORY_CONFIG.DETOUR_RESUME_EXTRA[need.resource] : 0);
    if (!(detour.read(s ?? {}) < target)) continue;
    return [detour, ...findDetours(detour.needs, s, active, depth + 1)];
  }
  return NO_DETOUR;
}
