import { describe, expect, it } from 'vitest';
import { SAMPLE_SITE_CONFIG, SCIENCE_CONFIG, TERRAIN_CONFIG } from '../config/constants.ts';
import { SAMPLE_TYPES } from '../data/sampleTypes.ts';
import { placeSampleSites } from '../world/sampleSites.ts';
import { nextRocketJob, objectiveView, scienceTask } from '../story/objectiveView.ts';
import { objectiveTarget } from '../story/waypoints.ts';
import { earthFarewell } from '../story/storyChapters.ts';
import { sampleItem } from './sciencePackage.ts';
import { CLUES, CLUES_ANSWER, allCluesSent, clueDue, clueStates, cluesUnsentText, isClueItem, nextClueIndex } from './clues.ts';

const sample = (order: number, typeId: string) => sampleItem(order, { typeId, name: typeId, points: 2 });
const [ICE, MUD, SULFUR] = CLUES.map((clue) => clue.typeId);

describe('mission clues (issue #344)', () => {
  it('has 3 clues, each one a real sample type from the map, with a short label and answer', () => {
    expect(CLUES).toHaveLength(3);
    for (const clue of CLUES) {
      expect(SAMPLE_TYPES.some((type) => type.id === clue.typeId), clue.id).toBe(true);
      expect(clue.label.split(' ').length).toBeLessThanOrEqual(2);
      expect(clue.answer.split(' ').length).toBeLessThanOrEqual(8);
    }
    expect(CLUES_ANSWER.split(' ').length).toBeLessThanOrEqual(8);
  });

  it('follows each clue from the map to Earth: todo, bag, found, sent', () => {
    expect(clueStates()).toEqual(['todo', 'todo', 'todo']);
    expect(clueStates({}, (typeId) => typeId === ICE)).toEqual(['bag', 'todo', 'todo']);
    expect(clueStates({ pending: [sample(0, ICE)] })).toEqual(['found', 'todo', 'todo']);
    expect(clueStates({ pending: [sample(1, MUD)], sent: [sample(0, ICE)] }, (typeId) => typeId === SULFUR)).toEqual(['sent', 'found', 'bag']);
    // Uma amostra bonus (meteorito) nao e pista
    expect(clueStates({ sent: [sample(0, 'sample-meteorite')] })).toEqual(['todo', 'todo', 'todo']);
    expect(isClueItem(sample(0, 'sample-meteorite'))).toBe(false);
    expect(isClueItem(sample(0, SULFUR))).toBe(true);
  });

  it('reuses the array it is given (the engine calls it every frame)', () => {
    const out = ['sent', 'sent', 'sent', 'sent'] as never[];
    expect(clueStates({}, () => false, out)).toBe(out);
    expect(out).toEqual(['todo', 'todo', 'todo']);
  });

  it('knows when the 3 are home and which ones are still missing', () => {
    expect(allCluesSent(['sent', 'sent', 'sent'])).toBe(true);
    expect(allCluesSent(['sent', 'found', 'sent'])).toBe(false);
    expect(allCluesSent([])).toBe(false);
    expect(nextClueIndex(['sent', 'bag', 'todo'])).toBe(2);
    expect(nextClueIndex(['sent', 'found', 'bag'])).toBe(-1);
    expect(cluesUnsentText(['sent', 'found', 'todo'])).toBe('OLD LAKE and LIFE INGREDIENT');
  });

  it('mixes clues into the ice trips: one clue every ICE_PER_CLUE_TRIP blocks, and always once the ice is done', () => {
    const N = SCIENCE_CONFIG.ICE_PER_CLUE_TRIP;
    const none = ['todo', 'todo', 'todo'] as const;
    expect(clueDue(none, 0, 6)).toBe(false);
    expect(clueDue(none, N - 1, 6 - (N - 1))).toBe(false);
    expect(clueDue(none, N, 6 - N)).toBe(true);
    // Primeira pista ja coletada: a segunda so depois de mais gelo
    expect(clueDue(['bag', 'todo', 'todo'], N, 6 - N)).toBe(false);
    expect(clueDue(['found', 'todo', 'todo'], 2 * N, 6 - 2 * N)).toBe(true);
    // Tanque ja com todo o gelo: a pista que falta e o proximo trabalho
    expect(clueDue(['sent', 'sent', 'todo'], 6, 0)).toBe(true);
    // Nada para buscar
    expect(clueDue(['sent', 'found', 'bag'], 6, 0)).toBe(false);
  });
});

