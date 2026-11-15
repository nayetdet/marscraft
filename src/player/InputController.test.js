import { describe, expect, it, vi } from 'vitest';
import { InputController } from './InputController.js';
import { BLOCK_INTERACTION_CONFIG } from '../config/constants.js';
import { BLOCK_IDS, SHIP_BLOCK_IDS } from '../config/blockTypes.js';

describe('scope equipment', () => {
  it('does not open from the removed touch scope shortcut', () => {
    const input = Object.create(InputController.prototype);
    input.isTouchMode = true;
    input.isLocked = true;
    input.isScannerOpen = false;
    input.isZoomed = false;
    input.isRoverActive = () => false;
    input.survival = { isDead: false };
    input.hud = { isInventoryOpen: false, updateZoomState: vi.fn() };
    input.onToggleZoom = vi.fn();

    input._handleTouchAction('zoom', { classList: { toggle: vi.fn() } }, 1);
    expect(input.onToggleZoom).not.toHaveBeenCalled();
    expect(input.isScannerOpen).toBe(false);
  });

  it('opens the journal when the journal item is used', () => {
    const input = Object.create(InputController.prototype);
    input.hud = { selectedSlot: 0 };
    input.survival = { slots: [{ id: BLOCK_IDS.JOURNAL, count: 1 }] };
    input.openJournal = vi.fn();
    input.getTargetedBlock = vi.fn();
    input._useSelectedItem();
    expect(input.openJournal).toHaveBeenCalledOnce();
    expect(input.getTargetedBlock).not.toHaveBeenCalled();
  });

  it('toggles scanning only while using the selected Scope', () => {
    const input = Object.create(InputController.prototype);
    input.isScannerOpen = false;
    input.isZoomed = false;
    input.hud = { selectedSlot: 1, showToast: vi.fn(), renderHotbar: vi.fn() };
    input.survival = { slots: [null, { id: BLOCK_IDS.SCOPE, count: 1 }] };
    input.getTargetedBlock = vi.fn();
    input.onToggleZoom = vi.fn();
    input.hud.updateZoomState = vi.fn();

    input._useSelectedItem();
    expect(input.isScannerOpen).toBe(true);
    expect(input.isZoomed).toBe(true);
    expect(input.getTargetedBlock).not.toHaveBeenCalled();
    input._useSelectedItem();
    expect(input.isScannerOpen).toBe(false);
  });

  it('notifies after successfully placing the selected block', () => {
    const input = Object.create(InputController.prototype);
    input.hud = { selectedSlot: 0, renderHotbar: vi.fn() };
    input.survival = {
      slots: [{ id: BLOCK_IDS.REGOLITH, count: 2 }],
      useBlockFromSlot: vi.fn(() => true),
    };
    input.playerHand = { triggerSwing: vi.fn() };
    input.getTargetedBlock = () => ({
      hit: true,
      type: 'block',
      x: 2,
      y: 3,
      z: 4,
      normal: { x: 0, y: 1, z: 0 },
    });
    input.player = { overlapsBlock: vi.fn(() => false) };
    input.world = { setBlock: vi.fn() };
    input._syncHandWithSlot = vi.fn();
    input.onBlockPlaced = vi.fn();

    input._useSelectedItem();

    expect(input.world.setBlock).toHaveBeenCalledWith(2, 4, 4, BLOCK_IDS.REGOLITH, true);
    expect(input.onBlockPlaced).toHaveBeenCalledOnce();
    expect(input.onBlockPlaced).toHaveBeenCalledWith(BLOCK_IDS.REGOLITH);
  });

  it('starts and stops the regolith sound for the duration of breaking the block', () => {
    const input = Object.create(InputController.prototype);
    const hit = {
      hit: true,
      type: 'block',
      x: 2,
      y: 3,
      z: 4,
      block: BLOCK_IDS.REGOLITH,
    };
    input.getTargetedBlock = vi.fn(() => hit);
    input.playerHand = { triggerSwing: vi.fn() };
    input.world = {
      updateBreakCracks: vi.fn(),
      clearBreakCracks: vi.fn(),
      breakBlock: vi.fn(),
    };
    input.onStartRegolithBreak = vi.fn();
    input.onStopRegolithBreak = vi.fn();
    input.isBreakButtonHeld = true;
    input.isLocked = true;
    input.getWorkSpeed = () => 1;

    input._startBreaking();
    expect(input.onStartRegolithBreak).toHaveBeenCalledOnce();

    input.update(BLOCK_INTERACTION_CONFIG.BREAK_TIME);
    expect(input.world.breakBlock).toHaveBeenCalledWith(2, 3, 4);
    expect(input.onStopRegolithBreak).toHaveBeenCalledOnce();
  });

  it('loops the ship sound while a ship block is being broken', () => {
    const input = Object.create(InputController.prototype);
    const hit = {
      hit: true,
      type: 'block',
      x: 2,
      y: 3,
      z: 4,
      block: BLOCK_IDS.NASA_HULL,
    };
    input.getTargetedBlock = vi.fn(() => hit);
    input.playerHand = { triggerSwing: vi.fn() };
    input.world = {
      updateBreakCracks: vi.fn(),
      clearBreakCracks: vi.fn(),
      breakBlock: vi.fn(),
    };
    input.onStartShipBlockBreak = vi.fn();
    input.onStopShipBlockBreak = vi.fn();
    input.isBreakButtonHeld = true;
    input.isLocked = true;
    input.getWorkSpeed = () => 1;

    expect(SHIP_BLOCK_IDS).toContain(BLOCK_IDS.NASA_HULL);
    input._startBreaking();
    expect(input.onStartShipBlockBreak).toHaveBeenCalledOnce();

    input.update(BLOCK_INTERACTION_CONFIG.BREAK_TIME);
    expect(input.world.breakBlock).toHaveBeenCalledWith(2, 3, 4);
    expect(input.onStopShipBlockBreak).toHaveBeenCalledOnce();
  });
});

describe('time skip (issue #109)', () => {
  it('the T key no longer advances time in normal play: sleeping in a bunk does', async () => {
    const { readFileSync } = await import('node:fs');
    const source = readFileSync(new URL('./InputController.js', import.meta.url), 'utf8');
    expect(source).not.toMatch(/advanceTime\(/);
    expect(source).not.toMatch(/'KeyT'/);
  });
});
