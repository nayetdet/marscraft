// @ts-nocheck
import { formatTempC } from '../data/marsWeather.ts';

// Textos do clima de Marte (issues #103 e #108): UI em ingles, para criancas de 7 a 12 anos,
// sem emoji. Rotulo honesto: o clima do InSight e sempre "real data", nunca "today" nem "live".

export const DUST_DANGER_TEXT =
  'Mars air is too thin to push you over. The danger is the dust: it blocks the Sun and covers the solar panels.';

const STATION_SOURCE = 'Base weather station (like MEDA on NASA Perseverance). Storm timing is a game rule.';

// Card do Controle da Missao quando a estacao do tempo ve a frente de poeira
export const DUST_WARNING_CARD = {
  title: 'DUST STORM COMING',
  lines: [
    { icon: 'sun', text: 'Dust will hide the Sun' },
    { icon: 'bolt', text: 'Solar panels make less power' },
    { icon: 'down', text: 'Turn off what you do not need' },
  ],
  source: STATION_SOURCE,
};

// Toast de cada mudanca de fase (eventos do DustWeather)
export function dustEventMessage(type) {
  if (type === 'dust-warning') return `Dust storm coming! ${DUST_DANGER_TEXT}`;
  if (type === 'dust-start') return 'The dust storm is here: the sky goes dark and the solar panels make much less power. Save energy!';
  if (type === 'dust-clearing') return 'The dust storm is fading. The Sun is coming back, but the panels are covered in dust: clean them at the solar field.';
  if (type === 'dust-end') return 'Clear sky again. Check the solar panels for dust.';
  return null;
}

// Por que a geracao caiu, numa frase curta (sala de energia e tela do comando)
export function solarReason({ night, phase, panelDust }) {
  if (night) return 'night: no sun';
  if (phase === 'storm') return 'dust storm hides the Sun';
  if (phase === 'clearing') return 'dust storm fading';
  if (panelDust >= 0.3) return 'dust on the panels';
  return 'clear sky';
}

// Linha da tela do comando sobre a poeira
export function dustStatus({ phase, hoursUntilStorm, solarFactor }) {
  if (phase === 'warning') return { value: `DUST STORM IN ${Math.max(1, Math.round(hoursUntilStorm * 60))} MIN`, tone: 'warn' };
  if (phase === 'storm') return { value: `DUST STORM: SUN ${Math.round(solarFactor * 100)}%`, tone: 'alert' };
  if (phase === 'clearing') return { value: 'DUST SETTLING', tone: 'warn' };
  return { value: 'CLEAR SKY', tone: 'ok' };
}

// Relatorio do tempo no nascer do Sol. `weather`: solWeather() do sol atual;
// `windCleaned`: poeira (0 a 1) que a rajada tirou dos paineis; `dustPhase`: fase da poeira.
export function weatherReportCard({ weather, windCleaned = 0, dustPhase = 'clear' }) {
  let advice = { icon: 'bolt', text: 'Cold night ahead: keep battery for the heater' };
  if (dustPhase === 'warning' || dustPhase === 'storm') {
    advice = { icon: 'sun', text: 'Dust storm: less sun, save power' };
  } else if (windCleaned > 0) {
    advice = { icon: 'sun', text: `Strong wind blew ${Math.round(windCleaned * 100)}% of the dust off the panels` };
  }
  return {
    title: 'WEATHER TODAY',
    lines: [
      { icon: 'moon', text: `Low ${formatTempC(weather.minC)}, high ${formatTempC(weather.maxC)}` },
      { icon: 'air', text: `Wind gusts ${Math.round(weather.gustMs)} m/s` },
      advice,
    ],
    source: `Real data: NASA InSight lander, sol ${weather.sol} (${weather.date}), Elysium Planitia`,
  };
}
