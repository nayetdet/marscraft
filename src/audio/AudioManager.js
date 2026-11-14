const AUDIO_BASE_URL = `${import.meta.env.BASE_URL}audio/`;
const LOOP_VOLUME = 0.45;

export class AudioManager {
  constructor() {
    this.footsteps = {
      habitat: this._createAudio(`${AUDIO_BASE_URL}andando%20dentro%20da%20nave.wav`, true),
      surface: this._createAudio(`${AUDIO_BASE_URL}andando%20na%20areia.wav`, true),
    };
    this.dying = this._createAudio(`${AUDIO_BASE_URL}morrendo.wav`, true);
    this.rover = this._createAudio(`${AUDIO_BASE_URL}barulho%20do%20carro.wav?v=2`, true);
    this.rocket = this._createAudio(`${AUDIO_BASE_URL}foguete.wav`);
    this.rover.volume = LOOP_VOLUME / 2;
    this._activeFootsteps = null;
    this._wasRoverActive = false;
    this._wasInDanger = false;
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

  playRocket() {
    this.rocket.currentTime = 0;
    this._play(this.rocket);
  }

  stopRocket() {
    this.rocket.pause();
    this.rocket.currentTime = 0;
  }

  _stopFootsteps() {
    if (!this._activeFootsteps) return;
    this._activeFootsteps.pause();
    this._activeFootsteps.currentTime = 0;
    this._activeFootsteps = null;
  }

  update({ player, survival, isGameRunning, isRoverActive, roverSpeed = 0, sprinting }) {
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
