import { pixelGridToSvgDataUrl, pixelGridToSvgRects, type PixelPalette } from './pixelArt.ts';

const SCOPE_PALETTE: PixelPalette = {
  k: '#1c222d',
  s: '#526072',
  m: '#909fb0',
  w: '#cfd8e3',
  o: '#cf622a',
  g: '#c78a28',
  b: '#1875a3',
  c: '#389cc9',
  h: '#8ccae6',
  e: '#45a86b',
};

const SCOPE_GRID: readonly string[] = [
  '................',
  '..........kkkk..',
  '.........kcbcck.',
  '........kggcbck.',
  '.......kwwgbbk..',
  '......kwwwoggk..',
  '.....kwwmmoook..',
  '....kmmmsmmok...',
  '...kmsesmmmk....',
  '..kmmmsssmk.....',
  '.ksssmmssk......',
  'kssskkssk.......',
  'kssk..ksk.......',
  '.kk....k........',
  '................',
  '................',
];

const SHIELD_REMOTE_PALETTE: PixelPalette = {
  k: '#1c222d',
  a: '#b58328',
  y: '#d9b44a',
  w: '#c3cdd8',
  m: '#8f9cab',
  s: '#5b6778',
  d: '#133247',
  c: '#389cc9',
  h: '#6ebce0',
  r: '#cc4141',
  p: '#e06e6e',
  e: '#45a86b',
};

const SHIELD_REMOTE_GRID: readonly string[] = [
  '..........kkk...',
  '..........kyk...',
  '..........kak...',
  '....kkkkkkkak...',
  '...kwwwwwwwwsk..',
  '...kwddddddmsk..',
  '...kwdchcddmsk..',
  '...kwdcccddmsk..',
  '...kwddcdddmsk..',
  '...kwddddddmsk..',
  '...kmmmmmmmmsk..',
  '...kmekprrmmsk..',
  '...kmmkrrrmmsk..',
  '...kmssssssssk..',
  '....kkkkkkkkkk..',
  '................',
];

const JOURNAL_PALETTE: PixelPalette = {
  k: '#1c222d',
  n: '#223a59',
  b: '#1f6d99',
  c: '#4097c4',
  r: '#a8441b',
  o: '#cf682d',
  h: '#de874e',
  y: '#cfa034',
  p: '#d8dee6',
  s: '#aeb8c4',
};

const JOURNAL_GRID: readonly string[] = [
  '................',
  '...kkkkkkkkkk...',
  '..kcbnnnnnnnyk..',
  '..kcbnnnnnnnyk..',
  '..kcbnnhhonnnk..',
  '..kcbnhooornnk..',
  '..kcbnoorornnk..',
  '..kcbnnrrrccnk..',
  '..kcbnnnnnnnnk..',
  '..kcbnccccccnk..',
  '..kcbnnnnnnnnk..',
  '..kcbpppppppsk..',
  '..kcbpsssssssk..',
  '...kkykkkkkkkk..',
  '....kyk.........',
  '................',
];

const RATION_PALETTE: PixelPalette = {
  k: '#1c222d',
  s: '#7b8999',
  m: '#b3c0ce',
  w: '#edf2f7',
  b: '#0284c7',
  c: '#38bdf8',
  o: '#ea580c',
  g: '#22c55e',
  d: '#334155',
};

const RATION_GRID: readonly string[] = [
  '.........kkk....',
  '.........kcbk...',
  '...kkkkkkkwwk...',
  '..kssssssssssk..',
  '..kmmmmmmmmmmsk.',
  '..kmkbbbbbbkmk..',
  '..kmkbccccbkmk..',
  '..kmkooooookmk..',
  '..kmkwwwwwwkmk..',
  '..kmkwggwdkkmk..',
  '..kmkwggwddkmk..',
  '..kmkdkdkdkkmk..',
  '..kmkkkkkkkkmk..',
  '..kssssssssssk..',
  '...kkkkkkkkkk...',
  '................',
];

let cachedScope: string | null = null;
let cachedShieldRemote: string | null = null;
let cachedJournal: string | null = null;
let cachedRation: string | null = null;

export function getScopeItemIcon(): string {
  return (cachedScope ??= pixelGridToSvgDataUrl(SCOPE_GRID, SCOPE_PALETTE));
}

export function getShieldRemoteItemIcon(): string {
  return (cachedShieldRemote ??= pixelGridToSvgDataUrl(SHIELD_REMOTE_GRID, SHIELD_REMOTE_PALETTE));
}

export function getJournalItemIcon(): string {
  return (cachedJournal ??= pixelGridToSvgDataUrl(JOURNAL_GRID, JOURNAL_PALETTE));
}

export function getRationItemIcon(): string {
  return (cachedRation ??= pixelGridToSvgDataUrl(RATION_GRID, RATION_PALETTE));
}

// Amostras cientificas do mapa (issue #270): o mesmo desenho de pedra, com as cores de cada tipo.
// k = contorno, d = sombra, m = cor da amostra, l = luz, s = brilho
const SAMPLE_GRID: readonly string[] = [
  '................',
  '................',
  '......kkkk......',
  '....kkllllkk....',
  '...kllllmmmmk...',
  '..klllsmmmmmmk..',
  '..kllmmmmmsmmk..',
  '.kllmmmmmmmmmdk.',
  '.klmmmsmmmmmddk.',
  '.kmmmmmmmmmdddk.',
  '.kmmmmmmmddddk..',
  '..kmmmddddddk...',
  '...kkddddkkk....',
  '.....kkkk.......',
  '................',
  '................',
];

const SAMPLE_PALETTES: Record<string, PixelPalette> = {
  'sample-dune-sand': { k: '#17110f', d: '#2a211d', m: '#4a3a33', l: '#6b564b', s: '#fbbf24' },
  'sample-mudstone': { k: '#2f3a40', d: '#6b767c', m: '#9aa3a8', l: '#c9d1d6', s: '#7dd3fc' },
  'sample-sulfur': { k: '#5c4a0a', d: '#c79a12', m: '#f5d21f', l: '#fff3a3', s: '#ffffff' },
  'sample-meteorite': { k: '#111827', d: '#374151', m: '#64748b', l: '#a5b4c6', s: '#c4b5fd' },
  'sample-ice-core': { k: '#1b6f8f', d: '#8fd3ea', m: '#c9efff', l: '#f2fcff', s: '#ffffff' },
  // Regolito comum (so aparece no painel de ciencia)
  regolith: { k: '#3b1d12', d: '#7a3f28', m: '#a8583a', l: '#c97a56', s: '#e6a27e' },
};

const sampleIconCache = new Map<string, string>();

// Os mesmos pixels em <rect>, para o desenho da ficha no diario (src/graphics/journalIcons.ts)
export function sampleIconRects(sampleId: string): string {
  return pixelGridToSvgRects(SAMPLE_GRID, SAMPLE_PALETTES[sampleId] ?? SAMPLE_PALETTES['sample-mudstone']);
}

export function hasSampleIcon(sampleId: string): boolean {
  return Object.hasOwn(SAMPLE_PALETTES, sampleId);
}

// Icone 16x16 da amostra (inventario, painel de ciencia e diario)
export function getSampleItemIcon(sampleId: string): string {
  let icon = sampleIconCache.get(sampleId);
  if (!icon) {
    icon = pixelGridToSvgDataUrl(SAMPLE_GRID, SAMPLE_PALETTES[sampleId] ?? SAMPLE_PALETTES['sample-mudstone']);
    sampleIconCache.set(sampleId, icon);
  }
  return icon;
}
