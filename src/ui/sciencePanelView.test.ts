import { describe, expect, it } from 'vitest';
import { SCIENCE_CONFIG } from '../config/constants.ts';
import { discoveryItem, sampleItem, sciencePackage, scienceStatus } from '../mission/sciencePackage.ts';
import { sciencePanelHtml, sciencePanelModel } from './sciencePanelView.ts';

const earth = discoveryItem({ id: 'earth', title: 'Earth', category: 'sky' });
const hull = discoveryItem({ id: 'habitat', title: 'Habitat <A>', category: 'base' });
const sulfur = sampleItem(0, { typeId: 'sample-sulfur', name: 'Yellow Sulfur Crystals', points: 4 });
const items = [earth, hull, sulfur];
const ledger = { sentIds: new Set([earth.id]), usedIds: new Set<string>() };

const model = () => sciencePanelModel(scienceStatus(items, ledger), sciencePackage(items, ledger), 1);

describe('SCIENCE FOR EARTH panel', () => {
  it('lists what was found by name and points, split into to send and sent', () => {
    const m = model();
    expect(m.toSend.map((r) => [r.name, r.points])).toEqual([['Yellow Sulfur Crystals', 4], ['Habitat <A>', 1]]);
    expect(m.sent.map((r) => r.name)).toEqual(['Earth']);
    expect(m).toMatchObject({ toSendPoints: 5, sentPoints: 2, met: false, rawSamples: 1 });
    expect(m.goalText).toBe(`Science sent: 2 / ${SCIENCE_CONFIG.POINTS_TO_LAUNCH} points`);
    expect(m.fill).toBeCloseTo(2 / SCIENCE_CONFIG.POINTS_TO_LAUNCH);
  });

  it('shows the power cost of the next upload and why science goes home', () => {
    const m = model();
    expect(m.next).toMatch(/2 items = 5 points/);
    expect(m.next).toContain(`${SCIENCE_CONFIG.UPLOAD_BASE_COST + 2 * SCIENCE_CONFIG.UPLOAD_COST_PER_ITEM}% power`);
    expect(m.why).toMatch(/Mars Relay Network/);
    expect(sciencePanelModel(scienceStatus([]), sciencePackage([])).next).toMatch(/nothing new/);
  });

  it('draws one row per item, with the icon, and escapes names', () => {
    const html = sciencePanelHtml(model(), (r) => `icon:${r.icon}`);
    expect(html.match(/<li /g)).toHaveLength(3);
    expect(html).toContain('src="icon:sample-sulfur"');
    expect(html).toContain('Habitat &lt;A&gt;');
    expect(html).toContain('TO SEND');
    expect(html).toContain('SENT TO EARTH');
    expect(html).toContain('RARE');
    expect(html).toMatch(/1 sample in your bag/);
  });

  it('fills the goal bar and marks the goal when enough points and the 3 clues are home', () => {
    const all = { sentIds: new Set(items.map((i) => i.id)), usedIds: new Set<string>() };
    const big = [
      ...Array.from({ length: SCIENCE_CONFIG.POINTS_TO_LAUNCH }, (_, i) => discoveryItem({ id: `t${i}`, title: `T${i}`, category: 'base' })),
      sampleItem(100, { typeId: 'sample-ice-core', name: 'Ice', points: 2 }),
      sampleItem(101, { typeId: 'sample-mudstone', name: 'Mudstone', points: 3 }),
      sampleItem(102, { typeId: 'sample-sulfur', name: 'Sulfur', points: 4 }),
    ];
    const done = { sentIds: new Set(big.map((i) => i.id)), usedIds: new Set<string>() };
    expect(sciencePanelModel(scienceStatus(items, all), sciencePackage(items, all)).met).toBe(false);
    const m = sciencePanelModel(scienceStatus(big, done), sciencePackage(big, done));
    expect(m).toMatchObject({ met: true, fill: 1 });
    expect(sciencePanelHtml(m, () => '')).toContain('is-met');
  });
});
