import { BLOCK_IDS } from '../config/blockTypes.js';
import { greenhouseMapSvg, plotMapLabel, plotStatus } from './greenhouseMap.js';
import { COMMS_CONFIG, CROP_CONFIG, RADIATION_CONFIG, STATION_CONFIG as C, UTILITY_CONFIG as U } from '../config/constants.js';
import { shelterDoseFactor } from '../mission/radiation.js';
import { formatDateDMY, formatDose, formatHours, radiationStatusText, stormStatusText } from '../mission/missionText.js';
import { requestRawPointerLock } from '../player/mouseLook.js';
import donkiCme from '../data/donkiCme.json';
import plantResearch from '../data/osdrPlants.json';
import { plantDiscovery } from '../data/plantDiscoveries.js';
import { createCropTexture } from '../graphics/cropTextures.js';
import { GymWorkout } from './gymWorkout.js';
import { MEDBAY_BONE_TEXT } from './stationText.js';

const DATA_SOURCES = {
  donki: 'https://ccmc.gsfc.nasa.gov/tools/DONKI/',
  radlab: 'https://visualization.osdr.nasa.gov/radlab/',
};

const SHELTER_SOURCES = {
  prediccs: 'https://posters.unh.edu/private_media/4209/',
  nasa: 'https://ntrs.nasa.gov/citations/20210009760',
};

const GH_ICONS = {
  water: '<svg class="gh-mini-icon water" viewBox="0 0 8 8" shape-rendering="crispEdges"><path fill="currentColor" d="M3 0h2v1h1v1h1v1h1v3H7v1H6v1H2V7H1V6H0V3h1V2h1V1h1Z"/></svg>',
  power: '<svg class="gh-mini-icon power" viewBox="0 0 8 8" shape-rendering="crispEdges"><path fill="currentColor" d="M4 0h3v1H6v2h2v1H7v1H6v1H5v1H4v1H3V6h1V5H1V4h1V3h1V2h1Z"/></svg>',
  food: '<svg class="gh-mini-icon food" viewBox="0 0 8 8" shape-rendering="crispEdges"><path fill="currentColor" d="M1 0h3v1h1v1h1v2H5v2H4v1H2V5H1V3H0V1h1Z M6 5h2v3H6Z"/></svg>',
  sprout: '<svg class="gh-mini-icon sprout" viewBox="0 0 8 8" shape-rendering="crispEdges"><path fill="currentColor" d="M1 1h2v1h1v2H2V3H1ZM5 0h2v2H6v1H4V1h1ZM3 4h2v3H3ZM1 7h6v1H1Z"/></svg>',
};

export class StationPanel {
  constructor(engine) {
    this.engine = engine;
    this.element = document.getElementById('station-overlay');
    this.title = document.getElementById('station-title');
    this.content = document.getElementById('station-content');
    this.gymContainer = document.getElementById('gym-interactive');
    this.greenhouseContainer = document.getElementById('greenhouse-monitor');
    this.actions = document.getElementById('station-actions');
    this.sources = document.getElementById('station-sources');
    this.feedback = document.getElementById('station-feedback');
    this.isOpen = false;
    this.cropIcons = Object.fromEntries(
      Object.keys(CROP_CONFIG).map(type => [type, createCropTexture(type).dataUrl])
    );

    this.gymMode = 'treadmill';
    this.workoutProgress = 0;
    this.workout = new GymWorkout(this.gymMode);
    this.stridePhase = 0;
    this.bpm = 74;
    this.rhythmPos = 50;
    this.rhythmDir = 1;
    this.lastHitText = 'Press [SPACE], [A]/[D], or click the workout controls below!';
    this.lastHitQuality = 'ready';
    this._gymRaf = null;
    this._lastGymTick = 0;
    this._ghRaf = null;
    this._lastGhTick = 0;
    this.selectedCrop = 'lettuce';
    this.ghNotice = '';
    this._ghDrag = null;
    this._ghGhost = null;
    this._suppressGhClick = false;
    this._onGhPointerMove = this._onGhPointerMove.bind(this);
    this._onGhPointerUp = this._onGhPointerUp.bind(this);

    document.getElementById('station-close').addEventListener('click', () => this.close());
    const handleActionClick = event => {
      if (this._suppressGhClick) {
        this._suppressGhClick = false;
        return;
      }
      const target = event.target.closest('[data-action]');
      const action = target?.dataset.action;
      if (action && !target.hasAttribute('disabled')) {
        const msg = this.perform(action);
        this.feedback.textContent = this.type === 'greenhouse' ? '' : msg;
        if (this.type === 'greenhouse') {
          if (action === 'harvest' || action === 'harvestAll' || msg === 'harvested') {
            this._playGymSound(520, 0.09, 680);
          } else if (action.startsWith('seed:')) {
            this._playGymSound(460, 0.04);
          } else if (msg === 'failed') {
            this._playGymSound(220, 0.08);
          } else if (action.startsWith('plot:') && msg) {
            this._playGymSound(420, 0.09, 540);
          }
        }
        this.render();
      }
    };
    this.actions.addEventListener('click', handleActionClick);
    if (this.greenhouseContainer) {
      this.greenhouseContainer.addEventListener('click', handleActionClick);
      this.greenhouseContainer.addEventListener('pointerdown', event => {
        if (event.button > 0) return;
        const seedBtn = event.target.closest('[data-action^="seed:"]');
        if (!seedBtn) return;
        this._startGhDrag(seedBtn.dataset.action.slice(5), event);
      });
      this.greenhouseContainer.addEventListener('keydown', event => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        const target = event.target.closest('[data-action]');
        if (target) {
          event.preventDefault();
          handleActionClick({ target });
        }
      });
    }

    if (this.gymContainer) {
      this.gymContainer.addEventListener('click', event => {
        const modeBtn = event.target.closest('[data-gym-mode]');
        if (modeBtn) {
          this.gymMode = modeBtn.dataset.gymMode;
          this.workoutProgress = 0;
          this.workout = new GymWorkout(this.gymMode);
          this.rhythmPos = 20;
          this.bpm = 76;
          this.lastHitText = this.gymMode === 'bike' ? 'Alternate left and right.' : 'Step in the green zone.';
          this.lastHitQuality = 'ready';
          this.render();
          return;
        }
        const stepBtn = event.target.closest('[data-gym-step]');
        if (stepBtn) {
          this._doGymStep(stepBtn.dataset.gymStep);
        }
      });
    }

    window.addEventListener('keydown', e => {
      if (!this.isOpen) return;
      if (e.code === 'Escape') {
        e.preventDefault();
        this.close();
        return;
      }
      if (this._isGymStation() && !e.repeat) {
        if (this.gymMode === 'treadmill' && e.code === 'Space') {
          e.preventDefault(); this._doGymStep('step');
        } else if (this.gymMode === 'bike' && ['KeyA', 'KeyD', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
          e.preventDefault(); this._doGymStep(['KeyA', 'ArrowLeft'].includes(e.code) ? 'left' : 'right');
        }
      }
    });
  }

  _isGymStation() {
    return ['treadmill', 'bike'].includes(this.type);
  }

  _isGreenhouseStation() {
    return this.type === 'greenhouse';
  }

