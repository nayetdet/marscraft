// @ts-nocheck
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createThirdPersonCameraScratch, updateThirdPersonCamera } from './thirdPersonCamera.ts';

function createPlayer(pitch) {
  return {
    pos: new THREE.Vector3(2, 5, -3),
    height: 1.7,
    yaw: 0.42,
    pitch,
    getLookDirection(target = new THREE.Vector3()) {
      return target.set(0, 0, -1).applyEuler(new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ'));
    },
  };
}

describe('third-person camera', () => {
  it.each([1.2, -1.2])('orbits vertically with the player at pitch %s', (pitch) => {
    const camera = new THREE.PerspectiveCamera();
    const player = createPlayer(pitch);
    const aimDirection = player.getLookDirection(new THREE.Vector3());

    updateThirdPersonCamera(
      camera,
      player,
      { raycast: () => ({ hit: false }) },
      new THREE.Group(),
      new THREE.Group(),
      false,
      createThirdPersonCameraScratch()
    );

    const actualDirection = camera.getWorldDirection(new THREE.Vector3());
    if (pitch > 0) expect(camera.position.y).toBeLessThan(player.pos.y);
    else expect(camera.position.y).toBeGreaterThan(player.pos.y);
    expect(camera.position.x).not.toBe(player.pos.x);
    expect(camera.position.z).not.toBe(player.pos.z);
    expect(actualDirection.dot(aimDirection)).toBeCloseTo(1);
  });

  it('orbits horizontally when the player turns', () => {
    const player = createPlayer(0.2);
    const camera = new THREE.PerspectiveCamera();

    updateThirdPersonCamera(
      camera,
      player,
      { raycast: () => ({ hit: false }) },
      new THREE.Group(),
      new THREE.Group(),
      false,
      createThirdPersonCameraScratch()
    );
    const firstPosition = camera.position.clone();

    player.yaw += Math.PI / 2;
    updateThirdPersonCamera(
      camera,
      player,
      { raycast: () => ({ hit: false }) },
      new THREE.Group(),
      new THREE.Group(),
      false,
      createThirdPersonCameraScratch()
    );

    expect(camera.position.distanceTo(firstPosition)).toBeGreaterThan(1);
  });

  it('falls back to first-person view when there is not enough room behind the astronaut', () => {
    const camera = new THREE.PerspectiveCamera();
    const player = createPlayer(0.3);
    const avatar = new THREE.Group();
    const hand = new THREE.Group();

    updateThirdPersonCamera(
      camera,
      player,
      { raycast: () => ({ hit: true, distance: 0.6 }) },
      avatar,
      hand,
      false,
      createThirdPersonCameraScratch()
    );

    expect(camera.position).toEqual(player.pos);
    expect(avatar.visible).toBe(false);
    expect(hand.visible).toBe(true);
  });
});
