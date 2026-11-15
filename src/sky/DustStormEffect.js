import * as THREE from 'three';
import { DUST_STORM_VISUAL_CONFIG as V, DUST_WEATHER_CONFIG as W, WORLD_CONFIG } from '../config/constants.js';
import {
  DUST_STORM_CENTER,
  DUST_STORM_WALL_RADIUS,
  DUST_STORM_WORLD_RADIUS,
} from '../world/dustStormZone.js';

// Uma unica frente de nevoa marca a borda do mapa. O clima temporizado (#103) continua
// controlando neblina, cupula e particulas no mapa todo.

// Poeira da tempestade de dia: ferrugem escura, bem diferente do ceu caramelo, para a parede
// aparecer de longe. A noite escurece junto com a neblina do ceu, mas nunca some no escuro.
const STORM_DUST_COLOR = new THREE.Color(0x8a4521);
const DAY_FOG_LUMA = luma(new THREE.Color(0xe6cba6)); // FOG_DAY_COLOR do MarsSkySystem
const NIGHT_DUST_BRIGHTNESS = 0.22;
const _skyFog = new THREE.Color();
const _dust = new THREE.Color();
const _wind = new THREE.Vector3();
const WALL_NOISE_PERIOD = 24;
// Clima sem poeira (padrao do update)
const NO_WEATHER = Object.freeze({ haze: 0, front: 0, indoors: false });

function luma(c) {
  return c.r * 0.2126 + c.g * 0.7152 + c.b * 0.0722;
} // celulas de ruido em volta do anel (inteiro, para fechar sem emenda)

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

    // Duas camadas de nuvem rolando em sentidos diferentes
    float n = noise(vec2(around + uTime * 0.16, h * 4.0 - uTime * 0.22), PERIOD) * 0.65
            + noise(vec2(around * 2.0 - uTime * 0.38, h * 9.0 - uTime * 0.55), PERIOD * 2.0) * 0.35;

    // Topo irregular, como uma nuvem; o pe e mais denso e mais escuro
    float top = 0.42 + n * 0.55;
    float alpha = (1.0 - smoothstep(top - 0.2, top, h)) * (0.78 + 0.22 * n);
    alpha *= smoothstep(uFadeNear, uFadeFar, distance(cameraPosition.xz, vWorld.xz));
    alpha *= uOpacity;
    if (alpha < 0.01) discard;

    vec3 col = uColor * (0.55 + 0.95 * n) * (0.85 + 0.3 * h);
    gl_FragColor = vec4(col, alpha);
    #include <colorspace_fragment>
  }
`;

const PARTICLE_VERTEX = /* glsl */ `
  uniform float uTime;
  uniform float uScale;
  uniform vec3 uBox;
  uniform vec3 uOffset;
  attribute float aSeed;
  varying float vAlpha;

  void main() {
    vec3 p = position + uOffset;
    p.y += sin(uTime * 2.3 + aSeed * 40.0) * 0.6;
    p.x += sin(uTime * 1.7 + aSeed * 23.0) * 0.4;
    // Caixa de poeira que acompanha a camera: quem sai por um lado volta pelo outro
    p = mod(p - cameraPosition + uBox * 0.5, uBox) - uBox * 0.5 + cameraPosition;

    vec4 mv = viewMatrix * vec4(p, 1.0);
    gl_PointSize = min((0.6 + 1.6 * aSeed) * uScale / max(-mv.z, 0.5), 7.0);

    // Some perto das faces da caixa, para a volta nao aparecer
    vec3 q = abs(p - cameraPosition) / (uBox * 0.5);
    vAlpha = (1.0 - smoothstep(0.7, 1.0, max(q.x, max(q.y, q.z)))) * (0.35 + 0.65 * aSeed);
    gl_Position = projectionMatrix * mv;
  }
`;

const PARTICLE_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vAlpha;
  void main() {
    gl_FragColor = vec4(uColor, vAlpha * uOpacity);
    #include <colorspace_fragment>
  }
`;

export class DustStormEffect {
  constructor(scene, renderer) {
    this.scene = scene;
    this.renderer = renderer;
    this.time = 0;
    this.haze = 0;

    this._buildWall();
    this._buildOverheadFog();
    this._buildDome();
    this._buildParticles();
  }

  _buildWall() {
    const outer = this._createWall(DUST_STORM_WALL_RADIUS, V.OUTER_WALL_OPACITY);
    this.wall = outer.mesh;
    this.wallUniforms = outer.uniforms;
  }

  _createWall(radius, opacity) {
    const geometry = new THREE.CylinderGeometry(radius, radius, V.WALL_HEIGHT, 128, 1, true);
    const uniforms = {
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

  _buildOverheadFog() {
    this.overheadFogMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.DoubleSide,
      fog: false,
    });
    const geometry = new THREE.RingGeometry(DUST_STORM_WALL_RADIUS, DUST_STORM_WORLD_RADIUS, 128, 2);
    const mesh = new THREE.Mesh(geometry, this.overheadFogMaterial);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(DUST_STORM_CENTER.x, WORLD_CONFIG.GROUND_LEVEL + V.OVERHEAD_FOG_HEIGHT, DUST_STORM_CENTER.z);
    mesh.frustumCulled = false;
    mesh.renderOrder = 1;
    this.scene.add(mesh);
    this.overheadFog = mesh;
  }

