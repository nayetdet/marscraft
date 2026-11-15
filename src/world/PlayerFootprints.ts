import * as THREE from 'three';
import { TERRAIN_CONFIG } from '../config/constants.ts';
import { accumulateFootstepDistance, findRegolithSurfaceY, type FootprintBlockLookup } from './footprintLogic.ts';

type Footprint = {
  x: number;
  y: number;
  z: number;
  yaw: number;
  age: number;
};

type FootprintPlayer = {
  pos: THREE.Vector3;
  yaw: number;
  height: number;
  onGround: boolean;
  isMoving: boolean;
};

const VERTICES_PER_PRINT = 4;
const INDICES_PER_PRINT = 6;
const MAX_COUNT = TERRAIN_CONFIG.FOOTPRINT_MAX_COUNT;

function createFootprintTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 18;
  canvas.height = 28;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not create the footprint texture.');
  context.imageSmoothingEnabled = false;

  const paintRows = (color: string, rows: Array<[number, number, number]>) => {
    context.fillStyle = color;
    for (const [y, startX, endX] of rows) context.fillRect(startX, y, endX - startX, 1);
  };

  // Stepped silhouette: broad toe, narrow arch, and square heel.
  paintRows('#43271e', [
    [1, 7, 11], [2, 6, 12], [3, 5, 13],
    [4, 4, 14], [5, 4, 14], [6, 4, 14], [7, 4, 14], [8, 4, 14],
    [9, 5, 13], [10, 5, 13], [11, 5, 13], [12, 6, 12], [13, 6, 12], [14, 6, 12],
    [15, 6, 12], [16, 5, 13], [17, 5, 13], [18, 5, 13],
    [19, 6, 12], [20, 6, 12], [21, 6, 12], [22, 7, 11], [23, 7, 11], [24, 7, 11], [25, 8, 10],
  ]);
  paintRows('#80563b', [
    [2, 7, 11], [3, 6, 12], [4, 5, 13], [5, 5, 13], [6, 5, 13], [7, 5, 13],
    [8, 5, 13], [9, 6, 12], [10, 6, 12], [11, 6, 12], [12, 7, 11], [13, 7, 11],
    [14, 7, 11], [15, 7, 11], [16, 6, 12], [17, 6, 12], [18, 6, 12],
    [19, 7, 11], [20, 7, 11], [21, 7, 11], [22, 8, 10], [23, 8, 10], [24, 8, 10],
  ]);

  // Blocky tread grooves on the toe and heel make the print read as a boot sole.
  context.fillStyle = '#533829';
  context.fillRect(5, 5, 3, 1);
  context.fillRect(10, 5, 3, 1);
  context.fillRect(6, 8, 6, 1);
  context.fillRect(7, 10, 4, 1);
  context.fillRect(7, 14, 4, 1);
  context.fillRect(6, 17, 6, 1);
  context.fillRect(7, 20, 4, 1);
  context.fillRect(8, 23, 2, 1);
  context.fillStyle = '#ad8056';
  context.fillRect(7, 3, 2, 1);
  context.fillRect(5, 6, 1, 1);
  context.fillRect(12, 6, 1, 1);
  context.fillRect(8, 12, 2, 1);
  context.fillRect(7, 18, 1, 1);
  context.fillRect(10, 18, 1, 1);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  return texture;
}

export class PlayerFootprints {
  readonly mesh: THREE.Mesh;
  private readonly positions: Float32Array;
  private readonly colors: Float32Array;
  private readonly footprints: Footprint[] = [];
  private previousX: number | null = null;
  private previousZ: number | null = null;
  private distanceSinceStep = 0;
  private nextSide = -1;

