// @ts-nocheck
import { DOSE_CONFIG, ENERGY_CONFIG, MISSION_CONFIG } from '../config/constants.ts';
import { formatHours } from '../mission/missionText.ts';
import { pixelIconSvg } from './pixelIcons.ts';

// Painel POWER & HEAT: visual em blocos (estilo .mc-monitor das outras estacoes),
// mostrando o fluxo Sol/Reator -> Bateria -> Calor/Sistemas e os disjuntores de controle.
// `powerPanelModel` e funcao pura (testada no Vitest); `powerPanelHtml` so pinta o resultado.

// O que cada consumidor deixa de fazer desligado: o custo de economizar (nenhuma escolha e de graca)
const LOAD_EFFECTS = {
  lights: 'Off: plants stop growing',
  heater: 'Off: pipes and plants freeze at night',
  shield: 'On: stops storm radiation in the bubble',
  factory: 'Off: the rocket stops filling',
};

const LOAD_SHORT_NAMES = {
  heater: 'HEATER',
  lights: 'LIGHTS',
  shield: 'SHIELD',
  factory: 'ROCKET',
};

const LOAD_SHORT_TIPS = {
  heater: 'Warm',
  lights: 'Plants',
  shield: 'Storms',
  factory: 'Fuel',
};

const LOAD_ICONS = {
  heater: 'temperature',
  lights: 'sun',
  shield: 'shield',
  factory: 'rocket',
};

const SWITCH_ORDER = ['heater', 'lights', 'shield', 'factory'];

const NIGHT_HOURS = 12;
const SUNSET_HOUR = MISSION_CONFIG.SUNRISE_HOUR + NIGHT_HOURS;

// Horas de jogo ate o Sol nascer (0 de dia)
export function hoursToSunrise(timeOfDay) {
  const t = ((timeOfDay % 24) + 24) % 24;
  if (t >= MISSION_CONFIG.SUNRISE_HOUR && t < SUNSET_HOUR) return 0;
  return (MISSION_CONFIG.SUNRISE_HOUR - t + 24) % 24;
}

const signed = (rate) => `${rate >= 0 ? '+' : '-'}${Math.abs(rate).toFixed(1)}%/h`;

