import { CUTSCENE_CONFIG } from '../../config/constants.js';

// Animacao de decolagem do MAV: contagem, ignicao, subida e o foguete sumindo no ceu.
// Roteiro (tempos em segundos) em docs/superpowers/plans/2026-11-14-story-arc.md.
const IGNITION = 3; // a chama acende
const LIFTOFF = 4;
const WIDE_SHOT = 8.5; // corta para o plano aberto
const FADE_START = 13.5;
// Altura (acima da origem do foguete) de onde sai a chama
export const MAV_NOZZLE_Y = 0.5;

export function createLaunchCutscene({ camera, rocket, flame, smoke, pad, onEnd }) {
  const accel = CUTSCENE_CONFIG.LAUNCH_ACCEL;

  return {
    duration: CUTSCENE_CONFIG.LAUNCH_SECONDS,
    runsUnlocked: true,
    fadeColor: '#fff',
    fade: [
      { t: 0, v: 0 },
      { t: FADE_START, v: 0 },
      { t: 15.2, v: 1 },
      { t: CUTSCENE_CONFIG.LAUNCH_SECONDS, v: 1 },
    ],
    captions: [
      { from: 0.2, to: 1, text: 'Fuel made from Mars ice: ready.' },
      { from: 1, to: 2, big: true, side: true, text: '3' },
      { from: 2, to: 3, big: true, side: true, text: '2' },
      { from: 3, to: 4, big: true, side: true, text: '1' },
      { from: 4, to: 5.5, big: true, side: true, text: 'LIFTOFF!' },
      { from: 8.7, to: 13.4, text: 'The MAV climbs to orbit, where the ship home is waiting.' },
    ],

    update(t, dt) {
      const flight = Math.max(0, t - LIFTOFF);
      const altitude = 0.5 * accel * flight * flight;
      const power = t < IGNITION ? 0 : t < LIFTOFF ? 0.6 * (t - IGNITION) : 1;

      // O foguete treme na plataforma antes de soltar
      const rumble = t >= IGNITION && t < LIFTOFF ? 0.03 : 0;
      rocket.position.set(pad.x + Math.sin(t * 61) * rumble, pad.y + altitude, pad.z + Math.sin(t * 47) * rumble);
      flame.setPower(power, t);

      // Fumaca: nuvem que se abre na plataforma e, depois, o rastro embaixo do foguete
      if (t >= IGNITION && altitude < 14) smoke.emit(dt, 45, pad.x, pad.y + 0.3, pad.z, 7, 1.5);
      else if (altitude >= 14) smoke.emit(dt, 14, pad.x, pad.y + altitude - 2, pad.z, 1.2, -1);
      smoke.update(dt);

      if (t < WIDE_SHOT) {
        // Planos 1 e 2: camera baixa, do lado da base, inclinando para seguir o foguete
        const shake = t < IGNITION ? 0 : Math.max(0, 0.14 - flight * 0.025);
        camera.position.set(
          pad.x - 9 + Math.sin(t * 39) * shake,
          pad.y + 1.8 + Math.sin(t * 57 + 1) * shake,
          pad.z - 7
        );
        // Mira um pouco a esquerda do foguete: ele fica na direita da tela e a contagem, na esquerda
        camera.lookAt(pad.x + 2.2, pad.y + altitude + 4.5, pad.z - 2.8);
      } else {
        // Plano 3: de longe, o foguete vira um risco de luz subindo
        camera.position.set(pad.x - 28, pad.y + 3.5, pad.z + 7);
        camera.lookAt(pad.x, pad.y + altitude + 4.5, pad.z);
      }
    },

    onEnd,
  };
}
