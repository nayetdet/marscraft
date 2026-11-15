// @ts-nocheck
import { describe, expect, it } from 'vitest';
import { BLOCK_IDS } from '../../config/blockTypes.ts';
import { ACT2_CONFIG as C, SCIENCE_CONFIG } from '../../config/constants.ts';
import { SAMPLE_CATEGORY, SCAN_CATALOG, getScanEntry } from '../../data/scanCatalog.ts';
import { DustWeather } from '../../mission/dustWeather.ts';
import { missionReport } from '../../mission/missionReport.ts';
import { discoveryItem } from '../../mission/sciencePackage.ts';
import { SurvivalSystem } from '../../player/SurvivalSystem.ts';
import { ScannerSystem } from '../../scanner/ScannerSystem.ts';
import { ScanJournal } from '../../scanner/scanJournal.ts';
import { resolveScanTarget } from '../../scanner/scanTargeting.ts';
import { translate } from '../../ui/i18n.ts';
import { Act2Controller } from './Act2Controller.ts';
import {
  DUST_DEVIL_ID, DUST_DEVIL_NOTICE, STORM_SCAN_IDS, STORM_SCAN_NAMES, STORM_WALL_ID, STORM_WALL_NOTICE,
  StormScans, stormScansMissedText, stormScansSummary,
} from './act2StormScans.ts';

// Fichas raras que so existem na tempestade (issue #419)

const EMPTY_WORLD = { getBlock: () => BLOCK_IDS.AIR };
const DEVIL_POS = { x: 20, y: 10, z: 0 };
const EYE = { x: 0, y: 12, z: 0 };
const AT_DEVIL = { x: 1, y: 0, z: 0 };
const AT_SKY = { x: 0, y: 1, z: 0 };

// O mesmo caminho do GameEngine._updateScanner: mira -> alvo -> regra das fichas de tempestade
function aim(scans, dir) {
  return scans.retarget(resolveScanTarget({ world: EMPTY_WORLD, origin: EYE, dir, objects: [scans.devilBox], skyBodies: [], maxDist: 80 }));
}

// Segura o scan ate o anel encher (ou ate `seconds` passarem)
function holdScan(scanner, scans, dir, seconds = 3) {
  let completed = null;
  for (let t = 0; t < seconds; t += 0.1) {
    const state = scanner.update(0.1, aim(scans, dir)?.id ?? null, true);
    completed = state.completed ?? completed;
  }
  return completed;
}

