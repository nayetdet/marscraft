import { describe, expect, it } from 'vitest';
import { isCustomMachineType, machineModalTitle, renderMachineMonitorHtml, type MachineViewData } from './machineViews.ts';

function baseData(over: Partial<MachineViewData> = {}): MachineViewData {
  return {
    type: 'console',
    notice: '',
    energy: 80,
    oxygen: 95,
    maxStat: 100,
    health: 90,
    food: 85,
    baseWater: 600,
    maxBaseWater: 1200,
    regolith: 4,
    objective: 'Build water shield',
    filter: 88,
    co2: 5,
    contaminated: false,
    science: 60,
    scienceSent: 4,
    scienceGoal: 10,
    samples: 1,
    stormSkipAllowed: false,
    stormSkipLabel: 'WAIT OUT THE STORM (no solar storm right now)',
    analyzedSamples: 1,
    upgraded: false,
    toolUpgraded: false,
    boneDensity: 92,
    muscleStrength: 90,
    dose: { transit: 365, eva: 3, storm: 0, habitat: 1, reactor: 0, total: 369, limit: 600, grounded: false },
    oxygenMode: 'electrolysis',
    sabatier: false,
    waterUsedL: 4.5,
    stormPhase: 'none',
    shelterWaterL: 40,
    shelterBlockedPct: 50,
    graywater: 8.5,
    cold: false,
    isNight: false,
    crewStations: [{ name: 'Greenhouse', health: 0.72 }, { name: 'Water Recycler', health: 1 }],
    commsBlackout: false,
    commsDistanceMkm: 225,
    commsLightMin: 12.5,
    commsDate: '15/11/2026',
    commsPending: false,
    donkiLive: false,
    donkiLabel: 'Saved data',
    donkiBulletin: '',
    pkgItems: 2,
    pkgPoints: 3,
    pkgCost: 12,
    sentDiscoveries: 1,
    sentSamples: 0,
    totalDiscoveries: 3,
    totalSamples: 1,
    radlabHtml: '<div class="radlab-chart">RADLAB</div>',
    medbayBoneFact: 'On the Space Station, bones get about 1% less dense every month.',
    links: [['NASA Example', 'https://www.nasa.gov/']],
    ...over,
  };
}

