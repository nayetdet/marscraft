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
