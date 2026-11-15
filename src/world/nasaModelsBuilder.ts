// @ts-nocheck
import { GREENHOUSE_MONITOR_POS } from './greenhouseLayout.ts';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { MAV_CONFIG, WORLD_CONFIG } from '../config/constants.ts';
import { makeCanvasTexture } from '../graphics/textureGenerator.ts';
import { EAST_WING, HABITAT_LAYOUT, SOLAR_FIELD } from './habitatLayout.ts';
import { signTexture } from '../base/baseCanvas.ts';
import { SIGNS } from '../base/basePosters.ts';

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
    potato: new THREE.MeshLambertMaterial({ color: 0xd97706 }),
    labGlass: new THREE.MeshLambertMaterial({ color: 0x89d8ed, transparent: true, opacity: 0.25, depthWrite: false }),
    waterGlass: new THREE.MeshLambertMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.72,
    }),
  };

  const { texture: solarTex } = makeCanvasTexture((ctx) => {
    ctx.fillStyle = '#aab7c4';
    ctx.fillRect(0, 0, 64, 64);
    ctx.fillStyle = '#263747';
    ctx.fillRect(3, 3, 58, 58);
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const x = 5 + col * 14;
        const y = 5 + row * 14;
        ctx.fillStyle = (row + col) % 2 === 0 ? '#18304a' : '#203c56';
        ctx.fillRect(x, y, 12, 12);
        ctx.fillStyle = '#688093';
        ctx.fillRect(x + 5, y, 1, 12);
        ctx.fillStyle = '#38566d';
        ctx.fillRect(x + 1, y + 1, 10, 1);
      }
    }
  }, 64, 64);
  mats.solarPanel = new THREE.MeshLambertMaterial({ map: solarTex });
  // Material proprio do campo solar: a poeira nos paineis (issue #103) tinge so ele, nao o rover
  mats.fieldSolarPanel = mats.solarPanel.clone();

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

  const { texture: greenhouseScreenTex } = makeCanvasTexture((ctx) => {
    ctx.fillStyle = '#052e16';
    ctx.fillRect(0, 0, 32, 24);
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(0, 0, 32, 1);
    ctx.fillRect(0, 23, 32, 1);
    ctx.fillRect(0, 0, 1, 24);
    ctx.fillRect(31, 0, 1, 24);
    // 3 crop cards on the 3D monitor screen (lettuce, potato, soy)
    ctx.fillStyle = '#14532d';
    ctx.fillRect(2, 3, 8, 13);
    ctx.fillRect(12, 3, 8, 13);
    ctx.fillRect(22, 3, 8, 13);
    // Lettuce icon
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(4, 5, 4, 4);
    ctx.fillStyle = '#86efac';
    ctx.fillRect(5, 6, 2, 2);
    // Potato icon
    ctx.fillStyle = '#d97706';
    ctx.fillRect(14, 5, 4, 4);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(15, 6, 2, 2);
    // Soy icon
    ctx.fillStyle = '#84cc16';
    ctx.fillRect(24, 5, 4, 4);
    ctx.fillStyle = '#bef264';
    ctx.fillRect(25, 6, 2, 2);
    // Mini buy buttons
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(3, 12, 6, 3);
    ctx.fillRect(13, 12, 6, 3);
    ctx.fillRect(23, 12, 6, 3);
    // Bottom resource bars (water & power)
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(2, 18, 13, 3);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(17, 18, 13, 3);
  }, 32, 24);

  mats.greenhouseScreenMat = new THREE.MeshLambertMaterial({
    map: greenhouseScreenTex,
    emissive: new THREE.Color('#22c55e'),
    emissiveIntensity: 0.42,
  });

  const solidObjects = [];

  // 1. Painel de Controle Principal NASA + Cadeiras
  const { deskGroup, chairs } = createControlConsoleModel(mats, 4, floorTopY, -9.6);
  group.add(deskGroup);
  solidObjects.push(deskGroup);
  for (const chair of chairs) {
    group.add(chair);
    solidObjects.push(chair);
  }

  // 2. Gerador de Oxigênio MOXIE e Tanques Pressurizados (Parede Leste)
  const oxygenStation = createOxygenStationModel(mats, 10.6, floorTopY, -3);
  group.add(oxygenStation);
  solidObjects.push(oxygenStation);

  // 3. Bancada de Purificação de Água e Microscópio (Parede Sudeste)
  const labTable = createLabTableModel(mats, 10.4, floorTopY, 1.5);
  group.add(labTable);
  solidObjects.push(labTable);

  // 4. Beliches da Tripulação (Parede Noroeste)
  // Tres beliches no dormitorio (EAST_WING), com a cabeceira na parede sul
  for (const bunk of EAST_WING.BUNKS) {
    const crewQuarters = createCrewQuartersModel(mats, bunk.x, floorTopY, bunk.z);
    group.add(crewQuarters);
    solidObjects.push(crewQuarters);
  }

  // 5. Plantações 3D, Lâmpadas de Cultivo e Monitor da Estufa dentro da Redoma
  const { cropsGroup, plants } = createGreenhouseCropsModel(mats, HABITAT_LAYOUT.DOME_X, floorTopY, HABITAT_LAYOUT.DOME_Z);
  group.add(cropsGroup);
  for (const plant of plants) {
    solidObjects.push(plant);
  }
  const greenhouseMonitor = createGreenhouseMonitorModel(
    mats,
    GREENHOUSE_MONITOR_POS.x,
    floorTopY,
    GREENHOUSE_MONITOR_POS.z
  );
  greenhouseMonitor.userData.scanId = 'greenhouse';
  group.add(greenhouseMonitor);
  solidObjects.push(greenhouseMonitor);

  // 6. Rover Marciano NASA 3D detalhado (Estacionado na frente da base: x = 7.5, z = 10.5)
  const { roverGroup: rover, wheels: roverWheels } = createMarsRoverModel(mats, 7.5, groundTopY, 10.5);
  group.add(rover);

  // 7. Painéis Solares Inclinados 3D e Antena Parabólica Externa
  const { solarArrays, dish } = createExteriorSolarAndDish(mats, 0, groundTopY, 0);
  for (const arr of solarArrays) {
    arr.userData.scanId = 'solar-panels';
    group.add(arr);
    solidObjects.push(arr);
  }
  dish.userData.scanId = 'antenna';
  group.add(dish);
  solidObjects.push(dish);

  // 8. Doca e Usina Externa de Recepção de Gelo e Conversão em Água
  const iceDepot = createIceProcessingDepotModel(mats, 5.5, groundTopY, 9.5);
  iceDepot.userData.scanId = 'ice-depot';
  group.add(iceDepot);
  solidObjects.push(iceDepot);

  // 9. MAV (Mars Ascent Vehicle) na plataforma de lancamento + fabrica de combustivel ISRU
  const { pad, rocket, factory } = createMavModel(mats, MAV_CONFIG.PAD_POSITION.x, groundTopY, MAV_CONFIG.PAD_POSITION.z);
  rocket.userData.scanId = 'lander';
  factory.userData.scanId = 'mav-panel';
  group.add(pad);
  group.add(rocket);
  solidObjects.push(rocket);
  group.add(factory);
  solidObjects.push(factory);
  // 8. Equipamentos 3D do Módulo da Academia (Esteira Espacial, Bicicleta Ergométrica e Scanner MedBay)
  const treadmill = createSpaceTreadmillModel(mats, -9.2, floorTopY, 10.2);
  treadmill.userData.scanId = 'gym';
  group.add(treadmill);
  solidObjects.push(treadmill);

  const exerciseBike = createExerciseBikeModel(mats, -5.8, floorTopY, 10.4);
  exerciseBike.userData.scanId = 'gym';
  group.add(exerciseBike);
  solidObjects.push(exerciseBike);

  const gymMedbay = createGymMedbayModel(mats, -7.6, floorTopY, 12.1);
  gymMedbay.userData.scanId = 'gym';
  group.add(gymMedbay);
  solidObjects.push(gymMedbay);

  // Issue #56: abrigo de tempestade com parede de agua e terminal de comunicacao
  const shelter = createStormShelterModel(mats, floorTopY);
  for (const wall of shelter.walls) {
    group.add(wall);
    solidObjects.push(wall);
  }
  group.add(shelter.roof); // teto so visual, fora da colisao para nao fechar a cabine

  // Modulo norte (issue #56, parte B): cada movel e um objeto solido separado
  for (const obj of createNorthModuleModels(mats, floorTopY)) {
    group.add(obj);
    if (!obj.userData.noCollide) solidObjects.push(obj);
  }

  const commsTerminal = createCommsTerminalModel(mats, 9, floorTopY, -10.65);
  group.add(commsTerminal);
  solidObjects.push(commsTerminal);

  group.updateMatrixWorld(true);

  // Extrai caixas de colisão AABB tanto do objeto inteiro quanto de cada malha individual
  for (const obj of solidObjects) {
    obj.updateMatrixWorld(true);
    const fullBox = new THREE.Box3().setFromObject(obj);
    if (!fullBox.isEmpty()) {
      const collider = {
        minX: fullBox.min.x - 0.06,
        maxX: fullBox.max.x + 0.06,
        minY: fullBox.min.y,
        maxY: Math.max(fullBox.max.y, fullBox.min.y + 1.5),
        minZ: fullBox.min.z - 0.06,
        maxZ: fullBox.max.z + 0.06,
      };
      // Usado pelo scanner da luneta (scanTargeting); sem scanId, o alvo vem do módulo da base.
      if (plants.includes(obj)) collider.scanId = 'greenhouse';
      else if (obj.userData.scanId) collider.scanId = obj.userData.scanId;
      colliders.push(collider);
      if (plants.includes(obj)) obj.userData.collider = collider;
    }
  }

  // A screen-sized scan target on the ISRU/MAV control panel. The broad factory
  // collider remains useful for navigation, while this gives the scope a precise
  // target when the player aims directly at the panel.
  colliders.push({
    scanId: 'mav-panel',
    minX: MAV_CONFIG.PAD_POSITION.x + 4.05,
    maxX: MAV_CONFIG.PAD_POSITION.x + 5.15,
    minY: groundTopY + 0.68,
    maxY: groundTopY + 1.22,
    minZ: MAV_CONFIG.PAD_POSITION.z - 0.52,
    maxZ: MAV_CONFIG.PAD_POSITION.z - 0.38,
  });

  // Keep plants and the driven rover as independent objects; merge static scenery.
  // O foguete do MAV tambem fica separado: ele sobe na animacao de decolagem.
  const merged = mergeByMaterial(group, [...plants, rover, rocket], [rover]);
  scene.add(merged);
  return { group: merged, colliders, plants, rover, roverWheels, rocket, solarPanelMaterial: mats.fieldSolarPanel };
}

