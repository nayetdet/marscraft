import * as THREE from 'three';
import { WORLD_CONFIG } from '../config/constants.js';
import { makeCanvasTexture } from '../graphics/textureGenerator.js';

export function buildNasaCustomModels(scene) {
  const group = new THREE.Group();
  const colliders = [];

  const floorTopY = WORLD_CONFIG.GROUND_LEVEL + 2; // y = 10 (topo do piso da base)
  const groundTopY = WORLD_CONFIG.GROUND_LEVEL + 1; // y = 9 (topo da areia marciana)

  const mats = {
    whiteMetal: new THREE.MeshLambertMaterial({ color: 0xf8fafc }),
    lightGray: new THREE.MeshLambertMaterial({ color: 0xcbd5e1 }),
    darkSlate: new THREE.MeshLambertMaterial({ color: 0x334155 }),
    charcoal: new THREE.MeshLambertMaterial({ color: 0x1e293b }),
    nasaBlue: new THREE.MeshLambertMaterial({ color: 0x0284c7 }),
    cyanGlow: new THREE.MeshLambertMaterial({
      color: 0x38bdf8,
      emissive: 0x0ea5e9,
      emissiveIntensity: 0.45,
    }),
    greenGlow: new THREE.MeshLambertMaterial({
      color: 0x4ade80,
      emissive: 0x22c55e,
      emissiveIntensity: 0.4,
    }),
    redBtn: new THREE.MeshLambertMaterial({
      color: 0xef4444,
      emissive: 0xdc2626,
      emissiveIntensity: 0.35,
    }),
    yellowBtn: new THREE.MeshLambertMaterial({
      color: 0xfacc15,
      emissive: 0xeab308,
      emissiveIntensity: 0.35,
    }),
    goldFoil: new THREE.MeshLambertMaterial({ color: 0xf59e0b }),
    plantStem: new THREE.MeshLambertMaterial({ color: 0x16a34a }),
    plantLeaf: new THREE.MeshLambertMaterial({ color: 0x4ade80 }),
    potato: new THREE.MeshLambertMaterial({ color: 0xd97706 }),
    waterGlass: new THREE.MeshLambertMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.72,
    }),
    solarBlue: new THREE.MeshLambertMaterial({ color: 0x1d4ed8 }),
  };

  const { texture: screenTex } = makeCanvasTexture((ctx) => {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 32, 16);
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(1, 1, 14, 14);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(3, 4, 8, 2);
    ctx.fillRect(3, 8, 10, 2);
    ctx.fillRect(3, 12, 6, 1);
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(17, 1, 14, 14);
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(22, 6, 4, 4);
    ctx.fillRect(19, 3, 2, 2);
  }, 32, 16);

  mats.screenMat = new THREE.MeshLambertMaterial({
    map: screenTex,
    emissive: new THREE.Color('#0ea5e9'),
    emissiveIntensity: 0.35,
  });

  const solidObjects = [];

  // 1. Painel de Controle Principal NASA + Cadeiras
  const { deskGroup, chairs } = createControlConsoleModel(mats, 0, floorTopY, -3.6);
  group.add(deskGroup);
  solidObjects.push(deskGroup);
  for (const chair of chairs) {
    group.add(chair);
    solidObjects.push(chair);
  }

  // 2. Gerador de Oxigênio MOXIE e Tanques Pressurizados (Parede Leste)
  const oxygenStation = createOxygenStationModel(mats, 4.6, floorTopY, -1.5);
  group.add(oxygenStation);
  solidObjects.push(oxygenStation);

  // 3. Bancada de Purificação de Água e Microscópio (Parede Sudeste)
  const labTable = createLabTableModel(mats, 4.4, floorTopY, 2.4);
  group.add(labTable);
  solidObjects.push(labTable);

  // 4. Beliches da Tripulação (Parede Noroeste)
  const crewQuarters = createCrewQuartersModel(mats, -4.4, floorTopY, -2.5);
  group.add(crewQuarters);
  solidObjects.push(crewQuarters);

  // 5. Plantações 3D e Lâmpadas de Cultivo dentro da Redoma de Estufa (x = -18, z = 0)
  const { cropsGroup, plants } = createGreenhouseCropsModel(mats, -18, floorTopY, 0);
  group.add(cropsGroup);
  for (const plant of plants) {
    solidObjects.push(plant);
  }

  // 6. Rover Marciano NASA 3D detalhado (Estacionado na frente da base: x = 7.5, z = 10.5)
  const rover = createMarsRoverModel(mats, 7.5, groundTopY, 10.5);
  group.add(rover);
  solidObjects.push(rover);

  // 7. Painéis Solares Inclinados 3D e Antena Parabólica Externa
  const { solarArrays, dish } = createExteriorSolarAndDish(mats, 0, groundTopY, 0);
  for (const arr of solarArrays) {
    group.add(arr);
    solidObjects.push(arr);
  }
  group.add(dish);
  solidObjects.push(dish);

  scene.add(group);
  group.updateMatrixWorld(true);

  // Extrai caixas de colisão AABB tanto do objeto inteiro quanto de cada malha individual
  for (const obj of solidObjects) {
    obj.updateMatrixWorld(true);
    const fullBox = new THREE.Box3().setFromObject(obj);
    if (!fullBox.isEmpty()) {
      colliders.push({
        minX: fullBox.min.x - 0.06,
        maxX: fullBox.max.x + 0.06,
        minY: fullBox.min.y,
        maxY: Math.max(fullBox.max.y, fullBox.min.y + 1.5),
        minZ: fullBox.min.z - 0.06,
        maxZ: fullBox.max.z + 0.06,
      });
    }
  }

  return { group, colliders };
}

