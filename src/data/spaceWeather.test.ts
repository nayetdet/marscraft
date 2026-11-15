// @ts-nocheck
import { describe, expect, it, vi } from 'vitest';
import { EMBEDDED_SPACE_WEATHER, donkiUrl, loadSpaceWeather, readCache } from './spaceWeather.ts';
import { SPACE_WEATHER_CONFIG } from '../config/constants.ts';
import cmeSample from '../../docs/data/samples/donki-cme-2026-11-sample.json';
import notificationSample from '../../docs/data/samples/donki-notifications-2026-11-07_13.json';
import donki from './donkiCme.json';

// Respostas reais do DONKI salvas em docs/data/samples: a 2a CME vai para Marte, a 1a nao
const [cmeToElsewhere, cmeToMars] = cmeSample.items;
const SEP = {
  sepID: '2025-11-15T03:42:00-SEP-001',
  eventTime: '2025-11-15T03:42Z',
  instruments: [{ displayName: 'STEREO A: IMPACT 13-100 MeV' }],
  link: 'https://ccmc.gsfc.nasa.gov/DONKI/view/SEP/42742/-1',
};
const NOW = Date.parse('2026-11-14T15:05:00Z');

// Resposta HTTP minima: o modulo so usa `status` e `text()`
const reply = (status, body) => ({ status, text: async () => body });
const json = (data) => reply(200, JSON.stringify(data));

// fetch simulado: responde por tipo do DONKI (CME, SEP ou notifications)
function mockFetch({ cme = json([cmeToElsewhere, cmeToMars]), sep = json([SEP]), notifications = json(notificationSample.items) } = {}) {
  return vi.fn(async (url) => {
    const pick = url.includes('/CME?') ? cme : url.includes('/SEP?') ? sep : notifications;
    if (pick instanceof Error) throw pick;
    return typeof pick === 'function' ? pick(url) : pick;
  });
}

function memoryStorage(initial = {}) {
  const data = { ...initial };
  return {
    data,
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => { data[key] = String(value); },
  };
}

const load = (options = {}) => loadSpaceWeather({ storage: memoryStorage(), now: () => NOW, apiKey: 'TEST_KEY', timeoutMs: 50, ...options });

