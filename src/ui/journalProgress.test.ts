// @ts-nocheck
import { describe, expect, it } from 'vitest';
import { JOURNAL_RANKS, UnseenFinds, journalRank } from './journalProgress.ts';

describe('journalRank', () => {
  it('splits 24 finds into CADET, SPECIALIST and COMMANDER thirds', () => {
    expect(journalRank(0, 24)).toMatchObject({ label: 'CADET', next: 'SPECIALIST', toNext: 8, fill: 0, complete: false });
    expect(journalRank(7, 24).label).toBe('CADET');
    expect(journalRank(8, 24)).toMatchObject({ label: 'SPECIALIST', next: 'COMMANDER', toNext: 8 });
    expect(journalRank(15, 24).label).toBe('SPECIALIST');
    expect(journalRank(16, 24)).toMatchObject({ label: 'COMMANDER', next: null, toNext: 8 });
    expect(journalRank(24, 24)).toMatchObject({ label: 'COMMANDER', fill: 1, toNext: 0, complete: true });
    expect(journalRank(0, 24).thresholds).toEqual([0, 8, 16]);
  });

  it('rounds thresholds up when the total does not split evenly', () => {
    expect(journalRank(0, 23).thresholds).toEqual([0, 8, 16]);
    expect(journalRank(23, 23).complete).toBe(true);
  });

  it('clamps bad input', () => {
    expect(journalRank(-3, 24)).toMatchObject({ label: JOURNAL_RANKS[0], fill: 0 });
    expect(journalRank(99, 24)).toMatchObject({ label: 'COMMANDER', fill: 1, complete: true });
    expect(journalRank(0, 0).fill).toBe(0);
  });
});

describe('UnseenFinds', () => {
  it('flags a tab as new until it is seen', () => {
    const unseen = new UnseenFinds();
    unseen.add('phobos', 'sky');
    unseen.add('sandstone', 'terrain');
    expect(unseen.hasNew('sky')).toBe(true);
    expect(unseen.isNew('phobos')).toBe(true);
    expect(unseen.isNew('earth')).toBe(false);
    expect(unseen.size).toBe(2);
    expect(unseen.firstCategoryWithNew(['sky', 'terrain'])).toBe('sky');

    unseen.markSeen('sky');
    expect(unseen.hasNew('sky')).toBe(false);
    expect(unseen.isNew('phobos')).toBe(false);
    expect(unseen.firstCategoryWithNew(['sky', 'terrain', 'base'])).toBe('terrain');
    unseen.markSeen('terrain');
    expect(unseen.firstCategoryWithNew(['sky', 'terrain'])).toBeNull();
    expect(unseen.size).toBe(0);
  });
});
