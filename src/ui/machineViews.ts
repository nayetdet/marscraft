import {
  COMMS_CONFIG,
  OXYGEN_PLANT_CONFIG as O,
  RADIATION_CONFIG,
  SCIENCE_CONFIG,
  STATION_CONFIG as C,
  UTILITY_CONFIG as U,
} from '../config/constants.ts';
import { pixelIconSvg } from './pixelIcons.ts';

export type MachineStationType =
  | 'console'
  | 'power'
  | 'medical'
  | 'science'
  | 'galley'
  | 'hygiene'
  | 'workshop'
  | 'shelter';

export interface DoseBreakdownView {
  transit: number;
  eva: number;
  storm: number;
  habitat: number;
  reactor: number;
  total: number;
  limit: number;
  grounded: boolean;
}

export interface CrewStationHealth {
  name: string;
  health: number;
}

export interface MachineViewData {
  type: MachineStationType;
  notice: string;
  noticeKind?: 'info' | 'warn' | 'ok';
  energy: number;
  oxygen: number;
  maxStat: number;
  health: number;
  food: number;
  baseWater: number;
  maxBaseWater: number;
  regolith: number;
  carrots: number;
  objective: string;
  filter: number;
  co2: number;
  contaminated: boolean;
  science: number;
  samples: number;
  analyzedSamples: number;
  upgraded: boolean;
  toolUpgraded: boolean;
  boneDensity: number;
  muscleStrength: number;
  dose: DoseBreakdownView;
  oxygenMode: 'electrolysis' | 'moxie';
  oxygenBlocked?: 'water' | 'power' | null;
  sabatier: boolean;
  waterUsedL: number;
  stormPhase: 'none' | 'warning' | 'active';
  shelterWaterL: number;
  shelterBlockedPct: number;
  crewFood: number;
  maxCrewFood: number;
  freshFoodActive: boolean;
  graywater: number;
  waterFilter: number;
  waterRecoveryPct: number;
  cold: boolean;
  isNight: boolean;
  crewStations: CrewStationHealth[];
  commsBlackout: boolean;
  commsDistanceMkm: number;
  commsLightMin: number;
  commsDate: string;
  commsPending: boolean;
  donkiLive: boolean;
  donkiLabel: string;
  donkiBulletin: string;
  pkgItems: number;
  pkgCost: number;
  sentDiscoveries: number;
  sentSamples: number;
  totalDiscoveries: number;
  totalSamples: number;
  radlabHtml?: string;
  medbayBoneFact: string;
  links: [string, string][];
}

interface ActionCardOptions {
  action: string;
  icon: string;
  title: string;
  costHtml?: string;
  badgeText?: string;
  badgeTone?: 'on' | 'off' | 'warn' | 'ready';
  disabled?: boolean;
  pressed?: boolean;
  urgent?: boolean;
  compact?: boolean;
}

interface CheckItem {
  ok: boolean;
  label: string;
  detail: string;
}

const MACHINE_TITLES: Record<MachineStationType, string> = {
  console: 'BASE COMPUTER',
  power: 'AIR FACTORY',
  medical: 'MEDBAY SCAN',
  science: 'SCIENCE & RADIO',
  galley: 'SPACE KITCHEN',
  hygiene: 'WATER LOOP',
  workshop: '3D PRINTER',
  shelter: 'STORM SHIELD',
};

export function machineModalTitle(type: string): string {
  return (MACHINE_TITLES as Record<string, string>)[type] ?? 'STATION';
}

export function isCustomMachineType(type: string): type is MachineStationType {
  return Object.prototype.hasOwnProperty.call(MACHINE_TITLES, type);
}

function escapeHtml(text: string): string {
  return String(text).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c] ?? c));
}

function clampPct(value: number, max = 100): number {
  if (max <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((value / max) * 100)));
}

function resPill(kind: string, icon: string, value: string, id?: string, title?: string, label?: string): string {
  const idAttr = id ? ` id="${id}"` : '';
  const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
  const lbl = label ? `<span class="mc-pill-lbl">${escapeHtml(label)}</span>` : '';
  return `<div class="gh-res-pill ${kind}"${titleAttr}><span class="mc-pill-ico">${pixelIconSvg(icon)}</span>${lbl}<strong${idAttr}>${escapeHtml(value)}</strong></div>`;
}

function alertPill(text: string, tone: 'danger' | 'warn' = 'danger'): string {
  return `<span class="gh-alert-pill ${tone === 'warn' ? 'is-warn' : ''}" role="status">${escapeHtml(text)}</span>`;
}

export function nasaInfoButtonHtml(factHtml: string, links: [string, string][], extraHtml = ''): string {
  const linkTags = links
    .map(([label, url]) => `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`)
    .join('');
  return `
    <details class="mc-nasa-learn">
      <summary aria-label="NASA info" title="NASA info">
        <span class="mc-nasa-ico">${pixelIconSvg('info')}</span>
        <span>NASA</span>
      </summary>
      <div class="mc-nasa-popover">
        <div class="mc-nasa-head">${pixelIconSvg('medal')} <strong>NASA DATA</strong></div>
        <div class="mc-nasa-body">${factHtml}</div>
        ${extraHtml}
        ${linkTags ? `<div class="mc-nasa-links">${linkTags}</div>` : ''}
      </div>
    </details>`;
}

function costChip(icon: string, text: string): string {
  return `<span class="mc-cost-chip">${pixelIconSvg(icon)}${escapeHtml(text)}</span>`;
}

function actionCard(opts: ActionCardOptions): string {
  const classes = [
    'mc-btn',
    'mc-act-card',
    opts.pressed ? 'is-active' : '',
    opts.urgent ? 'is-urgent' : '',
    opts.compact ? 'is-compact' : '',
  ].filter(Boolean).join(' ');
  const pressedAttr = opts.pressed !== undefined ? ` aria-pressed="${opts.pressed}"` : '';
  const disabledAttr = opts.disabled ? ' disabled' : '';
  const badge = opts.badgeText
    ? `<em class="mc-act-badge tone-${opts.badgeTone ?? 'off'}">${escapeHtml(opts.badgeText)}</em>`
    : '';
  return `
    <button type="button" class="${classes}" data-action="${escapeHtml(opts.action)}"${pressedAttr}${disabledAttr}>
      <span class="mc-act-icon" aria-hidden="true">${pixelIconSvg(opts.icon)}</span>
      <span class="mc-act-main">
        <strong>${escapeHtml(opts.title)}</strong>
        ${opts.costHtml ? `<span class="mc-act-costs">${opts.costHtml}</span>` : ''}
      </span>
      ${badge}
    </button>`;
}

function checksHtml(items: CheckItem[]): string {
  return `<div class="gh-checks mc-checks">${items.map((c) => `
    <div class="gh-check ${c.ok ? 'ok' : 'bad'}">
      <b>${c.ok ? 'OK' : '!!'}</b>
      <span>${escapeHtml(c.label)}</span>
      <small>${escapeHtml(c.detail)}</small>
    </div>`).join('')}</div>`;
}

function noticeHtml(notice: string, kind: 'info' | 'warn' | 'ok' = 'info'): string {
  if (!notice) return '';
  return `<div id="mc-notice" class="gh-notice is-${kind}" role="status">${escapeHtml(notice)}</div>`;
}