// state = { batteryPct, timeOfDay, solarRate, solarReason, panelDustPct, reactorOn, standby, cold,
//           outsideTemp (texto pronto ou null), easyStartPct (ou null), loads: [[nome, taxa, ligado, id]] }
export function powerPanelModel(state) {
  const night = state.solarRate <= 0;
  const reactorRate = state.reactorOn ? ENERGY_CONFIG.REACTOR_CHARGE_PER_HOUR : 0;
  const powerIn = state.solarRate + reactorRate;
  const powerOut = state.loads.reduce((sum, [, rate, on]) => sum + (on ? rate : 0), 0);
  const net = powerIn - powerOut;
  const pct = Math.max(0, Math.min(100, state.batteryPct));
  const tone = pct <= 15 ? 'danger' : pct <= 35 ? 'warn' : 'ok';

  let forecast = 'Holding steady';
  if (net < -0.05) forecast = pct > 0 ? `Empty in about ${formatHours(pct / -net)}` : 'Empty';
  else if (net > 0.05) forecast = pct < 99.5 ? `Full in about ${formatHours((100 - pct) / net)}` : 'Full';

  const sunrise = hoursToSunrise(state.timeOfDay);
  const emptyBeforeSunrise = night && net < 0 && pct / -net < sunrise;

  let tip;
  if (state.standby && night && !state.reactorOn) {
    tip = { tone: 'danger', text: 'The battery is empty and the Sun is gone. Start the fission reactor to get power back. It works at night, but it adds radiation dose.' };
  } else if (state.standby) {
    tip = { tone: 'danger', text: 'The battery is empty. Keep the fuel factory and the shield off until it charges again.' };
  } else if (emptyBeforeSunrise) {
    tip = { tone: 'warn', text: `The battery will be empty before sunrise (${formatHours(sunrise)} to go). Turn something off, or start the fission reactor.` };
  } else if (state.reactorOn && !night && pct >= 60) {
    tip = { tone: 'warn', text: 'The Sun is up and the battery is fine. Turn the reactor off to save your radiation dose.' };
  } else if (night) {
    tip = { tone: 'ok', text: 'Night: the solar panels make nothing. The battery has to last until sunrise.' };
  } else {
    tip = { tone: 'ok', text: 'Everything that is ON uses power. Turn off what you do not need right now.' };
  }

  const mappedLoads = state.loads.map(([name, rate, on, id]) => ({
    id,
    name,
    on,
    rateNum: rate,
    rate: !on ? 'OFF' : rate > 0 ? `-${rate.toFixed(1)}%/h` : 'idle',
    // Barra proporcional ao maior consumidor possivel (a fabrica de combustivel)
    fill: on ? Math.min(1, rate / ENERGY_CONFIG.ISRU_DRAIN_PER_HOUR) : 0,
    toggle: LOAD_EFFECTS[id] ? id : null,
    note: LOAD_EFFECTS[id] ?? 'Always on: the crew needs it',
  }));

  const alwaysOnOut = mappedLoads
    .filter((l) => !l.toggle && l.on)
    .reduce((sum, l) => sum + l.rateNum, 0);

  return {
    battery: { pct: Math.round(pct), tone },
    net: { text: signed(net), tone: net < -0.05 ? 'down' : net > 0.05 ? 'up' : 'flat' },
    forecast,
    night,
    sunriseHours: sunrise,
    solarRate: state.solarRate,
    panelDustPct: state.panelDustPct ?? 0,
    reactorOn: Boolean(state.reactorOn),
    reactorRate: ENERGY_CONFIG.REACTOR_CHARGE_PER_HOUR,
    standby: Boolean(state.standby),
    cold: Boolean(state.cold),
    outsideTemp: state.outsideTemp ?? null,
    easyStartPct: state.easyStartPct ?? null,
    inText: signed(powerIn),
    alwaysOnOut,
    sources: [
      {
        id: 'solar', icon: night ? 'moon' : 'sun', name: 'Solar panels',
        rate: night ? 'NIGHT' : signed(state.solarRate), active: !night,
        note: night
          ? 'No sun until sunrise'
          : `${state.solarReason}. Dust on the panels: ${state.panelDustPct}%${state.panelDustPct >= 30 ? ' (clean them at the solar field, to the west)' : ''}`,
      },
      {
        id: 'rtg', icon: 'bolt', name: 'Nuclear RTG',
        rate: signed(ENERGY_CONFIG.RTG_LIFE_SUPPORT_PER_HOUR), active: true,
        note: 'Day and night, only for the air you breathe',
      },
      {
        id: 'reactor', icon: 'radiation', name: 'Fission reactor',
        rate: state.reactorOn ? signed(reactorRate) : 'OFF', active: state.reactorOn, toggle: 'reactor',
        note: `Works day and night. Costs radiation: +${DOSE_CONFIG.REACTOR_MSV_PER_HOUR} mSv each hour it runs`,
      },
    ],
    outText: `-${powerOut.toFixed(1)}%/h`,
    loads: mappedLoads,
    tip,
    chips: [
      state.outsideTemp ? `OUTSIDE ${state.outsideTemp}` : null,
      state.cold ? 'FREEZING: PIPES AND PLANTS STOPPED' : null,
      state.easyStartPct ? `EASY START: BASE USES ${state.easyStartPct}% OF NORMAL POWER` : null,
    ].filter(Boolean),
  };
}

function pillHtml(kind, icon, value, title = '') {
  const titleAttr = title ? ` title="${title}"` : '';
  return `<div class="gh-res-pill ${kind}"${titleAttr}><span class="mc-pill-ico">${pixelIconSvg(icon)}</span><strong>${value}</strong></div>`;
}

