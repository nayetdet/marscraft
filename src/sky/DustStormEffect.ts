import * as THREE from 'three';
import { DUST_STORM_VISUAL_CONFIG as V, DUST_WEATHER_CONFIG as W } from '../config/constants.ts';
import {
  DUST_STORM_CENTER,
  DUST_STORM_WALL_RADIUS,
  dustStormVisualStrength,
} from '../world/dustStormZone.ts';
import type { WindState } from './windState.ts';

// Uma unica frente de nevoa marca a borda do mapa. O clima temporizado (#103) controla
// tempestades de poeira; fora da base, ha sempre poeira fina em suspensao e rajadas de vento.

const STORM_DUST_COLOR = new THREE.Color(0x8a4521);
const GUST_DUST_TINT = new THREE.Color(0xc97b4b);
const DAY_FOG_LUMA = luma(new THREE.Color(0xe6cba6)); // FOG_DAY_COLOR do MarsSkySystem
const NIGHT_DUST_BRIGHTNESS = 0.22;
const _skyFog = new THREE.Color();
const _dust = new THREE.Color();
const _wind = new THREE.Vector3();
const WALL_NOISE_PERIOD = 24;

export interface DustWeatherFxInput {
  haze: number;
  front: number;
  indoors: boolean;
}

const NO_WEATHER: DustWeatherFxInput = Object.freeze({ haze: 0, front: 0, indoors: false });

function luma(c: THREE.Color): number {
  return c.r * 0.2126 + c.g * 0.7152 + c.b * 0.0722;
}

const WALL_VERTEX = /* glsl */ `
  varying vec3 vWorld;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const WALL_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform float uOpacity;
  uniform float uBottom;
  uniform float uHeight;
  uniform float uFadeNear;
  uniform float uFadeFar;
  uniform vec2 uCenter;
  uniform vec3 uColor;
  varying vec3 vWorld;

  const float PERIOD = ${WALL_NOISE_PERIOD.toFixed(1)};

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

  // Ruido de valor que se repete a cada 'period' celulas em x: o anel fecha sem emenda
  float noise(vec2 p, float period) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float x0 = mod(i.x, period);
    float x1 = mod(i.x + 1.0, period);
    float a = hash(vec2(x0, i.y));
    float b = hash(vec2(x1, i.y));
    float c = hash(vec2(x0, i.y + 1.0));
    float d = hash(vec2(x1, i.y + 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  void main() {
    vec2 rel = vWorld.xz - uCenter;
    float around = (atan(rel.y, rel.x) / 6.28318530718 + 0.5) * PERIOD;
    float h = clamp((vWorld.y - uBottom) / uHeight, 0.0, 1.0);

    // Tres camadas de nuvem com cisalhamento de vento e redemoinhos finos
    float shear = h * 0.85;
    float n = noise(vec2(around + uTime * 0.14 + shear, h * 3.6 - uTime * 0.18), PERIOD) * 0.55
            + noise(vec2(around * 2.0 - uTime * 0.34 + shear * 1.4, h * 8.0 - uTime * 0.48), PERIOD * 2.0) * 0.30
            + noise(vec2(around * 4.0 + uTime * 0.52, h * 15.0 - uTime * 0.72), PERIOD * 4.0) * 0.15;

    // Topo irregular como cortina de poeira; base mais densa e gradiente suave com a altura
    float top = 0.44 + n * 0.54;
    float alpha = (1.0 - smoothstep(top - 0.28, top, h)) * (0.72 + 0.28 * n);
    alpha *= smoothstep(uFadeNear, uFadeFar, distance(cameraPosition.xz, vWorld.xz));
    alpha *= uOpacity;
    if (alpha < 0.01) discard;

    vec3 col = uColor * (0.58 + 0.88 * n) * (0.86 + 0.28 * h);
    gl_FragColor = vec4(col, alpha);
    #include <colorspace_fragment>
  }
`;