/* ---------------- 1. CONSOLE (BASE COMPUTER) ---------------- */
function renderConsole(d: MachineViewData): { top: string; checks: string; stage: string; side: string; fact: string } {
  const stormAlert = d.stormPhase === 'active'
    ? alertPill('SOLAR STORM!', 'danger')
    : d.stormPhase === 'warning'
      ? alertPill('STORM SOON', 'warn')
      : '';
  const top = [
    resPill('power', 'bolt', `${Math.round(d.energy)}%`, 'mc-res-power', 'Battery'),
    resPill('water', 'air', `${Math.round(d.oxygen)}/${d.maxStat}`, 'mc-res-o2', 'Suit O2'),
    resPill('science', 'scope', `${d.science}`, 'mc-res-sci', 'Science points'),
    stormAlert,
  ].filter(Boolean).join('');

  const skyColor = d.stormPhase === 'active' ? '#3a1414' : d.stormPhase === 'warning' ? '#2c2210' : '#081826';
  const sunColor = d.stormPhase === 'active' ? '#ff6b5e' : d.isNight ? '#cbd5e1' : '#fde047';
  const stormParticles = d.stormPhase !== 'none'
    ? `<g class="mc-anim-storm">
        <rect x="18" y="14" width="10" height="2" fill="${d.stormPhase === 'active' ? '#ff6b5e' : '#facc15'}"/>
        <rect x="52" y="24" width="12" height="2" fill="${d.stormPhase === 'active' ? '#fca5a5' : '#fde047'}"/>
        <rect x="98" y="12" width="10" height="2" fill="${d.stormPhase === 'active' ? '#ff6b5e' : '#facc15'}"/>
        <rect x="128" y="28" width="12" height="2" fill="${d.stormPhase === 'active' ? '#fca5a5' : '#fde047'}"/>
      </g>`
    : `<g class="mc-anim-twinkle">
        <rect x="18" y="16" width="2" height="2" fill="#e2e8f0"/>
        <rect x="54" y="10" width="2" height="2" fill="#93c5fd"/>
        <rect x="92" y="20" width="2" height="2" fill="#fde047"/>
        <rect x="144" y="14" width="2" height="2" fill="#e2e8f0"/>
      </g>`;

  const suitBadge = d.upgraded
    ? `<rect x="124" y="62" width="32" height="36" fill="#0d2f24" stroke="#4ade80" stroke-width="2"/>
       <rect x="134" y="68" width="12" height="10" fill="#fde047"/>
       <rect x="136" y="70" width="8" height="6" fill="#38bdf8"/>
       <rect x="132" y="79" width="16" height="12" fill="#e2e8f0"/>
       <rect x="136" y="81" width="8" height="4" fill="#4ade80"/>`
    : `<rect x="124" y="62" width="32" height="36" fill="#17242c" stroke="#475569" stroke-width="2"/>
       <rect x="134" y="68" width="12" height="10" fill="#94a3b8"/>
       <rect x="136" y="70" width="8" height="6" fill="#334155"/>
       <rect x="132" y="79" width="16" height="12" fill="#cbd5e1"/>`;

  const svg = `
    <svg class="mc-scene-svg" viewBox="0 0 168 128" shape-rendering="crispEdges" aria-hidden="true">
      <rect x="0" y="0" width="168" height="128" fill="${skyColor}"/>
      ${stormParticles}
      <!-- Sun or Moon -->
      <rect x="22" y="22" width="14" height="14" fill="${sunColor}"/>
      <rect x="25" y="25" width="8" height="8" fill="#ffffff" fill-opacity="0.35"/>
      <!-- Radar sweep over dish -->
      <g class="mc-anim-radar">
        <rect x="64" y="34" width="36" height="3" fill="#4ade80" fill-opacity="0.7"/>
        <rect x="70" y="28" width="24" height="3" fill="#4ade80" fill-opacity="0.45"/>
        <rect x="76" y="22" width="12" height="3" fill="#4ade80" fill-opacity="0.25"/>
      </g>
      <!-- Mars ground -->
      <rect x="0" y="96" width="168" height="32" fill="#7c2d12"/>
      <rect x="0" y="96" width="168" height="4" fill="#c2410c"/>
      <rect x="12" y="106" width="10" height="4" fill="#9a3412"/>
      <rect x="108" y="112" width="14" height="4" fill="#9a3412"/>
      <!-- Mars Habitat Dome + Radar Dish -->
      <rect x="28" y="68" width="56" height="28" fill="#cbd5e1"/>
      <rect x="36" y="58" width="40" height="10" fill="#e2e8f0"/>
      <rect x="44" y="52" width="24" height="6" fill="#94a3b8"/>
      <rect x="38" y="74" width="12" height="10" fill="#38bdf8"/>
      <rect x="58" y="74" width="12" height="10" fill="#38bdf8"/>
      <rect x="84" y="76" width="20" height="20" fill="#64748b"/>
      <rect x="92" y="82" width="8" height="14" fill="#1e293b"/>
      <!-- Dish -->
      <rect x="78" y="48" width="4" height="20" fill="#94a3b8"/>
      <rect x="72" y="42" width="16" height="6" fill="#e2e8f0"/>
      <rect x="78" y="38" width="4" height="4" fill="#4ade80"/>
      <!-- Suit upgrade preview box -->
      ${suitBadge}
    </svg>`;

  const stage = `
    <div class="mc-stage-box">
      ${svg}
      <div class="mc-stage-caption">
        <span class="mc-cap-tag">GOAL</span>
        <strong>${escapeHtml(d.objective || 'Survive and launch!')}</strong>
      </div>
    </div>`;

  const side = `
    <div class="mc-step-bar">BASE CONTROLS</div>
    <div class="mc-action-stack">
      ${actionCard({
        action: 'send',
        icon: 'radio',
        title: d.commsBlackout ? 'RADIO SILENT' : 'ASK EARTH',
        costHtml: d.commsBlackout ? costChip('clock', 'SUN BLOCK') : costChip('bolt', `${C.COMMS_COST}%`),
        badgeText: d.commsPending ? 'WAIT' : d.commsBlackout ? 'OFF' : 'SEND',
        badgeTone: d.commsBlackout ? 'warn' : 'ready',
        disabled: d.commsBlackout || d.energy < C.COMMS_COST,
      })}
      ${actionCard({
        action: 'upgrade',
        icon: 'shield',
        title: d.upgraded ? 'SUIT SHIELDED' : 'UPGRADE SUIT',
        costHtml: d.upgraded ? '' : costChip('scope', `${C.UPGRADE_COST} SCI`),
        badgeText: d.upgraded ? 'MAX' : 'BUY',
        badgeTone: d.upgraded ? 'on' : d.science >= C.UPGRADE_COST ? 'ready' : 'off',
        disabled: d.upgraded || d.science < C.UPGRADE_COST,
        pressed: d.upgraded,
      })}
      ${actionCard({
        action: 'mission',
        icon: 'medal',
        title: 'SHOW GOAL',
        badgeText: 'VIEW',
        badgeTone: 'off',
        compact: true,
      })}
    </div>`;

  const fact = `
    <p><strong>Space Weather:</strong> ${escapeHtml(d.donkiLabel)}. ${d.donkiLive ? 'Connected live to NASA DONKI.' : 'Using saved NASA data inside the game.'}</p>
    ${d.donkiBulletin ? `<p>${escapeHtml(d.donkiBulletin)}</p>` : ''}
    <p>NASA uses the <strong>DONKI</strong> alert system and <strong>RadLab</strong> measurements to warn astronauts before solar storms hit Mars.</p>`;

  return { top, checks: '', stage, side, fact };
}

/* ---------------- 2. POWER (MAKE AIR / O2 PLANT) ---------------- */
function airFactoryCue(
  d: MachineViewData,
  isWater: boolean,
  hasWater: boolean,
  hasPower: boolean,
): { tag: string; text: string; tone: 'ok' | 'warn' | 'danger' } {
  if (d.contaminated) return { tag: 'DUST', text: 'Clean dust now!', tone: 'danger' };
  if (d.co2 >= 40 || d.filter <= 0) return { tag: 'CO2', text: 'Replace CO2 filter!', tone: 'danger' };
  if (isWater && !hasWater) return { tag: 'NO H2O', text: 'Use Mars air!', tone: 'danger' };
  if (!hasPower) return { tag: 'NO PWR', text: 'Battery empty!', tone: 'danger' };
  if (isWater && d.baseWater < O.LOW_WATER_WARN_L) return { tag: 'LOW H2O', text: 'Try Mars air!', tone: 'warn' };
  if (!isWater && d.energy < O.LOW_BATTERY_WARN_PCT) return { tag: 'LOW PWR', text: 'Try Water!', tone: 'warn' };
  if (d.filter < 30) return { tag: 'FILTER', text: 'Replace filter soon', tone: 'warn' };
  return {
    tag: isWater ? 'OGA' : 'MOXIE',
    text: isWater ? 'Making O2 from water' : 'Making O2 from Mars air',
    tone: 'ok',
  };
}

function toggleSwitchHtml(on: boolean): string {
  return `<span class="pw-toggle mc-air-toggle ${on ? 'is-on' : 'is-off'}" aria-hidden="true"><span>OFF</span><span class="pw-toggle-track"><i></i></span><span>ON</span></span>`;
}

