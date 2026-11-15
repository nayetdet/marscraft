// @ts-nocheck
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { MEDBAY_BONE_TEXT } from './stationText.ts';

describe('medbay text (issue #111)', () => {
  it('says what was measured in space and that Mars gravity is still an open question', () => {
    expect(MEDBAY_BONE_TEXT).toMatch(/Space Station/);
    expect(MEDBAY_BONE_TEXT).toMatch(/about 1% less dense every month/);
    expect(MEDBAY_BONE_TEXT).toMatch(/do not know/);
    // Nenhum astronauta viveu meses em 0,38 g: o jogo nao afirma quanto se perde em Marte
    expect(MEDBAY_BONE_TEXT).not.toMatch(/0\.38|lose bone mineral density and muscle mass/);
  });
});

describe('NASA Data screen (issue #111)', () => {
  const html = readFileSync(new URL('../../public/game.html', import.meta.url), 'utf8');
  const screen = html.slice(html.indexOf('id="sources-screen"'), html.indexOf('id="demo-screen"'));
  const firstNote = screen.match(/<p class="info-note">([^<]*)<\/p>/)[1];

  it('does not claim that every number comes from NASA', () => {
    expect(firstNote).not.toMatch(/every number/i);
    expect(firstNote).toMatch(/game rules/);
    expect(firstNote).toMatch(/NASA data/);
  });

  it('still says the data is embedded, not live', () => {
    expect(firstNote).toMatch(/saved inside the game/);
    expect(firstNote).toMatch(/not live/);
  });

  it('describes the live space weather and the fallback to the saved data (issue #100)', () => {
    expect(firstNote).toMatch(/LIVE from NASA DONKI/);
    expect(firstNote).toMatch(/without internet, the game uses the saved data and never says LIVE/i);
    expect(screen).toContain('id="sources-donki-date"');
  });
});
