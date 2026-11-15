import * as THREE from 'three';
import { pointAlong } from './crewRails.js';
import { buildSpacesuitRig } from '../graphics/spacesuitModel.js';
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
    const rig = buildSpacesuitRig({ accentColor, suitColor: SUIT_COLOR.clone(), instanced: true });
    this.bodyGroup = rig.bodyGroup;
    this.suitMat = rig.suitMat;
    this.statusLightMat = rig.statusLightMat;
    this.legL = rig.legL;
    this.legR = rig.legR;
    this.kneeL = rig.kneeL;
    this.kneeR = rig.kneeR;
    this.upperBody = rig.upperBody;
    this.armL = rig.armL;
    this.armR = rig.armR;
    this.elbowL = rig.elbowL;
    this.elbowR = rig.elbowR;
    this.headGroup = rig.headGroup;
    this.group.add(this.bodyGroup);

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
    this._suit = { group: this.group, parts: rig.parts };
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
