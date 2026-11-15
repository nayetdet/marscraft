// @ts-nocheck
import { SIGNS, ZONE_COLORS } from '../base/basePosters.ts';

// Tutorial guiado (teste com jogadores de 15/11/2026): um passo por vez, cada um com UMA coisa
// para fazer, o lugar aonde ir e a tecla. O proximo passo so aparece quando a crianca termina
// o atual. So dados: quem anda pela lista e o StoryDirector.
//
// Cada passo:
//   id        objetivo do StoryDirector (objectiveId)
//   zone      secao da base a que o passo pertence: da a cor do balao e do painel (STEP_COLORS)
//   icon      icone do painel (pixelIcons.ts)
//   label     2 ou 3 palavras, em letras grandes no painel
//   hint      onde ir e o que apertar, numa linha curta (fica no painel ate o passo acabar)
//   lines     as frases do balao: onde, como e por que (o custo ou a ideia real por tras)
//   place     lugar da seta (src/story/waypoints.ts); null = nenhum lugar
//   objective frase curta para o terminal da base
//   done      (s, b) => o passo acabou? `s` e o retrato do jogo e `b` uma copia dele tirada
//             quando o passo comecou: o que vale e o que a crianca fez DEPOIS do pedido
//   core      true = continua existindo com o tutorial pulado (menu Demo Tools)
//   certificate  id do selo que o passo entrega (CERTIFICATES em storyChapters.ts)
//
// As tarefas de comer, beber e lavar contam a tentativa (apertar o botao certo), nao o resultado:
// quem ja esta sem fome ou sem sede nao fica preso no passo.

// Cor de cada secao, a mesma das placas das salas (ZONE_COLORS e SIGNS em basePosters.ts):
// a crianca liga o passo ao lugar pela cor (planta = verde, academia = ciano, abrigo = rosa).
// O que nao tem sala na base ganha uma cor propria.
export const STEP_COLORS = {
  airlock: SIGNS.airlock.color,
  water: SIGNS.bathroom.color,
  kitchen: '#a3e635', // verde-limao: perto do verde da placa da cozinha, sem repetir a estufa
  radio: ZONE_COLORS.quarters,
  power: SIGNS.powerRoom.color,
  greenhouse: ZONE_COLORS.greenhouse,
  gym: ZONE_COLORS.gym,
  shelter: ZONE_COLORS.shelter,
  rover: SIGNS.workshop.color,
  ice: '#7dd3fc',
  rocket: ZONE_COLORS.medical,
  science: '#c084fc',
};

const count = (s, key) => s[key] ?? 0;
const more = (key) => (s, b) => count(s, key) > count(b, key);

