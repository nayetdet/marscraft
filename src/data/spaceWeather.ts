// @ts-nocheck
// Clima espacial do NASA DONKI. O navegador so chama nossa rota /api/space-weather;
// a chave NASA_API_KEY e usada exclusivamente no servidor Next.js. Qualquer falha cai no
// JSON embutido, e entao nada no jogo diz "LIVE".
// Chamado uma vez em main.js, antes do primeiro Play. Nunca dentro do loop do jogo.
import donkiCme from './donkiCme.json';
import { SPACE_WEATHER_CONFIG } from '../config/constants.ts';
import { latestBulletin, summarizeCmes, summarizeSeps } from './donkiNormalize.ts';

const API_BASE = 'https://api.nasa.gov/DONKI';
const SPACE_WEATHER_ENDPOINT = '/api/space-weather';
const CACHE_KEY = 'marscraft.spaceWeather.v1';
const DAY_MS = 24 * 3600 * 1000;

// Dado embutido (gravado por scripts/fetch-donki-cme.ts): "real data from DD/MM/AAAA"
export const EMBEDDED_SPACE_WEATHER = Object.freeze({
  live: false,
  fetchedAt: donkiCme.fetched,
  cmes: donkiCme.cmes,
  seps: [],
  bulletin: null,
});

const isoDay = (ms) => new Date(ms).toISOString().slice(0, 10);

// Endereco de um tipo do DONKI para os ultimos `days` dias (a API usa datas em UTC)
export function donkiUrl(type, days, nowMs, apiKey, extra = '') {
  return `${API_BASE}/${type}?startDate=${isoDay(nowMs - days * DAY_MS)}&endDate=${isoDay(nowMs)}${extra}&api_key=${encodeURIComponent(apiKey)}`;
}

// Le uma lista JSON do DONKI. Sem resultados a API devolve 200 com corpo vazio: vira [].
// Erros (HTTP, JSON invalido, tempo esgotado) sobem como excecao.
async function fetchList(fetchImpl, url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(url, { signal: controller.signal });
    if (response.status !== 200) throw new Error(`DONKI HTTP ${response.status}`);
    const text = await response.text();
    if (!text.trim()) return [];
    const data = JSON.parse(text);
    if (!Array.isArray(data)) throw new Error('DONKI answer is not a list');
    return data;
  } finally {
    clearTimeout(timer);
  }
}

// localStorage pode nao existir ou jogar excecao (aba anonima, testes)
function defaultStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

// Cache valido: so guardamos resultado ao vivo, e ele vale por CACHE_TTL_MINUTES depois do fetch
export function readCache(storage, nowMs, ttlMinutes = SPACE_WEATHER_CONFIG.CACHE_TTL_MINUTES) {
  try {
    const raw = storage?.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    const age = nowMs - Date.parse(cached.fetchedAt);
    if (!(age >= 0 && age < ttlMinutes * 60 * 1000)) return null;
    if (!Array.isArray(cached.cmes) || cached.cmes.length === 0) return null;
    return { live: true, fetchedAt: cached.fetchedAt, cmes: cached.cmes, seps: cached.seps ?? [], bulletin: cached.bulletin ?? null };
  } catch {
    return null;
  }
}

function writeCache(storage, value) {
  try {
    storage?.setItem(CACHE_KEY, JSON.stringify(value));
  } catch {
    // Sem espaco ou sem permissao: so perdemos o cache
  }
}

// Busca o clima espacial ao vivo. Devolve sempre um objeto pronto para o jogo:
// { live, fetchedAt, cmes, seps, bulletin }. Nunca rejeita.
export async function loadSpaceWeather({
  fetchImpl = globalThis.fetch?.bind(globalThis),
  storage = defaultStorage(),
  now = () => Date.now(),
  // `apiKey` so existe para os testes unitarios da normalizacao do DONKI. O jogo nunca o passa.
  apiKey,
  timeoutMs = SPACE_WEATHER_CONFIG.FETCH_TIMEOUT_MS,
} = {}) {
  const nowMs = now();
  const cached = readCache(storage, nowMs);
  if (cached) return cached;
  if (typeof fetchImpl !== 'function') return EMBEDDED_SPACE_WEATHER;

  try {
    // Caminho normal do cliente: uma unica chamada same-origin, sem chave no bundle nem na URL.
    if (!apiKey) {
      const response = await fetchImpl(SPACE_WEATHER_ENDPOINT);
      if (response.status !== 200) throw new Error(`Space weather HTTP ${response.status}`);
      const result = await response.json();
      if (!Array.isArray(result.cmes) || result.cmes.length === 0) throw new Error('Invalid space weather response');
      writeCache(storage, result);
      return result;
    }

    const W = SPACE_WEATHER_CONFIG;
  // SEP e boletim sao extras: se falharem, a partida segue so com as CMEs ao vivo
  const optional = (promise) => promise.catch(() => []);
    const [cmeItems, sepItems, notificationItems] = await Promise.all([
      fetchList(fetchImpl, donkiUrl('CME', W.CME_WINDOW_DAYS, nowMs, apiKey), timeoutMs),
      optional(fetchList(fetchImpl, donkiUrl('SEP', W.SEP_WINDOW_DAYS, nowMs, apiKey), timeoutMs)),
      optional(fetchList(fetchImpl, donkiUrl('notifications', W.BULLETIN_WINDOW_DAYS, nowMs, apiKey, '&type=all'), timeoutMs)),
    ]);
    const cmes = summarizeCmes(cmeItems);
    // O Sol pode passar dias sem mandar nada para Marte: sem tempestade ao vivo, usa o embutido
    if (cmes.length === 0) return EMBEDDED_SPACE_WEATHER;
    const result = {
      live: true,
      fetchedAt: new Date(nowMs).toISOString(),
      cmes,
      seps: summarizeSeps(sepItems),
      bulletin: latestBulletin(notificationItems),
    };
    writeCache(storage, result);
    return result;
  } catch (error) {
    console.info('NASA DONKI live data unavailable, using the data saved in the game:', error?.message ?? error);
    return EMBEDDED_SPACE_WEATHER;
  }
}
