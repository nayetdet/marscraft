import * as THREE from 'three';
import { RADIATION_CONFIG, WORLD_CONFIG } from '../config/constants.js';
import { mergeByMaterial } from '../world/nasaModelsBuilder.js';
import { STORM_SHELTER_ZONE } from './baseZones.js';
import { SIGNS, ZONE_COLORS, buildPosters } from './basePosters.js';
import {
  ScreenCanvas, hazardTexture, labelTexture, posterTexture, shelterFloorTexture, signTexture,
} from './baseCanvas.js';
import {
  batteryLights, commandModel, formatRate, greenhouseModel, powerModel, shelterModel,
} from './baseDisplayText.js';

// Organizacao visual da base: zonas no piso, placas de modulo, divisorias, abrigo de
// tempestade, enfermaria, cozinha, banco de baterias, posteres educativos e telas vivas.
// Geometria do habitat (habitatLayout.js): ar em x = -6..7, z = -5..6; piso em y = 10, teto em y = 14.
// Tudo estatico vira uma malha por material (mergeByMaterial); so luzes da bateria, nivel do
// tanque e telas ficam soltos, porque mudam com o estado do jogo.

const POSTER_ASPECT = 0.8; // largura / altura
const POSTER_W = 1.4;
const POSTER_H = POSTER_W / POSTER_ASPECT;
const SIGN_H = 0.44;

// Para onde a face do plano aponta -> rotacao em Y
const FACING = { '+z': 0, '-z': Math.PI, '+x': Math.PI / 2, '-x': -Math.PI / 2 };