  _buildDome() {
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

  _buildParticles() {
    const count = V.PARTICLE_COUNT;
    const box = V.PARTICLE_BOX;
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * box.x;
      positions[i * 3 + 1] = (Math.random() - 0.5) * box.y;
      positions[i * 3 + 2] = (Math.random() - 0.5) * box.z;
      seeds[i] = Math.random();
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));

    this.particleUniforms = {
      uTime: { value: 0 },
      uScale: { value: 300 },
      uBox: { value: new THREE.Vector3(box.x, box.y, box.z) },
      uOffset: { value: new THREE.Vector3() },
      uColor: { value: new THREE.Color() },
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
  // `weather`: { haze, front, indoors } da tempestade de poeira do clima (0 a 1)
  update(dt, camera, weather = NO_WEATHER) {
    this.time += dt;
    const haze = weather.haze;
    this.haze = haze;

    // Cor da poeira a partir da neblina do horario (o ceu acabou de escrever nela)
    const fog = this.scene.fog;
    _skyFog.copy(fog.color);
    _dust.copy(STORM_DUST_COLOR).multiplyScalar(THREE.MathUtils.clamp(luma(_skyFog) / DAY_FOG_LUMA, NIGHT_DUST_BRIGHTNESS, 1));

    fog.density = V.FOG_BASE_DENSITY + (W.WEATHER_FOG_DENSITY - V.FOG_BASE_DENSITY) * haze;
    fog.color.lerp(_dust, haze * 0.85);

    // A unica parede de nevoa marca a borda do mapa e nao causa dano.
    this.wall.visible = true;
    this.wallUniforms.uTime.value = this.time;
    this.wallUniforms.uOpacity.value = V.OUTER_WALL_OPACITY;
    this.wallUniforms.uColor.value.copy(_dust);

    // A nevoa externa e visivel de cima, mas nao cobre o mapa na altura do jogador.
    const viewHeight = camera.position.y - WORLD_CONFIG.GROUND_LEVEL;
    const overheadVisibility = THREE.MathUtils.smoothstep(
      viewHeight,
      V.OVERHEAD_FOG_VIEW_START,
      V.OVERHEAD_FOG_VIEW_END
    );
    this.overheadFog.visible = overheadVisibility > 0.005;
    this.overheadFogMaterial.color.copy(_dust);
    this.overheadFogMaterial.opacity = V.OVERHEAD_OUTER_BAND_OPACITY * overheadVisibility;

    // Cupula: usada apenas nas tempestades de poeira temporizadas do clima.
    const domeOpacity = W.WEATHER_DOME_OPACITY * haze;
    this.dome.visible = domeOpacity > 0.01;
    if (this.dome.visible) {
      this.dome.position.copy(camera.position);
      this.domeMaterial.color.copy(fog.color);
      this.domeMaterial.opacity = domeOpacity;
    }

    // Particulas: algumas rajadas ja perto da borda, nuvem cheia dentro da tempestade
    // Dentro da base a poeira do clima fica la fora (so a da borda segue a camera)
    const weatherParticles = weather.indoors ? 0 : W.WEATHER_PARTICLE_OPACITY * haze;
    const particleOpacity = weatherParticles;
    this.particles.visible = particleOpacity > 0.01;
    if (this.particles.visible) this._updateParticles(dt, particleOpacity);
  }

  _updateParticles(dt, opacity) {
    _wind.set(W.WEATHER_WIND.x, -0.05, W.WEATHER_WIND.z)
      .normalize()
      .multiplyScalar(V.WIND_SPEED * (0.6 + 0.4 * this.haze));

    const box = this.particleUniforms.uBox.value;
    const offset = this.particleUniforms.uOffset.value;
    // O deslocamento volta a cada caixa: o shader ja da a volta, e o numero nao cresce sem fim
    offset.x = (offset.x + _wind.x * dt) % box.x;
    offset.y = (offset.y + _wind.y * dt) % box.y;
    offset.z = (offset.z + _wind.z * dt) % box.z;

    this.particleUniforms.uTime.value = this.time;
    this.particleUniforms.uOpacity.value = opacity;
    // Um pouco mais clara que a neblina, para aparecer contra ela
    this.particleUniforms.uColor.value.copy(_dust).lerp(_skyFog, 0.4).multiplyScalar(1.15);
    // Tamanho do ponto proporcional a altura da imagem, como na projecao da camera
    this.particleUniforms.uScale.value = this.renderer.domElement.height * 0.5 * 0.06;
  }
}
