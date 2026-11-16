import { describe, expect, it } from 'vitest';
import { SampleSiteMarkers } from './SampleSiteMarkers.ts';

describe('sample scan targets', () => {
  it('removes a collected pile from the scope targets without removing its neighbors', () => {
    const markers = new SampleSiteMarkers([
      { id: 'site-0', typeId: 'sample-sulfur', x: 12, y: 10, z: 20 },
      { id: 'site-1', typeId: 'sample-mudstone', x: 15, y: 10, z: 20 },
    ]);
    expect(markers.scanBoxes().map((box) => box.siteId)).toEqual(['site-0', 'site-1']);
    markers.collect('site-0');
    expect(markers.scanBoxes().map((box) => box.siteId)).toEqual(['site-1']);
  });
});
