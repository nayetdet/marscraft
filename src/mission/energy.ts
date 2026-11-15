// @ts-nocheck
import { ENERGY_CONFIG, MISSION_CONFIG } from '../config/constants.ts';

// Altura do Sol de 0 (horizonte ou noite) a 1 (a pino), no mesmo ciclo do MarsSkySystem
export function sunElevation(timeOfDay) {
  const angle = ((timeOfDay - MISSION_CONFIG.SUNRISE_HOUR) / 24) * Math.PI * 2;
  return Math.max(0, Math.sin(angle));
}

// % de bateria por hora de jogo gerados pelos paineis solares.
// `weatherFactor`: fracao que sobra com a poeira no ar e nos paineis (dustWeather.js, issue #103)
export function solarChargePerHour(timeOfDay, weatherFactor = 1) {
  return (
    ENERGY_CONFIG.PANEL_PEAK_CHARGE_EARTH_PER_HOUR *
    ENERGY_CONFIG.MARS_SUNLIGHT_FRACTION *
    sunElevation(timeOfDay) *
    weatherFactor
  );
}

// Fluxo liquido da bateria (% por hora de jogo) suavizado, para o HUD mostrar "+4/h" sem
// tremer a cada quadro (issue #85). `windowHours` = quanto tempo de jogo a media cobre.
// Gastos de uma vez (plantar, enviar dados, o controle de demo) dariam picos de milhares de %/h:
// a taxa de cada quadro fica limitada a NET_RATE_LIMIT, o maximo que a base gera ou gasta.
export const NET_RATE_LIMIT = 60;
export function smoothNetRate(previous, deltaPct, deltaHours, windowHours = 0.3) {
  if (!(deltaHours > 0)) return previous;
  const rate = Math.max(-NET_RATE_LIMIT, Math.min(NET_RATE_LIMIT, deltaPct / deltaHours));
  if (previous === null || previous === undefined) return rate;
  const k = Math.min(1, deltaHours / windowHours);
  return previous + (rate - previous) * k;
}

export class Battery {
  constructor(charge = ENERGY_CONFIG.START_CHARGE, capacity = ENERGY_CONFIG.BATTERY_CAPACITY) {
    this.capacity = capacity;
    this.charge = Math.min(capacity, Math.max(0, charge));
    // Energia do RTG reservada ao suporte de vida (issue #85), na mesma unidade da carga.
    // Nao entra em `charge`: fabrica, blindagem e luzes nao podem usar.
    this.lifeSupportCredit = 0;
  }

  // O RTG entrega `amount` ao suporte de vida; o que passar de `max` guardado e perdido
  addLifeSupportPower(amount, max) {
    this.lifeSupportCredit = Math.min(max, this.lifeSupportCredit + Math.max(0, amount));
  }

  // Suporte de vida (ar): usa primeiro o RTG e depois a bateria. Devolve quanto saiu.
  drainLifeSupport(amount) {
    const need = Math.max(0, amount);
    const fromRtg = Math.min(this.lifeSupportCredit, need);
    this.lifeSupportCredit -= fromRtg;
    return fromRtg + this.drain(need - fromRtg);
  }

  // Energia que o suporte de vida pode usar agora
  get lifeSupportAvailable() {
    return this.charge + this.lifeSupportCredit;
  }

  // Devolve quanto realmente entrou (a bateria cheia desperdica o resto)
  add(amount) {
    const added = Math.min(this.capacity - this.charge, Math.max(0, amount));
    this.charge += added;
    return added;
  }

  // Tudo ou nada: so gasta se tiver o valor inteiro
  spend(amount) {
    if (this.charge + 1e-9 < amount) return false;
    this.charge = Math.max(0, this.charge - amount);
    return true;
  }

  // Gasta o que der e devolve quanto saiu
  drain(amount) {
    const drained = Math.min(this.charge, Math.max(0, amount));
    this.charge -= drained;
    return drained;
  }

  get percent() {
    return (this.charge / this.capacity) * 100;
  }
}
