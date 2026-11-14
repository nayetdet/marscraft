import { describe, expect, it, vi } from 'vitest';
import { InputController } from './InputController.js';

describe('mobile scope control', () => {
  it('opens the scanner zoomed and closes it on the next tap', () => {
    const input = Object.create(InputController.prototype);
    input.isTouchMode = true;
    input.isLocked = true;
    input.isScannerOpen = false;
    input.isZoomed = false;
    input.isRoverActive = () => false;
    input.survival = { isDead: false };
    input.hud = { isInventoryOpen: false, updateZoomState: vi.fn() };
    input.onToggleZoom = vi.fn();
    const button = { classList: { toggle: vi.fn() } };

    input._handleTouchAction('zoom', button, 1);
    expect(input.onToggleZoom).toHaveBeenLastCalledWith(true, true);
    expect(input.hud.updateZoomState).toHaveBeenLastCalledWith(true, true);
    expect(input.isScannerOpen).toBe(true);
    expect(input.isZoomed).toBe(true);

    input._handleTouchAction('zoom', button, 1);
    expect(input.onToggleZoom).toHaveBeenLastCalledWith(false, false);
    expect(input.hud.updateZoomState).toHaveBeenLastCalledWith(false, false);
    expect(input.isScannerOpen).toBe(false);
    expect(input.isZoomed).toBe(false);
  });
});
