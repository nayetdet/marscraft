// @ts-nocheck
import { DOSE_CONFIG, RADIATION_CONFIG } from '../config/constants.ts';
import { missionDoseMsvPerHour } from './radiation.ts';

// Dose de radiacao acumulada como orcamento da missao (issue #104). Logica pura e textos.
// A barra comeca com a dose da viagem ate Marte e so sobe: nada apaga uma dose.

// [Ref] 203 dias x 1,8 mSv por dia (Curiosity RAD dentro da nave) = ~365 mSv
export const TRANSIT_DOSE_MSV = DOSE_CONFIG.TRANSIT_DAYS * DOSE_CONFIG.TRANSIT_MSV_PER_DAY;
export const DOSE_LIMIT_MSV = RADIATION_CONFIG.CAREER_LIMIT_MSV;

// A frase que explica "dose" para criancas de 7 a 12 anos
export const DOSE_EXPLAINER = 'Dose is how much radiation your body has collected. It only goes up.';

// De onde veio a dose: viagem, saidas em dia calmo, tempestades (dentro ou fora), dentro da base
// e o reator de fissao ligado (regra do jogo, DOSE_CONFIG.REACTOR_MSV_PER_HOUR)
export const DOSE_SOURCES = ['transit', 'eva', 'storm', 'habitat', 'reactor'];

export function createDoseLedger() {
  return { transit: TRANSIT_DOSE_MSV, eva: 0, storm: 0, habitat: 0, reactor: 0 };
}

// Onde somar a dose deste trecho de tempo
export function doseSourceFor({ stormActive, insideHabitat }) {
  if (stormActive) return 'storm';
  return insideHabitat ? 'habitat' : 'eva';
}

// Retrato da dose para telas e para o boletim final (#90)
export function doseBreakdown(ledger) {
  const reactor = ledger.reactor ?? 0;
  const total = ledger.transit + ledger.eva + ledger.storm + ledger.habitat + reactor;
  return {
    transit: ledger.transit,
    eva: ledger.eva,
    storm: ledger.storm,
    habitat: ledger.habitat,
    reactor,
    total,
    limit: DOSE_LIMIT_MSV,
    fraction: total / DOSE_LIMIT_MSV,
    grounded: total >= DOSE_LIMIT_MSV,
  };
}

export function doseTone(totalMsv) {
  if (totalMsv >= DOSE_LIMIT_MSV) return 'danger';
  if (totalMsv >= DOSE_LIMIT_MSV * DOSE_CONFIG.WARN_FRACTION) return 'warn';
  return 'ok';
}

// Dose que entra na barra parado dentro da base, em dia calmo. Acima disso (la fora, tempestade)
// o HUD mostra a seta de subida na linha da dose.
const HABITAT_CALM_RATE = missionDoseMsvPerHour({ insideHabitat: true });
export function doseClimbingFast(missionDoseRate) {
  return missionDoseRate > HABITAT_CALM_RATE * 1.5;
}

// Porcentagem inteira do limite de carreira (a barra do HUD)
export function dosePercent(totalMsv) {
  return Math.floor((totalMsv / DOSE_LIMIT_MSV) * 100);
}

const msv = (value) => `${Math.round(value)} mSv`;

// Porta externa do airlock: a medica de voo proibe novas saidas do comandante acima do limite.
// So a caminhada final ate o foguete pronto para decolar continua liberada.
export function evaBlockMessage({ grounded, mavReady }) {
  if (!grounded || mavReady) return null;
  return 'Flight doctor: your radiation dose is over the NASA limit. No more walks outside! ' +
    'Use the rover for ice and let your crew run the base.';
}

// Quantos blocos de gelo do MAV a cacamba do rover consegue entregar agora
export function roverMavBlocks(cargoKg, iceNeeded) {
  const blocks = Math.floor(cargoKg / DOSE_CONFIG.ROVER_ICE_KG_PER_MAV_BLOCK + 1e-9);
  return Math.max(0, Math.min(blocks, iceNeeded));
}

// Enfermaria: o historico da dose
export function doseHistoryText(b) {
  return `RADIATION DOSE: ${msv(b.total)} of ${msv(b.limit)} (NASA career limit)\n` +
    `${DOSE_EXPLAINER}\n` +
    'WHERE YOUR DOSE CAME FROM:\n' +
    `  Trip from Earth: ${msv(b.transit)}\n` +
    `  Walks outside: ${msv(b.eva)}\n` +
    `  Solar storms: ${msv(b.storm)}\n` +
    `  Inside the base: ${msv(b.habitat)}` +
    (b.reactor > 0 ? `
  Fission reactor: ${msv(b.reactor)}` : '') +
    (b.grounded ? '\nFLIGHT DOCTOR: no more walks outside for you.' : '');
}

// Linhas da tela de vitoria
export function doseVictoryRows(b) {
  return [
    ['Radiation dose you got', `${msv(b.total)}, ${b.grounded ? 'over' : 'under'} the NASA limit of ${msv(b.limit)}`],
    ['Where your dose came from', `Trip ${Math.round(b.transit)}, outside ${Math.round(b.eva)}, storms ${Math.round(b.storm)}, in base ${msv(b.habitat)}${b.reactor > 0 ? `, reactor ${msv(b.reactor)}` : ''}`],
  ];
}

// Avisos da medica de voo (eventos do MissionSystem)
export function doseEventMessage(type) {
  if (type === 'dose-warning') {
    return `Flight doctor: your radiation dose is almost at the NASA limit (${DOSE_LIMIT_MSV} mSv). ` +
      'Every walk outside adds more. Stay in the shelter during storms.';
  }
  if (type === 'dose-limit') {
    return `Flight doctor: your dose passed the NASA limit of ${DOSE_LIMIT_MSV} mSv. You cannot go outside anymore. ` +
      'Park the rover at the rocket pad and press DRILL to load its ice. Your crew runs the base.';
  }
  return null;
}
