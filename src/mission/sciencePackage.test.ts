import { describe, expect, it } from 'vitest';
import { SCIENCE_CONFIG } from '../config/constants.ts';
import {
  discoveryItem,
  discoveryPoints,
  pickForSpend,
  pointsOf,
  pointsStillNeeded,
  sampleItem,
  scienceGoalText,
  scienceMissingText,
  sciencePackage,
  scienceStatus,
  scienceStep,
  uploadButtonLabel,
  uploadResultText,
} from './sciencePackage.ts';
import type { ScienceItem } from './sciencePackage.ts';

const {
  POINTS_TO_LAUNCH, POINTS_PER_DISCOVERY, POINTS_PER_RARE_DISCOVERY, UPLOAD_BASE_COST, UPLOAD_COST_PER_ITEM, MAX_ITEMS_PER_UPLOAD,
} = SCIENCE_CONFIG;

// `n` descobertas comuns (1 ponto cada)
const scans = (n: number, from = 0): ScienceItem[] => Array.from({ length: n }, (_, i) => discoveryItem({ id: `thing-${from + i}`, title: `Thing ${from + i}`, category: 'base' }));
// Amostra bonus (nao e pista da missao)
const rock = (order: number, points: number) => sampleItem(order, { typeId: 'sample-meteorite', name: 'Iron Meteorite', points });
// As 3 amostras que sao as pistas da missao (issue #344): 2 + 3 + 4 = 9 pontos
const clueRocks = () => [
  sampleItem(100, { typeId: 'sample-ice-core', name: 'Buried Ice Core', points: 2 }),
  sampleItem(101, { typeId: 'sample-mudstone', name: 'Layered Mudstone', points: 3 }),
  sampleItem(102, { typeId: 'sample-sulfur', name: 'Yellow Sulfur Crystals', points: 4 }),
];
const ledger = (sent: ScienceItem[] = [], used: ScienceItem[] = []) => ({ sentIds: new Set(sent.map((i) => i.id)), usedIds: new Set(used.map((i) => i.id)) });

describe('science points', () => {
  it('gives more points to rare discoveries (sky and landscape)', () => {
    expect(discoveryPoints('base')).toBe(POINTS_PER_DISCOVERY);
    expect(discoveryPoints('terrain')).toBe(POINTS_PER_DISCOVERY);
    expect(discoveryPoints('sky')).toBe(POINTS_PER_RARE_DISCOVERY);
    expect(discoveryPoints('landscape')).toBe(POINTS_PER_RARE_DISCOVERY);
    expect(POINTS_PER_RARE_DISCOVERY).toBeGreaterThan(POINTS_PER_DISCOVERY);
    expect(discoveryItem({ id: 'earth', title: 'Earth', category: 'sky' })).toMatchObject({ id: 'scan:earth', kind: 'discovery', rare: true, points: POINTS_PER_RARE_DISCOVERY });
    expect(sampleItem(2, { typeId: 'sample-sulfur', name: 'Sulfur', points: 4 })).toMatchObject({ id: 'sample:2', kind: 'sample', points: 4, icon: 'sample-sulfur' });
  });

  it('splits what was found into to send, sent and used', () => {
    const items = [...scans(3), rock(0, 4)];
    const status = scienceStatus(items, ledger([items[0]], [items[1]]));
    expect(status.sent.map((i) => i.id)).toEqual([items[0].id]);
    expect(status.used.map((i) => i.id)).toEqual([items[1].id]);
    expect(status.pending.map((i) => i.id)).toEqual([items[2].id, items[3].id]);
    expect(status).toMatchObject({ sentPoints: 1, usedPoints: 1, pendingPoints: 5, goal: POINTS_TO_LAUNCH, met: false });
  });

  it('meets the goal only with enough points AND the 3 clues SENT (issue #344)', () => {
    const items = [...scans(POINTS_TO_LAUNCH), ...clueRocks()];
    expect(scienceStatus(items).met).toBe(false);
    // Falta enviar a ultima pista
    expect(scienceStatus(items, ledger(items.slice(0, -1))).met).toBe(false);
    expect(scienceStatus(items, ledger(items)).met).toBe(true);
    // Pontos sobrando, mas sem as pistas: o foguete nao decola
    const onlyScans = scans(POINTS_TO_LAUNCH + 5);
    expect(scienceStatus(onlyScans, ledger(onlyScans))).toMatchObject({ met: false, cluesSent: false, clues: ['todo', 'todo', 'todo'] });
    // Uma pista analisada espera o envio; enviada, fica verde
    const [ice, mud] = clueRocks();
    expect(scienceStatus([ice, mud], ledger([ice])).clues).toEqual(['sent', 'found', 'todo']);
  });
});

