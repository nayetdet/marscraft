// @ts-nocheck
import { SPACE_WEATHER_CONFIG } from '../../../config/constants.ts';
import { latestBulletin, summarizeCmes, summarizeSeps } from '../../../data/donkiNormalize.ts';

const API_BASE = 'https://api.nasa.gov/DONKI';
const DAY_MS = 24 * 60 * 60 * 1000;
const isoDay = (ms) => new Date(ms).toISOString().slice(0, 10);

function donkiUrl(type, days, nowMs, apiKey, extra = '') {
  return `${API_BASE}/${type}?startDate=${isoDay(nowMs - days * DAY_MS)}&endDate=${isoDay(nowMs)}${extra}&api_key=${encodeURIComponent(apiKey)}`;
}

async function fetchList(url, allowEmptyBody = false) {
  const response = await fetch(url, {
    cache: 'no-store',
    signal: AbortSignal.timeout(SPACE_WEATHER_CONFIG.FETCH_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`DONKI HTTP ${response.status}`);
  const text = await response.text();
  if (!text.trim()) {
    if (allowEmptyBody) return [];
    throw new Error('DONKI returned an empty body');
  }
  const data = JSON.parse(text);
  if (!Array.isArray(data)) throw new Error('DONKI answer is not a list');
  return data;
}

export async function GET() {
  const apiKey = process.env.NASA_API_KEY || 'DEMO_KEY';
  const nowMs = Date.now();
  const config = SPACE_WEATHER_CONFIG;
  try {
    const optional = (promise) => promise.catch(() => []);
    const [cmeItems, sepItems, notificationItems] = await Promise.all([
      fetchList(donkiUrl('CME', config.CME_WINDOW_DAYS, nowMs, apiKey)),
      optional(fetchList(donkiUrl('SEP', config.SEP_WINDOW_DAYS, nowMs, apiKey), true)),
      optional(fetchList(donkiUrl('notifications', config.BULLETIN_WINDOW_DAYS, nowMs, apiKey, '&type=all'), true)),
    ]);
    // Sem CME prevista para Marte, `cmes: []` e um resultado ao vivo valido: quer dizer calmaria.
    // A tempestade programada do tutorial usa o snapshot local e nao depende deste resultado.
    const cmes = summarizeCmes(cmeItems);
    return Response.json({
      live: true,
      fetchedAt: new Date(nowMs).toISOString(),
      cmes,
      seps: summarizeSeps(sepItems),
      bulletin: latestBulletin(notificationItems),
    }, {
      // Dado publico: a CDN guarda por LIVE_POLL_MINUTES, entao o polling de todos os jogadores
      // faz no maximo 3 pedidos ao DONKI por intervalo (a chave aguenta 1000 por hora)
      headers: { 'Cache-Control': `public, max-age=60, s-maxage=${config.LIVE_POLL_MINUTES * 60}, stale-while-revalidate=${config.LIVE_POLL_MINUTES * 60}` },
    });
  } catch (error) {
    console.info('NASA DONKI live data unavailable:', error?.message ?? error);
    return Response.json({ error: 'NASA DONKI is unavailable' }, { status: 503 });
  }
}