const PARTICLE_VERTEX = /* glsl */ `
  uniform float uTime;
  uniform float uScale;
  uniform float uGust;
  uniform vec3 uBox;
  uniform vec3 uOffset;
  uniform vec3 uFastOffset;
  uniform vec3 uWind;
  attribute float aSeed;
  attribute float aLayer;
  varying float vAlpha;
  varying float vWarmth;
  varying vec2 vWindScreen;
  varying float vSeed;

  void main() {
    // aLayer >= 0.65: graos rapidos de vento perto do chao; < 0.65: poeira fina em suspensao
    float isFast = step(0.65, aLayer);
    vec3 drift = mix(uOffset, uFastOffset, isFast);
    vec3 p = position + drift;

    float turbSpeed = mix(1.4, 3.2, isFast);
    p.y += sin(uTime * turbSpeed + aSeed * 40.0) * mix(0.55, 0.28, isFast);
    p.x += sin(uTime * 1.3 + aSeed * 23.0) * 0.35;
    p.z += cos(uTime * 1.1 + aSeed * 31.0) * 0.35;

    // Caixa de poeira que acompanha a camera: quem sai por um lado volta pelo outro
    p = mod(p - cameraPosition + uBox * 0.5, uBox) - uBox * 0.5 + cameraPosition;

    vec4 mv = viewMatrix * vec4(p, 1.0);
    vWindScreen = (mat3(viewMatrix) * uWind).xy;
    vSeed = aSeed;
    float sizeFactor = mix(0.55 + 1.35 * aSeed, 0.75 + 1.55 * aSeed * (1.0 + 0.35 * uGust), isFast);
    gl_PointSize = clamp(sizeFactor * uScale / max(-mv.z, 0.5), ${V.PARTICLE_MIN_SIZE.toFixed(1)}, ${V.PARTICLE_MAX_SIZE.toFixed(1)});

    // Some perto das faces da caixa e muito perto da camera para nao piscar na tela
    vec3 q = abs(p - cameraPosition) / (uBox * 0.5);
    float edgeFade = 1.0 - smoothstep(0.68, 1.0, max(q.x, max(q.y, q.z)));
    float nearFade = smoothstep(0.6, 2.2, -mv.z);
    float layerBoost = mix(0.85, 0.65 + 0.55 * uGust, isFast);
    vAlpha = edgeFade * nearFade * (0.35 + 0.65 * aSeed) * layerBoost;
    vWarmth = aSeed * 0.35 + isFast * 0.25;
    gl_Position = projectionMatrix * mv;
  }
`;

const PARTICLE_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uHighlightColor;
  uniform float uOpacity;
  varying float vAlpha;
  varying float vWarmth;
  varying vec2 vWindScreen;
  varying float vSeed;
  void main() {
    vec2 centered = gl_PointCoord - 0.5;
    vec2 windDir = normalize(vWindScreen + vec2(0.0001));
    float along = dot(centered, windDir);
    float across = dot(centered, vec2(-windDir.y, windDir.x));
    float dist = length(vec2(along * 0.48, across * mix(1.2, 2.2, vSeed)));
    if (dist > 0.5) discard;
    float soft = smoothstep(0.5, 0.1, dist);
    vec3 col = mix(uColor, uHighlightColor, vWarmth);
    float alpha = vAlpha * uOpacity * soft;
    if (alpha < 0.005) discard;
    gl_FragColor = vec4(col, alpha);
    #include <colorspace_fragment>
  }
