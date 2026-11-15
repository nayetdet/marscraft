// @ts-nocheck
import { describe, expect, it, vi } from 'vitest';
import { ACT3_CONFIG } from '../../config/constants.ts';
import { BOARDING_CAPTIONS } from '../acts/act3Gym.ts';
import { BOARDING_PATH, BOARDING_WALK_END, CARRY_HEIGHT, createBoardingCutscene } from './boardingCutscene.ts';
import { activeCaption, sampleScalar } from './timeline.ts';

const pad = { x: 24, y: 10, z: 20 };
const joint = () => ({ rotation: { x: 0, y: 0, z: 0 } });
const rig = () => ({ legL: joint(), legR: joint(), kneeL: joint(), kneeR: joint(), armL: joint(), armR: joint(), elbowL: joint(), elbowR: joint() });

function vec() {
  return { x: 0, y: 0, z: 0, set(x, y, z) { this.x = x; this.y = y; this.z = z; } };
}

function actor() {
  return {
    cutsceneControlled: false, hidden: false, walking: null, standing: null, x: 0, y: 0, z: 0, overrides: null,
    poseWalking(x, y, z, heading, dt, overrides) { Object.assign(this, { x, y, z, heading, overrides: overrides && { ...overrides }, walking: true }); },
    poseStanding(x, y, z, heading, overrides) { Object.assign(this, { x, y, z, heading, overrides: overrides && { ...overrides }, walking: false }); },
    hide() { this.hidden = true; },
  };
}

function scene(walks, crewCount = 2) {
  const camera = { position: vec(), look: vec(), lookAt(x, y, z) { this.look.set(x, y, z); } };
  const child = { visible: false, position: vec(), rotation: { order: 'XYZ', ...vec() } };
  const rigs = [rig(), rig()];
  const crew = Array.from({ length: crewCount }, actor);
  const onEnd = vi.fn();
  const def = createBoardingCutscene({ camera, child, rigs, crew, pad, walks, onEnd });
  return { camera, child, rigs, crew, onEnd, def };
}

