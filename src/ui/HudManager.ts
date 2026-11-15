// @ts-nocheck
import * as THREE from 'three';
import { BLOCK_IDS } from '../config/blockTypes.ts';
import { CREW_CONFIG, SURVIVAL_CONFIG, WATER_SYSTEM_CONFIG } from '../config/constants.ts';
import { airlockProgress } from './airlockProgress.ts';
import { roverBatteryText } from '../rover/roverText.ts';
import { getDamageFeedback, getDeathReport } from '../player/deathReport.ts';
import { getSuitTelemetryView } from '../player/suitTelemetry.ts';
import { InventorySuitPreview } from './InventorySuitPreview.ts';
import { DOSE_LIMIT_MSV, dosePercent, doseTone } from '../mission/doseBudget.ts';
import { getJournalItemIcon, getRationItemIcon, getSampleItemIcon, getScopeItemIcon, getShieldRemoteItemIcon } from '../graphics/itemIcons.ts';
import { sampleTypeByItem } from '../data/sampleTypes.ts';
import { getStatIconSvg } from './statIcons.ts';

const ICONS_PER_BAR = 10;

export class HudManager {
  constructor(previews, initialSlots, {
    onInventorySwap,
    onUiClick,
    onOpenJournal,
    getSuitState,
    onSuitportEquip,
    onSuitportRepair,
    onSuitportClean,
  } = {}) {
    this.previews = previews;
    this.onInventorySwap = onInventorySwap;
    this.onUiClick = onUiClick;
    this.onOpenJournal = onOpenJournal;
    this.getSuitState = getSuitState;
    this.onSuitportEquip = onSuitportEquip;
    this.onSuitportRepair = onSuitportRepair;
    this.onSuitportClean = onSuitportClean;
    this._lastSuitContext = null;
    this.selectedSlot = 0;
    this.inventorySelection = null;

    this.hotbarEl = document.getElementById('hotbar');
    this.selectedBlockNameEl = document.getElementById('selected-block-name');
    this.solTimeEl = document.getElementById('sol-time');
    this.coordsEl = document.getElementById('player-coords');
    this.envStatusEl = document.getElementById('env-status');
    this.skyLabelsEl = document.getElementById('sky-labels');
    this.zoomOverlayEl = document.getElementById('zoom-overlay');
    this.captionQueueEl = document.getElementById('caption-queue');
    this.toastEl = document.getElementById('toast');
    this._captionQueue = [];
    this._captionTimer = null;
    this._toastTimer = null;
    this.systemNoticeEl = document.getElementById('system-notice');
    this.systemNoticeLabelEl = document.getElementById('system-notice-label');
    this.systemNoticeMessageEl = document.getElementById('system-notice-message');
    this._systemNoticeTimer = null;
    this.dangerVignetteEl = document.getElementById('danger-vignette');
    this.dangerWarningEl = document.getElementById('danger-warning');
    this.dangerWarningMessageEl = document.getElementById('danger-warning-message');
    this._dangerWarningText = '';
    this.damageSourceEl = document.getElementById('damage-source');
    this._damageSourceText = '';
    this.deathOverlayEl = document.getElementById('death-overlay');
    this.deathTitleEl = document.getElementById('death-title');
    this.deathDiagnosisEl = document.getElementById('death-diagnosis');
    this.deathScienceEl = document.getElementById('death-science');
    this.deathProtocolEl = document.getElementById('death-protocol');
    this.inventoryOverlayEl = document.getElementById('inventory-overlay');
    this.inventoryGridEl = document.getElementById('inventory-grid');
    this.inventoryHotbarEl = document.getElementById('inventory-hotbar');
    this.inventoryCloseBtn = document.getElementById('inventory-close-btn');
    this.isInventoryOpen = false;

    this.healthBarEl = document.getElementById('health-bar');
    this.radiationBarEl = document.getElementById('radiation-bar');
    this.oxygenBarEl = document.getElementById('oxygen-bar');
    this.suitIntegrityRowEl = document.getElementById('suit-integrity-row');
    this.suitIntegrityEl = document.getElementById('suit-integrity');
    this.waterBarEl = document.getElementById('water-bar');
    this.foodBarEl = document.getElementById('food-bar');

    this.statBars = [
      this._createIconBar(this.healthBarEl, 'heart'),
      this._createIconBar(this.oxygenBarEl, 'oxygen'),
      this._createIconBar(this.waterBarEl, 'water'),
      this._createIconBar(this.foodBarEl, 'food'),
    ];
    this.radiationDoseBar = this._createIconBar(this.radiationBarEl, 'radiation');
    this.suitIntegrityBar = this._createIconBar(document.getElementById('suit-integrity-icons'), 'fire');
    this.airlockEl = document.getElementById('airlock-progress');
    this.airlockTitleEl = this.airlockEl.querySelector('.airlock-progress-title');
    this.airlockFillEl = this.airlockEl.querySelector('.airlock-progress-track i');
    this.airlockTextEl = this.airlockEl.querySelector('.airlock-progress-text');

    this.evaVisorEl = document.getElementById('eva-visor-frame');
    this.suitEquipEl = document.getElementById('suit-equip-hud');
    this.suitEquipTitleEl = this.suitEquipEl?.querySelector('.suit-equip-title');
    this.suitEquipFillEl = this.suitEquipEl?.querySelector('.suit-equip-track i');
    this.suitEquipTextEl = this.suitEquipEl?.querySelector('.suit-equip-text');
    this._suitSeq = null; // { mode: 'equip'|'dock', startMs, durationMs }

    // Suitport Holo-Display ("EVA SUIT DIAGNOSTICS")
    this.suitportHoloEl = document.getElementById('suitport-holo');
    this.suitportEquipBtn = document.getElementById('suitport-equip-btn');
    this.suitportRepairBtn = document.getElementById('suitport-repair-btn');
    this.suitportCleanBtn = document.getElementById('suitport-clean-btn');

    // Inventory parallel vertical suit panel + 3D preview
    this.invSuitStatusEl = document.getElementById('inv-suit-status');
    this.invSuitValues = ['armor', 'o2', 'heat', 'co2', 'dust'].map(name => document.getElementById(`inv-suit-${name}-val`));
    this.invSuitArmorFill = document.getElementById('inv-suit-armor-fill');
    const invCanvas = document.getElementById('inventory-suit-canvas');
    this.suitPreview = invCanvas ? new InventorySuitPreview(invCanvas, document.getElementById('inventory-suit-panel')) : null;

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
    this.roverGpsIceEl = document.getElementById('rover-gps-ice');
    this.roverGpsPlayerEl = document.getElementById('rover-gps-player');
    this.roverGpsDistanceEl = document.getElementById('rover-gps-distance');
    this.astronautInfoEl = document.getElementById('astronaut-info');
    this.roverInfoEl = document.getElementById('rover-info');
    this.roverSpeedEl = document.getElementById('rover-speed');
    this.roverHeadingEl = document.getElementById('rover-heading');
    this.roverCoordsEl = document.getElementById('rover-coords');
    this.roverBatteryEl = document.getElementById('rover-battery');
    this.roverIceEl = document.getElementById('rover-ice');
    this.roverBucketEl = document.getElementById('rover-bucket');
    this.roverBucketFillEl = document.getElementById('rover-bucket-fill');
    this.roverActionBannerEl = document.getElementById('rover-action-banner');
    this.roverActionTextEl = document.getElementById('rover-action-text');
    this.bottomAreaEl = document.querySelector('.mc-bottom-area');
    this.crosshairEl = document.querySelector('.mc-crosshair');
    this.hudEl = document.getElementById('hud');
    this.gameContainerEl = document.getElementById('game-container');
    this.damageOverlayEl = document.getElementById('damage-overlay');
    this.breachOverlayEl = document.getElementById('breach-overlay');

    this.renderHotbar(initialSlots);
    this._initSkyLabels();
    this.suitportEquipBtn?.addEventListener('click', () => this.onSuitportEquip?.());
    this.suitportRepairBtn?.addEventListener('click', () => this.onSuitportRepair?.());
    this.suitportCleanBtn?.addEventListener('click', () => this.onSuitportClean?.());
  }

