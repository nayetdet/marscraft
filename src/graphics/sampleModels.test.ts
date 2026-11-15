import { describe, expect, it } from 'vitest';
import { SAMPLE_TYPES } from '../data/sampleTypes.ts';
import { createSampleRockModel } from './sampleModels.ts';

describe('sample rock 3D models', () => {
  it('builds a distinct multi-part sculpted rock for every sample type', () => {
    const signatures = new Set<string>();
    for (const sample of SAMPLE_TYPES) {
      const model = createSampleRockModel(sample.id);
      expect(model.name).toBe(`${sample.id}-rock`);
      expect(model.children.length).toBeGreaterThanOrEqual(5);
      signatures.add(
        JSON.stringify(
          model.children.map((mesh) => [mesh.position.toArray(), mesh.scale.toArray(), mesh.rotation.toArray()])
        )
      );
    }
    expect(signatures.size).toBe(SAMPLE_TYPES.length);
  });

  it('throws when given an unknown sample id', () => {
    expect(() => createSampleRockModel('unknown-sample')).toThrow(/Unknown sample rock model/);
  });
});
