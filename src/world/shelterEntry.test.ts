import { describe, expect, it } from 'vitest';
import { PHYSICS_CONFIG } from '../config/constants.ts';
import { HABITAT_LAYOUT } from './habitatLayout.ts';
import { ShelterEntry } from './shelterEntry.ts';

describe('shelter entry', () => {
  const floor = HABITAT_LAYOUT.FLOOR_Y + 1;
  const inside = { x: 4, y: floor + PHYSICS_CONFIG.PLAYER_HEIGHT, z: 4.8 };
  const outside = { ...inside, x: 2 };

  it('opens once on entry and opens again after leaving and returning', () => {
    const entry = new ShelterEntry();
    expect(entry.update(outside)).toBe(false);
    expect(entry.update(inside)).toBe(true);
    expect(entry.update(inside)).toBe(false);
    expect(entry.update(outside)).toBe(false);
    expect(entry.update(inside)).toBe(true);
  });

  it('does not treat the roof or space below the floor as the shelter', () => {
    const entry = new ShelterEntry();
    expect(entry.update({ ...inside, y: floor + HABITAT_LAYOUT.SHELTER_HEIGHT + PHYSICS_CONFIG.PLAYER_HEIGHT })).toBe(false);
    expect(entry.update({ ...inside, y: floor })).toBe(false);
    expect(entry.update(inside)).toBe(true);
  });
});
