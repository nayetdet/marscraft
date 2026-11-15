import { describe, expect, it } from 'vitest';
import { ResolutionScaler, isSoftwareRenderer } from './resolutionScaler.ts';

const options = { maxRatio: 1.5, steps: [1, 0.75, 0.5], minFps: 40, seconds: 2, warmupSeconds: 1 };

// Roda `seconds` de quadros a `fps` e devolve as trocas de pixel ratio que aconteceram
function run(scaler: ResolutionScaler, fps: number, seconds: number): number[] {
  const changes: number[] = [];
  for (let t = 0; t < seconds; t += 1 / fps) {
    const ratio = scaler.sample(1000 / fps);
    if (ratio !== null) changes.push(ratio);
  }
  return changes;
}

describe('ResolutionScaler', () => {
  it('keeps full resolution while the game is smooth', () => {
    const scaler = new ResolutionScaler(options);
    expect(run(scaler, 60, 30)).toEqual([]);
    expect(scaler.ratio).toBe(1.5);
  });

  it('steps down one level per slow window and stops at the lowest', () => {
    const scaler = new ResolutionScaler(options);
    // aquecimento (1 s) + janela (2 s) por degrau
    expect(run(scaler, 20, 3.2)).toEqual([1]);
    expect(run(scaler, 20, 30)).toEqual([0.75, 0.5]);
    expect(scaler.ratio).toBe(0.5);
  });

  it('skips levels above the device ratio and ignores very long frames', () => {
    const scaler = new ResolutionScaler({ ...options, maxRatio: 1 });
    expect(scaler.levels).toEqual([1, 0.75, 0.5]);
    for (let i = 0; i < 50; i++) expect(scaler.sample(1000)).toBeNull();
    expect(scaler.ratio).toBe(1);
  });

  it('starts at the lowest level on a software renderer', () => {
    expect(new ResolutionScaler({ ...options, software: true }).ratio).toBe(0.5);
    expect(isSoftwareRenderer('ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero)), SwiftShader driver)')).toBe(true);
    expect(isSoftwareRenderer('ANGLE (Microsoft, Microsoft Basic Render Driver Direct3D11)')).toBe(true);
    expect(isSoftwareRenderer('ANGLE (NVIDIA, NVIDIA GeForce RTX 5060 Direct3D11 vs_5_0 ps_5_0, D3D11)')).toBe(false);
  });
});
