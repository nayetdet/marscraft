// @ts-nocheck
// Textos dos posteres e das placas da base. Dados puros (sem Three.js nem DOM).
// Todo numero daqui esta em docs/data/numeros-reais.md com a fonte ao lado.
// Linguagem para 7 a 12 anos: frases curtas, termo tecnico sempre explicado.

export const ZONE_COLORS = {
  command: '#38bdf8',
  lifeSupport: '#facc15',
  quarters: '#a78bfa',
  greenhouse: '#4ade80',
  medical: '#f87171',
  gym: '#22d3ee',
  airlock: '#fb923c',
  shelter: '#f472b6',
};

export const SIGNS = {
  command: { name: 'COMMAND', color: ZONE_COLORS.command },
  lifeSupport: { name: 'LIFE SUPPORT', color: ZONE_COLORS.lifeSupport },
  quarters: { name: 'CREW QUARTERS', color: ZONE_COLORS.quarters },
  common: { name: 'COMMON AREA', color: ZONE_COLORS.quarters },
  greenhouse: { name: 'GREENHOUSE', color: ZONE_COLORS.greenhouse },
  medical: { name: 'MEDICAL BAY', color: ZONE_COLORS.medical },
  gym: { name: 'GYM', color: ZONE_COLORS.gym },
  mainHab: { name: 'MAIN HAB', color: ZONE_COLORS.quarters },
  airlock: { name: 'AIRLOCK', color: ZONE_COLORS.airlock },
  shelter: { name: 'STORM SHELTER', color: ZONE_COLORS.shelter },
  powerRoom: { name: 'POWER & HEAT', color: '#facc15' },
  kitchen: { name: 'KITCHEN', color: '#4ade80' },
  bathroom: { name: 'BATHROOM', color: '#38bdf8' },
  workshop: { name: 'WORKSHOP', color: '#fb923c' },
};

