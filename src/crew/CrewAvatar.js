import * as THREE from 'three';
import { pointAlong } from './crewRails.js';
import { CrewInstances } from './crewInstances.js';

const FLOOR_Y = 10; // topo do piso da base (nasaModelsBuilder: floorTopY)
const HALF_PI = Math.PI / 2;
// Para onde o tripulante olha quando esta parado em cada ponto (de frente para a estacao)
const NODE_FACING = {
  oxygen: HALF_PI,
  water: HALF_PI,
  greenhouse: -HALF_PI,
  quarters: Math.PI,
  medbay: 0,
};
// Cadencia da passada: sincronizada com CREW_CONFIG.WALK_SPEED (~2.2 blocos/s) para nao patinar no piso
const WALK_RATE = 6.8;
const WALK_SWING = 0.54;
const SUIT_COLOR = new THREE.Color(0xf8fafc);
const WEAK_COLOR = new THREE.Color(0xb8c0cc);

function shortestAngleDiff(from, to) {
  let diff = to - from;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return diff;
}

function dampAlpha(rate, dt) {
  return dt > 0 ? 1 - Math.exp(-rate * dt) : 1;
}

// Suaviza curvas em rotas com varios trechos usando media de 3 pontos ao redor da distancia atual.
// Em trechos retos e nas pontas (inicio/fim) retorna exatamente a posicao do trilho.
function sampleSmoothRoute(route, distance, routeLen) {
  const center = pointAlong(route, distance);
  if (!route || route.length <= 2 || routeLen <= 0.1) return center;

  const w = Math.min(0.45, distance, routeLen - distance);
  if (w <= 0.04) return center;

  const behind = pointAlong(route, distance - w);
  const ahead = pointAlong(route, distance + w);
  const x = (behind.x + center.x + ahead.x) / 3;
  const z = (behind.z + center.z + ahead.z) / 3;
  const dx = ahead.x - behind.x;
  const dz = ahead.z - behind.z;
  const heading = Math.hypot(dx, dz) > 1e-4 ? Math.atan2(dx, dz) : center.heading;
  return { x, z, heading };
}

function createVisorTexture() {
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

function createChestDcmTexture() {
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

function makeNameLabel(text, accentColor) {
  if (typeof document === 'undefined') {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ depthWrite: false }));
    sprite.scale.set(1.05, 0.24, 1);
    return sprite;
  }
  const canvas = document.createElement('canvas');
  canvas.width = 192;
  canvas.height = 44;
  const ctx = canvas.getContext('2d');
  const hex = `#${new THREE.Color(accentColor).getHexString()}`;

  // Placa HUD escura com borda chanfrada e faixa da cor do especialista
  ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
  ctx.fillRect(2, 2, 188, 40);
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.7)';
  ctx.lineWidth = 2;
  ctx.strokeRect(3, 3, 186, 38);

  ctx.fillStyle = hex;
  ctx.fillRect(4, 4, 8, 36);

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 22px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text.toUpperCase(), 100, 23);

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthWrite: false }));
  sprite.scale.set(1.05, 0.24, 1);
  return sprite;
}

