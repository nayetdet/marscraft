// @ts-nocheck
import { describe, expect, it } from 'vitest';
import { ExpeditionState } from './ExpeditionState.ts';
import { Battery } from '../mission/energy.ts';

describe('expedition state', () => {
  it('reads and spends the same battery as the mission', () => {
    const battery = new Battery(20);
    const expedition = new ExpeditionState(battery);
    expect(expedition.energy).toBe(20);
    expect(expedition.spend(5)).toBe(true);
    expect(battery.charge).toBe(15);
    battery.charge = 3;
    expect(expedition.energy).toBe(3);
  });

  it('refuses to spend more than the battery holds and keeps the charge inside its limits', () => {
    const expedition = new ExpeditionState(new Battery(2));
    expect(expedition.spend(5)).toBe(false);
    expect(expedition.energy).toBe(2);
    expedition.energy = 500;
    expect(expedition.energy).toBe(expedition.battery.capacity);
    expedition.energy = -4;
    expect(expedition.energy).toBe(0);
  });
});