function renderPowerAir(d: MachineViewData): { top: string; checks: string; stage: string; side: string; fact: string } {
  const isWater = d.oxygenMode === 'electrolysis';
  const hasWater = d.baseWater > 0 && d.oxygenBlocked !== 'water';
  const hasPower = d.energy > 0 && d.oxygenBlocked !== 'power';
  const running = hasPower && (!isWater || hasWater);

  const urgentAlert = d.contaminated ? alertPill('DUST!', 'danger')
    : d.co2 >= 40 ? alertPill('HIGH CO2!', 'danger')
      : d.filter <= 0 ? alertPill('NO FILTER!', 'danger')
        : isWater && !hasWater ? alertPill('NO WATER!', 'danger')
          : !hasPower ? alertPill('NO POWER!', 'danger')
            : isWater && d.baseWater < O.LOW_WATER_WARN_L ? alertPill('LOW WATER!', 'warn')
              : !isWater && d.energy < O.LOW_BATTERY_WARN_PCT ? alertPill('LOW POWER!', 'warn')
                : d.filter < 30 ? alertPill('FILTER LOW!', 'warn')
                  : '';

  const top = [
    resPill('water', 'drop', `${d.baseWater.toFixed(1)} L`, 'mc-res-water', 'Water tank'),
    resPill('power', 'bolt', `${Math.round(d.energy)}%`, 'mc-res-power', 'Battery'),
    resPill('water', 'air', `${Math.round(d.oxygen)}%`, 'mc-res-o2', 'Oxygen'),
    urgentAlert,
  ].filter(Boolean).join('');

  const waterPct = clampPct(d.baseWater, d.maxBaseWater);
  const waterFillH = Math.round((waterPct / 100) * 44);
  const waterY = 38 + (44 - waterFillH);
  const waterColor = !hasWater ? '#ef4444' : d.baseWater < O.LOW_WATER_WARN_L ? '#facc15' : '#0284c7';

  const o2Pct = clampPct(d.oxygen, d.maxStat);
  const o2FillH = Math.round((o2Pct / 100) * 44);
  const o2Y = 38 + (44 - o2FillH);
  const o2Color = d.oxygen < 25 ? '#ef4444' : running ? '#22c55e' : '#0284c7';

  const filterPct = clampPct(d.filter, 100);
  const filterColor = d.filter >= 50 ? '#4ade80' : d.filter >= 30 ? '#facc15' : '#ef4444';
  const co2Color = d.co2 >= 40 ? '#ef4444' : d.co2 >= 20 ? '#facc15' : '#4ade80';
  const cue = airFactoryCue(d, isWater, hasWater, hasPower);

  const svg = `
    <svg class="mc-scene-svg mc-air-svg" viewBox="0 0 184 104" shape-rendering="crispEdges" aria-label="${isWater ? 'Water' : 'Mars air'} into oxygen chamber">
      <rect width="184" height="104" fill="#07161e"/>

      <!-- Pixel Mars CO2 intake (top-left) -->
      <rect x="8" y="8" width="36" height="16" fill="${!isWater ? '#2c1810' : '#0e2028'}" stroke="${!isWater ? '#facc15' : '#334e5c'}" stroke-width="2"/>
      <rect x="12" y="12" width="10" height="2" fill="${!isWater ? '#fb923c' : '#475569'}"/>
      <rect x="12" y="16" width="10" height="2" fill="${!isWater ? '#fb923c' : '#475569'}"/>
      <text x="33" y="18" class="mc-svg-sub" fill="${!isWater ? '#fef08a' : '#94a3b8'}">CO2</text>

      <!-- Pixel Water Tank filling up (left) -->
      <rect x="18" y="25" width="16" height="4" fill="#64748b"/>
      <rect x="8" y="29" width="36" height="58" fill="#0b222e" stroke="${isWater ? (hasWater ? '#38bdf8' : '#ef4444') : '#385866'}" stroke-width="2"/>
      <rect x="10" y="31" width="2" height="2" fill="#94a3b8"/>
      <rect x="40" y="31" width="2" height="2" fill="#94a3b8"/>
      <rect x="10" y="83" width="2" height="2" fill="#94a3b8"/>
      <rect x="40" y="83" width="2" height="2" fill="#94a3b8"/>
      <rect x="12" y="38" width="28" height="44" fill="#041017"/>
      <rect x="12" y="${waterY}" width="28" height="${waterFillH}" fill="${waterColor}"/>
      ${waterFillH > 2 ? `<rect x="12" y="${waterY}" width="28" height="2" fill="#7dd3fc"/>` : ''}
      ${waterFillH > 10 ? `<g class="mc-anim-float">
        <rect x="16" y="${Math.min(76, waterY + 6)}" width="2" height="2" fill="#bae6fd"/>
        <rect x="30" y="${Math.min(78, waterY + 11)}" width="3" height="3" fill="#e0f2fe"/>
      </g>` : ''}
      <rect x="13" y="54" width="26" height="12" fill="#041017" fill-opacity="0.72"/>
      <text x="26" y="63" class="mc-svg-lbl" fill="#ffffff">${Math.round(d.baseWater)}L</text>
      <text x="26" y="96" class="mc-svg-sub" fill="${isWater ? '#7dd3fc' : '#94a3b8'}">WATER</text>

      <!-- Pipes from sources into Air Chamber -->
      <!-- Upper CO2 pipe -->
      <rect x="44" y="13" width="24" height="6" fill="${!isWater ? (hasPower ? '#fb923c' : '#ef4444') : '#152933'}"/>
      <rect x="62" y="13" width="6" height="24" fill="${!isWater ? (hasPower ? '#fb923c' : '#ef4444') : '#152933'}"/>
      <rect x="44" y="11" width="3" height="10" fill="#64748b"/>
      <!-- Lower Water pipe -->
      <rect x="44" y="55" width="24" height="8" fill="${isWater ? (running ? '#0ea5e9' : '#ef4444') : '#152933'}"/>
      <rect x="44" y="53" width="3" height="12" fill="#94a3b8"/>
      <rect x="65" y="53" width="3" height="12" fill="#94a3b8"/>
      ${running
        ? (isWater
          ? `<g class="mc-anim-flow">
               <rect x="48" y="57" width="4" height="4" fill="#e0f2fe"/>
               <rect x="57" y="57" width="4" height="4" fill="#bae6fd"/>
             </g>`
          : `<g class="mc-anim-flow">
               <rect x="48" y="14" width="4" height="4" fill="#fef08a"/>
               <rect x="57" y="14" width="4" height="4" fill="#fde047"/>
             </g>`)
        : `<text x="56" y="${isWater ? 62 : 19}" class="mc-svg-lbl" fill="#fecaca">X</text>`}

      <!-- Pixel Air Chamber (center) -->
      <rect x="82" y="12" width="18" height="6" fill="#475569"/>
      <rect x="86" y="10" width="10" height="2" fill="#94a3b8"/>
      <rect x="68" y="18" width="46" height="68" fill="#102c37" stroke="${!running ? '#ef4444' : isWater ? '#38bdf8' : '#facc15'}" stroke-width="2"/>
      <rect x="70" y="20" width="2" height="2" fill="#cbd5e1"/>
      <rect x="110" y="20" width="2" height="2" fill="#cbd5e1"/>
      <rect x="70" y="82" width="2" height="2" fill="#cbd5e1"/>
      <rect x="110" y="82" width="2" height="2" fill="#cbd5e1"/>
      <text x="91" y="28" class="mc-svg-sub" fill="#e2e8f0">AIR ROOM</text>
      <rect x="74" y="33" width="34" height="32" fill="#06141b" stroke="${running ? '#22c55e' : '#ef4444'}" stroke-width="2"/>
      ${running
        ? `<g class="mc-anim-float">
             <rect x="78" y="38" width="4" height="4" fill="#38bdf8"/>
             <rect x="99" y="42" width="4" height="4" fill="#4ade80"/>
             <rect x="85" y="54" width="3" height="3" fill="#bae6fd"/>
             <rect x="94" y="56" width="3" height="3" fill="#86efac"/>
           </g>
           <text x="91" y="51" class="mc-svg-lbl mc-anim-pulse" fill="#4ade80">ON</text>`
        : `<text x="91" y="51" class="mc-svg-lbl" fill="#fca5a5">STOP</text>`}
      <text x="91" y="77" class="mc-svg-sub" fill="${isWater ? '#93c5fd' : '#fbbf24'}">${isWater ? '1x PWR' : '2x PWR'}</text>
      ${d.sabatier
        ? `<path d="M91 86v10H26v-9" fill="none" stroke="#4ade80" stroke-width="2"/>
           <g class="mc-anim-flow-rev"><rect x="52" y="94" width="5" height="4" fill="#bbf7d0"/></g>`
        : ''}

      <!-- Pipe from Air Chamber to Oxygen Tank -->
      <rect x="114" y="55" width="22" height="8" fill="${running ? '#16a34a' : '#1e293b'}"/>
      <rect x="114" y="53" width="3" height="12" fill="#94a3b8"/>
      <rect x="133" y="53" width="3" height="12" fill="#94a3b8"/>
      ${running
        ? `<g class="mc-anim-flow">
             <rect x="118" y="57" width="4" height="4" fill="#bbf7d0"/>
             <rect x="127" y="57" width="4" height="4" fill="#86efac"/>
           </g>`
        : ''}

      <!-- Pixel Oxygen Tank filling up (right) -->
      <rect x="152" y="13" width="8" height="6" fill="#94a3b8"/>
      <rect x="148" y="15" width="16" height="3" fill="#cbd5e1"/>
      <rect x="142" y="19" width="28" height="6" fill="#1e3a46" stroke="#4ade80" stroke-width="2"/>
      <rect x="136" y="25" width="40" height="62" fill="#0b242c" stroke="${d.oxygen < 25 ? '#ef4444' : '#4ade80'}" stroke-width="2"/>
      <rect x="138" y="27" width="2" height="2" fill="#94a3b8"/>
      <rect x="172" y="27" width="2" height="2" fill="#94a3b8"/>
      <rect x="138" y="83" width="2" height="2" fill="#94a3b8"/>
      <rect x="172" y="83" width="2" height="2" fill="#94a3b8"/>
      <rect x="140" y="38" width="32" height="44" fill="#041017"/>
      <rect x="140" y="${o2Y}" width="32" height="${o2FillH}" fill="${o2Color}"/>
      ${o2FillH > 2 ? `<rect x="140" y="${o2Y}" width="32" height="2" fill="#bbf7d0" class="mc-anim-pulse"/>` : ''}
      ${o2FillH > 10 ? `<g class="mc-anim-float">
        <rect x="145" y="${Math.min(76, o2Y + 7)}" width="3" height="3" fill="#dcfce7"/>
        <rect x="162" y="${Math.min(78, o2Y + 12)}" width="2" height="2" fill="#bae6fd"/>
      </g>` : ''}
      <rect x="142" y="54" width="28" height="12" fill="#041017" fill-opacity="0.72"/>
      <text x="156" y="63" class="mc-svg-lbl" fill="#ffffff">${Math.round(d.oxygen)}%</text>
      <text x="156" y="96" class="mc-svg-sub" fill="#86efac">OXYGEN</text>
    </svg>`;

  const stage = `
    <div class="mc-stage-box mc-air-panel">
      ${svg}
      <div class="mc-stat-bars mc-air-bars">
        <div class="mc-mini-bar"><span>${pixelIconSvg('filter')} FILTER</span><div class="mc-bar-track"><i style="width:${filterPct}%;background:${filterColor}"></i></div><strong>${Math.round(d.filter)}%</strong></div>
        <div class="mc-mini-bar"><span>${pixelIconSvg('dust')} CO2</span><div class="mc-bar-track"><i style="width:${clampPct(d.co2, 100)}%;background:${co2Color}"></i></div><strong>${Math.round(d.co2)}%</strong></div>
      </div>
      <div class="mc-stage-caption is-${cue.tone}" role="status"><span class="mc-cap-tag">${escapeHtml(cue.tag)}</span><strong>${escapeHtml(cue.text)}</strong></div>
    </div>`;

  const filterNeedsFix = d.filter < 35 || d.co2 >= 40;

  const side = `
    <div class="mc-step-bar">OXYGEN SOURCE</div>
    <div class="mc-action-stack">
      <button type="button" class="mc-btn mc-act-card mc-toggle-row${isWater ? ' is-active' : ''}" data-action="o2mode:electrolysis" aria-pressed="${isWater}">
        <span class="mc-act-icon" aria-hidden="true">${pixelIconSvg('drop')}</span>
        <span class="mc-act-main">
          <strong>WATER</strong>
          <span class="mc-act-costs">${costChip('drop', `${d.baseWater.toFixed(1)} L`)}</span>
        </span>
        ${toggleSwitchHtml(isWater)}
      </button>
      <button type="button" class="mc-btn mc-act-card mc-toggle-row${!isWater ? ' is-active' : ''}" data-action="o2mode:moxie" aria-pressed="${!isWater}">
        <span class="mc-act-icon" aria-hidden="true">${pixelIconSvg('air')}</span>
        <span class="mc-act-main">
          <strong>MARS AIR</strong>
          <span class="mc-act-costs">${costChip('bolt', `${Math.round(d.energy)}%`)}</span>
        </span>
        ${toggleSwitchHtml(!isWater)}
      </button>
      <div class="mc-action-duo">
        ${actionCard({
          action: 'filter',
          icon: 'filter',
          title: 'FILTER',
          costHtml: costChip('filter', `${Math.round(d.filter)}%`),
          urgent: filterNeedsFix,
          disabled: d.filter >= 99 || d.energy < C.FILTER_COST,
          compact: true,
        })}
        ${actionCard({
          action: 'buildSabatier',
          icon: 'up',
          title: '+50% H2O',
          costHtml: d.sabatier ? costChip('drop', 'ON') : costChip('rock', `${d.regolith}/${O.SABATIER_REGOLITH}`),
          disabled: d.sabatier || d.regolith < O.SABATIER_REGOLITH || d.energy < O.SABATIER_POWER,
          pressed: d.sabatier,
          compact: true,
        })}
      </div>
      ${d.contaminated ? actionCard({
        action: 'cleanBase',
        icon: 'dust',
        title: 'CLEAN',
        costHtml: costChip('bolt', `${C.DECONTAMINATION_COST}%`),
        badgeText: 'FIX',
        badgeTone: 'warn',
        urgent: true,
        disabled: d.energy < C.DECONTAMINATION_COST,
        compact: true,
      }) : ''}
    </div>`;

  const fact = `
    <p><strong>Real Chemistry:</strong> 36 g of water splits into 32 g of oxygen (ISS). A <strong>Sabatier</strong> reactor gives back half of that water!</p>
    <p><strong>MOXIE</strong> on NASA's Perseverance rover made oxygen from Mars CO2 air.</p>
    <p>Water used so far: <strong>${d.waterUsedL.toFixed(1)} L</strong>.</p>`;

  return { top, checks: '', stage, side, fact };
}

