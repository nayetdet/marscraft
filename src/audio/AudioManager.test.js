import { afterEach, describe, expect, it, vi } from 'vitest';
import { AudioManager } from './AudioManager.js';

describe('AudioManager rocket sound', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('plays the rocket sound once and stops it when the arrival cutscene ends', () => {
    const audioInstances = [];
    vi.stubGlobal('Audio', vi.fn(function AudioStub(src) {
      const audio = {
        src,
        currentTime: 0,
        loop: false,
        volume: 1,
        play: vi.fn().mockResolvedValue(),
        pause: vi.fn(),
      };
      audioInstances.push(audio);
      return audio;
    }));

    const manager = new AudioManager();
    const rocket = audioInstances.find((audio) => audio.src.includes('foguete.wav'));

    expect(rocket.loop).toBe(false);
    manager.playRocket();
    expect(rocket.currentTime).toBe(0);
    expect(rocket.play).toHaveBeenCalledOnce();

    manager.stopRocket();
    expect(rocket.pause).toHaveBeenCalledOnce();
    expect(rocket.currentTime).toBe(0);
  });
});
