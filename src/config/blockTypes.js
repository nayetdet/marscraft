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
    name: 'Areia Marciana',
    initialCount: 16,
    consumable: null,
  },
  {
    id: BLOCK_IDS.SANDSTONE,
    name: 'Arenito Alaranjado',
    initialCount: 12,
    consumable: null,
  },
  {
    id: BLOCK_IDS.BASALT,
    name: 'Rocha de Cratera',
    initialCount: 8,
    consumable: null,
  },
  {
    id: BLOCK_IDS.MARS_ICE,
    name: 'Gelo de Agua (Botao Dir. Bebe)',
    initialCount: 5,
    consumable: { type: 'water', amount: 6 },
  },
  {
    id: BLOCK_IDS.HYDRO_PLANT,
    name: 'Batata de Marte (Botao Dir. Come)',
    initialCount: 5,
    consumable: { type: 'food', amount: 6, heal: 2 },
  },
  {
    id: BLOCK_IDS.NASA_HULL,
    name: 'Bloco da Nave',
    initialCount: 10,
    consumable: null,
  },
  {
    id: BLOCK_IDS.GOLD_FOIL,
    name: 'Bloco Termico Dourado',
    initialCount: 8,
    consumable: null,
  },
  {
    id: BLOCK_IDS.HAB_GLASS,
    name: 'Vidro Pressurizado',
    initialCount: 6,
    consumable: null,
  },
  {
    id: BLOCK_IDS.HAB_LIGHT,
    name: 'Lanterna Solar',
    initialCount: 4,
    consumable: null,
  },
];
