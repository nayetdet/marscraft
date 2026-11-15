// @ts-nocheck
import * as THREE from 'three';
import { STATION_CONFIG as C } from '../config/constants.ts';
import { buildIvaAstronautRig, buildSpacesuitRig } from '../graphics/spacesuitModel.ts';

const EQUIPMENT_SPECS = {
  treadmill: {
    title: 'RUN TO STAY STRONG!',
    whyText: 'On Mars, running helps keep your bones strong.',
    pos: new THREE.Vector3(-9.2, 10.32, 10.25),
    yaw: Math.PI, // olhando para -Z (painel frontal da esteira)
    lookAt: new THREE.Vector3(-9.2, 11.2, 10.15),
    camOffsetYaw: 0.68,
    camPitch: -0.18,
    camDist: 2.35,
    dismountPos: new THREE.Vector3(-7.6, 11.7, 10.2),
  },
  bike: {
    title: 'PEDAL TO STAY STRONG!',
    whyText: 'On Mars, pedaling helps keep your muscles and heart strong.',
    pos: new THREE.Vector3(-5.8, 10.16, 10.82),
    yaw: Math.PI, // olhando para -Z (guidao e monitor da bicicleta)
    lookAt: new THREE.Vector3(-5.8, 11.05, 10.45),
    camOffsetYaw: -0.72,
    camPitch: -0.16,
    camDist: 2.35,
    dismountPos: new THREE.Vector3(-7.3, 11.7, 10.4),
  },
};

export class GymEquipmentController {
  constructor({ scene, camera, player, stations, expedition, survival = null, hud, onPlaySound, onDismount }) {
    this.scene = scene;
    this.camera = camera;
    this.player = player;
    this.stations = stations;
    this.expedition = expedition;
    this.survival = survival;
    this.hud = hud;
    this.onPlaySound = onPlaySound;
    this.onDismount = onDismount;

    this.isActive = false;
    this.mode = null; // 'treadmill' | 'bike'
    this.progress = 0;
    this.cadence = 0; // velocidade atual da animacao (sobe ao apertar Espaco)
    this.phase = 0;
    this.bpm = 74;
    this.cameraYaw = 0;
    this.cameraPitch = -0.18;

    this._camTargetPos = new THREE.Vector3();
    this._camLookAt = new THREE.Vector3();

    // Avatar 3D do proprio jogador: usa traje interno azul (IVA) dentro da base ou EVA se equipado
    const group = new THREE.Group();
    group.visible = false;
    this.scene.add(group);
    this.evaRig = buildSpacesuitRig({ accentColor: 0xea580c, includeUpgradeTrim: true });
    this.ivaRig = buildIvaAstronautRig({ accentColor: 0xea580c });
    group.add(this.evaRig.bodyGroup, this.ivaRig.bodyGroup);

    this.avatar = {
      group,
      ...this.ivaRig,
    };
    this._syncAvatarAppearance();

    this._buildHudOverlay();
  }

  _syncAvatarAppearance() {
    const suited = Boolean(this.survival?.suitEquipped);
    this.evaRig.bodyGroup.visible = suited;
    this.ivaRig.bodyGroup.visible = !suited;
    const active = suited ? this.evaRig : this.ivaRig;
    Object.assign(this.avatar, active);
    for (const mesh of this.evaRig.upgradeTrimMeshes) {
      mesh.visible = suited && Boolean(this.stations?.upgraded);
    }
  }

