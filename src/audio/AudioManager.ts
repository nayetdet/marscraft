// @ts-nocheck
import { AUDIO_MIX_CONFIG, WIND_AMBIENCE_CONFIG } from '../config/constants.ts';

import { assetPath } from '../config/assetPath.ts';

const AUDIO_BASE_URL = assetPath('/audio/');
const ROCKET_FADE_OUT_SECONDS = 1;

export class AudioManager {
  constructor() {
    this._allAudio = [];
    this.footsteps = {
      habitat: this._createAudio(`${AUDIO_BASE_URL}andando%20dentro%20da%20nave.wav`, true),
      surface: this._createAudio(`${AUDIO_BASE_URL}andando%20na%20areia.wav`, true),
    };
    this.dying = this._createAudio(`${AUDIO_BASE_URL}morrendo.wav`, true);
    this.rover = this._createAudio(`${AUDIO_BASE_URL}barulho%20do%20carro.wav?v=3`, true);
    this.rocket = this._createAudio(`${AUDIO_BASE_URL}foguete.wav`, true);
    this.sandFall = this._createAudio(`${AUDIO_BASE_URL}queda_areia.wav`);
    this.regolithPlace = this._createAudio(`${AUDIO_BASE_URL}colocando_areia.WAV`);
    this.regolithBreak = this._createAudio(`${AUDIO_BASE_URL}quebrando_areia.WAV?v=5`);
    this.shipBlockBreak = this._createAudio(`${AUDIO_BASE_URL}quebrando_pedra.WAV`, true);
    this.shipBlockBreakImpact = this._createAudio(`${AUDIO_BASE_URL}quebrando_pedra.WAV`);
    this.doorOpen = this._createAudio(`${AUDIO_BASE_URL}porta_abrir.wav`);
    this.doorClose = this._createAudio(`${AUDIO_BASE_URL}porta_fechar.wav`);
    this.decompression = this._createAudio(`${AUDIO_BASE_URL}descompressao.wav`);
    this.doorCrank = this._createAudio(`${AUDIO_BASE_URL}porta_fechar.wav`);
    this.uiClick = this._createAudio(`${AUDIO_BASE_URL}ui-click-kenney.ogg`);
    this.uiHover = this._createAudio(`${AUDIO_BASE_URL}ui-hover-kenney.wav`);
    this.uiConfirm = this._createAudio(`${AUDIO_BASE_URL}ui-confirm-kenney.ogg`);
    this.uiError = this._createAudio(`${AUDIO_BASE_URL}ui-error-kenney.ogg`);
    this.sciFiDoorOpen = this._createAudio(`${AUDIO_BASE_URL}sci-fi-door-open-kenney.ogg`);
    this.sciFiDoorClose = this._createAudio(`${AUDIO_BASE_URL}sci-fi-door-close-kenney.ogg`);

    this.footsteps.habitat.volume = AUDIO_MIX_CONFIG.FOOTSTEPS_VOLUME;
    this.footsteps.surface.volume = AUDIO_MIX_CONFIG.FOOTSTEPS_VOLUME;
    this.dying.volume = AUDIO_MIX_CONFIG.DYING_LOOP_VOLUME;
    this.rover.volume = AUDIO_MIX_CONFIG.ROVER_LOOP_VOLUME;
    this.rocket.volume = AUDIO_MIX_CONFIG.ROCKET_LOOP_VOLUME;
    this.sandFall.volume = AUDIO_MIX_CONFIG.LANDING_VOLUME;
    this.regolithPlace.volume = AUDIO_MIX_CONFIG.REGOLITH_PLACE_VOLUME;
    this.regolithBreak.volume = AUDIO_MIX_CONFIG.REGOLITH_BREAK_VOLUME;
    this.shipBlockBreak.volume = AUDIO_MIX_CONFIG.BLOCK_BREAK_LOOP_VOLUME;
    this.shipBlockBreakImpact.volume = AUDIO_MIX_CONFIG.BLOCK_BREAK_IMPACT_VOLUME;
    this.doorOpen.volume = AUDIO_MIX_CONFIG.DOOR_VOLUME;
    this.doorClose.volume = AUDIO_MIX_CONFIG.DOOR_VOLUME;
    this.decompression.volume = AUDIO_MIX_CONFIG.DECOMPRESSION_VOLUME;
    this.doorCrank.playbackRate = AUDIO_MIX_CONFIG.CRANK_PLAYBACK_RATE;
    this.doorCrank.preservesPitch = false;
    this.doorCrank.volume = AUDIO_MIX_CONFIG.DOOR_VOLUME;
    this.uiHover.volume = AUDIO_MIX_CONFIG.UI_HOVER_VOLUME;
    this.uiClick.volume = AUDIO_MIX_CONFIG.UI_CLICK_VOLUME;
    this.uiConfirm.volume = AUDIO_MIX_CONFIG.UI_CONFIRM_VOLUME;
    this.uiError.volume = AUDIO_MIX_CONFIG.UI_ERROR_VOLUME;
    this.sciFiDoorOpen.volume = AUDIO_MIX_CONFIG.SCI_FI_DOOR_VOLUME;
    this.sciFiDoorClose.volume = AUDIO_MIX_CONFIG.SCI_FI_DOOR_VOLUME;
    this._rocketFadeElapsed = null;
    this._rocketFadeStartVolume = AUDIO_MIX_CONFIG.ROCKET_LOOP_VOLUME;
    this._allAudio.forEach((audio) => { audio._baseVolume = audio.volume; });
    this.setMasterVolume(1, false);
    this._activeFootsteps = null;
    this._wasRoverActive = false;
    this._wasInDanger = false;
    this._wasLandingFromJump = false;
    this._lastPosition = null;
    this._windNodes = null;
    this._windTime = 0;
    this._lastHealth = null;
    this._damageSoundCooldown = 0;
    this._lastHoverAt = null;
    this._lastVolumePreviewAt = null;
    this._lastVolumePreviewValue = null;
    this._uiAudioUnlocked = false;
  }

