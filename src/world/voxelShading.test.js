import { describe, it, expect } from 'vitest';
import { OCCLUSION_BRIGHTNESS, naturalTint, vertexOcclusion } from './voxelShading.js';
import { BLOCK_IDS } from '../config/blockTypes.js';

describe('naturalTint', () => {
  it('leaves built blocks untouched', () => {
    expect(naturalTint(BLOCK_IDS.NASA_HULL, 3, 9, 4)).toBe(1);
    expect(naturalTint(BLOCK_IDS.HAB_LIGHT, -7, 12, 0)).toBe(1);
  });

  it('is deterministic and stays in a narrow range for ground blocks', () => {
    for (const id of [BLOCK_IDS.REGOLITH, BLOCK_IDS.SANDSTONE, BLOCK_IDS.BASALT]) {
      for (let i = 0; i < 400; i += 1) {
        const x = (i * 37) % 224 - 112;
        const z = (i * 91) % 224 - 112;
        const y = 6 + (i % 14);
        const tint = naturalTint(id, x, y, z);
        expect(tint).toBe(naturalTint(id, x, y, z));
        expect(tint).toBeGreaterThan(0.8);
        expect(tint).toBeLessThan(1.2);
      }
    }
  });

  it('gets lighter with height on average', () => {
    const mean = (y) => {
      let sum = 0;
      for (let i = 0; i < 500; i += 1) sum += naturalTint(BLOCK_IDS.REGOLITH, (i * 37) % 224 - 112, y, (i * 91) % 224 - 112);
      return sum / 500;
    };
    expect(mean(18)).toBeGreaterThan(mean(7) + 0.08);
  });
});

describe('vertexOcclusion', () => {
  it('follows the classic voxel table', () => {
    expect(vertexOcclusion(false, false, false)).toBe(3);
    expect(vertexOcclusion(true, false, false)).toBe(2);
    expect(vertexOcclusion(false, false, true)).toBe(2);
    expect(vertexOcclusion(true, false, true)).toBe(1);
    expect(vertexOcclusion(true, true, false)).toBe(0);
    expect(vertexOcclusion(true, true, true)).toBe(0);
  });

  it('maps levels to increasing brightness ending at 1', () => {
    expect(OCCLUSION_BRIGHTNESS).toHaveLength(4);
    expect(OCCLUSION_BRIGHTNESS[3]).toBe(1);
    for (let i = 1; i < 4; i += 1) expect(OCCLUSION_BRIGHTNESS[i]).toBeGreaterThan(OCCLUSION_BRIGHTNESS[i - 1]);
  });
});
