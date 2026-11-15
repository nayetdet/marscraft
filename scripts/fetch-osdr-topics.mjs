// Baixa estudos reais do NASA OSDR (Open Science Data Repository) sobre o corpo no espaco e
// grava em src/data/osdrTopics.json (issue #106). O diario [J] revela um estudo por vez, ligado
// ao que o jogador fez (treino -> osso/musculo, enfermaria ou tempestade -> radiacao).
// Uso: node scripts/fetch-osdr-topics.mjs
// Sem estudos inventados: qualquer falha de rede ou resposta vazia interrompe o script e o JSON
// anterior fica como estava. O OSDR nao libera CORS, entao o jogo so usa o arquivo embutido.
import { writeFile } from 'node:fs/promises';

const SEARCH = 'https://osdr.nasa.gov/osdr/data/search';
const STUDY_URL = 'https://osdr.nasa.gov/bio/repo/data/studies/';
const PER_TOPIC = 3;
// Ordem = ordem em que a busca do OSDR devolve; o jogo nao escolhe a dedo.
const TOPICS = {
  bone: 'bone loss',
  muscle: 'muscle atrophy',
  radiation: 'radiation',
  sleep: 'sleep',
  immune: 'immune',
};

const clean = (text) => (typeof text === 'string' ? text.replace(/\s+/g, ' ').trim() : '');

async function searchTopic(term) {
  const query = `${SEARCH}?term=${encodeURIComponent(term)}&type=cgene&size=${PER_TOPIC}`;
  const response = await fetch(query, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`NASA OSDR HTTP ${response.status} for "${term}"`);
  const json = await response.json();
  const studies = (json.hits?.hits ?? []).map(({ _source: s }) => ({
    id: s.Accession,
    title: clean(s['Study Title']),
    organism: clean(s.organism),
    flightProgram: clean(s['Flight Program']),
    mission: clean(s.Mission?.Name),
    url: `${STUDY_URL}${s.Accession}`,
  }));
  if (!studies.length || studies.some((s) => !/^OSD-\d+$/.test(s.id) || !s.title)) {
    throw new Error(`Invalid or empty OSDR result for "${term}"; existing data preserved.`);
  }
  return { term, query, total: json.hits?.total ?? studies.length, studies };
}

const topics = {};
for (const [key, term] of Object.entries(TOPICS)) topics[key] = await searchTopic(term);

const out = {
  source: 'NASA Open Science Data Repository (OSDR)',
  retrieved: new Date().toISOString(),
  topics,
};
await writeFile(new URL('../src/data/osdrTopics.json', import.meta.url), JSON.stringify(out, null, 2) + '\n');
const count = Object.values(topics).reduce((n, t) => n + t.studies.length, 0);
console.log(`Downloaded ${count} real OSDR studies in ${Object.keys(topics).length} topics.`);
