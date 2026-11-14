import { formatDateDMY, formatHours } from '../mission/missionText.js';

// Estado da missao -> o que o painel do canto superior direito mostra.
// Inspirado em jogos de gestao: painel fixo de recursos com tendencia (Surviving Mars,
// Frostpunk) + alertas curtos so quando a crianca precisa agir (Oxygen Not Included).
const MAX_ALERTS = 2;
const TONE_RANK = { danger: 0, warn: 1, ok: 2 };
const RADIATION = {
  ok: { level: 1, word: 'LOW' },
  warn: { level: 2, word: 'HIGH' },
  danger: { level: 3, word: 'DANGER' },
};

export function radiationTone(doseRate) {
  if (doseRate >= 3) return 'danger';
  if (doseRate >= 0.5) return 'warn';
  return 'ok';
}

const clamp01 = (v) => Math.max(0, Math.min(1, v));

// Mesmos limites do StationSystem (#54): aviso de CO2 a partir de 40%, dano a partir de 80%
const CO2_WARN = 40;
const CO2_DAMAGE = 80;
const WATER_LOW = 0.2;
const WATER_EMPTY = 0.1;
const GREENHOUSE_DRY = 20;

// Fonte curta e honesta: dado embutido aparece como "real data from DD/MM/AAAA"
export function stormSourceShort(storm, fetchedIso) {
  return `Real NASA DONKI data from ${formatDateDMY(fetchedIso)}: CME of ${formatDateDMY(storm.cme.startTime)}, ${Math.round(storm.cme.speedKmS)} km/s`;
}

// `base`: agua do reservatorio (SurvivalSystem) e ar do habitat (StationSystem, #54).
// O "O2 da base" e 100% - CO2: o ar fica ruim quando o filtro acaba ou falta energia.
export function missionStatus(mission, fetchedIso, base = {}) {
  const power = Math.round(mission.battery.percent);
  const powerTone = power <= 15 ? 'danger' : power <= 35 ? 'warn' : 'ok';
  const charging = mission.chargeRate > 0.05;

  const shielded = mission.shieldOn && mission.insideShield;
  const radTone = radiationTone(mission.doseRate);

  const progress = mission.progress;
  const rocket = Math.floor(progress.overallPct);

  const maxWater = base.maxWater ?? 100;
  const waterLiters = base.water ?? maxWater;
  const waterPct = maxWater > 0 ? clamp01(waterLiters / maxWater) : 0;
  const waterTone = waterPct <= WATER_EMPTY ? 'danger' : waterPct <= WATER_LOW ? 'warn' : 'ok';
  const greenhouseDry = (base.hydration ?? 100) <= GREENHOUSE_DRY;

  const co2 = base.co2 ?? 0;
  const contaminated = Boolean(base.contaminated);
  const brokenWindows = base.brokenWindows > 0;
  const airPct = Math.round(Math.min(100 - co2, base.baseOxygen ?? 100));
  const airTone = co2 >= CO2_DAMAGE || airPct <= 20 || contaminated || brokenWindows ? 'danger' : co2 >= CO2_WARN || airPct <= 50 ? 'warn' : 'ok';

  const { phase, storm, hoursUntil, hoursLeft } = mission.storm;
  const alerts = [];
  if (brokenWindows) {
    alerts.push({ id: 'breach', icon: 'air', tone: 'danger', title: 'BASE WINDOW BROKEN!', text: 'Oxygen is leaking! Seal every broken window with a block.' });
  }
  if (phase === 'active') {
    alerts.push({
      id: 'storm',
      icon: 'storm',
      tone: 'danger',
      title: `SOLAR STORM! ${formatHours(hoursLeft)} left`,
      text: mission.insideShelter
        ? `In the storm shelter: ${Math.round(mission.shelterWaterL ?? 0)} L of water in the wall.`
        : shielded ? 'The shield is protecting you. Stay in the bubble.' : 'Hide in the storm shelter (water wall) or use the Shield Remote to turn on the shield.',
      fill: clamp01(hoursLeft / Math.max(0.01, storm.end - storm.arrival)),
      source: stormSourceShort(storm, fetchedIso),
    });
  } else if (phase === 'warning') {
    alerts.push({
      id: 'storm',
      icon: 'storm',
      tone: 'warn',
      title: `Solar storm in ${formatHours(hoursUntil)}`,
      text: 'The Sun threw out fast particles. Fill the shelter water wall and get ready to hide!',
      fill: clamp01(hoursUntil / Math.max(0.01, storm.arrival - storm.warningStart)),
      source: stormSourceShort(storm, fetchedIso),
    });
  }
  if (mission.radioBlackout) {
    alerts.push({ id: 'radio', icon: 'sun', tone: 'warn', title: 'Radio silent', text: 'The Sun is between Mars and Earth. Decide on your own!' });
  }
  if (mission.shieldOn && !mission.insideShield) {
    alerts.push({ id: 'bubble', icon: 'shield', tone: 'warn', title: 'Outside the shield!', text: 'Walk back into the blue bubble.' });
  }
  if (powerTone === 'danger') {
    alerts.push({
      id: 'power',
      icon: 'bolt',
      tone: 'danger',
      title: 'Battery almost empty',
      text: charging ? 'The Sun is charging it again.' : 'Night: no sun. Save power until morning.',
    });
  }
  if (contaminated) {
    alerts.push({ id: 'air', icon: 'air', tone: 'danger', title: 'Dust in the base!', text: 'Mars dust came in on your suit. Clean it at life support.' });
  } else if (airTone !== 'ok') {
    alerts.push({
      id: 'air',
      icon: 'air',
      tone: airTone,
      title: airTone === 'danger' ? 'Bad air in the base!' : 'Base air is getting bad',
      text: 'Too much CO2 (the gas we breathe out). Replace the filter at life support.',
    });
  }
  if (waterTone === 'danger') {
    alerts.push({ id: 'water', icon: 'drop', tone: 'danger', title: 'Base water almost empty', text: 'Use the rover to bring ice. Ice melts into water.' });
  } else if (greenhouseDry) {
    alerts.push({ id: 'greenhouse', icon: 'plant', tone: 'warn', title: 'The plants are thirsty', text: 'The greenhouse needs water to grow food.' });
  }
  if (radTone === 'danger' && !shielded && phase !== 'active') {
    alerts.push({ id: 'radiation', icon: 'radiation', tone: 'danger', title: 'Radiation very high', text: 'Go inside the base.' });
  }
  if (progress.ready) {
    alerts.push({ id: 'rocket', icon: 'rocket', tone: 'ok', title: 'Rocket ready!', text: 'Go to the MAV and press IGNITE.' });
  }

  return {
    power: { pct: power, tone: powerTone, trend: charging ? 'up' : 'down' },
    water: { liters: Math.round(waterLiters), pct: Math.round(waterPct * 100), tone: waterTone, greenhouseDry },
    air: { pct: airPct, tone: airTone },
    radiation: shielded
      ? { level: 0, word: 'SHIELD', tone: 'shield', icon: 'shield' }
      : { ...RADIATION[radTone], tone: radTone, icon: 'radiation' },
    shieldOn: mission.shieldOn,
    rocket: { pct: rocket, tone: progress.ready ? 'ok' : 'neutral' },
    // O que machuca agora (vermelho) vem antes dos avisos (amarelo); empate mantem a ordem acima
    alerts: alerts.sort((a, b) => TONE_RANK[a.tone] - TONE_RANK[b.tone]).slice(0, MAX_ALERTS),
  };
}