// Junta as centenas de caixas em uma malha por material (de ~300 draw calls para ~20).
// Os modelos sao estaticos, entao a transformacao de cada caixa e "assada" na geometria.
// Objetos em `separateObjects` mantem a identidade (e o userData), so que cada um vira
// uma unica malha com cor por vertice.
export function mergeByMaterial(group, separateObjects = [], preserveObjects = []) {
  group.updateMatrixWorld(true);
  const separate = new Set(separateObjects);
  const buckets = new Map();

  const collect = (obj) => {
    if (separate.has(obj)) return;
    if (obj.isMesh) {
      const geo = obj.geometry.clone().applyMatrix4(obj.matrixWorld);
      geo.clearGroups();
      if (!buckets.has(obj.material)) buckets.set(obj.material, []);
      buckets.get(obj.material).push(geo);
      obj.geometry.dispose();
    }
    for (const child of obj.children) collect(child);
  };
  collect(group);

  const merged = new THREE.Group();
  for (const [material, geos] of buckets) {
    const geometry = mergeGeometries(geos, false);
    geos.forEach((g) => g.dispose());
    const mesh = new THREE.Mesh(geometry, material);
    mesh.matrixAutoUpdate = false;
    merged.add(mesh);
  }

  const vertexColorMat = new THREE.MeshLambertMaterial({ vertexColors: true });
  const preserve = new Set(preserveObjects);
  for (const obj of separateObjects) {
    if (!preserve.has(obj)) bakeIntoSingleMesh(obj, vertexColorMat);
    merged.attach(obj); // preserva a posicao no mundo ao trocar de pai
  }
  return merged;
}

