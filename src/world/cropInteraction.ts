// @ts-nocheck
import * as THREE from 'three';

export function targetCrop(plants, origin, direction, maxDistance, voxelHit) {
  const raycaster = new THREE.Raycaster(origin, direction, 0, maxDistance);
  const intersections = raycaster.intersectObjects(plants, true);
  const hit = intersections[0];
  if (!hit || (voxelHit.hit && hit.distance >= voxelHit.distance)) return voxelHit;

  let plant = hit.object;
  while (plant && !plants.includes(plant)) plant = plant.parent;
  return plant ? { hit: true, type: 'crop', plant } : voxelHit;
}

export function removeCrop(plant, plants, colliders) {
  const index = plants.indexOf(plant);
  if (index < 0) return false;
  plants.splice(index, 1);
  const colliderIndex = colliders.indexOf(plant.userData.collider);
  if (colliderIndex >= 0) colliders.splice(colliderIndex, 1);
  plant.removeFromParent();
  return true;
}
