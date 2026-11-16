import type { CadetAppearanceProfile, HairLength, HairType } from './crewProfiles.ts';

export type PlayerGender = 'woman' | 'man';
export type PlayerHairType = HairType;
export type PlayerHairLength = HairLength;

export interface SkinToneOption {
  id: 'fair' | 'light' | 'tan' | 'medium' | 'brown' | 'deep';
  label: string;
  skin: string;
  skinShade: string;
  cheek: string;
  mouth: string;
  eyeDark: string;
  eyeIris: string;
}

export interface HairColorOption {
  id: 'black' | 'darkBrown' | 'brown' | 'blonde' | 'auburn' | 'silver';
  label: string;
  hair: string;
  hairDark: string;
  hairHi: string;
}

export interface PlayerAppearance {
  gender: PlayerGender;
  skinTone: SkinToneOption['id'];
  hairType: PlayerHairType;
  hairLength: PlayerHairLength;
  hairColor: HairColorOption['id'];
}

export const PLAYER_GENDERS: readonly { id: PlayerGender; label: string }[] = Object.freeze([
  { id: 'woman', label: 'Female' },
  { id: 'man', label: 'Male' },
]);

export const PLAYER_SKIN_TONES: readonly SkinToneOption[] = Object.freeze([
  {
    id: 'fair',
    label: 'Porcelain',
    skin: '#f7d6c1',
    skinShade: '#dfb094',
    cheek: 'rgba(235, 120, 112, 0.32)',
    mouth: '#ad5847',
    eyeDark: '#182c3d',
    eyeIris: '#2b7f9c',
  },
  {
    id: 'light',
    label: 'Peach',
    skin: '#f2c2a2',
    skinShade: '#dca07e',
    cheek: 'rgba(229, 115, 104, 0.3)',
    mouth: '#9c4f3d',
    eyeDark: '#1c2541',
    eyeIris: '#2b4570',
  },
  {
    id: 'tan',
    label: 'Warm Sand',
    skin: '#d9a074',
    skinShade: '#ba8055',
    cheek: 'rgba(204, 96, 82, 0.3)',
    mouth: '#854233',
    eyeDark: '#1c1816',
    eyeIris: '#7d5329',
  },
  {
    id: 'medium',
    label: 'Caramel',
    skin: '#b87b4e',
    skinShade: '#965e36',
    cheek: 'rgba(191, 88, 74, 0.3)',
    mouth: '#693428',
    eyeDark: '#18151f',
    eyeIris: '#4f3222',
  },
  {
    id: 'brown',
    label: 'Chestnut',
    skin: '#8c5230',
    skinShade: '#6b3b1e',
    cheek: 'rgba(176, 84, 70, 0.32)',
    mouth: '#4f261e',
    eyeDark: '#15141e',
    eyeIris: '#3d281c',
  },
  {
    id: 'deep',
    label: 'Espresso',
    skin: '#5c331c',
    skinShade: '#402110',
    cheek: 'rgba(166, 78, 66, 0.35)',
    mouth: '#381a14',
    eyeDark: '#14111a',
    eyeIris: '#362015',
  },
]);

export const PLAYER_HAIR_TYPES: readonly { id: PlayerHairType; label: string }[] = Object.freeze([
  { id: 'straight', label: 'Straight' },
  { id: 'wavy', label: 'Wavy' },
  { id: 'curly', label: 'Curly' },
  { id: 'coily', label: 'Coily' },
]);

export const PLAYER_HAIR_LENGTHS: readonly { id: PlayerHairLength; label: string }[] = Object.freeze([
  { id: 'short', label: 'Short' },
  { id: 'medium', label: 'Medium' },
  { id: 'long', label: 'Long' },
]);

export const PLAYER_HAIR_COLORS: readonly HairColorOption[] = Object.freeze([
  { id: 'black', label: 'Jet Black', hair: '#1a1414', hairDark: '#0f0b0b', hairHi: '#342929' },
  { id: 'darkBrown', label: 'Dark Brown', hair: '#2d1e17', hairDark: '#1f140f', hairHi: '#462f24' },
  { id: 'brown', label: 'Chestnut Brown', hair: '#6f4528', hairDark: '#4f2f19', hairHi: '#8f5d3a' },
  { id: 'blonde', label: 'Golden Blonde', hair: '#d4a24c', hairDark: '#a87b31', hairHi: '#ebbf6c' },
  { id: 'auburn', label: 'Copper Red', hair: '#9c4322', hairDark: '#732d15', hairHi: '#bf5b33' },
  { id: 'silver', label: 'Silver Gray', hair: '#cbd5e1', hairDark: '#94a3b8', hairHi: '#e2e8f0' },
]);

