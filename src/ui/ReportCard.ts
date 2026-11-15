// @ts-nocheck
import { pixelIconSvg } from './pixelIcons.ts';

// Desenha o boletim do cadete (issue #90, src/mission/missionReport.js) num container da tela de
// fim: 5 notas grandes e coloridas, o que a crianca descobriu (issue #271) e a frase de perfil,
// para ler em 5 segundos.
export function renderReportCard(container, report) {
  if (!container) return;
  container.replaceChildren();

  const heading = document.createElement('p');
  heading.className = 'report-heading';
  heading.textContent = 'CADET TRAINING REPORT';
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
    tile.querySelector('.report-name').textContent = c.name;
    tile.querySelector('.report-detail').textContent = c.detail;
    tile.querySelector('.report-data').textContent = c.data;
    grid.append(tile);
  }
  container.append(grid);

  // "You found X of Y things", a patente do diario e as descobertas mais legais (issue #271)
  if (report.explorer) {
    const finds = document.createElement('p');
    finds.className = 'report-finds';
    const count = document.createElement('b');
    count.textContent = `${report.explorer.text}. `;
    const rank = document.createElement('span');
    rank.className = 'report-rank';
    rank.textContent = `Journal rank: ${report.explorer.rank}`;
    finds.append(count, rank);
    if (report.explorer.top.length > 0) {
      const top = document.createElement('span');
      top.className = 'report-top';
      top.textContent = `Coolest finds: ${report.explorer.top.map((find) => `${find.name} (+${find.points})`).join(', ')}`;
      finds.append(top);
    }
    container.append(finds);
  }

  const profile = document.createElement('p');
  profile.className = 'report-profile';
  const title = document.createElement('b');
  title.textContent = `Profile: ${report.profile.title}. `;
  profile.append(title, report.profile.text);
  container.append(profile);
}
