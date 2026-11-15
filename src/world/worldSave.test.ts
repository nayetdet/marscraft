import { describe, expect, it } from 'vitest';
import { encodeWorldEdits, restoreWorldEdits } from './worldSave.ts';

describe('world save (only edited blocks)', () => {
  it('round-trips the edited blocks through JSON', () => {
    const world = new Uint8Array(10).fill(3);
    world[2] = 0; // bloco quebrado
    world[7] = 9; // bloco colocado
    const json = JSON.stringify({ worldEdits: encodeWorldEdits(world, new Set([2, 7])) });

    const fresh = new Uint8Array(10).fill(3);
    const edited = new Set<number>();
    expect(restoreWorldEdits(fresh, JSON.parse(json), edited)).toBe(2);
    expect(Array.from(fresh)).toEqual(Array.from(world));
    expect([...edited].sort()).toEqual([2, 7]);
  });

  it('keeps old full-world saves working and keeps only their differences', () => {
    const generated = new Uint8Array(6).fill(1);
    const oldSave = { world: [1, 1, 0, 1, 5, 1] };
    const edited = new Set<number>();
    expect(restoreWorldEdits(generated, oldSave, edited)).toBe(2);
    expect(Array.from(generated)).toEqual(oldSave.world);
    expect(encodeWorldEdits(generated, edited)).toEqual([2, 0, 4, 5]);
  });

  it('ignores missing, malformed or out-of-range entries', () => {
    const data = new Uint8Array(4);
    const edited = new Set<number>();
    expect(restoreWorldEdits(data, null, edited)).toBe(0);
    expect(restoreWorldEdits(data, { world: [1, 2] }, edited)).toBe(0); // tamanho errado
    expect(restoreWorldEdits(data, { worldEdits: [-1, 2, 99, 2, 1, 300, 1.5, 2, 3] }, edited)).toBe(0);
    expect(Array.from(data)).toEqual([0, 0, 0, 0]);
    expect(edited.size).toBe(0);
  });
});
