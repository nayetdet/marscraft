// @ts-nocheck
import {
  COMMS_CONFIG, CROP_CONFIG, ENERGY_CONFIG, MISSION_CONFIG, PHYSICS_CONFIG, RADIATION_CONFIG, STORM_CONFIG,
} from '../config/constants.ts';

// Aba "REAL VS GAME" do diario [J] (issue #106): onde o jogo muda a realidade para caber numa
// partida. Os numeros do jogo vem de constants.js; os reais e as fontes de
// docs/data/numeros-reais.md ("Calibracao atual do jogo vs. realidade" e tabelas da missao).

const realSecondsPerGameHour = Math.round(1 / MISSION_CONFIG.GAME_HOURS_PER_SECOND);
const solMinutes = Math.round((24 * realSecondsPerGameHour) / 60);
const cropSeconds = Object.values(CROP_CONFIG).map((c) => c.seconds);

export const REAL_VS_GAME = [
  {
    topic: 'Gravity',
    game: `${PHYSICS_CONFIG.MARS_GRAVITY} m/s² (1 block = 1 m)`,
    real: '3.71 m/s² (38% of Earth)',
    why: 'Stronger pull so jumping feels like a block game. On real Mars you could jump more than 2 times higher than on Earth.',
    source: 'NASA Mars Fact Sheet',
  },
  {
    topic: 'One day (sol)',
    game: `24 h clock, played in ${solMinutes} minutes`,
    real: '24 h 39 min',
    why: `1 game hour = ${realSecondsPerGameHour} real seconds, so a mission fits in one play session.`,
    source: 'NASA Mars Fact Sheet',
  },
  {
    topic: 'Airlock',
    game: `About ${Math.round((MISSION_CONFIG.AIRLOCK_CYCLE + MISSION_CONFIG.SUIT_CLEAN_TIME) * 10) / 10} s to pump air and clean the suit`,
    real: 'On the Space Station, about 1 hour after a spacewalk before the suit comes off',
    why: 'Waiting an hour at the door is no fun. The game keeps the two doors and the power cost.',
    source: 'NASA: Quest airlock',
  },
  {
    topic: 'Battery',
    game: `One battery, 0 to ${ENERGY_CONFIG.BATTERY_CAPACITY}%`,
    real: 'Not measured yet for a Mars base',
    why: 'Power costs are in % so they are easy to compare. The 43% sunlight on Mars is real.',
    source: 'NASA Mars Fact Sheet (sunlight)',
  },
  {
    topic: 'Solar storm',
    game: `${STORM_CONFIG.DURATION_HOURS} game hours`,
    real: 'High radiation for more than 2 days (Sept. 2017)',
    why: '1 real day of the storm trip = 1 game hour of warning. The storms come from real NASA DONKI data.',
    source: 'NASA JPL, 2017; NASA DONKI',
  },
  {
    topic: 'Storm shelter wall',
    game: `${RADIATION_CONFIG.SHELTER_WALL_MAX_L} L of water = 10 g/cm²`,
    real: 'A real wall that thick needs hundreds of liters',
    why: 'Shrunk to fit the 100 L base tank. How much each layer blocks is real (PREDICCS).',
    source: 'Quinn et al., UNH (PREDICCS)',
  },
  {
    topic: 'Plants',
    game: `${Math.min(...cropSeconds)} to ${Math.max(...cropSeconds)} seconds to grow`,
    real: 'Space Station salad plants: 28 days (VEG-04)',
    why: 'Sped up so you can see a harvest while you play.',
    source: 'NASA, 2019',
  },
  {
    topic: 'Radio to Earth',
    game: `${COMMS_CONFIG.GAME_SECONDS_PER_LIGHT_MINUTE} s of waiting for each minute of light travel`,
    real: '3 to 22 minutes one way',
    why: 'The distance is real for today\'s date; only the wait is shorter.',
    source: 'NASA/JPL planet positions',
  },
  {
    topic: 'Solar conjunction',
    game: `${COMMS_CONFIG.GAME_CONJUNCTION_HOURS} game hours, once per mission`,
    real: 'About 2 weeks, every 26 months (next one in 2028)',
    why: 'The game acts one out so you can practice deciding without Earth.',
    source: 'NASA/JPL',
  },
  {
    topic: 'Normal radiation',
    game: 'Same as the real one',
    real: 'Curiosity rover median on the Mars surface',
    why: 'This number is not changed: it comes straight from NASA RadLab data.',
    source: 'NASA RadLab (Curiosity MSL-RAD)',
  },
];
