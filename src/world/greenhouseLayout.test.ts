// @ts-nocheck
import { describe, expect, it } from 'vitest';
import { GARDEN_CROP_BED, GREENHOUSE_CENTER, GREENHOUSE_MONITOR_POS, isGreenhouseBed, GREENHOUSE_PLOTS, PLOT_PLANT_CELLS, plotIndexAt } from './greenhouseLayout.ts';
import { HABITAT_LAYOUT, domeFloorCell } from './habitatLayout.ts';

describe('greenhouse beds', () => {
  it('grows the garden crop on a bed and places the monitor beside it', () => {
    const { dx, dz } = GARDEN_CROP_BED;
    expect(isGreenhouseBed(dx, dz)).toBe(true);
    const monDx = Math.floor(GREENHOUSE_MONITOR_POS.x - GREENHOUSE_CENTER.x);
    const monDz = Math.floor(GREENHOUSE_MONITOR_POS.z - GREENHOUSE_CENTER.z);
    expect(isGreenhouseBed(monDx, monDz)).toBe(false);
  });

  it('keeps walkways clear around the 2 x 2 garden bed', () => {
    const beds = [];
    for (let dx = -4; dx <= 4; dx++) for (let dz = -4; dz <= 4; dz++) {
      if (isGreenhouseBed(dx, dz)) beds.push([dx, dz]);
    }
    expect(isGreenhouseBed(0, 3)).toBe(false);
    expect(isGreenhouseBed(2, 0)).toBe(false);
    // The garden plot is a 2 x 2 block of soil beds; the rest of the dome floor is scenery trays.
    expect(isGreenhouseBed(4, 3)).toBe(true);
    expect(isGreenhouseBed(5, 3)).toBe(false);
    expect(beds).toHaveLength(4);
  });
});

describe('greenhouse plots', () => {
  it('gives every bed and every field tray to exactly one plot, and nothing on the walkways', () => {
    const counts = GREENHOUSE_PLOTS.map(() => 0);
    for (let dx = -HABITAT_LAYOUT.DOME_RADIUS; dx <= HABITAT_LAYOUT.DOME_RADIUS; dx++) {
      for (let dz = -HABITAT_LAYOUT.DOME_RADIUS; dz <= HABITAT_LAYOUT.DOME_RADIUS; dz++) {
        const index = plotIndexAt(dx, dz);
        const isPlanted = isGreenhouseBed(dx, dz) || domeFloorCell(dx, dz) === 'field';
        expect(index >= 0).toBe(isPlanted);
        if (index >= 0) counts[index]++;
      }
    }
    expect(counts[0]).toBe(4);
    expect(counts.every((n) => n > 0)).toBe(true);
    // The cross walkway is never part of a plot
    expect(plotIndexAt(0, 6)).toBe(-1);
    expect(plotIndexAt(6, 0)).toBe(-1);
  });

  it('names the fields by ring and quadrant, clockwise from the north-east', () => {
    expect(GREENHOUSE_PLOTS.map((plot) => plot.id)).toEqual(['G', 'A1', 'A2', 'A3', 'A4', 'B1', 'B2', 'B3', 'B4']);
    expect(GREENHOUSE_PLOTS[plotIndexAt(5, -5)].id).toBe('A1');
    expect(GREENHOUSE_PLOTS[plotIndexAt(-8, 8)].id).toBe('B3');
    expect(GREENHOUSE_PLOTS[plotIndexAt(3, 3)].id).toBe('G');
  });

  it('shows one plant per harvested item, each on a different tray of its own plot', () => {
    PLOT_PLANT_CELLS.forEach((cells, index) => {
      expect(cells).toHaveLength(GREENHOUSE_PLOTS[index].yield);
      for (const { dx, dz } of cells) expect(plotIndexAt(dx, dz)).toBe(index);
      expect(new Set(cells.map(({ dx, dz }) => `${dx},${dz}`)).size).toBe(cells.length);
    });
    expect(PLOT_PLANT_CELLS[0]).toEqual([GARDEN_CROP_BED]);
  });
});
