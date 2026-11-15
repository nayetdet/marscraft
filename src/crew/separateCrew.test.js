import { describe, expect, it } from 'vitest';
import { CREW_CONFIG } from '../config/constants.js';
import { separateCrew } from './separateCrew.js';

const avatar = (x, z, stationary = false) => ({ position: { x, z }, member: { stationary } });
const distance = (a, b) => Math.hypot(a.position.x - b.position.x, a.position.z - b.position.z);

describe('crew separation', () => {
  it('separates walkers at the same point', () => {
    const crew = [avatar(0, 0), avatar(0, 0), avatar(0, 0)];
    separateCrew(crew);
    for (let i = 0; i < crew.length; i++) {
      for (let j = i + 1; j < crew.length; j++) {
        expect(distance(crew[i], crew[j])).toBeGreaterThan(CREW_CONFIG.COLLISION_DISTANCE - 0.001);
      }
    }
  });

  it('keeps a stationary crew member at their post', () => {
    const crew = [avatar(2, 3, true), avatar(2.1, 3)];
    separateCrew(crew);
    expect(crew[0].position).toEqual({ x: 2, z: 3 });
    expect(distance(...crew)).toBeCloseTo(CREW_CONFIG.COLLISION_DISTANCE);
  });
});
