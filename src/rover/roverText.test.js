import { describe, expect, it } from 'vitest';
import { roverBatteryText } from './roverText.js';

describe('roverBatteryText', () => {
  it('shows the charge, and says what a low battery stops or where the charge comes from', () => {
    expect(roverBatteryText({ battery: 82 })).toBe('Battery: 82%');
    expect(roverBatteryText({ battery: 9, lowBattery: true })).toBe('Battery: 9% (LOW: slow, cannot drill)');
    expect(roverBatteryText({ battery: 9, lowBattery: true, isCharging: true })).toBe('Battery: 9% (charging from the base)');
  });
});
