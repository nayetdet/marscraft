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
  offset: THREE.Vector3;
  direction: THREE.Vector3;
  lookDirection: THREE.Vector3;
};

export function createThirdPersonCameraScratch(): ThirdPersonCameraScratch {
  return {
    offset: new THREE.Vector3(),
    direction: new THREE.Vector3(),
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

  // Orbit opposite the player's full look direction, not just behind their horizontal heading.
  // That keeps both camera position and view moving around the astronaut for yaw and pitch.
  const lookDirection = player.getLookDirection(scratch.lookDirection);
  const offset = scratch.offset.copy(lookDirection).multiplyScalar(-CAMERA_CONFIG.THIRD_PERSON_DISTANCE);
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
  camera.lookAt(player.pos);
}