// Troca os filhos de `root` por uma unica malha, guardando a cor de cada material nos vertices
function bakeIntoSingleMesh(root, vertexColorMat) {
  root.updateMatrixWorld(true);
  const toLocal = root.matrixWorld.clone().invert();
  const geos = [];
  const meshes = [];
  root.traverse((obj) => {
    if (obj === root || !obj.isMesh) return;
    const matrix = toLocal.clone().multiply(obj.matrixWorld);
    const geo = obj.geometry.clone().applyMatrix4(matrix);
    geo.clearGroups();
    const { r, g, b } = obj.material.color;
    const colors = new Float32Array(geo.attributes.position.count * 3);
    for (let i = 0; i < colors.length; i += 3) {
      colors[i] = r;
      colors[i + 1] = g;
      colors[i + 2] = b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geos.push(geo);
    meshes.push(obj);
  });
  if (geos.length === 0) return;

  for (const mesh of meshes) {
    mesh.geometry.dispose();
    mesh.removeFromParent();
  }
  const geometry = mergeGeometries(geos, false);
  geos.forEach((g) => g.dispose());
  root.add(new THREE.Mesh(geometry, vertexColorMat));
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
  addBox(g, 0.42, 0.85, 0.42, mats.labGlass, 0, 1.5, -0.45);
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
  // As plantas da estufa vem do monitor (StationSystem.plots): nenhuma planta solta nasce pronta,
  // senao ela se mistura com a que o jogador plantou e a colheita parece menor que a plantacao.
  const plants = [];

  const growLight = new THREE.MeshLambertMaterial({ color: 0xf0abfc, emissive: 0xd946ef, emissiveIntensity: 0.7 });

  // Luzes de cultivo rosa/roxas sobre o anel de dentro e barras azuis sobre o de fora
  const c = 0.5; // centro do bloco central da redoma
  addBox(cropsGroup, 9, 0.12, 0.24, growLight, c, 4.4, c - 5.5);
  addBox(cropsGroup, 9, 0.12, 0.24, growLight, c, 4.4, c + 5.5);
  addBox(cropsGroup, 0.24, 0.12, 9, growLight, c - 5.5, 4.4, c);
  addBox(cropsGroup, 0.24, 0.12, 9, growLight, c + 5.5, 4.4, c);
  addBox(cropsGroup, 10, 0.12, 0.24, mats.cyanGlow, c, 5.0, c - 10.5);
  addBox(cropsGroup, 10, 0.12, 0.24, mats.cyanGlow, c, 5.0, c + 10.5);
  addBox(cropsGroup, 0.24, 0.12, 10, mats.cyanGlow, c - 10.5, 5.0, c);
  addBox(cropsGroup, 0.24, 0.12, 10, mats.cyanGlow, c + 10.5, 5.0, c);

  return { cropsGroup, plants };
}

function createGreenhouseMonitorModel(mats, x, y, z) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  // Aponta para o corredor e a entrada do tunel da estufa
  g.rotation.y = Math.PI - 0.38;

  // Base e pedestal branco
  addBox(g, 0.56, 0.08, 0.46, mats.darkSlate, 0, 0.04, 0);
  addBox(g, 0.18, 0.92, 0.18, mats.whiteMetal, 0, 0.5, -0.04);
  addBox(g, 0.06, 0.56, 0.04, mats.greenGlow, 0, 0.52, 0.06);

  // Bandeja de botoes coloridos (1 para cada planta)
  addBox(g, 0.72, 0.08, 0.36, mats.lightGray, 0, 0.96, 0.08, 0.22, 0, 0);
  addBox(g, 0.14, 0.06, 0.12, mats.greenGlow, -0.2, 1.01, 0.14, 0.22, 0, 0);
  addBox(g, 0.14, 0.06, 0.12, mats.yellowBtn, 0, 1.01, 0.14, 0.22, 0, 0);
  addBox(g, 0.14, 0.06, 0.12, mats.cyanGlow, 0.2, 1.01, 0.14, 0.22, 0, 0);

  // Moldura e tela do monitorzinho da estufa
  addBox(g, 0.84, 0.62, 0.1, mats.whiteMetal, 0, 1.32, -0.03, -0.14, 0, 0);
  addBox(g, 0.78, 0.56, 0.1, mats.charcoal, 0, 1.32, 0.0, -0.14, 0, 0);
  addBox(g, 0.68, 0.46, 0.04, mats.greenhouseScreenMat, 0, 1.32, 0.05, -0.14, 0, 0);
  // Luzinha verde no topo do monitor
  addBox(g, 0.24, 0.06, 0.08, mats.greenGlow, 0, 1.65, -0.06, -0.14, 0, 0);

  return g;
}

