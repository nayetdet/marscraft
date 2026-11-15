// Baixa as CMEs reais do NASA DONKI e grava em src/data/donkiCme.json as que tinham impacto
// previsto em Marte, com a chegada prevista pelo modelo WSA-ENLIL da NASA (issue #99).
// Uso: npm run fetch:donki -- [startDate] [endDate]  (datas YYYY-MM-DD)
// Chave: NASA_API_KEY no arquivo .env da raiz (copie de .env.example; o git ignora o .env),
// ou no ambiente. Sem chave usa DEMO_KEY, que estoura em ~10 requisicoes por hora.
import { existsSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { marsImpact, summarizeCme, summarizeCmes } from '../src/data/donkiNormalize.ts';

const DAY_MS = 24 * 3600 * 1000;
// A API responde melhor em janelas curtas: uma requisição por bloco de 30 dias
const CHUNK_DAYS = 30;

const isoDay = (date) => date.toISOString().slice(0, 10);

// marsImpact/summarizeCme moram em src/data/donkiNormalize.ts: o fetch ao vivo do jogo (#100)
// usa as mesmas funcoes, para o JSON embutido e o dado ao vivo terem o mesmo formato.
export { marsImpact, summarizeCme };

async function fetchRange(startDate, endDate, apiKey) {
  const items = [];
  const end = Date.parse(`${endDate}T00:00:00Z`);
  for (let from = Date.parse(`${startDate}T00:00:00Z`); from <= end; from += CHUNK_DAYS * DAY_MS) {
    const to = Math.min(end, from + (CHUNK_DAYS - 1) * DAY_MS);
    const url = `https://api.nasa.gov/DONKI/CME?startDate=${isoDay(new Date(from))}&endDate=${isoDay(new Date(to))}`;
    const response = await fetch(`${url}&api_key=${apiKey}`);
    if (!response.ok) throw new Error(`DONKI respondeu ${response.status} para ${url}`);
    const chunk = await response.json();
    items.push(...(Array.isArray(chunk) ? chunk : []));
    console.log(`${isoDay(new Date(from))} a ${isoDay(new Date(to))}: ${Array.isArray(chunk) ? chunk.length : 0} CMEs`);
  }
  return items;
}

async function main() {
  // Padrão: os 12 meses antes da coleta embutida no jogo
  const startDate = process.argv[2] ?? '2025-11-14';
  const endDate = process.argv[3] ?? '2026-11-13';
  // Variaveis ja definidas no ambiente tem prioridade sobre o .env
  const envFile = new URL('../.env', import.meta.url);
  if (existsSync(envFile)) process.loadEnvFile(envFile);
  const apiKey = process.env.NASA_API_KEY || 'DEMO_KEY';
  if (apiKey === 'DEMO_KEY') console.warn('Sem NASA_API_KEY no .env: usando DEMO_KEY (limite de ~10 requisicoes por hora).');

  const items = await fetchRange(startDate, endDate, apiKey);
  const unique = [...new Map(items.map((item) => [item.activityID, item])).values()];
  const cmes = summarizeCmes(unique);

  const output = {
    source: 'NASA DONKI (Space Weather Database Of Notifications, Knowledge, Information)',
    query: `https://api.nasa.gov/DONKI/CME?startDate=${startDate}&endDate=${endDate}`,
    note: 'Only CMEs with a predicted impact at Mars (WSA-ENLIL model). marsArrivalTime is the predicted arrival.',
    fetched: new Date().toISOString().slice(0, 10),
    totalCmes: unique.length,
    count: cmes.length,
    cmes,
  };

  await writeFile(new URL('../src/data/donkiCme.json', import.meta.url), `${JSON.stringify(output, null, 2)}\n`);
  console.log(`${unique.length} CMEs de ${startDate} a ${endDate}; ${cmes.length} com impacto previsto em Marte gravadas.`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) await main();
