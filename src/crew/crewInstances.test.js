import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { CrewAvatar } from './CrewAvatar.js';
import { CrewInstances } from './crewInstances.js';
import { findRoute, routeLength } from './crewRails.js';

function member(id) {
  const route = findRoute('quarters', 'hub');
  return { id, name: `Crew ${id}`, state: 'walking', stationary: false, node: 'quarters', route, routeLength: routeLength(route), distance: 1 };
}

describe('CrewInstances', () => {
  it('shares one set of batches per scene', () => {
    const scene = new THREE.Scene();
    expect(CrewInstances.for(scene)).toBe(CrewInstances.for(scene));
    expect(CrewInstances.for(new THREE.Scene())).not.toBe(CrewInstances.for(scene));
  });

  it('draws every suit box in two batches instead of one mesh per box', () => {
    const scene = new THREE.Scene();
    const avatars = [0, 1, 2].map((id) => new CrewAvatar(scene, member(id), 0xf97316));
    for (const avatar of avatars) avatar.update(0.05);
    const instances = CrewInstances.for(scene);
    instances.sync();

    expect(instances.plain.count).toBeGreaterThan(100);
    expect(instances.lamp.count).toBeGreaterThan(0);
    expect(instances.plain.count % 3).toBe(0);
    // What is left as a real mesh per suit: visor, chest panel, two status lights and the shadow box
    let meshes = 0;
    avatars[0].group.traverse((obj) => { if (obj.isMesh) meshes++; });
    expect(meshes).toBeLessThanOrEqual(5);
  });

  it('puts each box where its joint is, with the size of the box', () => {
    const scene = new THREE.Scene();
    const avatar = new CrewAvatar(scene, member(0), 0xf97316);
    avatar.update(0.05);
    const instances = CrewInstances.for(scene);
    instances.sync();

    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const scale = new THREE.Vector3();
    const rotation = new THREE.Quaternion();
    for (let i = 0; i < instances.plain.count; i++) {
      instances.plain.getMatrixAt(i, matrix);
      matrix.decompose(position, rotation, scale);
      // Every box of the suit is near the avatar, between the floor and the top of the helmet
      expect(position.distanceTo(avatar.position)).toBeLessThan(2.4);
      expect(position.y).toBeGreaterThan(avatar.position.y - 0.05);
      expect(Math.max(scale.x, scale.y, scale.z)).toBeLessThan(0.7);
      expect(Math.min(scale.x, scale.y, scale.z)).toBeGreaterThan(0.01);
    }
  });

  it('follows the suit color (a weak crew member turns gray)', () => {
    const scene = new THREE.Scene();
    const crew = member(0);
    const avatar = new CrewAvatar(scene, crew, 0xf97316);
    const instances = CrewInstances.for(scene);
    const colors = () => {
      instances.sync();
      const seen = new Set();
      const color = new THREE.Color();
      for (let i = 0; i < instances.plain.count; i++) {
        instances.plain.getColorAt(i, color);
        seen.add(color.getHexString());
      }
      return seen;
    };
    avatar.update(0.05);
    const healthy = colors();
    crew.state = 'weak';
    avatar.update(0.05);
    const weak = colors();
    expect(healthy.has('f8fafc')).toBe(true);
    expect(weak.has('f8fafc')).toBe(false);
    expect(weak.has('b8c0cc')).toBe(true);
  });

  it('skips hidden suits and forgets disposed ones', () => {
    const scene = new THREE.Scene();
    const a = new CrewAvatar(scene, member(0), 0xf97316);
    const b = new CrewAvatar(scene, member(1), 0x38bdf8);
    const instances = CrewInstances.for(scene);
    instances.sync();
    const both = instances.plain.count;

    a.hide();
    instances.sync();
    expect(instances.plain.count).toBe(both / 2);

    b.dispose();
    instances.sync();
    expect(instances.plain.count).toBe(0);
  });
});
