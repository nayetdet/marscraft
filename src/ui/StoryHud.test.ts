import { afterEach, describe, expect, it, vi } from 'vitest';
import { getLanguage, setLanguage, translate } from './i18n.ts';
import { StoryHud } from './StoryHud.ts';

function fakeElement() {
  return {
    className: '',
    textContent: '',
    innerHTML: '',
    children: [] as ReturnType<typeof fakeElement>[],
    classList: { toggle: vi.fn() },
    style: { setProperty: vi.fn() },
    append(...nodes: ReturnType<typeof fakeElement>[]) { this.children.push(...nodes); },
    appendChild<T extends ReturnType<typeof fakeElement>>(node: T): T { this.children.push(node); return node; },
    replaceChildren(...nodes: ReturnType<typeof fakeElement>[]) { this.children = [...nodes]; },
    setAttribute: vi.fn(),
  };
}

describe('StoryHud localization', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    setLanguage('en');
  });

  it('translates tutorial card lines before the typewriter splits them into characters', () => {
    setLanguage('pt-BR');
    const body = fakeElement();
    const hud = {
      bodyEl: body,
      cardEl: fakeElement(),
      _typeChars: [],
      _typed: 0,
      _typeTime: 0,
      _cardSeconds: 10,
      _reducedMotion: true,
    };
    Object.assign(hud, { _typedText: StoryHud.prototype._typedText });
    vi.stubGlobal('document', { createElement: fakeElement });

    StoryHud.prototype._renderBody.call(hud, {
      lines: [{ icon: 'rocket', text: 'Mission: find 3 clues, then fly home' }],
    });

    expect(body.children[0].children[1].textContent).toBe('Missão: encontre 3 pistas e depois volte para casa');
    expect(translate('Resume', getLanguage())).toBe('Continuar');
    expect(translate('Resume', 'es')).toBe('Reanudar');
  });
});
