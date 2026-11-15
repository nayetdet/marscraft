import * as THREE from 'three';

const unitBox = new THREE.BoxGeometry(1, 1, 1);

const RATION_COLORS = {
  foil: 0xdbe2ea,
  seam: 0x94a3b8,
  edge: 0xb4c0cc,
  label: 0xf8fafc,
  blue: 0x0284c7,
  sky: 0x38bdf8,
  orange: 0xea580c,
  green: 0x22c55e,
  ink: 0x1e293b,
  velcro: 0x334155,
} as const;

type RationColorKey = keyof typeof RATION_COLORS;

const palette = Object.fromEntries(
  Object.entries(RATION_COLORS).map(([key, color]) => [
    key,
    new THREE.MeshLambertMaterial({ color }),
  ])
) as Record<RationColorKey, THREE.MeshLambertMaterial>;

function addPart(
  group: THREE.Group,
  color: RationColorKey,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  d: number
): void {
  const mesh = new THREE.Mesh(unitBox, palette[color]);
  mesh.position.set(x, y, z);
  mesh.scale.set(w, h, d);
  group.add(mesh);
}

/**
 * Builds a 3D voxel space ration pouch inspired by real NASA ISS/Orion
 * rehydratable and thermostabilized food pouches (no NASA logo).
 */
export function createSpaceRationModel(): THREE.Group {
  const pouch = new THREE.Group();
  pouch.name = 'space-ration';

  // Metallic aluminum-laminate pouch core and heat-sealed edges
  addPart(pouch, 'foil', 0, 0, 0, 0.56, 0.72, 0.18);
  addPart(pouch, 'edge', 0, 0, 0, 0.62, 0.66, 0.12);
  addPart(pouch, 'seam', 0, 0.37, 0, 0.64, 0.08, 0.08);
  addPart(pouch, 'seam', 0, -0.37, 0, 0.64, 0.08, 0.08);

  // Top-right rehydration septum / drink valve nozzle
  addPart(pouch, 'label', 0.16, 0.43, 0, 0.1, 0.1, 0.08);
  addPart(pouch, 'blue', 0.16, 0.49, 0, 0.12, 0.05, 0.1);
  addPart(pouch, 'sky', 0.16, 0.525, 0, 0.07, 0.03, 0.07);

  // Front NASA-inspired engineering meal label (white panel + blue/orange bands)
  addPart(pouch, 'label', 0, -0.01, 0.095, 0.44, 0.48, 0.02);
  addPart(pouch, 'blue', 0, 0.16, 0.105, 0.44, 0.12, 0.02);
  addPart(pouch, 'sky', -0.1, 0.16, 0.112, 0.18, 0.035, 0.01);
  addPart(pouch, 'orange', 0, 0.06, 0.105, 0.44, 0.045, 0.02);

  // Nutrition bar + lot barcode ticks
  addPart(pouch, 'green', -0.09, -0.06, 0.108, 0.16, 0.09, 0.015);
  addPart(pouch, 'ink', 0.1, -0.04, 0.108, 0.14, 0.03, 0.015);
  addPart(pouch, 'ink', 0.08, -0.1, 0.108, 0.18, 0.03, 0.015);
  addPart(pouch, 'ink', -0.12, -0.17, 0.108, 0.04, 0.07, 0.015);
  addPart(pouch, 'ink', -0.04, -0.17, 0.108, 0.06, 0.07, 0.015);
  addPart(pouch, 'ink', 0.05, -0.17, 0.108, 0.03, 0.07, 0.015);
  addPart(pouch, 'ink', 0.12, -0.17, 0.108, 0.06, 0.07, 0.015);

  // Back Velcro patch for microgravity restraint
  addPart(pouch, 'velcro', 0, 0.02, -0.095, 0.22, 0.22, 0.02);

  return pouch;
}
