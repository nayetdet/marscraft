import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_PLAYER_APPEARANCE,
  PLAYER_GENDERS,
  PLAYER_HAIR_COLORS,
  PLAYER_HAIR_LENGTHS,
  PLAYER_HAIR_TYPES,
  PLAYER_SKIN_TONES,
} from '../crew/playerAppearance.ts';
import { CharacterCreator } from './CharacterCreator.ts';

function createClassList(initial: string[] = []) {
  const set = new Set(initial);
  return {
    add: (...names: string[]) => names.forEach((n) => set.add(n)),
    remove: (...names: string[]) => names.forEach((n) => set.delete(n)),
    toggle: (name: string, force?: boolean) => {
      const next = force === undefined ? !set.has(name) : force;
      if (next) set.add(name);
      else set.delete(name);
      return next;
    },
    contains: (name: string) => set.has(name),
  };
}

interface MockOptionBtn {
  dataset: { charField: string; charVal: string };
  classList: ReturnType<typeof createClassList>;
  attrs: Record<string, string>;
  setAttribute: (name: string, value: string) => void;
  closest: (selector: string) => MockOptionBtn | null;
}

function makeButton() {
  const listeners = new Map<string, (event?: unknown) => void>();
  const attrs: Record<string, string> = {};
  return {
    classList: createClassList(),
    attrs,
    setAttribute: vi.fn((k: string, v: string) => { attrs[k] = v; }),
    addEventListener: vi.fn((type: string, handler: (event?: unknown) => void) => listeners.set(type, handler)),
    fire(type: string, event: unknown = {}) { listeners.get(type)?.(event); },
  };
}

function makeCharacterDom() {
  const overlayClasses = createClassList(['hidden']);
  const bodyClasses = createClassList();
  const overlay = { classList: overlayClasses };
  const screen = { classList: createClassList(['hidden']) };

  const optionButtons: MockOptionBtn[] = [];
  const optionsListeners = new Map<string, (event: unknown) => void>();
  let renderedHtml = '';
  const styleProps: Record<string, string> = {};

  const optionsRoot = {
    style: {
      setProperty: (k: string, v: string) => { styleProps[k] = v; },
    },
    get innerHTML() {
      return renderedHtml;
    },
    set innerHTML(html: string) {
      renderedHtml = html;
      optionButtons.length = 0;
      const matches = html.matchAll(/data-char-field="([^"]+)"\s+data-char-val="([^"]+)"/g);
      for (const m of matches) {
        const btn: MockOptionBtn = {
          dataset: { charField: m[1], charVal: m[2] },
          classList: createClassList(),
          attrs: {},
          setAttribute: (k, v) => { btn.attrs[k] = v; },
          closest: (sel: string) => (sel === '[data-char-field]' ? btn : null),
        };
        optionButtons.push(btn);
      }
    },
    querySelectorAll: () => optionButtons,
    addEventListener: (type: string, handler: (event: unknown) => void) => optionsListeners.set(type, handler),
    clickOption(field: string, val: string) {
      const target = optionButtons.find((b) => b.dataset.charField === field && b.dataset.charVal === val);
      optionsListeners.get('click')?.({ target });
    },
  };

  const startBtn = makeButton();
  const suitIvaBtn = makeButton();
  const suitEvaBtn = makeButton();
  const previewCanvas = { parentElement: {} };

  const elements: Record<string, unknown> = {
    'character-overlay': overlay,
    'character-screen': screen,
    'character-options': optionsRoot,
    'character-start-btn': startBtn,
    'char-suit-iva': suitIvaBtn,
    'char-suit-eva': suitEvaBtn,
    'character-preview-canvas': previewCanvas,
  };

  return {
    document: {
      body: { classList: bodyClasses },
      getElementById: (id: string) => elements[id] ?? null,
    },
    screen,
    overlayClasses,
    bodyClasses,
    optionsRoot,
    optionButtons,
    styleProps,
    startBtn,
    suitIvaBtn,
    suitEvaBtn,
  };
}

