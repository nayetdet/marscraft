import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { CROP_CONFIG, WORLD_CONFIG } from '../config/constants.js';
import { HABITAT_LAYOUT } from '../world/habitatLayout.js';
import { GREENHOUSE_PLOTS, plotIndexAt } from '../world/greenhouseLayout.js';

// Plantas 3D dos campos da estufa. Cada campo (GREENHOUSE_PLOTS, menos o canteiro do jardim) tem
// uma malha pronta por tipo de cultura; so a da cultura plantada aparece, crescendo com o
// progresso. Assim a estufa inteira mostra o que o jogador plantou, com poucas malhas na tela.

// Formato de cada cultura numa bandeja: [largura, altura, profundidade, cor, x, y, z]
const CROP_SHAPES = {
  lettuce: [
    [0.62, 0.22, 0.62, 0x86efac, 0, 0.11, 0],
    [0.34, 0.16, 0.34, 0x4ade80, 0, 0.3, 0],
  ],
  potato: [
    [0.14, 0.48, 0.14, 0x16a34a, 0, 0.24, 0],
    [0.52, 0.22, 0.22, 0x4ade80, 0, 0.36, 0],
    [0.22, 0.22, 0.52, 0x4ade80, 0, 0.42, 0],
    [0.2, 0.14, 0.2, 0xd97706, 0.16, 0.07, 0.14],
  ],
  soy: [
    [0.5, 0.62, 0.5, 0x15803d, 0, 0.31, 0],
    [0.12, 0.22, 0.12, 0xa3e635, 0.2, 0.34, 0.2],
    [0.12, 0.22, 0.12, 0xa3e635, -0.2, 0.22, -0.18],
  ],
};
const SOIL = [0.78, 0.07, 0.78, 0x5b4636, 0, 0.035, 0];

function coloredBox([w, h, d, hex, x, y, z], px, pz, color) {
  const geo = new THREE.BoxGeometry(w, h, d);
  geo.translate(px + x, y, pz + z);
  color.setHex(hex);
  const colors = new Float32Array(geo.attributes.position.count * 3);
  for (let i = 0; i < colors.length; i += 3) {
    colors[i] = color.r;
    colors[i + 1] = color.g;
    colors[i + 2] = color.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geo;
}

function mergedMesh(boxes, material) {
  const geometry = mergeGeometries(boxes, false);
  boxes.forEach((geo) => geo.dispose());
  const mesh = new THREE.Mesh(geometry, material);
  mesh.matrixAutoUpdate = false;
  return mesh;
}

export function buildGreenhouseFields(scene) {
  const R = HABITAT_LAYOUT.DOME_RADIUS;
  const material = new THREE.MeshLambertMaterial({ vertexColors: true });
  const color = new THREE.Color();
  const root = new THREE.Group();
  root.position.set(HABITAT_LAYOUT.DOME_X, WORLD_CONFIG.GROUND_LEVEL + 2, HABITAT_LAYOUT.DOME_Z);

  // Celulas (centro do bloco) de cada campo
  const cells = GREENHOUSE_PLOTS.map(() => []);
  for (let dx = -R; dx <= R; dx++) {
    for (let dz = -R; dz <= R; dz++) {
      const index = plotIndexAt(dx, dz);
      if (index > 0) cells[index].push([dx + 0.5, dz + 0.5]);
    }
  }

  // Terra das bandejas de todos os campos: uma malha so
  const soil = cells.flatMap((list) => list.map(([px, pz]) => coloredBox(SOIL, px, pz, color)));
  root.add(mergedMesh(soil, material));

  const fields = cells.map((list, index) => {
    if (index === 0 || list.length === 0) return null;
    const group = new THREE.Group();
    const meshes = {};
    for (const [type, shape] of Object.entries(CROP_SHAPES)) {
      const mesh = mergedMesh(list.flatMap(([px, pz]) => shape.map((part) => coloredBox(part, px, pz, color))), material);
      mesh.visible = false;
      group.add(mesh);
      meshes[type] = mesh;
    }
    root.add(group);
    return { group, meshes, shown: null };
  });

  scene.add(root);
  root.updateMatrixWorld(true);

  return {
    cellCounts: cells.map((list) => list.length),
    // `plots` = StationSystem.plots. Barato: so mexe na escala e na visibilidade.
    update(plots) {
      for (let i = 1; i < fields.length; i++) {
        const field = fields[i];
        if (!field) continue;
        const crop = plots[i]?.crop ?? null;
        const type = crop?.type ?? null;
        if (type !== field.shown) {
          if (field.shown) field.meshes[field.shown].visible = false;
          if (type) field.meshes[type].visible = true;
          field.shown = type;
        }
        if (crop) {
          const scale = 0.15 + 0.85 * Math.min(1, crop.progress / CROP_CONFIG[type].seconds);
          if (field.group.scale.y !== scale) {
            field.group.scale.y = scale;
            field.group.updateMatrixWorld(true);
          }
        }
      }
    },
  };
}
