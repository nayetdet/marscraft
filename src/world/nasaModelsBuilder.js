import * as THREE from 'three';
import { WORLD_CONFIG } from '../config/constants.js';
import { makeCanvasTexture } from '../graphics/textureGenerator.js';

export function buildNasaCustomModels(scene) {
  const group = new THREE.Group();
  const floorTopY = WORLD_CONFIG.GROUND_LEVEL + 2; // y = 10 (topo do piso da base)
  const groundTopY = WORLD_CONFIG.GROUND_LEVEL + 1; // y = 9 (topo da areia marciana)

  // Materiais foscos (MeshLambertMaterial) compartilhados para máxima otimização
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

  // Textura de tela de telemetria NASA para os monitores 3D
  const { texture: screenTex } = makeCanvasTexture((ctx) => {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 32, 16);
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(1, 1, 14, 14);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(3, 4, 8, 2);
    ctx.fillRect(3, 8, 10, 2);
    ctx.fillRect(3, 12, 6, 1);
    // Radar verde à direita
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

  // 1. Painel de Controle Principal NASA (Estilo Mod do Minecraft com 3 Monitores Inclinados, Teclado, Alavancas e Cadeiras)
  group.add(createControlConsoleModel(mats, 0, floorTopY, -3.6));

  // 2. Gerador de Oxigênio MOXIE e Tanques Pressurizados (Parede Leste)
  group.add(createOxygenStationModel(mats, 4.6, floorTopY, -1.5));

  // 3. Bancada de Purificação de Água e Microscópio (Parede Sudeste)
  group.add(createLabTableModel(mats, 4.4, floorTopY, 2.4));

  // 4. Beliches da Tripulação e Armários de Trajes EVA (Parede Noroeste)
  group.add(createCrewQuartersModel(mats, -4.4, floorTopY, -2.5));

  // 5. Plantações 3D e Lâmpadas de Cultivo dentro da Redoma de Estufa (x = -18, z = 0)
  group.add(createGreenhouseCropsModel(mats, -18, floorTopY, 0));

  // 6. Rover Marciano NASA 3D detalhado (Estacionado na frente da base)
  group.add(createMarsRoverModel(mats, 7.5, groundTopY, 10.5));

  // 7. Painéis Solares Inclinados 3D e Antena Parabólica Externa
  group.add(createExteriorSolarAndDish(mats, 0, groundTopY, 0));

  scene.add(group);
  return group;
}

function addBox(parent, w, h, d, mat, x, y, z, rx = 0, ry = 0, rz = 0) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z);
  if (rx || ry || rz) mesh.rotation.set(rx, ry, rz);
  parent.add(mesh);
  return mesh;
}

function createControlConsoleModel(mats, x, y, z) {
  const consoleGroup = new THREE.Group();
  consoleGroup.position.set(x, y, z);

  // Pernas laterais e bancada branca curva/larga (3.4 blocos de largura)
  addBox(consoleGroup, 0.25, 0.9, 1.0, mats.lightGray, -1.55, 0.45, 0);
  addBox(consoleGroup, 0.25, 0.9, 1.0, mats.lightGray, 1.55, 0.45, 0);
  addBox(consoleGroup, 3.4, 0.14, 1.15, mats.whiteMetal, 0, 0.92, 0);

  // Painel inclinado de botões e alavancas
  addBox(consoleGroup, 3.2, 0.28, 0.65, mats.darkSlate, 0, 1.06, 0.15, 0.28, 0, 0);

  // Fileira de botões 3D em relevo (vermelho, amarelo, verde, azul) + Alavanca de empuxo
  const btnColors = [mats.redBtn, mats.yellowBtn, mats.greenGlow, mats.cyanGlow];
  for (let i = 0; i < 8; i++) {
    const bx = -1.2 + i * 0.34;
    addBox(consoleGroup, 0.14, 0.08, 0.14, btnColors[i % 4], bx, 1.22, 0.24, 0.28, 0, 0);
  }
  // Teclado central
  addBox(consoleGroup, 0.85, 0.05, 0.28, mats.lightGray, 0, 1.02, 0.42);
  // Alavanca / Joystick 3D à direita
  addBox(consoleGroup, 0.06, 0.26, 0.06, mats.lightGray, 1.15, 1.25, 0.32, -0.2, 0, 0);
  addBox(consoleGroup, 0.14, 0.08, 0.1, mats.redBtn, 1.15, 1.38, 0.29);

  // 3 Monitores Widescreen 3D (Central + 2 Laterais angulados para o centro)
  // Monitor Central
  addBox(consoleGroup, 0.14, 0.45, 0.14, mats.charcoal, 0, 1.2, -0.25);
  addBox(consoleGroup, 1.25, 0.72, 0.1, mats.charcoal, 0, 1.58, -0.22);
  addBox(consoleGroup, 1.15, 0.62, 0.04, mats.screenMat, 0, 1.58, -0.16);

  // Monitor Esquerdo (inclinado)
  const leftMon = new THREE.Group();
  leftMon.position.set(-1.22, 1.58, -0.06);
  leftMon.rotation.y = 0.32;
  addBox(leftMon, 1.05, 0.68, 0.1, mats.charcoal, 0, 0, 0);
  addBox(leftMon, 0.95, 0.58, 0.04, mats.screenMat, 0, 0, 0.04);
  consoleGroup.add(leftMon);

  // Monitor Direito (inclinado)
  const rightMon = new THREE.Group();
  rightMon.position.set(1.22, 1.58, -0.06);
  rightMon.rotation.y = -0.32;
  addBox(rightMon, 1.05, 0.68, 0.1, mats.charcoal, 0, 0, 0);
  addBox(rightMon, 0.95, 0.58, 0.04, mats.screenMat, 0, 0, 0.04);
  consoleGroup.add(rightMon);

  // 2 Cadeiras Giratórias de Comando da NASA na frente da bancada
  for (const cx of [-0.75, 0.75]) {
    const chair = new THREE.Group();
    chair.position.set(cx, 0, 1.25);
    addBox(chair, 0.45, 0.08, 0.45, mats.darkSlate, 0, 0.04, 0); // Base
    addBox(chair, 0.1, 0.42, 0.1, mats.lightGray, 0, 0.25, 0); // Pistão
    addBox(chair, 0.56, 0.1, 0.56, mats.nasaBlue, 0, 0.48, 0); // Assento
    addBox(chair, 0.54, 0.72, 0.1, mats.nasaBlue, 0, 0.88, 0.24); // Encosto
    addBox(chair, 0.36, 0.2, 0.12, mats.whiteMetal, 0, 1.3, 0.24); // Apoio de cabeça NASA
    consoleGroup.add(chair);
  }

  return consoleGroup;
}

