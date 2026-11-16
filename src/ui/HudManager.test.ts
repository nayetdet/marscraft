import { afterEach, describe, expect, it, vi } from 'vitest';
import { BLOCK_IDS } from '../config/blockTypes.ts';
import { HudManager } from './HudManager.ts';

function makeClassList(initial: string[] = []) {
  const set = new Set(initial);
  return {
    add: (...tokens: string[]) => tokens.forEach((t) => set.add(t)),
    remove: (...tokens: string[]) => tokens.forEach((t) => set.delete(t)),
    contains: (token: string) => set.has(token),
    toggle: (token: string, force?: boolean) => {
      const next = force ?? !set.has(token);
      if (next) set.add(token);
      else set.delete(token);
      return next;
    },
  };
}

function makeFakeSlot(index: number, container: { contains: (el: unknown) => boolean }) {
  const el = {
    dataset: { slotIndex: String(index) },
    classList: makeClassList(),
    closest: (selector: string) => (selector.includes('inventory-slot') ? el : null),
    _container: container,
  };
  return el;
}

function setupDragHarness(slots: Array<{ id: number; name: string; count: number } | null>) {
  const listeners = new Map<string, Set<(e: unknown) => void>>();
  const ghost = {
    className: '',
    innerHTML: '',
    style: {} as Record<string, string>,
    remove: vi.fn(),
  };
  const bodyClassList = makeClassList();
  const gridSlots: ReturnType<typeof makeFakeSlot>[] = [];
  const hotbarSlots: ReturnType<typeof makeFakeSlot>[] = [];

  const gridEl = {
    contains: (el: unknown) => gridSlots.includes(el as ReturnType<typeof makeFakeSlot>),
    querySelectorAll: () => [],
    innerHTML: '',
    appendChild: vi.fn(),
  };
  const hotbarEl = {
    contains: (el: unknown) => hotbarSlots.includes(el as ReturnType<typeof makeFakeSlot>),
    querySelectorAll: () => [],
    innerHTML: '',
    appendChild: vi.fn(),
  };

  for (let i = 0; i < 9; i++) hotbarSlots.push(makeFakeSlot(i, hotbarEl));
  for (let i = 9; i < 36; i++) gridSlots.push(makeFakeSlot(i, gridEl));

  const allSlots = [...hotbarSlots, ...gridSlots];
  let hitSlot: ReturnType<typeof makeFakeSlot> | null = null;

  vi.stubGlobal('window', {
    addEventListener: (type: string, fn: (e: unknown) => void) => {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type)!.add(fn);
    },
    removeEventListener: (type: string, fn: (e: unknown) => void) => {
      listeners.get(type)?.delete(fn);
    },
  });

  vi.stubGlobal('document', {
    createElement: vi.fn(() => ghost),
    body: {
      classList: bodyClassList,
      appendChild: vi.fn(),
    },
    elementsFromPoint: vi.fn(() => (hitSlot ? [hitSlot] : [])),
  });

  const onUiClick = vi.fn();
  const onInventorySwap = vi.fn((from: number, to: number) => {
    const next = [...slots];
    [next[from], next[to]] = [next[to], next[from]];
    return next;
  });

  const hud = Object.create(HudManager.prototype) as HudManager & Record<string, unknown>;
  Object.assign(hud, {
    previews: { [BLOCK_IDS.REGOLITH]: 'data:image/png;base64,regolith' },
    currentInventorySlots: slots,
    isInventoryOpen: true,
    selectedSlot: 0,
    inventorySelection: null,
    inventoryGridEl: gridEl,
    inventoryHotbarEl: hotbarEl,
    inventoryOverlayEl: { classList: makeClassList() },
    onUiClick,
    onInventorySwap,
    renderInventory: vi.fn((nextSlots: typeof slots) => {
      hud.currentInventorySlots = nextSlots;
    }),
    _invDrag: null,
    _invGhost: null,
    _suppressInvClick: false,
  });
  hud._onInvPointerMove = HudManager.prototype._onInvPointerMove.bind(hud);
  hud._onInvPointerUp = HudManager.prototype._onInvPointerUp.bind(hud);

  const emitWindow = (type: string, event: unknown) => {
    for (const fn of [...(listeners.get(type) ?? [])]) fn(event);
  };

  return {
    hud,
    ghost,
    bodyClassList,
    allSlots,
    setHitIndex: (idx: number | null) => {
      hitSlot = idx === null ? null : allSlots[idx];
    },
    emitWindow,
    onUiClick,
    onInventorySwap,
    listeners,
  };
}

