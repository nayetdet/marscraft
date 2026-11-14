import { describe, expect, it } from 'vitest';
import { GARDEN_CROP_BED, initialGreenhouseCrop, GREENHOUSE_CENTER, GREENHOUSE_MONITOR_POS, isGreenhouseBed, startsWithGreenhousePlant } from './greenhouseLayout.js';

describe('greenhouse beds', () => {
  it('reserves an empty bed for the crop grown through the garden panel and places the monitor beside it', () => {
    const { dx, dz } = GARDEN_CROP_BED;
    expect(isGreenhouseBed(dx, dz)).toBe(true);
    expect(startsWithGreenhousePlant(dx, dz)).toBe(false);
    const monDx = Math.floor(GREENHOUSE_MONITOR_POS.x - GREENHOUSE_CENTER.x);
    const monDz = Math.floor(GREENHOUSE_MONITOR_POS.z - GREENHOUSE_CENTER.z);
    expect(isGreenhouseBed(monDx, monDz)).toBe(false);
  });

  it('keeps walkways clear and provides both planted and empty beds', () => {
    const beds = [];
    for (let dx = -4; dx <= 4; dx++) for (let dz = -4; dz <= 4; dz++) {
      if (isGreenhouseBed(dx, dz)) beds.push([dx, dz]);
    }
    expect(beds.filter(([dx, dz]) => startsWithGreenhousePlant(dx, dz)).map(([dx, dz]) => initialGreenhouseCrop(dx, dz)).sort()).toEqual(['carrot', 'potato']);
    expect(beds.some(([dx, dz]) => !startsWithGreenhousePlant(dx, dz))).toBe(true);
    expect(isGreenhouseBed(0, 3)).toBe(false);
    expect(isGreenhouseBed(2, 0)).toBe(false);
    // The garden plot is a 2 x 2 block of soil beds; the rest of the dome floor is scenery trays.
    expect(isGreenhouseBed(4, 3)).toBe(true);
    expect(startsWithGreenhousePlant(4, 3)).toBe(false);
    expect(isGreenhouseBed(5, 3)).toBe(false);
    expect(beds).toHaveLength(4);
  });
});
