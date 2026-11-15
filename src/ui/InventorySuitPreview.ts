// @ts-nocheck
import * as THREE from 'three';
import { buildIvaAstronautRig, buildSpacesuitRig } from '../graphics/spacesuitModel.ts';

const CLEAN_SUIT_COLOR = new THREE.Color(0xf8fafc);
const DUSTY_SUIT_COLOR = new THREE.Color(0xd6a68c);
const CLEAN_BOOT_COLOR = new THREE.Color(0x1e293b);
const DUSTY_BOOT_COLOR = new THREE.Color(0x8c4a32);

const LED_COLORS = {
  ok: { color: 0x4ade80, emissive: 0x16a34a },
  warn: { color: 0xfacc15, emissive: 0xca8a04 },
  critical: { color: 0xf87171, emissive: 0xdc2626 },
};

/**
 * Renders an interactive vertical Minecraft-style astronaut preview alongside the inventory.
 */
export class InventorySuitPreview {
  constructor(canvas, container = null) {
    this.canvas = canvas;
    this.container = container ?? canvas?.parentElement ?? null;
    this.active = false;
    this._raf = null;
    this._glFailed = false;
    this._initialized = false;
    this._time = 0;
    this._lastFrameMs = 0;
    this._yawOffset = 0.22;
    this._targetHeadYaw = 0;
    this._targetHeadPitch = 0;
    this._dragging = false;
    this._lastDragX = 0;
    this._state = {
      equipped: true,
      upgraded: false,
      dustPct: 0,
      integrityTone: 'ok',
    };

    this._bindPointer();
  }

  _bindPointer() {
    if (!this.canvas || typeof window === 'undefined') return;
    const onPointerMove = (event) => {
      if (!this.active) return;
      if (this._dragging) {
        const dx = event.clientX - this._lastDragX;
        this._lastDragX = event.clientX;
        this._yawOffset += dx * 0.015;
        return;
      }
      const rect = this.canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const nx = THREE.MathUtils.clamp(((event.clientX - rect.left) / rect.width) * 2 - 1, -1.6, 1.6);
      const ny = THREE.MathUtils.clamp(((event.clientY - rect.top) / rect.height) * 2 - 1, -1.2, 1.2);
      this._targetHeadYaw = THREE.MathUtils.clamp(nx * 0.42, -0.55, 0.55);
      this._targetHeadPitch = THREE.MathUtils.clamp(ny * 0.24, -0.35, 0.35);
    };

    this.canvas.addEventListener('pointerdown', (event) => {
      this._dragging = true;
      this._lastDragX = event.clientX;
      this.canvas.setPointerCapture?.(event.pointerId);
    });
    window.addEventListener('pointerup', () => {
      this._dragging = false;
    });
    window.addEventListener('pointermove', onPointerMove);
  }

