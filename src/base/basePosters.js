// Textos dos posteres e das placas da base. Dados puros (sem Three.js nem DOM).
// Todo numero daqui esta em docs/data/numeros-reais.md com a fonte ao lado.
// Linguagem para 7 a 12 anos: frases curtas, termo tecnico sempre explicado.

export const ZONE_COLORS = {
  command: '#38bdf8',
  lifeSupport: '#facc15',
  quarters: '#a78bfa',
  greenhouse: '#4ade80',
  medical: '#f87171',
  gym: '#22d3ee',
  airlock: '#fb923c',
  shelter: '#f472b6',
};

export const SIGNS = {
  command: { code: 'CMD-1', name: 'COMMAND', color: ZONE_COLORS.command },
  lifeSupport: { code: 'LSS-1', name: 'LIFE SUPPORT', color: ZONE_COLORS.lifeSupport },
  quarters: { code: 'DRM-1', name: 'CREW QUARTERS', color: ZONE_COLORS.quarters },
  common: { code: 'HAB-1', name: 'COMMON AREA', color: ZONE_COLORS.quarters },
  greenhouse: { code: 'GRN-1', name: 'GREENHOUSE', color: ZONE_COLORS.greenhouse },
  medical: { code: 'MED-1', name: 'MEDICAL BAY', color: ZONE_COLORS.medical },
  gym: { code: 'GYM-1', name: 'GYM', color: ZONE_COLORS.gym },
  mainHab: { code: 'HAB-1', name: 'MAIN HAB', color: ZONE_COLORS.quarters },
  airlock: { code: 'AL-1', name: 'AIRLOCK', color: ZONE_COLORS.airlock },
  shelter: { code: 'SHL-1', name: 'STORM SHELTER', color: ZONE_COLORS.shelter },
};

// `donkiDate` = data de coleta do JSON embutido do DONKI, ja em DD/MM/AAAA
export function buildPosters(donkiDate) {
  return {
    air: {
      title: 'HOW WE MAKE AIR',
      color: ZONE_COLORS.lifeSupport,
      lines: [
        'Mars air is mostly CO2. You cannot breathe it.',
        'A machine pulls CO2 apart and keeps the oxygen (O2).',
        'That machine eats battery power. No power, no fresh air!',
      ],
      fact: 'MOXIE, a test machine on the Perseverance rover, made 122 g of oxygen on Mars. One astronaut needs 840 g every day.',
      source: 'NASA MOXIE (2023) / NASA BVAD',
    },
    delay: {
      title: 'TALKING TO EARTH',
      color: ZONE_COLORS.command,
      lines: [
        'Radio messages travel at the speed of light.',
        'Mars is so far away that they still take a long time.',
        'Mission Control cannot help you right away. You decide!',
      ],
      fact: 'A message from Mars takes 3 to 22 minutes to reach Earth. It depends on where the two planets are.',
      source: 'Distance / speed of light',
    },
    storm: {
      title: 'SOLAR STORMS',
      color: ZONE_COLORS.shelter,
      lines: [
        'The Sun sometimes throws out a giant cloud of particles.',
        'Scientists call it a CME (coronal mass ejection).',
        'When it hits Mars, radiation can be hundreds of times higher.',
      ],
      fact: `Every storm in this game is a real CME that NASA saw, faster than 500 km/s. Real data from ${donkiDate}.`,
      source: 'NASA DONKI space weather database',
    },
    mars: {
      title: 'MARS vs EARTH',
      color: ZONE_COLORS.quarters,
      lines: [
        'Gravity: 38% of Earth. You jump higher!',
        'One day (a "sol"): 24 h 39 min.',
        'Sunlight: 43% of Earth. Solar panels make less power.',
        'Air pressure: 0.7% of Earth. Always wear a suit outside.',
      ],
      fact: 'The InSight lander measured about -62 C on an average Mars day. One night dropped to -97.7 C.',
      source: 'NASA Mars Fact Sheet / InSight',
    },
    shelter: {
      title: 'WHY THIS SPOT IS SAFE',
      color: ZONE_COLORS.shelter,
      lines: [
        'Radiation is tiny, very fast particles from the Sun and space.',
        'Thick stuff stops them: water and Mars dirt (regolith).',
        'This shelter has walls you can fill with water.',
        'Fill the wall, then stand here in a storm.',
      ],
      fact: 'Dose is counted in mSv. NASA lets an astronaut collect 600 mSv in a whole career.',
      source: 'NASA-STD-3001 (2022)',
    },
    plants: {
      title: 'PLANTS ARE CREW TOO',
      color: ZONE_COLORS.greenhouse,
      lines: [
        'Plants take in the CO2 we breathe out and give back oxygen.',
        'They also give us fresh food.',
        'No soil here: the roots drink water with plant food in it.',
        'They need light, water and power to grow.',
      ],
      fact: 'The base recycler gets back 98% of used water, like the one on the Space Station. Plants and crew share it.',
      source: 'NASA, ISS water recovery (2023)',
    },
    exercise: {
      title: 'WHY WE EXERCISE',
      color: ZONE_COLORS.gym,
      lines: [
        'Mars gravity is only 38% of Earth. Your body works less.',
        'Bones and muscles get weak when they are not used.',
        'Weak astronauts work slower. Train to stay strong!',
      ],
      fact: 'In space, bones lose about 1% of their density every month without exercise. Station crews train about 2 hours a day.',
      source: 'NASA, bone and muscle loss (2023)',
    },
    sleep: {
      title: 'MARS TIME',
      color: ZONE_COLORS.quarters,
      lines: [
        'A day on Mars is called a sol.',
        'A sol is a little longer than a day on Earth.',
        'So your bedtime slides a bit later every day!',
        'Good sleep keeps a crew sharp. Tired people make mistakes.',
      ],
      fact: 'One sol lasts 24 hours and 39 minutes. That is 39 minutes more than an Earth day.',
      source: 'NASA Mars Fact Sheet',
    },
    eva: {
      title: 'GOING OUTSIDE',
      color: ZONE_COLORS.airlock,
      lines: [
        '1. Suit oxygen full?',
        '2. Base battery charged?',
        '3. Storm warning? Stay in!',
        '4. Back inside: clean the dust off.',
      ],
      fact: 'Air outside has 0.7% of Earth pressure. Never open your helmet!',
      source: 'NASA InSight weather',
    },
  };
}
