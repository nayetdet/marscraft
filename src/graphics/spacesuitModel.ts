// @ts-nocheck
import * as THREE from 'three';
import { DEFAULT_CADET_PROFILE } from '../crew/crewProfiles.ts';

export function createClearVisorTexture() {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 16;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 32, 16);

  // Translucent sky-tinted glass so the crew member's face stays clear behind the visor
  ctx.fillStyle = 'rgba(186, 230, 253, 0.14)';
  ctx.fillRect(0, 0, 32, 16);

  // Subtle inner rim reflection
  ctx.strokeStyle = 'rgba(224, 242, 254, 0.34)';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, 30, 14);

  // Crisp pixel-art diagonal glass glare in corners
  ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
  ctx.fillRect(3, 2, 6, 2);
  ctx.fillRect(2, 4, 3, 1);
  ctx.fillStyle = 'rgba(224, 242, 254, 0.42)';
  ctx.fillRect(23, 11, 6, 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  return texture;
}

export function createVisorTexture() {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 16;
  const ctx = canvas.getContext('2d');

  // Gradiente metalico dourado do visor reflexivo da NASA
  const grad = ctx.createLinearGradient(0, 0, 32, 16);
  grad.addColorStop(0, '#92400e');
  grad.addColorStop(0.35, '#d97706');
  grad.addColorStop(0.7, '#f59e0b');
  grad.addColorStop(1, '#b45309');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 32, 16);

  // Moldura escura ao redor da viseira
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, 30, 14);

  // Brilho especular diagonal no visor
  ctx.fillStyle = 'rgba(254, 243, 199, 0.75)';
  ctx.fillRect(5, 3, 7, 2);
  ctx.fillRect(4, 5, 4, 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.fillRect(21, 10, 6, 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  return texture;
}

export function createChestDcmTexture() {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');

  // Carcaca cinza tecnica do modulo peitoral DCM
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(0, 0, 32, 32);
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, 30, 30);

  // Visor digital de telemetria no topo
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(4, 4, 24, 10);
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(6, 6, 12, 2);
  ctx.fillRect(6, 10, 18, 2);

  // Conectores de O2 (azul) e refrigeracao (vermelho) + botoes
  ctx.fillStyle = '#0284c7';
  ctx.fillRect(5, 18, 7, 7);
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(20, 18, 7, 7);
  ctx.fillStyle = '#334155';
  ctx.fillRect(14, 18, 4, 10);

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  return texture;
}

export function createSuitportScreenTexture() {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 48;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#0b1622';
  ctx.fillRect(0, 0, 48, 64);
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2;
  ctx.strokeRect(2, 2, 44, 60);

  // Header bar
  ctx.fillStyle = '#0284c7';
  ctx.fillRect(4, 4, 40, 8);
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(7, 7, 18, 2);

  // Pixel astronaut silhouette
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(18, 16, 12, 11); // helmet
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(20, 19, 8, 5);   // gold visor
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(15, 28, 18, 13); // torso
  ctx.fillStyle = '#ea580c';
  ctx.fillRect(15, 31, 18, 3);  // chest stripe
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(16, 41, 6, 9);   // left leg
  ctx.fillRect(26, 41, 6, 9);   // right leg

  // Status bars (O2 & HEAT)
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(6, 53, 36, 3);
  ctx.fillRect(6, 58, 36, 3);
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(6, 53, 30, 3);
  ctx.fillStyle = '#4ade80';
  ctx.fillRect(6, 58, 34, 3);

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  return texture;
}

