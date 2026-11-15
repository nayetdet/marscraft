import { describe, expect, it } from 'vitest';
import { SAMPLE_SITE_CONFIG, TERRAIN_CONFIG, WATER_SYSTEM_CONFIG } from '../config/constants.ts';
import { SAMPLE_TYPES } from '../data/sampleTypes.ts';
import { placeSampleSites, sampleTypeOrder } from './sampleSites.ts';

const flat = () => 9;
const fieldOf = (sites: { typeId: string; x: number; z: number }[], typeId: string) => sites.filter((site) => site.typeId === typeId);
const C = SAMPLE_SITE_CONFIG;
const base = TERRAIN_CONFIG.BASE_CENTER;

describe('sample sites on the map', () => {
  it('puts the samples in the same places for the same seed', () => {
    expect(placeSampleSites({ groundTop: flat })).toEqual(placeSampleSites({ groundTop: flat }));
    expect(placeSampleSites({ groundTop: flat, seed: 7 })).not.toEqual(placeSampleSites({ groundTop: flat }));
  });

  it('places 3 sites of each of the 5 sample types, with ids site-0 to site-14', () => {
    const sites = placeSampleSites({ groundTop: flat });
    expect(C.COUNT).toBe(SAMPLE_TYPES.length * C.PER_TYPE);
    expect(sites).toHaveLength(C.COUNT);
    for (const type of SAMPLE_TYPES) expect(sites.filter((site) => site.typeId === type.id), type.id).toHaveLength(C.PER_TYPE);
    expect(sites.map((site) => site.id)).toEqual(Array.from({ length: C.COUNT }, (_, i) => `site-${i}`));
    expect(sites.map((site) => site.typeId)).toEqual(sampleTypeOrder(C.COUNT));
    expect(sampleTypeOrder(SAMPLE_TYPES.length, 1).sort()).toEqual(SAMPLE_TYPES.map((type) => type.id).sort());
  });

  // Ato 4 (issue #410): cada tipo fica num campo so, para serem 5 saidas e nao 15
  it('keeps the 3 sites of a type in one compact field, each on its own block', () => {
    for (const seed of [C.SEED, 7, 99, 12345]) {
      const sites = placeSampleSites({ groundTop: flat, seed });
      expect(sites, `seed ${seed}`).toHaveLength(C.COUNT);
      for (const type of SAMPLE_TYPES) {
        const field = fieldOf(sites, type.id);
        const center = field[0];
        for (const site of field) {
          // O local e arredondado para o bloco: 1 bloco de folga
          expect(Math.hypot(site.x - center.x, site.z - center.z), `${type.id} seed ${seed}`).toBeLessThanOrEqual(C.FIELD_RADIUS + 1);
          for (const other of field) {
            if (other !== site) expect(Math.hypot(site.x - other.x, site.z - other.z)).toBeGreaterThanOrEqual(C.FIELD_MIN_GAP - 1);
          }
        }
        expect(new Set(field.map((site) => `${site.x},${site.z}`)).size).toBe(field.length);
      }
    }
  });

  it('keeps the fields far from the base and apart from each other', () => {
    const sites = placeSampleSites({ groundTop: flat });
    for (const site of sites) expect(Math.hypot(site.x - base.x, site.z - base.z)).toBeGreaterThanOrEqual(C.MIN_RADIUS);
    const centers = SAMPLE_TYPES.map((type) => fieldOf(sites, type.id)[0]);
    for (const center of centers) {
      for (const other of centers) {
        if (other !== center) expect(Math.hypot(center.x - other.x, center.z - other.z)).toBeGreaterThanOrEqual(C.MIN_SPACING - 1.5);
      }
    }
  });

  it('moves the whole field when the ground around its center is not free', () => {
    // So um bloco em cada 3 e livre: o campo precisa caber mesmo assim
    const sparse = (x: number, z: number) => ((x + z) % 3 === 0 ? 9 : -1);
    const sites = placeSampleSites({ groundTop: sparse });
    expect(sites).toHaveLength(C.COUNT);
    for (const site of sites) expect(sparse(site.x, site.z)).toBe(9);
  });

  it('keeps the ice cores near the ice crater', () => {
    const ice = WATER_SYSTEM_CONFIG.ICE_CRATER_CENTER;
    const cores = placeSampleSites({ groundTop: flat }).filter((site) => site.typeId === 'sample-ice-core');
    expect(cores.length).toBeGreaterThan(0);
    for (const site of cores) expect(Math.hypot(site.x - ice.x, site.z - ice.z)).toBeLessThanOrEqual(C.ICE_RING[1] + 1);
  });

  it('never uses ground that is not free', () => {
    const blocked = (x: number) => (x > 0 ? -1 : 9);
    const sites = placeSampleSites({ groundTop: blocked });
    for (const site of sites) expect(site.x).toBeLessThanOrEqual(0);
  });
});