describe('HudManager inventory drag and drop', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('drags an item past the threshold and swaps it with the drop target slot', () => {
    const slots = Array(36).fill(null);
    slots[2] = { id: BLOCK_IDS.REGOLITH, name: 'Martian Regolith', count: 5 };
    const harness = setupDragHarness(slots);

    harness.hud._startInvDrag(2, {
      pointerType: 'mouse',
      button: 0,
      pointerId: 1,
      clientX: 100,
      clientY: 100,
      currentTarget: harness.allSlots[2],
    });

    // Small jitter below 6px should not start dragging
    harness.emitWindow('pointermove', { pointerId: 1, clientX: 104, clientY: 102 });
    expect(harness.hud._invGhost).toBeNull();
    expect(harness.onUiClick).not.toHaveBeenCalled();

    // Crossing the 6px threshold starts dragging and highlights target slot 14
    harness.setHitIndex(14);
    harness.emitWindow('pointermove', { pointerId: 1, clientX: 110, clientY: 100 });
    expect(harness.hud._invGhost).toBe(harness.ghost);
    expect(harness.onUiClick).toHaveBeenCalledTimes(1);
    expect(harness.allSlots[2].classList.contains('drag-source')).toBe(true);
    expect(harness.allSlots[14].classList.contains('drag-over')).toBe(true);
    expect(harness.bodyClassList.contains('inventory-dragging')).toBe(true);

    // Dropping on slot 14 swaps the items and cleans up
    harness.emitWindow('pointerup', { type: 'pointerup', pointerId: 1, clientX: 110, clientY: 100 });
    expect(harness.onInventorySwap).toHaveBeenCalledWith(2, 14);
    expect(harness.hud.currentInventorySlots[14]).toMatchObject({ id: BLOCK_IDS.REGOLITH, count: 5 });
    expect(harness.hud.currentInventorySlots[2]).toBeNull();
    expect(harness.ghost.remove).toHaveBeenCalledOnce();
    expect(harness.allSlots[14].classList.contains('drag-over')).toBe(false);
    expect(harness.bodyClassList.contains('inventory-dragging')).toBe(false);
    expect(harness.hud._suppressInvClick).toBe(true);
  });

  it('supports touch drag without swapping when dropped outside or onto the same slot', () => {
    const slots = Array(36).fill(null);
    slots[0] = { id: BLOCK_IDS.JOURNAL, name: 'Space Journal', count: 1 };
    const harness = setupDragHarness(slots);

    harness.hud._startInvDrag(0, {
      pointerType: 'touch',
      button: 0,
      pointerId: 7,
      clientX: 40,
      clientY: 40,
      currentTarget: harness.allSlots[0],
    });

    harness.setHitIndex(0);
    harness.emitWindow('pointermove', { pointerId: 7, clientX: 60, clientY: 40 });
    expect(harness.allSlots[0].classList.contains('drag-over')).toBe(false);

    harness.setHitIndex(null);
    harness.emitWindow('pointerup', { type: 'pointerup', pointerId: 7, clientX: 200, clientY: 200 });
    expect(harness.onInventorySwap).not.toHaveBeenCalled();
    expect(harness.ghost.remove).toHaveBeenCalledOnce();
    expect(harness.allSlots[0].classList.contains('drag-source')).toBe(false);
  });

  it('cancels an active drag on pointercancel or closeInventory without swapping', () => {
    const slots = Array(36).fill(null);
    slots[1] = { id: BLOCK_IDS.REGOLITH, name: 'Martian Regolith', count: 3 };
    const harness = setupDragHarness(slots);

    harness.hud._startInvDrag(1, {
      pointerType: 'touch',
      button: 0,
      pointerId: 3,
      clientX: 20,
      clientY: 20,
      currentTarget: harness.allSlots[1],
    });

    harness.setHitIndex(5);
    harness.emitWindow('pointermove', { pointerId: 3, clientX: 40, clientY: 20 });
    harness.emitWindow('pointercancel', { type: 'pointercancel', pointerId: 3, clientX: 40, clientY: 20 });

    expect(harness.onInventorySwap).not.toHaveBeenCalled();
    expect(harness.ghost.remove).toHaveBeenCalledOnce();
    expect(harness.allSlots[5].classList.contains('drag-over')).toBe(false);
    expect(harness.listeners.get('pointermove')?.size ?? 0).toBe(0);

    // Start another drag and close inventory mid-drag
    harness.hud._startInvDrag(1, {
      pointerType: 'mouse',
      button: 0,
      pointerId: 4,
      clientX: 20,
      clientY: 20,
      currentTarget: harness.allSlots[1],
    });
    harness.emitWindow('pointermove', { pointerId: 4, clientX: 40, clientY: 20 });
    harness.hud.closeInventory();
    expect(harness.hud._invDrag).toBeNull();
    expect(harness.hud._invGhost).toBeNull();
  });
});
