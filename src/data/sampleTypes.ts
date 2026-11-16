import { BLOCK_IDS } from '../config/blockTypes.ts';

// Tipos de amostra espalhados pelo mapa (issue #270). A crianca procura la fora, coleta, traz
// para o laboratorio e analisa: cada tipo mostra um fato real e vale pontos de ciencia.
//
// Honestidade com o dado: os FATOS sao reais (fontes da NASA abaixo e em
// docs/data/numeros-reais.md, secao "Amostras do mapa"). As POSICOES no mapa e os PONTOS sao
// regra de jogo. O gelo e do Phoenix (polo norte), nao de Gale: o jogo avisa isso na ficha.

export interface SampleSource {
  name: string;
  url: string;
}

export interface SampleType {
  id: string; // tambem e o id da ficha no diario [J] (src/data/scanCatalog.ts)
  itemId: number; // item do inventario (BLOCK_IDS)
  name: string;
  short: string; // nome curto para listas e botoes
  points: number; // pontos de ciencia ao analisar (regra de jogo)
  color: number; // cor da amostra no chao
  glow: number; // cor do facho de luz que marca o local
  where: string; // onde o Curiosity (ou outra missao) achou de verdade
  lines: string[]; // fato real em frases curtas (7 a 12 anos)
  source: SampleSource;
}

export const SAMPLE_TYPES: SampleType[] = [
  {
    id: 'sample-dune-sand',
    itemId: BLOCK_IDS.SAMPLE_DUNE_SAND,
    name: 'Dark Dune Sand',
    short: 'DUNE SAND',
    points: 2,
    color: 0x3b2f2a,
    glow: 0xfbbf24,
    where: 'Bagnold Dunes, Gale Crater',
    lines: [
      'Curiosity was the first rover to visit moving sand dunes on another planet',
      'The wind pushes these dunes about 1 meter every Earth year',
    ],
    source: { name: 'NASA/JPL: Curiosity at the Bagnold Dunes (2015)', url: 'https://www.nasa.gov/image-article/high-dune-first-martian-dune-studied-up-close/' },
  },
  {
    id: 'sample-mudstone',
    itemId: BLOCK_IDS.SAMPLE_MUDSTONE,
    name: 'Layered Mudstone',
    short: 'MUDSTONE',
    points: 3,
    color: 0x9aa3a8,
    glow: 0x7dd3fc,
    where: 'Yellowknife Bay, Gale Crater',
    lines: [
      'This gray rock was mud at the bottom of a lake, billions of years ago',
      'Curiosity drilled it in 2013: the water was good enough for tiny microbes',
    ],
    source: { name: 'NASA/JPL: Conditions once suited for ancient life on Mars (2013)', url: 'https://www.jpl.nasa.gov/news/nasa-rover-finds-conditions-once-suited-for-ancient-life-on-mars/' },
  },
  {
    id: 'sample-sulfur',
    itemId: BLOCK_IDS.SAMPLE_SULFUR,
    name: 'Yellow Sulfur Crystals',
    short: 'SULFUR',
    points: 4,
    color: 0xfde047,
    glow: 0xfde047,
    where: 'Gediz Vallis channel, Gale Crater',
    lines: [
      'In 2024 Curiosity drove over a rock and cracked it open by accident',
      'Inside: yellow crystals of pure sulfur, never seen on Mars before',
    ],
    source: { name: 'NASA/JPL: Curiosity discovers a surprise in a Martian rock (2024)', url: 'https://www.jpl.nasa.gov/news/nasas-curiosity-rover-discovers-a-surprise-in-a-martian-rock/' },
  },
  {
    id: 'sample-meteorite',
    itemId: BLOCK_IDS.SAMPLE_METEORITE,
    name: 'Iron Meteorite',
    short: 'METEORITE',
    points: 3,
    color: 0x64748b,
    glow: 0xc4b5fd,
    where: 'Mount Sharp, Gale Crater',
    lines: [
      'This metal rock fell from space: it is iron and nickel',
      'Curiosity found one called Cacao in 2023, about 30 cm wide',
    ],
    source: { name: 'NASA Science: Curiosity finds a meteorite, Cacao (2023)', url: 'https://science.nasa.gov/resource/curiosity-finds-a-meteorite-cacao/' },
  },
  {
    id: 'sample-ice-core',
    itemId: BLOCK_IDS.SAMPLE_ICE_CORE,
    name: 'Buried Ice Core',
    short: 'ICE CORE',
    points: 2,
    color: 0xdff6ff,
    glow: 0x67e8f9,
    where: 'Mars north plains (Phoenix lander), not Gale Crater',
    lines: [
      'In 2008 the Phoenix lander dug up white chunks near the north pole',
      'They vanished in 4 days: it was water ice turning straight into vapor',
    ],
    source: { name: 'NASA/JPL: Bright chunks at Phoenix site must have been ice (2008)', url: 'https://www.jpl.nasa.gov/news/bright-chunks-at-phoenix-landers-mars-site-must-have-been-ice/' },
  },
];

const BY_ID = new Map(SAMPLE_TYPES.map((type) => [type.id, type]));
const BY_ITEM = new Map(SAMPLE_TYPES.map((type) => [type.itemId, type]));

export const SAMPLE_ITEM_IDS: number[] = SAMPLE_TYPES.map((type) => type.itemId);

export function sampleTypeById(id: string): SampleType | null {
  return BY_ID.get(id) ?? null;
}

export function sampleTypeByItem(itemId: number): SampleType | null {
  return BY_ITEM.get(itemId) ?? null;
}

// O que o FirstTimeHud desenha quando a amostra e analisada (mesmo formato de earthFactView)
export function sampleFactView(type: SampleType) {
  return {
    stamp: 'SAMPLE!',
    title: type.name,
    reason: `Lab result: +${type.points} science points`,
    lines: type.lines.map((text, i) => ({ icon: i === 0 ? 'scope' : 'check', tone: 'mars' as const, text })),
    source: type.source.name,
    scene: { from: 'mars', to: 'earth', motion: 'beam' as const },
    accent: `#${type.glow.toString(16).padStart(6, '0')}`,
  };
}

// A linha do diario de bordo [J]
export function sampleLogText(type: SampleType): string {
  return `Sample analyzed, ${type.name}: ${type.lines.join('. ')}. Real find: ${type.where}. (${type.source.name})`;
}
