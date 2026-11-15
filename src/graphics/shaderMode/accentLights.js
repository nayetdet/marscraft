import { MAV_CONFIG, WORLD_CONFIG } from '../../config/constants.js';
import { GREENHOUSE_CENTER } from '../../world/greenhouseLayout.js';

const GROUND_TOP = WORLD_CONFIG.GROUND_LEVEL + 1;

// Luzes secundarias do modo Shaders: pequenas, coloridas e sem sombra. Cada uma fica perto de
// algo que brilha de verdade no cenario (telas, luz de cultivo, porta, plataforma), para a cor do
// objeto "vazar" no que esta em volta. Sao escolhas visuais, nao dados da NASA.
// `pulse` = quanto a luz oscila (0 = fixa) e `speed` = velocidade da oscilacao em rad/s.
export const ACCENT_LIGHTS = Object.freeze([
  // Telas do console de comando (parede norte do habitat): tremem de leve, como monitor
  { id: 'console', color: 0x4fd8ff, intensity: 5, distance: 9, pos: [6.6, 11.7, -8.6], pulse: 0.06, speed: 7 },
  // Luz de cultivo da estufa: LEDs vermelhos e azuis, que juntos dao magenta
  { id: 'grow', color: 0xff4fd0, intensity: 8, distance: 16, pos: [GREENHOUSE_CENTER.x, 12.8, GREENHOUSE_CENTER.z], pulse: 0, speed: 0 },
  // Lampada por fora da porta do airlock
  { id: 'airlock', color: 0xffd9a0, intensity: 7, distance: 13, pos: [0.5, 12.7, 10.4], pulse: 0, speed: 0 },
  // Luz de servico da plataforma do foguete: pulsa devagar, como sinalizador
  { id: 'pad', color: 0xffb060, intensity: 10, distance: 15, pos: [MAV_CONFIG.PAD_POSITION.x + 3.2, GROUND_TOP + 1.6, MAV_CONFIG.PAD_POSITION.z + 3.2], pulse: 0.5, speed: 2.4 },
]);

// Intensidade da luz no instante `time` (segundos): oscila entre (1 - pulse) e 1 vez a base
export function accentIntensity(light, time) {
  if (!light.pulse) return light.intensity;
  return light.intensity * (1 - light.pulse * (0.5 - 0.5 * Math.sin(time * light.speed)));
}