  _buildHudOverlay() {
    if (typeof document === 'undefined') {
      this.hudEl = null;
      return;
    }
    let el = document.getElementById('gym-hud-overlay');
    if (!el) {
      el = document.createElement('div');
      el.id = 'gym-hud-overlay';
      el.className = 'gym-hud-overlay hidden';
      el.innerHTML = `
        <div class="gym-hud-top">
          <div id="gym-hud-title" class="gym-hud-title"></div>
          <p id="gym-hud-why-text" class="gym-hud-why-text"></p>
        </div>
      `;
      document.body.appendChild(el);
    }
    this.hudEl = el;
    this.progressEl = document.getElementById('gym-hud-progress');
    if (!this.progressEl) {
      this.progressEl = document.createElement('div');
      this.progressEl.id = 'gym-hud-progress';
      this.progressEl.className = 'gym-hud-bar-track hidden';
      this.progressEl.setAttribute('role', 'progressbar');
      this.progressEl.setAttribute('aria-label', 'Workout progress');
      this.progressEl.setAttribute('aria-valuemin', '0');
      this.progressEl.setAttribute('aria-valuemax', '100');
      this.progressEl.setAttribute('aria-valuenow', '0');
      this.progressEl.innerHTML = '<div id="gym-hud-bar-fill" class="gym-hud-bar-fill"></div>';
      document.querySelector('.mc-bottom-area')?.prepend(this.progressEl);
    }
  }

  mount(mode) {
    const spec = EQUIPMENT_SPECS[mode];
    if (!spec) return;

    this.isActive = true;
    this.mode = mode;
    this.progress = 0;
    this.cadence = 0.35;
    this.phase = 0;
    this.bpm = 78;
    this.cameraYaw = spec.camOffsetYaw;
    this.cameraPitch = spec.camPitch;

    this._syncAvatarAppearance();
    this.avatar.group.visible = true;
    this.avatar.group.position.copy(spec.pos);
    this.avatar.group.rotation.set(0, spec.yaw, 0);
    this._applyAvatarPose(0);

    if (this.hudEl) {
      this.hudEl.classList.remove('hidden');
      this.progressEl?.classList.remove('hidden');
      this.hudEl.querySelector('#gym-hud-title').textContent = spec.title;
      this.hudEl.querySelector('#gym-hud-why-text').textContent = spec.whyText;
      this._refreshHudDom();
    }
  }

  dismount() {
    if (!this.isActive) return;
    const spec = EQUIPMENT_SPECS[this.mode];
    this.isActive = false;
    this.avatar.group.visible = false;
    if (this.hudEl) this.hudEl.classList.add('hidden');
    this.progressEl?.classList.add('hidden');
    if (spec && this.player) {
      this.player.pos.copy(spec.dismountPos);
      this.player.vel.set(0, 0, 0);
      this.player.isMoving = false;
    }
    this.onDismount?.();
  }

  look(dx, dy, sensitivity = 0.0021) {
    if (!this.isActive) return;
    this.cameraYaw = THREE.MathUtils.clamp(this.cameraYaw - dx * sensitivity, -1.25, 1.25);
    this.cameraPitch = THREE.MathUtils.clamp(this.cameraPitch - dy * sensitivity, -0.55, 0.25);
  }

  triggerRep() {
    if (!this.isActive) return;

    if (this.expedition.energy < C.EXERCISE_COST) {
      this.hud?.showToast(`Not enough power! Need ${C.EXERCISE_COST}%.`);
      this._refreshHudDom();
      return;
    }

    // Cada toque no Espaco acelera o astronauta e avanca a barra
    this.cadence = Math.min(2.4, Math.max(1.0, this.cadence + 0.65));
    this.phase += 1.25;
    this.bpm = Math.min(162, this.bpm + 7);
    this.progress = Math.min(100, this.progress + 12.5);

    if (this.progress >= 100) {
      const msg = this.stations.exercise(this.mode);
      this.progress = 0;
      this.onPlaySound?.(440, 0.22, 660);
      this.hud?.showToast(msg);
      this._refreshHudDom();
      return;
    }

    this.onPlaySound?.(this.mode === 'bike' ? 340 : 390, 0.06);
    this._refreshHudDom();
  }