/* ---------------- 3. MEDICAL (MEDBAY SCAN) ---------------- */
function renderMedical(d: MachineViewData): { top: string; checks: string; stage: string; side: string; fact: string; extra: string } {
  const dosePct = clampPct(d.dose.total, d.dose.limit);
  const top = [
    resPill('health', 'heart', `${Math.round(d.health)}/${d.maxStat}`, 'mc-res-health', 'Health'),
    resPill('beds', 'bone', `${Math.round(d.boneDensity)}%`, 'mc-res-bones', 'Bone strength'),
    resPill('power', 'bolt', `${Math.round(d.energy)}%`, 'mc-res-power', 'Battery'),
    d.dose.grounded ? alertPill('DOSE LIMIT!', 'danger') : '',
  ].filter(Boolean).join('');

  const heartColor = d.health >= 65 ? '#4ade80' : d.health >= 35 ? '#facc15' : '#ef4444';
  const boneColor = d.boneDensity >= 65 ? '#f8fafc' : '#fde047';
  const doseBarH = Math.round((dosePct / 100) * 68);
  const eyeColor = d.health >= 50 ? '#e0f2fe' : '#fde047';

  const svg = `
    <svg class="mc-scene-svg mc-air-svg" viewBox="0 0 176 128" shape-rendering="crispEdges" aria-hidden="true">
      <rect x="0" y="0" width="176" height="128" fill="#07181b"/>
      <!-- Medbay Scanner Pod -->
      <rect x="14" y="8" width="100" height="112" fill="#0a2024" stroke="#34d399" stroke-width="2"/>
      <rect x="18" y="12" width="6" height="2" fill="#6ee7b7"/>
      <rect x="18" y="12" width="2" height="6" fill="#6ee7b7"/>
      <rect x="104" y="12" width="6" height="2" fill="#6ee7b7"/>
      <rect x="108" y="12" width="2" height="6" fill="#6ee7b7"/>
      <rect x="18" y="114" width="6" height="2" fill="#6ee7b7"/>
      <rect x="104" y="114" width="6" height="2" fill="#6ee7b7"/>
      <!-- Medical Cross Badge -->
      <rect x="22" y="16" width="12" height="12" fill="#0f2e33" stroke="#34d399" stroke-width="1"/>
      <rect x="27" y="18" width="2" height="8" fill="#4ade80"/>
      <rect x="24" y="21" width="8" height="2" fill="#4ade80"/>
      <!-- Scanner Grid -->
      <rect x="18" y="34" width="92" height="1" fill="#134242"/>
      <rect x="18" y="58" width="92" height="1" fill="#134242"/>
      <rect x="18" y="82" width="92" height="1" fill="#134242"/>
      <rect x="18" y="104" width="92" height="1" fill="#134242"/>
      <!-- Cute Chibi Astronaut X-Ray -->
      <!-- Helmet Shell & Ears -->
      <rect x="46" y="21" width="36" height="24" fill="#1d4d54"/>
      <rect x="50" y="18" width="28" height="3" fill="#256168"/>
      <rect x="43" y="27" width="3" height="10" fill="#2dd4bf" fill-opacity="0.55"/>
      <rect x="82" y="27" width="3" height="10" fill="#2dd4bf" fill-opacity="0.55"/>
      <!-- Visor + Cute Eyes -->
      <rect x="51" y="24" width="26" height="16" fill="#0d2f3a" stroke="#38bdf8" stroke-width="1"/>
      <rect x="53" y="26" width="5" height="2" fill="#bae6fd" fill-opacity="0.7"/>
      <rect x="56" y="29" width="4" height="5" fill="${eyeColor}"/>
      <rect x="68" y="29" width="4" height="5" fill="${eyeColor}"/>
      <rect x="57" y="30" width="2" height="2" fill="#ffffff"/>
      <rect x="69" y="30" width="2" height="2" fill="#ffffff"/>
      <!-- Collar + Suit Body -->
      <rect x="52" y="45" width="24" height="3" fill="#fb923c" fill-opacity="0.7"/>
      <rect x="44" y="48" width="40" height="32" fill="#1d4d54"/>
      <!-- Arms & Cute Gloves -->
      <rect x="33" y="49" width="9" height="22" fill="#1d4d54"/>
      <rect x="86" y="49" width="9" height="22" fill="#1d4d54"/>
      <rect x="33" y="71" width="9" height="6" fill="#256168"/>
      <rect x="86" y="71" width="9" height="6" fill="#256168"/>
      <!-- Legs & Chunky Boots -->
      <rect x="47" y="80" width="13" height="22" fill="#1d4d54"/>
      <rect x="68" y="80" width="13" height="22" fill="#1d4d54"/>
      <rect x="45" y="102" width="16" height="7" fill="#163b40"/>
      <rect x="67" y="102" width="16" height="7" fill="#163b40"/>
      <!-- Glowing X-Ray Bones inside -->
      <rect x="62" y="49" width="4" height="28" fill="${boneColor}"/>
      <rect x="50" y="52" width="28" height="3" fill="${boneColor}"/>
      <rect x="52" y="59" width="24" height="3" fill="${boneColor}"/>
      <rect x="54" y="66" width="20" height="3" fill="${boneColor}"/>
      <rect x="36" y="54" width="3" height="16" fill="${boneColor}"/>
      <rect x="89" y="54" width="3" height="16" fill="${boneColor}"/>
      <rect x="52" y="83" width="4" height="18" fill="${boneColor}"/>
      <rect x="72" y="83" width="4" height="18" fill="${boneColor}"/>
      <!-- Cute 2-Lobe Beating Pixel Heart -->
      <g class="mc-anim-pulse">
        <rect x="67" y="53" width="4" height="4" fill="${heartColor}"/>
        <rect x="73" y="53" width="4" height="4" fill="${heartColor}"/>
        <rect x="67" y="56" width="10" height="4" fill="${heartColor}"/>
        <rect x="69" y="60" width="6" height="3" fill="${heartColor}"/>
        <rect x="71" y="63" width="2" height="2" fill="${heartColor}"/>
      </g>
      <!-- ECG Pulse Line at Bottom -->
      <path d="M20 112h20l4-6 4 10 4-8 3 4h53" fill="none" stroke="${heartColor}" stroke-width="1.5" class="mc-anim-pulse"/>
      <!-- Laser Scanline -->
      <g class="mc-anim-scan">
        <rect x="16" y="16" width="96" height="3" fill="#4ade80" fill-opacity="0.9"/>
        <rect x="16" y="19" width="96" height="4" fill="#4ade80" fill-opacity="0.22"/>
      </g>
      <!-- Cute Radiation Dose Tube on Right -->
      <rect x="134" y="14" width="16" height="5" fill="#94a3b8"/>
      <rect x="125" y="19" width="34" height="94" fill="#0b1b22" stroke="${d.dose.grounded ? '#ef4444' : '#f59e0b'}" stroke-width="2"/>
      <rect x="130" y="25" width="24" height="72" fill="#061116"/>
      <rect x="130" y="${97 - doseBarH}" width="24" height="${doseBarH}" fill="${d.dose.grounded ? '#ef4444' : '#f59e0b'}"/>
      ${doseBarH > 2 ? `<rect x="130" y="${97 - doseBarH}" width="24" height="2" fill="#fde047"/>` : ''}
      <rect x="128" y="28" width="28" height="2" fill="#ef4444" fill-opacity="0.7"/>
      <text x="142" y="107" class="mc-svg-sub" fill="#fbbf24">mSv</text>
    </svg>`;

  const doseChips = [
    ['TRIP', d.dose.transit],
    ['OUTSIDE', d.dose.eva],
    ['STORMS', d.dose.storm],
    ['REACTOR', d.dose.reactor],
  ]
    .filter(([, v], idx) => idx < 3 || Number(v) > 0)
    .map(([lbl, val]) => `<span class="mc-dose-chip"><b>${lbl}</b> ${Math.round(Number(val))}</span>`)
    .join('');

  const stage = `
    <div class="mc-stage-box">
      ${svg}
      <div class="mc-dose-row" title="Total radiation: ${Math.round(d.dose.total)} / ${Math.round(d.dose.limit)} mSv">
        ${doseChips}
      </div>
    </div>`;

  const side = `
    <div class="mc-step-bar">BODY TELEMETRY</div>
    <div class="mc-stat-bars">
      <div class="mc-mini-bar">
        <span>${pixelIconSvg('bone')} BONES</span>
        <div class="mc-bar-track"><i style="width:${Math.round(d.boneDensity)}%;background:#86efac"></i></div>
        <strong>${Math.round(d.boneDensity)}%</strong>
      </div>
      <div class="mc-mini-bar">
        <span>${pixelIconSvg('radiation')} DOSE</span>
        <div class="mc-bar-track"><i style="width:${dosePct}%;background:${d.dose.grounded ? '#ef4444' : '#fbbf24'}"></i></div>
        <strong>${Math.round(d.dose.total)} mSv</strong>
      </div>
    </div>
    <div class="mc-action-stack">
      ${actionCard({
        action: 'treat',
        icon: 'heart',
        title: d.health >= d.maxStat ? 'HEALTH FULL' : 'HEAL +5',
        costHtml: d.health >= d.maxStat ? '' : costChip('bolt', `${C.TREATMENT_COST}%`),
        badgeText: d.health >= d.maxStat ? 'OK' : 'HEAL',
        badgeTone: d.health >= d.maxStat ? 'on' : 'ready',
        disabled: d.health >= d.maxStat || d.energy < C.TREATMENT_COST,
      })}
    </div>
    <div class="mc-tip-pill">${pixelIconSvg('medal')} GYM = STRONGER BONES</div>`;

  const fact = `<p>${escapeHtml(d.medbayBoneFact)}</p><p>Radiation dose only goes up — it cannot be erased.</p>`;
  const extra = d.radlabHtml ? `<div class="mc-nasa-chart">${d.radlabHtml}</div>` : '';

  return { top, checks: '', stage, side, fact, extra };
}

