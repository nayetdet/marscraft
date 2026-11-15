// @ts-nocheck
import { MAV_CONFIG, WORLD_CONFIG } from '../../config/constants.ts';
import { GREENHOUSE_CENTER } from '../../world/greenhouseLayout.ts';

const GROUND_TOP = WORLD_CONFIG.GROUND_LEVEL + 1;

// Luzes secundarias do modo Shaders: pequenas, coloridas e sem sombra. Cada uma fica perto de
// algo que brilha de verdade no cenario (telas, luz de cultivo, porta, plataforma), para a cor do
// objeto "vazar" no que esta em volta. Sao escolhas visuais, nao dados da NASA.
// `pulse` = quanto a luz oscila (0 = fixa) e `speed` = velocidade da oscilacao em rad/s.
// Com `target` e `angle` (meia abertura do cone, em radianos) a luz e um foco: como nao tem
// sombra, e o cone apontado para longe da parede que impede a luz de vazar para o outro lado.
export const ACCENT_LIGHTS = Object.freeze([
  // Telas do console de comando (parede norte do habitat): tremem de leve, como monitor
  { id: 'console', color: 0x4fd8ff, intensity: 16, distance: 9, pos: [6.6, 13.6, -9.4], target: [6.6, 10, -6.6], angle: 0.9, pulse: 0.06, speed: 7 },
  // Luz de cultivo da estufa: LEDs vermelhos e azuis, que juntos dao magenta
  { id: 'grow', color: 0xff4fd0, intensity: 60, distance: 16, pos: [GREENHOUSE_CENTER.x, 19, GREENHOUSE_CENTER.z], target: [GREENHOUSE_CENTER.x, GROUND_TOP, GREENHOUSE_CENTER.z], angle: 0.85, pulse: 0, speed: 0 },
  // Lampada por fora da porta do airlock, apontada para o chao em frente a porta
  { id: 'airlock', color: 0xffd9a0, intensity: 30, distance: 12, pos: [0.5, 13.6, 10.3], target: [0.5, GROUND_TOP, 10.9], angle: 0.75, pulse: 0, speed: 0 },
  // Luz de servico da plataforma do foguete: pulsa devagar, como sinalizador
  { id: 'pad', color: 0xffb060, intensity: 10, distance: 15, pos: [MAV_CONFIG.PAD_POSITION.x + 3.2, GROUND_TOP + 1.6, MAV_CONFIG.PAD_POSITION.z + 3.2], pulse: 0.5, speed: 2.4 },
]);

// Intensidade da luz no instante `time` (segundos): oscila entre (1 - pulse) e 1 vez a base
export function accentIntensity(light, time) {
  if (!light.pulse) return light.intensity;
  return light.intensity * (1 - light.pulse * (0.5 - 0.5 * Math.sin(time * light.speed)));
}
