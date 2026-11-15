import { MAV_CONFIG } from '../config/constants.js';
import { missionStatus } from './missionCards.js';
import { pixelIconSvg } from './pixelIcons.js';

// So escreve no DOM quando a classe ou o texto mudam (o update roda a cada frame)
function setClass(el, className) {
  if (el._cls !== className) {
    el._cls = className;
    el.className = className;
  }
}

function setIcon(el, name) {
  if (el._icon === name) return;
  el._icon = name;
  el.innerHTML = pixelIconSvg(name);
}

function setWidth(el, pct) {
  const width = `${Math.round(Math.max(0, Math.min(100, pct)))}%`;
  if (el._width !== width) {
    el._width = width;
    el.style.width = width;
  }
}

function setText(el, text, className) {
  if (el._text !== text) {
    el._text = text;
    el.textContent = text;
  }
  if (className !== undefined) setClass(el, className);
}

export class MissionHud {
  constructor({ donkiFetched, onLoadIce, onToggleFactory, onIgnite, onClose }) {
    this.donkiFetched = donkiFetched;
    const $ = (id) => document.getElementById(id);

    this.rows = {
      power: this._row($('res-power')),
      water: this._row($('res-water')),
      air: this._row($('res-air')),
      radiation: this._row($('res-radiation')),
    };
    this.levelEls = [...$('res-radiation').querySelectorAll('.res-levels i')];
    this.alerts = [this._alert($('mission-alerts')), this._alert($('mission-alerts'))];

    this.mavOverlayEl = $('mav-overlay');
    this.mavOverallEl = $('mav-overall');
    this.fuelPctEl = $('mav-fuel-pct');
    this.fuelFillEl = $('mav-fuel-fill');
    this.fuelStatusEl = $('mav-fuel-status');
    this.loadOneBtn = $('mav-load-one');
    this.loadAllBtn = $('mav-load-all');
    this.factoryBtn = $('mav-factory');
    this.stormsEl = $('mav-storms');
    this.dataEl = $('mav-data');
    this.mavPowerEl = $('mav-power');
    this.igniteBtn = $('mav-ignite');

    this.victoryOverlayEl = $('victory-overlay');
    this.victorySummaryEl = $('victory-summary');
    this.victorySourcesEl = $('victory-sources');

    this.isMavPanelOpen = false;
    this.isVictoryShown = false;

    this.loadOneBtn.addEventListener('click', () => onLoadIce(1));
    this.loadAllBtn.addEventListener('click', () => onLoadIce(Infinity));
    this.factoryBtn.addEventListener('click', () => onToggleFactory());
    this.igniteBtn.addEventListener('click', () => onIgnite());
    $('mav-close').addEventListener('click', () => onClose());
    $('play-again-btn').addEventListener('click', () => window.location.reload());
  }

  // Guarda os nos de uma linha do painel e desenha o icone uma vez
  _row(root) {
    const row = {
      root,
      icon: root.querySelector('.res-icon'),
      value: root.querySelector('.res-value'),
      fill: root.querySelector('.res-fill'),
      trend: root.querySelector('.res-trend'),
      key: root.querySelector('.res-key'),
      delta: root.querySelector('.res-delta'),
    };
    setIcon(row.icon, root.dataset.icon);
    return row;
  }

  // Cartao de alerta pre-criado (no maximo dois); so troca texto e classe
  _alert(container) {
    const root = document.createElement('div');
    root.className = 'mission-alert hidden';
    root.innerHTML = `
      <span class="alert-icon"></span>
      <div class="alert-body">
        <div class="alert-title"></div>
        <div class="alert-text"></div>
        <div class="alert-timer"><i></i></div>
        <div class="alert-source"></div>
      </div>`;
    container.appendChild(root);
    return {
      root,
      icon: root.querySelector('.alert-icon'),
      title: root.querySelector('.alert-title'),
      text: root.querySelector('.alert-text'),
      timer: root.querySelector('.alert-timer'),
      timerFill: root.querySelector('.alert-timer i'),
      source: root.querySelector('.alert-source'),
    };
  }

