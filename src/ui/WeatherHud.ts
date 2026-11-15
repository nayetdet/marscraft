// @ts-nocheck
import { coldFraction, formatTempC } from '../data/marsWeather.ts';
import { pixelIconSvg } from './pixelIcons.ts';
import './styles/weather.css';

// Linha do clima no painel da base (issues #103 e #108): temperatura real la fora (InSight) e a
// poeira (tempestade ou paineis sujos). So escreve no DOM quando o texto muda.
export class WeatherHud {
  constructor() {
    this.tempEl = document.getElementById('res-weather-temp');
    this.dustEl = document.getElementById('res-weather-dust');
    this.tempFill = document.getElementById('res-weather-temp-fill');
    this.dustFill = document.getElementById('res-weather-dust-fill');
    const tempIcon = document.getElementById('res-weather-temp-icon');
    const dustIcon = document.getElementById('res-weather-dust-icon');
    if (tempIcon) tempIcon.innerHTML = pixelIconSvg('temperature');
    if (dustIcon) dustIcon.innerHTML = pixelIconSvg('dust');
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
    if (this.tempFill) this.tempFill.style.width = `${Math.round((1 - coldFraction(tempC)) * 100)}%`;
    if (this.dustFill) this.dustFill.style.width = `${Math.round(Math.max(0, Math.min(1, dust.panelDust)) * 100)}%`;
    let text = `${Math.round(dust.panelDust * 100)}%`;
    let tone = dust.panelDust >= 0.5 ? 'warn' : '';
    if (dust.phase === 'warning') { text = 'SOON'; tone = 'warn'; }
    else if (dust.phase === 'storm') { text = 'STORM'; tone = 'alert'; }
    if (text !== this._dust) {
      this._dust = text;
      this.dustEl.textContent = text;
      this.dustEl.title = dust.phase === 'warning' ? 'Dust storm coming' : dust.phase === 'storm' ? 'Dust storm in progress' : 'Dust on the solar panels';
    }
    if (tone !== this._tone) {
      this._tone = tone;
      this.dustEl.className = `res-value res-dust ${tone}`;
    }
  }
}