/* ---------------- 4. SCIENCE & RADIO ---------------- */
function renderScience(d: MachineViewData): { top: string; checks: string; stage: string; side: string; fact: string } {
  const top = [
    resPill('science', 'scope', `${d.science}`, 'mc-res-sci', 'Science points'),
    resPill('rock', 'rock', `${d.samples}`, 'mc-res-samples', 'Regolith waiting'),
    resPill('power', 'bolt', `${Math.round(d.energy)}%`, 'mc-res-power', 'Battery'),
    d.commsBlackout ? alertPill('SUN BLOCK!', 'warn') : '',
  ].filter(Boolean).join('');

  const hasSampleReady = d.samples > 0 && d.regolith > 0;

  const svg = `
    <svg class="mc-scene-svg" viewBox="0 0 176 128" shape-rendering="crispEdges" aria-hidden="true">
      <rect x="0" y="0" width="176" height="128" fill="#0d1126"/>
      <!-- Stars -->
      <rect x="16" y="12" width="2" height="2" fill="#cbd5e1"/>
      <rect x="74" y="8" width="2" height="2" fill="#e9d5ff"/>
      <rect x="118" y="18" width="2" height="2" fill="#cbd5e1"/>
      <!-- Earth (top right) -->
      <rect x="142" y="14" width="18" height="18" fill="#2563eb"/>
      <rect x="146" y="18" width="6" height="6" fill="#4ade80"/>
      <rect x="152" y="24" width="5" height="4" fill="#4ade80"/>
      <!-- Mars Orbiter -->
      <g class="mc-anim-float">
        <rect x="70" y="30" width="22" height="10" fill="#cbd5e1"/>
        <rect x="54" y="32" width="14" height="6" fill="#38bdf8"/>
        <rect x="94" y="32" width="14" height="6" fill="#38bdf8"/>
        <rect x="78" y="40" width="6" height="5" fill="#c084fc"/>
      </g>
      <!-- Radio Beam or Sun Block -->
      ${d.commsBlackout
        ? `<rect x="108" y="16" width="22" height="22" fill="#facc15"/>
           <rect x="112" y="20" width="14" height="14" fill="#fef08a"/>
           <rect x="96" y="26" width="10" height="3" fill="#ef4444"/>`
        : `<g class="mc-anim-flow">
             <rect x="104" y="28" width="6" height="3" fill="#4ade80"/>
             <rect x="118" y="24" width="6" height="3" fill="#4ade80"/>
             <rect x="132" y="21" width="6" height="3" fill="#4ade80"/>
           </g>`}
      <!-- Lab Bench & Rock Microscope (bottom) -->
      <rect x="0" y="72" width="176" height="56" fill="#171936"/>
      <rect x="0" y="72" width="176" height="3" fill="#4c1d95"/>
      <!-- Microscope arm -->
      <rect x="26" y="80" width="10" height="38" fill="#94a3b8"/>
      <rect x="20" y="112" width="48" height="8" fill="#64748b"/>
      <rect x="36" y="82" width="22" height="8" fill="#cbd5e1"/>
      <rect x="50" y="90" width="8" height="10" fill="#c084fc"/>
      <!-- Laser beam onto rock -->
      ${hasSampleReady ? `<g class="mc-anim-pulse"><rect x="53" y="100" width="2" height="8" fill="#e879f9"/></g>` : ''}
      <!-- Rock sample on tray -->
      <rect x="44" y="106" width="20" height="8" fill="${hasSampleReady ? '#c2410c' : '#334155'}"/>
      ${hasSampleReady ? `<rect x="48" y="104" width="10" height="4" fill="#fb923c"/>` : ''}
      <!-- Package Counter Boxes on right bench -->
      <rect x="96" y="84" width="66" height="32" fill="#11132b" stroke="#a78bfa" stroke-width="2"/>
      <rect x="104" y="92" width="12" height="12" fill="${d.pkgItems >= 1 ? '#a78bfa' : '#26294a'}"/>
      <rect x="122" y="92" width="12" height="12" fill="${d.pkgItems >= 2 ? '#a78bfa' : '#26294a'}"/>
      <rect x="140" y="92" width="12" height="12" fill="${d.pkgItems >= 3 ? '#a78bfa' : '#26294a'}"/>
    </svg>`;

  const stage = `
    <div class="mc-stage-box">
      ${svg}
      <div class="mc-stage-caption">
        <span class="mc-cap-tag">SENT</span>
        <strong>${d.sentDiscoveries} scans · ${d.sentSamples} rocks</strong>
      </div>
    </div>`;

  const side = `
    <div class="mc-step-bar">LAB &amp; ORBITER</div>
    <div class="mc-action-stack">
      ${actionCard({
        action: 'analyze',
        icon: 'rock',
        title: 'ANALYZE ROCK',
        costHtml: `${costChip('rock', '1')}${costChip('bolt', `${SCIENCE_CONFIG.ANALYZE_POWER_COST}%`)}`,
        badgeText: `+${C.SCIENCE_PER_SAMPLE}`,
        badgeTone: hasSampleReady ? 'ready' : 'off',
        disabled: !hasSampleReady || d.energy < SCIENCE_CONFIG.ANALYZE_POWER_COST,
      })}
      ${actionCard({
        action: 'sendScience',
        icon: 'radio',
        title: d.pkgItems > 0 ? `SEND ${d.pkgItems} TO EARTH` : 'NOTHING NEW',
        costHtml: d.pkgItems > 0 ? costChip('bolt', `${d.pkgCost}%`) : '',
        badgeText: d.pkgItems > 0 ? 'UPLOAD' : 'EMPTY',
        badgeTone: d.pkgItems > 0 ? 'ready' : 'off',
        disabled: d.pkgItems <= 0 || d.energy < d.pkgCost,
      })}
      ${actionCard({
        action: 'send',
        icon: 'scope',
        title: d.commsBlackout ? 'RADIO SILENT' : 'ASK EARTH',
        costHtml: d.commsBlackout ? '' : costChip('bolt', `${C.COMMS_COST}%`),
        disabled: d.commsBlackout || d.energy < C.COMMS_COST,
        compact: true,
      })}
      <div class="mc-action-duo">
        ${actionCard({
          action: 'upgrade',
          icon: 'shield',
          title: d.upgraded ? 'SUIT MAX' : 'SUIT +',
          costHtml: d.upgraded ? '' : costChip('scope', `${C.UPGRADE_COST}`),
          disabled: d.upgraded || d.science < C.UPGRADE_COST,
          pressed: d.upgraded,
          compact: true,
        })}
        ${actionCard({
          action: 'upgradeTool',
          icon: 'wrench',
          title: d.toolUpgraded ? 'TOOL MAX' : 'TOOL +',
          costHtml: d.toolUpgraded ? '' : costChip('scope', `${C.TOOL_UPGRADE_COST}`),
          disabled: d.toolUpgraded || d.science < C.TOOL_UPGRADE_COST,
          pressed: d.toolUpgraded,
          compact: true,
        })}
      </div>
    </div>`;

  const fact = `
    <p><strong>Earth Distance:</strong> ${Math.round(d.commsDistanceMkm)} million km (NASA/JPL orbits on ${escapeHtml(d.commsDate)}). One radio message takes <strong>${d.commsLightMin.toFixed(1)} min</strong> one way (${COMMS_CONFIG.GAME_SECONDS_PER_LIGHT_MINUTE} s in game).</p>
    <p>Real Mars rovers send data to an orbiter overhead (<strong>NASA Mars Relay Network</strong>), which beams it to Earth!</p>`;

  return { top, checks: '', stage, side, fact };
}

