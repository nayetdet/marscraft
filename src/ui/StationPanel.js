import { BLOCK_IDS } from '../config/blockTypes.js';
import { RADIATION_CONFIG, STATION_CONFIG as C } from '../config/constants.js';
import { shelterDoseFactor } from '../mission/radiation.js';
import { requestRawPointerLock } from '../player/mouseLook.js';
import { RESEARCH_DATA as DATA } from '../data/missionResearch.js';
import { GymWorkout } from './gymWorkout.js';

const SHELTER_SOURCES = {
  prediccs: 'https://posters.unh.edu/private_media/4209/',
  nasa: 'https://ntrs.nasa.gov/citations/20210009760',
};

export class StationPanel {
  constructor(engine) {
    this.engine = engine;
    this.element = document.getElementById('station-overlay');
    this.title = document.getElementById('station-title');
    this.content = document.getElementById('station-content');
    this.gymContainer = document.getElementById('gym-interactive');
    this.actions = document.getElementById('station-actions');
    this.sources = document.getElementById('station-sources');
    this.feedback = document.getElementById('station-feedback');
    this.isOpen = false;

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

    document.getElementById('station-close').addEventListener('click', () => this.close());
    this.actions.addEventListener('click', event => {
      const action = event.target.closest('button')?.dataset.action;
      if (action) {
        this.feedback.textContent = this.perform(action);
        this.render();
      }
    });

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

  open(type) {
    this.type = type;
    this.isOpen = true;
    this.feedback.textContent = '';
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
    if (document.pointerLockElement) document.exitPointerLock();
  }

  close() {
    this.isOpen = false;
    this._stopGymLoop();
    this.element.classList.add('hidden');
    if (!this.engine.input?.isTouchMode) requestRawPointerLock(this.engine.renderer.domElement);
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
    if (action === 'mission') return mission.console();
    if (action === 'filter') return stations.replaceFilter();
    if (action === 'cleanSuit') return stations.cleanSuit();
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
    if (action === 'send') return stations.send();
    if (action === 'upgrade') return stations.upgrade();
    if (action === 'upgradeTool') return stations.upgradeTool();
    if (action === 'sendMav') return stations.sendMav();
    if (action === 'harvest') return stations.harvest(survival);
    if (action.startsWith('plant:')) return stations.plant(action.slice(6), survival);
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

  render() {
    const { expedition: m, stations: s, survival: v, mission } = this.engine;

    if (this._isGymStation() && this.gymContainer) {
      this.title.textContent = 'MARS GYM';
      this.content.classList.add('hidden');
      this.gymContainer.classList.remove('hidden');
      this._renderGymInteractive();
      this.sources.replaceChildren();
      this.actions.replaceChildren();
      return;
    }

    this.content.classList.remove('hidden');
    if (this.gymContainer) this.gymContainer.classList.add('hidden');

    const pages = {
      console: ['MISSION COMPUTER', `OBJECTIVE: ${m.objective}\nBATTERY: ${Math.round(m.energy)}%   OXYGEN: ${Math.round(v.oxygen)}/${v.maxStat}\nRADIATION: ${Math.round(m.radiation)}%   FILTER: ${Math.round(s.filter)}%\nSCIENCE POINTS: ${s.science}\n\nNASA DONKI historical CME: ${DATA.cme.observed}, ${DATA.cme.speedKmS} km/s.\nNASA RadLab Curiosity MSL-RAD: ${DATA.radiation.start} to ${DATA.radiation.end}; median ${DATA.radiation.median} (raw, unit unconfirmed).\nNASA data retrieved ${DATA.cme.retrieved}; archived, not live. The storm and its effects are simulated and game-scaled.`, [['mission', 'Start / report mission'], ['send', 'Send message to Earth'], ['upgrade', `Upgrade suit (${C.UPGRADE_COST} science)`]]],
      airlock: ['AIRLOCK & SUIT', `SUIT DUST: ${s.dirtySuit ? 'CLEANING NEEDED' : 'CLEAN'}\nHABITAT: ${s.contaminated ? 'CONTAMINATED' : 'CLEAN'}\nBATTERY: ${Math.round(m.energy)}%\n\nMars dust is very fine and sticks to everything. Brushing it off here, before the inner door, costs ${C.DECONTAMINATION_COST}% power. If you skip it, the dust gets into the habitat and you must clean the whole base.`, [['cleanSuit', 'Clean suit']]],
      power: ['LIFE SUPPORT / ECLSS', `BATTERY: ${Math.round(m.energy)}%\nCO2 FILTER: ${Math.round(s.filter)}%\nCO2: ${Math.round(s.co2)}%\n\nThe oxygen system and greenhouse need power. A worn filter lets CO2 build up.`, [['filter', 'Replace CO2 filter'], ['cleanBase', 'Clean habitat']]],
      greenhouse: ['HYDROPONIC GREENHOUSE', `POWER: ${m.greenhousePowered ? 'ON' : 'OFF'}\nHABITAT: ${s.contaminated ? 'CONTAMINATED' : 'CLEAN'}\nCARROTS REGROWING: ${this.engine.growingCrops.length}\nCROP: ${s.crop ? `${s.crop.type.toUpperCase()} ${Math.round(s.crop.progress / C.CROP_GROWTH_TIME * 100)}%` : 'EMPTY'}\nFRESH FOOD: ${s.freshFood > 0 ? 'AVAILABLE' : 'LOW'}\n\nPlanting costs water and power. Growth pauses without power or in a contaminated habitat.`, [['plant:potato', 'Plant potato'], ['plant:lettuce', 'Plant lettuce'], ['plant:soy', 'Plant soy'], ['harvest', 'Harvest fresh food'], ['cleanBase', 'Clean habitat']]],
      medical: ['MEDBAY & EXERCISE', `HEALTH: ${Math.round(v.health)}/${v.maxStat}\nBONE DENSITY: ${Math.round(s.boneDensity ?? s.fitness)}%\nFITNESS: ${Math.round(s.fitness)}%\nRADIATION: ${Math.round(m.radiation)}%\n\nIn Mars's 0.38g gravity, astronauts lose bone mineral density and muscle mass. Use the treadmill and bike in the Gym Wing!`, [['treat', 'Use medical station']]],
      science: ['SCIENCE & RADIO TO EARTH', `SCIENCE POINTS: ${s.science}   SAMPLES: ${s.samples}\nRADIO: ${s.message}\n\nAnalyze one regolith block to earn science.\nA radio message needs 3 to 22 minutes to travel between Mars and Earth, one way, so Mission Control cannot help you right away. In the game the wait is shorter.`, [['analyze', 'Analyze regolith'], ['send', 'Send data to Earth'], ['upgrade', `Upgrade suit (${C.UPGRADE_COST} science)`], ['upgradeTool', `Upgrade tool (${C.TOOL_UPGRADE_COST} science)`]]],
      mav: ['MAV DATA TERMINAL', `ANALYZED SAMPLES: ${s.analyzedSamples}/${C.MAV_REQUIRED_SAMPLES}\nPACKAGE: ${s.mavSent ? 'RECEIVED' : s.message}\n\nAnalyze samples at the science station, then send the package from the MAV.`, [['sendMav', 'Send MAV science package']]],
      shelter: ['STORM SHELTER', this._shelterText(mission, v), [['fillWall', `Fill wall (+${RADIATION_CONFIG.SHELTER_FILL_STEP_L} L)`], ['drainWall', `Drain wall (-${RADIATION_CONFIG.SHELTER_FILL_STEP_L} L)`]]],
    };
    const [title, text, buttons] = pages[this.type];
    this.title.textContent = title;
    this.content.textContent = text;
    const links = this.type === 'console'
      ? [['NASA DONKI: historical event', DATA.cme.url], ['NASA RadLab: radiation data', DATA.radiation.url]]
      : this.type === 'shelter'
        ? [['PREDICCS: water shielding (UNH, MSL/RAD data)', SHELTER_SOURCES.prediccs], ['NASA: storm shelters and water walls', SHELTER_SOURCES.nasa]]
        : [];
    this.sources.replaceChildren(...links.map(([label, url]) => {
      const link = document.createElement('a');
      link.textContent = label;
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      return link;
    }));
    this.actions.replaceChildren(...buttons.map(([action, label]) => {
      const button = document.createElement('button'); button.className = 'mc-btn'; button.dataset.action = action; button.textContent = label; return button;
    }));
  }
}
