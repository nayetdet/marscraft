import { RADIATION_CONFIG } from '../config/constants.js';

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
  const footer = s.storm.phase === 'calm' || !s.storm.speedKmS
    ? `Storm data: NASA DONKI, real data from ${s.donkiDate}`
    : `Real CME seen ${s.storm.date}: ${Math.round(s.storm.speedKmS)} km/s (NASA DONKI, real data from ${s.donkiDate})`;
  return {
    title: 'BASE STATUS',
    rows: [
      { label: 'MARS TIME', value: `SOL ${s.sol}  ${formatClock(s.timeOfDay)}` },
      { label: 'BATTERY', value: `${Math.round(s.batteryPct)}%`, bar: s.batteryPct / 100, tone: s.batteryPct <= 20 ? 'alert' : 'ok' },
      { label: 'WATER TANK', value: `${Math.round(s.water)} L`, bar: ratio(s.water, s.maxWater), tone: 'water' },
      { label: 'RADIATION', value: formatRate(s.doseRate), tone: doseTone(s.doseRate) },
      { label: 'SPACE WEATHER', value: weatherValue(s.storm), tone: stormMode(s.storm) },
    ],
    footer,
    mode: stormMode(s.storm),
  };
}

export function powerModel(s) {
  let fuel = 'OFF';
  if (s.factoryOn) fuel = s.factoryBusy ? 'MAKING FUEL' : 'WAITING FOR ICE';
  return {
    title: 'POWER MAP',
    rows: [
      { label: 'SUN IN', value: s.chargeRate > 0 ? `+${s.chargeRate.toFixed(0)}%/h` : 'NIGHT: 0', tone: s.chargeRate > 0 ? 'ok' : 'warn' },
      { label: 'BATTERY', value: `${Math.round(s.batteryPct)}%`, bar: s.batteryPct / 100, tone: s.batteryPct <= 20 ? 'alert' : 'ok' },
      { label: 'O2 MAKER', value: s.batteryPct > 0 ? 'READY' : 'NO POWER', tone: s.batteryPct > 0 ? 'ok' : 'alert' },
      { label: 'SHIELD', value: s.shieldOn ? 'ON' : 'OFF', tone: s.shieldOn ? 'warn' : 'ok' },
      { label: 'FUEL PLANT', value: fuel, tone: s.factoryBusy ? 'warn' : 'ok' },
      { label: 'GREENHOUSE', value: s.greenhousePowered ? 'LIGHTS ON' : 'NO POWER', tone: s.greenhousePowered ? 'ok' : 'alert' },
    ],
    footer: 'Mars gets 43% of the sunlight Earth gets',
    mode: s.batteryPct <= 20 ? 'alert' : 'ok',
  };
}

export function shelterModel(s) {
  let status = 'NO STORM';
  if (s.storm.phase === 'warning') status = 'STORM COMING';
  if (s.storm.phase === 'active') status = s.inShelter ? 'YOU ARE SAFE HERE' : 'STAND HERE!';
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
