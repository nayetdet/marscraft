// @ts-nocheck
import { RADIATION_CONFIG, SURVIVAL_CONFIG } from '../config/constants.ts';
import { donkiLabel, formatDateDMY, formatHours } from '../mission/missionText.ts';

// Estado da missao -> o que o painel do canto superior direito mostra.
// Inspirado em jogos de gestao: painel fixo de recursos com tendencia (Surviving Mars,
// Frostpunk) + alertas curtos so quando a crianca precisa agir (Oxygen Not Included).
// Um aviso por vez, para a crianca resolver uma coisa de cada vez: o mais urgente (ALERT_PRIORITY).
// Eram ate 2 quando os dois eram perigo; no teste com jogadores de 15/11/2026 dois cards vermelhos
// mais o objetivo e a legenda nao deixavam saber o que fazer. O perigo que ficou de fora continua
// visivel na barra dele (vermelha) no painel de recursos e vira o aviso assim que o primeiro some.
const MAX_ALERTS = 1;
const TONE_RANK = { danger: 0, warn: 1, ok: 2 };
const ALERT_PRIORITY = { breach: 0, oxygen: 0, storm: 1, power: 2, air: 3, radiation: 4, water: 4, bubble: 5, rocket: 6, radio: 7 };
const RADIATION = {
  ok: { level: 1, word: 'LOW' },
  warn: { level: 2, word: 'HIGH' },
  danger: { level: 3, word: 'DANGER' },
};

export function radiationTone(doseRate) {
  if (doseRate >= RADIATION_CONFIG.HARM_THRESHOLD_MSV_PER_HOUR) return 'danger';
  if (doseRate >= RADIATION_CONFIG.WARN_MSV_PER_HOUR) return 'warn';
  return 'ok';
}

const clamp01 = (v) => Math.max(0, Math.min(1, v));

// Mesmos limites do StationSystem (#54): aviso de CO2 a partir de 40%, dano a partir de 80%
const CO2_WARN = 40;
const CO2_DAMAGE = 80;
const WATER_LOW = 0.2;
const WATER_EMPTY = 0.1;
// A partir de quantos litros de agua cinza vale mais mandar alguem reciclar do que buscar gelo
const GRAYWATER_WORTH_RECYCLING = 5;

// Fonte curta e honesta: dado embutido aparece como "real data from DD/MM/AAAA" e o ao vivo como
// "LIVE from NASA DONKI, fetched HH:MM" (issue #100). `source`: veja donkiLabel em missionText.js.
export function stormSourceShort(storm, source) {
  const label = donkiLabel(source);
  const origin = label.startsWith('LIVE') ? label : `Real NASA DONKI data from ${label.slice('real data from '.length)}`;
  if (storm.sep) return `${origin}: SEP of ${formatDateDMY(storm.sep.eventTime)}`;
  return `${origin}: CME of ${formatDateDMY(storm.cme.startTime)}, ${Math.round(storm.cme.speedKmS)} km/s`;
}