  open(type) {
    this.type = type;
    this.isOpen = true;
    this.feedback.textContent = '';
    this.ghNotice = '';
    if (type === 'treadmill' || type === 'bike') {
      this.gymMode = type;
    }
    this.workoutProgress = 0;
    this.workout = new GymWorkout(this.gymMode);
    this.stridePhase = 0;
    this.bpm = 74;
    this.rhythmPos = 20;
    this.rhythmDir = 1;
    this.lastHitQuality = 'ready';
    this.lastHitText = this.gymMode === 'bike' ? 'Alternate left and right.' : 'Step in the green zone.';
    this.render();
    this.element.classList.remove('hidden');
    if (this.engine.input?.isTouchMode) this.engine.input.keys = {};
    if (this._isGymStation()) this._startGymLoop();
    if (this._isGreenhouseStation()) this._startGreenhouseLoop();
    if (document.pointerLockElement) document.exitPointerLock();
  }

  close() {
    this.isOpen = false;
    this._cancelGhDrag();
    this._stopGymLoop();
    this._stopGreenhouseLoop();
    this.element.classList.add('hidden');
    if (!this.engine.input?.isTouchMode) requestRawPointerLock(this.engine.renderer.domElement);
  }

  _startGreenhouseLoop() {
    this._stopGreenhouseLoop();
    this._lastGhTick = performance.now();
    const tick = (now) => {
      if (!this.isOpen || !this._isGreenhouseStation()) return;
      const dt = Math.min(0.05, (now - this._lastGhTick) / 1000);
      this._lastGhTick = now;

      const { expedition: m, stations: s, survival, utility } = this.engine;
      if (s.hasGrowingCrops()) {
        const lit = utility.greenhouseLightsOn && !utility.cold;
        const poweredBefore = m.greenhousePowered;
        m.greenhousePowered = lit && m.spend(utility.greenhouseLightsCost(dt));
        const readyBefore = s.readyPlotCount();
        const thirstyBefore = s.cropsThirsty;
        if (m.greenhousePowered && !s.contaminated) s.growCrops(dt, survival);
        else s.cropsThirsty = false;
        this.engine.updateCropVisuals?.();
        if (s.cropsThirsty !== thirstyBefore || m.greenhousePowered !== poweredBefore) {
          this.render();
        } else if (s.readyPlotCount() !== readyBefore) {
          this._playGymSound(440, 0.14, 660);
          this.render();
        } else {
          this._refreshGreenhouseProgress();
        }
      }

      this._ghRaf = requestAnimationFrame(tick);
    };
    this._ghRaf = requestAnimationFrame(tick);
  }

  // Atualiza so os numeros que mudam a cada instante, sem redesenhar o painel (nao atrapalha o clique)
  _refreshGreenhouseProgress() {
    const { expedition: m, stations: s, survival } = this.engine;
    const root = this.greenhouseContainer;
    if (!root) return;
    const waterEl = root.querySelector('#gh-res-water');
    if (waterEl) waterEl.textContent = `${Math.floor(survival.baseWater)} L`;
    const powerEl = root.querySelector('#gh-res-power');
    if (powerEl) powerEl.textContent = `${Math.round(m.energy)}%`;
    s.plots.forEach((plot, i) => {
      if (!plot.crop) return;
      const label = root.querySelector(`[data-plot-pct="${i}"]`);
      if (label) label.textContent = plotMapLabel(plot);
    });
    const activePlot = s.plots[s.selectedPlot];
    if (activePlot?.crop) {
      const noticeEl = root.querySelector('#gh-notice');
      const status = plotStatus(activePlot);
      if (noticeEl && noticeEl.dataset.kind === 'growing') {
        noticeEl.textContent = `${activePlot.crop.type.toUpperCase()} · ${status.label}`;
      }
    }
  }

  _harvestPlot(plotIndex) {
    const { stations, survival } = this.engine;
    const message = stations.harvest(survival, (id, i) => {
      const position = this.engine.stationCrop.position.clone();
      position.x += (i % 2) * 0.5;
      position.z += Math.floor(i / 2) * 0.5;
      this.engine.world.spawnCropDrop(position, id);
    }, plotIndex);
    this.engine.updateCropVisuals?.();
    return message;
  }

  _stopGreenhouseLoop() {
    if (this._ghRaf) {
      cancelAnimationFrame(this._ghRaf);
      this._ghRaf = null;
    }
  }

  _startGhDrag(cropType, event) {
    this._cancelGhDrag();
    if (!Object.hasOwn(CROP_CONFIG, cropType)) return;
    this._ghDrag = {
      cropType,
      startX: event.clientX,
      startY: event.clientY,
      active: false,
      hoveredPlotEl: null,
    };
    window.addEventListener('pointermove', this._onGhPointerMove);
    window.addEventListener('pointerup', this._onGhPointerUp);
    window.addEventListener('pointercancel', this._onGhPointerUp);
  }

  _plotElAt(clientX, clientY) {
    const stack = document.elementsFromPoint(clientX, clientY);
    for (const el of stack) {
      const plotEl = el.closest?.('[data-action^="plot:"]');
      if (plotEl && this.greenhouseContainer?.contains(plotEl)) return plotEl;
    }
    return null;
  }

  _clearGhHover() {
    const prev = this._ghDrag?.hoveredPlotEl;
    if (prev) {
      prev.classList.remove('is-drop-ok', 'is-drop-bad');
      this._ghDrag.hoveredPlotEl = null;
    }
  }

  _onGhPointerMove(event) {
    const d = this._ghDrag;
    if (!d || !this.isOpen || !this._isGreenhouseStation()) {
      this._cancelGhDrag();
      return;
    }
    if (!d.active) {
      if (Math.hypot(event.clientX - d.startX, event.clientY - d.startY) < 6) return;
      d.active = true;
      this.selectedCrop = d.cropType;
      this.ghNotice = '';
      this.greenhouseContainer?.querySelectorAll('[data-action^="seed:"]').forEach((btn) => {
        const active = btn.dataset.action === `seed:${d.cropType}`;
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-pressed', String(active));
      });
      const ghost = document.createElement('div');
      ghost.className = 'gh-drag-ghost';
      ghost.innerHTML = `<img src="${this.cropIcons[d.cropType]}" alt="" /><span class="gh-drag-tag"></span>`;
      document.body.appendChild(ghost);
      this._ghGhost = ghost;
    }

    this._ghGhost.style.left = `${event.clientX}px`;
    this._ghGhost.style.top = `${event.clientY}px`;
    const tagEl = this._ghGhost.querySelector('.gh-drag-tag');
    const plotEl = this._plotElAt(event.clientX, event.clientY);

    if (plotEl !== d.hoveredPlotEl) this._clearGhHover();

    if (plotEl) {
      d.hoveredPlotEl = plotEl;
      const index = Number(plotEl.dataset.action.slice(5));
      const { expedition: m, stations, survival } = this.engine;
      const plot = stations.plots[index];
      const status = plotStatus(plot);
      const cost = stations.plotCost(d.cropType, index);
      if (status.state === 'empty' && survival.baseWater >= cost.water && m.energy >= cost.energy) {
        plotEl.classList.add('is-drop-ok');
        tagEl.textContent = `+${cost.items} · ${cost.water}L ${cost.energy}%`;
        tagEl.className = 'gh-drag-tag ok';
      } else if (status.state === 'empty') {
        plotEl.classList.add('is-drop-bad');
        tagEl.textContent = `Need ${cost.water}L / ${cost.energy}%`;
        tagEl.className = 'gh-drag-tag bad';
      } else {
        plotEl.classList.add('is-drop-bad');
        tagEl.textContent = status.state === 'ready' ? 'READY!' : 'GROWING';
        tagEl.className = 'gh-drag-tag bad';
      }
    } else if (tagEl) {
      tagEl.textContent = d.cropType.toUpperCase();
      tagEl.className = 'gh-drag-tag';
    }
  }

