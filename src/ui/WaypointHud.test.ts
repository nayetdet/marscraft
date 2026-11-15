import { describe, expect, it } from 'vitest';
import { waypointEdgeDirection } from './WaypointHud.ts';

describe('waypoint edge direction', () => {
  it('places a target directly behind at the bottom instead of arbitrarily to the right', () => {
    expect(waypointEdgeDirection(0, 0, true)).toEqual({ nx: 0, ny: -1, angle: 0 });
  });

  it('keeps the projected direction for targets behind and off-center', () => {
    const edge = waypointEdgeDirection(0.6, 0.2, true);
    expect(edge.nx).toBeLessThan(0);
    expect(edge.ny).toBeLessThan(0);
  });
});