// `base`: agua do reservatorio e agua cinza (SurvivalSystem), campos sem agua e ar do habitat
// (StationSystem, #54).
// O "O2 da base" e 100% - CO2: o ar fica ruim quando o filtro acaba ou falta energia.
export function missionStatus(mission, source, base = {}) {
  const power = Math.round(mission.battery.percent);
  const powerTone = power <= 15 ? 'danger' : power <= 35 ? 'warn' : 'ok';
  const charging = mission.chargeRate > 0.05;

  const shielded = mission.shieldOn && mission.insideShield;
  const radTone = radiationTone(mission.doseRate);

  // O foguete nao entra neste painel: a meta e o medidor dele ficam no painel do objetivo
  // (src/story/objectiveView.js), para a crianca ter um medidor so de "quanto falta".
  const progress = mission.progress;

  const maxWater = base.maxWater ?? 100;
  const waterLiters = base.water ?? maxWater;
  const waterPct = maxWater > 0 ? clamp01(waterLiters / maxWater) : 0;
  const waterTone = waterPct <= WATER_EMPTY ? 'danger' : waterPct <= WATER_LOW ? 'warn' : 'ok';
  // Campos da estufa parados por falta de agua no tanque (issue #101)
  const greenhouseDry = Boolean(base.greenhouseDry);

  const co2 = base.co2 ?? 0;
  const contaminated = Boolean(base.contaminated);
  const brokenWindows = base.brokenWindows > 0;
  const airPct = Math.round(Math.min(100 - co2, base.baseOxygen ?? 100));
  const airTone = co2 >= CO2_DAMAGE || airPct <= 20 || contaminated || brokenWindows ? 'danger' : co2 >= CO2_WARN || airPct <= 50 ? 'warn' : 'ok';

  const { phase, storm, hoursUntil, hoursLeft } = mission.storm;
  const alerts = [];
  if (Number.isFinite(base.suitOxygen) && base.suitOxygen <= SURVIVAL_CONFIG.DANGER_THRESHOLD) {
    const target = base.oxygenNeedsPower ? 'powerroom' : base.insideHabitat ? 'lifeSupport' : 'airlock';
    alerts.push({
      id: 'oxygen', icon: 'air', tone: 'danger', title: 'SUIT OXYGEN CRITICAL',
      text: base.oxygenNeedsPower
        ? 'The base battery is empty. Press F at Power & Heat control and start the reactor.'
        : base.insideHabitat ? 'Stay inside the habitat while your suit refills.' : 'Return through the airlock now.',
      target,
    });
  }
  if (brokenWindows) {
    alerts.push({ id: 'breach', icon: 'air', tone: 'danger', title: 'BASE BREACH!', text: 'Oxygen is leaking! Follow the marker and seal the opening with a block.', target: 'brokenWindow' });
  }
  if (phase === 'active') {
    alerts.push({
      id: 'storm',
      icon: 'storm',
      tone: 'danger',
      title: `SOLAR STORM! ${formatHours(hoursLeft)} left`,
      text: mission.insideShelter
        ? `In the storm shelter: ${Math.round(mission.shelterWaterL ?? 0)} L of water in the wall.`
        : shielded ? 'The shield is protecting you. Stay in the bubble.' : 'Enter the storm shelter and press F at the water wall to add shielding.',
      target: mission.insideShelter || shielded ? null : 'shelter',
      fill: clamp01(hoursLeft / Math.max(0.01, storm.end - storm.arrival)),
      source: stormSourceShort(storm, source),
    });
  } else if (phase === 'warning') {
    alerts.push({
      id: 'storm',
      icon: 'storm',
      tone: 'warn',
      title: `Solar storm in ${formatHours(hoursUntil)}`,
      text: 'Fast particles from the Sun. Get ready to hide in the storm shelter!',
      target: 'shelter',
      fill: clamp01(hoursUntil / Math.max(0.01, storm.arrival - storm.warningStart)),
      source: stormSourceShort(storm, source),
    });
  }
  if (mission.radioBlackout) {
    alerts.push({ id: 'radio', icon: 'sun', tone: 'warn', title: 'Radio silent', text: 'The Sun is between Mars and Earth. Decide on your own!' });
  }
  if (mission.shieldOn && !mission.insideShield) {
    alerts.push({ id: 'bubble', icon: 'shield', tone: 'warn', title: 'Outside the shield!', text: 'Return through the airlock and walk into the blue shield bubble.', target: 'airlock' });
  }
  if (powerTone === 'danger') {
    alerts.push({
      id: 'power',
      icon: 'bolt',
      tone: 'danger',
      title: 'Battery almost empty',
      text: charging
        ? 'Press F at Power & Heat control and switch off what you do not need.'
        : mission.reactorOn
          ? 'Night: no sun. The reactor is on. Press F at Power & Heat control and switch off what you do not need.'
          : 'Night: no sun. Press F at Power & Heat control: switch things off or start the reactor.',
      target: 'powerroom',
    });
  }
  if (contaminated) {
    alerts.push({ id: 'air', icon: 'air', tone: 'danger', title: 'Dust in the base!', text: 'Press F at life support to clean your suit and the habitat.', target: 'lifeSupport' });
  } else if (airTone !== 'ok') {
    alerts.push({
      id: 'air',
      icon: 'air',
      tone: airTone,
      title: airTone === 'danger' ? 'Bad air in the base!' : 'Base air is getting bad',
      text: 'CO2 is the gas we breathe out. Press F at life support to replace the air filter.',
      target: 'lifeSupport',
    });
  }
  if (waterTone === 'danger' || greenhouseDry) {
    alerts.push({
      id: 'water',
      icon: 'drop',
      tone: 'danger',
      title: greenhouseDry ? 'No water: the plants stopped growing' : 'Base water almost empty',
      text: (base.graywater ?? 0) >= GRAYWATER_WORTH_RECYCLING
        ? 'Go to the water recycler and press F to ask a crew member to clean the used water.'
        : 'Drive the rover to the ice crater, use DRILL, then bring the ice to the base.',
      target: (base.graywater ?? 0) >= GRAYWATER_WORTH_RECYCLING ? 'recycler' : 'ice',
    });
  }
  if (radTone === 'danger' && !shielded && phase !== 'active') {
    alerts.push({ id: 'radiation', icon: 'radiation', tone: 'danger', title: 'Radiation very high', text: 'Go through the airlock to the storm shelter. Press F at the water wall to add shielding.', target: 'shelter' });
  }
  if (progress.ready) {
    alerts.push({ id: 'rocket', icon: 'rocket', tone: 'ok', title: 'Rocket ready!', text: 'Go to the MAV and press IGNITE.', target: 'mav' });
  }

  return {
    power: { pct: power, tone: powerTone, trend: charging ? 'up' : 'down' },
    water: { liters: Math.round(waterLiters), pct: Math.round(waterPct * 100), tone: waterTone, greenhouseDry },
    air: { pct: airPct, tone: airTone },
    radiation: shielded
      ? { level: 0, word: 'SHIELD', tone: 'shield', icon: 'shield' }
      : { ...RADIATION[radTone], tone: radTone, icon: 'radiation' },
    shieldOn: mission.shieldOn,
    // O que machuca agora (vermelho) vem antes dos avisos (amarelo); empate mantem a ordem acima
    alerts: alerts
      .sort((a, b) => TONE_RANK[a.tone] - TONE_RANK[b.tone] || ALERT_PRIORITY[a.id] - ALERT_PRIORITY[b.id])
      .filter((alert, i) => i === 0 || alert.tone === 'danger')
      .slice(0, MAX_ALERTS),
  };
}