  _onGhPointerUp(event) {
    const d = this._ghDrag;
    if (!d) return;
    const wasActive = d.active;
    const cropType = d.cropType;
    const plotEl = wasActive ? this._plotElAt(event.clientX, event.clientY) : null;
    this._cancelGhDrag();
    if (!wasActive) return;

    // Prevent trailing click event from toggling/re-triggering after drop
    this._suppressGhClick = true;
    setTimeout(() => { this._suppressGhClick = false; }, 0);

    if (plotEl) {
      const index = Number(plotEl.dataset.action.slice(5));
      this.engine.stations.selectPlot(index);
      const plot = this.engine.stations.plots[index];
      if (plot && !plot.crop) {
        const result = this._plantPlot(index, cropType);
        this._playGymSound(result === 'failed' ? 220 : 420, 0.09, result === 'failed' ? 0 : 540);
      } else {
        this._playGymSound(220, 0.06);
      }
    }
    this.render();
  }

  _cancelGhDrag() {
    window.removeEventListener('pointermove', this._onGhPointerMove);
    window.removeEventListener('pointerup', this._onGhPointerUp);
    window.removeEventListener('pointercancel', this._onGhPointerUp);
    this._clearGhHover();
    if (this._ghGhost) {
      this._ghGhost.remove();
      this._ghGhost = null;
    }
    this._ghDrag = null;
  }

  _plantPlot(index, cropType = this.selectedCrop || 'lettuce') {
    const { expedition: mission, stations, survival } = this.engine;
    const plot = stations.plots[index];
    if (!plot) return '';
    const message = stations.plant(cropType, survival, index);
    this.engine.updateCropVisuals?.();
    if (!plot.crop) {
      const cost = stations.plotCost(cropType, index);
      const need = [];
      if (survival.baseWater < cost.water) need.push(`${cost.water} L water`);
      if (mission.energy < cost.energy) need.push(`${cost.energy}% power`);
      this.ghNotice = need.length ? `Need ${need.join(' & ')}` : message;
      return 'failed';
    }
    this.ghNotice = '';
    return message;
  }

  _startGymLoop() {
    this._stopGymLoop();
    this._lastGymTick = performance.now();
    const tick = (now) => {
      if (!this.isOpen || !this._isGymStation()) return;
      const dt = Math.min(0.05, (now - this._lastGymTick) / 1000);
      this._lastGymTick = now;

      const speed = this.gymMode === 'bike' ? 92 : 82;
      this.rhythmPos += this.rhythmDir * speed * dt;
      if (this.rhythmPos >= 96) {
        this.rhythmPos = 96;
        this.rhythmDir = -1;
      } else if (this.rhythmPos <= 4) {
        this.rhythmPos = 4;
        this.rhythmDir = 1;
      }

      if (this.bpm > 74) {
        this.bpm = Math.max(74, this.bpm - 4.5 * dt);
      }

      const cursorEl = this.gymContainer?.querySelector('#gym-rhythm-cursor');
      if (cursorEl) {
        cursorEl.style.left = `${this.rhythmPos.toFixed(1)}%`;
      }
      const bpmEl = this.gymContainer?.querySelector('#gym-bpm-val');
      if (bpmEl) {
        bpmEl.textContent = `${Math.round(this.bpm)} BPM`;
      }

      this._gymRaf = requestAnimationFrame(tick);
    };
    this._gymRaf = requestAnimationFrame(tick);
  }

  _stopGymLoop() {
    if (this._gymRaf) {
      cancelAnimationFrame(this._gymRaf);
      this._gymRaf = null;
    }
  }