/* ---------------- 5. GALLEY (SPACE KITCHEN) ---------------- */
function renderGalley(d: MachineViewData): { top: string; checks: string; stage: string; side: string; fact: string } {
  const top = [
    resPill('beds', 'food', `${Math.floor(d.crewFood)}/${d.maxCrewFood}`, 'mc-res-rations', 'Crew rations'),
    resPill('food', 'plant', `${d.carrots}`, 'mc-res-carrots', 'Carrots in bag'),
    resPill('water', 'drop', `${Math.round(d.baseWater)} L`, 'mc-res-water', 'Base water'),
    resPill('power', 'bolt', `${Math.round(d.energy)}%`, 'mc-res-power', 'Battery'),
    d.cold ? alertPill('FROZEN!', 'danger') : '',
  ].filter(Boolean).join('');

  const checks = checksHtml([
    { ok: d.carrots >= 1, label: 'CARROT', detail: d.carrots >= 1 ? `${d.carrots} in bag` : 'Grow in greenhouse' },
    { ok: d.baseWater >= U.MEAL_WATER_L && !d.cold, label: 'WARM WATER', detail: d.cold ? 'Turn heater on!' : `${Math.round(d.baseWater)} L ready` },
    { ok: d.energy >= U.MEAL_POWER, label: 'POWER', detail: `${Math.round(d.energy)}% battery` },
  ]);

  const canCook = d.carrots >= 1 && d.baseWater >= U.MEAL_WATER_L && !d.cold && d.energy >= U.MEAL_POWER;

  // Draw up to 8 ration boxes on pantry shelf
  const totalSlots = Math.min(8, d.maxCrewFood);
  const filledSlots = Math.round((Math.min(d.crewFood, d.maxCrewFood) / Math.max(1, d.maxCrewFood)) * totalSlots);
  const shelfBoxes = Array.from({ length: totalSlots }, (_, i) => {
    const x = 18 + i * 17;
    return `<rect x="${x}" y="18" width="13" height="12" fill="${i < filledSlots ? '#fbbf24' : '#291e14'}" stroke="#78350f" stroke-width="1"/>`;
  }).join('');

  const svg = `
    <svg class="mc-scene-svg" viewBox="0 0 168 128" shape-rendering="crispEdges" aria-hidden="true">
      <rect x="0" y="0" width="168" height="128" fill="#1e150e"/>
      <!-- Pantry Shelf -->
      <rect x="12" y="10" width="144" height="24" fill="#2d1f14" stroke="#92400e" stroke-width="2"/>
      ${shelfBoxes}
      <!-- Rising Steam (or Ice if frozen) -->
      ${d.cold
        ? `<rect x="66" y="54" width="36" height="8" fill="#7dd3fc"/>`
        : `<g class="mc-anim-float">
             <rect x="70" y="48" width="6" height="6" fill="#fef3c7" fill-opacity="0.7"/>
             <rect x="84" y="42" width="6" height="6" fill="#fef3c7" fill-opacity="0.7"/>
             <rect x="96" y="50" width="5" height="5" fill="#fef3c7" fill-opacity="0.5"/>
           </g>`}
      <!-- Cooking Pot -->
      <rect x="56" y="64" width="56" height="30" fill="#94a3b8"/>
      <rect x="60" y="68" width="48" height="22" fill="#64748b"/>
      <rect x="48" y="70" width="8" height="6" fill="#cbd5e1"/>
      <rect x="112" y="70" width="8" height="6" fill="#cbd5e1"/>
      <!-- Carrot peeking out -->
      <rect x="74" y="58" width="14" height="6" fill="#fb923c"/>
      <rect x="88" y="56" width="6" height="6" fill="#4ade80"/>
      <!-- Burner Glow -->
      <rect x="62" y="96" width="44" height="6" fill="${d.cold ? '#38bdf8' : '#f97316'}"/>
      <!-- Counter -->
      <rect x="0" y="102" width="168" height="26" fill="#451a03"/>
      <rect x="0" y="102" width="168" height="3" fill="#b45309"/>
    </svg>`;

  const stage = `
    <div class="mc-stage-box">
      ${svg}
      <div class="mc-stage-caption">
        <span class="mc-cap-tag">${d.freshFoodActive ? 'BOOST ON' : 'HUNGER'}</span>
        <strong>${d.freshFoodActive ? 'Working faster from fresh meal!' : `Your food: ${Math.round(d.food)}/${d.maxStat}`}</strong>
      </div>
    </div>`;

  const side = `
    <div class="mc-step-bar">COOK FRESH MEAL</div>
    <div class="mc-action-stack">
      ${actionCard({
        action: 'cookMeal',
        icon: 'pot',
        title: 'COOK FRESH MEAL',
        costHtml: `${costChip('food', '1')}${costChip('drop', `${U.MEAL_WATER_L}L`)}${costChip('bolt', `${U.MEAL_POWER}%`)}`,
        badgeText: canCook ? 'COOK!' : 'NEED',
        badgeTone: canCook ? 'ready' : 'off',
        disabled: !canCook,
      })}
    </div>
    <div class="mc-tip-pill">${pixelIconSvg('food')} Talk to cook [F] for ration (${Math.floor(d.crewFood)} left)</div>`;

  const fact = `
    <p><strong>Real Case:</strong> Astronauts mostly eat food packed on Earth, and fresh crops from space greenhouses supplement their meals with vitamins and flavor.</p>
    <p>Cooking fresh meals on Mars here is a game rule that gives you a work speed boost!</p>`;

  return { top, checks, stage, side, fact };
}

/* ---------------- 6. HYGIENE (WATER LOOP) ---------------- */
function renderHygiene(d: MachineViewData): { top: string; checks: string; stage: string; side: string; fact: string } {
  const top = [
    resPill('water', 'drop', `${Math.round(d.baseWater)} L`, 'mc-res-water', 'Clean water tank'),
    resPill('rock', 'air', `${d.graywater.toFixed(1)} L`, 'mc-res-gray', 'Used gray water'),
    resPill('beds', 'filter', `${Math.round(d.waterFilter)}%`, 'mc-res-wfilter', 'Water filter'),
    d.cold ? alertPill('PIPES FROZEN!', 'danger') : '',
  ].filter(Boolean).join('');

  const cleanH = Math.round((clampPct(d.baseWater, d.maxBaseWater) / 100) * 52);
  const grayH = Math.round((clampPct(d.graywater, 40) / 100) * 52);
  const filterColor = d.waterFilter >= U.WORN_FILTER ? '#4ade80' : '#f59e0b';

  const svg = `
    <svg class="mc-scene-svg" viewBox="0 0 176 128" shape-rendering="crispEdges" aria-hidden="true">
      <rect x="0" y="0" width="176" height="128" fill="#071921"/>
      <!-- Top Pipe (Clean -> Wash -> Gray) -->
      <rect x="34" y="16" width="108" height="6" fill="${d.cold ? '#7dd3fc' : '#0284c7'}"/>
      <rect x="76" y="10" width="24" height="18" fill="#1e3a4a" stroke="#7dd3fc" stroke-width="2"/>
      <!-- Clean Tank (Left) -->
      <rect x="16" y="28" width="38" height="62" fill="#0b222d" stroke="#38bdf8" stroke-width="2"/>
      <rect x="19" y="${87 - cleanH}" width="32" height="${cleanH}" fill="#0ea5e9"/>
      <rect x="19" y="${87 - cleanH}" width="32" height="3" fill="#bae6fd"/>
      <!-- Gray Tank (Right) -->
      <rect x="122" y="28" width="38" height="62" fill="#162124" stroke="#94a3b8" stroke-width="2"/>
      <rect x="125" y="${87 - grayH}" width="32" height="${grayH}" fill="#64748b"/>
      <!-- Bottom Recycle Pipe + Filter -->
      <rect x="34" y="102" width="108" height="6" fill="${d.cold ? '#7dd3fc' : '#22c55e'}"/>
      <rect x="34" y="90" width="6" height="14" fill="#22c55e"/>
      <rect x="136" y="90" width="6" height="14" fill="#64748b"/>
      <rect x="72" y="94" width="32" height="22" fill="#0d2629" stroke="${filterColor}" stroke-width="2"/>
      <rect x="76" y="98" width="24" height="14" fill="${filterColor}"/>
      <!-- Flowing drops -->
      ${d.cold ? '' : `<g class="mc-anim-flow-rev">
        <rect x="52" y="103" width="6" height="4" fill="#bbf7d0"/>
        <rect x="114" y="103" width="6" height="4" fill="#fde047"/>
      </g>`}
    </svg>`;

  const stage = `
    <div class="mc-stage-box">
      ${svg}
      <div class="mc-stage-caption">
        <span class="mc-cap-tag">${d.waterRecoveryPct}% BACK</span>
        <strong>${d.cold ? 'Pipes frozen! Turn heater on.' : 'Clean -> Use -> Recycle -> Drink!'}</strong>
      </div>
    </div>`;

  const side = `
    <div class="mc-step-bar">WATER RECYCLER</div>
    <div class="mc-stat-bars">
      <div class="mc-mini-bar">
        <span>${pixelIconSvg('filter')} FILTER</span>
        <div class="mc-bar-track"><i style="width:${Math.round(d.waterFilter)}%;background:${filterColor}"></i></div>
        <strong>${Math.round(d.waterFilter)}%</strong>
      </div>
    </div>
    <div class="mc-action-stack">
      ${actionCard({
        action: 'washUp',
        icon: 'drop',
        title: 'WASH UP',
        costHtml: costChip('drop', `${U.WASH_WATER_L}L`),
        badgeText: `+${U.WASH_HEAL} HP`,
        badgeTone: !d.cold && d.baseWater >= U.WASH_WATER_L ? 'ready' : 'off',
        disabled: d.cold || d.baseWater < U.WASH_WATER_L,
      })}
      ${actionCard({
        action: 'serviceFilter',
        icon: 'filter',
        title: d.waterFilter >= 95 ? 'FILTER CLEAN' : 'CLEAN FILTER',
        costHtml: d.waterFilter >= 95 ? '' : costChip('bolt', `${U.FILTER_SERVICE_POWER}%`),
        badgeText: d.waterFilter >= 95 ? '98%' : 'FIX!',
        badgeTone: d.waterFilter >= 95 ? 'on' : 'warn',
        disabled: d.waterFilter >= 95 || d.energy < U.FILTER_SERVICE_POWER,
      })}
    </div>`;

  const fact = `
    <p><strong>Real Case:</strong> On the International Space Station, the water recycler recovers about <strong>98%</strong> of water (even sweat and urine!).</p>
    <p>As astronauts say: <em>"Yesterday's coffee becomes tomorrow's coffee!"</em></p>`;

  return { top, checks: '', stage, side, fact };
}

