import { BLOCK_IDS } from '../config/blockTypes.js';
import { WORLD_CONFIG } from '../config/constants.js';

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

    this.keys = {};
    this.isLocked = false;
    this.isZoomed = false;

    this._bindEvents();
  }

  _syncHandWithSlot() {
    const slot = this.survival.slots[this.hud.selectedSlot];
    if (slot) {
      this.playerHand.setHeldBlock(slot.id, slot.count);
    }
  }

  _bindEvents() {
    const overlay = document.getElementById('overlay');
    const startBtn = document.getElementById('start-btn');
    const respawnBtn = document.getElementById('respawn-btn');

    startBtn.addEventListener('click', () => {
      this.domElement.requestPointerLock();
    });

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
      if (!this.isLocked) this.keys = {};
      if (!this.survival.isDead && !this.hud.isInventoryOpen) {
        overlay.classList.toggle('hidden', this.isLocked);
      }
    });

    document.addEventListener('mousemove', (e) => {
      if (!this.isLocked || this.survival.isDead) return;
      const sensitivity = this.isZoomed ? 0.00055 : 0.0021;
      this.player.yaw -= e.movementX * sensitivity;
      this.player.pitch -= e.movementY * sensitivity;
      const maxPitch = Math.PI / 2 - 0.02;
      this.player.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.player.pitch));
    });

    window.addEventListener('keydown', (e) => {
      if (this.survival.isDead) return;
      if (this.hud.isInventoryOpen && e.code !== 'KeyE') return;
      if (this.isLocked && (e.code.startsWith('Control') || e.code.startsWith('Shift') || (e.ctrlKey && e.code === 'KeyW'))) {
        e.preventDefault();
      }
      this.keys[e.code] = true;

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
    });

    window.addEventListener('blur', () => { this.keys = {}; });

    window.addEventListener('wheel', (e) => {
      if (!this.isLocked || this.survival.isDead) return;
      const dir = Math.sign(e.deltaY);
      this.hud.selectSlot(this.hud.selectedSlot + dir, this.survival.slots);
      this._syncHandWithSlot();
    });

    window.addEventListener('mousedown', (e) => {
      if (!this.isLocked || this.survival.isDead) return;

      this.playerHand.triggerSwing();
      const hit = this.getTargetedBlock();

      if (e.button === 0) {
        if (!hit.hit) return;
        if (hit.type === 'crop') {
          if (this.survival.addHarvestedCrop() && this.harvestCrop(hit.plant)) {
            this.hud.renderHotbar(this.survival.slots);
            this._syncHandWithSlot();
          }
          return;
        }
        const distFromCenter = Math.hypot(hit.x, hit.z);
        // Protege o paredão externo da cratera e a camada base
        if (hit.y > 0 && distFromCenter < WORLD_CONFIG.CRATER_RADIUS - 4) {
          const brokenBlockId = hit.block;
          this.world.setBlock(hit.x, hit.y, hit.z, BLOCK_IDS.AIR, true);
          this.survival.addBlockToInventory(brokenBlockId);
          this.hud.renderHotbar(this.survival.slots);
          this._syncHandWithSlot();
        }
      } else if (e.button === 2) {
        const slot = this.survival.slots[this.hud.selectedSlot];
        if (!slot || slot.count <= 0) return;

        // Se for consumível (Gelo de Agua ou Batata de Marte), consome para recuperar Água/Comida
        if (slot.consumable) {
          const msg = this.survival.consumeSlotItem(this.hud.selectedSlot);
          if (msg) {
            this.hud.showToast(msg);
            this.hud.renderHotbar(this.survival.slots);
            this._syncHandWithSlot();
            return;
          }
        }

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

    window.addEventListener('contextmenu', (e) => e.preventDefault());
  }
}