function createMarsRoverModel(mats, x, y, z) {
  const r = new THREE.Group();
  r.position.set(x, y, z);
  const wheels = [];

  for (const wx of [-1.2, 1.2]) {
    for (const wz of [-1.35, 0, 1.35]) {
      const wheelMesh = addBox(r, 0.38, 0.65, 0.65, mats.charcoal, wx, 0.32, wz);
      addBox(r, 0.42, 0.22, 0.22, mats.lightGray, wx, 0.32, wz);
      // Braço da suspensão
      addBox(r, 0.12, 0.55, 0.12, mats.lightGray, wx * 0.82, 0.62, wz);
      wheels.push(wheelMesh);
    }
  }

  addBox(r, 2.0, 0.65, 2.8, mats.whiteMetal, 0, 0.95, 0);
  addBox(r, 2.06, 0.28, 2.86, mats.goldFoil, 0, 0.82, 0);
  addBox(r, 1.7, 0.08, 2.2, mats.solarPanel, 0, 1.3, 0.1);

  // Mastro óptico (Mastcam / SuperCam) na direita dianteira
  addBox(r, 0.18, 1.15, 0.18, mats.whiteMetal, 0.45, 1.8, -1.05);
  addBox(r, 0.62, 0.32, 0.36, mats.whiteMetal, 0.45, 2.42, -1.05);
  addBox(r, 0.16, 0.16, 0.08, mats.cyanGlow, 0.3, 2.42, -1.24);
  addBox(r, 0.16, 0.16, 0.08, mats.cyanGlow, 0.6, 2.42, -1.24);

  // O sistema articulado de extração de água ISRU (braço robótico + broca + câmara térmica)
  // é montado pelo RoverController sobre roverGroup para animar cada etapa em tempo real.
  return { roverGroup: r, wheels };
}