  _initScene() {
    if (this._initialized || !this.canvas) return;
    this._initialized = true;

    try {
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        alpha: true,
        antialias: true,
      });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      this.scene = new THREE.Scene();
      this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 20);
      this.camera.position.set(0, 1.0, 4);
      this.camera.lookAt(0, 0.95, 0);

      const ambient = new THREE.AmbientLight(0xdbeafe, 1.25);
      const key = new THREE.DirectionalLight(0xfff7ed, 1.35);
      key.position.set(2.2, 3.5, 3.0);
      const rim = new THREE.DirectionalLight(0x38bdf8, 0.65);
      rim.position.set(-2.5, 1.5, -2.0);
      this.scene.add(ambient, key, rim);

      this.pivot = new THREE.Group();
      this.scene.add(this.pivot);

      this.evaRig = buildSpacesuitRig({
        accentColor: 0xea580c,
        suitColor: 0xf8fafc,
        includeUpgradeTrim: true,
      });
      this.ivaRig = buildIvaAstronautRig({
        accentColor: 0xea580c,
      });
      this.pivot.add(this.evaRig.bodyGroup);
      this.pivot.add(this.ivaRig.bodyGroup);
    } catch {
      this._glFailed = true;
    }
  }

  setState({ equipped = true, upgraded = false, dustPct = 0, integrityTone = 'ok' } = {}) {
    this._state = {
      equipped: Boolean(equipped),
      upgraded: Boolean(upgraded),
      dustPct: Math.max(0, Math.min(100, dustPct)),
      integrityTone,
    };
    if (this.active) this._applyVisualState();
  }

  _applyVisualState() {
    if (this._glFailed || !this.evaRig || !this.ivaRig) return;
    const { equipped, upgraded, dustPct, integrityTone } = this._state;
    this.evaRig.bodyGroup.visible = equipped;
    this.ivaRig.bodyGroup.visible = !equipped;

    for (const mesh of this.evaRig.upgradeTrimMeshes) {
      mesh.visible = equipped && upgraded;
    }

    const dustFactor = dustPct / 100;
    this.evaRig.suitMat.color.copy(CLEAN_SUIT_COLOR).lerp(DUSTY_SUIT_COLOR, dustFactor * 0.85);
    this.evaRig.bootMat.color.copy(CLEAN_BOOT_COLOR).lerp(DUSTY_BOOT_COLOR, Math.min(1, dustFactor * 1.4));

    const led = LED_COLORS[integrityTone] ?? LED_COLORS.ok;
    this.evaRig.statusLightMat.color.setHex(led.color);
    this.evaRig.statusLightMat.emissive.setHex(led.emissive);
  }

  _resizeRenderer() {
    if (!this.renderer || !this.canvas) return;
    const width = Math.max(120, Math.round(this.canvas.clientWidth || 160));
    const height = Math.max(150, Math.round(this.canvas.clientHeight || 224));
    if (this._w === width && this._h === height) return;
    this._w = width;
    this._h = height;
    this.renderer.setSize(width, height, false);
    const aspect = width / height;
    const halfHeight = Math.max(1.12, 0.65 / aspect);
    this.camera.left = -halfHeight * aspect;
    this.camera.right = halfHeight * aspect;
    this.camera.top = halfHeight;
    this.camera.bottom = -halfHeight;
    this.camera.updateProjectionMatrix();
  }

  _drawFallback2d() {
    const ctx = this.canvas?.getContext?.('2d');
    if (!ctx) return;
    const w = this.canvas.width = this.canvas.clientWidth || 160;
    const h = this.canvas.height = this.canvas.clientHeight || 220;
    ctx.clearRect(0, 0, w, h);
    const cx = Math.floor(w / 2);
    const cy = Math.floor(h / 2) - 4;
    const { equipped } = this._state;
    ctx.fillStyle = equipped ? '#f8fafc' : '#1e3a5f';
    ctx.fillRect(cx - 18, cy - 52, 36, 34); // head
    ctx.fillStyle = equipped ? '#f59e0b' : '#eab696';
    ctx.fillRect(cx - 12, cy - 42, 24, 14); // visor or face
    ctx.fillStyle = equipped ? '#f8fafc' : '#1e3a5f';
    ctx.fillRect(cx - 22, cy - 16, 44, 46); // torso
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(cx - 22, cy - 4, 44, 8); // chest stripe
    ctx.fillStyle = equipped ? '#cbd5e1' : '#1e3a5f';
    ctx.fillRect(cx - 18, cy + 32, 14, 34); // left leg
    ctx.fillRect(cx + 4, cy + 32, 14, 34); // right leg
  }

  start() {
    this._initScene();
    this.active = true;
    this._lastFrameMs = performance.now();
    this._applyVisualState();
    if (this._glFailed) {
      this._drawFallback2d();
      return;
    }
    this._tick();
  }

  stop() {
    this.active = false;
    if (this._raf) {
      cancelAnimationFrame(this._raf);
      this._raf = null;
    }
  }

  _tick() {
    if (!this.active) return;
    this._raf = requestAnimationFrame(() => this._tick());
    const now = performance.now();
    const dt = Math.min((now - this._lastFrameMs) / 1000, 0.05);
    this._lastFrameMs = now;
    this._time += dt;

    this._resizeRenderer();
    this._applyVisualState();

    const activeRig = this._state.equipped ? this.evaRig : this.ivaRig;
    if (activeRig && this.pivot) {
      const idleSway = Math.sin(this._time * 1.6) * 0.05;
      this.pivot.rotation.y = this._yawOffset + this._targetHeadYaw * 0.35 + idleSway;
      activeRig.headGroup.rotation.y = this._targetHeadYaw * 0.7;
      activeRig.headGroup.rotation.x = this._targetHeadPitch;
      activeRig.armL.rotation.set(-0.08 + Math.sin(this._time * 2.0) * 0.04, 0, -0.1);
      activeRig.armR.rotation.set(-0.08 - Math.sin(this._time * 2.0) * 0.04, 0, 0.1);
      activeRig.elbowL.rotation.x = -0.16;
      activeRig.elbowR.rotation.x = -0.16;
    }

    this.renderer.render(this.scene, this.camera);
  }
}
