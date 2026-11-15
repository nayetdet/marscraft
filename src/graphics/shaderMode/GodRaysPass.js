import * as THREE from 'three';
import { FullScreenQuad, Pass } from 'three/addons/postprocessing/Pass.js';
import { GRAPHICS_CONFIG } from '../../config/constants.js';

const VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

// Passo 1 (meia resolucao): cada pixel caminha na direcao do Sol somando quanto ceu aberto
// encontra. Onde um bloco tapa o Sol a soma e menor, e isso desenha os feixes de luz.
const RAYS_FRAGMENT = /* glsl */ `
  #include <packing>
  varying vec2 vUv;
  uniform highp sampler2D tDepth;
  uniform vec2 uSunUv;
  uniform float uAspect;
  uniform float uNear;
  uniform float uFar;
  uniform float uSkyDistance;
  uniform float uDensity;
  uniform float uDecay;

  float skyMask(vec2 uv) {
    float depth = texture2D(tDepth, uv).x;
    float dist = -perspectiveDepthToViewZ(depth, uNear, uFar);
    float open = step(uSkyDistance, dist);
    vec2 d = uv - uSunUv;
    d.x *= uAspect;
    // Clarao em volta do Sol: forte perto do disco, fraco no resto do ceu
    float glow = pow(clamp(1.0 - length(d) / 0.42, 0.0, 1.0), 3.0);
    return open * (0.03 + 0.97 * glow);
  }

  void main() {
    vec2 delta = (uSunUv - vUv) * (uDensity / float(SAMPLES));
    // Ruido por pixel no ponto de partida: troca as faixas da amostragem por granulado fino
    float jitter = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
    vec2 uv = vUv + delta * jitter;
    float light = 0.0;
    float weight = 1.0;
    for (int i = 0; i < SAMPLES; i++) {
      light += skyMask(uv) * weight;
      weight *= uDecay;
      uv += delta;
    }
    gl_FragColor = vec4(vec3(light / float(SAMPLES)), 1.0);
  }
`;

// Passo 2: soma os feixes (ampliados e suavizados) por cima da cena
const COMPOSITE_FRAGMENT = /* glsl */ `
  varying vec2 vUv;
  uniform sampler2D tDiffuse;
  uniform sampler2D tRays;
  uniform vec2 uTexel;
  uniform vec3 uColor;
  uniform float uStrength;

  void main() {
    vec4 scene = texture2D(tDiffuse, vUv);
    float rays = texture2D(tRays, vUv).r * 0.4
      + texture2D(tRays, vUv + vec2(uTexel.x, uTexel.y)).r * 0.15
      + texture2D(tRays, vUv + vec2(-uTexel.x, uTexel.y)).r * 0.15
      + texture2D(tRays, vUv + vec2(uTexel.x, -uTexel.y)).r * 0.15
      + texture2D(tRays, vUv + vec2(-uTexel.x, -uTexel.y)).r * 0.15;
    gl_FragColor = vec4(scene.rgb + uColor * rays * uStrength, scene.a);
  }
`;

// Raios de luz em espaco de tela. Le a cor e a profundidade do buffer de leitura do composer,
// entao precisa vir logo depois do RenderPass.
export class GodRaysPass extends Pass {
  constructor(camera) {
    super();
    this.camera = camera;
    this.strength = 0;
    this.sunColor = new THREE.Color(1, 1, 1);
    this.sunUv = new THREE.Vector2(0.5, 0.5);

    this.raysTarget = new THREE.WebGLRenderTarget(1, 1, { depthBuffer: false });
    this.raysTarget.texture.name = 'GodRaysPass.rays';

    this.raysMaterial = new THREE.ShaderMaterial({
      defines: { SAMPLES: GRAPHICS_CONFIG.GODRAYS_SAMPLES },
      uniforms: {
        tDepth: { value: null },
        uSunUv: { value: this.sunUv },
        uAspect: { value: 1 },
        uNear: { value: camera.near },
        uFar: { value: camera.far },
        uSkyDistance: { value: GRAPHICS_CONFIG.GODRAYS_SKY_DISTANCE },
        uDensity: { value: GRAPHICS_CONFIG.GODRAYS_DENSITY },
        uDecay: { value: GRAPHICS_CONFIG.GODRAYS_DECAY },
      },
      vertexShader: VERTEX,
      fragmentShader: RAYS_FRAGMENT,
      depthTest: false,
      depthWrite: false,
    });

    this.compositeMaterial = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        tRays: { value: this.raysTarget.texture },
        uTexel: { value: new THREE.Vector2(1, 1) },
        uColor: { value: this.sunColor },
        uStrength: { value: 0 },
      },
      vertexShader: VERTEX,
      fragmentShader: COMPOSITE_FRAGMENT,
      depthTest: false,
      depthWrite: false,
    });

    this._quad = new FullScreenQuad(this.raysMaterial);
  }

  setSize(width, height) {
    const w = Math.max(1, Math.floor(width / 2));
    const h = Math.max(1, Math.floor(height / 2));
    this.raysTarget.setSize(w, h);
    this.compositeMaterial.uniforms.uTexel.value.set(1 / w, 1 / h);
    this.raysMaterial.uniforms.uAspect.value = width / Math.max(1, height);
  }

  render(renderer, writeBuffer, readBuffer) {
    const rays = this.raysMaterial.uniforms;
    rays.tDepth.value = readBuffer.depthTexture;
    rays.uNear.value = this.camera.near;
    rays.uFar.value = this.camera.far;
    this._quad.material = this.raysMaterial;
    renderer.setRenderTarget(this.raysTarget);
    this._quad.render(renderer);

    const composite = this.compositeMaterial.uniforms;
    composite.tDiffuse.value = readBuffer.texture;
    composite.uStrength.value = this.strength;
    this._quad.material = this.compositeMaterial;
    renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer);
    this._quad.render(renderer);
  }

  dispose() {
    this.raysTarget.dispose();
    this.raysMaterial.dispose();
    this.compositeMaterial.dispose();
    this._quad.dispose();
  }
}
