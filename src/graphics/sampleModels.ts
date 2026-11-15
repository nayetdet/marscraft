import * as THREE from 'three';

const unitBox = new THREE.BoxGeometry(1, 1, 1);
const pebbleGeo = new THREE.DodecahedronGeometry(0.5, 0);
const crystalGeo = new THREE.OctahedronGeometry(0.5, 0);

const SAMPLE_COLORS = {
  // Dark Dune Sand
  duneDark: 0x261d1a,
  duneMid: 0x3b2f2a,
  duneLight: 0x5c4940,
  duneGold: 0xfbbf24,
  // Layered Mudstone
  mudDark: 0x5c666d,
  mudMid: 0x9aa3a8,
  mudLight: 0xcbd5dc,
  mudVein: 0x7dd3fc,
  // Yellow Sulfur Crystals
  sulfurHostDark: 0x57534e,
  sulfurHostMid: 0x78716c,
  sulfurHostLight: 0xa8a29e,
  sulfurBright: 0xfde047,
  sulfurDeep: 0xfacc15,
  sulfurSpark: 0xfef9c3,
  // Iron Meteorite
  ironDark: 0x1e293b,
  ironMid: 0x475569,
  ironSteel: 0x64748b,
  ironShine: 0x94a3b8,
  ironGlint: 0xc4b5fd,
  // Buried Ice Core
  iceDeep: 0x38bdf8,
  iceMid: 0x8fd3ea,
  icePale: 0xc9efff,
  iceFrost: 0xf2fcff,
} as const;

type ColorKey = keyof typeof SAMPLE_COLORS;

const EMISSIVE_COLORS: Partial<Record<ColorKey, { color: number; intensity: number }>> = {
  duneGold: { color: 0xf59e0b, intensity: 0.25 },
  mudVein: { color: 0x38bdf8, intensity: 0.25 },
  sulfurBright: { color: 0xca8a04, intensity: 0.28 },
  sulfurSpark: { color: 0xfde047, intensity: 0.35 },
  ironGlint: { color: 0xa78bfa, intensity: 0.22 },
  iceDeep: { color: 0x0284c7, intensity: 0.22 },
  iceFrost: { color: 0x67e8f9, intensity: 0.18 },
};

const palette = Object.fromEntries(
  Object.entries(SAMPLE_COLORS).map(([key, color]) => {
    const glow = EMISSIVE_COLORS[key as ColorKey];
    return [
      key,
      new THREE.MeshLambertMaterial({
        color,
        flatShading: true,
        ...(glow ? { emissive: glow.color, emissiveIntensity: glow.intensity } : {}),
      }),
    ];
  })
) as Record<ColorKey, THREE.MeshLambertMaterial>;

type PartSpec = readonly [
  geo: THREE.BufferGeometry,
  color: ColorKey,
  x: number,
  y: number,
  z: number,
  sx: number,
  sy: number,
  sz: number,
  rx?: number,
  ry?: number,
  rz?: number,
];

function addParts(group: THREE.Group, specs: readonly PartSpec[]): void {
  for (const [geo, color, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0] of specs) {
    const mesh = new THREE.Mesh(geo, palette[color]);
    mesh.position.set(x, y, z);
    mesh.scale.set(sx, sy, sz);
    if (rx || ry || rz) mesh.rotation.set(rx, ry, rz);
    group.add(mesh);
  }
}