function powerStageSvg(model) {
  const heater = model.loads.find((l) => l.id === 'heater');
  const heaterOn = Boolean(heater?.on);
  const solarOn = !model.night && model.solarRate > 0;
  const dusty = model.panelDustPct >= 30;
  const pct = model.battery.pct;
  const fillH = Math.round((pct / 100) * 46);
  const battColor = model.battery.tone === 'danger' ? '#ef4444' : model.battery.tone === 'warn' ? '#facc15' : '#4ade80';
  const skyColor = model.night ? '#0a1324' : '#261812';
  const panelColor = dusty ? '#b46944' : '#1d4ed8';
  const panelCell = dusty ? '#9a5530' : '#38bdf8';

  const solarFlow = solarOn
    ? `<g class="mc-anim-flow">
         <rect x="46" y="40" width="6" height="4" fill="#fde047"/>
         <rect x="57" y="40" width="6" height="4" fill="#facc15"/>
       </g>`
    : '';

  const reactorFlow = model.reactorOn
    ? `<g class="mc-anim-flow">
         <rect x="46" y="88" width="6" height="4" fill="#4ade80"/>
         <rect x="57" y="88" width="6" height="4" fill="#fde047"/>
       </g>`
    : '';

  const heatFlow = !model.standby
    ? `<g class="mc-anim-flow">
         <rect x="114" y="46" width="6" height="4" fill="${heaterOn ? '#fb923c' : '#60a5fa'}"/>
         <rect x="114" y="84" width="6" height="4" fill="#facc15"/>
       </g>`
    : '';

  const heaterVisual = model.cold || (!heaterOn && model.night)
    ? `<!-- Frozen pipes -->
       <rect x="128" y="34" width="32" height="6" fill="#7dd3fc"/>
       <rect x="132" y="31" width="6" height="12" fill="#e0f2fe"/>
       <rect x="148" y="31" width="6" height="12" fill="#bae6fd"/>
       <text x="144" y="54" class="mc-svg-sub" fill="#7dd3fc">FROZEN</text>`
    : heaterOn && !model.standby
      ? `<!-- Warm heater coils & water pipe -->
         <rect x="128" y="40" width="32" height="5" fill="#38bdf8"/>
         <rect x="132" y="24" width="4" height="10" fill="#fb923c"/>
         <rect x="142" y="22" width="4" height="12" fill="#fde047"/>
         <rect x="152" y="24" width="4" height="10" fill="#fb923c"/>
         <g class="mc-anim-float">
           <rect x="133" y="16" width="3" height="4" fill="#fdba74"/>
           <rect x="143" y="14" width="3" height="4" fill="#fef08a"/>
           <rect x="153" y="16" width="3" height="4" fill="#fdba74"/>
         </g>
         <text x="144" y="55" class="mc-svg-sub" fill="#fdba74">WARM</text>`
      : `<!-- Idle heater -->
         <rect x="128" y="40" width="32" height="5" fill="#38bdf8"/>
         <rect x="132" y="26" width="24" height="8" fill="#334155"/>
         <text x="144" y="55" class="mc-svg-sub" fill="#94a3b8">OFF</text>`;

  return `
    <svg class="mc-scene-svg mc-air-svg" viewBox="0 0 176 128" shape-rendering="crispEdges" aria-hidden="true">
      <rect x="0" y="0" width="176" height="128" fill="${skyColor}"/>
      <!-- Ground & Habitat Divider -->
      <rect x="0" y="108" width="176" height="20" fill="#17232c"/>
      <rect x="120" y="10" width="48" height="98" fill="#10242b" stroke="#2f5a60" stroke-width="2"/>

      <!-- Sun / Moon -->
      ${model.night
        ? `<rect x="12" y="12" width="12" height="12" fill="#cbd5e1"/><rect x="18" y="12" width="6" height="6" fill="${skyColor}"/>
           <rect x="34" y="14" width="2" height="2" fill="#e2e8f0"/><rect x="50" y="10" width="2" height="2" fill="#93c5fd"/>`
        : `<rect x="12" y="10" width="14" height="14" fill="#fde047"/><rect x="15" y="13" width="8" height="8" fill="#fef9c3"/>`}

      <!-- Solar Panel (top-left) -->
      <rect x="10" y="34" width="32" height="18" fill="${panelColor}" stroke="#cbd5e1" stroke-width="2"/>
      <rect x="14" y="37" width="10" height="5" fill="${panelCell}"/>
      <rect x="28" y="37" width="10" height="5" fill="${panelCell}"/>
      <rect x="14" y="44" width="10" height="5" fill="${panelCell}"/>
      <rect x="28" y="44" width="10" height="5" fill="${panelCell}"/>
      <rect x="24" y="52" width="4" height="8" fill="#94a3b8"/>
      <text x="26" y="68" class="mc-svg-sub" fill="#cbd5e1">SOLAR</text>

      <!-- Fission Reactor (bottom-left) -->
      <rect x="10" y="76" width="32" height="26" fill="${model.reactorOn ? '#143322' : '#1b262c'}" stroke="${model.reactorOn ? '#4ade80' : '#475569'}" stroke-width="2"/>
      <rect x="18" y="82" width="16" height="12" fill="${model.reactorOn ? '#22c55e' : '#334155'}"/>
      ${model.reactorOn ? '<rect x="22" y="85" width="8" height="6" fill="#fde047" class="mc-anim-pulse"/>' : ''}
      <text x="26" y="119" class="mc-svg-sub" fill="${model.reactorOn ? '#86efac' : '#94a3b8'}">REACTOR</text>

      <!-- Cables to Battery -->
      <rect x="42" y="41" width="26" height="2" fill="#334155"/>
      <rect x="42" y="89" width="26" height="2" fill="#334155"/>
      ${solarFlow}
      ${reactorFlow}

      <!-- Central Battery Bank -->
      <rect x="81" y="26" width="14" height="5" fill="#94a3b8"/>
      <rect x="68" y="31" width="40" height="66" fill="#09161b" stroke="#64748b" stroke-width="2"/>
      <rect x="73" y="38" width="30" height="50" fill="#050d10"/>
      <rect x="75" y="${86 - fillH}" width="26" height="${fillH}" fill="${battColor}"/>
      <text x="88" y="66" class="mc-svg-big" fill="#ffffff">${pct}%</text>
      <text x="88" y="119" class="mc-svg-sub" fill="#fde047">BATTERY</text>

      <!-- Cables to Base -->
      <rect x="108" y="47" width="14" height="2" fill="#334155"/>
      <rect x="108" y="85" width="14" height="2" fill="#334155"/>
      ${heatFlow}

      <!-- Right Top: Heater & Pipes -->
      ${heaterVisual}

      <!-- Right Bottom: Base Systems -->
      <rect x="128" y="72" width="32" height="28" fill="#0d1e24" stroke="${model.standby ? '#ef4444' : '#38bdf8'}" stroke-width="2"/>
      <rect x="133" y="77" width="10" height="8" fill="${model.standby ? '#7f1d1d' : '#38bdf8'}"/>
      <rect x="146" y="77" width="9" height="8" fill="${model.standby ? '#7f1d1d' : '#4ade80'}"/>
      <rect x="133" y="89" width="22" height="5" fill="#1e3a44"/>
      <text x="144" y="119" class="mc-svg-sub" fill="#93c5fd">BASE</text>
    </svg>`;
}