function createExteriorSolarAndDish(mats, x, y, z) {
  const solarArrays = [];

  // Campo solar em frente aos alojamentos: uma fileira de cinco paineis
  for (let i = 0; i < SOLAR_FIELD.count; i++) {
    const array = new THREE.Group();
    array.position.set(x + SOLAR_FIELD.xFirst + i * SOLAR_FIELD.spacing, y, z + SOLAR_FIELD.z);
    addBox(array, 0.25, 1.4, 0.25, mats.lightGray, 0, 0.7, 0);
    addBox(array, 3.4, 0.1, 2.2, mats.whiteMetal, 0, 1.45, 0, 0.38, 0, 0);
    addBox(array, 3.2, 0.12, 2.0, mats.fieldSolarPanel, 0, 1.47, 0, 0.38, 0, 0);
    solarArrays.push(array);
  }

  const dish = new THREE.Group();
  dish.position.set(x + 10.45, y + 6.0, z - 9.5);
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

function createIceProcessingDepotModel(mats, x, y, z) {
  const g = new THREE.Group();
  g.position.set(x, y, z);

  // Plataforma de desacoplamento de gelo no solo
  addBox(g, 2.8, 0.14, 2.8, mats.darkSlate, 0, 0.07, 0);

  // Guias laterais amarelas e pretas para o rover estacionar
  addBox(g, 0.2, 0.28, 2.6, mats.yellowBtn, -1.3, 0.2, 0);
  addBox(g, 0.2, 0.28, 2.6, mats.yellowBtn, 1.3, 0.2, 0);

  // Funil / Moega de Recepção de Gelo
  addBox(g, 1.4, 0.9, 1.2, mats.whiteMetal, 0, 0.55, -0.6);
  addBox(g, 1.2, 0.25, 1.0, mats.charcoal, 0, 0.95, -0.6);
  addBox(g, 1.0, 0.12, 0.8, mats.waterGlass, 0, 0.98, -0.6);

  // Tanque vertical de liquefação e purificação com indicador de nível de água
  addBox(g, 0.8, 1.8, 0.8, mats.whiteMetal, -0.9, 1.0, -0.7);
  addBox(g, 0.6, 1.2, 0.6, mats.waterGlass, -0.9, 1.1, -0.7);
  addBox(g, 0.7, 0.15, 0.7, mats.nasaBlue, -0.9, 1.95, -0.7);

  // Tubulação conectada ao Habitat Principal
  addBox(g, 0.16, 0.16, 1.8, mats.lightGray, 0, 0.45, -1.8);

  // Sinalizador luminoso azul (indicador de água e doca)
  addBox(g, 0.12, 1.4, 0.12, mats.lightGray, 1.1, 0.8, -0.8);
  addBox(g, 0.28, 0.28, 0.28, mats.cyanGlow, 1.1, 1.55, -0.8);

  return g;
}

function createSpaceTreadmillModel(mats, x, y, z) {
  const g = new THREE.Group();
  g.position.set(x, y, z);

  // Base isoladora de vibração (estilo NASA T2 / COLBERT) e plataforma de corrida
  addBox(g, 1.18, 0.08, 2.1, mats.darkSlate, 0, 0.04, 0);
  for (const sx of [-0.46, 0.46]) {
    for (const sz of [-0.78, 0.78]) {
      addBox(g, 0.14, 0.12, 0.18, mats.goldFoil, sx, 0.12, sz);
    }
  }
  addBox(g, 1.12, 0.14, 2.0, mats.whiteMetal, 0, 0.22, 0);
  // Lona preta da esteira + faixas de tração
  addBox(g, 0.82, 0.05, 1.78, mats.charcoal, 0, 0.3, 0.05);
  for (let i = -3; i <= 3; i++) {
    addBox(g, 0.74, 0.06, 0.05, mats.lightGray, 0, 0.31, 0.05 + i * 0.24);
  }
  // Trilhos laterais antiderrapantes
  addBox(g, 0.12, 0.08, 1.88, mats.nasaBlue, -0.48, 0.31, 0.02);
  addBox(g, 0.12, 0.08, 1.88, mats.nasaBlue, 0.48, 0.31, 0.02);

  // Colunas frontais e barras de apoio laterais
  for (const sx of [-0.48, 0.48]) {
    addBox(g, 0.1, 1.15, 0.12, mats.lightGray, sx, 0.86, -0.82, -0.12, 0, 0);
    addBox(g, 0.08, 0.08, 1.15, mats.charcoal, sx, 1.18, -0.32);
    // Braços tensores do colete de gravidade artificial (bungee harness para densidade óssea)
    addBox(g, 0.12, 0.12, 0.55, mats.nasaBlue, sx, 0.78, 0.05);
    addBox(g, 0.08, 0.48, 0.08, mats.cyanGlow, sx, 0.54, 0.18);
  }

  // Painel digital frontal da esteira
  addBox(g, 1.08, 0.42, 0.24, mats.darkSlate, 0, 1.38, -0.88, 0.32, 0, 0);
  addBox(g, 0.78, 0.28, 0.06, mats.screenMat, 0, 1.42, -0.76, 0.32, 0, 0);
  addBox(g, 0.14, 0.08, 0.08, mats.redBtn, 0, 1.24, -0.74, 0.32, 0, 0);
  addBox(g, 0.12, 0.08, 0.08, mats.greenGlow, -0.28, 1.24, -0.74, 0.32, 0, 0);
  addBox(g, 0.12, 0.08, 0.08, mats.yellowBtn, 0.28, 1.24, -0.74, 0.32, 0, 0);

  return g;
}

// MAV: foguete de subida em blocos (sem logos), plataforma e uma pequena fabrica ISRU ao lado
function createMavModel(mats, x, y, z) {
  const pad = new THREE.Group();
  pad.position.set(x, y, z);
  addBox(pad, 7.0, 0.06, 7.0, mats.darkSlate, 0, 0.03, 0);
  addBox(pad, 7.2, 0.07, 0.3, mats.yellowBtn, 0, 0.04, 3.45);
  addBox(pad, 7.2, 0.07, 0.3, mats.yellowBtn, 0, 0.04, -3.45);
  addBox(pad, 0.3, 0.07, 7.2, mats.yellowBtn, 3.45, 0.04, 0);
  addBox(pad, 0.3, 0.07, 7.2, mats.yellowBtn, -3.45, 0.04, 0);

  const rocket = new THREE.Group();
  rocket.position.set(x, y, z);

  // Pernas de pouso
  for (const [lx, lz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    addBox(rocket, 0.2, 1.5, 0.2, mats.lightGray, lx * 1.15, 0.75, lz * 1.15, lz * 0.3, 0, -lx * 0.3);
    addBox(rocket, 0.5, 0.1, 0.5, mats.charcoal, lx * 1.4, 0.05, lz * 1.4);
  }

  // Bocal do motor
  addBox(rocket, 1.1, 0.5, 1.1, mats.charcoal, 0, 0.9, 0);
  addBox(rocket, 0.7, 0.3, 0.7, mats.darkSlate, 0, 0.55, 0);

  // Estagio de baixo: tanques de metano e oxigenio
  addBox(rocket, 2.2, 3.4, 2.2, mats.whiteMetal, 0, 2.85, 0);
  addBox(rocket, 2.26, 0.35, 2.26, mats.goldFoil, 0, 1.3, 0);
  addBox(rocket, 2.26, 0.25, 2.26, mats.redBtn, 0, 3.4, 0);
  addBox(rocket, 2.26, 0.25, 2.26, mats.charcoal, 0, 4.45, 0);

  // Aletas
  addBox(rocket, 0.12, 1.4, 0.9, mats.lightGray, 1.16, 1.9, 0);
  addBox(rocket, 0.12, 1.4, 0.9, mats.lightGray, -1.16, 1.9, 0);
  addBox(rocket, 0.9, 1.4, 0.12, mats.lightGray, 0, 1.9, 1.16);
  addBox(rocket, 0.9, 1.4, 0.12, mats.lightGray, 0, 1.9, -1.16);

  // Estagio de cima: cabine da tripulacao com janela
  addBox(rocket, 1.8, 2.2, 1.8, mats.whiteMetal, 0, 5.65, 0);
  addBox(rocket, 0.7, 0.5, 0.06, mats.cyanGlow, 0, 6.0, 0.91);
  addBox(rocket, 1.86, 0.2, 1.86, mats.goldFoil, 0, 4.7, 0);

  // Nariz em degraus
  addBox(rocket, 1.4, 0.6, 1.4, mats.whiteMetal, 0, 7.05, 0);
  addBox(rocket, 1.0, 0.5, 1.0, mats.whiteMetal, 0, 7.6, 0);
  addBox(rocket, 0.6, 0.4, 0.6, mats.lightGray, 0, 8.05, 0);
  addBox(rocket, 0.2, 0.5, 0.2, mats.redBtn, 0, 8.5, 0);

  // Fabrica de combustivel (ISRU): caixa com dois tanques e um cano ate o foguete
  const factory = new THREE.Group();
  factory.position.set(x + 4.6, y, z - 1.2);
  addBox(factory, 1.6, 1.3, 1.4, mats.lightGray, 0, 0.65, 0);
  addBox(factory, 1.0, 0.4, 0.06, mats.screenMat, 0, 0.95, 0.72);
  addBox(factory, 0.6, 1.6, 0.6, mats.whiteMetal, -0.5, 0.8, -1.1);
  addBox(factory, 0.6, 1.6, 0.6, mats.nasaBlue, 0.4, 0.8, -1.1);
  // O cano fica na plataforma (sem colisao), para nao virar uma parede invisivel
  addBox(pad, 2.4, 0.14, 0.14, mats.darkSlate, 2.6, 0.12, -1.2);

  return { pad, rocket, factory };
}

function createExerciseBikeModel(mats, x, y, z) {
  const g = new THREE.Group();
  g.position.set(x, y, z);

  // Pés estabilizadores e chassi central (ergômetro espacial CEVIS)
  addBox(g, 0.78, 0.1, 0.2, mats.darkSlate, 0, 0.05, -0.62);
  addBox(g, 0.78, 0.1, 0.2, mats.darkSlate, 0, 0.05, 0.62);
  addBox(g, 0.22, 0.12, 1.36, mats.lightGray, 0, 0.08, 0);

  // Carenagem do volante de inércia magnético (flywheel)
  addBox(g, 0.32, 0.62, 0.62, mats.whiteMetal, 0, 0.42, -0.18);
  addBox(g, 0.36, 0.42, 0.42, mats.nasaBlue, 0, 0.42, -0.18);
  addBox(g, 0.38, 0.18, 0.18, mats.cyanGlow, 0, 0.42, -0.18);

  // Pedivela e pedais com presilhas de pé
  addBox(g, 0.56, 0.08, 0.08, mats.charcoal, 0, 0.38, 0.08);
  addBox(g, 0.08, 0.26, 0.08, mats.lightGray, -0.26, 0.48, 0.14, 0.35, 0, 0);
  addBox(g, 0.18, 0.06, 0.22, mats.charcoal, -0.34, 0.58, 0.2);
  addBox(g, 0.16, 0.04, 0.14, mats.yellowBtn, -0.34, 0.62, 0.2);

  addBox(g, 0.08, 0.26, 0.08, mats.lightGray, 0.26, 0.28, 0.02, -0.35, 0, 0);
  addBox(g, 0.18, 0.06, 0.22, mats.charcoal, 0.34, 0.18, -0.04);
  addBox(g, 0.16, 0.04, 0.14, mats.yellowBtn, 0.34, 0.22, -0.04);

  // Selim ergonômico e encosto lombar
  addBox(g, 0.12, 0.72, 0.12, mats.lightGray, 0, 0.46, 0.42, 0.18, 0, 0);
  addBox(g, 0.38, 0.12, 0.42, mats.nasaBlue, 0, 0.84, 0.46);
  addBox(g, 0.34, 0.32, 0.1, mats.whiteMetal, 0, 1.04, 0.64);

  // Coluna do guidão e monitor cardíaco/cadência
  addBox(g, 0.12, 1.05, 0.12, mats.lightGray, 0, 0.62, -0.48, -0.16, 0, 0);
  addBox(g, 0.68, 0.08, 0.08, mats.charcoal, 0, 1.14, -0.52);
  addBox(g, 0.08, 0.18, 0.24, mats.charcoal, -0.32, 1.2, -0.44);
  addBox(g, 0.08, 0.18, 0.24, mats.charcoal, 0.32, 1.2, -0.44);
  addBox(g, 0.52, 0.34, 0.14, mats.darkSlate, 0, 1.32, -0.56, 0.28, 0, 0);
  addBox(g, 0.42, 0.22, 0.05, mats.screenMat, 0, 1.33, -0.48, 0.28, 0, 0);

  return g;
}

function createGymMedbayModel(mats, x, y, z) {
  const g = new THREE.Group();
  g.position.set(x, y, z);

  // Bancada de avaliação médica / Scanner de Densidade Óssea (DEXA) e Hidratação
  addBox(g, 1.6, 0.88, 0.75, mats.whiteMetal, 0, 0.44, 0);
  addBox(g, 1.68, 0.08, 0.82, mats.lightGray, 0, 0.9, 0);
  // Cruz vermelha médica na frente da bancada
  addBox(g, 0.28, 0.1, 0.04, mats.redBtn, 0, 0.48, -0.39);
  addBox(g, 0.1, 0.28, 0.04, mats.redBtn, 0, 0.48, -0.39);

  // Monitor de Densitometria Óssea
  addBox(g, 0.72, 0.52, 0.12, mats.darkSlate, -0.32, 1.24, 0.12);
  addBox(g, 0.6, 0.4, 0.05, mats.screenMat, -0.32, 1.24, 0.05);

  // Dispenser de água isotônica + Kit médico
  addBox(g, 0.32, 0.45, 0.32, mats.waterGlass, 0.42, 1.16, 0.05);
  addBox(g, 0.36, 0.1, 0.36, mats.cyanGlow, 0.42, 1.42, 0.05);

  return g;
}

// Abrigo de tempestade (issue #56, A1): cabine aberta para oeste no canto sudeste do habitat.
// As paredes guardam tanques de agua; o nivel da agua e desenhado no GameEngine.
// Cada parede e um objeto solido separado para a colisao nao fechar a entrada.
function createStormShelterModel(mats, y) {
  const walls = [];
  const wall = (cx, cz, w, d) => {
    const g = new THREE.Group();
    g.position.set(cx, y, cz);
    addBox(g, w, 2.4, d, mats.whiteMetal, 0, 1.2, 0);
    // Faixas de tanque (aros escuros) para ler como parede de agua
    for (const ty of [0.35, 1.2, 2.05]) addBox(g, w + 0.02, 0.06, d + 0.02, mats.darkSlate, 0, ty, 0);
    walls.push(g);
    return g;
  };
  wall(4.3, 3.775, 3.2, 0.15); // norte
  wall(4.3, 5.875, 3.2, 0.15); // sul
  const east = wall(5.825, 4.825, 0.15, 1.95); // leste, com o painel
  addBox(east, 0.06, 0.62, 0.8, mats.charcoal, -0.24, 1.3, 0);
  addBox(east, 0.03, 0.5, 0.68, mats.cyanGlow, -0.28, 1.3, 0);
  addBox(east, 0.05, 0.1, 0.1, mats.yellowBtn, -0.25, 0.88, -0.2);
  addBox(east, 0.05, 0.1, 0.1, mats.redBtn, -0.25, 0.88, 0.2);
  // Teto e faixa amarela de aviso na entrada
  const roof = new THREE.Group();
  roof.position.set(4.3, y, 4.825);
  addBox(roof, 3.2, 0.14, 2.25, mats.whiteMetal, 0, 2.47, 0);
  addBox(roof, 0.08, 0.18, 2.25, mats.yellowBtn, -1.58, 2.3, 0);
  return { walls, roof };
}

// Terminal de comunicacao e computador da missao (issue #56, A2/A3), na parede norte,
// embaixo da antena parabolica do teto. Tela azul = computador da missao, verde = ciencia e radio.
function createCommsTerminalModel(mats, x, y, z) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  addBox(g, 3.0, 0.12, 0.6, mats.whiteMetal, 0, 0.9, 0);
  addBox(g, 0.2, 0.9, 0.55, mats.lightGray, -1.4, 0.45, 0);
  addBox(g, 0.2, 0.9, 0.55, mats.lightGray, 1.4, 0.45, 0);
  for (const [mx, screen] of [[-0.75, mats.cyanGlow], [0.75, mats.greenGlow]]) {
    addBox(g, 1.1, 0.7, 0.08, mats.charcoal, mx, 1.55, -0.2);
    addBox(g, 1.0, 0.6, 0.04, screen, mx, 1.55, -0.15);
    addBox(g, 0.7, 0.05, 0.22, mats.darkSlate, mx, 0.99, 0.08);
  }
  // Cabo ate a antena do teto
  addBox(g, 0.1, 3.0, 0.1, mats.darkSlate, 1.45, 2.4, -0.22);
  addBox(g, 0.12, 0.12, 0.12, mats.redBtn, 1.45, 1.2, -0.12);
  return g;
}

// Placa com o nome da sala (texto em canvas, sem emoji)
function createRoomSign(key, x, y, z, rotY) {
  const texture = signTexture(SIGNS[key], 4);
  const sign = new THREE.Group();
  sign.position.set(x, y, z);
  sign.rotation.y = rotY;
  const board = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.6), new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide }));
  sign.add(board);
  sign.userData.noCollide = true;
  return sign;
}

