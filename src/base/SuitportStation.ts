// @ts-nocheck
import * as THREE from 'three';
import { WORLD_CONFIG } from '../config/constants.ts';
import { buildSpacesuitRig, createSuitportScreenTexture } from '../graphics/spacesuitModel.ts';
import { hazardTexture, labelTexture } from './baseCanvas.ts';

const SUIT_EQUIP_DURATION = 1.15;
const SUIT_DOCK_DURATION = 0.9;
const SUIT_BASE_Z = 0.36;
const SUIT_BASE_Y = 0.06;

const CLEAN_BOOT_COLOR = new THREE.Color(0x1e293b);
const DUSTY_BOOT_COLOR = new THREE.Color(0x8c4a32);

export class SuitportStation {
  constructor(scene, colliders = [], { floorY = WORLD_CONFIG.GROUND_LEVEL + 2 } = {}) {
    this.group = new THREE.Group();
    this.group.position.set(-0.98, floorY, 7.5);
    this.group.rotation.y = Math.PI / 2; // local +Z faces +X into the airlock chamber

    this._equipped = true;
    this._animMode = 'idle'; // 'idle' | 'equip' | 'dock'
    this._animTime = 0;
    this._time = 0;
    this._lockFlashTime = 0;
    this._clampOpen = 1;
    this._puffTime = -1;

    this._buildDockFrame();
    this._buildClamps();
    this._buildPuffs();

    this.rig = buildSpacesuitRig({
      accentColor: 0xea580c,
      suitColor: 0xf8fafc,
      includeUpgradeTrim: true,
    });
    this.suitPivot = new THREE.Group();
    this.suitPivot.position.set(0, SUIT_BASE_Y, SUIT_BASE_Z);
    this.suitPivot.add(this.rig.bodyGroup);
    this.group.add(this.suitPivot);

    scene.add(this.group);

    colliders.push({
      minX: -1.0,
      maxX: -0.52,
      minY: floorY,
      maxY: floorY + 2.3,
      minZ: 6.95,
      maxZ: 8.05,
    });

    this.setEquipped(true, false);
  }

