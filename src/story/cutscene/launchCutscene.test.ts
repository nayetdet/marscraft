// @ts-nocheck
import { describe, expect, it, vi } from 'vitest';
import { createLaunchCutscene } from './launchCutscene.ts';

describe('MAV launch cutscene audio cues', () => {
  it('starts the engine at ignition and fades it once during the final visual fade', () => {
    const onIgnition = vi.fn();
    const onFadeOut = vi.fn();
    const cutscene = createLaunchCutscene({
      camera: { position: { set: vi.fn() }, lookAt: vi.fn() },
      rocket: { position: { set: vi.fn() } },
      flame: { setPower: vi.fn() },
      smoke: { emit: vi.fn(), update: vi.fn() },
      pad: { x: 1, y: 2, z: 3 },
      onIgnition,
      onFadeOut,
    });

    cutscene.update(0, 0);
    expect(onIgnition).not.toHaveBeenCalled();
    expect(onFadeOut).not.toHaveBeenCalled();

    cutscene.update(3.5, 3.5);
    cutscene.update(4, 0.5);
    expect(onIgnition).toHaveBeenCalledOnce();
    expect(onFadeOut).not.toHaveBeenCalled();

    cutscene.update(13.5, 9.5);
    cutscene.update(14, 0.5);
    expect(onFadeOut).toHaveBeenCalledOnce();
  });
});