export const DEFAULT_PLAYER_APPEARANCE: Readonly<PlayerAppearance> = Object.freeze({
  gender: 'woman',
  skinTone: 'light',
  hairType: 'straight',
  hairLength: 'medium',
  hairColor: 'darkBrown',
});

const SKIN_TONE_BY_ID = new Map(PLAYER_SKIN_TONES.map((opt) => [opt.id, opt]));
const HAIR_COLOR_BY_ID = new Map(PLAYER_HAIR_COLORS.map((opt) => [opt.id, opt]));
const VALID_GENDERS = new Set<PlayerGender>(['woman', 'man']);
const VALID_HAIR_TYPES = new Set<PlayerHairType>(['straight', 'wavy', 'curly', 'coily']);
const VALID_HAIR_LENGTHS = new Set<PlayerHairLength>(['short', 'medium', 'long']);

/**
 * Returns whether character customization has already been completed for a saved world.
 */
export function isCharacterCustomizedInSave(
  saved: { characterCustomized?: unknown; arrivalPlayed?: unknown } | null | undefined,
): boolean {
  if (typeof saved?.characterCustomized === 'boolean') return saved.characterCustomized;
  return saved?.arrivalPlayed === true;
}

/**
 * Validates and fills defaults for a persisted or partial player appearance payload.
 */
export function normalizePlayerAppearance(raw: unknown): PlayerAppearance {
  const input = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const gender = VALID_GENDERS.has(input.gender as PlayerGender)
    ? (input.gender as PlayerGender)
    : DEFAULT_PLAYER_APPEARANCE.gender;
  const skinTone = SKIN_TONE_BY_ID.has(input.skinTone as SkinToneOption['id'])
    ? (input.skinTone as SkinToneOption['id'])
    : DEFAULT_PLAYER_APPEARANCE.skinTone;
  const hairType = VALID_HAIR_TYPES.has(input.hairType as PlayerHairType)
    ? (input.hairType as PlayerHairType)
    : DEFAULT_PLAYER_APPEARANCE.hairType;
  const hairLength = VALID_HAIR_LENGTHS.has(input.hairLength as PlayerHairLength)
    ? (input.hairLength as PlayerHairLength)
    : DEFAULT_PLAYER_APPEARANCE.hairLength;
  const hairColor = HAIR_COLOR_BY_ID.has(input.hairColor as HairColorOption['id'])
    ? (input.hairColor as HairColorOption['id'])
    : DEFAULT_PLAYER_APPEARANCE.hairColor;

  return { gender, skinTone, hairType, hairLength, hairColor };
}

/**
 * Converts a player's customization choices into the shared 3D/pixel-art CadetAppearanceProfile.
 */
export function buildPlayerCadetProfile(appearance: PlayerAppearance): CadetAppearanceProfile {
  const normalized = normalizePlayerAppearance(appearance);
  const skinOpt = SKIN_TONE_BY_ID.get(normalized.skinTone) ?? PLAYER_SKIN_TONES[1];
  const hairOpt = HAIR_COLOR_BY_ID.get(normalized.hairColor) ?? PLAYER_HAIR_COLORS[1];
  const isWoman = normalized.gender === 'woman';

  return {
    gender: normalized.gender,
    skin: skinOpt.skin,
    skinShade: skinOpt.skinShade,
    cheek: skinOpt.cheek,
    hair: hairOpt.hair,
    hairDark: hairOpt.hairDark,
    hairHi: hairOpt.hairHi,
    eyeDark: skinOpt.eyeDark,
    eyeIris: skinOpt.eyeIris,
    eyeGlint: '#f8fafc',
    mouth: skinOpt.mouth,
    hairStyle: `${normalized.hairType}_${normalized.hairLength}`,
    hairType: normalized.hairType,
    hairLength: normalized.hairLength,
    brows: isWoman ? 'arched' : 'straight',
    lashes: isWoman,
    freckles: false,
  };
}