function createOxygenStationModel(mats, x, y, z) {
  const g = new THREE.Group();
  g.position.set(x, y, z);

  // Base metálica
  addBox(g, 1.1, 0.16, 2.2, mats.darkSlate, 0, 0.08, 0);

  // 2 Cilindros Verticais de Oxigênio Pressurizado (O2)
  for (const tz of [-0.55, 0.55]) {
    addBox(g, 0.68, 1.85, 0.68, mats.whiteMetal, 0.1, 1.05, tz);
    addBox(g, 0.72, 0.28, 0.72, mats.cyanGlow, 0.1, 1.35, tz); // Faixa azul de O2
    addBox(g, 0.35, 0.25, 0.35, mats.lightGray, 0.1, 2.08, tz); // Válvula superior
  }

  // Tubulação superior e console central de pressão
  addBox(g, 0.2, 0.18, 1.4, mats.lightGray, 0.1, 2.22, 0);
  addBox(g, 0.4, 1.2, 0.55, mats.charcoal, -0.22, 0.75, 0);
  addBox(g, 0.08, 0.42, 0.42, mats.greenGlow, -0.42, 0.95, 0);

  return g;
}

function createLabTableModel(mats, x, y, z) {
  const g = new THREE.Group();
  g.position.set(x, y, z);

  // Mesa de laboratório branca
  addBox(g, 1.1, 0.88, 2.0, mats.whiteMetal, 0, 0.44, 0);
  addBox(g, 1.2, 0.1, 2.1, mats.lightGray, 0, 0.92, 0);

  // Coluna transparente de Purificação de Água Marciana
  addBox(g, 0.5, 0.12, 0.5, mats.darkSlate, 0, 1.02, -0.45);
  addBox(g, 0.42, 0.85, 0.42, mats.waterGlass, 0, 1.5, -0.45);
  addBox(g, 0.5, 0.14, 0.5, mats.whiteMetal, 0, 1.98, -0.45);

  // Microscópio 3D + Amostras de solo marciano
  addBox(g, 0.32, 0.08, 0.32, mats.charcoal, 0, 1.0, 0.45);
  addBox(g, 0.1, 0.38, 0.1, mats.whiteMetal, 0.08, 1.2, 0.45);
  addBox(g, 0.12, 0.26, 0.12, mats.darkSlate, -0.02, 1.35, 0.45, 0, 0, 0.4);

  return g;
}

