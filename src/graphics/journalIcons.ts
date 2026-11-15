// @ts-nocheck
// 24x24 pixel-art illustrations for the Discovery Journal cards (Greenhouse monitor style).
// Built as SVG data URLs with shape-rendering="crispEdges" so they scale cleanly at any resolution.
import { SAMPLE_TYPES } from '../data/sampleTypes.ts';
import { sampleIconRects } from './itemIcons.ts';

function svgToDataUrl(rects, viewBox = '0 0 24 24', crisp = true) {
  const rendering = crisp ? 'shape-rendering="crispEdges"' : 'shape-rendering="geometricPrecision"';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" ${rendering}>${rects}</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const r = (c, x, y, w = 1, h = 1) => `<rect fill="${c}" x="${x}" y="${y}" width="${w}" height="${h}"/>`;

// Draws a classic 16-bit pixel-art sphere centered at (12, 12) with diameter 16 (x,y from 4..19)
function pixelSphere(rimColor, baseColor, lightColor, shineColor) {
  return (
    // Outer silhouette (diameter 16)
    r(rimColor, 9, 4, 6, 16) +
    r(rimColor, 4, 9, 16, 6) +
    r(rimColor, 7, 5, 10, 14) +
    r(rimColor, 5, 7, 14, 10) +
    r(rimColor, 6, 6, 12, 12) +
    // Main lit body (shifted slightly top-left for 3D shading)
    r(baseColor, 9, 5, 5, 13) +
    r(baseColor, 5, 9, 13, 5) +
    r(baseColor, 7, 6, 9, 11) +
    r(baseColor, 6, 7, 11, 9) +
    // Sunlit upper-left zone
    r(lightColor, 8, 5, 5, 9) +
    r(lightColor, 5, 8, 9, 5) +
    r(lightColor, 6, 6, 7, 7) +
    // Specular shine
    (shineColor ? r(shineColor, 7, 6, 3, 2) + r(shineColor, 6, 7, 2, 2) : '')
  );
}

const SPACE_BG = (
  r('#060b14', 0, 0, 24, 24) +
  r('#111c2d', 1, 1, 22, 22) +
  r('#060b14', 2, 2, 20, 20) +
  // Twinkling background stars
  r('#ffffff', 2, 3) +
  r('#38bdf8', 20, 2) +
  r('#fde047', 3, 19) +
  r('#cbd5e1', 21, 18) +
  r('#94a3b8', 19, 21) +
  r('#e2e8f0', 4, 10)
);

const MARS_BG = (
  r('#1c0d0a', 0, 0, 24, 24) +
  r('#31150f', 0, 9, 24, 9) +
  r('#7c2d12', 0, 18, 24, 6) +
  r('#9a3412', 0, 18, 24, 2)
);

const ATLAS_SPACE_BG = `
  <rect width="64" height="64" rx="6" fill="#050914"/>
  <rect x="1.5" y="1.5" width="61" height="61" rx="5" fill="none" stroke="#1e293b" stroke-width="1.5"/>
  <circle cx="8" cy="10" r="1.1" fill="#ffffff"/>
  <circle cx="56" cy="9" r="1.2" fill="#38bdf8"/>
  <circle cx="11" cy="54" r="1.0" fill="#fde047"/>
  <circle cx="54" cy="52" r="1.1" fill="#e2e8f0"/>
  <circle cx="49" cy="16" r="0.8" fill="#94a3b8"/>
  <circle cx="14" cy="22" r="0.8" fill="#cbd5e1"/>
  <circle cx="8" cy="38" r="0.9" fill="#93c5fd"/>
  <circle cx="57" cy="34" r="0.8" fill="#fef08a"/>
`;

const ICON_BUILDERS = {
  // ---------- SKY (Planets, Sun & Moons — 64x64 Space Atlas illustrations) ----------
  sun: () => ({
    viewBox: '0 0 64 64',
    crisp: false,
    body: `
      ${ATLAS_SPACE_BG}
      <defs>
        <radialGradient id="sunCorona" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.98"/>
          <stop offset="46%" stop-color="#fde047" stop-opacity="0.72"/>
          <stop offset="72%" stop-color="#fb923c" stop-opacity="0.28"/>
          <stop offset="100%" stop-color="#ea580c" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="sunCore" cx="44%" cy="42%" r="58%">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="38%" stop-color="#fef9c3"/>
          <stop offset="70%" stop-color="#facc15"/>
          <stop offset="92%" stop-color="#f97316"/>
          <stop offset="100%" stop-color="#ea580c"/>
        </radialGradient>
        <clipPath id="sunClip">
          <circle cx="32" cy="32" r="18.5"/>
        </clipPath>
      </defs>
      <!-- Outer radiant corona -->
      <circle cx="32" cy="32" r="29" fill="url(#sunCorona)"/>
      <!-- Soft triangular star rays -->
      <g fill="#fde047" opacity="0.85">
        <polygon points="32,3 34,11 30,11"/>
        <polygon points="32,61 34,53 30,53"/>
        <polygon points="3,32 11,30 11,34"/>
        <polygon points="61,32 53,30 53,34"/>
        <polygon points="11.5,11.5 18,15.5 15.5,18"/>
        <polygon points="52.5,52.5 46,48.5 48.5,46"/>
        <polygon points="52.5,11.5 48.5,18 46,15.5"/>
        <polygon points="11.5,52.5 15.5,46 18,48.5"/>
      </g>
      <!-- Solar prominence arch -->
      <path d="M 47 21 C 56 17, 57 30, 48 32" fill="none" stroke="#fef08a" stroke-width="1.8" stroke-linecap="round"/>
      <!-- Glowing plasma photosphere (clean smooth gradients, no dark dots) -->
      <g clip-path="url(#sunClip)">
        <circle cx="32" cy="32" r="18.5" fill="url(#sunCore)"/>
        <path d="M 16 26 Q 28 21, 46 27" fill="none" stroke="#ffffff" stroke-width="2" opacity="0.32" stroke-linecap="round"/>
        <path d="M 18 37 Q 31 33, 47 38" fill="none" stroke="#fef08a" stroke-width="1.8" opacity="0.35" stroke-linecap="round"/>
      </g>
    `,
  }),

  earth: () => ({
    viewBox: '0 0 64 64',
    crisp: false,
    body: `
      ${ATLAS_SPACE_BG}
      <defs>
        <radialGradient id="earthAtmo" cx="50%" cy="50%" r="50%">
          <stop offset="68%" stop-color="#38bdf8" stop-opacity="0.58"/>
          <stop offset="88%" stop-color="#0ea5e9" stop-opacity="0.24"/>
          <stop offset="100%" stop-color="#0284c7" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="earthOcean" cx="35%" cy="33%" r="70%">
          <stop offset="0%" stop-color="#38bdf8"/>
          <stop offset="42%" stop-color="#0284c7"/>
          <stop offset="82%" stop-color="#0b3b8c"/>
          <stop offset="100%" stop-color="#071e54"/>
        </radialGradient>
        <linearGradient id="africaBiome" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#eab308"/>
          <stop offset="36%" stop-color="#d97706"/>
          <stop offset="52%" stop-color="#16a34a"/>
          <stop offset="82%" stop-color="#22c55e"/>
          <stop offset="100%" stop-color="#84cc16"/>
        </linearGradient>
        <linearGradient id="saBiome" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#15803d"/>
          <stop offset="55%" stop-color="#22c55e"/>
          <stop offset="100%" stop-color="#a3e635"/>
        </linearGradient>
        <clipPath id="earthClip">
          <circle cx="32" cy="32" r="20"/>
        </clipPath>
      </defs>
      <circle cx="32" cy="32" r="26" fill="url(#earthAtmo)"/>
      <g clip-path="url(#earthClip)">
        <circle cx="32" cy="32" r="20" fill="url(#earthOcean)"/>
        <!-- Polar ice caps -->
        <ellipse cx="32" cy="12.2" rx="14" ry="2.6" fill="#f8fafc"/>
        <ellipse cx="32" cy="51.6" rx="15" ry="3.2" fill="#f1f5f9"/>
        <!-- Greenland -->
        <path d="M 30.3 16.7 L 31.8 16.7 L 33.6 15.0 L 33.8 13.7 L 31.9 13.0 L 30.2 13.5 L 30.2 15.2 Z"
              fill="#f8fafc" stroke="#cbd5e1" stroke-width="0.4" stroke-linejoin="round"/>
        <!-- North & Central America (orthographic projection) -->
        <path d="M 19.0 17.4 L 23.0 15.1 L 26.0 14.5 L 26.2 15.7 L 23.9 16.5 L 24.6 18.2 L 27.9 16.5 L 29.0 18.6 L 29.4 19.9 L 26.1 20.6 L 23.1 23.1 L 20.6 26.1 L 20.6 24.4 L 19.0 24.5 L 16.8 26.5 L 17.3 28.7 L 18.8 31.1 L 20.1 31.7 L 18.6 31.1 L 17.0 29.0 L 15.3 26.7 L 15.1 25.2 L 15.8 22.0 L 17.3 19.2 Z"
              fill="#22c55e" stroke="#4ade80" stroke-width="0.4" stroke-linejoin="round"/>
        <!-- South America -->
        <path d="M 20.6 32.1 L 22.2 30.8 L 25.3 31.8 L 29.2 34.7 L 32.0 36.5 L 34.4 37.5 L 33.3 40.4 L 32.7 42.3 L 30.1 43.7 L 28.3 46.1 L 26.5 48.2 L 26.8 49.8 L 25.2 49.0 L 23.8 45.8 L 23.1 41.0 L 19.5 36.4 L 20.3 33.4 Z"
              fill="url(#saBiome)" stroke="#4ade80" stroke-width="0.4" stroke-linejoin="round"/>
        <!-- Europe -->
        <path d="M 40.7 22.5 L 40.0 20.7 L 40.6 18.6 L 41.0 17.1 L 39.9 16.0 L 39.6 14.8 L 41.1 15.0 L 45.4 18.5 L 46.4 21.0 L 45.2 21.4 L 43.8 20.1 L 42.5 20.6 L 41.7 22.7 Z"
              fill="#22c55e" stroke="#4ade80" stroke-width="0.4" stroke-linejoin="round"/>
        <!-- Africa with natural Sahara -> Congo gradient -->
        <path d="M 41.5 22.7 L 44.6 21.9 L 47.6 22.7 L 48.7 22.9 L 51.3 27.6 L 51.5 27.7 L 52.0 32.2 L 51.5 36.0 L 49.7 40.8 L 47.4 44.1 L 46.4 44.5 L 47.4 41.2 L 47.9 37.4 L 47.5 32.8 L 43.1 33.2 L 40.2 29.9 L 40.6 25.4 Z"
              fill="url(#africaBiome)" stroke="#86efac" stroke-width="0.35" stroke-linejoin="round"/>
        <!-- Soft atmospheric cumulus wisps -->
        <g fill="#ffffff" opacity="0.62">
          <ellipse cx="23" cy="27.5" rx="5.5" ry="1.1" transform="rotate(-10 23 27.5)"/>
          <ellipse cx="36" cy="20.2" rx="6" ry="1.1" transform="rotate(8 36 20.2)"/>
          <ellipse cx="31" cy="40.5" rx="6.5" ry="1.2" transform="rotate(-6 31 40.5)"/>
        </g>
        <!-- Soft day-night terminator shadow -->
        <path d="M 43 11 A 20 20 0 0 1 43 53 A 16 20 0 0 0 43 11 Z" fill="#020617" opacity="0.32"/>
      </g>
      <circle cx="32" cy="32" r="20" fill="none" stroke="#7dd3fc" stroke-width="1.2" opacity="0.8"/>
    `,
  }),

  moon: () => ({
    viewBox: '0 0 64 64',
    crisp: false,
    body: `
      ${ATLAS_SPACE_BG}
      <defs>
        <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
          <stop offset="62%" stop-color="#e2e8f0" stop-opacity="0.32"/>
          <stop offset="86%" stop-color="#cbd5e1" stop-opacity="0.1"/>
          <stop offset="100%" stop-color="#cbd5e1" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="moonBody" cx="35%" cy="33%" r="68%">
          <stop offset="0%" stop-color="#f8fafc"/>
          <stop offset="45%" stop-color="#e2e8f0"/>
          <stop offset="82%" stop-color="#94a3b8"/>
          <stop offset="100%" stop-color="#475569"/>
        </radialGradient>
        <clipPath id="moonClip">
          <circle cx="32" cy="32" r="19"/>
        </clipPath>
      </defs>
      <circle cx="32" cy="32" r="25" fill="url(#moonGlow)"/>
      <g clip-path="url(#moonClip)">
        <circle cx="32" cy="32" r="19" fill="url(#moonBody)"/>
        <!-- Smooth Near Side Lunar Maria positioned at true selenographic coordinates -->
        <g fill="#64748b" opacity="0.72">
          <!-- Oceanus Procellarum (west) -->
          <ellipse cx="19.5" cy="27.5" rx="4.2" ry="6.2" transform="rotate(-14 19.5 27.5)"/>
          <circle cx="20.5" cy="23.0" r="2.8"/>
          <!-- Mare Imbrium (north-west circular basin) -->
          <ellipse cx="26.8" cy="21.8" rx="4.3" ry="3.8" fill="#475569"/>
          <!-- Mare Frigoris (thin northern band) -->
          <ellipse cx="30.5" cy="15.8" rx="6.5" ry="1.1" opacity="0.65"/>
          <!-- Mare Serenitatis -->
          <ellipse cx="36.8" cy="23.2" rx="3.3" ry="3.0" fill="#475569"/>
          <!-- Mare Tranquillitatis -->
          <ellipse cx="40.0" cy="28.6" rx="3.6" ry="2.8" transform="rotate(15 40 28.6)" fill="#475569"/>
          <!-- Mare Crisium (distinct isolated eastern oval) -->
          <ellipse cx="47.0" cy="26.4" rx="1.9" ry="2.3" fill="#334155"/>
          <!-- Mare Foecunditatis & Nectaris -->
          <ellipse cx="45.8" cy="33.4" rx="2.4" ry="3.4"/>
          <circle cx="42.1" cy="37.0" r="1.9"/>
          <!-- Mare Nubium & Humorum -->
          <ellipse cx="26.8" cy="38.2" rx="3.4" ry="3.0"/>
          <circle cx="21.2" cy="39.8" r="2.1" fill="#475569"/>
        </g>
        <!-- Tycho Crater southern ray system -->
        <g stroke="#ffffff" stroke-width="0.6" opacity="0.55">
          <line x1="29.3" y1="45.0" x2="21.5" y2="38.5"/>
          <line x1="29.3" y1="45.0" x2="26.5" y2="34.5"/>
          <line x1="29.3" y1="45.0" x2="34.5" y2="35.5"/>
          <line x1="29.3" y1="45.0" x2="39.0" y2="42.0"/>
          <line x1="29.3" y1="45.0" x2="23.5" y2="48.0"/>
        </g>
        <!-- Named impact craters: Tycho, Copernicus, Kepler, Aristarchus, Plato -->
        <circle cx="29.3" cy="45.0" r="2.0" fill="#ffffff"/>
        <circle cx="29.5" cy="45.2" r="1.2" fill="#64748b"/>
        <circle cx="25.6" cy="28.7" r="1.7" fill="#f8fafc"/>
        <circle cx="25.8" cy="28.9" r="1.0" fill="#64748b"/>
        <circle cx="20.4" cy="29.4" r="1.1" fill="#f1f5f9"/>
        <circle cx="19.3" cy="24.3" r="1.1" fill="#ffffff"/>
        <circle cx="30.1" cy="17.2" r="1.3" fill="#475569" stroke="#e2e8f0" stroke-width="0.45"/>
        <!-- Soft terminator shadow -->
        <path d="M 41 12 A 19 19 0 0 1 41 52 A 15 19 0 0 0 41 12 Z" fill="#0f172a" opacity="0.34"/>
      </g>
      <circle cx="32" cy="32" r="19" fill="none" stroke="#e2e8f0" stroke-width="0.9" opacity="0.55"/>
    `,
  }),

  phobos: () => ({
    viewBox: '0 0 64 64',
    crisp: false,
    body: `
      ${ATLAS_SPACE_BG}
      <defs>
        <radialGradient id="phobosGrad" cx="32%" cy="28%" r="72%">
          <stop offset="0%" stop-color="#ede4de"/>
          <stop offset="35%" stop-color="#b8a496"/>
          <stop offset="72%" stop-color="#7c6a5e"/>
          <stop offset="100%" stop-color="#29201b"/>
        </radialGradient>
      </defs>
      <!-- Sculpted irregular potato asteroid silhouette (27 x 22 x 18 km) -->
      <path d="M 12 28 C 11 20, 20 15, 29 17 C 36 18, 43 15, 50 20 C 56 25, 56 36, 51 42 C 45 48, 36 46, 28 47 C 18 48, 10 42, 11 34 Z"
            fill="url(#phobosGrad)" stroke="#d6c7bc" stroke-width="1" stroke-opacity="0.5"/>
      <!-- Parallel tidal stretch grooves -->
      <path d="M 16 25 Q 30 22, 44 25" fill="none" stroke="#443730" stroke-width="1.2" opacity="0.55"/>
      <path d="M 14 31 Q 29 28, 43 32" fill="none" stroke="#443730" stroke-width="1.2" opacity="0.55"/>
      <path d="M 16 37 Q 30 35, 42 39" fill="none" stroke="#443730" stroke-width="1.2" opacity="0.5"/>
      <!-- Giant Stickney Crater on the right lobe -->
      <ellipse cx="45" cy="31" rx="6.8" ry="7.8" transform="rotate(12 45 31)" fill="#d6c7bc" opacity="0.75"/>
      <ellipse cx="45.8" cy="31.5" rx="5.6" ry="6.6" transform="rotate(12 45.8 31.5)" fill="#29201b"/>
      <ellipse cx="46.8" cy="32" rx="3.4" ry="4.2" transform="rotate(12 46.8 32)" fill="#443730"/>
      <!-- Smaller impact craters (Hall, Roche) -->
      <circle cx="24" cy="24" r="3.2" fill="#3b2f28"/>
      <circle cx="23.3" cy="23.4" r="2.8" fill="#5c4d42"/>
      <circle cx="28" cy="39" r="3.6" fill="#29201b"/>
      <circle cx="27.2" cy="38.4" r="2.8" fill="#443730"/>
      <circle cx="18" cy="34" r="2.2" fill="#3b2f28"/>
    `,
  }),

  deimos: () => ({
    viewBox: '0 0 64 64',
    crisp: false,
    body: `
      ${ATLAS_SPACE_BG}
      <defs>
        <radialGradient id="deimosGrad" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#fffaf5"/>
          <stop offset="42%" stop-color="#dfd1c1"/>
          <stop offset="78%" stop-color="#9c8b7a"/>
          <stop offset="100%" stop-color="#4a3e35"/>
        </radialGradient>
      </defs>
      <!-- Extra bright stars around distant Deimos -->
      <path d="M 16 14 L 18 14 M 17 13 L 17 15" stroke="#fde047" stroke-width="1.4" stroke-linecap="round"/>
      <path d="M 49 46 L 51 46 M 50 45 L 50 47" stroke="#38bdf8" stroke-width="1.4" stroke-linecap="round"/>
      <!-- Smooth triaxial dusty asteroid body (15 x 12 x 11 km) -->
      <path d="M 18 31 C 17 23, 24 18, 33 19 C 41 20, 48 24, 48 32 C 48 40, 41 45, 32 45 C 23 45, 18 39, 18 31 Z"
            fill="url(#deimosGrad)" stroke="#f5ebe0" stroke-width="1" stroke-opacity="0.55"/>
      <!-- Voltaire & Swift craters softened by regolith blanket -->
      <ellipse cx="37" cy="28" rx="4.2" ry="3.6" fill="#f7efe6" opacity="0.7"/>
      <ellipse cx="37.6" cy="28.5" rx="3.4" ry="2.8" fill="#6b5848"/>
      <ellipse cx="26" cy="35" rx="3.2" ry="2.7" fill="#f7efe6" opacity="0.65"/>
      <ellipse cx="26.5" cy="35.4" rx="2.5" ry="2.1" fill="#786452"/>
      <circle cx="34" cy="38" r="1.8" fill="#6b5848" opacity="0.75"/>
    `,
  }),

  // ---------- TERRAIN (Rocks & Ice) ----------
  regolith: () =>
    MARS_BG +
    r('#9a3412', 2, 14, 20, 6) +
    r('#c2410c', 3, 11, 18, 7) +
    r('#ea580c', 5, 9, 14, 7) +
    r('#fb923c', 7, 7, 10, 6) +
    r('#fdba74', 9, 7, 6, 3) +
    r('#7c2d12', 5, 15, 3, 2) + r('#7c2d12', 15, 14, 3, 2) +
    r('#ffedd5', 10, 8, 2, 1),

  sandstone: () =>
    MARS_BG +
    r('#78350f', 4, 4, 16, 16) +
    r('#b45309', 5, 5, 14, 14) +
    r('#f59e0b', 5, 6, 14, 3) + r('#fde68a', 6, 6, 9, 1) +
    r('#d97706', 5, 11, 14, 3) + r('#fcd34d', 8, 11, 8, 1) +
    r('#f59e0b', 5, 16, 14, 2) +
    r('#92400e', 6, 9, 12, 1) + r('#92400e', 6, 14, 12, 1),

  'crater-rock': () =>
    MARS_BG +
    r('#1e293b', 3, 7, 18, 13) + r('#1e293b', 6, 4, 12, 16) +
    r('#334155', 4, 7, 16, 11) + r('#334155', 6, 5, 12, 13) +
    r('#475569', 6, 5, 9, 9) +
    r('#64748b', 7, 6, 6, 5) +
    r('#94a3b8', 8, 6, 3, 2) +
    r('#0f172a', 12, 10, 5, 1) + r('#0f172a', 7, 14, 6, 1),

  'water-ice': () =>
    MARS_BG +
    r('#0369a1', 4, 4, 16, 16) +
    r('#0284c7', 5, 5, 14, 14) +
    r('#38bdf8', 6, 5, 12, 11) +
    r('#7dd3fc', 6, 6, 9, 8) +
    r('#e0f2fe', 7, 6, 6, 5) +
    r('#ffffff', 7, 6, 3, 3) + r('#ffffff', 15, 12, 2, 2) + r('#bae6fd', 9, 15, 6, 2),

  // ---------- BASE (Modules, Rover & Rocket) ----------
  base: () =>
    MARS_BG +
    // Main habitat dome (left)
    r('#94a3b8', 2, 11, 9, 7) + r('#f8fafc', 3, 10, 7, 8) +
    r('#f59e0b', 3, 12, 7, 1) + r('#38bdf8', 5, 14, 3, 2) +
    // Pressurized tunnel (center)
    r('#cbd5e1', 11, 14, 4, 4) + r('#38bdf8', 12, 15, 2, 1) +
    // Greenhouse dome (right)
    r('#38bdf8', 15, 11, 7, 7) + r('#0c4a6e', 16, 12, 5, 6) +
    r('#22c55e', 17, 14, 3, 4) + r('#4ade80', 18, 13, 1, 2) +
    // Tall antenna on habitat
    r('#e2e8f0', 6, 5, 1, 5) + r('#facc15', 5, 4, 3, 2),

  habitat: () =>
    MARS_BG +
    r('#64748b', 3, 8, 18, 11) +
    r('#f8fafc', 4, 7, 16, 12) +
    r('#e2e8f0', 6, 5, 12, 2) +
    r('#f59e0b', 4, 10, 16, 2) +
    r('#0284c7', 8, 13, 8, 4) + r('#7dd3fc', 9, 13, 6, 2),

  airlock: () =>
    MARS_BG +
    r('#475569', 4, 3, 16, 18) +
    r('#cbd5e1', 5, 4, 14, 16) +
    r('#1e293b', 7, 6, 10, 14) +
    r('#334155', 8, 7, 8, 12) +
    r('#38bdf8', 9, 8, 6, 4) + r('#bae6fd', 10, 8, 4, 2) +
    r('#4ade80', 5, 8, 2, 3) + r('#facc15', 17, 8, 2, 3),

  tunnel: () =>
    MARS_BG +
    r('#64748b', 1, 9, 22, 8) +
    r('#f8fafc', 1, 10, 22, 6) +
    r('#94a3b8', 5, 9, 2, 8) + r('#94a3b8', 11, 9, 2, 8) + r('#94a3b8', 17, 9, 2, 8) +
    r('#38bdf8', 7, 11, 3, 3) + r('#38bdf8', 14, 11, 3, 3),

  greenhouse: () =>
    MARS_BG +
    r('#38bdf8', 3, 8, 18, 11) + r('#38bdf8', 6, 5, 12, 3) +
    r('#082f49', 4, 9, 16, 9) + r('#082f49', 7, 6, 10, 3) +
    r('#fef08a', 9, 6, 6, 1) +
    r('#15803d', 4, 16, 16, 2) +
    r('#22c55e', 6, 12, 4, 4) + r('#4ade80', 7, 10, 2, 3) +
    r('#22c55e', 14, 12, 4, 4) + r('#fb923c', 15, 10, 2, 3),

  cupola: () =>
    SPACE_BG +
    r('#cbd5e1', 2, 16, 20, 8) + r('#94a3b8', 2, 16, 20, 2) +
    r('#e2e8f0', 4, 9, 16, 7) + r('#f8fafc', 7, 6, 10, 3) +
    r('#0284c7', 6, 10, 3, 5) + r('#38bdf8', 10, 8, 4, 7) + r('#0284c7', 15, 10, 3, 5) +
    r('#bae6fd', 11, 8, 2, 3),

  'solar-panels': () =>
    MARS_BG +
    r('#facc15', 18, 2, 4, 4) + r('#fef08a', 19, 3, 2, 2) +
    r('#94a3b8', 11, 14, 2, 6) +
    r('#cbd5e1', 2, 7, 20, 8) +
    r('#1d4ed8', 3, 8, 8, 6) + r('#1d4ed8', 13, 8, 8, 6) +
    r('#38bdf8', 4, 9, 2, 2) + r('#38bdf8', 8, 9, 2, 2) +
    r('#38bdf8', 14, 9, 2, 2) + r('#38bdf8', 18, 9, 2, 2),

  antenna: () =>
    SPACE_BG +
    r('#7c2d12', 0, 19, 24, 5) +
    r('#64748b', 9, 13, 6, 6) + r('#cbd5e1', 10, 13, 4, 6) +
    r('#cbd5e1', 4, 7, 12, 6) + r('#f8fafc', 6, 6, 9, 5) +
    r('#38bdf8', 11, 4, 2, 3) +
    r('#4ade80', 15, 3, 3, 1) + r('#4ade80', 17, 4, 1, 3) +
    r('#86efac', 18, 1, 4, 1) + r('#86efac', 21, 2, 1, 4),

  'ice-depot': () =>
    MARS_BG +
    r('#64748b', 4, 4, 16, 15) + r('#e2e8f0', 5, 5, 14, 13) +
    r('#082f49', 7, 7, 10, 9) +
    r('#0284c7', 7, 12, 10, 4) +
    r('#38bdf8', 11, 8, 2, 5) + r('#38bdf8', 10, 10, 4, 3) + r('#ffffff', 11, 9, 1, 2),

  rover: () =>
    MARS_BG +
    // Mast & camera head
    r('#cbd5e1', 15, 4, 2, 6) + r('#f8fafc', 13, 3, 6, 3) +
    r('#ef4444', 16, 4, 2, 1) + r('#38bdf8', 14, 4, 1, 1) +
    // Rover body
    r('#f8fafc', 4, 10, 15, 5) + r('#f59e0b', 6, 11, 10, 2) +
    // 3 rugged wheels
    r('#1e293b', 3, 15, 4, 4) + r('#94a3b8', 4, 16, 2, 2) +
    r('#1e293b', 10, 15, 4, 4) + r('#94a3b8', 11, 16, 2, 2) +
    r('#1e293b', 17, 15, 4, 4) + r('#94a3b8', 18, 16, 2, 2),

  lander: () =>
    SPACE_BG +
    r('#7c2d12', 0, 20, 24, 4) +
    // Rocket nose & body
    r('#ef4444', 10, 2, 4, 3) +
    r('#f8fafc', 9, 5, 6, 3) +
    r('#f8fafc', 8, 8, 8, 9) + r('#cbd5e1', 13, 8, 3, 9) +
    r('#0284c7', 10, 9, 4, 3) + r('#f59e0b', 8, 14, 8, 2) +
    // Fins & flame
    r('#ef4444', 5, 13, 3, 5) + r('#ef4444', 16, 13, 3, 5) +
    r('#f97316', 9, 17, 6, 3) + r('#facc15', 10, 17, 4, 4),

  'mav-panel': () =>
    r('#0f172a', 0, 0, 24, 24) +
    r('#475569', 2, 3, 20, 18) +
    r('#082f49', 4, 5, 16, 14) +
    r('#38bdf8', 6, 7, 12, 2) +
    r('#1e293b', 6, 11, 12, 4) + r('#22c55e', 6, 11, 9, 4) +
    r('#facc15', 6, 16, 8, 2),

  gym: () =>
    r('#0f172a', 0, 0, 24, 24) +
    r('#132c33', 2, 2, 20, 20) +
    r('#475569', 3, 18, 18, 2) + r('#38bdf8', 5, 18, 12, 1) +
    r('#cbd5e1', 17, 8, 2, 10) + r('#38bdf8', 15, 6, 4, 3) +
    r('#f8fafc', 8, 5, 4, 4) + r('#f59e0b', 10, 6, 2, 2) +
    r('#f8fafc', 8, 9, 4, 5) + r('#ef4444', 6, 9, 2, 4) +
    r('#cbd5e1', 7, 14, 2, 4) + r('#cbd5e1', 11, 14, 2, 3),

  // ---------- LANDSCAPE (Crater & Atmosphere) ----------
  'crater-rim': () =>
    MARS_BG +
    r('#7c2d12', 0, 13, 24, 11) +
    r('#9a3412', 1, 10, 8, 8) + r('#9a3412', 15, 9, 8, 9) +
    r('#ea580c', 7, 6, 10, 12) + r('#fb923c', 9, 6, 5, 6) +
    r('#fdba74', 10, 6, 3, 3) +
    r('#c2410c', 0, 18, 24, 6),

  atmosphere: () => ({
    viewBox: '0 0 64 64',
    crisp: false,
    body: `
      ${ATLAS_SPACE_BG}
      <defs>
        <radialGradient id="marsAtmo" cx="50%" cy="50%" r="50%">
          <stop offset="68%" stop-color="#38bdf8" stop-opacity="0.58"/>
          <stop offset="88%" stop-color="#60a5fa" stop-opacity="0.22"/>
          <stop offset="100%" stop-color="#38bdf8" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="marsGlobe" cx="35%" cy="32%" r="68%">
          <stop offset="0%" stop-color="#fdba74"/>
          <stop offset="38%" stop-color="#ea580c"/>
          <stop offset="76%" stop-color="#c2410c"/>
          <stop offset="100%" stop-color="#451a03"/>
        </radialGradient>
        <clipPath id="marsClip">
          <circle cx="32" cy="32" r="20"/>
        </clipPath>
      </defs>
      <!-- Thin glowing blue Rayleigh dust scatter halo -->
      <circle cx="32" cy="32" r="25.5" fill="url(#marsAtmo)"/>
      <g clip-path="url(#marsClip)">
        <circle cx="32" cy="32" r="20" fill="url(#marsGlobe)"/>
        <!-- North & South polar water/CO2 ice caps -->
        <ellipse cx="32" cy="12.5" rx="12" ry="2.8" fill="#f8fafc"/>
        <ellipse cx="32" cy="51.8" rx="9" ry="2" fill="#e0f2fe" opacity="0.85"/>
        <!-- Dark basaltic plains (Syrtis Major & Acidalia) -->
        <path d="M 35 20 C 40 19, 44 25, 42 32 C 39 34, 34 29, 35 20 Z" fill="#7c2d12" opacity="0.7"/>
        <ellipse cx="22" cy="39" rx="6" ry="3.5" fill="#7c2d12" opacity="0.65"/>
        <!-- Valles Marineris grand canyon scar -->
        <path d="M 18 31 Q 29 34, 41 30" fill="none" stroke="#451a03" stroke-width="2.2" stroke-linecap="round"/>
        <path d="M 19 30 Q 29 33, 40 29.2" fill="none" stroke="#fdba74" stroke-width="0.8" opacity="0.7"/>
        <!-- Olympus Mons shield volcano -->
        <circle cx="21" cy="24" r="3.2" fill="#fb923c" opacity="0.8"/>
        <circle cx="21" cy="24" r="1.2" fill="#7c2d12"/>
        <!-- Terminator shadow -->
        <path d="M 42 11 A 20 20 0 0 1 42 53 A 16 20 0 0 0 42 11 Z" fill="#1c0a04" opacity="0.45"/>
      </g>
      <circle cx="32" cy="32" r="20" fill="none" stroke="#7dd3fc" stroke-width="1.3" opacity="0.8"/>
    `,
  }),
};

// ---------- SAMPLES (issue #270): a pedra do item, sobre o chao de Marte ----------
for (const sample of SAMPLE_TYPES) {
  ICON_BUILDERS[sample.id] = () => ({
    viewBox: '0 0 16 16',
    body: r('#2a1710', 0, 0, 16, 16) + r('#5b2e1c', 0, 12, 16, 4) + r('#7a3f28', 0, 12, 16, 1) + sampleIconRects(sample.id),
  });
}

const ICON_CACHE = new Map();

export function getJournalIcon(id) {
  if (!ICON_CACHE.has(id)) {
    const fn = ICON_BUILDERS[id] ?? ICON_BUILDERS.earth;
    const res = fn();
    const url =
      typeof res === 'string'
        ? svgToDataUrl(res)
        : svgToDataUrl(res.body, res.viewBox, res.crisp);
    ICON_CACHE.set(id, url);
  }
  return ICON_CACHE.get(id);
}