  _box(parent, w, h, d, mat, x, y, z, rx = 0, ry = 0, rz = 0) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y, z);
    if (rx || ry || rz) mesh.rotation.set(rx, ry, rz);
    parent.add(mesh);
    return mesh;
  }

  _buildDockFrame() {
    const slate = new THREE.MeshLambertMaterial({ color: 0x334155 });
    const charcoal = new THREE.MeshLambertMaterial({ color: 0x1e293b });
    const white = new THREE.MeshLambertMaterial({ color: 0xf1f5f9 });
    const silver = new THREE.MeshLambertMaterial({ color: 0x94a3b8 });
    const orange = new THREE.MeshLambertMaterial({ color: 0xf97316 });

    this.beaconMat = new THREE.MeshLambertMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.7,
    });
    this.sealMat = new THREE.MeshLambertMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.55,
    });

    // Recessed backing panel and white aerospace pillars
    this._box(this.group, 1.06, 2.24, 0.08, slate, 0, 1.12, 0.04);
    this._box(this.group, 0.12, 2.2, 0.16, white, -0.48, 1.12, 0.09);
    this._box(this.group, 0.12, 2.2, 0.16, white, 0.48, 1.12, 0.09);

    // Overhead canopy hood + status LED bar
    this._box(this.group, 1.1, 0.14, 0.34, slate, 0, 2.2, 0.17);
    this._box(this.group, 0.76, 0.05, 0.08, this.beaconMat, 0, 2.13, 0.31);

    // Rear-entry Suitport bulkhead hatch (visible behind the suit when equipped)
    this._box(this.group, 0.62, 0.92, 0.06, charcoal, 0, 1.15, 0.09);
    this._box(this.group, 0.56, 0.86, 0.03, this.sealMat, 0, 1.15, 0.115);
    this._box(this.group, 0.48, 0.78, 0.04, slate, 0, 1.15, 0.125);
    this._box(this.group, 0.36, 0.06, 0.03, silver, 0, 1.15, 0.15);
    this._box(this.group, 0.06, 0.24, 0.03, orange, 0, 1.15, 0.15);

    // Magnetic boot platform with hazard border
    this._box(this.group, 0.96, 0.06, 0.56, charcoal, 0, 0.03, 0.3);
    this._box(this.group, 0.22, 0.02, 0.32, this.sealMat, -0.14, 0.06, 0.36);
    this._box(this.group, 0.22, 0.02, 0.32, this.sealMat, 0.14, 0.06, 0.36);

    const hasDom = typeof document !== 'undefined';
    const hazardMat = hasDom
      ? new THREE.MeshBasicMaterial({ map: hazardTexture(6) })
      : new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    const lip = new THREE.Mesh(new THREE.PlaneGeometry(0.92, 0.08), hazardMat);
    lip.position.set(0, 0.065, 0.55);
    lip.rotation.x = -Math.PI / 2;
    this.group.add(lip);

    // Mini telemetry screen on right side pillar
    const screenHousing = new THREE.Group();
    screenHousing.position.set(-0.46, 1.48, 0.2);
    screenHousing.rotation.y = 0.32;
    this._box(screenHousing, 0.22, 0.28, 0.04, charcoal, 0, 0, 0);
    const screenTex = createSuitportScreenTexture();
    const screenMat = screenTex
      ? new THREE.MeshBasicMaterial({ map: screenTex })
      : new THREE.MeshBasicMaterial({ color: 0x0ea5e9 });
    const screenPlane = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.24), screenMat);
    screenPlane.position.z = 0.022;
    screenHousing.add(screenPlane);
    this.group.add(screenHousing);

    // SUITPORT sign above the canopy
    const signMat = hasDom
      ? new THREE.MeshBasicMaterial({ map: labelTexture('SUITPORT', 5, '#60a5fa') })
      : new THREE.MeshBasicMaterial({ color: 0x60a5fa });
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.84, 0.21), signMat);
    sign.position.set(0, 2.38, 0.12);
    this.group.add(sign);
  }

  _buildClamps() {
    const silver = new THREE.MeshLambertMaterial({ color: 0xcbd5e1 });
    const orange = new THREE.MeshLambertMaterial({ color: 0xf97316 });
    const pad = new THREE.MeshLambertMaterial({ color: 0x334155 });

    const makeClamp = (side) => {
      const pivot = new THREE.Group();
      pivot.position.set(side * 0.42, 1.18, 0.14);
      this._box(pivot, 0.06, 0.08, 0.24, silver, 0, 0, 0.12);
      this._box(pivot, 0.1, 0.12, 0.06, orange, -side * 0.04, 0, 0.23);
      this._box(pivot, 0.06, 0.14, 0.08, pad, -side * 0.08, 0, 0.25);
      this.group.add(pivot);
      return pivot;
    };

    this.clampL = makeClamp(-1);
    this.clampR = makeClamp(1);
  }

  _buildPuffs() {
    this.puffGroup = new THREE.Group();
    const puffMat = new THREE.MeshBasicMaterial({
      color: 0xcffafe,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
    });
    const geo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
    for (let i = 0; i < 12; i++) {
      const m = new THREE.Mesh(geo, puffMat);
      m.userData.angle = (i / 12) * Math.PI * 2;
      m.userData.height = 0.7 + (i % 3) * 0.38;
      m.userData.speed = 0.45 + (i % 4) * 0.12;
      this.puffGroup.add(m);
    }
    this.puffGroup.visible = false;
    this.group.add(this.puffGroup);
  }

  get isAnimating() {
    return this._animMode !== 'idle';
  }

  setEquipped(equipped, animate = false) {
    if (animate) {
      if (equipped) this.triggerEquip();
      else this.triggerDock();
      return;
    }
    this._equipped = Boolean(equipped);
    this._animMode = 'idle';
    this._animTime = 0;
    this._clampOpen = this._equipped ? 1 : 0;
    this.suitPivot.visible = !this._equipped;
    this.suitPivot.position.set(0, SUIT_BASE_Y, SUIT_BASE_Z);
    this.suitPivot.scale.setScalar(1);
    this._applyIdlePose(0);
    this._applyClamps(this._clampOpen);
  }

  triggerEquip() {
    this._equipped = true;
    this._animMode = 'equip';
    this._animTime = 0;
    this._puffTime = 0;
    this.suitPivot.visible = true;
    this.suitPivot.position.set(0, SUIT_BASE_Y, SUIT_BASE_Z);
    this.suitPivot.scale.setScalar(1);
  }

  triggerDock() {
    this._equipped = false;
    this._animMode = 'dock';
    this._animTime = 0;
    this._puffTime = 0;
    this.suitPivot.visible = true;
    this.suitPivot.position.set(0, SUIT_BASE_Y + 0.04, SUIT_BASE_Z + 0.36);
    this.suitPivot.scale.setScalar(0.15);
  }

  flashLocked() {
    this._lockFlashTime = 0.65;
  }

  _applyClamps(openAmount) {
    const angle = THREE.MathUtils.clamp(openAmount, 0, 1) * 0.85;
    this.clampL.rotation.y = -angle;
    this.clampR.rotation.y = angle;
  }

  _applyIdlePose(t) {
    const r = this.rig;
    const breath = Math.sin(t * 2.0) * 0.008;
    const scan = Math.sin(t * 0.75) * 0.06;
    r.bodyGroup.position.y = breath;
    r.upperBody.rotation.set(0.015, 0, 0);
    r.headGroup.rotation.set(-0.02 + Math.sin(t * 1.1) * 0.02, scan, 0);
    r.armL.rotation.set(-0.04, 0, -0.08);
    r.armR.rotation.set(-0.04, 0, 0.08);
    r.elbowL.rotation.x = -0.18;
    r.elbowR.rotation.x = -0.18;
    r.legL.rotation.x = 0;
    r.legR.rotation.x = 0;
    r.kneeL.rotation.x = 0;
    r.kneeR.rotation.x = 0;
  }

  _updatePuffs(dt) {
    if (this._puffTime < 0) return;
    this._puffTime += dt;
    if (this._puffTime >= 0.75) {
      this._puffTime = -1;
      this.puffGroup.visible = false;
      return;
    }
    const p = this._puffTime / 0.75;
    this.puffGroup.visible = true;
    for (const child of this.puffGroup.children) {
      const r = 0.22 + p * child.userData.speed;
      child.position.set(
        Math.cos(child.userData.angle) * r,
        child.userData.height + p * 0.22,
        0.22 + Math.sin(child.userData.angle) * r * 0.55
      );
      const s = Math.max(0.05, (1 - p) * 1.25);
      child.scale.setScalar(s);
    }
  }

  update(dt, { suitEquipped = this._equipped, pressurized = true, doorOpen = false, suitUpgraded = false, dirtySuit = false } = {}) {
    this._time += dt;
    this._lockFlashTime = Math.max(0, this._lockFlashTime - dt);

    // Sync if external state flipped (e.g. player crossed inner airlock door)
    if (suitEquipped !== this._equipped && this._animMode === 'idle') {
      this.setEquipped(suitEquipped, true);
    }

    for (const mesh of this.rig.upgradeTrimMeshes) {
      mesh.visible = Boolean(suitUpgraded);
    }
    this.rig.bootMat.color.copy(dirtySuit ? DUSTY_BOOT_COLOR : CLEAN_BOOT_COLOR);

    this._updatePuffs(dt);

    if (this._animMode === 'equip') {
      this._animTime += dt;
      const p = Math.min(1, this._animTime / SUIT_EQUIP_DURATION);
      const clampPhase = Math.min(1, p / 0.32);
      this._clampOpen = clampPhase;
      this._applyClamps(this._clampOpen);

      const r = this.rig;
      const spread = Math.sin(Math.min(1, p / 0.5) * Math.PI * 0.5);
      r.armL.rotation.set(-0.45 * spread, 0, -0.32 * spread);
      r.armR.rotation.set(-0.45 * spread, 0, 0.32 * spread);
      r.elbowL.rotation.x = -0.35 * spread;
      r.elbowR.rotation.x = -0.35 * spread;
      r.headGroup.rotation.set(-0.08 * spread, 0, 0);

      if (p < 0.35) {
        const lift = p / 0.35;
        this.suitPivot.position.set(0, SUIT_BASE_Y + lift * 0.04, SUIT_BASE_Z + lift * 0.08);
        this.suitPivot.scale.setScalar(1);
      } else if (p < 0.85) {
        const step = (p - 0.35) / 0.5;
        const ease = step * step * (3 - 2 * step);
        this.suitPivot.position.set(0, SUIT_BASE_Y + 0.04 + ease * 0.14, SUIT_BASE_Z + 0.08 + ease * 0.38);
        this.suitPivot.scale.setScalar(Math.max(0.05, 1 - ease * 0.95));
      } else {
        this.suitPivot.visible = false;
      }

      if (p >= 1) {
        this._animMode = 'idle';
        this.suitPivot.visible = false;
      }
    } else if (this._animMode === 'dock') {
      this._animTime += dt;
      const p = Math.min(1, this._animTime / SUIT_DOCK_DURATION);
      if (p < 0.55) {
        const step = p / 0.55;
        const ease = 1 - Math.pow(1 - step, 2);
        this.suitPivot.visible = true;
        this.suitPivot.position.set(0, SUIT_BASE_Y + (1 - ease) * 0.08, SUIT_BASE_Z + (1 - ease) * 0.36);
        this.suitPivot.scale.setScalar(0.15 + ease * 0.85);
        this._clampOpen = 1;
      } else {
        const clampClose = (p - 0.55) / 0.45;
        this.suitPivot.visible = true;
        this.suitPivot.position.set(0, SUIT_BASE_Y, SUIT_BASE_Z);
        this.suitPivot.scale.setScalar(1);
        this._clampOpen = 1 - clampClose;
      }
      this._applyClamps(this._clampOpen);
      this._applyIdlePose(this._time);

      if (p >= 1) {
        this._animMode = 'idle';
        this._clampOpen = 0;
        this._applyClamps(0);
      }
    } else if (!this._equipped) {
      this._applyIdlePose(this._time);
    }

    this._updateLights(pressurized, doorOpen);
  }

  _updateLights(pressurized, doorOpen) {
    const pulse = 0.5 + 0.5 * Math.sin(this._time * 3.4);
    if (this._lockFlashTime > 0 || (!this._equipped && (!pressurized || doorOpen))) {
      this.beaconMat.color.setHex(0xef4444);
      this.beaconMat.emissive.setHex(0xb91c1c);
      this.beaconMat.emissiveIntensity = 0.65 + pulse * 0.4;
      this.sealMat.color.setHex(0xf59e0b);
      this.sealMat.emissive.setHex(0xb45309);
      this.sealMat.emissiveIntensity = 0.4;
    } else if (this._animMode !== 'idle') {
      this.beaconMat.color.setHex(0x4ade80);
      this.beaconMat.emissive.setHex(0x16a34a);
      this.beaconMat.emissiveIntensity = 0.95;
      this.sealMat.color.setHex(0x4ade80);
      this.sealMat.emissive.setHex(0x16a34a);
      this.sealMat.emissiveIntensity = 0.75;
    } else if (this._equipped) {
      this.beaconMat.color.setHex(0x4ade80);
      this.beaconMat.emissive.setHex(0x16a34a);
      this.beaconMat.emissiveIntensity = 0.45 + pulse * 0.25;
      this.sealMat.color.setHex(0x4ade80);
      this.sealMat.emissive.setHex(0x15803d);
      this.sealMat.emissiveIntensity = 0.35;
    } else {
      this.beaconMat.color.setHex(0x38bdf8);
      this.beaconMat.emissive.setHex(0x0284c7);
      this.beaconMat.emissiveIntensity = 0.55 + pulse * 0.35;
      this.sealMat.color.setHex(0x38bdf8);
      this.sealMat.emissive.setHex(0x0284c7);
      this.sealMat.emissiveIntensity = 0.45 + pulse * 0.25;
    }

    this.rig.statusLightMat.color.setHex(this._animMode !== 'idle' ? 0xfacc15 : 0x4ade80);
    this.rig.statusLightMat.emissive.setHex(this._animMode !== 'idle' ? 0xca8a04 : 0x16a34a);
  }

  dispose() {
    this.group.removeFromParent();
    const materials = new Set();
    this.group.traverse((obj) => {
      obj.geometry?.dispose();
      if (obj.material) materials.add(obj.material);
    });
    for (const mat of materials) {
      mat.map?.dispose();
      mat.dispose();
    }
  }
}
