import research from './osdrTopics.json';

// Estudos reais do NASA OSDR por tema (issue #106). Titulos, IDs, organismos e missoes vem do
// script scripts/fetch-osdr-topics.mjs; aqui so entra a frase para crianca de cada estudo.

export const OSDR_RETRIEVED = research.retrieved;

// Temas na ordem em que aparecem no diario, com o que revela cada um no jogo
export const STUDY_TOPICS = [
  { id: 'bone', label: 'Bones', unlock: 'Finish a workout on the treadmill.' },
  { id: 'muscle', label: 'Muscles', unlock: 'Finish a workout on the exercise bike.' },
  { id: 'radiation', label: 'Radiation', unlock: 'Get treated in the medbay or survive a solar storm.' },
  { id: 'immune', label: 'Immune system', unlock: 'Get treated in the medbay after the radiation studies.' },
  { id: 'sleep', label: 'Rest', unlock: 'Rest in your bunk.' },
];

// Frase curta para 7 a 12 anos, fiel ao titulo do estudo
const KID_TEXT = {
  'OSD-342': 'Mice lived 33 days on the Space Station and lost muscle and bone. A medicine that blocks two body signals helped them keep both.',
  'OSD-18': 'In a spinning machine on Earth that copies weightlessness, the cells that eat away old bone grew about 2 times more.',
  'OSD-417': 'Mice on the Space Station lost bone, and the tiny living things in their belly changed too.',
  'OSD-225': 'Rats on Earth lived in conditions that copy spaceflight, with a little radiation. Scientists checked how a leg muscle changed.',
  'OSD-319': 'Arctic ground squirrels sleep all winter but keep strong muscles and bones. Scientists want to learn their trick.',
  'OSD-949': 'Mice without a muscle "energy switch" got weaker when their legs were not used. Using your muscles keeps them strong.',
  'OSD-73': 'Scientists hit human lung cells with space-like heavy particles in a lab, to see how cells react to space radiation.',
  'OSD-158': 'Mice got radiation in a lab, and 2 months later some changes in their cells were still there.',
  'OSD-275': 'Scientists looked at how radiation can leave marks on the cells of rats, to learn about health risks over many years.',
  'OSD-195': 'People stayed in bed for 21 days on Earth. Lying down that long weakens muscles a bit like space does.',
  'OSD-32': 'In space, body fluids move up to the head. Scientists copied this with mice on Earth and checked their brains.',
  'OSD-253': 'Mice flew on the Space Station in a mission that also watched their daily sleep and wake rhythm. This part studied their kidneys.',
  'OSD-130': 'A protein called RAD51 helps fix broken DNA, and it also helps the body fight germs.',
  'OSD-54': 'On the last Space Shuttle flight, human cells met a germ poison, to see how body defenses react in space.',
  'OSD-278': 'On the Space Station, a germ became better at making fruit flies sick. Space can change germs too.',
};

// Nome cientifico -> palavras simples
const ORGANISM_WORDS = {
  'Mus musculus': 'mice',
  'Rattus norvegicus': 'rats',
  'Homo sapiens': 'people or human cells',
  'Urocitellus parryii': 'arctic ground squirrels',
  'Drosophila melanogaster': 'fruit flies',
  'Saccharomyces cerevisiae': 'yeast',
  Microbiota: 'tiny living things',
};

export function organismWords(organism) {
  const names = String(organism ?? '').split(/\s{2,}|,/).map((s) => s.trim()).filter(Boolean);
  const words = names.map((n) => ORGANISM_WORDS[n] ?? ORGANISM_WORDS[n.split(' ')[0]] ?? n);
  return [...new Set(words)].join(' and ') || 'living things';
}

// Onde o estudo foi feito: nenhum mediu Marte
export function studyPlace(study) {
  const program = `${study.flightProgram ?? ''} ${study.mission ?? ''}`;
  if (/ISS|International Space Station/i.test(program)) return 'on the Space Station';
  if (/STS|Space Shuttle|Space Transportation/i.test(program)) return 'on a Space Shuttle flight';
  if (study.mission) return `on the ${study.mission} space mission`;
  return 'in a lab on Earth';
}

// Todos os estudos, sem repetir (o mesmo estudo pode aparecer em dois temas), com tema e frase
function buildStudies() {
  const byId = new Map();
  for (const topic of STUDY_TOPICS) {
    for (const study of research.topics[topic.id]?.studies ?? []) {
      if (byId.has(study.id)) continue;
      byId.set(study.id, {
        ...study,
        topic: topic.id,
        explanation: KID_TEXT[study.id] ?? 'Explore this real space-biology study using the NASA link.',
        organismWords: organismWords(study.organism),
        place: studyPlace(study),
      });
    }
  }
  return [...byId.values()];
}

export const OSDR_STUDIES = buildStudies();

export function studiesForTopic(topicId) {
  return OSDR_STUDIES.filter((s) => s.topic === topicId);
}

export function getStudy(id) {
  return OSDR_STUDIES.find((s) => s.id === id) ?? null;
}

// Aviso de honestidade de cada estudo: onde foi feito, com quem, e que nao mediu Marte
export function studyHonestyNote(study) {
  return `Done ${study.place} with ${study.organismWords}. It did not measure Mars.`;
}
