import { describe, expect, it } from 'vitest';
import { CROP_CONFIG } from '../config/constants.js';
import { GREENHOUSE_PLOTS } from '../world/greenhouseLayout.js';
import { greenhouseMapSvg, plotMapLabel, plotStatus } from './greenhouseMap.js';

const emptyPlots = () => GREENHOUSE_PLOTS.map(() => ({ crop: null }));

describe('greenhouse map', () => {
  it('draws one clickable area per plot and marks the selected one', () => {
    const svg = greenhouseMapSvg(emptyPlots(), 3);
    GREENHOUSE_PLOTS.forEach((plot, i) => {
      expect(svg).toContain(`data-action="plot:${i}"`);
      expect(svg).toContain(`>${plot.id}</text>`);
    });
    expect(svg.match(/is-selected/g)).toHaveLength(1);
    expect(svg).toMatch(/class="gh-plot is-empty is-selected" data-action="plot:3"/);
  });

  it('shows growth as a percentage and then READY', () => {
    const plots = emptyPlots();
    plots[1].crop = { type: 'lettuce', progress: CROP_CONFIG.lettuce.seconds / 2 };
    plots[5].crop = { type: 'soy', progress: CROP_CONFIG.soy.seconds };
    expect(plotStatus(plots[0])).toEqual({ state: 'empty', label: '', pct: 0 });
    expect(plotMapLabel(plots[1])).toBe('50%');
    expect(plotMapLabel(plots[5])).toBe('READY');
    const svg = greenhouseMapSvg(plots, 0);
    expect(svg).toMatch(/is-growing" data-action="plot:1"/);
    expect(svg).toMatch(/is-ready" data-action="plot:5"/);
  });
});
