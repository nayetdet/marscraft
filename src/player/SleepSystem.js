import { SLEEP_CONFIG } from '../config/constants.js';
import { requestRawPointerLock } from './mouseLook.js';

export class SleepSystem {
  constructor(engine) {
    this.engine = engine;
    this.isSleeping = false;
    this.isWakeSummaryOpen = false;
    this.targetHours = 0;
    this.elapsedHours = 0;
    this.interrupted = false;
    this.interruptReason = null;
    this.lastSleepSkyHours = 0;
    this.hasSeenNasaFact = false;
    this.initialStats = null;
    this.wakeReport = null;

    this._dom = {
      overlay: null,
      animView: null,
      summaryCard: null,
      statusText: null,
      clockDisplay: null,
      progressFill: null,
      summaryTitle: null,
      summaryTime: null,
      interruptAlert: null,
      statHours: null,
      statFood: null,
      statWater: null,
      statBattery: null,
      statFatigue: null,
      nasaFact: null,
      nasaFactText: null,
      wakeBtn: null,
    };

    if (typeof document !== 'undefined') {
      this._bindDom();
    }
  }

  _bindDom() {
    this._dom.overlay = document.getElementById('sleep-overlay');
    this._dom.animView = document.getElementById('sleep-animation-view');
    this._dom.summaryCard = document.getElementById('sleep-summary-card');
    this._dom.statusText = document.getElementById('sleep-status-text');
    this._dom.clockDisplay = document.getElementById('sleep-clock-display');
    this._dom.progressFill = document.getElementById('sleep-progress-fill');
    this._dom.summaryTitle = document.getElementById('sleep-summary-title');
    this._dom.summaryTime = document.getElementById('sleep-summary-time');
    this._dom.interruptAlert = document.getElementById('sleep-interrupt-alert');
    this._dom.statHours = document.getElementById('sleep-stat-hours');
    this._dom.statFood = document.getElementById('sleep-stat-food');
    this._dom.statWater = document.getElementById('sleep-stat-water');
    this._dom.statBattery = document.getElementById('sleep-stat-battery');
    this._dom.statFatigue = document.getElementById('sleep-stat-fatigue');
    this._dom.nasaFact = document.getElementById('sleep-nasa-fact');
    this._dom.nasaFactText = document.getElementById('sleep-nasa-fact-text');
    this._dom.wakeBtn = document.getElementById('sleep-wake-btn');

    this._dom.wakeBtn?.addEventListener('click', () => this.closeWakeSummary());

    window.addEventListener('keydown', (e) => {
      if (this.isWakeSummaryOpen) {
        if (e.code === 'KeyF' || e.code === 'Escape' || e.code === 'Space') {
          e.preventDefault();
          this.closeWakeSummary();
        }
      }
    });
  }

  canSleep() {
    const survival = this.engine?.survival;
    if (!survival) return { allowed: true };

    const isInside = survival.insidePressurizedShip;
    if (!isInside) {
      return {
        allowed: false,
        reason: 'Habitat unpressurized: suit life support cannot sustain long sleep.',
      };
    }

    const isBreached = survival.baseBreached || (this.engine.world?.brokenBaseWindows?.size ?? 0) > 0;
    if (isBreached) {
      return {
        allowed: false,
        reason: 'Cannot sleep during a hull breach! Seal the habitat first.',
      };
    }

    if (this.engine.mission?.storm?.phase === 'active') {
      return {
        allowed: false,
        reason: 'Cannot sleep during an active solar storm! Seek shelter.',
      };
    }

    if (this.engine.mission?.battery?.level <= 0) {
      return {
        allowed: false,
        reason: 'Life support power offline: habitat temperature dropping. Cannot sleep safely.',
      };
    }

    return { allowed: true };
  }

  getHoursUntilSunrise() {
    const time = this.engine?.sky?.timeOfDay ?? 0;
    const diff = (SLEEP_CONFIG.SUNRISE_HOUR - time + 24) % 24;
    return Number((diff <= 0.05 ? 24 : diff).toFixed(1));
  }

  getHoursAwake() {
    const currentHours = this.engine?._skyHours?.() ?? 0;
    return Math.max(0, currentHours - this.lastSleepSkyHours);
  }

  get isFatigued() {
    return this.getHoursAwake() >= SLEEP_CONFIG.FATIGUE_MAX_HOURS;
  }

  getWorkSpeedMultiplier() {
    return this.isFatigued ? SLEEP_CONFIG.FATIGUE_SPEED_PENALTY : 1.0;
  }