const HELMET_HAIR_STYLES = {
  puffs: [
    { dims: [0.275, 0.036, 0.245], pos: [0, 0.332, 0.005], hi: false },
    { dims: [0.11, 0.042, 0.06], pos: [-0.085, 0.320, 0.115], hi: true },
    { dims: [0.11, 0.042, 0.06], pos: [0.085, 0.320, 0.115], hi: false },
  ],
  tousled: [
    { dims: [0.275, 0.036, 0.245], pos: [0, 0.332, 0.005], hi: false },
    { dims: [0.15, 0.032, 0.045], pos: [-0.035, 0.315, 0.125], rz: 0.10, hi: false },
    { dims: [0.09, 0.030, 0.05], pos: [0.065, 0.326, 0.11], rz: -0.12, hi: true },
  ],
  wavy: [
    { dims: [0.275, 0.036, 0.245], pos: [0, 0.332, 0.005], hi: false },
    { dims: [0.17, 0.032, 0.042], pos: [-0.045, 0.312, 0.124], rz: 0.12, hi: false },
    { dims: [0.08, 0.030, 0.04], pos: [0.09, 0.316, 0.122], rz: -0.14, hi: true },
  ],
  fade: [
    { dims: [0.268, 0.028, 0.242], pos: [0, 0.334, 0.006], hi: false },
    { dims: [0.24, 0.018, 0.022], pos: [0, 0.326, 0.124], hi: false },
    { dims: [0.18, 0.016, 0.020], pos: [0, 0.340, 0.09], hi: true },
  ],
  bob: [
    { dims: [0.276, 0.036, 0.245], pos: [0, 0.332, 0.005], hi: false },
    { dims: [0.12, 0.032, 0.04], pos: [-0.07, 0.312, 0.124], rz: 0.08, hi: false },
    { dims: [0.12, 0.032, 0.04], pos: [0.07, 0.312, 0.124], rz: -0.08, hi: true },
  ],
  parted: [
    { dims: [0.275, 0.034, 0.245], pos: [0, 0.332, 0.005], hi: false },
    { dims: [0.11, 0.034, 0.042], pos: [-0.075, 0.312, 0.124], rz: 0.16, hi: false },
    { dims: [0.11, 0.034, 0.042], pos: [0.075, 0.312, 0.124], rz: -0.16, hi: true },
  ],
  bangs: [
    { dims: [0.276, 0.036, 0.245], pos: [0, 0.332, 0.005], hi: false },
    { dims: [0.22, 0.030, 0.04], pos: [-0.01, 0.312, 0.124], hi: false },
    { dims: [0.12, 0.024, 0.04], pos: [0.04, 0.332, 0.105], hi: true },
  ],
  sweep: [
    { dims: [0.275, 0.036, 0.245], pos: [0, 0.332, 0.005], hi: false },
    { dims: [0.15, 0.034, 0.046], pos: [0.035, 0.318, 0.122], rz: -0.10, hi: false },
    { dims: [0.10, 0.030, 0.042], pos: [-0.07, 0.316, 0.120], rz: 0.14, hi: true },
  ],
  swept: [
    { dims: [0.275, 0.036, 0.245], pos: [0, 0.332, 0.005], hi: false },
    { dims: [0.17, 0.034, 0.042], pos: [-0.045, 0.314, 0.124], rz: 0.12, hi: false },
    { dims: [0.09, 0.030, 0.042], pos: [0.088, 0.318, 0.122], rz: -0.14, hi: true },
  ],
  straight_short: [
    { dims: [0.274, 0.032, 0.242], pos: [0, 0.330, 0.005], hi: false },
    { dims: [0.22, 0.024, 0.036], pos: [0, 0.315, 0.123], hi: false },
    { dims: [0.14, 0.016, 0.034], pos: [0.02, 0.328, 0.118], hi: true },
  ],
  straight_medium: [
    { dims: [0.276, 0.034, 0.245], pos: [0, 0.331, 0.005], hi: false },
    { dims: [0.21, 0.026, 0.038], pos: [-0.01, 0.314, 0.124], hi: false },
    { dims: [0.028, 0.145, 0.064], pos: [-0.133, 0.245, 0.065], hi: false },
    { dims: [0.028, 0.145, 0.064], pos: [0.133, 0.245, 0.065], hi: true },
  ],
  straight_long: [
    { dims: [0.276, 0.034, 0.245], pos: [0, 0.331, 0.005], hi: false },
    { dims: [0.21, 0.026, 0.038], pos: [-0.01, 0.314, 0.124], hi: false },
    { dims: [0.030, 0.225, 0.072], pos: [-0.133, 0.205, 0.062], hi: false },
    { dims: [0.030, 0.225, 0.072], pos: [0.133, 0.205, 0.062], hi: true },
  ],
  wavy_short: [
    { dims: [0.276, 0.038, 0.245], pos: [0, 0.333, 0.005], hi: false },
    { dims: [0.155, 0.036, 0.048], pos: [-0.045, 0.315, 0.124], rz: 0.20, hi: false },
    { dims: [0.095, 0.030, 0.046], pos: [0.080, 0.323, 0.120], rz: -0.18, hi: true },
  ],
  wavy_medium: [
    { dims: [0.278, 0.038, 0.246], pos: [0, 0.333, 0.005], hi: false },
    { dims: [0.16, 0.036, 0.048], pos: [-0.045, 0.315, 0.124], rz: 0.18, hi: false },
    { dims: [0.09, 0.028, 0.046], pos: [0.082, 0.322, 0.120], rz: -0.16, hi: true },
    { dims: [0.032, 0.08, 0.062], pos: [-0.132, 0.275, 0.062], rz: 0.12, hi: false },
    { dims: [0.032, 0.08, 0.062], pos: [0.132, 0.275, 0.062], rz: -0.12, hi: false },
    { dims: [0.036, 0.08, 0.066], pos: [-0.138, 0.205, 0.066], rz: -0.15, hi: true },
    { dims: [0.036, 0.08, 0.066], pos: [0.138, 0.205, 0.066], rz: 0.15, hi: true },
  ],
  wavy_long: [
    { dims: [0.278, 0.038, 0.246], pos: [0, 0.333, 0.005], hi: false },
    { dims: [0.16, 0.036, 0.048], pos: [-0.045, 0.315, 0.124], rz: 0.18, hi: false },
    { dims: [0.09, 0.028, 0.046], pos: [0.082, 0.322, 0.120], rz: -0.16, hi: true },
    { dims: [0.032, 0.09, 0.064], pos: [-0.132, 0.272, 0.062], rz: 0.14, hi: false },
    { dims: [0.032, 0.09, 0.064], pos: [0.132, 0.272, 0.062], rz: -0.14, hi: false },
    { dims: [0.038, 0.11, 0.070], pos: [-0.139, 0.185, 0.066], rz: -0.16, hi: true },
    { dims: [0.038, 0.11, 0.070], pos: [0.139, 0.185, 0.066], rz: 0.16, hi: true },
  ],
  curly_short: [
    { dims: [0.278, 0.042, 0.246], pos: [0, 0.334, 0.005], hi: false },
    { dims: [0.075, 0.040, 0.052], pos: [-0.092, 0.319, 0.118], hi: false },
    { dims: [0.075, 0.042, 0.054], pos: [0.0, 0.325, 0.122], hi: true },
    { dims: [0.075, 0.040, 0.052], pos: [0.092, 0.319, 0.118], hi: false },
  ],
  curly_medium: [
    { dims: [0.28, 0.044, 0.248], pos: [0, 0.334, 0.005], hi: false },
    { dims: [0.078, 0.042, 0.054], pos: [-0.09, 0.318, 0.118], hi: false },
    { dims: [0.078, 0.044, 0.056], pos: [0.0, 0.324, 0.122], hi: true },
    { dims: [0.078, 0.042, 0.054], pos: [0.09, 0.318, 0.118], hi: false },
    { dims: [0.046, 0.062, 0.068], pos: [-0.132, 0.268, 0.06], hi: true },
    { dims: [0.046, 0.062, 0.068], pos: [0.132, 0.268, 0.06], hi: true },
    { dims: [0.050, 0.065, 0.070], pos: [-0.138, 0.208, 0.058], hi: false },
    { dims: [0.050, 0.065, 0.070], pos: [0.138, 0.208, 0.058], hi: false },
  ],
  curly_long: [
    { dims: [0.28, 0.044, 0.248], pos: [0, 0.334, 0.005], hi: false },
    { dims: [0.078, 0.042, 0.054], pos: [-0.09, 0.318, 0.118], hi: false },
    { dims: [0.078, 0.044, 0.056], pos: [0.0, 0.324, 0.122], hi: true },
    { dims: [0.078, 0.042, 0.054], pos: [0.09, 0.318, 0.118], hi: false },
    { dims: [0.048, 0.064, 0.070], pos: [-0.132, 0.270, 0.06], hi: true },
    { dims: [0.048, 0.064, 0.070], pos: [0.132, 0.270, 0.06], hi: true },
    { dims: [0.052, 0.068, 0.072], pos: [-0.140, 0.205, 0.058], hi: false },
    { dims: [0.052, 0.068, 0.072], pos: [0.140, 0.205, 0.058], hi: false },
    { dims: [0.048, 0.064, 0.070], pos: [-0.134, 0.145, 0.058], hi: true },
    { dims: [0.048, 0.064, 0.070], pos: [0.134, 0.145, 0.058], hi: true },
  ],
  coily_short: [
    { dims: [0.26, 0.055, 0.236], pos: [0, 0.340, 0.002], hi: false },
    { dims: [0.21, 0.025, 0.20], pos: [0, 0.362, 0.002], hi: true },
  ],
  coily_medium: [
    { dims: [0.305, 0.056, 0.272], pos: [0, 0.340, 0.004], hi: false },
    { dims: [0.24, 0.028, 0.22], pos: [0, 0.364, 0.004], hi: true },
    { dims: [0.064, 0.145, 0.115], pos: [-0.138, 0.245, 0.025], hi: false },
    { dims: [0.064, 0.145, 0.115], pos: [0.138, 0.245, 0.025], hi: true },
  ],
  coily_long: [
    { dims: [0.312, 0.058, 0.276], pos: [0, 0.342, 0.004], hi: false },
    { dims: [0.245, 0.030, 0.225], pos: [0, 0.366, 0.004], hi: true },
    { dims: [0.072, 0.215, 0.13], pos: [-0.140, 0.21, 0.02], hi: false },
    { dims: [0.072, 0.215, 0.13], pos: [0.140, 0.21, 0.02], hi: true },
  ],
};

/**
 * Safely detaches a spacesuit or IVA rig group and disposes its geometries, materials, and textures.
 */
export function disposeSpacesuitRig(group) {
  if (!group) return;
  group.removeFromParent?.();
  const materials = new Set();
  group.traverse?.((obj) => {
    obj.geometry?.dispose?.();
    const mats = Array.isArray(obj.material) ? obj.material : obj.material ? [obj.material] : [];
    for (const mat of mats) materials.add(mat);
  });
  for (const mat of materials) {
    mat.map?.dispose?.();
    mat.dispose?.();
  }
}

/**
 * Builds an articulated voxel NASA xEMU spacesuit rig shared by crew avatars and the Suitport dock.
 * When `crewProfile` is passed, renders an open-window helmet with a translucent glass visor
 * and a diverse MarsCraft pixel-art face inside.
 */
