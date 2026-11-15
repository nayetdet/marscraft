import { afterEach, describe, expect, it, vi } from 'vitest';
import { AudioManager } from './AudioManager.js';

function stubAudio() {
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
  return audioInstances;
}

describe('AudioManager rocket sound', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fades out the looping rocket sound and stops it after touchdown', () => {
    const audioInstances = stubAudio();
    const manager = new AudioManager();
    const rocket = audioInstances.find((audio) => audio.src.includes('foguete.wav'));

    expect(rocket.loop).toBe(true);
    manager.playRocket();
    expect(rocket.currentTime).toBe(0);
    expect(rocket.play).toHaveBeenCalledOnce();

    manager.fadeOutRocket();
    manager.update({
      dt: 0.5,
      player: { justLandedFromJump: false },
      survival: { isInDanger: false, isDead: false },
      isGameRunning: false,
      isRoverActive: false,
    });
    expect(rocket.volume).toBeCloseTo(0.35);
    expect(rocket.pause).not.toHaveBeenCalled();

    manager.update({
      dt: 0.5,
      player: { justLandedFromJump: false },
      survival: { isInDanger: false, isDead: false },
      isGameRunning: false,
      isRoverActive: false,
    });
    expect(rocket.pause).toHaveBeenCalledOnce();
    expect(rocket.currentTime).toBe(0);
  });

  it('plays sand impact once per jump landing', () => {
    const audioInstances = stubAudio();
    const manager = new AudioManager();
    const sandFall = audioInstances.find((audio) => audio.src.includes('queda_areia.wav'));
    const player = { justLandedFromJump: true };
    const updateArgs = {
      dt: 0,
      player,
      survival: { isInDanger: false, isDead: false },
      isGameRunning: false,
      isRoverActive: false,
    };

    manager.update(updateArgs);
    manager.update(updateArgs);
    expect(sandFall.play).toHaveBeenCalledOnce();

    player.justLandedFromJump = false;
    manager.update(updateArgs);
    player.justLandedFromJump = true;
    manager.update(updateArgs);
    expect(sandFall.play).toHaveBeenCalledTimes(2);
  });

  it('plays the airlock sound effects as one-shots', () => {
    const audioInstances = stubAudio();
    const manager = new AudioManager();
    const doorOpen = audioInstances.find((audio) => audio.src.includes('porta_abrir.wav'));
    const doorClose = audioInstances.find((audio) => audio.src.includes('porta_fechar.wav'));
    const decompression = audioInstances.find((audio) => audio.src.includes('descompressao.wav'));

    doorOpen.currentTime = 1;
    doorClose.currentTime = 1;
    decompression.currentTime = 1;
    manager.playDoorOpen();
    manager.playDoorClose();
    manager.playDecompression();

    expect(doorOpen.currentTime).toBe(0);
    expect(doorClose.currentTime).toBe(0);
    expect(decompression.currentTime).toBe(0);
    expect(doorOpen.play).toHaveBeenCalledOnce();
    expect(doorClose.play).toHaveBeenCalledOnce();
    expect(decompression.play).toHaveBeenCalledOnce();
    expect(doorOpen.loop).toBe(false);
    expect(doorClose.loop).toBe(false);
    expect(decompression.loop).toBe(false);
  });

  it('plays the regolith placement sound as a one-shot', () => {
    const audioInstances = stubAudio();
    const manager = new AudioManager();
    const regolithPlace = audioInstances.find((audio) => audio.src.includes('colocando_areia.WAV'));

    regolithPlace.currentTime = 1;
    manager.playRegolithPlace();

    expect(regolithPlace.currentTime).toBe(0);
    expect(regolithPlace.play).toHaveBeenCalledOnce();
    expect(regolithPlace.loop).toBe(false);
    expect(regolithPlace.volume).toBe(0.07);
  });

  it('stops the regolith breaking sound when breaking ends', () => {
    const audioInstances = stubAudio();
    const manager = new AudioManager();
    const regolithBreak = audioInstances.find((audio) => audio.src.includes('quebrando_areia.WAV'));

    expect(regolithBreak.src).toContain('quebrando_areia.WAV?v=3');
    expect(regolithBreak.loop).toBe(false);
    manager.playRegolithBreak();
    expect(regolithBreak.currentTime).toBe(0);
    expect(regolithBreak.play).toHaveBeenCalledOnce();

    regolithBreak.currentTime = 0.6;
    manager.stopRegolithBreak();
    expect(regolithBreak.pause).toHaveBeenCalledOnce();
    expect(regolithBreak.currentTime).toBe(0);
  });

  it('loops the ship block breaking sound until it is stopped', () => {
    const audioInstances = stubAudio();
    const manager = new AudioManager();
    const shipBlockBreak = audioInstances.find((audio) => audio.src.includes('quebrando_pedra.WAV'));

    expect(shipBlockBreak.loop).toBe(true);
    manager.playShipBlockBreak();
    expect(shipBlockBreak.currentTime).toBe(0);
    expect(shipBlockBreak.play).toHaveBeenCalledOnce();

    shipBlockBreak.currentTime = 1;
    manager.stopShipBlockBreak();
    expect(shipBlockBreak.pause).toHaveBeenCalledOnce();
    expect(shipBlockBreak.currentTime).toBe(0);
  });

  it('plays a slow, heavy door sound when the airlock is cranked open by hand (issue #79)', () => {
    const audioInstances = stubAudio();
    const manager = new AudioManager();
    const doorSounds = audioInstances.filter((audio) => audio.src.includes('porta_fechar.wav'));
    expect(doorSounds).toHaveLength(2);
    const crank = manager.doorCrank;
    expect(doorSounds).toContain(crank);
    expect(crank).not.toBe(manager.doorClose);
    expect(crank.playbackRate).toBeLessThan(1);
    expect(crank.preservesPitch).toBe(false);
    expect(crank.loop).toBe(false);

    crank.currentTime = 1;
    manager.playManualCrank();
    expect(crank.currentTime).toBe(0);
    expect(crank.play).toHaveBeenCalledOnce();
    expect(manager.doorClose.play).not.toHaveBeenCalled();
  });
});
