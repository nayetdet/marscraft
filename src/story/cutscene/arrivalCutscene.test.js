import { describe, expect, it, vi } from 'vitest';
import { createArrivalCutscene } from './arrivalCutscene.js';

describe('arrival cutscene', () => {
  it('signals touchdown exactly once when the lander reaches the ground', () => {
    const onTouchdown = vi.fn();
    const camera = {
      position: {
        x: 0,
        y: 0,
        set(x, y, z) {
          this.x = x;
          this.y = y;
          this.z = z;
        },
      },
      lookAt: vi.fn(),
    };
    const cutscene = createArrivalCutscene({
      camera,
      lander: { position: { set: vi.fn() }, rotation: { set: vi.fn() } },
      flame: { setPower: vi.fn() },
      dust: { emit: vi.fn(), burstRing: vi.fn(), update: vi.fn() },
      site: { x: 0, z: 0 },
      groundY: 10,
      millionKm: 100,
      onTouchdown,
    });

    cutscene.update(9.49, 0.01);
    expect(onTouchdown).not.toHaveBeenCalled();

    cutscene.update(9.5, 0.01);
    expect(onTouchdown).toHaveBeenCalledOnce();

    cutscene.update(9.51, 0.01);
    expect(onTouchdown).toHaveBeenCalledOnce();
  });
});