function addBox(parent, w, h, d, mat, x, y, z, rx = 0, ry = 0, rz = 0) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z);
  if (rx || ry || rz) mesh.rotation.set(rx, ry, rz);
  parent.add(mesh);
  return mesh;
}

function createControlConsoleModel(mats, x, y, z) {
  const deskGroup = new THREE.Group();
  deskGroup.position.set(x, y, z);

  addBox(deskGroup, 0.25, 0.9, 1.0, mats.lightGray, -1.55, 0.45, 0);
  addBox(deskGroup, 0.25, 0.9, 1.0, mats.lightGray, 1.55, 0.45, 0);
  addBox(deskGroup, 3.4, 0.14, 1.15, mats.whiteMetal, 0, 0.92, 0);

  addBox(deskGroup, 3.2, 0.28, 0.65, mats.darkSlate, 0, 1.06, 0.15, 0.28, 0, 0);

  const btnColors = [mats.redBtn, mats.yellowBtn, mats.greenGlow, mats.cyanGlow];
  for (let i = 0; i < 8; i++) {
    const bx = -1.2 + i * 0.34;
    addBox(deskGroup, 0.14, 0.08, 0.14, btnColors[i % 4], bx, 1.22, 0.24, 0.28, 0, 0);
  }
  addBox(deskGroup, 0.85, 0.05, 0.28, mats.lightGray, 0, 1.02, 0.42);
  addBox(deskGroup, 0.06, 0.26, 0.06, mats.lightGray, 1.15, 1.25, 0.32, -0.2, 0, 0);
  addBox(deskGroup, 0.14, 0.08, 0.1, mats.redBtn, 1.15, 1.38, 0.29);

  // Monitor Central
  addBox(deskGroup, 0.14, 0.45, 0.14, mats.charcoal, 0, 1.2, -0.25);
  addBox(deskGroup, 1.25, 0.72, 0.1, mats.charcoal, 0, 1.58, -0.22);
  addBox(deskGroup, 1.15, 0.62, 0.04, mats.screenMat, 0, 1.58, -0.16);

  // Monitor Esquerdo
  const leftMon = new THREE.Group();
  leftMon.position.set(-1.22, 1.58, -0.06);
  leftMon.rotation.y = 0.32;
  addBox(leftMon, 1.05, 0.68, 0.1, mats.charcoal, 0, 0, 0);
  addBox(leftMon, 0.95, 0.58, 0.04, mats.screenMat, 0, 0, 0.04);
  deskGroup.add(leftMon);

  // Monitor Direito
  const rightMon = new THREE.Group();
  rightMon.position.set(1.22, 1.58, -0.06);
  rightMon.rotation.y = -0.32;
  addBox(rightMon, 1.05, 0.68, 0.1, mats.charcoal, 0, 0, 0);
  addBox(rightMon, 0.95, 0.58, 0.04, mats.screenMat, 0, 0, 0.04);
  deskGroup.add(rightMon);

  // 2 Cadeiras Giratórias separadas
  const chairs = [];
  for (const cx of [-0.85, 0.85]) {
    const chair = new THREE.Group();
    chair.position.set(x + cx, y, z + 1.35);
    addBox(chair, 0.45, 0.08, 0.45, mats.darkSlate, 0, 0.04, 0);
    addBox(chair, 0.1, 0.42, 0.1, mats.lightGray, 0, 0.25, 0);
    addBox(chair, 0.56, 0.1, 0.56, mats.nasaBlue, 0, 0.48, 0);
    addBox(chair, 0.54, 0.72, 0.1, mats.nasaBlue, 0, 0.88, 0.24);
    addBox(chair, 0.36, 0.2, 0.12, mats.whiteMetal, 0, 1.3, 0.24);
    chairs.push(chair);
  }

  return { deskGroup, chairs };
}

