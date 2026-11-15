import { MAV_CONFIG, SCIENCE_CONFIG } from '../config/constants.ts';
import { nasaInfoButtonHtml } from './machineViews.ts';
import { pixelIconSvg } from './pixelIcons.ts';

export interface MavPanelViewData {
  propellantPct: number;
  overallPct: number;
  ready: boolean;
  factoryOn: boolean;
  batteryPct: number;
  iceInBag: number;
  iceWaiting: number;
  iceNeeded: number;
  storms: number;
  stormsNeeded: number;
  dataSent: boolean;
  sampleTubes: number;
  maxSampleTubes: number;
  analyzedSamples: number;
  icePerTube: number;
}

export interface MavCue {
  tag: string;
  text: string;
  tone: 'ok' | 'warn' | 'danger';
}

function clampPct(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

/**
 * Short 2-4 word status cue for the MAV launchpad monitor.
 */
export function mavCue(d: MavPanelViewData): MavCue {
  if (d.ready) return { tag: 'GO', text: 'Ready for liftoff!', tone: 'ok' };
  const fuel = clampPct(d.propellantPct);
  if (fuel < 100 && d.iceWaiting > 0) {
    if (!d.factoryOn) return { tag: 'OFF', text: 'Turn Factory ON!', tone: 'warn' };
    if (d.batteryPct <= 0) return { tag: '0% PWR', text: 'Need battery power!', tone: 'danger' };
    return { tag: 'FUEL', text: `Making fuel (${d.iceWaiting} ice)`, tone: 'ok' };
  }
  if (fuel < 100) return { tag: 'ICE', text: `Load ${d.iceNeeded} ice`, tone: 'warn' };
  if (d.storms < d.stormsNeeded) return { tag: 'STORM', text: `Wait ${d.stormsNeeded - d.storms} storms`, tone: 'warn' };
  return { tag: 'DATA', text: 'Send science data!', tone: 'warn' };
}

/**
 * Pixel-art MAV launchpad SVG with live visual consequences:
 * ice hopper -> ISRU factory -> pipe -> cutaway rocket tank + sample tubes -> launch lights.
 */
export function renderMavStageSvg(d: MavPanelViewData): string {
  const fuel = clampPct(d.propellantPct);
  const fuelH = Math.round((fuel / 100) * 44);
  const fuelY = 50 + (44 - fuelH);
  const factoryRunning = d.factoryOn && d.batteryPct > 0 && d.iceWaiting > 0 && fuel < 100;
  const factoryStopped = d.iceWaiting > 0 && fuel < 100 && (!d.factoryOn || d.batteryPct <= 0);

  const iceVisual = d.iceWaiting > 0
    ? `<rect x="13" y="57" width="8" height="7" fill="#7dd3fc"/>
       <rect x="23" y="59" width="8" height="6" fill="#bae6fd"/>
       ${d.iceWaiting > 2 ? '<rect x="18" y="52" width="7" height="5" fill="#e0f2fe"/>' : ''}`
    : '';

  const tubeSlots = Array.from({ length: d.maxSampleTubes }, (_, idx) => {
    const x = 80 + idx * 9;
    const loaded = idx < d.sampleTubes;
    return loaded
      ? `<rect x="${x}" y="34" width="6" height="9" fill="#4ade80" stroke="#dcfce7" stroke-width="1"/>
         <rect x="${x + 2}" y="37" width="2" height="3" fill="#facc15"/>`
      : `<rect x="${x}" y="34" width="6" height="9" fill="#0d1b26" stroke="#334155" stroke-width="1"/>`;
  }).join('');

  const stormPips = Array.from({ length: d.stormsNeeded }, (_, idx) => {
    const x = 136 + idx * 12;
    const ok = idx < d.storms;
    return `<rect x="${x}" y="58" width="9" height="8" fill="${ok ? '#4ade80' : '#1e293b'}" stroke="${ok ? '#86efac' : '#475569'}" stroke-width="1"/>`;
  }).join('');

  const towerLight = d.ready ? '#4ade80' : factoryRunning ? '#facc15' : '#64748b';
  const factoryLed = factoryStopped ? '#ef4444' : factoryRunning ? '#4ade80' : d.factoryOn ? '#38bdf8' : '#64748b';
  const fuelDone = fuel >= 100;
  const stormsDone = d.storms >= d.stormsNeeded;

  return `
    <svg class="mc-scene-svg mc-air-svg" viewBox="0 0 184 128" shape-rendering="crispEdges" aria-hidden="true">
      <rect width="184" height="128" fill="#131024"/>
      <!-- Martian Stars & Horizon -->
      <rect x="14" y="14" width="2" height="2" fill="#e2e8f0"/>
      <rect x="36" y="24" width="2" height="2" fill="#93c5fd"/>
      <rect x="116" y="12" width="2" height="2" fill="#fde047"/>
      <rect x="4" y="102" width="176" height="26" fill="#2c1612"/>
      <rect x="4" y="102" width="176" height="3" fill="#5c2d20"/>
      <!-- Launch Pad Concrete -->
      <rect x="52" y="104" width="76" height="14" fill="#475569"/>
      <rect x="52" y="104" width="76" height="3" fill="#94a3b8"/>
      <!-- Gantry Tower -->
      <rect x="54" y="22" width="8" height="82" fill="#334155"/>
      <rect x="56" y="16" width="4" height="6" fill="${towerLight}" class="${d.ready || factoryRunning ? 'mc-anim-pulse' : ''}"/>
      <rect x="62" y="34" width="12" height="4" fill="#64748b"/>
      <rect x="62" y="64" width="10" height="4" fill="#64748b"/>

      <!-- Ice Hopper + Fuel Factory (Left) -->
      <rect x="9" y="54" width="26" height="14" fill="#0d222e" stroke="#38bdf8" stroke-width="2"/>
      ${iceVisual}
      <rect x="7" y="68" width="32" height="36" fill="#102833" stroke="${factoryStopped ? '#ef4444' : d.factoryOn ? '#38bdf8' : '#475569'}" stroke-width="2"/>
      <rect x="13" y="74" width="20" height="12" fill="#06141b"/>
      <rect x="17" y="77" width="12" height="6" fill="${factoryLed}" class="${factoryRunning || factoryStopped ? 'mc-anim-pulse' : ''}"/>
      <text x="23" y="98" class="mc-svg-sub" fill="#cbd5e1">${d.factoryOn ? 'ON' : 'OFF'}</text>

      <!-- Pipe from Factory into Rocket -->
      <rect x="39" y="88" width="36" height="8" fill="${factoryRunning ? '#f97316' : factoryStopped ? '#7f1d1d' : '#1e293b'}"/>
      <rect x="39" y="86" width="3" height="12" fill="#94a3b8"/>
      <rect x="72" y="86" width="3" height="12" fill="#94a3b8"/>
      ${factoryRunning
        ? `<g class="mc-anim-flow">
             <rect x="46" y="90" width="5" height="4" fill="#fef08a"/>
             <rect x="59" y="90" width="5" height="4" fill="#bae6fd"/>
           </g>`
        : factoryStopped
          ? '<text x="57" y="95" class="mc-svg-lbl" fill="#fecaca">X</text>'
          : ''}

      <!-- MAV Rocket (Center) -->
      <!-- Nose Cone -->
      <rect x="90" y="10" width="6" height="6" fill="#ea580c"/>
      <rect x="86" y="16" width="14" height="6" fill="#ea580c"/>
      <rect x="80" y="22" width="26" height="8" fill="#f8fafc"/>
      <!-- Sample Tubes Payload Bay -->
      <rect x="76" y="30" width="34" height="16" fill="#1e293b" stroke="#94a3b8" stroke-width="2"/>
      ${tubeSlots}
      <!-- Main Hull & Cutaway Fuel Tank -->
      <rect x="74" y="46" width="38" height="52" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2"/>
      <rect x="74" y="46" width="38" height="4" fill="#ea580c"/>
      <rect x="78" y="50" width="30" height="44" fill="#07131a"/>
      <rect x="78" y="${fuelY}" width="30" height="${fuelH}" fill="${fuelDone ? '#22c55e' : '#f97316'}"/>
      ${fuelH > 2 ? `<rect x="78" y="${fuelY}" width="30" height="2" fill="${fuelDone ? '#bbf7d0' : '#fde047'}"/>` : ''}
      ${factoryRunning && fuelH > 8 ? `<g class="mc-anim-float">
        <rect x="83" y="${Math.min(88, fuelY + 6)}" width="3" height="3" fill="#fef08a"/>
        <rect x="99" y="${Math.min(89, fuelY + 11)}" width="2" height="2" fill="#ffffff"/>
      </g>` : ''}
      <rect x="79" y="65" width="28" height="12" fill="#07131a" fill-opacity="0.72"/>
      <text x="93" y="74" class="mc-svg-lbl" fill="#ffffff">${fuel}%</text>
      <!-- Side Fins & Nozzle -->
      <rect x="66" y="84" width="8" height="18" fill="#ea580c"/>
      <rect x="112" y="84" width="8" height="18" fill="#ea580c"/>
      <rect x="83" y="98" width="20" height="6" fill="#475569"/>
      ${d.ready
        ? `<g class="mc-anim-pulse">
             <rect x="85" y="106" width="16" height="5" fill="#fde047"/>
             <rect x="88" y="111" width="10" height="5" fill="#f97316"/>
           </g>`
        : ''}

      <!-- 3 Launch Lights Panel (Right) -->
      <rect x="130" y="16" width="48" height="24" fill="${fuelDone ? '#0d3124' : '#0f1c26'}" stroke="${fuelDone ? '#4ade80' : '#475569'}" stroke-width="2"/>
      <text x="154" y="26" class="mc-svg-sub" fill="${fuelDone ? '#86efac' : '#cbd5e1'}">1.FUEL</text>
      <text x="154" y="36" class="mc-svg-lbl" fill="${fuelDone ? '#4ade80' : '#fde047'}">${fuelDone ? 'OK' : `${d.iceNeeded} ICE`}</text>

      <rect x="130" y="44" width="48" height="26" fill="${stormsDone ? '#0d3124' : '#0f1c26'}" stroke="${stormsDone ? '#4ade80' : '#475569'}" stroke-width="2"/>
      <text x="154" y="54" class="mc-svg-sub" fill="${stormsDone ? '#86efac' : '#cbd5e1'}">2.STORM</text>
      ${stormPips}

      <rect x="130" y="74" width="48" height="24" fill="${d.dataSent ? '#0d3124' : '#0f1c26'}" stroke="${d.dataSent ? '#4ade80' : '#475569'}" stroke-width="2"/>
      <text x="154" y="84" class="mc-svg-sub" fill="${d.dataSent ? '#86efac' : '#cbd5e1'}">3.DATA</text>
      <text x="154" y="94" class="mc-svg-lbl" fill="${d.dataSent ? '#4ade80' : '#94a3b8'}">${d.dataSent ? 'OK' : '--'}</text>
    </svg>`;
}

export function mavNasaPopoverHtml(): string {
  const fact = `
    <p><strong>Rocket Fuel (ISRU):</strong> Splits Mars ice into hydrogen + oxygen, then mixes with Mars CO2 to make methane fuel.</p>
    <p><strong>Storms:</strong> Wait out ${MAV_CONFIG.STORMS_TO_SURVIVE} solar storms safely inside or under the shield.</p>
    <p><strong>Sample Tubes:</strong> Extra tubes make the rocket heavier (+${SCIENCE_CONFIG.ICE_PER_SAMPLE_TUBE} ice each).</p>`;
  return nasaInfoButtonHtml(fact, [
    ['NASA Mars ISRU', 'https://science.nasa.gov/mars/'],
  ]);
}

/**
 * Helper to expose the pixel rocket icon and other icons for static MAV modal chrome.
 */
export const mavStaticIcons = {
  rocket: () => pixelIconSvg('rocket'),
  bolt: () => pixelIconSvg('bolt'),
  drop: () => pixelIconSvg('drop'),
  storm: () => pixelIconSvg('storm'),
  radio: () => pixelIconSvg('radio'),
  rock: () => pixelIconSvg('rock'),
  up: () => pixelIconSvg('up'),
  down: () => pixelIconSvg('down'),
};
