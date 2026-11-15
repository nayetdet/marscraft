import { afterEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { eventCard, meteorToast, quakeToast, dustDevilPanelsToast } from '../mission/eventText.ts';
import { bulletinText, radiationStatusText, stormEventMessage, stormSourceText, stormStatusText } from '../mission/missionText.ts';
import { doseHistoryText, doseVictoryRows } from '../mission/doseBudget.ts';
import { missionReport } from '../mission/missionReport.ts';
import { dustStatus, weatherReportCard } from '../mission/weatherText.ts';
import { SCAN_CATALOG, SCAN_CATEGORIES } from '../data/scanCatalog.ts';
import { scienceCounterText } from '../story/objectiveView.ts';
import {
  LANGUAGE_LABELS,
  LANGUAGE_STORAGE_KEY,
  LANGUAGES,
  checkTranslationCoverage,
  checkGameplayTranslationCoverage,
  getLanguage,
  readLanguagePreference,
  setLanguage,
  translate,
} from './i18n.ts';

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  };
}

const SOURCE_ROOTS = ['src/core', 'src/crew', 'src/mission', 'src/player', 'src/ui', 'src/data'];
const ALLOWED_SOURCE_NAMES = new Set([
  'NASA RadLab + DONKI', 'NASA ICES 2024: Sabatier', 'NASA OSDR RadLab (Curiosity MSL-RAD, LRO CRaTER)',
  'NASA Science: Deimos', 'NASA JPL, 2017; NASA DONKI', 'Quinn et al., UNH (PREDICCS)',
  'NASA RadLab (Curiosity MSL-RAD)', 'Saccharomyces cerevisiae',
  'Drosophila melanogaster', 'Homo sapiens', 'Mus musculus', 'Rattus norvegicus', 'Urocitellus parryii',
  'NASA OSDR', 'real data from ', 'noopener noreferrer',
  ': NASA study', 'Derick Bessa', 'João Pedro Moreira', 'Isaac Duarte', 'Letícia Freitas', 'Renan França', 'Lucas Rocha',
  'João Pedro', 'Moreira', 'MarsCraft', 'NASA',
  'DOSE', 'Mouse', 'Shift', 'Volume',
]);

function decodeHtmlEntities(text: string): string {
  return text.replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&#39;', "'")
    .replaceAll('&apos;', "'").replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&nbsp;', ' ');
}

function isCopyCandidate(text: string, minimumLength = 12, allowSingleWord = false): boolean {
  const trimmed = text.trim();
  const words = trimmed.split(/\s+/);
  const classTokens = words.length > 1 && words.every((word) => /^[a-z][a-z0-9-]*$/i.test(word))
    && words.some((word) => word.includes('-'));
  const hasNaturalWords = /[a-z]{2,}\s+[a-z]{2,}/i.test(trimmed)
    || (allowSingleWord && /^[A-Za-z]{3,}$/.test(trimmed));
  return trimmed.length >= minimumLength && hasNaturalWords
    && !/[<>={}]/.test(trimmed) && !/^(?:rgba?\(|[.#(]|gym-hud-)/i.test(trimmed)
    && !classTokens && !/^\w+\s+\d+px\s+\w+/i.test(trimmed)
    && !/^(?:Rover: X \d.*\/ Y \d.*\/ Z \d.*)$/.test(trimmed);
}

function findUntranslatedSourceCopy(): string[] {
  const root = process.cwd();
  const strings = new Set<string>();
  const visitDirectory = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        visitDirectory(file);
      } else if (file.endsWith('.ts') && !file.endsWith('.test.ts')
        && !path.basename(file).startsWith('i18n') && path.basename(file) !== 'DebugOverlay.ts') {
        const sourceFile = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
        const visitNode = (node: ts.Node) => {
          if ((ts.isStringLiteralLike(node) || ts.isNoSubstitutionTemplateLiteral(node)) && isCopyCandidate(node.text)) {
            strings.add(node.text);
          }
          ts.forEachChild(node, visitNode);
        };
        visitNode(sourceFile);
      }
    }
  };
  SOURCE_ROOTS.forEach((dir) => visitDirectory(path.join(root, dir)));

  const markup = fs.readFileSync(path.join(root, 'public/game.html'), 'utf8');
  for (const match of markup.matchAll(/>([^<>]+)</g)) {
    const text = decodeHtmlEntities(match[1]);
    if (isCopyCandidate(text, 3, true)) strings.add(text);
  }
  for (const match of markup.matchAll(/(?:aria-label|title|placeholder|alt)\s*=\s*"([^"]+)"/g)) {
    const text = decodeHtmlEntities(match[1]);
    if (isCopyCandidate(text, 3, true)) strings.add(text);
  }

  return [...strings].filter((text) => !ALLOWED_SOURCE_NAMES.has(text)
    && (translate(text, 'pt-BR') === text || translate(text, 'es') === text)).sort();
}

