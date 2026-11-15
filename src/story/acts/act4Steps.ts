import { SAMPLE_SITE_CONFIG, SCIENCE_CONFIG } from '../../config/constants.ts';
import { SAMPLE_TYPES } from '../../data/sampleTypes.ts';
import type { StoryStep, StorySnapshot } from './actTypes.ts';

// Passos guiados do ato 4 (issue #410): traje, 3 amostras de cada tipo, analise e envio.
// Spec: docs/superpowers/specs/2026-11-15-act4-story-design.md. Formato em actTypes.ts.
//
// Campos do retrato que estes passos leem (quem preenche e o Act4Controller.fillSnapshot):
//   sampleFieldsDone  tipos de amostra com o campo inteiro coletado (0 a 5)
//   samplesAnalyzed   amostras do mapa ja analisadas no monitor de ciencia (0 a 15)
//   samplesInBag      amostras do mapa na mochila, esperando a analise
// Tudo aqui e regra de jogo: quantas amostras, onde ficam e quantos pontos valem.

export const ACT4_STEP_IDS = {
  suit: 'suit-for-samples',
  collect: 'collect-samples',
  analyze: 'analyze-samples',
  send: 'send-science',
} as const;

// Lugar da seta do passo de coleta: o campo mais perto que ainda tem pedrinha (Act4Controller.waypoint)
export const SAMPLE_FIELD_PLACE = 'sample-field';

export const SAMPLE_FIELDS = SAMPLE_TYPES.length; // um campo por tipo
export const SAMPLES_TOTAL = SAMPLE_FIELDS * SAMPLE_SITE_CONFIG.PER_TYPE;

const count = (s: StorySnapshot, key: string): number => s[key] ?? 0;

export const ACT4_STEPS: StoryStep[] = [
  {
    // Outro id: o passo `suit-up` do ato 1 ja existe (tutorialSteps.ts). A animacao de primeira
    // vez do traje nao repete: ela so toca uma vez por partida (firstTimeMoments.ts).
    id: ACT4_STEP_IDS.suit,
    act: 4,
    zone: 'suit',
    icon: 'door',
    label: 'SUIT UP AGAIN',
    hint: 'Suitport, next to the airlock: press F',
    place: 'suitport',
    objective: 'Put on your EVA suit to collect samples outside',
    lines: [
      { icon: 'rock', text: 'Time for science outside the base' },
      { icon: 'door', text: 'Go to the SUITPORT: press F' },
      { icon: 'air', text: 'Suit air runs out: plan your trip' },
    ],
    done: (s) => Boolean(s.suitEquipped),
    example: { suitEquipped: true },
  },
  {
    id: ACT4_STEP_IDS.collect,
    act: 4,
    zone: 'science',
    icon: 'rock',
    label: 'COLLECT THE SAMPLES',
    hint: 'Follow the arrow. Press F on each glowing rock',
    place: SAMPLE_FIELD_PLACE,
    objective: `Collect ${SAMPLE_SITE_CONFIG.PER_TYPE} samples of each of the ${SAMPLE_FIELDS} kinds outside`,
    lines: [
      { icon: 'rock', text: `${SAMPLE_FIELDS} fields outside, ${SAMPLE_SITE_CONFIG.PER_TYPE} glowing rocks in each` },
      { icon: 'check', text: 'Follow the arrow: press F on rocks' },
      { icon: 'air', text: 'Low on air? Go back, then return' },
    ],
    done: (s) => count(s, 'sampleFieldsDone') >= SAMPLE_FIELDS,
    example: { sampleFieldsDone: SAMPLE_FIELDS },
  },
  {
    id: ACT4_STEP_IDS.analyze,
    act: 4,
    zone: 'science',
    icon: 'scope',
    label: 'ANALYZE THE SAMPLES',
    hint: 'Science terminal: press F, then ANALYZE',
    place: 'science',
    objective: `Analyze your ${SAMPLES_TOTAL} samples at the science & radio terminal`,
    lines: [
      { icon: 'scope', text: 'Go to the SCIENCE terminal: press F' },
      { icon: 'check', text: 'Press ANALYZE once for each sample' },
      { icon: 'bolt', text: `Each sample uses ${SCIENCE_CONFIG.ANALYZE_POWER_COST}% of the battery` },
    ],
    needs: [{ resource: 'power', amount: SCIENCE_CONFIG.ANALYZE_POWER_COST }],
    // Todas analisadas. Se uma amostra se perdeu no caminho, o passo fecha quando a mochila
    // esvazia: a crianca nunca fica presa aqui.
    done: (s) => count(s, 'samplesAnalyzed') >= SAMPLES_TOTAL
      || (count(s, 'samplesAnalyzed') > 0 && count(s, 'sampleFieldsDone') >= SAMPLE_FIELDS && count(s, 'samplesInBag') === 0),
    example: { samplesAnalyzed: SAMPLES_TOTAL, samplesInBag: 0 },
  },
  {
    id: ACT4_STEP_IDS.send,
    act: 4,
    zone: 'radio',
    icon: 'radio',
    label: 'SEND TO EARTH',
    hint: 'Science terminal: press F, then SEND',
    place: 'science',
    objective: `Send ${SCIENCE_CONFIG.POINTS_TO_LAUNCH} science points and the 3 clues to Earth`,
    lines: [
      { icon: 'radio', text: `Earth needs ${SCIENCE_CONFIG.POINTS_TO_LAUNCH} points and 3 clues` },
      { icon: 'clock', text: `One orbiter pass carries only ${SCIENCE_CONFIG.MAX_ITEMS_PER_UPLOAD} items` },
      { icon: 'bolt', text: 'Every upload uses battery' },
    ],
    // O envio mais barato: ligar o radio e mandar 1 item
    needs: [{ resource: 'power', amount: SCIENCE_CONFIG.UPLOAD_BASE_COST + SCIENCE_CONFIG.UPLOAD_COST_PER_ITEM }],
    // A meta de pontos e as 3 pistas chegaram a Terra (MissionSystem.dataSent)
    done: (s) => Boolean(s.dataSent),
    example: { dataSent: true },
  },
];
