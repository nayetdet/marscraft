import * as THREE from 'three';
import { BLOCK_IDS } from '../config/blockTypes.js';

export const ICE_SENSOR_CONFIG = {
  // Raio grande o bastante para alcançar a sub-cratera de gelo (ICE_CRATER_CENTER) a partir da base.
  RADIUS: 48,
  DURATION: 60, // segundos
  MAX_BLOCKS: 400,
};

// Procura blocos de gelo com pelo menos uma face exposta ao ar, perto de um ponto.
export function findExposedIce(world, center, radius = ICE_SENSOR_CONFIG.RADIUS, maxBlocks = ICE_SENSOR_CONFIG.MAX_BLOCKS) {
  const found = [];
  const cx = Math.floor(center.x);
  const cz = Math.floor(center.z);
  const sizeY = world.sizeY ?? 48;
  const r2 = radius * radius;
  const neighbors = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];

  for (let x = cx - radius; x <= cx + radius; x++) {
    for (let z = cz - radius; z <= cz + radius; z++) {
      const dx = x - cx;
      const dz = z - cz;
      if (dx * dx + dz * dz > r2) continue;
      for (let y = 0; y < sizeY; y++) {
        if (world.getBlock(x, y, z) !== BLOCK_IDS.MARS_ICE) continue;
        const exposed = neighbors.some(([nx, ny, nz]) => world.getBlock(x + nx, y + ny, z + nz) === BLOCK_IDS.AIR);
        if (!exposed) continue;
        found.push({ x, y, z });
        if (found.length >= maxBlocks) return found;
      }
    }
  }
  return found;
}

// Contorno ciano que aparece através do terreno (depthTest desligado) e pisca até sumir.
export class IceSensorEffect {
  constructor(scene) {
    this.scene = scene;
    this.mesh = null;
    this.remaining = 0;
  }

  get isActive() {
    return this.remaining > 0;
  }

  activate(world, center) {
    this.clear();
    const blocks = findExposedIce(world, center);
    if (blocks.length === 0) return 0;

    const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.04, 1.04, 1.04));
    const base = edges.attributes.position.array;
    const positions = new Float32Array(base.length * blocks.length);
    blocks.forEach((b, i) => {
      for (let v = 0; v < base.length; v += 3) {
        const o = i * base.length + v;
        positions[o] = base[v] + b.x + 0.5;
        positions[o + 1] = base[v + 1] + b.y + 0.5;
        positions[o + 2] = base[v + 2] + b.z + 0.5;
      }
    });
    edges.dispose();

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.LineBasicMaterial({
      color: 0x38e8ff,
      transparent: true,
      opacity: 0.9,
      depthTest: false,
      fog: false,
    });
    this.mesh = new THREE.LineSegments(geometry, material);
    this.mesh.renderOrder = 999;
    this.scene.add(this.mesh);
    this.remaining = ICE_SENSOR_CONFIG.DURATION;
    this.elapsed = 0;
    return blocks.length;
  }

  update(dt) {
    if (!this.mesh) return;
    this.remaining -= dt;
    this.elapsed += dt;
    if (this.remaining <= 0) {
      this.clear();
      return;
    }
    // Pulsa e, nos últimos 5 s, vai apagando.
    const fade = Math.min(1, this.remaining / 5);
    this.mesh.material.opacity = (0.55 + 0.35 * Math.sin(this.elapsed * 4)) * fade;
  }

  clear() {
    if (this.mesh) {
      this.scene.remove(this.mesh);
      this.mesh.geometry.dispose();
      this.mesh.material.dispose();
      this.mesh = null;
    }
    this.remaining = 0;
  }
}
