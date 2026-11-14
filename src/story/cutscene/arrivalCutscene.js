import { CUTSCENE_CONFIG } from '../../config/constants.js';
import { COMMS_DELAY } from '../../data/commsDelay.js';
import { EASE, sampleKeys } from './timeline.js';

// Animacao de chegada: a capsula entra na atmosfera, freia com o motor e pousa perto da base.
// Roteiro (tempos em segundos) em docs/superpowers/plans/2026-11-14-story-arc.md.
const CHASE_END = 4; // fim do plano de perseguicao, comeco do plano no chao
const TOUCHDOWN = 9.5;
const FADE_START = 12.5;

const _lander = [0, 0, 0];
const _cam = [0, 0, 0];

export function createArrivalCutscene({ camera, lander, flame, dust, site, groundY, onEnd }) {
  const landerKeys = [
    { t: 0, v: [site.x + 40, groundY + 150, site.z - 30] },
    { t: CHASE_END, v: [site.x + 6, groundY + 55, site.z - 5] },
    { t: TOUCHDOWN, v: [site.x, groundY, site.z], ease: EASE.out },
  ];
  // Camera no chao, ao sul do local de pouso, com a base ao fundo
  const groundCamKeys = [
    { t: TOUCHDOWN, v: [site.x + 5, groundY + 2.2, site.z + 8] },
    { t: FADE_START, v: [site.x + 3.5, groundY + 2.8, site.z + 6.5], ease: EASE.inOut },
  ];
  const km = Math.round(COMMS_DELAY.distanceMillionKm);
  let touchedDown = false;

  return {
    duration: CUTSCENE_CONFIG.ARRIVAL_SECONDS,
    fadeColor: '#000',
    fade: [
      { t: 0, v: 1 },
      { t: 0.8, v: 0 },
      { t: FADE_START, v: 0 },
      { t: 13.3, v: 1 },
      { t: CUTSCENE_CONFIG.ARRIVAL_SECONDS, v: 1 },
    ],
    captions: [
      { from: 0.4, to: 3.9, text: 'After a 7-month trip from Earth, you reach Mars.' },
      { from: 4.2, to: 9.3, text: "Mars air is 100 times thinner than Earth's. Parachutes are not enough: the engines must slow you down." },
      { from: 9.7, to: 12.6, text: `Touchdown! You are ${km} million km from home.` },
      { from: 13.3, to: CUTSCENE_CONFIG.ARRIVAL_SECONDS, big: true, text: 'SOL 1', sub: '1 sol = 1 Mars day (24 h 39 min)' },
    ],

    update(t, dt) {
      if (t === 0) touchedDown = false;

      sampleKeys(landerKeys, t, _lander);
      lander.position.set(_lander[0], _lander[1], _lander[2]);
      // Balanco leve na descida, que some ate o pouso
      const sway = Math.max(0, 1 - t / TOUCHDOWN);
      lander.rotation.set(0.06 * Math.cos(t * 1.3) * sway, 0, 0.08 * Math.sin(t * 1.7) * sway);

      const burn = t < CHASE_END ? 0.45 : t < TOUCHDOWN ? 1 : Math.max(0, 1 - (t - TOUCHDOWN) / 0.3);
      flame.setPower(burn, t);

      // Poeira: o jato levanta areia perto do chao e o toque abre um anel
      if (t >= 8.2 && t < TOUCHDOWN) dust.emit(dt, 30, site.x, groundY + 0.2, site.z, 5, 1.2);
      if (t >= TOUCHDOWN && !touchedDown) {
        touchedDown = true;
        dust.burstRing(site.x, groundY, site.z, 40, 7);
      }
      dust.update(dt);

      let shake;
      if (t < CHASE_END) {
        // Plano 1: perseguicao, acima e atras da capsula, olhando para baixo
        camera.position.set(_lander[0] + 4, _lander[1] + 11, _lander[2] + 9);
        shake = 0.05;
      } else {
        // Planos 2 e 3: camera no chao seguindo a capsula ate o toque
        sampleKeys(groundCamKeys, t, _cam);
        camera.position.set(_cam[0], _cam[1], _cam[2]);
        shake = t < TOUCHDOWN ? 0.06 : Math.max(0, 0.22 - (t - TOUCHDOWN) * 0.45);
      }
      camera.position.x += Math.sin(t * 37) * shake;
      camera.position.y += Math.sin(t * 53 + 1) * shake;
      camera.lookAt(_lander[0], _lander[1] + (t < CHASE_END ? -2 : 2.6), _lander[2]);
    },

    onEnd,
  };
}
