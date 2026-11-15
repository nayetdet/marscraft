// @ts-nocheck
import { describe, expect, it, vi } from 'vitest';
import { CutscenePlayer } from './CutscenePlayer.ts';

function fakeHud() {
  return { show: vi.fn(), hide: vi.fn(), setCaption: vi.fn(), setFade: vi.fn() };
}

function scene(overrides = {}) {
  return {
    duration: 4,
    captions: [{ from: 1, to: 2, text: 'hello' }],
    update: vi.fn(),
    onEnd: vi.fn(),
    ...overrides,
  };
}

describe('CutscenePlayer', () => {
  it('is idle until a cutscene plays', () => {
    const player = new CutscenePlayer({ hud: fakeHud() });
    expect(player.isActive).toBe(false);
    player.update(1); // nao quebra sem cena
    player.skip();
  });

  it('shows the layer and poses the scene at time zero when it starts', () => {
    const hud = fakeHud();
    const player = new CutscenePlayer({ hud });
    const def = scene();
    player.play(def);
    expect(player.isActive).toBe(true);
    expect(hud.show).toHaveBeenCalledTimes(1);
    expect(def.update).toHaveBeenCalledWith(0, 0);
  });

  it('advances time and drives the scene every update', () => {
    const player = new CutscenePlayer({ hud: fakeHud() });
    const def = scene();
    player.play(def);
    player.update(0.5);
    player.update(0.25);
    expect(def.update).toHaveBeenLastCalledWith(0.75, 0.25);
  });

  it('sends a caption to the hud only when it changes', () => {
    const hud = fakeHud();
    const player = new CutscenePlayer({ hud });
    player.play(scene());
    hud.setCaption.mockClear();

    player.update(0.5); // ainda sem legenda
    expect(hud.setCaption).not.toHaveBeenCalled();

    player.update(0.6); // t = 1.1
    player.update(0.1); // t = 1.2, mesma legenda
    expect(hud.setCaption).toHaveBeenCalledTimes(1);
    expect(hud.setCaption.mock.calls[0][0].text).toBe('hello');

    player.update(1); // t = 2.2, a legenda saiu
    expect(hud.setCaption).toHaveBeenLastCalledWith(null);
  });

  it('samples the fade track with the scene color', () => {
    const hud = fakeHud();
    const player = new CutscenePlayer({ hud });
    player.play(scene({ fade: [{ t: 0, v: 1 }, { t: 2, v: 0 }], fadeColor: '#fff' }));
    player.update(1);
    const [opacity, color] = hud.setFade.mock.calls.at(-1);
    expect(opacity).toBeCloseTo(0.5);
    expect(color).toBe('#fff');
  });

  it('ends once when the duration is reached', () => {
    const hud = fakeHud();
    const player = new CutscenePlayer({ hud });
    const def = scene();
    player.play(def);
    player.update(3);
    expect(def.onEnd).not.toHaveBeenCalled();
    player.update(5);
    expect(def.update).toHaveBeenLastCalledWith(4, 5);
    expect(def.onEnd).toHaveBeenCalledTimes(1);
    expect(hud.hide).toHaveBeenCalledTimes(1);
    expect(player.isActive).toBe(false);

    player.update(1);
    expect(def.onEnd).toHaveBeenCalledTimes(1);
  });

  it('skip ends the cutscene once', () => {
    const player = new CutscenePlayer({ hud: fakeHud() });
    const def = scene();
    player.play(def);
    player.skip();
    player.skip();
    expect(def.onEnd).toHaveBeenCalledTimes(1);
    expect(player.isActive).toBe(false);
  });

  it('lets onEnd start the next cutscene', () => {
    const player = new CutscenePlayer({ hud: fakeHud() });
    const next = scene();
    player.play(scene({ onEnd: () => player.play(next) }));
    player.skip();
    expect(player.isActive).toBe(true);
    expect(next.update).toHaveBeenCalledWith(0, 0);
  });

  it('reports whether the scene may run without pointer lock', () => {
    const player = new CutscenePlayer({ hud: fakeHud() });
    expect(player.runsUnlocked).toBe(false);
    player.play(scene({ runsUnlocked: true }));
    expect(player.runsUnlocked).toBe(true);
  });
});
