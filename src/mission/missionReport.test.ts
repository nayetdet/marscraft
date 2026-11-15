// @ts-nocheck
import { describe, expect, it } from 'vitest';
import { gradeFor, missionReport } from './missionReport.ts';

const GREAT = {
  hoursPlayed: 60, sols: 3, deaths: 0,
  stormHours: 9, protectedStormHours: 9, totalDoseMsv: 0.4,
  boneDensity: 95, muscleStrength: 95, workoutCount: 4,
  harvestCount: 5, cropVariety: 3,
  iceDelivered: 10, standbyHours: 0,
};

describe('missionReport (issue #90)', () => {
  it('turns scores into S, A, B and C', () => {
    expect(gradeFor(0.95)).toBe('S');
    expect(gradeFor(0.8)).toBe('A');
    expect(gradeFor(0.6)).toBe('B');
    expect(gradeFor(0.2)).toBe('C');
  });

  it('gives a great cadet all top grades and the commander profile', () => {
    const report = missionReport(GREAT);
    expect(report.categories.map((c) => c.grade)).toEqual(['S', 'S', 'S', 'S']);
    expect(report.profile.title).toBe('Mission Commander');
  });

  it('grades radiation by the storm time spent protected', () => {
    const exposed = missionReport({ ...GREAT, protectedStormHours: 3 });
    expect(exposed.categories[0]).toMatchObject({ id: 'radiation', grade: 'C' });
    // Perfil: o melhor ponto e a dica do pior
    expect(exposed.profile.text).toMatch(/storm/);
  });

  it('grades radiation by the dose when no storm happened', () => {
    const indoors = missionReport({ ...GREAT, stormHours: 0, protectedStormHours: 0, totalDoseMsv: 0.25 * 0.0211 * 60 });
    expect(indoors.categories[0].grade).toBe('S');
  });

  it('lowers health for deaths and no gym, farming for no harvests, engineering for standby', () => {
    const lazy = missionReport({ ...GREAT, deaths: 2, workoutCount: 0, boneDensity: 50, muscleStrength: 50, harvestCount: 0, cropVariety: 0, standbyHours: 6, iceDelivered: 2 });
    const grades = Object.fromEntries(lazy.categories.map((c) => [c.id, c.grade]));
    expect(grades).toMatchObject({ health: 'C', farming: 'C', engineering: 'C' });
    expect(lazy.profile.title).toBe('Radiation Safety Officer');
  });

  it('writes a friendly profile with a strength and a tip', () => {
    const farmer = missionReport({ ...GREAT, stormHours: 9, protectedStormHours: 5 });
    expect(farmer.profile.text).toMatch(/^You .+, but next time .+!$/);
  });
});
