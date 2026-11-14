export class HudManager {
  constructor(previews, initialSlots) {
    this.previews = previews;
    this.selectedSlot = 0;

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

    this.healthBarEl = document.getElementById('health-bar');
    this.oxygenBarEl = document.getElementById('oxygen-bar');
    this.waterBarEl = document.getElementById('water-bar');
    this.foodBarEl = document.getElementById('food-bar');

    this.renderHotbar(initialSlots);
    this._initSkyLabels();
  }

  renderHotbar(slots) {
    this.hotbarEl.innerHTML = '';
    slots.forEach((slotData, idx) => {
      const slot = document.createElement('div');
      slot.className = `mc-slot ${idx === this.selectedSlot ? 'active' : ''}`;

      const hasItems = slotData.count > 0;
      const swatchStyle = hasItems
        ? `background-image: url('${this.previews[slotData.id]}'); opacity: 1;`
        : `background-image: url('${this.previews[slotData.id]}'); opacity: 0.22;`;

      slot.innerHTML = `
        <div class="mc-slot-icon" style="${swatchStyle}"></div>
        <span class="mc-slot-count">${slotData.count > 0 ? slotData.count : ''}</span>
      `;
      this.hotbarEl.appendChild(slot);
    });

    const current = slots[this.selectedSlot];
    if (current) {
      this.selectedBlockNameEl.textContent = current.name;
    }
  }

  _initSkyLabels() {
    this.earthLabel = this._createSkyTag('[TERRA + LUA]', 'mc-sky-tag earth');
    this.phobosLabel = this._createSkyTag('[FOBOS]', 'mc-sky-tag moon');
    this.deimosLabel = this._createSkyTag('[DEIMOS]', 'mc-sky-tag moon');
  }

  _createSkyTag(text, cls) {
    const el = document.createElement('div');
    el.className = cls;
    el.textContent = text;
    this.skyLabelsEl.appendChild(el);
    return el;
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

  _renderIconBar(container, currentVal, type) {
    // 10 icones (cada icone = 2 pontos de 20)
    let html = '';
    for (let i = 0; i < 10; i++) {
      const thresholdFull = (i + 1) * 2;
      const thresholdHalf = i * 2 + 1;
      let state = 'empty';
      if (currentVal >= thresholdFull - 0.2) {
        state = 'full';
      } else if (currentVal >= thresholdHalf - 0.2) {
        state = 'half';
      }
      html += `<span class="mc-stat-icon ${type} ${state}"></span>`;
    }
    container.innerHTML = html;
  }

  _projectLabel(el, worldPos, camera, camDir) {
    const toTarget = worldPos.clone().sub(camera.position).normalize();
    if (camDir.dot(toTarget) <= 0.05) {
      el.style.opacity = '0';
      return;
    }

    const projected = worldPos.clone().project(camera);
    const x = (projected.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-projected.y * 0.5 + 0.5) * window.innerHeight;

    if (x < -100 || x > window.innerWidth + 100 || y < -50 || y > window.innerHeight + 50) {
      el.style.opacity = '0';
      return;
    }

    el.style.opacity = '1';
    el.style.left = `${x}px`;
    el.style.top = `${y - 16}px`;
  }

  update({ player, survival, sky, camera, isZoomed }) {
    if (survival.isDead) {
      this.showDeathScreen();
      return;
    }

    const { clockText } = sky.getFormattedTime();
    this.solTimeEl.textContent = clockText;

    const px = Math.round(player.pos.x);
    const py = Math.round(player.pos.y - player.height);
    const pz = Math.round(player.pos.z);
    this.coordsEl.textContent = `XYZ: ${px} / ${py} / ${pz}`;

    if (survival.insidePressurizedShip) {
      this.envStatusEl.textContent = 'Ambiente: Interior da Nave (Recarregando O2)';
      this.envStatusEl.style.color = '#7cfc00';
    } else {
      this.envStatusEl.textContent = 'Ambiente: Cratera de Marte (Consumindo O2)';
      this.envStatusEl.style.color = '#ffffff';
    }

    // Atualiza barras de status Survival estilo Minecraft
    this._renderIconBar(this.healthBarEl, survival.health, 'heart');
    this._renderIconBar(this.oxygenBarEl, survival.oxygen, 'bubble');
    this._renderIconBar(this.waterBarEl, survival.water, 'drop');
    this._renderIconBar(this.foodBarEl, survival.food, 'food');

    const earthPos = sky.getEarthWorldPosition();
    const phobosPos = sky.getPhobosWorldPosition();
    const deimosPos = sky.getDeimosWorldPosition();
    const camDir = player.getLookDirection();

    this._projectLabel(this.earthLabel, earthPos, camera, camDir);
    this._projectLabel(this.phobosLabel, phobosPos, camera, camDir);
    this._projectLabel(this.deimosLabel, deimosPos, camera, camDir);

    if (isZoomed) {
      const dirToEarth = earthPos.clone().sub(camera.position).normalize();
      if (camDir.angleTo(dirToEarth) < 0.14) {
        this.zoomTargetEl.textContent = 'Observando: Planeta Terra e Lua';
      } else {
        this.zoomTargetEl.textContent = 'Luneta Ativa - Procure [TERRA + LUA] no ceu';
      }
    }
  }
}