  setInteractionPrompt(visible, text = '[F] Operate Rover Remote Terminal') {
    if (!this.interactionPromptEl) return;
    if (visible) {
      this.interactionPromptEl.textContent = text.replace(/^\[F\]\s*/, 'Press F: ');
      this.interactionPromptEl.classList.remove('hidden');
    } else {
      this.interactionPromptEl.classList.add('hidden');
    }
  }

  setRoverMode(active) {
    document.body.classList.toggle('rover-active', active);
    if (this.roverOverlayEl) {
      this.roverOverlayEl.classList.toggle('hidden', !active);
    }
    const useLabel = document.getElementById('touch-use-label');
    const mineLabel = document.getElementById('touch-mine-label');
    if (useLabel) useLabel.textContent = 'USE';
    if (mineLabel) mineLabel.textContent = active ? 'DRILL' : 'MINE';
    if (this.bottomAreaEl) this.bottomAreaEl.style.display = '';
    if (this.crosshairEl) {
      this.crosshairEl.style.display = active ? 'none' : '';
    }
    if (this.astronautInfoEl) this.astronautInfoEl.classList.toggle('hidden', active);
    if (this.roverInfoEl) this.roverInfoEl.classList.toggle('hidden', !active);
    if (this.interactionPromptEl && active) {
      this.interactionPromptEl.classList.add('hidden');
    }
    if (active) {
      this.suitportHoloEl?.classList.add('hidden');
    }
  }

