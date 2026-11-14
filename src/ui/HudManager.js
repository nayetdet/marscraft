import * as THREE from 'three';

const ICONS_PER_BAR = 10;

const STAT_ICON_PATHS = {
  heart: '<path d="M1 1h2v1h2V1h2v1h1v3H7v1H6v1H5v1H3V7H2V6H1V5H0V2h1Z"/>',
  oxygen: '<path d="M2 0h4v1h1v1h1v4H7v1H6v1H2V7H1V6H0V2h1V1h1Z"/>',
  water: '<path d="M3 0h2v1h1v1h1v1h1v3H7v1H6v1H2V7H1V6H0V3h1V2h1V1h1Z"/>',
  food: '<path d="M1 0h3v1h1v1h1v2H5v2H4v1H2V5H1V3H0V1h1Z M6 5h2v3H6Z"/>',
};

export class HudManager {
  constructor(previews, initialSlots, { onInventorySwap } = {}) {
    this.previews = previews;
    this.onInventorySwap = onInventorySwap;
    this.selectedSlot = 0;
    this.inventorySelection = null;

    this.hotbarEl = document.getElementById('hotbar');
    this.selectedBlockNameEl = document.getElementById('selected-block-name');
    this.solTimeEl = document.getElementById('sol-time');
    this.coordsEl = document.getElementById('player-coords');
    this.envStatusEl = document.getElementById('env-status');
    this.skyLabelsEl = document.getElementById('sky-labels');
    this.zoomOverlayEl = document.getElementById('zoom-overlay');
    this.zoomTargetEl = document.getElementById('zoom-target');
    this.toastEl = document.getElementById('toast');
    this.deathOverlayEl = document.getElementById('death-overlay');
    this.inventoryOverlayEl = document.getElementById('inventory-overlay');
    this.inventoryGridEl = document.getElementById('inventory-grid');
    this.inventoryHotbarEl = document.getElementById('inventory-hotbar');
    this.isInventoryOpen = false;

    this.healthBarEl = document.getElementById('health-bar');
    this.oxygenBarEl = document.getElementById('oxygen-bar');
    this.waterBarEl = document.getElementById('water-bar');
    this.foodBarEl = document.getElementById('food-bar');

    this.statBars = [
      this._createIconBar(this.healthBarEl, 'heart'),
      this._createIconBar(this.oxygenBarEl, 'oxygen'),
      this._createIconBar(this.waterBarEl, 'water'),
      this._createIconBar(this.foodBarEl, 'food'),
    ];

    // Ultimos valores escritos no DOM: so reescreve quando algo muda
    this._lastClockText = '';
    this._lastCoordsText = '';
    this._lastInsideShip = null;

    this._camDir = new THREE.Vector3();
    this._earthPos = new THREE.Vector3();
    this._phobosPos = new THREE.Vector3();
    this._deimosPos = new THREE.Vector3();
    this._scratch = new THREE.Vector3();

    // Elementos de interação e controle do Rover
    this.interactionPromptEl = document.getElementById('interaction-prompt');
    this.roverOverlayEl = document.getElementById('rover-overlay');
    this.roverSpeedEl = document.getElementById('rover-speed');
    this.roverHeadingEl = document.getElementById('rover-heading');
    this.roverCoordsEl = document.getElementById('rover-coords');
    this.roverBatteryEl = document.getElementById('rover-battery');
    this.roverCamLabelEl = document.getElementById('rover-cam-label');
    this.bottomAreaEl = document.querySelector('.mc-bottom-area');
    this.crosshairEl = document.querySelector('.mc-crosshair');

    this.renderHotbar(initialSlots);
    this._initSkyLabels();
  }

  setInteractionPrompt(visible, text = '[F] Operate Rover Remote Terminal') {
    if (!this.interactionPromptEl) return;
    if (visible) {
      this.interactionPromptEl.innerHTML = `<span class="key-badge">[F]</span> ${text.replace(/^\[F\]\s*/, '')}`;
      this.interactionPromptEl.classList.remove('hidden');
    } else {
      this.interactionPromptEl.classList.add('hidden');
    }
  }

  setRoverMode(active) {
    if (this.roverOverlayEl) {
      this.roverOverlayEl.classList.toggle('hidden', !active);
    }
    if (this.bottomAreaEl) {
      this.bottomAreaEl.style.display = active ? 'none' : '';
    }
    if (this.crosshairEl) {
      this.crosshairEl.style.display = active ? 'none' : '';
    }
    if (this.interactionPromptEl && active) {
      this.interactionPromptEl.classList.add('hidden');
    }
  }

