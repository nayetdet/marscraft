import { describe, expect, it } from 'vitest';
import { MissionSystem } from './MissionSystem.js';
import { MISSION_CONFIG as C } from '../config/constants.js';

describe('mission systems', () => {
  it('generates solar power, consumes power for life support and pauses the greenhouse when empty', () => {
    const mission = new MissionSystem();
    mission.energy = 20;
    mission.update(1, 12, false, false);
    expect(mission.energy).toBeGreaterThan(20);
    const beforeRefill = mission.energy;
    expect(mission.update(1, 0, true, true).refill).toBe(true);
    expect(mission.energy).toBeLessThan(beforeRefill);
    mission.energy = 0;
    const state = mission.update(1, 0, true, true);
    expect(state.refill).toBe(false);
    expect(mission.greenhousePowered).toBe(false);
  });

  it('requires an outside sample and a safe return before reporting', () => {
    const mission = new MissionSystem();
    mission.console();
    mission.collectSample(true);
    expect(mission.stage).toBe('outside');
    mission.update(1, 12, false, false);
    mission.collectSample(false);
    expect(mission.stage).toBe('return');
    mission.update(1, 12, true, false);
    mission.console();
    expect(mission.stage).toBe('complete');
  });

  it('raises exposure outside and increases it during the simulated storm', () => {
    const mission = new MissionSystem();
    mission.update(1, 12, true, false);
    expect(mission.radiation).toBe(0);
    mission.update(1, 12, false, false);
    const baseline = mission.radiation;
    mission.elapsed = C.STORM_INTERVAL - C.STORM_DURATION;
    expect(mission.update(1, 12, false, false).storm).toBe(true);
    expect(mission.radiation - baseline).toBeGreaterThan(baseline);
  });
});
