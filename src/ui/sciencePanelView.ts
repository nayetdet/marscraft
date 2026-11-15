import { SCIENCE_CONFIG } from '../config/constants.ts';
import { pointsWord, scienceGoalText, scienceMissingText } from '../mission/sciencePackage.ts';
import type { ScienceItem, SciencePackage, ScienceStatus } from '../mission/sciencePackage.ts';

// Painel "SCIENCE FOR EARTH" do terminal de ciencia (issue #269): no lugar do bloco de texto com
// contagens, a crianca ve O QUE achou. Cada descoberta ou amostra e uma linha com desenho, nome e
// pontos, em duas listas: "to send" e "sent to Earth". Funcoes puras: o StationPanel so pinta.

export interface ScienceRow {
  name: string;
  points: number;
  kind: ScienceItem['kind'];
  icon: string;
  rare: boolean;
}

export interface SciencePanelModel {
  goalText: string; // "Science sent: 6 / 10 points"
  fill: number; // 0 a 1 da meta
  met: boolean;
  why: string;
  toSend: ScienceRow[];
  toSendPoints: number;
  sent: ScienceRow[];
  sentPoints: number;
  usedPoints: number;
  rawSamples: number;
  next: string;
  missing: string;
}

export const SCIENCE_WHY =
  'Mars rovers send their science to orbiters flying over Mars, and the orbiters pass it on to Earth (NASA Mars Relay Network). ' +
  'Your rocket waits for your science too.';

const row = (item: ScienceItem): ScienceRow => ({ name: item.name, points: item.points, kind: item.kind, icon: item.icon, rare: Boolean(item.rare) });
// Os que valem mais primeiro: e o que a crianca quer ver no topo
const byPoints = (items: readonly ScienceItem[]) => [...items].sort((a, b) => b.points - a.points).map(row);

export function sciencePanelModel(status: ScienceStatus, pkg: SciencePackage, rawSamples = 0, config = SCIENCE_CONFIG): SciencePanelModel {
  const next = pkg.items > 0
    ? `Next upload: ${pkg.items} item${pkg.items === 1 ? '' : 's'} = ${pointsWord(pkg.points)}. Cost: ${config.UPLOAD_BASE_COST}% to start the radio + ${pkg.items} x ${config.UPLOAD_COST_PER_ITEM}% = ${pkg.cost}% power.` +
      (pkg.leftAfter > 0 ? ` ${pkg.leftAfter} more wait for the next orbiter pass (max ${config.MAX_ITEMS_PER_UPLOAD} per pass).` : '')
    : 'Next upload: nothing new yet.';
  return {
    goalText: scienceGoalText(status.sentPoints, config),
    fill: Math.min(1, status.sentPoints / config.POINTS_TO_LAUNCH),
    met: status.met,
    why: SCIENCE_WHY,
    toSend: byPoints(status.pending),
    toSendPoints: status.pendingPoints,
    sent: byPoints(status.sent),
    sentPoints: status.sentPoints,
    usedPoints: status.usedPoints,
    rawSamples,
    next,
    missing: scienceMissingText({ pendingPoints: status.pendingPoints, sentPoints: status.sentPoints, clues: status.clues }, config),
  };
}

const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
const esc = (text: string) => text.replace(/[&<>"]/g, (c) => ESCAPES[c]);

function listHtml(rows: ScienceRow[], empty: string, iconUrl: (row: ScienceRow) => string): string {
  if (rows.length === 0) return `<p class="sci-empty">${esc(empty)}</p>`;
  const items = rows.map((r) =>
    `<li class="sci-item is-${r.kind}${r.rare ? ' is-rare' : ''}">` +
    `<img class="sci-icon" src="${esc(iconUrl(r))}" alt="" />` +
    `<span class="sci-name">${esc(r.name)}${r.rare ? ' <i>RARE</i>' : r.kind === 'sample' ? ' <i>SAMPLE</i>' : ''}</span>` +
    `<b class="sci-points">+${r.points}</b></li>`).join('');
  return `<ul class="sci-list">${items}</ul>`;
}

// `iconUrl` devolve o desenho de cada linha (ficha do diario ou amostra): fica fora daqui para a
// conta continuar pura e testavel sem DOM
export function sciencePanelHtml(model: SciencePanelModel, iconUrl: (row: ScienceRow) => string, { compact = false } = {}): string {
  const pct = Math.round(model.fill * 100);
  const used = model.usedPoints > 0 ? `<p class="sci-note">Used in lab upgrades (not sent): ${pointsWord(model.usedPoints)}.</p>` : '';
  const raw = model.rawSamples > 0 ? `<p class="sci-note is-hot">${model.rawSamples} sample${model.rawSamples === 1 ? '' : 's'} in your bag: press ANALYZE to turn ${model.rawSamples === 1 ? 'it' : 'them'} into points.</p>` : '';
  return `<div class="sci-panel${compact ? ' is-compact' : ''}">` +
    `<div class="sci-goal${model.met ? ' is-met' : ''}"><b>${esc(model.goalText.toUpperCase())}</b>` +
    `<span class="sci-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><i style="width:${pct}%"></i></span></div>` +
    (compact ? '' : `<p class="sci-why">${esc(model.why)}</p>`) +
    raw +
    '<div class="sci-cols">' +
    `<section><h4>TO SEND <small>${pointsWord(model.toSendPoints)}</small></h4>${listHtml(model.toSend, 'Nothing yet. Scan with the scope or bring samples from the map.', iconUrl)}</section>` +
    `<section><h4>SENT TO EARTH <small>${pointsWord(model.sentPoints)}</small></h4>${listHtml(model.sent, 'Nothing sent yet.', iconUrl)}</section>` +
    '</div>' +
    used +
    (compact ? '' : `<p class="sci-note">${esc(model.next)}</p>`) +
    `<p class="sci-note">${esc(model.missing)}${compact ? '' : ' Costs and points are game rules.'}</p>` +
    '</div>';
}
