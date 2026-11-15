import { describe, expect, it } from 'vitest';
import { FIRST_TIME_MOMENTS } from '../story/firstTimeMoments.ts';
import { PIXEL_SPRITES, SPRITE_SIZE, hasPixelSprite, pixelSpriteSvg } from './pixelSprites.ts';

describe('colored pixel sprites', () => {
  it('draws every sprite on a full 12x12 grid, using only its own colors', () => {
    for (const [name, sprite] of Object.entries(PIXEL_SPRITES)) {
      expect(sprite.rows, name).toHaveLength(SPRITE_SIZE);
      const used = new Set<string>();
      for (const row of sprite.rows) {
        expect(row.length, `${name}: "${row}"`).toBe(SPRITE_SIZE);
        for (const c of row) if (c !== '.') used.add(c);
      }
      for (const c of used) expect(sprite.colors[c], `${name}: color ${c}`).toMatch(/^#[0-9a-f]{6}$/);
      // colorido de verdade: mais de uma cor, e nenhuma cor sobrando na paleta
      expect(used.size, name).toBeGreaterThan(1);
      expect([...used].sort(), name).toEqual(Object.keys(sprite.colors).sort());
    }
  });

  it('has a colored sprite for both ends of every first-time scene', () => {
    for (const moment of FIRST_TIME_MOMENTS) {
      expect(hasPixelSprite(moment.scene.from), `${moment.id}: ${moment.scene.from}`).toBe(true);
      expect(hasPixelSprite(moment.scene.to), `${moment.id}: ${moment.scene.to}`).toBe(true);
    }
  });

  it('renders one colored rect per pixel', () => {
    const svg = pixelSpriteSvg('drop');
    const pixels = PIXEL_SPRITES.drop.rows.join('').replaceAll('.', '').length;
    expect(svg.match(/<rect/g)).toHaveLength(pixels);
    expect(svg).toContain('fill="#3fa3e8"');
    expect(pixelSpriteSvg('drop')).toBe(svg);
  });
});
