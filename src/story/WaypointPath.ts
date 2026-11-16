import * as THREE from 'three';
import { WAYPOINT_PATH_CONFIG } from '../config/constants.ts';
import {
  PathfinderScratch,
  buildPathDashes,
  findGroundPath,
  type PathCollider,
  type PathWorldLookup,
  type Point2D,
} from './waypointPathLogic.ts';

const VERTICES_PER_DASH = 4;
const INDICES_PER_DASH = 6;
const MAX_DASHES = WAYPOINT_PATH_CONFIG.MAX_DASHES;

export type WaypointPathTarget = {
  x: number;
  y: number;
  z: number;
};

export type WaypointPathUpdateInput = {
  dt: number;
  target: WaypointPathTarget | null;
  startX: number;
  startY: number;
  startZ: number;
  inside: boolean;
  roverActive: boolean;
  world: PathWorldLookup;
  colliders?: readonly PathCollider[];
  ignoredColliders?: ReadonlySet<PathCollider> | null;
};

/**
 * Low-opacity yellow dashed path on the ground/floor guiding the player toward the active quest.
 */
export class WaypointPath {
  readonly mesh: THREE.Mesh;
  private readonly positions: Float32Array;
  private readonly colors: Float32Array;
  private readonly scratch = new PathfinderScratch();
  private cachedPath: Point2D[] = [];
  private time = 0;
  private repathTimer = 0;
  private lastStartBx = NaN;
  private lastStartBz = NaN;
  private lastGoalBx = NaN;
  private lastGoalBz = NaN;
  private lastTargetX = NaN;
  private lastTargetZ = NaN;
  private lastInside: boolean | null = null;
  private lastRoverActive: boolean | null = null;

  constructor(scene: THREE.Scene) {
    const geometry = new THREE.BufferGeometry();
    this.positions = new Float32Array(MAX_DASHES * VERTICES_PER_DASH * 3);
    this.colors = new Float32Array(MAX_DASHES * VERTICES_PER_DASH * 4);
    const uvs = new Float32Array(MAX_DASHES * VERTICES_PER_DASH * 2);
    const indices = new Uint16Array(MAX_DASHES * INDICES_PER_DASH);

    for (let i = 0; i < MAX_DASHES; i += 1) {
      const vertex = i * VERTICES_PER_DASH;
      uvs.set([0, 0, 1, 0, 1, 1, 0, 1], vertex * 2);
      indices.set(
        [vertex, vertex + 1, vertex + 2, vertex, vertex + 2, vertex + 3],
        i * INDICES_PER_DASH
      );
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3).setUsage(THREE.DynamicDrawUsage));
    geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 4).setUsage(THREE.DynamicDrawUsage));
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));

    const material = new THREE.MeshBasicMaterial({
      color: WAYPOINT_PATH_CONFIG.COLOR,
      transparent: true,
      vertexColors: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.name = 'waypoint-ground-path';
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 1;
    this.mesh.visible = false;
    this.mesh.userData.noShadowCast = true;
    scene.add(this.mesh);
  }

  update(input: WaypointPathUpdateInput): void {
    const {
      dt,
      target,
      startX,
      startY,
      startZ,
      inside,
      roverActive,
      world,
      colliders = [],
      ignoredColliders = null,
    } = input;

    if (!target) {
      this.hide();
      return;
    }

    this.time += dt;
    this.repathTimer += dt;

    const startBx = Math.floor(startX);
    const startBz = Math.floor(startZ);
    const goalBx = Math.floor(target.x);
    const goalBz = Math.floor(target.z);
    const targetMoved = Number.isNaN(this.lastTargetX)
      || Math.hypot(target.x - this.lastTargetX, target.z - this.lastTargetZ) > 0.35;

    const needsRepath =
      this.cachedPath.length < 2
      || startBx !== this.lastStartBx
      || startBz !== this.lastStartBz
      || goalBx !== this.lastGoalBx
      || goalBz !== this.lastGoalBz
      || inside !== this.lastInside
      || roverActive !== this.lastRoverActive
      || targetMoved
      || this.repathTimer >= WAYPOINT_PATH_CONFIG.REPATH_INTERVAL;

    if (needsRepath) {
      this.repathTimer = 0;
      this.lastStartBx = startBx;
      this.lastStartBz = startBz;
      this.lastGoalBx = goalBx;
      this.lastGoalBz = goalBz;
      this.lastTargetX = target.x;
      this.lastTargetZ = target.z;
      this.lastInside = inside;
      this.lastRoverActive = roverActive;

      this.cachedPath = findGroundPath(this.scratch, {
        world,
        startX,
        startY,
        startZ,
        targetX: target.x,
        targetZ: target.z,
        inside,
        roverActive,
        colliders,
        ignoredColliders,
      });
    } else if (this.cachedPath.length >= 2) {
      this.cachedPath[0].x = startX;
      this.cachedPath[0].z = startZ;
    }

    const dashes = buildPathDashes(this.scratch, {
      world,
      polyline: this.cachedPath,
      inside,
      refY: startY,
      roverActive,
      time: this.time,
      maxDashes: MAX_DASHES,
    });

    if (dashes.length === 0) {
      this.mesh.geometry.setDrawRange(0, 0);
      this.mesh.visible = false;
      return;
    }

    const halfWidth = WAYPOINT_PATH_CONFIG.DASH_WIDTH * 0.5;
    for (let i = 0; i < dashes.length; i += 1) {
      const dash = dashes[i];
      const offX = dash.rx * halfWidth;
      const offZ = dash.rz * halfWidth;
      const vBase = i * VERTICES_PER_DASH;

      const p0 = vBase * 3;
      this.positions[p0] = dash.x0 - offX;
      this.positions[p0 + 1] = dash.y;
      this.positions[p0 + 2] = dash.z0 - offZ;

      const p1 = (vBase + 1) * 3;
      this.positions[p1] = dash.x0 + offX;
      this.positions[p1 + 1] = dash.y;
      this.positions[p1 + 2] = dash.z0 + offZ;

      const p2 = (vBase + 2) * 3;
      this.positions[p2] = dash.x1 + offX;
      this.positions[p2 + 1] = dash.y;
      this.positions[p2 + 2] = dash.z1 + offZ;

      const p3 = (vBase + 3) * 3;
      this.positions[p3] = dash.x1 - offX;
      this.positions[p3 + 1] = dash.y;
      this.positions[p3 + 2] = dash.z1 - offZ;

      for (let c = 0; c < VERTICES_PER_DASH; c += 1) {
        const cOff = (vBase + c) * 4;
        this.colors[cOff] = 1;
        this.colors[cOff + 1] = 1;
        this.colors[cOff + 2] = 1;
        this.colors[cOff + 3] = dash.alpha;
      }
    }

    this.mesh.geometry.setDrawRange(0, dashes.length * INDICES_PER_DASH);
    this.mesh.visible = true;
    this.mesh.geometry.attributes.position.needsUpdate = true;
    this.mesh.geometry.attributes.color.needsUpdate = true;
  }

  hide(): void {
    this.mesh.geometry.setDrawRange(0, 0);
    this.mesh.visible = false;
  }
}