// Moveis da ala norte (issue #56). Coordenadas do mundo; cada modulo de NORTH_WING tem ar em
// 11 x 9 blocos: energia x = -21..-10, z = -25..-16; cozinha x = 6..17, z = -25..-16;
// banheiro x = -21..-10, z = -39..-30; oficina x = 6..17, z = -39..-30.
function createNorthModuleModels(mats, y) {
  const objs = [];
  const group = (x, z) => {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    objs.push(g);
    return g;
  };
  const orange = new THREE.MeshLambertMaterial({ color: 0xfb923c, emissive: 0xea580c, emissiveIntensity: 0.5 });
  const rations = [mats.goldFoil, mats.nasaBlue, mats.redBtn, mats.greenGlow];

  // --- B1 Banco de baterias (parede oeste) ---
  for (const bz of [-24.2, -23.0, -21.8, -20.6, -19.4, -18.2]) {
    const bat = group(-20.55, bz);
    addBox(bat, 0.8, 2.0, 1.0, mats.darkSlate, 0, 1.0, 0);
    for (let i = 0; i < 4; i++) addBox(bat, 0.04, 0.28, 0.7, i < 3 ? mats.greenGlow : mats.yellowBtn, 0.42, 0.35 + i * 0.42, 0);
  }
  // Painel de distribuicao de energia (parede sul)
  const dist = group(-15.5, -16.25);
  addBox(dist, 2.0, 1.4, 0.3, mats.lightGray, 0, 1.45, 0);
  addBox(dist, 1.7, 0.9, 0.04, mats.screenMat, 0, 1.55, -0.17);
  for (let i = 0; i < 6; i++) addBox(dist, 0.12, 0.12, 0.06, i % 2 ? mats.greenGlow : mats.redBtn, -0.75 + i * 0.3, 0.9, -0.17);
  addBox(dist, 0.16, 3.0, 0.16, mats.darkSlate, 0.9, 2.5, 0.05); // cabos ate o teto
  // B2 Aquecedor (radiador com resistencias laranja)
  const heater = group(-15.5, -24.7);
  addBox(heater, 1.4, 1.2, 0.5, mats.whiteMetal, 0, 0.6, 0);
  for (let i = 0; i < 5; i++) addBox(heater, 0.08, 0.9, 0.04, orange, -0.5 + i * 0.25, 0.65, 0.27);
  addBox(heater, 0.4, 0.2, 0.06, mats.screenMat, 0.35, 1.1, 0.27);

  // --- B3 Cozinha (bancada na parede sul) e despensa (prateleiras a leste) ---
  const counter = group(11.5, -16.45);
  addBox(counter, 5.0, 0.95, 0.8, mats.whiteMetal, 0, 0.475, 0);
  addBox(counter, 5.1, 0.08, 0.9, mats.lightGray, 0, 0.99, 0);
  addBox(counter, 0.9, 0.6, 0.6, mats.charcoal, -1.4, 1.33, 0.05); // forno de aquecer comida
  addBox(counter, 0.6, 0.35, 0.04, orange, -1.4, 1.33, -0.27);
  addBox(counter, 0.7, 0.12, 0.5, mats.darkSlate, 0.4, 1.06, 0); // pia
  addBox(counter, 0.08, 0.4, 0.08, mats.lightGray, 0.4, 1.3, 0.2);
  addBox(counter, 0.5, 0.4, 0.04, mats.screenMat, 1.6, 1.35, 0.3); // painel da cozinha
  const pantry = group(16.55, -21.0);
  addBox(pantry, 0.8, 2.4, 2.8, mats.lightGray, 0, 1.2, 0);
  for (let row = 0; row < 4; row++) {
    addBox(pantry, 0.82, 0.06, 2.82, mats.whiteMetal, 0, 0.3 + row * 0.55, 0);
    for (let col = 0; col < 5; col++) addBox(pantry, 0.3, 0.32, 0.4, rations[(row + col) % 4], -0.32, 0.5 + row * 0.55, -1.1 + col * 0.55);
  }
  const table = group(11.5, -20.5);
  addBox(table, 1.6, 0.08, 1.0, mats.whiteMetal, 0, 0.78, 0);
  addBox(table, 0.12, 0.74, 0.12, mats.lightGray, 0, 0.37, 0);
  for (const sx of [-1.05, 1.05]) {
    const stool = group(11.5 + sx, -20.5);
    addBox(stool, 0.45, 0.08, 0.45, mats.nasaBlue, 0, 0.5, 0);
    addBox(stool, 0.1, 0.46, 0.1, mats.lightGray, 0, 0.23, 0);
  }

  // --- B4 Banheiro: processador de agua, pia e cabine ---
  const processor = group(-20.4, -32.5);
  addBox(processor, 1.0, 2.4, 1.6, mats.whiteMetal, 0, 1.2, 0);
  addBox(processor, 0.06, 1.3, 0.7, mats.waterGlass, 0.52, 1.25, -0.35);
  addBox(processor, 0.06, 0.7, 0.4, mats.screenMat, 0.52, 1.6, 0.45);
  addBox(processor, 0.06, 0.12, 0.12, mats.greenGlow, 0.52, 1.1, 0.45);
  const sink = group(-16.0, -38.65);
  addBox(sink, 1.2, 0.9, 0.6, mats.whiteMetal, 0, 0.45, 0);
  addBox(sink, 0.8, 0.12, 0.45, mats.darkSlate, 0, 0.95, 0.02);
  addBox(sink, 1.0, 0.8, 0.04, mats.lightGray, 0, 1.75, -0.28); // espelho
  addBox(sink, 0.08, 0.3, 0.08, mats.lightGray, 0, 1.15, -0.18);
  const stall = group(-11.05, -37.9);
  addBox(stall, 0.08, 2.3, 2.0, mats.lightGray, -0.9, 1.15, 0);
  addBox(stall, 1.8, 2.3, 0.08, mats.lightGray, 0, 1.15, -1.0);
  addBox(stall, 0.6, 0.45, 0.6, mats.whiteMetal, 0, 0.23, -0.6); // vaso com coleta de urina
  addBox(stall, 0.4, 0.06, 0.4, mats.nasaBlue, 0, 0.48, -0.6);

  // --- B5 Oficina: bancada, impressora 3D e prateleira de pecas ---
  const bench = group(11.5, -38.55);
  addBox(bench, 4.0, 0.92, 0.8, mats.lightGray, 0, 0.46, 0);
  addBox(bench, 4.1, 0.08, 0.9, mats.darkSlate, 0, 0.96, 0);
  addBox(bench, 1.0, 1.0, 0.8, mats.whiteMetal, 0, 1.5, 0); // impressora 3D
  addBox(bench, 0.8, 0.7, 0.04, mats.waterGlass, 0, 1.5, 0.41);
  addBox(bench, 0.12, 0.12, 0.12, mats.cyanGlow, 0, 1.75, 0.1);
  addBox(bench, 0.35, 0.18, 0.35, mats.potato, 0, 1.12, 0.1); // peca de regolito sendo impressa
  addBox(bench, 0.5, 0.3, 0.04, mats.screenMat, 0.8, 1.25, 0.42);
  for (const tx of [-1.4, -0.9]) addBox(bench, 0.12, 0.3, 0.12, mats.darkSlate, tx, 1.15, 0.1);
  const shelf = group(16.6, -33.0);
  addBox(shelf, 0.7, 2.2, 2.4, mats.darkSlate, 0, 1.1, 0);
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) addBox(shelf, 0.3, 0.25, 0.3, mats.potato, -0.25, 0.5 + row * 0.6, -0.7 + col * 0.7);
  }

  // Placas das salas na parede do corredor central, em cima da porta de cada modulo
  objs.push(createRoomSign('powerRoom', -3.97, 13.45 - 10 + y, -21.5, Math.PI / 2));
  objs.push(createRoomSign('kitchen', -0.03, 13.45 - 10 + y, -21.5, -Math.PI / 2));
  objs.push(createRoomSign('bathroom', -3.97, 13.45 - 10 + y, -35.5, Math.PI / 2));
  objs.push(createRoomSign('workshop', -0.03, 13.45 - 10 + y, -35.5, -Math.PI / 2));
  return objs;
}
