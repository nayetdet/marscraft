// @ts-nocheck
import { formatDateDMY, formatDose } from '../mission/missionText.ts';
import { OSDR_RETRIEVED, STUDY_TOPICS, studiesForTopic, studyHonestyNote } from '../data/osdrStudies.ts';
import { RADLAB_PORTAL, RADLAB_RETRIEVED, marsVsStationText, radlabBars } from '../data/radlabSummary.ts';
import { REAL_VS_GAME } from '../data/realVsGame.ts';

// HTML das abas novas do diario [J] (issue #106): MISSION LOG, NASA STUDIES e REAL VS GAME, e o
// grafico do RadLab que a enfermaria tambem usa. So monta texto: quem poe na tela e o ScannerHud.

export function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;',"'": '&#39;' })[c]);
}

// Card do resumo do sol: energia, agua e dose
export function solSummaryLines(numbers) {
  return [
    `Power: made ${numbers.energyIn}%, used ${numbers.energyOut}%`,
    `Water tank: in ${numbers.waterIn} L, out ${numbers.waterOut} L`,
    `Radiation today: ${formatDose(numbers.doseMsv)}`,
  ];
}

function summaryHtml(entry) {
  const n = entry.numbers;
  const top = n.topDecision ? `<div class="mlog-top">Biggest choice: ${escapeHtml(n.topDecision)}</div>` : '<div class="mlog-top">No big choices this sol.</div>';
  return `<li class="mlog-entry is-summary">
    <div class="mlog-summary-head">${escapeHtml(entry.text.toUpperCase())}</div>
    <div class="mlog-stats">
      <span class="mlog-stat power"><b>POWER</b> +${n.energyIn}% / -${n.energyOut}%</span>
      <span class="mlog-stat water"><b>WATER</b> +${n.waterIn} L / -${n.waterOut} L</span>
      <span class="mlog-stat dose"><b>DOSE</b> ${escapeHtml(formatDose(n.doseMsv))}</span>
    </div>
    ${top}
  </li>`;
}

function entryHtml(log, entry) {
  if (entry.kind === 'summary') return summaryHtml(entry);
  const cause = log.causeOf(entry);
  const because = cause ? `<div class="mlog-because">Because: ${escapeHtml(cause.text)} <small>(${escapeHtml(cause.time)})</small></div>` : '';
  const led = entry.kind === 'decision' && entry.effectIds.length ? '<span class="mlog-led">LED TO</span>' : '';
  const link = entry.link ? ` <a href="${escapeHtml(entry.link)}" target="_blank" rel="noopener noreferrer">Open study</a>` : '';
  const mark = entry.kind === 'consequence' ? '-&gt; ' : '';
  return `<li class="mlog-entry is-${entry.kind}">
    <span class="mlog-time">${escapeHtml(entry.time)}</span>
    <span class="mlog-text">${mark}${escapeHtml(entry.text)}${link} ${led}</span>
    ${because}
  </li>`;
}

export function missionLogHtml(log) {
  const sols = log.sols();
  if (!sols.length) {
    return '<p class="mlog-empty">Nothing yet. Your choices, and what happens because of them, will show up here sol by sol. (1 sol = 1 day on Mars.)</p>';
  }
  return sols.map((sol) => {
    const items = log.entriesForSol(sol).map((e) => entryHtml(log, e)).join('');
    return `<section class="mlog-sol"><h4>SOL ${sol}</h4><ul>${items}</ul></section>`;
  }).join('');
}

// Grafico de 4 barras do RadLab. Sem unidade: a API nao diz qual e, entao so comparamos.
export function radlabChartHtml() {
  const rows = radlabBars().map((bar) => `
    <div class="radlab-row ${bar.id === 'mars' ? 'is-mars' : ''}" title="${escapeHtml(`${bar.instrument}, ${bar.window}`)}">
      <span class="radlab-label">${escapeHtml(bar.label)}</span>
      <span class="radlab-track"><span class="radlab-fill" style="width:${bar.widthPct}%"></span></span>
      <span class="radlab-times">${bar.times}x</span>
    </div>`).join('');
  return `<div class="radlab-chart">
    <div class="radlab-title">RADIATION: ${escapeHtml(marsVsStationText().toUpperCase())}</div>
    ${rows}
    <p class="radlab-note">Middle value of real readings, compared with the Space Station (1x). NASA RadLab, real data from ${formatDateDMY(RADLAB_RETRIEVED)}. <a href="${escapeHtml(RADLAB_PORTAL)}" target="_blank" rel="noopener noreferrer">RadLab</a></p>
  </div>`;
}

export function studiesHtml(reveals) {
  const topics = STUDY_TOPICS.map((topic) => {
    const cards = studiesForTopic(topic.id).map((study) => {
      if (!reveals.isRevealed(study.id)) {
        return `<li class="study-card is-locked"><b>???</b> <span>${escapeHtml(topic.unlock)}</span></li>`;
      }
      return `<li class="study-card">
        <div class="study-head"><b>${escapeHtml(study.id)}</b> <a href="${escapeHtml(study.url)}" target="_blank" rel="noopener noreferrer">Open on NASA OSDR</a></div>
        <p>${escapeHtml(study.explanation)}</p>
        <small>${escapeHtml(studyHonestyNote(study))}</small>
      </li>`;
    }).join('');
    return `<section class="study-topic"><h4>${escapeHtml(topic.label.toUpperCase())}</h4><ul>${cards}</ul></section>`;
  }).join('');
  return `${radlabChartHtml()}
    <p class="study-intro">Real studies from NASA's Open Science Data Repository (OSDR), real data from ${formatDateDMY(OSDR_RETRIEVED)}. They were done on the Space Station or in labs on Earth, many with mice. None of them measured Mars: nobody has lived on Mars yet.</p>
    ${topics}`;
}

export function realVsGameHtml() {
  const rows = REAL_VS_GAME.map((row) => `<li class="rvg-row">
    <div class="rvg-topic">${escapeHtml(row.topic.toUpperCase())}</div>
    <div class="rvg-cols"><span><b>GAME</b> ${escapeHtml(row.game)}</span><span><b>REAL</b> ${escapeHtml(row.real)}</span></div>
    <div class="rvg-why">${escapeHtml(row.why)} <small>Source: ${escapeHtml(row.source)}</small></div>
  </li>`).join('');
  return `<p class="study-intro">To fit a whole mission into one play session, the game changes some numbers. Here is what is real and what is a game rule.</p><ul class="rvg-list">${rows}</ul>`;
}
