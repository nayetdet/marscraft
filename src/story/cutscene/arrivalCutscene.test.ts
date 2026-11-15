// @ts-nocheck
import { describe, expect, it } from 'vitest';
import { createArrivalCutscene } from './arrivalCutscene.ts';
import { activeCaption } from './timeline.ts';

const PLACES = {
  base: { x: 0, y: 9, z: -2 },
  solar: { x: -27, y: 9, z: -23 },
  greenhouse: { x: -27, y: 9, z: 0 },
  ice: { x: 30, y: 6, z: -22 },
  rocket: { x: 24, y: 9, z: 20 },
};
const ROCKET_HOME = { x: 24, y: 9.4, z: 20 };
// A Terra no ceu, a noroeste e a meia altura

function vec(x = 0, y = 0, z = 0) {
  return { x, y, z, set(nx, ny, nz) { this.x = nx; this.y = ny; this.z = nz; } };
}

function scene(overrides = {}) {
  const camera = { position: vec(), lookedAt: null, lookAt(x, y, z) { this.lookedAt = { x, y, z }; } };
  const calls = { touchdown: 0 };
  const rocket = { position: vec(ROCKET_HOME.x, ROCKET_HOME.y, ROCKET_HOME.z), rotation: vec() };
  const rocketFlame = { power: 0, setPower(power) { this.power = power; } };
  const def = createArrivalCutscene({
    camera,
    lander: { position: vec(), rotation: vec() },
    flame: { setPower() {} },
    dust: { emit() {}, burstRing() {}, update() {} },
    site: { x: -13, z: 23 },
    groundY: 9,
    millionKm: 198,
    places: PLACES,
    rocket,
    rocketFlame,
    onTouchdown: () => { calls.touchdown++; },
    ...overrides,
  });
  return { def, camera, calls, rocket, rocketFlame };
}

// Toca a animacao do comeco ate `until`, em passos pequenos
function play(def, until) {
  for (let t = 0; t < until; t += 0.1) def.update(t, 0.1);
  def.update(until, 0.1);
}

const caption = (def, text) => def.captions.find((c) => c.text === text);

describe('arrival cutscene', () => {
  it('names every place of the base, then the routine, and ends on the mission', () => {
    const { def } = scene();
    const tour = def.captions.filter((c) => c.place);
    expect(tour.map((c) => c.text)).toEqual([
      'THE BASE', 'SOLAR PANELS', 'GREENHOUSE', 'ICE CRATER', 'THE ROCKET', 'EVERY TRIP', 'YOUR MISSION',
    ]);
    expect(caption(def, 'YOUR MISSION').sub).toBe('Find 3 clues. Fill the rocket. Fly home.');
    expect(def.captions.at(-1)).toMatchObject({ big: true, text: 'SOL 1' });
    expect(def.captions.at(-1).to).toBeCloseTo(def.duration);
  });

  it('gives every sentence enough time on screen: at most 2 words per second', () => {
    const { def } = scene();
    for (const c of def.captions.filter((item) => item.place)) {
      const words = c.sub.split(' ').length;
      expect(words / (c.to - c.from)).toBeLessThanOrEqual(2);
    }
  });

  it('keeps the fade and caption tracks in time order', () => {
    const { def } = scene();
    for (let i = 1; i < def.fade.length; i++) expect(def.fade[i].t).toBeGreaterThan(def.fade[i - 1].t);
    for (let i = 1; i < def.captions.length; i++) expect(def.captions[i].from).toBeGreaterThanOrEqual(def.captions[i - 1].to);
  });

  it('points the camera at each place while its name is on screen', () => {
    const { def, camera } = scene();
    const places = { 'THE BASE': 'base', 'SOLAR PANELS': 'solar', GREENHOUSE: 'greenhouse', 'ICE CRATER': 'ice', 'THE ROCKET': 'rocket', 'EVERY TRIP': 'rocket' };
    for (const [text, place] of Object.entries(places)) {
      const c = caption(def, text);
      const t = (c.from + c.to) / 2;
      play(def, t);
      expect(activeCaption(def.captions, t)).toBe(c);
      expect(camera.lookedAt.x).toBe(PLACES[place].x);
      expect(camera.lookedAt.z).toBe(PLACES[place].z);
    }
  });

  it('tells the game about the touchdown once, so the engine sound can fade out', () => {
    const { def, calls } = scene();
    play(def, 9);
    expect(calls.touchdown).toBe(0);
    play(def, def.duration);
    expect(calls.touchdown).toBe(1);
  });

  it('signals touchdown exactly when the lander reaches the ground', () => {
    const { def, calls } = scene();
    def.update(9.49, 0.01);
    expect(calls.touchdown).toBe(0);
    def.update(9.5, 0.01);
    expect(calls.touchdown).toBe(1);
    def.update(9.51, 0.01);
    expect(calls.touchdown).toBe(1);
  });

  it('keeps the rocket on the pad, engine off, for the whole animation: no launch preview', () => {
    const { def, rocket, rocketFlame } = scene();
    for (const t of [caption(def, 'EVERY TRIP').to, caption(def, 'YOUR MISSION').from + 0.5, caption(def, 'YOUR MISSION').to, def.duration]) {
      play(def, t);
      expect(rocket.position).toMatchObject(ROCKET_HOME);
      expect(rocket.rotation.x).toBeCloseTo(0);
      expect(rocket.rotation.z).toBeCloseTo(0);
      expect(rocketFlame.power).toBe(0);
    }
  });
});