  _createAudio(src, loop = false) {
    const audio = new Audio(src);
    audio.preload = 'auto';
    audio.loop = loop;
    audio.volume = loop
      ? AUDIO_MIX_CONFIG.LOOP_DEFAULT_VOLUME
      : AUDIO_MIX_CONFIG.ONE_SHOT_DEFAULT_VOLUME;
    this._allAudio.push(audio);
    return audio;
  }

  setMasterVolume(volume) {
    this.masterVolume = Math.max(0, Math.min(1, Number(volume) || 0));
    this._allAudio.forEach((audio) => this._setAudioVolume(audio, audio._baseVolume));
  }

  _setAudioVolume(audio, baseVolume) {
    audio._baseVolume = baseVolume;
    audio.volume = baseVolume * this.masterVolume;
  }

  _play(audio) {
    const playback = audio.play();
    if (playback?.catch) {
      playback.catch((error) => {
        console.warn(`Unable to play game audio "${audio.src}":`, error);
      });
    }
  }

  _playOneShot(audio) {
    audio.currentTime = 0;
    this._play(audio);
  }

  playDoorOpen() {
    this._playOneShot(this.doorOpen);
  }

  playDoorClose() {
    this._playOneShot(this.doorClose);
  }

  playDecompression() {
    this._playOneShot(this.decompression);
  }

  playRegolithPlace() {
    this._playOneShot(this.regolithPlace);
  }

  playRegolithBreak() {
    this.regolithBreak.currentTime = 0;
    this._play(this.regolithBreak);
  }

  stopRegolithBreak() {
    this.regolithBreak.pause();
    this.regolithBreak.currentTime = 0;
  }

  playShipBlockBreak() {
    this.shipBlockBreak.currentTime = 0;
    this._play(this.shipBlockBreak);
  }

  stopShipBlockBreak() {
    this.shipBlockBreak.pause();
    this.shipBlockBreak.currentTime = 0;
  }

  playBlockBreakImpact(isRegolith) {
    if (isRegolith) {
      this.playRegolithBreakImpact();
      return;
    }
    this._playOneShot(this.shipBlockBreakImpact);
  }

