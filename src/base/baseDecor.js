import * as THREE from 'three';
import { WORLD_CONFIG } from '../config/constants.js';
import { mergeByMaterial } from '../world/nasaModelsBuilder.js';
import { HABITAT_LAYOUT } from '../world/habitatLayout.js';
import { SIGNS, ZONE_COLORS } from './basePosters.js';
import { addBaseFurniture } from './baseFurniture.js';
import {
  hazardTexture, labelTexture, signTexture,
} from './baseCanvas.js';

// Organizacao visual da base: zonas no piso, placas de modulo, enfermaria, armario de trajes,
// telas vivas. O abrigo de tempestade, o terminal de radio e o modulo
// norte (energia, cozinha, banheiro, oficina) sao da issue #56 e ficam em nasaModelsBuilder.js;
// aqui eles so ganham placa e medidor.
// Geometria do habitat (habitatLayout.js): ar em x = -6..13, z = -11..6; piso em y = 10, teto em y = 14.
// Tudo estatico vira uma malha por material (mergeByMaterial); so luzes da bateria, nivel do
// tanque e telas ficam soltos, porque mudam com o estado do jogo.

const SIGN_H = 0.44;

// Para onde a face do plano aponta -> rotacao em Y
const FACING = { '+z': 0, '-z': Math.PI, '+x': Math.PI / 2, '-x': -Math.PI / 2 };