  _playGymSound(freq = 320, duration = 0.07, secondFreq = 0) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    this.engine._audioContext ??= new AudioContextClass();
    const audio = this.engine._audioContext;
    if (audio.state === 'suspended') audio.resume();
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, audio.currentTime);
    if (secondFreq > 0) {
      osc.frequency.setValueAtTime(secondFreq, audio.currentTime + duration * 0.5);
    }
    gain.gain.setValueAtTime(0.03, audio.currentTime);
    gain.gain.linearRampToValueAtTime(0, audio.currentTime + duration);
    osc.connect(gain).connect(audio.destination);
    osc.start();
    osc.stop(audio.currentTime + duration);
  }

  _doGymStep(side) {
    const { expedition: mission, stations } = this.engine;
    if (mission.energy < C.EXERCISE_COST) {
      this.lastHitQuality = 'warn';
      this.lastHitText = `Need ${C.EXERCISE_COST}% power to train.`;
      this._updateGymLiveDom();
      return;
    }
    const result = this.workout.step(side, this.rhythmPos, performance.now());
    this.workoutProgress = this.workout.progress;
    this.lastHitText = result.message;
    this.lastHitQuality = result.status;
    if (result.status === 'hit') {
      this.stridePhase = this.stridePhase ? 0 : 1;
      this._playGymSound(420, 0.08);
    }
    if (this.workoutProgress >= 100) {
      stations.exercise(this.gymMode);
      this.workout = new GymWorkout(this.gymMode);
      this.workoutProgress = 0;
      this.lastHitQuality = 'complete';
      this.lastHitText = this.gymMode === 'bike' ? 'Great ride! Muscles restored.' : 'Great run! Bones strengthened.';
      this._playGymSound(440, 0.22, 660);
      this.render();
      return;
    }
    this._updateGymLiveDom();
  }

  _updateGymLiveDom() {
    if (!this.gymContainer) return;
    const fill = this.gymContainer.querySelector('#gym-workout-fill');
    if (fill) fill.style.width = `${this.workoutProgress}%`;
    const label = this.gymContainer.querySelector('#gym-workout-pct');
    if (label) label.textContent = `${this.workoutProgress}%`;
    const banner = this.gymContainer.querySelector('#gym-hit-banner');
    if (banner) { banner.textContent = this.lastHitText; banner.className = `gym-hit-banner ${this.lastHitQuality}`; }
    const art = this.gymContainer.querySelector('.gym-illustration');
    if (art) art.dataset.phase = String(this.stridePhase);
    for (const button of this.gymContainer.querySelectorAll('[data-gym-step]')) {
      button.classList.toggle('next', this.gymMode === 'bike' && button.dataset.gymStep === this.workout.nextSide);
    }
  }

  _buildGymIllustrationSvg(isBike) {
    if (isBike) {
      return `
        <svg class="gym-svg" viewBox="0 0 160 124" shape-rendering="crispEdges">
          <!-- Floor & base stabilizers -->
          <rect x="0" y="108" width="160" height="16" fill="#132c33"/>
          <rect x="20" y="104" width="120" height="5" fill="#334155"/>
          <rect x="28" y="100" width="22" height="5" fill="#64748b"/>
          <rect x="108" y="100" width="24" height="5" fill="#64748b"/>

          <!-- CEVIS Bike frame, seat backrest & handlebar post -->
          <rect x="34" y="54" width="6" height="24" fill="#94a3b8"/>
          <rect x="40" y="64" width="18" height="6" fill="#0284c7"/>
          <rect x="44" y="70" width="6" height="32" fill="#cbd5e1"/>
          <rect x="50" y="88" width="54" height="6" fill="#0284c7"/>
          <rect x="70" y="76" width="36" height="6" fill="#cbd5e1"/>
          <rect x="108" y="42" width="6" height="60" fill="#cbd5e1"/>
          <rect x="94" y="44" width="16" height="5" fill="#334155"/>
          <!-- Console display -->
          <rect x="110" y="30" width="20" height="14" fill="#1e293b"/>
          <rect x="113" y="33" width="14" height="8" fill="#38bdf8"/>

          <!-- Magnetic Flywheel -->
          <rect x="98" y="70" width="26" height="26" fill="#475569"/>
          <rect x="101" y="73" width="20" height="20" fill="#e2e8f0"/>
          <rect x="105" y="77" width="12" height="12" fill="#0284c7"/>
          <g class="pose-0">
            <rect x="109" y="73" width="4" height="20" fill="#334155"/>
            <rect x="101" y="81" width="20" height="4" fill="#334155"/>
          </g>
          <g class="pose-1">
            <rect x="103" y="75" width="4" height="4" fill="#334155"/>
            <rect x="115" y="75" width="4" height="4" fill="#334155"/>
            <rect x="103" y="87" width="4" height="4" fill="#334155"/>
            <rect x="115" y="87" width="4" height="4" fill="#334155"/>
          </g>
          <rect x="109" y="81" width="4" height="4" fill="#38bdf8"/>

          <!-- Back leg (Alternates with pose) -->
          <g class="pose-0">
            <rect x="52" y="62" width="20" height="9" fill="#cbd5e1"/>
            <rect x="66" y="66" width="9" height="16" fill="#cbd5e1"/>
            <rect x="65" y="80" width="14" height="6" fill="#475569"/>
            <rect x="63" y="85" width="16" height="3" fill="#facc15"/>
          </g>
          <g class="pose-1">
            <rect x="52" y="64" width="16" height="12" fill="#cbd5e1"/>
            <rect x="62" y="74" width="10" height="20" fill="#cbd5e1"/>
            <rect x="61" y="92" width="15" height="6" fill="#475569"/>
            <rect x="60" y="97" width="16" height="3" fill="#facc15"/>
          </g>

          <!-- PLSS Backpack & Astronaut Torso -->
          <rect x="38" y="34" width="12" height="24" fill="#cbd5e1"/>
          <rect x="40" y="36" width="8" height="6" fill="#0284c7"/>
          <rect x="40" y="45" width="4" height="10" fill="#64748b"/>
          <rect x="48" y="34" width="20" height="28" fill="#f8fafc"/>
          <rect x="48" y="42" width="20" height="4" fill="#ef4444"/>
          <rect x="48" y="56" width="20" height="6" fill="#334155"/>
          <!-- Chest DCM -->
          <rect x="66" y="38" width="6" height="12" fill="#cbd5e1"/>
          <rect x="69" y="40" width="3" height="4" fill="#4ade80"/>

          <!-- Astronaut Helmet & Gold Reflective Visor -->
          <rect x="50" y="10" width="24" height="22" fill="#f8fafc"/>
          <rect x="54" y="8" width="16" height="4" fill="#f8fafc"/>
          <rect x="58" y="6" width="8" height="3" fill="#0284c7"/>
          <rect x="52" y="31" width="18" height="3" fill="#334155"/>
          <rect x="62" y="14" width="13" height="13" fill="#1e293b"/>
          <rect x="63" y="15" width="11" height="11" fill="#d97706"/>
          <rect x="65" y="16" width="8" height="6" fill="#f59e0b"/>
          <rect x="66" y="17" width="5" height="2" fill="#fef3c7"/>
          <rect x="55" y="17" width="5" height="8" fill="#475569"/>

          <!-- Front leg & Crank Pedal -->
          <g class="pose-0">
            <rect x="54" y="64" width="16" height="12" fill="#f8fafc"/>
            <rect x="64" y="72" width="10" height="5" fill="#0284c7"/>
            <rect x="64" y="76" width="10" height="18" fill="#f8fafc"/>
            <rect x="63" y="92" width="16" height="6" fill="#334155"/>
            <rect x="62" y="97" width="18" height="3" fill="#facc15"/>
          </g>
          <g class="pose-1">
            <rect x="54" y="60" width="22" height="10" fill="#f8fafc"/>
            <rect x="70" y="62" width="10" height="5" fill="#0284c7"/>
            <rect x="70" y="66" width="10" height="16" fill="#f8fafc"/>
            <rect x="69" y="80" width="16" height="6" fill="#334155"/>
            <rect x="68" y="85" width="18" height="3" fill="#facc15"/>
          </g>

          <!-- Astronaut Arm gripping handlebars -->
          <rect x="60" y="36" width="18" height="8" fill="#f8fafc"/>
          <rect x="74" y="38" width="5" height="7" fill="#334155"/>
          <rect x="78" y="40" width="16" height="7" fill="#f8fafc"/>
          <rect x="92" y="40" width="8" height="8" fill="#94a3b8"/>
        </svg>`;
    }

    return `
      <svg class="gym-svg" viewBox="0 0 160 124" shape-rendering="crispEdges">
        <!-- Floor & vibration isolators -->
        <rect x="0" y="108" width="160" height="16" fill="#132c33"/>
        <rect x="26" y="102" width="10" height="6" fill="#f59e0b"/>
        <rect x="114" y="102" width="10" height="6" fill="#f59e0b"/>

        <!-- T2 Space Treadmill Deck & Belt -->
        <rect x="16" y="92" width="120" height="11" fill="#334155"/>
        <rect x="20" y="90" width="112" height="5" fill="#0284c7"/>
        <rect x="24" y="88" width="104" height="4" fill="#1e293b"/>
        <g class="pose-0">
          <rect x="30" y="88" width="8" height="3" fill="#cbd5e1"/>
          <rect x="52" y="88" width="8" height="3" fill="#cbd5e1"/>
          <rect x="74" y="88" width="8" height="3" fill="#cbd5e1"/>
          <rect x="96" y="88" width="8" height="3" fill="#cbd5e1"/>
          <rect x="116" y="88" width="8" height="3" fill="#cbd5e1"/>
        </g>
        <g class="pose-1">
          <rect x="40" y="88" width="8" height="3" fill="#cbd5e1"/>
          <rect x="62" y="88" width="8" height="3" fill="#cbd5e1"/>
          <rect x="84" y="88" width="8" height="3" fill="#cbd5e1"/>
          <rect x="106" y="88" width="8" height="3" fill="#cbd5e1"/>
          <rect x="70" y="85" width="16" height="2" fill="#38bdf8"/>
        </g>

        <!-- Treadmill Front Console & Handrails -->
        <rect x="118" y="34" width="7" height="58" fill="#cbd5e1"/>
        <rect x="88" y="54" width="32" height="5" fill="#64748b"/>
        <rect x="112" y="24" width="22" height="14" fill="#1e293b"/>
        <rect x="115" y="27" width="16" height="8" fill="#38bdf8"/>

        <!-- 0.85G Bungee Harness Straps (Bone Density Loading) -->
        <rect x="48" y="60" width="3" height="30" fill="#38bdf8"/>
        <rect x="78" y="60" width="3" height="30" fill="#38bdf8"/>

        <!-- Back Arm & Back Leg (Alternating Run Stride) -->
        <g class="pose-0">
          <!-- Back arm forward -->
          <rect x="70" y="38" width="16" height="8" fill="#cbd5e1"/>
          <rect x="84" y="36" width="8" height="8" fill="#64748b"/>
          <!-- Back leg kicking back -->
          <rect x="46" y="62" width="12" height="14" fill="#cbd5e1"/>
          <rect x="38" y="72" width="12" height="12" fill="#cbd5e1"/>
          <rect x="34" y="80" width="14" height="7" fill="#475569"/>
        </g>
        <g class="pose-1">
          <!-- Back arm back -->
          <rect x="42" y="42" width="14" height="8" fill="#cbd5e1"/>
          <rect x="36" y="46" width="8" height="8" fill="#64748b"/>
          <!-- Back leg stepping forward -->
          <rect x="64" y="62" width="12" height="14" fill="#cbd5e1"/>
          <rect x="70" y="74" width="10" height="12" fill="#cbd5e1"/>
          <rect x="70" y="82" width="16" height="6" fill="#475569"/>
        </g>

        <!-- PLSS Life-Support Backpack -->
        <rect x="44" y="32" width="12" height="26" fill="#cbd5e1"/>
        <rect x="46" y="34" width="8" height="6" fill="#ef4444"/>
        <rect x="46" y="43" width="4" height="11" fill="#64748b"/>
        <rect x="47" y="29" width="4" height="3" fill="#4ade80"/>

        <!-- Astronaut Torso & Waist Harness -->
        <rect x="54" y="32" width="22" height="26" fill="#f8fafc"/>
        <rect x="54" y="40" width="22" height="4" fill="#0284c7"/>
        <rect x="52" y="56" width="26" height="6" fill="#334155"/>
        <rect x="60" y="57" width="10" height="4" fill="#38bdf8"/>
        <!-- Chest DCM -->
        <rect x="74" y="36" width="6" height="12" fill="#cbd5e1"/>
        <rect x="77" y="38" width="3" height="4" fill="#4ade80"/>

        <!-- Astronaut Helmet & Gold Reflective Visor -->
        <rect x="54" y="8" width="24" height="22" fill="#f8fafc"/>
        <rect x="58" y="6" width="16" height="4" fill="#f8fafc"/>
        <rect x="62" y="4" width="8" height="3" fill="#ef4444"/>
        <rect x="56" y="29" width="18" height="3" fill="#334155"/>
        <rect x="66" y="12" width="13" height="13" fill="#1e293b"/>
        <rect x="67" y="13" width="11" height="11" fill="#d97706"/>
        <rect x="69" y="14" width="8" height="6" fill="#f59e0b"/>
        <rect x="70" y="15" width="5" height="2" fill="#fef3c7"/>
        <rect x="59" y="15" width="5" height="8" fill="#475569"/>

        <!-- Front Leg & Front Arm (Alternating Run Stride) -->
        <g class="pose-0">
          <!-- Front leg planting on belt -->
          <rect x="62" y="62" width="12" height="14" fill="#f8fafc"/>
          <rect x="66" y="72" width="11" height="4" fill="#0284c7"/>
          <rect x="66" y="76" width="10" height="10" fill="#f8fafc"/>
          <rect x="66" y="82" width="16" height="6" fill="#1e293b"/>
          <!-- Front arm swinging back -->
          <rect x="46" y="38" width="14" height="8" fill="#f8fafc"/>
          <rect x="40" y="42" width="8" height="8" fill="#94a3b8"/>
        </g>
        <g class="pose-1">
          <!-- Front leg striding back -->
          <rect x="50" y="62" width="12" height="14" fill="#f8fafc"/>
          <rect x="44" y="72" width="11" height="4" fill="#0284c7"/>
          <rect x="42" y="76" width="10" height="10" fill="#f8fafc"/>
          <rect x="38" y="82" width="15" height="6" fill="#1e293b"/>
          <!-- Front arm pumping forward -->
          <rect x="64" y="38" width="16" height="8" fill="#f8fafc"/>
          <rect x="78" y="35" width="8" height="8" fill="#94a3b8"/>
        </g>
      </svg>`;
  }

  _renderGymInteractive() {
    const { expedition: mission, stations } = this.engine;
    const isBike = this.gymMode === 'bike';
    const stat = Math.round(isBike ? stations.muscleStrength : stations.boneDensity);
    this.gymContainer.innerHTML = `
      <div class="gym-tabs" role="group" aria-label="Choose equipment">
        <button type="button" class="gym-tab ${!isBike ? 'active' : ''}" data-gym-mode="treadmill" aria-pressed="${!isBike}">Treadmill</button>
        <button type="button" class="gym-tab ${isBike ? 'active' : ''}" data-gym-mode="bike" aria-pressed="${isBike}">Exercise bike</button>
      </div>
      <div class="gym-summary"><span>${isBike ? 'Muscle' : 'Bones'} <strong>${stat}%</strong></span><span>Power <strong>${Math.round(mission.energy)}%</strong></span><details class="gym-learn"><summary aria-label="Why exercise?" title="Why exercise?">i</summary><p>Lower gravity means astronauts need to exercise their muscles and bones. Training effects are simulated.</p></details></div>
      <div class="gym-stage">
        <div class="gym-illustration ${isBike ? 'bike' : 'treadmill'}" data-phase="${this.stridePhase}" aria-hidden="true">
          ${this._buildGymIllustrationSvg(isBike)}
        </div>
        <div class="gym-stage-copy"><h2>${isBike ? 'Ready to ride?' : 'Find your stride'}</h2><p>${isBike ? 'Alternate left and right pedals.' : 'Step when the marker is in the green zone.'}</p></div>
      </div>
      ${isBike ? '' : `<div class="gym-rhythm-track" aria-label="Timing meter"><div class="gym-rhythm-zone"></div><div id="gym-rhythm-cursor" class="gym-rhythm-cursor" style="left:${this.rhythmPos}%"></div></div>`}
      <div class="gym-progress-head"><span>Progress</span><strong id="gym-workout-pct">${this.workoutProgress}%</strong></div>
      <div class="gym-bar-track"><div id="gym-workout-fill" class="gym-bar-fill workout" style="width:${this.workoutProgress}%"></div></div>
      <div id="gym-hit-banner" class="gym-hit-banner ${this.lastHitQuality}" role="status">${this.lastHitText}</div>
      <div class="gym-controls-row">${isBike
        ? `<button type="button" class="mc-btn gym-step-btn ${this.workout.nextSide === 'left' ? 'next' : ''}" data-gym-step="left">[A] Left pedal</button><button type="button" class="mc-btn gym-step-btn ${this.workout.nextSide === 'right' ? 'next' : ''}" data-gym-step="right">[D] Right pedal</button>`
        : '<button type="button" class="mc-btn gym-step-btn next" data-gym-step="step">[SPACE] Step</button>'}</div>
      <div class="gym-cost">−${C.EXERCISE_COST}% power per completed set</div>
    `;
  }

  perform(action) {
    const { expedition: mission, stations, survival, hud } = this.engine;
    if (action === 'mission') return mission.objective || 'No mission objective yet.';
    if (action === 'filter') return stations.replaceFilter();
    const { utility } = this.engine;
    if (action.startsWith('toggle:')) return utility.toggle(action.slice(7));
    if (action === 'eatRation') return utility.eatRation();
    if (action === 'cookMeal') { const msg = utility.cookMeal(); hud.renderHotbar(survival.slots); return msg; }
    if (action === 'washUp') return utility.washUp();
    if (action === 'serviceFilter') return utility.serviceFilter();
    if (action === 'printPart') { const msg = utility.printPart(this.engine.crew?.stations ?? []); hud.renderHotbar(survival.slots); return msg; }
    if (action === 'fillWall') return this.engine.mission.fillShelterWall(survival);
    if (action === 'drainWall') return this.engine.mission.drainShelterWall(survival);
    if (action === 'cleanBase') return stations.cleanBase();
    if (action === 'exercise') return stations.exercise(this.gymMode || 'treadmill');
    if (action === 'exercise:treadmill') {
      this.gymMode = 'treadmill';
      return stations.exercise('treadmill');
    }
    if (action === 'exercise:bike') {
      this.gymMode = 'bike';
      return stations.exercise('bike');
    }
    if (action === 'treat') return stations.treat(survival);
    if (action === 'send') return stations.send(this.engine.radioOptions(true));
    if (action === 'upgrade') return stations.upgrade();
    if (action === 'upgradeTool') return stations.upgradeTool();
    if (action === 'sendMav') return stations.sendMav(this.engine.radioOptions());
    if (action.startsWith('seed:')) {
      const cropType = action.slice(5);
      if (Object.hasOwn(CROP_CONFIG, cropType)) {
        this.selectedCrop = cropType;
        this.ghNotice = '';
      }
      return '';
    }
    if (action.startsWith('plot:')) {
      const index = Number(action.slice(5));
      stations.selectPlot(index);
      const plot = stations.plots[index];
      if (!plot) return '';
      const status = plotStatus(plot);
      if (status.state === 'ready') {
        this._harvestPlot(index);
        this.ghNotice = '';
        return 'harvested';
      }
      if (status.state === 'empty') {
        return this._plantPlot(index, this.selectedCrop || 'lettuce');
      }
      this.ghNotice = `${plot.crop.type.toUpperCase()} · ${status.label}`;
      return '';
    }
    if (action === 'harvestAll') {
      stations.plots.forEach((plot, i) => {
        if (plotStatus(plot).state === 'ready') this._harvestPlot(i);
      });
      this.ghNotice = '';
      return 'harvested';
    }
    if (action === 'harvest') {
      return this._harvestPlot(stations.selectedPlot);
    }
    if (action.startsWith('plant:')) {
      const message = stations.plant(action.slice(6), survival);
      this.engine.updateCropVisuals?.();
      return message;
    }
    if (action === 'analyze') {
      if (stations.samples < 1) return 'Collect a new regolith sample outside first.';
      const index = survival.inventorySlots.findIndex(item => item?.id === BLOCK_IDS.REGOLITH && item.count > 0);
      if (index < 0) return 'Collect regolith before analyzing a sample.';
      survival.inventorySlots[index].count--;
      stations.samples--;
      stations.science += C.SCIENCE_PER_SAMPLE;
      stations.analyzedSamples++;
      hud.renderHotbar(survival.slots);
      return `Sample analyzed: +${C.SCIENCE_PER_SAMPLE} science points.`;
    }
    return '';
  }

  _powerText() {
    const { utility, mission, crew } = this.engine;
    const loads = utility.loads({
      crewSize: crew?.members.length ?? 0,
      operatingStations: crew?.stations.filter((st) => st.operating).length ?? 0,
    });
    const lines = loads.map(([name, rate, on]) => `  ${name.padEnd(18)} ${!on ? 'OFF' : rate > 0 ? `-${rate.toFixed(1)}%/h` : 'idle'}`);
    const used = loads.reduce((sum, [, rate, on]) => sum + (on ? rate : 0), 0);
    return `BATTERY: ${Math.round(mission.battery.percent)}%\n` +
      `SOLAR PANELS NOW: +${mission.chargeRate.toFixed(1)}%/h ${utility.isNight ? '(night: no sun)' : ''}\n` +
      `USING ABOUT: -${used.toFixed(1)}%/h (plus your own oxygen)\n` +
      `${utility.demandFactor < 1 ? `EASY START: the base uses ${Math.round(utility.demandFactor * 100)}% of its normal power for now. It will need more each sol.\n` : ''}\n` +
      `WHERE THE POWER GOES:\n${lines.join('\n')}\n\n` +
      `HEATER: ${utility.heaterOn ? 'ON' : 'OFF'}${utility.cold ? '   FREEZING! Pipes and plants stopped.' : ''}\n\n` +
      'Mars nights get down to about -98 C (NASA InSight). At night the panels make nothing and the heater needs more power. ' +
      'Turning systems off saves power, but each one stops doing its job.\n' +
      'Real case: the InSight lander shut down in 2022 when dust covered its solar panels.';
  }

  _powerButtons() {
    const { utility, mission } = this.engine;
    const label = (on, name) => `${name}: ${on ? 'ON' : 'OFF'}`;
    return [
      ['toggle:heater', label(utility.heaterOn, 'Heater')],
      ['toggle:lights', label(utility.greenhouseLightsOn, 'Greenhouse lights')],
      ['toggle:factory', label(mission.factoryOn, 'Fuel factory')],
      ['toggle:shield', label(mission.shieldOn, 'Radiation shield')],
    ];
  }

  _galleyText(survival) {
    const { crewStock, stations, utility } = this.engine;
    return `PANTRY: ${Math.floor(crewStock.food)} / ${crewStock.maxFood} packaged rations (shared with the crew)\n` +
      `YOUR FOOD: ${Math.round(survival.food)} / ${survival.maxStat}\n` +
      `CARROTS IN YOUR BAG: ${survival.countItem(BLOCK_IDS.HYDRO_PLANT)}\n` +
      `FRESH FOOD BONUS: ${stations.freshFood > 0 ? 'ACTIVE (you work faster)' : 'none'}\n` +
      `BASE WATER TANK: ${Math.round(survival.baseWater)} L${utility.cold ? '   (FROZEN)' : ''}\n\n` +
      'Rations are ready to eat and cost nothing now, but every ration you eat is one less for your crew. ' +
      'A fresh meal from the greenhouse costs water and power, but fills you up and gives you energy to work.\n' +
      'Real case: on the Space Station the galley warms up packaged food. An astronaut eats about 1.8 kg of food a day (NASA).';
  }

  _hygieneText(survival) {
    const { crewStock, utility } = this.engine;
    return `CLEAN WATER TANK: ${Math.round(survival.baseWater)} / ${survival.maxBaseWater} L\n` +
      `GRAY WATER (used, waiting to clean): ${crewStock.graywater.toFixed(1)} L\n` +
      `WATER FILTER: ${Math.round(utility.waterFilter)}%\n` +
      `WATER WE GET BACK: ${Math.round(utility.waterRecovery * 100)}%${utility.cold ? '   (PIPES FROZEN)' : ''}\n\n` +
      'Drink -> use -> recycle -> drink again. Water you drink, cook with or wash with becomes gray water, and so does the water the plants breathe out. ' +
      'The recycler cleans it, even sweat and urine, so everyone can drink it again, but only while a crew member runs it. ' +
      'A dirty filter gets back less water.\n' +
      "Real case: the Space Station gets back 98% of its water. Yesterday's coffee becomes tomorrow's coffee!";
  }

  _workshopText(survival) {
    const { crew, stations } = this.engine;
    const parts = (crew?.stations ?? []).map((st) => `  ${st.name.padEnd(18)} ${Math.round(st.health * 100)}%`);
    return `REGOLITH IN YOUR BAG: ${survival.countItem(BLOCK_IDS.REGOLITH)}\n` +
      `CO2 FILTER: ${Math.round(stations.filter)}%\n` +
      `CREW STATIONS:\n${parts.join('\n') || '  (no crew)'}\n\n` +
      'Spare parts from Earth take months to arrive. The 3D printer melts Mars dirt (regolith) into a new part and fixes the most worn machine right away. ' +
      'But you must go outside to dig the regolith, under radiation, and printing uses a lot of power.\n' +
      'Real case: the first 3D print in space was made on the Space Station in 2014.';
  }

  _radioText(s) {
    const c = this.engine.comms;
    const status = c.blackout
      ? `RADIO: SILENT, solar conjunction (${c.realConjunction ? 'real' : 'simulated'}). ${formatHours(c.blackoutHoursLeft)} left.`
      : `RADIO: ${s.message}`;
    const next = c.blackout ? '' : `Next solar conjunction (simulated): in ${formatHours(c.hoursUntilConjunction)}.\n`;
    return `EARTH IS NOW ${Math.round(c.distanceKm / 1e6)} million km away.\n` +
      `A radio message needs ${c.lightMinutes.toFixed(1)} min to get there and ${(2 * c.lightMinutes).toFixed(1)} min to come back.\n` +
      `(Calculated for ${formatDateDMY(c.date.toISOString())} from NASA/JPL planet orbits. In the game, each real minute is ${COMMS_CONFIG.GAME_SECONDS_PER_LIGHT_MINUTE} s.)\n` +
      `${status}\n${next}\n` +
      'Asking Mission Control costs power, and the answer only tells you what they saw when you asked. ' +
      'About every 26 months the Sun gets between Mars and Earth and the radio goes silent for about 2 weeks. Then the crew decides alone.';
  }

  _shelterText(mission, survival) {
    const water = Math.round(mission.shelterWaterL);
    const blocked = Math.round((1 - shelterDoseFactor(mission.shelterWaterL)) * 100);
    const phase = mission.storm.phase;
    const storm = phase === 'active' ? 'ACTIVE, stay in here!' : phase === 'warning' ? 'COMING SOON' : 'none right now';
    return `WATER WALL: ${water} / ${RADIATION_CONFIG.SHELTER_WALL_MAX_L} L\n` +
      `BLOCKS: ${blocked}% of storm radiation inside this booth\n` +
      `BASE WATER TANK: ${Math.round(survival.baseWater)} / ${survival.maxBaseWater} L\n` +
      `SOLAR STORM: ${storm}\n\n` +
      'Water stops radiation. Water in the wall is water you cannot drink.\n\n' +
      'A solar storm throws fast particles (protons) at Mars. Water is full of hydrogen, which slows them down. ' +
      'Astronauts in the Orion capsule build a shelter like this with their water and food bags.\n' +
      'Real model: a 10 cm layer of water (10 g/cm2) blocks about 83% of a storm dose. Game-scaled.';
  }

  gardenText(s, m, v) {
    const crop = s.crop;
    const recipe = crop ? CROP_CONFIG[crop.type] : null;
    const pct = crop ? Math.floor(crop.progress / recipe.seconds * 100) : 0;
    const bar = '[' + '#'.repeat(Math.floor(pct / 10)) + '.'.repeat(10 - Math.floor(pct / 10)) + ']';
    const study = plantDiscovery(s.discoveryIndex);
    const state = !crop ? 'Pick your next crop!' : pct === 100 ? 'READY! Harvest your meal and open a science discovery.' : s.contaminated ? 'PAUSED: clean the habitat first.' : !m.greenhousePowered ? 'PAUSED: waiting for power.' : s.cropsThirsty ? 'PAUSED: the base water tank is empty.' : 'Growing! Close this panel to keep the garden running.';
    return [
      'GARDEN CHALLENGE: harvest all 3 crops! ' + s.cropCollection.size + '/3',
      'Collected: ' + ([...s.cropCollection].join(', ') || 'none yet') + ' | Harvests: ' + s.harvestCount,
      '', 'BASE WATER TANK: ' + Math.floor(v.baseWater) + ' L | POWER: ' + Math.round(m.energy) + '%',
      crop ? crop.type.toUpperCase() + ' ' + bar + ' ' + pct + '%' : 'BED: EMPTY', state,
      '', ...Object.entries(CROP_CONFIG).map(([name, r]) => name.toUpperCase() + ': ' + r.strategy + '.'),
      '', 'Plants drink from the base water tank while they grow, and planting uses shared power.',
      'Most of that water comes back: plants breathe it out and the recycler cleans it again.',
      'Harvest drops a food item: pick it up and use it to eat.',
      'Times, yields and costs below are game rules, not measured crop requirements.',
      '', 'FIELD NOTEBOOK — Real NASA data from ' + formatDateDMY(plantResearch.retrieved.slice(0, 10)),
      study ? study.id + ': ' + study.title : 'Harvest a crop to discover a real space-biology study!',
      study ? study.explanation : '',
      study ? 'Mission: ' + study.mission : '',
      'These studies were conducted in space; they do not measure crop yields on Mars.',
    ].join('\n');
  }

  _renderGreenhouseMonitor() {
    const { expedition: m, stations: s, survival: v, utility } = this.engine;
    const study = plantDiscovery(s.discoveryIndex);
    const selectedCrop = Object.hasOwn(CROP_CONFIG, this.selectedCrop) ? this.selectedCrop : 'lettuce';
    const readyCount = s.readyPlotCount();
    const plantedCount = s.plantedPlotCount();

    const seedCardsHtml = Object.entries(CROP_CONFIG).map(([type, r]) => {
      const isSelected = type === selectedCrop;
      const canAfford1x = v.baseWater >= r.water && m.energy >= r.energy;
      return `
        <button type="button" class="gh-seed-card ${isSelected ? 'is-active' : ''} ${canAfford1x ? '' : 'is-low'}" data-action="seed:${type}" aria-pressed="${isSelected}">
          <img class="gh-crop-art" src="${this.cropIcons[type]}" alt="${type}" />
          <span class="gh-seed-main">
            <strong>${type.toUpperCase()}</strong>
            <span class="gh-food-gain">${GH_ICONS.food} +${r.nutrition}</span>
          </span>
          <span class="gh-seed-cost">
            <span>${GH_ICONS.water} ${r.water}L</span>
            <span>${GH_ICONS.power} ${r.energy}%</span>
            <span class="gh-seed-time">${r.seconds}s</span>
          </span>
        </button>`;
    }).join('');

    let alertPill = '';
    const hasPower = utility ? (utility.greenhouseLightsOn && !utility.cold && m.energy > 0) : m.greenhousePowered;
    if (s.cropsThirsty) {
      alertPill = '<span class="gh-alert-pill is-danger" role="status">NO WATER!</span>';
    } else if (s.hasGrowingCrops() && !hasPower && !s.contaminated) {
      alertPill = '<span class="gh-alert-pill is-warn" role="status">NO POWER!</span>';
    }

    const activePlot = s.plots[s.selectedPlot];
    const activeStatus = plotStatus(activePlot);
    let noticeText = this.ghNotice;
    let noticeKind = noticeText.startsWith('Need ') ? 'warn' : 'info';
    if (!noticeText && activePlot?.crop && activeStatus.state === 'growing') {
      noticeText = `${activePlot.crop.type.toUpperCase()} · ${activeStatus.label}`;
      noticeKind = 'growing';
    }

    const ghLinks = [
      ['NASA: 28-day salad crop', 'https://www.nasa.gov/image-article/growing-veggies-space/'],
      ['CSA: food production', 'https://www.asc-csa.gc.ca/eng/youth-educators/toolkits/food-production/'],
      ...plantResearch.studies.map(st => [st.id + ': NASA study', st.url]),
    ].map(([label, url]) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`).join(' · ');

    this.greenhouseContainer.innerHTML = `
      <div class="gh-top-bar">
        <div class="gh-res-pill water" title="Base water tank">${GH_ICONS.water} <strong id="gh-res-water">${Math.floor(v.baseWater)} L</strong></div>
        <div class="gh-res-pill power" title="Power">${GH_ICONS.power} <strong id="gh-res-power">${Math.round(m.energy)}%</strong></div>
        <div class="gh-res-pill beds" title="Planted beds">${GH_ICONS.sprout} <strong>${plantedCount}/${s.plots.length}</strong></div>
        ${alertPill}
        ${s.contaminated ? `<button type="button" class="mc-btn gh-clean-btn" data-action="cleanBase">CLEAN</button>` : ''}
        <details class="gym-learn"><summary aria-label="NASA info" title="NASA info">i</summary><p>Plants drink from the base tank and breathe water back for the recycler. NASA grew salad crops in 28 days on the Space Station.<br/><br/>${study ? `${study.id}: ${study.explanation}` : `Real NASA OSDR data (${formatDateDMY(plantResearch.retrieved.slice(0, 10))}).`}<br/>${ghLinks}</p></details>
      </div>
      <div class="gh-body">
        <div class="gh-map-wrap">
          ${greenhouseMapSvg(s.plots, s.selectedPlot, { selectedCrop, water: v.baseWater, energy: m.energy })}
        </div>
        <div class="gh-side">
          <div class="gh-step-bar">DRAG OR TAP CROP → BED</div>
          <div class="gh-seed-list">${seedCardsHtml}</div>
          ${readyCount > 0 ? `<button type="button" class="mc-btn gh-harvest-all-btn" data-action="harvestAll">HARVEST READY (${readyCount})</button>` : ''}
          ${noticeText ? `<div id="gh-notice" class="gh-notice is-${noticeKind}" data-kind="${noticeKind}" role="status">${noticeText}</div>` : ''}
        </div>
      </div>
    `;
  }

  render() {
    const { expedition: m, stations: s, survival: v, mission } = this.engine;
    this.element.classList.toggle('is-greenhouse', this._isGreenhouseStation());

    if (this._isGymStation() && this.gymContainer) {
      this.title.textContent = 'MARS GYM';
      this.content.classList.add('hidden');
      this.gymContainer.classList.remove('hidden');
      if (this.greenhouseContainer) this.greenhouseContainer.classList.add('hidden');
      this._renderGymInteractive();
      this.sources.replaceChildren();
      this.actions.replaceChildren();
      return;
    }

    if (this._isGreenhouseStation() && this.greenhouseContainer) {
      this.title.textContent = 'PLANT FOOD';
      this.content.classList.add('hidden');
      if (this.gymContainer) this.gymContainer.classList.add('hidden');
      this.greenhouseContainer.classList.remove('hidden');
      this._renderGreenhouseMonitor();
      this.sources.replaceChildren();
      this.actions.replaceChildren();
      return;
    }

    this.content.classList.remove('hidden');
    if (this.gymContainer) this.gymContainer.classList.add('hidden');
    if (this.greenhouseContainer) this.greenhouseContainer.classList.add('hidden');

    const pages = {
      console: ['MISSION COMPUTER', `OBJECTIVE: ${m.objective}\nBATTERY: ${Math.round(m.energy)}%   OXYGEN: ${Math.round(v.oxygen)}/${v.maxStat}\nFILTER: ${Math.round(s.filter)}%   SCIENCE POINTS: ${s.science}\n\n${radiationStatusText(mission)}\n\n${stormStatusText(mission.storm, donkiCme.fetched, mission.noStormData)}\n\nThe NASA data is saved inside the game, it is not live. Storm length and damage are game rules.`, [['mission', 'Show mission objective'], ['send', 'Ask Mission Control for advice'], ['upgrade', `Upgrade suit (${C.UPGRADE_COST} science)`]]],
      power: ['LIFE SUPPORT / ECLSS', `BATTERY: ${Math.round(m.energy)}%\nCO2 FILTER: ${Math.round(s.filter)}%\nCO2: ${Math.round(s.co2)}%\n\nThe oxygen system and greenhouse need power. A worn filter lets CO2 build up.`, [['filter', 'Replace CO2 filter'], ['cleanBase', 'Clean habitat']]],
      greenhouse: ['MARS GARDEN / FIELD NOTEBOOK', this.gardenText(s, m, v), [
        ...Object.entries(CROP_CONFIG).map(([type, r]) => ['plant:' + type, type.toUpperCase() + ' | ' + s.plotCost(type).water + ' L water / ' + s.plotCost(type).energy + '% power / ' + r.seconds + 's / +' + r.nutrition + ' food']),
        ['harvest', 'Harvest & discover NASA research'], ['cleanBase', 'Clean habitat'],
      ]],
      medical: ['MEDBAY & EXERCISE', `HEALTH: ${Math.round(v.health)}/${v.maxStat}\nBONE DENSITY: ${Math.round(s.boneDensity ?? s.fitness)}%\nFITNESS: ${Math.round(s.fitness)}%\nRADIATION DOSE SO FAR: ${formatDose(mission.totalDoseMsv)}\n\n${MEDBAY_BONE_TEXT}`, [['treat', 'Use medical station']]],
      science: ['SCIENCE & RADIO TO EARTH', `SCIENCE POINTS: ${s.science}   SAMPLES: ${s.samples}\n\n${this._radioText(s)}`, [['analyze', 'Analyze regolith'], ['send', 'Ask Mission Control for advice'], ['upgrade', `Upgrade suit (${C.UPGRADE_COST} science)`], ['upgradeTool', `Upgrade tool (${C.TOOL_UPGRADE_COST} science)`]]],
      mav: ['MAV DATA TERMINAL', `ANALYZED SAMPLES: ${s.analyzedSamples}/${C.MAV_REQUIRED_SAMPLES}\nPACKAGE: ${s.mavSent ? 'RECEIVED' : s.message}\n\nAnalyze samples at the science station, then send the package from the MAV.`, [['sendMav', 'Send MAV science package']]],
      powerroom: ['POWER & HEAT ROOM', this._powerText(), this._powerButtons()],
      galley: ['KITCHEN & PANTRY', this._galleyText(v), [['eatRation', 'Eat a ration (pantry)'], ['cookMeal', `Cook fresh meal (1 carrot, ${U.MEAL_WATER_L} L, ${U.MEAL_POWER}% power)`]]],
      hygiene: ['BATHROOM & WATER RECYCLER', this._hygieneText(v), [['washUp', `Wash up (${U.WASH_WATER_L} L of water)`], ['serviceFilter', `Clean water filter (${U.FILTER_SERVICE_POWER}% power)`]]],
      workshop: ['WORKSHOP & 3D PRINTER', this._workshopText(v), [['printPart', `Print spare part (${U.PRINT_REGOLITH} regolith, ${U.PRINT_POWER}% power)`]]],
      shelter: ['STORM SHELTER', this._shelterText(mission, v), [['fillWall', `Fill wall (+${RADIATION_CONFIG.SHELTER_FILL_STEP_L} L)`], ['drainWall', `Drain wall (-${RADIATION_CONFIG.SHELTER_FILL_STEP_L} L)`]]],
    };
    const [title, text, buttons] = pages[this.type];
    this.title.textContent = title;
    this.content.textContent = text;
    const links = this.type === 'console'
      ? [['NASA DONKI: space weather events', DATA_SOURCES.donki], ['NASA RadLab: radiation data', DATA_SOURCES.radlab]]
      : this.type === 'shelter'
        ? [['PREDICCS: water shielding (UNH, MSL/RAD data)', SHELTER_SOURCES.prediccs], ['NASA: storm shelters and water walls', SHELTER_SOURCES.nasa]]
        : this.type === 'greenhouse' ? [['CSA: food production', 'https://www.asc-csa.gc.ca/eng/youth-educators/toolkits/food-production/'], ...plantResearch.studies.map(study => [study.id + ': NASA study', study.url])] : [];
    this.sources.replaceChildren(...links.map(([label, url]) => {
      const link = document.createElement('a');
      link.textContent = label;
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      return link;
    }));
    this.actions.replaceChildren(...buttons.map(([action, label]) => {
      const button = document.createElement('button'); button.className = 'mc-btn'; button.dataset.action = action; button.textContent = label;
      if (this.type === 'greenhouse') {
        if (action.startsWith('plant:')) {
          const cost = s.plotCost(action.slice(6));
          button.disabled = !!s.crop || v.baseWater < cost.water || m.energy < cost.energy;
        }
        if (action === 'harvest') button.disabled = !s.crop || s.crop.progress < CROP_CONFIG[s.crop.type].seconds;
      }
      return button;
    }));
  }
}
