import { describe, expect, it } from 'vitest';
import { CREW_CONFIG } from '../config/constants.ts';
import { CREW_PROFILES, getCrewProfile } from './crewProfiles.ts';

describe('crewProfiles diversity and anti-stereotype rules', () => {
  it('provides a distinct appearance profile for every crew member', () => {
    expect(CREW_PROFILES).toHaveLength(CREW_CONFIG.NAMES.length);
    for (const name of CREW_CONFIG.NAMES) {
      const profile = getCrewProfile({ name });
      expect(profile).not.toBeNull();
      expect(profile?.name).toBe(name);
    }
  });

  it('includes diverse skin tones, genders, hair colors, hair styles, and eye colors', () => {
    const genders = new Set(CREW_PROFILES.map((p) => p.gender));
    const skinCategories = new Set(CREW_PROFILES.map((p) => p.skinCategory));
    const skins = new Set(CREW_PROFILES.map((p) => p.skin));
    const hairColors = new Set(CREW_PROFILES.map((p) => p.hair));
    const hairStyles = new Set(CREW_PROFILES.map((p) => p.hairStyle));
    const eyeColors = new Set(CREW_PROFILES.map((p) => p.eyeIris));

    expect(genders).toEqual(new Set(['woman', 'man']));
    expect(skinCategories).toEqual(new Set(['light', 'medium', 'deep']));
    expect(skins.size).toBe(CREW_PROFILES.length);
    expect(hairColors.size).toBeGreaterThanOrEqual(5);
    expect(hairStyles.size).toBe(CREW_PROFILES.length);
    expect(eyeColors.size).toBeGreaterThanOrEqual(5);
  });

  it('does not assign a Black/deep-skin crew member to the kitchen and places Black crew in STEM/engineering posts', () => {
    // CrewManager assigns index 4 (Noor) to the stationary kitchen post.
    const kitchenProfile = getCrewProfile({ id: 4, name: CREW_CONFIG.NAMES[4] });
    expect(kitchenProfile?.skinCategory).not.toBe('deep');

    // Deep-skin (Black) crew members lead Flight Engineer (oxygen) and Power Engineer (medbay) posts.
    const deepSkinMembers = CREW_PROFILES.filter((p) => p.skinCategory === 'deep');
    expect(deepSkinMembers.length).toBeGreaterThanOrEqual(2);
    expect(deepSkinMembers.map((p) => p.name)).toContain('Ana');
    expect(deepSkinMembers.map((p) => p.name)).toContain('Sam');
  });

  it('returns null for the player avatar or unknown IDs so empty/player EVA suits keep the gold visor', () => {
    expect(getCrewProfile({ id: 99, name: '' })).toBeNull();
    expect(getCrewProfile(null)).toBeNull();
    expect(getCrewProfile({ id: 0, name: 'Crew 0' })).toBe(CREW_PROFILES[0]);
  });
});
