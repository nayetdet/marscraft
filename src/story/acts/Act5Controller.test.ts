// @ts-nocheck
import { describe, expect, it, vi } from 'vitest';
import { MAV_CONFIG, STORY_CONFIG } from '../../config/constants.ts';
import { StoryDirector } from '../StoryDirector.ts';
import { Act5Controller } from './Act5Controller.ts';

// O Continue das duas telas finais e a volta ao modo livre numa partida salva (#411), com um
// motor de mentira: so os campos que o controlador do ato 5 usa.
const PAD = MAV_CONFIG.PAD_POSITION;
const START = 15;

const snap = (extra = {}) => ({
  hours: START, insideHabitat: false, iceCount: 0, iceNeeded: 5, stormPhase: 'calm', stormsSurvived: 0,
  propellantPct: 0, dataSent: false, launched: false, ...extra,
});

function fakeEngine({ touch = false } = {}) {
  const rocketCollider = { scanId: 'lander', minX: PAD.x - 1.2, maxX: PAD.x + 1.2, minY: 0, maxY: 9, minZ: PAD.z - 1.2, maxZ: PAD.z + 1.2 };
  // A capsula de pouso tem o mesmo scanId, mas fica longe da plataforma: nao pode sumir
  const landerCollider = { scanId: 'lander', minX: PAD.x + 40, maxX: PAD.x + 44, minY: 0, maxY: 4, minZ: PAD.z, maxZ: PAD.z + 4 };
  const engine = {
    hours: START,
    saved: null,
    story: new StoryDirector(),
    mission: { launched: false, startStorms: vi.fn(), queueLiveStorms: vi.fn() },
    events: { start: vi.fn() },
    onTutorialComplete: vi.fn(),
    _liveSpaceWeather: null,
    mavRocket: { visible: true, userData: { scanId: 'lander' } },
    customColliders: [{ scanId: 'gym', minX: 0, maxX: 1, minZ: 0, maxZ: 1 }, rocketCollider, landerCollider],
    rocketCollider,
    landerCollider,
    missionHud: { isVictoryShown: false, hideVictory() { this.isVictoryShown = false; } },
    storyHud: { isWindowClosedShown: false, hideWindowClosed() { this.isWindowClosedShown = false; } },
    playerHand: { handGroup: { visible: false } },
    isZoomed: false,
    camera: { rotation: { set: vi.fn() } },
    _updateCamera: vi.fn(),
    _skyHours() { return this.hours; },
    // O mesmo campo que GameEngine._saveGame grava
    _saveGame() { this.saved = { arrivalPlayed: true, freePlay: this.mission.launched }; },
    input: {
      isTouchMode: touch,
      isLocked: false,
      keys: { KeyW: true },
      domElement: { requestPointerLock: vi.fn() },
      _showPauseMenu: vi.fn(),
    },
  };
  return engine;
}

// Leva a historia do motor de mentira ate a corrida final
function race(engine) {
  engine.story.start(snap());
  engine.story.update(snap());
  engine.story.skipTraining();
  engine.story.drainEvents();
}

describe('Act5Controller: Continue on the victory screen', () => {
  function afterLiftoff(options) {
    const engine = fakeEngine(options);
    race(engine);
    engine.mission.launched = true;
    engine.story.update(snap({ hours: START + 5, launched: true }));
    engine.mavRocket.visible = false; // GameEngine._showVictory
    engine.missionHud.isVictoryShown = true;
    return engine;
  }

  it('does nothing while the victory screen is not shown', () => {
    const engine = fakeEngine();
    race(engine);
    expect(new Act5Controller(engine).continueAfterVictory()).toBe(false);
    expect(engine.story.freePlay).toBe(false);
    expect(engine.saved).toBeNull();
  });

  it('closes the screen and keeps the same world running in free play', () => {
    const engine = afterLiftoff();
    expect(new Act5Controller(engine).continueAfterVictory()).toBe(true);
    expect(engine.missionHud.isVictoryShown).toBe(false);
    expect(engine.story.freePlay).toBe(true);
    expect(engine.story.windowHoursLeft).toBeNull();
    // O foguete fica fora da plataforma: sem modelo e sem caixa de colisao
    expect(engine.mavRocket.visible).toBe(false);
    expect(engine.customColliders).not.toContain(engine.rocketCollider);
    expect(engine.customColliders).toContain(engine.landerCollider);
    expect(engine.customColliders).toHaveLength(2);
    // A camera da animacao e desfeita e o mouse volta para o jogo
    expect(engine.camera.rotation.set).toHaveBeenCalledWith(0, 0, 0);
    expect(engine._updateCamera).toHaveBeenCalled();
    expect(engine.playerHand.handGroup.visible).toBe(true);
    expect(engine.input.keys).toEqual({});
    expect(engine.input.domElement.requestPointerLock).toHaveBeenCalled();
  });

  it('saves that the game already lifted off', () => {
    const engine = afterLiftoff();
    new Act5Controller(engine).continueAfterVictory();
    expect(engine.saved).toEqual({ arrivalPlayed: true, freePlay: true });
  });

  it('resumes a touch game without pointer lock', () => {
    const engine = afterLiftoff({ touch: true });
    new Act5Controller(engine).continueAfterVictory();
    expect(engine.input.isLocked).toBe(true);
    expect(engine.input.domElement.requestPointerLock).not.toHaveBeenCalled();
  });
});