describe('CharacterCreator', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('renders visual templates for sex, hair type, and hair length plus skin and hair color swatches', () => {
    const dom = makeCharacterDom();
    vi.stubGlobal('document', dom.document);
    const preview = { start: vi.fn(), stop: vi.fn(), setState: vi.fn(), setAppearance: vi.fn() };

    new CharacterCreator({ createPreview: () => preview });

    expect(dom.optionButtons).toHaveLength(
      PLAYER_GENDERS.length
      + PLAYER_SKIN_TONES.length
      + PLAYER_HAIR_TYPES.length
      + PLAYER_HAIR_LENGTHS.length
      + PLAYER_HAIR_COLORS.length,
    );
    expect(dom.optionsRoot.innerHTML).toContain('<svg class="char-tpl-svg"');
    expect(dom.optionsRoot.innerHTML).toContain('char-swatch-btn');
    expect(dom.styleProps['--tpl-skin']).toBeDefined();
    expect(dom.styleProps['--tpl-hair']).toBeDefined();
  });

  it('updates live 3D preview and template CSS variables when options are clicked, and persists on confirm', () => {
    const dom = makeCharacterDom();
    vi.stubGlobal('document', dom.document);
    const preview = { start: vi.fn(), stop: vi.fn(), setState: vi.fn(), setAppearance: vi.fn() };
    const onConfirm = vi.fn();

    const creator = new CharacterCreator({ createPreview: () => preview });
    creator.open(DEFAULT_PLAYER_APPEARANCE, onConfirm);

    expect(creator.isOpen()).toBe(true);
    expect(dom.overlayClasses.contains('hidden')).toBe(false);
    expect(dom.screen.classList.contains('hidden')).toBe(false);
    expect(dom.bodyClasses.contains('character-open')).toBe(true);
    expect(preview.start).toHaveBeenCalledOnce();

    dom.optionsRoot.clickOption('gender', 'man');
    dom.optionsRoot.clickOption('skinTone', 'deep');
    dom.optionsRoot.clickOption('hairType', 'coily');
    dom.optionsRoot.clickOption('hairLength', 'long');
    dom.optionsRoot.clickOption('hairColor', 'blonde');

    expect(dom.styleProps['--tpl-skin']).toBe('#5c331c');
    expect(dom.styleProps['--tpl-hair']).toBe('#d4a24c');
    expect(preview.setAppearance).toHaveBeenLastCalledWith(expect.objectContaining({
      gender: 'man',
      skin: '#5c331c',
      hair: '#d4a24c',
      hairStyle: 'coily_long',
      hairType: 'coily',
      hairLength: 'long',
    }));

    dom.suitEvaBtn.fire('click');
    expect(preview.setState).toHaveBeenLastCalledWith({ equipped: true });

    dom.startBtn.fire('click');
    expect(creator.isOpen()).toBe(false);
    expect(dom.overlayClasses.contains('hidden')).toBe(true);
    expect(dom.screen.classList.contains('hidden')).toBe(true);
    expect(dom.bodyClasses.contains('character-open')).toBe(false);
    expect(preview.stop).toHaveBeenCalledOnce();
    expect(onConfirm).toHaveBeenCalledWith({
      gender: 'man',
      skinTone: 'deep',
      hairType: 'coily',
      hairLength: 'long',
      hairColor: 'blonde',
    });
  });

  it('closes cleanly without invoking onConfirm when closed directly', () => {
    const dom = makeCharacterDom();
    vi.stubGlobal('document', dom.document);
    const preview = { start: vi.fn(), stop: vi.fn(), setState: vi.fn(), setAppearance: vi.fn() };
    const onConfirm = vi.fn();

    const creator = new CharacterCreator({ createPreview: () => preview });
    creator.open(DEFAULT_PLAYER_APPEARANCE, onConfirm);
    creator.close();

    expect(creator.isOpen()).toBe(false);
    expect(dom.overlayClasses.contains('hidden')).toBe(true);
    expect(dom.bodyClasses.contains('character-open')).toBe(false);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
