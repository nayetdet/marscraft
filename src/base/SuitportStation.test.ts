// @ts-nocheck
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { SuitportStation } from './SuitportStation.ts';

describe('SuitportStation 3D dock and EVA suit', () => {
  it('opens clamps and hides the docked 3D suit after the equip animation completes', () => {
    const scene = new THREE.Scene();
    const colliders = [];
    const station = new SuitportStation(scene, colliders);

    expect(colliders).toHaveLength(1);
    expect(colliders[0].maxX).toBeLessThanOrEqual(-0.5);

    station.setEquipped(false, false);
    station.update(0.05, { suitEquipped: false, pressurized: true, doorOpen: false });
    expect(station.suitPivot.visible).toBe(true);
    expect(station.clampL.rotation.y).toBeCloseTo(0, 4);

    station.triggerEquip();
    for (let i = 0; i < 30; i++) {
      station.update(0.05, { suitEquipped: true, pressurized: true, doorOpen: false });
    }

    expect(station.isAnimating).toBe(false);
    expect(station.suitPivot.visible).toBe(false);
    expect(station.clampL.rotation.y).toBeLessThan(-0.5);
    expect(station.clampR.rotation.y).toBeGreaterThan(0.5);
    station.dispose();
  });

  it('brings the 3D suit back and closes clamps when docking', () => {
    const scene = new THREE.Scene();
    const station = new SuitportStation(scene, []);
    station.setEquipped(true, false);
    expect(station.suitPivot.visible).toBe(false);

    station.triggerDock();
    for (let i = 0; i < 25; i++) {
      station.update(0.05, { suitEquipped: false, pressurized: true, doorOpen: false });
    }

    expect(station.isAnimating).toBe(false);
    expect(station.suitPivot.visible).toBe(true);
    expect(station.clampL.rotation.y).toBeCloseTo(0, 4);
    expect(station.clampR.rotation.y).toBeCloseTo(0, 4);
    station.dispose();
  });

  it('shows upgrade armor trim and dusty boots based on station state', () => {
    const scene = new THREE.Scene();
    const station = new SuitportStation(scene, []);
    station.setEquipped(false, false);

    station.update(0.05, { suitEquipped: false, suitUpgraded: false, dirtySuit: false });
    expect(station.rig.upgradeTrimMeshes.every((m) => !m.visible)).toBe(true);
    const cleanHex = station.rig.bootMat.color.getHex();

    station.update(0.05, { suitEquipped: false, suitUpgraded: true, dirtySuit: true });
    expect(station.rig.upgradeTrimMeshes.every((m) => m.visible)).toBe(true);
    expect(station.rig.bootMat.color.getHex()).not.toBe(cleanHex);
    station.dispose();
  });
});
