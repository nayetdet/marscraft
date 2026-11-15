import { describe, expect, it } from 'vitest';
import { createRationDeliveryCutscene } from './rationDeliveryCutscene.ts';
import { activeCaption } from './timeline.ts';

function vec(x = 0, y = 0, z = 0) {
  return {
    x,
    y,
    z,
    set(nx: number, ny: number, nz: number) {
      this.x = nx;
      this.y = ny;
      this.z = nz;
    },
  };
}

function actor() {
  return {
    cutsceneControlled: false,
    walkCalls: 0,
    standCalls: 0,
    at: { x: 0, y: 0, z: 0 },
    poseWalking(x: number, y: number, z: number) {
      this.walkCalls++;
      this.at = { x, y, z };
    },
    poseStanding(x: number, y: number, z: number) {
      this.standCalls++;
      this.at = { x, y, z };
    },
  };
}

function prop() {
  return {
    visible: false,
    position: vec(),
    rotation: vec(),
    scale: vec(1, 1, 1),
  };
}

function makeScene() {
  const camera = {
    position: vec(),
    lookedAt: null as { x: number; y: number; z: number } | null,
    lookAt(x: number, y: number, z: number) {
      this.lookedAt = { x, y, z };
    },
  };
  const botanist = actor();
  const cook = actor();
  const cropProp = prop();
  const rationProp = prop();
  const observer = prop();
  const events = { handoff: 0, packed: 0, ended: 0 };

  const def = createRationDeliveryCutscene({
    camera,
    botanist,
    cook,
    cropProp,
    rationProp,
    observer,
    observerPosition: { x: 6.2, z: -21 },
    cropType: 'lettuce',
    botanistName: 'Leo',
    cookName: 'Noor',
    floorY: 10,
    onHandoff: () => {
      events.handoff++;
    },
    onPacked: () => {
      events.packed++;
    },
    onEnd: () => {
      events.ended++;
    },
  });

  return { def, camera, botanist, cook, cropProp, rationProp, observer, events };
}

it('shows the player watching in the background and hides them when the scene ends', () => {
  const { def, observer } = makeScene();
  def.update(0, 0);
  expect(observer.visible).toBe(true);
  expect(observer.position.x).toBe(6.2);
  expect(observer.position.z).toBe(-21);
  def.onEnd();
  expect(observer.visible).toBe(false);
});

function play(def: ReturnType<typeof createRationDeliveryCutscene>, until: number) {
  for (let t = 0; t < until; t += 0.1) def.update(t, 0.1);
  def.update(until, 0.1);
}

describe('ration delivery cutscene', () => {
  it('keeps fade and caption tracks in chronological order', () => {
    const { def } = makeScene();
    for (let i = 1; i < def.fade.length; i++) {
      expect(def.fade[i].t).toBeGreaterThan(def.fade[i - 1].t);
    }
    for (let i = 1; i < def.captions.length; i++) {
      expect(def.captions[i].from).toBeGreaterThanOrEqual(def.captions[i - 1].to);
    }
    expect(activeCaption(def.captions, 1)).toMatchObject({ place: true, text: 'THE KITCHEN' });
    expect(activeCaption(def.captions, 1)?.sub).toContain('Leo');
    expect(activeCaption(def.captions, 3.8)).toMatchObject({ place: true, text: 'PACKING RATIONS' });
    expect(activeCaption(def.captions, 6)).toMatchObject({ place: true, text: 'RATION READY' });
    expect(activeCaption(def.captions, 6)?.sub).toContain('Noor');
  });

  it('walks botanist into the kitchen, hands off the crop, packs the space ration, and cleans up on end', () => {
    const { def, botanist, cook, cropProp, rationProp, events, camera } = makeScene();

    def.update(0, 0.016);
    expect(botanist.cutsceneControlled).toBe(true);
    expect(cook.cutsceneControlled).toBe(true);
    expect(cropProp.visible).toBe(true);
    expect(rationProp.visible).toBe(false);

    play(def, 2.0);
    expect(botanist.walkCalls).toBeGreaterThan(0);
    expect(events.handoff).toBe(0);
    expect(events.packed).toBe(0);
    expect(camera.position.x).toBeGreaterThanOrEqual(6);
    expect(camera.position.x).toBeLessThanOrEqual(16.5);
    expect(camera.position.y).toBeGreaterThanOrEqual(10.5);
    expect(camera.position.y).toBeLessThanOrEqual(13.5);
    expect(camera.position.z).toBeGreaterThanOrEqual(-25);
    expect(camera.position.z).toBeLessThanOrEqual(-16.5);

    play(def, 3.6);
    expect(events.handoff).toBe(1);
    expect(events.packed).toBe(0);

    play(def, def.duration);
    expect(events.handoff).toBe(1);
    expect(events.packed).toBe(1);
    expect(cropProp.visible).toBe(false);
    expect(rationProp.visible).toBe(true);

    def.onEnd();
    expect(events.ended).toBe(1);
    expect(botanist.cutsceneControlled).toBe(false);
    expect(cook.cutsceneControlled).toBe(false);
    expect(cropProp.visible).toBe(false);
    expect(rationProp.visible).toBe(false);
  });
});
