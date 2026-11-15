import { describe, expect, it } from 'vitest';
import { rationDeliveryCropWhileInside } from './rationDeliveryTrigger.ts';

describe('ration delivery while visiting the kitchen', () => {
  it('shows a prepared delivery when the player reaches the kitchen', () => {
    expect(rationDeliveryCropWhileInside(false, 'soy')).toBeNull();
    expect(rationDeliveryCropWhileInside(true, 'soy')).toBe('soy');
  });

  it('does not replay after delivery or use old pantry rations as a new crop', () => {
    expect(rationDeliveryCropWhileInside(true, null)).toBeNull();
  });
});
