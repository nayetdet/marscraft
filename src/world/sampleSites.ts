import { SAMPLE_SITE_CONFIG, TERRAIN_CONFIG, WATER_SYSTEM_CONFIG } from '../config/constants.ts';
import { SAMPLE_TYPES } from '../data/sampleTypes.ts';

// Onde ficam as amostras do mapa (issue #270). Funcao pura: a mesma semente da sempre os mesmos
// lugares. As posicoes sao sorteadas (regra de jogo, nao e dado real); so os fatos de cada tipo
// sao reais (src/data/sampleTypes.ts). Quem desenha e o SampleSiteMarkers.

export interface SampleSite {
  id: string; // 'site-0', 'site-1'...
  typeId: string; // id em SAMPLE_TYPES
  x: number;
  y: number; // topo do chao naquele ponto
  z: number;
}

export interface SampleSiteOptions {
  // Chao natural livre naquele bloco? Devolve o y do topo do chao, ou -1 se nao pode (area
  // construida, fora do mapa, chao que nao e natural)
  groundTop: (x: number, z: number) => number;
  seed?: number;
  count?: number;
  config?: typeof SAMPLE_SITE_CONFIG;
}

const ICE_TYPE_ID = 'sample-ice-core';

// Gerador simples com semente (Park-Miller), igual ao das pedras decorativas
function seededRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// A ordem dos tipos: um de cada, em rodizio, ate fechar `count` (10 locais = 2 de cada tipo)
export function sampleTypeOrder(count: number): string[] {
  return Array.from({ length: count }, (_, i) => SAMPLE_TYPES[i % SAMPLE_TYPES.length].id);
}

export function placeSampleSites({ groundTop, seed = SAMPLE_SITE_CONFIG.SEED, count = SAMPLE_SITE_CONFIG.COUNT, config = SAMPLE_SITE_CONFIG }: SampleSiteOptions): SampleSite[] {
  const rand = seededRandom(seed);
  const base = TERRAIN_CONFIG.BASE_CENTER;
  const ice = WATER_SYSTEM_CONFIG.ICE_CRATER_CENTER;
  const sites: SampleSite[] = [];

  for (const typeId of sampleTypeOrder(count)) {
    // O gelo fica num anel em volta da cratera de gelo; o resto, num anel em volta da base
    const isIce = typeId === ICE_TYPE_ID;
    const center = isIce ? ice : base;
    const [rMin, rMax] = isIce ? config.ICE_RING : [config.MIN_RADIUS, config.MAX_RADIUS];
    for (let attempt = 0; attempt < config.PLACEMENT_TRIES; attempt += 1) {
      const angle = rand() * Math.PI * 2;
      const radius = rMin + rand() * (rMax - rMin);
      const x = Math.round(center.x + Math.cos(angle) * radius);
      const z = Math.round(center.z + Math.sin(angle) * radius);
      // Longe da base mesmo quando o anel e o da cratera de gelo
      if (Math.hypot(x - base.x, z - base.z) < config.MIN_RADIUS) continue;
      if (sites.some((site) => Math.hypot(site.x - x, site.z - z) < config.MIN_SPACING)) continue;
      const y = groundTop(x, z);
      if (y < 0) continue;
      sites.push({ id: `site-${sites.length}`, typeId, x, y, z });
      break;
    }
  }
  return sites;
}
