// @ts-nocheck
// Estufa didatica (issue #89): os 3 cuidados que a crianca equilibra para as plantas crescerem e
// os fatos "Ciencia espacial na Terra", recompensa de descoberta na estufa (issue #216). Logica pura.
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

// Fatos "Marte <-> Terra": a mesma tecnologia da estufa ajudando pessoas na Terra. Frases curtas
// para 7 a 12 anos, sem numeros inventados. Cada fato e a recompensa de uma descoberta do jogador
// (issue #216): `crop` e a planta cuja PRIMEIRA colheita revela o fato; o fato sem `crop` sai na
// colheita seguinte a ter colhido os 3 tipos.
export const EARTH_FACT_TITLE = 'SPACE SCIENCE ON EARTH';
export const EARTH_CARDS = [
  {
    id: 'lettuce',
    crop: 'lettuce',
    reason: 'First lettuce harvest!',
    lines: ['Fresh food keeps the crew healthy and happy', 'Astronauts ate space lettuce in 2015'],
    source: 'NASA Veggie on the Space Station. Plant studies: NASA OSDR',
  },
  {
    id: 'potato',
    crop: 'potato',
    reason: 'First potato harvest!',
    lines: ['Mars soil has perchlorate salts', 'So we grow plants in water, not soil', 'Earth: city vertical farms do the same'],
    source: 'Perchlorate found in Mars soil by NASA Phoenix (2008). CSA: Food production toolkit',
  },
  {
    id: 'soy',
    crop: 'soy',
    reason: 'First soy harvest!',
    lines: ['Our greenhouse reuses its water', 'Earth: closed greenhouses grow food in the Canadian Arctic'],
    source: 'CSA: Food production on the Moon and in remote areas',
  },
  {
    id: 'bonus',
    crop: null,
    reason: 'You grew every crop!',
    lines: ['Red and blue LEDs feed the plants', 'Earth: indoor farms use LEDs to save power'],
    source: 'NASA Veggie uses red and blue LED light. CSA: Food production toolkit',
  },
];

// Quais fatos a crianca ja ganhou nesta partida. Cada fato aparece uma vez so; a colheita
// automatica da tripulacao nao passa por aqui, entao nunca mostra nada.
export class EarthFacts {
  constructor() {
    this.seen = new Set(); // ids de EARTH_CARDS
    this._crops = new Set(); // tipos que o jogador ja colheu
  }

  // Chamado quando o JOGADOR colhe `type`. Devolve o fato novo, ou null se nao ha recompensa.
  onPlayerHarvest(type) {
    const first = !this._crops.has(type);
    this._crops.add(type);
    const card = first
      ? EARTH_CARDS.find((c) => c.crop === type)
      : EARTH_CARDS.find((c) => !c.crop && EARTH_CARDS.every((other) => !other.crop || this._crops.has(other.crop)));
    if (!card || this.seen.has(card.id)) return null;
    this.seen.add(card.id);
    return card;
  }
}

// O toast de descoberta (ScannerHud.showDiscovery) e a linha do diario de bordo
export function earthFactLines(card) {
  return [...card.lines, `Source: ${card.source}`];
}

export function earthFactLogText(card) {
  return `Space science on Earth: ${card.lines.join('. ')}. (${card.source})`;
}