function breakerCard(opts) {
  const classes = [
    'mc-btn',
    'mc-act-card',
    'is-compact',
    'pw-breaker',
    opts.on ? 'is-active' : '',
    opts.urgent ? 'is-urgent' : '',
  ].filter(Boolean).join(' ');
  return `
    <button type="button" class="${classes}" data-action="toggle:${opts.id}" aria-pressed="${opts.on}">
      <span class="mc-act-icon" aria-hidden="true">${pixelIconSvg(opts.icon)}</span>
      <span class="mc-act-main">
        <strong>${opts.title}</strong>
        <span class="mc-act-costs">
          <span class="mc-cost-chip">${pixelIconSvg('bolt')}${opts.rate}</span>
          ${opts.detail ? `<span class="mc-cost-chip">${opts.detail}</span>` : ''}
        </span>
      </span>
      <span class="pw-toggle ${opts.on ? 'is-on' : 'is-off'}" aria-hidden="true">
        <span>OFF</span><span class="pw-toggle-track"><i></i></span><span>ON</span>
      </span>
    </button>`;
}

function powerCue(model) {
  const heater = model.loads.find((l) => l.id === 'heater');
  if (model.standby && model.night && !model.reactorOn) return { tag: 'NO PWR', text: 'Start Reactor!', tone: 'danger' };
  if (model.standby) return { tag: 'NO PWR', text: 'Turn off switches!', tone: 'danger' };
  if (model.cold && !heater?.on) return { tag: 'FREEZE', text: 'Turn Heater ON!', tone: 'danger' };
  if (model.tip.tone === 'warn' && model.reactorOn && !model.night) return { tag: 'SUN', text: 'Turn Reactor OFF', tone: 'warn' };
  if (model.tip.tone === 'warn') return { tag: 'LOW', text: 'Save power or Reactor ON', tone: 'warn' };
  if (model.panelDustPct >= 30) return { tag: 'DUST', text: 'Clean solar panels', tone: 'warn' };
  return {
    tag: model.night ? 'NIGHT' : 'SOLAR',
    text: model.night ? `${model.forecast} · Sun ${formatHours(model.sunriseHours)}` : model.forecast,
    tone: 'ok',
  };
}

