// @ts-nocheck
import {
  COMMS_CONFIG, CREW_CONFIG, CROP_CONFIG, ENERGY_CONFIG, MAV_CONFIG, MISSION_CONFIG, PHYSICS_CONFIG, RADIATION_CONFIG, STORM_CONFIG,
  SURVIVAL_CONFIG, TIME_SCALE_CONFIG,
} from '../config/constants.ts';
import { BATTERY_KWH, RTG_IN_REAL_MMRTGS, RTG_KW, SOLAR_PEAK_KW } from '../mission/powerUnits.ts';

// Aba "REAL VS GAME" do diario [J] (issue #106): onde o jogo muda a realidade para caber numa
// partida. Os numeros do jogo vem de constants.js; os reais e as fontes de
// docs/data/numeros-reais.md ("Calibracao atual do jogo vs. realidade" e tabelas da missao).

const realSecondsPerGameHour = Math.round(1 / MISSION_CONFIG.GAME_HOURS_PER_SECOND);
const solMinutes = Math.round((24 * realSecondsPerGameHour) / 60);
const cropSeconds = Object.values(CROP_CONFIG).map((c) => c.seconds);
const cropDays = Object.values(CROP_CONFIG).map((c) => c.realDays);
// Issue #229: numeros reais por pessoa e por sol, e as excecoes declaradas do relogio
const crewWaterPerSol = CREW_CONFIG.WATER_L_PER_HOUR * 24;
const crewFoodKgPerSol = CREW_CONFIG.FOOD_PER_HOUR * 24 * CREW_CONFIG.KG_PER_RATION;
const suitMinutes = Math.round(100 / SURVIVAL_CONFIG.SUIT_OXYGEN_DRAIN_PER_SECOND / 60);
const suitGameHours = (suitMinutes * 60 * MISSION_CONFIG.GAME_HOURS_PER_SECOND).toFixed(1);
const oneDecimal = (n) => (Math.round(n * 10) / 10).toString();

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
    game: `0 to ${ENERGY_CONFIG.BATTERY_CAPACITY}%, about ${Math.round(BATTERY_KWH)} kWh; the solar field makes up to ${Math.round(SOLAR_PEAK_KW)} kW`,
    real: `One Kilopower reactor: 1 to ${TIME_SCALE_CONFIG.REACTOR_KW} kW. Sunlight on Mars: 43% of Earth`,
    why: `Power is shown in % so it is easy to compare. Our ruler: the game reactor counts as one real ${TIME_SCALE_CONFIG.REACTOR_KW} kW Kilopower. How much each machine uses is a game rule.`,
    source: 'NASA Kilopower (2018); NASA Mars Fact Sheet',
  },
  {
    topic: 'Nuclear generator (RTG)',
    game: `About ${oneDecimal(RTG_KW)} kW, day and night`,
    real: `Curiosity's generator (MMRTG): about ${Math.round(TIME_SCALE_CONFIG.MMRTG_KW * 1000)} W`,
    why: `A base needs far more power than a rover. The game one is like ${RTG_IN_REAL_MMRTGS} rover generators together.`,
    source: 'NASA: MMRTG',
  },
  {
    topic: 'Crew food and water',
    game: `${oneDecimal(crewWaterPerSol)} L of water (drinking, cooking and washing) and ${oneDecimal(crewFoodKgPerSol)} kg of food per person each sol`,
    real: 'About 3 kg of water to drink and cook, and 1.8 kg of food per person each day. Washing uses more water on top',
    why: 'The food is the real number. The water for drinking and cooking is real too; the washing part is a game number, so the big tank empties at a pace you can see.',
    source: 'NASA life support baseline values (BVAD)',
  },
  {
    topic: 'Your hunger and thirst',
    game: `A full bar lasts ${TIME_SCALE_CONFIG.PLAYER_FOOD_HOURS} game hours (${Math.round(TIME_SCALE_CONFIG.PLAYER_FOOD_HOURS * realSecondsPerGameHour / 60)} minutes of play)`,
    real: 'Astronauts eat about 3 meals a day',
    why: 'You eat and drink about twice each sol. A real person can last longer, but would feel weak.',
    source: 'NASA life support baseline values (BVAD)',
  },
  {
    topic: 'Suit air',
    game: `${suitMinutes} minutes of play, about ${suitGameHours} game hours`,
    real: `A real spacewalk lasts ${TIME_SCALE_CONFIG.REAL_SPACEWALK_HOURS[0]} to ${TIME_SCALE_CONFIG.REAL_SPACEWALK_HOURS[1]} hours`,
    why: 'Close to real on the game clock. The suit tank is what limits how far you can walk.',
    source: 'NASA: What Is a Spacewalk?',
  },
  {
    topic: 'Rocket fuel',
    game: `${MAV_CONFIG.ICE_BLOCKS_FOR_FULL_TANK} blocks of ice fill the tank`,
    real: `About ${TIME_SCALE_CONFIG.REAL_ASCENT_PROPELLANT_TONNES} tons: 7 of fuel and 25 of oxygen to lift 4 astronauts`,
    why: 'Thousands of times smaller, so you can fill it in one play session. Making fuel from Mars ice and air is the real plan.',
    source: 'NASA, 2021 (MOXIE on Perseverance)',
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
    why: 'The exact size is a game number, picked to fit the base tank. How much each layer blocks is real (PREDICCS). Only a full wall lets you wait out a storm with the clock running fast: that part is a game rule.',
    source: 'Quinn et al., UNH (PREDICCS)',
  },
  {
    topic: 'Plants',
    game: `${Math.min(...cropSeconds)} to ${Math.max(...cropSeconds)} seconds to grow`,
    real: `${Math.min(...cropDays)} to ${Math.max(...cropDays)} days: lettuce ${CROP_CONFIG.lettuce.realDays}, soy ${CROP_CONFIG.soy.realDays}, potato ${CROP_CONFIG.potato.realDays}`,
    why: `The greenhouse runs much faster than the game clock so you can see a harvest: ${TIME_SCALE_CONFIG.CROP_REAL_DAYS_PER_GAME_SECOND} real days pass each second. Which plant is slower is real.`,
    source: 'NASA Kennedy Space Center crop tests; Space Station VEG-04 (2019)',
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