  renderHotbar(slots) {
    this.hotbarEl.innerHTML = '';
    slots.forEach((slotData, idx) => {
      const slot = document.createElement('div');
      slot.className = `mc-slot ${idx === this.selectedSlot ? 'active' : ''}`;

      const hasItems = (slotData?.count ?? 0) > 0;
      const swatchStyle = hasItems
        ? `background-image: url('${this.previews[slotData.id]}'); opacity: 1;`
        : '';

      slot.innerHTML = `
        <div class="mc-slot-icon" style="${swatchStyle}"></div>
        <span class="mc-slot-count">${hasItems ? slotData.count : ''}</span>
      `;
      this.hotbarEl.appendChild(slot);
    });

    const current = slots[this.selectedSlot];
    if (current) {
      this.selectedBlockNameEl.textContent = current.name;
    } else {
      this.selectedBlockNameEl.textContent = 'Empty';
    }
  }

  renderInventory(inventorySlots) {
    this.currentInventorySlots = inventorySlots;
    const renderSlot = (slotData, index, hotbar = false) => {
      const slot = document.createElement('div');
      slot.className = `mc-slot inventory-slot ${hotbar && index === this.selectedSlot ? 'active' : ''} ${index === this.inventorySelection ? 'picked' : ''}`;
      slot.addEventListener('click', () => this._selectInventorySlot(index));
      if (slotData) {
        slot.innerHTML = `
          <div class="mc-slot-icon" style="background-image: url('${this.previews[slotData.id]}')"></div>
          <span class="mc-slot-count">${slotData.count > 0 ? slotData.count : ''}</span>
        `;
      }
      return slot;
    };

    this.inventoryGridEl.innerHTML = '';
    inventorySlots.slice(9).forEach((slotData, index) => {
      this.inventoryGridEl.appendChild(renderSlot(slotData, index + 9));
    });
    this.inventoryHotbarEl.innerHTML = '';
    inventorySlots.slice(0, 9).forEach((slotData, index) => {
      this.inventoryHotbarEl.appendChild(renderSlot(slotData, index, true));
    });
  }

  openInventory(inventorySlots) {
    this.isInventoryOpen = true;
    this.inventorySelection = null;
    this.renderInventory(inventorySlots);
    this.inventoryOverlayEl.classList.remove('hidden');
  }

  closeInventory() {
    this.isInventoryOpen = false;
    this.inventorySelection = null;
    this.inventoryOverlayEl.classList.add('hidden');
  }

  _selectInventorySlot(index) {
    if (this.inventorySelection === null) {
      if (!this.currentInventorySlots[index]) return;
      this.inventorySelection = index;
      this.renderInventory(this.currentInventorySlots);
      return;
    }

    if (this.inventorySelection === index) {
      this.inventorySelection = null;
      this.renderInventory(this.currentInventorySlots);
      return;
    }

    const inventorySlots = this.onInventorySwap?.(this.inventorySelection, index) ?? this.currentInventorySlots;
    this.inventorySelection = null;
    this.renderInventory(inventorySlots);
  }

  _initSkyLabels() {
    this.earthLabel = this._createSkyTag('[EARTH + MOON]', 'mc-sky-tag earth');
    this.phobosLabel = this._createSkyTag('[PHOBOS]', 'mc-sky-tag moon');
    this.deimosLabel = this._createSkyTag('[DEIMOS]', 'mc-sky-tag moon');
  }

  _createSkyTag(text, cls) {
    const el = document.createElement('div');
    el.className = cls;
    el.textContent = text;
    el.style.left = '0px';
    el.style.top = '0px';
    el.style.opacity = '0';
    this.skyLabelsEl.appendChild(el);
    return { el, visible: false, x: NaN, y: NaN };
  }

  selectSlot(index, slots) {
    this.selectedSlot = (index + slots.length) % slots.length;
    this.renderHotbar(slots);
  }

  updateZoomState(isZoomed) {
    this.zoomOverlayEl.classList.toggle('hidden', !isZoomed);
  }