export function buildSpacesuitRig({
  accentColor = 0xea580c,
  suitColor = 0xf8fafc,
  includeUpgradeTrim = false,
  instanced = false,
  crewProfile = null,
} = {}) {
  const bodyGroup = new THREE.Group();

  const suitMat = new THREE.MeshLambertMaterial({ color: suitColor });
  const accentMat = new THREE.MeshLambertMaterial({ color: accentColor });
  const darkJoint = new THREE.MeshLambertMaterial({ color: 0x334155 });
  const bootMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });
  const silver = new THREE.MeshLambertMaterial({ color: 0xcbd5e1 });
  const lampMat = new THREE.MeshLambertMaterial({
    color: 0x7dd3fc,
    emissive: 0x0284c7,
    emissiveIntensity: 0.55,
  });
  const statusLightMat = new THREE.MeshLambertMaterial({
    color: 0x4ade80,
    emissive: 0x16a34a,
    emissiveIntensity: 0.65,
  });
  const visorMat = crewProfile
    ? new THREE.MeshLambertMaterial({
        map: createClearVisorTexture(),
        color: 0xffffff,
        transparent: true,
        opacity: typeof document === 'undefined' ? 0.28 : 1,
        depthWrite: false,
        emissive: 0x1e3a5f,
        emissiveIntensity: 0.15,
      })
    : new THREE.MeshLambertMaterial({
        map: createVisorTexture(),
        emissive: 0x451a03,
        emissiveIntensity: 0.35,
      });
  const dcmMat = new THREE.MeshLambertMaterial({
    map: createChestDcmTexture(),
  });

  const skinShadeMat = crewProfile ? new THREE.MeshLambertMaterial({ color: crewProfile.skinShade }) : null;
  const hairMat = crewProfile ? new THREE.MeshLambertMaterial({ color: crewProfile.hair }) : null;
  const hairHiMat = crewProfile ? new THREE.MeshLambertMaterial({ color: crewProfile.hairHi }) : null;

  // instanced: caixas de cor lisa e lampadas nao viram Mesh, e sim nos vazios (a escala guarda o
  // tamanho da caixa) listados em `parts`, para o CrewInstances desenhar a tripulacao inteira em
  // dois desenhos. Pecas com textura ou com cor por traje (visor, rosto, painel do peito, luz de estado,
  // placas de upgrade) continuam Mesh.
  const instancedMats = instanced
    ? new Set([suitMat, accentMat, darkJoint, bootMat, silver, lampMat, skinShadeMat, hairMat, hairHiMat].filter(Boolean))
    : null;
  const parts = [];
  const addPart = (parent, w, h, d, mat, x, y, z, rx = 0, ry = 0, rz = 0) => {
    let part;
    if (instancedMats?.has(mat)) {
      part = new THREE.Object3D();
      part.scale.set(w, h, d);
      parts.push({ node: part, material: mat, lamp: mat === lampMat });
    } else {
      part = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    }
    part.position.set(x, y, z);
    if (rx || ry || rz) part.rotation.set(rx, ry, rz);
    parent.add(part);
    return part;
  };

  // Pernas articuladas no quadril (y = 0.72) e no joelho (y = -0.32 relativo ao quadril)
  const createLeg = (x) => {
    const hip = new THREE.Group();
    hip.position.set(x, 0.72, 0);
    addPart(hip, 0.21, 0.3, 0.22, suitMat, 0, -0.15, 0);
    addPart(hip, 0.225, 0.04, 0.235, accentMat, 0, -0.27, 0);

    const knee = new THREE.Group();
    knee.position.set(0, -0.32, 0);
    hip.add(knee);

    addPart(knee, 0.22, 0.07, 0.23, darkJoint, 0, -0.01, 0.005);
    addPart(knee, 0.2, 0.22, 0.21, suitMat, 0, -0.15, 0);
    addPart(knee, 0.21, 0.09, 0.27, silver, 0, -0.30, 0.025);
    addPart(knee, 0.22, 0.06, 0.29, bootMat, 0, -0.37, 0.03);

    bodyGroup.add(hip);
    return { hip, knee };
  };

  const leftLeg = createLeg(-0.13);
  const rightLeg = createLeg(0.13);

  // Tronco superior articulado na cintura (y = 0.72)
  const upperBody = new THREE.Group();
  upperBody.position.set(0, 0.72, 0);
  bodyGroup.add(upperBody);

  addPart(upperBody, 0.5, 0.09, 0.3, darkJoint, 0, 0.045, 0);
  addPart(upperBody, 0.14, 0.07, 0.32, silver, 0, 0.045, 0);
  addPart(upperBody, 0.52, 0.52, 0.3, suitMat, 0, 0.34, 0);
  addPart(upperBody, 0.58, 0.1, 0.32, suitMat, 0, 0.55, 0);
  addPart(upperBody, 0.54, 0.08, 0.315, accentMat, 0, 0.44, 0);
  addPart(upperBody, 0.12, 0.5, 0.31, accentMat, -0.18, 0.34, 0);
  addPart(upperBody, 0.12, 0.5, 0.31, accentMat, 0.18, 0.34, 0);
  addPart(upperBody, 0.34, 0.05, 0.34, darkJoint, 0, 0.62, 0);

  // Modulo Peitoral de Controle e Display (DCM) na frente (+Z)
  addPart(upperBody, 0.28, 0.25, 0.08, dcmMat, 0, 0.34, 0.18);
  addPart(upperBody, 0.06, 0.06, 0.03, statusLightMat, 0, 0.43, 0.225);

  // Mochila de Suporte de Vida (PLSS) nas costas (-Z)
  addPart(upperBody, 0.44, 0.54, 0.18, suitMat, 0, 0.35, -0.23);
  addPart(upperBody, 0.4, 0.1, 0.2, accentMat, 0, 0.56, -0.23);
  addPart(upperBody, 0.14, 0.42, 0.08, silver, -0.11, 0.33, -0.32);
  addPart(upperBody, 0.14, 0.42, 0.08, silver, 0.11, 0.33, -0.32);
  addPart(upperBody, 0.42, 0.1, 0.2, darkJoint, 0, 0.12, -0.23);
  addPart(upperBody, 0.08, 0.05, 0.06, statusLightMat, 0, 0.63, -0.23);

  // Bracos articulados no ombro e no cotovelo (y = -0.23 relativo ao ombro)
  const createArm = (x, isLeft) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(x, 0.54, 0);
    addPart(shoulder, 0.17, 0.22, 0.19, suitMat, 0, -0.1, 0);
    addPart(shoulder, 0.18, 0.06, 0.2, accentMat, 0, -0.12, 0);

    const elbow = new THREE.Group();
    elbow.position.set(0, -0.23, 0);
    shoulder.add(elbow);

    addPart(elbow, 0.16, 0.06, 0.18, darkJoint, 0, -0.01, 0);
    addPart(elbow, 0.16, 0.19, 0.18, suitMat, 0, -0.13, 0);
    if (isLeft) {
      addPart(elbow, 0.04, 0.09, 0.1, lampMat, -0.085, -0.14, 0.02);
    }
    addPart(elbow, 0.165, 0.04, 0.185, darkJoint, 0, -0.24, 0);
    addPart(elbow, 0.16, 0.13, 0.19, silver, 0, -0.32, 0.01);
    addPart(elbow, 0.05, 0.07, 0.07, bootMat, isLeft ? 0.07 : -0.07, -0.31, 0.06);

    upperBody.add(shoulder);
    return { shoulder, elbow };
  };

  const leftArm = createArm(-0.35, true);
  const rightArm = createArm(0.35, false);

  // Capacete articulado no pescoco (y = 0.64 relativo a cintura)
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.64, 0);
  upperBody.add(headGroup);

  if (crewProfile) {
    // Casco aberto na frente com janela para o rosto + vidrinho transparente na frente
    addPart(headGroup, 0.44, 0.42, 0.1, suitMat, 0, 0.21, -0.17);
    addPart(headGroup, 0.06, 0.42, 0.34, suitMat, -0.19, 0.21, 0.05);
    addPart(headGroup, 0.06, 0.42, 0.34, suitMat, 0.19, 0.21, 0.05);
    addPart(headGroup, 0.32, 0.07, 0.34, suitMat, 0, 0.385, 0.05);
    addPart(headGroup, 0.32, 0.08, 0.34, suitMat, 0, 0.04, 0.05);
    // Moldura escura ao redor da janela do visor
    addPart(headGroup, 0.34, 0.024, 0.025, darkJoint, 0, 0.345, 0.215);
    addPart(headGroup, 0.34, 0.024, 0.025, darkJoint, 0, 0.085, 0.215);
    addPart(headGroup, 0.024, 0.284, 0.025, darkJoint, -0.162, 0.215, 0.215);
    addPart(headGroup, 0.024, 0.284, 0.025, darkJoint, 0.162, 0.215, 0.215);

    // Rosto no mesmo padrao voxel/pixel-art do personagem (cabeca + nariz 3D + cabelo em camadas)
    addPart(headGroup, 0.26, 0.26, 0.24, createCadetHeadMaterials(crewProfile), 0, 0.215, 0.01);
    addPart(headGroup, 0.034, 0.042, 0.024, skinShadeMat, 0, 0.195, 0.14);
    const hairPieces = HELMET_HAIR_STYLES[crewProfile.hairStyle] ?? HELMET_HAIR_STYLES.swept;
    for (const piece of hairPieces) {
      addPart(
        headGroup,
        piece.dims[0], piece.dims[1], piece.dims[2],
        piece.hi ? hairHiMat : hairMat,
        piece.pos[0], piece.pos[1], piece.pos[2],
        0, 0, piece.rz ?? 0
      );
    }

    // Vidrinho transparente na abertura do capacete
    addPart(headGroup, 0.31, 0.24, 0.016, visorMat, 0, 0.215, 0.214);
  } else {
    addPart(headGroup, 0.44, 0.42, 0.44, suitMat, 0, 0.21, 0);
    addPart(headGroup, 0.38, 0.25, 0.05, bootMat, 0, 0.22, 0.21);
    addPart(headGroup, 0.35, 0.22, 0.06, visorMat, 0, 0.22, 0.22);
  }
  addPart(headGroup, 0.46, 0.07, 0.46, suitMat, 0, 0.4, 0.01);
  addPart(headGroup, 0.14, 0.05, 0.38, accentMat, 0, 0.435, 0);
  for (const sx of [-0.23, 0.23]) {
    addPart(headGroup, 0.05, 0.16, 0.16, darkJoint, sx, 0.21, 0);
    addPart(headGroup, 0.05, 0.07, 0.1, lampMat, sx, 0.28, 0.12);
  }
  addPart(headGroup, 0.03, 0.18, 0.03, silver, 0.22, 0.46, -0.08);
  addPart(headGroup, 0.05, 0.05, 0.05, lampMat, 0.22, 0.56, -0.08);

  // Gold radiation-shielding trim plates revealed when the suit upgrade is installed
  const upgradeTrimMeshes = [];
  if (includeUpgradeTrim) {
    const goldMat = new THREE.MeshLambertMaterial({
      color: 0xf59e0b,
      emissive: 0x78350f,
      emissiveIntensity: 0.25,
    });
    for (const sx of [-0.35, 0.35]) {
      const shoulderShield = addPart(upperBody, 0.21, 0.09, 0.23, goldMat, sx, 0.57, 0);
      shoulderShield.visible = false;
      upgradeTrimMeshes.push(shoulderShield);
    }
    const chestRim = addPart(upperBody, 0.32, 0.05, 0.1, goldMat, 0, 0.49, 0.18);
    chestRim.visible = false;
    upgradeTrimMeshes.push(chestRim);
  }

  return {
    bodyGroup,
    legL: leftLeg.hip,
    legR: rightLeg.hip,
    kneeL: leftLeg.knee,
    kneeR: rightLeg.knee,
    upperBody,
    armL: leftArm.shoulder,
    armR: rightArm.shoulder,
    elbowL: leftArm.elbow,
    elbowR: rightArm.elbow,
    headGroup,
    suitMat,
    accentMat,
    bootMat,
    statusLightMat,
    lampMat,
    visorMat,
    upgradeTrimMeshes,
    parts,
  };
}

