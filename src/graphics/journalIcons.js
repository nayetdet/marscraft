// 24x24 pixel-art illustrations for the Discovery Journal cards (Greenhouse monitor style).
// Built as SVG data URLs with shape-rendering="crispEdges" so they scale cleanly at any resolution.

function svgToDataUrl(rects) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" shape-rendering="crispEdges">${rects}</svg>`;
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

const ICON_BUILDERS = {
  // ---------- SKY (Planets, Sun & Moons) ----------
  sun: () =>
    SPACE_BG +
    // Solar corona rays (8 directions)
    r('#ea580c', 11, 1, 2, 2) + r('#ea580c', 11, 21, 2, 2) +
    r('#ea580c', 1, 11, 2, 2) + r('#ea580c', 21, 11, 2, 2) +
    r('#f97316', 4, 4, 2, 2) + r('#f97316', 18, 4, 2, 2) +
    r('#f97316', 4, 18, 2, 2) + r('#f97316', 18, 18, 2, 2) +
    // Glowing solar sphere
    pixelSphere('#ea580c', '#f59e0b', '#facc15', '#ffffff') +
    r('#fef08a', 8, 7, 6, 6) +
    r('#ffffff', 8, 7, 3, 3),

  earth: () =>
    SPACE_BG +
    // Blue atmosphere rim + ocean sphere
    r('#0284c7', 9, 3, 6, 1) + r('#0284c7', 9, 20, 6, 1) +
    r('#0284c7', 3, 9, 1, 6) + r('#0284c7', 20, 9, 1, 6) +
    pixelSphere('#0369a1', '#0284c7', '#0ea5e9', null) +
    // White polar ice caps
    r('#f8fafc', 9, 4, 6, 2) + r('#e2e8f0', 10, 18, 4, 2) +
    // Continents: Americas (left)
    r('#15803d', 6, 7, 4, 4) + r('#22c55e', 6, 7, 3, 3) + r('#4ade80', 7, 7, 2, 2) +
    r('#15803d', 8, 11, 2, 2) +
    r('#15803d', 8, 13, 3, 4) + r('#22c55e', 8, 13, 2, 3) +
    // Continents: Europe & Africa (right)
    r('#15803d', 13, 6, 4, 3) + r('#22c55e', 13, 6, 3, 2) + r('#4ade80', 14, 6, 2, 1) +
    r('#15803d', 13, 10, 4, 5) + r('#22c55e', 13, 10, 3, 4) +
    // Fluffy white cloud wisps
    r('#ffffff', 6, 9, 4, 1) +
    r('#f1f5f9', 12, 8, 5, 1) +
    r('#e2e8f0', 9, 15, 4, 1),

  moon: () =>
    SPACE_BG +
    // Silver-gray lunar sphere with 3D crescent shadow
    pixelSphere('#334155', '#94a3b8', '#e2e8f0', '#ffffff') +
    // Dark lunar mare & round craters with bright rims
    r('#475569', 8, 7, 4, 3) + r('#334155', 9, 8, 2, 2) +
    r('#475569', 13, 10, 4, 4) + r('#334155', 14, 11, 2, 2) + r('#cbd5e1', 13, 10, 2, 1) +
    r('#475569', 7, 13, 3, 3) + r('#334155', 8, 14, 2, 1) + r('#f1f5f9', 7, 13, 2, 1) +
    r('#64748b', 11, 16, 2, 2),

  phobos: () =>
    SPACE_BG +
    // Lumpy space-potato silhouette
    r('#443730', 6, 7, 13, 10) +
    r('#443730', 4, 8, 16, 8) +
    r('#443730', 8, 6, 9, 12) +
    // Lit warm regolith body
    r('#786456', 5, 8, 13, 7) + r('#786456', 8, 7, 8, 9) +
    r('#a89080', 5, 7, 10, 6) + r('#d6c7bc', 6, 7, 7, 4) +
    r('#ede4de', 7, 7, 4, 2) +
    // Giant Stickney crater on the right + smaller pits
    r('#29201b', 14, 9, 4, 4) + r('#57473d', 14, 9, 3, 1) + r('#d6c7bc', 13, 10, 1, 2) +
    r('#3b2f28', 8, 12, 3, 2) + r('#3b2f28', 11, 8, 2, 2),

  deimos: () =>
    SPACE_BG +
    // Extra twinkling stars around Mars's smaller, farther moon
    r('#fde047', 5, 4) + r('#fde047', 4, 5, 3, 1) +
    r('#38bdf8', 18, 6) + r('#f8fafc', 6, 17) +
    // Smooth, smaller golden-cream moon
    r('#5c4b3c', 8, 8, 9, 8) + r('#5c4b3c', 7, 9, 11, 6) + r('#5c4b3c', 9, 7, 7, 10) +
    r('#9c8470', 8, 8, 8, 7) + r('#cbb7a4', 8, 8, 6, 5) +
    r('#f5ebe0', 9, 8, 4, 3) +
    // Soft craters
    r('#6b5848', 13, 11, 2, 2) + r('#786452', 10, 13, 2, 1),

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

  atmosphere: () =>
    SPACE_BG +
    // Thin glowing blue Martian atmosphere halo around the Red Planet
    r('#38bdf8', 9, 3, 6, 1) + r('#38bdf8', 9, 20, 6, 1) +
    r('#38bdf8', 3, 9, 1, 6) + r('#38bdf8', 20, 9, 1, 6) +
    r('#0284c7', 7, 4, 2, 1) + r('#0284c7', 15, 4, 2, 1) +
    r('#0284c7', 4, 7, 1, 2) + r('#0284c7', 19, 7, 1, 2) +
    r('#0284c7', 4, 15, 1, 2) + r('#0284c7', 19, 15, 1, 2) +
    r('#0284c7', 7, 19, 2, 1) + r('#0284c7', 15, 19, 2, 1) +
    // Red Planet Mars sphere
    pixelSphere('#7c2d12', '#c2410c', '#ea580c', '#fdba74') +
    // White north polar ice cap
    r('#f8fafc', 9, 4, 6, 2) + r('#e0f2fe', 10, 6, 4, 1) +
    // Dark Martian basalt regions & Valles Marineris canyon
    r('#7c2d12', 7, 11, 9, 2) + r('#9a3412', 6, 10, 5, 1) +
    r('#9a3412', 12, 14, 4, 3) + r('#fb923c', 8, 8, 5, 2),
};

const ICON_CACHE = new Map();

export function getJournalIcon(id) {
  if (!ICON_CACHE.has(id)) {
    const fn = ICON_BUILDERS[id] ?? ICON_BUILDERS.earth;
    ICON_CACHE.set(id, svgToDataUrl(fn()));
  }
  return ICON_CACHE.get(id);
}