  playRegolithBreakImpact() {
    if (this.masterVolume <= 0) return;
    const ctx = this._getSynthContext();
    if (!ctx) return;
    const C = AUDIO_MIX_CONFIG;
    this._playSuitTone(
      ctx,
      C.REGOLITH_IMPACT_LOW_START_HZ,
      0,
      C.REGOLITH_IMPACT_LOW_DURATION_SECONDS,
      'sine',
      C.REGOLITH_IMPACT_LOW_GAIN,
      C.REGOLITH_IMPACT_LOW_END_HZ
    );
    this._playSuitTone(
      ctx,
      C.REGOLITH_IMPACT_CLICK_START_HZ,
      0,
      C.REGOLITH_IMPACT_CLICK_DURATION_SECONDS,
      'triangle',
      C.REGOLITH_IMPACT_CLICK_GAIN,
      C.REGOLITH_IMPACT_CLICK_END_HZ
    );
  }

  // Abertura manual do airlock (sem energia): som mecanico pesado
  playManualCrank() {
    this._playOneShot(this.doorCrank);
  }

  playUiClick() {
    this._uiAudioUnlocked = true;
    this._playOneShot(this.uiClick);
  }

  playUiConfirm() {
    this._uiAudioUnlocked = true;
    this._playOneShot(this.uiConfirm);
  }

  playUiError() {
    this._uiAudioUnlocked = true;
    this._playOneShot(this.uiError);
  }

  playUiHover() {
    if (!this._uiAudioUnlocked || this.masterVolume <= 0) return;
    const now = Date.now();
    if (this._lastHoverAt !== null && now - this._lastHoverAt < AUDIO_MIX_CONFIG.UI_HOVER_COOLDOWN_MS) return;
    this._lastHoverAt = now;
    this._playOneShot(this.uiHover);
  }

  playUiVolumePreview({ final = false } = {}) {
    if (this.masterVolume <= 0) return;
    const now = Date.now();
    if (final && this._lastVolumePreviewValue === this.masterVolume) return;
    if (!final && this._lastVolumePreviewAt !== null && now - this._lastVolumePreviewAt < AUDIO_MIX_CONFIG.UI_VOLUME_PREVIEW_COOLDOWN_MS) return;
    this._lastVolumePreviewAt = now;
    this._lastVolumePreviewValue = this.masterVolume;
    this._uiAudioUnlocked = true;
    this.playUiClick();
  }

  playUiFeedback(success = true) {
    if (success) this.playUiConfirm();
    else this.playUiError();
  }

  _getSynthContext() {
    if (typeof window === 'undefined') return null;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    this._synthCtx ??= new AudioCtx();
    if (this._synthCtx.state === 'suspended') this._synthCtx.resume().catch(() => {});
    return this._synthCtx;
  }

  _playSuitTone(ctx, freq, startOffset, duration, type = 'triangle', peak = 0.06, endFreq = null) {
    peak *= this.masterVolume;
    const t0 = ctx.currentTime + startOffset;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, t0 + duration);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.linearRampToValueAtTime(peak, t0 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  }

  playGymRep(mode) {
    if (this.masterVolume <= 0) return;
    const ctx = this._getSynthContext();
    if (!ctx) return;

    if (mode === 'bike') {
      this._playSuitTone(
        ctx,
        AUDIO_MIX_CONFIG.GYM_BIKE_START_HZ,
        0,
        AUDIO_MIX_CONFIG.GYM_BIKE_DURATION_SECONDS,
        'triangle',
        AUDIO_MIX_CONFIG.GYM_BIKE_PEAK_GAIN,
        AUDIO_MIX_CONFIG.GYM_BIKE_END_HZ
      );
    } else if (mode === 'treadmill') {
      this._playSuitTone(
        ctx,
        AUDIO_MIX_CONFIG.GYM_TREADMILL_START_HZ,
        0,
        AUDIO_MIX_CONFIG.GYM_TREADMILL_DURATION_SECONDS,
        'sine',
        AUDIO_MIX_CONFIG.GYM_TREADMILL_PEAK_GAIN,
        AUDIO_MIX_CONFIG.GYM_TREADMILL_END_HZ
      );
    }
  }

