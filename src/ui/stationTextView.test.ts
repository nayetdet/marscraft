// @ts-nocheck
import { describe, it, expect } from 'vitest';
import { stationTextBlocks, stationTextHtml } from './stationTextView.ts';

describe('station text view', () => {
  it('turns "NAME: value" lines into stats and splits two stats on one line', () => {
    const blocks = stationTextBlocks('BATTERY: 85%   OXYGEN: 20/20\nCO2 FILTER: 70%');
    expect(blocks).toEqual([{ type: 'stats', stats: [
      { label: 'BATTERY', value: '85%' }, { label: 'OXYGEN', value: '20/20' }, { label: 'CO2 FILTER', value: '70%' },
    ] }]);
  });

  it('keeps a warning glued to its number', () => {
    const [block] = stationTextBlocks('BASE WATER TANK: 12 L   (FROZEN)');
    expect(block.stats).toEqual([{ label: 'BASE WATER TANK', value: '12 L (FROZEN)' }]);
  });

  it('separates headings, lists, explanations and the real case', () => {
    const blocks = stationTextBlocks('WHERE YOUR DOSE CAME FROM:\n  Trip from Earth: 365 mSv\n  Walks outside: 3 mSv\n\nWater stops radiation.\nReal case: astronauts shelter behind water bags.');
    expect(blocks.map((b) => b.type)).toEqual(['heading', 'list', 'text', 'fact']);
    expect(blocks[1].items).toEqual(['Trip from Earth: 365 mSv', 'Walks outside: 3 mSv']);
  });

  it('a sentence with a colon is not a stat', () => {
    expect(stationTextBlocks('Rations are ready: eat one now.')[0].type).toBe('text');
  });

  it('escapes the text', () => {
    expect(stationTextHtml('NOTE: <b>x</b>')).toContain('&lt;b&gt;x&lt;/b&gt;');
    expect(stationTextHtml('')).toBe('');
  });
});
