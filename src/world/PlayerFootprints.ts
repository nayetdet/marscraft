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

  // A clear rectangular boot-sole stamp with crisp corners and a simple voxel tread.
  context.fillStyle = '#a56845';
  context.fillRect(2, 1, 14, 26);
  context.fillStyle = '#b97c55';
  context.fillRect(3, 2, 12, 24);

  // Repeating square tread blocks keep the print readable at game distance.
  context.fillStyle = '#865637';
  for (const y of [5, 10, 15, 20]) {
    context.fillRect(4, y, 10, 1);
    context.fillRect(7, y + 1, 1, 3);
    context.fillRect(10, y + 1, 1, 3);
  }
  context.fillRect(4, 3, 10, 1);
  context.fillRect(4, 24, 10, 1);

  // Small warm pixels catch the light without breaking the straight outline.
  context.fillStyle = '#c58b65';
  context.fillRect(4, 4, 2, 1);
  context.fillRect(12, 9, 2, 1);
  context.fillRect(4, 14, 2, 1);
  context.fillRect(12, 19, 2, 1);

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
        this.colors[colorOffset + 3] = TERRAIN_CONFIG.FOOTPRINT_OPACITY * (1 - footprint.age / lifetime);
      }
    }

    this.mesh.geometry.setDrawRange(0, this.footprints.length * INDICES_PER_PRINT);
    this.mesh.visible = this.footprints.length > 0;
    this.mesh.geometry.attributes.position.needsUpdate = true;
    this.mesh.geometry.attributes.color.needsUpdate = true;
  }
}
