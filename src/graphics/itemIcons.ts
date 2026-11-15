import { pixelGridToSvgDataUrl, type PixelPalette } from './pixelArt.ts';

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

let cachedScope: string | null = null;
let cachedShieldRemote: string | null = null;
let cachedJournal: string | null = null;

export function getScopeItemIcon(): string {
  return (cachedScope ??= pixelGridToSvgDataUrl(SCOPE_GRID, SCOPE_PALETTE));
}

export function getShieldRemoteItemIcon(): string {
  return (cachedShieldRemote ??= pixelGridToSvgDataUrl(SHIELD_REMOTE_GRID, SHIELD_REMOTE_PALETTE));
}

export function getJournalItemIcon(): string {
  return (cachedJournal ??= pixelGridToSvgDataUrl(JOURNAL_GRID, JOURNAL_PALETTE));
}