  startSleep(hours) {
    const check = this.canSleep();
    if (!check.allowed) {
      this.engine?.hud?.showToast(check.reason, 4500);
      return false;
    }

    const survival = this.engine.survival;
    const mission = this.engine.mission;
    const sky = this.engine.sky;

    this.initialStats = {
      food: survival?.food ?? 20,
      water: survival?.water ?? 20,
      battery: mission?.battery?.level ?? 100,
      sol: sky?.solCount ?? 1,
      timeOfDay: sky?.timeOfDay ?? 0,
      skyHours: this.engine._skyHours?.() ?? 0,
    };

    this.targetHours = Math.max(0.5, hours);
    this.elapsedHours = 0;
    this.isSleeping = true;
    this.interrupted = false;
    this.interruptReason = null;

    if (this.engine.stationPanel?.isOpen) {
      this.engine.stationPanel.close();
    }

    if (typeof document !== 'undefined' && document.pointerLockElement) {
      document.exitPointerLock();
    }

    if (this._dom.overlay) {
      this._dom.overlay.classList.remove('hidden');
      this._dom.animView?.classList.remove('hidden');
      this._dom.summaryCard?.classList.add('hidden');
      if (this._dom.statusText) {
        this._dom.statusText.textContent = hours >= 6 ? 'Sleeping until sunrise...' : 'Taking a nap...';
      }
      if (this._dom.progressFill) {
        this._dom.progressFill.style.width = '0%';
      }
      this._updateClockDisplay();
    }

    return true;
  }

  _updateClockDisplay() {
    if (!this._dom.clockDisplay || !this.engine?.sky) return;
    const formatted = this.engine.sky.getFormattedTime();
    this._dom.clockDisplay.textContent = formatted?.clockText ?? `Sol ${this.engine.sky.solCount}`;
  }

  update(dt) {
    if (!this.isSleeping) return;

    const rate = this.targetHours / SLEEP_CONFIG.ANIMATION_DURATION_SEC;
    let stepRemaining = Math.min(rate * dt, this.targetHours - this.elapsedHours);

    while (stepRemaining > 1e-6) {
      const subStep = Math.min(stepRemaining, SLEEP_CONFIG.STEP_HOURS);
      stepRemaining -= subStep;
      this.elapsedHours += subStep;

      // 1. Advance sky clock
      this.engine.sky?.advanceTime(subStep);

      // 2. Advance mission (battery, solar charging, storms, radiation)
      const skyHours = this.engine._skyHours?.() ?? 0;
      this.engine.mission?.update(skyHours, {
        insideHabitat: true,
        insideShield: true,
        insideShelter: true,
        active: true,
      });

      // 3. Advance crew & utility
      if (this.engine.crew) {
        this.engine.crew.update(subStep, performance.now() / 1000);
      }
      this.engine.utility?.update(subStep);

      // 4. Advance base station systems (game hours -> real simulation seconds, with sleep metabolic reduction)
      const speed = this.engine.sky?.autoAdvanceSpeed ?? 0.01;
      const stationDt = (subStep / speed) * 0.5;
      this.engine.stations?.update(stationDt, true, this.engine.survival, false);

      // 5. Drain player food and water
      const survival = this.engine.survival;
      if (survival) {
        survival.food = Math.max(0, survival.food - SLEEP_CONFIG.FOOD_DRAIN_PER_HOUR * subStep);
        survival.water = Math.max(0, survival.water - SLEEP_CONFIG.WATER_DRAIN_PER_HOUR * subStep);
        if (survival.food <= 0) {
          survival.takeDamage?.(0.5 * subStep, 'STARVATION', 'food-shortage');
        }
        if (survival.water <= 0) {
          survival.takeDamage?.(0.8 * subStep, 'DEHYDRATION', 'water-shortage');
        }
      }

      // 6. Interrupt checks
      const interrupt = this._checkInterrupts();
      if (interrupt) {
        this.interrupted = true;
        this.interruptReason = interrupt;
        this.finishSleep();
        return;
      }
    }

    if (this._dom.progressFill) {
      const pct = Math.min(100, Math.round((this.elapsedHours / this.targetHours) * 100));
      this._dom.progressFill.style.width = `${pct}%`;
    }
    this._updateClockDisplay();

    if (this.elapsedHours >= this.targetHours) {
      this.finishSleep();
    }
  }

  _checkInterrupts() {
    const mission = this.engine.mission;
    if (mission?.storm?.phase === 'warning') {
      return 'Solar storm warning detected! A coronal mass ejection is heading for Mars.';
    }

    if (mission?.battery?.level <= 0) {
      return 'Base power alert! Battery depleted and life support is offline.';
    }

    if (this.engine.stations?.co2 >= 80) {
      return 'Life support alert! High CO2 in habitat — replace filter at ECLSS.';
    }

    const survival = this.engine.survival;
    if (survival?.baseBreached || (this.engine.world?.brokenBaseWindows?.size ?? 0) > 0) {
      return 'Hull decompression alarm! Base pressure dropping rapidly.';
    }

    if (survival && survival.health <= 5) {
      return 'Medical emergency! Critical health depletion.';
    }

    return null;
  }

