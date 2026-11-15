import { describe, expect, it } from 'vitest';
import { rationDeliveryCropWhileInside } from './rationDeliveryTrigger.ts';

describe('ration delivery while visiting the kitchen', () => {
  it('waits for harvested food if the player entered before the crop was ready', () => {
    expect(rationDeliveryCropWhileInside(true, true, { potato: 0 })).toBeNull();
    expect(rationDeliveryCropWhileInside(true, true, { potato: 0, soy: 2 })).toBe('soy');
  });

  it('does not replay after delivery or use old pantry rations as a new crop', () => {
    expect(rationDeliveryCropWhileInside(true, false, { potato: 1 })).toBeNull();
    expect(rationDeliveryCropWhileInside(false, true, { potato: 1 })).toBeNull();
    expect(rationDeliveryCropWhileInside(true, true, { potato: 0 })).toBeNull();
  });
});
