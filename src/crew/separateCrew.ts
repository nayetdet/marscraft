// @ts-nocheck
import { CREW_CONFIG } from '../config/constants.ts';

// Separate overlapping avatars after positioning them on their routes. Stationary crew
// stay at their posts; walkers move around them and around each other.
// Roda todo quadro: compara a distancia ao quadrado (raiz so quando encosta) e para na primeira
// passada sem correcao, porque as seguintes tambem nao mudariam nada.
export function separateCrew(avatars, player = null) {
  const minDistance = CREW_CONFIG.COLLISION_DISTANCE;
  const minDistanceSq = minDistance * minDistance;
  for (let pass = 0; pass < 12; pass++) {
    let moved = false;
    for (let i = 0; i < avatars.length; i++) {
      const avatar = avatars[i];
      if (player && avatar.group.visible && player.pos.y - player.height < avatar.position.y + player.height && player.pos.y + 0.1 > avatar.position.y) {
        let dx = avatar.position.x - player.pos.x;
        let dz = avatar.position.z - player.pos.z;
        const distanceSq = dx * dx + dz * dz;
        if (distanceSq < minDistanceSq) {
          const distance = Math.sqrt(distanceSq);
          moved = true;
          if (distance < 1e-9) { dx = 1; dz = 0; }
          else { dx /= distance; dz /= distance; }
          avatar.position.x += dx * (minDistance - distance);
          avatar.position.z += dz * (minDistance - distance);
        }
      }
      for (let j = i + 1; j < avatars.length; j++) {
        const a = avatars[i];
        const b = avatars[j];
        let dx = b.position.x - a.position.x;
        let dz = b.position.z - a.position.z;
        const distanceSq = dx * dx + dz * dz;
        if (distanceSq >= minDistanceSq) continue;
        const distance = Math.sqrt(distanceSq);
        moved = true;
        if (distance < 1e-9) { dx = 1; dz = 0; }
        else { dx /= distance; dz /= distance; }
        const overlap = minDistance - distance;
        const fixedA = a.member.stationary;
        const fixedB = b.member.stationary;
        const shareA = fixedA && !fixedB ? 0 : fixedB && !fixedA ? 1 : 0.5;
        a.position.x -= dx * overlap * shareA;
        a.position.z -= dz * overlap * shareA;
        b.position.x += dx * overlap * (1 - shareA);
        b.position.z += dz * overlap * (1 - shareA);
      }
    }
    if (!moved) return;
  }
}