export const TUTORIAL_STEPS = [
  {
    id: 'enter-base',
    zone: 'airlock',
    core: true,
    icon: 'door',
    label: 'ENTER THE BASE',
    hint: 'Follow the arrow. Press F on the door',
    place: 'airlock',
    objective: 'Go inside the base through the airlock',
    lines: [
      { icon: 'rocket', text: 'Mission: fill the rocket, fly home' },
      { icon: 'air', text: 'Your suit air is low' },
      { icon: 'door', text: 'AIRLOCK door: press F' },
    ],
    done: (s) => Boolean(s.insideHabitat),
  },
  {
    id: 'drink',
    zone: 'water',
    icon: 'drop',
    label: 'DRINK WATER',
    hint: 'Water tap: press F',
    place: 'water',
    objective: 'Drink water at the water tap',
    lines: [
      { icon: 'drop', text: 'Go to the WATER TAP: press F' },
      { icon: 'home', text: 'It comes from the base tank' },
    ],
    done: more('drinkCount'),
  },
  {
    id: 'eat',
    zone: 'kitchen',
    icon: 'food',
    label: 'EAT A MEAL',
    hint: 'Kitchen: press F, then EAT A RATION',
    place: 'kitchen',
    objective: 'Eat a ration in the kitchen',
    lines: [
      { icon: 'food', text: 'Go to the KITCHEN: press F' },
      { icon: 'check', text: 'Choose EAT A RATION' },
      { icon: 'heart', text: 'The pantry feeds the whole crew' },
    ],
    done: more('mealCount'),
  },
  {
    id: 'report',
    zone: 'radio',
    core: true,
    icon: 'radio',
    label: 'CALL EARTH',
    hint: 'Radio terminal: press F, then CALL EARTH',
    place: 'science',
    objective: 'Call Earth at the science & radio terminal',
    lines: [
      { icon: 'radio', text: 'Go to the RADIO terminal: press F' },
      { icon: 'check', text: 'Choose CALL EARTH' },
      { icon: 'bolt', text: 'Each call uses battery' },
    ],
    done: more('earthCalls'),
  },
  {
    id: 'cert-power',
    zone: 'power',
    certificate: 'cert-power',
    icon: 'bolt',
    label: 'CHECK THE BATTERY',
    hint: 'Power room: press F on the panel',
    place: 'powerroom',
    objective: 'Check the battery in the power room',
    lines: [
      { icon: 'bolt', text: 'Go to the POWER ROOM: press F' },
      { icon: 'sun', text: 'Sun by day, battery by night' },
    ],
    done: more('powerChecks'),
  },
  {
    id: 'plant',
    zone: 'greenhouse',
    icon: 'plant',
    label: 'PLANT A SEED',
    hint: 'Food monitor: press F, pick a seed, click a field',
    place: 'greenhouse',
    objective: 'Plant 1 seed at the food monitor',
    lines: [
      { icon: 'plant', text: 'Go to the FOOD MONITOR: press F' },
      { icon: 'check', text: 'Pick a seed, then click a field' },
      { icon: 'drop', text: 'Plants drink water and use battery' },
    ],
    done: more('plantCount'),
  },
  {
    id: 'cert-greenhouse',
    zone: 'greenhouse',
    certificate: 'cert-greenhouse',
    icon: 'plant',
    label: 'HARVEST 1 PLANT',
    hint: 'Food monitor: wait, then press HARVEST',
    place: 'greenhouse',
    objective: 'Harvest 1 plant at the food monitor',
    lines: [
      { icon: 'clock', text: 'Wait a few seconds: it grows fast' },
      { icon: 'plant', text: 'Press HARVEST at the food monitor' },
    ],
    done: more('harvestCount'),
  },
  {
    id: 'cert-gym',
    zone: 'gym',
    certificate: 'cert-gym',
    icon: 'heart',
    label: 'DO 1 WORKOUT',
    hint: 'Gym: press F on the treadmill, then SPACE',
    place: 'gym',
    objective: 'Do 1 workout in the gym',
    lines: [
      { icon: 'heart', text: 'GYM treadmill: press F' },
      { icon: 'check', text: 'Press SPACE in the green zone' },
      { icon: 'down', text: 'Low gravity makes bones weak' },
    ],
    done: more('workoutCount'),
  },
  {
    id: 'wash',
    zone: 'water',
    icon: 'drop',
    label: 'WASH UP',
    hint: 'Bathroom: press F, then WASH UP',
    place: 'bathroom',
    objective: 'Wash up in the bathroom',
    lines: [
      { icon: 'drop', text: 'Go to the BATHROOM: press F' },
      { icon: 'check', text: 'Choose WASH UP' },
      { icon: 'up', text: 'Used water is cleaned to drink again' },
    ],
    done: more('washCount'),
  },
  {
    id: 'cert-shelter',
    zone: 'shelter',
    certificate: 'cert-shelter',
    icon: 'shield',
    label: 'FILL THE WATER WALL',
    hint: 'Storm shelter: press F, then FILL WALL',
    place: 'shelter',
    objective: 'Fill the storm shelter water wall',
    lines: [
      { icon: 'shield', text: 'Go to the STORM SHELTER: press F' },
      { icon: 'check', text: 'Choose FILL WALL' },
      { icon: 'drop', text: 'Wall water is water you cannot drink' },
    ],
    done: (s, b) => count(s, 'shelterWaterL') > count(b, 'shelterWaterL') + 1e-6,
  },
  {
    id: 'rover-drive',
    zone: 'rover',
    icon: 'home',
    label: 'DRIVE THE ROVER',
    hint: 'Rover console: press F',
    place: 'console',
    objective: 'Start the rover at the rover console',
    lines: [
      { icon: 'home', text: 'Go to the ROVER CONSOLE: press F' },
      { icon: 'air', text: 'The rover works outside, you stay safe' },
    ],
    done: more('roverDrives'),
  },
  {
    id: 'rover-ice',
    zone: 'rover',
    icon: 'drop',
    label: 'DRILL ICE FOR WATER',
    hint: 'Drive to the ice crater: press SPACE to drill',
    place: 'ice',
    objective: 'Drive the rover to the ice crater and drill ice',
    lines: [
      { icon: 'ice', text: 'Drive (WASD) to the ICE CRATER' },
      { icon: 'check', text: 'Press SPACE to drill' },
      { icon: 'drop', text: 'Rover ice becomes water for the base' },
    ],
    done: more('roverIceKg'),
  },
  {
    id: 'collect-ice',
    zone: 'ice',
    core: true,
    icon: 'ice',
    label: 'GET 1 ICE',
    hint: 'Leave the rover (F). Walk to the crater, hold click on ice',
    place: 'ice',
    objective: 'Get 1 block of ice from the ice crater',
    lines: [
      { icon: 'door', text: 'Press F to leave the rover, go outside' },
      { icon: 'ice', text: 'At the ICE CRATER: hold click on ice' },
      { icon: 'air', text: 'Outside uses your suit air' },
    ],
    // So vale gelo novo, pego depois do pedido. Gelo gasto baixa a base de comparacao.
    done: (s, b) => {
      if (count(s, 'iceCount') < count(b, 'iceCount')) b.iceCount = count(s, 'iceCount');
      return count(s, 'iceCount') > count(b, 'iceCount');
    },
  },
  {
    id: 'load-rocket',
    zone: 'rocket',
    icon: 'rocket',
    label: 'LOAD THE ROCKET',
    hint: 'Rocket: press F, then LOAD 1 ICE',
    place: 'mav',
    objective: 'Load your ice into the rocket',
    lines: [
      { icon: 'rocket', text: 'Go to the ROCKET: press F' },
      { icon: 'check', text: 'Choose LOAD 1 ICE' },
      { icon: 'bolt', text: 'Ice becomes fuel, fuel uses battery' },
    ],
    done: (s, b) => count(s, 'iceNeeded') < count(b, 'iceNeeded'),
  },
  {
    id: 'scan',
    zone: 'science',
    icon: 'scope',
    label: 'SCAN 1 THING',
    hint: 'Pick scope: left-click scans; right-click opens/closes',
    place: null,
    objective: 'Scan 1 thing with the scope',
    lines: [
      { icon: 'scope', text: 'Pick the SCOPE in your hotbar' },
      { icon: 'check', text: 'Left-click to scan; right-click opens/closes the scope' },
      { icon: 'radio', text: 'Scans become science for Earth' },
    ],
    done: more('scanCount'),
  },
];

export const TUTORIAL_STEP_IDS = TUTORIAL_STEPS.map((step) => step.id);

// Passos que sobram com o tutorial pulado: entrar na base, avisar a Terra e buscar gelo
export const CORE_STEPS = TUTORIAL_STEPS.filter((step) => step.core);

export function tutorialStepById(id) {
  return TUTORIAL_STEPS.find((step) => step.id === id) ?? null;
}

// Balao do passo: titulo com o numero ("STEP 4/15: CALL EARTH") e as frases do passo.
// `step: true` avisa o StoryHud que este balao troca o do passo anterior, sem fila.
export function stepCard(step, index, total) {
  // `stepId`: o GameEngine usa como gatilho do modal de trade-off da tarefa (tradeoffScenes.ts)
  return { step: true, color: STEP_COLORS[step.zone], title: `STEP ${index + 1}/${total}: ${step.label}`, lines: step.lines, stepId: step.id };
}
