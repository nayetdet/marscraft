// @ts-nocheck
const AUDIO_BASE_URL = '/audio/';
const LOOP_VOLUME = 0.45;
const ROCKET_VOLUME = 0.7;
const DOOR_VOLUME = 0.12;
// Chiado de descompressao do airlock (a "fumaca"): bem baixo, so de fundo
const DECOMPRESSION_VOLUME = 0.05;
const REGOLITH_PLACE_VOLUME = 0.07;
const ROCKET_FADE_OUT_SECONDS = 1;
// Manivela do airlock sem energia: o som da porta tocado devagar fica grave e pesado
const CRANK_PLAYBACK_RATE = 0.45;

export class AudioManager {
  constructor() {
    this._allAudio = [];
    this.footsteps = {
      habitat: this._createAudio(`${AUDIO_BASE_URL}andando%20dentro%20da%20nave.wav`, true),
      surface: this._createAudio(`${AUDIO_BASE_URL}andando%20na%20areia.wav`, true),
    };
    this.dying = this._createAudio(`${AUDIO_BASE_URL}morrendo.wav`, true);
    this.rover = this._createAudio(`${AUDIO_BASE_URL}barulho%20do%20carro.wav?v=2`, true);
    this.rocket = this._createAudio(`${AUDIO_BASE_URL}foguete.wav`, true);
    this.sandFall = this._createAudio(`${AUDIO_BASE_URL}queda_areia.wav`);
    this.regolithPlace = this._createAudio(`${AUDIO_BASE_URL}colocando_areia.WAV`);
    this.regolithBreak = this._createAudio(`${AUDIO_BASE_URL}quebrando_areia.WAV?v=3`);
    this.shipBlockBreak = this._createAudio(`${AUDIO_BASE_URL}quebrando_pedra.WAV`, true);
    this.doorOpen = this._createAudio(`${AUDIO_BASE_URL}porta_abrir.wav`);
    this.doorClose = this._createAudio(`${AUDIO_BASE_URL}porta_fechar.wav`);
    this.decompression = this._createAudio(`${AUDIO_BASE_URL}descompressao.wav`);
    this.doorCrank = this._createAudio(`${AUDIO_BASE_URL}porta_fechar.wav`);
    this.doorOpen.volume = DOOR_VOLUME;
    this.doorClose.volume = DOOR_VOLUME;
    this.decompression.volume = DECOMPRESSION_VOLUME;
    this.doorCrank.playbackRate = CRANK_PLAYBACK_RATE;
    this.doorCrank.preservesPitch = false;
    this.doorCrank.volume = DOOR_VOLUME;
    this.rocket.volume = ROCKET_VOLUME;
    this.regolithPlace.volume = REGOLITH_PLACE_VOLUME;
    this._rocketFadeElapsed = null;
    this._rocketFadeStartVolume = ROCKET_VOLUME;
    this.rover.volume = LOOP_VOLUME / 2;
    this._allAudio.forEach((audio) => { audio._baseVolume = audio.volume; });
    this.setMasterVolume(1, false);
    this._activeFootsteps = null;
    this._wasRoverActive = false;
    this._wasInDanger = false;
    this._wasLandingFromJump = false;
    this._lastPosition = null;
  }

  _createAudio(src, loop = false) {
    const audio = new Audio(src);
    audio.preload = 'auto';
    audio.loop = loop;
    audio.volume = loop ? LOOP_VOLUME : 0.7;
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

  // Abertura manual do airlock (sem energia): som mecanico pesado
  playManualCrank() {
    this._playOneShot(this.doorCrank);
  }

  _getSynthContext() {
    if (typeof window === 'undefined') return null;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    this._synthCtx ??= new AudioCtx();
    if (this._synthCtx.state === 'suspended') this._synthCtx.resume().catch(() => {});
    return this._synthCtx;
  }

  _playSuitTone(ctx, freq, startOffset, duration, type = 'triangle', peak = 0.06) {
    peak *= this.masterVolume;
    const t0 = ctx.currentTime + startOffset;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.linearRampToValueAtTime(peak, t0 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  }

  playSuitEquip() {
    const ctx = this._getSynthContext();
    if (!ctx) return;
    // Mechanical unlatch click + helmet lock + ascending NASA seal chime
    this._playSuitTone(ctx, 190, 0.0, 0.08, 'square', 0.035);
    this._playSuitTone(ctx, 320, 0.34, 0.09, 'triangle', 0.05);
    this._playSuitTone(ctx, 523.25, 0.68, 0.14, 'sine', 0.06);
    this._playSuitTone(ctx, 783.99, 0.82, 0.22, 'sine', 0.07);
  }

  playSuitDock() {
    const ctx = this._getSynthContext();
    if (!ctx) return;
    // Helmet release + clamp lock + descending confirmation chime
    this._playSuitTone(ctx, 659.25, 0.0, 0.12, 'sine', 0.05);
    this._playSuitTone(ctx, 440.0, 0.13, 0.16, 'sine', 0.05);
    this._playSuitTone(ctx, 210, 0.52, 0.1, 'square', 0.03);
  }

  playRocket() {
    this._rocketFadeElapsed = null;
    this._setAudioVolume(this.rocket, ROCKET_VOLUME);
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
    this._setAudioVolume(this.rocket, ROCKET_VOLUME);
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

  update({ dt = 0, player, survival, isGameRunning, isRoverActive, roverSpeed = 0, sprinting }) {
    this._updateRocketFade(dt);

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