function makePixelFaceMaterial(width, height, drawFn, fallbackColor) {
  if (typeof document === 'undefined') {
    return new THREE.MeshLambertMaterial({ color: fallbackColor });
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  drawFn(ctx, width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  return new THREE.MeshLambertMaterial({ map: texture });
}

const HAIRLINE_PATTERNS = {
  swept: [
    [0, 0, 32, 6],
    [0, 6, 13, 2],
    [26, 6, 6, 2],
    [0, 8, 3, 4],
    [29, 8, 3, 4],
  ],
  puffs: [
    [0, 0, 32, 5],
    [0, 5, 8, 3],
    [24, 5, 8, 3],
    [0, 8, 3, 5],
    [29, 8, 3, 5],
  ],
  tousled: [
    [0, 0, 32, 6],
    [0, 6, 14, 2],
    [20, 6, 12, 2],
    [6, 7, 5, 2],
    [0, 8, 3, 4],
    [29, 8, 3, 4],
  ],
  wavy: [
    [0, 0, 32, 6],
    [0, 6, 16, 2],
    [26, 6, 6, 2],
    [0, 8, 3, 8],
    [29, 8, 3, 7],
  ],
  fade: [
    [0, 0, 32, 5],
    [0, 5, 2, 4],
    [30, 5, 2, 4],
  ],
  bob: [
    [0, 0, 32, 6],
    [0, 6, 11, 2],
    [21, 6, 11, 2],
    [0, 8, 3, 9],
    [29, 8, 3, 9],
  ],
  parted: [
    [0, 0, 32, 6],
    [0, 6, 12, 2],
    [20, 6, 12, 2],
    [0, 8, 4, 3],
    [28, 8, 4, 3],
  ],
  bangs: [
    [0, 0, 32, 6],
    [0, 6, 14, 2],
    [17, 6, 15, 2],
    [0, 8, 3, 8],
    [29, 8, 3, 8],
  ],
  sweep: [
    [0, 0, 32, 5],
    [0, 5, 10, 2],
    [22, 5, 10, 2],
    [0, 7, 3, 4],
    [29, 7, 3, 4],
  ],
  straight_short: [
    [0, 0, 32, 5],
    [0, 5, 11, 2],
    [22, 5, 10, 2],
    [0, 7, 2, 4],
    [30, 7, 2, 4],
  ],
  straight_medium: [
    [0, 0, 32, 6],
    [0, 6, 12, 2],
    [21, 6, 11, 2],
    [0, 8, 3, 12],
    [29, 8, 3, 12],
  ],
  straight_long: [
    [0, 0, 32, 6],
    [0, 6, 12, 2],
    [21, 6, 11, 2],
    [0, 8, 3, 22],
    [29, 8, 3, 22],
  ],
  wavy_short: [
    [0, 0, 32, 5],
    [0, 5, 14, 2],
    [20, 5, 12, 2],
    [5, 7, 5, 1],
    [0, 7, 3, 4],
    [29, 7, 3, 4],
  ],
  wavy_medium: [
    [0, 0, 32, 6],
    [0, 6, 15, 2],
    [24, 6, 8, 2],
    [0, 8, 3, 12],
    [29, 8, 3, 12],
  ],
  wavy_long: [
    [0, 0, 32, 6],
    [0, 6, 15, 2],
    [24, 6, 8, 2],
    [0, 8, 3, 22],
    [29, 8, 3, 22],
  ],
  curly_short: [
    [0, 0, 32, 5],
    [2, 5, 6, 2],
    [10, 5, 6, 2],
    [18, 5, 6, 2],
    [26, 5, 6, 2],
    [0, 7, 3, 5],
    [29, 7, 3, 5],
  ],
  curly_medium: [
    [0, 0, 32, 6],
    [1, 6, 6, 2],
    [9, 6, 5, 2],
    [19, 6, 5, 2],
    [26, 6, 6, 2],
    [0, 8, 3, 13],
    [29, 8, 3, 13],
  ],
  curly_long: [
    [0, 0, 32, 6],
    [1, 6, 6, 2],
    [9, 6, 5, 2],
    [19, 6, 5, 2],
    [26, 6, 6, 2],
    [0, 8, 3, 22],
    [29, 8, 3, 22],
  ],
  coily_short: [
    [0, 0, 32, 5],
    [0, 5, 2, 4],
    [30, 5, 2, 4],
  ],
  coily_medium: [
    [0, 0, 32, 5],
    [0, 5, 8, 3],
    [24, 5, 8, 3],
    [0, 8, 3, 14],
    [29, 8, 3, 14],
  ],
  coily_long: [
    [0, 0, 32, 5],
    [0, 5, 8, 3],
    [24, 5, 8, 3],
    [0, 8, 3, 22],
    [29, 8, 3, 22],
  ],
};

function createCadetHeadMaterials(profile = DEFAULT_CADET_PROFILE) {
  const {
    skin: SKIN,
    skinShade: SKIN_SHADE,
    cheek: CHEEK,
    hair: HAIR,
    hairDark: HAIR_DARK,
    hairHi: HAIR_HI,
    eyeDark: EYE_DARK,
    eyeIris: EYE_IRIS,
    eyeGlint: EYE_GLINT,
    mouth: MOUTH,
    hairStyle = 'swept',
    hairType,
    hairLength,
    brows = 'arched',
    lashes = false,
    freckles = false,
  } = profile;

  const px = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string, w = 1, h = 1) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  };

  const paintHair = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    px(ctx, 0, 0, HAIR, w, h);
    if (hairType === 'coily') {
      for (let y = 0; y < h; y += 3) {
        for (let x = (y % 2) * 2; x < w; x += 4) {
          px(ctx, x, y, (x + y) % 3 === 0 ? HAIR_HI : HAIR_DARK, 2, 2);
        }
      }
      return;
    }
    if (hairType === 'curly') {
      for (let y = 1; y < h - 2; y += 6) {
        for (let x = (y % 4) + 1; x < w - 3; x += 7) {
          px(ctx, x, y, HAIR_DARK, 4, 4);
          px(ctx, x + 1, y + 1, HAIR_HI, 2, 2);
        }
      }
      return;
    }
    if (hairType === 'wavy') {
      for (let y = 2; y < h - 2; y += 6) {
        px(ctx, 0, y, HAIR_HI, w, 2);
        px(ctx, 4, y + 2, HAIR_DARK, w - 8, 2);
      }
      return;
    }
    // Straight (and legacy NPC styles): sleek streaks
    px(ctx, 5, 0, HAIR_HI, 3, h);
    px(ctx, 14, 0, HAIR_DARK, 2, h);
    px(ctx, 22, 0, HAIR_HI, 3, h);
  };

  const paintEye = (ctx: CanvasRenderingContext2D, x: number, y: number, isRight: boolean) => {
    // Tall rounded vertical eye with catchlight (distinct MarsCraft cadet style)
    px(ctx, x, y + 1, EYE_DARK, 4, 5);
    px(ctx, x + 1, y, EYE_DARK, 2, 7);
    px(ctx, x, y + 4, EYE_IRIS, 4, 2);
    px(ctx, x + 1, y + 5, EYE_IRIS, 2, 2);
    px(ctx, x, y + 1, EYE_GLINT, 2, 2);
    px(ctx, x + 2, y + 4, EYE_GLINT, 1, 1);
    if (lashes) {
      px(ctx, isRight ? x + 4 : x - 1, y + 1, EYE_DARK, 1, 2);
    }
  };

  const sideBackExtent = hairLength === 'short' ? 8 : hairLength === 'long' ? 22 : 14;
  const sideHairWidth = hairLength === 'long' ? 18 : 14;

  // Three.js BoxGeometry material order: +x, -x, +y, -y, +z (front), -z (back)
  const rightSide = makePixelFaceMaterial(32, 32, (ctx) => {
    px(ctx, 0, 0, SKIN, 32, 32);
    px(ctx, 0, 0, HAIR, 32, hairLength === 'short' ? 8 : 10);
    px(ctx, 32 - sideHairWidth, 8, HAIR, sideHairWidth, sideBackExtent);
    px(ctx, 21, 4, HAIR_HI, 6, 3);
    px(ctx, 0, 29, SKIN_SHADE, 32, 3);
  }, HAIR);

  const leftSide = makePixelFaceMaterial(32, 32, (ctx) => {
    px(ctx, 0, 0, SKIN, 32, 32);
    px(ctx, 0, 0, HAIR, 32, hairLength === 'short' ? 8 : 10);
    px(ctx, 0, 8, HAIR, sideHairWidth, sideBackExtent);
    px(ctx, 5, 4, HAIR_HI, 6, 3);
    px(ctx, 0, 29, SKIN_SHADE, 32, 3);
  }, HAIR);

  const top = makePixelFaceMaterial(32, 32, (ctx) => paintHair(ctx, 32, 32), HAIR);
  const bottom = makePixelFaceMaterial(32, 32, (ctx) => px(ctx, 0, 0, SKIN_SHADE, 32, 32), SKIN_SHADE);

  const front = makePixelFaceMaterial(32, 32, (ctx) => {
    px(ctx, 0, 0, SKIN, 32, 32);
    const hairline = HAIRLINE_PATTERNS[hairStyle] ?? HAIRLINE_PATTERNS.swept;
    for (const [rx, ry, rw, rh] of hairline) {
      px(ctx, rx, ry, HAIR, rw, rh);
    }

    // Eyebrows
    if (brows === 'straight') {
      px(ctx, 7, 9, HAIR_DARK, 6, 2);
      px(ctx, 19, 9, HAIR_DARK, 6, 2);
    } else {
      px(ctx, 7, 9, HAIR_DARK, 5, 2);
      px(ctx, 8, 8, HAIR_DARK, 3, 1);
      px(ctx, 20, 9, HAIR_DARK, 5, 2);
      px(ctx, 21, 8, HAIR_DARK, 3, 1);
    }

    // Tall expressive eyes
    paintEye(ctx, 8, 12, false);
    paintEye(ctx, 20, 12, true);

    // Soft cheek warmth + optional freckles + subtle under-nose shadow
    px(ctx, 5, 19, CHEEK, 4, 2);
    px(ctx, 23, 19, CHEEK, 4, 2);
    if (freckles) {
      px(ctx, 6, 19, SKIN_SHADE, 1, 1);
      px(ctx, 8, 20, SKIN_SHADE, 1, 1);
      px(ctx, 23, 20, SKIN_SHADE, 1, 1);
      px(ctx, 25, 19, SKIN_SHADE, 1, 1);
    }
    px(ctx, 15, 20, SKIN_SHADE, 2, 1);

    // Friendly curved smile
    px(ctx, 11, 23, MOUTH, 2, 1);
    px(ctx, 19, 23, MOUTH, 2, 1);
    px(ctx, 12, 24, MOUTH, 8, 1);
    px(ctx, 14, 25, MOUTH, 4, 1);

    // Subtle chin shading
    px(ctx, 2, 30, SKIN_SHADE, 28, 2);
  }, SKIN);

  const back = makePixelFaceMaterial(32, 32, (ctx) => {
    paintHair(ctx, 32, 32);
    if (hairLength === 'short') {
      px(ctx, 2, 22, SKIN_SHADE, 28, 10);
    } else if (hairLength === 'long') {
      px(ctx, 0, 28, HAIR_DARK, 32, 4);
    } else {
      px(ctx, 4, 28, SKIN_SHADE, 24, 4);
    }
  }, HAIR);

  return [rightSide, leftSide, top, bottom, front, back];
}

