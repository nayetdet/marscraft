import { afterEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { ITEM_DEFINITIONS } from '../config/blockTypes.ts';
import { eventCard, meteorToast, quakeToast, dustDevilPanelsToast } from '../mission/eventText.ts';
import { bulletinText, radiationStatusText, stormEventMessage, stormSourceText, stormStatusText } from '../mission/missionText.ts';
import { doseHistoryText, doseVictoryRows } from '../mission/doseBudget.ts';
import { missionReport } from '../mission/missionReport.ts';
import { dustStatus, weatherReportCard } from '../mission/weatherText.ts';
import { SCAN_CATALOG, SCAN_CATEGORIES } from '../data/scanCatalog.ts';
import { scienceCounterText } from '../story/objectiveView.ts';
import { scienceMissingText, uploadResultText } from '../mission/sciencePackage.ts';
import { crewEventMessage } from '../crew/crewText.ts';
import { OXYGEN_MODE_INFO } from '../mission/oxygenPlant.ts';
import { oxygenPlantText } from '../mission/oxygenText.ts';
import { REAL_VS_GAME } from '../data/realVsGame.ts';
import { ACT2_STEPS } from '../story/acts/act2Steps.ts';
import { ACT2_TEXT } from '../story/acts/act2Text.ts';
import { ACT3_STEPS } from '../story/acts/act3Steps.ts';
import { ACT4_STEPS } from '../story/acts/act4Steps.ts';
import { ASTRONAUT_SLEEP_FACT } from '../player/sleep.ts';
import { getSuitTelemetryView } from '../player/suitTelemetry.ts';
import { HANDOVER_CHOICES, handoverCard, handoverSummary } from '../story/acts/act5Handover.ts';
import { AUDIT_TEMPLATE_SAMPLES } from './i18nAuditCopy.ts';
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

const SOURCE_ROOTS = ['src'];
const ALLOWED_SOURCE_NAMES = new Set([
  'NASA RadLab + DONKI', 'NASA ICES 2024: Sabatier', 'NASA OSDR RadLab (Curiosity MSL-RAD, LRO CRaTER)',
  'NASA Science: Deimos', 'NASA JPL, 2017; NASA DONKI', 'Quinn et al., UNH (PREDICCS)',
  'NASA RadLab (Curiosity MSL-RAD)', 'Saccharomyces cerevisiae',
  'Drosophila melanogaster', 'Homo sapiens', 'Mus musculus', 'Rattus norvegicus', 'Urocitellus parryii',
  'NASA OSDR', 'real data from ', 'noopener noreferrer',
  ': NASA study', 'Derick Bessa', 'João Pedro Moreira', 'Isaac Duarte', 'Letícia Freitas', 'Renan França', 'Lucas Rocha',
  'João Pedro', 'Moreira', 'MarsCraft', 'MARS', 'CRAFT', 'NASA',
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
        && !path.basename(file).startsWith('i18n') && path.basename(file) !== 'DebugOverlay.ts'
        && !(file.endsWith('/story/acts/act3Gym.ts'))) {
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
    for (const technicalName of ['MarsCraft', 'NASA', 'MAV', 'MOXIE', 'EVA']) {
      expect(translate(technicalName, 'pt-BR')).toBe(technicalName);
      expect(translate(technicalName, 'es')).toBe(technicalName);
    }
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
    expect(translate('No water ice nearby. Navigate to Northeast Ice Crater!', 'pt-BR'))
      .toBe('Não há gelo de água por perto. Vá até a Cratera de Gelo Nordeste!');
    expect(translate('Battery: 9% (LOW: slow, cannot drill)', 'es'))
      .toBe('Batería: 9% (BAJA: lenta, no puede perforar)');
    expect(translate('Drill active! Collected +5kg Water Ice (10/20kg)', 'pt-BR'))
      .toBe('Perfuratriz ativa! Gelo de água coletado: +5 kg (10/20 kg)');
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

  it('keeps the official English MarsCraft wordmark unchanged across languages', () => {
    const markup = fs.readFileSync(path.join(process.cwd(), 'public/game.html'), 'utf8');
    const protectedWordmarks = [...markup.matchAll(/<h1 class="mc-title" data-no-translate><span>MARS<\/span><span>CRAFT<\/span><\/h1>/g)];
    expect(protectedWordmarks).toHaveLength(2);
    for (const language of ['pt-BR', 'es'] as const) {
      expect(translate('MARS', language)).toBe('MARTE');
      expect(translate('CRAFT', language)).not.toBe('CRAFT');
      expect(translate('MarsCraft', language)).toBe('MarsCraft');
    }
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

  it('translates every dynamic message found by the localization audit, keeping its values', () => {
    for (const language of ['pt-BR', 'es'] as const) {
      const untranslated = AUDIT_TEMPLATE_SAMPLES.filter((sample) => translate(sample, language) === sample);
      expect(untranslated, language).toEqual([]);
    }
    expect(translate('CO2 12%: replace filter', 'pt-BR')).toBe('CO₂ 12%: troque o filtro');
    expect(translate('Mission Control: OK', 'es')).toBe('Control de Misión: OK');
    // The more specific template wins over the shorter one that would also match
    expect(translate('Source: NASA RadLab (reference data, not live)', 'pt-BR')).toBe('Fonte: NASA RadLab (dados de referência, não ao vivo)');
    expect(translate('Journal rank: 7', 'es')).toBe('Rango del diario: 7');
  });

  it('translates the fixed texts found by the localization audit', () => {
    expect(translate('NIGHT IS COMING', 'es')).toBe('LLEGA LA NOCHE');
    expect(translate('Airlock cycling. Please wait.', 'pt-BR')).toBe('A câmara de ar está trabalhando. Espere um pouco.');
    expect(translate('FREE PLAY', 'pt-BR')).toBe('MODO LIVRE');
    expect(translate('Exercise bike', 'es')).toBe('Bicicleta estática');
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

  it('translates dynamic resource and science messages in both selected languages', () => {
    const messages = [
      'Science sent: 12 / 30 points',
      'Send 2 items = 8 points to Earth (5% power)',
      'Not enough power: this upload needs 5% of the battery. Wait for the Sun.',
      'Not enough science points: this needs 4 points that were not sent to Earth yet.',
      'Question sent. The answer needs about 30 s (game time) to come back.',
      'Regolith analyzed: +1 science point. Plain regolith only counts once: the glowing sample spots outside are worth more.',
      'Tool upgraded (-3 science points, not sent to Earth): collecting blocks is faster.',
      'Suit upgrade installed (-5 science points, not sent to Earth): outside, less radiation hurts you and less dose adds up.',
      'Moved 2 L into the wall. Less water to drink, more protection.',
      'Moved 2 L back to the tank. More water to drink, less protection.',
      'Need 10% base power for full suit repair.',
      'Need 10% base power for electrostatic cleaning.',
      'Commander, the water recycler has no power! The battery is empty.',
      'Commander, it is freezing! The greenhouse stopped. Turn the heater on in the power room.',
      'Fission reactor ON: +12%/h day and night. Your radiation dose climbs faster while it runs.',
      'The rocket takes ice in loads of 5 kg. Drill more first.',
      'Rover loaded 6 ice into the rocket. No walk outside needed!',
      'EVA suit below minimum launch levels (40% O2 / 25% Heat). Wait for recharge.',
      'The battery will be empty before sunrise (2 h to go). Turn something off, or start the fission reactor.',
      'Planted lettuce. It drinks 0.9 L from the base tank while it grows, and needs light and a clean greenhouse.',
      'Harvested soy. Pick up your harvest and use it to eat. A real NASA study is now in your field notebook!',
      'The potato basket is empty.',
      'Collected 2 lettuce. The rest is in the basket.',
      'water recycler analyzed: +4 science points. Send it to Earth from this terminal.',
      'Got a Space Ration! (4 left in the pantry)',
      'Cooking your lettuce: ready in 8 seconds.',
      'Amira: Your ration is cooking! 5 s to go.',
      'Amira: Your ration is ready! Make room in your bag.',
      'Amira: Thanks for the lettuce! Your ration is ready in 8 s.',
      'Amira: No food! Grow some in the greenhouse.',
      'Amira: Here is a ration! 4 left.',
      'Amira: Your Mars carrot ration is ready!',
      'Got a Space Ration made from your Mars carrot! Eat it from your hotbar.',
      'Amira is cooking your ration (5 s)',
      '[F] Give lettuce to Amira: 1 ration (5% battery)',
      '[F] Get space ration from Amira (4 in pantry)',
      '[F] Talk to Amira (pantry empty)',
      '[F] Talk to Amira',
      'Amira: I\'m too weak to work. We need air (the battery pays for it) and water and food!',
      'Amira: Thanks, Commander! I\'m back to work.',
      'Amira is too weak and must rest in the medical bay. Bring air, water and food back so Amira can get better.',
      'Amira: Going to rest. I still need air, water and food.',
      'Amira: On my way to the water recycler!',
      'Commander, the oxygen generator has a problem.',
      'OXYGEN MACHINE: AIR FROM WATER (OGA electrolysis)',
      'OTHER CHOICE: AIR FROM MARS AIR (MOXIE)',
      '  Cost: 2% power per O2 point. No water.',
      '  Cost: 1% power per O2 point, and about 0.95 L of water per person each sol.',
      'SABATIER REACTOR: not built. It would give back half of that water (20 regolith, 5% power).',
      'WATER USED TO MAKE AIR SO FAR: 1.25 L',
      'Build Sabatier reactor (20 regolith, 5% power)',
      'The oxygen machine is already on moxie.',
      'Collect 20 regolith blocks outside to print the Sabatier reactor.',
      '[F] Clean solar panel 2 (dust 30%, uses suit air)',
      'You ate a Mars carrot (+Food)',
      'You ate a Mars carrot (+Food). No oxygen! Food cannot heal you, go back to the base',
      'Drank clean water from habitat purifier (+Hydration full). Base reserve: 40L. The used water goes to the recycler.',
      'Base water reservoir is dry! Collect ice with the Rover.',
      'Picked up 2 items',
      'Scope Scanner',
      'Sample: Dark Dune Sand (analyze in the lab)',
      'Space Ration (Use to eat)',
      'Mars lettuce (Use to eat)',
      'WAIT OUT THE STORM (no solar storm right now)',
      'WAIT OUT THE STORM (the wall needs 12 more L)',
      'WAIT OUT THE STORM (step inside the shelter first)',
      'WAIT OUT THE STORM (time runs fast)',
      'With a FULL wall (20 L) you can wait out a solar storm in here with the clock running fast: the base still uses power and you still get hungry and thirsty.',
      'The battery ran out, so you stopped waiting! You waited 35 min of game time behind the water wall. Battery 80% -> 12%.',
      'Sealed in a tube: +8 points in your final report, none now. The rocket needs +2 ice.',
      'Now pedal left.',
      'Good! Now pedal right.',
      'Battery at sunrise: about 75%',
      'Making fuel (6 ice)',
      'Need 15% power to train.',
      '15 liters in wall, 20% radiation blocked',
    ];
    for (const text of messages) {
      expect(translate(text, 'pt-BR'), text).not.toBe(text);
      expect(translate(text, 'es'), text).not.toBe(text);
    }
    expect(translate(messages[0], 'pt-BR')).toBe('Ciência enviada: 12 / 30 pontos');
    expect(translate(messages[1], 'es')).toBe('Enviar 2 objetos = 8 puntos a la Tierra (5% de energía)');
    expect(translate(messages[5], 'pt-BR')).toBe('Solo marciano (rególito) analisado: +1 ponto científico. O solo comum só conta uma vez; os locais brilhantes de amostra lá fora valem mais.');
    expect(translate(messages[8], 'pt-BR')).toBe('Você colocou 2 L de água na parede. Menos água para beber, mais proteção.');
    expect(translate(messages[9], 'es')).toBe('Sacaste 2 L de agua de la pared y la devolviste al tanque. Más agua para beber, menos protección.');
    expect(translate(messages[12], 'pt-BR')).toBe('Comandante, o reciclador de água está sem energia! A bateria acabou.');
    expect(translate(messages[13], 'pt-BR')).toBe('Comandante, está congelando! A estufa parou. Ligue o aquecedor na sala de energia.');
    expect(translate(messages[13], 'es')).toBe('Comandante, ¡hace mucho frío! El invernadero se detuvo. Enciende la calefacción en la sala de energía.');
    expect(translate(messages[17], 'pt-BR')).toBe('O traje espacial (EVA) está abaixo do nível mínimo para decolar (40% de O₂ / 25% de proteção térmica). Espere a recarga.');
    expect(translate(messages[43], 'pt-BR')).toBe('Comandante, o gerador de oxigênio está com problemas.');
    expect(translate(messages[45], 'es')).toBe('LA OTRA OPCIÓN: AIRE OBTENIDO DE LA ATMÓSFERA MARCIANA (MOXIE)');
    expect(translate(messages[32], 'pt-BR')).toBe('Você recebeu uma ração espacial feita com cenoura marciana! Coma pela barra de itens.');
    expect(translate(messages[60], 'es')).toBe('Muestra: arena oscura de las dunas (analizar en el laboratorio)');
    expect(translate(messages[71], 'pt-BR')).toBe('Muito bem! Agora pedale para a direita.');
    expect(translate(messages[68], 'es')).toContain('pared de agua');
  });

  it('localizes every inventory item label in Portuguese and Spanish', () => {
    const untranslated = ITEM_DEFINITIONS.map((item) => item.name)
      .filter((name) => translate(name, 'pt-BR') === name || translate(name, 'es') === name);
    expect(untranslated).toEqual([]);
  });

  it('localizes every prose value in the real-versus-game journal table', () => {
    const languageNeutralValues = new Set([
      '12 m/s² (1 block = 1 m)',
      '24 h 39 min',
    ]);
    const englishCopy = REAL_VS_GAME.flatMap((row) => [row.topic.toUpperCase(), row.game, row.real, row.why]);
    const untranslated = englishCopy.filter((text) => !languageNeutralValues.has(text)
      && (translate(text, 'pt-BR') === text || translate(text, 'es') === text));
    expect(untranslated).toEqual([]);
  });

  it('localizes every guided step and objective in acts 2 to 4, including interpolated names and counts', () => {
    const steps = [...ACT2_STEPS, ...ACT3_STEPS, ...ACT4_STEPS];
    const copy = steps.flatMap((step) => [
      step.label,
      step.hint,
      step.objective,
      ...(step.lines ?? []).map((line) => line.text),
    ]).filter((text): text is string => typeof text === 'string');
    copy.push(
      ACT2_TEXT.promptScope,
      ACT2_TEXT.promptGlass,
      ACT2_TEXT.promptRepair,
      ACT2_TEXT.scopeGiven,
      ACT2_TEXT.glassComing,
      ACT2_TEXT.glassGiven,
      ACT2_TEXT.windowFixed,
      ACT2_TEXT.leakStarted,
      ACT2_TEXT.scopeAdded,
      ACT2_TEXT.windowOk(2),
      ACT2_TEXT.windowCracked,
    );
    const untranslated = copy.filter((text) => translate(text, 'pt-BR') === text || translate(text, 'es') === text);
    expect(untranslated).toEqual([]);
  });

  it('localizes act 5 handover cards, suit telemetry, repair messages, and the sleep fact', () => {
    const card = handoverCard({ waterL: 60, maxWaterL: 500, panelDust: 0.6, fieldsPlanted: 1, fieldsTotal: 4 });
    const handover = [card.title, card.source, ...card.choices.flatMap((choice) => [choice.name, choice.good, choice.bad]),
      ...card.lines.map((line) => line.text),
      handoverSummary({ launched: true, baseHandover: { waterL: 60, maxWaterL: 500, panelDust: 0.6, fieldsPlanted: 1, fieldsTotal: 4 } })!.text];
    const telemetry = getSuitTelemetryView({ suitEquipped: true, suitOxygen: 20, suitThermal: 10, suitScrubber: 20, suitDust: 30, suitIntegrity: 80 }, {
      batteryPercent: 50, outsideTempC: -80, airlockPressurized: true, airlockDoorOpen: false,
    });
    const copy = [
      ...handover,
      telemetry.thermalDockText,
      telemetry.scrubberDockText,
      telemetry.dustStatus,
      telemetry.readyReason,
      telemetry.equipPromptLabel,
      ASTRONAUT_SLEEP_FACT,
      'EVA suit integrity is already at 100%.',
      'EVA suit seals & armor repaired to 100% (-10% power).',
      'Low power: applied emergency patch (35% integrity). Restore power for full repair.',
      'Need 10% base power for full suit repair.',
      '10 h less launch window',
    ];
    // Keep the choice ids stable in English; they are internal identifiers, not player-facing copy.
    expect(card.choices.map((choice) => choice.id)).toEqual([HANDOVER_CHOICES.FLY_NOW, HANDOVER_CHOICES.TIDY]);
    for (const text of copy) {
      expect(translate(text, 'pt-BR'), text).not.toBe(text);
      expect(translate(text, 'es'), text).not.toBe(text);
    }
    expect(translate(card.title, 'pt-BR')).toBe('DEIXANDO A BASE');
    expect(translate(handover.at(-1)!, 'es')).toContain('faltan: agua, paneles limpios, cultivos sembrados');
    expect(translate(telemetry.thermalDockText, 'pt-BR')).toContain('POUCO CALOR');
    expect(translate(telemetry.readyReason, 'es')).toContain('CALENTANDO');
  });

  it('localizes full gameplay messages returned by systems, not only hand-picked templates', () => {
    const oxygenText = oxygenPlantText({
      mode: 'electrolysis',
      info: OXYGEN_MODE_INFO.electrolysis,
      sabatier: false,
      waterUsedL: 1.25,
      waterLossFraction: 1,
    });
    const scienceMissing = scienceMissingText();
    const scienceSent = uploadResultText({
      status: 'sent', items: 2, points: 8, cost: 5, leftAfter: 0,
      sentPoints: 12, dataSent: false,
    });
    const crewAlert = crewEventMessage({
      type: 'weak', member: { name: 'Nia' }, lacking: ['air', 'water', 'food'],
    });
    for (const text of [oxygenText, scienceMissing, scienceSent, crewAlert]) {
      expect(translate(text, 'pt-BR'), text).not.toBe(text);
      expect(translate(text, 'es'), text).not.toBe(text);
    }
    expect(translate(scienceMissing, 'pt-BR')).toContain('O foguete precisa');
    expect(translate(scienceSent, 'es')).toContain('objetos enviados');
    expect(translate(scienceMissing, 'pt-BR')).not.toMatch(/points|science|scope/i);
    expect(translate(scienceMissing, 'es')).not.toMatch(/points|science|scope/i);
    expect(translate(scienceSent, 'pt-BR')).not.toMatch(/points|Science sent/i);
    expect(translate(scienceSent, 'es')).not.toMatch(/points|Science sent/i);
    expect(translate(crewAlert, 'pt-BR')).toBe('Nia: estou sem forças para trabalhar. Precisamos de ar (a bateria fornece energia), água e comida!');
    expect(translate(oxygenText, 'es')).toContain('MÁQUINA DE OXÍGENO: AIRE A PARTIR DEL AGUA (Electrólisis OGA)');
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
