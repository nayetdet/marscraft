// @ts-nocheck
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { CROP_CONFIG, CROP_LOOK_CONFIG, WORLD_CONFIG } from '../config/constants.ts';
import { HABITAT_LAYOUT } from '../world/habitatLayout.ts';
import { GREENHOUSE_PLOTS, PLOT_PLANT_CELLS, GREENHOUSE_BASKETS, plotIndexAt } from '../world/greenhouseLayout.ts';
import { createCropItemModel } from '../graphics/cropModels.ts';
import { labelTexture } from './baseCanvas.ts';

// Plantas 3D dos campos da estufa (GREENHOUSE_PLOTS, menos o canteiro do jardim). Cada planta vira
// um item na colheita: o campo mostra uma planta por item (PLOT_PLANT_CELLS), nas bandejas de terra
// que cobrem o campo todo. Para a crianca ver que plantou: a terra do campo plantado inteiro fica
// escura e molhada, cada planta nasce como um broto visivel e cresce por inteiro, e um marcador
// colorido gira sobre o campo pronto para colher. Cada tipo de planta e um InstancedMesh (um
// desenho para todos os campos).

// Terra das bandejas: seca no campo vazio, escura e molhada no campo plantado
const SOIL_TOP = 0.07;
const SOIL = [0.78, SOIL_TOP, 0.78, 0x5b4636, 0, SOIL_TOP / 2, 0];
const SOIL_PLANTED = 0x34241a;

// Formato de cada cultura numa bandeja: [largura, altura, profundidade, cor, x, y, z]. O y conta a
// partir do topo da terra, para a planta nascer em cima dela e nao enterrada.
const onSoil = (parts) => parts.map(([w, h, d, hex, x, y, z]) => [w, h, d, hex, x, y + SOIL_TOP, z]);
const CROP_SHAPES = {
  lettuce: onSoil([
    [0.62, 0.22, 0.62, 0x86efac, 0, 0.11, 0],
    [0.34, 0.16, 0.34, 0x4ade80, 0, 0.3, 0],
  ]),
  potato: onSoil([
    [0.14, 0.48, 0.14, 0x16a34a, 0, 0.24, 0],
    [0.52, 0.22, 0.22, 0x4ade80, 0, 0.36, 0],
    [0.22, 0.22, 0.52, 0x4ade80, 0, 0.42, 0],
    [0.2, 0.14, 0.2, 0xd97706, 0.16, 0.07, 0.14],
  ]),
  soy: onSoil([
    [0.5, 0.62, 0.5, 0x15803d, 0, 0.31, 0],
    [0.12, 0.22, 0.12, 0xa3e635, 0.2, 0.34, 0.2],
    [0.12, 0.22, 0.12, 0xa3e635, -0.2, 0.22, -0.18],
  ]),
};
// Broto recem-plantado (igual para as 3 culturas): montinho de terra, caule e duas folhas verde-claro,
// que contrastam com a terra escura
const SPROUT_SHAPE = onSoil([
  [0.34, 0.06, 0.34, 0x4a3324, 0, 0.03, 0],
  [0.08, 0.42, 0.08, 0x65a30d, 0, 0.21, 0],
  [0.32, 0.08, 0.18, 0x84cc16, -0.17, 0.36, 0],
  [0.32, 0.08, 0.18, 0xbef264, 0.17, 0.42, 0],
]);

// Etapa visual de uma planta: broto logo apos plantar, depois a planta da cultura crescendo, e pronta.
// `scale` e uniforme (largura e altura), para a planta jovem parecer pequena, nao achatada.
export function cropGrowthLook(progress, seconds) {
  const p = Math.max(0, Math.min(1, progress / seconds));
  const L = CROP_LOOK_CONFIG;
  if (p >= 1) return { stage: 'ready', scale: 1 };
  if (p < L.SPROUT_UNTIL) return { stage: 'sprout', scale: L.SPROUT_MIN_SCALE + (1 - L.SPROUT_MIN_SCALE) * (p / L.SPROUT_UNTIL) };
  return { stage: 'growing', scale: L.PLANT_MIN_SCALE + (1 - L.PLANT_MIN_SCALE) * ((p - L.SPROUT_UNTIL) / (1 - L.SPROUT_UNTIL)) };
}

