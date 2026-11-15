// @ts-nocheck
import { RADIATION_CONFIG } from '../config/constants.ts';
import { BASE_DOSE_MSV_PER_HOUR } from './radiation.ts';

// Boletim do cadete (issue #90): 4 notas (S, A, B, C) calculadas com o que o jogador fez na
// partida, mais uma frase de perfil. Logica pura: o ReportCard (src/ui) so desenha.
//
// stats = {
//   hoursPlayed, sols, deaths,
//   stormHours, protectedStormHours, totalDoseMsv,   // MissionSystem
//   boneDensity, muscleStrength, workoutCount,       // StationSystem (academia)
//   harvestCount, cropVariety,                       // StationSystem (estufa)
//   iceDelivered, standbyHours,                      // MissionSystem (fabrica e bateria)
// }

const clamp01 = (v) => Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0));

export const GRADE_STEPS = [
  [0.9, 'S'],
  [0.75, 'A'],
  [0.5, 'B'],
];

export function gradeFor(score) {
  for (const [min, grade] of GRADE_STEPS) if (score >= min) return grade;
  return 'C';
}

// Metas de "nota cheia" (regras do jogo, nao medidas): uma colheita por campo da redoma, as 3
// culturas, um treino por sol e o tanque do foguete cheio (10 blocos de gelo)
const FULL_HARVESTS = 4;
const CROP_TYPES = 3;
const FULL_ICE = 10;
// Horas de bateria vazia que zeram a parte de energia da nota de engenharia
const STANDBY_ZERO_HOURS = 6;
// Cada vez que o cadete morre a nota de saude cai isto
const DEATH_PENALTY = 0.25;

export const REPORT_CATEGORIES = [
  {
    id: 'radiation',
    name: 'RADIATION SAFETY',
    data: 'NASA RadLab + DONKI',
    icon: 'radiation',
    profile: 'Radiation Safety Officer',
    strength: 'kept everyone safe from solar storms',
    tip: 'fill the shelter water wall and hide there when a storm comes',
    score(s) {
      // Com tempestade: parte do tempo dela em que a dose ficou abaixo do dano. Sem tempestade:
      // quanto da dose normal de Marte a base evitou (dentro dela a dose cai para 25 %).
      if (s.stormHours > 0.05) return clamp01(s.protectedStormHours / s.stormHours);
      const outdoorDose = BASE_DOSE_MSV_PER_HOUR * Math.max(0.01, s.hoursPlayed);
      return clamp01(1 - (s.totalDoseMsv / outdoorDose - RADIATION_CONFIG.HABITAT_FACTOR));
    },
    detail: (s) => `${s.totalDoseMsv.toFixed(2)} mSv total dose`,
  },
  {
    id: 'health',
    name: 'HEALTH IN 0.38g',
    data: 'NASA OSDR',
    icon: 'heart',
    profile: 'Flight Surgeon',
    strength: 'kept your bones and muscles strong',
    tip: 'train in the gym every sol so low gravity does not weaken your bones',
    score(s) {
      const body = ((s.boneDensity ?? 0) + (s.muscleStrength ?? 0)) / 200;
      const training = Math.min(1, (s.workoutCount ?? 0) / Math.max(1, s.sols));
      return clamp01(0.7 * body + 0.3 * training - DEATH_PENALTY * (s.deaths ?? 0));
    },
    detail: (s) => `Bones ${Math.round(s.boneDensity)}%, ${s.workoutCount} workouts`,
  },
  {
    id: 'farming',
    name: 'SPACE FARMING',
    data: 'CSA food production',
    icon: 'plant',
    profile: 'Space Farmer',
    strength: 'grew lots of fresh food',
    tip: 'plant and harvest more crops in the greenhouse',
    score(s) {
      return clamp01(0.6 * Math.min(1, s.harvestCount / FULL_HARVESTS) + 0.4 * Math.min(1, s.cropVariety / CROP_TYPES));
    },
    detail: (s) => `${s.harvestCount} harvests, ${s.cropVariety} of ${CROP_TYPES} crops`,
  },
  {
    id: 'engineering',
    name: 'MISSION ENGINEERING',
    data: 'ISRU: fuel from Mars ice',
    icon: 'bolt',
    profile: 'Life Support Engineer',
    strength: 'kept the power and the rocket fuel going',
    tip: 'charge the battery before night so the base never goes on standby',
    score(s) {
      const fuel = Math.min(1, s.iceDelivered / FULL_ICE);
      const power = 1 - Math.min(1, s.standbyHours / STANDBY_ZERO_HOURS);
      return clamp01(0.5 * fuel + 0.5 * power);
    },
    detail: (s) => `${s.iceDelivered} ice to fuel, ${s.standbyHours.toFixed(1)} h on standby`,
  },
];

export function missionReport(stats) {
  const categories = REPORT_CATEGORIES.map((category) => {
    const score = category.score(stats);
    return {
      id: category.id,
      name: category.name,
      data: category.data,
      icon: category.icon,
      score,
      grade: gradeFor(score),
      detail: category.detail(stats),
    };
  });

  // Melhor e pior categoria (empate: a primeira da lista)
  let best = 0;
  let worst = 0;
  categories.forEach((c, i) => {
    if (c.score > categories[best].score) best = i;
    if (c.score < categories[worst].score) worst = i;
  });
  const top = REPORT_CATEGORIES[best];
  const low = REPORT_CATEGORIES[worst];
  const allGood = categories[worst].score >= GRADE_STEPS[1][0];
  const profile = allGood
    ? { title: 'Mission Commander', text: 'You did great at everything. Earth is proud of you!' }
    : { title: top.profile, text: `You ${top.strength}, but next time ${low.tip}!` };

  return { categories, profile };
}
