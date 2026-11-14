import { describe, it, expect } from 'vitest';
import { isInsideShieldZone, SHIELD_ZONE } from './shieldZone.js';

describe('isInsideShieldZone', () => {
  it.each([
    ['main habitat', { x: 0, y: 11, z: 0 }],
    ['greenhouse', { x: -18, y: 11, z: 0 }],
    ['ascent vehicle', { x: 14, y: 11, z: -3 }],
    ['solar panels', { x: 9, y: 10, z: -10.5 }],
    ['ice depot', { x: 5.5, y: 10, z: 9.5 }],
  ])('protects the %s', (_, pos) => {
    expect(isInsideShieldZone(pos)).toBe(true);
  });

  it.each([
    ['ice crater', { x: 22, y: 10, z: -22 }],
    ['crater rim', { x: 0, y: 12, z: 45 }],
    ['high above the dome', { x: -4, y: SHIELD_ZONE.CENTER.y + SHIELD_ZONE.RADIUS + 1, z: 0 }],
  ])('does not protect the %s', (_, pos) => {
    expect(isInsideShieldZone(pos)).toBe(false);
  });
});
