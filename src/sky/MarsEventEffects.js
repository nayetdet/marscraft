import * as THREE from 'three';
import { BLOCK_IDS } from '../config/blockTypes.js';
import { EVENTS_CONFIG } from '../config/constants.js';
import { ParticlePuffs } from '../story/cutscene/effects.js';

// Animacoes dos eventos aleatorios (issue #107): risco do meteoro, clarao, poeira da cratera,
// tremor de camera, Fobos passando na frente do Sol, redemoinho de poeira, geada e aurora.
// Tudo e criado uma vez no construtor (os shaders compilam no carregamento) e reaproveitado:
// nada e alocado por frame. Quem decide quando cada evento acontece e o eventDirector; aqui o
// GameEngine so chama start/stop e update(dt, progress) com o progresso (0..1) do evento ativo.
// Math.random so aparece no visual (tremor e particulas), nunca na logica do jogo.

const C = EVENTS_CONFIG;
const UP = new THREE.Vector3(0, 1, 0);
const FROST_SKY = new THREE.Color(0xeef6ff);
const FROST_FOG = new THREE.Color(0xf4efe9);
// Tinta branco-azulada do chao com geada (acima de 1 clareia: o mapa de brilho do atlas e preto)
const FROST_TINT = new THREE.Color().setRGB(1.7, 2.0, 2.6);
const SUN_RADIUS = 8.5; // createMartianSun
const PHOBOS_SIZE = { x: 10, y: 6.5 }; // menor que o Sol: o eclipse e parcial
const DEVIL_HEIGHT = 11;
const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _right = new THREE.Vector3();