  // `survival` traz a agua da base e `stations` o ar do habitat (CO2, poeira)
  update(mission, { survival, stations, world } = {}) {
    const view = missionStatus(mission, this.donkiFetched, {
      water: survival?.baseWater,
      maxWater: survival?.maxBaseWater,
      hydration: survival?.greenhouseHydration,
      co2: stations?.co2,
      baseOxygen: survival?.baseOxygen,
      contaminated: stations?.contaminated,
      brokenWindows: world?.brokenBaseWindows.size ?? 0,
    });
    const { power, water, air, radiation } = this.rows;

    setClass(power.root, `res-row ${view.power.tone}`);
    setText(power.value, `${view.power.pct}%`);
    setWidth(power.fill, view.power.pct);
    setIcon(power.trend, view.power.trend);
    setClass(power.trend, `res-trend ${view.power.trend}`);
    power.trend.title = view.power.trend === 'up' ? 'The Sun is charging the battery' : 'Night: no sun, the battery goes down';

    setClass(water.root, `res-row ${view.water.tone}`);
    setText(water.value, `${view.water.liters} L`);
    setWidth(water.fill, view.water.pct);
    // Estufa seca: plantinha murcha no lugar da seta
    setClass(water.trend, `res-trend ${view.water.greenhouseDry ? 'dry' : ''}`);
    if (view.water.greenhouseDry) setIcon(water.trend, 'plant');
    else if (water.trend._icon) {
      water.trend._icon = null;
      water.trend.innerHTML = '';
    }
    this._showWaterDelta(water, survival?.baseWater);

    setClass(air.root, `res-row ${view.air.tone}`);
    setText(air.value, `${view.air.pct}%`);
    setWidth(air.fill, view.air.pct);

    setClass(radiation.root, `res-row ${view.radiation.tone}`);
    setIcon(radiation.icon, view.radiation.icon);
    setText(radiation.value, view.radiation.word);
    this.levelEls.forEach((el, i) => setClass(el, i < view.radiation.level ? `on l${i + 1}` : ''));
    setClass(radiation.key, `res-key ${view.shieldOn ? 'on' : ''}`);

    this.alerts.forEach((alert, i) => {
      const data = view.alerts[i];
      if (!data) {
        setClass(alert.root, 'mission-alert hidden');
        return;
      }
      setClass(alert.root, `mission-alert ${data.tone}`);
      setIcon(alert.icon, data.icon);
      setText(alert.title, data.title);
      setText(alert.text, data.text);
      setClass(alert.timer, data.fill === undefined ? 'alert-timer hidden' : 'alert-timer');
      if (data.fill !== undefined) setWidth(alert.timerFill, data.fill * 100);
      setText(alert.source, data.source ?? '');
    });
  }

  // Saltos de 1 L ou mais (gelo descarregado, agua bebida) aparecem como "+12 L" / "-2 L"
  _showWaterDelta(row, liters) {
    if (liters === undefined) return;
    if (this._lastWater !== undefined) {
      const delta = Math.round(liters - this._lastWater);
      if (Math.abs(delta) >= 1) {
        row.delta.textContent = `${delta > 0 ? '+' : ''}${delta} L`;
        row.delta.className = 'res-delta';
        void row.delta.offsetWidth; // reinicia a animacao
        row.delta.className = `res-delta show ${delta > 0 ? 'up' : 'down'}`;
      }
    }
    this._lastWater = liters;
  }

  openMavPanel() {
    this.isMavPanelOpen = true;
    this.mavOverlayEl.classList.remove('hidden');
  }

  closeMavPanel() {
    this.isMavPanelOpen = false;
    this.mavOverlayEl.classList.add('hidden');
  }

  updateMavPanel(mission, iceInBag) {
    if (!this.isMavPanelOpen) return;
    const progress = mission.progress;
    setText(this.mavOverallEl, `${Math.floor(progress.overallPct)}% ready`);

    const fuel = Math.floor(mission.propellant);
    setText(this.fuelPctEl, `${fuel}%`);
    const fillWidth = `${mission.propellant.toFixed(1)}%`;
    if (this.fuelFillEl.style.width !== fillWidth) this.fuelFillEl.style.width = fillWidth;

    const waiting = Math.ceil(mission.iceStock - 1e-6);
    let status;
    if (fuel >= 100) status = 'Tank full!';
    else if (waiting > 0 && !mission.factoryOn) status = `${waiting} ice waiting. The factory is OFF.`;
    else if (waiting > 0 && mission.battery.charge <= 0) status = `${waiting} ice waiting. No energy: the factory is stopped.`;
    else if (waiting > 0) status = `Making fuel... ${waiting} ice waiting in the factory.`;
    else status = `Bring ice from the ice crater. Still needed: ${mission.iceNeeded()} ice. You have ${iceInBag}.`;
    setText(this.fuelStatusEl, status, 'mav-status');

    const canLoad = iceInBag > 0 && mission.iceNeeded() > 0;
    this.loadOneBtn.disabled = !canLoad;
    this.loadAllBtn.disabled = !canLoad;
    setText(this.loadAllBtn, `Load all ice (${iceInBag})`, 'mc-btn');
    setText(this.factoryBtn, `Factory: ${mission.factoryOn ? 'ON' : 'OFF'}`, 'mc-btn');

    setText(this.stormsEl, `${Math.min(mission.stormsSurvived, MAV_CONFIG.STORMS_TO_SURVIVE)}/${MAV_CONFIG.STORMS_TO_SURVIVE}`);
    setText(this.dataEl, mission.dataSent ? 'Yes' : 'No');
    setText(this.mavPowerEl, `Base battery: ${Math.round(mission.battery.percent)}%. Fuel making, the shield, the radio and making oxygen all share this energy.`, 'mav-status');
    this.igniteBtn.disabled = !progress.ready;
  }

  showVictory(rows, sourcesText) {
    this.isVictoryShown = true;
    this.closeMavPanel();
    this.victorySummaryEl.innerHTML = '';
    for (const [label, value] of rows) {
      const row = document.createElement('div');
      const labelEl = document.createElement('span');
      labelEl.textContent = label;
      const valueEl = document.createElement('strong');
      valueEl.textContent = value;
      row.append(labelEl, valueEl);
      this.victorySummaryEl.appendChild(row);
    }
    this.victorySourcesEl.textContent = sourcesText;
    this.victoryOverlayEl.classList.remove('hidden');
  }
}
