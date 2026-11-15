// @ts-nocheck
import { describe, it, expect } from 'vitest';
import { DOSE_CONFIG, RADIATION_CONFIG } from '../config/constants.ts';
import {
  DOSE_EXPLAINER, TRANSIT_DOSE_MSV, createDoseLedger, doseBreakdown, doseClimbingFast, doseEventMessage,
  doseHistoryText, dosePercent, doseSourceFor, doseTone, doseVictoryRows, evaBlockMessage, roverMavBlocks,
} from './doseBudget.ts';
import { missionDoseMsvPerHour } from './radiation.ts';

describe('dose budget (issue #104)', () => {
  it('explains dose in one sentence for kids', () => {
    expect(DOSE_EXPLAINER).toBe('Dose is how much radiation your body has collected. It only goes up.');
  });

  it('opens the bar with the trip dose, at about 60% of the NASA limit', () => {
    expect(TRANSIT_DOSE_MSV).toBeCloseTo(DOSE_CONFIG.TRANSIT_DAYS * DOSE_CONFIG.TRANSIT_MSV_PER_DAY);
    expect(dosePercent(TRANSIT_DOSE_MSV)).toBe(60);
    expect(doseTone(TRANSIT_DOSE_MSV)).toBe('ok');
    expect(doseTone(RADIATION_CONFIG.CAREER_LIMIT_MSV * 0.9)).toBe('warn');
    expect(doseTone(RADIATION_CONFIG.CAREER_LIMIT_MSV)).toBe('danger');
  });

  it('sorts dose into trip, walks outside, storms and inside the base', () => {
    expect(doseSourceFor({ stormActive: true, insideHabitat: true })).toBe('storm');
    expect(doseSourceFor({ stormActive: false, insideHabitat: true })).toBe('habitat');
    expect(doseSourceFor({ stormActive: false, insideHabitat: false })).toBe('eva');
    const ledger = createDoseLedger();
    ledger.eva = 40;
    ledger.storm = 20;
    ledger.habitat = 10;
    const b = doseBreakdown(ledger);
    expect(b.total).toBeCloseTo(TRANSIT_DOSE_MSV + 70);
    expect(b.grounded).toBe(false);
    const text = doseHistoryText(b);
    expect(text).toContain('WHERE YOUR DOSE CAME FROM');
    expect(text).toContain('Trip from Earth: 365 mSv');
    expect(text).toContain('Walks outside: 40 mSv');
    expect(text).toContain('Solar storms: 20 mSv');
    expect(text).toContain(DOSE_EXPLAINER);
    const rows = doseVictoryRows(b);
    expect(rows[0][1]).toBe('435 mSv, under the NASA limit of 600 mSv');
    expect(rows[1][1]).toBe('Trip 365, outside 40, storms 20, in base 10 mSv');
  });

  it('keeps the outer door shut over the limit, except for the last walk to a ready rocket', () => {
    expect(evaBlockMessage({ grounded: false, mavReady: false })).toBe(null);
    expect(evaBlockMessage({ grounded: true, mavReady: false })).toMatch(/Flight doctor/);
    expect(evaBlockMessage({ grounded: true, mavReady: true })).toBe(null);
  });

  it('the rover hands over whole ice loads, never more than the rocket needs', () => {
    const kg = DOSE_CONFIG.ROVER_ICE_KG_PER_MAV_BLOCK;
    expect(roverMavBlocks(5 * kg, 10)).toBe(5);
    expect(roverMavBlocks(5 * kg, 2)).toBe(2);
    expect(roverMavBlocks(kg - 1, 10)).toBe(0);
    expect(roverMavBlocks(5 * kg, 0)).toBe(0);
  });

  it('shows the climbing arrow outside or in a storm, not when calm inside the base', () => {
    expect(doseClimbingFast(missionDoseMsvPerHour({ insideHabitat: true }))).toBe(false);
    expect(doseClimbingFast(missionDoseMsvPerHour())).toBe(true);
  });

  it('flight doctor messages for the warning and the limit', () => {
    expect(doseEventMessage('dose-warning')).toMatch(/almost/);
    expect(doseEventMessage('dose-limit')).toMatch(/cannot go outside/);
    expect(doseEventMessage('storm-start')).toBe(null);
  });
});