function canvasTexture(width, height, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  draw(canvas.getContext('2d'), width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Silhueta de Fobos: uma "batata" escura e irregular
function phobosTexture() {
  return canvasTexture(64, 48, (ctx) => {
    ctx.fillStyle = '#1b130f';
    ctx.beginPath();
    const points = [[6, 26], [12, 10], [28, 4], [46, 7], [58, 18], [57, 32], [45, 43], [26, 44], [11, 38]];
    ctx.moveTo(points[0][0], points[0][1]);
    for (const [x, y] of points.slice(1)) ctx.lineTo(x, y);
    ctx.closePath();
    ctx.fill();
  });
}

function glowTexture() {
  return canvasTexture(64, 64, (ctx) => {
    const grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 31);
    grad.addColorStop(0, 'rgba(255, 255, 240, 1)');
    grad.addColorStop(0.35, 'rgba(255, 210, 140, 0.7)');
    grad.addColorStop(1, 'rgba(255, 150, 60, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
  });
}

// Cortinas verdes da aurora: faixas verticais que somem no alto e embaixo
function auroraTexture() {
  return canvasTexture(256, 64, (ctx, w, h) => {
    for (let x = 0; x < w; x += 2) {
      const a = 0.25 + 0.75 * Math.abs(Math.sin(x * 0.07) * Math.sin(x * 0.023 + 1.3));
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, 'rgba(60, 255, 140, 0)');
      grad.addColorStop(0.45, `rgba(70, 255, 150, ${(0.55 * a).toFixed(3)})`);
      grad.addColorStop(0.8, `rgba(40, 220, 120, ${(0.3 * a).toFixed(3)})`);
      grad.addColorStop(1, 'rgba(30, 200, 110, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(x, 0, 2, h);
    }
  });
}

export class MarsEventEffects {
  // callbacks: onImpact(site), onDevilReachedTarget(), onDevilHitsPlayer()
  // groundMaterial: material dos blocos do mundo (VoxelWorld atlas), que a geada clareia
  constructor(scene, sky, callbacks = {}, groundMaterial = null) {
    this.scene = scene;
    this.sky = sky;
    this.callbacks = callbacks;
    this.type = null;
    this.sunlightFactor = 1; // multiplica a carga solar (eclipse)
    this._time = 0;
    this._flash = 0;
    this._shake = 0;

    this.dust = new ParticlePuffs(scene, { count: 160, color: 0xb9805a });
    this.devilDust = new ParticlePuffs(scene, { count: 260, color: 0xc4925f });

    // Meteoro: risco brilhante e cabeca incandescente
    this.meteor = new THREE.Group();
    const streak = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.7, 26, 6, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xffd9a0, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }),
    );
    // lookAt aponta o +z local para a cratera: a cabeca fica na origem e a cauda fina para tras (-z)
    streak.rotation.x = -Math.PI / 2;
    streak.position.z = -13;
    const head = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    head.scale.set(5, 5, 1);
    this.meteor.add(streak, head);
    this.meteor.visible = false;
    scene.add(this.meteor);
    this._meteorFrom = new THREE.Vector3();
    this._site = { x: 0, y: 0, z: 0 };
    this._impacted = false;

    // Eclipse: silhueta de Fobos presa ao grupo do ceu (que acompanha o jogador)
    this.phobos = new THREE.Sprite(new THREE.SpriteMaterial({ map: phobosTexture(), transparent: true, depthWrite: false, fog: false }));
    this.phobos.scale.set(PHOBOS_SIZE.x, PHOBOS_SIZE.y, 1);
    this.phobos.visible = false;
    sky.celestialGroup.add(this.phobos);

    // Aurora: cilindro aberto em volta do jogador, alto no ceu
    this.aurora = new THREE.Mesh(
      new THREE.CylinderGeometry(300, 300, 120, 48, 1, true),
      new THREE.MeshBasicMaterial({ map: auroraTexture(), transparent: true, opacity: 0, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }),
    );
    this.aurora.position.y = 95;
    this.aurora.visible = false;
    sky.celestialGroup.add(this.aurora);

    // Redemoinho: caminho reta, do ponto A ao B
    this._devilFrom = new THREE.Vector3();
    this._devilTo = new THREE.Vector3();
    this.devilPos = new THREE.Vector3();
    this._devilTarget = { x: 0, z: 0 };
    this._devilOverPanels = false;
    this._devilHit = false;

    // Cores do ceu que a geada mexe (o MarsSkySystem nao as reescreve a cada frame)
    this._skyColor = sky.ambientLight.color.clone();
    this._baseColor = sky.baseAmbient.color.clone();
    this.groundMaterial = groundMaterial;
    this._groundColor = groundMaterial?.color?.clone() ?? null;
  }

  get isActive() {
    return this.type !== null;
  }

  // info: meteor { site: { x, y, z } }, dustDevil { target: { x, z }, angle, world }
  start(event, info = {}) {
    if (this.type) this.stop();
    this.type = event.type;
    this._time = 0;
    if (event.type === 'meteor') {
      const { site } = info;
      this._site.x = site.x + 0.5;
      this._site.y = site.y;
      this._site.z = site.z + 0.5;
      // Vem do alto, inclinado, do lado oposto ao angulo sorteado
      const a = event.params.angle + Math.PI;
      this._meteorFrom.set(this._site.x + Math.cos(a) * 140, this._site.y + 110, this._site.z + Math.sin(a) * 140);
      this.meteor.position.copy(this._meteorFrom);
      this.meteor.lookAt(this._site.x, this._site.y, this._site.z);
      this.meteor.visible = true;
      this._impacted = false;
    } else if (event.type === 'dustDevil') {
      const { target, world } = info;
      this._world = world;
      const dirX = Math.cos(event.params.angle);
      const dirZ = Math.sin(event.params.angle);
      const half = (C.DUST_DEVIL_SPEED * C.DURATION_SECONDS.dustDevil) / 2;
      this._devilTarget.x = target.x;
      this._devilTarget.z = target.z;
      this._devilFrom.set(target.x - dirX * half, 0, target.z - dirZ * half);
      this._devilTo.set(target.x + dirX * half, 0, target.z + dirZ * half);
      this._devilOverPanels = false;
      this._devilHit = false;
      this._devilGroundTimer = 0;
      this.devilPos.copy(this._devilFrom);
      this.devilPos.y = this._groundY(this.devilPos.x, this.devilPos.z);
    } else if (event.type === 'eclipse') {
      this.phobos.visible = true;
    } else if (event.type === 'aurora') {
      this.aurora.visible = true;
    }
  }

  stop() {
    if (this.type === 'frost') {
      this.sky.ambientLight.color.copy(this._skyColor);
      this.sky.baseAmbient.color.copy(this._baseColor);
      if (this._groundColor) this.groundMaterial.color.copy(this._groundColor);
    }
    this.type = null;
    this.meteor.visible = false;
    this.phobos.visible = false;
    this.aurora.visible = false;
    this.aurora.material.opacity = 0;
    this.sunlightFactor = 1;
  }

  // progress: 0..1 do evento ativo. camera: null quando o jogo esta parado (sem tremor).
  // player: { pos, insideHabitat }
  update(dt, progress, camera, player) {
    this._time += dt;
    this._flash = Math.max(0, this._flash - dt * 2.2);
    this._shake = 0;
    switch (this.type) {
      case 'meteor': this._updateMeteor(dt, progress); break;
      case 'marsquake': this._updateQuake(dt, progress, player); break;
      case 'eclipse': this._updateEclipse(progress); break;
      case 'dustDevil': this._updateDevil(dt, progress, player); break;
      case 'frost': this._updateFrost(progress); break;
      case 'aurora': this._updateAurora(progress); break;
      default: break;
    }
    this.dust.update(dt);
    this.devilDust.update(dt);

    // O MarsSkySystem reescreve a luz a cada frame; o efeito so soma por cima dela
    if (this._flash > 0) {
      this.sky.baseAmbient.intensity += this._flash * 1.6;
      this.sky.sunLight.intensity += this._flash * 0.8;
    }
    if (this.sunlightFactor < 1) {
      this.sky.sunLight.intensity *= this.sunlightFactor;
      this.sky.ambientLight.intensity *= 0.5 + 0.5 * this.sunlightFactor;
    }
    if (camera && this._shake > 0) {
      const t = this._time;
      const s = this._shake;
      camera.position.x += s * (Math.sin(t * 41) * 0.6 + (Math.random() - 0.5) * 0.8);
      camera.position.y += s * (Math.sin(t * 53 + 1) * 0.5 + (Math.random() - 0.5) * 0.6);
      camera.position.z += s * (Math.sin(t * 37 + 2) * 0.6 + (Math.random() - 0.5) * 0.8);
    }
  }

  _updateMeteor(dt, p) {
    const fall = 0.12; // parte do evento em que o meteoro cai (~1,4 s)
    if (p < fall) {
      const k = p / fall;
      this.meteor.position.lerpVectors(this._meteorFrom, _a.set(this._site.x, this._site.y, this._site.z), k * k);
      return;
    }
    if (!this._impacted) {
      this._impacted = true;
      this.meteor.visible = false;
      this._flash = 1;
      this.dust.setColor(0xb9805a);
      this.dust.burstRing(this._site.x, this._site.y, this._site.z, 40, 9);
      this.callbacks.onImpact?.(this._site);
    }
    // Coluna de poeira subindo da cratera
    if (p < 0.65) this.dust.emit(dt, 45, this._site.x, this._site.y + 0.5, this._site.z, 1.2, 4.5);
    const fade = Math.max(0, 1 - (p - fall) / 0.25);
    this._shake = C.METEOR_SHAKE * fade;
  }

  _updateQuake(dt, p, player) {
    // Comeca forte, oscila e acalma
    this._shake = C.QUAKE_SHAKE * Math.sin(Math.PI * Math.min(1, p * 1.2)) * (0.75 + 0.25 * Math.sin(this._time * 6));
    if (!player || p > 0.85) return;
    const pos = player.pos;
    const count = Math.random() < dt * 22 ? 1 : 0;
    for (let i = 0; i < count; i++) {
      const x = pos.x + (Math.random() - 0.5) * 6;
      const z = pos.z + (Math.random() - 0.5) * 6;
      if (player.insideHabitat) {
        // Poeira caindo do teto
        this.dust.spawn(x, pos.y + 1.3, z, 0, -1.6, 0, 1.3, 0.16 + Math.random() * 0.12);
      } else {
        // Poeira levantando do chao
        this.dust.spawn(x, pos.y - 1.6, z, (Math.random() - 0.5) * 0.6, 0.8, (Math.random() - 0.5) * 0.6, 1.4, 0.3 + Math.random() * 0.3);
      }
    }
  }

  _updateEclipse(p) {
    // Fobos atravessa o disco do Sol, um pouco inclinado
    const sunPos = this.sky.sunGroup.position;
    _a.copy(sunPos).normalize();
    _right.crossVectors(_a, UP);
    if (_right.lengthSq() < 1e-6) _right.set(1, 0, 0);
    _right.normalize();
    _b.crossVectors(_right, _a).normalize(); // "para cima" no plano do ceu
    const span = SUN_RADIUS + PHOBOS_SIZE.x * 0.5 + 4;
    const offset = (p * 2 - 1) * span;
    this.phobos.position.copy(sunPos).multiplyScalar(0.96)
      .addScaledVector(_right, offset)
      .addScaledVector(_b, offset * 0.18 + 1.5);
    // Quanto do Sol esta coberto (1 quando Fobos passa pelo meio)
    const reach = SUN_RADIUS + PHOBOS_SIZE.x * 0.5;
    const cover = Math.max(0, 1 - Math.abs(offset) / reach);
    const sunUp = Math.max(0, Math.min(1, _a.y * 5));
    this.sunlightFactor = 1 - C.ECLIPSE_SUNLIGHT_DROP * cover * cover * sunUp;
  }

  _groundY(x, z) {
    const world = this._world;
    if (!world) return 9;
    for (let y = world.sizeY - 1; y > 0; y--) {
      if (world.getBlock(Math.floor(x), y, Math.floor(z)) !== BLOCK_IDS.AIR) return y + 1;
    }
    return 9;
  }

  _updateDevil(dt, p, player) {
    const pos = this.devilPos;
    pos.lerpVectors(this._devilFrom, this._devilTo, p);
    // A altura do chao muda devagar: procura o chao so de vez em quando
    this._devilGroundTimer -= dt;
    if (this._devilGroundTimer <= 0) {
      this._devilGroundTimer = 0.25;
      this._devilGround = this._groundY(pos.x, pos.z);
    }
    pos.y = this._devilGround;
    // Comeca e termina fraco
    const strength = Math.sin(Math.PI * p);
    const rate = 220 * strength;
    const spawns = Math.floor(rate * dt + Math.random());
    for (let i = 0; i < spawns; i++) {
      const h = Math.random() * DEVIL_HEIGHT;
      const r = 0.5 + h * 0.16;
      const a = Math.random() * Math.PI * 2;
      const swirl = 3.5 + h * 0.2;
      this.devilDust.spawn(
        pos.x + Math.cos(a) * r, pos.y + h, pos.z + Math.sin(a) * r,
        -Math.sin(a) * swirl, 1.2 + Math.random(), Math.cos(a) * swirl,
        0.9 + Math.random() * 0.5, 0.35 + h * 0.07,
      );
    }
    if (!this._devilOverPanels && Math.hypot(pos.x - this._devilTarget.x, pos.z - this._devilTarget.z) < 1.5) {
      this._devilOverPanels = true;
      this.callbacks.onDevilReachedTarget?.();
    }
    if (!this._devilHit && player && !player.insideHabitat && strength > 0.3
      && Math.hypot(pos.x - player.pos.x, pos.z - player.pos.z) < C.DUST_DEVIL_HIT_RADIUS) {
      this._devilHit = true;
      this.callbacks.onDevilHitsPlayer?.();
    }
  }

  _updateFrost(p) {
    // Aparece rapido no amanhecer e some aos poucos com o Sol subindo
    const k = p < 0.1 ? p / 0.1 : 1 - (p - 0.1) / 0.9;
    this.sky.ambientLight.color.copy(this._skyColor).lerp(FROST_SKY, 0.75 * k);
    this.sky.baseAmbient.color.copy(this._baseColor).lerp(FROST_SKY, 0.5 * k);
    this.sky.scene.fog.color.lerp(FROST_FOG, 0.3 * k);
    if (this._groundColor) this.groundMaterial.color.copy(this._groundColor).lerp(FROST_TINT, k);
  }

  _updateAurora(p) {
    const envelope = Math.sin(Math.PI * p);
    const flicker = 0.85 + 0.15 * Math.sin(this._time * 1.7) * Math.sin(this._time * 0.6 + 1);
    this.aurora.material.opacity = 0.75 * envelope * flicker;
        this.aurora.material.map.offset.x = this._time * 0.004;
  }
}
