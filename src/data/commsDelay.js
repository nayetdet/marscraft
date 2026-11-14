// Distancia Terra-Marte e atraso de radio REAIS de uma data fixa (dado embutido, nunca "ao vivo").
// Fonte: NASA JPL Horizons (https://ssd.jpl.nasa.gov/horizons/), alvo Marte (499) visto do
// geocentro (500@399), quantidade 20 (distancia do observador), 2026-11-14 00:00 UT:
// 1,32436 UA. Coletado em 2026-11-14.
const AU_KM = 149597870.7;
const LIGHT_SPEED_KM_S = 299792.458;

const distanceAu = 1.32436;
const distanceKm = distanceAu * AU_KM;
const oneWayMinutes = distanceKm / LIGHT_SPEED_KM_S / 60;

export const COMMS_DELAY = Object.freeze({
  date: '2026-11-14',
  distanceAu,
  distanceMillionKm: Math.round(distanceKm / 1e5) / 10, // 198,1
  oneWayMinutes: Math.round(oneWayMinutes), // 11
  roundTripMinutes: Math.round(oneWayMinutes * 2), // 22
  source: 'NASA JPL Horizons',
  url: 'https://ssd.jpl.nasa.gov/horizons/',
});
