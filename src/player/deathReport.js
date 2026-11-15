const REPORTS = {
  OXYGEN_DEPLETION: {
    title: 'OXYGEN LOST',
    diagnosis: 'Your suit ran out of oxygen before you returned to a pressurized room.',
    science: 'ECLSS is the life-support system that supplies breathable air.',
    protocol: 'Follow the airlock marker back to the habitat. Refill your suit inside.',
  },
  RADIATION_OVERDOSE: {
    title: 'RADIATION EMERGENCY',
    diagnosis: 'A solar storm exposed you to too much radiation before you reached shelter.',
    science: 'NASA RadLab measures radiation. A water wall or the shield can reduce exposure.',
    protocol: 'When a storm warning appears, enter the shelter and fill its water wall, or turn on the shield inside its bubble.',
  },
  POWER_FAILURE: {
    title: 'LIFE SUPPORT POWER FAILURE',
    diagnosis: 'The base ran out of power, so its life-support system could not keep the air safe.',
    science: 'Life support needs electricity to move air, make oxygen, and remove carbon dioxide.',
    protocol: 'Restore power at the control station. Check the air filter before staying inside.',
  },
  BIOLOGICAL_COLLAPSE: {
    title: 'HEALTH CRITICAL',
    diagnosis: 'A survival hazard reduced your health to zero.',
    science: 'Your body needs water and food. Dust storms can also damage a spacesuit.',
    protocol: 'Return to the habitat when a warning appears. Keep water and food ready for the trip.',
  },
};

const BIOLOGICAL_DETAILS = {
  'water-depleted': {
    diagnosis: 'Your body ran out of water.',
    protocol: 'Drink from the base dispenser or bring ice with the rover before the tank is empty.',
  },
  'food-depleted': {
    diagnosis: 'Your body ran out of food.',
    protocol: 'Harvest a ready crop or keep food in your pack before leaving the base.',
  },
  'contaminated-air': {
    diagnosis: 'Dust brought inside on your suit made the habitat air unsafe.',
    science: 'ECLSS filters help keep dust and other contaminants out of the air.',
    protocol: 'Clean your suit before entering, then clean the habitat at life support.',
  },
  'bad-base-air': {
    diagnosis: 'Carbon dioxide built up because the habitat filter could not clean the air.',
    science: 'ECLSS filters remove carbon dioxide so the crew can breathe safely.',
    protocol: 'Replace the air filter at life support. Restore base power if the battery is empty.',
  },
};

export function getDeathReport(cause, detail) {
  const fallback = REPORTS.BIOLOGICAL_COLLAPSE;
  const base = REPORTS[cause] ?? fallback;
  if (cause !== 'BIOLOGICAL_COLLAPSE' || !BIOLOGICAL_DETAILS[detail]) return base;
  return { ...base, ...BIOLOGICAL_DETAILS[detail] };
}

const DAMAGE_FEEDBACK = {
  OXYGEN_DEPLETION: {
    source: 'OXYGEN',
    message: 'Your suit is out of oxygen. Return through the airlock.',
  },
  RADIATION_OVERDOSE: {
    source: 'SOLAR RADIATION',
    message: 'Solar particles are hurting you. Enter the storm shelter or get inside the shield.',
  },
  POWER_FAILURE: {
    source: 'LIFE SUPPORT POWER',
    message: 'The base battery is empty. Restore power in the Power & Heat room.',
  },
};

const BIOLOGICAL_DAMAGE_FEEDBACK = {
  'water-depleted': { source: 'WATER', message: 'Your water is empty. Drink at the base or bring ice with the rover.' },
  'food-depleted': { source: 'FOOD', message: 'Your food is empty. Eat before leaving the base.' },
  'contaminated-air': { source: 'DUST IN BASE AIR', message: 'Clean your suit and the habitat at life support.' },
  'bad-base-air': { source: 'BASE AIR', message: 'Replace the air filter at life support.' },
};

export function getDamageFeedback(cause, detail) {
  if (cause === 'BIOLOGICAL_COLLAPSE' && BIOLOGICAL_DAMAGE_FEEDBACK[detail]) {
    return BIOLOGICAL_DAMAGE_FEEDBACK[detail];
  }
  return DAMAGE_FEEDBACK[cause] ?? {
    source: 'SURVIVAL SYSTEM',
    message: 'A survival hazard is reducing your health. Check the resource warnings.',
  };
}
