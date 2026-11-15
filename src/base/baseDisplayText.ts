// @ts-nocheck
import { RADIATION_CONFIG } from '../config/constants.ts';
import { dustStatus } from '../mission/weatherText.ts';

// Conteudo das telas vivas da base, calculado a partir do estado do jogo.
// Puro (sem Three.js nem DOM) para testar com Vitest; BaseDisplays.js so desenha o resultado.
// Cada modelo: { title, rows: [{ label, value, bar?, tone? }], footer, mode }.
// `mode`: 'ok' (verde), 'warn' (amarelo) ou 'alert' (vermelho). `bar` vai de 0 a 1.

const pad2 = (n) => String(n).padStart(2, '0');

export function formatClock(timeOfDay) {
  const hours = Math.floor(timeOfDay);
  const mins = Math.floor((timeOfDay - hours) * 60);
  return `${pad2(hours)}:${pad2(mins)}`;
}

export function formatRate(msvPerHour) {
  return `${msvPerHour.toFixed(msvPerHour < 1 ? 3 : 1)} mSv/h`;
}

// Horas de jogo -> "2 h 30 min"
export function formatSpan(hours) {
  const total = Math.max(0, Math.round(hours * 60));
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h > 0 ? `${h} h ${pad2(m)} min` : `${m} min`;
}

const ratio = (value, max) => (max > 0 ? Math.max(0, Math.min(1, value / max)) : 0);

function weatherValue(storm) {
  if (storm.phase === 'active') return `STORM NOW (${formatSpan(storm.hoursLeft)} LEFT)`;
  if (storm.phase === 'warning') return `STORM IN ${formatSpan(storm.hoursUntil)}`;
  return 'CALM';
}

function stormMode(storm) {
  if (storm.phase === 'active') return 'alert';
  return storm.phase === 'warning' ? 'warn' : 'ok';
}

const doseTone = (rate) => (rate >= RADIATION_CONFIG.HARM_THRESHOLD_MSV_PER_HOUR ? 'alert' : 'ok');

export function commandModel(s) {
  // `donkiCredit`: "NASA DONKI, real data from DD/MM/AAAA" ou "LIVE from NASA DONKI, fetched HH:MM" (#100)
  const credit = s.donkiCredit ?? `NASA DONKI, real data from ${s.donkiDate}`;
  const footer = s.storm.phase === 'calm' || !s.storm.speedKmS
    ? `Storm data: ${credit}`
    : `Real CME seen ${s.storm.date}: ${Math.round(s.storm.speedKmS)} km/s (${credit})`;
  return {
    title: 'BASE STATUS',
    rows: [
      { label: 'MARS TIME', value: `SOL ${s.sol}  ${formatClock(s.timeOfDay)}` },
      { label: 'BATTERY', value: `${Math.round(s.batteryPct)}%`, bar: s.batteryPct / 100, tone: s.batteryPct <= 20 ? 'alert' : 'ok' },
      { label: 'WATER TANK', value: `${Math.round(s.water)} L`, bar: ratio(s.water, s.maxWater), tone: 'water' },
      { label: 'RADIATION', value: formatRate(s.doseRate), tone: doseTone(s.doseRate) },
      { label: 'SPACE WEATHER', value: weatherValue(s.storm), tone: stormMode(s.storm) },
      ...marsWeatherRows(s),
    ],
    footer,
    mode: stormMode(s.storm),
  };
}

// Gerador de O2 (issue #102): modo escolhido e o que falta para ele trabalhar
function oxygenRow(s) {
  if (s.batteryPct <= 0 || s.oxygenBlocked === 'power') return { label: 'O2 MAKER', value: 'NO POWER', tone: 'alert' };
  if (s.oxygenBlocked === 'water') return { label: 'O2 MAKER', value: 'NO WATER', tone: 'alert' };
  return { label: 'O2 MAKER', value: s.oxygenMode === 'moxie' ? 'FROM MARS AIR' : 'FROM WATER', tone: 'ok' };
}

// Clima de Marte na tela do comando (issues #103 e #108): ar la fora (InSight) e poeira
function marsWeatherRows(s) {
  const rows = [];
  if (Number.isFinite(s.outsideC)) rows.push({ label: 'OUTSIDE', value: `${Math.round(s.outsideC)} C`, tone: 'water' });
  if (s.dust) {
    const dust = dustStatus(s.dust);
    rows.push({ label: 'MARS WEATHER', value: dust.value, tone: dust.tone });
  }
  return rows;
}

