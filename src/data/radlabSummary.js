import summary from './radlabSummary.json';

// Resumo real do NASA RadLab (issue #106): mediana da taxa de dose em 4 lugares, gerado por
// scripts/fetch-radlab-summary.mjs. A API nao diz a unidade (provavelmente uGy/h), entao a tela
// so mostra comparacoes ("Mars: about 1.5 times the Space Station").

export const RADLAB_RETRIEVED = summary.retrieved;
export const RADLAB_PORTAL = summary.portal;

// Ordem das barras: do mais protegido ao menos protegido
const BAR_ORDER = ['iss', 'mars', 'moon', 'orion'];

export function radlabSeries(id) {
  const series = summary.series.find((s) => s.id === id);
  if (!series) throw new Error(`RadLab series "${id}" missing from radlabSummary.json`);
  return series;
}

// Mediana medida pelo Curiosity (MSL-RAD) na cratera Gale: a dose normal do jogo
export function marsSurfaceMedian() {
  return radlabSeries('mars').median;
}

// Quantas vezes a dose da Estacao Espacial, com 1 casa decimal
export function timesStation(id) {
  return Math.round((radlabSeries(id).median / radlabSeries('iss').median) * 10) / 10;
}

// Barras do grafico: largura em % da maior mediana
export function radlabBars() {
  const bars = BAR_ORDER.map(radlabSeries);
  const max = Math.max(...bars.map((s) => s.median));
  return bars.map((s) => ({
    id: s.id,
    label: s.label,
    place: s.place,
    instrument: s.instrument,
    median: s.median,
    times: timesStation(s.id),
    widthPct: Math.round((s.median / max) * 100),
    window: s.firstTimestamp.slice(0, 10) === s.lastTimestamp.slice(0, 10)
      ? s.firstTimestamp.slice(0, 10)
      : `${s.firstTimestamp.slice(0, 10)} to ${s.lastTimestamp.slice(0, 10)}`,
  }));
}

export function marsVsStationText() {
  return `Mars: about ${timesStation('mars')} times the Space Station`;
}
