import { COMMS_CONFIG as C } from '../config/constants.js';
import { earthMarsGeometry } from './earthMars.js';

// Radio entre a base e a Terra (issue #56, A2). Sem DOM, para testar com Vitest.
// - A data do jogo comeca na data real de hoje e anda 1,0275 dia da Terra por sol.
// - O atraso vem da distancia Terra-Marte calculada para essa data (orbitas do JPL).
// - Conjuncao solar: radio mudo. Acontece de verdade quando o Sol esta a < 2 graus de Marte
//   no ceu da Terra; como a proxima real e so em 2028, o jogo encena uma por partida.
export class CommsLink {
  constructor({ startDate = new Date(), startHours = 0 } = {}) {
    this.startDate = startDate;
    this.startHours = startHours;
    this.conjunctionStart = startHours + C.GAME_CONJUNCTION_START_HOURS;
    this.conjunctionEnd = this.conjunctionStart + C.GAME_CONJUNCTION_HOURS;
    this._lastDay = null;
    this.update(startHours);
  }

  update(hours) {
    this.hours = hours;
    const days = ((hours - this.startHours) / 24) * C.EARTH_DAYS_PER_SOL;
    const day = Math.floor(days * 24); // recalcula a geometria uma vez por hora da Terra
    if (day !== this._lastDay) {
      this._lastDay = day;
      this.date = new Date(this.startDate.getTime() + days * 86400000);
      Object.assign(this, earthMarsGeometry(this.date));
    }
    this.realConjunction = this.sunAngleDeg < C.CONJUNCTION_SUN_ANGLE_DEG;
    this.simulatedConjunction = hours >= this.conjunctionStart && hours < this.conjunctionEnd;
    this.blackout = this.realConjunction || this.simulatedConjunction;
  }

  get hoursUntilConjunction() {
    return Math.max(0, this.conjunctionStart - this.hours);
  }

  get blackoutHoursLeft() {
    return Math.max(0, this.conjunctionEnd - this.hours);
  }

  // Espera do jogo, em segundos reais, para a pergunta ir e a resposta voltar
  get roundTripGameSeconds() {
    return 2 * this.lightMinutes * C.GAME_SECONDS_PER_LIGHT_MINUTE;
  }

  // Painel de admin: comeca ou termina a conjunção encenada agora
  forceConjunction(on) {
    if (on) {
      this.conjunctionStart = this.hours;
      this.conjunctionEnd = this.hours + C.GAME_CONJUNCTION_HOURS;
    } else {
      this.conjunctionEnd = Math.min(this.conjunctionEnd, this.hours);
    }
    this.update(this.hours);
  }
}
