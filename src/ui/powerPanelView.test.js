import { describe, it, expect } from 'vitest';
import { ENERGY_CONFIG } from '../config/constants.js';
import { hoursToSunrise, powerPanelHtml, powerPanelModel } from './powerPanelView.js';

const loads = (over = {}) => [
  ['Crew air: water', 1.5, true, null],
  ['Crew at work', 2, true, null],
  ['Greenhouse lights', 1.25, over.lights ?? true, 'lights'],
  ['Heater', 2, true, 'heater'],
  ['Radiation shield', ENERGY_CONFIG.SHIELD_DRAIN_PER_HOUR, over.shield ?? false, 'shield'],
  ['Fuel factory', 0, true, 'factory'],
];
const state = (over = {}) => ({
  batteryPct: 60, timeOfDay: 12, solarRate: 15, solarReason: 'clear sky', panelDustPct: 10,
  reactorOn: false, standby: false, cold: false, outsideTemp: '-20 C', easyStartPct: null, loads: loads(over), ...over,
});

describe('power panel view', () => {
  it('counts the hours to sunrise only at night', () => {
    expect(hoursToSunrise(12)).toBe(0);
    expect(hoursToSunrise(18)).toBe(12);
    expect(hoursToSunrise(3)).toBe(3);
  });

  it('shows the net flow and how long the battery lasts', () => {
    const day = powerPanelModel(state());
    expect(day.net.tone).toBe('up');
    expect(day.forecast).toMatch(/^Full in about/);
    const night = powerPanelModel(state({ timeOfDay: 22, solarRate: 0 }));
    expect(night.net.tone).toBe('down');
    expect(night.forecast).toMatch(/^Empty in about/);
    expect(night.sources[0].rate).toBe('NIGHT');
  });

  it('only what can be switched off gets a switch', () => {
    const model = powerPanelModel(state());
    expect(model.loads.map((l) => l.toggle)).toEqual([null, null, 'lights', 'heater', 'shield', 'factory']);
    expect(model.loads[4].rate).toBe('OFF');
    expect(model.loads[5].rate).toBe('idle');
  });

  it('with an empty battery at night the one tip is the reactor, and it says the cost', () => {
    const model = powerPanelModel(state({ batteryPct: 0, timeOfDay: 23, solarRate: 0, standby: true }));
    expect(model.tip.tone).toBe('danger');
    expect(model.tip.text).toContain('fission reactor');
    expect(model.tip.text).toContain('radiation');
    const reactor = model.sources.find((s) => s.id === 'reactor');
    expect(reactor.toggle).toBe('reactor');
    expect(reactor.note).toContain('mSv');
  });

  it('warns when the battery will not reach sunrise, and to turn the reactor off by day', () => {
    const short = powerPanelModel(state({ batteryPct: 20, timeOfDay: 20, solarRate: 0 }));
    expect(short.tip.text).toContain('before sunrise');
    const wasteful = powerPanelModel(state({ batteryPct: 90, reactorOn: true }));
    expect(wasteful.tip.text).toContain('Turn the reactor off');
    expect(wasteful.sources.find((s) => s.id === 'reactor').rate).toBe(`+${ENERGY_CONFIG.REACTOR_CHARGE_PER_HOUR.toFixed(1)}%/h`);
  });

  it('points to the solar field when the panels are dusty', () => {
    expect(powerPanelModel(state({ panelDustPct: 45 })).sources[0].note).toContain('solar field');
    expect(powerPanelModel(state({ panelDustPct: 10 })).sources[0].note).not.toContain('solar field');
  });

  it('draws a switch button for each toggle', () => {
    const html = powerPanelHtml(powerPanelModel(state()));
    for (const id of ['reactor', 'lights', 'heater', 'shield', 'factory']) expect(html).toContain(`data-action="toggle:${id}"`);
  });
});
