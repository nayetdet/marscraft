import { describe, expect, it, vi } from 'vitest';
import { InputController } from './InputController.js';
import { BLOCK_IDS } from '../config/blockTypes.js';

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
});

describe('time skip (issue #109)', () => {
  it('the T key no longer advances time in normal play: sleeping in a bunk does', async () => {
    const { readFileSync } = await import('node:fs');
    const source = readFileSync(new URL('./InputController.js', import.meta.url), 'utf8');
    expect(source).not.toMatch(/advanceTime\(/);
    expect(source).not.toMatch(/'KeyT'/);
  });
});

describe('closing inventory', () => {
  it('closes and requests pointer lock on desktop', () => {
    const input = Object.create(InputController.prototype);
    input.isTouchMode = false;
    input.hud = { isInventoryOpen: true, closeInventory: vi.fn() };
    input.domElement = { requestPointerLock: vi.fn() };
    input._toggleInventory();
    expect(input.hud.closeInventory).toHaveBeenCalledOnce();
    expect(input.domElement.requestPointerLock).toHaveBeenCalledOnce();
  });

  it('closes without requesting pointer lock on touch', () => {
    const input = Object.create(InputController.prototype);
    input.isTouchMode = true;
    input.hud = { closeInventory: vi.fn() };
    input.domElement = { requestPointerLock: vi.fn() };
    input._closeInventory();
    expect(input.hud.closeInventory).toHaveBeenCalledOnce();
    expect(input.domElement.requestPointerLock).not.toHaveBeenCalled();
  });

  it('shows the pause menu if pointer lock is rejected', async () => {
    const input = Object.create(InputController.prototype);
    input.isTouchMode = false;
    input.hud = { closeInventory: vi.fn() };
    input.domElement = { requestPointerLock: vi.fn().mockRejectedValue(new Error('denied')) };
    input._showPauseMenu = vi.fn();
    input._closeInventory();
    await vi.waitFor(() => expect(input._showPauseMenu).toHaveBeenCalledOnce());
  });
});
