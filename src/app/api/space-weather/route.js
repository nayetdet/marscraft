import { SPACE_WEATHER_CONFIG } from '../../../config/constants.js';
import { latestBulletin, summarizeCmes, summarizeSeps } from '../../../data/donkiNormalize.js';

const API_BASE = 'https://api.nasa.gov/DONKI';
const DAY_MS = 24 * 60 * 60 * 1000;
const isoDay = (ms) => new Date(ms).toISOString().slice(0, 10);

function donkiUrl(type, days, nowMs, apiKey, extra = '') {
  return `${API_BASE}/${type}?startDate=${isoDay(nowMs - days * DAY_MS)}&endDate=${isoDay(nowMs)}${extra}&api_key=${encodeURIComponent(apiKey)}`;
}

async function fetchList(url) {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`DONKI HTTP ${response.status}`);
  const text = await response.text();
  if (!text.trim()) return [];
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
      optional(fetchList(donkiUrl('SEP', config.SEP_WINDOW_DAYS, nowMs, apiKey))),
      optional(fetchList(donkiUrl('notifications', config.BULLETIN_WINDOW_DAYS, nowMs, apiKey, '&type=all'))),
    ]);
    const cmes = summarizeCmes(cmeItems);
    if (!cmes.length) return Response.json({ error: 'No CMEs headed to Mars' }, { status: 404 });
    return Response.json({
      live: true,
      fetchedAt: new Date(nowMs).toISOString(),
      cmes,
      seps: summarizeSeps(sepItems),
      bulletin: latestBulletin(notificationItems),
    }, { headers: { 'Cache-Control': 'private, max-age=300' } });
  } catch (error) {
    console.info('NASA DONKI live data unavailable:', error?.message ?? error);
    return Response.json({ error: 'NASA DONKI is unavailable' }, { status: 503 });
  }
}