// Broto avulso para o canteiro do jardim (o GameEngine desenha a planta do campo 0)
export function createSproutModel() {
  const color = new THREE.Color();
  const mesh = mergedMesh(SPROUT_SHAPE.map((part) => coloredBox(part, 0, 0, color)), new THREE.MeshLambertMaterial({ vertexColors: true }));
  mesh.matrixAutoUpdate = true;
  mesh.name = 'garden-sprout';
  return mesh;
}

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

function mergedGeometry(boxes) {
  const geometry = mergeGeometries(boxes, false);
  boxes.forEach((geo) => geo.dispose());
  return geometry;
}

function mergedMesh(boxes, material) {
  const mesh = new THREE.Mesh(mergedGeometry(boxes), material);
  mesh.matrixAutoUpdate = false;
  return mesh;
}

// Cores do marcador de "pronto" de cada cultura (as mesmas das placas das cestas)
const MARKER_COLORS = Object.fromEntries(Object.entries(CROP_BADGES).map(([type, badge]) => [type, new THREE.Color(badge.hex)]));
const _matrix = new THREE.Matrix4();
const _pos = new THREE.Vector3();
const _quat = new THREE.Quaternion();
const _scale = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);

function instancedPlants(boxes, material, capacity, name) {
  const mesh = new THREE.InstancedMesh(mergedGeometry(boxes), material, capacity);
  mesh.name = name;
  mesh.count = 0;
  mesh.visible = false;
  // As copias mudam de lugar e de tamanho: a esfera de corte calculada uma vez ficaria errada
  mesh.frustumCulled = false;
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  return mesh;
}