describe('sciencePackage', () => {
  it('is empty and free with nothing new to send', () => {
    expect(sciencePackage([])).toMatchObject({ items: 0, points: 0, cost: 0, metNow: false, metAfter: false });
    const items = scans(3);
    expect(sciencePackage(items, ledger(items))).toMatchObject({ items: 0, cost: 0 });
  });

  it('sends only what was not sent or used, best items first, up to one orbiter pass', () => {
    const items = [...scans(20), rock(0, 4), rock(1, 3)];
    const pkg = sciencePackage(items, ledger([items[0]], [items[1]]));
    expect(pkg.items).toBe(MAX_ITEMS_PER_UPLOAD);
    expect(pkg.upload.slice(0, 2).map((i) => i.points)).toEqual([4, 3]);
    expect(pkg.points).toBe(4 + 3 + (MAX_ITEMS_PER_UPLOAD - 2));
    expect(pkg.leftAfter).toBe(20 - MAX_ITEMS_PER_UPLOAD);
    expect(pkg.cost).toBe(UPLOAD_BASE_COST + MAX_ITEMS_PER_UPLOAD * UPLOAD_COST_PER_ITEM);
    expect(pkg.upload.some((i) => i.id === items[0].id || i.id === items[1].id)).toBe(false);
  });

  it('never sends for free: every item adds to the power cost', () => {
    expect(sciencePackage(scans(1)).cost).toBe(UPLOAD_BASE_COST + UPLOAD_COST_PER_ITEM);
    expect(sciencePackage(scans(2)).cost).toBeGreaterThan(sciencePackage(scans(1)).cost);
  });

  it('tells when this upload closes the goal', () => {
    expect(sciencePackage(scans(POINTS_TO_LAUNCH - 1)).metAfter).toBe(false);
    expect(sciencePackage([...scans(1), ...clueRocks()]).metAfter).toBe(true);
    // Pontos bastam, mas falta uma pista neste envio
    expect(sciencePackage([...scans(6), ...clueRocks().slice(1)]).metAfter).toBe(false);
  });
});

describe('pickForSpend (lab upgrades)', () => {
  it('refuses when the waiting points are not enough', () => {
    expect(pickForSpend(scans(3), 4)).toBeNull();
    expect(pickForSpend([], 1)).toBeNull();
  });

  it('spends the cheapest items first and nothing it does not need', () => {
    const picked = pickForSpend([rock(0, 4), ...scans(6)], 4)!;
    expect(picked.every((i) => i.kind === 'discovery')).toBe(true);
    expect(pointsOf(picked)).toBe(4);
    // So itens grandes: paga com um, sem levar os pequenos junto
    const big = pickForSpend([...scans(1), rock(0, 3), rock(1, 4)], 4)!;
    expect(pointsOf(big)).toBe(4);
    expect(big).toHaveLength(2);
    expect(pointsOf(pickForSpend([rock(0, 3), rock(1, 3)], 4)!)).toBe(6);
  });

  it('never spends a clue sample: without it on Earth the rocket cannot launch (issue #344)', () => {
    expect(pickForSpend(clueRocks(), 4)).toBeNull();
    const picked = pickForSpend([...clueRocks(), ...scans(4)], 4)!;
    expect(picked.every((i) => i.kind === 'discovery')).toBe(true);
  });
});

