import { BLOCK_INTERACTION_CONFIG, WORLD_CONFIG } from '../config/constants.js';

export class InputController {
  constructor({
    domElement,
    player,
    playerHand,
    survival,
    world,
    sky,
    hud,
    onToggleZoom,
    getTargetedBlock,
    harvestCrop,
    isRoverActive = () => false,
    onInteract = () => {},
    onToggleRoverCamera = () => {},
  }) {
    this.domElement = domElement;
    this.player = player;
    this.playerHand = playerHand;
    this.survival = survival;
    this.world = world;
    this.sky = sky;
    this.hud = hud;
    this.onToggleZoom = onToggleZoom;
    this.getTargetedBlock = getTargetedBlock;
    this.harvestCrop = harvestCrop;
    this.isRoverActive = isRoverActive;
    this.onInteract = onInteract;
    this.onToggleRoverCamera = onToggleRoverCamera;

    this.keys = {};
    this.isLocked = false;
    this.isZoomed = false;
    this.breakState = null;
    this.breakSwingTimer = 0;
    this.isBreakButtonHeld = false;
    this.lastForwardTapAt = 0;

    this._bindEvents();
  }

  _syncHandWithSlot() {
    const slot = this.survival.slots[this.hud.selectedSlot];
    this.playerHand.setHeldBlock(slot?.id, slot?.count ?? 0);
  }

  _canBreak(hit) {
    if (!hit.hit) return false;
    if (hit.type === 'crop') return Boolean(hit.plant);
    return hit.y > 0 && Math.hypot(hit.x, hit.z) < WORLD_CONFIG.CRATER_RADIUS - 4;
  }

  _startBreaking() {
    const hit = this.getTargetedBlock();
    if (!this._canBreak(hit)) return;

    this.breakState = hit.type === 'crop'
      ? { type: 'crop', plant: hit.plant, progress: 0 }
      : { x: hit.x, y: hit.y, z: hit.z, block: hit.block, progress: 0 };
    this.breakSwingTimer = 0;
    this.playerHand.triggerSwing();
    if (hit.type === 'crop') this.world.updateCropBreakCracks(hit.plant, 0.01);
    else this.world.updateBreakCracks(hit.x, hit.y, hit.z, 0.01);
  }

  _cancelBreaking() {
    if (!this.breakState) return;
    this.breakState = null;
    this.world.clearBreakCracks();
  }

  update(dt) {
    if (!this.isBreakButtonHeld) {
      this._cancelBreaking();
      return;
    }

    if (!this.breakState) {
      this._startBreaking();
      return;
    }

    const hit = this.getTargetedBlock();
    const target = this.breakState;
    const isSameTarget = target.type === 'crop'
      ? hit.hit && hit.type === 'crop' && hit.plant === target.plant
      : hit.hit && hit.type !== 'crop' && hit.x === target.x && hit.y === target.y && hit.z === target.z && hit.block === target.block;
    if (!this.isLocked || !isSameTarget) {
      this._cancelBreaking();
      return;
    }

    target.progress = Math.min(1, target.progress + dt / BLOCK_INTERACTION_CONFIG.BREAK_TIME);
    if (target.type === 'crop') this.world.updateCropBreakCracks(target.plant, target.progress);
    else this.world.updateBreakCracks(target.x, target.y, target.z, target.progress);
    this.breakSwingTimer += dt;
    if (this.breakSwingTimer >= 0.18) {
      this.playerHand.triggerSwing();
      this.breakSwingTimer = 0;
    }

    if (target.progress >= 1) {
      if (target.type === 'crop') {
        const position = target.plant.getWorldPosition(target.plant.position.clone());
        if (this.harvestCrop(target.plant)) this.world.spawnCropDrop(position);
      } else {
        this.world.breakBlock(target.x, target.y, target.z);
      }
      this._cancelBreaking();
    }
  }

