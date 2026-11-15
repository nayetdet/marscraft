import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { GRAPHICS_CONFIG } from '../../config/constants.js';
import { GodRaysPass } from './GodRaysPass.js';
import { ACCENT_LIGHTS, accentIntensity } from './accentLights.js';
import { shadowLightDirection, snapShadowCenter } from './shadowRig.js';
import { FrameBudgetGuard, SHADER_PREF, readShaderPref, resolveShaderMode, writeShaderPref } from './shaderSettings.js';

// Ultimo passe, direto na tela: tone mapping e conversao para cores de tela (os dois vem do
// Three.js, pelo renderer.toneMapping e pelo destino) e, por cima, saturacao, contraste e vinheta.
// Um passe so, em vez de OutputPass + acabamento.
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
      gl_FragColor = vec4(texture2D(tDiffuse, vUv).rgb, 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      vec3 color = gl_FragColor.rgb;
      float luma = dot(color, vec3(0.299, 0.587, 0.114));
      color = mix(vec3(luma), color, uSaturation);
      color = (color - 0.5) * uContrast + 0.5;
      vec2 d = vUv - 0.5;
      color *= 1.0 - uVignette * smoothstep(0.25, 0.85, dot(d, d) * 2.0);
      gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
    }
  `,
};

// Luz secundaria de fora: o ceu preenche as sombras por cima (caramelo de dia, azulado no por do
// sol de Marte, frio a noite) e o chao devolve a luz do Sol por baixo (laranja).
const SKY_FILL_DAY = new THREE.Color(0xffe2c0);
const SKY_FILL_TWILIGHT = new THREE.Color(0x9db8e8);
const SKY_FILL_NIGHT = new THREE.Color(0x56607e);
const GROUND_BOUNCE_DAY = new THREE.Color(0xe08a52);
const GROUND_BOUNCE_NIGHT = new THREE.Color(0x3a2a24);
// Dentro da base o rebote vem do piso claro, nao do chao laranja de Marte
const FLOOR_BOUNCE_INDOOR = new THREE.Color(0xaeb4bf);

const _lightDir = new THREE.Vector3();
const _shadowCenter = new THREE.Vector3();
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

// Modo "Shaders": sombra do Sol em tempo real, lampadas da base com sombra propria, luzes
// secundarias coloridas, bloom, raios de luz e tone mapping. Desligado, o jogo desenha exatamente
// como antes (direto na tela, sem pos-processamento).
export class ShaderMode {
  constructor({ renderer, scene, camera, sky, glowMaterials = [], gpuName = '', storage = null, coarsePointer = false, onChange = () => {} }) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.sky = sky;
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
    this._time = 0;
    this._frame = 0;
    // 0 = camera fora da base, 1 = dentro (suavizado)
    this._indoor = 0;
    this._roomLights = [];
    this._roomCursor = 0;
    // Centro e posicao da luz do ultimo mapa de sombra do Sol (valem ate o proximo ser refeito)
    this._sunTarget = new THREE.Vector3();
    this._sunPosition = new THREE.Vector3();
    this._sunShadowReady = false;
    this._accents = null;
    this._hemisphereBase = { sky: sky.ambientLight.color.clone(), ground: sky.ambientLight.groundColor.clone() };
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
    // O mapa do Sol e refeito por pedido (update), nao a cada quadro
    sun.shadow.autoUpdate = false;
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
      this._enableRoomLights();
      this._setAccents(true);
      this._sunShadowReady = false;
      for (const material of this.glowMaterials) {
        material.userData.baseEmissiveIntensity = material.emissiveIntensity;
        material.emissiveIntensity *= GRAPHICS_CONFIG.EMISSIVE_SCALE;
      }
      this.exposure = GRAPHICS_CONFIG.EXPOSURE_OUTSIDE;
      this._setSunBoost(GRAPHICS_CONFIG.SUN_DISC_BOOST);
      renderer.toneMapping = THREE.NeutralToneMapping;
      this.guard.reset();
    } else {
      for (const { light, intensity, decay, distance } of this._roomLights) {
        light.intensity = intensity;
        light.decay = decay;
        light.distance = distance;
        light.castShadow = false;
      }
      this._roomLights = [];
      this._setAccents(false);
      this._setShadowProxies(false);
      sky.ambientLight.color.copy(this._hemisphereBase.sky);
      sky.ambientLight.groundColor.copy(this._hemisphereBase.ground);
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

  // Lampadas dos comodos (as PointLights que o jogo ja tem): viram luz primaria com sombra.
  // O mapa de sombra de cada uma fica guardado e so e refeito de tempos em tempos (ver update).
  _enableRoomLights() {
    this._roomLights = [];
    this.scene.traverse((obj) => {
      if (!obj.isPointLight) return;
      this._roomLights.push({ light: obj, intensity: obj.intensity, decay: obj.decay, distance: obj.distance });
      obj.intensity *= GRAPHICS_CONFIG.ROOM_LIGHT_SCALE;
      obj.decay = GRAPHICS_CONFIG.ROOM_LIGHT_DECAY;
      obj.distance = Math.min(obj.distance || Infinity, GRAPHICS_CONFIG.ROOM_LIGHT_MAX_DISTANCE);
      obj.castShadow = true;
      obj.shadow.mapSize.set(GRAPHICS_CONFIG.ROOM_SHADOW_MAP_SIZE, GRAPHICS_CONFIG.ROOM_SHADOW_MAP_SIZE);
      obj.shadow.bias = GRAPHICS_CONFIG.ROOM_SHADOW_BIAS;
      obj.shadow.normalBias = GRAPHICS_CONFIG.ROOM_SHADOW_NORMAL_BIAS;
      obj.shadow.camera.near = 0.15;
      obj.shadow.camera.far = obj.distance;
      obj.shadow.camera.updateProjectionMatrix();
      obj.shadow.autoUpdate = false;
      obj.shadow.needsUpdate = true;
    });
    this._roomCursor = 0;
  }

  // Luzes secundarias coloridas (accentLights.js). So existem na cena com o modo ligado, para nao
  // custarem nada no modo normal.
  _setAccents(on) {
    if (!this._accents) {
      this._accents = ACCENT_LIGHTS.map((spec) => {
        // Com `target` a luz e um foco (cone): ilumina so para onde aponta e nao vaza pela parede
        const light = spec.target
          ? new THREE.SpotLight(spec.color, spec.intensity, spec.distance, spec.angle, 0.6)
          : new THREE.PointLight(spec.color, spec.intensity, spec.distance);
        light.position.set(spec.pos[0], spec.pos[1], spec.pos[2]);
        if (spec.target) light.target.position.set(spec.target[0], spec.target[1], spec.target[2]);
        return { spec, light };
      });
    }
    for (const { spec, light } of this._accents) {
      if (on) this.scene.add(light);
      else this.scene.remove(light);
      if (spec.target) {
        if (on) this.scene.add(light.target);
        else this.scene.remove(light.target);
      }
    }
  }

  // Caixas de sombra (ex.: CrewAvatar): so existem para o mapa de sombra, entao ficam invisiveis
  // com o modo desligado
  _setShadowProxies(visible) {
    this.scene.traverse((obj) => {
      if (obj.userData.shadowProxy) obj.visible = visible;
    });
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
    composer.addPass(new ShaderPass(FINISH_SHADER));
    composer.setSize(_size.x, _size.y);
    this._composer = composer;
  }

  // Marca quem faz e quem recebe sombra. Materiais sem luz (telas, ceu, efeitos) ficam de fora;
  // o que e transparente (vidro) recebe mas nao faz sombra, entao o Sol entra pelas janelas e a
  // luz das lampadas sai por elas.
  // Pecas pequenas nao fazem sombra (cada uma seria um desenho a mais em cada mapa de sombra):
  // vale o raio minimo, e grupos com caixa de sombra (userData.hasShadowProxy) usam so a caixa.
  _markShadows() {
    const skip = this.sky.celestialGroup;
    const minRadius = GRAPHICS_CONFIG.SHADOW_CASTER_MIN_RADIUS;
    const visit = (obj, noCast) => {
      if (obj === skip) return;
      if (obj.userData.shadowProxy) {
        obj.visible = true;
        obj.castShadow = true;
        obj.receiveShadow = false;
        return;
      }
      if (obj.isMesh) {
        const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
        const lit = materials.some(isLit);
        const transparent = materials.some((m) => m.transparent);
        obj.receiveShadow = lit;
        let cast = lit && !transparent && !noCast && !obj.userData.noShadowCast;
        // InstancedMesh (pedras) e um desenho so para todas as copias: sempre vale a pena
        if (cast && !obj.isInstancedMesh) {
          if (!obj.geometry.boundingSphere) obj.geometry.computeBoundingSphere();
          cast = obj.geometry.boundingSphere.radius * obj.matrixWorld.getMaxScaleOnAxis() >= minRadius;
        }
        obj.castShadow = cast;
      }
      const nested = noCast || obj === this.camera || obj.userData.hasShadowProxy === true;
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

    // Sombra do Sol: a area acompanha a camera, um pouco adiantada na direcao do olhar. O mapa e
    // refeito a cada SUN_SHADOW_FRAMES quadros, e a luz so anda junto com ele: entre um mapa e
    // outro ela fica onde estava, senao a sombra escorregaria no chao.
    this._frame++;
    const sunSlot = this._frame % GRAPHICS_CONFIG.SUN_SHADOW_FRAMES === 0;
    if (sunSlot || !this._sunShadowReady) {
      shadowLightDirection(sunDir, GRAPHICS_CONFIG.SHADOW_MIN_ELEVATION, _lightDir);
      _flat.set(_forward.x, 0, _forward.z);
      if (_flat.lengthSq() > 1e-6) _flat.normalize();
      _shadowCenter.copy(_camPos).addScaledVector(_flat, GRAPHICS_CONFIG.SHADOW_EXTENT * GRAPHICS_CONFIG.SHADOW_LOOK_AHEAD);
      const texel = (GRAPHICS_CONFIG.SHADOW_EXTENT * 2) / GRAPHICS_CONFIG.SHADOW_MAP_SIZE;
      snapShadowCenter(_shadowCenter, _lightDir, texel, _shadowCenter);
      this._sunTarget.copy(_shadowCenter);
      this._sunPosition.copy(_shadowCenter).addScaledVector(_lightDir, GRAPHICS_CONFIG.SHADOW_LIGHT_DISTANCE);
      sun.shadow.needsUpdate = true;
      this._sunShadowReady = true;
    }
    sun.target.position.copy(this._sunTarget);
    sun.position.copy(this._sunPosition);

    // Luz primaria de fora: Sol mais forte, ambiente mais fraco (o contraste faz a sombra aparecer).
    // Dentro da base o ambiente cai mais ainda, e quem ilumina sao as lampadas e o Sol das janelas.
    this._time += dt;
    this._indoor += ((inside ? 1 : 0) - this._indoor) * Math.min(1, dt * GRAPHICS_CONFIG.INDOOR_BLEND_SPEED);
    const indoorScale = THREE.MathUtils.lerp(1, GRAPHICS_CONFIG.INDOOR_AMBIENT_SCALE, this._indoor);
    sun.intensity *= THREE.MathUtils.lerp(GRAPHICS_CONFIG.SUN_SCALE_NIGHT, GRAPHICS_CONFIG.SUN_SCALE_DAY, day);
    sky.baseAmbient.intensity *= GRAPHICS_CONFIG.AMBIENT_SCALE * indoorScale;
    sky.ambientLight.intensity *= GRAPHICS_CONFIG.HEMISPHERE_SCALE * indoorScale;

    // Luz secundaria de fora: cor do ceu por cima e rebote do chao por baixo, pelo horario
    const twilight = THREE.MathUtils.smoothstep(sunDir.y, -0.22, 0.05) * (1 - THREE.MathUtils.smoothstep(sunDir.y, 0.05, 0.35));
    sky.ambientLight.color.copy(SKY_FILL_NIGHT).lerp(SKY_FILL_DAY, day).lerp(SKY_FILL_TWILIGHT, twilight * 0.6);
    sky.ambientLight.groundColor.copy(GROUND_BOUNCE_NIGHT).lerp(GROUND_BOUNCE_DAY, day).lerp(FLOOR_BOUNCE_INDOOR, this._indoor);

    // Sombra das lampadas: no maximo um mapa refeito por quadro, e nunca no quadro do mapa do Sol,
    // para o custo ficar espalhado. As duas lampadas mais proximas da camera (onde a tripulacao se
    // mexe na frente do jogador) se revezam; a cada 4 vezes entra uma das outras, em rodizio.
    const rooms = this._roomLights;
    if (rooms.length > 0 && !sunSlot) {
      let nearest = null;
      let second = null;
      let best = Infinity;
      let next = Infinity;
      for (const { light } of rooms) {
        const d = light.position.distanceToSquared(_camPos);
        if (d < best) { next = best; second = nearest; best = d; nearest = light; }
        else if (d < next) { next = d; second = light; }
      }
      const reach = nearest.distance * GRAPHICS_CONFIG.ROOM_SHADOW_RANGE;
      if (best < reach * reach) {
        this._roomCursor++;
        const turn = this._roomCursor % 4;
        if (turn === 3) rooms[(this._roomCursor >> 2) % rooms.length].light.shadow.needsUpdate = true;
        else if (turn === 1 && second) second.shadow.needsUpdate = true;
        else nearest.shadow.needsUpdate = true;
      }
    }

    for (const { spec, light } of this._accents) light.intensity = accentIntensity(spec, this._time);

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
