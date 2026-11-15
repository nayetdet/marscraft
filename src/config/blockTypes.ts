// @ts-nocheck
import { CROP_CONFIG } from './constants.ts';

export const BLOCK_IDS = {
  AIR: 0,
  REGOLITH: 1,
  BASALT: 2,
  SANDSTONE: 3,
  MARS_ICE: 4,
  NASA_HULL: 5,
  GOLD_FOIL: 6,
  HAB_GLASS: 7,
  SOLAR_PANEL: 8,
  HAB_LIGHT: 9,
  THRUSTER_METAL: 10,
  CONSOLE_SCREEN: 11,
  HYDRO_PLANT: 12,
  RED_BEACON: 13,
  POTATO: 14,
  LETTUCE: 15,
  SOY: 16,
  SCOPE: 17,
  SHIELD_REMOTE: 18, // item de mao, nao e bloco do mundo
  JOURNAL: 19,
};

export const HOTBAR_BLOCKS = [
  {
    id: BLOCK_IDS.SCOPE,
    name: 'Scope Scanner',
    initialCount: 1,
    consumable: null,
    equipment: true,
  },
  {
    id: BLOCK_IDS.SHIELD_REMOTE,
    name: 'Shield Remote (Use to turn the radiation shield on/off)',
    initialCount: 1,
    consumable: null,
    equipment: true,
  },
  {
    id: BLOCK_IDS.JOURNAL,
    name: "Discovery Journal (Use to open)",
    initialCount: 1,
    consumable: null,
    equipment: true,
  },
  {
    id: BLOCK_IDS.HYDRO_PLANT,
    name: 'Mars Carrot (Right-click to eat)',
    initialCount: 3,
    consumable: { type: 'food', amount: 6, heal: 2 },
  },
  {
    id: BLOCK_IDS.REGOLITH,
    name: 'Martian Regolith',
    initialCount: 0,
    consumable: null,
  },
  {
    id: BLOCK_IDS.SANDSTONE,
    name: 'Orange Sandstone',
    initialCount: 0,
    consumable: null,
  },
  {
    id: BLOCK_IDS.BASALT,
    name: 'Crater Rock',
    initialCount: 0,
    consumable: null,
  },
  {
    id: BLOCK_IDS.MARS_ICE,
    name: 'Martian Water Ice',
    initialCount: 0,
    consumable: null,
  },
  {
    id: BLOCK_IDS.NASA_HULL,
    name: 'Habitat Hull Block',
    initialCount: 0,
    consumable: null,
  },
  {
    id: BLOCK_IDS.GOLD_FOIL,
    name: 'Gold Thermal Block',
    initialCount: 0,
    consumable: null,
  },
  {
    id: BLOCK_IDS.HAB_GLASS,
    name: 'Pressurized Glass',
    initialCount: 0,
    consumable: null,
  },
  {
    id: BLOCK_IDS.HAB_LIGHT,
    name: 'Solar Lamp',
    initialCount: 0,
    consumable: null,
  },
];

export const CROP_ITEM_IDS = Object.freeze({ potato: BLOCK_IDS.POTATO, lettuce: BLOCK_IDS.LETTUCE, soy: BLOCK_IDS.SOY });
export const CROP_TYPES_BY_ID = Object.freeze(Object.fromEntries(Object.entries(CROP_ITEM_IDS).map(([type, id]) => [id, type])));
// Base blocks the player can break: each one drops as itself, never as a different block.
const BASE_BLOCK_ITEMS = [
  { id: BLOCK_IDS.SOLAR_PANEL, name: 'Solar Panel Block' },
  { id: BLOCK_IDS.THRUSTER_METAL, name: 'Metal Floor Plate' },
  { id: BLOCK_IDS.CONSOLE_SCREEN, name: 'Console Block' },
  { id: BLOCK_IDS.RED_BEACON, name: 'Orange Beacon' },
].map((item) => ({ ...item, initialCount: 0, consumable: null }));

// Item registry is independent of the nine initial hotbar slots.
export const ITEM_DEFINITIONS = [...HOTBAR_BLOCKS, ...BASE_BLOCK_ITEMS, ...Object.entries(CROP_ITEM_IDS).map(([type, id]) => ({
  id, name: 'Mars ' + type + ' (Use to eat)', initialCount: 0,
  consumable: { type: 'food', amount: CROP_CONFIG[type].nutrition, heal: 0 },
}))];