  constructor(scene: THREE.Scene) {
    const geometry = new THREE.BufferGeometry();
    this.positions = new Float32Array(MAX_COUNT * VERTICES_PER_PRINT * 3);
    this.colors = new Float32Array(MAX_COUNT * VERTICES_PER_PRINT * 4);
    const uvs = new Float32Array(MAX_COUNT * VERTICES_PER_PRINT * 2);
    const indices = new Uint16Array(MAX_COUNT * INDICES_PER_PRINT);

    for (let i = 0; i < MAX_COUNT; i += 1) {
      const vertex = i * VERTICES_PER_PRINT;
      const uv = vertex * 2;
      uvs.set([0, 1, 1, 1, 1, 0, 0, 0], uv);
      const index = i * INDICES_PER_PRINT;
      indices.set([vertex, vertex + 1, vertex + 2, vertex, vertex + 2, vertex + 3], index);
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3).setUsage(THREE.DynamicDrawUsage));
    geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 4).setUsage(THREE.DynamicDrawUsage));
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));

    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      map: createFootprintTexture(),
      transparent: true,
      vertexColors: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -1,
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.name = 'Temporary Martian footprints';
    this.mesh.frustumCulled = false;
    this.mesh.visible = false;
    scene.add(this.mesh);
  }

  update(dt: number, player: FootprintPlayer, world: FootprintBlockLookup, canWalk: boolean): void {
    const { pos } = player;
    if (this.previousX !== null && this.previousZ !== null && canWalk && player.onGround && player.isMoving) {
      const step = accumulateFootstepDistance(
        this.distanceSinceStep,
        Math.hypot(pos.x - this.previousX, pos.z - this.previousZ),
        TERRAIN_CONFIG.FOOTPRINT_SPACING
      );
      this.distanceSinceStep = step.distanceSinceStep;
      if (step.shouldPlace) this.addFootprint(player, world);
    } else {
      this.distanceSinceStep = 0;
    }
    this.previousX = pos.x;
    this.previousZ = pos.z;

    const lifetime = TERRAIN_CONFIG.FOOTPRINT_LIFETIME;
    for (let i = this.footprints.length - 1; i >= 0; i -= 1) {
      const footprint = this.footprints[i];
      footprint.age += dt;
      if (footprint.age >= lifetime) this.footprints.splice(i, 1);
    }
    this.updateGeometry();
  }

  private addFootprint(player: FootprintPlayer, world: FootprintBlockLookup): void {
    const blockX = Math.floor(player.pos.x);
    const blockZ = Math.floor(player.pos.z);
    const surfaceY = findRegolithSurfaceY(
      world,
      blockX,
      Math.floor(player.pos.y - player.height + 0.05),
      blockZ
    );
    if (surfaceY === null) return;

    const side = this.nextSide;
    this.nextSide *= -1;
    const forwardX = -Math.sin(player.yaw);
    const forwardZ = -Math.cos(player.yaw);
    const rightX = Math.cos(player.yaw);
    const rightZ = -Math.sin(player.yaw);
    const backOffset = 0.08;
    const sideOffset = side * TERRAIN_CONFIG.FOOTPRINT_SIDE_OFFSET;
    const footprints = this.footprints;
    footprints.push({
      x: player.pos.x + rightX * sideOffset - forwardX * backOffset,
      y: surfaceY + 1.008,
      z: player.pos.z + rightZ * sideOffset - forwardZ * backOffset,
      yaw: player.yaw,
      age: 0,
    });
    if (footprints.length > MAX_COUNT) footprints.shift();
  }

  private updateGeometry(): void {
    const width = TERRAIN_CONFIG.FOOTPRINT_WIDTH * 0.5;
    const length = TERRAIN_CONFIG.FOOTPRINT_LENGTH * 0.5;
    const lifetime = TERRAIN_CONFIG.FOOTPRINT_LIFETIME;
    this.colors.fill(0);

    for (let i = 0; i < this.footprints.length; i += 1) {
      const footprint = this.footprints[i];
      const forwardX = -Math.sin(footprint.yaw);
      const forwardZ = -Math.cos(footprint.yaw);
      const rightX = Math.cos(footprint.yaw);
      const rightZ = -Math.sin(footprint.yaw);
      const vertex = i * VERTICES_PER_PRINT;
      const corners = [
        [-width, -length],
        [width, -length],
        [width, length],
        [-width, length],
      ];

      for (let corner = 0; corner < VERTICES_PER_PRINT; corner += 1) {
        const [side, along] = corners[corner];
        const offset = (vertex + corner) * 3;
        this.positions[offset] = footprint.x + rightX * side + forwardX * along;
        this.positions[offset + 1] = footprint.y;
        this.positions[offset + 2] = footprint.z + rightZ * side + forwardZ * along;

        const colorOffset = (vertex + corner) * 4;
        this.colors[colorOffset] = 1;
        this.colors[colorOffset + 1] = 1;
        this.colors[colorOffset + 2] = 1;
        this.colors[colorOffset + 3] = 0.44 * (1 - footprint.age / lifetime);
      }
    }

    this.mesh.geometry.setDrawRange(0, this.footprints.length * INDICES_PER_PRINT);
    this.mesh.visible = this.footprints.length > 0;
    this.mesh.geometry.attributes.position.needsUpdate = true;
    this.mesh.geometry.attributes.color.needsUpdate = true;
  }
}
