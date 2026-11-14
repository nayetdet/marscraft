import { ENERGY_CONFIG, MISSION_CONFIG } from '../config/constants.js';

// Altura do Sol de 0 (horizonte ou noite) a 1 (a pino), no mesmo ciclo do MarsSkySystem
export function sunElevation(timeOfDay) {
  const angle = ((timeOfDay - MISSION_CONFIG.SUNRISE_HOUR) / 24) * Math.PI * 2;
  return Math.max(0, Math.sin(angle));
}

// % de bateria por hora de jogo gerados pelos paineis solares
export function solarChargePerHour(timeOfDay) {
  return (
    ENERGY_CONFIG.PANEL_PEAK_CHARGE_EARTH_PER_HOUR *
    ENERGY_CONFIG.MARS_SUNLIGHT_FRACTION *
    sunElevation(timeOfDay)
  );
}

export class Battery {
  constructor(charge = ENERGY_CONFIG.START_CHARGE, capacity = ENERGY_CONFIG.BATTERY_CAPACITY) {
    this.capacity = capacity;
    this.charge = Math.min(capacity, Math.max(0, charge));
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
