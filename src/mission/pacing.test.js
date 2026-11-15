import { describe, it, expect } from 'vitest';
import { PACING_CONFIG } from '../config/constants.js';
import { passiveDemandFactor } from './pacing.js';

const SOL = PACING_CONFIG.HOURS_PER_SOL;

describe('passiveDemandFactor (issue #81)', () => {
  it('is gentler during the whole first sol, but never free', () => {
    const first = PACING_CONFIG.FIRST_SOL_DEMAND_FACTOR;
    expect(first).toBeGreaterThan(0.4);
    expect(first).toBeLessThan(1);
    expect(passiveDemandFactor(9)).toBe(first); // a missao comeca as 9h do sol 1
    expect(passiveDemandFactor(SOL)).toBe(first);
  });

  it('grows little by little after the first sol and then stays at the normal demand', () => {
    const end = SOL * (1 + PACING_CONFIG.RAMP_SOLS);
    let previous = passiveDemandFactor(SOL);
    for (let hours = SOL + 1; hours <= end; hours += 1) {
      const factor = passiveDemandFactor(hours);
      expect(factor).toBeGreaterThan(previous);
      previous = factor;
    }
    expect(passiveDemandFactor(SOL + (end - SOL) / 2)).toBeCloseTo((PACING_CONFIG.FIRST_SOL_DEMAND_FACTOR + 1) / 2);
    expect(passiveDemandFactor(end)).toBe(1);
    expect(passiveDemandFactor(end + 500)).toBe(1);
  });
});