afterEach(() => setLanguage('en', memoryStorage()));

describe('game language catalog', () => {
  it('offers English, Brazilian Portuguese, and Spanish without emoji labels', () => {
    expect(LANGUAGES).toEqual(['en', 'pt-BR', 'es']);
    expect(LANGUAGE_LABELS).toEqual({
      en: 'English',
      'pt-BR': 'Português (Brasil)',
      es: 'Español',
    });
    expect(Object.values(LANGUAGE_LABELS).join('')).not.toMatch(/\p{Extended_Pictographic}/u);
  });

  it('translates shared menu copy and falls back to the English source for unknown text', () => {
    expect(translate('Options', 'pt-BR')).toBe('Opções');
    expect(translate('Options', 'es')).toBe('Opciones');
    expect(translate('Skip ', 'pt-BR')).toBe('Pular ');
    expect(translate('Skip ', 'es')).toBe('Saltar ');
    expect(translate('POWER 72%', 'pt-BR')).toBe('ENERGIA 72%');
    expect(translate('Speed: 4 km/h', 'es')).toBe('Velocidad: 4 km/h');
    expect(translate('Real data from 15/11/2026', 'pt-BR')).toBe('Dados reais de 15/11/2026');
    expect(translate('NASA DONKI, real data from 15/11/2026', 'es')).toBe('NASA DONKI, datos reales del 15/11/2026');
    expect(translate('Distance calculated for 15/11/2026 from NASA/JPL planet orbits', 'pt-BR')).toContain('órbitas dos planetas da NASA/JPL');
    expect(translate('Your 3 clues say: Gale was a lake, good for life', 'es')).toBe('Tus 3 pistas indican: Gale fue un lago, un lugar donde pudo haber vida');
    expect(translate('After a 7-month trip from Earth, you reach Mars.', 'pt-BR')).toBe('Após uma viagem de 7 meses desde a Terra, você chega a Marte.');
    expect(translate('Touchdown! You are 225 million km from home.', 'es')).toBe('¡Aterrizaje! Estás a 225 millones de km de casa.');
    expect(translate('Nia brings lettuce from the greenhouse.', 'es')).toBe('Nia trae lechuga del invernadero.');
    expect(translate('Talk to Amira here to grab one.', 'pt-BR')).toBe('Fale com Amira aqui para pegar uma.');
    expect(translate('ACT 2 - STEP 3/8: FIND A CLUE', 'es')).toBe('ACTO 2 - PASO 3/8: ENCUENTRA UNA PISTA');
    expect(translate('FIRST: CHARGE THE ROVER', 'pt-BR')).toBe('PRIMEIRO: CARREGAR O ROVER');
    expect(translate('3 discoveries and 2 samples', 'es')).toBe('3 hallazgos y 2 muestras');
    expect(translate('CHARGED 100%', 'pt-BR')).toBe('CARREGADO 100%');
    expect(translate('100% (-60°C NIGHT READY)', 'es')).toBe('100% (-60°C LISTO PARA LA NOCHE)');
    expect(translate('Extra tubes make the rocket heavier (+2 ice each).', 'pt-BR')).toBe('Cada tubo extra deixa o foguete mais pesado (+2 bloco de gelo).');
    expect(translate(`Solar storm coming! The Sun threw out a giant cloud of particles (a CME). NASA's model said it would reach Mars on 18/11/2026: in the game that is 4h 20m from now. Based on a real CME that left the Sun on 15/11/2026 at 500 km/s, headed to Mars (NASA DONKI, real data from 15/11/2026).`, 'pt-BR'))
      .toContain('Tempestade solar a caminho!');
    expect(translate('POWER 72%', 'en')).toBe('POWER 72%');
    expect(translate('New untranslated text', 'es')).toBe('New untranslated text');
    expect(translate('THE SUN', 'pt-BR')).toBe('O SOL');
    expect(translate('0.14 km/h top speed', 'es')).toBe('Velocidad máxima: 0,14 km/h');
    expect(translate('Solar Panels', 'pt-BR')).toBe('Painéis solares');
    expect(translate('Mission Commander', 'es')).toBe('Comandante de misión');
    expect(translate('OSDR-123: NASA study', 'pt-BR')).toBe('OSDR-123: estudo da NASA');
    expect(translate('Astronaut rank: CADET. 4 finds left', 'es'))
      .toBe('Rango de astronauta: CADETE. Faltan 4 hallazgos');
    expect(translate('PLANETS, new find', 'pt-BR')).toBe('PLANETAS, nova descoberta');
    expect(translate('Press F: collect Dark Dune Sand (+4 science in the lab)', 'es'))
      .toBe('Pulsa F: recoger Arena oscura de duna (+4 puntos de ciencia en el laboratorio)');
    expect(translate('LETTUCE | 2 L water / 25% power / 8s / +5 food', 'pt-BR'))
      .toBe('ALFACE | 2 L de água / 25% de energia / 8s / +5 de alimento');
    expect(translate('Collected: lettuce, soy | Harvests: 3', 'es'))
      .toBe('Recogido: lechuga, soja | Cosechas: 3');
    expect(translate('WATER WALL: 5 / 20 L\nBLOCKS: 25% of storm radiation inside this booth\nBASE WATER TANK: 15 / 100 L', 'pt-BR'))
      .toContain('PAREDE DE ÁGUA: 5 / 20 L\nBLOQUEIA 25% da radiação da tempestade neste abrigo\nTANQUE DE ÁGUA DA BASE: 15 / 100 L');
    expect(translate('Battery set to 15%.', 'es')).toBe('Batería ajustada al 15%.');
    expect(translate('Scanning sky... 62%', 'pt-BR')).toBe('Escaneando céu... 62%');
    expect(translate('Re-scanning terrain... 45%', 'es')).toBe('Escaneando terreno otra vez... 45%');
    expect(translate('NEW 2/5', 'pt-BR')).toBe('NOVO 2/5');
    expect(translate('FOUND', 'es')).toBe('ENCONTRADO');
    expect(translate('Sleep until sunrise (8 h: food -3, water -2)', 'es'))
      .toBe('Dormir hasta el amanecer (8 h: comida −3, agua −2)');
    expect(translate('Nap (1 h 30 min: food -1, water -1)', 'pt-BR'))
      .toBe('Cochilo (1 h 30 min: comida −1, água −1)');
    expect(translate('), measured from orbit by HiRISE, a camera on NASA\'s Mars Reconnaissance Orbiter. One block is about 1 meter. Real data from 14/11/2026', 'pt-BR'))
      .toContain('medida em órbita pela HiRISE');
  });

  it('has matching translation keys in both non-English catalogs', () => {
    expect(checkTranslationCoverage()).toEqual({ 'pt-BR': [], es: [] });
  });

  it('translates audited gameplay strings instead of silently falling back to English', () => {
    expect(checkGameplayTranslationCoverage()).toEqual({ 'pt-BR': [], es: [] });
    expect(translate('A solar storm is coming. Stay awake and get to the storm shelter!', 'pt-BR'))
      .toBe('Uma tempestade solar está chegando. Fique acordado e vá para o abrigo!');
    expect(translate('Nothing yet. Scan with the scope or bring samples from the map.', 'es'))
      .toBe('Aún no hay nada. Escanea con la mira o trae muestras del mapa.');
  });

  it('keeps long source copy in the game and HTML translated in both locales', () => {
    expect(findUntranslatedSourceCopy()).toEqual([]);
  });

  it('localizes the complete scanner catalog, including sample facts and labels', () => {
    const untranslatedByDesign = new Set([
      'Base', 'Deimos', 'Phobos', 'Perseverance',
      'NASA OSDR RadLab (Curiosity MSL-RAD, LRO CRaTER)', 'NASA Science: Deimos',
    ]);
    const sourceCopy = new Set<string>(SCAN_CATEGORIES.map((category) => category.label));
    for (const entry of SCAN_CATALOG) {
      sourceCopy.add(entry.title);
      sourceCopy.add(entry.summary);
      sourceCopy.add(entry.why);
      for (const fact of entry.facts) {
        sourceCopy.add(fact.label);
        sourceCopy.add(fact.value);
        sourceCopy.add(fact.source.name);
      }
    }

    const untranslated = [...sourceCopy].filter((text) => !untranslatedByDesign.has(text)
      && (translate(text, 'pt-BR') === text || translate(text, 'es') === text));
    expect(untranslated).toEqual([]);
  });

  it('translates dynamic event, weather, dose, and report messages without losing values', () => {
    const storm = {
      live: false,
      sep: null,
      cme: { startTime: '2026-11-15', speedKmS: 500, marsArrivalTime: '2026-11-20' },
      leadHours: 3,
    };
    const source = { live: false, fetchedAt: '2026-11-15' };
    const ledger = { transit: 365, eva: 3, storm: 1, habitat: 2, reactor: 20, total: 391, limit: 600, grounded: true };
    const stats = {
      hoursPlayed: 5, sols: 1, deaths: 0, stormHours: 1, protectedStormHours: 0.5, totalDoseMsv: 400,
      boneDensity: 80, muscleStrength: 90, workoutCount: 1, harvestCount: 2, cropVariety: 2,
      iceDelivered: 3, standbyHours: 1, discoveries: 3, scanTotal: 12, sampleTypes: 2,
      samplesAnalyzed: 2, sciencePointsSent: 30, sciencePointsGoal: 20, journalFound: 5,
      journalTotal: 20, journalRank: 'CADET', topFinds: [],
    };
    const event = eventCard('marsquake', { stationName: 'water recycler' });
    const weather = weatherReportCard({ weather: { minC: -75, maxC: -15, gustMs: 8, sol: 675, date: '2020-10-13' } });
    const report = missionReport(stats);
    const copy = [
      event.title, ...event.lines.map((line) => line.text), event.fact, event.source,
      meteorToast({ iceBlocks: 2, distance: 3, direction: 'north' }),
      quakeToast({ stationName: 'water recycler', lostPct: 30 }), dustDevilPanelsToast(3, 5),
      scienceCounterText({ found: 12, sent: 8, goal: 30 }),
      stormSourceText(storm, source), stormStatusText({ phase: 'active', storm, hoursLeft: 1 }, source),
      stormStatusText({ phase: 'warning', storm, hoursUntil: 1 }, source),
      stormEventMessage({ type: 'storm-warning', storm, hoursUntil: 1 }, source),
      bulletinText({ issueTime: '2026-11-15', type: 'CME' }),
      radiationStatusText({ doseRate: 1, totalDoseMsv: 371 }), doseHistoryText(ledger),
      ...doseVictoryRows(ledger).flat(), ...report.categories.map((category) => category.detail),
      report.profile.title, report.profile.text, ...weather.lines.map((line) => line.text), weather.source,
      dustStatus({ phase: 'warning', hoursUntilStorm: 0.15, solarFactor: 0.3 }).value,
    ];

    for (const text of copy) {
      expect(translate(text, 'pt-BR'), text).not.toBe(text);
      expect(translate(text, 'es'), text).not.toBe(text);
    }
    expect(translate(stormSourceText(storm, source), 'pt-BR')).toContain('500 km/s');
    expect(translate(meteorToast({ iceBlocks: 2, distance: 3, direction: 'north' }), 'es')).toContain('2 bloques de hielo');
    expect(translate(doseHistoryText(ledger), 'es')).toContain('20 mSv');
    expect(translate(scienceCounterText({ found: 12, sent: 8, goal: 30 }), 'pt-BR'))
      .toBe('CIÊNCIA 12 | ENVIADOS 8/30');
    expect(translate(dustDevilPanelsToast(3, 5), 'es'))
      .toBe('¡El remolino de polvo limpió 3 de tus 5 paneles solares! Limpia los demás tú mismo.');
  });

  it('saves and restores the language preference, using English for invalid values', () => {
    const storage = memoryStorage();
    setLanguage('pt-BR', storage);
    expect(storage.getItem(LANGUAGE_STORAGE_KEY)).toBe('pt-BR');
    expect(readLanguagePreference(storage)).toBe('pt-BR');
    expect(getLanguage()).toBe('pt-BR');

    storage.setItem(LANGUAGE_STORAGE_KEY, 'fr');
    expect(readLanguagePreference(storage)).toBe('en');
  });
});
