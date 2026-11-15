// @ts-nocheck
import { DOSE_CONFIG, ENERGY_CONFIG, MISSION_CONFIG } from '../config/constants.ts';
import { formatHours } from '../mission/missionText.ts';
import { pixelIconSvg } from './pixelIcons.ts';

// Painel POWER & HEAT (teste com jogadores de 15/11/2026: o painel antigo era um paredao de texto).
// De cima para baixo: a bateria e para onde ela vai, o que entra, o que sai (com o botao de ligar
// e desligar na propria linha) e UMA dica do que fazer agora.
// `powerPanelModel` e funcao pura (testada no Vitest); `powerPanelHtml` so pinta o resultado.

// O que cada consumidor deixa de fazer desligado: o custo de economizar (nenhuma escolha e de graca)
const LOAD_EFFECTS = {
  lights: 'Off: plants stop growing',
  heater: 'Off: pipes and plants freeze at night',
  shield: 'On: stops storm radiation in the bubble',
  factory: 'Off: the rocket stops filling',
};

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

  return {
    battery: { pct: Math.round(pct), tone },
    net: { text: signed(net), tone: net < -0.05 ? 'down' : net > 0.05 ? 'up' : 'flat' },
    forecast,
    night,
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
    loads: state.loads.map(([name, rate, on, id]) => ({
      name,
      on,
      rate: !on ? 'OFF' : rate > 0 ? `-${rate.toFixed(1)}%/h` : 'idle',
      // Barra proporcional ao maior consumidor possivel (a fabrica de combustivel)
      fill: on ? Math.min(1, rate / ENERGY_CONFIG.ISRU_DRAIN_PER_HOUR) : 0,
      toggle: LOAD_EFFECTS[id] ? id : null,
      note: LOAD_EFFECTS[id] ?? 'Always on: the crew needs it',
    })),
    tip,
    chips: [
      state.outsideTemp ? `OUTSIDE ${state.outsideTemp}` : null,
      state.cold ? 'FREEZING: PIPES AND PLANTS STOPPED' : null,
      state.easyStartPct ? `EASY START: BASE USES ${state.easyStartPct}% OF NORMAL POWER` : null,
    ].filter(Boolean),
  };
}

const toggleButton = (id, on) => `<button type="button" class="pw-toggle ${on ? 'is-on' : 'is-off'}" data-action="toggle:${id}" aria-pressed="${on}">${on ? 'ON' : 'OFF'}</button>`;

export function powerPanelHtml(model) {
  const sources = model.sources.map((s) => `
    <div class="pw-row ${s.active ? '' : 'is-off'}">
      <span class="pw-icon">${pixelIconSvg(s.icon)}</span>
      <span class="pw-name">${s.name}<small>${s.note}</small></span>
      <strong class="pw-rate ${s.active ? 'in' : ''}">${s.rate}</strong>
      ${s.toggle ? toggleButton(s.toggle, s.active) : '<span class="pw-toggle-gap"></span>'}
    </div>`).join('');
  const loads = model.loads.map((l) => `
    <div class="pw-row ${l.on ? '' : 'is-off'}">
      <span class="pw-meter"><i style="width:${Math.round(l.fill * 100)}%"></i></span>
      <span class="pw-name">${l.name}<small>${l.note}</small></span>
      <strong class="pw-rate ${l.on && l.fill > 0 ? 'out' : ''}">${l.rate}</strong>
      ${l.toggle ? toggleButton(l.toggle, l.on) : '<span class="pw-toggle-gap"></span>'}
    </div>`).join('');
  return `
    <div class="pw-battery tone-${model.battery.tone}">
      <span class="pw-icon big">${pixelIconSvg('bolt')}</span>
      <div class="pw-battery-main">
        <div class="pw-battery-top"><span>BATTERY</span><strong>${model.battery.pct}%</strong></div>
        <div class="pw-bar"><i style="width:${model.battery.pct}%"></i></div>
        <div class="pw-battery-foot"><span class="pw-net ${model.net.tone}">${model.net.text}</span><span>${model.forecast}</span></div>
      </div>
    </div>
    <p class="pw-tip tone-${model.tip.tone}">${model.tip.text}</p>
    <h3 class="pw-head">POWER IN</h3>
    ${sources}
    <h3 class="pw-head">POWER OUT <span>${model.outText}</span></h3>
    ${loads}
    ${model.chips.length ? `<div class="pw-chips">${model.chips.map((chip) => `<span>${chip}</span>`).join('')}</div>` : ''}
    <p class="pw-fact">Real case: the InSight lander shut down in 2022 when dust covered its solar panels. NASA tested a small fission reactor, Kilopower, in 2018: it makes power day and night, with no Sun. In the game it sits close to the base, so it adds radiation. Real ones stay far away or behind a heavy shield.</p>`;
}
