// Real NASA search results; no synthetic fallback. Run before packaging the game.
import { readFile, writeFile } from 'node:fs/promises';
const query = 'https://osdr.nasa.gov/osdr/data/search?term=plant%20growth&type=cgene&size=3';
// Optional local raw response supports networks that require a separate download.
const response = process.argv[2] ? JSON.parse(await readFile(process.argv[2], 'utf8')) : await (async () => {
  const result = await fetch(query, { signal: AbortSignal.timeout(30000) });
  if (!result.ok) throw new Error(`NASA OSDR HTTP ${result.status}`);
  return result.json();
})();
const studies = response.hits?.hits?.map(({ _source: s }) => ({
  id: s.Accession, title: s['Study Title'], organism: s.organism,
  mission: s.Mission?.Name, url: `https://osdr.nasa.gov/bio/repo/data/studies/${s.Accession}`,
}));
if (!studies?.length || studies.some(s => !/^OSD-\d+$/.test(s.id) || !s.title)) throw new Error('Invalid or empty OSDR result; existing data preserved.');
await writeFile(new URL('../src/data/osdrPlants.json', import.meta.url), JSON.stringify({ source: 'NASA Open Science Data Repository', query, retrieved: new Date().toISOString(), studies }, null, 2) + '\n');
console.log(`Downloaded ${studies.length} real OSDR studies.`);
