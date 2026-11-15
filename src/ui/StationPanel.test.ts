import { afterEach, describe, expect, it, vi } from 'vitest';
import { StationPanel } from './StationPanel.ts';

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
