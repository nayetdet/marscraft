// @ts-nocheck
import { describe, expect, it } from 'vitest';
import { GRAPHICS_CONFIG } from '../../config/constants.ts';
import { FrameBudgetGuard, SHADER_PREF, readShaderPref, resolveShaderMode, writeShaderPref } from './shaderSettings.ts';

function fakeStorage(initial = {}) {
  const data = { ...initial };
  return {
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => { data[key] = String(value); },
    data,
  };
}

describe('resolveShaderMode', () => {
  it('keeps shaders off by default until the player chooses otherwise', () => {
    expect(resolveShaderMode({ pref: null })).toEqual({ enabled: false, auto: true });
  });

  it('lets the saved player choice win over the automatic rule', () => {
    expect(resolveShaderMode({ pref: SHADER_PREF.ON })).toEqual({ enabled: true, auto: false });
    expect(resolveShaderMode({ pref: SHADER_PREF.OFF })).toEqual({ enabled: false, auto: false });
  });

  it('stays off after the performance guard turned it off', () => {
    expect(resolveShaderMode({ pref: SHADER_PREF.AUTO_OFF })).toEqual({ enabled: false, auto: true });
  });
});

describe('shader preference storage', () => {
  it('round-trips a valid preference', () => {
    const storage = fakeStorage();
    writeShaderPref(storage, SHADER_PREF.OFF);
    expect(storage.data[GRAPHICS_CONFIG.STORAGE_KEY]).toBe('off');
    expect(readShaderPref(storage)).toBe(SHADER_PREF.OFF);
  });

  it('ignores unknown values, missing storage and storage that throws', () => {
    expect(readShaderPref(fakeStorage({ [GRAPHICS_CONFIG.STORAGE_KEY]: 'ultra' }))).toBe(null);
    expect(readShaderPref(null)).toBe(null);
    const broken = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
    expect(readShaderPref(broken)).toBe(null);
    expect(() => writeShaderPref(broken, SHADER_PREF.ON)).not.toThrow();
  });
});

describe('FrameBudgetGuard', () => {
  const run = (guard, frameMs, seconds) => {
    let tripped = false;
    for (let t = 0; t < seconds * 1000; t += frameMs) tripped = guard.sample(frameMs) || tripped;
    return tripped;
  };

  it('trips when the average stays under the minimum FPS', () => {
    const guard = new FrameBudgetGuard({ minFps: 26, seconds: 6, warmupSeconds: 4 });
    expect(run(guard, 66, 11)).toBe(true); // ~15 FPS
  });

  it('does not trip at a healthy frame rate', () => {
    const guard = new FrameBudgetGuard({ minFps: 26, seconds: 6, warmupSeconds: 4 });
    expect(run(guard, 16.7, 30)).toBe(false);
  });

  it('ignores the warm-up, when shaders are still compiling', () => {
    const guard = new FrameBudgetGuard({ minFps: 26, seconds: 6, warmupSeconds: 4 });
    expect(run(guard, 100, 4)).toBe(false);
    expect(run(guard, 16.7, 10)).toBe(false);
  });

  it('ignores very long frames (tab in the background)', () => {
    const guard = new FrameBudgetGuard({ minFps: 26, seconds: 1, warmupSeconds: 0 });
    for (let i = 0; i < 20; i++) expect(guard.sample(2000)).toBe(false);
  });

  it('starts over after reset', () => {
    const guard = new FrameBudgetGuard({ minFps: 26, seconds: 2, warmupSeconds: 0 });
    run(guard, 66, 1.5);
    guard.reset();
    expect(run(guard, 66, 1.5)).toBe(false);
  });
});