export function buildBaseDecor(scene, colliders, { donkiDate }) {
  const F = WORLD_CONFIG.GROUND_LEVEL + 2; // topo do piso da base (y = 10)
  const group = new THREE.Group();
  const posters = buildPosters(donkiDate);
  const infoPoints = [];

  const lambert = (color, extra = {}) => new THREE.MeshLambertMaterial({ color, ...extra });
  const glow = (color, intensity = 0.5) => lambert(color, { emissive: color, emissiveIntensity: intensity });
  const mats = {
    white: lambert(0xf8fafc),
    gray: lambert(0xcbd5e1),
    slate: lambert(0x334155),
    charcoal: lambert(0x1e293b),
    blue: lambert(0x0284c7),
    red: lambert(0xdc2626),
    orange: lambert(0xf97316),
    silver: lambert(0x94a3b8),
    waterBag: lambert(0x2563eb),
    sandBag: lambert(0xb08968),
    water: lambert(0x38bdf8, { emissive: 0x0ea5e9, emissiveIntensity: 0.25 }),
    glass: lambert(0xbae6fd, { transparent: true, opacity: 0.35 }),
    shelterGlow: glow(0xf472b6, 0.6),
    cyanGlow: glow(0x38bdf8, 0.45),
  };
  const zoneMats = Object.fromEntries(
    Object.entries(ZONE_COLORS).map(([zone, color]) => [zone, glow(new THREE.Color(color).getHex(), 0.35)])
  );

  const box = (w, h, d, mat, x, y, z) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y, z);
    group.add(mesh);
    return mesh;
  };
  // Caixa de colisao do jogador (mesmo formato de nasaModelsBuilder)
  const solid = (minX, maxX, minZ, maxZ, height) => {
    colliders.push({ minX, maxX, minY: F, maxY: F + Math.max(height, 1.5), minZ, maxZ });
  };
  const plane = (texture, w, h, x, y, z, facing, parent = group) => {
    const material = new THREE.MeshBasicMaterial({ map: texture });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
    mesh.position.set(x, y, z);
    mesh.rotation.y = FACING[facing];
    parent.add(mesh);
    return mesh;
  };
  const sign = (key, w, x, y, z, facing) => plane(signTexture(SIGNS[key], w / SIGN_H), w, SIGN_H, x, y, z, facing);
  const poster = (key, x, y, z, facing, scale = 1) => {
    const w = POSTER_W * scale;
    const h = POSTER_H * scale;
    plane(posterTexture(posters[key], POSTER_ASPECT), w, h, x, y, z, facing);
    const info = posters[key];
    infoPoints.push({ x, y, z, label: '[F] Read the poster', text: () => `${info.fact} (Source: ${info.source})` });
  };

  // ---------- Zonas no piso: moldura colorida por area ----------
  const zoneBorder = (mat, x1, x2, z1, z2) => {
    const t = 0.1;
    const y = F + 0.001;
    box(x2 - x1, 0.04, t, mat, (x1 + x2) / 2, y, z1 + t / 2);
    box(x2 - x1, 0.04, t, mat, (x1 + x2) / 2, y, z2 - t / 2);
    box(t, 0.04, z2 - z1, mat, x1 + t / 2, y, (z1 + z2) / 2);
    box(t, 0.04, z2 - z1, mat, x2 - t / 2, y, (z1 + z2) / 2);
  };
  zoneBorder(zoneMats.command, -2.4, 2.9, -4.9, -1.5);
  zoneBorder(zoneMats.lifeSupport, 3.3, 6.9, -3.1, 3.9);
  zoneBorder(zoneMats.quarters, -5.9, -2.75, -3.95, -1.0);
  zoneBorder(zoneMats.medical, -3.85, -1.05, 2.25, 5.9);
  zoneBorder(zoneMats.galley, 2.9, 5.6, 4.2, 5.9);

  // Linhas-guia a partir do airlock: branca ate o comando, verde ate a estufa, amarela ate o suporte de vida
  const guideY = F - 0.003;
  box(0.09, 0.04, 7.0, mats.white, 0.5, guideY, 2.1);
  box(12.5, 0.04, 0.09, zoneMats.greenhouse, -5.75, guideY, 0.5);
  box(2.8, 0.04, 0.09, zoneMats.lifeSupport, 1.9, guideY, 0.5);

  // Soleira do airlock com faixa de aviso
  const sill = plane(hazardTexture(10), 3.0, 0.3, 0.5, F + 0.026, 5.82, '+z');
  sill.rotation.set(-Math.PI / 2, 0, 0);

  // ---------- Placas de modulo (acima das janelas, y = 13..14) ----------
  sign('command', 2.6, 0, 13.66, -4.97, '+z');
  sign('lifeSupport', 2.6, 6.97, 13.68, 0.5, '-x');
  sign('quarters', 2.4, -5.97, 13.6, -2.5, '+x');
  sign('greenhouse', 2.4, -5.97, 13.45, 0.5, '+x');
  sign('airlock', 2.4, 0.5, 13.5, 5.97, '-z');
  sign('airlock', 2.4, 0.5, 13.4, 9.03, '+z'); // do lado de fora, sobre a porta externa
  sign('medical', 2.0, -2.6, 13.55, 5.97, '-z');
  sign('galley', 2.0, 4.2, 13.55, 5.97, '-z');
  // Placa pendurada na entrada do corredor da academia (duas faces)
  box(2.0, 0.5, 0.08, mats.charcoal, -5.0, 13.5, 5.0);
  sign('gym', 1.9, -5.0, 13.5, 4.955, '-z');
  sign('mainHab', 1.9, -5.0, 13.5, 5.045, '+z');
  sign('gym', 2.4, -8.0, 13.5, 8.03, '+z');

  // ---------- Divisorias: comando | dormitorio e comando | suporte de vida ----------
  const partition = (x, z1, z2, capMat) => {
    const len = z2 - z1;
    box(0.16, 2.3, len, mats.gray, x, F + 1.15, (z1 + z2) / 2);
    box(0.2, 0.08, len, capMat, x, F + 2.34, (z1 + z2) / 2);
    solid(x - 0.14, x + 0.14, z1, z2 + 0.06, 2.3);
  };
  partition(-2.55, -4.98, -2.4, zoneMats.quarters);
  partition(3.05, -4.98, -3.3, zoneMats.lifeSupport);
  const posterY = F + 1.22;
  poster('storm', -2.46, posterY, -3.7, '+x');
  poster('mars', -2.64, posterY, -3.7, '-x');
  poster('delay', 2.96, posterY, -4.14, '-x');
  poster('air', 3.14, posterY, -4.14, '+x');

  // ---------- Abrigo de tempestade (SHL-1): teto de bolsas de agua e sacos de regolito ----------
  const S = STORM_SHELTER_ZONE;
  const sx = (S.minX + S.maxX) / 2;
  const sz = (S.minZ + S.maxZ) / 2 + 0.075;
  const roofW = S.maxX - S.minX + 0.2;
  const roofD = S.maxZ - S.minZ + 0.35;
  const roofY = F + 2.5;
  box(roofW, 0.1, roofD, mats.slate, sx, roofY + 0.05, sz);
  for (const dx of [-0.55, 0.55]) {
    for (const dz of [-0.95, 0, 0.95]) {
      box(1.0, 0.28, 0.86, mats.waterBag, sx + dx, roofY + 0.24, sz + dz);
    }
  }
  for (const dx of [-0.7, 0, 0.7]) {
    for (const dz of [-1.05, -0.35, 0.35, 1.05]) {
      box(0.62, 0.2, 0.6, mats.sandBag, sx + dx, roofY + 0.48, sz + dz);
    }
  }
  // Tirantes ate o teto do habitat (sem colunas no chao: a tripulacao passa por baixo)
  for (const dx of [-1, 1]) {
    for (const dz of [-1, 1]) {
      box(0.08, 4 - 2.58, 0.08, mats.silver, sx + dx * (roofW / 2 - 0.1), F + 3.29, sz + dz * (roofD / 2 - 0.1));
    }
  }
  box(roofW, 0.05, 0.07, mats.shelterGlow, sx, roofY - 0.03, sz - roofD / 2 + 0.05);
  box(roofW, 0.05, 0.07, mats.shelterGlow, sx, roofY - 0.03, sz + roofD / 2 - 0.05);
  // Placas nas bordas leste e oeste (o caminho hub <-> estufa passa por baixo)
  box(0.06, 0.5, 2.3, mats.charcoal, S.maxX + 0.13, F + 2.24, sz);
  sign('shelter', 2.2, S.maxX + 0.165, F + 2.24, sz, '+x');
  box(0.06, 0.5, 2.3, mats.charcoal, S.minX - 0.13, F + 2.24, sz);
  sign('shelter', 2.2, S.minX - 0.165, F + 2.24, sz, '-x');
  // Parede sul de bolsas de agua, com o medidor de radiacao por dentro e o poster por fora
  const wallX1 = S.minX;
  const wallX2 = S.maxX - 0.3;
  const wallZ = S.maxZ + 0.1;
  const wallCx = (wallX1 + wallX2) / 2;
  box(wallX2 - wallX1, 2.5, 0.24, mats.slate, wallCx, F + 1.25, wallZ);
  solid(wallX1 - 0.06, wallX2 + 0.06, wallZ - 0.18, wallZ + 0.18, 2.5);
  for (let col = 0; col < 4; col++) {
    for (let row = 0; row < 2; row++) {
      box(0.36, 0.44, 0.08, mats.waterBag, wallX1 + 0.26 + col * 0.4, F + 0.3 + row * 0.5, wallZ - 0.15);
    }
  }
  poster('shelter', wallCx, posterY, wallZ + 0.132, '+z');
  const shelterDecal = new THREE.Mesh(
    new THREE.PlaneGeometry(S.maxZ - S.minZ, S.maxX - S.minX),
    new THREE.MeshBasicMaterial({ map: shelterFloorTexture((S.maxZ - S.minZ) / (S.maxX - S.minX)), transparent: true, depthWrite: false })
  );
  // Deitado no piso, com o topo do texto virado para oeste (lido por quem vem do hub)
  shelterDecal.rotation.set(-Math.PI / 2, 0, Math.PI / 2);
  shelterDecal.position.set(sx, F + 0.03, (S.minZ + S.maxZ) / 2);
  group.add(shelterDecal);

  // ---------- Suporte de vida (LSS-1): banco de baterias na parede leste ----------
  box(0.68, 1.5, 1.6, mats.slate, 6.64, F + 0.75, 0.5);
  box(0.72, 0.08, 1.66, mats.gray, 6.64, F + 1.54, 0.5);
  solid(6.24, 7.0, -0.36, 1.36, 1.5);
  plane(labelTexture('BATTERY BANK', 6), 1.2, 0.2, 6.29, F + 1.34, 0.5, '-x');
  plane(labelTexture('1 LIGHT = 10%', 6, '#facc15'), 1.2, 0.2, 6.29, F + 0.5, 0.5, '-x');

  // ---------- Enfermaria (MED-1), canto sudoeste do habitat ----------
  box(1.35, 1.0, 0.56, mats.white, -2.82, F + 0.5, 5.68);
  box(1.41, 0.06, 0.6, mats.gray, -2.82, F + 1.03, 5.68);
  box(0.5, 0.14, 0.04, mats.red, -2.82, F + 0.55, 5.385);
  box(0.14, 0.5, 0.04, mats.red, -2.82, F + 0.55, 5.385);
  solid(-3.56, -2.08, 5.34, 6.0, 1.0);
  // Maca
  box(0.7, 0.1, 1.9, mats.gray, -3.4, F + 0.42, 3.45);
  box(0.66, 0.12, 1.86, mats.white, -3.4, F + 0.53, 3.45);
  box(0.66, 0.06, 1.0, mats.blue, -3.4, F + 0.61, 3.85);
  box(0.5, 0.1, 0.34, mats.white, -3.4, F + 0.64, 2.75);
  for (const dx of [-0.29, 0.29]) {
    for (const dz of [-0.85, 0.85]) box(0.08, 0.4, 0.08, mats.silver, -3.4 + dx, F + 0.2, 3.45 + dz);
  }
  solid(-3.8, -3.0, 2.46, 4.44, 0.6);
  // Suporte de soro
  box(0.05, 1.7, 0.05, mats.silver, -2.92, F + 0.85, 2.6);
  box(0.3, 0.04, 0.04, mats.silver, -2.92, F + 1.7, 2.6);
  box(0.14, 0.24, 0.06, mats.cyanGlow, -3.02, F + 1.55, 2.6);
  // Armario dos trajes ao lado do airlock
  box(0.75, 2.0, 0.5, mats.white, -1.57, F + 1.0, 5.71);
  box(0.77, 0.12, 0.04, mats.orange, -1.57, F + 1.5, 5.445);
  box(0.3, 0.3, 0.04, mats.charcoal, -1.57, F + 1.1, 5.445);
  box(0.06, 0.5, 0.04, mats.silver, -1.3, F + 0.9, 5.445);
  solid(-2.0, -1.14, 5.4, 6.0, 2.0);
  poster('eva', 2.5, F + 1.75, 5.97, '-z', 0.64);

  // ---------- Cozinha (GAL-1), parede sul ----------
  box(2.2, 0.9, 0.56, mats.white, 4.1, F + 0.45, 5.68);
  box(2.26, 0.06, 0.6, mats.gray, 4.1, F + 0.93, 5.68);
  solid(2.94, 5.26, 5.34, 6.0, 0.9);
  box(0.5, 0.34, 0.4, mats.charcoal, 3.4, F + 1.13, 5.7); // reidratador de comida
  box(0.3, 0.2, 0.04, mats.cyanGlow, 3.4, F + 1.13, 5.49);
  const pouchMats = [mats.orange, mats.silver, mats.red, mats.silver];
  pouchMats.forEach((mat, i) => box(0.2, 0.26, 0.08, mat, 4.15 + i * 0.26, F + 1.09, 5.72));
  for (const x of [3.6, 4.6]) {
    box(0.36, 0.06, 0.36, mats.blue, x, F + 0.5, 4.75);
    box(0.08, 0.47, 0.08, mats.silver, x, F + 0.235, 4.75);
    solid(x - 0.2, x + 0.2, 4.55, 4.95, 0.5);
  }

  // ---------- Estufa (GRN-1): tanque de agua, tela e poster ----------
  // Tanque com nivel que acompanha a agua da base, na ponta norte do corredor
  box(1.0, 0.2, 1.0, mats.slate, -17.5, F + 0.1, -5.2);
  box(0.84, 1.5, 0.84, mats.glass, -17.5, F + 0.95, -5.2);
  box(0.92, 0.1, 0.92, mats.gray, -17.5, F + 1.75, -5.2);
  solid(-18.02, -16.98, -5.72, -4.68, 1.8);
  plane(labelTexture('BASE WATER', 5, '#60a5fa'), 0.9, 0.18, -17.5, F + 1.75, -4.735, '+z');
  // Poster num cavalete na ponta oeste
  box(0.08, POSTER_H + 0.14, POSTER_W + 0.14, mats.charcoal, -23.0, posterY, 0.5);
  for (const dz of [-0.6, 0.6]) box(0.1, 0.35, 0.1, mats.silver, -23.0, F + 0.17, 0.5 + dz);
  solid(-23.12, -22.88, -0.3, 1.3, 2.2);
  poster('plants', -22.95, posterY, 0.5, '+x');
  // Totem da tela na ponta sul
  box(0.14, 1.0, 0.14, mats.silver, -17.5, F + 0.5, 5.3);
  box(1.42, 1.0, 0.08, mats.charcoal, -17.5, F + 1.5, 5.3);
  solid(-18.2, -16.8, 5.2, 5.4, 2.0);

  // ---------- Academia (GYM-1) ----------
  poster('exercise', -7.5, posterY, 8.03, '+z');

  // Molduras das telas vivas
  box(3.32, 1.32, 0.06, mats.charcoal, 0, 12.72, -4.965);
  box(0.06, 1.56, 2.3, mats.charcoal, 6.965, 12.45, 0.5);
  box(1.3, 0.86, 0.06, mats.charcoal, wallCx, F + 1.78, wallZ - 0.13);

  scene.add(mergeByMaterial(group));

  // ---------- Partes que mudam com o estado do jogo ----------
  const dynamic = new THREE.Group();
  scene.add(dynamic);

  const screens = {
    command: new ScreenCanvas(768, 288),
    power: new ScreenCanvas(480, 320),
    shelter: new ScreenCanvas(384, 250),
    greenhouse: new ScreenCanvas(416, 288),
  };
  plane(screens.command.texture, 3.2, 1.2, 0, 12.72, -4.93, '+z', dynamic);
  plane(screens.power.texture, 2.2, 1.467, 6.93, 12.45, 0.5, '-x', dynamic);
  plane(screens.shelter.texture, 1.2, 0.78, wallCx, F + 1.78, wallZ - 0.165, '-z', dynamic);
  plane(screens.greenhouse.texture, 1.3, 0.9, -17.5, F + 1.5, 5.255, '-z', dynamic);

  // As 10 luzes da bateria sao uma unica malha instanciada: so a cor de cada uma muda
  const lightColors = { on: new THREE.Color(0x4ade80), low: new THREE.Color(0xef4444), off: new THREE.Color(0x0f172a) };
  const lights = new THREE.InstancedMesh(new THREE.BoxGeometry(0.04, 0.5, 0.1), new THREE.MeshBasicMaterial(), 10);
  const lightMatrix = new THREE.Matrix4();
  for (let i = 0; i < 10; i++) {
    lights.setMatrixAt(i, lightMatrix.makeTranslation(6.29, F + 0.92, -0.13 + i * 0.14));
    lights.setColorAt(i, lightColors.off);
  }
  dynamic.add(lights);

  const tankGeo = new THREE.BoxGeometry(0.72, 1, 0.72);
  tankGeo.translate(0, 0.5, 0);
  const tankLevel = new THREE.Mesh(tankGeo, mats.water);
  tankLevel.position.set(-17.5, F + 0.22, -5.2);
  dynamic.add(tankLevel);

  // ---------- Pontos de informacao: olhar e apertar F ----------
  infoPoints.push(
    {
      x: 6.3, y: F + 1.2, z: 0.5, label: '[F] Check the battery bank',
      text: (s) => `Battery at ${Math.round(s.batteryPct)}%. ${s.chargeRate > 0
        ? 'The Sun is charging it right now.'
        : 'It is night, so the solar panels make nothing. Save power!'} Oxygen, the shield and the fuel plant all drink from it.`,
    },
    {
      x: wallCx, y: F + 1.78, z: wallZ - 0.17, label: '[F] Check the radiation meter',
      text: (s) => `You are getting ${formatRate(s.doseRate)}. Above ${RADIATION_CONFIG.HARM_THRESHOLD_MSV_PER_HOUR} mSv/h it hurts. `
        + 'In a solar storm, stand under the water bags: it costs no power, but you cannot work from here.',
    },
    {
      x: -17.5, y: F + 1.0, z: -4.8, label: '[F] Check the water tank',
      text: (s) => `${Math.round(s.water)} L of water in the base tank. Crew, plants and you all share it. Bring ice with the rover to refill it.`,
    },
    {
      x: 4.1, y: F + 1.0, z: 5.5, label: '[F] Look at the galley',
      text: (s) => (s.freshFood
        ? 'Fresh food from the greenhouse keeps you working at full speed.'
        : 'No fresh food left, so you work slower. Plant and harvest a crop in the greenhouse!'),
    },
    {
      x: -2.82, y: F + 0.7, z: 5.4, label: '[F] Look at the medical bay',
      text: () => 'A crew member on duty at the medical bay heals you while you are inside the base. A radiation dose can never be erased, so avoid it.',
    },
    {
      x: -1.57, y: F + 1.2, z: 5.45, label: '[F] Look at the suit locker',
      text: () => 'Mars dust sticks to spacesuits. The airlock cleans your suit with electricity before you come in. With no power, the dust comes inside with you!',
    }
  );

  const displays = {
    lit: -1,
    low: null,
    level: -1,
    // Chamado duas vezes por segundo pelo GameEngine, nunca a cada frame
    update(s) {
      screens.command.draw(commandModel(s));
      screens.power.draw(powerModel(s));
      screens.shelter.draw(shelterModel(s));
      screens.greenhouse.draw(greenhouseModel(s));

      const lit = batteryLights(s.batteryPct);
      const low = s.batteryPct <= 20;
      if (lit !== this.lit || low !== this.low) {
        this.lit = lit;
        this.low = low;
        for (let i = 0; i < 10; i++) {
          lights.setColorAt(i, i < lit ? (low ? lightColors.low : lightColors.on) : lightColors.off);
        }
        lights.instanceColor.needsUpdate = true;
      }

      const level = s.maxWater > 0 ? Math.max(0, Math.min(1, s.water / s.maxWater)) : 0;
      if (Math.abs(level - this.level) > 0.004) {
        this.level = level;
        tankLevel.scale.y = Math.max(0.02, level * 1.42);
      }
    },
  };

  return { displays, infoPoints };
}
