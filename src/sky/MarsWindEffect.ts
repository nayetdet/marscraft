import * as THREE from 'three';
import { WIND_AMBIENCE_CONFIG as W } from '../config/constants.ts';
import { isInsidePressurizedVolume } from '../world/habitatLayout.ts';
import type { WindState } from './windState.ts';

const STREAK_VERTEX = /* glsl */ `
  attribute float aAlpha;
  varying float vAlpha;
  varying float vAlong;

  void main() {
    vAlpha = aAlpha;
    vAlong = position.x;
    vec4 worldPos = instanceMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const STREAK_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vAlpha;
  varying float vAlong;

  void main() {
    // Pontas suaves nas duas extremidades da rajada de vento
    float taper = 1.0 - smoothstep(0.1, 0.5, abs(vAlong));
    float alpha = vAlpha * uOpacity * taper;
    if (alpha < 0.005) discard;
    gl_FragColor = vec4(uColor, alpha);
    #include <colorspace_fragment>
  }
`;

const MIST_VERTEX = /* glsl */ `
  attribute float aMistAlpha;
  attribute float aMistSeed;
  varying vec2 vUv;
  varying float vAlpha;
  varying float vSeed;

  void main() {
    vUv = uv;
    vAlpha = aMistAlpha;
    vSeed = aMistSeed;
    vec4 worldCenter = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    vec4 mvCenter = viewMatrix * worldCenter;
    vec2 scale = vec2(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz));
    mvCenter.xy += position.xy * scale;
    gl_Position = projectionMatrix * mvCenter;
  }
`;

const MIST_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uTime;
  varying vec2 vUv;
  varying float vAlpha;
  varying float vSeed;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  void main() {
    vec2 d = (vUv - 0.5) * 2.0;
    // Forma achatada na horizontal, como banco baixo de poeira no solo
    float r = length(vec2(d.x * 0.9, d.y * 1.35));
    if (r > 1.0) discard;

    float n = noise(vUv * 3.4 + vec2(vSeed * 19.0 + uTime * 0.12, vSeed * 7.0));
    float soft = pow(1.0 - r, 2.1) * (0.55 + 0.45 * n);
    float alpha = soft * vAlpha * uOpacity;
    if (alpha < 0.004) discard;
    gl_FragColor = vec4(uColor, alpha);
    #include <colorspace_fragment>
  }
