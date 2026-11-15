const AUDIO_BASE_URL = `${import.meta.env.BASE_URL}audio/`;
const LOOP_VOLUME = 0.45;
const ROCKET_VOLUME = 0.7;
const DOOR_VOLUME = 0.12;
// Chiado de descompressao do airlock (a "fumaca"): bem baixo, so de fundo
const DECOMPRESSION_VOLUME = 0.05;
const ROCKET_FADE_OUT_SECONDS = 1;
// Manivela do airlock sem energia: o som da porta tocado devagar fica grave e pesado
const CRANK_PLAYBACK_RATE = 0.45;

export class AudioManager {
  constructor() {
    this.footsteps = {
      habitat: this._createAudio(`${AUDIO_BASE_URL}andando%20dentro%20da%20nave.wav`, true),
      surface: this._createAudio(`${AUDIO_BASE_URL}andando%20na%20areia.wav`, true),
    };
    this.dying = this._createAudio(`${AUDIO_BASE_URL}morrendo.wav`, true);
    this.rover = this._createAudio(`${AUDIO_BASE_URL}barulho%20do%20carro.wav?v=2`, true);
    this.rocket = this._createAudio(`${AUDIO_BASE_URL}foguete.wav`, true);
    this.sandFall = this._createAudio(`${AUDIO_BASE_URL}queda_areia.wav`);
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
    this._rocketFadeElapsed = null;
    this._rocketFadeStartVolume = ROCKET_VOLUME;
    this.rover.volume = LOOP_VOLUME / 2;
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
    return audio;
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

  // Abertura manual do airlock (sem energia): som mecanico pesado
  playManualCrank() {
    this._playOneShot(this.doorCrank);
  }

  playRocket() {
    this._rocketFadeElapsed = null;
    this.rocket.volume = ROCKET_VOLUME;
    this.rocket.currentTime = 0;
    this._play(this.rocket);
  }

  fadeOutRocket() {
    if (this._rocketFadeElapsed !== null) return;
    this._rocketFadeElapsed = 0;
    this._rocketFadeStartVolume = this.rocket.volume;
  }

  stopRocket() {
    this._rocketFadeElapsed = null;
    this.rocket.pause();
    this.rocket.currentTime = 0;
    this.rocket.volume = ROCKET_VOLUME;
  }

  _updateRocketFade(dt) {
    if (this._rocketFadeElapsed === null) return;

    this._rocketFadeElapsed = Math.min(
      ROCKET_FADE_OUT_SECONDS,
      this._rocketFadeElapsed + Math.max(0, dt)
    );
    const progress = this._rocketFadeElapsed / ROCKET_FADE_OUT_SECONDS;
    this.rocket.volume = this._rocketFadeStartVolume * (1 - progress);

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