  finishSleep() {
    this.isSleeping = false;

    // A rest of 1.5+ hours clears fatigue
    if (this.elapsedHours >= 1.5) {
      this.lastSleepSkyHours = this.engine._skyHours?.() ?? 0;
    }

    const survival = this.engine.survival;
    const mission = this.engine.mission;
    const sky = this.engine.sky;

    const foodSpent = Number(Math.max(0, (this.initialStats?.food ?? 20) - (survival?.food ?? 20)).toFixed(1));
    const waterSpent = Number(Math.max(0, (this.initialStats?.water ?? 20) - (survival?.water ?? 20)).toFixed(1));
    const batteryLevel = Math.round(mission?.battery?.level ?? 0);

    const clockText = sky?.getFormattedTime?.()?.clockText ?? `Sol ${sky?.solCount ?? 1}`;

    this.wakeReport = {
      elapsedHours: Number(this.elapsedHours.toFixed(1)),
      interrupted: this.interrupted,
      interruptReason: this.interruptReason,
      foodSpent,
      waterSpent,
      batteryLevel,
      clockText,
      isFatigued: this.isFatigued,
    };

    this._showWakeSummary();
  }

  _showWakeSummary() {
    this.isWakeSummaryOpen = true;

    if (!this._dom.overlay) return;

    this._dom.animView?.classList.add('hidden');
    this._dom.summaryCard?.classList.remove('hidden');

    if (this._dom.summaryTitle) {
      this._dom.summaryTitle.textContent = this.interrupted ? 'SLEEP INTERRUPTED' : 'AWAKE';
      this._dom.summaryTitle.classList.toggle('interrupted', this.interrupted);
    }

    if (this._dom.summaryTime) {
      this._dom.summaryTime.textContent = this.wakeReport.clockText;
    }

    if (this._dom.interruptAlert) {
      if (this.interrupted && this.interruptReason) {
        this._dom.interruptAlert.textContent = `⚠ ${this.interruptReason}`;
        this._dom.interruptAlert.classList.remove('hidden');
      } else {
        this._dom.interruptAlert.classList.add('hidden');
      }
    }

    if (this._dom.statHours) {
      this._dom.statHours.textContent = `${this.wakeReport.elapsedHours} h ${this.interrupted ? '(interrupted)' : ''}`;
    }
    if (this._dom.statFood) {
      this._dom.statFood.textContent = `-${this.wakeReport.foodSpent}`;
    }
    if (this._dom.statWater) {
      this._dom.statWater.textContent = `-${this.wakeReport.waterSpent}`;
    }
    if (this._dom.statBattery) {
      this._dom.statBattery.textContent = `${this.wakeReport.batteryLevel}%`;
    }
    if (this._dom.statFatigue) {
      this._dom.statFatigue.textContent = this.isFatigued ? 'Fatigued (>24h awake)' : 'Well-rested';
      this._dom.statFatigue.className = this.isFatigued ? 'sleep-fatigued' : 'sleep-rested';
    }

    // Show NASA Sleep Study fact on first sleep
    if (!this.hasSeenNasaFact || this.wakeReport.elapsedHours >= 6) {
      this.hasSeenNasaFact = true;
      if (this._dom.nasaFact && this._dom.nasaFactText) {
        this._dom.nasaFactText.textContent = `${SLEEP_CONFIG.NASA_STUDY.text} [${SLEEP_CONFIG.NASA_STUDY.source}]`;
        this._dom.nasaFact.classList.remove('hidden');
      }
    } else if (this._dom.nasaFact) {
      this._dom.nasaFact.classList.add('hidden');
    }
  }

  closeWakeSummary() {
    this.isWakeSummaryOpen = false;

    if (this._dom.overlay) {
      this._dom.overlay.classList.add('hidden');
      this._dom.summaryCard?.classList.add('hidden');
    }

    if (!this.engine.input?.isTouchMode) {
      requestRawPointerLock(this.engine.renderer?.domElement);
    }

    const toastMsg = this.interrupted
      ? 'Interrupted! Address base emergency.'
      : this.isFatigued
        ? 'Still fatigued — need more rest.'
        : 'Rested and ready for Mars EVA.';
    this.engine?.hud?.showToast(toastMsg, 3500);
  }
}
