import { describe, expect, it } from 'vitest';
import { pixelGridToSvgDataUrl, pixelGridToSvgRects } from './pixelArt.ts';
import { getJournalItemIcon, getScopeItemIcon, getShieldRemoteItemIcon } from './itemIcons.ts';
import { getStatIconSvg, type StatIconType } from '../ui/statIcons.ts';

describe('pixel-art icon helpers', () => {
  it('merges contiguous horizontal pixels into crisp SVG rects', () => {
    const rects = pixelGridToSvgRects(['.aa..b.', 'aaa.bb.'], { a: '#ff0000', b: '#00ff00' });
    expect(rects).toContain('<rect fill="#ff0000" x="1" y="0" width="2" height="1"/>');
    expect(rects).toContain('<rect fill="#ff0000" x="0" y="1" width="3" height="1"/>');
    expect(rects).toContain('<rect fill="#00ff00" x="4" y="1" width="2" height="1"/>');
  });

  it('builds valid crispEdges SVG data URLs for equipment items', () => {
    const icons = [getScopeItemIcon(), getShieldRemoteItemIcon(), getJournalItemIcon()];
    for (const url of icons) {
      expect(url.startsWith('data:image/svg+xml,')).toBe(true);
      const decoded = decodeURIComponent(url.slice('data:image/svg+xml,'.length));
      expect(decoded).toContain('viewBox="0 0 16 16"');
      expect(decoded).toContain('shape-rendering="crispEdges"');
    }
  });

  it('builds layered 10x10 SVG markup for every survival stat icon', () => {
    const types: StatIconType[] = ['heart', 'oxygen', 'water', 'food', 'fire', 'radiation'];
    for (const type of types) {
      const svg = getStatIconSvg(type);
      expect(svg).toContain('viewBox="0 0 10 10"');
      expect(svg).toContain('class="px-outline"');
      expect(svg).toContain('class="px-empty"');
      expect(svg).toContain('class="px-fill"');
    }
  });

  it('derives SVG dimensions from the pixel grid', () => {
    const url = pixelGridToSvgDataUrl(['ab', 'ba', 'aa'], { a: '#111', b: '#222' });
    expect(decodeURIComponent(url)).toContain('viewBox="0 0 2 3"');
  });
});
