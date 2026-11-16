// @ts-nocheck
import './styles/sleep.css';
import { getLanguage, translate } from './i18n.ts';

// Tela do sono no beliche (issue #109): escolha (ate o nascer do sol ou cochilo), tela escura
// com o relogio girando enquanto dorme e o card de uma linha ao acordar.
// So DOM: as regras ficam em src/player/sleep.js e o laco do sono no GameEngine.
export class SleepHud {
  constructor({ onChoose, onCancel }) {
    this.isOpen = false;

    this.panel = document.createElement('div');
    this.panel.id = 'sleep-panel';
    this.panel.className = 'sleep-panel hidden';
    this.panel.setAttribute('role', 'dialog');
    this.panel.setAttribute('aria-labelledby', 'sleep-title');
    this.panel.innerHTML = `
      <div class="sleep-card">
        <h2 id="sleep-title">Bunk</h2>
        <p class="sleep-note">Sleeping makes time pass fast. Your body still uses food and water. Life support has backup power, so an empty battery will not wake you. Critical alarms will.</p>
        <button type="button" class="mc-btn sleep-btn" data-sleep="sunrise"></button>
        <button type="button" class="mc-btn sleep-btn" data-sleep="nap"></button>
        <button type="button" class="mc-btn secondary sleep-btn" data-sleep="cancel">Stay awake</button>
      </div>`;
    document.body.appendChild(this.panel);
    const language = getLanguage();
    this.panel.querySelector('#sleep-title').textContent = translate('Bunk', language);
    this.panel.querySelector('.sleep-note').textContent = translate('Sleeping makes time pass fast. Your body still uses food and water. Life support has backup power, so an empty battery will not wake you. Critical alarms will.', language);
    this.panel.querySelector('[data-sleep="cancel"]').textContent = translate('Stay awake', language);
    this.sunriseBtn = this.panel.querySelector('[data-sleep="sunrise"]');
    this.napBtn = this.panel.querySelector('[data-sleep="nap"]');
    this.panel.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-sleep]');
      if (!button || button.disabled) return;
      const mode = button.dataset.sleep;
      if (mode === 'cancel') onCancel();
      else onChoose(mode);
    });
    window.addEventListener('keydown', (e) => {
      if (this.isOpen && e.code === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    });

    this.fade = document.createElement('div');
    this.fade.id = 'sleep-fade';
    this.fade.className = 'sleep-fade hidden';
    this.fade.innerHTML = `
      <div class="sleep-clock" aria-hidden="true"><span class="sleep-hand"></span></div>
      <div id="sleep-time" class="sleep-time"></div>
      <div class="sleep-label">${SLEEPING_LABEL}</div>`;
    document.body.appendChild(this.fade);
    this.timeEl = this.fade.querySelector('#sleep-time');
    this.labelEl = this.fade.querySelector('.sleep-label');

    this.card = document.createElement('div');
    this.card.id = 'sleep-wake-card';
    this.card.className = 'sleep-wake-card hidden';
    this.card.setAttribute('role', 'status');
    this.card.innerHTML = '<p class="sleep-wake-line"></p><p class="sleep-wake-fact"></p>';
    document.body.appendChild(this.card);
    this.cardLine = this.card.querySelector('.sleep-wake-line');
    this.cardFact = this.card.querySelector('.sleep-wake-fact');
  }

  // sunrise/nap = { hours, food, water }; sunrise.hours = 0 de dia (opcao desligada)
  openChooser({ sunrise, nap }) {
    const cost = ({ food, water }) => `food -${Math.round(food)}, water -${Math.round(water)}`;
    this.sunriseBtn.disabled = sunrise.hours <= 0;
    this.sunriseBtn.textContent = sunrise.hours > 0
      ? translate(`Sleep until sunrise (${formatHours(sunrise.hours)}: ${cost(sunrise)})`, getLanguage())
      : translate('Sleep until sunrise (only at night)', getLanguage());
    this.napBtn.textContent = translate(`Nap (${formatHours(nap.hours)}: ${cost(nap)})`, getLanguage());
    this.isOpen = true;
    this.panel.classList.remove('hidden');
  }

  closeChooser() {
    this.isOpen = false;
    this.panel.classList.add('hidden');
  }

  // `label`: o que a tela escura diz (dormindo, ou esperando a tempestade no abrigo, issue #228)
  showSleeping(timeText, hoursSlept, label = SLEEPING_LABEL) {
    this.fade.classList.remove('hidden');
    this.timeEl.textContent = timeText;
    const localizedLabel = translate(label, getLanguage());
    if (this.labelEl.textContent !== localizedLabel) this.labelEl.textContent = localizedLabel;
    // O ponteiro da uma volta inteira a cada 12 h de jogo
    this.fade.style.setProperty('--sleep-turn', `${hoursSlept * 30}deg`);
  }

  hideSleeping() {
    this.fade.classList.add('hidden');
  }

  showWakeCard(line, fact = '') {
    this.cardLine.textContent = translate(line, getLanguage());
    this.cardFact.textContent = translate(fact, getLanguage());
    this.cardFact.classList.toggle('hidden', !fact);
    this.card.classList.remove('hidden');
    clearTimeout(this._cardTimer);
    this._cardTimer = setTimeout(() => this.card.classList.add('hidden'), fact ? 14000 : 7000);
  }
}

const SLEEPING_LABEL = 'Sleeping... zzz';

function formatHours(hours) {
  const total = Math.round(hours * 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}
