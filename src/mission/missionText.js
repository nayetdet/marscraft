// Textos da missao para a UI (em ingles, para criancas de 7 a 12 anos)

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

export function stormSourceText(storm, fetchedIso) {
  return `Based on a real CME seen on ${formatDateDMY(storm.cme.startTime)} at ${Math.round(storm.cme.speedKmS)} km/s (NASA DONKI, real data from ${formatDateDMY(fetchedIso)})`;
}

export function stormEventMessage(event, fetchedIso) {
  const { type, storm } = event;
  switch (type) {
    case 'storm-warning':
      return `Solar storm coming! The Sun threw out a cloud of fast particles (a CME). It reaches Mars in ${formatHours(storm.leadHours)}. ${stormSourceText(storm, fetchedIso)}.`;
    case 'storm-start':
      return 'SOLAR STORM! Radiation is very high. Stand in the storm shelter inside the base, or use the Shield Remote to turn on the shield.';
    case 'storm-survived':
      return 'The solar storm is over. You made it!';
    case 'storm-failed':
      return 'The solar storm is over, but you fainted during it. It does not count for the MAV.';
    case 'storm-missed':
      return 'A solar storm passed while the game was paused. It does not count for the MAV.';
    case 'shield-off-no-energy':
      return 'The radiation shield turned off: the battery is empty.';
    case 'propellant-full':
      return 'The MAV fuel tank is full!';
    default:
      return '';
  }
}
