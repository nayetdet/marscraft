// @ts-nocheck
// Textos da missao para a UI (em ingles, para criancas de 7 a 12 anos)
import { DOSE_CONFIG, RADIATION_CONFIG } from '../config/constants.ts';
import { DOSE_EXPLAINER } from './doseBudget.ts';

// "2026-11-05T20:00Z" ou "2026-11-14" -> "05/11/2026"
export function formatDateDMY(iso) {
  const [year, month, day] = iso.slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
}

// Horas de jogo -> "2h 05m"
export function formatHours(hours) {
  const totalMinutes = Math.max(0, Math.round(hours * 60));
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

export function formatDose(msv) {
  if (msv < 1) return `${msv.toFixed(2)} mSv`;
  if (msv < 10) return `${msv.toFixed(1)} mSv`;
  return `${Math.round(msv)} mSv`;
}

// Horario local "HH:MM" de um instante ISO (hora em que o fetch ao vivo funcionou)
export function formatClockHM(iso) {
  const date = new Date(iso);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

// Origem dos dados de clima espacial (issue #100). `source` e o objeto de src/data/spaceWeather.js
// ({ live, fetchedAt }) ou so a data de coleta do JSON embutido (texto ISO).
// "LIVE" so aparece quando o fetch ao vivo funcionou; senao, "real data from DD/MM/AAAA".
export function donkiLabel(source) {
  if (source && typeof source === 'object') {
    return source.live ? `LIVE from NASA DONKI, fetched ${formatClockHM(source.fetchedAt)}` : `real data from ${formatDateDMY(source.fetchedAt)}`;
  }
  return `real data from ${formatDateDMY(source)}`;
}

// Credito completo: "NASA DONKI, real data from DD/MM/AAAA" ou "LIVE from NASA DONKI, fetched HH:MM"
export function donkiCredit(source) {
  const label = donkiLabel(source);
  return label.startsWith('LIVE') ? label : `NASA DONKI, ${label}`;
}

// Nave que mediu a SEP, para a crianca: "STEREO A" ou "GOES-19 and STEREO A"
function sepSeenBy(sep) {
  return sep.seenBy?.length ? sep.seenBy.join(' and ') : 'NASA spacecraft';
}

// Tempestade do polling ao vivo (`storm.live`): o evento esta acontecendo agora na vida real, e
// a fonte e o fetch que a trouxe (`storm.source`), nao o dado do inicio da partida.
export function stormSourceText(storm, source) {
  const credit = donkiCredit(storm.source ?? source);
  const basis = storm.live ? 'Happening right now in real life:' : 'Based on';
  if (storm.sep) {
    return `${basis} a real burst of fast particles (an SEP) seen on ${formatDateDMY(storm.sep.eventTime)} by ${sepSeenBy(storm.sep)} (${credit})`;
  }
  return `${basis} a real CME that left the Sun on ${formatDateDMY(storm.cme.startTime)} at ${Math.round(storm.cme.speedKmS)} km/s, headed to Mars (${credit})`;
}

// Quando a NASA previu que a CME chegaria a Marte (modelo WSA-ENLIL, vem junto no DONKI)
export function stormArrivalText(storm) {
  if (storm.sep) return 'Fast particles fly almost as fast as light, so the warning is very short';
  return `NASA's model said it would reach Mars on ${formatDateDMY(storm.cme.marsArrivalTime)}`;
}

export const NO_STORM_DATA_TEXT = 'No storms headed to Mars in this data.';

// Computador da missao: a mesma tempestade que o HUD mostra (aviso ou ativa), com a fonte.
// Em calmaria nao adianta a proxima da fila: o aviso so existe depois que a CME sai do Sol.
// `source`: origem dos dados (veja donkiLabel). `noStormData` = os dados nao tem nenhuma CME com destino a Marte (MissionSystem.noStormData).
export function stormStatusText(state, source, noStormData = false) {
  const { phase, storm, hoursUntil, hoursLeft } = state;
  if (noStormData) return `SOLAR STORM: ${NO_STORM_DATA_TEXT}`;
  if (phase === 'active') {
    return `SOLAR STORM: ACTIVE, ${formatHours(hoursLeft)} left.\n${stormSourceText(storm, source)}.`;
  }
  if (phase === 'warning') {
    return `SOLAR STORM: on the way, reaches Mars in ${formatHours(hoursUntil)} of game time.\n${stormArrivalText(storm)}. ${stormSourceText(storm, source)}.`;
  }
  return 'SOLAR STORM: none on the way right now.';
}

// Computador da missao: dose na mesma unidade do resto do jogo (mSv)
export function radiationStatusText({ doseRate, totalDoseMsv }) {
  return `RADIATION NOW: ${formatDose(doseRate)} per hour\n` +
    `DOSE SO FAR: ${formatDose(totalDoseMsv)} (NASA career limit: ${RADIATION_CONFIG.CAREER_LIMIT_MSV} mSv)\n` +
    `${DOSE_EXPLAINER} The trip from Earth already used most of it.\n` +
    'Measured on Mars by the Curiosity rover (NASA RadLab). GAME SCALE: each game hour adds the dose of about ' +
    `${DOSE_CONFIG.GAME_FACTOR} days on Mars.`;
}

// Depois da tempestade do tutorial, o jogo so solta tempestade quando ha uma de verdade agora
function afterTutorialStorm(storm) {
  return storm?.scripted ? ' From now on, a storm comes only when NASA sees a real one heading to Mars.' : '';
}

export function stormEventMessage(event, source) {
  const { type, storm } = event;
  switch (type) {
    case 'storm-warning':
      if (storm.sep) {
        return `RADIATION ALERT! The Sun shot out super fast particles (an SEP, solar energetic particles). ${stormArrivalText(storm)}: they hit in ${formatHours(event.hoursUntil ?? storm.leadHours)}. Hide in the storm shelter now! ${stormSourceText(storm, source)}.`;
      }
      return `Solar storm coming! The Sun threw out a giant cloud of particles (a CME). ${stormArrivalText(storm)}: in the game that is ${formatHours(event.hoursUntil ?? storm.leadHours)} from now. ${stormSourceText(storm, source)}.`;
    case 'storm-start':
      return 'SOLAR STORM! Radiation is much higher than normal. Stand in the storm shelter with water in its wall, or use the Shield Remote to turn on the shield.';
    case 'storm-survived':
      return `The solar storm is over. You made it!${afterTutorialStorm(storm)}`;
    case 'storm-failed':
      return `The solar storm is over, but you fainted during it. Next time, hide before it hits.${afterTutorialStorm(storm)}`;
    case 'storm-missed':
      return `A solar storm passed while the game was paused.${afterTutorialStorm(storm)}`;
    case 'shield-off-no-energy':
      return 'The radiation shield turned off: the battery is empty.';
    case 'sunset-soon':
      return `Sunset soon: the solar panels stop at 18:00. Battery at ${Math.round(event.batteryPct ?? 0)}%. Charge it before night, and turn off the fuel factory if it is low.`;
    case 'propellant-full':
      return 'The MAV fuel tank is full!';
    default:
      return '';
  }
}

// Boletins do DONKI (issue #100): o tipo vira uma explicacao curta para criancas.
// O texto inteiro do boletim e longo e tecnico; o terminal so mostra esta linha e o link.
const BULLETIN_TYPES = {
  CME: 'CME (a giant cloud of particles from the Sun)',
  SEP: 'SEP (super fast particles from the Sun)',
  FLR: 'solar flare (a flash of light from the Sun)',
  GST: 'magnetic storm at Earth',
  RBE: 'more radiation around Earth',
  IPS: 'shock wave in space',
  HSS: 'fast solar wind',
  MPC: "solar wind pushed into Earth's magnetic bubble",
  Report: 'weekly space weather report',
};

// "NASA space weather bulletin, 14/11: CME (...)". So existe com dado ao vivo.
export function bulletinText(bulletin) {
  if (!bulletin) return '';
  const day = formatDateDMY(bulletin.issueTime).slice(0, 5);
  return `NASA space weather bulletin, ${day}: ${BULLETIN_TYPES[bulletin.type] ?? bulletin.type}`;
}
