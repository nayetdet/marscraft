import { describe, expect, it } from 'vitest';
import { SAMPLE_SITE_CONFIG, TERRAIN_CONFIG, WATER_SYSTEM_CONFIG } from '../config/constants.ts';
import { SAMPLE_TYPES } from '../data/sampleTypes.ts';
import { placeSampleSites, sampleTypeOrder } from './sampleSites.ts';

const flat = () => 9;
const C = SAMPLE_SITE_CONFIG;
const base = TERRAIN_CONFIG.BASE_CENTER;

describe('sample sites on the map', () => {
  it('puts the samples in the same places for the same seed', () => {
    expect(placeSampleSites({ groundTop: flat })).toEqual(placeSampleSites({ groundTop: flat }));
    expect(placeSampleSites({ groundTop: flat, seed: 7 })).not.toEqual(placeSampleSites({ groundTop: flat }));
  });

  it('places every site, with at least 4 different sample types', () => {
    const sites = placeSampleSites({ groundTop: flat });
    expect(sites).toHaveLength(C.COUNT);
    expect(new Set(sites.map((site) => site.typeId)).size).toBeGreaterThanOrEqual(4);
    expect(new Set(sites.map((site) => site.id)).size).toBe(C.COUNT);
    expect(sampleTypeOrder(SAMPLE_TYPES.length).sort()).toEqual(SAMPLE_TYPES.map((type) => type.id).sort());
  });

  it('keeps the sites far from the base and apart from each other', () => {
    const sites = placeSampleSites({ groundTop: flat });
    for (const site of sites) {
      expect(Math.hypot(site.x - base.x, site.z - base.z)).toBeGreaterThanOrEqual(C.MIN_RADIUS - 1);
      for (const other of sites) {
        if (other !== site) expect(Math.hypot(site.x - other.x, site.z - other.z)).toBeGreaterThanOrEqual(C.MIN_SPACING - 1.5);
      }
    }
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
