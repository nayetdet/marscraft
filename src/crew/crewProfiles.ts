import { CREW_CONFIG } from '../config/constants.ts';

export type HairStyle =
  | 'swept'
  | 'puffs'
  | 'tousled'
  | 'wavy'
  | 'fade'
  | 'bob'
  | 'parted'
  | 'bangs'
  | 'sweep';

export type BrowStyle = 'arched' | 'straight';

export type SkinCategory = 'light' | 'medium' | 'deep';

export interface CadetAppearanceProfile {
  skin: string;
  skinShade: string;
  cheek: string;
  hair: string;
  hairDark: string;
  hairHi: string;
  eyeDark: string;
  eyeIris: string;
  eyeGlint: string;
  mouth: string;
  hairStyle: HairStyle;
  brows: BrowStyle;
  lashes: boolean;
  freckles: boolean;
}

export interface CrewAppearanceProfile extends CadetAppearanceProfile {
  name: string;
  gender: 'woman' | 'man';
  skinCategory: SkinCategory;
}

export const DEFAULT_CADET_PROFILE: CadetAppearanceProfile = Object.freeze({
  skin: '#f2c2a2',
  skinShade: '#dca07e',
  cheek: 'rgba(229, 115, 104, 0.3)',
  hair: '#2d1e17',
  hairDark: '#1f140f',
  hairHi: '#462f24',
  eyeDark: '#1c2541',
  eyeIris: '#2b4570',
  eyeGlint: '#f8fafc',
  mouth: '#9c4f3d',
  hairStyle: 'swept',
  brows: 'arched',
  lashes: false,
  freckles: false,
});

// Diverse crew profiles aligned with CREW_CONFIG.NAMES order:
// ['Ana', 'Leo', 'Maya', 'Sam', 'Noor', 'Kai', 'Iris', 'Ravi']
// Kitchen (index 4, Noor) is intentionally light-skinned to avoid racist stereotypes,
// while Black crew members (Ana, Sam) lead engineering and medical/power stations.
export const CREW_PROFILES: readonly CrewAppearanceProfile[] = Object.freeze([
  {
    name: 'Ana',
    gender: 'woman',
    skinCategory: 'deep',
    skin: '#6d4029',
    skinShade: '#522d1a',
    cheek: 'rgba(166, 78, 66, 0.35)',
    hair: '#1a1414',
    hairDark: '#100c0c',
    hairHi: '#312525',
    eyeDark: '#16131c',
    eyeIris: '#4a2c1c',
    eyeGlint: '#f8fafc',
    mouth: '#3d1d17',
    hairStyle: 'puffs',
    brows: 'arched',
    lashes: true,
    freckles: false,
  },
  {
    name: 'Leo',
    gender: 'man',
    skinCategory: 'light',
    skin: '#f0c1a0',
    skinShade: '#d49c79',
    cheek: 'rgba(229, 115, 104, 0.28)',
    hair: '#9c4322',
    hairDark: '#732d15',
    hairHi: '#bf5b33',
    eyeDark: '#162a20',
    eyeIris: '#2f7345',
    eyeGlint: '#f8fafc',
    mouth: '#9c4f3d',
    hairStyle: 'tousled',
    brows: 'straight',
    lashes: false,
    freckles: true,
  },
  {
    name: 'Maya',
    gender: 'woman',
    skinCategory: 'medium',
    skin: '#cf956b',
    skinShade: '#b0764d',
    cheek: 'rgba(204, 96, 82, 0.3)',
    hair: '#241914',
    hairDark: '#160f0c',
    hairHi: '#3f2c23',
    eyeDark: '#1c1816',
    eyeIris: '#7d5329',
    eyeGlint: '#f8fafc',
    mouth: '#7e3e30',
    hairStyle: 'wavy',
    brows: 'arched',
    lashes: true,
    freckles: false,
  },
  {
    name: 'Sam',
    gender: 'man',
    skinCategory: 'deep',
    skin: '#7c4a2e',
    skinShade: '#5e341e',
    cheek: 'rgba(176, 84, 70, 0.32)',
    hair: '#171315',
    hairDark: '#0d0a0c',
    hairHi: '#2d2428',
    eyeDark: '#15141e',
    eyeIris: '#3d281c',
    eyeGlint: '#f8fafc',
    mouth: '#47221b',
    hairStyle: 'fade',
    brows: 'straight',
    lashes: false,
    freckles: false,
  },
  {
    name: 'Noor',
    gender: 'woman',
    skinCategory: 'light',
    skin: '#f3c9ad',
    skinShade: '#d8a787',
    cheek: 'rgba(229, 115, 104, 0.3)',
    hair: '#8d5d36',
    hairDark: '#694222',
    hairHi: '#ad784a',
    eyeDark: '#192744',
    eyeIris: '#3878ba',
    eyeGlint: '#f8fafc',
    mouth: '#a15241',
    hairStyle: 'bob',
    brows: 'arched',
    lashes: true,
    freckles: false,
  },
  {
    name: 'Kai',
    gender: 'man',
    skinCategory: 'light',
    skin: '#eac099',
    skinShade: '#cc9b71',
    cheek: 'rgba(219, 112, 98, 0.25)',
    hair: '#161922',
    hairDark: '#0c0e14',
    hairHi: '#2b3245',
    eyeDark: '#141824',
    eyeIris: '#2f3954',
    eyeGlint: '#f8fafc',
    mouth: '#944d3e',
    hairStyle: 'parted',
    brows: 'straight',
    lashes: false,
    freckles: false,
  },
  {
    name: 'Iris',
    gender: 'woman',
    skinCategory: 'light',
    skin: '#f7d6c1',
    skinShade: '#dfb094',
    cheek: 'rgba(235, 120, 112, 0.32)',
    hair: '#d4a24c',
    hairDark: '#a87b31',
    hairHi: '#ebbf6c',
    eyeDark: '#182c3d',
    eyeIris: '#2b7f9c',
    eyeGlint: '#f8fafc',
    mouth: '#ad5847',
    hairStyle: 'bangs',
    brows: 'arched',
    lashes: true,
    freckles: true,
  },
  {
    name: 'Ravi',
    gender: 'man',
    skinCategory: 'medium',
    skin: '#9f6743',
    skinShade: '#7f4d2e',
    cheek: 'rgba(191, 88, 74, 0.3)',
    hair: '#1b171b',
    hairDark: '#100d10',
    hairHi: '#352c36',
    eyeDark: '#18151f',
    eyeIris: '#472c20',
    eyeGlint: '#f8fafc',
    mouth: '#5c2d23',
    hairStyle: 'sweep',
    brows: 'straight',
    lashes: false,
    freckles: false,
  },
]);

const PROFILE_BY_NAME = new Map<string, CrewAppearanceProfile>(
  CREW_PROFILES.map((profile) => [profile.name, profile])
);

export function getCrewProfile(member: { id?: number; name?: string } | null | undefined): CrewAppearanceProfile | null {
  if (!member) return null;
  if (member.name && PROFILE_BY_NAME.has(member.name)) {
    return PROFILE_BY_NAME.get(member.name) ?? null;
  }
  if (Number.isInteger(member.id) && (member.id as number) >= 0 && (member.id as number) < CREW_CONFIG.NAMES.length) {
    return CREW_PROFILES[member.id as number] ?? null;
  }
  return null;
}
