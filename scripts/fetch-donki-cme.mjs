// Baixa as CMEs reais do NASA DONKI e grava em src/data/donkiCme.json as que tinham impacto
// previsto em Marte, com a chegada prevista pelo modelo WSA-ENLIL da NASA (issue #99).
// Uso: node scripts/fetch-donki-cme.mjs [startDate] [endDate]  (datas YYYY-MM-DD)
// Chave: NASA_API_KEY no ambiente, ou DEMO_KEY (limite baixo de requisições).
import { writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const DAY_MS = 24 * 3600 * 1000;
// A API responde melhor em janelas curtas: uma requisição por bloco de 30 dias
const CHUNK_DAYS = 30;

const isoDay = (date) => date.toISOString().slice(0, 10);

// Impacto previsto em Marte para uma CME: a rodada mais recente do WSA-ENLIL que lista Marte,
// de preferência na análise marcada como a mais precisa. Devolve null se a CME não ia para Marte.
export function marsImpact(item) {
  const analyses = item.cmeAnalyses ?? [];
  const ordered = [...analyses].sort((a, b) => Number(Boolean(b.isMostAccurate)) - Number(Boolean(a.isMostAccurate)));
  for (const analysis of ordered) {
    const runs = [...(analysis.enlilList ?? [])].sort((a, b) =>
      String(b.modelCompletionTime ?? '').localeCompare(String(a.modelCompletionTime ?? '')));
    for (const run of runs) {
      const impact = (run.impactList ?? []).find((i) => i.location === 'Mars' && i.arrivalTime);
      if (impact) return { analysis, impact };
    }
  }
  return null;
}

// Resumo que o jogo usa: só CMEs com chegada prevista em Marte depois da saída do Sol
export function summarizeCme(item) {
  const hit = marsImpact(item);
  if (!hit?.analysis.speed) return null;
  if (Date.parse(hit.impact.arrivalTime) <= Date.parse(item.startTime)) return null;
  return {
    id: item.activityID,
    startTime: item.startTime,
    speedKmS: hit.analysis.speed,
    type: hit.analysis.type,
    headedToMars: true,
    marsArrivalTime: hit.impact.arrivalTime,
    isGlancingBlow: Boolean(hit.impact.isGlancingBlow),
    link: item.link,
  };
}

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
  const apiKey = process.env.NASA_API_KEY ?? 'DEMO_KEY';

  const items = await fetchRange(startDate, endDate, apiKey);
  const unique = [...new Map(items.map((item) => [item.activityID, item])).values()];
  const cmes = unique
    .map(summarizeCme)
    .filter(Boolean)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

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