const IVA_HAIR_STYLES = {
  default: [
    { dims: [0.33, 0.065, 0.31], pos: [0, 0.345, -0.008] },
    { dims: [0.16, 0.045, 0.18], pos: [-0.04, 0.382, 0.02], rot: [-0.08, 0, 0.12], tone: 'hi' },
    { dims: [0.21, 0.06, 0.055], pos: [-0.05, 0.305, 0.138], rot: [0, 0, 0.14] },
    { dims: [0.1, 0.05, 0.05], pos: [0.105, 0.312, 0.136], rot: [0, 0, -0.16] },
    { dims: [0.328, 0.24, 0.055], pos: [0, 0.22, -0.142] },
    { dims: [0.042, 0.13, 0.22], pos: [-0.152, 0.265, -0.02] },
    { dims: [0.042, 0.13, 0.22], pos: [0.152, 0.265, -0.02] },
  ],
  straight_short: [
    { dims: [0.35, 0.048, 0.315], pos: [0, 0.342, -0.005] },
    { dims: [0.16, 0.020, 0.16], pos: [0, 0.362, 0.02], tone: 'hi' },
    { dims: [0.32, 0.042, 0.042], pos: [0, 0.312, 0.144] },
    { dims: [0.344, 0.15, 0.046], pos: [0, 0.262, -0.145] },
    { dims: [0.032, 0.08, 0.20], pos: [-0.166, 0.285, -0.02] },
    { dims: [0.032, 0.08, 0.20], pos: [0.166, 0.285, -0.02] },
  ],
  straight_medium: [
    { dims: [0.354, 0.050, 0.32], pos: [0, 0.342, -0.006] },
    { dims: [0.18, 0.020, 0.18], pos: [0, 0.363, 0.01], tone: 'hi' },
    { dims: [0.325, 0.044, 0.044], pos: [0, 0.312, 0.144] },
    { dims: [0.354, 0.30, 0.050], pos: [0, 0.182, -0.15] },
    { dims: [0.044, 0.26, 0.11], pos: [-0.170, 0.192, 0.06] },
    { dims: [0.044, 0.26, 0.11], pos: [0.170, 0.192, 0.06] },
    { dims: [0.042, 0.24, 0.17], pos: [-0.166, 0.202, -0.06] },
    { dims: [0.042, 0.24, 0.17], pos: [0.166, 0.202, -0.06] },
  ],
  straight_long: [
    { dims: [0.356, 0.052, 0.322], pos: [0, 0.342, -0.008] },
    { dims: [0.18, 0.022, 0.20], pos: [0, 0.364, 0.01], tone: 'hi' },
    { dims: [0.325, 0.044, 0.044], pos: [0, 0.312, 0.144] },
    { dims: [0.362, 0.54, 0.054], pos: [0, 0.065, -0.154] },
    { dims: [0.30, 0.18, 0.044], pos: [0, -0.14, -0.152], tone: 'dark' },
    { dims: [0.052, 0.44, 0.095], pos: [-0.170, 0.08, 0.075] },
    { dims: [0.052, 0.44, 0.095], pos: [0.170, 0.08, 0.075] },
    { dims: [0.046, 0.42, 0.15], pos: [-0.168, 0.09, -0.06] },
    { dims: [0.046, 0.42, 0.15], pos: [0.168, 0.09, -0.06] },
  ],
  wavy_short: [
    { dims: [0.356, 0.066, 0.322], pos: [0, 0.344, -0.006] },
    { dims: [0.20, 0.046, 0.19], pos: [-0.045, 0.378, 0.02], rot: [-0.08, 0, 0.16], tone: 'hi' },
    { dims: [0.23, 0.058, 0.056], pos: [-0.05, 0.304, 0.144], rot: [0, 0, 0.20] },
    { dims: [0.12, 0.048, 0.050], pos: [0.105, 0.312, 0.140], rot: [0, 0, -0.22], tone: 'hi' },
    { dims: [0.354, 0.17, 0.052], pos: [0, 0.252, -0.148] },
    { dims: [0.054, 0.10, 0.19], pos: [-0.174, 0.272, -0.015], rot: [0, 0, -0.16] },
    { dims: [0.054, 0.10, 0.19], pos: [0.174, 0.272, -0.015], rot: [0, 0, 0.16] },
  ],
  wavy_medium: [
    { dims: [0.36, 0.068, 0.326], pos: [0, 0.344, -0.006] },
    { dims: [0.20, 0.046, 0.19], pos: [-0.045, 0.378, 0.02], rot: [-0.08, 0, 0.16], tone: 'hi' },
    { dims: [0.23, 0.058, 0.056], pos: [-0.05, 0.304, 0.144], rot: [0, 0, 0.20] },
    { dims: [0.12, 0.045, 0.050], pos: [0.108, 0.312, 0.140], rot: [0, 0, -0.20], tone: 'hi' },
    { dims: [0.364, 0.28, 0.058], pos: [0, 0.188, -0.151] },
    { dims: [0.40, 0.11, 0.054], pos: [0, 0.08, -0.154], rot: [0, 0, 0.06], tone: 'hi' },
    // Bold S-curve side waves visible from the front
    { dims: [0.060, 0.13, 0.13], pos: [-0.172, 0.242, 0.038], rot: [0, 0, 0.18] },
    { dims: [0.060, 0.13, 0.13], pos: [0.172, 0.242, 0.038], rot: [0, 0, -0.18] },
    { dims: [0.070, 0.13, 0.13], pos: [-0.198, 0.122, 0.028], rot: [0, 0, -0.24], tone: 'hi' },
    { dims: [0.070, 0.13, 0.13], pos: [0.198, 0.122, 0.028], rot: [0, 0, 0.24], tone: 'hi' },
  ],
  wavy_long: [
    { dims: [0.364, 0.070, 0.328], pos: [0, 0.344, -0.008] },
    { dims: [0.20, 0.046, 0.19], pos: [-0.045, 0.378, 0.02], rot: [-0.08, 0, 0.16], tone: 'hi' },
    { dims: [0.23, 0.058, 0.056], pos: [-0.05, 0.304, 0.144], rot: [0, 0, 0.20] },
    { dims: [0.12, 0.045, 0.050], pos: [0.108, 0.312, 0.140], rot: [0, 0, -0.20], tone: 'hi' },
    { dims: [0.368, 0.34, 0.060], pos: [0, 0.165, -0.154] },
    { dims: [0.41, 0.17, 0.058], pos: [0.014, -0.04, -0.156], rot: [0, 0, 0.07], tone: 'hi' },
    { dims: [0.36, 0.17, 0.055], pos: [-0.014, -0.15, -0.152], rot: [0, 0, -0.07], tone: 'dark' },
    // 3-tier S-wave cascade clearly extending outside torso/shoulders
    { dims: [0.060, 0.15, 0.12], pos: [-0.172, 0.24, 0.048], rot: [0, 0, 0.18] },
    { dims: [0.060, 0.15, 0.12], pos: [0.172, 0.24, 0.048], rot: [0, 0, -0.18] },
    { dims: [0.072, 0.16, 0.12], pos: [-0.206, 0.095, 0.058], rot: [0, 0, -0.24], tone: 'hi' },
    { dims: [0.072, 0.16, 0.12], pos: [0.206, 0.095, 0.058], rot: [0, 0, 0.24], tone: 'hi' },
    { dims: [0.062, 0.16, 0.11], pos: [-0.174, -0.055, 0.068], rot: [0, 0, 0.22], tone: 'dark' },
    { dims: [0.062, 0.16, 0.11], pos: [0.174, -0.055, 0.068], rot: [0, 0, -0.22], tone: 'dark' },
  ],
  curly_short: [
    { dims: [0.366, 0.080, 0.332], pos: [0, 0.350, -0.006] },
    { dims: [0.14, 0.064, 0.14], pos: [-0.095, 0.390, 0.04], tone: 'hi' },
    { dims: [0.14, 0.064, 0.14], pos: [0.09, 0.386, -0.02] },
    { dims: [0.12, 0.058, 0.12], pos: [0, 0.398, 0.02], tone: 'dark' },
    // 3 bouncy forehead curl puffs
    { dims: [0.10, 0.056, 0.070], pos: [-0.11, 0.314, 0.138] },
    { dims: [0.10, 0.060, 0.070], pos: [0.0, 0.322, 0.144], tone: 'hi' },
    { dims: [0.10, 0.056, 0.070], pos: [0.11, 0.314, 0.138] },
    // Temple curl tufts
    { dims: [0.082, 0.095, 0.11], pos: [-0.186, 0.282, 0.03], tone: 'hi' },
    { dims: [0.082, 0.095, 0.11], pos: [0.186, 0.282, 0.03], tone: 'hi' },
    { dims: [0.356, 0.18, 0.058], pos: [0, 0.248, -0.148] },
  ],
  curly_medium: [
    { dims: [0.374, 0.084, 0.336], pos: [0, 0.350, -0.008] },
    { dims: [0.15, 0.066, 0.15], pos: [-0.10, 0.392, 0.04], tone: 'hi' },
    { dims: [0.15, 0.066, 0.15], pos: [0.095, 0.388, -0.02] },
    { dims: [0.13, 0.060, 0.13], pos: [0, 0.400, 0.02], tone: 'dark' },
    { dims: [0.104, 0.058, 0.072], pos: [-0.11, 0.314, 0.138] },
    { dims: [0.104, 0.062, 0.072], pos: [0.0, 0.322, 0.144], tone: 'hi' },
    { dims: [0.104, 0.058, 0.072], pos: [0.11, 0.314, 0.138] },
    // Distinct gapped alternating ringlet clusters down to chin
    { dims: [0.088, 0.082, 0.11], pos: [-0.186, 0.284, 0.03], tone: 'hi' },
    { dims: [0.088, 0.082, 0.11], pos: [0.186, 0.284, 0.03], tone: 'hi' },
    { dims: [0.096, 0.084, 0.12], pos: [-0.210, 0.194, 0.015] },
    { dims: [0.096, 0.084, 0.12], pos: [0.210, 0.194, 0.015] },
    { dims: [0.088, 0.082, 0.11], pos: [-0.186, 0.104, 0.038], tone: 'dark' },
    { dims: [0.088, 0.082, 0.11], pos: [0.186, 0.104, 0.038], tone: 'dark' },
    { dims: [0.385, 0.29, 0.074], pos: [0, 0.188, -0.154] },
  ],
  curly_long: [
    { dims: [0.378, 0.086, 0.34], pos: [0, 0.350, -0.008] },
    { dims: [0.15, 0.066, 0.15], pos: [-0.10, 0.392, 0.04], tone: 'hi' },
    { dims: [0.15, 0.066, 0.15], pos: [0.095, 0.388, -0.02] },
    { dims: [0.13, 0.060, 0.13], pos: [0, 0.400, 0.02], tone: 'dark' },
    { dims: [0.104, 0.058, 0.072], pos: [-0.11, 0.314, 0.138] },
    { dims: [0.104, 0.062, 0.072], pos: [0.0, 0.322, 0.144], tone: 'hi' },
    { dims: [0.104, 0.058, 0.072], pos: [0.11, 0.314, 0.138] },
    // Cascading gapped 5-cluster ringlets down onto the chest/shoulders
    { dims: [0.088, 0.080, 0.11], pos: [-0.186, 0.284, 0.03], tone: 'hi' },
    { dims: [0.088, 0.080, 0.11], pos: [0.186, 0.284, 0.03], tone: 'hi' },
    { dims: [0.098, 0.082, 0.12], pos: [-0.212, 0.194, 0.02] },
    { dims: [0.098, 0.082, 0.12], pos: [0.212, 0.194, 0.02] },
    { dims: [0.090, 0.082, 0.11], pos: [-0.188, 0.104, 0.04], tone: 'dark' },
    { dims: [0.090, 0.082, 0.11], pos: [0.188, 0.104, 0.04], tone: 'dark' },
    { dims: [0.098, 0.082, 0.11], pos: [-0.210, 0.014, 0.055], tone: 'hi' },
    { dims: [0.098, 0.082, 0.11], pos: [0.210, 0.014, 0.055], tone: 'hi' },
    { dims: [0.086, 0.082, 0.10], pos: [-0.184, -0.076, 0.065] },
    { dims: [0.086, 0.082, 0.10], pos: [0.184, -0.076, 0.065] },
    { dims: [0.39, 0.34, 0.076], pos: [0, 0.165, -0.156] },
    { dims: [0.41, 0.22, 0.080], pos: [0, -0.09, -0.160], tone: 'dark' },
  ],
  coily_short: [
    // Crisp high tapered coily flat-top / mini-fro
    { dims: [0.35, 0.095, 0.32], pos: [0, 0.368, -0.005] },
    { dims: [0.30, 0.050, 0.27], pos: [0, 0.420, -0.004], tone: 'hi' },
    { dims: [0.336, 0.12, 0.045], pos: [0, 0.278, -0.144] },
  ],
  coily_medium: [
    // Classic rounded Afro dome with textured coil rim
    { dims: [0.48, 0.14, 0.41], pos: [0, 0.374, -0.01] },
    { dims: [0.38, 0.072, 0.33], pos: [0, 0.452, -0.01], tone: 'hi' },
    { dims: [0.26, 0.036, 0.24], pos: [0, 0.494, -0.01], tone: 'dark' },
    { dims: [0.46, 0.27, 0.09], pos: [0, 0.208, -0.16] },
    { dims: [0.115, 0.24, 0.28], pos: [-0.214, 0.26, -0.005] },
    { dims: [0.115, 0.24, 0.28], pos: [0.214, 0.26, -0.005] },
  ],
  coily_long: [
    // Huge voluminous rounded coily Afro cloud flaring wide & tall past shoulders
    { dims: [0.54, 0.15, 0.44], pos: [0, 0.380, -0.01] },
    { dims: [0.43, 0.075, 0.36], pos: [0, 0.462, -0.01], tone: 'hi' },
    { dims: [0.28, 0.040, 0.25], pos: [0, 0.506, -0.01], tone: 'dark' },
    { dims: [0.50, 0.34, 0.11], pos: [0, 0.18, -0.165] },
    { dims: [0.44, 0.22, 0.10], pos: [0, -0.05, -0.165], tone: 'dark' },
    { dims: [0.13, 0.25, 0.30], pos: [-0.228, 0.255, -0.005] },
    { dims: [0.13, 0.25, 0.30], pos: [0.228, 0.255, -0.005] },
    { dims: [0.125, 0.21, 0.25], pos: [-0.238, 0.05, 0.01], tone: 'hi' },
    { dims: [0.125, 0.21, 0.25], pos: [0.238, 0.05, 0.01], tone: 'hi' },
    { dims: [0.06, 0.08, 0.16], pos: [-0.275, 0.35, -0.01], tone: 'dark' },
    { dims: [0.06, 0.08, 0.16], pos: [0.275, 0.35, -0.01], tone: 'dark' },
  ],
};

