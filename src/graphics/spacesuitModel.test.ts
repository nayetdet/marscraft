import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { CREW_PROFILES } from '../crew/crewProfiles.ts';
import { buildIvaAstronautRig, buildSpacesuitRig } from './spacesuitModel.ts';

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

describe('buildSpacesuitRig open helmet visor for NPCs', () => {
  it('keeps an opaque gold visor when no crew profile is given (empty suitport / player EVA)', () => {
    const rig = buildSpacesuitRig({ accentColor: 0xea580c });
    expect(rig.visorMat.transparent).toBe(false);
    expect(rig.headGroup.children.some((obj) => Array.isArray((obj as THREE.Mesh).material))).toBe(false);
  });

  it('builds a transparent glass visor and visible cadet-style face inside the helmet when crewProfile is given', () => {
    const rig = buildSpacesuitRig({
      accentColor: 0xea580c,
      instanced: true,
      crewProfile: CREW_PROFILES[0],
    });
    expect(rig.visorMat.transparent).toBe(true);
    expect(rig.visorMat.depthWrite).toBe(false);

    const faceMesh = rig.headGroup.children.find(
      (obj) => (obj as THREE.Mesh).isMesh && Array.isArray((obj as THREE.Mesh).material)
    ) as THREE.Mesh | undefined;
    expect(faceMesh).toBeDefined();
    expect(faceMesh?.material).toHaveLength(6);
  });
});
