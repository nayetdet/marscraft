import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { CROP_CONFIG, WORLD_CONFIG } from '../config/constants.js';
import { HABITAT_LAYOUT } from '../world/habitatLayout.js';
import { GREENHOUSE_PLOTS, PLOT_PLANT_CELLS, GREENHOUSE_BASKETS, plotIndexAt } from '../world/greenhouseLayout.js';
import { createCropItemModel } from '../graphics/cropModels.js';
import { labelTexture } from './baseCanvas.js';

// Plantas 3D dos campos da estufa. Cada campo (GREENHOUSE_PLOTS, menos o canteiro do jardim) tem
// uma malha pronta por tipo de cultura; so a da cultura plantada aparece, crescendo com o
// progresso. Cada planta vira um item na colheita: o campo mostra uma planta por item
// (PLOT_PLANT_CELLS), nas bandejas de terra que cobrem o campo todo.

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

const BASKET_COLORS = {
  darkWood: 0x704523,
  baseWood: 0x85532c,
  slatA: 0xa8703d,
  slatB: 0xc18952,
  rimWood: 0xcea066,
  handleWood: 0x5c371b,
  liner: 0xdec89b,
  tagBg: 0x1e293b,
};

const CROP_BADGES = {
  potato: { hex: 0xd99b52, css: '#f3b768', label: 'POTATO' },
  lettuce: { hex: 0x4ade80, css: '#6ee77a', label: 'LETTUCE' },
  soy: { hex: 0xa3e635, css: '#c5e86c', label: 'SOY' },
};

// 5 itens na camada de baixo (o indice 0 fica no centro, visivel logo no 1o item) + 3 empilhados no topo.
const BASKET_SLOTS = [
  { x: 0.02, dy: 0.0, z: 0.0, ry: 0.15, rx: 0.08, rz: -0.06 },
  { x: 0.18, dy: 0.0, z: 0.17, ry: -0.55, rx: -0.1, rz: 0.08 },
  { x: 0.17, dy: 0.0, z: -0.18, ry: 0.65, rx: 0.12, rz: 0.09 },
  { x: -0.18, dy: 0.0, z: 0.17, ry: -0.85, rx: -0.06, rz: -0.1 },
  { x: -0.17, dy: 0.0, z: -0.18, ry: 0.4, rx: 0.09, rz: -0.08 },
  { x: 0.09, dy: 0.12, z: 0.09, ry: -0.3, rx: -0.14, rz: 0.1 },
  { x: 0.07, dy: 0.12, z: -0.1, ry: 0.5, rx: 0.14, rz: -0.12 },
  { x: -0.1, dy: 0.13, z: 0.01, ry: -0.15, rx: 0.1, rz: 0.12 },
];

const CROP_BASKET_LAYOUT = {
  potato: { scale: 0.34, baseY: 0.225, baseRx: 0, baseRy: Math.PI / 2 },
  lettuce: { scale: 0.33, baseY: 0.24, baseRx: 0, baseRy: 0 },
  soy: { scale: 0.36, baseY: 0.26, baseRx: -1.08, baseRy: Math.PI / 2 },
};