function createIvaTorsoMaterials(accentColor) {
  const accentHex = `#${new THREE.Color(accentColor).getHexString()}`;
  const blue = '#1e3a5f';
  const trim = '#2563eb';
  const belt = '#334155';
  const silver = '#cbd5e1';

  const sideMat = makePixelFaceMaterial(8, 12, (ctx) => {
    ctx.fillStyle = blue;
    ctx.fillRect(0, 0, 8, 12);
    ctx.fillStyle = trim;
    ctx.fillRect(2, 0, 4, 10);
    ctx.fillStyle = accentHex;
    ctx.fillRect(0, 3, 8, 2);
    ctx.fillStyle = belt;
    ctx.fillRect(0, 10, 8, 2);
  }, 0x1e3a5f);

  const frontMat = makePixelFaceMaterial(8, 12, (ctx) => {
    ctx.fillStyle = blue;
    ctx.fillRect(0, 0, 8, 12);
    ctx.fillStyle = trim;
    ctx.fillRect(0, 0, 1, 10);
    ctx.fillRect(7, 0, 1, 10);
    // Commander orange stripe + white collar + zipper
    ctx.fillStyle = accentHex;
    ctx.fillRect(0, 3, 8, 2);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(2, 0, 4, 1);
    ctx.fillStyle = silver;
    ctx.fillRect(3, 1, 2, 9);
    // Tiny mission patch
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(5, 1, 2, 2);
    // Belt + buckle
    ctx.fillStyle = belt;
    ctx.fillRect(0, 10, 8, 2);
    ctx.fillStyle = silver;
    ctx.fillRect(3, 10, 2, 2);
  }, 0x1e3a5f);

  const backMat = makePixelFaceMaterial(8, 12, (ctx) => {
    ctx.fillStyle = blue;
    ctx.fillRect(0, 0, 8, 12);
    ctx.fillStyle = accentHex;
    ctx.fillRect(0, 3, 8, 2);
    ctx.fillStyle = belt;
    ctx.fillRect(0, 10, 8, 2);
  }, 0x1e3a5f);

  const topMat = new THREE.MeshLambertMaterial({ color: 0x1e3a5f });
  const bottomMat = new THREE.MeshLambertMaterial({ color: 0x334155 });
  return [sideMat, sideMat, topMat, bottomMat, frontMat, backMat];
}

