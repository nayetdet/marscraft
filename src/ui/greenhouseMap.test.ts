// @ts-nocheck
import { describe, expect, it } from 'vitest';
import { CROP_CONFIG } from '../config/constants.ts';
import { GREENHOUSE_PLOTS } from '../world/greenhouseLayout.ts';
import { greenhouseMapSvg, plotMapLabel, plotRingDash, plotStatus } from './greenhouseMap.ts';

const emptyPlots = () => GREENHOUSE_PLOTS.map(() => ({ crop: null }));

describe('greenhouse map', () => {
  it('draws one clickable area per plot with its yield multiplier and marks the selected one', () => {
    const svg = greenhouseMapSvg(emptyPlots(), 3);
    GREENHOUSE_PLOTS.forEach((plot, i) => {
      expect(svg).toContain(`data-action="plot:${i}"`);
      expect(svg).toContain(`data-plot-id="${plot.id}"`);
      expect(svg).toContain(`>${plot.yield}x</text>`);
    });
    expect(svg).toContain('shape-rendering="crispEdges"');
    expect(svg).toContain('gh-bed-tile');
    expect(svg.match(/is-selected/g)).toHaveLength(1);
    expect(svg).toMatch(/class="gh-plot is-empty is-selected" data-action="plot:3"/);
  });

  it('shows growth as a percentage with crop art and then READY', () => {
    const plots = emptyPlots();
    plots[1].crop = { type: 'lettuce', progress: CROP_CONFIG.lettuce.seconds / 2 };
    plots[5].crop = { type: 'soy', progress: CROP_CONFIG.soy.seconds };
    expect(plotStatus(plots[0])).toEqual({ state: 'empty', label: '', pct: 0 });
    expect(plotMapLabel(plots[1])).toBe('50%');
    expect(plotMapLabel(plots[5])).toBe('READY');
    const svg = greenhouseMapSvg(plots, 0);
    expect(svg).toMatch(/is-growing" data-action="plot:1"/);
    expect(svg).toMatch(/is-ready" data-action="plot:5"/);
    expect(svg).toContain('gh-map-crop');
  });

  it('draws a progress ring only on planted beds, full when READY', () => {
    const plots = emptyPlots();
    plots[1].crop = { type: 'lettuce', progress: CROP_CONFIG.lettuce.seconds / 4 };
    plots[5].crop = { type: 'soy', progress: CROP_CONFIG.soy.seconds * 2 };
    expect(plotRingDash(plots[1])).toBe('25 100');
    expect(plotRingDash(plots[5])).toBe('100 100');
    expect(plotRingDash(plots[0])).toBe('0 100');
    const svg = greenhouseMapSvg(plots, 0);
    expect(svg.match(/class="gh-plot-ring"/g)).toHaveLength(2);
    expect(svg).toMatch(/data-plot-ring="1"[^>]*stroke-dasharray="25 100"/);
    expect(svg).toMatch(/data-plot-ring="5"[^>]*stroke-dasharray="100 100"/);
    expect(svg).not.toContain('data-plot-ring="0"');
  });

  it('marks empty plots as locked when water or power is not enough for the selected crop', () => {
    const svg = greenhouseMapSvg(emptyPlots(), -1, { selectedCrop: 'soy', water: 4, energy: 80 });
    // Garden (1x) needs 3 L -> affordable; inner (2x) needs 6 L and outer (3x) needs 9 L -> locked
    expect(svg).toMatch(/class="gh-plot is-empty" data-action="plot:0"/);
    expect(svg).toMatch(/class="gh-plot is-empty is-locked" data-action="plot:1"/);
    expect(svg).toMatch(/class="gh-plot is-empty is-locked" data-action="plot:5"/);
  });
});
