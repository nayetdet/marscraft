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
};

export const HOTBAR_BLOCKS = [
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
    id: BLOCK_IDS.HYDRO_PLANT,
    name: 'Mars Carrot (Right-click to eat)',
    initialCount: 3,
    consumable: { type: 'food', amount: 6, heal: 2 },
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
