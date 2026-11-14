import { CREW_CONFIG } from '../config/constants.js';
import { problemText } from '../crew/stations.js';
import { dailyCrewNeeds } from '../crew/crewText.js';

const TASKS = [
  { task: 'oxygen', label: 'Oxygen', help: 'Cleans the air filters, so air costs less power.' },
  { task: 'water', label: 'Water', help: 'Cleans used water: 98% comes back to the tank.' },
  { task: 'greenhouse', label: 'Greenhouse', help: 'Grows food for the crew. Plants need water.' },
  { task: 'medbay', label: 'Medical bay', help: 'Heals you inside the base and warns about radiation.' },
  { task: 'rest', label: 'Rest', help: 'Saves power, but nothing gets done.' },
];
const TASK_LABEL = Object.fromEntries(TASKS.map((t) => [t.task, t.label]));
const STATE_TEXT = {
  walking: 'Walking',
  working: 'Working',
  resting: 'Resting',
  weak: 'Too weak to work!',
  evacuated: 'Back on Earth',
};

function escapeHtml(text) {
  return String(text).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
}

// Painel da tripulacao ([C]) e menu de ordens ao falar com um tripulante ([F]).
// Usa o visual do painel do MAV. Os cliques usam pointerdown com delegacao, porque o
// conteudo e redesenhado enquanto o painel esta aberto.
export class CrewPanel {
  constructor({ onAssign, onClose }) {
    this.isOpen = false;
    this.focusId = null;
    this._html = '';

    this.overlayEl = document.createElement('div');
    this.overlayEl.className = 'inventory-overlay hidden';
    this.overlayEl.innerHTML = `
      <section class="inventory-window mav-window crew-window" aria-label="Crew">
        <header><h2>Crew</h2><span>[C] or [F] to close</span></header>
        <div class="crew-body"></div>
        <div class="mav-actions"><button class="mc-btn" data-close>Close</button></div>
      </section>`;
    this.bodyEl = this.overlayEl.querySelector('.crew-body');
    document.body.appendChild(this.overlayEl);

    this.overlayEl.addEventListener('pointerdown', (e) => {
      const button = e.target.closest('button');
      if (!button || button.disabled) return;
      e.preventDefault();
      if (button.hasAttribute('data-close')) onClose();
      else if (button.dataset.task) onAssign(Number(button.dataset.member), button.dataset.task);
    });
  }

  open(memberId = null) {
    this.focusId = memberId;
    this.isOpen = true;
    this._html = '';
    this.overlayEl.classList.remove('hidden');
  }

  close() {
    this.isOpen = false;
    this.overlayEl.classList.add('hidden');
  }

  render(crew, base) {
    if (!this.isOpen) return;
    const members = this.focusId === null ? crew.members : crew.members.filter((m) => m.id === this.focusId);
    const parts = [
      `<p class="mav-intro">Base supplies: food ${Math.floor(base.food)} · water ${Math.floor(base.water)} L · battery ${Math.floor(base.battery.percent)}%. Every crew member needs air, water and food, even when resting.</p>`,
      ...members.map((m) => this._memberHtml(m)),
    ];
    if (this.focusId === null) parts.push(this._stationsHtml(crew, base));
    const html = parts.join('');
    if (html !== this._html) {
      this._html = html;
      this.bodyEl.innerHTML = html;
    }
  }

  _memberHtml(member) {
    const away = member.state === 'evacuated';
    const buttons = TASKS.map((t) => {
      const current = member.task === t.task ? ' crew-current' : '';
      const expert = member.specialties.includes(t.task) ? ' (expert)' : '';
      return `<button class="mc-btn${current}" data-member="${member.id}" data-task="${t.task}" title="${escapeHtml(t.help)}" ${away ? 'disabled' : ''}>${t.label}${expert}</button>`;
    }).join('');
    const help = this.focusId === null ? '' : `<ul class="crew-help">${TASKS.map((t) => `<li><b>${t.label}:</b> ${escapeHtml(t.help)}</li>`).join('')}</ul>`;
    return `
      <div class="mav-req">
        <h3>${escapeHtml(member.name)} · ${escapeHtml(member.role)}</h3>
        <p class="mav-status">${STATE_TEXT[member.state]}${away ? '' : ` · Job: ${TASK_LABEL[member.task]}`}</p>
        <div class="mav-actions">${buttons}</div>
        ${help}
      </div>`;
  }

  // Estacao sem ninguem trabalhando fica "?": ninguem esta olhando para ela
  _stationsHtml(crew, base) {
    const rows = crew.stations.map((station) => {
      const workers = crew.workersAt(station);
      if (!workers.length) {
        return `<p><b>${escapeHtml(station.name)}:</b> ? (nobody is checking it)</p>`;
      }
      const pct = Math.round(station.health * 100);
      const [problem] = station.problems(base);
      const warning = problem ? `<br><span class="mav-status">${escapeHtml(problemText(station, problem))}</span>` : '';
      return `
        <p><b>${escapeHtml(station.name)}</b> (${workers.map((w) => escapeHtml(w.name)).join(', ')}): ${pct}%</p>
        <div class="mav-track"><div class="mav-fill" style="width:${pct}%"></div></div>${warning}`;
    }).join('');
    return `<div class="mav-req"><h3>Base stations</h3>${rows}</div>`;
  }
}

// Escolha do tamanho da tripulacao no menu inicial; trava depois do primeiro Play
export class CrewPicker {
  constructor({ initial, onChange }) {
    this.size = initial;
    this.locked = false;
    this.onChange = onChange;

    this.el = document.createElement('div');
    this.el.className = 'crew-picker';
    const card = document.querySelector('.mc-menu-card');
    card.insertBefore(this.el, card.firstChild);

    this.el.addEventListener('click', (e) => {
      const button = e.target.closest('button[data-size]');
      if (!button || this.locked) return;
      this.size = Number(button.dataset.size);
      this.onChange(this.size);
      this.render();
    });
    this.render();
  }

  lock() {
    this.locked = true;
    this.render();
  }

  render() {
    const sizes = Array.from({ length: CREW_CONFIG.MAX_CREW }, (_, i) => i + 1);
    const needs = dailyCrewNeeds(this.size);
    const people = CREW_CONFIG.NAMES.slice(0, this.size)
      .map((name, i) => `${name} (${CREW_CONFIG.ROLES[i].title})`).join(', ');
    this.el.innerHTML = `
      <p class="crew-picker-title">Crew size${this.locked ? ' (chosen)' : ''}</p>
      <div class="crew-picker-buttons">${sizes.map((n) => `<button class="mc-btn${n === this.size ? ' crew-current' : ''}" data-size="${n}" ${this.locked ? 'disabled' : ''}>${n}</button>`).join('')}</div>
      <p class="crew-picker-text">${people}.</p>
      <p class="crew-picker-text">Every sol (Mars day) they eat ${Math.round(needs.food)} food, drink ${Math.round(needs.water)} L of water and use ${Math.round(needs.battery)}% of a battery for air. More crew can run more stations, but uses more supplies.</p>
      <p class="crew-picker-note">NASA plans crew size around life support. Needs based on the NASA Baseline Values and Assumptions Document.</p>`;
  }
}
