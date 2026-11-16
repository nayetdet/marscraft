// @ts-nocheck
import { pixelIconSvg } from './pixelIcons.ts';
import { getLanguage, translate } from './i18n.ts';

// Desenha o boletim do cadete (issue #90, src/mission/missionReport.js) num container da tela de
// fim: 5 notas grandes e coloridas, o que a crianca descobriu (issue #271) e a frase de perfil,
// para ler em 5 segundos.
export function renderReportCard(container, report) {
  if (!container) return;
  const language = getLanguage();
  container.replaceChildren();

  const heading = document.createElement('p');
  heading.className = 'report-heading';
  heading.textContent = translate('CADET TRAINING REPORT', language);
  container.append(heading);

  const grid = document.createElement('div');
  grid.className = 'report-grid';
  for (const c of report.categories) {
    const tile = document.createElement('div');
    tile.className = `report-tile grade-${c.grade.toLowerCase()}`;
    tile.innerHTML = `
      <span class="report-icon" aria-hidden="true">${pixelIconSvg(c.icon)}</span>
      <b class="report-grade" aria-label="Grade ${c.grade}"></b>
      <strong class="report-name"></strong>
      <small class="report-detail"></small>
      <i class="report-data"></i>`;
    tile.querySelector('.report-grade').textContent = c.grade;
    tile.querySelector('.report-name').textContent = translate(c.name, language);
    tile.querySelector('.report-detail').textContent = translate(c.detail, language);
    tile.querySelector('.report-data').textContent = c.data;
    grid.append(tile);
  }
  container.append(grid);

  // "You found X of Y things", a patente do diario e as descobertas mais legais (issue #271)
  if (report.explorer) {
    const finds = document.createElement('p');
    finds.className = 'report-finds';
    const count = document.createElement('b');
    count.textContent = `${translate(report.explorer.text, language)}. `;
    const rank = document.createElement('span');
    rank.className = 'report-rank';
    rank.textContent = translate(`Journal rank: ${report.explorer.rank}`, language);
    finds.append(count, rank);
    if (report.explorer.top.length > 0) {
      const top = document.createElement('span');
      top.className = 'report-top';
      top.textContent = translate(`Coolest finds: ${report.explorer.top.map((find) => `${find.name} (+${find.points})`).join(', ')}`, language);
      finds.append(top);
    }
    container.append(finds);
  }

  // Em qual janela de lancamento o foguete decolou (ato 5, #411)
  if (report.launch) {
    const launch = document.createElement('p');
    launch.className = report.launch.onTime ? 'report-launch' : 'report-launch is-late';
    launch.textContent = translate(report.launch.text, language);
    container.append(launch);
  }

  // Como a base ficou para a proxima tripulacao (ato 5, #423)
  if (report.handover) {
    const handover = document.createElement('p');
    handover.className = report.handover.allReady ? 'report-launch' : 'report-launch is-late';
    handover.textContent = translate(report.handover.text, language);
    container.append(handover);
  }

  // Ciencia que ficou em Marte x protecao do traje (ato 2, #417)
  if (report.suitTrade) {
    const trade = document.createElement('p');
    trade.className = report.suitTrade.usedPoints > 0 ? 'report-launch is-late' : 'report-launch';
    trade.textContent = translate(report.suitTrade.text, language);
    container.append(trade);
  }
  // Para onde foi o primeiro gelo (ato 1, #413)
  if (report.firstIce) {
    const firstIce = document.createElement('p');
    firstIce.className = 'report-launch';
    firstIce.textContent = translate(report.firstIce.text, language);
    container.append(firstIce);
  }
  // Fichas de tempestade que ficaram para tras (ato 2, #419)
  if (report.stormScans) {
    const stormScans = document.createElement('p');
    stormScans.className = 'report-launch is-late';
    stormScans.textContent = translate(report.stormScans.text, language);
    container.append(stormScans);
  }

  // Como a crianca chegou ao foguete: andando ou carregada (ato 3, #421)
  if (report.boarding) {
    const boarding = document.createElement('p');
    boarding.className = report.boarding.walked ? 'report-launch' : 'report-launch is-late';
    boarding.textContent = translate(report.boarding.text, language);
    container.append(boarding);
  }

  const profile = document.createElement('p');
  profile.className = 'report-profile';
  const title = document.createElement('b');
  title.textContent = translate(`Profile: ${report.profile.title}. `, language);
  profile.append(title, translate(report.profile.text, language));
  container.append(profile);
}