export function buildBaseDecor(scene, colliders) {
  const F = WORLD_CONFIG.GROUND_LEVEL + 2; // topo do piso da base (y = 10)
  const group = new THREE.Group();
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
    water: lambert(0x38bdf8, { emissive: 0x0ea5e9, emissiveIntensity: 0.25 }),
    glass: lambert(0xbae6fd, { transparent: true, opacity: 0.35 }),
    cyanGlow: glow(0x38bdf8, 0.45),
    green: lambert(0x22c55e),
    brown: lambert(0x92644a),
    yellow: lambert(0xfacc15),
    pinkGlow: glow(0xe879f9, 0.7),
    greenGlow: glow(0x4ade80, 0.6),
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

  // ---------- Zonas no piso: moldura colorida por area ----------
  const zoneBorder = (mat, x1, x2, z1, z2) => {
    const t = 0.1;
    const y = F + 0.001;
    box(x2 - x1, 0.04, t, mat, (x1 + x2) / 2, y, z1 + t / 2);
    box(x2 - x1, 0.04, t, mat, (x1 + x2) / 2, y, z2 - t / 2);
    box(t, 0.04, z2 - z1, mat, x1 + t / 2, y, (z1 + z2) / 2);
    box(t, 0.04, z2 - z1, mat, x2 - t / 2, y, (z1 + z2) / 2);
  };
  zoneBorder(zoneMats.command, 2.1, 5.9, -10.9, -7.4);
  zoneBorder(zoneMats.lifeSupport, 8.8, 12.9, -4.6, 3.0);
  zoneBorder(zoneMats.quarters, -5.95, -4.05, -9.6, -4.2);
  zoneBorder(zoneMats.medical, -3.85, -1.05, 2.25, 5.9);

  // Linhas-guia a partir do airlock: branca ate o comando, verde ate a estufa, amarela ate o suporte de vida
  const guideY = F - 0.003;
  box(0.09, 0.04, 13.6, mats.white, 0.5, guideY, -1.2);
  box(3.5, 0.04, 0.09, mats.white, 2.25, guideY, -8.0);
  box(14.5, 0.04, 0.09, zoneMats.greenhouse, -6.75, guideY, 0.5);
  box(8.3, 0.04, 0.09, zoneMats.lifeSupport, 4.65, guideY, 0.5);

  // Soleira do airlock com faixa de aviso
  const sill = plane(hazardTexture(10), 3.0, 0.3, 0.5, F + 0.026, 5.82, '+z');
  sill.rotation.set(-Math.PI / 2, 0, 0);

  // ---------- Placas de modulo (acima das janelas, y = 13..14) ----------
  sign('command', 2.4, 6.6, 13.5, -10.97, '+z');
  sign('lifeSupport', 2.6, 12.97, 13.68, -0.5, '-x');
  sign('common', 2.4, -5.97, 13.6, -7.5, '+x');
  sign('quarters', 2.4, 12.97, 13.5, -7.0, '-x'); // em cima da porta do dormitorio
  sign('greenhouse', 2.4, -5.97, 13.45, 0.5, '+x');
  sign('airlock', 2.4, 0.5, 13.5, 5.97, '-z');
  sign('airlock', 2.4, 0.5, 13.4, 9.03, '+z'); // do lado de fora, sobre a porta externa
  sign('medical', 2.0, -2.6, 13.55, 5.97, '-z');
  // Placa pendurada na entrada do corredor da academia (duas faces)
  box(2.0, 0.5, 0.08, mats.charcoal, -5.0, 13.5, 5.0);
  sign('gym', 1.9, -5.0, 13.5, 4.955, '-z');
  sign('mainHab', 1.9, -5.0, 13.5, 5.045, '+z');
  sign('gym', 2.4, -8.0, 13.5, 8.03, '+z');



  // ---------- Abrigo de tempestade (SHL-1, issue #56): placa na entrada e medidor ----------
  const L = HABITAT_LAYOUT;
  const shelterZ = (L.SHELTER_Z_MIN + L.SHELTER_Z_MAX) / 2;
  box(0.06, 0.5, 2.1, mats.charcoal, L.SHELTER_X_MIN - 0.2, F + 2.82, shelterZ);
  sign('shelter', 2.0, L.SHELTER_X_MIN - 0.235, F + 2.82, shelterZ, '-x');


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
  // Suitport 3D station in the airlock is built by SuitportStation.js.

  // ---------- Estufa (GRN-1): tudo na praca central da redoma ----------
  const gx = HABITAT_LAYOUT.DOME_X + 0.5; // centro da redoma
  const gz = HABITAT_LAYOUT.DOME_Z + 0.5;
  // Tanque no centro, com nivel que acompanha a agua da base
  box(1.0, 0.2, 1.0, mats.slate, gx, F + 0.1, gz);
  box(0.84, 1.5, 0.84, mats.glass, gx, F + 0.95, gz);
  box(0.92, 0.1, 0.92, mats.slate, gx, F + 1.75, gz);
  for (const dx of [-0.4, 0.4]) {
    for (const dz of [-0.4, 0.4]) box(0.07, 1.5, 0.07, mats.slate, gx + dx, F + 0.95, gz + dz);
  }
  solid(gx - 0.52, gx + 0.52, gz - 0.52, gz + 0.52, 1.8);
  plane(labelTexture('BASE WATER', 5, '#60a5fa'), 0.9, 0.18, gx + 0.505, F + 0.1, gz, '+x');
  // Mobilia extra de cada secao
  addBaseFurniture({ box, solid, mats, zoneMats, F });

  scene.add(mergeByMaterial(group));

  // ---------- Partes que mudam com o estado do jogo ----------
  const dynamic = new THREE.Group();
  scene.add(dynamic);

  const tankGeo = new THREE.BoxGeometry(0.72, 1, 0.72);
  tankGeo.translate(0, 0.5, 0);
  const tankLevel = new THREE.Mesh(tankGeo, mats.water);
  tankLevel.position.set(gx, F + 0.22, gz);
  dynamic.add(tankLevel);

  // Agua dentro do purificador na bancada; a base da geometria fica fixa ao variar o nivel.
  const purifierGeo = new THREE.BoxGeometry(0.38, 1, 0.38);
  purifierGeo.translate(0, 0.5, 0);
  const purifierWater = new THREE.Mesh(purifierGeo, mats.water);
  purifierWater.position.set(10.4, F + 1.075, 1.05);
  purifierWater.visible = false;
  dynamic.add(purifierWater);

  // ---------- Pontos de informacao: olhar e apertar F ----------
  infoPoints.push(
    {
      x: gx + 0.45, y: F + 1.0, z: gz, label: '[F] Check the water tank',
      text: (s) => `${Math.round(s.water)} L of water in the base tank. Crew, plants and you all share it. Bring ice with the rover to refill it.`,
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
    level: -1,
    // Chamado duas vezes por segundo pelo GameEngine, nunca a cada frame
    update(s) {
      const level = s.maxWater > 0 ? Math.max(0, Math.min(1, s.water / s.maxWater)) : 0;
      if (level !== this.level) {
        this.level = level;
        tankLevel.scale.y = Math.max(0.02, level * 1.42);
        purifierWater.visible = level > 0;
        purifierWater.scale.y = level * 0.85;
      }
    },
  };

  return { displays, infoPoints };
}
