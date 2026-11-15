import { formatTempC } from '../data/marsWeather.js';
import './styles/weather.css';

// Linha do clima no painel da base (issues #103 e #108): temperatura real la fora (InSight) e a
// poeira (tempestade ou paineis sujos). So escreve no DOM quando o texto muda.
export class WeatherHud {
  constructor() {
    this.tempEl = document.getElementById('res-weather-temp');
    this.dustEl = document.getElementById('res-weather-dust');
    this._temp = '';
    this._dust = '';
    this._tone = '';
  }

  // `tempC`: ar la fora; `dust`: DustWeather
  update(tempC, dust) {
    if (!this.tempEl || !this.dustEl) return;
    const temp = formatTempC(tempC);
    if (temp !== this._temp) {
      this._temp = temp;
      this.tempEl.textContent = temp;
    }
    let text = `PANEL DUST ${Math.round(dust.panelDust * 100)}%`;
    let tone = dust.panelDust >= 0.5 ? 'warn' : '';
    if (dust.phase === 'warning') { text = 'DUST STORM COMING'; tone = 'warn'; }
    else if (dust.phase === 'storm') { text = 'DUST STORM'; tone = 'alert'; }
    if (text !== this._dust) {
      this._dust = text;
      this.dustEl.textContent = text;
    }
    if (tone !== this._tone) {
      this._tone = tone;
      this.dustEl.className = `res-dust ${tone}`;
    }
  }
}
