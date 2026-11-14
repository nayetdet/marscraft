import { describe, it, expect } from 'vitest';
import { ScannerSystem, applyDiscoveryReward } from './ScannerSystem.js';
import { ScanJournal, SCAN_JOURNAL_CONFIG } from './scanJournal.js';
import { getScanEntry } from '../data/scanCatalog.js';
import { BLOCK_IDS } from '../config/blockTypes.js';

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

  it('completes only once until the aim leaves the target', () => {
    const { scanner } = setup();
    expect(scanner.update(DURATION, 'sun').completed).not.toBeNull();
    expect(scanner.update(DURATION, 'sun')).toMatchObject({ done: true, completed: null });
    scanner.update(0.01, null);
    const again = scanner.update(DURATION, 'sun');
    expect(again.completed.discovery.isNew).toBe(false);
    expect(again.known).toBe(true);
  });

  it('tells whether the target was already in the journal when the aim arrived', () => {
    const { scanner } = setup();
    const first = scanner.update(DURATION, 'phobos');
    expect(first.known).toBe(false);
    expect(scanner.update(0.01, 'phobos').known).toBe(false);
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
