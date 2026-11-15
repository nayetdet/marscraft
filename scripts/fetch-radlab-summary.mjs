// Refaz as consultas do NASA RadLab (OSDR) de docs/data/samples/radlab-dose-rate-summary.json e
// grava o resumo em src/data/radlabSummary.json (issue #106): mediana da taxa de dose absorvida em
// 4 lugares, com a janela de datas e a data de coleta. O RadLab nao libera CORS: o jogo so usa o
// arquivo embutido. Uso: node scripts/fetch-radlab-summary.mjs
// Sem numeros inventados: qualquer falha de rede ou serie vazia interrompe o script.
// A resposta nao traz a unidade (provavelmente uGy/h, ver docs/data/apis-nasa.md): o jogo mostra
// so a comparacao entre os lugares.
import { writeFile } from 'node:fs/promises';

const API = 'https://visualization.osdr.nasa.gov/radlab/api/';
// Mesmas janelas da amostra coletada em 14/11/2026 (docs/data/numeros-reais.md)
const SERIES = [
  { id: 'iss', label: 'Space Station', place: 'Low Earth orbit', instrument: 'ISS DOSTEL1', filter: 'spacecraft=ISS&instrument=DOSTEL1&timestamp>=2023-01-01&timestamp<2023-01-02' },
  { id: 'mars', label: 'Mars surface', place: 'Gale Crater, Mars', instrument: 'Curiosity MSL-RAD', filter: 'spacecraft=Curiosity&timestamp>=2022-11-16&timestamp<2022-12-11' },
  { id: 'moon', label: 'Moon orbit', place: 'Orbit around the Moon', instrument: 'LRO CRaTER', filter: 'spacecraft=LRO&timestamp>=2022-11-16&timestamp<2022-11-18' },
  { id: 'orion', label: 'Earth-Moon trip', place: 'Artemis I, Earth to Moon and back', instrument: 'Orion HERA-HSU1', filter: 'spacecraft=Orion&instrument=HERA-HSU1&timestamp>=2022-11-16&timestamp<2022-12-11' },
];

const round3 = (x) => Math.round(x * 1000) / 1000;

// Percentil com interpolacao linear (o mesmo padrao do numpy)
export function percentile(sorted, p) {
  const pos = (sorted.length - 1) * p;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

async function fetchSeries(series) {
  const query = `${API}?${series.filter}&absorbed_dose_rate&format=json`;
  const response = await fetch(query, { signal: AbortSignal.timeout(120000) });
  if (!response.ok) throw new Error(`NASA RadLab HTTP ${response.status} for ${series.id}`);
  const json = await response.json();
  const col = json.columns?.indexOf('absorbed_dose_rate');
  const tsCol = json.columns?.indexOf('timestamp');
  if (col == null || col < 0 || tsCol < 0) throw new Error(`Unexpected RadLab columns for ${series.id}`);
  const rows = (json.data ?? []).filter((r) => Number.isFinite(r[col]));
  if (!rows.length) throw new Error(`Empty RadLab series for ${series.id}; existing data preserved.`);
  const values = rows.map((r) => r[col]).sort((a, b) => a - b);
  const stamps = rows.map((r) => r[tsCol]).sort();
  const { filter, ...meta } = series;
  return {
    ...meta,
    query,
    n: values.length,
    firstTimestamp: stamps[0],
    lastTimestamp: stamps[stamps.length - 1],
    median: round3(percentile(values, 0.5)),
    mean: round3(values.reduce((s, v) => s + v, 0) / values.length),
    p10: round3(percentile(values, 0.1)),
    p90: round3(percentile(values, 0.9)),
    max: round3(values[values.length - 1]),
  };
}

const series = [];
for (const s of SERIES) series.push(await fetchSeries(s));

const out = {
  source: 'NASA OSDR RadLab',
  portal: 'https://visualization.osdr.nasa.gov/radlab/',
  retrieved: new Date().toISOString(),
  field: 'absorbed_dose_rate',
  unitNote: 'The API response has no unit (probably uGy/h, see docs/data/apis-nasa.md). The game only shows comparisons.',
  series,
};
await writeFile(new URL('../src/data/radlabSummary.json', import.meta.url), JSON.stringify(out, null, 2) + '\n');
console.log(series.map((s) => `${s.id}: median ${s.median} (n=${s.n})`).join('\n'));
