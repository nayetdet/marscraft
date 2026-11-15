import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { GRAPHICS_CONFIG } from '../../config/constants.js';
import { isInsidePressurizedVolume } from '../../world/habitatLayout.js';
import { GodRaysPass } from './GodRaysPass.js';
import { shadowLightDirection, snapShadowCenter } from './shadowRig.js';
import { FrameBudgetGuard, SHADER_PREF, readShaderPref, resolveShaderMode, writeShaderPref } from './shaderSettings.js';

// Ultimo passe, com a imagem ja em cores de tela: saturacao, contraste e vinheta
const FINISH_SHADER = {
  uniforms: {
    tDiffuse: { value: null },
    uSaturation: { value: GRAPHICS_CONFIG.GRADE_SATURATION },
    uContrast: { value: GRAPHICS_CONFIG.GRADE_CONTRAST },
    uVignette: { value: GRAPHICS_CONFIG.GRADE_VIGNETTE },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position.xy, 0.0, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    varying vec2 vUv;
    uniform sampler2D tDiffuse;
    uniform float uSaturation;
    uniform float uContrast;
    uniform float uVignette;
    void main() {
      vec3 color = texture2D(tDiffuse, vUv).rgb;
      float luma = dot(color, vec3(0.299, 0.587, 0.114));
      color = mix(vec3(luma), color, uSaturation);
      color = (color - 0.5) * uContrast + 0.5;
      vec2 d = vUv - 0.5;
      color *= 1.0 - uVignette * smoothstep(0.25, 0.85, dot(d, d) * 2.0);
      gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
    }
  `,
};

const _lightDir = new THREE.Vector3();
const _center = new THREE.Vector3();
const _camPos = new THREE.Vector3();
const _forward = new THREE.Vector3();
const _flat = new THREE.Vector3();
const _sunPoint = new THREE.Vector3();
const _size = new THREE.Vector2();
// Segundos entre as varreduras que marcam objetos novos (drops, plantas) para receber sombra
const SHADOW_SWEEP_SECONDS = 2;

function isLit(material) {
  return Boolean(material.isMeshLambertMaterial || material.isMeshStandardMaterial
    || material.isMeshPhongMaterial || material.isMeshToonMaterial);
}

// Modo "Shaders": sombra do Sol em tempo real, luz mais contrastada, bloom, raios de luz e tone
// mapping. Desligado, o jogo desenha exatamente como antes (direto na tela, sem pos-processamento).
export class ShaderMode {
  constructor({ renderer, scene, camera, sky, worldGroup = null, glowMaterials = [], gpuName = '', storage = null, coarsePointer = false, onChange = () => {} }) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.sky = sky;
    // Grupo dos chunks de blocos: sempre fazem sombra (o teto da base e feito deles)
    this.worldGroup = worldGroup;
    this.glowMaterials = glowMaterials;
    this.storage = storage;
    this.onChange = onChange;

    const mode = resolveShaderMode({ pref: readShaderPref(storage), gpuName, coarsePointer });
    this.enabled = false;
    // Automatico = o jogador ainda nao escolheu; so nesse caso a protecao de desempenho age
    this.auto = mode.auto;
    this.guard = new FrameBudgetGuard();
    this.exposure = GRAPHICS_CONFIG.EXPOSURE_OUTSIDE;
    this._sweepTimer = 0;
    this._interiorLights = [];
    this._composer = null;
    this._godRays = null;

    // Fica sempre ligado no renderer: sem nenhuma luz com castShadow, nao custa nada. Quem liga e
    // desliga a sombra de verdade e sunLight.castShadow.
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // Com varios passes por quadro, o contador de draw calls (F3) e zerado por quadro, a mao
    renderer.info.autoReset = false;

    const sun = sky.sunLight;
    const extent = GRAPHICS_CONFIG.SHADOW_EXTENT;
    sun.shadow.mapSize.set(GRAPHICS_CONFIG.SHADOW_MAP_SIZE, GRAPHICS_CONFIG.SHADOW_MAP_SIZE);
    sun.shadow.camera.left = -extent;
    sun.shadow.camera.right = extent;
    sun.shadow.camera.top = extent;
    sun.shadow.camera.bottom = -extent;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = GRAPHICS_CONFIG.SHADOW_LIGHT_DISTANCE * 2;
    sun.shadow.camera.updateProjectionMatrix();
    sun.shadow.bias = GRAPHICS_CONFIG.SHADOW_BIAS;
    sun.shadow.normalBias = GRAPHICS_CONFIG.SHADOW_NORMAL_BIAS;
    // O alvo na cena, na origem, da a mesma direcao de luz de antes enquanto o modo esta desligado
    scene.add(sun.target);

    if (mode.enabled) this._apply(true);
  }

  // Escolha do jogador pelo menu: fica salva e desliga a protecao automatica
  setEnabledByPlayer(enabled) {
    this.auto = false;
    writeShaderPref(this.storage, enabled ? SHADER_PREF.ON : SHADER_PREF.OFF);
    this._apply(enabled);
  }

  toggle() {
    this.setEnabledByPlayer(!this.enabled);
    return this.enabled;
  }

  _apply(enabled) {
    if (enabled === this.enabled) return;
    this.enabled = enabled;
    const { renderer, sky } = this;

    if (enabled) {
      this._ensureComposer();
      this._markShadows();
      this._sweepTimer = 0;
      this._interiorLights = [];
      this.scene.traverse((obj) => {
        if (!obj.isPointLight) return;
        this._interiorLights.push({ light: obj, base: obj.intensity });
        obj.intensity *= GRAPHICS_CONFIG.INTERIOR_LIGHT_SCALE;
      });
      for (const material of this.glowMaterials) {
        material.userData.baseEmissiveIntensity = material.emissiveIntensity;
        material.emissiveIntensity *= GRAPHICS_CONFIG.EMISSIVE_SCALE;
      }
      this.exposure = GRAPHICS_CONFIG.EXPOSURE_OUTSIDE;
      this._setSunBoost(GRAPHICS_CONFIG.SUN_DISC_BOOST);
      renderer.toneMapping = THREE.NeutralToneMapping;
      this.guard.reset();
    } else {
      for (const { light, base } of this._interiorLights) light.intensity = base;
      this._interiorLights = [];
      for (const material of this.glowMaterials) {
        material.emissiveIntensity = material.userData.baseEmissiveIntensity ?? material.emissiveIntensity;
      }
      sky.sunLight.target.position.set(0, 0, 0);
      this._setSunBoost(1);
      renderer.toneMapping = THREE.NoToneMapping;
      renderer.toneMappingExposure = 1;
    }
    sky.sunLight.castShadow = enabled;
    this.onChange(enabled);
  }

  _setSunBoost(value) {
    const boost = this.sky.sunMesh.material.uniforms?.uBoost;
    if (boost) boost.value = value;
  }

  _ensureComposer() {
    if (this._composer) return;
    const { renderer } = this;
    renderer.getDrawingBufferSize(_size);
    const target = new THREE.WebGLRenderTarget(_size.x, _size.y, {
      type: THREE.HalfFloatType,
      depthTexture: new THREE.DepthTexture(_size.x, _size.y),
    });
    target.texture.name = 'ShaderMode.scene';
    const composer = new EffectComposer(renderer, target);
    // O alvo ja esta em pixels do dispositivo
    composer.setPixelRatio(1);
    composer.addPass(new RenderPass(this.scene, this.camera));
    this._godRays = new GodRaysPass(this.camera);
    composer.addPass(this._godRays);
    composer.addPass(new UnrealBloomPass(
      new THREE.Vector2(_size.x, _size.y),
      GRAPHICS_CONFIG.BLOOM_STRENGTH,
      GRAPHICS_CONFIG.BLOOM_RADIUS,
      GRAPHICS_CONFIG.BLOOM_THRESHOLD
    ));
    composer.addPass(new OutputPass());
    composer.addPass(new ShaderPass(FINISH_SHADER));
    composer.setSize(_size.x, _size.y);
    this._composer = composer;
  }

  // Marca quem faz e quem recebe sombra. Materiais sem luz (telas, ceu, efeitos) ficam de fora;
  // o que e transparente (vidro) recebe mas nao faz sombra, entao o Sol entra pelas janelas.
  _markShadows() {
    const skip = this.sky.celestialGroup;
    const visit = (obj, inCamera) => {
      if (obj === skip) return;
      if (obj.isMesh) {
        const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
        const lit = materials.some(isLit);
        const transparent = materials.some((m) => m.transparent);
        obj.receiveShadow = lit;
        // Moveis dentro da base ficam sob o teto: nao precisam entrar no mapa de sombra do Sol
        const m = obj.matrixWorld.elements;
        const indoors = !obj.isInstancedMesh && obj.parent !== this.worldGroup
          && isInsidePressurizedVolume(m[12], m[13], m[14]);
        obj.castShadow = lit && !transparent && !inCamera && !indoors;
      }
      const nested = inCamera || obj === this.camera;
      for (const child of obj.children) visit(child, nested);
    };
    visit(this.scene, false);
  }

  setSize() {
    if (!this._composer) return;
    this.renderer.getDrawingBufferSize(_size);
    this._composer.setSize(_size.x, _size.y);
  }

  // Chamar uma vez por quadro, depois de sky.update (que define a luz base) e antes de render
  update(dt, { inside = false } = {}) {
    if (!this.enabled) return;
    const { sky, camera } = this;
    const sun = sky.sunLight;
    const sunDir = sky.sunDirection;
    const day = sky.dayStrength;

    this._sweepTimer += dt;
    if (this._sweepTimer >= SHADOW_SWEEP_SECONDS) {
      this._sweepTimer = 0;
      this._markShadows();
    }

    camera.getWorldPosition(_camPos);
    camera.getWorldDirection(_forward);

    // Sombra: a area acompanha a camera, um pouco adiantada na direcao do olhar
    shadowLightDirection(sunDir, GRAPHICS_CONFIG.SHADOW_MIN_ELEVATION, _lightDir);
    _flat.set(_forward.x, 0, _forward.z);
    if (_flat.lengthSq() > 1e-6) _flat.normalize();
    _center.copy(_camPos).addScaledVector(_flat, GRAPHICS_CONFIG.SHADOW_EXTENT * GRAPHICS_CONFIG.SHADOW_LOOK_AHEAD);
    const texel = (GRAPHICS_CONFIG.SHADOW_EXTENT * 2) / GRAPHICS_CONFIG.SHADOW_MAP_SIZE;
    snapShadowCenter(_center, _lightDir, texel, _center);
    sun.target.position.copy(_center);
    sun.position.copy(_center).addScaledVector(_lightDir, GRAPHICS_CONFIG.SHADOW_LIGHT_DISTANCE);

    // Luz: Sol mais forte, ambiente mais fraco (o contraste e que faz a sombra aparecer)
    sun.intensity *= THREE.MathUtils.lerp(GRAPHICS_CONFIG.SUN_SCALE_NIGHT, GRAPHICS_CONFIG.SUN_SCALE_DAY, day);
    sky.baseAmbient.intensity *= GRAPHICS_CONFIG.AMBIENT_SCALE;
    sky.ambientLight.intensity *= GRAPHICS_CONFIG.HEMISPHERE_SCALE;

    // Exposicao: como o olho, abre no escuro (dentro da base, a noite) e fecha no Sol
    // (dentro a luz e das lampadas, entao a noite nao muda nada)
    const target = inside
      ? GRAPHICS_CONFIG.EXPOSURE_INSIDE
      : GRAPHICS_CONFIG.EXPOSURE_OUTSIDE * THREE.MathUtils.lerp(GRAPHICS_CONFIG.EXPOSURE_NIGHT_BOOST, 1, day);
    this.exposure += (target - this.exposure) * Math.min(1, dt * GRAPHICS_CONFIG.EXPOSURE_SPEED);
    this.renderer.toneMappingExposure = this.exposure;

    // Raios de luz: so quando o Sol esta acima do horizonte e na frente da camera
    const facing = _forward.dot(sunDir);
    const strength = GRAPHICS_CONFIG.GODRAYS_STRENGTH
      * THREE.MathUtils.smoothstep(facing, 0.05, 0.45)
      * THREE.MathUtils.smoothstep(sunDir.y, -0.08, 0.06)
      * (1 + (1 - THREE.MathUtils.clamp(sunDir.y, 0, 1)) * 0.8);
    const rays = this._godRays;
    rays.enabled = strength > 0.005;
    if (rays.enabled) {
      _sunPoint.copy(_camPos).addScaledVector(sunDir, 300).project(camera);
      rays.sunUv.set(_sunPoint.x * 0.5 + 0.5, _sunPoint.y * 0.5 + 0.5);
      rays.sunColor.copy(sun.color);
      rays.strength = strength;
    }
  }

  render() {
    this.renderer.info.reset();
    if (this.enabled) this._composer.render();
    else this.renderer.render(this.scene, this.camera);
  }

  // Protecao de desempenho: no modo automatico, FPS baixo por alguns segundos desliga os shaders.
  // Devolve true no quadro em que desligou.
  sampleFrame(frameMs) {
    if (!this.enabled || !this.auto) return false;
    if (!this.guard.sample(frameMs)) return false;
    writeShaderPref(this.storage, SHADER_PREF.AUTO_OFF);
    this._apply(false);
    return true;
  }
}
