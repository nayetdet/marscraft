// Baixa as CMEs reais do NASA DONKI e grava um resumo em src/data/donkiCme.json.
// Uso: node scripts/fetch-donki-cme.mjs [startDate] [endDate]  (datas YYYY-MM-DD)
// Chave: NASA_API_KEY no ambiente, ou DEMO_KEY (limite baixo de requisições).
import { writeFile } from 'node:fs/promises';

const startDate = process.argv[2] ?? '2026-11-01';
const endDate = process.argv[3] ?? '2026-11-13';
const apiKey = process.env.NASA_API_KEY ?? 'DEMO_KEY';
const query = `https://api.nasa.gov/DONKI/CME?startDate=${startDate}&endDate=${endDate}`;

const response = await fetch(`${query}&api_key=${apiKey}`);
if (!response.ok) throw new Error(`DONKI respondeu ${response.status}`);
const items = await response.json();

const cmes = items
  .map((item) => {
    const analyses = item.cmeAnalyses ?? [];
    const analysis = analyses.find((a) => a.isMostAccurate) ?? analyses[0];
    if (!analysis?.speed) return null;
    const impacts = (analysis.enlilList ?? []).flatMap((e) => e.impactList ?? []);
    return {
      id: item.activityID,
      startTime: item.startTime,
      speedKmS: analysis.speed,
      type: analysis.type,
      headedToMars: impacts.some((i) => i.location === 'Mars'),
    };
  })
  .filter(Boolean)
  .sort((a, b) => a.startTime.localeCompare(b.startTime));

const output = {
  source: 'NASA DONKI (Space Weather Database Of Notifications, Knowledge, Information)',
  query,
  fetched: new Date().toISOString().slice(0, 10),
  count: cmes.length,
  cmes,
};

await writeFile(new URL('../src/data/donkiCme.json', import.meta.url), `${JSON.stringify(output, null, 2)}\n`);
console.log(`Gravadas ${cmes.length} CMEs (${startDate} a ${endDate}).`);
