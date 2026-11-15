import { describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { BLOCK_IDS } from '../config/blockTypes.ts';
import { BLOCK_INTERACTION_CONFIG } from '../config/constants.ts';
import { SAMPLE_ITEM_IDS } from '../data/sampleTypes.ts';
import { PlayerHand } from './PlayerHand.ts';

const SAMPLE_KEYS = SAMPLE_ITEM_IDS.map((id) => `sample:${id}`);
const ITEM_KEYS = ['block', 'carrot', 'ration', 'scope', 'shield', 'journal', 'brush', 'water', 'crop:14', ...SAMPLE_KEYS];

function handWithThirdPersonItems() {
  const hand = Object.create(PlayerHand.prototype);
  hand.thirdPersonHeldItems = new Map(ITEM_KEYS.map((key) => [key, { visible: false }]));
  hand.heldCrops = { [BLOCK_IDS.POTATO]: {} };
  hand.heldSamples = Object.fromEntries(SAMPLE_ITEM_IDS.map((id) => [id, {}]));
  hand.cleanTime = 0;
  hand.drinkTime = 0;
  hand.collectTime = 0;
  hand.collectSampleId = null;
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
    ...SAMPLE_ITEM_IDS.map((id) => [id, `sample:${id}`]),
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

  it('shows the water cup while drinking even when no hotbar item is held', () => {
    const hand = handWithThirdPersonItems();
    hand.drinkTime = 0.5;

    hand._syncThirdPersonHeldItem(null, 0);

    expect(hand.thirdPersonHeldItems.get('water').visible).toBe(true);
  });

  it('shows the collected sample rock in third-person during collection even when no hotbar item is held', () => {
    const hand = handWithThirdPersonItems();
    hand.collectTime = 0.4;
    hand.collectSampleId = BLOCK_IDS.SAMPLE_SULFUR;

    hand._syncThirdPersonHeldItem(null, 0);

    expect(hand.thirdPersonHeldItems.get(`sample:${BLOCK_IDS.SAMPLE_SULFUR}`).visible).toBe(true);
  });
});

describe('sample rock collection animation & held model', () => {
  it('uses sculpted sample models in hand instead of the plain cube and animates reach -> inspect -> settle', () => {
    const hand: any = Object.create(PlayerHand.prototype);
    hand.handGroup = new THREE.Group();
    hand.basePos = new THREE.Vector3(0.56, -0.46, -0.72);
    hand.baseRot = new THREE.Euler(0.35, -0.45, -0.22);
    hand.armMesh = new THREE.Group();
    hand.helmetGroup = new THREE.Group();
    hand.leftArmGroup = new THREE.Group();
    hand.walkTime = 0;
    hand.swingProgress = 0;
    hand.isSwinging = false;
    hand.eatTime = 0;
    hand.drinkTime = 0;
    hand.cleanTime = 0;
    hand.collectTime = 0;
    hand.collectSampleId = null;
    hand.receiveTime = 0;
    hand.pendingHeldBlock = null;
    hand._currentHeld = { blockId: null, count: 0 };
    hand._suitAnimMode = null;
    hand.heldBlockMesh = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), new THREE.MeshLambertMaterial());
    hand.heldCarrotMesh = new THREE.Group();
    hand.heldRationMesh = new THREE.Group();
    hand.heldJournalMesh = new THREE.Group();
    hand.heldScopeMesh = new THREE.Group();
    hand.heldShieldRemoteMesh = new THREE.Group();
    hand.heldBrushMesh = new THREE.Group();
    hand.heldWaterCupMesh = new THREE.Group();
    hand.heldCrops = {};
    hand.heldSamples = Object.fromEntries(SAMPLE_ITEM_IDS.map((id) => [id, new THREE.Group()]));
    hand.materials = {};
    const thirdPersonAction = vi.fn();
    hand.onThirdPersonAction = thirdPersonAction;

    hand.setHeldBlock(BLOCK_IDS.SCOPE, 1);
    expect(hand.heldScopeMesh.visible).toBe(true);

    hand.triggerCollectSample(BLOCK_IDS.SAMPLE_SULFUR);
    expect(thirdPersonAction).toHaveBeenCalledWith('collect');
    expect(hand.heldScopeMesh.visible).toBe(false);
    expect(hand.heldBlockMesh.visible).toBe(false);

    // Selecting the collected sample while the animation runs queues it until settlement.
    hand.setHeldBlock(BLOCK_IDS.SAMPLE_SULFUR, 1);
    expect(hand.pendingHeldBlock).toEqual({ blockId: BLOCK_IDS.SAMPLE_SULFUR, count: 1 });

    // Reach phase: hand dips forward/down before catching the rock.
    hand.update(0.15, false);
    expect(hand.handGroup.position.y).toBeLessThan(hand.basePos.y);
    expect(hand.heldSamples[BLOCK_IDS.SAMPLE_SULFUR].visible).toBe(false);

    // Catch & inspect phase: sculpted rock appears in hand and rises into view.
    hand.update(0.35, false);
    expect(hand.heldSamples[BLOCK_IDS.SAMPLE_SULFUR].visible).toBe(true);
    expect(hand.heldBlockMesh.visible).toBe(false);
    expect(hand.handGroup.position.y).toBeGreaterThan(hand.basePos.y);

    // Finish animation: settles back and displays the queued sculpted sample rock.
    hand.update(BLOCK_INTERACTION_CONFIG.COLLECT_SAMPLE_ANIMATION_DURATION, false);
    expect(hand.collectTime).toBe(0);
    expect(hand.heldSamples[BLOCK_IDS.SAMPLE_SULFUR].visible).toBe(true);
    expect(hand.heldBlockMesh.visible).toBe(false);
  });
});