`;

const _dummy = new THREE.Object3D();
const _streakColor = new THREE.Color();
const _mistColor = new THREE.Color();
const _dayRef = new THREE.Color(0xe6cba6);

export type GroundYLookup = (x: number, z: number) => number;

/**
 * Efeitos visuais de vento e poeira rasa fora da base:
 * 1) Faixas alongadas de vento varrendo o ar ao redor do jogador.
 * 2) Bancos baixos de poeira/nevoa deslizando sobre o terreno da cratera.
 * Usa exatamente 2 InstancedMesh (2 draw calls) e nenhuma alocacao por frame.
 */
export class MarsWindEffect {
  private readonly scene: THREE.Scene;
  private readonly getGroundY: GroundYLookup;
  private time = 0;

  private readonly streakCount = W.STREAK_COUNT;
  private readonly streakMesh: THREE.InstancedMesh;
  private readonly streakAlpha: Float32Array;
  private readonly streakAlphaAttr: THREE.InstancedBufferAttribute;
  private readonly streakData: Float32Array;
  private readonly streakUniforms: {
    uColor: THREE.IUniform<THREE.Color>;
    uOpacity: THREE.IUniform<number>;
  };

  private readonly mistCount = W.MIST_COUNT;
  private readonly mistMesh: THREE.InstancedMesh;
  private readonly mistAlpha: Float32Array;
  private readonly mistAlphaAttr: THREE.InstancedBufferAttribute;
  private readonly mistData: Float32Array;
  private readonly mistUniforms: {
    uColor: THREE.IUniform<THREE.Color>;
    uOpacity: THREE.IUniform<number>;
    uTime: THREE.IUniform<number>;
  };

  constructor(scene: THREE.Scene, getGroundY: GroundYLookup = () => 9) {
    this.scene = scene;
    this.getGroundY = getGroundY;

    // --- Camada 1: Faixas de vento (streaks) ---
    const streakGeom = new THREE.BoxGeometry(1, 0.036, 0.036);
    this.streakAlpha = new Float32Array(this.streakCount);
    this.streakAlphaAttr = new THREE.InstancedBufferAttribute(this.streakAlpha, 1);
    this.streakAlphaAttr.setUsage(THREE.DynamicDrawUsage);
    streakGeom.setAttribute('aAlpha', this.streakAlphaAttr);

    this.streakUniforms = {
      uColor: { value: new THREE.Color(0xe8c4a2) },
      uOpacity: { value: 0 },
    };
    const streakMat = new THREE.ShaderMaterial({
      vertexShader: STREAK_VERTEX,
      fragmentShader: STREAK_FRAGMENT,
      uniforms: this.streakUniforms,
      transparent: true,
      depthWrite: false,
    });
    this.streakMesh = new THREE.InstancedMesh(streakGeom, streakMat, this.streakCount);
    this.streakMesh.frustumCulled = false;
    this.streakMesh.renderOrder = 52;
    this.streakMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.streakMesh.visible = false;
    this.scene.add(this.streakMesh);

    // x, y, z (offset relativo ao foco), age, life, speedScale, threshold, yDrift
    this.streakData = new Float32Array(this.streakCount * 8);
    const sBox = W.STREAK_BOX;
    for (let i = 0; i < this.streakCount; i++) {
      const o = i * 8;
      this.streakData[o] = (Math.random() - 0.5) * sBox.x;
      this.streakData[o + 1] = (Math.random() - 0.45) * sBox.y;
      this.streakData[o + 2] = (Math.random() - 0.5) * sBox.z;
      const life = 0.75 + Math.random() * 0.9;
      this.streakData[o + 3] = Math.random() * life;
      this.streakData[o + 4] = life;
      this.streakData[o + 5] = 0.8 + Math.random() * 0.55;
      this.streakData[o + 6] = Math.random();
      this.streakData[o + 7] = (Math.random() - 0.5) * 0.35;
    }

    // --- Camada 2: Bancos rasos de poeira/nevoa ---
    const mistGeom = new THREE.PlaneGeometry(1, 1);
    this.mistAlpha = new Float32Array(this.mistCount);
    this.mistAlphaAttr = new THREE.InstancedBufferAttribute(this.mistAlpha, 1);
    this.mistAlphaAttr.setUsage(THREE.DynamicDrawUsage);
    mistGeom.setAttribute('aMistAlpha', this.mistAlphaAttr);

    const mistSeeds = new Float32Array(this.mistCount);
    for (let i = 0; i < this.mistCount; i++) mistSeeds[i] = Math.random();
    mistGeom.setAttribute('aMistSeed', new THREE.InstancedBufferAttribute(mistSeeds, 1));

    this.mistUniforms = {
      uColor: { value: new THREE.Color(0xdcb48e) },
      uOpacity: { value: 0 },
      uTime: { value: 0 },
    };
    const mistMat = new THREE.ShaderMaterial({
      vertexShader: MIST_VERTEX,
      fragmentShader: MIST_FRAGMENT,
      uniforms: this.mistUniforms,
      transparent: true,
      depthWrite: false,
    });
    this.mistMesh = new THREE.InstancedMesh(mistGeom, mistMat, this.mistCount);
    this.mistMesh.frustumCulled = false;
    this.mistMesh.renderOrder = 49;
    this.mistMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mistMesh.visible = false;
    this.scene.add(this.mistMesh);

    // worldX, worldY, worldZ, width, height, phase, speedScale, initialized
    this.mistData = new Float32Array(this.mistCount * 8);
    for (let i = 0; i < this.mistCount; i++) {
      const o = i * 8;
      this.mistData[o + 3] = 7.5 + Math.random() * 8.5;
      this.mistData[o + 4] = 2.6 + Math.random() * 2.4;
      this.mistData[o + 5] = Math.random() * Math.PI * 2;
      this.mistData[o + 6] = 0.7 + Math.random() * 0.6;
      this.mistData[o + 7] = 0; // posiciona no primeiro update em torno do foco
    }
  }

  update(
    dt: number,
    focus: THREE.Vector3,
    camera: THREE.Camera,
    wind: WindState,
    outdoorBlend: number,
    haze: number,
  ): void {
    this.time += dt;
    const clampedDt = Math.min(dt, 0.1);

    const fog = this.scene.fog as THREE.FogExp2 | null;
    const fogCol = fog ? fog.color : _dayRef;

    this._updateStreaks(clampedDt, focus, camera, wind, outdoorBlend, haze, fogCol);
    this._updateMist(clampedDt, focus, camera, wind, outdoorBlend, haze, fogCol);
  }

  private _updateStreaks(
    dt: number,
    focus: THREE.Vector3,
    camera: THREE.Camera,
    wind: WindState,
    outdoorBlend: number,
    haze: number,
    fogCol: THREE.Color,
  ): void {
    const masterOpacity = outdoorBlend * (0.24 + 0.42 * wind.intensity + 0.24 * haze);
    this.streakMesh.visible = masterOpacity > 0.01;
    if (!this.streakMesh.visible) return;

    _streakColor.copy(fogCol).lerp(_dayRef, 0.25).multiplyScalar(1.22);
    this.streakUniforms.uColor.value.copy(_streakColor);
    this.streakUniforms.uOpacity.value = masterOpacity;

    const sBox = W.STREAK_BOX;
    const halfX = sBox.x * 0.5;
    const halfY = sBox.y * 0.5;
    const halfZ = sBox.z * 0.5;
    const yaw = -Math.atan2(wind.dirZ, wind.dirX);
    const activeThreshold = 0.24 + 0.76 * Math.min(1, wind.intensity * 0.85 + haze * 0.5);
    const baseLength = 1.2 + 2.6 * wind.intensity + 1.2 * wind.gust;

    const d = this.streakData;
    for (let i = 0; i < this.streakCount; i++) {
      const o = i * 8;
      d[o + 3] += dt;
      if (d[o + 3] >= d[o + 4]) {
        d[o + 3] %= d[o + 4];
        d[o] = (Math.random() - 0.5) * sBox.x;
        d[o + 1] = (Math.random() - 0.45) * sBox.y;
        d[o + 2] = (Math.random() - 0.5) * sBox.z;
      }

      const speed = wind.speed * d[o + 5];
      d[o] += wind.dirX * speed * dt;
      d[o + 1] += d[o + 7] * dt;
      d[o + 2] += wind.dirZ * speed * dt;

      if (d[o] > halfX) d[o] -= sBox.x;
      else if (d[o] < -halfX) d[o] += sBox.x;
      if (d[o + 1] > halfY) d[o + 1] -= sBox.y;
      else if (d[o + 1] < -halfY) d[o + 1] += sBox.y;
      if (d[o + 2] > halfZ) d[o + 2] -= sBox.z;
      else if (d[o + 2] < -halfZ) d[o + 2] += sBox.z;

      const wx = focus.x + d[o];
      const wy = focus.y + d[o + 1];
      const wz = focus.z + d[o + 2];

      let alpha = 0;
      if (d[o + 6] <= activeThreshold && !isInsidePressurizedVolume(wx, wy, wz)) {
        const lifeT = d[o + 3] / d[o + 4];
        const dist = Math.hypot(wx - camera.position.x, wz - camera.position.z);
        const nearFade = Math.max(0, Math.min(1, (dist - 1.4) / 2.2));
        const edgeFade = 1 - Math.max(
          Math.abs(d[o]) / halfX,
          Math.abs(d[o + 2]) / halfZ,
        );
        alpha = Math.sin(Math.PI * lifeT) * nearFade * Math.max(0, Math.min(1, edgeFade * 3.5));
      }

      this.streakAlpha[i] = alpha;
      const len = baseLength * (0.7 + 0.5 * d[o + 5]);
      _dummy.position.set(wx, wy, wz);
      _dummy.rotation.set(0, yaw, -0.03);
      _dummy.scale.set(alpha > 0.005 ? len : 0, 1, 1);
      _dummy.updateMatrix();
      this.streakMesh.setMatrixAt(i, _dummy.matrix);
    }

    this.streakMesh.instanceMatrix.needsUpdate = true;
    this.streakAlphaAttr.needsUpdate = true;
  }

  private _updateMist(
    dt: number,
    focus: THREE.Vector3,
    camera: THREE.Camera,
    wind: WindState,
    outdoorBlend: number,
    haze: number,
    fogCol: THREE.Color,
  ): void {
    const mistOpacity = THREE.MathUtils.lerp(W.MIST_BASE_OPACITY, W.MIST_STORM_OPACITY, haze)
      * (0.45 + 0.55 * outdoorBlend)
      * (0.85 + 0.3 * wind.gust);
    this.mistMesh.visible = mistOpacity > 0.008;
    if (!this.mistMesh.visible) return;

    _mistColor.copy(fogCol).lerp(_dayRef, 0.15).multiplyScalar(1.04);
    this.mistUniforms.uColor.value.copy(_mistColor);
    this.mistUniforms.uOpacity.value = mistOpacity;
    this.mistUniforms.uTime.value = this.time;

    const boxX = W.MIST_BOX.x;
    const boxZ = W.MIST_BOX.z;
    const halfX = boxX * 0.5;
    const halfZ = boxZ * 0.5;
    const driftSpeed = (2.2 + 5.2 * wind.intensity + 4.0 * haze);

    const d = this.mistData;
    for (let i = 0; i < this.mistCount; i++) {
      const o = i * 8;
      if (d[o + 7] === 0) {
        d[o] = focus.x + (Math.random() - 0.5) * boxX;
        d[o + 2] = focus.z + (Math.random() - 0.5) * boxZ;
        d[o + 1] = this.getGroundY(d[o], d[o + 2]) + 0.8 + Math.random() * 1.9;
        d[o + 7] = 1;
      } else {
        d[o] += wind.dirX * driftSpeed * d[o + 6] * dt;
        d[o + 2] += wind.dirZ * driftSpeed * d[o + 6] * dt;
      }

      let wrapped = false;
      const dx = d[o] - focus.x;
      const dz = d[o + 2] - focus.z;
      if (dx > halfX) { d[o] -= boxX; wrapped = true; }
      else if (dx < -halfX) { d[o] += boxX; wrapped = true; }
      if (dz > halfZ) { d[o + 2] -= boxZ; wrapped = true; }
      else if (dz < -halfZ) { d[o + 2] += boxZ; wrapped = true; }

      if (wrapped) {
        d[o + 1] = this.getGroundY(d[o], d[o + 2]) + 0.8 + Math.random() * 1.9;
      }

      const wx = d[o];
      const wy = d[o + 1] + Math.sin(this.time * 0.45 + d[o + 5]) * 0.18;
      const wz = d[o + 2];

      let alpha = 0;
      if (!isInsidePressurizedVolume(wx, wy, wz)) {
        const distCam = Math.hypot(wx - camera.position.x, wz - camera.position.z);
        const nearFade = Math.max(0, Math.min(1, (distCam - 6.5) / 8.0));
        const boxEdge = Math.max(Math.abs(wx - focus.x) / halfX, Math.abs(wz - focus.z) / halfZ);
        const farFade = 1 - Math.max(0, Math.min(1, (boxEdge - 0.68) / 0.32));
        alpha = nearFade * farFade * (0.7 + 0.3 * Math.sin(this.time * 0.35 + d[o + 5]));
      }

      this.mistAlpha[i] = alpha;
      _dummy.position.set(wx, wy, wz);
      _dummy.rotation.set(0, 0, 0);
      _dummy.scale.set(alpha > 0.004 ? d[o + 3] : 0, alpha > 0.004 ? d[o + 4] : 0, 1);
      _dummy.updateMatrix();
      this.mistMesh.setMatrixAt(i, _dummy.matrix);
    }

    this.mistMesh.instanceMatrix.needsUpdate = true;
    this.mistAlphaAttr.needsUpdate = true;
  }
}
