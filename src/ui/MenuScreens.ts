// @ts-nocheck
import { MARS_TERRAIN, formatCoords } from '../data/marsTerrain.ts';
import { formatDateDMY } from '../mission/missionText.ts';

// Telas extras do menu: "NASA Data" (fontes dos dados) e "Demo Controls" (atalhos para jurados).
// O menu principal e as telas trocam de lugar com a classe `hidden`, como a tela de controles.
export class MenuScreens {
  constructor({ donkiDate, onDemo }) {
    const menuMain = document.getElementById('menu-main');
    const feedback = document.getElementById('demo-feedback');
    this.setDonkiSource(`Real data from ${donkiDate}`);
    document.getElementById('sources-terrain-coords').textContent = formatCoords(MARS_TERRAIN.centerLat, MARS_TERRAIN.centerLonE);
    document.getElementById('sources-terrain-date').textContent = formatDateDMY(MARS_TERRAIN.fetched);

    const bind = (name) => {
      const screen = document.getElementById(`${name}-screen`);
      document.getElementById(`${name}-btn`).addEventListener('click', () => {
        menuMain.classList.add('hidden');
        screen.classList.remove('hidden');
        menuMain.closest('.mc-menu-card').parentElement.closest('.mc-overlay').classList.add('menu-info-open');
      });
      document.getElementById(`${name}-back-btn`).addEventListener('click', () => {
        screen.classList.add('hidden');
        menuMain.classList.remove('hidden');
        menuMain.closest('.mc-menu-card').parentElement.closest('.mc-overlay').classList.remove('menu-info-open');
      });
      return screen;
    };
    bind('sources');
    bind('demo').addEventListener('click', (event) => {
      const action = event.target.closest('[data-demo]')?.dataset.demo;
      if (action) feedback.textContent = onDemo(action);
    });
    this.shadersBtn = document.getElementById('shaders-btn');
  }

  // Botao "Shaders: On/Off" do menu (sombra do Sol, brilho e raios de luz). Vale no mouse e no toque.
  bindShaders({ enabled, onToggle }) {
    this.setShadersEnabled(enabled);
    this.shadersBtn.addEventListener('click', () => onToggle());
  }

  setShadersEnabled(enabled) {
    this.shadersBtn.textContent = `Shaders: ${enabled ? 'On' : 'Off'}`;
    this.shadersBtn.setAttribute('aria-pressed', String(enabled));
  }

  // Origem dos dados de tempestade na tela "NASA Data": "Real data from DD/MM/AAAA" ou, depois de
  // um fetch ao vivo que funcionou, "LIVE from NASA DONKI, fetched HH:MM" (issue #100)
  setDonkiSource(label) {
    document.getElementById('sources-donki-date').textContent = label;
  }
}