describe('boarding cutscene (#421): walking or carried to the rocket', () => {
  it('lasts the configured seconds, fades in and out, and runs with the mouse free', () => {
    const { def } = scene(true);
    expect(def.duration).toBe(ACT3_CONFIG.BOARDING_SECONDS);
    expect(def.runsUnlocked).toBe(true);
    expect(sampleScalar(def.fade, 0)).toBe(1);
    expect(sampleScalar(def.fade, def.duration / 2)).toBe(0);
    expect(sampleScalar(def.fade, def.duration)).toBe(1);
    expect(BOARDING_WALK_END).toBeLessThan(def.duration);
  });

  it('in good shape the child walks on the ground, from the pad edge to the rocket', () => {
    const { def, child, rigs, crew } = scene(true);
    expect(def.walks).toBe(true);
    def.update(0, 0);
    expect(child.visible).toBe(true);
    expect(child.position.x).toBeCloseTo(pad.x + BOARDING_PATH.from.x, 6);
    expect(child.position.z).toBeCloseTo(pad.z + BOARDING_PATH.from.z, 6);
    expect(crew.every((a) => a.cutsceneControlled)).toBe(true);

    def.update(1.3, 0.1);
    // Os pes ficam no chao (so o balanco do passo) e as pernas alternam
    expect(child.position.y - pad.y).toBeLessThan(0.05);
    expect(child.rotation.x).toBe(0);
    expect(rigs[0].legL.rotation.x).toBeCloseTo(-rigs[0].legR.rotation.x, 6);
    expect(Math.abs(rigs[0].legL.rotation.x)).toBeGreaterThan(0.05);
    expect(rigs[1].legL.rotation.x).toBe(rigs[0].legL.rotation.x);
    // A tripulacao anda ao lado, sem carregar ninguem
    expect(crew.every((a) => a.walking === true && a.overrides === null)).toBe(true);

    def.update(BOARDING_WALK_END + 0.5, 0.1);
    expect(child.position.x).toBeCloseTo(pad.x + BOARDING_PATH.to.x, 6);
    expect(child.position.z).toBeCloseTo(pad.z + BOARDING_PATH.to.z, 6);
    // Chegou: bracos para cima
    expect(rigs[0].armL.rotation.x).toBeLessThan(-2);
    expect(crew.every((a) => a.walking === false)).toBe(true);
  });

  it('in bad shape the crew carries the child: off the ground, leaning back, between two crew', () => {
    const { def, child, rigs, crew } = scene(false);
    expect(def.walks).toBe(false);
    def.update(0, 0);
    def.update(2, 0.1);
    expect(child.position.y - pad.y).toBeGreaterThan(CARRY_HEIGHT - 0.05);
    expect(child.rotation.x).toBeLessThan(0);
    expect(child.rotation.order).toBe('YXZ');
    // Sentada: pernas para a frente e joelhos dobrados, sem passo
    expect(rigs[0].legL.rotation.x).toBe(rigs[0].legR.rotation.x);
    expect(rigs[0].kneeL.rotation.x).toBeGreaterThan(0.5);
    // Os dois tripulantes ficam um de cada lado, colados, com os bracos fazendo o assento
    const [left, right] = crew;
    expect((left.x + right.x) / 2).toBeCloseTo(child.position.x, 1);
    expect((left.z + right.z) / 2).toBeCloseTo(child.position.z, 1);
    expect(Math.hypot(left.x - right.x, left.z - right.z)).toBeLessThan(1.3);
    expect(left.overrides.armL).toBeLessThan(-0.5);
    expect(right.overrides.armR).toBeLessThan(-0.5);

    def.update(def.duration, 0.1);
    expect(child.position.x).toBeCloseTo(pad.x + BOARDING_PATH.to.x, 6);
    expect(child.position.y - pad.y).toBeCloseTo(CARRY_HEIGHT, 6);
  });

  it('the two versions say different things, and both say it is a game rule', () => {
    const walk = scene(true).def;
    const carry = scene(false).def;
    expect(activeCaption(walk.captions, 1).text).toBe(BOARDING_CAPTIONS.walkTitle);
    expect(activeCaption(walk.captions, 1).sub).toBe(BOARDING_CAPTIONS.walkSub);
    expect(activeCaption(carry.captions, 1).text).toBe(BOARDING_CAPTIONS.carryTitle);
    expect(activeCaption(carry.captions, 1).sub).toBe(BOARDING_CAPTIONS.carrySub);
    for (const def of [walk, carry]) expect(activeCaption(def.captions, 5).sub).toBe(BOARDING_CAPTIONS.rule);
  });

  it('stays on the launch pad, where the ground is flat', () => {
    for (const point of [BOARDING_PATH.from, BOARDING_PATH.to]) {
      expect(Math.abs(point.x)).toBeLessThanOrEqual(3.5);
      expect(Math.abs(point.z)).toBeLessThanOrEqual(3.5);
    }
  });

  it('at the end everyone boards: crew released and hidden, child hidden and standing again', () => {
    const { def, child, rigs, crew, onEnd } = scene(false);
    def.update(0, 0);
    def.update(3, 0.1);
    def.onEnd();
    expect(crew.every((a) => !a.cutsceneControlled && a.hidden)).toBe(true);
    expect(child.visible).toBe(false);
    expect(child.rotation.x).toBe(0);
    expect(rigs[0].legL.rotation.x).toBe(0);
    expect(rigs[0].kneeL.rotation.x).toBe(0);
    expect(onEnd).toHaveBeenCalledOnce();
  });

  it('works with fewer than 2 crew members, and uses at most 2', () => {
    const alone = scene(false, 0);
    expect(() => { alone.def.update(0, 0); alone.def.update(2, 0.1); alone.def.onEnd(); }).not.toThrow();
    const many = scene(true, 4);
    many.def.update(0, 0);
    expect(many.crew.map((a) => a.cutsceneControlled)).toEqual([true, true, false, false]);
  });
});