/**
 * Builds an unarmored NASA IVA flight-suit astronaut rig (no helmet or PLSS backpack)
 * with a sculpted multi-part head, mission comms headset, and original pixel-art face.
 */
export function buildIvaAstronautRig({ accentColor = 0xea580c, crewProfile = null } = {}) {
  const bodyGroup = new THREE.Group();
  const profile = crewProfile ?? DEFAULT_CADET_PROFILE;

  const suitBlue = new THREE.MeshLambertMaterial({ color: 0x1e3a5f });
  const accentMat = new THREE.MeshLambertMaterial({ color: accentColor });
  const skinMat = new THREE.MeshLambertMaterial({ color: profile.skin });
  const skinShadeMat = new THREE.MeshLambertMaterial({ color: profile.skinShade });
  const hairMat = new THREE.MeshLambertMaterial({ color: profile.hair });
  const hairHiMat = new THREE.MeshLambertMaterial({ color: profile.hairHi });
  const hairDarkMat = new THREE.MeshLambertMaterial({ color: profile.hairDark });
  const whiteMat = new THREE.MeshLambertMaterial({ color: 0xf8fafc });
  const darkMat = new THREE.MeshLambertMaterial({ color: 0x334155 });
  const headsetMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });
  const headsetPadMat = new THREE.MeshLambertMaterial({ color: 0x475569 });
  const micLedMat = new THREE.MeshLambertMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 0.7,
  });

  const addPart = (parent, w, h, d, mat, x, y, z, rx = 0, ry = 0, rz = 0) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y, z);
    if (rx || ry || rz) mesh.rotation.set(rx, ry, rz);
    parent.add(mesh);
    return mesh;
  };

  // Blocky flight-suit legs + gym sneakers
  const createLeg = (x) => {
    const hip = new THREE.Group();
    hip.position.set(x, 0.72, 0);
    addPart(hip, 0.195, 0.3, 0.20, suitBlue, 0, -0.15, 0);
    addPart(hip, 0.20, 0.04, 0.205, accentMat, 0, -0.26, 0);

    const knee = new THREE.Group();
    knee.position.set(0, -0.32, 0);
    hip.add(knee);

    addPart(knee, 0.185, 0.26, 0.19, suitBlue, 0, -0.14, 0);
    addPart(knee, 0.195, 0.07, 0.24, darkMat, 0, -0.31, 0.02);
    addPart(knee, 0.20, 0.03, 0.25, whiteMat, 0, -0.36, 0.02);

    bodyGroup.add(hip);
    return { hip, knee };
  };

  const leftLeg = createLeg(-0.105);
  const rightLeg = createLeg(0.105);

  // Flight jacket torso (blockier proportions matching voxel astronaut rig)
  const upperBody = new THREE.Group();
  upperBody.position.set(0, 0.72, 0);
  bodyGroup.add(upperBody);

  addPart(upperBody, 0.45, 0.54, 0.24, createIvaTorsoMaterials(accentColor), 0, 0.31, 0);
  addPart(upperBody, 0.24, 0.035, 0.21, whiteMat, 0, 0.585, 0);
  addPart(upperBody, 0.13, 0.055, 0.13, skinMat, 0, 0.605, 0);

  // Flight-suit arms + bare hands
  const createArm = (x) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(x, 0.54, 0);
    addPart(shoulder, 0.165, 0.22, 0.165, suitBlue, 0, -0.1, 0);
    addPart(shoulder, 0.17, 0.05, 0.17, accentMat, 0, -0.12, 0);

    const elbow = new THREE.Group();
    elbow.position.set(0, -0.23, 0);
    shoulder.add(elbow);

    addPart(elbow, 0.16, 0.21, 0.16, suitBlue, 0, -0.1, 0);
    addPart(elbow, 0.165, 0.03, 0.165, whiteMat, 0, -0.21, 0);
    addPart(elbow, 0.16, 0.12, 0.16, skinMat, 0, -0.28, 0);

    upperBody.add(shoulder);
    return { shoulder, elbow };
  };

  const leftArm = createArm(-0.31);
  const rightArm = createArm(0.31);

  // Sculpted multi-part cadet head with 3D hair, 3D nose, and mission comms headset
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.62, 0);
  upperBody.add(headGroup);

  // Non-cubic boxy cadet head silhouette + 3D nose
  addPart(headGroup, 0.33, 0.32, 0.30, createCadetHeadMaterials(profile), 0, 0.18, 0);
  addPart(headGroup, 0.044, 0.050, 0.03, skinShadeMat, 0, 0.15, 0.162);

  // 3D layered hair matching hairType + hairLength
  const ivaHairKey = profile.hairType && profile.hairLength
    ? `${profile.hairType}_${profile.hairLength}`
    : 'default';
  const ivaHairPieces = IVA_HAIR_STYLES[ivaHairKey] ?? IVA_HAIR_STYLES.default;
  for (const piece of ivaHairPieces) {
    const mat = piece.tone === 'hi' ? hairHiMat : piece.tone === 'dark' ? hairDarkMat : hairMat;
    const rot = piece.rot ?? [0, 0, 0];
    addPart(
      headGroup,
      piece.dims[0], piece.dims[1], piece.dims[2],
      mat,
      piece.pos[0], piece.pos[1], piece.pos[2],
      rot[0], rot[1], rot[2]
    );
  }

  // Mission comms headset + boom mic (clearance adapts to taller/wider coily/curly crowns)
  const wideCrown = profile.hairType === 'coily' && (profile.hairLength === 'medium' || profile.hairLength === 'long');
  const tallCrown = profile.hairType === 'coily' || profile.hairType === 'curly';
  const bandY = wideCrown ? 0.535 : tallCrown ? 0.438 : 0.395;
  const sideSpanX = wideCrown ? 0.305 : profile.hairType === 'curly' ? 0.255 : profile.hairType === 'wavy' && profile.hairLength !== 'short' ? 0.218 : 0.192;
  const strutHeight = bandY - 0.19;
  addPart(headGroup, sideSpanX * 2 + 0.02, 0.032, 0.055, headsetMat, 0, bandY, -0.01);
  for (const sx of [-1, 1]) {
    addPart(headGroup, 0.03, strutHeight, 0.048, headsetMat, sx * sideSpanX, 0.19 + strutHeight * 0.5, -0.01);
    addPart(headGroup, 0.03, 0.125, 0.125, headsetPadMat, sx * (sideSpanX - 0.01), 0.185, -0.01);
    addPart(headGroup, 0.035, 0.11, 0.11, headsetMat, sx * (sideSpanX + 0.01), 0.185, -0.01);
    addPart(headGroup, 0.016, 0.065, 0.065, accentMat, sx * (sideSpanX + 0.027), 0.185, -0.01);
  }
  addPart(headGroup, 0.018, 0.018, 0.155, headsetMat, -(sideSpanX - 0.012), 0.128, 0.068, 0.16, 0.48, 0);
  addPart(headGroup, 0.028, 0.024, 0.034, headsetMat, -0.115, 0.112, 0.142);
  addPart(headGroup, 0.012, 0.012, 0.012, micLedMat, -0.105, 0.112, 0.158);

  return {
    bodyGroup,
    legL: leftLeg.hip,
    legR: rightLeg.hip,
    kneeL: leftLeg.knee,
    kneeR: rightLeg.knee,
    upperBody,
    armL: leftArm.shoulder,
    armR: rightArm.shoulder,
    elbowL: leftArm.elbow,
    elbowR: rightArm.elbow,
    headGroup,
  };
}