describe('storm-only scan cards (issue #419)', () => {
  it('adds two rare cards with real facts and a NASA source', () => {
    for (const id of STORM_SCAN_IDS) {
      const entry = getScanEntry(id);
      expect(entry.title).toBe(STORM_SCAN_NAMES[id]);
      expect(SCIENCE_CONFIG.RARE_DISCOVERY_CATEGORIES).toContain(entry.category);
      expect(discoveryItem(entry)).toMatchObject({ id: `scan:${id}`, points: 2, rare: true });
      const real = entry.facts.filter((fact) => fact.source.url);
      expect(real.length).toBeGreaterThanOrEqual(2);
      expect(real.some((fact) => /^https:\/\/(www\.)?(science\.)?(jpl\.)?nasa\.gov\//.test(fact.source.url))).toBe(true);
      // Quando da para escanear e regra de jogo, e a ficha diz isso
      expect(entry.facts.some((fact) => fact.label === 'Scan' && fact.source.name === 'MarsCraft game rule')).toBe(true);
    }
  });

  it('updates the journal total: 27 scope targets, and the two cards count in "n / total"', () => {
    const journal = new ScanJournal();
    expect(SCAN_CATALOG.filter((entry) => entry.category !== SAMPLE_CATEGORY)).toHaveLength(27);
    expect(journal.total).toBe(SCAN_CATALOG.length);
    expect(journal.categoryProgress('landscape').total).toBe(4);
    const before = journal.count;
    journal.record(DUST_DEVIL_ID);
    journal.record(STORM_WALL_ID);
    expect(journal.count).toBe(before + 2);
  });
});

describe('StormScans: only while the event is happening', () => {
  it('makes the dust devil a target only while it exists and the child is outside', () => {
    const scans = new StormScans();
    // Sem o evento: a caixa fica fora de alcance
    scans.sync(false, null, true);
    expect(aim(scans, AT_DEVIL)).toBeNull();
    expect(scans.available(DUST_DEVIL_ID)).toBe(false);
    // Evento ativo, la fora
    scans.sync(false, DEVIL_POS, true);
    expect(aim(scans, AT_DEVIL)).toMatchObject({ id: DUST_DEVIL_ID });
    expect(scans.devilBox).toMatchObject({
      minX: DEVIL_POS.x - C.STORM_SCAN_DEVIL_HALF_WIDTH, maxX: DEVIL_POS.x + C.STORM_SCAN_DEVIL_HALF_WIDTH,
      minY: DEVIL_POS.y, maxY: DEVIL_POS.y + C.STORM_SCAN_DEVIL_HEIGHT,
    });
    // Evento ativo, mas dentro da base
    scans.sync(false, DEVIL_POS, false);
    expect(aim(scans, AT_DEVIL)).toBeNull();
    // O evento acabou
    scans.sync(false, null, true);
    expect(aim(scans, AT_DEVIL)).toBeNull();
  });

  it('turns the sky into the dust wall only outside, during the dust storm', () => {
    const scans = new StormScans();
    scans.sync(false, null, true);
    expect(aim(scans, AT_SKY)).toMatchObject({ id: 'atmosphere' });
    scans.sync(true, null, false);
    expect(aim(scans, AT_SKY)).toMatchObject({ id: 'atmosphere' });
    scans.sync(true, null, true);
    expect(aim(scans, AT_SKY)).toMatchObject({ id: STORM_WALL_ID, hit: null });
    scans.sync(false, null, true);
    expect(aim(scans, AT_SKY)).toMatchObject({ id: 'atmosphere' });
  });

  it('never lets a storm card through when its event is off, even if something aims at it', () => {
    const scans = new StormScans();
    scans.sync(false, null, true);
    for (const id of STORM_SCAN_IDS) expect(scans.retarget({ id, distance: 5, hit: null })).toBeNull();
    expect(scans.retarget(null)).toBeNull();
    const rock = { id: 'regolith', distance: 3, hit: { x: 1, y: 2, z: 3 } };
    expect(scans.retarget(rock)).toBe(rock);
  });

  it('does not allocate a target or a box per frame', () => {
    const scans = new StormScans();
    scans.sync(true, DEVIL_POS, true);
    const box = scans.devilBox;
    const wall = aim(scans, AT_SKY);
    scans.sync(true, { x: 30, y: 11, z: 4 }, true);
    expect(scans.devilBox).toBe(box);
    expect(aim(scans, AT_SKY)).toBe(wall);
  });

  it('registers the cards in the journal only with the event active (2 points each)', () => {
    const journal = new ScanJournal();
    const scanner = new ScannerSystem(journal);
    const scans = new StormScans();

    // Fora do evento: segurar o scan nao registra nada
    scans.sync(false, null, true);
    expect(holdScan(scanner, scans, AT_DEVIL)).toBeNull();
    holdScan(scanner, scans, AT_SKY);
    expect(journal.has(DUST_DEVIL_ID)).toBe(false);
    expect(journal.has(STORM_WALL_ID)).toBe(false);
    scanner.reset();

    // Redemoinho ativo
    scans.sync(false, DEVIL_POS, true);
    const devil = holdScan(scanner, scans, AT_DEVIL);
    expect(devil.entry.id).toBe(DUST_DEVIL_ID);
    expect(devil.discovery.missionNew).toBe(true);
    expect(discoveryItem(devil.entry).points).toBe(SCIENCE_CONFIG.POINTS_PER_RARE_DISCOVERY);
    scanner.reset();

    // Tempestade ativa
    scans.sync(true, null, true);
    const wall = holdScan(scanner, scans, AT_SKY);
    expect(wall.entry.id).toBe(STORM_WALL_ID);
    expect(discoveryItem(wall.entry).points).toBe(2);
    expect(journal.missionScans.has(STORM_WALL_ID)).toBe(true);
  });

  it('a scan in progress stops when the event ends', () => {
    const journal = new ScanJournal();
    const scanner = new ScannerSystem(journal);
    const scans = new StormScans();
    scans.sync(false, DEVIL_POS, true);
    expect(holdScan(scanner, scans, AT_DEVIL, 0.5)).toBeNull(); // meio scan
    scans.sync(false, null, true);
    expect(holdScan(scanner, scans, AT_DEVIL)).toBeNull();
    expect(journal.has(DUST_DEVIL_ID)).toBe(false);
  });
});

describe('StormScans: the notice', () => {
  it('shows once per event, only with the scope, and states the cost', () => {
    const scans = new StormScans();
    const none = new Set();
    scans.sync(true, null, false);
    expect(scans.notice(false, none)).toBeNull(); // sem a luneta: nada
    expect(scans.notice(true, none)).toBe(STORM_WALL_NOTICE);
    expect(scans.notice(true, none)).toBeNull(); // uma vez so
    // A tempestade acaba e outra comeca: avisa de novo
    scans.sync(false, null, false);
    expect(scans.notice(true, none)).toBeNull();
    scans.sync(true, null, false);
    expect(scans.notice(true, none)).toBe(STORM_WALL_NOTICE);

    expect(STORM_WALL_NOTICE).toMatch(/^Rare scan outside, only during the storm/);
    expect(STORM_WALL_NOTICE).toContain(`wears your suit ${C.STORM_SUIT_WEAR_MULTIPLIER}x faster`);
    expect(DUST_DEVIL_NOTICE).toMatch(/^Rare scan outside, only while it spins: scan the dust devil/);
    expect(DUST_DEVIL_NOTICE).toContain('spends suit air');
  });

  it('warns about each event on its own and skips a card already scanned in this game', () => {
    const scans = new StormScans();
    scans.sync(true, DEVIL_POS, true);
    expect(scans.notice(true, new Set())).toBe(STORM_WALL_NOTICE);
    expect(scans.notice(true, new Set())).toBe(DUST_DEVIL_NOTICE);
    expect(scans.notice(true, new Set())).toBeNull();

    const done = new StormScans();
    done.sync(true, DEVIL_POS, true);
    expect(done.notice(true, new Set([STORM_WALL_ID, DUST_DEVIL_ID]))).toBeNull();
    expect(done.missed(new Set([STORM_WALL_ID, DUST_DEVIL_ID]))).toEqual([]);
  });

  it('has the notice and the report line in Portuguese and Spanish', () => {
    const texts = [
      STORM_WALL_NOTICE, DUST_DEVIL_NOTICE,
      stormScansMissedText([STORM_WALL_ID]), stormScansMissedText([DUST_DEVIL_ID]), stormScansMissedText(STORM_SCAN_IDS),
      ...STORM_SCAN_IDS.flatMap((id) => [getScanEntry(id).title, getScanEntry(id).summary, getScanEntry(id).why]),
    ];
    for (const text of texts) {
      expect(translate(text, 'pt-BR')).not.toBe(text);
      expect(translate(text, 'es')).not.toBe(text);
    }
    expect(translate(STORM_WALL_NOTICE, 'pt-BR')).toContain('só durante a tempestade');
    expect(translate(DUST_DEVIL_NOTICE, 'es')).toContain('solo mientras gira el remolino');
  });
});

describe('StormScans: the report line "science you let pass"', () => {
  it('lists only the cards the child had the chance to scan and did not', () => {
    const scans = new StormScans();
    const scanned = new Set();
    expect(scans.missed(scanned)).toEqual([]); // nunca houve chance
    scans.sync(true, null, false);
    scans.notice(false, scanned);
    expect(scans.missed(scanned)).toEqual([]); // tempestade sem a luneta nao e chance
    scans.notice(true, scanned);
    expect(scans.missed(scanned)).toEqual([STORM_WALL_ID]);
    scans.sync(true, DEVIL_POS, false);
    scans.notice(true, scanned);
    expect(scans.missed(scanned)).toEqual([STORM_WALL_ID, DUST_DEVIL_ID]);
    scanned.add(STORM_WALL_ID);
    expect(scans.missed(scanned)).toEqual([DUST_DEVIL_ID]);
    scanned.add(DUST_DEVIL_ID);
    expect(scans.missed(scanned)).toEqual([]);
  });

  it('writes the line only when something was left behind', () => {
    expect(stormScansSummary({})).toBeNull();
    expect(stormScansSummary({ stormScansMissed: [] })).toBeNull();
    expect(stormScansSummary({ stormScansMissed: [DUST_DEVIL_ID] })).toEqual({
      missed: [DUST_DEVIL_ID],
      text: 'Science you let pass: Dust Devil (storm-only scans)',
    });
    expect(stormScansSummary({ stormScansMissed: [DUST_DEVIL_ID, STORM_WALL_ID] }).text)
      .toBe('Science you let pass: Dust Storm Wall, Dust Devil (storm-only scans)');
  });

  it('reaches the mission report next to the other trade-off lines', () => {
    const stats = {
      hoursPlayed: 60, sols: 3, deaths: 0, stormHours: 0, protectedStormHours: 0, totalDoseMsv: 0.4,
      boneDensity: 90, muscleStrength: 90, workoutCount: 3, harvestCount: 4, cropVariety: 3,
      iceDelivered: 10, standbyHours: 0, discoveries: 10, scanTotal: 27,
    };
    expect(missionReport(stats).stormScans).toBeNull();
    expect(missionReport({ ...stats, stormScansMissed: [STORM_WALL_ID] }).stormScans.text)
      .toBe('Science you let pass: Dust Storm Wall (storm-only scans)');
  });
});

describe('Act2Controller: storm scans wired to the game', () => {
  function fakeEngine() {
    const engine = {
      mission: { dustWeather: new DustWeather({ rng: () => 0.5 }) },
      survival: new SurvivalSystem(),
      scanJournal: new ScanJournal(),
      eventEffects: { type: null, devilPos: { ...DEVIL_POS } },
      hud: { toasts: [], showToast(text, ms) { this.toasts.push({ text, ms }); }, renderHotbar() {} },
    };
    return { engine, act: new Act2Controller(engine), dust: engine.mission.dustWeather };
  }

  it('warns once per storm, only after the child has the scope', () => {
    const f = fakeEngine();
    f.dust.force('storm');
    f.act.update(5, { hours: 0 }, true);
    expect(f.engine.hud.toasts).toEqual([]); // sem a luneta
    expect(f.act.stormScansMissed()).toEqual([]);

    f.engine.survival.addBlockToInventory(BLOCK_IDS.SCOPE);
    f.act.update(0.1, { hours: 0 }, true);
    f.act.update(0.1, { hours: 0 }, true);
    expect(f.engine.hud.toasts).toEqual([{ text: STORM_WALL_NOTICE, ms: C.STORM_SCAN_NOTICE_MS }]);
    expect(f.act.stormScansMissed()).toEqual([STORM_WALL_ID]);

    // O redemoinho aparece: outro aviso, uma vez
    f.engine.eventEffects.type = 'dustDevil';
    f.act.update(0.1, { hours: 0 }, true);
    expect(f.engine.hud.toasts).toHaveLength(1); // espera um pouco depois de o evento comecar
    f.act.update(C.STORM_SCAN_NOTICE_DELAY_SECONDS, { hours: 0 }, true);
    f.act.update(0.1, { hours: 0 }, true);
    expect(f.engine.hud.toasts.map((t) => t.text)).toEqual([STORM_WALL_NOTICE, DUST_DEVIL_NOTICE]);
  });

  it('gives the scanner the dust devil box and the dust wall only during the event, outside', () => {
    const f = fakeEngine();
    const survival = f.engine.survival;
    const sky = { id: 'atmosphere', distance: Infinity, hit: null };
    survival.insidePressurizedShip = false;
    expect(f.act.stormScanBox().maxY).toBeLessThan(-1000);
    expect(f.act.stormScanTarget(sky)).toBe(sky);

    f.dust.force('storm');
    f.engine.eventEffects.type = 'dustDevil';
    expect(f.act.stormScanBox()).toMatchObject({ scanId: DUST_DEVIL_ID, minY: DEVIL_POS.y });
    expect(f.act.stormScanTarget(sky).id).toBe(STORM_WALL_ID);

    survival.insidePressurizedShip = true;
    f.act.stormScanBox();
    expect(f.act.stormScanTarget(sky)).toBe(sky);
    expect(f.act.stormScanTarget({ id: DUST_DEVIL_ID, distance: 4, hit: null })).toBeNull();

    survival.insidePressurizedShip = false;
    f.dust.force('end');
    f.engine.eventEffects.type = null;
    expect(f.act.stormScanBox().maxY).toBeLessThan(-1000);
    expect(f.act.stormScanTarget(sky)).toBe(sky);
  });

  it('reports what was left behind and clears it once the card is scanned', () => {
    const f = fakeEngine();
    f.engine.survival.addBlockToInventory(BLOCK_IDS.SCOPE);
    f.engine.eventEffects.type = 'dustDevil';
    f.act.update(5, { hours: 0 }, true);
    f.engine.eventEffects.type = null;
    f.act.update(0.1, { hours: 0 }, true);
    expect(f.act.stormScansMissed()).toEqual([DUST_DEVIL_ID]);
    f.engine.scanJournal.record(DUST_DEVIL_ID);
    expect(f.act.stormScansMissed()).toEqual([]);
  });
});