describe('loadSpaceWeather: live NASA DONKI with embedded fallback (issue #100)', () => {
  it('uses the CMEs fetched now, in the same format as the embedded JSON', async () => {
    const fetchImpl = mockFetch();
    const result = await load({ fetchImpl });
    expect(result.live).toBe(true);
    expect(result.fetchedAt).toBe(new Date(NOW).toISOString());
    expect(result.cmes).toHaveLength(1);
    expect(Object.keys(result.cmes[0]).sort()).toEqual(Object.keys(donki.cmes[0]).sort());
    expect(result.cmes[0]).toMatchObject({ id: '2026-11-01T19:00:00-CME-001', headedToMars: true, marsArrivalTime: '2026-11-07T06:00Z', isGlancingBlow: true });
    expect(result.seps).toEqual([{ id: SEP.sepID, eventTime: SEP.eventTime, seenBy: ['STEREO A'], link: SEP.link }]);
    expect(result.bulletin).toMatchObject({ type: expect.any(String), url: expect.stringMatching(/^https:\/\/ccmc\.gsfc\.nasa\.gov\//) });
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it('asks the API with the key and windows the API accepts (60 days at most)', async () => {
    const fetchImpl = mockFetch();
    await load({ fetchImpl });
    const urls = fetchImpl.mock.calls.map(([url]) => url);
    for (const url of urls) {
      expect(url).toMatch(/^https:\/\/api\.nasa\.gov\/DONKI\//);
      expect(url).toContain('api_key=TEST_KEY');
      expect(url).toContain('endDate=2026-11-14');
    }
    expect(urls.find((u) => u.includes('/CME?'))).toContain(`startDate=2026-10-15`);
    expect(urls.find((u) => u.includes('/notifications?'))).toContain('type=all');
    expect(SPACE_WEATHER_CONFIG.SEP_WINDOW_DAYS).toBeLessThanOrEqual(60);
    expect(SPACE_WEATHER_CONFIG.CME_WINDOW_DAYS).toBeLessThanOrEqual(60);
  });

  it.each([
    ['an HTTP error', reply(500, 'Internal Server Error')],
    ['the rate limit (429)', reply(429, '{"error":{"code":"OVER_RATE_LIMIT"}}')],
    ['a window the API refuses (400, plain text)', reply(400, 'API Error: Date range cannot exceed 60 days.')],
    ['an empty body', reply(200, '')],
    ['invalid JSON', reply(200, '[{"activityID":')],
    ['JSON that is not a list', json({ error: 'nope' })],
    ['no CME headed to Mars', json([cmeToElsewhere])],
    ['no network', new TypeError('Failed to fetch')],
  ])('falls back to the embedded data on %s, and never says live', async (_, cme) => {
    const storage = memoryStorage();
    const result = await load({ fetchImpl: mockFetch({ cme }), storage });
    expect(result).toBe(EMBEDDED_SPACE_WEATHER);
    expect(result.live).toBe(false);
    expect(result.cmes).toBe(donki.cmes);
    expect(Object.keys(storage.data)).toEqual([]); // falha nao vai para o cache
  });

  it('gives up after the time limit and uses the embedded data', async () => {
    const hanging = vi.fn((url, { signal }) => new Promise((_, reject) => {
      signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
    }));
    const started = Date.now();
    const result = await load({ fetchImpl: hanging, timeoutMs: 30 });
    expect(result.live).toBe(false);
    expect(Date.now() - started).toBeLessThan(2000);
    expect(SPACE_WEATHER_CONFIG.FETCH_TIMEOUT_MS).toBe(5000);
  });

  it('stays live with the CMEs when only the SEP or the bulletin request fails', async () => {
    const result = await load({ fetchImpl: mockFetch({ sep: reply(503, ''), notifications: new TypeError('Failed to fetch') }) });
    expect(result.live).toBe(true);
    expect(result.seps).toEqual([]); // sem SEP ao vivo, o jogo nao inventa uma
    expect(result.bulletin).toBeNull();
  });

  it('reads an empty SEP answer (200 with no body) as no SEP', async () => {
    const result = await load({ fetchImpl: mockFetch({ sep: reply(200, '') }) });
    expect(result.live).toBe(true);
    expect(result.seps).toEqual([]);
  });

  it('does not call the API again while the cache is valid', async () => {
    const storage = memoryStorage();
    const first = await load({ fetchImpl: mockFetch(), storage });
    const again = mockFetch();
    const later = NOW + (SPACE_WEATHER_CONFIG.CACHE_TTL_MINUTES - 1) * 60 * 1000;
    const second = await load({ fetchImpl: again, storage, now: () => later });
    expect(again).not.toHaveBeenCalled();
    expect(second).toEqual(first);
    expect(second.live).toBe(true);
    expect(second.fetchedAt).toBe(first.fetchedAt); // o rotulo mostra a hora do fetch de verdade
  });

  it('calls the API again when the cache is old', async () => {
    const storage = memoryStorage();
    await load({ fetchImpl: mockFetch(), storage });
    const again = mockFetch();
    const later = NOW + (SPACE_WEATHER_CONFIG.CACHE_TTL_MINUTES + 1) * 60 * 1000;
    const second = await load({ fetchImpl: again, storage, now: () => later });
    expect(again).toHaveBeenCalledTimes(3);
    expect(second.fetchedAt).toBe(new Date(later).toISOString());
  });

  it('falls back to the embedded data when the cache is old and the API fails', async () => {
    const storage = memoryStorage();
    await load({ fetchImpl: mockFetch(), storage });
    const later = NOW + (SPACE_WEATHER_CONFIG.CACHE_TTL_MINUTES + 1) * 60 * 1000;
    const second = await load({ fetchImpl: mockFetch({ cme: reply(429, '') }), storage, now: () => later });
    expect(second).toBe(EMBEDDED_SPACE_WEATHER);
  });

  it('ignores a broken cache and works without localStorage', async () => {
    expect(readCache(memoryStorage({ 'marscraft.spaceWeather.v1': '{not json' }), NOW)).toBeNull();
    const throwing = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } };
    expect((await load({ fetchImpl: mockFetch(), storage: throwing })).live).toBe(true);
    expect((await load({ fetchImpl: mockFetch(), storage: null })).live).toBe(true);
  });

  it('uses the embedded data when the browser has no fetch', async () => {
    expect(await load({ fetchImpl: null })).toBe(EMBEDDED_SPACE_WEATHER);
  });

  it('builds the DONKI address with dates in UTC', () => {
    expect(donkiUrl('SEP', 60, NOW, 'K')).toBe('https://api.nasa.gov/DONKI/SEP?startDate=2026-09-15&endDate=2026-11-14&api_key=K');
  });
});

describe('EMBEDDED_SPACE_WEATHER', () => {
  it('is the saved DONKI data, never marked live, with no invented SEP', () => {
    expect(EMBEDDED_SPACE_WEATHER).toMatchObject({ live: false, fetchedAt: donki.fetched, cmes: donki.cmes, seps: [], bulletin: null });
  });
});
