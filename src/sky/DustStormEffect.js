import * as THREE from 'three';
import { DUST_STORM_VISUAL_CONFIG as V, DUST_WEATHER_CONFIG as W, SURVIVAL_CONFIG, WORLD_CONFIG } from '../config/constants.js';
import {
  DUST_STORM_CENTER,
  DUST_STORM_MIDDLE_WALL_RADIUS,
  DUST_STORM_WALL_RADIUS,
  dustStormProximity,
  DUST_STORM_WORLD_RADIUS,
  dustStormVisualStrength,
} from '../world/dustStormZone.js';

// Tempestade de poeira que cerca a area jogavel. Tudo na GPU, sem overlay em tela cheia no HTML:
//   1. Tres frentes de poeira: avisam da borda e marcam o aumento da nevoa em duas etapas.
//   2. Cupula de poeira em volta da camera: tinge o ceu, que a neblina nao alcanca.
//   3. Particulas de poeira carregadas pelo vento, que sopra de volta para a base.
// A neblina da cena engrossa junto. Cada parte so e desenhada quando aparece.
// A tempestade de poeira do clima (issue #103, src/mission/dustWeather.js) usa as mesmas tres
// partes no mapa todo: a parede vira a frente de poeira no horizonte durante o aviso, e a
// neblina, a cupula e as particulas engrossam com a opacidade do ar (`weather.haze`).

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

const OVERHEAD_VERTEX = /* glsl */ `
  varying vec2 vWorld;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const OVERHEAD_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform float uOpacity;
  uniform float uInner;
  uniform float uOuter;
  uniform vec2 uCenter;
  uniform vec3 uColor;
  varying vec2 vWorld;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  void main() {
    float radius = distance(vWorld, uCenter);
    float edge = min(radius - uInner, uOuter - radius);
    float edgeFade = smoothstep(0.0, 3.5, edge);
    float grain = hash(floor(vWorld * 0.16 + uTime * 0.04));
    float alpha = uOpacity * edgeFade * (0.82 + grain * 0.18);
    if (alpha < 0.005) discard;
    gl_FragColor = vec4(uColor, alpha);
    #include <colorspace_fragment>
  }
`;

export class DustStormEffect {
  constructor(scene, renderer) {
    this.scene = scene;
    this.renderer = renderer;
    this.time = 0;
    this.strength = 0;
    this.haze = 0;

    this._buildWall();
    this._buildOverheadFog();
    this._buildDome();
    this._buildParticles();
  }