const SAMPLE_PART_SPECS: Record<string, readonly PartSpec[]> = {
  'sample-dune-sand': [
    // Wind-sculpted dark basaltic sand clod with layered dune ridges and olivine sparkles
    [pebbleGeo, 'duneMid', 0, -0.04, 0, 0.72, 0.44, 0.68, 0.08, 0.4, -0.05],
    [pebbleGeo, 'duneDark', -0.14, -0.1, 0.08, 0.44, 0.28, 0.42, 0.1, 1.1, 0.12],
    [unitBox, 'duneLight', 0.06, 0.08, -0.02, 0.46, 0.14, 0.38, -0.12, 0.3, 0.1],
    [pebbleGeo, 'duneLight', 0.12, 0.14, 0.04, 0.34, 0.22, 0.32, 0.2, 0.7, -0.15],
    [crystalGeo, 'duneGold', -0.12, 0.14, 0.16, 0.09, 0.09, 0.09, 0.4, 0.2, 0.3],
    [crystalGeo, 'duneGold', 0.19, 0.06, 0.18, 0.075, 0.075, 0.075, 0.1, 0.9, 0.5],
    [crystalGeo, 'duneGold', 0.04, 0.22, -0.08, 0.07, 0.07, 0.07, 0.6, 0.4, 0.1],
  ],
  'sample-mudstone': [
    // Stratified ancient lakebed mudstone slabs with a pale silt band and mineral fleck
    [unitBox, 'mudDark', 0, -0.13, 0, 0.66, 0.15, 0.54, 0.02, 0.18, -0.03],
    [unitBox, 'mudMid', -0.03, 0, 0.02, 0.6, 0.15, 0.48, -0.02, -0.08, 0.02],
    [unitBox, 'mudLight', 0.02, 0.11, -0.01, 0.5, 0.09, 0.42, 0.03, 0.12, -0.02],
    [unitBox, 'mudMid', -0.06, 0.2, 0.02, 0.34, 0.11, 0.3, -0.04, 0.25, 0.04],
    [pebbleGeo, 'mudDark', 0.18, -0.04, 0.14, 0.24, 0.2, 0.22, 0.2, 0.5, 0],
    [crystalGeo, 'mudVein', 0.14, 0.12, 0.21, 0.1, 0.12, 0.08, 0.25, 0.4, -0.3],
    [crystalGeo, 'mudVein', -0.19, 0.03, 0.2, 0.07, 0.08, 0.07, -0.2, 0.1, 0.4],
  ],
  'sample-sulfur': [
    // Cracked gray-tan matrix split open to expose pure yellow sulfur crystal spires
    [pebbleGeo, 'sulfurHostDark', 0, -0.11, 0, 0.7, 0.36, 0.64, 0.05, 0.3, -0.04],
    [pebbleGeo, 'sulfurHostMid', -0.18, -0.01, 0.06, 0.38, 0.28, 0.4, 0.18, 0.9, 0.24],
    [pebbleGeo, 'sulfurHostLight', 0.2, -0.02, -0.04, 0.34, 0.26, 0.36, -0.12, 0.2, -0.26],
    [crystalGeo, 'sulfurBright', 0, 0.17, 0.01, 0.22, 0.42, 0.22, 0.08, 0.35, -0.1],
    [crystalGeo, 'sulfurDeep', -0.1, 0.14, 0.11, 0.16, 0.32, 0.16, 0.28, 0.8, 0.22],
    [crystalGeo, 'sulfurSpark', 0.11, 0.15, -0.07, 0.15, 0.3, 0.15, -0.22, 0.1, -0.26],
    [crystalGeo, 'sulfurBright', 0.07, 0.11, 0.14, 0.12, 0.22, 0.12, 0.34, 0.5, -0.15],
  ],
  'sample-meteorite': [
    // Faceted iron-nickel meteorite with pitted regmaglypt hollows and metallic glints
    [pebbleGeo, 'ironSteel', 0, 0, 0, 0.68, 0.54, 0.58, 0.22, 0.45, -0.18],
    [pebbleGeo, 'ironMid', -0.16, -0.05, 0.1, 0.42, 0.36, 0.38, -0.2, 0.9, 0.3],
    [pebbleGeo, 'ironShine', 0.15, 0.08, -0.06, 0.36, 0.32, 0.34, 0.3, 0.2, -0.2],
    [unitBox, 'ironDark', -0.06, 0.06, 0.24, 0.14, 0.12, 0.06, 0.1, 0.2, -0.15],
    [unitBox, 'ironDark', 0.16, -0.06, 0.2, 0.11, 0.1, 0.06, -0.15, -0.2, 0.2],
    [crystalGeo, 'ironGlint', 0.08, 0.22, 0.08, 0.11, 0.09, 0.11, 0.4, 0.6, 0.2],
    [crystalGeo, 'ironGlint', -0.21, 0.1, 0.12, 0.08, 0.08, 0.08, 0.2, 0.1, 0.5],
  ],
  'sample-ice-core': [
    // Frosted Martian permafrost ice chunk with crisp snow cap and sparkling shards
    [pebbleGeo, 'iceMid', 0, -0.05, 0, 0.64, 0.48, 0.6, 0.1, 0.5, 0.08],
    [pebbleGeo, 'icePale', 0.05, 0.05, 0.04, 0.54, 0.4, 0.5, -0.15, 0.2, -0.1],
    [unitBox, 'iceFrost', -0.04, 0.14, 0, 0.42, 0.14, 0.38, 0.06, 0.35, -0.08],
    [crystalGeo, 'iceDeep', -0.12, 0.2, 0.09, 0.16, 0.3, 0.16, 0.2, 0.4, 0.25],
    [crystalGeo, 'iceFrost', 0.1, 0.23, -0.04, 0.18, 0.34, 0.18, -0.16, 0.1, -0.2],
    [crystalGeo, 'icePale', 0.14, 0.12, 0.16, 0.12, 0.22, 0.12, 0.32, 0.7, -0.15],
  ],
};

/**
 * Builds a multi-part sculpted 3D rock model for a collectible scientific sample,
 * shared between the first-person hand, third-person avatar, and pickup animation.
 */
export function createSampleRockModel(sampleId: string): THREE.Group {
  const specs = SAMPLE_PART_SPECS[sampleId];
  if (!specs) throw new Error(`Unknown sample rock model: ${sampleId}`);
  const group = new THREE.Group();
  group.name = `${sampleId}-rock`;
  addParts(group, specs);
  return group;
}