// Astronauta 3D detalhado em estilo voxel NASA xEMU com joelhos, cotovelos, cintura e cabeca articulados.
export class CrewAvatar {
  constructor(scene, member, accentColor) {
    this.member = member;
    this.group = new THREE.Group();
    this.bodyGroup = new THREE.Group();
    this.group.add(this.bodyGroup);

    this.suitMat = new THREE.MeshLambertMaterial({ color: SUIT_COLOR.clone() });
    const accent = new THREE.MeshLambertMaterial({ color: accentColor });
    const darkJoint = new THREE.MeshLambertMaterial({ color: 0x334155 });
    const charcoal = new THREE.MeshLambertMaterial({ color: 0x1e293b });
    const silver = new THREE.MeshLambertMaterial({ color: 0xcbd5e1 });
    const lampMat = new THREE.MeshLambertMaterial({
      color: 0x7dd3fc,
      emissive: 0x0284c7,
      emissiveIntensity: 0.55,
    });
    this.statusLightMat = new THREE.MeshLambertMaterial({
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

    // Caixas de cor lisa e as lampadas do traje nao sao Mesh: sao nos vazios (a escala guarda o
    // tamanho da caixa) desenhados todos juntos por CrewInstances. So as pecas com textura ou com
    // cor que muda por tripulante (visor, painel do peito, luz de estado) continuam Mesh.
    const instanced = new Set([this.suitMat, accent, darkJoint, charcoal, silver, lampMat]);
    const parts = [];
    const addPart = (parent, w, h, d, mat, x, y, z, rx = 0, ry = 0, rz = 0) => {
      let part;
      if (instanced.has(mat)) {
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
      addPart(hip, 0.21, 0.3, 0.22, this.suitMat, 0, -0.15, 0);
      addPart(hip, 0.225, 0.04, 0.235, accent, 0, -0.27, 0);

      const knee = new THREE.Group();
      knee.position.set(0, -0.32, 0);
      hip.add(knee);

      addPart(knee, 0.22, 0.07, 0.23, darkJoint, 0, -0.01, 0.005);
      addPart(knee, 0.2, 0.22, 0.21, this.suitMat, 0, -0.15, 0);
      addPart(knee, 0.21, 0.09, 0.27, silver, 0, -0.30, 0.025);
      addPart(knee, 0.22, 0.06, 0.29, charcoal, 0, -0.37, 0.03);

      this.bodyGroup.add(hip);
      return { hip, knee };
    };

    const leftLeg = createLeg(-0.13);
    const rightLeg = createLeg(0.13);
    this.legL = leftLeg.hip;
    this.legR = rightLeg.hip;
    this.kneeL = leftLeg.knee;
    this.kneeR = rightLeg.knee;

    // Tronco superior articulado na cintura (y = 0.72)
    this.upperBody = new THREE.Group();
    this.upperBody.position.set(0, 0.72, 0);
    this.bodyGroup.add(this.upperBody);

    addPart(this.upperBody, 0.5, 0.09, 0.3, darkJoint, 0, 0.045, 0);
    addPart(this.upperBody, 0.14, 0.07, 0.32, silver, 0, 0.045, 0);
    addPart(this.upperBody, 0.52, 0.52, 0.3, this.suitMat, 0, 0.34, 0);
    addPart(this.upperBody, 0.58, 0.1, 0.32, this.suitMat, 0, 0.55, 0);
    addPart(this.upperBody, 0.54, 0.08, 0.315, accent, 0, 0.44, 0);
    addPart(this.upperBody, 0.12, 0.5, 0.31, accent, -0.18, 0.34, 0);
    addPart(this.upperBody, 0.12, 0.5, 0.31, accent, 0.18, 0.34, 0);
    addPart(this.upperBody, 0.34, 0.05, 0.34, darkJoint, 0, 0.62, 0);

    // Modulo Peitoral de Controle e Display (DCM) na frente (+Z)
    addPart(this.upperBody, 0.28, 0.25, 0.08, dcmMat, 0, 0.34, 0.18);
    addPart(this.upperBody, 0.06, 0.06, 0.03, this.statusLightMat, 0, 0.43, 0.225);

    // Mochila de Suporte de Vida (PLSS) nas costas (-Z)
    addPart(this.upperBody, 0.44, 0.54, 0.18, this.suitMat, 0, 0.35, -0.23);
    addPart(this.upperBody, 0.4, 0.1, 0.2, accent, 0, 0.56, -0.23);
    addPart(this.upperBody, 0.14, 0.42, 0.08, silver, -0.11, 0.33, -0.32);
    addPart(this.upperBody, 0.14, 0.42, 0.08, silver, 0.11, 0.33, -0.32);
    addPart(this.upperBody, 0.42, 0.1, 0.2, darkJoint, 0, 0.12, -0.23);
    addPart(this.upperBody, 0.08, 0.05, 0.06, this.statusLightMat, 0, 0.63, -0.23);

    // Bracos articulados no ombro e no cotovelo (y = -0.23 relativo ao ombro)
    const createArm = (x, isLeft) => {
      const shoulder = new THREE.Group();
      shoulder.position.set(x, 0.54, 0);
      addPart(shoulder, 0.17, 0.22, 0.19, this.suitMat, 0, -0.1, 0);
      addPart(shoulder, 0.18, 0.06, 0.2, accent, 0, -0.12, 0);

      const elbow = new THREE.Group();
      elbow.position.set(0, -0.23, 0);
      shoulder.add(elbow);

      addPart(elbow, 0.16, 0.06, 0.18, darkJoint, 0, -0.01, 0);
      addPart(elbow, 0.16, 0.19, 0.18, this.suitMat, 0, -0.13, 0);
      if (isLeft) {
        addPart(elbow, 0.04, 0.09, 0.1, lampMat, -0.085, -0.14, 0.02);
      }
      addPart(elbow, 0.165, 0.04, 0.185, darkJoint, 0, -0.24, 0);
      addPart(elbow, 0.16, 0.13, 0.19, silver, 0, -0.32, 0.01);
      addPart(elbow, 0.05, 0.07, 0.07, charcoal, isLeft ? 0.07 : -0.07, -0.31, 0.06);

      this.upperBody.add(shoulder);
      return { shoulder, elbow };
    };

    const leftArm = createArm(-0.35, true);
    const rightArm = createArm(0.35, false);
    this.armL = leftArm.shoulder;
    this.armR = rightArm.shoulder;
    this.elbowL = leftArm.elbow;
    this.elbowR = rightArm.elbow;

    // Capacete articulado no pescoco (y = 0.64 relativo a cintura)
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 0.64, 0);
    this.upperBody.add(this.headGroup);

    addPart(this.headGroup, 0.44, 0.42, 0.44, this.suitMat, 0, 0.21, 0);
    addPart(this.headGroup, 0.46, 0.07, 0.46, this.suitMat, 0, 0.4, 0.01);
    addPart(this.headGroup, 0.14, 0.05, 0.38, accent, 0, 0.435, 0);
    addPart(this.headGroup, 0.38, 0.25, 0.05, charcoal, 0, 0.22, 0.21);
    addPart(this.headGroup, 0.35, 0.22, 0.06, visorMat, 0, 0.22, 0.22);
    for (const sx of [-0.23, 0.23]) {
      addPart(this.headGroup, 0.05, 0.16, 0.16, darkJoint, sx, 0.21, 0);
      addPart(this.headGroup, 0.05, 0.07, 0.1, lampMat, sx, 0.28, 0.12);
    }
    addPart(this.headGroup, 0.03, 0.18, 0.03, silver, 0.22, 0.46, -0.08);
    addPart(this.headGroup, 0.05, 0.05, 0.05, lampMat, 0.22, 0.56, -0.08);

    this.label = makeNameLabel(member.name, accentColor);
    this.label.position.y = 2.08;
    this.group.add(this.label);

    // Sombra do modo Shaders: uma caixa do tamanho do corpo faz a sombra no lugar das dezenas de
    // pecas do traje. Nao aparece na imagem (so escreve no mapa de sombra) e fica desligada
    // enquanto o modo Shaders estiver desligado (ShaderMode cuida disso).
    const shadowProxy = new THREE.Mesh(
      new THREE.BoxGeometry(0.62, 1.78, 0.44),
      new THREE.MeshLambertMaterial({ colorWrite: false, depthWrite: false })
    );
    shadowProxy.position.y = 0.92;
    shadowProxy.visible = false;
    shadowProxy.userData.shadowProxy = true;
    this.group.userData.hasShadowProxy = true;
    this.group.add(shadowProxy);

    scene.add(this.group);
    this._instances = CrewInstances.for(scene);
    this._suit = { group: this.group, parts };
    this._instances.add(this._suit);
    this._time = (member.id * 1.37) % 10;
    this._walkPhase = (member.id * 1.9) % (Math.PI * 2);
    this._tempo = 0.94 + (member.id % 3) * 0.05;
    this._walkBlend = member.state === 'walking' ? 1 : 0;
    this._heading = null;
    this._pose = {
      bobY: 0, legL: 0, legR: 0, kneeL: 0, kneeR: 0,
      armL: 0, armR: 0, elbowL: 0, elbowR: 0, armSplay: 0.06,
      torsoLean: 0, torsoTwist: 0, torsoRoll: 0, headPitch: 0, headYaw: 0,
    };
  }

  get position() {
    return this.group.position;
  }

  _setWalkPose(out, phase, weight, turnBank = 0) {
    const s = Math.sin(phase);
    const hipL = s * WALK_SWING * weight;
    const hipR = -hipL;

    // Joelho dobra somente para tras (> 0) durante o avanco da passada e na impulsionada do pe
    const kneeL = (0.08 + 0.64 * Math.max(0, -Math.cos(phase - 0.35))) * weight;
    const kneeR = (0.08 + 0.64 * Math.max(0, -Math.cos(phase + Math.PI - 0.35))) * weight;

    // Bracos balancam opostos as pernas com cotovelo flexionado para frente (< 0)
    const armL = -hipL * 0.74;
    const armR = -hipR * 0.74;
    const elbowL = (-0.34 - s * 0.22) * weight;
    const elbowR = (-0.34 + s * 0.22) * weight;

    out.bobY = Math.abs(s) * 0.044 * weight;
    out.legL = hipL;
    out.legR = hipR;
    out.kneeL = kneeL;
    out.kneeR = kneeR;
    out.armL = armL;
    out.armR = armR;
    out.elbowL = elbowL;
    out.elbowR = elbowR;
    out.armSplay = 0.06 * weight;
    out.torsoLean = 0.085 * weight;
    out.torsoTwist = -s * 0.11 * weight;
    out.torsoRoll = (s * 0.032 + turnBank) * weight;
    out.headPitch = -0.03 * weight;
    out.headYaw = s * 0.055 * weight;
  }

  _addIdlePose(out, state, idleW) {
    if (idleW <= 1e-4) return;
    if (state === 'working') {
      const workT = this._time * 3.6;
      out.bobY += Math.sin(this._time * 2.2) * 0.008 * idleW;
      out.legL += 0.03 * idleW;
      out.legR += -0.03 * idleW;
      out.kneeL += 0.06 * idleW;
      out.kneeR += 0.06 * idleW;
      out.armL += (-0.48 + Math.sin(workT) * 0.14) * idleW;
      out.armR += (-0.48 + Math.cos(workT * 1.1) * 0.14) * idleW;
      out.elbowL += (-0.78 + Math.cos(workT) * 0.18) * idleW;
      out.elbowR += (-0.78 + Math.sin(workT * 1.1) * 0.18) * idleW;
      out.armSplay += 0.08 * idleW;
      out.torsoLean += 0.09 * idleW;
      out.torsoTwist += Math.sin(this._time * 1.5) * 0.07 * idleW;
      out.torsoRoll += Math.sin(this._time * 1.1) * 0.02 * idleW;
      out.headPitch += (0.12 + Math.sin(this._time * 2.4) * 0.04) * idleW;
      out.headYaw += Math.sin(this._time * 1.4) * 0.18 * idleW;
    } else if (state === 'weak') {
      out.bobY += (-0.025 + Math.sin(this._time * 1.8) * 0.006) * idleW;
      out.legL += -0.04 * idleW;
      out.legR += 0.04 * idleW;
      out.kneeL += 0.14 * idleW;
      out.kneeR += 0.14 * idleW;
      out.armL += -0.18 * idleW;
      out.armR += -0.18 * idleW;
      out.elbowL += -0.25 * idleW;
      out.elbowR += -0.25 * idleW;
      out.armSplay += 0.05 * idleW;
      out.torsoLean += 0.28 * idleW;
      out.torsoRoll += Math.sin(this._time * 1.2) * 0.02 * idleW;
      out.headPitch += 0.22 * idleW;
      out.headYaw += Math.sin(this._time * 0.9) * 0.08 * idleW;
    } else if (state === 'bedridden') {
      out.bobY += (-0.05 + Math.sin(this._time * 1.2) * 0.008) * idleW;
      out.legL += -0.06 * idleW;
      out.legR += -0.06 * idleW;
      out.kneeL += 0.18 * idleW;
      out.kneeR += 0.18 * idleW;
      out.armL += -0.35 * idleW;
      out.armR += -0.35 * idleW;
      out.elbowL += -0.35 * idleW;
      out.elbowR += -0.35 * idleW;
      out.armSplay += 0.05 * idleW;
      out.torsoLean += 0.55 * idleW;
      out.headPitch += 0.4 * idleW;
    } else {
      // Descansando: respiracao natural, leve balanco de peso e checagem ocasional do visor de pulso
      const wristCycle = Math.max(0, Math.sin(this._time * 0.7 - 0.6));
      const wristPeek = Math.pow(wristCycle, 6);
      out.bobY += Math.sin(this._time * 2.1) * 0.011 * idleW;
      out.legL += 0.02 * idleW;
      out.legR += -0.02 * idleW;
      out.kneeL += 0.05 * idleW;
      out.kneeR += 0.05 * idleW;
      out.armL += (-0.04 - wristPeek * 0.62 + Math.sin(this._time * 1.4) * 0.03) * idleW;
      out.armR += (0.04 - Math.sin(this._time * 1.4) * 0.03) * idleW;
      out.elbowL += (-0.22 - wristPeek * 0.85) * idleW;
      out.elbowR += -0.22 * idleW;
      out.armSplay += 0.07 * idleW;
      out.torsoLean += (0.02 + wristPeek * 0.05) * idleW;
      out.torsoTwist += (Math.sin(this._time * 0.8) * 0.04 - wristPeek * 0.12) * idleW;
      out.torsoRoll += Math.sin(this._time * 0.9) * 0.025 * idleW;
      out.headPitch += (wristPeek * 0.26 + Math.sin(this._time * 1.2) * 0.03) * idleW;
      out.headYaw += (Math.sin(this._time * 0.95) * 0.22 + wristPeek * 0.22) * idleW;
    }
  }

  _applyJoints(p) {
    this.bodyGroup.position.y = p.bobY;
    this.legL.rotation.x = p.legL;
    this.legR.rotation.x = p.legR;
    this.kneeL.rotation.x = p.kneeL;
    this.kneeR.rotation.x = p.kneeR;

    this.armL.rotation.x = p.armL;
    this.armR.rotation.x = p.armR;
    this.armL.rotation.z = -p.armSplay;
    this.armR.rotation.z = p.armSplay;
    this.elbowL.rotation.x = p.elbowL;
    this.elbowR.rotation.x = p.elbowR;

    this.upperBody.rotation.x = p.torsoLean;
    this.upperBody.rotation.y = p.torsoTwist;
    this.upperBody.rotation.z = p.torsoRoll;
    this.headGroup.rotation.x = p.headPitch;
    this.headGroup.rotation.y = p.headYaw;
  }

  update(dt) {
    const m = this.member;
    this._time += dt;

    const p = sampleSmoothRoute(m.route, m.distance, m.routeLength);
    // Keep ambient walkers in separate lanes so they do not overlap at shared rail nodes.
    const lane = m.stationary ? 0 : (m.id % 2 === 0 ? -0.22 : 0.22);
    this.group.position.set(p.x + Math.cos(p.heading) * lane, FLOOR_Y, p.z - Math.sin(p.heading) * lane);

    const targetHeading = m.state === 'walking' ? p.heading : (NODE_FACING[m.node] ?? p.heading);
    if (this._heading === null || dt <= 0) {
      this._heading = targetHeading;
    }
    const angleDiff = shortestAngleDiff(this._heading, targetHeading);
    this._heading += angleDiff * dampAlpha(7.5, dt);
    this.group.rotation.y = this._heading;

    // Transicao suave entre caminhar e parar (evita estalo brusco das pernas)
    const targetWalk = m.state === 'walking' ? 1 : 0;
    this._walkBlend += (targetWalk - this._walkBlend) * dampAlpha(10, dt);
    if (this._walkBlend > 0.01) {
      this._walkPhase += dt * WALK_RATE * this._tempo;
    }

    const turnBank = THREE.MathUtils.clamp(angleDiff * 0.16, -0.09, 0.09);
    const pose = this._pose;
    this._setWalkPose(pose, this._walkPhase, this._walkBlend, turnBank);
    this._addIdlePose(pose, m.state, 1 - this._walkBlend);
    if (this._walkBlend > 0.02) {
      pose.headYaw += Math.sin(this._time * 1.9) * 0.08 * this._walkBlend;
    }
    this._applyJoints(pose);

    const isWeak = m.state === 'weak' || m.state === 'bedridden';
    this.suitMat.color.copy(isWeak ? WEAK_COLOR : SUIT_COLOR);
    this.statusLightMat.color.setHex(isWeak ? 0xef4444 : 0x4ade80);
    this.statusLightMat.emissive.setHex(isWeak ? 0xb91c1c : 0x16a34a);
  }

  // Animacoes: poe o tripulante andando num ponto qualquer do mundo, fora dos trilhos da base.
  // O proximo update() devolve o avatar ao lugar e a pose do tripulante.
  poseWalking(x, y, z, heading, dt) {
    this._time += dt;
    this._walkPhase += dt * WALK_RATE * this._tempo;
    this._walkBlend = 1;
    this._heading = heading;
    this.group.visible = true;
    this.group.position.set(x, y, z);
    this.group.rotation.y = heading;

    this._setWalkPose(this._pose, this._walkPhase, 1, 0);
    this._applyJoints(this._pose);
  }

  // Animacoes: o tripulante saiu de cena (entrou no foguete). O proximo update() o traz de volta.
  hide() {
    this.group.visible = false;
  }

  dispose() {
    this._instances.remove(this._suit);
    this.group.removeFromParent();
    const materials = new Set();
    this.group.traverse((obj) => {
      obj.geometry?.dispose();
      if (obj.material) materials.add(obj.material);
    });
    for (const mat of materials) {
      mat.map?.dispose();
      mat.dispose();
    }
  }
}