  _bindEvents() {
    const overlay = document.getElementById('overlay');
    const startBtn = document.getElementById('start-btn');
    const resetBtn = document.getElementById('reset-btn');
    const respawnBtn = document.getElementById('respawn-btn');

    document.addEventListener('keydown', (e) => {
      const gameHasFocus = this.isLocked || document.pointerLockElement === this.domElement;
      if (!gameHasFocus || !this._isBrowserShortcut(e)) return;
      e.preventDefault();
    }, true);

    startBtn.addEventListener('click', () => {
      this.domElement.requestPointerLock();
    });

    resetBtn.addEventListener('click', () => window.location.reload());

    if (respawnBtn) {
      respawnBtn.addEventListener('click', () => {
        this.survival.resetStats();
        this.player.resetToShipRamp();
        this.hud.hideDeathScreen();
        this.domElement.requestPointerLock();
      });
    }

    document.addEventListener('pointerlockchange', () => {
      this.isLocked = document.pointerLockElement === this.domElement;
      if (!this.isLocked) this._cancelBreaking();
      if (!this.isLocked) this.keys = {};
      if (!this.survival.isDead && !this.hud.isInventoryOpen) {
        overlay.classList.toggle('hidden', this.isLocked);
      }
    });

    document.addEventListener('mousemove', (e) => {
      if (!this.isLocked || this.survival.isDead || this.isRoverActive()) return;
      const sensitivity = this.isZoomed ? 0.00055 : 0.0021;
      this.player.yaw -= e.movementX * sensitivity;
      this.player.pitch -= e.movementY * sensitivity;
      const maxPitch = Math.PI / 2 - 0.02;
      this.player.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.player.pitch));
    });

    window.addEventListener('keydown', (e) => {
      if (this.survival.isDead) return;
      if (this.hud.isInventoryOpen && e.code !== 'KeyE') return;
      if (this.isLocked && this._isBrowserShortcut(e)) e.preventDefault();
      if (e.code === 'KeyW' && !e.repeat && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const now = performance.now();
        this.keys.Sprint = now - this.lastForwardTapAt <= 300;
        this.lastForwardTapAt = now;
      }
      this.keys[e.code] = true;

      if (e.code === 'KeyF') {
        e.preventDefault();
        this.onInteract();
        return;
      }

      if (e.code === 'KeyV' && this.isRoverActive()) {
        e.preventDefault();
        this.onToggleRoverCamera();
        return;
      }

      if (e.code.startsWith('Digit')) {
        const num = parseInt(e.code.replace('Digit', ''), 10);
        if (num >= 1 && num <= 9) {
          this.hud.selectSlot(num - 1, this.survival.slots);
          this._syncHandWithSlot();
        }
      }

      if (e.code === 'KeyE') {
        e.preventDefault();
        if (this.hud.isInventoryOpen) {
          this.hud.closeInventory();
          this.domElement.requestPointerLock();
        } else if (this.isLocked) {
          this.hud.openInventory(this.survival.inventorySlots);
          document.exitPointerLock();
        }
        return;
      }

      if (e.code === 'KeyQ' && this.isLocked && !e.repeat) {
        const slot = this.survival.slots[this.hud.selectedSlot];
        if (slot && this.survival.useBlockFromSlot(this.hud.selectedSlot)) {
          this.world.spawnPlayerDrop(this.player.pos, this.player.yaw, slot.id);
          this.hud.renderHotbar(this.survival.slots);
          this._syncHandWithSlot();
        }
        return;
      }

      if (e.code === 'KeyZ') {
        this.isZoomed = !this.isZoomed;
        this.onToggleZoom(this.isZoomed);
        this.hud.updateZoomState(this.isZoomed);
      }

      if (e.code === 'KeyT') {
        this.sky.advanceTime(1.5);
        this.hud.showToast('Time advanced (+1h 30m on Mars)');
      }

    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
      if (e.code === 'KeyW') this.keys.Sprint = false;
    });

    window.addEventListener('blur', () => { this.keys = {}; });

    window.addEventListener('wheel', (e) => {
      if (!this.isLocked || this.survival.isDead) return;
      const dir = Math.sign(e.deltaY);
      this.hud.selectSlot(this.hud.selectedSlot + dir, this.survival.slots);
      this._syncHandWithSlot();
    });

    window.addEventListener('mousedown', (e) => {
      if (!this.isLocked || this.survival.isDead || this.isRoverActive()) return;

      if (e.button === 0) {
        this.isBreakButtonHeld = true;
        this._startBreaking();
        return;
      }

      const hit = this.getTargetedBlock();

      if (e.button === 2) {
        const slot = this.survival.slots[this.hud.selectedSlot];
        if (!slot || slot.count <= 0) return;

        // Se for consumível (Gelo de Agua ou Batata de Marte), consome para recuperar Água/Comida
        if (slot.consumable) {
          const previousCount = slot.count;
          const msg = this.survival.consumeSlotItem(this.hud.selectedSlot);
          if (slot.count < previousCount && slot.consumable.type === 'food') this.playerHand.triggerEat();
          if (msg) {
            this.hud.showToast(msg);
            this.hud.renderHotbar(this.survival.slots);
            this._syncHandWithSlot();
            return;
          }
        }

        this.playerHand.triggerSwing();
        // Caso contrário, coloca o bloco no mundo
        if (!hit.hit || hit.type === 'crop') return;
        const nx = hit.x + hit.normal.x;
        const ny = hit.y + hit.normal.y;
        const nz = hit.z + hit.normal.z;

        if (!this.player.overlapsBlock(nx, ny, nz)) {
          if (this.survival.useBlockFromSlot(this.hud.selectedSlot)) {
            this.world.setBlock(nx, ny, nz, slot.id, true);
            this.hud.renderHotbar(this.survival.slots);
            this._syncHandWithSlot();
          }
        }
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        this.isBreakButtonHeld = false;
        this._cancelBreaking();
      }
    });

    window.addEventListener('blur', () => {
      this.isBreakButtonHeld = false;
      this._cancelBreaking();
    });

    window.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  _isBrowserShortcut(e) {
    // Suppress browser accelerators while the game owns the pointer. Keep the
    // key event itself flowing so movement, crouch, and debug controls still work.
    if (e.ctrlKey || e.metaKey || e.altKey) return true;
    if (e.shiftKey) return true;

    // Escape remains available to release pointer lock. F3 remains the game's debug overlay.
    if (e.code.startsWith('F') && e.code !== 'F3') return true;
    if (['Tab', 'Space', 'Backspace'].includes(e.code)) return true;
    return false;
  }
}
