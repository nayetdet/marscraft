import * as THREE from 'three';
import { CAMERA_CONFIG } from '../config/constants.ts';

export type ThirdPersonCameraPlayer = {
  pos: THREE.Vector3;
  height: number;
  yaw: number;
  pitch: number;
  getLookDirection: (target?: THREE.Vector3) => THREE.Vector3;
};

export type ThirdPersonCameraWorld = {
  raycast: (
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    maxDistance: number
  ) => { hit: boolean; distance?: number };
};

export type ThirdPersonCameraScratch = {
  back: THREE.Vector3;
  offset: THREE.Vector3;
  direction: THREE.Vector3;
  target: THREE.Vector3;
  lookDirection: THREE.Vector3;
};

export function createThirdPersonCameraScratch(): ThirdPersonCameraScratch {
  return {
    back: new THREE.Vector3(),
    offset: new THREE.Vector3(),
    direction: new THREE.Vector3(),
    target: new THREE.Vector3(),
    lookDirection: new THREE.Vector3(),
  };
}

export function updateThirdPersonCamera(
  camera: THREE.Camera,
  player: ThirdPersonCameraPlayer,
  world: ThirdPersonCameraWorld,
  avatar: THREE.Object3D,
  hand: THREE.Object3D,
  isZoomed: boolean,
  scratch: ThirdPersonCameraScratch
): void {
  avatar.position.set(player.pos.x, player.pos.y - player.height, player.pos.z);
  avatar.rotation.y = player.yaw + Math.PI;

  const back = scratch.back.set(Math.sin(player.yaw), 0, Math.cos(player.yaw));
  const offset = scratch.offset.copy(back).multiplyScalar(CAMERA_CONFIG.THIRD_PERSON_DISTANCE);
  offset.y += CAMERA_CONFIG.THIRD_PERSON_CAMERA_HEIGHT;
  const desiredDistance = offset.length();
  const direction = scratch.direction.copy(offset).normalize();
  const obstruction = world.raycast(player.pos, direction, desiredDistance);
  const safeDistance = obstruction.hit
    ? Math.max(0, (obstruction.distance ?? 0) - CAMERA_CONFIG.THIRD_PERSON_COLLISION_MARGIN)
    : desiredDistance;

  camera.rotation.order = 'YXZ';
  if (obstruction.hit && safeDistance < CAMERA_CONFIG.THIRD_PERSON_FALLBACK_DISTANCE) {
    // In tight spaces, use the eye position so neither the camera nor the avatar clips into a wall.
    avatar.visible = false;
    hand.visible = !isZoomed;
    camera.position.copy(player.pos);
    camera.rotation.y = player.yaw;
    camera.rotation.x = player.pitch;
    return;
  }

  avatar.visible = true;
  hand.visible = false;
  offset.multiplyScalar(safeDistance / desiredDistance);
  camera.position.copy(player.pos).add(offset);

  player.getLookDirection(scratch.lookDirection);
  const target = scratch.target.copy(player.pos)
    .addScaledVector(scratch.lookDirection, CAMERA_CONFIG.REACH_DISTANCE);
  camera.lookAt(target);
}
