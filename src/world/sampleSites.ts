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
  count?: number; // total de amostras: `config.PER_TYPE` por campo
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

// A ordem dos tipos: um campo por tipo, com `perType` amostras seguidas (15 locais = 3 de cada)
export function sampleTypeOrder(count: number, perType: number = SAMPLE_SITE_CONFIG.PER_TYPE): string[] {
  return Array.from({ length: count }, (_, i) => SAMPLE_TYPES[Math.floor(i / perType) % SAMPLE_TYPES.length].id);
}

// Campo de amostras (ato 4, issue #410): cada tipo fica num campo so, com as pedrinhas a poucos
// blocos uma da outra. O centro do campo segue as regras de antes: anel em volta da base, o gelo
// perto da cratera de gelo e os tipos que sao pista (issue #344) cada um no seu anel.
export function placeSampleSites({ groundTop, seed = SAMPLE_SITE_CONFIG.SEED, count = SAMPLE_SITE_CONFIG.COUNT, config = SAMPLE_SITE_CONFIG }: SampleSiteOptions): SampleSite[] {
  const rand = seededRandom(seed);
  const base = TERRAIN_CONFIG.BASE_CENTER;
  const ice = WATER_SYSTEM_CONFIG.ICE_CRATER_CENTER;
  const sites: SampleSite[] = [];
  const centers: { x: number; z: number }[] = [];
  const farFromBase = (x: number, z: number) => Math.hypot(x - base.x, z - base.z) >= config.MIN_RADIUS;

  for (let first = 0; first < count; first += config.PER_TYPE) {
    const typeId = SAMPLE_TYPES[(first / config.PER_TYPE) % SAMPLE_TYPES.length].id;
    const size = Math.min(config.PER_TYPE, count - first);
    const isIce = typeId === ICE_TYPE_ID;
    const center = isIce ? ice : base;
    const [rMin, rMax] = isIce ? config.ICE_RING : config.CLUE_RINGS?.[typeId] ?? [config.MIN_RADIUS, config.MAX_RADIUS];
    for (let attempt = 0; attempt < config.PLACEMENT_TRIES; attempt += 1) {
      const angle = rand() * Math.PI * 2;
      const radius = rMin + rand() * (rMax - rMin);
      const cx = Math.round(center.x + Math.cos(angle) * radius);
      const cz = Math.round(center.z + Math.sin(angle) * radius);
      // Longe da base mesmo quando o anel e o da cratera de gelo
      if (!farFromBase(cx, cz)) continue;
      if (centers.some((other) => Math.hypot(other.x - cx, other.z - cz) < config.MIN_SPACING)) continue;
      // As pedrinhas do campo: a primeira no centro, as outras em volta
      const centerTop = groundTop(cx, cz);
      if (centerTop < 0) continue;
      const field = [{ x: cx, y: centerTop, z: cz }];
      for (let pebble = 0; pebble < config.FIELD_TRIES && field.length < size; pebble += 1) {
        const a = rand() * Math.PI * 2;
        const r = config.FIELD_MIN_GAP + rand() * (config.FIELD_RADIUS - config.FIELD_MIN_GAP);
        const x = Math.round(cx + Math.cos(a) * r);
        const z = Math.round(cz + Math.sin(a) * r);
        if (!farFromBase(x, z)) continue;
        if (field.some((other) => Math.hypot(other.x - x, other.z - z) < config.FIELD_MIN_GAP)) continue;
        const y = groundTop(x, z);
        if (y < 0) continue;
        field.push({ x, y, z });
      }
      if (field.length < size) continue;
      centers.push({ x: cx, z: cz });
      for (const spot of field) sites.push({ id: `site-${sites.length}`, typeId, ...spot });
      break;
    }
  }
  return sites;
}