`;

interface WallUniforms {
  [uniform: string]: THREE.IUniform<unknown>;
  uTime: THREE.IUniform<number>;
  uOpacity: THREE.IUniform<number>;
  uBottom: THREE.IUniform<number>;
  uHeight: THREE.IUniform<number>;
  uFadeNear: THREE.IUniform<number>;
  uFadeFar: THREE.IUniform<number>;
  uCenter: THREE.IUniform<THREE.Vector2>;
  uColor: THREE.IUniform<THREE.Color>;
}

interface ParticleUniforms {
  [uniform: string]: THREE.IUniform<unknown>;
  uTime: THREE.IUniform<number>;
  uScale: THREE.IUniform<number>;
  uGust: THREE.IUniform<number>;
  uBox: THREE.IUniform<THREE.Vector3>;
  uOffset: THREE.IUniform<THREE.Vector3>;
  uFastOffset: THREE.IUniform<THREE.Vector3>;
  uWind: THREE.IUniform<THREE.Vector3>;
  uColor: THREE.IUniform<THREE.Color>;
  uHighlightColor: THREE.IUniform<THREE.Color>;
  uOpacity: THREE.IUniform<number>;
}

export class DustStormEffect {
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  time = 0;
  haze = 0;
  strength = 0;
  outdoorBlend = 1;
  private _indoorBlend = 0;

  wall!: THREE.Mesh;
  wallUniforms!: WallUniforms;
  dome!: THREE.Mesh;
  domeMaterial!: THREE.MeshBasicMaterial;
  particles!: THREE.Points;
  particleUniforms!: ParticleUniforms;

  constructor(scene: THREE.Scene, renderer: THREE.WebGLRenderer) {
    this.scene = scene;
    this.renderer = renderer;

    this._buildWall();
    this._buildDome();
    this._buildParticles();
  }

  private _buildWall(): void {
    const outer = this._createWall(DUST_STORM_WALL_RADIUS, V.OUTER_WALL_OPACITY);
    this.wall = outer.mesh;
    this.wallUniforms = outer.uniforms;
  }

  private _createWall(radius: number, opacity: number): { mesh: THREE.Mesh; uniforms: WallUniforms } {
    const geometry = new THREE.CylinderGeometry(radius, radius, V.WALL_HEIGHT, 128, 1, true);
    const uniforms: WallUniforms = {
      uTime: { value: 0 },
      uOpacity: { value: opacity },
      uBottom: { value: V.WALL_BOTTOM_Y },
      uHeight: { value: V.WALL_HEIGHT },
      uFadeNear: { value: V.WALL_FADE_NEAR },
      uFadeFar: { value: V.WALL_FADE_FAR },
      uCenter: { value: new THREE.Vector2(DUST_STORM_CENTER.x, DUST_STORM_CENTER.z) },
      uColor: { value: new THREE.Color() },
    };
    const material = new THREE.ShaderMaterial({
      vertexShader: WALL_VERTEX,
      fragmentShader: WALL_FRAGMENT,
      uniforms,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const wall = new THREE.Mesh(geometry, material);
    wall.position.set(DUST_STORM_CENTER.x, V.WALL_BOTTOM_Y + V.WALL_HEIGHT / 2, DUST_STORM_CENTER.z);
    wall.frustumCulled = false;
    // Logo depois dos opacos: e a coisa mais distante, atras de todo o resto transparente
    wall.renderOrder = -1;
    this.scene.add(wall);
    return { mesh: wall, uniforms };
  }

  private _buildDome(): void {
    this.domeMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
    });
    this.dome = new THREE.Mesh(new THREE.SphereGeometry(V.DOME_RADIUS, 16, 10), this.domeMaterial);
    this.dome.frustumCulled = false;
    this.dome.renderOrder = 50;
    this.dome.visible = false;
    this.scene.add(this.dome);
  }

  private _buildParticles(): void {
    const count = V.PARTICLE_COUNT;
    const box = V.PARTICLE_BOX;
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    const layers = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const layer = Math.random();
      layers[i] = layer;
      positions[i * 3] = (Math.random() - 0.5) * box.x;
      // Graos rapidos de vento ficam concentrados mais perto da metade inferior (perto do solo)
      positions[i * 3 + 1] = layer >= 0.65
        ? (Math.random() * 0.55 - 0.45) * box.y
        : (Math.random() - 0.5) * box.y;
      positions[i * 3 + 2] = (Math.random() - 0.5) * box.z;
      seeds[i] = Math.random();
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    geometry.setAttribute('aLayer', new THREE.BufferAttribute(layers, 1));

    this.particleUniforms = {
      uTime: { value: 0 },
      uScale: { value: 300 },
      uGust: { value: 0 },
      uBox: { value: new THREE.Vector3(box.x, box.y, box.z) },
      uOffset: { value: new THREE.Vector3() },
      uFastOffset: { value: new THREE.Vector3() },
      uWind: { value: new THREE.Vector3(1, 0, 0) },
      uColor: { value: new THREE.Color() },
      uHighlightColor: { value: new THREE.Color() },
      uOpacity: { value: 0 },
    };
    this.particles = new THREE.Points(geometry, new THREE.ShaderMaterial({
      vertexShader: PARTICLE_VERTEX,
      fragmentShader: PARTICLE_FRAGMENT,
      uniforms: this.particleUniforms,
      transparent: true,
      depthWrite: false,
    }));
    this.particles.frustumCulled = false;
    this.particles.renderOrder = 51;
    this.particles.visible = false;
    this.scene.add(this.particles);
  }

  // `camera`: de onde a cena e vista, para posicionar a cupula e as particulas.
  // Chamar depois do MarsSkySystem.update, que acerta a cor da neblina do horario.
  update(
    dt: number,
    focus: THREE.Vector3,
    camera: THREE.Camera,
    weather: DustWeatherFxInput = NO_WEATHER,
    wind: WindState | null = null,
    twilight = 0,
  ): void {
    this.time += dt;
    const haze = weather.haze;
    const edgeStrength = dustStormVisualStrength(focus.x, focus.z);
    this.strength = edgeStrength;
    this.haze = haze;

    const targetIndoor = weather.indoors ? 1 : 0;
    const blendStep = dt <= 0 ? 1 : Math.min(1, dt * V.FOG_INDOOR_BLEND_SPEED);
    this._indoorBlend += (targetIndoor - this._indoorBlend) * blendStep;
    const outdoorBlend = 1 - this._indoorBlend;
    this.outdoorBlend = outdoorBlend;

    const gust = wind ? wind.gust : 0;

    // Cor da poeira a partir da neblina do horario (o ceu acabou de escrever nela)
    const fog = this.scene.fog as THREE.FogExp2;
    _skyFog.copy(fog.color);
    _dust.copy(STORM_DUST_COLOR).multiplyScalar(THREE.MathUtils.clamp(luma(_skyFog) / DAY_FOG_LUMA, NIGHT_DUST_BRIGHTNESS, 1));

    const clearOutdoorDensity =
      V.FOG_BASE_DENSITY
      + V.FOG_GUST_DENSITY_BOOST * gust
      + V.FOG_TWILIGHT_DENSITY_BOOST * twilight;
    const weatherFogDensity = clearOutdoorDensity + (W.WEATHER_FOG_DENSITY - clearOutdoorDensity) * haze;
    const edgeFogDensity = clearOutdoorDensity + (V.EDGE_FOG_MAX_DENSITY - clearOutdoorDensity) * edgeStrength;
    const outdoorDensity = Math.max(weatherFogDensity, edgeFogDensity);
    fog.density = THREE.MathUtils.lerp(outdoorDensity, V.FOG_INDOOR_DENSITY, this._indoorBlend);

    const gustWarmth = 0.08 * gust * outdoorBlend * (1 - haze);
    if (gustWarmth > 0.001) {
      fog.color.lerp(GUST_DUST_TINT, gustWarmth * THREE.MathUtils.clamp(luma(_skyFog) / DAY_FOG_LUMA, 0.25, 1));
    }
    fog.color.lerp(_dust, Math.max(edgeStrength, haze * 0.85) * (1 - 0.55 * this._indoorBlend));

    // A unica parede de nevoa marca a borda do mapa e nao causa dano.
    this.wall.visible = true;
    this.wallUniforms.uTime.value = this.time;
    this.wallUniforms.uOpacity.value = V.OUTER_WALL_OPACITY;
    this.wallUniforms.uColor.value.copy(_dust);

    // Cupula: usada nas tempestades de poeira e na borda do mapa.
    const domeOpacity = Math.max(W.WEATHER_DOME_OPACITY * haze, V.EDGE_DOME_MAX_OPACITY * edgeStrength)
      * (1 - 0.65 * this._indoorBlend);
    this.dome.visible = domeOpacity > 0.01;
    if (this.dome.visible) {
      this.dome.position.copy(camera.position);
      this.domeMaterial.color.copy(fog.color);
      this.domeMaterial.opacity = domeOpacity;
    }

    // Fora da base sempre ha poeira marciana em suspensao; dentro da base ela some suavemente.
    const ambientParticles = outdoorBlend * (V.AMBIENT_PARTICLE_OPACITY + V.GUST_PARTICLE_OPACITY * gust);
    const weatherParticles = outdoorBlend * W.WEATHER_PARTICLE_OPACITY * haze;
    const edgeParticles = edgeStrength * outdoorBlend;
    const particleOpacity = Math.max(ambientParticles, weatherParticles, edgeParticles);

    this.particles.visible = particleOpacity > 0.01;
    if (this.particles.visible) {
      this._updateParticles(dt, focus, particleOpacity, wind, edgeStrength > Math.max(haze, 0.15));
    }
  }

  private _updateParticles(
    dt: number,
    focus: THREE.Vector3,
    opacity: number,
    wind: WindState | null,
    edgePush: boolean,
  ): void {
    if (edgePush) {
      const rx = focus.x - DUST_STORM_CENTER.x;
      const rz = focus.z - DUST_STORM_CENTER.z;
      const len = Math.hypot(rx, rz) || 1;
      const outX = rx / len;
      const outZ = rz / len;
      const push = V.EDGE_WIND_PUSH;
      _wind.set(-outZ * (1 - push) - outX * push, -0.08, outX * (1 - push) - outZ * push)
        .normalize()
        .multiplyScalar(V.WIND_SPEED * (0.6 + 0.4 * this.strength));
    } else if (wind) {
      const baseSpeed = V.WIND_SPEED * (0.28 + 0.72 * wind.intensity);
      _wind.set(wind.dirX, -0.04, wind.dirZ).normalize().multiplyScalar(baseSpeed);
    } else {
      _wind.set(W.WEATHER_WIND.x, -0.05, W.WEATHER_WIND.z)
        .normalize()
        .multiplyScalar(V.WIND_SPEED * (0.35 + 0.65 * this.haze));
    }

    const box = this.particleUniforms.uBox.value;
    const offset = this.particleUniforms.uOffset.value;
    const fastOffset = this.particleUniforms.uFastOffset.value;
    // O deslocamento volta a cada caixa: o shader ja da a volta, e o numero nao cresce sem fim
    offset.x = (offset.x + _wind.x * dt) % box.x;
    offset.y = (offset.y + _wind.y * dt) % box.y;
    offset.z = (offset.z + _wind.z * dt) % box.z;

    fastOffset.x = (fastOffset.x + _wind.x * 2.35 * dt) % box.x;
    fastOffset.y = (fastOffset.y + _wind.y * 1.4 * dt) % box.y;
    fastOffset.z = (fastOffset.z + _wind.z * 2.35 * dt) % box.z;

    this.particleUniforms.uTime.value = this.time;
    this.particleUniforms.uOpacity.value = opacity;
    this.particleUniforms.uGust.value = wind ? wind.gust : this.haze;
    this.particleUniforms.uWind.value.copy(_wind).normalize();
    // Um pouco mais clara que a neblina, para aparecer contra ela e brilhar na luz
    this.particleUniforms.uColor.value.copy(_dust).lerp(_skyFog, 0.45).multiplyScalar(1.12);
    this.particleUniforms.uHighlightColor.value.copy(_skyFog).lerp(GUST_DUST_TINT, 0.35).multiplyScalar(1.22);
    // Tamanho do ponto proporcional a altura da imagem, como na projecao da camera
    this.particleUniforms.uScale.value = this.renderer.domElement.height * 0.5 * V.PARTICLE_SIZE_SCALE;
  }
}
