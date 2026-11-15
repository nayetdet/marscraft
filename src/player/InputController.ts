// @ts-nocheck
import { BLOCK_INTERACTION_CONFIG } from '../config/constants.ts';
import { BLOCK_IDS, SHIP_BLOCK_IDS } from '../config/blockTypes.ts';
import { applyMouseLook, requestRawPointerLock } from './mouseLook.ts';

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
    isGymActive = () => false,
    onGymAction = () => {},
    onGymLook = () => {},
    onInteract = () => {},
    onRoverAction = () => {},
    onToggleShield = () => {},
    onSendData = () => {},
    onSuitportAction = () => {},
    isMissionModalOpen = () => false,
    isInputBlocked = () => false,
    onRoverLook = () => {},
    getInteraction,
    isStationOpen,
    getWorkSpeed,
    isJournalOpen = () => false,
    onToggleJournal = () => {},
    onBlockPlaced = () => {},
    onStartRegolithBreak = () => {},
    onStopRegolithBreak = () => {},
    onStartShipBlockBreak = () => {},
    onStopShipBlockBreak = () => {},
  }) {
    this.onToggleShield = onToggleShield;
    this.onSendData = onSendData;
    this.onSuitportAction = onSuitportAction;
    this.isMissionModalOpen = isMissionModalOpen;
    // Animacao (cutscene) rodando: teclado, mouse e toque nao controlam o jogador
    this.isInputBlocked = isInputBlocked;
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
    this.isGymActive = isGymActive;
    this.onGymAction = onGymAction;
    this.onGymLook = onGymLook;
    this.onInteract = onInteract;
    this.onRoverAction = onRoverAction;
    this.onRoverLook = onRoverLook;
    this.getInteraction = getInteraction;
    this.isStationOpen = isStationOpen;
    this.getWorkSpeed = getWorkSpeed;
    this.isJournalOpen = isJournalOpen;
    this.onToggleJournal = onToggleJournal;
    this.onBlockPlaced = onBlockPlaced;
    this.onStartRegolithBreak = onStartRegolithBreak;
    this.onStopRegolithBreak = onStopRegolithBreak;
    this.onStartShipBlockBreak = onStartShipBlockBreak;
    this.onStopShipBlockBreak = onStopShipBlockBreak;

    this.keys = {};
    this.isLocked = false;
    this.isTouchMode = false;
    this.hasStarted = false;
    this.supportsTouch = Boolean(window.matchMedia?.('(pointer: coarse)').matches)
      || (navigator.maxTouchPoints ?? 0) > 0;
    if (this.supportsTouch) document.body.classList.add('touch-device');
    this.isPortraitRequired = this.supportsTouch
      && Boolean(window.matchMedia?.('(orientation: portrait)').matches);
    document.body.classList.toggle('portrait-required', this.isPortraitRequired);
    this.isScannerOpen = false;
    this.isZoomed = false;
    this.isScanButtonHeld = false;
    this.breakState = null;
    this.breakSwingTimer = 0;
    this.isBreakButtonHeld = false;
    this.lastForwardTapAt = 0;
    this.joystickPointerId = null;
    this.lookPointerId = null;
    this.touchHeldActions = new Map();

    this._bindEvents();
  }

  _updateOrientationMode() {
    const isPortrait = this.supportsTouch
      && Boolean(window.matchMedia?.('(orientation: portrait)').matches);
    if (isPortrait === this.isPortraitRequired) return;

    this.isPortraitRequired = isPortrait;
    document.body.classList.toggle('portrait-required', isPortrait);
    if (!isPortrait) return;

    this.keys = {};
    this.isBreakButtonHeld = false;
    this.isScanButtonHeld = false;
    this._cancelBreaking();
    this.touchHeldActions.clear();
    this.joystickPointerId = null;
    this.lookPointerId = null;
    document.querySelectorAll('[data-touch-action].is-active').forEach((button) => {
      button.classList.remove('is-active');
    });
    this._setJoystick(0, 0);
  }

  _startTouchMode() {
    this.isTouchMode = true;
    this.isLocked = true;
    document.body.classList.add('touch-mode');
    document.getElementById('overlay').classList.add('hidden');
    document.getElementById('pause-overlay').classList.add('hidden');
    document.body.classList.remove('pause-menu-open');
  }

  _toggleInventory() {
    if (this.hud.isInventoryOpen) {
      this._closeInventory();
      return;
    }

    if (this.isLocked) {
      this.keys = {};
      this.isBreakButtonHeld = false;
      this.isScanButtonHeld = false;
      this._cancelBreaking();
      this.touchHeldActions.clear();
      this.joystickPointerId = null;
      this.lookPointerId = null;
      document.querySelectorAll('[data-touch-action].is-active').forEach((button) => {
        button.classList.remove('is-active');
      });
      this._setJoystick(0, 0);
      this.hud.openInventory(this.survival.inventorySlots);
      if (!this.isTouchMode) document.exitPointerLock();
    }
  }

  _closeInventory() {
    this.hud.closeInventory();
    if (!this.isTouchMode) {
      requestRawPointerLock(this.domElement, () => this._showPauseMenu?.());
    }
  }

  openJournal() {
    this.keys = {};
    this.touchHeldActions.clear();
    this._cancelBreaking();
    this._setJoystick(0, 0);
    this.onToggleJournal(true);
    if (!this.isTouchMode && document.pointerLockElement) document.exitPointerLock();
  }

  _useSelectedItem() {
    const slot = this.survival.slots[this.hud.selectedSlot];
    if (!slot || slot.count <= 0) return;
    if (slot.id === BLOCK_IDS.JOURNAL) {
      this.openJournal();
      return;
    }
    if (slot.id === BLOCK_IDS.SCOPE) {
      this._setScope(!this.isScannerOpen, !this.isScannerOpen);
      return;
    }
    if (slot.id === BLOCK_IDS.SHIELD_REMOTE) {
      this.playerHand.triggerSwing();
      this.onToggleShield();
      return;
    }
    const hit = this.getTargetedBlock();

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
    if (!hit.hit || hit.type === 'crop') return;
    const nx = hit.x + hit.normal.x;
    const ny = hit.y + hit.normal.y;
    const nz = hit.z + hit.normal.z;

    if (!this.player.overlapsBlock(nx, ny, nz) && this.survival.useBlockFromSlot(this.hud.selectedSlot)) {
      this.world.setBlock(nx, ny, nz, slot.id, true);
      this.onBlockPlaced(slot.id);
      this.hud.renderHotbar(this.survival.slots);
      this._syncHandWithSlot();
    }
  }

  _handleTouchAction(action, button, pointerId) {
    if (!this.isTouchMode || !this.isLocked || this.survival.isDead || this.hud.isInventoryOpen || this.isJournalOpen?.() || this.isStationOpen?.()) return;
    if (this.isInputBlocked?.()) return;

    if (this.isGymActive?.()) {
      if (action === 'jump' || action === 'mine' || action === 'use') {
        this.onGymAction?.();
      } else if (action === 'interact') {
        this.onInteract?.();
      }
      return;
    }

    if (action === 'jump' || action === 'mine') {
      this.touchHeldActions.set(pointerId, action);
      button.setPointerCapture?.(pointerId);
      button.classList.add('is-active');
    }

    if (action === 'jump') {
      if (!this.isRoverActive()) this.keys.Space = true;
    } else if (action === 'mine') {
      if (this.isRoverActive()) this.onRoverAction();
      else if (this.getInteraction?.()?.type === 'greenhouse') this.onInteract();
      else if (!this._handleScopeMouseButton(0)) {
        this.isBreakButtonHeld = true;
        this._startBreaking();
      }
    } else if (action === 'use') {
      if (this.isRoverActive()) this.onRoverAction();
      else if (this.getInteraction?.()?.type === 'greenhouse') this.onInteract();
      else if (!this._handleScopeMouseButton(2)) this._useSelectedItem();
    } else if (action === 'interact') {
      this.onInteract();
    } else if (action === 'sprint') {
      if (!this.isRoverActive()) {
        this.keys.Sprint = !this.keys.Sprint;
        button.classList.toggle('is-active', this.keys.Sprint);
      }
    } else if (action === 'inventory') {
      this._toggleInventory();
    }
  }

  _releaseTouchPointer(pointerId) {
    const action = this.touchHeldActions.get(pointerId);
    if (action) {
      this.touchHeldActions.delete(pointerId);
      if (action === 'jump') this.keys.Space = false;
      if (action === 'mine') {
        this.isScanButtonHeld = false;
        this.isBreakButtonHeld = false;
        this._cancelBreaking();
      }
      document.querySelector(`[data-touch-action="${action}"]`)?.classList.remove('is-active');
    }

    if (this.joystickPointerId === pointerId) {
      this.joystickPointerId = null;
      this._setJoystick(0, 0);
    }

    if (this.lookPointerId === pointerId) this.lookPointerId = null;
  }

  _setJoystick(x, y) {
    const deadZone = 0.2;
    this.keys.KeyW = y < -deadZone;
    this.keys.KeyS = y > deadZone;
    this.keys.KeyA = x < -deadZone;
    this.keys.KeyD = x > deadZone;

    const thumb = document.getElementById('joystick-thumb');
    if (thumb) thumb.style.transform = `translate(${x * 38}px, ${y * 38}px)`;
  }

  _moveJoystick(event) {
    if (event.pointerId !== this.joystickPointerId || this.survival.isDead || this.hud.isInventoryOpen || this.isStationOpen?.()) return;
    const rect = document.getElementById('mobile-joystick').getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + 56;
    const dx = event.clientX - centerX;
    const dy = event.clientY - centerY;
    const distance = Math.hypot(dx, dy);
    const scale = distance > 38 ? 38 / distance : 1;
    this._setJoystick(dx * scale / 38, dy * scale / 38);
  }

  _syncHandWithSlot() {
    const slot = this.survival.slots[this.hud.selectedSlot];
    this.playerHand.setHeldBlock(slot?.id, slot?.count ?? 0);
    if (slot?.id !== BLOCK_IDS.SCOPE && this.isScannerOpen) this._setScope(false, false);
  }

  _isScopeSelected() {
    return this.survival.slots[this.hud.selectedSlot]?.id === BLOCK_IDS.SCOPE;
  }

  _handleScopeMouseButton(button) {
    if (!this._isScopeSelected()) return false;
    if (button === 0) {
      this.isScanButtonHeld = true;
      this._setScope(true, this.isZoomed);
      return true;
    }
    if (button === 2) {
      this._setScope(true, !this.isZoomed);
      return true;
    }
    return false;
  }

  _canBreak(hit) {
    if (!hit.hit) return false;
    if (hit.type === 'crop') return Boolean(hit.plant);
    return hit.y > 0;
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
    else {
      this.world.updateBreakCracks(hit.x, hit.y, hit.z, 0.01);
      if (hit.block === BLOCK_IDS.REGOLITH) this.onStartRegolithBreak();
      else if (SHIP_BLOCK_IDS.includes(hit.block)) this.onStartShipBlockBreak();
    }
  }

  _cancelBreaking() {
    if (!this.breakState) return;
    const blockId = this.breakState.type === 'crop' ? null : this.breakState.block;
    this.breakState = null;
    this.world.clearBreakCracks();
    if (blockId === BLOCK_IDS.REGOLITH) this.onStopRegolithBreak();
    else if (SHIP_BLOCK_IDS.includes(blockId)) this.onStopShipBlockBreak();
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

    target.progress = Math.min(1, target.progress + dt * (this.getWorkSpeed?.() ?? 1) / BLOCK_INTERACTION_CONFIG.BREAK_TIME);
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
        if (this.harvestCrop(target.plant)) this.world.spawnCropDrop(position, target.plant.userData.cropItemId);
      } else {
        this.world.breakBlock(target.x, target.y, target.z);
      }
      this._cancelBreaking();
    }
  }

  _bindEvents() {
    const overlay = document.getElementById('overlay');
    const pauseOverlay = document.getElementById('pause-overlay');
    const menuCard = overlay.querySelector('.mc-menu-card');
    const menuCardHome = menuCard.parentElement;
    const pauseMenuCardHost = document.getElementById('pause-menu-card-host');
    const startBtn = document.getElementById('start-btn');
    const resetBtn = document.getElementById('reset-btn');
    const controlsBtn = document.getElementById('controls-btn');
    const controlsBackBtn = document.getElementById('controls-back-btn');
    const menuMain = document.getElementById('menu-main');
    const controlsScreen = document.getElementById('controls-screen');
    const respawnBtn = document.getElementById('respawn-btn');

    const showPauseMenu = () => {
      pauseMenuCardHost.append(menuCard);
      startBtn.textContent = 'Resume';
      overlay.classList.add('hidden');
      pauseOverlay.classList.remove('hidden');
      document.body.classList.add('pause-menu-open');
    };

    this._showPauseMenu = showPauseMenu;
    this.hud.inventoryCloseBtn?.addEventListener('click', () => this._closeInventory());

    controlsBtn.addEventListener('click', () => {
      menuMain.classList.add('hidden');
      controlsScreen.classList.remove('hidden');
      menuMain.closest('.mc-menu').classList.add('is-controls');
    });

    controlsBackBtn.addEventListener('click', () => {
      controlsScreen.classList.add('hidden');
      menuMain.classList.remove('hidden');
      menuMain.closest('.mc-menu').classList.remove('is-controls');
    });

    window.addEventListener('resize', () => this._updateOrientationMode());
    window.addEventListener('orientationchange', () => this._updateOrientationMode());

    document.addEventListener('keydown', (e) => {
      const gameHasFocus = this.isLocked || document.pointerLockElement === this.domElement;
      if (!gameHasFocus || !this._isBrowserShortcut(e)) return;
      e.preventDefault();
    }, true);

    const resumeGame = ({ capturePointer = true } = {}) => {
      this.hasStarted = true;
      if (this.supportsTouch) this._startTouchMode();
      else if (capturePointer) {
        requestRawPointerLock(this.domElement);
      } else {
        // Browsers immediately release pointer lock when it is requested from
        // Escape. Resume now and request it after that key has been released.
        this._awaitingPointerLock = true;
        this._resumeOnEscapeKeyUp = true;
        this.isLocked = true;
        menuCardHome.append(menuCard);
        startBtn.textContent = 'Play';
        overlay.classList.add('hidden');
        pauseOverlay.classList.add('hidden');
        document.body.classList.remove('pause-menu-open');
      }
    };

    startBtn.addEventListener('click', () => {
      resumeGame();
    });

    // This capture listener runs before game/UI handlers. It resumes from the
    // visible pause menu and prevents Escape from reaching any other overlay.
    document.addEventListener('keydown', (e) => {
      if (e.code !== 'Escape' || e.repeat) return;
      if (!pauseOverlay.classList.contains('hidden')) {
        e.preventDefault();
        e.stopImmediatePropagation();
        resumeGame({ capturePointer: false });
        return;
      }
      if (this._awaitingPointerLock && this.isLocked) {
        e.preventDefault();
        e.stopImmediatePropagation();
        this.isLocked = false;
        showPauseMenu();
        return;
      }
    }, true);

    document.addEventListener('keyup', (e) => {
      if (e.code !== 'Escape' || !this._resumeOnEscapeKeyUp) return;
      this._resumeOnEscapeKeyUp = false;
      requestRawPointerLock(this.domElement);
    }, true);

    // Botão "Done" do diário: o clique é gesto do usuário, então já volta com o mouse travado.
    document.getElementById('journal-done')?.addEventListener('click', () => {
      this.onToggleJournal(false);
      if (!this.isTouchMode) requestRawPointerLock(this.domElement);
    });

    resetBtn.addEventListener('click', () => {
      if (!window.confirm('Reset the world? This will erase your saved game.')) return;
      try { window.localStorage.removeItem('marscraft-save-v1'); } catch { /* Ignore unavailable storage. */ }
      window.location.reload();
    });

    if (respawnBtn) {
      respawnBtn.addEventListener('click', () => {
        this.survival.resetStats();
        this.player.resetToShipRamp();
        this.hud.hideDeathScreen();
        if (this.isTouchMode) {
          this.keys = {};
          this.isLocked = true;
          pauseOverlay.classList.add('hidden');
        } else {
          requestRawPointerLock(this.domElement);
        }
      });
    }

    document.addEventListener('pointerlockchange', () => {
      this.isLocked = this.isTouchMode || document.pointerLockElement === this.domElement;
      if (this.isLocked) this._awaitingPointerLock = false;
      if (!this.isLocked) {
        // Sem pointer lock o jogador para: sem teclas presas e sem animacao de caminhada.
        this._cancelBreaking();
        this.isScanButtonHeld = false;
        this.keys = {};
        this.player.isMoving = false;
      }
      const canShowMenu = !this.survival.isDead
        && !this.hud.isInventoryOpen
        && !this.isMissionModalOpen()
        && !this.isStationOpen?.()
        && !this.isJournalOpen();
      const showStartMenu = canShowMenu && !this.hasStarted;
      const showPauseMenuNow = canShowMenu && this.hasStarted && !this.isLocked;
      if (showPauseMenuNow) {
        showPauseMenu();
      } else {
        menuCardHome.append(menuCard);
        startBtn.textContent = 'Play';
        overlay.classList.toggle('hidden', !showStartMenu);
        pauseOverlay.classList.add('hidden');
        document.body.classList.remove('pause-menu-open');
      }
    });

    document.addEventListener('mousemove', (e) => {
      if (!this.isLocked || this.survival.isDead || this.isInputBlocked()) return;
      if (this.isRoverActive()) {
        this.onRoverLook(e.movementX, e.movementY);
        return;
      }
      if (this.isGymActive?.()) {
        this.onGymLook?.(e.movementX, e.movementY);
        return;
      }
      applyMouseLook(this.player, e.movementX, e.movementY, this.isZoomed);
    });

    window.addEventListener('keydown', (e) => {
      if (this.survival.isDead || this.isStationOpen?.() || this.isInputBlocked()) return;
      // Painel do MAV ou tela de vitoria abertos: so [F] continua ativo.
      if (this.isMissionModalOpen()) {
        if (e.code === 'KeyF' && !e.repeat) this.onInteract();
        return;
      }
      if (this.isGymActive?.()) {
        if (e.code === 'Space' && !e.repeat) {
          e.preventDefault();
          this.onGymAction?.();
        } else if (e.code === 'KeyF' && !e.repeat) {
          e.preventDefault();
          this.onInteract?.();
        }
        return;
      }
      if (this.hud.isInventoryOpen && e.code !== 'KeyE') return;
      if (this.isJournalOpen()) {
        this._handleJournalKey(e, showPauseMenu);
        return;
      }
      if (e.code === 'KeyG' && this.isLocked && !e.repeat) this.onSendData();
      if ((e.code === 'KeyR' || e.code === 'KeyC') && this.isLocked && !e.repeat) {
        if (this.getInteraction?.()?.type === 'suitport') {
          e.preventDefault();
          this.onSuitportAction(e.code === 'KeyR' ? 'repair' : 'clean');
          return;
        }
      }
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

      if (e.code === 'Space' && this.isRoverActive()) {
        e.preventDefault();
        this.onRoverAction();
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
        this._toggleInventory();
        return;
      }

      if (e.code === 'KeyF' && this.isLocked && !e.repeat) {
        this.onInteract?.();
        return;
      }

      if (e.code === 'KeyQ' && this.isLocked && !e.repeat) {
        const slot = this.survival.slots[this.hud.selectedSlot];
        if (slot?.equipment) return;
        if (slot && this.survival.useBlockFromSlot(this.hud.selectedSlot)) {
          this.world.spawnPlayerDrop(this.player.pos, this.player.yaw, slot.id);
          this.hud.renderHotbar(this.survival.slots);
          this._syncHandWithSlot();
        }
        return;
      }
      // A tecla T nao avanca mais o tempo no jogo normal (issue #109): para passar o tempo,
      // durma num beliche. O atalho de teste ficou so no painel de admin (AdminPanel).
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
      if (e.code === 'KeyW') this.keys.Sprint = false;
    });

    window.addEventListener('blur', () => { this.keys = {}; });

    window.addEventListener('wheel', (e) => {
      if (!this.isLocked || this.survival.isDead || this.isInputBlocked()) return;
      const dir = Math.sign(e.deltaY);
      // Com o scanner aberto, a rodinha controla o zoom (para cima aproxima) em vez da hotbar.
      if (this.isScannerOpen) {
        if (dir !== 0) this._setScope(true, dir < 0);
        return;
      }
      this.hud.selectSlot(this.hud.selectedSlot + dir, this.survival.slots);
      this._syncHandWithSlot();
    });

    window.addEventListener('mousedown', (e) => {
      if (this._awaitingPointerLock && !this.isTouchMode) {
        requestRawPointerLock(this.domElement);
        return;
      }
      if (!this.isLocked || this.survival.isDead || this.isRoverActive() || this.isInputBlocked()) return;

      if (this.isGymActive?.()) {
        if (e.button === 0) this.onGymAction?.();
        return;
      }

      const interaction = this.getInteraction?.();
      if (interaction && ['treadmill', 'bike', 'medical', 'greenhouse'].includes(interaction.type) && (e.button === 0 || e.button === 2)) {
        this.onInteract?.();
        return;
      }

      if (e.button === 0) {
        if (this._handleScopeMouseButton(0)) return;
        this.isBreakButtonHeld = true;
        this._startBreaking();
        return;
      }

      if (e.button === 2) {
        if (!this._handleScopeMouseButton(2)) this._useSelectedItem();
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        this.isScanButtonHeld = false;
        this.isBreakButtonHeld = false;
        this._cancelBreaking();
      }
    });

    window.addEventListener('blur', () => {
      this.isBreakButtonHeld = false;
      this.isScanButtonHeld = false;
      this._cancelBreaking();
      this.keys = {};
    });

    window.addEventListener('contextmenu', (e) => e.preventDefault());

    const joystick = document.getElementById('mobile-joystick');
    joystick.addEventListener('pointerdown', (e) => {
      if (!this.isTouchMode || this.survival.isDead || this.hud.isInventoryOpen || this.isInputBlocked()) return;
      e.preventDefault();
      this.joystickPointerId = e.pointerId;
      joystick.setPointerCapture(e.pointerId);
      this._moveJoystick(e);
    });

    window.addEventListener('pointermove', (e) => {
      if (e.pointerId === this.joystickPointerId) this._moveJoystick(e);
      if (e.pointerId !== this.lookPointerId || this.survival.isDead || this.hud.isInventoryOpen) return;
      const dx = e.clientX - this.lastTouchLookX;
      const dy = e.clientY - this.lastTouchLookY;
      this.lastTouchLookX = e.clientX;
      this.lastTouchLookY = e.clientY;
      const boundedDx = Math.max(-100, Math.min(100, dx));
      const boundedDy = Math.max(-100, Math.min(100, dy));
      if (this.isRoverActive()) this.onRoverLook(boundedDx, boundedDy);
      else if (this.isGymActive?.()) this.onGymLook?.(boundedDx, boundedDy);
      else applyMouseLook(this.player, boundedDx, boundedDy, this.isZoomed);
    });

    window.addEventListener('pointerup', (e) => this._releaseTouchPointer(e.pointerId));
    window.addEventListener('pointercancel', (e) => this._releaseTouchPointer(e.pointerId));

    this.domElement.addEventListener('pointerdown', (e) => {
      if (!this.isTouchMode || e.pointerType === 'mouse' || e.clientX < window.innerWidth * 0.4) return;
      if (this.survival.isDead || this.hud.isInventoryOpen || this.isInputBlocked()) return;
      e.preventDefault();
      this.lookPointerId = e.pointerId;
      this.lastTouchLookX = e.clientX;
      this.lastTouchLookY = e.clientY;
      this.domElement.setPointerCapture(e.pointerId);
    });

    document.querySelectorAll('[data-touch-action]').forEach((button) => {
      button.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        this._handleTouchAction(button.dataset.touchAction, button, e.pointerId);
      });
    });

    document.getElementById('hotbar').addEventListener('click', (e) => {
      if (!this.isTouchMode) return;
      const slot = e.target.closest('.mc-slot');
      if (!slot) return;
      this.hud.selectSlot(Number(slot.dataset.slotIndex), this.survival.slots);
      this._syncHandWithSlot();
    });
  }

  _setScope(open, zoomed) {
    const nextZoom = open && zoomed;
    if (!open) this.isScanButtonHeld = false;
    const changed = open !== this.isScannerOpen || nextZoom !== this.isZoomed;
    this.isScannerOpen = open;
    this.isZoomed = nextZoom;
    if (!changed) return;
    this.onToggleZoom(this.isScannerOpen, this.isZoomed);
    this.hud.updateZoomState(this.isScannerOpen, this.isZoomed);
  }

  // Com o diário aberto, só J (volta ao jogo) e Esc (fecha e mostra o menu) fazem algo.
  // Esc não conta como gesto do usuário para o pointer lock, por isso volta pelo botão Play.
  _handleJournalKey(e, showPauseMenu) {
    if (e.repeat) return;
    if (e.code === 'KeyJ') {
      e.preventDefault();
      this.onToggleJournal(false);
      requestRawPointerLock(this.domElement);
    } else if (e.code === 'Escape') {
      this.onToggleJournal(false);
      showPauseMenu();
    }
  }

  _isBrowserShortcut(e) {
    // Suppress browser accelerators while the game owns the pointer. Keep the
    // key event itself flowing so movement, sprint, and debug controls still work.
    if (e.ctrlKey || e.metaKey || e.altKey) return true;
    if (e.shiftKey) return true;

    // Escape remains available to release pointer lock. F3 remains the game's debug overlay.
    if (e.code.startsWith('F') && e.code !== 'F3') return true;
    if (['Tab', 'Space', 'Backspace'].includes(e.code)) return true;
    return false;
  }
}