  _buildWall() {
    const inner = this._createWall(SURVIVAL_CONFIG.DUST_STORM_START_RADIUS, V.INNER_WALL_OPACITY);
    this.innerWall = inner.mesh;
    this.innerWallUniforms = inner.uniforms;

    const middle = this._createWall(DUST_STORM_MIDDLE_WALL_RADIUS, V.MIDDLE_WALL_OPACITY);
    this.middleWall = middle.mesh;
    this.middleWallUniforms = middle.uniforms;

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
    const bands = [
      [SURVIVAL_CONFIG.DUST_STORM_START_RADIUS, DUST_STORM_MIDDLE_WALL_RADIUS, V.OVERHEAD_INNER_BAND_OPACITY],
      [DUST_STORM_MIDDLE_WALL_RADIUS, DUST_STORM_WALL_RADIUS, V.OVERHEAD_MIDDLE_BAND_OPACITY],
      [DUST_STORM_WALL_RADIUS, DUST_STORM_WORLD_RADIUS, V.OVERHEAD_OUTER_BAND_OPACITY],
    ];
    this.overheadFog = bands.map(([inner, outer, opacity]) => {
      const uniforms = {
        uTime: { value: 0 },
        uOpacity: { value: opacity },
        uInner: { value: inner },
        uOuter: { value: outer },
        uCenter: { value: new THREE.Vector2(DUST_STORM_CENTER.x, DUST_STORM_CENTER.z) },
        uColor: { value: new THREE.Color() },
      };
      const material = new THREE.ShaderMaterial({
        vertexShader: OVERHEAD_VERTEX,
        fragmentShader: OVERHEAD_FRAGMENT,
        uniforms,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        fog: false,
      });
      const geometry = new THREE.PlaneGeometry(outer * 2, outer * 2, 1, 1);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(DUST_STORM_CENTER.x, WORLD_CONFIG.GROUND_LEVEL + V.OVERHEAD_FOG_HEIGHT, DUST_STORM_CENTER.z);
      mesh.frustumCulled = false;
      mesh.renderOrder = 1;
      this.scene.add(mesh);
      return { mesh, uniforms };
    });
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

  // `focus`: onde o jogador (ou o rover) esta, para medir a tempestade.
  // `camera`: de onde a cena e vista, para posicionar a cupula e as particulas.
  // Chamar depois do MarsSkySystem.update, que acerta a cor da neblina do horario.
  // `weather`: { haze, front, indoors } da tempestade de poeira do clima (0 a 1)
  update(dt, focus, camera, weather = NO_WEATHER) {
    this.time += dt;
    const strength = dustStormVisualStrength(focus.x, focus.z);
    const haze = weather.haze;
    this.strength = strength;
    this.haze = haze;

    // Cor da poeira a partir da neblina do horario (o ceu acabou de escrever nela)
    const fog = this.scene.fog;
    _skyFog.copy(fog.color);
    _dust.copy(STORM_DUST_COLOR).multiplyScalar(THREE.MathUtils.clamp(luma(_skyFog) / DAY_FOG_LUMA, NIGHT_DUST_BRIGHTNESS, 1));

    // Neblina: engrossa devagar no comeco e fecha a vista perto do raio fatal
    fog.density = Math.max(
      V.FOG_BASE_DENSITY + (V.FOG_MAX_DENSITY - V.FOG_BASE_DENSITY) * strength,
      V.FOG_BASE_DENSITY + (W.WEATHER_FOG_DENSITY - V.FOG_BASE_DENSITY) * haze
    );
    // A cor vira poeira logo: passar da parede nunca deixa a vista mais limpa que a propria parede
    fog.color.lerp(_dust, Math.max(strength, haze * 0.85));

    // A parede marca a borda do mapa; o shader esmaece apenas o trecho muito perto da camera.
    this.wall.visible = true;
    this.wallUniforms.uTime.value = this.time;
    this.wallUniforms.uOpacity.value = V.OUTER_WALL_OPACITY;
    this.wallUniforms.uColor.value.copy(_dust);
    this.middleWall.visible = true;
    this.middleWallUniforms.uTime.value = this.time;
    this.middleWallUniforms.uOpacity.value = V.MIDDLE_WALL_OPACITY;
    this.middleWallUniforms.uColor.value.copy(_dust);
    this.innerWall.visible = true;
    this.innerWallUniforms.uTime.value = this.time;
    this.innerWallUniforms.uOpacity.value = V.INNER_WALL_OPACITY;
    this.innerWallUniforms.uColor.value.copy(_dust);

    // Faixas vistas de cima: surgem com a altitude da camera para nao cobrir o chao na caminhada.
    const viewHeight = camera.position.y - WORLD_CONFIG.GROUND_LEVEL;
    const overheadVisibility = THREE.MathUtils.smoothstep(
      viewHeight,
      V.OVERHEAD_FOG_VIEW_START,
      V.OVERHEAD_FOG_VIEW_END
    );
    for (const band of this.overheadFog) {
      band.uniforms.uTime.value = this.time;
      band.uniforms.uColor.value.copy(_dust);
      band.mesh.visible = overheadVisibility > 0.005;
    }
    this.overheadFog[0].uniforms.uOpacity.value = V.OVERHEAD_INNER_BAND_OPACITY * overheadVisibility;
    this.overheadFog[1].uniforms.uOpacity.value = V.OVERHEAD_MIDDLE_BAND_OPACITY * overheadVisibility;
    this.overheadFog[2].uniforms.uOpacity.value = V.OVERHEAD_OUTER_BAND_OPACITY * overheadVisibility;

    // Cupula: mesma cor da neblina, para o chao e o ceu sumirem juntos na poeira
    const domeOpacity = Math.max(
      V.DOME_MAX_OPACITY * strength,
      W.WEATHER_DOME_OPACITY * haze
    );
    this.dome.visible = domeOpacity > 0.01;
    if (this.dome.visible) {
      this.dome.position.copy(camera.position);
      this.domeMaterial.color.copy(fog.color);
      this.domeMaterial.opacity = domeOpacity;
    }

    // Particulas: algumas rajadas ja perto da borda, nuvem cheia dentro da tempestade
    // Dentro da base a poeira do clima fica la fora (so a da borda segue a camera)
    const edgeParticles = strength;
    const weatherParticles = weather.indoors ? 0 : W.WEATHER_PARTICLE_OPACITY * haze;
    const particleOpacity = Math.max(edgeParticles, weatherParticles);
    this.particles.visible = particleOpacity > 0.01;
    if (this.particles.visible) this._updateParticles(dt, focus, particleOpacity, weatherParticles > edgeParticles);
  }

  _updateParticles(dt, focus, opacity, weatherWind) {
    if (weatherWind) {
      // Vento da tempestade do clima: sopra numa direcao so, no mapa todo
      _wind.set(W.WEATHER_WIND.x, -0.05, W.WEATHER_WIND.z)
        .normalize()
        .multiplyScalar(V.WIND_SPEED * (0.6 + 0.4 * this.haze));
    } else {
      // Vento que gira em volta da base e empurra de volta para ela
      const rx = focus.x - DUST_STORM_CENTER.x;
      const rz = focus.z - DUST_STORM_CENTER.z;
      const len = Math.hypot(rx, rz) || 1;
      const outX = rx / len;
      const outZ = rz / len;
      const push = V.WIND_PUSH;
      _wind.set(-outZ * (1 - push) - outX * push, -0.08, outX * (1 - push) - outZ * push)
        .normalize()
        .multiplyScalar(V.WIND_SPEED * (0.6 + 0.4 * this.strength));
    }

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
