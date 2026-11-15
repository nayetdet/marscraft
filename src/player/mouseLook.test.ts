// @ts-nocheck
import { describe, it, expect, vi } from 'vitest';
import { applyMouseLook, isMouseSpike, requestRawPointerLock } from './mouseLook.ts';
import { INPUT_CONFIG } from '../config/constants.ts';

describe('mouse look', () => {
  it('turns the camera by the mouse delta times the sensitivity', () => {
    const player = { yaw: 0, pitch: 0 };
    expect(applyMouseLook(player, 100, 50, false)).toBe(true);
    expect(player.yaw).toBeCloseTo(-100 * INPUT_CONFIG.MOUSE_SENSITIVITY);
    expect(player.pitch).toBeCloseTo(-50 * INPUT_CONFIG.MOUSE_SENSITIVITY);
  });

  it('uses the lower sensitivity while zoomed', () => {
    const player = { yaw: 0, pitch: 0 };
    applyMouseLook(player, 100, 0, true);
    expect(player.yaw).toBeCloseTo(-100 * INPUT_CONFIG.ZOOM_SENSITIVITY);
  });

  it('drops a single absurd delta instead of jumping', () => {
    const player = { yaw: 1, pitch: 0.2 };
    const spike = INPUT_CONFIG.MAX_MOUSE_DELTA + 1;
    expect(isMouseSpike(spike, 0)).toBe(true);
    expect(isMouseSpike(0, -spike)).toBe(true);
    expect(applyMouseLook(player, -spike, 3, false)).toBe(false);
    expect(player).toEqual({ yaw: 1, pitch: 0.2 });
  });

  it('keeps a fast but real flick at the limit', () => {
    const player = { yaw: 0, pitch: 0 };
    expect(applyMouseLook(player, INPUT_CONFIG.MAX_MOUSE_DELTA, 0, false)).toBe(true);
    expect(player.yaw).not.toBe(0);
  });

  it('clamps the pitch so the camera never flips over', () => {
    const player = { yaw: 0, pitch: 0 };
    for (let i = 0; i < 20; i++) applyMouseLook(player, 0, -300, false);
    expect(player.pitch).toBeLessThan(Math.PI / 2);
    expect(player.pitch).toBeCloseTo(Math.PI / 2 - 0.02);
  });
});

describe('requestRawPointerLock', () => {
  it('asks for unadjusted movement', () => {
    const element = { requestPointerLock: vi.fn(() => Promise.resolve()) };
    requestRawPointerLock(element);
    expect(element.requestPointerLock).toHaveBeenCalledWith({ unadjustedMovement: true });
  });

  it('falls back to a plain lock when the option is not supported', async () => {
    const error = Object.assign(new Error('nope'), { name: 'NotSupportedError' });
    const element = {
      requestPointerLock: vi.fn()
        .mockReturnValueOnce(Promise.reject(error))
        .mockReturnValueOnce(Promise.resolve()),
    };
    requestRawPointerLock(element);
    await Promise.resolve();
    await Promise.resolve();
    expect(element.requestPointerLock).toHaveBeenCalledTimes(2);
    expect(element.requestPointerLock).toHaveBeenLastCalledWith();
  });

  it('does not retry on other errors (e.g. lock requested too soon after Esc)', async () => {
    const error = Object.assign(new Error('too soon'), { name: 'SecurityError' });
    const element = { requestPointerLock: vi.fn(() => Promise.reject(error)) };
    requestRawPointerLock(element);
    await Promise.resolve();
    await Promise.resolve();
    expect(element.requestPointerLock).toHaveBeenCalledTimes(1);
  });

  it('works with browsers where requestPointerLock returns nothing', () => {
    const element = { requestPointerLock: vi.fn(() => undefined) };
    expect(() => requestRawPointerLock(element)).not.toThrow();
  });
});