describe('scienceStep with the mission clues (issue #344)', () => {
  it('goes for the next clue first, then analyzes it, then sends', () => {
    expect(scienceStep({ cluesToFind: 2, cluesUnsent: 3, rawSamples: 0 })).toBe('clue');
    expect(scienceStep({ cluesToFind: 0, cluesInBag: 1, cluesUnsent: 3, pendingPoints: POINTS_TO_LAUNCH })).toBe('analyze');
    expect(scienceStep({ cluesUnsent: 3, pendingPoints: POINTS_TO_LAUNCH })).toBe('send');
  });

  it('is not done with the points home while a clue is still missing', () => {
    expect(scienceStep({ sentPoints: POINTS_TO_LAUNCH, cluesUnsent: 1, cluesToFind: 1 })).toBe('clue');
    expect(scienceStep({ sentPoints: POINTS_TO_LAUNCH, cluesUnsent: 1, pendingPoints: 3 })).toBe('send');
    expect(scienceStep({ sentPoints: POINTS_TO_LAUNCH, cluesUnsent: 0 })).toBeNull();
  });

  it('names the clues Earth still needs', () => {
    expect(scienceMissingText({ sentPoints: POINTS_TO_LAUNCH, clues: ['sent', 'found', 'todo'] })).toMatch(/OLD LAKE and LIFE INGREDIENT/);
    expect(scienceMissingText({ sentPoints: POINTS_TO_LAUNCH, clues: ['sent', 'sent', 'sent'] })).toMatch(/Enough science is home/);
  });
});

describe('scienceStep', () => {
  it('guides scan, analyze, send and then nothing', () => {
    expect(scienceStep({})).toBe('scan');
    expect(scienceStep({ rawSamples: 1 })).toBe('analyze');
    expect(scienceStep({ pendingPoints: POINTS_TO_LAUNCH })).toBe('send');
    expect(scienceStep({ pendingPoints: 4, sentPoints: POINTS_TO_LAUNCH - 4 })).toBe('send');
    expect(scienceStep({ sentPoints: POINTS_TO_LAUNCH })).toBeNull();
    expect(pointsStillNeeded({ pendingPoints: 2, sentPoints: 3 })).toBe(POINTS_TO_LAUNCH - 5);
    expect(pointsStillNeeded({ sentPoints: POINTS_TO_LAUNCH + 5 })).toBe(0);
  });
});

describe('science texts', () => {
  it('says what is missing in points', () => {
    expect(scienceGoalText(6)).toBe(`Science sent: 6 / ${POINTS_TO_LAUNCH} points`);
    expect(scienceMissingText({})).toMatch(new RegExp(`Still missing: ${POINTS_TO_LAUNCH} points`));
    expect(scienceMissingText({ pendingPoints: POINTS_TO_LAUNCH })).toMatch(/send it/);
    expect(scienceMissingText({ sentPoints: POINTS_TO_LAUNCH })).toMatch(/Enough science is home/);
  });

  it('shows the cost of the package on the button', () => {
    expect(uploadButtonLabel(sciencePackage([]))).toMatch(/nothing new/);
    expect(uploadButtonLabel(sciencePackage(scans(2)))).toBe(`Send 2 items = 2 points to Earth (${UPLOAD_BASE_COST + 2 * UPLOAD_COST_PER_ITEM}% power)`);
  });

  it('explains each upload result', () => {
    const base = { items: 0, points: 0, cost: 0, leftAfter: 0, sentPoints: 0, dataSent: false };
    expect(uploadResultText({ ...base, status: 'empty' })).toMatch(/Nothing new/);
    expect(uploadResultText({ ...base, status: 'no-energy', cost: 14 })).toMatch(/needs 14% of the battery/);
    const sent = uploadResultText({ status: 'sent', items: 3, points: 5, cost: 17, leftAfter: 2, sentPoints: 5, dataSent: false });
    expect(sent).toMatch(/Sent 3 items \(\+5 points\)/);
    expect(sent).toMatch(/2 more items wait/);
    expect(sent).toMatch(new RegExp(`Science sent: 5 / ${POINTS_TO_LAUNCH} points`));
    expect(uploadResultText({ status: 'sent', items: 1, points: 4, cost: 11, leftAfter: 0, sentPoints: POINTS_TO_LAUNCH, dataSent: true })).toMatch(/Earth has enough/);
  });
});
