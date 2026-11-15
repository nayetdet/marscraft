import { ENERGY_CONFIG, OXYGEN_PLANT_CONFIG as O } from '../config/constants.js';
import { ELECTROLYSIS_WATER_L_PER_PERSON_SOL, OXYGEN_MODE_INFO, OXYGEN_MODES } from './oxygenPlant.js';

// Textos do gerador de O2 no painel de suporte de vida (issue #102). Puro, para testar com Vitest.

// Fontes citadas no painel, no poster `air` e na tela "NASA Data"
export const OXYGEN_SOURCES = {
  oga: 'https://ntrs.nasa.gov/api/citations/20150016494/downloads/20150016494.pdf',
  sabatier: 'https://ntrs.nasa.gov/api/citations/20240002161/downloads/ICES24%20Paper%20168.pdf',
  moxie: 'https://www.nasa.gov/missions/mars-2020-perseverance/perseverance-rover/nasas-oxygen-generating-experiment-moxie-completes-mars-mission/',
};

const fmt = (n) => (Math.round(n * 100) / 100).toString();

function costLine(mode, plant) {
  const power = fmt(ENERGY_CONFIG.OXYGEN_COST_PER_POINT * OXYGEN_MODE_INFO[mode].energyFactor);
  if (mode === 'moxie') return `  Cost: ${power}% power per O2 point. No water.`;
  const water = fmt(ELECTROLYSIS_WATER_L_PER_PERSON_SOL * plant.waterLossFraction);
  return `  Cost: ${power}% power per O2 point, and about ${water} L of water per person each sol.`;
}

export function oxygenPlantText(plant) {
  const other = OXYGEN_MODES.find((mode) => mode !== plant.mode);
  const on = plant.info;
  const off = OXYGEN_MODE_INFO[other];
  const sabatier = plant.sabatier
    ? 'SABATIER REACTOR: ON. It gives back half of the water the air machine splits.'
    : `SABATIER REACTOR: not built. It would give back half of that water (${O.SABATIER_REGOLITH} regolith, ${O.SABATIER_POWER}% power).`;
  return [
    `OXYGEN MACHINE: ${on.label.toUpperCase()} (${on.machine})`,
    `  ${on.kid}`,
    costLine(plant.mode, plant),
    `OTHER CHOICE: ${off.label.toUpperCase()} (${off.machine})`,
    `  ${off.kid}`,
    costLine(other, plant),
    `WATER USED TO MAKE AIR SO FAR: ${plant.waterUsedL.toFixed(2)} L`,
    sabatier,
    '',
    'Night with no sun? Air from water saves the battery. Tank almost empty? Air from Mars air saves the water.',
    'The water math is real chemistry: 36 g of water make 32 g of oxygen. The power costs are game rules.',
  ].join('\n');
}

export function oxygenPlantButtons(plant) {
  const buttons = OXYGEN_MODES.map((mode) => [
    `o2mode:${mode}`,
    `${OXYGEN_MODE_INFO[mode].label}${plant.mode === mode ? ' (ON)' : ''}`,
  ]);
  if (!plant.sabatier) buttons.push(['buildSabatier', `Build Sabatier reactor (${O.SABATIER_REGOLITH} regolith, ${O.SABATIER_POWER}% power)`]);
  return buttons;
}
