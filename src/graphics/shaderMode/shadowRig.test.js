import { describe, expect, it } from 'vitest';
import { shadowLightDirection, snapShadowCenter } from './shadowRig.js';

const length = (v) => Math.hypot(v.x, v.y, v.z);
const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
const norm = (v) => { const l = length(v); return { x: v.x / l, y: v.y / l, z: v.z / l }; };

describe('shadowLightDirection', () => {
  it('follows the Sun while it is high', () => {
    const sun = norm({ x: 0.5, y: 0.8, z: -0.35 });
    const dir = shadowLightDirection(sun, 0.2, {});
    expect(dir.x).toBeCloseTo(sun.x);
    expect(dir.y).toBeCloseTo(sun.y);
    expect(dir.z).toBeCloseTo(sun.z);
  });

  it('never lets the light go under the minimum elevation', () => {
    const dir = shadowLightDirection(norm({ x: 0.93, y: 0.02, z: -0.35 }), 0.2, {});
    expect(length(dir)).toBeCloseTo(1);
    expect(dir.y).toBeGreaterThan(0.19);
  });

  it('mirrors the light from above at night, without a jump at the horizon', () => {
    const night = shadowLightDirection(norm({ x: -0.5, y: -0.8, z: -0.35 }), 0.2, {});
    expect(night.y).toBeGreaterThan(0);
    const justAbove = shadowLightDirection(norm({ x: 0.93, y: 0.001, z: -0.35 }), 0.2, {});
    const justBelow = shadowLightDirection(norm({ x: 0.93, y: -0.001, z: -0.35 }), 0.2, {});
    expect(justAbove.x).toBeCloseTo(justBelow.x, 5);
    expect(justAbove.y).toBeCloseTo(justBelow.y, 5);
  });
});

describe('snapShadowCenter', () => {
  const light = norm({ x: 0.4, y: 0.7, z: -0.35 });
  const texel = 104 / 2048;
  // Mesma base de shadowRig.js: right = up x light, up2 = light x right
  const right = norm({ x: light.z, y: 0, z: -light.x });
  const up = {
    x: light.y * right.z,
    y: light.z * right.x - light.x * right.z,
    z: -light.y * right.x,
  };

  it('lands on the texel grid of the shadow map', () => {
    const out = snapShadowCenter({ x: 13.37, y: 11.2, z: -42.91 }, light, texel, {});
    const a = dot(out, right) / texel;
    const b = dot(out, up) / texel;
    expect(Math.abs(a - Math.round(a))).toBeLessThan(1e-6);
    expect(Math.abs(b - Math.round(b))).toBeLessThan(1e-6);
  });

  it('moves the center by less than one texel', () => {
    const center = { x: 13.37, y: 11.2, z: -42.91 };
    const out = snapShadowCenter(center, light, texel, {});
    expect(length({ x: out.x - center.x, y: out.y - center.y, z: out.z - center.z })).toBeLessThan(texel);
  });

  it('keeps the light-space depth of the center', () => {
    const center = { x: 13.37, y: 11.2, z: -42.91 };
    const out = snapShadowCenter(center, light, texel, {});
    expect(dot(out, light)).toBeCloseTo(dot(center, light), 9);
  });

  it('can write the result back into the input object', () => {
    const center = { x: 1.23, y: 4.56, z: 7.89 };
    const expected = snapShadowCenter(center, light, texel, {});
    snapShadowCenter(center, light, texel, center);
    expect(center).toEqual(expected);
  });

  it('leaves the center alone when the light is straight overhead', () => {
    const out = snapShadowCenter({ x: 1.23, y: 4.56, z: 7.89 }, { x: 0, y: 1, z: 0 }, texel, {});
    expect(out).toEqual({ x: 1.23, y: 4.56, z: 7.89 });
  });
});
