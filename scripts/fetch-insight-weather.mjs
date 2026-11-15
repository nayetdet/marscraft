// Baixa o clima real do InSight (NASA InSight Mars Weather Service API) e grava em
// src/data/insightWeather.json so os campos que o jogo usa (issue #108).
// Uso: node scripts/fetch-insight-weather.mjs
// Chave: NASA_API_KEY no arquivo .env da raiz (o git ignora o .env), ou no ambiente.
// Sem chave usa DEMO_KEY. A chave nunca vai para o JSON: o campo `query` guarda a URL sem ela.
// O feed esta arquivado: o InSight encerrou em 2022 e a API devolve sempre os mesmos 7 sols
// (19 a 25/10/2020, Elysium Planitia).
import { existsSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const QUERY = 'https://api.nasa.gov/insight_weather/?feedtype=json&ver=1.0';

const round1 = (value) => Math.round(value * 10) / 10;

// Um sol do feed -> o resumo que o jogo usa. Devolve null se faltar temperatura ou vento.
export function summarizeSol(sol, raw) {
  const at = raw?.AT;
  const wind = raw?.HWS;
  if (!at || !wind || !Number.isFinite(at.mn) || !Number.isFinite(at.mx)) return null;
  return {
    sol: Number(sol),
    firstUtc: raw.First_UTC,
    season: raw.Season,
    tempC: { min: round1(at.mn), avg: round1(at.av), max: round1(at.mx) },
    pressurePa: raw.PRE ? { min: round1(raw.PRE.mn), avg: round1(raw.PRE.av), max: round1(raw.PRE.mx) } : null,
    windMs: { avg: round1(wind.av), gust: round1(wind.mx) },
  };
}

export function summarizeFeed(feed) {
  return (feed.sol_keys ?? [])
    .map((sol) => summarizeSol(sol, feed[sol]))
    .filter(Boolean)
    .sort((a, b) => a.sol - b.sol);
}

async function main() {
  const envFile = new URL('../.env', import.meta.url);
  if (existsSync(envFile)) process.loadEnvFile(envFile);
  const apiKey = process.env.NASA_API_KEY || 'DEMO_KEY';
  if (apiKey === 'DEMO_KEY') console.warn('Sem NASA_API_KEY no .env: usando DEMO_KEY.');

  const response = await fetch(`${QUERY}&api_key=${apiKey}`);
  if (!response.ok) throw new Error(`InSight Weather respondeu ${response.status}`);
  const sols = summarizeFeed(await response.json());
  if (sols.length === 0) throw new Error('InSight Weather nao trouxe nenhum sol com temperatura e vento.');

  const output = {
    source: 'NASA InSight Mars Weather Service API (InSight lander, Elysium Planitia)',
    query: QUERY,
    note: 'Archived feed: InSight ended in 2022. tempC = air temperature (C), pressurePa = pressure (Pa), windMs.gust = strongest wind of the sol (m/s).',
    fetched: new Date().toISOString().slice(0, 10),
    sols,
  };
  await writeFile(new URL('../src/data/insightWeather.json', import.meta.url), `${JSON.stringify(output, null, 2)}\n`);
  console.log(`${sols.length} sols gravados (${sols[0].sol} a ${sols.at(-1).sol}).`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) await main();