  _applyAvatarPose(dt) {
    this.phase += dt * (1.2 + this.cadence * 7.5);
    const activeAmp = Math.min(1, 0.2 + this.cadence * 0.65);

    if (this.mode === 'bike') {
      // Sentado no selim da bicicleta ergometrica, inclinado segurando o guidao e pedalando
      const pedalSin = Math.sin(this.phase);
      const pedalCos = Math.cos(this.phase);
      this.avatar.bodyGroup.position.y = Math.abs(pedalSin) * 0.018 * activeAmp;
      this.avatar.upperBody.rotation.x = 0.3 + Math.sin(this.phase * 2) * 0.03 * activeAmp;
      this.avatar.upperBody.rotation.y = pedalSin * 0.05 * activeAmp;
      this.avatar.headGroup.rotation.x = -0.18 + Math.sin(this.phase * 2) * 0.03 * activeAmp;
      this.avatar.headGroup.rotation.y = 0;
      // Bracos esticados a frente segurando o guidao
      this.avatar.armL.rotation.x = -1.08 + pedalSin * 0.06 * activeAmp;
      this.avatar.armR.rotation.x = -1.08 - pedalSin * 0.06 * activeAmp;
      // Pernas elevadas a frente girando nos pedais
      this.avatar.legL.rotation.x = -0.65 + pedalSin * 0.46;
      this.avatar.legR.rotation.x = -0.65 - pedalSin * 0.46;
      this.avatar.legL.position.z = pedalCos * 0.04;
      this.avatar.legR.position.z = -pedalCos * 0.04;
    } else {
      // Correndo na esteira espacial com colete tensor
      const stride = Math.sin(this.phase);
      this.avatar.bodyGroup.position.y = Math.abs(stride) * 0.055 * activeAmp;
      this.avatar.upperBody.rotation.x = 0.1 + 0.08 * activeAmp;
      this.avatar.upperBody.rotation.y = stride * 0.12 * activeAmp;
      this.avatar.headGroup.rotation.x = 0.05;
      this.avatar.headGroup.rotation.y = -stride * 0.06 * activeAmp;
      this.avatar.armL.rotation.x = -0.25 - stride * 0.68 * activeAmp;
      this.avatar.armR.rotation.x = -0.25 + stride * 0.68 * activeAmp;
      this.avatar.legL.rotation.x = stride * 0.72 * activeAmp;
      this.avatar.legR.rotation.x = -stride * 0.72 * activeAmp;
      this.avatar.legL.position.z = 0;
      this.avatar.legR.position.z = 0;
    }
  }

  _refreshHudDom() {
    if (!this.hudEl || !this.isActive) return;
    const pct = Math.round(this.progress);
    const fill = this.progressEl?.querySelector('#gym-hud-bar-fill');
    if (fill) fill.style.width = `${pct}%`;
    this.progressEl?.setAttribute('aria-valuenow', pct);

  }

  update(dt) {
    if (!this.isActive) return;
    const spec = EQUIPMENT_SPECS[this.mode];
    if (!spec) return;

    // Desacelera suavemente se parar de apertar Espaco; a barra tambem cai devagar se parar
    this.cadence = Math.max(0, this.cadence - dt * 1.15);
    if (this.cadence < 0.1 && this.progress > 0) {
      this.progress = Math.max(0, this.progress - dt * 3.5);
    }
    if (this.bpm > 76) {
      this.bpm = Math.max(76, this.bpm - dt * 6);
    }

    this._applyAvatarPose(dt);
    this._refreshHudDom();

    // Posiciona a camera em 3a pessoa dentro da sala da academia enquadrando o astronauta no aparelho
    this._camLookAt.copy(spec.lookAt);
    const dirX = Math.sin(this.cameraYaw) * Math.cos(this.cameraPitch);
    const dirY = -Math.sin(this.cameraPitch);
    const dirZ = -Math.cos(this.cameraYaw) * Math.cos(this.cameraPitch);

    this._camTargetPos.set(
      THREE.MathUtils.clamp(this._camLookAt.x + dirX * spec.camDist, -10.6, -4.4),
      THREE.MathUtils.clamp(this._camLookAt.y + dirY * spec.camDist, 10.6, 13.4),
      THREE.MathUtils.clamp(this._camLookAt.z + dirZ * spec.camDist, 8.3, 12.6)
    );

    this.camera.position.lerp(this._camTargetPos, Math.min(1, dt * 10));
    this.camera.lookAt(this._camLookAt);
  }
}
