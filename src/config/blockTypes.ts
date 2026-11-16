// @ts-nocheck
import { CROP_CONFIG, UTILITY_CONFIG } from './constants.ts';

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
  RATION: 21, // racao embalada estilo NASA, consumivel no inventario
  DARK_BASALT: 20,
  // Amostras cientificas do mapa (issue #270): itens de inventario, nao sao blocos do mundo
  SAMPLE_DUNE_SAND: 22,
  SAMPLE_MUDSTONE: 23,
  SAMPLE_SULFUR: 24,
  SAMPLE_METEORITE: 25,
  SAMPLE_ICE_CORE: 26,
  METEOR_ICE: 27,
};

export const WATER_ICE_BLOCK_IDS = Object.freeze([BLOCK_IDS.MARS_ICE, BLOCK_IDS.METEOR_ICE]);
export const isWaterIceBlock = (blockId) => WATER_ICE_BLOCK_IDS.includes(blockId);

export const SHIP_BLOCK_IDS = Object.freeze([
  BLOCK_IDS.NASA_HULL,
  BLOCK_IDS.GOLD_FOIL,
  BLOCK_IDS.HAB_GLASS,
  BLOCK_IDS.SOLAR_PANEL,
  BLOCK_IDS.HAB_LIGHT,
  BLOCK_IDS.THRUSTER_METAL,
  BLOCK_IDS.CONSOLE_SCREEN,
  BLOCK_IDS.RED_BEACON,
]);

export const HOTBAR_BLOCKS = [
  {
    id: BLOCK_IDS.JOURNAL,
    name: 'Discovery Journal (Use to open)',
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
    id: BLOCK_IDS.HYDRO_PLANT,
    name: 'Mars Carrot (Right-click to eat)',
    initialCount: 3,
    consumable: { type: 'food', amount: 6, heal: 2 },
  },
  {
    id: BLOCK_IDS.SCOPE,
    name: 'Scope Scanner',
    // A crianca nao comeca com a luneta: o engenheiro de voo entrega no ato 2 (#408)
    initialCount: 0,
    consumable: null,
    equipment: true,
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
  {
    id: BLOCK_IDS.METEOR_ICE,
    name: 'Fresh Meteor Ice',
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
  { id: BLOCK_IDS.DARK_BASALT, name: 'Dark Basalt' },
].map((item) => ({ ...item, initialCount: 0, consumable: null }));

// Amostras do mapa: `equipment` impede colocar no mundo ou largar no chao (sao para o laboratorio).
// Nomes e fatos em src/data/sampleTypes.ts.
const SAMPLE_ITEMS = [
  { id: BLOCK_IDS.SAMPLE_DUNE_SAND, name: 'Sample: Dark Dune Sand (analyze in the lab)' },
  { id: BLOCK_IDS.SAMPLE_MUDSTONE, name: 'Sample: Layered Mudstone (analyze in the lab)' },
  { id: BLOCK_IDS.SAMPLE_SULFUR, name: 'Sample: Yellow Sulfur Crystals (analyze in the lab)' },
  { id: BLOCK_IDS.SAMPLE_METEORITE, name: 'Sample: Iron Meteorite (analyze in the lab)' },
  { id: BLOCK_IDS.SAMPLE_ICE_CORE, name: 'Sample: Buried Ice Core (analyze in the lab)' },
].map((item) => ({ ...item, initialCount: 0, consumable: null, equipment: true }));

// Item registry is independent of the nine initial hotbar slots.
export const ITEM_DEFINITIONS = [
  ...HOTBAR_BLOCKS,
  ...BASE_BLOCK_ITEMS,
  ...SAMPLE_ITEMS,
  {
    id: BLOCK_IDS.RATION,
    name: 'Space Ration (Use to eat)',
    initialCount: 0,
    consumable: { type: 'food', amount: UTILITY_CONFIG.RATION_FOOD, heal: 0 },
  },
  ...Object.entries(CROP_ITEM_IDS).map(([type, id]) => ({
    id, name: 'Mars ' + type + ' (Use to eat)', initialCount: 0,
    consumable: { type: 'food', amount: CROP_CONFIG[type].nutrition, heal: 0 },
  })),
];
