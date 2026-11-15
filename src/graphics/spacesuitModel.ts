// @ts-nocheck
import * as THREE from 'three';

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

/**
 * Builds an articulated voxel NASA xEMU spacesuit rig shared by crew avatars and the Suitport dock.
 */
export function buildSpacesuitRig({
  accentColor = 0xea580c,
  suitColor = 0xf8fafc,
  includeUpgradeTrim = false,
  instanced = false,
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
  const visorMat = new THREE.MeshLambertMaterial({
    map: createVisorTexture(),
    emissive: 0x451a03,
    emissiveIntensity: 0.35,
  });
  const dcmMat = new THREE.MeshLambertMaterial({
    map: createChestDcmTexture(),
  });

  // instanced: caixas de cor lisa e lampadas nao viram Mesh, e sim nos vazios (a escala guarda o
  // tamanho da caixa) listados em `parts`, para o CrewInstances desenhar a tripulacao inteira em
  // dois desenhos. Pecas com textura ou com cor por traje (visor, painel do peito, luz de estado,
  // placas de upgrade) continuam Mesh.
  const instancedMats = instanced ? new Set([suitMat, accentMat, darkJoint, bootMat, silver, lampMat]) : null;
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

  addPart(headGroup, 0.44, 0.42, 0.44, suitMat, 0, 0.21, 0);
  addPart(headGroup, 0.46, 0.07, 0.46, suitMat, 0, 0.4, 0.01);
  addPart(headGroup, 0.14, 0.05, 0.38, accentMat, 0, 0.435, 0);
  addPart(headGroup, 0.38, 0.25, 0.05, bootMat, 0, 0.22, 0.21);
  addPart(headGroup, 0.35, 0.22, 0.06, visorMat, 0, 0.22, 0.22);
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
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  return new THREE.MeshLambertMaterial({ map: texture });
}

function createCadetHeadMaterials() {
  const SKIN = '#f2c2a2';
  const SKIN_SHADE = '#dca07e';
  const CHEEK = 'rgba(229, 115, 104, 0.3)';
  const HAIR = '#2d1e17';
  const HAIR_DARK = '#1f140f';
  const HAIR_HI = '#462f24';
  const EYE_DARK = '#1c2541';
  const EYE_IRIS = '#2b4570';
  const EYE_GLINT = '#f8fafc';
  const MOUTH = '#9c4f3d';

  const px = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string, w = 1, h = 1) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  };

  const paintHair = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    px(ctx, 0, 0, HAIR, w, h);
    px(ctx, 3, 4, HAIR_DARK, 6, 3);
    px(ctx, 17, 7, HAIR_HI, 7, 3);
    px(ctx, 8, 16, HAIR_HI, 5, 4);
    px(ctx, 21, 20, HAIR_DARK, 6, 4);
  };

  const paintEye = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    // Tall rounded vertical eye with catchlight (distinct MarsCraft cadet style)
    px(ctx, x, y + 1, EYE_DARK, 4, 5);
    px(ctx, x + 1, y, EYE_DARK, 2, 7);
    px(ctx, x, y + 4, EYE_IRIS, 4, 2);
    px(ctx, x + 1, y + 5, EYE_IRIS, 2, 2);
    px(ctx, x, y + 1, EYE_GLINT, 2, 2);
    px(ctx, x + 2, y + 4, EYE_GLINT, 1, 1);
  };

  // Three.js BoxGeometry material order: +x, -x, +y, -y, +z (front), -z (back)
  const rightSide = makePixelFaceMaterial(32, 32, (ctx) => {
    px(ctx, 0, 0, SKIN, 32, 32);
    px(ctx, 0, 0, HAIR, 32, 10);
    px(ctx, 18, 10, HAIR, 14, 14);
    px(ctx, 21, 4, HAIR_HI, 6, 3);
    px(ctx, 0, 29, SKIN_SHADE, 32, 3);
  }, 0x2d1e17);

  const leftSide = makePixelFaceMaterial(32, 32, (ctx) => {
    px(ctx, 0, 0, SKIN, 32, 32);
    px(ctx, 0, 0, HAIR, 32, 10);
    px(ctx, 0, 10, HAIR, 14, 14);
    px(ctx, 5, 4, HAIR_HI, 6, 3);
    px(ctx, 0, 29, SKIN_SHADE, 32, 3);
  }, 0x2d1e17);

  const top = makePixelFaceMaterial(32, 32, (ctx) => paintHair(ctx, 32, 32), 0x2d1e17);
  const bottom = makePixelFaceMaterial(32, 32, (ctx) => px(ctx, 0, 0, SKIN_SHADE, 32, 32), 0xdca07e);

  const front = makePixelFaceMaterial(32, 32, (ctx) => {
    px(ctx, 0, 0, SKIN, 32, 32);
    // Asymmetric swept hairline under the 3D hair tuft
    px(ctx, 0, 0, HAIR, 32, 6);
    px(ctx, 0, 6, HAIR, 13, 2);
    px(ctx, 26, 6, HAIR, 6, 2);
    px(ctx, 0, 8, HAIR, 3, 4);
    px(ctx, 29, 8, HAIR, 3, 4);

    // Arched eyebrows
    px(ctx, 7, 9, HAIR, 5, 2);
    px(ctx, 8, 8, HAIR, 3, 1);
    px(ctx, 20, 9, HAIR, 5, 2);
    px(ctx, 21, 8, HAIR, 3, 1);

    // Tall expressive eyes
    paintEye(ctx, 8, 12);
    paintEye(ctx, 20, 12);

    // Soft cheek warmth + subtle under-nose shadow
    px(ctx, 5, 19, CHEEK, 4, 2);
    px(ctx, 23, 19, CHEEK, 4, 2);
    px(ctx, 15, 20, SKIN_SHADE, 2, 1);

    // Friendly curved smile
    px(ctx, 11, 23, MOUTH, 2, 1);
    px(ctx, 19, 23, MOUTH, 2, 1);
    px(ctx, 12, 24, MOUTH, 8, 1);
    px(ctx, 14, 25, MOUTH, 4, 1);

    // Subtle chin shading
    px(ctx, 2, 30, SKIN_SHADE, 28, 2);
  }, 0xf2c2a2);

  const back = makePixelFaceMaterial(32, 32, (ctx) => {
    paintHair(ctx, 32, 32);
    px(ctx, 4, 28, SKIN_SHADE, 24, 4);
  }, 0x2d1e17);

  return [rightSide, leftSide, top, bottom, front, back];
}

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
export function buildIvaAstronautRig({ accentColor = 0xea580c } = {}) {
  const bodyGroup = new THREE.Group();

  const suitBlue = new THREE.MeshLambertMaterial({ color: 0x1e3a5f });
  const accentMat = new THREE.MeshLambertMaterial({ color: accentColor });
  const skinMat = new THREE.MeshLambertMaterial({ color: 0xf2c2a2 });
  const skinShadeMat = new THREE.MeshLambertMaterial({ color: 0xdca07e });
  const hairMat = new THREE.MeshLambertMaterial({ color: 0x2d1e17 });
  const hairHiMat = new THREE.MeshLambertMaterial({ color: 0x462f24 });
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

  // Slim flight-suit legs + gym sneakers
  const createLeg = (x) => {
    const hip = new THREE.Group();
    hip.position.set(x, 0.72, 0);
    addPart(hip, 0.18, 0.3, 0.19, suitBlue, 0, -0.15, 0);
    addPart(hip, 0.185, 0.04, 0.195, accentMat, 0, -0.26, 0);

    const knee = new THREE.Group();
    knee.position.set(0, -0.32, 0);
    hip.add(knee);

    addPart(knee, 0.17, 0.26, 0.18, suitBlue, 0, -0.14, 0);
    addPart(knee, 0.18, 0.07, 0.23, darkMat, 0, -0.31, 0.02);
    addPart(knee, 0.185, 0.03, 0.24, whiteMat, 0, -0.36, 0.02);

    bodyGroup.add(hip);
    return { hip, knee };
  };

  const leftLeg = createLeg(-0.095);
  const rightLeg = createLeg(0.095);

  // Flight jacket torso (single textured box, no bulky armor or backpack)
  const upperBody = new THREE.Group();
  upperBody.position.set(0, 0.72, 0);
  bodyGroup.add(upperBody);

  addPart(upperBody, 0.4, 0.56, 0.22, createIvaTorsoMaterials(accentColor), 0, 0.31, 0);
  addPart(upperBody, 0.22, 0.035, 0.2, whiteMat, 0, 0.595, 0);
  addPart(upperBody, 0.12, 0.055, 0.12, skinMat, 0, 0.615, 0);

  // Slim flight-suit arms + bare hands
  const createArm = (x) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(x, 0.55, 0);
    addPart(shoulder, 0.14, 0.22, 0.14, suitBlue, 0, -0.1, 0);
    addPart(shoulder, 0.145, 0.05, 0.145, accentMat, 0, -0.12, 0);

    const elbow = new THREE.Group();
    elbow.position.set(0, -0.23, 0);
    shoulder.add(elbow);

    addPart(elbow, 0.14, 0.21, 0.14, suitBlue, 0, -0.1, 0);
    addPart(elbow, 0.145, 0.03, 0.145, whiteMat, 0, -0.21, 0);
    addPart(elbow, 0.14, 0.12, 0.14, skinMat, 0, -0.28, 0);

    upperBody.add(shoulder);
    return { shoulder, elbow };
  };

  const leftArm = createArm(-0.265);
  const rightArm = createArm(0.265);

  // Sculpted multi-part cadet head with 3D hair, 3D nose, and mission comms headset
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.63, 0);
  upperBody.add(headGroup);

  // Slightly non-cubic head silhouette + 3D nose
  addPart(headGroup, 0.31, 0.33, 0.29, createCadetHeadMaterials(), 0, 0.185, 0);
  addPart(headGroup, 0.042, 0.052, 0.03, skinShadeMat, 0, 0.155, 0.156);

  // 3D layered asymmetric hair
  addPart(headGroup, 0.33, 0.065, 0.31, hairMat, 0, 0.345, -0.008);
  addPart(headGroup, 0.16, 0.045, 0.18, hairHiMat, -0.04, 0.382, 0.02, -0.08, 0, 0.12);
  addPart(headGroup, 0.21, 0.06, 0.055, hairMat, -0.05, 0.305, 0.138, 0, 0, 0.14);
  addPart(headGroup, 0.1, 0.05, 0.05, hairMat, 0.105, 0.312, 0.136, 0, 0, -0.16);
  addPart(headGroup, 0.328, 0.24, 0.055, hairMat, 0, 0.22, -0.142);
  for (const sx of [-0.152, 0.152]) {
    addPart(headGroup, 0.042, 0.13, 0.22, hairMat, sx, 0.265, -0.02);
  }

  // Mission comms headset + boom mic
  addPart(headGroup, 0.365, 0.032, 0.055, headsetMat, 0, 0.392, -0.01);
  for (const sx of [-1, 1]) {
    addPart(headGroup, 0.03, 0.19, 0.048, headsetMat, sx * 0.175, 0.29, -0.01);
    addPart(headGroup, 0.03, 0.125, 0.125, headsetPadMat, sx * 0.165, 0.185, -0.01);
    addPart(headGroup, 0.035, 0.11, 0.11, headsetMat, sx * 0.185, 0.185, -0.01);
    addPart(headGroup, 0.016, 0.065, 0.065, accentMat, sx * 0.202, 0.185, -0.01);
  }
  addPart(headGroup, 0.018, 0.018, 0.155, headsetMat, -0.158, 0.128, 0.068, 0.16, 0.48, 0);
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
