import { describe, expect, it } from 'vitest';
import { rationDeliveryCropOnEntry } from './rationDeliveryTrigger.ts';

describe('ration delivery on entering the kitchen', () => {
  it('shows an available crop on each entry, even if there are no prepared rations', () => {
    expect(rationDeliveryCropOnEntry(false, true, { potato: 0, soy: 2 })).toBe('soy');
    expect(rationDeliveryCropOnEntry(false, true, { potato: 1 })).toBe('potato');
  });

  it('does not start for an empty basket or while already in the kitchen', () => {
    expect(rationDeliveryCropOnEntry(false, true, { potato: 0 })).toBeNull();
    expect(rationDeliveryCropOnEntry(true, true, { potato: 1 })).toBeNull();
    expect(rationDeliveryCropOnEntry(true, false, { potato: 1 })).toBeNull();
  });

  it('also triggers on every entry when harvested food has become rations', () => {
    const baskets = { potato: 0, soy: 0 };
    expect(rationDeliveryCropOnEntry(false, true, baskets, 2, 'soy')).toBe('soy');
    expect(rationDeliveryCropOnEntry(true, true, baskets, 2, 'soy')).toBeNull();
    expect(rationDeliveryCropOnEntry(false, true, baskets, 2, 'soy')).toBe('soy');
    expect(rationDeliveryCropOnEntry(false, true, baskets, 1)).toBe('potato');
    expect(rationDeliveryCropOnEntry(false, true, baskets, 0, 'soy')).toBeNull();
  });
});