describe('clues in the objective panel and the arrow (issue #344)', () => {
  it('sends the child to the clue between ice trips, never with ice in hand or before going back to base', () => {
    expect(nextRocketJob({ iceNeeded: 4, clueDue: true })).toBe('clue');
    expect(nextRocketJob({ iceNeeded: 4, clueDue: true, iceCount: 1 })).toBe('load');
    expect(nextRocketJob({ iceNeeded: 4, clueDue: true, needsBase: true })).toBe('base');
    expect(nextRocketJob({ iceNeeded: 4, clueDue: false })).toBe('ice');
    expect(objectiveTarget('fuel', { iceNeeded: 4, clueDue: true })).toBe('clue');
  });

  it('names the clue to find and points the arrow at it once the ice is done', () => {
    const s = { iceNeeded: 0, scienceStep: 'clue', nextClue: 1 };
    expect(scienceTask(s)).toMatchObject({ icon: 'rock', label: 'FIND CLUE: OLD LAKE' });
    expect(objectiveTarget('send-data', s)).toBe('clue');
    expect(objectiveTarget('fuel', s)).toBe('clue');
    expect(scienceTask({ scienceStep: 'clue', nextClue: -1 }).label).toBe('FIND A CLUE');
  });

  it('shows the 3 clue boxes next to the rocket from act 2 on', () => {
    const story = { act: 2, objectiveId: 'fuel', stormsNeeded: 1, windowHoursLeft: null, replySecondsLeft: null };
    const view = objectiveView(story, { iceNeeded: 4, clueDue: true, nextClue: 0, clueStates: ['todo', 'todo', 'todo'], stormsSurvived: 0 });
    expect(view.goal).toBe('GOAL: 3 CLUES, FLY HOME');
    expect(view.task.label).toBe('FIND CLUE: WATER NOW');
    expect(view.goals.clues).toEqual(['todo', 'todo', 'todo']);
    expect(view.loop).toBe(false);
  });

  it('answers the mission question in the last message from Earth only with the 3 clues home', () => {
    const texts = (card: { lines: { text: string }[] }) => card.lines.map((line) => line.text);
    expect(texts(earthFarewell({ sentPoints: 12, cluesSent: true }))).toContain(`Your 3 clues say: ${CLUES_ANSWER}`);
    expect(texts(earthFarewell({ sentPoints: 12 })).some((text) => /clues/.test(text))).toBe(false);
  });
});

describe('clue sample sites (issue #344)', () => {
  const sites = placeSampleSites({ groundTop: () => 10 });
  const base = TERRAIN_CONFIG.BASE_CENTER;
  const distance = (site: { x: number; z: number }) => Math.hypot(site.x - base.x, site.z - base.z);
  const first = (typeId: string) => sites.find((site) => site.typeId === typeId)!;

  it('places one site of every clue type', () => {
    for (const clue of CLUES) expect(first(clue.typeId), clue.id).toBeTruthy();
  });

  it('puts the lake clue at a middle distance and the sulfur clue far away, each in its own ring', () => {
    const [mudMin, mudMax] = SAMPLE_SITE_CONFIG.CLUE_RINGS['sample-mudstone'];
    const [sulfurMin, sulfurMax] = SAMPLE_SITE_CONFIG.CLUE_RINGS['sample-sulfur'];
    // O local e arredondado para o bloco: 1 bloco de folga
    expect(distance(first(MUD))).toBeGreaterThanOrEqual(mudMin - 1);
    expect(distance(first(MUD))).toBeLessThanOrEqual(mudMax + 1);
    expect(distance(first(SULFUR))).toBeGreaterThanOrEqual(sulfurMin - 1);
    expect(distance(first(SULFUR))).toBeLessThanOrEqual(sulfurMax + 1);
    expect(distance(first(SULFUR))).toBeGreaterThan(distance(first(MUD)));
    expect(sulfurMin).toBeGreaterThan(mudMax);
  });
});
