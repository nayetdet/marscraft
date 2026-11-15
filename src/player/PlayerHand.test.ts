import { describe, expect, it, vi } from 'vitest';
import { BLOCK_IDS } from '../config/blockTypes.ts';
import { PlayerHand } from './PlayerHand.ts';

const ITEM_KEYS = ['block', 'carrot', 'ration', 'scope', 'shield', 'journal', 'brush', 'crop:14'];

function handWithThirdPersonItems() {
  const hand = Object.create(PlayerHand.prototype);
  hand.thirdPersonHeldItems = new Map(ITEM_KEYS.map((key) => [key, { visible: false }]));
  hand.heldCrops = { [BLOCK_IDS.POTATO]: {} };
  hand.cleanTime = 0;
  hand._getHandMaterial = vi.fn(() => 'selected block material');
  return hand;
}

describe('third-person held item', () => {
  it.each([
    [BLOCK_IDS.REGOLITH, 'block'],
    [BLOCK_IDS.HYDRO_PLANT, 'carrot'],
    [BLOCK_IDS.RATION, 'ration'],
    [BLOCK_IDS.SCOPE, 'scope'],
    [BLOCK_IDS.SHIELD_REMOTE, 'shield'],
    [BLOCK_IDS.JOURNAL, 'journal'],
    [BLOCK_IDS.POTATO, `crop:${BLOCK_IDS.POTATO}`],
  ])('shows the matching model for item %s', (blockId, key) => {
    const hand = handWithThirdPersonItems();

    hand._syncThirdPersonHeldItem(blockId, 1);

    expect(hand.thirdPersonHeldItems.get(key).visible).toBe(true);
    expect([...hand.thirdPersonHeldItems.entries()].filter(([, item]) => item.visible)).toHaveLength(1);
  });

  it('shows the cleaning brush even when no hotbar item is held', () => {
    const hand = handWithThirdPersonItems();
    hand.cleanTime = 0.4;

    hand._syncThirdPersonHeldItem(null, 0);

    expect(hand.thirdPersonHeldItems.get('brush').visible).toBe(true);
  });
});
