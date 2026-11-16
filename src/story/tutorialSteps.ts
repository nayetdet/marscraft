// @ts-nocheck
import { SIGNS, ZONE_COLORS } from '../base/basePosters.ts';
import { speakerForZone } from './radioSpeakers.ts';
import { RADIATION_CONFIG, ROVER_CONFIG, STATION_CONFIG, STORY_CONFIG, UTILITY_CONFIG, WATER_SYSTEM_CONFIG } from '../config/constants.ts';
import { PLANT_NEEDS, detourById } from './tutorialDetours.ts';
import { GYM_NEEDS } from './acts/act3Gym.ts';
import { ACT2_STEPS } from './acts/act2Steps.ts';
import { ACT3_STEPS } from './acts/act3Steps.ts';
import { ACT4_STEPS } from './acts/act4Steps.ts';

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
//   core      true = faz parte do tutorial padrao (CORE_STEPS); os outros so no passeio completo
//   certificate  id do selo que o passo entrega (CERTIFICATES em storyChapters.ts)
//   needs     o que a base precisa ter para o passo funcionar: [{ resource, amount }], com as
//             quantidades das constantes do jogo. Enquanto faltar, o StoryDirector mostra o
//             desvio daquele recurso (src/story/tutorialDetours.ts, issue #237) e depois volta
//
// As tarefas de comer, beber e lavar contam a tentativa (apertar o botao certo), nao o resultado:
// quem ja esta sem fome ou sem sede nao fica preso no passo.

