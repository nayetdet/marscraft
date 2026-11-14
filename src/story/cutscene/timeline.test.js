import { describe, expect, it } from 'vitest';
import { EASE, activeCaption, sampleKeys, sampleScalar } from './timeline.js';

const keys = [
  { t: 1, v: [0, 10, 0] },
  { t: 3, v: [4, 20, -8] },
  { t: 5, v: [4, 0, -8], ease: EASE.inOut },
];

describe('sampleKeys', () => {
  it('holds the first value before the first key and the last value after the last key', () => {
    expect(sampleKeys(keys, 0, [])).toEqual([0, 10, 0]);
    expect(sampleKeys(keys, 9, [])).toEqual([4, 0, -8]);
  });

  it('interpolates linearly inside a segment', () => {
    expect(sampleKeys(keys, 2, [])).toEqual([2, 15, -4]);
  });

  it('applies the easing of the key the segment arrives at', () => {
    // inOut em 25% do trecho = 0.15625, entao y = 20 - 20 * 0.15625
    expect(sampleKeys(keys, 3.5, [])[1]).toBeCloseTo(20 - 20 * 0.15625);
    expect(sampleKeys(keys, 4, [])[1]).toBeCloseTo(10);
  });

  it('writes into the array it receives', () => {
    const out = [0, 0, 0];
    expect(sampleKeys(keys, 2, out)).toBe(out);
    expect(out).toEqual([2, 15, -4]);
  });

  it('lands exactly on a key', () => {
    expect(sampleKeys(keys, 3, [])).toEqual([4, 20, -8]);
  });
});

describe('sampleScalar', () => {
  const fade = [{ t: 0, v: 1 }, { t: 2, v: 0 }, { t: 10, v: 0 }, { t: 12, v: 1 }];

  it('interpolates numbers and clamps at both ends', () => {
    expect(sampleScalar(fade, -1)).toBe(1);
    expect(sampleScalar(fade, 1)).toBeCloseTo(0.5);
    expect(sampleScalar(fade, 6)).toBe(0);
    expect(sampleScalar(fade, 11)).toBeCloseTo(0.5);
    expect(sampleScalar(fade, 99)).toBe(1);
  });
});

describe('activeCaption', () => {
  const captions = [
    { from: 0, to: 2, text: 'one' },
    { from: 3, to: 5, text: 'two' },
  ];

  it('returns the caption that covers the time', () => {
    expect(activeCaption(captions, 1).text).toBe('one');
    expect(activeCaption(captions, 3).text).toBe('two');
  });

  it('returns null in the gaps and at the closing edge', () => {
    expect(activeCaption(captions, 2)).toBeNull();
    expect(activeCaption(captions, 2.5)).toBeNull();
    expect(activeCaption(captions, 5)).toBeNull();
  });
});
