import { MAV_CONFIG } from '../config/constants.js';
import { formatDose, formatHours, stormSourceText } from '../mission/missionText.js';

// So escreve no DOM quando o texto ou a classe mudam (o update roda a cada frame)
function setText(el, text, className = '') {
  if (el._text !== text) {
    el._text = text;
    el.textContent = text;
  }
  if (el._cls !== className) {
    el._cls = className;
    el.className = className;
  }
}

export class MissionHud {
  constructor({ donkiFetched, onLoadIce, onToggleFactory, onIgnite, onClose }) {
    this.donkiFetched = donkiFetched;
    const $ = (id) => document.getElementById(id);

    this.powerEl = $('mission-power');
    this.radiationEl = $('mission-radiation');
    this.shieldEl = $('mission-shield');
    this.stormEl = $('mission-storm');
    this.mavEl = $('mission-mav');
    this.sourceEl = $('mission-source');

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

  update(mission) {
    const power = Math.round(mission.battery.percent);
    const sun = mission.chargeRate > 0.05 ? `charging +${mission.chargeRate.toFixed(1)}%/h` : 'no sun, not charging';
    setText(this.powerEl, `Power: ${power}% (${sun})`, power <= 15 ? 'danger' : '');

    const rate = mission.doseRate;
    setText(
      this.radiationEl,
      `Radiation: ${rate.toFixed(2)} mSv/h | Your dose: ${formatDose(mission.totalDoseMsv)}`,
      rate >= 3 ? 'danger' : rate >= 0.5 ? 'warn' : ''
    );

    setText(this.shieldEl, `Radiation shield [R]: ${mission.shieldOn ? 'ON (uses energy)' : 'OFF'}`, mission.shieldOn ? 'ok' : '');

    const { phase, storm, hoursUntil, hoursLeft } = mission.storm;
    if (phase === 'warning') {
      setText(this.stormEl, `Solar storm arrives in ${formatHours(hoursUntil)}!`, 'warn');
      setText(this.sourceEl, stormSourceText(storm, this.donkiFetched), 'mission-source');
    } else if (phase === 'active') {
      setText(this.stormEl, `SOLAR STORM NOW! Ends in ${formatHours(hoursLeft)}. Hide inside or use the shield [R]`, 'danger');
      setText(this.sourceEl, stormSourceText(storm, this.donkiFetched), 'mission-source');
    } else {
      setText(this.stormEl, 'Space weather: calm', '');
      setText(this.sourceEl, '', 'mission-source');
    }

    const progress = mission.progress;
    setText(this.mavEl, `Rocket home (MAV): ${Math.floor(progress.overallPct)}% ready`, progress.ready ? 'ok' : '');
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
