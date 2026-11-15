import { CROP_CONFIG, RADIATION_CONFIG, STATION_CONFIG, UTILITY_CONFIG } from '../../config/constants.ts';
import { PLANT_NEEDS } from '../tutorialDetours.ts';
import type { StorySnapshot, StoryStep } from './actTypes.ts';

// Passos guiados do ato 3 (issue #409): abrigo na tempestade solar, planta, racao e academia.
// Spec: docs/superpowers/specs/2026-11-15-act3-story-design.md. Formato em actTypes.ts.
//
// A tempestade solar do ato e a do tutorial (uma CME real do DONKI): o Act3Controller a marca
// quando o primeiro passo comeca. Os passos do passeio completo que ensinam as mesmas salas
// (`plant`, `cert-greenhouse`, `cert-gym`, `cert-shelter`, em tutorialSteps.ts) continuam la:
// os ids daqui sao outros.
//
// Campos do retrato que so este ato le (Act3Controller.fillSnapshot):
//   scriptedStormOver  a tempestade do tutorial ja passou (ou nunca vem: dados sem CME para Marte)
//   plantInBag         a crianca tem uma planta colhida na mochila
//   rationsMade        racoes que o cozinheiro fez com planta entregue pela crianca

const count = (s: StorySnapshot, key: string): number => s[key] ?? 0;
const more = (key: string) => (s: StorySnapshot, b: StorySnapshot): boolean => count(s, key) > count(b, key);
const oneMore = (key: string) => (s: StorySnapshot): StorySnapshot => ({ [key]: count(s, key) + 1 });

export const ACT3_FIRST_STEP_ID = 'shelter-wall';

export const ACT3_STEPS: StoryStep[] = [
  {
    id: ACT3_FIRST_STEP_ID,
    act: 3,
    zone: 'shelter',
    certificate: 'cert-shelter',
    icon: 'shield',
    label: 'FILL THE WATER WALL',
    hint: 'Storm shelter: press F, then FILL WALL',
    place: 'shelter',
    objective: 'A solar storm is coming: fill the storm shelter water wall',
    lines: [
      { icon: 'storm', text: 'A solar storm is coming to Mars' },
      { icon: 'shield', text: 'STORM SHELTER: press F, choose FILL WALL' },
      { icon: 'drop', text: 'Wall water is water you cannot drink' },
    ],
    needs: [{ resource: 'water', amount: RADIATION_CONFIG.SHELTER_FILL_MIN_L }],
    // Parede que ja estava cheia tambem vale: nao ha mais agua para por nela
    done: (s, b) => count(s, 'shelterWaterL') > count(b, 'shelterWaterL') + 1e-6
      || count(s, 'shelterWaterL') >= RADIATION_CONFIG.SHELTER_WALL_MAX_L - 1e-6,
    example: (s) => ({ shelterWaterL: count(s, 'shelterWaterL') + RADIATION_CONFIG.SHELTER_FILL_STEP_L }),
  },
  {
    id: 'hide-shelter',
    act: 3,
    zone: 'shelter',
    icon: 'radiation',
    label: 'HIDE IN THE SHELTER',
    hint: 'Stay in the storm shelter until the storm ends',
    place: 'shelter',
    objective: 'Stay in the storm shelter until the solar storm ends',
    lines: [
      { icon: 'shield', text: 'Go inside the STORM SHELTER and wait' },
      { icon: 'drop', text: 'Water in the wall blocks radiation' },
      { icon: 'bolt', text: 'The shield works too, but eats battery' },
    ],
    // Termina quando a tempestade passa, onde quer que a crianca esteja (abrigo ou blindagem):
    // o ato nao pode travar
    done: (s) => Boolean(s.scriptedStormOver),
    example: { scriptedStormOver: true },
  },
  {
    id: 'plant-seed',
    act: 3,
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
    needs: [...PLANT_NEEDS],
    done: more('plantCount'),
    example: oneMore('plantCount'),
  },
  {
    id: 'harvest-plant',
    act: 3,
    zone: 'greenhouse',
    certificate: 'cert-greenhouse',
    icon: 'plant',
    label: 'HARVEST 1 PLANT',
    hint: 'Food monitor: press HARVEST, then pick up the plant',
    place: 'greenhouse',
    objective: 'Harvest 1 plant at the food monitor and pick it up',
    lines: [
      { icon: 'clock', text: `Wait: lettuce is ready in ${CROP_CONFIG.lettuce.seconds} seconds` },
      { icon: 'plant', text: 'Press HARVEST at the FOOD MONITOR' },
      { icon: 'check', text: 'Walk over your plant to pick it up' },
    ],
    // A planta ja plantada so cresce com agua no tanque e luz na estufa
    needs: [...PLANT_NEEDS],
    // O passo seguinte precisa da planta na mochila: colher sem recolher nao conta
    done: (s) => Boolean(s.plantInBag),
    example: { plantInBag: true },
  },
  {
    id: 'make-ration',
    act: 3,
    zone: 'kitchen',
    icon: 'food',
    label: 'MAKE A RATION',
    hint: 'Kitchen: press F on the cook with your plant',
    place: 'kitchen',
    objective: 'Give your plant to the cook in the kitchen and get a ration',
    lines: [
      { icon: 'food', text: 'Take your plant to the KITCHEN cook' },
      { icon: 'check', text: 'Press F: the cook makes 1 ration' },
      { icon: 'bolt', text: `It uses battery and takes ${UTILITY_CONFIG.RATION_PREP_SECONDS} seconds` },
    ],
    needs: [{ resource: 'power', amount: UTILITY_CONFIG.RATION_PREP_POWER }],
    done: more('rationsMade'),
    example: oneMore('rationsMade'),
  },
  {
    id: 'gym-workout',
    act: 3,
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
    needs: [{ resource: 'power', amount: STATION_CONFIG.EXERCISE_COST }],
    done: more('workoutCount'),
    example: oneMore('workoutCount'),
  },
];