  showToast(msg) {
    this.toastEl.textContent = msg;
    this.toastEl.classList.add('visible');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      this.toastEl.classList.remove('visible');
    }, 2400);
  }

  showDeathScreen() {
    this.deathOverlayEl.classList.remove('hidden');
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  }

  hideDeathScreen() {
    this.deathOverlayEl.classList.add('hidden');
  }

  // Cria os 10 icones (SVG) uma unica vez; depois so troca a classe dos que mudaram
  _createIconBar(container, type) {
    container.innerHTML = '';
    const icons = [];
    for (let i = 0; i < ICONS_PER_BAR; i++) {
      const span = document.createElement('span');
      span.className = `mc-stat-icon ${type} empty`;
      span.setAttribute('aria-hidden', 'true');
      span.innerHTML = `<svg viewBox="0 0 8 8" shape-rendering="crispEdges">${STAT_ICON_PATHS[type]}</svg>`;
      container.appendChild(span);
      icons.push({ span, state: 'empty' });
    }
    return { type, icons };
  }

  _updateIconBar(bar, currentVal) {
    // 10 icones (cada icone = 2 pontos de 20)
    for (let i = 0; i < ICONS_PER_BAR; i++) {
      const thresholdFull = (i + 1) * 2;
      const thresholdHalf = i * 2 + 1;
      let state = 'empty';
      if (currentVal >= thresholdFull - 0.2) {
        state = 'full';
      } else if (currentVal >= thresholdHalf - 0.2) {
        state = 'half';
      }
      const icon = bar.icons[i];
      if (icon.state !== state) {
        icon.state = state;
        icon.span.className = `mc-stat-icon ${bar.type} ${state}`;
      }
    }
  }

  _setLabelVisible(label, visible) {
    if (label.visible === visible) return;
    label.visible = visible;
    label.el.style.opacity = visible ? '1' : '0';
  }

  _projectLabel(label, worldPos, camera, camDir) {
    const toTarget = this._scratch.copy(worldPos).sub(camera.position).normalize();
    if (camDir.dot(toTarget) <= 0.05) {
      this._setLabelVisible(label, false);
      return;
    }

    const projected = this._scratch.copy(worldPos).project(camera);
    const x = Math.round((projected.x * 0.5 + 0.5) * window.innerWidth);
    const y = Math.round((-projected.y * 0.5 + 0.5) * window.innerHeight);

    if (x < -100 || x > window.innerWidth + 100 || y < -50 || y > window.innerHeight + 50) {
      this._setLabelVisible(label, false);
      return;
    }

    this._setLabelVisible(label, true);
    if (label.x !== x || label.y !== y) {
      label.x = x;
      label.y = y;
      // transform so recompoe a camada, sem recalcular o layout da pagina
      label.el.style.transform = `translate(${x}px, ${y - 16}px) translate(-50%, -100%)`;
    }
  }

  update({ player, survival, sky, camera, isZoomed, isRoverActive = false, roverTelemetry = null }) {
    if (survival.isDead) {
      this.showDeathScreen();
      return;
    }

    if (isRoverActive && roverTelemetry) {
      if (this.roverSpeedEl) this.roverSpeedEl.textContent = `${roverTelemetry.speedKmh} km/h`;
      if (this.roverHeadingEl) this.roverHeadingEl.textContent = `${roverTelemetry.headingDeg}° ${roverTelemetry.headingCard}`;
      if (this.roverCoordsEl) this.roverCoordsEl.textContent = `X: ${roverTelemetry.x} Y: ${roverTelemetry.y} Z: ${roverTelemetry.z}`;
      if (this.roverBatteryEl) this.roverBatteryEl.textContent = `${roverTelemetry.battery}%`;
      if (this.roverCamLabelEl) {
        this.roverCamLabelEl.textContent =
          roverTelemetry.cameraMode === 'mastcam'
            ? 'CAM: MASTCAM (1ST-PERSON)'
            : 'CAM: TACTICAL 3RD-PERSON';
      }
    }

    const { clockText } = sky.getFormattedTime();
    if (clockText !== this._lastClockText) {
      this._lastClockText = clockText;
      this.solTimeEl.textContent = clockText;
    }

    const px = Math.round(player.pos.x);
    const py = Math.round(player.pos.y - player.height);
    const pz = Math.round(player.pos.z);
    const coordsText = `XYZ: ${px} / ${py} / ${pz}`;
    if (coordsText !== this._lastCoordsText) {
      this._lastCoordsText = coordsText;
      this.coordsEl.textContent = coordsText;
    }

    if (survival.insidePressurizedShip !== this._lastInsideShip) {
      this._lastInsideShip = survival.insidePressurizedShip;
      if (survival.insidePressurizedShip) {
        this.envStatusEl.textContent = 'Environment: Pressurized Habitat (refilling oxygen)';
        this.envStatusEl.style.color = '#7cfc00';
      } else {
        this.envStatusEl.textContent = 'Environment: Martian Crater (using oxygen)';
        this.envStatusEl.style.color = '#ffffff';
      }
    }

    // Atualiza barras de status Survival estilo Minecraft
    const [healthBar, oxygenBar, waterBar, foodBar] = this.statBars;
    this._updateIconBar(healthBar, survival.health);
    this._updateIconBar(oxygenBar, survival.oxygen);
    this._updateIconBar(waterBar, survival.water);
    this._updateIconBar(foodBar, survival.food);

    const earthPos = sky.getEarthWorldPosition(this._earthPos);
    const phobosPos = sky.getPhobosWorldPosition(this._phobosPos);
    const deimosPos = sky.getDeimosWorldPosition(this._deimosPos);
    const camDir = player.getLookDirection(this._camDir);

    this._projectLabel(this.earthLabel, earthPos, camera, camDir);
    this._projectLabel(this.phobosLabel, phobosPos, camera, camDir);
    this._projectLabel(this.deimosLabel, deimosPos, camera, camDir);

    if (isZoomed) {
      const dirToEarth = this._scratch.copy(earthPos).sub(camera.position).normalize();
      const zoomText = camDir.angleTo(dirToEarth) < 0.14 ? 'Earth + Moon' : '';
      if (this.zoomTargetEl.textContent !== zoomText) {
        this.zoomTargetEl.textContent = zoomText;
      }
    }
  }
}