/** Constroi a cesta trançada de colheita com placa frontal e os modelos 3D da cultura dentro. */
function buildHarvestBasket({ type, x, y, z }, material, color) {
  const basket = new THREE.Group();
  basket.position.set(x, y - 0.3, z);

  const badge = CROP_BADGES[type];
  const parts = [];
  const addPart = (w, h, d, hex, px, py, pz) => {
    parts.push(coloredBox([w, h, d, hex, px, py, pz], 0, 0, color));
  };

  // Pes nos cantos, fundo e forro de aniagem interno
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      addPart(0.12, 0.04, 0.12, BASKET_COLORS.darkWood, sx * 0.35, 0.02, sz * 0.35);
      addPart(0.08, 0.37, 0.08, BASKET_COLORS.darkWood, sx * 0.38, 0.225, sz * 0.38);
      addPart(0.1, 0.065, 0.1, BASKET_COLORS.darkWood, sx * 0.405, 0.4275, sz * 0.405);
    }
  }
  addPart(0.8, 0.05, 0.8, BASKET_COLORS.baseWood, 0, 0.065, 0);
  addPart(0.7, 0.04, 0.7, BASKET_COLORS.liner, 0, 0.11, 0);

  // Nervuras verticais centrais e 3 faixas horizontais alternadas com frestas
  for (const side of [-1, 1]) {
    addPart(0.04, 0.32, 0.06, BASKET_COLORS.darkWood, side * 0.4, 0.24, 0);
    addPart(0.06, 0.32, 0.04, BASKET_COLORS.darkWood, 0, 0.24, side * 0.4);
  }
  for (const [py, hex] of [[0.1375, BASKET_COLORS.slatA], [0.2375, BASKET_COLORS.slatB], [0.3375, BASKET_COLORS.slatA]]) {
    for (const side of [-1, 1]) {
      addPart(0.045, 0.075, 0.72, hex, side * 0.385, py, 0);
      addPart(0.72, 0.075, 0.045, hex, 0, py, side * 0.385);
    }
  }

  // Borda superior saliente e alcas laterais (em +-z)
  for (const side of [-1, 1]) {
    addPart(0.9, 0.06, 0.09, BASKET_COLORS.rimWood, 0, 0.42, side * 0.405);
    addPart(0.09, 0.06, 0.72, BASKET_COLORS.rimWood, side * 0.405, 0.42, 0);
    for (const sx of [-1, 1]) {
      addPart(0.05, 0.08, 0.05, BASKET_COLORS.darkWood, sx * 0.13, 0.48, side * 0.405);
    }
    addPart(0.32, 0.045, 0.06, BASKET_COLORS.handleWood, 0, 0.525, side * 0.405);
  }

  // Placa frontal (+x, voltada para o centro da estufa) com faixa colorida da cultura
  addPart(0.03, 0.18, 0.46, BASKET_COLORS.tagBg, 0.42, 0.25, 0);
  addPart(0.036, 0.028, 0.44, badge.hex, 0.422, 0.325, 0);

  const frameMesh = mergedMesh(parts, material);
  basket.add(frameMesh);

  if (typeof document !== 'undefined') {
    const labelMat = new THREE.MeshBasicMaterial({ map: labelTexture(badge.label, 0.42 / 0.13, badge.css) });
    const labelPlane = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.13), labelMat);
    labelPlane.position.set(0.436, 0.24, 0);
    labelPlane.rotation.y = Math.PI / 2;
    basket.add(labelPlane);
  }

  // Alimentos 3D dentro da cesta, exibidos conforme a quantidade colhida
  const layout = CROP_BASKET_LAYOUT[type];
  const items = BASKET_SLOTS.map((slot) => {
    const item = createCropItemModel(type);
    item.scale.setScalar(layout.scale);
    item.position.set(slot.x, layout.baseY + slot.dy, slot.z);
    item.rotation.order = 'YXZ';
    item.rotation.set(layout.baseRx + slot.rx, layout.baseRy + slot.ry, slot.rz);
    item.visible = false;
    basket.add(item);
    return item;
  });

  return { type, group: basket, items, shownCount: 0 };
}

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
      if (index >= 0) cells[index].push([dx + 0.5, dz + 0.5]);
    }
  }

  // Terra das bandejas de todos os campos, jardim incluido (assim ele fica igual ao resto): uma malha so
  const soil = cells.flatMap((list) => list.map(([px, pz]) => coloredBox(SOIL, px, pz, color)));
  root.add(mergedMesh(soil, material));

  const fields = PLOT_PLANT_CELLS.map((plantCells, index) => {
    if (index === 0) return null;
    const group = new THREE.Group();
    const meshes = {};
    for (const [type, shape] of Object.entries(CROP_SHAPES)) {
      const boxes = plantCells.flatMap(({ dx, dz }) => shape.map((part) => coloredBox(part, dx + 0.5, dz + 0.5, color)));
      const mesh = mergedMesh(boxes, material);
      mesh.visible = false;
      group.add(mesh);
      meshes[type] = mesh;
    }
    root.add(group);
    return { group, meshes, shown: null };
  });

  scene.add(root);
  root.updateMatrixWorld(true);

  const baskets = GREENHOUSE_BASKETS.map((entry) => {
    const basket = buildHarvestBasket(entry, material, color);
    basket.group.name = `harvest-basket-${entry.type}`;
    scene.add(basket.group);
    basket.group.updateMatrixWorld(true);
    return basket;
  });

  return {
    cellCounts: cells.map((list) => list.length),
    // `plots` = StationSystem.plots. Barato: so mexe na escala e na visibilidade.
    update(plots, stock = {}) {
      for (const basket of baskets) {
        const count = Math.max(0, Math.floor(stock[basket.type] ?? 0));
        if (count === basket.shownCount) continue;
        basket.shownCount = count;
        for (let i = 0; i < basket.items.length; i++) {
          basket.items[i].visible = i < count;
        }
      }
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
