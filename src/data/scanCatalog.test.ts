// @ts-nocheck
import { describe, it, expect } from 'vitest';
import { SAMPLE_CATEGORY, SCAN_CATALOG, SCAN_CATEGORIES, getScanEntry, listCatalogSources } from './scanCatalog.ts';
import { SAMPLE_TYPES } from './sampleTypes.ts';
import { BLOCK_IDS } from '../config/blockTypes.ts';
import { getJournalIcon } from '../graphics/journalIcons.ts';

// Todo id que o resolvedor (scanTargeting) ou os colliders (nasaModelsBuilder / GameEngine) podem
// devolver precisa ter ficha no catálogo.
const TARGET_IDS = [
  'sun', 'earth', 'moon', 'phobos', 'deimos',
  'regolith', 'sandstone', 'crater-rock', 'water-ice', 'meteor-ice',
  'base', 'habitat', 'airlock', 'tunnel', 'greenhouse', 'cupola', 'gym',
  'solar-panels', 'antenna', 'ice-depot', 'rover', 'lander', 'mav-panel',
  'crater-rim', 'atmosphere',
  'dust-storm-wall', 'dust-devil', // so na tempestade (issue #419)
];

describe('scan catalog', () => {
  it('has one entry for every target the scanner can resolve and every map sample, and nothing else', () => {
    const sampleIds = SAMPLE_TYPES.map((type) => type.id);
    expect(SCAN_CATALOG.map((e) => e.id).sort()).toEqual([...TARGET_IDS, ...sampleIds].sort());
    expect(SCAN_CATALOG.filter((e) => e.category === SAMPLE_CATEGORY).map((e) => e.id).sort()).toEqual([...sampleIds].sort());
  });

  it('gives every map sample a real fact with a NASA source (issue #270)', () => {
    expect(SAMPLE_TYPES.length).toBeGreaterThanOrEqual(4);
    for (const type of SAMPLE_TYPES) {
      expect(type.lines.length).toBeGreaterThanOrEqual(2);
      expect(type.source.url).toMatch(/^https:\/\/(www\.)?(science\.)?(jpl\.)?nasa\.gov\//);
      expect(type.points).toBeGreaterThan(0);
      expect(getScanEntry(type.id).facts[1]).toMatchObject({ value: type.where, source: type.source });
    }
  });

  it('uses unique ids and known categories', () => {
    const ids = SCAN_CATALOG.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    const categories = new Set(SCAN_CATEGORIES.map((c) => c.id));
    for (const entry of SCAN_CATALOG) expect(categories.has(entry.category)).toBe(true);
  });

  it.each(SCAN_CATALOG.map((e) => [e.id, e]))('%s has text, real numbers and a source', (_, entry) => {
    expect(entry.title.length).toBeGreaterThan(0);
    expect(entry.summary.length).toBeGreaterThan(10);
    expect(entry.why.length).toBeGreaterThan(10);
    expect(entry.facts.length).toBeGreaterThan(0);
    for (const fact of entry.facts) {
      expect(fact.label).toBeTruthy();
      expect(fact.value).toBeTruthy();
      expect(fact.source?.name).toBeTruthy();
      if (fact.source.url) expect(fact.source.url).toMatch(/^https:\/\//);
    }
  });

  it('only rewards real inventory blocks', () => {
    const validIds = new Set(Object.values(BLOCK_IDS));
    for (const entry of SCAN_CATALOG.filter((e) => e.reward)) {
      for (const item of entry.reward.items ?? []) {
        expect(validIds.has(item.blockId)).toBe(true);
        expect(item.count).toBeGreaterThan(0);
      }
    }
  });

  it('looks entries up by id and lists each source once', () => {
    expect(getScanEntry('earth').title).toBe('Earth');
    expect(getScanEntry('nope')).toBeNull();
    const names = listCatalogSources().map((s) => s.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('gives every catalog entry its own distinct pixel-art journal icon', () => {
    const icons = SCAN_CATALOG.map((e) => getJournalIcon(e.id));
    for (const icon of icons) {
      expect(icon).toMatch(/^data:image\/svg\+xml,/);
    }
    expect(new Set(icons).size).toBe(SCAN_CATALOG.length);
  });
});