function createOxygenStationModel(mats, x, y, z) {
  const g = new THREE.Group();
  g.position.set(x, y, z);

  addBox(g, 1.1, 0.16, 2.2, mats.darkSlate, 0, 0.08, 0);

  for (const tz of [-0.55, 0.55]) {
    addBox(g, 0.68, 1.85, 0.68, mats.whiteMetal, 0.1, 1.05, tz);
    addBox(g, 0.72, 0.28, 0.72, mats.cyanGlow, 0.1, 1.35, tz);
    addBox(g, 0.35, 0.25, 0.35, mats.lightGray, 0.1, 2.08, tz);
  }

  addBox(g, 0.2, 0.18, 1.4, mats.lightGray, 0.1, 2.22, 0);
  addBox(g, 0.4, 1.2, 0.55, mats.charcoal, -0.22, 0.75, 0);
  addBox(g, 0.08, 0.42, 0.42, mats.greenGlow, -0.42, 0.95, 0);

  return g;
}

function createLabTableModel(mats, x, y, z) {
  const g = new THREE.Group();
  g.position.set(x, y, z);

  addBox(g, 1.1, 0.88, 2.0, mats.whiteMetal, 0, 0.44, 0);
  addBox(g, 1.2, 0.1, 2.1, mats.lightGray, 0, 0.92, 0);

  addBox(g, 0.5, 0.12, 0.5, mats.darkSlate, 0, 1.02, -0.45);
  addBox(g, 0.42, 0.85, 0.42, mats.waterGlass, 0, 1.5, -0.45);
  addBox(g, 0.5, 0.14, 0.5, mats.whiteMetal, 0, 1.98, -0.45);

  addBox(g, 0.32, 0.08, 0.32, mats.charcoal, 0, 1.0, 0.45);
  addBox(g, 0.1, 0.38, 0.1, mats.whiteMetal, 0.08, 1.2, 0.45);
  addBox(g, 0.12, 0.26, 0.12, mats.darkSlate, -0.02, 1.35, 0.45, 0, 0, 0.4);

  return g;
}

function createCrewQuartersModel(mats, x, y, z) {
  const g = new THREE.Group();
  g.position.set(x, y, z);

  addBox(g, 1.25, 0.14, 2.2, mats.whiteMetal, 0, 0.45, 0);
  addBox(g, 1.15, 0.14, 1.95, mats.nasaBlue, 0, 0.56, 0.08);
  addBox(g, 0.9, 0.12, 0.42, mats.whiteMetal, 0, 0.66, -0.72);

  addBox(g, 1.25, 0.14, 2.2, mats.whiteMetal, 0, 1.55, 0);
  addBox(g, 1.15, 0.14, 1.95, mats.nasaBlue, 0, 1.66, 0.08);
  addBox(g, 0.9, 0.12, 0.42, mats.whiteMetal, 0, 1.76, -0.72);

  for (const [px, pz] of [
    [-0.58, -1.05],
    [0.58, -1.05],
    [-0.58, 1.05],
    [0.58, 1.05],
  ]) {
    addBox(g, 0.12, 2.1, 0.12, mats.lightGray, px, 1.05, pz);
  }

  return g;
}