/* ---------------- 7. WORKSHOP (3D PRINTER) ---------------- */
function renderWorkshop(d: MachineViewData): { top: string; checks: string; stage: string; side: string; fact: string } {
  const machines: { name: string; pct: number }[] = [
    ...d.crewStations.map((st) => ({ name: st.name, pct: Math.round(st.health * 100) })),
    { name: 'CO2 Filter', pct: Math.round(d.filter) },
  ];
  const worst = machines.reduce<{ name: string; pct: number } | null>(
    (a, b) => (!a || b.pct < a.pct ? b : a),
    null,
  );
  const needsFix = worst !== null && worst.pct < 95;

  const top = [
    resPill('rock', 'rock', `${d.regolith}`, 'mc-res-dirt', 'Mars dirt (regolith)'),
    resPill('power', 'bolt', `${Math.round(d.energy)}%`, 'mc-res-power', 'Battery'),
    needsFix ? alertPill(`FIX: ${worst.name.toUpperCase()}`, 'warn') : '',
  ].filter(Boolean).join('');

  const canPrint = needsFix && d.regolith >= U.PRINT_REGOLITH && d.energy >= U.PRINT_POWER;

  const svg = `
    <svg class="mc-scene-svg" viewBox="0 0 168 128" shape-rendering="crispEdges" aria-hidden="true">
      <rect x="0" y="0" width="168" height="128" fill="#1a120d"/>
      <!-- 3D Printer Frame -->
      <rect x="22" y="14" width="8" height="96" fill="#64748b"/>
      <rect x="138" y="14" width="8" height="96" fill="#64748b"/>
      <rect x="22" y="14" width="124" height="8" fill="#94a3b8"/>
      <!-- Regolith Hopper -->
      <rect x="120" y="24" width="24" height="22" fill="#431407" stroke="#fb923c" stroke-width="2"/>
      <rect x="124" y="30" width="16" height="12" fill="#c2410c"/>
      <!-- Moving Extruder Nozzle -->
      <g class="mc-anim-print">
        <rect x="64" y="24" width="40" height="10" fill="#475569"/>
        <rect x="78" y="34" width="12" height="12" fill="#f97316"/>
        <rect x="82" y="46" width="4" height="22" fill="#fde047" fill-opacity="0.8"/>
      </g>
      <!-- Printed Spare Gear on Bed -->
      <rect x="64" y="72" width="40" height="20" fill="#fb923c"/>
      <rect x="72" y="66" width="24" height="6" fill="#fdba74"/>
      <rect x="78" y="76" width="12" height="12" fill="#1a120d"/>
      <!-- Print Bed -->
      <rect x="34" y="92" width="100" height="10" fill="#334155"/>
      <rect x="22" y="102" width="124" height="10" fill="#475569"/>
    </svg>`;

  const machineBars = machines.map((m) => {
    const isTarget = needsFix && m.name === worst?.name;
    const barColor = m.pct < 60 ? '#ef4444' : m.pct < 95 ? '#facc15' : '#4ade80';
    return `
      <div class="mc-mini-bar ${isTarget ? 'is-target' : ''}">
        <span>${escapeHtml(m.name.toUpperCase())}</span>
        <div class="mc-bar-track"><i style="width:${m.pct}%;background:${barColor}"></i></div>
        <strong>${m.pct}%</strong>
      </div>`;
  }).join('');

  const stage = `
    <div class="mc-stage-box">
      ${svg}
      <div class="mc-stage-caption">
        <span class="mc-cap-tag">${needsFix ? 'TARGET' : 'READY'}</span>
        <strong>${needsFix && worst ? `Next fix: ${escapeHtml(worst.name)} (${worst.pct}%)` : 'All base machines 100%!'}</strong>
      </div>
    </div>`;

  const side = `
    <div class="mc-step-bar">BASE MACHINES</div>
    <div class="mc-stat-bars">${machineBars}</div>
    <div class="mc-action-stack">
      ${actionCard({
        action: 'printPart',
        icon: 'wrench',
        title: needsFix ? 'PRINT SPARE PART' : 'ALL FIXED',
        costHtml: needsFix ? `${costChip('rock', `${U.PRINT_REGOLITH}`)}${costChip('bolt', `${U.PRINT_POWER}%`)}` : '',
        badgeText: canPrint ? 'PRINT!' : needsFix ? 'NEED' : 'OK',
        badgeTone: canPrint ? 'ready' : needsFix ? 'warn' : 'on',
        disabled: !canPrint,
      })}
    </div>`;

  const fact = `
    <p><strong>Real Case:</strong> Spare parts from Earth take months to arrive! The 3D printer melts Mars dirt (regolith) into new parts.</p>
    <p>The first 3D print in space was made on the International Space Station in <strong>2014</strong>.</p>`;

  return { top, checks: '', stage, side, fact };
}