  playSuitEquip() {
    this._playOneShot(this.sciFiDoorOpen);
    window.setTimeout(() => this.playUiConfirm(), 250);
  }

  playSuitDock() {
    this._playOneShot(this.sciFiDoorClose);
    window.setTimeout(() => this.playUiConfirm(), 250);
  }

  playSolarClean() {
    const ctx = this._getSynthContext();
    if (!ctx || this.masterVolume <= 0) return;
    const sampleCount = Math.floor(ctx.sampleRate * 0.18);
    if (!this._brushNoiseBuffer || this._brushNoiseBuffer.length !== sampleCount) {
      const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < sampleCount; i++) data[i] = Math.random() * 2 - 1;
      this._brushNoiseBuffer = buffer;
    }
    const peak = 0.045 * this.masterVolume;
    for (const [offset, freq] of [[0.08, 1250], [0.34, 1500], [0.60, 1300]]) {
      const t0 = ctx.currentTime + offset;
      const src = ctx.createBufferSource();
      src.buffer = this._brushNoiseBuffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(freq, t0);
      filter.Q.setValueAtTime(1.4, t0);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.linearRampToValueAtTime(peak, t0 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.18);
      src.connect(filter).connect(gain).connect(ctx.destination);
      src.start(t0);
      src.stop(t0 + 0.19);
    }
    this._playSuitTone(ctx, 587.33, 0.85, 0.14, 'sine', 0.035);
  }

  playRocket({ liftoff = false } = {}) {
    this._rocketFadeElapsed = null;
    const volume = liftoff
      ? AUDIO_MIX_CONFIG.ROCKET_LIFTOFF_VOLUME
      : AUDIO_MIX_CONFIG.ROCKET_LOOP_VOLUME;
    this._setAudioVolume(this.rocket, volume);
    this.rocket.currentTime = 0;
    this._play(this.rocket);
  }

  fadeOutRocket() {
    if (this._rocketFadeElapsed !== null) return;
    this._rocketFadeElapsed = 0;
    this._rocketFadeStartVolume = this.rocket._baseVolume;
  }

  stopRocket() {
    this._rocketFadeElapsed = null;
    this.rocket.pause();
    this.rocket.currentTime = 0;
    this._setAudioVolume(this.rocket, AUDIO_MIX_CONFIG.ROCKET_LOOP_VOLUME);
  }

  _updateRocketFade(dt) {
    if (this._rocketFadeElapsed === null) return;

    this._rocketFadeElapsed = Math.min(
      ROCKET_FADE_OUT_SECONDS,
      this._rocketFadeElapsed + Math.max(0, dt)
    );
    const progress = this._rocketFadeElapsed / ROCKET_FADE_OUT_SECONDS;
    this._setAudioVolume(this.rocket, this._rocketFadeStartVolume * (1 - progress));

    if (this._rocketFadeElapsed >= ROCKET_FADE_OUT_SECONDS) this.stopRocket();
  }

  _stopFootsteps() {
    if (!this._activeFootsteps) return;
    this._activeFootsteps.pause();
    this._activeFootsteps.currentTime = 0;
    this._activeFootsteps = null;
  }

  _ensureWindNodes() {
    if (this._windNodes) return this._windNodes;
    const ctx = this._getSynthContext();
    if (!ctx) return null;

    // Buffer longo com ruido rosa suave para o vento fino de Marte, sem repeticao perceptivel
    const length = Math.max(1, Math.floor(ctx.sampleRate * WIND_AMBIENCE_CONFIG.AUDIO_BUFFER_SECONDS));
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0; let b1 = 0; let b2 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + white * 0.099046;
      b1 = 0.96300 * b1 + white * 0.2965164;
      b2 = 0.57000 * b2 + white * 1.0526913;
      data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.12;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 260;
    filter.Q.value = 1.25;

    const gain = ctx.createGain();
    gain.gain.value = 0;

    source.connect(filter).connect(gain).connect(ctx.destination);
    source.start();
    this._windNodes = { ctx, source, filter, gain };
    return this._windNodes;
  }

  _updateWindAudio(dt, isGameRunning, outdoorFactor, windIntensity) {
    if (!isGameRunning && !this._windNodes) return;
    if (outdoorFactor <= 0.01 && !this._windNodes) return;
    const nodes = this._ensureWindNodes();
    if (!nodes) return;

    this._windTime += Math.max(0, dt);
    const { ctx, filter, gain } = nodes;
    const active = isGameRunning ? Math.max(0, Math.min(1, outdoorFactor)) : 0;
    const intensity = Math.max(0, Math.min(1, windIntensity));
    const targetGain = active > 0.01
      ? this.masterVolume * active * (WIND_AMBIENCE_CONFIG.AUDIO_BASE_GAIN + WIND_AMBIENCE_CONFIG.AUDIO_STORM_GAIN * intensity * intensity)
      : 0;
    const sweep = 0.5 + 0.5 * Math.sin(this._windTime * 0.7);
    const targetFreq = 210 + intensity * 260 + sweep * (55 + intensity * 90);
    const now = ctx.currentTime;
    gain.gain.setTargetAtTime(targetGain, now, 0.22);
    filter.frequency.setTargetAtTime(targetFreq, now, 0.25);
  }

  update({ dt = 0, player, survival, isGameRunning, isRoverActive, roverSpeed = 0, sprinting, outdoorFactor = 0, windIntensity = 0 }) {
    this._updateRocketFade(dt);
    this._updateWindAudio(dt, isGameRunning, outdoorFactor, windIntensity);

    this._damageSoundCooldown = Math.max(0, this._damageSoundCooldown - dt);
    if (this._lastHealth !== null && survival.health < this._lastHealth && this._damageSoundCooldown <= 0) {
      this.playUiError();
      this._damageSoundCooldown = 0.65;
    }
    this._lastHealth = survival.health;

    const landedFromJump = Boolean(player.justLandedFromJump);
    if (landedFromJump && !this._wasLandingFromJump) {
      this._playOneShot(this.sandFall);
    }
    this._wasLandingFromJump = landedFromJump;

    const inDanger = survival.isInDanger && !survival.isDead;
    if (inDanger && !this._wasInDanger) {
      this.dying.currentTime = 0;
      this._play(this.dying);
    } else if (!inDanger && this._wasInDanger) {
      this.dying.pause();
      this.dying.currentTime = 0;
    }
    this._wasInDanger = inDanger;
    this.dying.playbackRate = 1;

    const shouldPlayRover = isGameRunning && isRoverActive;
    if (shouldPlayRover && !this._wasRoverActive) {
      this.rover.currentTime = 0;
      this._play(this.rover);
    } else if (!shouldPlayRover && this._wasRoverActive) {
      this.rover.pause();
      this.rover.currentTime = 0;
    }
    this._wasRoverActive = shouldPlayRover;

    if (shouldPlayRover) {
      this.rover.playbackRate = Math.min(1.25, 0.9 + Math.abs(roverSpeed) * 0.05);
    }

    if (!isGameRunning || isRoverActive) {
      this._stopFootsteps();
      this._lastPosition = null;
      return;
    }

    if (!this._lastPosition) {
      this._lastPosition = { x: player.pos.x, z: player.pos.z };
      return;
    }

    const dx = player.pos.x - this._lastPosition.x;
    const dz = player.pos.z - this._lastPosition.z;
    const moved = dx * dx + dz * dz > 0.0004;
    this._lastPosition.x = player.pos.x;
    this._lastPosition.z = player.pos.z;

    const shouldPlayFootsteps = player.onGround && player.isMoving && moved;
    if (!shouldPlayFootsteps) {
      this._stopFootsteps();
      return;
    }

    const environment = survival.insidePressurizedShip ? 'habitat' : 'surface';
    const footsteps = this.footsteps[environment];
    if (this._activeFootsteps !== footsteps) {
      this._stopFootsteps();
      this._activeFootsteps = footsteps;
      this._play(footsteps);
    }
    const playbackRate = player.isCrouching ? 1.05 : sprinting ? 1.4 : 1.2;
    footsteps.playbackRate = environment === 'habitat' && !player.isCrouching
      ? playbackRate + 0.2
      : playbackRate;
  }
}
