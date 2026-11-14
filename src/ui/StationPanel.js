import { BLOCK_IDS } from '../config/blockTypes.js';
import { STATION_CONFIG as C } from '../config/constants.js';
import { requestRawPointerLock } from '../player/mouseLook.js';
import { RESEARCH_DATA as DATA } from '../data/missionResearch.js';
import { GymWorkout } from './gymWorkout.js';

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
          ${isBike ? '<div class="gym-wheel"></div><div class="gym-bike-frame"></div><div class="gym-pedal"></div><div class="gym-seat"></div>' : '<div class="gym-belt"></div><div class="gym-rail"></div><div class="gym-runner"><i></i><b></b><em></em></div>'}
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

  render() {
    const { expedition: m, stations: s, survival: v } = this.engine;

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
      airlock: ['AIRLOCK & SUIT', `SUIT DUST: ${s.dirtySuit ? 'CLEANING NEEDED' : 'CLEAN'}\nHABITAT: ${s.contaminated ? 'CONTAMINATED' : 'CLEAN'}\n\nClean your suit before entering the habitat. Use the doors to cycle the airlock.`, [['cleanSuit', 'Clean suit'], ['cleanBase', 'Clean habitat']]],
      power: ['LIFE SUPPORT / ECLSS', `BATTERY: ${Math.round(m.energy)}%\nCO2 FILTER: ${Math.round(s.filter)}%\nCO2: ${Math.round(s.co2)}%\n\nThe oxygen system and greenhouse need power. A worn filter lets CO2 build up.`, [['filter', 'Replace CO2 filter'], ['cleanBase', 'Clean habitat']]],
      greenhouse: ['HYDROPONIC GREENHOUSE', `POWER: ${m.greenhousePowered ? 'ON' : 'OFF'}\nHABITAT: ${s.contaminated ? 'CONTAMINATED' : 'CLEAN'}\nCARROTS REGROWING: ${this.engine.growingCrops.length}\nCROP: ${s.crop ? `${s.crop.type.toUpperCase()} ${Math.round(s.crop.progress / C.CROP_GROWTH_TIME * 100)}%` : 'EMPTY'}\nFRESH FOOD: ${s.freshFood > 0 ? 'AVAILABLE' : 'LOW'}\n\nPlanting costs water and power. Growth pauses without power or in a contaminated habitat.`, [['plant:potato', 'Plant potato'], ['plant:lettuce', 'Plant lettuce'], ['plant:soy', 'Plant soy'], ['harvest', 'Harvest fresh food'], ['cleanBase', 'Clean habitat']]],
      medical: ['MEDBAY & EXERCISE', `HEALTH: ${Math.round(v.health)}/${v.maxStat}\nBONE DENSITY: ${Math.round(s.boneDensity ?? s.fitness)}%\nFITNESS: ${Math.round(s.fitness)}%\nRADIATION: ${Math.round(m.radiation)}%\n\nIn Mars's 0.38g gravity, astronauts lose bone mineral density and muscle mass. Use the treadmill and bike in the Gym Wing!`, [['treat', 'Use medical station']]],
      science: ['SCIENCE & COMMUNICATIONS', `SCIENCE POINTS: ${s.science}   SAMPLES: ${s.samples}\n${s.message}\n\nAnalyze one regolith block to earn science. Transmission delay is shortened for play.`, [['analyze', 'Analyze regolith'], ['send', 'Send data to Earth'], ['upgrade', `Upgrade suit (${C.UPGRADE_COST} science)`], ['upgradeTool', `Upgrade tool (${C.TOOL_UPGRADE_COST} science)`]]],
      mav: ['MAV DATA TERMINAL', `ANALYZED SAMPLES: ${s.analyzedSamples}/${C.MAV_REQUIRED_SAMPLES}\nPACKAGE: ${s.mavSent ? 'RECEIVED' : s.message}\n\nAnalyze samples at the science station, then send the package from the MAV.`, [['sendMav', 'Send MAV science package']]],
      suitport: ['SUITPORT', `SUIT DUST: ${s.dirtySuit ? 'CLEANING NEEDED' : 'CLEAN'}\n\nA suitport concept keeps the suit outside the habitat. Use the airlock for this simulated EVA.`, [['cleanSuit', 'Clean suit']]],
      shelter: ['STORM SHELTER', `RADIATION: ${Math.round(m.radiation)}%\n\nStay in the marked central shelter during a simulated solar storm. The simulation uses archived NASA DONKI and NASA RadLab data, not a live forecast.`, []],
    };
    const [title, text, buttons] = pages[this.type];
    this.title.textContent = title;
    this.content.textContent = text;
    const links = this.type === 'console' || this.type === 'shelter'
      ? [['NASA DONKI: historical event', DATA.cme.url], ['NASA RadLab: radiation data', DATA.radiation.url]] : [];
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
