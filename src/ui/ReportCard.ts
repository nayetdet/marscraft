// @ts-nocheck
import { pixelIconSvg } from './pixelIcons.ts';

// Desenha o boletim do cadete (issue #90, src/mission/missionReport.js) num container da tela de
// fim: 4 notas grandes e coloridas e a frase de perfil, para ler em 5 segundos.
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

  const profile = document.createElement('p');
  profile.className = 'report-profile';
  const title = document.createElement('b');
  title.textContent = `Profile: ${report.profile.title}. `;
  profile.append(title, report.profile.text);
  container.append(profile);
}
