// @ts-nocheck
// Estufa didatica (issue #89): os 3 cuidados que a crianca equilibra para as plantas crescerem e
// os cards "Ciencia espacial na Terra" que aparecem depois de cada colheita. Logica pura.
//
// Base: pacote educacional da CSA "Food production on the Moon and in remote areas" (agricultura
// em ambiente controlado: luz, agua reciclada e um lugar fechado e limpo).

export const CSA_FOOD_URL = 'https://www.asc-csa.gc.ca/eng/youth-educators/toolkits/food-production/';

// `state`: { lightsOn, powered, cold, waterL, thirsty, recovery, contaminated }
//   powered      a luz de cultivo recebeu energia neste quadro (ExpeditionState.greenhousePowered)
//   recovery     fracao da agua que o reciclador devolve (UtilityModule.waterRecovery)
// Devolve [{ id, label, ok, detail }] na ordem LIGHT, WATER, DUST.
export function growthChecks(state) {
  const light = state.lightsOn && state.powered && !state.cold;
  const lightDetail = !state.lightsOn ? 'Lights OFF in the power room'
    : state.cold ? 'Too cold: turn the heater on'
      : !state.powered ? 'No power for the LEDs'
        : 'Red and blue LEDs on';
  const water = state.waterL >= 1 && !state.thirsty;
  const recycled = Math.round((state.recovery ?? 0) * 100);
  const waterDetail = water ? `Tank ${Math.floor(state.waterL)} L, ${recycled}% recycled` : 'Tank empty: bring ice';
  const clean = !state.contaminated;
  return [
    { id: 'light', label: 'LED LIGHT', ok: light, detail: lightDetail },
    { id: 'water', label: 'RECYCLED WATER', ok: water, detail: waterDetail },
    { id: 'dust', label: 'NO DUST', ok: clean, detail: clean ? 'Airlock kept the dust out' : 'Dust inside: clean the habitat' },
  ];
}

// As plantas so crescem com os 3 cuidados em dia
export function plantsStalled(state) {
  return growthChecks(state).some((check) => !check.ok);
}

// Cards "Marte <-> Terra": a mesma tecnologia da estufa ajudando pessoas na Terra. Um por
// colheita, em rodizio. Frases curtas para 7 a 12 anos, sem numeros inventados.
export const EARTH_CARDS = [
  {
    title: 'SPACE SCIENCE ON EARTH',
    lines: [
      { icon: 'drop', text: 'Our greenhouse reuses its water' },
      { icon: 'home', text: 'Earth: closed greenhouses grow food in the Canadian Arctic' },
    ],
    source: 'CSA: Food production on the Moon and in remote areas',
  },
  {
    title: 'SPACE SCIENCE ON EARTH',
    lines: [
      { icon: 'plant', text: 'Mars soil has perchlorate salts' },
      { icon: 'drop', text: 'So we grow plants in water, not soil' },
      { icon: 'home', text: 'Earth: city vertical farms do the same' },
    ],
    source: 'Perchlorate found in Mars soil by NASA Phoenix (2008). CSA: Food production toolkit',
  },
  {
    title: 'SPACE SCIENCE ON EARTH',
    lines: [
      { icon: 'heart', text: 'Fresh food keeps the crew healthy and happy' },
      { icon: 'plant', text: 'Astronauts ate space lettuce in 2015' },
    ],
    source: 'NASA Veggie on the Space Station. Plant studies: NASA OSDR',
  },
  {
    title: 'SPACE SCIENCE ON EARTH',
    lines: [
      { icon: 'sun', text: 'Red and blue LEDs feed the plants' },
      { icon: 'bolt', text: 'Earth: indoor farms use LEDs to save power' },
    ],
    source: 'NASA Veggie uses red and blue LED light. CSA: Food production toolkit',
  },
];

export function earthCard(harvestNumber) {
  const index = ((harvestNumber - 1) % EARTH_CARDS.length + EARTH_CARDS.length) % EARTH_CARDS.length;
  return EARTH_CARDS[index];
}
