import { describe, expect, it } from 'vitest';
import { mavCue, mavNasaPopoverHtml, renderMavStageSvg, type MavPanelViewData } from './mavPanelView.ts';

function baseMav(over: Partial<MavPanelViewData> = {}): MavPanelViewData {
  return {
    propellantPct: 50,
    overallPct: 50,
    ready: false,
    factoryOn: true,
    batteryPct: 80,
    iceInBag: 2,
    iceWaiting: 2,
    iceNeeded: 3,
    storms: 1,
    stormsNeeded: 3,
    dataSent: false,
    sampleTubes: 1,
    maxSampleTubes: 3,
    analyzedSamples: 2,
    icePerTube: 2,
    ...over,
  };
}

describe('mavPanelView', () => {
  it('renders cutaway fuel tank, ice hopper, sample tubes, and 3 checklist indicators in pixel SVG', () => {
    const svg = renderMavStageSvg(baseMav());
    expect(svg).toContain('shape-rendering="crispEdges"');
    expect(svg).toContain('50%');
    expect(svg).toContain('1.FUEL');
    expect(svg).toContain('3 ICE');
    expect(svg).toContain('2.STORM');
    expect(svg).toContain('3.DATA');
  });

  it('shows short visual cues for factory off, no battery, and launch ready', () => {
    expect(mavCue(baseMav({ factoryOn: false, iceWaiting: 2 }))).toEqual({
      tag: 'OFF',
      text: 'Turn Factory ON!',
      tone: 'warn',
    });
    expect(mavCue(baseMav({ batteryPct: 0, iceWaiting: 2 }))).toEqual({
      tag: '0% PWR',
      text: 'Need battery power!',
      tone: 'danger',
    });
    expect(mavCue(baseMav({ ready: true, propellantPct: 100, storms: 3, dataSent: true }))).toEqual({
      tag: 'GO',
      text: 'Ready for liftoff!',
      tone: 'ok',
    });
  });

  it('puts detailed NASA explanation inside the collapsible NASA popover', () => {
    const nasa = mavNasaPopoverHtml();
    expect(nasa).toContain('class="mc-nasa-learn"');
    expect(nasa).toContain('ISRU');
  });
});
