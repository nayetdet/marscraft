import { BLOCK_IDS } from '../config/blockTypes.js';

// Fichas do scanner da luneta. Os textos são curtos e em inglês (como o resto da UI), para
// crianças de 7 a 12 anos. Os números vêm de docs/data/numeros-reais.md e dos fact sheets da
// NASA; cada fato cita a própria fonte. Tudo é dado embutido de referência, nunca "ao vivo".

const SOURCES = {
  marsFacts: { name: 'NASA Mars Fact Sheet', url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html' },
  moonFacts: { name: 'NASA Moon Fact Sheet', url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html' },
  marsScience: { name: 'NASA Science: Mars', url: 'https://science.nasa.gov/mars/facts/' },
  phobos: { name: 'NASA Science: Phobos', url: 'https://science.nasa.gov/mars/moons/phobos/' },
  deimos: { name: 'NASA Science: Deimos', url: 'https://science.nasa.gov/mars/moons/deimos/' },
  insight: { name: 'NASA InSight weather (sols 675-681)', url: 'https://science.nasa.gov/mission/insight/' },
  radlab: { name: 'NASA OSDR RadLab (Curiosity MSL-RAD, LRO CRaTER)', url: 'https://visualization.osdr.nasa.gov/radlab/' },
  curiosity: { name: 'NASA Curiosity rover', url: 'https://science.nasa.gov/mission/msl-curiosity/' },
  perseverance: { name: 'NASA Perseverance rover', url: 'https://science.nasa.gov/mission/mars-2020-perseverance/' },
  bvad: { name: 'NASA life support baseline values (BVAD)', url: null },
  iss: { name: 'NASA International Space Station', url: 'https://www.nasa.gov/international-space-station/' },
};

export const SCAN_CATEGORIES = [
  { id: 'sky', label: 'Sky' },
  { id: 'terrain', label: 'Terrain' },
  { id: 'base', label: 'Base' },
  { id: 'landscape', label: 'Landscape' },
];

export const SCAN_CATALOG = [
  // ---------- Céu ----------
  {
    id: 'sun',
    category: 'sky',
    title: 'The Sun',
    summary: 'Our star. From Mars it looks smaller and dimmer than it does from Earth.',
    facts: [
      { label: 'Distance from Mars', value: '~228 million km', source: SOURCES.marsFacts },
      { label: 'Sunlight on Mars', value: '~43% of Earth (~590 W/m²)', source: SOURCES.marsFacts },
      { label: 'Light travel time', value: '~12.7 minutes to reach Mars', source: SOURCES.marsFacts },
    ],
    why: 'Less sunlight means solar panels make less power, and solar storms send dangerous radiation.',
  },
  {
    id: 'earth',
    category: 'sky',
    title: 'Earth',
    summary: 'Home! From Mars, Earth looks like a bright blue star in the sky.',
    facts: [
      { label: 'Distance to Mars', value: '55 to 401 million km', source: SOURCES.marsScience },
      { label: 'Radio delay (one way)', value: '~3 to 22 minutes', source: SOURCES.marsFacts },
    ],
    why: 'Messages take minutes to arrive, so Mission Control cannot save you in real time. You decide!',
  },
  {
    id: 'moon',
    category: 'sky',
    title: 'The Moon',
    summary: "Earth's Moon, the tiny dot right next to Earth.",
    facts: [
      { label: 'Distance from Earth', value: '~384,400 km', source: SOURCES.moonFacts },
      { label: 'Gravity', value: '1.62 m/s² (0.17 g)', source: SOURCES.moonFacts },
      { label: 'Radiation in lunar orbit', value: '~9.2 µGy/h (LRO CRaTER)', source: SOURCES.radlab },
    ],
    why: 'Artemis astronauts are going back to the Moon to practice living far from Earth before Mars.',
  },
  {
    id: 'phobos',
    category: 'sky',
    title: 'Phobos',
    summary: "Mars' bigger moon. It is lumpy, like a giant space potato.",
    facts: [
      { label: 'Size', value: '~22 km across', source: SOURCES.phobos },
      { label: 'Orbit', value: 'Circles Mars 3 times a day', source: SOURCES.phobos },
      { label: 'Getting closer', value: '~1.8 m closer to Mars every 100 years', source: SOURCES.phobos },
    ],
    why: 'Phobos is so close that one day Mars will pull it apart into a ring.',
  },
  {
    id: 'deimos',
    category: 'sky',
    title: 'Deimos',
    summary: "Mars' smaller and farther moon. From the ground it looks like a bright star.",
    facts: [
      { label: 'Size', value: '~12 km across', source: SOURCES.deimos },
      { label: 'Orbit', value: 'Once every ~30 hours', source: SOURCES.deimos },
      { label: 'Distance from Mars', value: '~23,460 km', source: SOURCES.deimos },
    ],
    why: 'Small moons like Deimos could be stepping stones for future missions.',
  },

  // ---------- Terreno ----------
  {
    id: 'regolith',
    category: 'terrain',
    title: 'Martian Regolith',
    summary: 'Loose dust and broken rock that covers Mars. It is red because it is rusty!',
    facts: [
      { label: 'Why red', value: 'Iron oxide (rust)', source: SOURCES.marsScience },
      { label: 'Dust size', value: 'As fine as talcum powder', source: SOURCES.marsScience },
      { label: 'Dust storms', value: 'Can cover the whole planet', source: SOURCES.marsScience },
    ],
    why: 'Dust sticks to solar panels and spacesuits, so it lowers your power and wears out gear.',
  },
  {
    id: 'sandstone',
    category: 'terrain',
    title: 'Orange Sandstone',
    summary: 'Sand and mud pressed into rock over millions of years.',
    facts: [
      { label: 'Made from', value: 'Sand and mud squeezed together', source: SOURCES.curiosity },
      { label: 'Clue', value: 'Layers show where water once flowed', source: SOURCES.curiosity },
      { label: 'Explorer', value: 'Curiosity rover, Gale Crater (since 2012)', source: SOURCES.curiosity },
    ],
    why: 'Rocks made by water tell us Mars was once wetter, and maybe could have hosted life.',
  },
  {
    id: 'crater-rock',
    category: 'terrain',
    title: 'Crater Rock (Basalt)',
    summary: 'Dark volcanic rock made from cooled lava.',
    facts: [
      { label: 'Type', value: 'Basalt (cooled lava)', source: SOURCES.marsScience },
      { label: 'Biggest volcano', value: 'Olympus Mons, ~3x taller than Everest', source: SOURCES.marsScience },
    ],
    why: 'Thick walls of rock and regolith block radiation, so they make great shelters.',
  },
  {
    id: 'water-ice',
    category: 'terrain',
    title: 'Water Ice',
    summary: 'Frozen water hiding at the poles and just under the surface of Mars.',
    facts: [
      { label: 'Where', value: 'Polar caps and under the ground', source: SOURCES.marsScience },
      { label: 'Turns into', value: 'Drinking water, food, oxygen, rocket fuel', source: SOURCES.marsScience },
      { label: 'Average air temperature', value: 'About -62 °C (InSight)', source: SOURCES.insight },
    ],
    why: 'Shipping water from Earth costs a fortune. Finding ice is mission priority number one!',
    reward: { items: [{ blockId: BLOCK_IDS.MARS_ICE, count: 1 }], iceSensor: true },
  },

  // ---------- Base ----------
  {
    id: 'base',
    category: 'base',
    title: 'Mars Outpost',
    summary: 'Your whole base: habitat, tunnel, greenhouse, solar panels and antenna working together.',
    facts: [
      { label: 'Outside air pressure', value: '~0.7% of Earth (InSight)', source: SOURCES.insight },
      { label: 'Outside temperature', value: '-98 °C to -4 °C (InSight)', source: SOURCES.insight },
      { label: 'Surface radiation', value: '~6.9 µGy/h, ~1.5x the Space Station', source: SOURCES.radlab },
    ],
    why: 'Every module keeps the crew alive: air, water, food and power. If one fails, the others suffer.',
  },
  {
    id: 'habitat',
    category: 'base',
    title: 'Main Habitat',
    summary: 'The pressurized home where the crew lives, sleeps and works without spacesuits.',
    facts: [
      { label: 'Oxygen per astronaut', value: '~0.84 kg per day', source: SOURCES.bvad },
      { label: 'Water per astronaut', value: '~2.5 to 3.5 kg per day', source: SOURCES.bvad },
    ],
    why: 'Outside you cannot breathe. The habitat holds air in and keeps the cold out.',
  },
  {
    id: 'airlock',
    category: 'base',
    title: 'Airlock',
    summary: 'A small room with two doors, so the air inside never escapes.',
    facts: [
      { label: 'Rule', value: 'Never open both doors at once', source: SOURCES.iss },
      { label: 'Outside air pressure', value: '~0.7% of Earth (InSight)', source: SOURCES.insight },
    ],
    why: 'Every trip outside costs a little air, so astronauts plan their spacewalks carefully.',
  },
  {
    id: 'tunnel',
    category: 'base',
    title: 'Pressurized Tunnel',
    summary: 'A sealed hallway that connects the habitat to the greenhouse.',
    facts: [
      { label: 'Saves', value: 'No spacesuit needed between modules', source: SOURCES.iss },
      { label: 'Like the ISS', value: 'Modules joined by sealed hatches', source: SOURCES.iss },
    ],
    why: 'Walking inside is safer and faster than suiting up every time you change rooms.',
  },
  {
    id: 'greenhouse',
    category: 'base',
    title: 'Greenhouse',
    summary: 'A glass dome where plants grow using water, light and care.',
    facts: [
      { label: 'Food per astronaut', value: '~1.8 kg per day', source: SOURCES.bvad },
      { label: 'Real test', value: 'Astronauts grew lettuce on the ISS (Veggie)', source: SOURCES.iss },
      { label: 'Sunlight on Mars', value: '~43% of Earth', source: SOURCES.marsFacts },
    ],
    why: 'Growing food costs water and power, but it is the only way to stay on Mars for years.',
    reward: { items: [{ blockId: BLOCK_IDS.HYDRO_PLANT, count: 2 }] },
  },
  {
    id: 'cupola',
    category: 'base',
    title: 'Observation Cupola',
    summary: 'A room full of windows on top of the habitat to watch the sky and the crater.',
    facts: [
      { label: 'Inspired by', value: 'The ISS Cupola, with 7 windows', source: SOURCES.iss },
    ],
    why: 'Watching the sky helps the crew spot dust storms and plan trips outside.',
  },
  {
    id: 'solar-panels',
    category: 'base',
    title: 'Solar Panels',
    summary: 'Panels that turn sunlight into electricity for the whole base.',
    facts: [
      { label: 'Sunlight on Mars', value: '~43% of Earth (~590 W/m²)', source: SOURCES.marsFacts },
      { label: 'At night', value: 'No power, so batteries are needed', source: SOURCES.marsFacts },
      { label: 'Real story', value: "Dust covered InSight's panels; it shut down in 2022", source: SOURCES.marsScience },
    ],
    why: 'Power runs air, heat and water. Less sun or more dust means hard choices.',
  },
  {
    id: 'antenna',
    category: 'base',
    title: 'Communication Antenna',
    summary: 'The dish that sends and receives messages from Earth.',
    facts: [
      { label: 'Radio delay (one way)', value: '~3 to 22 minutes', source: SOURCES.marsFacts },
      { label: 'Relay', value: 'Orbiters like MRO pass rover data to Earth', source: SOURCES.marsScience },
    ],
    why: 'Even at the speed of light, help from Earth arrives late. The crew must be ready.',
  },
  {
    id: 'ice-depot',
    category: 'base',
    title: 'Ice Processing Plant',
    summary: 'The station that melts and cleans ice from the rover into drinking water.',
    facts: [
      { label: 'Conversion', value: '1 kg of ice ≈ 1 liter of water', source: SOURCES.bvad },
      { label: 'Water per astronaut', value: '~2.5 to 3.5 kg per day', source: SOURCES.bvad },
      { label: 'Real tech', value: 'MOXIE made oxygen from Mars air (2021)', source: SOURCES.perseverance },
    ],
    why: 'Using what Mars already has (called ISRU) is much cheaper than shipping it from Earth.',
    reward: { items: [{ blockId: BLOCK_IDS.MARS_ICE, count: 2 }] },
  },
  {
    id: 'rover',
    category: 'base',
    title: 'Mars Rover',
    summary: 'A robot car that explores, drills ice and carries cargo for the crew.',
    facts: [
      { label: 'Curiosity size', value: 'About a car, ~899 kg', source: SOURCES.curiosity },
      { label: 'Top speed', value: '~0.14 km/h (slower than walking!)', source: SOURCES.curiosity },
      { label: 'Perseverance', value: 'Landed in Jezero Crater in 2021', source: SOURCES.perseverance },
    ],
    why: 'Rovers do the risky driving so astronauts can save air and avoid danger.',
  },
  {
    id: 'lander',
    category: 'base',
    title: 'Ascent Vehicle',
    summary: 'The rocket that will take the crew back up to orbit when the mission ends.',
    facts: [
      { label: 'Escape speed from Mars', value: '~5.0 km/s', source: SOURCES.marsFacts },
      { label: 'Mars gravity', value: '3.71 m/s² (0.38 g)', source: SOURCES.marsFacts },
    ],
    why: 'Lower gravity makes leaving Mars easier than leaving Earth, but the rocket still needs lots of fuel.',
  },
  {
    id: 'mav-panel',
    category: 'base',
    title: 'MAV Control Panel',
    summary: 'This screen tracks the fuel and mission checks needed before the crew can launch.',
    facts: [
      { label: 'Fuel', value: 'Made from water ice at the nearby factory', source: SOURCES.marsScience },
      { label: 'Launch checks', value: 'Fuel, storm safety, and science data must be ready', source: SOURCES.marsFacts },
    ],
    why: 'The crew must balance power, ice, and time to prepare a safe trip home.',
  },
  {
    id: 'gym',
    category: 'base',
    title: 'Exercise & Medbay',
    summary: 'Astronauts exercise here to keep their bodies strong, and get health checks in the medbay.',
    facts: [
      { label: 'Why exercise', value: 'Daily exercise helps protect muscles and bones in low gravity', source: SOURCES.iss },
      { label: 'What is here', value: 'Treadmill, exercise bike, and medical station', source: SOURCES.iss },
    ],
    why: 'Exercise helps astronauts stay healthy during long missions far from Earth.',
  },

  // ---------- Paisagem ----------
  {
    id: 'crater-rim',
    category: 'landscape',
    title: 'Crater Rim',
    summary: 'You live inside a crater, like Gale Crater where Curiosity explores.',
    facts: [
      { label: 'Gale Crater', value: '~154 km wide', source: SOURCES.curiosity },
      { label: 'Mount Sharp', value: '~5 km tall, in the middle of Gale', source: SOURCES.curiosity },
    ],
    why: 'Crater walls block some wind, and their rock layers tell the story of ancient Mars.',
  },
  {
    id: 'atmosphere',
    category: 'landscape',
    title: 'Mars Atmosphere',
    summary: 'A very thin layer of air, mostly carbon dioxide. Sunsets on Mars are blue!',
    facts: [
      { label: 'Air pressure', value: '~0.7% of Earth (~746 Pa, InSight)', source: SOURCES.insight },
      { label: 'Made of', value: '~95% carbon dioxide', source: SOURCES.marsFacts },
      { label: 'Blue sunsets', value: 'Fine dust scatters blue light near the Sun', source: SOURCES.marsScience },
    ],
    why: 'The air is too thin to breathe or to block much radiation, so you always need a suit.',
  },
];

const BY_ID = new Map(SCAN_CATALOG.map((entry) => [entry.id, entry]));

export function getScanEntry(id) {
  return BY_ID.get(id) ?? null;
}

export function getCategoryLabel(categoryId) {
  return SCAN_CATEGORIES.find((c) => c.id === categoryId)?.label ?? categoryId;
}

// Lista única de fontes citadas no catálogo, para a tela de fontes do diário.
export function listCatalogSources() {
  const seen = new Map();
  for (const entry of SCAN_CATALOG) {
    for (const fact of entry.facts) {
      if (!seen.has(fact.source.name)) seen.set(fact.source.name, fact.source);
    }
  }
  return [...seen.values()];
}
