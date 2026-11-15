import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { buildIvaAstronautRig } from './spacesuitModel.ts';

describe('buildIvaAstronautRig', () => {
  it('builds a multi-part sculpted cadet head (not a single cube)', () => {
    const rig = buildIvaAstronautRig({ accentColor: 0xea580c });

    expect(rig.bodyGroup).toBeInstanceOf(THREE.Group);
    expect(rig.headGroup).toBeInstanceOf(THREE.Group);
    expect(rig.headGroup.children.length).toBeGreaterThan(5);

    const headMesh = rig.headGroup.children[0] as THREE.Mesh;
    const params = (headMesh.geometry as THREE.BoxGeometry).parameters;
    expect(params.width).not.toBe(params.height);
    expect(params.height).not.toBe(params.depth);
  });
});