describe('Act5Controller: Continue on the window closed screen', () => {
  function windowClosed() {
    const engine = fakeEngine();
    race(engine);
    engine.hours = START + STORY_CONFIG.WINDOW_HOURS + 1;
    engine.story.update(snap({ hours: engine.hours }));
    engine.story.drainEvents();
    engine.storyHud.isWindowClosedShown = true;
    return engine;
  }

  it('does nothing while the screen is not shown', () => {
    const engine = fakeEngine();
    race(engine);
    expect(new Act5Controller(engine).continueAfterWindowClosed()).toBe(false);
    expect(engine.story.launchWindow).toBe(1);
  });

  it('closes the screen and opens a new window from the current game hour', () => {
    const engine = windowClosed();
    expect(new Act5Controller(engine).continueAfterWindowClosed()).toBe(true);
    expect(engine.storyHud.isWindowClosedShown).toBe(false);
    expect(engine.story.act).toBe(2);
    expect(engine.story.launchWindow).toBe(2);
    expect(engine.story.windowHoursLeft).toBeCloseTo(STORY_CONFIG.WINDOW_HOURS);
    expect(engine.input.domElement.requestPointerLock).toHaveBeenCalled();
    // O foguete continua na plataforma: a crianca ainda pode decolar
    expect(engine.mavRocket.visible).toBe(true);
    expect(engine.customColliders).toContain(engine.rocketCollider);
    expect(engine.mission.launched).toBe(false);

    engine.story.update(snap({ hours: engine.hours + 2 }));
    expect(engine.story.windowHoursLeft).toBeCloseTo(STORY_CONFIG.WINDOW_HOURS - 2);
    engine.story.update(snap({ hours: engine.hours + 3, launched: true }));
    expect(engine.story.objectiveId).toBe('done');
    expect(engine.story.launchWindow).toBe(2);
  });
});

describe('Act5Controller: a saved game that had already lifted off', () => {
  it('opens in free play, with no rocket, no final screen and no new story', () => {
    const engine = fakeEngine();
    const act5 = new Act5Controller(engine);
    act5.restoreFreePlay();
    expect(engine.story.freePlay).toBe(true);
    expect(engine.mission.launched).toBe(true);
    expect(engine.mavRocket.visible).toBe(false);
    expect(engine.customColliders).not.toContain(engine.rocketCollider);
    expect(engine.missionHud.isVictoryShown).toBe(false);
    // O save seguinte continua dizendo que a partida ja decolou
    engine._saveGame();
    expect(engine.saved.freePlay).toBe(true);
  });

  it('turns storms and Mars events back on at the first running frame, once', () => {
    const engine = fakeEngine();
    const act5 = new Act5Controller(engine);
    act5.restoreFreePlay();
    act5.update(0.016, snap({ hours: 40 }), false); // menu aberto: ainda nao
    expect(engine.events.start).not.toHaveBeenCalled();
    act5.update(0.016, snap({ hours: 40 }), true);
    act5.update(0.016, snap({ hours: 41 }), true);
    expect(engine.mission.startStorms).toHaveBeenCalledTimes(1);
    expect(engine.mission.startStorms).toHaveBeenCalledWith(40);
    expect(engine.events.start).toHaveBeenCalledTimes(1);
    expect(engine.onTutorialComplete).toHaveBeenCalledTimes(1);
  });

  it('does not touch the world in a normal game', () => {
    const engine = fakeEngine();
    const act5 = new Act5Controller(engine);
    act5.update(0.016, snap(), true);
    expect(engine.mission.startStorms).not.toHaveBeenCalled();
    expect(engine.events.start).not.toHaveBeenCalled();
    expect(engine.mavRocket.visible).toBe(true);
  });
});