function createGreenhouseCropsModel(mats, centerX, floorTopY, centerZ) {
  const cropsGroup = new THREE.Group();
  cropsGroup.position.set(centerX, floorTopY, centerZ);
  const plants = [];

  for (let dx = -4; dx <= 4; dx++) {
    for (let dz = -4; dz <= 4; dz++) {
      const isWalkway = Math.abs(dz) <= 1 || Math.abs(dx) <= 1;
      const dist = Math.hypot(dx, dz);
      if (isWalkway || dist > 5.2) continue;

      if (Math.abs(dz) >= 2 && Math.abs(dz) <= 4) {
        const plant = new THREE.Group();
        plant.position.set(dx + 0.5, 0, dz + 0.5);

        addBox(plant, 0.14, 0.48, 0.14, mats.plantStem, 0, 0.24, 0);
        addBox(plant, 0.52, 0.22, 0.22, mats.plantLeaf, 0, 0.36, 0);
        addBox(plant, 0.22, 0.22, 0.52, mats.plantLeaf, 0, 0.42, 0);
        addBox(plant, 0.18, 0.14, 0.18, mats.potato, 0.16, 0.07, 0.14);
        addBox(plant, 0.16, 0.12, 0.16, mats.potato, -0.15, 0.06, -0.12);

        cropsGroup.add(plant);
        plants.push(plant);
      }
    }
  }

  addBox(cropsGroup, 7.5, 0.12, 0.24, mats.cyanGlow, 0, 3.2, -3.0);
  addBox(cropsGroup, 7.5, 0.12, 0.24, mats.cyanGlow, 0, 3.2, 3.0);

  return { cropsGroup, plants };
}

function createMarsRoverModel(mats, x, y, z) {
  const r = new THREE.Group();
  r.position.set(x, y, z);

  for (const wx of [-1.2, 1.2]) {
    for (const wz of [-1.35, 0, 1.35]) {
      addBox(r, 0.38, 0.65, 0.65, mats.charcoal, wx, 0.32, wz);
      addBox(r, 0.42, 0.22, 0.22, mats.lightGray, wx, 0.32, wz);
      addBox(r, 0.12, 0.55, 0.12, mats.lightGray, wx * 0.82, 0.62, wz);
    }
  }

  addBox(r, 2.0, 0.65, 2.8, mats.whiteMetal, 0, 0.95, 0);
  addBox(r, 2.06, 0.28, 2.86, mats.goldFoil, 0, 0.82, 0);
  addBox(r, 1.7, 0.08, 2.2, mats.solarBlue, 0, 1.3, 0.1);

  addBox(r, 0.18, 1.15, 0.18, mats.whiteMetal, 0.45, 1.8, -1.05);
  addBox(r, 0.62, 0.32, 0.36, mats.whiteMetal, 0.45, 2.42, -1.05);
  addBox(r, 0.16, 0.16, 0.08, mats.cyanGlow, 0.3, 2.42, -1.24);
  addBox(r, 0.16, 0.16, 0.08, mats.cyanGlow, 0.6, 2.42, -1.24);

  addBox(r, 0.16, 0.16, 1.1, mats.lightGray, -0.45, 0.85, -1.75, 0.25, 0, 0);
  addBox(r, 0.28, 0.28, 0.32, mats.darkSlate, -0.45, 0.68, -2.28);

  return r;
}

function createExteriorSolarAndDish(mats, x, y, z) {
  const solarArrays = [];

  for (const sx of [-9, -4.5, 0, 4.5, 9]) {
    const array = new THREE.Group();
    array.position.set(x + sx, y, z - 10.5);
    addBox(array, 0.25, 1.4, 0.25, mats.lightGray, 0, 0.7, 0);
    addBox(array, 3.4, 0.1, 2.2, mats.whiteMetal, 0, 1.45, 0, 0.38, 0, 0);
    addBox(array, 3.2, 0.12, 2.0, mats.solarBlue, 0, 1.47, 0, 0.38, 0, 0);
    solarArrays.push(array);
  }

  const dish = new THREE.Group();
  dish.position.set(x + 5.2, y + 6.0, z - 3.5);
  addBox(dish, 0.28, 1.6, 0.28, mats.lightGray, 0, 0.8, 0);

  const bowl = new THREE.Group();
  bowl.position.set(0, 1.7, 0);
  bowl.rotation.set(0.45, 0.3, 0);
  addBox(bowl, 2.2, 0.16, 2.2, mats.whiteMetal, 0, 0, 0);
  addBox(bowl, 2.2, 0.45, 0.18, mats.whiteMetal, 0, 0.22, -1.02);
  addBox(bowl, 2.2, 0.45, 0.18, mats.whiteMetal, 0, 0.22, 1.02);
  addBox(bowl, 0.18, 0.45, 2.2, mats.whiteMetal, -1.02, 0.22, 0);
  addBox(bowl, 0.18, 0.45, 2.2, mats.whiteMetal, 1.02, 0.22, 0);
  addBox(bowl, 0.12, 1.2, 0.12, mats.darkSlate, 0, 0.6, 0);
  addBox(bowl, 0.28, 0.28, 0.28, mats.cyanGlow, 0, 1.25, 0);
  dish.add(bowl);

  return { solarArrays, dish };
}