export function powerPanelHtml(model, nasaInfoHtml = '') {
  const reactor = model.sources.find((s) => s.id === 'reactor');
  const solar = model.sources[0];
  const solarPeak = ENERGY_CONFIG.SOLAR_PEAK_PER_HOUR || 15;
  const solarPct = model.night ? 0 : Math.min(100, Math.round((model.solarRate / solarPeak) * 100));
  const powerInNum = model.solarRate + (model.reactorOn ? model.reactorRate : 0);
  const powerOutNum = Math.abs(parseFloat(model.outText) || 0);
  const inBarPct = Math.min(100, Math.round((powerInNum / (solarPeak + model.reactorRate)) * 100));
  const outBarPct = Math.min(100, Math.round((powerOutNum / (solarPeak + model.reactorRate)) * 100));

  const switchLoads = SWITCH_ORDER
    .map((id) => model.loads.find((l) => l.id === id))
    .filter(Boolean);

  const topPills = [
    pillHtml('power', 'bolt', `${model.battery.pct}%`, 'Battery'),
    pillHtml(model.net.tone === 'down' ? 'warning' : 'beds', model.net.tone === 'down' ? 'down' : 'up', model.net.text, 'Net power/h'),
    pillHtml(model.cold ? 'warning' : 'water', 'temperature', model.cold ? 'FREEZE!' : (model.outsideTemp ?? 'WARM'), 'Outside temp'),
    model.panelDustPct >= 30 ? pillHtml('warning', 'dust', `${model.panelDustPct}%`, 'Panel dust') : '',
    model.standby ? `<span class="gh-alert-pill" role="status">NO POWER!</span>` : '',
  ].filter(Boolean).join('');

  const cue = powerCue(model);

  const switchCards = switchLoads.map((l) => breakerCard({
    id: l.id,
    icon: LOAD_ICONS[l.id] ?? 'bolt',
    title: LOAD_SHORT_NAMES[l.id] ?? l.name,
    rate: l.rate,
    detail: LOAD_SHORT_TIPS[l.id] ?? '',
    on: l.on,
    urgent: l.id === 'heater' && model.cold && !l.on,
  })).join('');

  const reactorCard = breakerCard({
    id: 'reactor',
    icon: 'radiation',
    title: 'REACTOR',
    rate: reactor.active ? reactor.rate : `+${model.reactorRate.toFixed(1)}%/h`,
    detail: `+${DOSE_CONFIG.REACTOR_MSV_PER_HOUR} mSv`,
    on: reactor.active,
    urgent: model.standby && model.night && !reactor.active,
  });

  return `
    <div class="mc-monitor" data-machine="powerroom">
      <div class="gh-top-bar mc-top-bar">
        ${topPills}
        ${nasaInfoHtml}
      </div>
      <div class="gh-body mc-body">
        <div class="mc-stage-wrap">
          <div class="mc-stage-box">
            ${powerStageSvg(model)}
            <div class="mc-stat-bars mc-air-bars">
              <div class="mc-mini-bar" title="${solar.note}">
                <span>${pixelIconSvg(model.night ? 'moon' : 'sun')} IN</span>
                <div class="mc-bar-track"><i style="width:${Math.max(inBarPct, solarPct)}%;background:#4ade80"></i></div>
                <strong>${model.inText}</strong>
              </div>
              <div class="mc-mini-bar">
                <span>${pixelIconSvg('bolt')} OUT</span>
                <div class="mc-bar-track"><i style="width:${outBarPct}%;background:#fb923c"></i></div>
                <strong>${model.outText}</strong>
              </div>
            </div>
            <div class="mc-stage-caption is-${cue.tone}">
              <span class="mc-cap-tag">${cue.tag}</span>
              <strong>${cue.text}</strong>
            </div>
          </div>
        </div>
        <div class="gh-side mc-side">
          <div class="mc-step-bar">POWER &amp; HEAT</div>
          ${reactorCard}
          <div class="pw-switch-grid">
            ${switchCards}
          </div>
        </div>
      </div>
    </div>`;
}