/* ---------------- 8. SHELTER (STORM SHIELD) ---------------- */
function renderShelter(d: MachineViewData): { top: string; checks: string; stage: string; side: string; fact: string } {
  const maxWall = RADIATION_CONFIG.SHELTER_WALL_MAX_L;
  const availableWater = d.shelterWaterL + d.baseWater;
  const minWall = Math.max(0, availableWater - d.maxBaseWater);
  const maxAvailableWall = Math.min(maxWall, availableWater);
  const wallFrac = Math.max(0, Math.min(1, d.shelterWaterL / maxWall));
  const stormAlert = d.stormPhase === 'active'
    ? alertPill('STORM ACTIVE!', 'danger')
    : d.stormPhase === 'warning'
      ? alertPill('STORM COMING!', 'warn')
      : '';

  const top = [
    resPill('water', 'brick', `${Math.round(d.shelterWaterL)}/${maxWall} L`, 'mc-res-wall', 'Water wall'),
    resPill('beds', 'shield', `${d.shelterBlockedPct}%`, 'mc-res-shield', 'Radiation blocked'),
    resPill('power', 'tank', `${Math.round(d.baseWater)} L`, 'mc-res-tank', 'Drinking tank'),
    stormAlert,
  ].filter(Boolean).join('');

  // Dynamic blue water wall thickness (0 to 5 columns of water bricks)
  const cols = Math.round(wallFrac * 5);
  const brickCols = Array.from({ length: 5 }, (_, c) => {
    const x = 67 + c * 6;
    const filled = c < cols;
    return `
      <rect x="${x}" y="22" width="5" height="84" fill="${filled ? (c % 2 ? '#38bdf8' : '#0284c7') : '#122233'}" stroke="#091624" stroke-width="1"/>
      ${filled ? `<rect x="${x + 1}" y="25" width="2" height="78" fill="#7dd3fc" fill-opacity="0.45"/>` : ''}`;
  }).join('');

  const protonsPass = cols < 2;
  const shieldColor = d.shelterBlockedPct >= 65 ? '#4ade80' : d.shelterBlockedPct >= 30 ? '#facc15' : '#ef4444';
  const tankPct = clampPct(d.baseWater, d.maxBaseWater);
  const wallPct = clampPct(d.shelterWaterL, maxWall);

  const svg = `
    <svg class="mc-scene-svg mc-air-svg" viewBox="0 0 176 128" shape-rendering="crispEdges" aria-hidden="true">
      <rect x="0" y="0" width="176" height="128" fill="#0a1324"/>
      <!-- Stars -->
      <rect x="44" y="12" width="2" height="2" fill="#94a3b8"/>
      <rect x="116" y="10" width="2" height="2" fill="#cbd5e1"/>
      <rect x="158" y="18" width="2" height="2" fill="#7dd3fc"/>
      <!-- Cute Pixel Solar Storm Flare on Left -->
      <rect x="6" y="20" width="22" height="22" fill="#f97316"/>
      <rect x="9" y="17" width="16" height="28" fill="#fb923c"/>
      <rect x="3" y="23" width="28" height="16" fill="#fb923c"/>
      <rect x="10" y="24" width="14" height="14" fill="#fde047"/>
      <rect x="13" y="27" width="6" height="6" fill="#fef9c3"/>
      <!-- Solar Storm Protons shooting right -->
      <g class="mc-anim-flow">
        <rect x="32" y="28" width="14" height="4" fill="#facc15"/>
        <rect x="44" y="26" width="4" height="8" fill="#fde047"/>
        <rect x="20" y="54" width="18" height="4" fill="#ef4444"/>
        <rect x="36" y="52" width="4" height="8" fill="#fca5a5"/>
        <rect x="14" y="80" width="16" height="4" fill="#fb923c"/>
        <rect x="28" y="78" width="4" height="8" fill="#fde047"/>
        ${protonsPass
          ? `<rect x="102" y="54" width="12" height="4" fill="#ef4444"/>
             <rect x="100" y="78" width="10" height="4" fill="#facc15"/>`
          : `<rect x="57" y="26" width="4" height="6" fill="#7dd3fc"/>
             <rect x="56" y="53" width="5" height="6" fill="#bae6fd"/>
             <rect x="57" y="79" width="4" height="6" fill="#7dd3fc"/>`}
      </g>
      <!-- Water Shield Wall (center) -->
      <rect x="64" y="18" width="36" height="90" fill="#071320" stroke="#60a5fa" stroke-width="2"/>
      <rect x="62" y="16" width="40" height="3" fill="#94a3b8"/>
      ${brickCols}
      ${cols > 0 ? `<g class="mc-anim-float">
        <rect x="70" y="42" width="2" height="2" fill="#e0f2fe"/>
        <rect x="${67 + Math.max(0, cols - 1) * 6 + 1}" y="68" width="2" height="2" fill="#bae6fd"/>
      </g>` : ''}
      ${!protonsPass ? `<rect x="101" y="20" width="2" height="86" fill="#4ade80" fill-opacity="0.55" class="mc-anim-pulse"/>` : ''}
      <!-- Floor -->
      <rect x="0" y="108" width="176" height="20" fill="#1a2638"/>
      <rect x="0" y="108" width="176" height="2" fill="#334155"/>
      <!-- Cute Chibi Pixel Astronaut (right) -->
      <!-- Status bubble above astronaut -->
      ${protonsPass
        ? `<g class="mc-anim-pulse">
             <rect x="136" y="16" width="4" height="9" fill="#ef4444"/>
             <rect x="136" y="27" width="4" height="4" fill="#ef4444"/>
           </g>`
        : `<g class="mc-anim-float">
             <rect x="132" y="18" width="5" height="5" fill="#4ade80"/>
             <rect x="139" y="18" width="5" height="5" fill="#4ade80"/>
             <rect x="132" y="22" width="12" height="4" fill="#4ade80"/>
             <rect x="135" y="26" width="6" height="3" fill="#4ade80"/>
           </g>`}
      <!-- PLSS Backpack -->
      <rect x="148" y="54" width="7" height="26" fill="#cbd5e1"/>
      <rect x="150" y="57" width="3" height="6" fill="#38bdf8"/>
      <!-- Helmet & Cute Visor Face -->
      <rect x="125" y="34" width="28" height="22" fill="#f8fafc"/>
      <rect x="128" y="31" width="22" height="3" fill="#ffffff"/>
      <rect x="122" y="39" width="3" height="9" fill="#94a3b8"/>
      <rect x="153" y="39" width="3" height="9" fill="#94a3b8"/>
      <rect x="123" y="42" width="2" height="4" fill="#ea580c"/>
      <!-- Visor -->
      <rect x="127" y="37" width="22" height="15" fill="#0f172a" stroke="#f59e0b" stroke-width="1"/>
      <rect x="128" y="38" width="5" height="2" fill="#fde047"/>
      <!-- Cute Eyes inside Visor -->
      ${protonsPass
        ? `<rect x="131" y="43" width="3" height="4" fill="#fef08a"/>
           <rect x="141" y="43" width="3" height="4" fill="#fef08a"/>
           <rect x="136" y="48" width="4" height="2" fill="#fca5a5"/>`
        : `<rect x="131" y="42" width="3" height="5" fill="#bae6fd"/>
           <rect x="141" y="42" width="3" height="5" fill="#bae6fd"/>
           <rect x="132" y="43" width="1" height="2" fill="#ffffff"/>
           <rect x="142" y="43" width="1" height="2" fill="#ffffff"/>
           <rect x="130" y="47" width="2" height="2" fill="#fb7185" fill-opacity="0.7"/>
           <rect x="143" y="47" width="2" height="2" fill="#fb7185" fill-opacity="0.7"/>`}
      <!-- Orange Collar & Suit Torso -->
      <rect x="129" y="56" width="20" height="3" fill="#ea580c"/>
      <rect x="125" y="59" width="26" height="26" fill="#f8fafc"/>
      <!-- Chest Control Pad -->
      <rect x="131" y="63" width="13" height="10" fill="#cbd5e1"/>
      <rect x="133" y="65" width="4" height="3" fill="#38bdf8"/>
      <rect x="139" y="65" width="3" height="3" fill="${protonsPass ? '#ef4444' : '#4ade80'}"/>
      <rect x="125" y="79" width="26" height="3" fill="#ea580c"/>
      <!-- Left Arm & Right Arm (Happy Wave when sheltered) -->
      <rect x="118" y="${protonsPass ? 60 : 54}" width="6" height="16" fill="#e2e8f0"/>
      <rect x="118" y="${protonsPass ? 76 : 50}" width="6" height="5" fill="#334155"/>
      <rect x="151" y="60" width="6" height="16" fill="#e2e8f0"/>
      <rect x="151" y="76" width="6" height="5" fill="#334155"/>
      <!-- Legs & Boots -->
      <rect x="127" y="85" width="9" height="15" fill="#e2e8f0"/>
      <rect x="140" y="85" width="9" height="15" fill="#e2e8f0"/>
      <rect x="125" y="100" width="12" height="8" fill="#1e293b"/>
      <rect x="139" y="100" width="12" height="8" fill="#1e293b"/>
      <rect x="125" y="106" width="12" height="2" fill="#94a3b8"/>
      <rect x="139" y="106" width="12" height="2" fill="#94a3b8"/>
    </svg>`;

  const stage = `
    <div class="mc-stage-box">
      ${svg}
      <div class="mc-stage-caption is-${protonsPass ? 'danger' : 'ok'}">
        <span class="mc-cap-tag">${d.shelterBlockedPct}%</span>
        <strong>${protonsPass ? 'LOW SHIELD!' : 'SAFE!'}</strong>
      </div>
    </div>`;

  const side = `
    <label class="mc-step-bar" for="shelter-water-slider">WATER SHIELD</label>
    <div class="mc-shelter-control">
      <div class="mc-mini-bar mc-shelter-bar">
        <span>${pixelIconSvg('shield')} SHIELD</span>
        <div class="mc-bar-track"><i id="shelter-preview-shield-bar" style="width:${d.shelterBlockedPct}%;background:${shieldColor}"></i></div>
        <strong id="shelter-preview-protection">${d.shelterBlockedPct}%</strong>
      </div>
      <div class="mc-shelter-slider-row">
        <span class="mc-shelter-end" title="Drink tank">${pixelIconSvg('tank')}</span>
        <input id="shelter-water-slider" type="range" min="${minWall}" max="${maxAvailableWall}" step="any" value="${d.shelterWaterL}" aria-label="Water in shield wall, in liters">
        <span class="mc-shelter-end" title="Shield wall">${pixelIconSvg('brick')}</span>
      </div>
      <div class="mc-shelter-pair">
        <div class="mc-shelter-box">
          <div class="mc-shelter-box-head">${pixelIconSvg('tank')} <span>DRINK</span> <b id="shelter-preview-tank">${Math.round(d.baseWater)} L</b></div>
          <div class="mc-bar-track"><i id="shelter-preview-tank-bar" style="width:${tankPct}%;background:#38bdf8"></i></div>
        </div>
        <div class="mc-shelter-box is-wall">
          <div class="mc-shelter-box-head">${pixelIconSvg('brick')} <span>WALL</span> <b id="shelter-preview-wall">${Math.round(d.shelterWaterL)} L</b></div>
          <div class="mc-bar-track"><i id="shelter-preview-wall-bar" style="width:${wallPct}%;background:#4ade80"></i></div>
        </div>
      </div>
    </div>`;

  const fact = `
    <p><strong>Real Case:</strong> Solar storms shoot fast protons! Water is full of hydrogen, which slows protons down. Orion astronauts build shelters with their water and food bags.</p>
    <p>A 10 cm water wall blocks about <strong>83%</strong> of a storm dose (game-scaled).</p>`;

  return { top, checks: '', stage, side, fact };
}

export function renderMachineMonitorHtml(data: MachineViewData): string {
  let parts: { top: string; checks: string; stage: string; side: string; fact: string; extra?: string };
  switch (data.type) {
    case 'console': parts = renderConsole(data); break;
    case 'power': parts = renderPowerAir(data); break;
    case 'medical': parts = renderMedical(data); break;
    case 'science': parts = renderScience(data); break;
    case 'galley': parts = renderGalley(data); break;
    case 'hygiene': parts = renderHygiene(data); break;
    case 'workshop': parts = renderWorkshop(data); break;
    case 'shelter': parts = renderShelter(data); break;
  }

  return `
    <div class="mc-monitor" data-machine="${data.type}">
      <div class="gh-top-bar mc-top-bar">
        ${parts.top}
        ${nasaInfoButtonHtml(parts.fact, data.links, parts.extra ?? '')}
      </div>
      ${parts.checks}
      <div class="gh-body mc-body">
        <div class="mc-stage-wrap">${parts.stage}</div>
        <div class="gh-side mc-side">
          ${parts.side}
          ${data.type === 'power' ? '' : noticeHtml(data.notice, data.noticeKind)}
        </div>
      </div>
    </div>`;
}
