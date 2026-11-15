// @ts-nocheck
import { describe, it, expect } from 'vitest';
import { ScanJournal, SCAN_JOURNAL_CONFIG } from './scanJournal.ts';
import { SCAN_CATALOG, SCAN_CATEGORIES } from '../data/scanCatalog.ts';

function memoryStorage(initial = {}) {
  const data = { ...initial };
  return {
    data,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = v; },
  };
}

const KEY = SCAN_JOURNAL_CONFIG.STORAGE_KEY;
const idsOf = (category) => SCAN_CATALOG.filter((e) => e.category === category).map((e) => e.id);

describe('ScanJournal', () => {
  it('counts only the first scan of each target as a discovery', () => {
    const journal = new ScanJournal({ storage: memoryStorage() });
    expect(journal.record('earth')).toMatchObject({ isNew: true, count: 1, total: SCAN_CATALOG.length });
    expect(journal.record('earth')).toMatchObject({ isNew: false, count: 1 });
    expect(journal.has('earth')).toBe(true);
  });

  it('counts the scans of this mission apart from the permanent journal (issue #105)', () => {
    const storage = memoryStorage();
    const first = new ScanJournal({ storage });
    first.record('earth');
    first.record('earth');
    expect(first.missionCount).toBe(1);

    // Nova partida: o diario permanente continua, a contagem da missao comeca do zero
    const next = new ScanJournal({ storage });
    expect(next.has('earth')).toBe(true);
    expect(next.missionCount).toBe(0);
    expect(next.scannedThisMission('earth')).toBe(false);
    expect(next.record('earth')).toMatchObject({ isNew: false, missionNew: true, missionCount: 1 });
    expect(next.record('earth')).toMatchObject({ missionNew: false, missionCount: 1 });
    expect(next.record('pizza')).toMatchObject({ missionNew: false, missionCount: 1 });
    expect(JSON.parse(storage.data[KEY])).toEqual(['earth']);
  });

  it('ignores ids that are not in the catalog', () => {
    const journal = new ScanJournal({ storage: memoryStorage() });
    expect(journal.record('pizza').isNew).toBe(false);
    expect(journal.count).toBe(0);
  });

  it('persists discoveries and loads them back', () => {
    const storage = memoryStorage();
    new ScanJournal({ storage }).record('phobos');
    expect(JSON.parse(storage.data[KEY])).toEqual(['phobos']);
    expect(new ScanJournal({ storage }).has('phobos')).toBe(true);
  });

  it('survives broken or missing storage', () => {
    expect(new ScanJournal({ storage: memoryStorage({ [KEY]: '{not json' }) }).count).toBe(0);
    const throwing = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } };
    const journal = new ScanJournal({ storage: throwing });
    expect(journal.record('sun').isNew).toBe(true);
    expect(new ScanJournal({ storage: null }).count).toBe(0);
  });

  it('drops stored ids that no longer exist in the catalog', () => {
    const journal = new ScanJournal({ storage: memoryStorage({ [KEY]: JSON.stringify(['earth', 'old-target']) }) });
    expect(journal.count).toBe(1);
  });

  it('reports when a category is completed and upgrades the scope', () => {
    const journal = new ScanJournal({ storage: memoryStorage() });
    expect(journal.scanDuration()).toBeCloseTo(SCAN_JOURNAL_CONFIG.BASE_SCAN_DURATION);
    expect(journal.scanRange()).toBe(SCAN_JOURNAL_CONFIG.BASE_SCAN_RANGE);

    const sky = idsOf('sky');
    sky.slice(0, -1).forEach((id) => expect(journal.record(id).completedCategory).toBeNull());
    expect(journal.record(sky.at(-1)).completedCategory).toBe('sky');

    expect(journal.scanDuration()).toBeLessThan(SCAN_JOURNAL_CONFIG.BASE_SCAN_DURATION);
    expect(journal.scanRange()).toBe(SCAN_JOURNAL_CONFIG.BASE_SCAN_RANGE + SCAN_JOURNAL_CONFIG.RANGE_PER_CATEGORY);
  });

  it('reaches the fastest scan and the Junior Astronaut rank with everything scanned', () => {
    const journal = new ScanJournal({ storage: memoryStorage() });
    let last;
    for (const entry of SCAN_CATALOG) last = journal.record(entry.id);
    expect(last.completedAll).toBe(true);
    expect(journal.isComplete()).toBe(true);
    expect(journal.completedCategoryCount()).toBe(SCAN_CATEGORIES.length);
    expect(journal.scanDuration()).toBeCloseTo(SCAN_JOURNAL_CONFIG.MIN_SCAN_DURATION);
  });
});
