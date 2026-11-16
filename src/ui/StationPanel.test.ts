import { afterEach, describe, expect, it, vi } from 'vitest';
import { StationPanel } from './StationPanel.ts';

describe('Earth radio action', () => {
  it('closes the station and records the call when transmission starts', () => {
    const panel = Object.create(StationPanel.prototype) as StationPanel;
    const stations = { messageTimer: 0, send: vi.fn(() => { stations.messageTimer = 10; return 'Sending'; }) };
    const tutorialCounts = { earthCalls: 0 };
    const close = vi.fn();
    Object.assign(panel, { engine: { stations, tutorialCounts, radioOptions: () => ({}) }, close });

    expect(panel.perform('send')).toBe('Sending');
    expect(tutorialCounts.earthCalls).toBe(1);
    expect(close).toHaveBeenCalledOnce();
  });

  it.each([0, 10])('keeps the station open when a new transmission does not start (timer %s)', (timer) => {
    const panel = Object.create(StationPanel.prototype) as StationPanel;
    const tutorialCounts = { earthCalls: 0 };
    const close = vi.fn();
    Object.assign(panel, { engine: { stations: { messageTimer: timer, send: () => 'Unavailable' }, tutorialCounts, radioOptions: () => ({}) }, close });

    expect(panel.perform('send')).toBe('Unavailable');
    expect(tutorialCounts.earthCalls).toBe(0);
    expect(close).not.toHaveBeenCalled();
  });
});

describe('greenhouse drag audio', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('plays once when the pointer crosses the drag threshold, never on each move', () => {
    const playUiClick = vi.fn();
    const tag = { textContent: '', className: '' };
    const ghost = {
      className: '',
      innerHTML: '',
      style: {} as Record<string, string>,
      querySelector: vi.fn(() => tag),
    };
    vi.stubGlobal('document', {
      createElement: vi.fn(() => ghost),
      body: { appendChild: vi.fn() },
    });

    const panel = Object.create(StationPanel.prototype) as StationPanel;
    Object.assign(panel, {
      engine: { audio: { playUiClick } },
      isOpen: true,
      type: 'greenhouse',
      selectedCrop: 'lettuce',
      cropIcons: { lettuce: 'data:image/png;base64,' },
      ghNotice: '',
      greenhouseContainer: { querySelectorAll: vi.fn(() => []) },
      _ghDrag: {
        cropType: 'lettuce',
        startX: 10,
        startY: 10,
        active: false,
        hoveredPlotEl: null,
      },
      _ghGhost: null,
      _plotElAt: vi.fn(() => null),
    });

    panel._onGhPointerMove({ clientX: 15, clientY: 10 } as PointerEvent);
    expect(playUiClick).not.toHaveBeenCalled();

    panel._onGhPointerMove({ clientX: 16, clientY: 10 } as PointerEvent);
    expect(playUiClick).toHaveBeenCalledOnce();

    panel._onGhPointerMove({ clientX: 30, clientY: 10 } as PointerEvent);
    expect(playUiClick).toHaveBeenCalledOnce();
  });
});
