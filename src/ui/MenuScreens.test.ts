// @ts-nocheck
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MenuScreens } from './MenuScreens.ts';

function makeElement() {
  const listeners = new Map();
  const overlay = { classList: { add: vi.fn(), remove: vi.fn() } };
  const card = { parentElement: { closest: vi.fn(() => overlay) } };
  return {
    value: '',
    textContent: '',
    classList: { add: vi.fn(), remove: vi.fn() },
    closest: vi.fn(() => card),
    addEventListener: vi.fn((type, handler) => listeners.set(type, handler)),
    setAttribute: vi.fn(),
    fire(type, event = {}) { listeners.get(type)?.(event); },
  };
}

function makeDocument() {
  const ids = [
    'menu-main', 'demo-feedback', 'sources-terrain-coords', 'sources-terrain-date', 'sources-donki-date',
    'sources-screen', 'sources-btn', 'sources-back-btn',
    'options-screen', 'options-btn', 'options-back-btn',
    'language-select',
    'demo-screen', 'demo-btn', 'demo-back-btn',
    'shaders-btn', 'volume-slider', 'volume-value',
  ];
  const elements = new Map(ids.map((id) => [id, makeElement()]));
  return {
    elements,
    document: { getElementById: (id) => elements.get(id) },
  };
}

describe('MenuScreens volume controls', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('previews live slider changes and the final committed level', () => {
    const { document, elements } = makeDocument();
    vi.stubGlobal('document', document);
    const onVolumeChange = vi.fn();
    const onVolumePreview = vi.fn();
    new MenuScreens({
      donkiDate: '15/11/2026',
      onDemo: vi.fn(),
      volume: 1,
      onVolumeChange,
      onVolumePreview,
    });

    const slider = elements.get('volume-slider');
    slider.value = '42';
    slider.fire('input');

    expect(elements.get('volume-value').value).toBe('42%');
    expect(onVolumeChange).toHaveBeenCalledWith(0.42);
    expect(onVolumePreview).toHaveBeenCalledOnce();
    expect(onVolumePreview.mock.calls[0]).toEqual([]);

    slider.fire('change');
    expect(onVolumePreview).toHaveBeenLastCalledWith({ final: true });
  });
});

describe('MenuScreens language control', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('selects the saved language and applies valid language changes', () => {
    const { document, elements } = makeDocument();
    vi.stubGlobal('document', document);
    const onLanguageChange = vi.fn();
    new MenuScreens({
      donkiDate: '15/11/2026',
      onDemo: vi.fn(),
      onLanguageChange,
    });

    const select = elements.get('language-select');
    expect(select.value).toBe('en');
    select.value = 'es';
    select.fire('change');
    expect(onLanguageChange).toHaveBeenCalledWith('es');

    select.value = 'fr';
    select.fire('change');
    expect(onLanguageChange).toHaveBeenCalledOnce();
  });
});
