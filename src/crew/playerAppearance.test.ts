import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PLAYER_APPEARANCE,
  PLAYER_GENDERS,
  PLAYER_HAIR_COLORS,
  PLAYER_HAIR_LENGTHS,
  PLAYER_HAIR_TYPES,
  PLAYER_SKIN_TONES,
  buildPlayerCadetProfile,
  isCharacterCustomizedInSave,
  normalizePlayerAppearance,
} from './playerAppearance.ts';

describe('playerAppearance', () => {
  it('exposes options for sex, skin tone, hair type, hair length, and hair color', () => {
    expect(PLAYER_GENDERS.map((g) => g.id)).toEqual(['woman', 'man']);
    expect(PLAYER_SKIN_TONES.length).toBeGreaterThanOrEqual(5);
    expect(PLAYER_HAIR_TYPES.map((t) => t.id)).toEqual(['straight', 'wavy', 'curly', 'coily']);
    expect(PLAYER_HAIR_LENGTHS.map((l) => l.id)).toEqual(['short', 'medium', 'long']);
    expect(PLAYER_HAIR_COLORS.length).toBeGreaterThanOrEqual(5);
  });

  it('normalizes missing or invalid fields back to safe defaults', () => {
    expect(normalizePlayerAppearance(null)).toEqual(DEFAULT_PLAYER_APPEARANCE);
    expect(normalizePlayerAppearance({
      gender: 'alien',
      skinTone: 'neon',
      hairType: 'spiky',
      hairLength: 'giant',
      hairColor: 'purple',
    })).toEqual(DEFAULT_PLAYER_APPEARANCE);

    expect(normalizePlayerAppearance({
      gender: 'man',
      skinTone: 'deep',
      hairType: 'coily',
      hairLength: 'long',
      hairColor: 'blonde',
    })).toEqual({
      gender: 'man',
      skinTone: 'deep',
      hairType: 'coily',
      hairLength: 'long',
      hairColor: 'blonde',
    });
  });

  it('builds a CadetAppearanceProfile matching gender, skin tone, hair type, length, and color', () => {
    const womanProfile = buildPlayerCadetProfile({
      gender: 'woman',
      skinTone: 'brown',
      hairType: 'curly',
      hairLength: 'long',
      hairColor: 'auburn',
    });
    expect(womanProfile.gender).toBe('woman');
    expect(womanProfile.hairType).toBe('curly');
    expect(womanProfile.hairLength).toBe('long');
    expect(womanProfile.hairStyle).toBe('curly_long');
    expect(womanProfile.lashes).toBe(true);
    expect(womanProfile.brows).toBe('arched');
    expect(womanProfile.skin).toBe('#8c5230');
    expect(womanProfile.hair).toBe('#9c4322');

    const manProfile = buildPlayerCadetProfile({
      gender: 'man',
      skinTone: 'fair',
      hairType: 'wavy',
      hairLength: 'short',
      hairColor: 'black',
    });
    expect(manProfile.gender).toBe('man');
    expect(manProfile.hairStyle).toBe('wavy_short');
    expect(manProfile.lashes).toBe(false);
    expect(manProfile.brows).toBe('straight');
    expect(manProfile.skin).toBe('#f7d6c1');
    expect(manProfile.hair).toBe('#1a1414');
  });

  it('only treats a world save as customized after confirmation or arrival', () => {
    expect(isCharacterCustomizedInSave(null)).toBe(false);
    expect(isCharacterCustomizedInSave(undefined)).toBe(false);
    expect(isCharacterCustomizedInSave({})).toBe(false);
    // An idle autosave from the start menu carries default playerAppearance without confirmation.
    expect(isCharacterCustomizedInSave({ characterCustomized: false, arrivalPlayed: false })).toBe(false);
    // Reloading after the cutscene started but before confirming character setup still asks once.
    expect(isCharacterCustomizedInSave({ characterCustomized: false, arrivalPlayed: true })).toBe(false);
    expect(isCharacterCustomizedInSave({ characterCustomized: true })).toBe(true);
    // Legacy saves from before characterCustomized existed still skip setup once arrival played.
    expect(isCharacterCustomizedInSave({ arrivalPlayed: true })).toBe(true);
  });
});