export function powerModel(s) {
  let fuel = 'OFF';
  if (s.factoryOn) fuel = s.factoryBusy ? 'MAKING FUEL' : 'WAITING FOR ICE';
  return {
    title: 'POWER MAP',
    rows: [
      { label: 'SUN IN', value: sunInValue(s), tone: s.chargeRate > 0 && !dustLow(s) ? 'ok' : 'warn' },
      ...(s.dust ? [{ label: 'PANEL DUST', value: `${Math.round(s.dust.panelDust * 100)}%`, bar: s.dust.panelDust, tone: s.dust.panelDust >= 0.5 ? 'alert' : 'warn' }] : []),
      { label: 'BATTERY', value: `${Math.round(s.batteryPct)}%`, bar: s.batteryPct / 100, tone: s.batteryPct <= 20 ? 'alert' : 'ok' },
      oxygenRow(s),
      { label: 'SHIELD', value: s.shieldOn ? 'ON' : 'OFF', tone: s.shieldOn ? 'warn' : 'ok' },
      { label: 'FUEL PLANT', value: fuel, tone: s.factoryBusy ? 'warn' : 'ok' },
      { label: 'GREENHOUSE', value: s.greenhousePowered ? 'LIGHTS ON' : 'NO POWER', tone: s.greenhousePowered ? 'ok' : 'alert' },
    ],
    footer: 'Mars gets 43% of the sunlight Earth gets',
    mode: s.batteryPct <= 20 ? 'alert' : 'ok',
  };
}

const dustLow = (s) => Boolean(s.dust) && (s.dust.phase === 'storm' || s.dust.panelDust >= 0.3);

// Geracao agora e, se caiu, o motivo (noite, tempestade de poeira, paineis sujos)
function sunInValue(s) {
  if (s.chargeRate <= 0) return 'NIGHT: 0';
  const rate = `+${s.chargeRate.toFixed(0)}%/h`;
  if (!dustLow(s)) return rate;
  return `${rate} ${s.dust.phase === 'storm' ? 'DUST STORM' : 'DUSTY PANELS'}`;
}

export function shelterModel(s) {
  let status = 'NO STORM';
  if (s.storm.phase === 'warning') status = 'STORM COMING';
  if (s.storm.phase === 'active') {
    // Parede vazia nao protege mais que o habitat: so e seguro se a dose aqui dentro nao machuca
    const safe = s.doseRate < RADIATION_CONFIG.HARM_THRESHOLD_MSV_PER_HOUR;
    status = !s.inShelter ? 'STAND HERE!' : safe ? 'YOU ARE SAFE HERE' : 'ADD WATER TO THE WALL!';
  }
  return {
    title: 'RADIATION METER',
    rows: [
      { label: 'YOU NOW', value: formatRate(s.doseRate), tone: doseTone(s.doseRate) },
      { label: 'YOUR TOTAL', value: `${s.totalDose.toFixed(1)} mSv` },
      { label: 'WATER WALL', value: `${Math.round(s.shelterWaterL)} L`, tone: s.shelterWaterL > 0 ? 'water' : 'warn' },
      { label: 'STATUS', value: status, tone: stormMode(s.storm) },
    ],
    footer: `mSv = radiation a body got. Career limit: ${RADIATION_CONFIG.CAREER_LIMIT_MSV} mSv`,
    mode: stormMode(s.storm),
  };
}

export function greenhouseModel(s) {
  return {
    title: 'GREENHOUSE',
    rows: [
      { label: 'GROW LIGHTS', value: s.greenhousePowered ? 'ON' : 'NO POWER', tone: s.greenhousePowered ? 'ok' : 'alert' },
      { label: 'WATER TANK', value: `${Math.round(s.water)} L`, bar: ratio(s.water, s.maxWater), tone: 'water' },
      { label: 'FIELDS', value: `${s.fields.planted}/${s.fields.total} PLANTED`, bar: ratio(s.fields.planted, s.fields.total) },
      { label: 'HARVEST', value: s.fields.ready ? `${s.fields.ready} READY` : 'NOTHING YET', tone: s.fields.ready ? 'warn' : undefined },
      { label: 'AIR', value: s.dusty ? 'DUSTY: CLEAN UP' : 'CLEAN', tone: s.dusty ? 'alert' : 'ok' },
    ],
    footer: 'Plants need light, water and power',
    mode: s.greenhousePowered && !s.dusty ? 'ok' : 'alert',
  };
}

// Chave barata para saber se a tela precisa ser redesenhada
export function modelKey(model) {
  let key = `${model.title}|${model.mode}|${model.footer}`;
  for (const row of model.rows) {
    key += `|${row.value}|${row.tone ?? ''}|${row.bar === undefined ? '' : Math.round(row.bar * 50)}`;
  }
  return key;
}
