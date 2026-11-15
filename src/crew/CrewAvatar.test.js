import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { CrewAvatar } from './CrewAvatar.js';
import { findRoute, routeLength } from './crewRails.js';

describe('CrewAvatar articulated movement', () => {
  it('bends knees backward (>= 0) and elbows forward (<= 0) smoothly while walking', () => {
    const scene = new THREE.Scene();
    const route = findRoute('quarters', 'hub');
    const len = routeLength(route);
    const member = {
      id: 0,
      name: 'Noor',
      state: 'walking',
      stationary: false,
      node: 'quarters',
      route,
      routeLength: len,
      distance: len * 0.5,
    };

    const avatar = new CrewAvatar(scene, member, 0xf97316);
    for (let i = 0; i < 40; i++) {
      avatar.update(0.05);
      expect(avatar.kneeL.rotation.x).toBeGreaterThanOrEqual(0);
      expect(avatar.kneeR.rotation.x).toBeGreaterThanOrEqual(0);
      expect(avatar.elbowL.rotation.x).toBeLessThanOrEqual(0.001);
      expect(avatar.elbowR.rotation.x).toBeLessThanOrEqual(0.001);
    }
    avatar.dispose();
  });

  it('steers heading smoothly around turns instead of snapping', () => {
    const scene = new THREE.Scene();
    const route = findRoute('quarters', 'hub');
    const member = {
      id: 1,
      name: 'Kai',
      state: 'walking',
      stationary: false,
      node: 'quarters',
      route,
      routeLength: routeLength(route),
      distance: 0,
    };

    const avatar = new CrewAvatar(scene, member, 0x38bdf8);
    avatar.update(0);
    const initialHeading = avatar.group.rotation.y;

    // Stop at quarters (facing Math.PI) and check gradual turn over one small frame
    member.state = 'resting';
    avatar.update(0.05);
    const afterOneFrame = avatar.group.rotation.y;
    expect(afterOneFrame).not.toBeCloseTo(initialHeading, 4);
    expect(Math.abs(afterOneFrame - Math.PI)).toBeGreaterThan(0.05);
    avatar.dispose();
  });
});
