// @ts-nocheck
import { INPUT_CONFIG } from '../config/constants.ts';

const MAX_PITCH = Math.PI / 2 - 0.02;

// Chrome (sobretudo no Windows) as vezes entrega um mousemove com movementX/Y enorme e falso
// no pointer lock. Um delta desse tamanho num unico evento e descartado em vez de virar um salto.
export function isMouseSpike(dx, dy) {
  return Math.abs(dx) > INPUT_CONFIG.MAX_MOUSE_DELTA || Math.abs(dy) > INPUT_CONFIG.MAX_MOUSE_DELTA;
}

// Aplica o movimento do mouse ao yaw/pitch do jogador. Retorna false se o evento foi descartado.
export function applyMouseLook(player, dx, dy, isZoomed) {
  if (isMouseSpike(dx, dy)) return false;
  const sensitivity = isZoomed ? INPUT_CONFIG.ZOOM_SENSITIVITY : INPUT_CONFIG.MOUSE_SENSITIVITY;
  player.yaw -= dx * sensitivity;
  player.pitch = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, player.pitch - dy * sensitivity));
  return true;
}

// Pede o pointer lock sem a aceleracao do mouse do sistema (movimento cru), com fallback
// para navegadores que nao suportam a opcao.
export function requestRawPointerLock(element, onFailure = () => {}) {
  const requestStandard = () => {
    try {
      element.requestPointerLock()?.catch?.(onFailure);
    } catch (err) {
      onFailure(err);
    }
  };
  try {
    const request = element.requestPointerLock({ unadjustedMovement: true });
    request?.catch?.((err) => {
      if (err?.name === 'NotSupportedError') requestStandard();
      else onFailure(err);
    });
  } catch {
    requestStandard();
  }
}
