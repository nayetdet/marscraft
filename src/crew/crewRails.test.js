import { describe, it, expect } from 'vitest';
import { RAIL_NODES, TASK_NODE, findRoute, routeLength, pointAlong } from './crewRails.js';

describe('crew rails', () => {
  it('every task points to an existing node', () => {
    for (const node of Object.values(TASK_NODE)) expect(RAIL_NODES[node]).toBeDefined();
  });

  it('routes from the quarters to the greenhouse through the hub and the tunnel', () => {
    const route = findRoute('quarters', 'greenhouse');
    expect(route[0]).toBe('quarters');
    expect(route.at(-1)).toBe('greenhouse');
    expect(route).toContain('hub');
    expect(route).toContain('tunnelWest');
  });

  it('a route to the same node has one point and zero length', () => {
    const route = findRoute('water', 'water');
    expect(route).toEqual(['water']);
    expect(routeLength(route)).toBe(0);
  });

  it('pointAlong walks the route and clamps at both ends', () => {
    const route = findRoute('hub', 'water');
    const start = RAIL_NODES.hub;
    const end = RAIL_NODES.water;
    expect(pointAlong(route, 0)).toMatchObject({ x: start.x, z: start.z });
    expect(pointAlong(route, -5)).toMatchObject({ x: start.x, z: start.z });
    expect(pointAlong(route, 999)).toMatchObject({ x: end.x, z: end.z });

    const half = pointAlong(route, routeLength(route) / 2);
    expect(half.x).toBeCloseTo((start.x + end.x) / 2);
    expect(half.z).toBeCloseTo((start.z + end.z) / 2);
  });
});