describe('machineViews', () => {
  it('recognizes all 5 custom machine station types', () => {
    for (const type of ['console', 'power', 'medical', 'science', 'shelter']) {
      expect(isCustomMachineType(type)).toBe(true);
      expect(machineModalTitle(type)).not.toBe('STATION');
    }
    expect(isCustomMachineType('greenhouse')).toBe(false);
    // A cozinha nao tem painel: o cozinheiro faz a racao com [F] (ato 3, #409)
    expect(isCustomMachineType('galley')).toBe(false);
    expect(machineModalTitle('galley')).toBe('STATION');
    expect(isCustomMachineType('powerroom')).toBe(false);
  });

  it('renders every machine with pixel-art SVG, minimal controls, and NASA info button', () => {
    const expectedActions: Record<MachineViewData['type'], string[]> = {
      console: ['send', 'upgrade', 'mission'],
      power: ['o2mode:electrolysis', 'o2mode:moxie', 'filter', 'buildSabatier'],
      medical: ['treat'],
      science: ['analyze', 'sendScience', 'send', 'upgrade', 'upgradeTool'],
      shelter: [],
    };

    for (const [type, actions] of Object.entries(expectedActions) as [MachineViewData['type'], string[]][]) {
      const html = renderMachineMonitorHtml(baseData({ type }));
      expect(html).toContain(`data-machine="${type}"`);
      expect(html).toContain('mc-scene-svg');
      expect(html).toContain('shape-rendering="crispEdges"');
      expect(html).toContain('class="mc-nasa-learn"');
      expect(html).toContain('NASA DATA');
      expect(html).toContain('https://www.nasa.gov/');
      for (const action of actions) {
        expect(html).toContain(`data-action="${action}"`);
      }
    }
  });

  it('limits the shelter slider to water that can be moved between wall and tank', () => {
    const html = renderMachineMonitorHtml(baseData({ type: 'shelter', shelterWaterL: 24, baseWater: 0 }));
    expect(html).toContain('id="shelter-water-slider"');
    expect(html).toContain('max="24"');
  });

  it('embeds the RadLab chart inside the medbay NASA popover', () => {
    const html = renderMachineMonitorHtml(baseData({ type: 'medical' }));
    expect(html).toContain('mc-nasa-chart');
    expect(html).toContain('RADLAB');
  });

  it('escapes notice and objective text safely', () => {
    const html = renderMachineMonitorHtml(baseData({ type: 'console', objective: '<script>x</script>', notice: '<b>ok</b>' }));
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<b>ok</b>');
  });

  it('shows air factory pixel monitor, amounts, and exclusive toggles without text bloat', () => {
    const normal = renderMachineMonitorHtml(baseData({ type: 'power', regolith: 4, co2: 5, filter: 88, baseWater: 600, oxygen: 95, energy: 80 }));
    expect(normal).toContain('600.0 L');
    expect(normal).toContain('80%');
    expect(normal).toContain('95%');
    expect(normal).toContain('WATER');
    expect(normal).toContain('MARS AIR');
    expect(normal).toContain('AIR ROOM');
    expect(normal).toContain('OXYGEN');
    expect(normal).toContain('4/3');
    expect(normal).toContain('+50% H2O');
    expect(normal).toContain('FILTER');
    expect(normal).toContain('88%');
    expect(normal).toContain('Making O2 from water');
    expect(normal).toContain('data-action="o2mode:electrolysis" aria-pressed="true"');
    expect(normal).toContain('data-action="o2mode:moxie" aria-pressed="false"');
    expect(normal).toContain('mc-air-toggle is-on');
    expect(normal).toContain('mc-air-toggle is-off');
    const afterClick = renderMachineMonitorHtml(baseData({ type: 'power', notice: 'A long confirmation message' }));
    expect(afterClick).not.toContain('A long confirmation message');

    const moxie = renderMachineMonitorHtml(baseData({ type: 'power', oxygenMode: 'moxie' }));
    expect(moxie).toContain('data-action="o2mode:electrolysis" aria-pressed="false"');
    expect(moxie).toContain('data-action="o2mode:moxie" aria-pressed="true"');

    const noWater = renderMachineMonitorHtml(baseData({ type: 'power', oxygenMode: 'electrolysis', baseWater: 0, oxygenBlocked: 'water' }));
    expect(noWater).toContain('NO WATER!');
    expect(noWater).toContain('Use Mars air!');

    const highCo2 = renderMachineMonitorHtml(baseData({ type: 'power', co2: 45, filter: 0 }));
    expect(highCo2).toContain('CO2');
    expect(highCo2).toContain('Replace CO2 filter!');

    const dusty = renderMachineMonitorHtml(baseData({ type: 'power', contaminated: true }));
    expect(dusty).toContain('DUST');
    expect(dusty).toContain('data-action="cleanBase"');
  });

  it('shows the list of finds as the lab stage and prices upgrades in science points (issue #269)', () => {
    const plain = renderMachineMonitorHtml(baseData({ type: 'science' }));
    expect(plain).toContain('mc-scene-svg');
    const html = renderMachineMonitorHtml(baseData({ type: 'science', sciencePanelHtml: '<div class="sci-panel">LIST</div>', science: 3 }));
    expect(html).toContain('mc-sci-stage');
    expect(html).toContain('<div class="sci-panel">LIST</div>');
    expect(html).toContain('4/10'); // pontos enviados da meta
    expect(html).toContain('SEND 3 PTS TO EARTH');
    // 3 pontos esperando nao pagam a melhoria de 4
    expect(html).toMatch(/data-action="upgrade"[^>]*disabled/);
  });

  it('offers the storm time skip in the shelter only when it is allowed (issue #228)', () => {
    const locked = renderMachineMonitorHtml(baseData({ type: 'shelter' }));
    expect(locked).toMatch(/data-action="waitStorm"[^>]*disabled/);
    expect(locked).toContain('no solar storm right now');
    const open = renderMachineMonitorHtml(baseData({ type: 'shelter', stormSkipAllowed: true, stormSkipLabel: 'WAIT OUT THE STORM (time runs fast)' }));
    expect(open).not.toMatch(/data-action="waitStorm"[^>]*disabled/);
  });
});
