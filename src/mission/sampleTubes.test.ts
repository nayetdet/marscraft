import { describe, expect, it } from 'vitest';
import { SAMPLE_SITE_CONFIG, SCIENCE_CONFIG } from '../config/constants.ts';
import { SAMPLE_TYPES } from '../data/sampleTypes.ts';
import { CLUES } from './clues.ts';
import { sampleItem, scienceStatus } from './sciencePackage.ts';
import { canTube, noTubeSampleText, pickTubeSample, tubeChoice, tubeLoadedText, tubePoints, tubeableCount, tubesPoints } from './sampleTubes.ts';

const { TUBE_POINTS_FACTOR, MAX_SAMPLE_TUBES, ICE_PER_SAMPLE_TUBE, POINTS_TO_LAUNCH } = SCIENCE_CONFIG;
const type = (id: string) => SAMPLE_TYPES.find((t) => t.id === id)!;
// Mochila de teste: { typeId: quantidade }
const bag = (items: Record<string, number>) => (itemId: number) => items[SAMPLE_TYPES.find((t) => t.itemId === itemId)?.id ?? ''] ?? 0;

describe('analyze here or tube to Earth (issue #422)', () => {
  it('is worth more in the tube than in the lab, and the extra is a game rule in the config', () => {
    expect(TUBE_POINTS_FACTOR).toBe(2);
    for (const t of SAMPLE_TYPES) expect(tubePoints(t)).toBe(t.points * TUBE_POINTS_FACTOR);
    expect(tubesPoints([{ points: 3 }, { points: 2 }])).toBe(10);
    expect(tubesPoints([])).toBe(0);
    // O tubo nao sai de graca: pede mais gelo
    expect(ICE_PER_SAMPLE_TUBE).toBeGreaterThan(0);
  });

  it('never puts a clue sample in a tube: Earth needs it by radio (issue #344)', () => {
    for (const clue of CLUES) expect(canTube(clue.typeId), clue.id).toBe(false);
    expect(canTube('sample-meteorite')).toBe(true);
    expect(canTube('sample-dune-sand')).toBe(true);
    const onlyClues = bag({ 'sample-sulfur': 3, 'sample-ice-core': 1 });
    expect(pickTubeSample(onlyClues)).toBeNull();
    expect(tubeableCount(onlyClues)).toBe(0);
    expect(tubeChoice(onlyClues, 0)).toBeNull();
    expect(noTubeSampleText(true)).toMatch(/Clue samples cannot go in a tube/);
    expect(noTubeSampleText(false)).toMatch(/do not analyze it/);
  });

  it('picks the raw sample worth the most and shows both numbers side by side', () => {
    const mixed = bag({ 'sample-dune-sand': 2, 'sample-meteorite': 1, 'sample-sulfur': 3 });
    expect(pickTubeSample(mixed)).toBe(type('sample-meteorite'));
    expect(tubeableCount(mixed)).toBe(3);
    expect(tubeChoice(mixed, 1)).toEqual({
      name: 'Iron Meteorite', analyzePoints: 3, tubePoints: 3 * TUBE_POINTS_FACTOR, icePerTube: ICE_PER_SAMPLE_TUBE, tubesLeft: MAX_SAMPLE_TUBES - 1,
    });
    expect(tubeChoice(mixed, 0)!.tubePoints).toBeGreaterThan(tubeChoice(mixed, 0)!.analyzePoints);
    // Foguete sem lugar: nao ha escolha para mostrar
    expect(tubeChoice(mixed, MAX_SAMPLE_TUBES)).toBeNull();
    expect(pickTubeSample(bag({}))).toBeNull();
    expect(tubeLoadedText(type('sample-meteorite'))).toMatch(/\+6 points in your final report, none now/);
  });

  it('keeps the launch goal reachable with every tube full, but then there is nothing left for upgrades', () => {
    // As 15 amostras do mapa; os tubos levam as que valem mais entre as que nao sao pista
    const all = SAMPLE_TYPES.flatMap((t) => Array.from({ length: SAMPLE_SITE_CONFIG.PER_TYPE }, () => t));
    const tubed = all.filter((t) => canTube(t.id)).sort((a, b) => b.points - a.points).slice(0, MAX_SAMPLE_TUBES);
    const analyzed = [...all];
    for (const t of tubed) analyzed.splice(analyzed.indexOf(t), 1);
    const items = analyzed.map((t, order) => sampleItem(order, { typeId: t.id, name: t.name, points: t.points }));
    const status = scienceStatus(items, { sentIds: new Set(items.map((item) => item.id)), usedIds: new Set() });
    expect(status.met).toBe(true);
    expect(status.sentPoints).toBeGreaterThanOrEqual(POINTS_TO_LAUNCH);
    // O custo da escolha: com os tubos cheios nao sobra amostra para pagar as duas melhorias
    expect(status.sentPoints - POINTS_TO_LAUNCH).toBeLessThan(SCIENCE_CONFIG.SUIT_UPGRADE_POINTS + SCIENCE_CONFIG.TOOL_UPGRADE_POINTS);
    // E os tubos valem mais no boletim do que as mesmas amostras analisadas
    expect(tubesPoints(tubed)).toBeGreaterThan(tubed.reduce((sum, t) => sum + t.points, 0));
  });
});
