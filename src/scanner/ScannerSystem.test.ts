// @ts-nocheck
import { describe, it, expect } from 'vitest';
import { ScannerSystem, applyDiscoveryReward } from './ScannerSystem.ts';
import { ScanJournal, SCAN_JOURNAL_CONFIG } from './scanJournal.ts';
import { getScanEntry } from '../data/scanCatalog.ts';
import { BLOCK_IDS } from '../config/blockTypes.ts';

const DURATION = SCAN_JOURNAL_CONFIG.BASE_SCAN_DURATION;

function setup() {
  const journal = new ScanJournal({ storage: null });
  return { journal, scanner: new ScannerSystem(journal) };
}

describe('ScannerSystem', () => {
  it('fills the ring while the target stays under the crosshair', () => {
    const { scanner } = setup();
    const half = scanner.update(DURATION / 2, 'earth');
    expect(half.progress).toBeCloseTo(0.5);
    expect(half.done).toBe(false);
    expect(half.completed).toBeNull();

    const full = scanner.update(DURATION / 2, 'earth');
    expect(full.done).toBe(true);
    expect(full.completed.entry.id).toBe('earth');
    expect(full.completed.discovery.isNew).toBe(true);
  });

  it('restarts when the aim moves to another target or to nothing', () => {
    const { scanner } = setup();
    scanner.update(DURATION * 0.8, 'earth');
    expect(scanner.update(0.01, 'moon').progress).toBeLessThan(0.1);
    scanner.update(DURATION * 0.8, 'moon');
    expect(scanner.update(0.01, null)).toMatchObject({ targetId: null, progress: 0 });
    expect(scanner.update(0.01, 'moon').progress).toBeLessThan(0.1);
  });

  it('completes only once and recognizes the target immediately after rediscovery', () => {
    const { scanner } = setup();
    expect(scanner.update(DURATION, 'sun').completed).not.toBeNull();
    expect(scanner.update(DURATION, 'sun')).toMatchObject({ done: true, completed: null });
    scanner.update(0.01, null);
    const again = scanner.update(DURATION, 'sun');
    expect(again).toMatchObject({ done: true, completed: null, known: true, progress: 1 });
  });

  it('tells whether the target was already in the journal when the aim arrived', () => {
    const { scanner } = setup();
    const first = scanner.update(DURATION, 'phobos');
    expect(first.known).toBe(false);
    expect(scanner.update(0.01, 'phobos').known).toBe(false);
  });

  it('asks for a full scan of targets known from an earlier mission, so they join this science package', () => {
    const { scanner, journal } = setup();
    journal.discovered.add('phobos'); // escaneado numa partida anterior
    const start = scanner.update(0.01, 'phobos');
    expect(start).toMatchObject({ known: true, done: false });
    const full = scanner.update(DURATION, 'phobos');
    expect(full.completed.discovery).toMatchObject({ isNew: false, missionNew: true, missionCount: 1 });
    expect(journal.count).toBe(1);
  });

  it('identifies previously discovered targets immediately without starting another scan', () => {
    const { scanner, journal } = setup();
    journal.record('phobos');
    const state = scanner.update(0.01, 'phobos');
    expect(state).toMatchObject({ targetId: 'phobos', progress: 1, done: true, known: true, completed: null });
  });
});

describe('applyDiscoveryReward', () => {
  function fakeSurvival() {
    const added = [];
    return {
      added,
      addBlockToInventory: (id) => { added.push(id); return true; },
      addHarvestedCrop: () => { added.push(BLOCK_IDS.HYDRO_PLANT); return true; },
    };
  }

  it('gives supplies for the ice depot and the greenhouse', () => {
    const survival = fakeSurvival();
    const depot = applyDiscoveryReward(getScanEntry('ice-depot'), survival);
    expect(survival.added).toEqual([BLOCK_IDS.MARS_ICE, BLOCK_IDS.MARS_ICE]);
    expect(depot).toMatchObject({ inventoryChanged: true, iceSensor: false });

    applyDiscoveryReward(getScanEntry('greenhouse'), survival);
    expect(survival.added.slice(2)).toEqual([BLOCK_IDS.HYDRO_PLANT, BLOCK_IDS.HYDRO_PLANT]);
  });

  it('turns on the ice sensor for water ice', () => {
    const result = applyDiscoveryReward(getScanEntry('water-ice'), fakeSurvival());
    expect(result.iceSensor).toBe(true);
    expect(result.messages.at(-1)).toMatch(/ice sensor/i);
  });

  it('does nothing for targets without a reward or with a full inventory', () => {
    expect(applyDiscoveryReward(getScanEntry('earth'), fakeSurvival())).toEqual({ messages: [], iceSensor: false, inventoryChanged: false });
    const full = { addBlockToInventory: () => false, addHarvestedCrop: () => false };
    expect(applyDiscoveryReward(getScanEntry('ice-depot'), full).inventoryChanged).toBe(false);
  });
});
