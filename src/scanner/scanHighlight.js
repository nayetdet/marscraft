import * as THREE from 'three';
import { SRGB_AUTHORED_OUTPUT } from '../graphics/srgbOutput.js';

// Efeito de scan estilo LiDAR: o alvo inteiro ganha uma "pele" verde de pontos que enche de
// baixo para cima conforme o progresso, com uma faixa brilhante subindo. Ao completar, dá um
// flash e o objeto continua todo verde enquanto a mira estiver nele.

const SCAN_GREEN = new THREE.Color(0x3dff3d);
const FLASH_DURATION = 0.35; // segundos de brilho extra no momento em que o scan completa

const vertexShader = /* glsl */ `
  varying vec3 vWorld;
  varying vec3 vNormal;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    vNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uMinY;
  uniform float uMaxY;
  uniform float uProgress;
  uniform float uOpacity;
  uniform float uTime;
  uniform float uDotsPerUnit;
  uniform float uFlash;
  varying vec3 vWorld;
  varying vec3 vNormal;

  void main() {
    float h = (vWorld.y - uMinY) / max(uMaxY - uMinY, 0.001);
    float filled = step(h, uProgress);

    // Grade de pontos no plano da face (a face olha para x, y ou z).
    vec3 n = abs(vNormal);
    vec2 uv = n.x > 0.5 ? vWorld.zy : (n.y > 0.5 ? vWorld.xz : vWorld.xy);
    vec2 cell = fract(uv * uDotsPerUnit) - 0.5;
    float dotMask = 1.0 - smoothstep(0.16, 0.26, length(cell));
    // Pontos piscam levemente, como leituras de um sensor.
    float flicker = 0.75 + 0.25 * sin(uTime * 9.0 + floor(uv.x * uDotsPerUnit) * 1.7 + floor(uv.y * uDotsPerUnit) * 2.3);

    // Faixa brilhante na altura do progresso.
    float band = (1.0 - smoothstep(0.0, 0.05, abs(h - uProgress))) * step(uProgress, 0.999);

    vec3 color = mix(uColor * 0.8, vec3(0.75, 1.0, 0.75), dotMask * flicker * 0.7);
    color = mix(color, vec3(0.9, 1.0, 0.9), max(band, uFlash * 0.6));
    float alpha = filled * (0.62 + 0.35 * dotMask * flicker) + band * 0.9 + uFlash * 0.3;
    gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0) * uOpacity);
${SRGB_AUTHORED_OUTPUT}
  }
`;

function createMaterial(dotsPerUnit) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: SCAN_GREEN.clone() },
      uMinY: { value: 0 },
      uMaxY: { value: 1 },
      uProgress: { value: 0 },
      uOpacity: { value: 1 },
      uTime: { value: 0 },
      uDotsPerUnit: { value: dotsPerUnit },
      uFlash: { value: 0 },
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    side: THREE.FrontSide,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
}

// Junta caixas (blocos e AABBs) numa única geometria, um pouco maiores que o objeto.
function buildBoxesGeometry(boxes) {
  const template = new THREE.BoxGeometry(1, 1, 1).toNonIndexed();
  const tPos = template.attributes.position.array;
  const tNor = template.attributes.normal.array;
  const positions = new Float32Array(tPos.length * boxes.length);
  const normals = new Float32Array(tNor.length * boxes.length);
  boxes.forEach((b, i) => {
    const sx = b.maxX - b.minX;
    const sy = b.maxY - b.minY;
    const sz = b.maxZ - b.minZ;
    const cx = (b.minX + b.maxX) / 2;
    const cy = (b.minY + b.maxY) / 2;
    const cz = (b.minZ + b.maxZ) / 2;
    const o = i * tPos.length;
    for (let v = 0; v < tPos.length; v += 3) {
      positions[o + v] = tPos[v] * sx + cx;
      positions[o + v + 1] = tPos[v + 1] * sy + cy;
      positions[o + v + 2] = tPos[v + 2] * sz + cz;
      normals[o + v] = tNor[v];
      normals[o + v + 1] = tNor[v + 1];
      normals[o + v + 2] = tNor[v + 2];
    }
  });
  template.dispose();
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  geometry.computeBoundingBox();
  return geometry;
}

export class ScanHighlight {
  constructor(scene) {
    this.scene = scene;
    this.mesh = null;
    this.key = null;
    this.doneTime = 0;
    this.time = 0;
    this.followSky = null; // {getPosition(target)} para astros, que se movem no céu
  }

  /**
   * Troca o alvo pintado. `shape` pode ter:
   *  - boxes: [{minX..maxZ}] (blocos e AABBs de objetos)
   *  - sphere: {radius, getPosition(target)} para astros no céu
   */
  setTarget(key, shape) {
    if (key === this.key) return;
    this.clear();
    this.key = key;
    if (!shape) return;

    if (shape.boxes?.length) {
      const pad = 0.03;
      const padded = shape.boxes.map((b) => ({
        minX: b.minX - pad, maxX: b.maxX + pad,
        minY: b.minY - pad, maxY: b.maxY + pad,
        minZ: b.minZ - pad, maxZ: b.maxZ + pad,
      }));
      const geometry = buildBoxesGeometry(padded);
      this.mesh = new THREE.Mesh(geometry, createMaterial(4));
      this.mesh.material.uniforms.uMinY.value = geometry.boundingBox.min.y;
      this.mesh.material.uniforms.uMaxY.value = geometry.boundingBox.max.y;
    } else if (shape.sphere) {
      const geometry = new THREE.SphereGeometry(shape.sphere.radius, 24, 16);
      // Astros ficam a centenas de blocos: menos pontos por unidade para continuarem visíveis.
      this.mesh = new THREE.Mesh(geometry, createMaterial(4 / shape.sphere.radius));
      this.mesh.material.fog = false;
      this.followSky = shape.sphere;
      this.sphereRadius = shape.sphere.radius;
    }

    if (this.mesh) {
      this.mesh.renderOrder = 998;
      this.mesh.frustumCulled = false;
      this.scene.add(this.mesh);
    }
    this.doneTime = 0;
  }

  /** state vem do ScannerSystem.update (progress, done). */
  update(dt, state) {
    if (!this.mesh) return;
    this.time += dt;
    const u = this.mesh.material.uniforms;
    u.uTime.value = this.time;

    if (this.followSky) {
      this.followSky.getPosition(this.mesh.position);
      u.uMinY.value = this.mesh.position.y - this.sphereRadius;
      u.uMaxY.value = this.mesh.position.y + this.sphereRadius;
    }

    if (state.done) {
      this.doneTime += dt;
      u.uProgress.value = 1;
      u.uFlash.value = Math.max(0, 1 - this.doneTime / FLASH_DURATION);
    } else {
      this.doneTime = 0;
      u.uProgress.value = state.progress;
      u.uFlash.value = 0;
    }
  }

  clear() {
    if (this.mesh) {
      this.scene.remove(this.mesh);
      this.mesh.geometry.dispose();
      this.mesh.material.dispose();
      this.mesh = null;
    }
    this.followSky = null;
    this.key = null;
  }
}
