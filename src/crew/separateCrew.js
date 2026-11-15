import { CREW_CONFIG } from '../config/constants.js';

// Separate overlapping avatars after positioning them on their routes. Stationary crew
// stay at their posts; walkers move around them and around each other.
export function separateCrew(avatars) {
  const minDistance = CREW_CONFIG.COLLISION_DISTANCE;
  for (let pass = 0; pass < 12; pass++) {
    for (let i = 0; i < avatars.length; i++) {
      for (let j = i + 1; j < avatars.length; j++) {
        const a = avatars[i];
        const b = avatars[j];
        let dx = b.position.x - a.position.x;
        let dz = b.position.z - a.position.z;
        const distance = Math.hypot(dx, dz);
        if (distance >= minDistance) continue;
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
  }
}