// Cor de cada secao, a mesma das placas das salas (ZONE_COLORS e SIGNS em basePosters.ts):
// a crianca liga o passo ao lugar pela cor (planta = verde, academia = ciano, abrigo = rosa).
// O que nao tem sala na base ganha uma cor propria.
export const STEP_COLORS = {
  airlock: SIGNS.airlock.color,
  water: '#38bdf8', // azul da agua
  kitchen: '#a3e635', // verde-limao: perto do verde da placa da cozinha, sem repetir a estufa
  radio: ZONE_COLORS.quarters,
  power: SIGNS.powerRoom.color,
  greenhouse: ZONE_COLORS.greenhouse,
  gym: ZONE_COLORS.gym,
  shelter: ZONE_COLORS.shelter,
  rover: '#fb923c', // laranja do rover
  suit: '#f1c453', // amarelo do traje (a mesma cor da animacao de primeira vez)
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
    icon: 'door',
    label: 'ENTER THE BASE',
    hint: 'Follow the arrow. Press F on the door',
    place: 'airlock',
    objective: 'Go inside the base through the airlock',
    lines: [
      { icon: 'rocket', text: 'Mission: find 3 clues, then fly home' },
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
    needs: [{ resource: 'water', amount: WATER_SYSTEM_CONFIG.DRINK_AMOUNT_FROM_DISPENSER }],
    done: more('drinkCount'),
  },
  {
    id: 'eat',
    zone: 'kitchen',
    icon: 'food',
    label: 'EAT A MEAL',
    // A cozinha nao tem mais painel (ato 3, #409): o cozinheiro entrega a racao com [F] e a
    // crianca come pela hotbar. Pegar a racao ja conta (quem esta sem fome nao fica preso).
    hint: 'Kitchen: press F on the cook, then eat the ration',
    place: 'kitchen',
    objective: 'Get a ration from the cook in the kitchen and eat it',
    lines: [
      { icon: 'food', text: 'KITCHEN: press F on the cook' },
      { icon: 'check', text: 'Pick the ration, then right-click to eat' },
      { icon: 'heart', text: 'The pantry feeds the whole crew' },
    ],
    needs: [{ resource: 'food', amount: STORY_CONFIG.TUTORIAL_RATIONS_NEEDED }],
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
      { icon: 'rocket', text: 'Mission: find 3 clues, then fly home' },
      { icon: 'radio', text: 'RADIO terminal: press F, then CALL EARTH' },
      { icon: 'bolt', text: 'Each call uses battery' },
    ],
    needs: [{ resource: 'power', amount: STATION_CONFIG.COMMS_COST }],
    done: more('earthCalls'),
    example: { earthCalls: 1 },
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
      { icon: 'radiation', text: 'The REACTOR gives power day and night' },
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
    needs: PLANT_NEEDS,
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
      { icon: 'clock', text: 'Wait: lettuce is ready in 5 seconds' },
      { icon: 'plant', text: 'Press HARVEST at the food monitor' },
    ],
    // A planta ja plantada so cresce com agua no tanque e luz na estufa
    needs: PLANT_NEEDS,
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
    // Bateria da base, e comida e agua da crianca (issue #421): se faltar, o desvio manda buscar
    needs: [...GYM_NEEDS],
    done: more('workoutCount'),
  },
  {
    id: 'cert-shelter',
    zone: 'shelter',
    certificate: 'cert-shelter',
    icon: 'shield',
    label: 'FILL THE WATER WALL',
    hint: 'Enter the storm shelter, then fill the wall',
    place: 'shelter',
    objective: 'Fill the storm shelter water wall',
    lines: [
      { icon: 'shield', text: 'Enter the STORM SHELTER' },
      { icon: 'check', text: 'Choose FILL WALL' },
      { icon: 'drop', text: 'Wall water is water you cannot drink' },
    ],
    needs: [{ resource: 'water', amount: RADIATION_CONFIG.SHELTER_FILL_MIN_L }],
    done: (s, b) => count(s, 'shelterWaterL') > count(b, 'shelterWaterL') + 1e-6,
  },
  {
    id: 'rover-drive',
    zone: 'rover',
    core: true,
    icon: 'home',
    label: 'DRIVE THE ROVER',
    hint: 'Rover console: press F',
    place: 'console',
    objective: 'Start the rover at the rover console',
    lines: [
      { icon: 'drop', text: 'The base water is running low' },
      { icon: 'home', text: 'Go to the ROVER CONSOLE: press F' },
      { icon: 'air', text: 'The rover works outside, you stay safe' },
    ],
    done: more('roverDrives'),
    example: { roverDrives: 1 },
  },
  {
    id: 'rover-ice',
    zone: 'rover',
    core: true,
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
    // O rover so perfura com a bateria acima do nivel baixo
    needs: [{ resource: 'roverPower', amount: ROVER_CONFIG.LOW_BATTERY }],
    done: more('roverIceKg'),
    example: (s) => ({ roverIceKg: count(s, 'roverIceKg') + 100 }),
  },
  // Ato 1 (#407): o meteoro cai quando o rover descarrega o gelo (GameEngine, evento step-done
  // de 'rover-ice'). Para buscar o gelo novo a pe, a crianca veste o traje pela primeira vez.
  {
    id: 'suit-up',
    zone: 'suit',
    core: true,
    icon: 'door',
    label: 'PUT ON YOUR SUIT',
    hint: 'Suitport, next to the airlock: press F',
    place: 'suitport',
    objective: 'Put on your EVA suit at the Suitport',
    lines: [
      { icon: 'ice', text: 'A meteor left fresh ice outside' },
      { icon: 'door', text: 'Go to the SUITPORT: press F' },
      { icon: 'air', text: 'No suit, no going outside' },
    ],
    done: (s) => Boolean(s.suitEquipped),
    example: { suitEquipped: true },
  },
  {
    id: 'collect-ice',
    zone: 'ice',
    core: true,
    icon: 'ice',
    label: 'GET METEOR ICE',
    hint: 'Go outside to the new crater. Hold click on ice',
    // Cratera do meteoro; sem ela (partida recarregada, meteoro sem chao livre) vale a cratera de gelo
    place: 'meteor',
    objective: 'Get 1 block of ice from the meteor crater',
    lines: [
      { icon: 'door', text: 'Go outside through the AIRLOCK' },
      { icon: 'ice', text: 'At the METEOR CRATER: hold click on ice' },
      { icon: 'air', text: 'Outside uses your suit air' },
    ],
    // So vale gelo novo, pego depois do pedido. Gelo gasto baixa a base de comparacao.
    done: (s, b) => {
      if (count(s, 'iceCount') < count(b, 'iceCount')) b.iceCount = count(s, 'iceCount');
      return count(s, 'iceCount') > count(b, 'iceCount');
    },
    example: (s) => ({ iceCount: count(s, 'iceCount') + 1 }),
  },
  {
    id: 'load-rocket',
    zone: 'rocket',
    core: true,
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
    // Tambem acaba se o primeiro gelo foi para o tanque da base (card de escolha, issue #413):
    // a corrida final cobra o bloco que ficou faltando no foguete
    done: (s, b) => count(s, 'iceNeeded') < count(b, 'iceNeeded') || Boolean(s.firstIceToTank),
    example: (s) => ({ iceCount: 0, iceNeeded: count(s, 'iceNeeded') - 1 }),
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

// Tutorial padrao do jogo, o ato 1 da historia (#407): avisar a Terra, mandar o rover buscar gelo
// (a agua esta acabando), vestir o traje, pegar o gelo do meteoro e carregar o foguete.
// Os outros passos sao o passeio completo pela base
// (`training: true` no StoryDirector).
export const ACT1_STEPS = TUTORIAL_STEPS.filter((step) => step.core);

// Passos guiados da partida: o ato 1 e, em seguida, os atos 2, 3 e 4 (src/story/acts/). Quando
// a lista acaba, o StoryDirector abre a corrida final (ato 5). `example` em cada passo e a
// mudanca no retrato que o conclui (testes: src/story/storyTestKit.ts).
export const CORE_STEPS = [...ACT1_STEPS, ...ACT2_STEPS, ...ACT3_STEPS, ...ACT4_STEPS];

// Numero do passo dentro do ato dele: { act, now, total }. Os passos sem `act` (o ato 1 e o
// passeio completo) contam juntos.
export function stepNumber(steps, index) {
  const act = steps[index]?.act ?? 1;
  const sameAct = steps.filter((step) => (step.act ?? 1) === act);
  return { act, now: sameAct.indexOf(steps[index]) + 1, total: sameAct.length };
}

// Tarefa de um objetivo do tutorial: o passo ou, durante um desvio (issue #237), a tarefa de
// buscar o recurso que falta. Os dois tem label, hint, place, icon e zone.
export function tutorialStepById(id) {
  return TUTORIAL_STEPS.find((step) => step.id === id) ?? CORE_STEPS.find((step) => step.id === id) ?? detourById(id);
}

// Balao do passo: titulo com o numero ("STEP 2/5: CALL EARTH") e as frases do passo.
// `step: true` avisa o StoryHud que este balao troca o do passo anterior, sem fila.
// `act`: do ato 2 em diante o titulo diz o ato ("ACT 2 - STEP 1/6: CLEAN THE PANELS")
export function stepCard(step, index, total, act = 1) {
  // `stepId`: o GameEngine usa como gatilho do modal de trade-off da tarefa (tradeoffScenes.ts)
  return { step: true, color: STEP_COLORS[step.zone], title: `${act > 1 ? `ACT ${act} - ` : ''}STEP ${index + 1}/${total}: ${step.label}`, lines: step.lines, stepId: step.id, speaker: speakerForZone(step.zone) };
}

// Balao do desvio (issue #237): troca o balao do passo enquanto a crianca busca o que falta.
// Sem `stepId`: o desvio nao abre o modal de trade-off do passo.
export function detourCard(detour) {
  return { step: true, color: STEP_COLORS[detour.zone], title: `FIRST: ${detour.label}`, lines: detour.lines };
}
