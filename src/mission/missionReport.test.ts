// @ts-nocheck
import { describe, expect, it } from 'vitest';
import { gradeFor, missionReport } from './missionReport.ts';

const GREAT = {
  hoursPlayed: 60, sols: 3, deaths: 0,
  stormHours: 9, protectedStormHours: 9, totalDoseMsv: 0.4,
  boneDensity: 95, muscleStrength: 95, workoutCount: 4,
  harvestCount: 5, cropVariety: 3,
  iceDelivered: 10, standbyHours: 0,
  discoveries: 14, scanTotal: 24, sampleTypes: 3, samplesAnalyzed: 4,
  sciencePointsSent: 20, sciencePointsGoal: 10,
  journalFound: 18, journalTotal: 29, journalRank: 'SPECIALIST',
  topFinds: [{ name: 'Yellow Sulfur Crystals', points: 4 }, { name: 'Layered Mudstone', points: 3 }, { name: 'Earth', points: 2 }, { name: 'Habitat', points: 1 }],
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
    expect(report.categories.map((c) => c.grade)).toEqual(['S', 'S', 'S', 'S', 'S']);
    expect(report.categories.map((c) => c.id)).toEqual(['radiation', 'health', 'farming', 'engineering', 'science']);
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

  it('grades science by what the journal shows: scans, sample types and points sent home (issue #271)', () => {
    const science = (stats) => missionReport({ ...GREAT, ...stats }).categories.find((c) => c.id === 'science');
    expect(science({})).toMatchObject({ name: 'SCIENCE EXPLORER', grade: 'S', detail: '14 scans, 4 samples, 20 pts sent' });
    // So o minimo para decolar (10 pontos, sem amostras e com poucas descobertas): nota baixa
    expect(science({ discoveries: 5, sampleTypes: 0, samplesAnalyzed: 0, sciencePointsSent: 10 }).grade).toBe('C');
    // Explorou o mapa mas enviou so o minimo: nota do meio
    expect(science({ sciencePointsSent: 10 }).grade).toBe('A');
    expect(science({ discoveries: 6, sampleTypes: 2, sciencePointsSent: 14 }).grade).toBe('B');
    // Mais descobertas nunca baixam a nota
    expect(science({ discoveries: 24 }).score).toBeGreaterThanOrEqual(science({ discoveries: 10 }).score);
    // Sem dados de ciencia (partida antiga): nota C, sem quebrar
    expect(science({ discoveries: undefined, scanTotal: undefined, sampleTypes: undefined, sciencePointsSent: undefined, sciencePointsGoal: undefined })).toMatchObject({ grade: 'C', score: 0 });
  });

  it('counts the sample tubes only here, apart from the science sent by radio (issue #422)', () => {
    const science = (stats) => missionReport({ ...GREAT, ...stats }).categories.find((c) => c.id === 'science');
    const radioOnly = science({ sciencePointsSent: 10 });
    const withTubes = science({ sciencePointsSent: 10, scienceTubePoints: 12 });
    expect(withTubes.detail).toBe('14 scans, 4 samples, 10 pts sent, 12 pts in tubes');
    expect(withTubes.score).toBeGreaterThan(radioOnly.score);
    // Sem tubos o texto nao muda
    expect(science({ scienceTubePoints: 0 }).detail).toBe('14 scans, 4 samples, 20 pts sent');
  });

  it('tells what the cadet found: count, journal rank and the 3 coolest finds (issue #271)', () => {
    const { explorer } = missionReport(GREAT);
    expect(explorer).toMatchObject({ found: 18, total: 29, text: 'You found 18 of 29 things', rank: 'SPECIALIST' });
    expect(explorer.top.map((find) => find.name)).toEqual(['Yellow Sulfur Crystals', 'Layered Mudstone', 'Earth']);
    expect(missionReport({ ...GREAT, topFinds: undefined, journalRank: undefined }).explorer).toMatchObject({ rank: 'CADET', top: [] });
  });

  it('names the science explorer when science is the best grade', () => {
    const report = missionReport({ ...GREAT, protectedStormHours: 3, boneDensity: 60, muscleStrength: 60, workoutCount: 0, harvestCount: 1, cropVariety: 1, iceDelivered: 4, standbyHours: 3 });
    expect(report.profile.title).toBe('Science Explorer');
  });

  it('writes a friendly profile with a strength and a tip', () => {
    const farmer = missionReport({ ...GREAT, stormHours: 9, protectedStormHours: 5 });
    expect(farmer.profile.text).toMatch(/^You .+, but next time .+!$/);
  });
});
