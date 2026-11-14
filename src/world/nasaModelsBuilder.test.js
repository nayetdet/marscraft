import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { mergeByMaterial } from './nasaModelsBuilder.js';
import { targetCrop, removeCrop } from './cropInteraction.js';

function box(parent, mat, x, y, z) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), mat);
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}

// Cena minima: uma mesa (2 materiais) e duas plantas colhiveis dentro de um grupo deslocado
function buildScene() {
  const white = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const gray = new THREE.MeshLambertMaterial({ color: 0x888888 });
  const stem = new THREE.MeshLambertMaterial({ color: 0x16a34a });
  const potato = new THREE.MeshLambertMaterial({ color: 0xd97706 });

  const group = new THREE.Group();
  const desk = new THREE.Group();
  box(desk, white, 0, 0, 0);
  box(desk, white, 1, 0, 0);
  box(desk, gray, 2, 0, 0);
  group.add(desk);

  const crops = new THREE.Group();
  crops.position.set(-18, 10, 0);
  const plants = [-2, 2].map((z) => {
    const plant = new THREE.Group();
    plant.position.set(0.5, 0, z);
    box(plant, stem, 0, 0.24, 0);
    box(plant, potato, 0.16, 0.07, 0.14);
    crops.add(plant);
    return plant;
  });
  group.add(crops);
  return { group, plants, stem };
}

describe('mergeByMaterial', () => {
  it('junta as caixas estaticas em uma malha por material', () => {
    const { group, plants } = buildScene();
    const merged = mergeByMaterial(group, plants);

    const staticMeshes = merged.children.filter((c) => c.isMesh);
    expect(staticMeshes).toHaveLength(2); // branco + cinza
  });

  it('mantem cada planta como objeto proprio, numa malha unica com a cor do material original', () => {
    const { group, plants, stem } = buildScene();
    const merged = mergeByMaterial(group, plants);

    for (const plant of plants) {
      expect(plant.parent).toBe(merged);
      expect(plant.children).toHaveLength(1);
      const mesh = plant.children[0];
      expect(mesh.material.vertexColors).toBe(true);
      const colors = mesh.geometry.attributes.color;
      expect(colors.getX(0)).toBeCloseTo(stem.color.r, 6);
      expect(colors.getY(0)).toBeCloseTo(stem.color.g, 6);
    }
    // Posicao no mundo preservada ao trocar de pai
    const world = new THREE.Vector3();
    plants[0].getWorldPosition(world);
    expect(world.toArray()).toEqual([-17.5, 10, -2]);
  });

  it('a planta continua sendo mirada pelo raycast e so ela some ao ser colhida', () => {
    const { group, plants } = buildScene();
    const merged = mergeByMaterial(group, plants);
    merged.updateMatrixWorld(true);

    const colliders = plants.map((p) => {
      p.userData.collider = { id: p.uuid };
      return p.userData.collider;
    });
    const target = plants[0];
    const origin = new THREE.Vector3(-17.5, 10.24, 0);
    const dir = new THREE.Vector3(0, 0, -1);

    const hit = targetCrop(plants, origin, dir, 6.5, { hit: false });
    expect(hit.type).toBe('crop');
    expect(hit.plant).toBe(target);

    expect(removeCrop(hit.plant, plants, colliders)).toBe(true);
    expect(target.parent).toBeNull();
    expect(plants).toHaveLength(1);
    expect(colliders).toHaveLength(1);
    expect(merged.children).toContain(plants[0]);
  });
});