function createCrewQuartersModel(mats, x, y, z) {
  const g = new THREE.Group();
  g.position.set(x, y, z);

  // Estrutura de Beliche Duplo dos Astronautas
  addBox(g, 1.25, 0.14, 2.2, mats.whiteMetal, 0, 0.45, 0); // Cama inferior
  addBox(g, 1.15, 0.14, 1.95, mats.nasaBlue, 0, 0.56, 0.08); // Colchão azul
  addBox(g, 0.9, 0.12, 0.42, mats.whiteMetal, 0, 0.66, -0.72); // Travesseiro

  addBox(g, 1.25, 0.14, 2.2, mats.whiteMetal, 0, 1.55, 0); // Cama superior
  addBox(g, 1.15, 0.14, 1.95, mats.nasaBlue, 0, 1.66, 0.08);
  addBox(g, 0.9, 0.12, 0.42, mats.whiteMetal, 0, 1.76, -0.72);

  // 4 Colunas do beliche
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

// 5. Plantas 3D em Estilo Mod do Minecraft dentro da Redoma de Estufa
function createGreenhouseCropsModel(mats, centerX, floorTopY, centerZ) {
  const g = new THREE.Group();
  g.position.set(centerX, floorTopY, centerZ);

  // Cria pés de Batata Marciana e Hortaliças em 3D sobre os canteiros da estufa
  for (let dx = -4; dx <= 4; dx++) {
    for (let dz = -4; dz <= 4; dz++) {
      const isWalkway = Math.abs(dz) <= 1 || Math.abs(dx) <= 1;
      const dist = Math.hypot(dx, dz);
      if (isWalkway || dist > 5.2) continue;

      if (Math.abs(dz) >= 2 && Math.abs(dz) <= 4) {
        const plant = new THREE.Group();
        plant.position.set(dx + 0.5, 0, dz + 0.5);

        // Caule central 3D + Folhagem cruzada + Batatas na base
        addBox(plant, 0.14, 0.48, 0.14, mats.plantStem, 0, 0.24, 0);
        addBox(plant, 0.52, 0.22, 0.22, mats.plantLeaf, 0, 0.36, 0);
        addBox(plant, 0.22, 0.22, 0.52, mats.plantLeaf, 0, 0.42, 0);
        addBox(plant, 0.18, 0.14, 0.18, mats.potato, 0.16, 0.07, 0.14);
        addBox(plant, 0.16, 0.12, 0.16, mats.potato, -0.15, 0.06, -0.12);

        g.add(plant);
      }
    }
  }

  // Barras de iluminação LED agrícola suspensas sobre os canteiros
  addBox(g, 7.5, 0.12, 0.24, mats.cyanGlow, 0, 3.2, -3.0);
  addBox(g, 7.5, 0.12, 0.24, mats.cyanGlow, 0, 3.2, 3.0);

  return g;
}

// 6. Rover Marciano NASA 3D (6 rodas, suspensão bogie, braço robótico e Mastcam)
function createMarsRoverModel(mats, x, y, z) {
  const r = new THREE.Group();
  r.position.set(x, y, z);

  // 6 Rodas 3D com eixo
  for (const wx of [-1.2, 1.2]) {
    for (const wz of [-1.35, 0, 1.35]) {
      addBox(r, 0.38, 0.65, 0.65, mats.charcoal, wx, 0.32, wz);
      addBox(r, 0.42, 0.22, 0.22, mats.lightGray, wx, 0.32, wz);
      // Braço da suspensão
      addBox(r, 0.12, 0.55, 0.12, mats.lightGray, wx * 0.82, 0.62, wz);
    }
  }

  // Chassi branco e dourado da NASA
  addBox(r, 2.0, 0.65, 2.8, mats.whiteMetal, 0, 0.95, 0);
  addBox(r, 2.06, 0.28, 2.86, mats.goldFoil, 0, 0.82, 0);
  addBox(r, 1.7, 0.08, 2.2, mats.solarBlue, 0, 1.3, 0.1);

  // Mastro da Câmera (Mastcam) na frente
  addBox(r, 0.18, 1.15, 0.18, mats.whiteMetal, 0.45, 1.8, -1.05);
  addBox(r, 0.62, 0.32, 0.36, mats.whiteMetal, 0.45, 2.42, -1.05);
  addBox(r, 0.16, 0.16, 0.08, mats.cyanGlow, 0.3, 2.42, -1.24);
  addBox(r, 0.16, 0.16, 0.08, mats.cyanGlow, 0.6, 2.42, -1.24);

  // Braço robótico frontal de coleta de rochas
  addBox(r, 0.16, 0.16, 1.1, mats.lightGray, -0.45, 0.85, -1.75, 0.25, 0, 0);
  addBox(r, 0.28, 0.28, 0.32, mats.darkSlate, -0.45, 0.68, -2.28);

  return r;
}

// 7. Painéis Solares Inclinados 3D e Antena Parabólica da Base
function createExteriorSolarAndDish(mats, x, y, z) {
  const g = new THREE.Group();
  g.position.set(x, y, z);

  // Fileira de Painéis Solares Inclinados atrás da Base (Norte: z = -10.5)
  for (const sx of [-9, -4.5, 0, 4.5, 9]) {
    const array = new THREE.Group();
    array.position.set(sx, 0, -10.5);
    addBox(array, 0.25, 1.4, 0.25, mats.lightGray, 0, 0.7, 0);
    // Placa solar inclinada para o Sol
    addBox(array, 3.4, 0.1, 2.2, mats.whiteMetal, 0, 1.45, 0, 0.38, 0, 0);
    addBox(array, 3.2, 0.12, 2.0, mats.solarBlue, 0, 1.47, 0, 0.38, 0, 0);
    g.add(array);
  }

  // Antena Parabólica de Espaço Profundo no topo da Base (y = 10, apontada para a Terra!)
  const dish = new THREE.Group();
  dish.position.set(5.2, 6.0, -3.5);
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

  g.add(dish);
  return g;
}