  renderHotbar(slots) {
    this.hotbarEl.innerHTML = '';
    slots.forEach((slotData, idx) => {
      const slot = document.createElement('div');
      slot.className = `mc-slot ${idx === this.selectedSlot ? 'active' : ''}`;
      slot.dataset.slotIndex = idx;

      const hasItems = (slotData?.count ?? 0) > 0;
      const preview = this._itemPreview(slotData?.id);
      const swatchStyle = hasItems
        ? `background-image: url('${preview ?? ''}'); opacity: 1;`
        : '';

      slot.innerHTML = `
        <div class="mc-slot-icon${slotData?.id === BLOCK_IDS.HYDRO_PLANT ? ' carrot' : ''}" style="${swatchStyle}"></div>
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
          <div class="mc-slot-icon${slotData.id === BLOCK_IDS.HYDRO_PLANT ? ' carrot' : ''}" style="background-image: url('${this._itemPreview(slotData.id) ?? ''}')"></div>
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

  // Hand equipment items have dedicated 16x16 pixel-art SVG icons
  _itemPreview(id) {
    if (id === BLOCK_IDS.SCOPE) return getScopeItemIcon();
    if (id === BLOCK_IDS.SHIELD_REMOTE) return getShieldRemoteItemIcon();
    if (id === BLOCK_IDS.JOURNAL) return getJournalItemIcon();
    if (id === BLOCK_IDS.RATION) return getRationItemIcon();
    const sample = sampleTypeByItem(id);
    if (sample) return getSampleItemIcon(sample.id);
    return this.previews[id];
  }

  openInventory(inventorySlots) {
    this.isInventoryOpen = true;
    document.body.classList.add('inventory-open');
    this.inventorySelection = null;
    this.renderInventory(inventorySlots);
    this._renderInventorySuitPanel();
    this.suitPreview?.start();
    this.inventoryOverlayEl.classList.remove('hidden');
  }

  closeInventory() {
    this.isInventoryOpen = false;
    document.body.classList.remove('inventory-open');
    this.inventorySelection = null;
    this.suitPreview?.stop();
    this.inventoryOverlayEl.classList.add('hidden');
  }

  _setElText(el, text) {
    if (el && el.textContent !== text) el.textContent = text;
  }

  _setElClass(el, cls) {
    if (el && el._cls !== cls) {
      el._cls = cls;
      el.className = cls;
    }
  }

  _renderInventorySuitPanel() {
    const ctx = this.getSuitState?.() ?? this._lastSuitContext;
    if (!ctx?.survival) return;
    const view = getSuitTelemetryView(ctx.survival, ctx);

    const statusText = !view.equipped ? 'No suit' : view.integrityPct <= 0 ? 'Suit broken' : 'EVA suit';
    this._setElText(this.invSuitStatusEl, statusText);
    const values = [view.integrityPct, view.o2Pct, view.thermalPct, view.scrubberPct, view.dustPct];
    values.forEach((value, index) => this._setElText(this.invSuitValues[index], `${value}%`));
    if (this.invSuitArmorFill) this.invSuitArmorFill.style.width = `${view.integrityPct}%`;

    this.suitPreview?.setState({
      equipped: view.equipped,
      upgraded: view.upgraded,
      dustPct: view.dustPct,
      integrityTone: view.integrityTone,
    });
  }

  setPlayerAppearance(profile) {
    this.suitPreview?.setAppearance(profile);
  }

  updateSuitportHolo(visible, suitCtx = null) {
    if (!this.suitportHoloEl) return;
    if (!visible || !suitCtx?.survival) {
      this._setElClass(this.suitportHoloEl, 'suitport-holo hidden');
      return;
    }
    this._setElClass(this.suitportHoloEl, 'suitport-holo');
    const view = getSuitTelemetryView(suitCtx.survival, suitCtx);

    if (this.suitportEquipBtn) {
      this._setElText(this.suitportEquipBtn, view.equipPromptLabel);
      const locked = !suitCtx.airlockPressurized || suitCtx.airlockDoorOpen;
      const canPress = !locked && (view.equipped || view.canEquipAtSuitport);
      this.suitportEquipBtn.disabled = !canPress;
      this._setElClass(
        this.suitportEquipBtn,
        `suitport-holo-btn primary${!view.equipped && canPress ? ' ready' : ''}`
      );
    }
    if (this.suitportRepairBtn) {
      const showRepair = !view.equipped && view.wearPct > 0;
      this.suitportRepairBtn.classList.toggle('hidden', !showRepair);
      this._setElText(
        this.suitportRepairBtn,
        suitCtx.batteryPercent >= SURVIVAL_CONFIG.SUIT_REPAIR_POWER_COST
          ? `[R] REPAIR SUIT (-${SURVIVAL_CONFIG.SUIT_REPAIR_POWER_COST}% PWR)`
          : '[R] EMERGENCY PATCH'
      );
    }
    if (this.suitportCleanBtn) {
      const showClean = !view.equipped && view.isDusty;
      this.suitportCleanBtn.classList.toggle('hidden', !showClean);
    }
  }

  _selectInventorySlot(index) {
    if (this.inventorySelection === null) {
      if (!this.currentInventorySlots[index]) return;
      this.inventorySelection = index;
      this.onUiClick?.();
      this.renderInventory(this.currentInventorySlots);
      return;
    }

    if (this.inventorySelection === index) {
      if (this.currentInventorySlots[index]?.id === BLOCK_IDS.JOURNAL) {
        this.closeInventory();
        this.onOpenJournal?.();
        return;
      }
      this.inventorySelection = null;
      this.onUiClick?.();
      this.renderInventory(this.currentInventorySlots);
      return;
    }

    const inventorySlots = this.onInventorySwap?.(this.inventorySelection, index) ?? this.currentInventorySlots;
    this.inventorySelection = null;
    this.onUiClick?.();
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

  updateZoomState(isScannerOpen, isZoomed = false) {
    this.zoomOverlayEl.classList.toggle('hidden', !isScannerOpen);
    this.zoomOverlayEl.classList.toggle('is-zoomed', isZoomed);
  }

  showToast(msg, durationMs = 2400) {
    this.toastEl.textContent = String(msg ?? '');
    this.toastEl.classList.add('visible');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => this.toastEl.classList.remove('visible'), durationMs);
  }

  showCaption(msg, durationMs = 3500) {
    const text = String(msg ?? '').trim();
    if (!text || this._captionQueue.some((item) => item.text === text)) return;
    const shouldStartTimer = this._captionQueue.length === 0;
    this._captionQueue.push({ text, durationMs });
    this._renderCaptionQueue();
    if (shouldStartTimer) this._scheduleCaptionAdvance();
  }

  _scheduleCaptionAdvance() {
    const current = this._captionQueue[0];
    if (!current) {
      this._captionTimer = null;
      this.captionQueueEl.classList.remove('visible');
      this.captionQueueEl.replaceChildren();
      return;
    }

    this._captionTimer = setTimeout(() => {
      this._captionQueue.shift();
      this._renderCaptionQueue();
      this._scheduleCaptionAdvance();
    }, current.durationMs);
  }

  _renderCaptionQueue() {
    const visibleMessages = this._captionQueue.slice(0, 3);
    this.captionQueueEl.replaceChildren(...visibleMessages.map((item, index) => this._createCaptionLine(item.text, index === 0)));
    const hiddenCount = this._captionQueue.length - visibleMessages.length;
    if (hiddenCount > 0) {
      const queuedCount = document.createElement('span');
      queuedCount.className = 'mc-caption-overflow';
      queuedCount.textContent = `+${hiddenCount} more messages`;
      this.captionQueueEl.appendChild(queuedCount);
    }
    this.captionQueueEl.classList.toggle('visible', this._captionQueue.length > 0);
  }

  _createCaptionLine(text, isCurrent) {
    const line = document.createElement('div');
    line.className = `mc-caption-line${isCurrent ? ' is-current' : ''}`;
    const match = text.match(/^(Ana|Leo|Maya|Sam|Noor|Kai|Iris|Ravi):\s*(.*)$/s);
    if (match) {
      const speaker = document.createElement('span');
      speaker.className = `mc-caption-speaker ${match[1].toLowerCase()}`;
      const crewIndex = CREW_CONFIG.NAMES.indexOf(match[1]);
      if (crewIndex >= 0) speaker.style.color = `#${CREW_CONFIG.SUIT_COLORS[crewIndex].toString(16).padStart(6, '0')}`;
      speaker.textContent = `${match[1]}:`;
      const message = document.createElement('span');
      message.className = 'mc-caption-message';
      message.textContent = match[2];
      line.append(speaker, message);
    } else {
      line.textContent = text;
    }
    return line;
  }

  showSystemNotice(msg, label = 'SYSTEM', durationMs = 4500) {
    this.systemNoticeLabelEl.textContent = label;
    this.systemNoticeMessageEl.textContent = String(msg ?? '');
    this.systemNoticeEl.classList.add('visible');
    clearTimeout(this._systemNoticeTimer);
    this._systemNoticeTimer = setTimeout(() => this.systemNoticeEl.classList.remove('visible'), durationMs);
  }

  showDeathScreen(survival = {}) {
    document.body.classList.add('game-paused');
    this.deathOverlayEl.classList.remove('hidden');
    const report = getDeathReport(survival.deathCause, survival.deathDetail);
    this.deathTitleEl.textContent = report.title;
    this.deathDiagnosisEl.textContent = report.diagnosis;
    this.deathScienceEl.textContent = report.science;
    this.deathProtocolEl.textContent = report.protocol;
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  }

  hideDeathScreen() {
    document.body.classList.remove('game-paused');
    this.deathOverlayEl.classList.add('hidden');
  }

  _updateDamageSource(survival) {
    const feedback = !survival.isDead && survival.damageFeedbackTime > 0
      ? getDamageFeedback(survival.damageFeedbackCause, survival.damageFeedbackDetail)
      : null;
    const text = feedback ? `${feedback.source}: ${feedback.message}` : '';
    if (text !== this._damageSourceText) {
      this._damageSourceText = text;
      this.damageSourceEl.textContent = text;
    }
    this.damageSourceEl.classList.toggle('visible', Boolean(feedback));
  }

  _updateDangerWarning(survival) {
    const threshold = SURVIVAL_CONFIG.DANGER_THRESHOLD;
    const warnings = [];
    if (survival.oxygen <= threshold) warnings.push('OXYGEN');
    if (survival.food <= threshold) warnings.push('FOOD');
    if (survival.water <= threshold) warnings.push('WATER');
    if (survival.health <= threshold) warnings.push('HEALTH');

    const text = warnings.map((resource) => `LOW ${resource}`).join(' · ');
    if (text !== this._dangerWarningText) {
      this._dangerWarningText = text;
      if (this.dangerWarningMessageEl) this.dangerWarningMessageEl.textContent = text;
    }
    const visible = Boolean(text) && !survival.isDead;
    this.dangerWarningEl?.classList.toggle('hidden', !visible);
    this.dangerWarningEl?.setAttribute('aria-hidden', String(!visible));
  }

  // Cria os 10 icones (SVG) uma unica vez; depois so troca a classe dos que mudaram
  _createIconBar(container, type, count = ICONS_PER_BAR) {
    container.innerHTML = '';
    const icons = [];
    for (let i = 0; i < count; i++) {
      const span = document.createElement('span');
      span.className = `mc-stat-icon ${type} empty`;
      span.style.setProperty('--i', String(i));
      span.setAttribute('aria-hidden', 'true');
      span.innerHTML = getStatIconSvg(type);
      container.appendChild(span);
      icons.push({ span, state: 'empty' });
    }
    return { type, icons };
  }

  triggerWaterPulse() {
    if (!this.waterBarEl) return;
    this.waterBarEl.classList.remove('is-drinking');
    void this.waterBarEl.offsetWidth;
    this.waterBarEl.classList.add('is-drinking');
  }

  _updateIconBar(bar, currentVal) {
    // Cada icone representa 2 pontos; barras menores usam a mesma escala.
    for (let i = 0; i < bar.icons.length; i++) {
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

  _updateRadiationDoseBar(mission) {
    const totalDose = mission?.totalDoseMsv ?? 0;
    const percent = Math.max(0, Math.min(100, dosePercent(totalDose)));
    this._updateIconBar(this.radiationDoseBar, percent / 5);

    const tone = doseTone(totalDose);
    if (this.radiationBarEl.dataset.tone !== tone) this.radiationBarEl.dataset.tone = tone;
    if (this.radiationBarEl.getAttribute('aria-valuenow') !== String(percent)) {
      this.radiationBarEl.setAttribute('aria-valuenow', String(percent));
      this.radiationBarEl.setAttribute('aria-valuetext', `${percent}% of the ${DOSE_LIMIT_MSV} mSv NASA career limit`);
    }
  }

  // Barra do ciclo do airlock: so reescreve o DOM quando algo muda
  _updateAirlock(airlock) {
    const view = airlockProgress(airlock?.status() ?? null);
    const cls = view ? `airlock-progress ${view.tone}` : 'airlock-progress hidden';
    if (this.airlockEl._cls !== cls) {
      this.airlockEl._cls = cls;
      this.airlockEl.className = cls;
    }
    if (!view) return;
    if (this.airlockTitleEl.textContent !== view.title) this.airlockTitleEl.textContent = view.title;
    if (this.airlockTextEl.textContent !== view.text) this.airlockTextEl.textContent = view.text;
    const width = `${Math.round(view.fill * 100)}%`;
    if (this.airlockFillEl.style.width !== width) this.airlockFillEl.style.width = width;
  }

  triggerSuitSequence(mode = 'equip') {
    this._suitSeq = {
      mode,
      startMs: performance.now(),
      durationMs: mode === 'equip' ? 1150 : 850,
    };
  }

  _updateSuitHud(survival, airlock, isRoverActive, isScopeOpen) {
    if (this.evaVisorEl) {
      const visorVisible = Boolean(survival?.suitEquipped) && !isRoverActive && !isScopeOpen;
      const sealing = Boolean(this._suitSeq && this._suitSeq.mode === 'equip');
      const visorCls = visorVisible
        ? `eva-visor-frame${sealing ? ' is-sealing' : ''}`
        : 'eva-visor-frame hidden';
      if (this.evaVisorEl._cls !== visorCls) {
        this.evaVisorEl._cls = visorCls;
        this.evaVisorEl.className = visorCls;
      }
    }

    if (!this.suitEquipEl) return;
    if (!this._suitSeq || airlock?.pending) {
      if (this._suitSeq && airlock?.pending) this._suitSeq = null;
      if (!this.suitEquipEl.classList.contains('hidden')) this.suitEquipEl.className = 'suit-equip-hud hidden';
      return;
    }

    const elapsed = performance.now() - this._suitSeq.startMs;
    const progress = Math.min(1, elapsed / this._suitSeq.durationMs);
    if (progress >= 1) {
      this._suitSeq = null;
      this.suitEquipEl.className = 'suit-equip-hud hidden';
      return;
    }

    const isDock = this._suitSeq.mode === 'dock';
    const cls = isDock ? 'suit-equip-hud dock' : 'suit-equip-hud';
    if (this.suitEquipEl._cls !== cls) {
      this.suitEquipEl._cls = cls;
      this.suitEquipEl.className = cls;
    }
    const title = isDock ? 'DOCKING EVA SUIT' : 'EQUIPPING EVA SUIT';
    if (this.suitEquipTitleEl.textContent !== title) this.suitEquipTitleEl.textContent = title;

    let stepText;
    if (isDock) {
      stepText = progress < 0.5 ? 'RELEASING HELMET SEAL' : 'LOCKING SUIT IN BAY';
    } else if (progress < 0.35) {
      stepText = 'UNLATCHING SUITPORT';
    } else if (progress < 0.72) {
      stepText = 'SEALING HELMET & GLOVES';
    } else {
      stepText = 'O2 & THERMAL CHECK OK';
    }
    if (this.suitEquipTextEl.textContent !== stepText) this.suitEquipTextEl.textContent = stepText;
    const width = `${Math.round(progress * 100)}%`;
    if (this.suitEquipFillEl.style.width !== width) this.suitEquipFillEl.style.width = width;
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

  update({ player, survival, sky, camera, isScopeOpen = false, isRoverActive = false, roverTelemetry = null, mission, airlock = null, outsideTempC = -60, suitUpgraded = false, dirtySuit = false }) {
    this._lastSuitContext = {
      survival,
      outsideTempC,
      batteryPercent: mission?.battery?.percent ?? 100,
      suitUpgraded,
      dirtySuit,
      airlockPressurized: airlock?.pressurized ?? true,
      airlockDoorOpen: Boolean(airlock?.doors?.[1]?.openness > 0),
    };
    if (survival.suitEquipped && !survival.insidePressurizedShip) {
      if (survival.suitOxygen <= SURVIVAL_CONFIG.SUIT_OXYGEN_WARN_THRESHOLD && !survival.suitO2Warned30) {
        survival.suitO2Warned30 = true;
        this.showSystemNotice('SUIT O2 AT 30%: Return to Base Airlock to recharge.', 'SUIT O2', 6500);
      }
      if (survival.suitIntegrity <= 0 && !survival.suitWornWarned) {
        survival.suitWornWarned = true;
        this.showSystemNotice('EVA SUIT WORN OUT: Seal breached! Losing personal O2. Return to Suitport.', 'SUIT WEAR', 6500);
      }
    }
    this._updateDamageSource(survival);
    this.dangerVignetteEl?.classList.toggle('hidden', !survival.isInDanger || survival.isDead);
    this._updateDangerWarning(survival);
    if (survival.isDead) {
      this.showDeathScreen(survival);
      return;
    }

    const damageIntensity = Math.max(0, Math.min(1, (survival.maxStat * 0.7 - survival.health) / (survival.maxStat * 0.7)));
    if (this.damageOverlayEl) {
      this.damageOverlayEl.classList.toggle('hidden', damageIntensity <= 0);
      this.damageOverlayEl.style.setProperty('--damage-strength', damageIntensity.toFixed(2));
      this.damageOverlayEl.classList.toggle('critical', damageIntensity >= 0.55);
    }
    if (this.breachOverlayEl) {
      const breachVisible = survival.baseBreached && survival.insidePressurizedShip && !isRoverActive;
      this.breachOverlayEl.classList.toggle('hidden', !breachVisible);
      this.breachOverlayEl.style.setProperty('--breach-strength', String(0.18 + 0.38 * (1 - survival.baseOxygen / 100)));
    }
    if (this.gameContainerEl) this.gameContainerEl.classList.toggle('damage-shake', damageIntensity >= 0.55);

    if (isRoverActive && roverTelemetry) {
      if (this.roverSpeedEl) this.roverSpeedEl.textContent = `Speed: ${roverTelemetry.speedKmh} km/h`;
      if (this.roverHeadingEl) this.roverHeadingEl.textContent = `Heading: ${roverTelemetry.headingDeg}° ${roverTelemetry.headingCard}`;
      if (this.roverCoordsEl) this.roverCoordsEl.textContent = `Rover: X ${roverTelemetry.x} / Y ${roverTelemetry.y} / Z ${roverTelemetry.z}`;
      if (this.roverBatteryEl) this.roverBatteryEl.textContent = roverBatteryText(roverTelemetry);
      if (this.roverIceEl) this.roverIceEl.textContent = `Ice cargo: ${roverTelemetry.iceCargo} / ${roverTelemetry.maxIceCargo} kg`;

      if (this.roverBucketEl && this.roverBucketFillEl) {
        const ratio = roverTelemetry.waterFillRatio ?? (
          roverTelemetry.maxIceCargo > 0 ? roverTelemetry.iceCargo / roverTelemetry.maxIceCargo : 0
        );
        const pct = Math.max(0, Math.min(100, Math.round(ratio * 100)));
        this.roverBucketFillEl.style.height = `${pct}%`;
        this.roverBucketEl.setAttribute('aria-valuenow', String(pct));
        this.roverBucketEl.classList.toggle('is-filling', Boolean(roverTelemetry.isDrilling));
        this.roverBucketEl.classList.toggle('is-unloading', Boolean(roverTelemetry.isUnloading));
        this.roverBucketEl.classList.toggle('is-full', pct >= 100);
      }

      const dx = WATER_SYSTEM_CONFIG.ICE_CRATER_CENTER.x - Number(roverTelemetry.x);
      const dz = WATER_SYSTEM_CONFIG.ICE_CRATER_CENTER.z - Number(roverTelemetry.z);
      const distance = Math.hypot(dx, dz);
      // Keep the destination on the map edge when it is outside its local range.
      const scale = distance > 0 ? Math.min(1 / 40, 0.42 / distance) : 0;
      if (this.roverGpsIceEl) {
        this.roverGpsIceEl.style.left = `${50 + dx * scale * 100}%`;
        this.roverGpsIceEl.style.top = `${50 + dz * scale * 100}%`;
      }
      if (this.roverGpsPlayerEl) this.roverGpsPlayerEl.style.transform = `translate(-50%, -50%) rotate(${roverTelemetry.headingDeg}deg)`;
      if (this.roverGpsDistanceEl) this.roverGpsDistanceEl.textContent = `ICE ${Math.round(distance)} blocks`;

      // Banner de acao contextual do Rover (Perfurar ou Descarregar)
      if (this.roverActionBannerEl && this.roverActionTextEl) {
        if (roverTelemetry.canUnloadIce) {
          this.roverActionTextEl.textContent = 'Unload ice';
          this.roverActionBannerEl.classList.remove('hidden');
        } else if (roverTelemetry.canCollectIce) {
          const isFull = roverTelemetry.iceCargo >= roverTelemetry.maxIceCargo;
          this.roverActionTextEl.textContent = isFull
            ? 'Ice hold full'
            : roverTelemetry.lowBattery ? 'Battery low: charge at the base' : 'Collect ice';
          this.roverActionBannerEl.classList.remove('hidden');
        } else {
          this.roverActionBannerEl.classList.add('hidden');
        }
      }
    } else if (this.roverActionBannerEl) {
      this.roverActionBannerEl.classList.add('hidden');
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

    const envKey = `${survival.insidePressurizedShip}:${Boolean(survival.oxygenNeedsPower)}:${Boolean(survival.baseBreached)}:${survival.oxygenShortage ?? ''}`;
    if (envKey !== this._lastInsideShip) {
      this._lastInsideShip = envKey;
      if (survival.insidePressurizedShip && survival.baseBreached) {
        this.envStatusEl.textContent = 'Environment: Habitat breach (oxygen leaking)';
        this.envStatusEl.style.color = '#ff5555';
      } else if (survival.insidePressurizedShip && survival.oxygenNeedsPower && survival.oxygenShortage === 'water') {
        // Issue #102: no modo "Air from water" o tanque vazio tambem para o ar
        this.envStatusEl.textContent = 'Environment: Pressurized Habitat (WATER TANK EMPTY: no water to make oxygen)';
        this.envStatusEl.style.color = '#ff5555';
      } else if (survival.insidePressurizedShip && survival.oxygenNeedsPower) {
        this.envStatusEl.textContent = 'Environment: Pressurized Habitat (NO POWER: oxygen is not refilling)';
        this.envStatusEl.style.color = '#ff5555';
      } else if (survival.insidePressurizedShip) {
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
    this._updateRadiationDoseBar(mission);
    this._updateIconBar(oxygenBar, survival.oxygen);
    const suitEquipped = Boolean(survival.suitEquipped);
    const integrityPct = Math.max(0, Math.min(100, Math.ceil(survival.suitIntegrity ?? 100)));
    this.suitIntegrityRowEl.hidden = !suitEquipped;
    this._updateIconBar(this.suitIntegrityBar, suitEquipped ? integrityPct / 5 : 0);
    this.suitIntegrityEl.title = suitEquipped ? `Suit integrity: ${integrityPct}%` : 'EVA suit docked';
    this.suitIntegrityEl.classList.toggle('low', suitEquipped && integrityPct <= 25);
    if (suitEquipped) {
      this.suitIntegrityEl.setAttribute('role', 'meter');
      this.suitIntegrityEl.setAttribute('aria-valuenow', String(integrityPct));
      this.suitIntegrityEl.setAttribute('aria-valuetext', `${integrityPct}% suit integrity`);
      this.suitIntegrityEl.setAttribute('aria-label', 'Suit integrity');
    } else {
      this.suitIntegrityEl.setAttribute('role', 'status');
      this.suitIntegrityEl.setAttribute('aria-label', 'EVA suit docked');
      this.suitIntegrityEl.removeAttribute('aria-valuenow');
      this.suitIntegrityEl.removeAttribute('aria-valuetext');
    }
    this._updateIconBar(waterBar, survival.water);
    this._updateIconBar(foodBar, survival.food);
    this._updateAirlock(airlock);
    this._updateSuitHud(survival, airlock, isRoverActive, isScopeOpen);

    // Os nomes no céu só aparecem com a luneta aberta, como parte do modo telescópio.
    if (!isScopeOpen) {
      this._setLabelVisible(this.earthLabel, false);
      this._setLabelVisible(this.phobosLabel, false);
      this._setLabelVisible(this.deimosLabel, false);
      return;
    }

    const earthPos = sky.getEarthWorldPosition(this._earthPos);
    const phobosPos = sky.getPhobosWorldPosition(this._phobosPos);
    const deimosPos = sky.getDeimosWorldPosition(this._deimosPos);
    const camDir = player.getLookDirection(this._camDir);

    this._projectLabel(this.earthLabel, earthPos, camera, camDir);
    this._projectLabel(this.phobosLabel, phobosPos, camera, camDir);
    this._projectLabel(this.deimosLabel, deimosPos, camera, camDir);
  }
}