export function buildGreenhouseFields(scene) {
  const R = HABITAT_LAYOUT.DOME_RADIUS;
  const L = CROP_LOOK_CONFIG;
  const material = new THREE.MeshLambertMaterial({ vertexColors: true });
  // As plantas tem material proprio: quando param de crescer (sem luz, agua ou com poeira) ele
  // fica amarelado e as folhas parecem murchas, sem mexer na terra das bandejas (issue #89)
  const cropMaterial = new THREE.MeshLambertMaterial({ vertexColors: true });
  let wilted = false;
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

  // Terra das bandejas de todos os campos, jardim incluido (assim ele fica igual ao resto): uma malha
  // so. `soilRanges[i]` = vertices do campo i, para pintar a terra quando ele e plantado ou colhido.
  const soilBoxes = [];
  let vertexCount = 0;
  const soilRanges = cells.map((list) => {
    const start = vertexCount;
    for (const [px, pz] of list) {
      const box = coloredBox(SOIL, px, pz, color);
      vertexCount += box.attributes.position.count;
      soilBoxes.push(box);
    }
    return { start, end: vertexCount, planted: false };
  });
  const soilMesh = mergedMesh(soilBoxes, material);
  soilMesh.name = 'greenhouse-soil';
  root.add(soilMesh);
  const soilDry = new THREE.Color(SOIL[3]);
  const soilWet = new THREE.Color(SOIL_PLANTED);
  const paintSoil = (range, planted) => {
    const colors = soilMesh.geometry.attributes.color;
    const c = planted ? soilWet : soilDry;
    for (let v = range.start; v < range.end; v++) colors.setXYZ(v, c.r, c.g, c.b);
    colors.needsUpdate = true;
    range.planted = planted;
  };

  // Plantas dos campos 1..n (o jardim e do GameEngine): um InstancedMesh por cultura e um para os brotos
  const capacity = PLOT_PLANT_CELLS.reduce((sum, list, index) => sum + (index ? list.length : 0), 0);
  const plantMeshes = Object.fromEntries(Object.entries(CROP_SHAPES).map(([type, shape]) => {
    const mesh = instancedPlants(shape.map((part) => coloredBox(part, 0, 0, color)), cropMaterial, capacity, `greenhouse-crop-${type}`);
    root.add(mesh);
    return [type, mesh];
  }));
  const sproutMesh = instancedPlants(SPROUT_SHAPE.map((part) => coloredBox(part, 0, 0, color)), cropMaterial, capacity, 'greenhouse-crop-sprout');
  root.add(sproutMesh);
  const allPlantMeshes = [...Object.values(plantMeshes), sproutMesh];

  // Marcador de "pronto para colher": um losango na cor da cultura sobre a planta do meio de cada campo
  const markers = new THREE.InstancedMesh(
    new THREE.OctahedronGeometry(0.16),
    new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0x3a3a3a }),
    GREENHOUSE_PLOTS.length,
  );
  markers.name = 'greenhouse-ready-markers';
  markers.count = 0;
  markers.visible = false;
  markers.frustumCulled = false;
  markers.userData.noShadowCast = true;
  markers.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  root.add(markers);
  const markerCells = PLOT_PLANT_CELLS.map((list) => list[Math.floor(list.length / 2)]);

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
    // `plots` = StationSystem.plots. Barato: no maximo ~20 matrizes de planta e 9 marcadores por quadro.
    update(plots, { stock = {}, stalled = false } = {}) {
      for (const basket of baskets) {
        const count = Math.max(0, Math.floor(stock[basket.type] ?? 0));
        if (count === basket.shownCount) continue;
        basket.shownCount = count;
        for (let i = 0; i < basket.items.length; i++) {
          basket.items[i].visible = i < count;
        }
      }
      if (stalled !== wilted) {
        wilted = stalled;
        cropMaterial.color.setHex(stalled ? 0xb59a52 : 0xffffff);
      }

      for (let i = 0; i < soilRanges.length; i++) {
        const planted = Boolean(plots[i]?.crop);
        if (planted !== soilRanges[i].planted) paintSoil(soilRanges[i], planted);
      }

      for (const mesh of allPlantMeshes) mesh.count = 0;
      markers.count = 0;
      const t = performance.now() / 1000;
      for (let i = 0; i < GREENHOUSE_PLOTS.length; i++) {
        const crop = plots[i]?.crop;
        if (!crop || !Object.hasOwn(CROP_CONFIG, crop.type)) continue;
        const look = cropGrowthLook(crop.progress, CROP_CONFIG[crop.type].seconds);
        if (i > 0) {
          const mesh = look.stage === 'sprout' ? sproutMesh : plantMeshes[crop.type];
          _quat.identity();
          _scale.setScalar(look.scale);
          for (const { dx, dz } of PLOT_PLANT_CELLS[i]) {
            _pos.set(dx + 0.5, 0, dz + 0.5);
            mesh.setMatrixAt(mesh.count++, _matrix.compose(_pos, _quat, _scale));
          }
        }
        if (look.stage === 'ready') {
          const { dx, dz } = markerCells[i];
          _pos.set(dx + 0.5, L.MARKER_HEIGHT + Math.sin(t * 3 + i) * L.MARKER_BOB, dz + 0.5);
          _quat.setFromAxisAngle(_up, t * L.MARKER_SPIN + i);
          _scale.set(1, 1.4, 1);
          markers.setMatrixAt(markers.count, _matrix.compose(_pos, _quat, _scale));
          markers.setColorAt(markers.count, MARKER_COLORS[crop.type]);
          markers.count++;
        }
      }
      for (const mesh of allPlantMeshes) {
        mesh.visible = mesh.count > 0;
        if (mesh.count) mesh.instanceMatrix.needsUpdate = true;
      }
      markers.visible = markers.count > 0;
      if (markers.count) {
        markers.instanceMatrix.needsUpdate = true;
        markers.instanceColor.needsUpdate = true;
      }
    },
  };
}
