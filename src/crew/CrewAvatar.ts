// @ts-nocheck
import * as THREE from 'three';
import { pointAlong } from './crewRails.ts';
import { buildSpacesuitRig } from '../graphics/spacesuitModel.ts';
import { CrewInstances } from './crewInstances.ts';

const FLOOR_Y = 10; // topo do piso da base (nasaModelsBuilder: floorTopY)
const HALF_PI = Math.PI / 2;
// Para onde o tripulante olha quando esta parado em cada ponto (de frente para a estacao)
const NODE_FACING = {
  oxygen: HALF_PI,
  water: HALF_PI,
  greenhouse: -HALF_PI,
  quarters: Math.PI,
  medbay: 0,
  kitchen: HALF_PI,
};
// Cadencia da passada: sincronizada com CREW_CONFIG.WALK_SPEED (~2.2 blocos/s) para nao patinar no piso
const WALK_RATE = 6.8;
const WALK_SWING = 0.56;
const SUIT_COLOR = new THREE.Color(0xf8fafc);
const WEAK_COLOR = new THREE.Color(0xb8c0cc);

function hipWave(phase) {
  // Asymmetric stride: brisker forward leg swing, steadier planted stance sweep
  return Math.sin(phase) - 0.08 * Math.sin(2 * phase);
}

function kneeFlex(phase) {
  // Smooth two-phase bend: swing clearance before reach + gentle shock absorption after heel strike
  const swingLift = Math.pow(0.5 - 0.5 * Math.cos(phase + 0.25), 1.35);
  const landingCushion = Math.pow(0.5 - 0.5 * Math.cos(phase - 0.65 * Math.PI), 2.5);
  return 0.04 + 0.72 * swingLift + 0.14 * landingCushion;
}

function shortestAngleDiff(from, to) {
  let diff = to - from;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return diff;
}

function dampAlpha(rate, dt) {
  return dt > 0 ? 1 - Math.exp(-rate * dt) : 1;
}

// Suaviza curvas em rotas com varios trechos usando media ponderada ao redor da distancia atual.
// Em trechos retos e nas pontas (inicio/fim) retorna exatamente a posicao do trilho.
function sampleSmoothRoute(route, distance, routeLen) {
  const center = pointAlong(route, distance);
  if (!route || route.length <= 2 || routeLen <= 0.1) return center;

  const w = Math.min(0.75, distance, routeLen - distance);
  if (w <= 0.04) return center;

  const behind = pointAlong(route, distance - w);
  const ahead = pointAlong(route, distance + w);
  const x = (behind.x + center.x * 2 + ahead.x) * 0.25;
  const z = (behind.z + center.z * 2 + ahead.z) * 0.25;
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
    this._posInit = false;
    this.cutsceneControlled = false;
    this._handoff = null;
    this._headShake = null;
    this._pose = {
      bobY: 0, swayX: 0, legL: 0, legR: 0, kneeL: 0, kneeR: 0,
      armL: 0, armR: 0, elbowL: 0, elbowR: 0, armSplay: 0.06,
      torsoLean: 0, torsoTwist: 0, torsoRoll: 0, headPitch: 0, headYaw: 0,
    };
  }

  startHandoff(targetPos, duration = 1.2) {
    this._headShake = null;
    this._handoff = {
      targetX: targetPos.x,
      targetZ: targetPos.z,
      elapsed: 0,
      duration,
    };
  }

  startHeadShake(targetPos, duration = 1.0) {
    this._handoff = null;
    this._headShake = {
      targetX: targetPos.x,
      targetZ: targetPos.z,
      elapsed: 0,
      duration,
    };
  }

  getRightHandWorldPosition(out) {
    this.group.updateWorldMatrix(true, true);
    out.set(0, -0.34, 0.08);
    return this.elbowR.localToWorld(out);
  }

  get position() {
    return this.group.position;
  }

  _setWalkPose(out, phase, weight, turnBank = 0, lookAhead = 0) {
    const s = Math.sin(phase);
    const c = Math.cos(phase);
    const doubleC = Math.cos(2 * phase);
    const hipL = hipWave(phase) * WALK_SWING * weight;
    const hipR = hipWave(phase + Math.PI) * WALK_SWING * weight;

    // Joelho dobra para tras (> 0): eleva no avanco da passada e amortece a pisada
    const kneeL = kneeFlex(phase) * weight;
    const kneeR = kneeFlex(phase + Math.PI) * weight;

    // Bracos contrabalancam as pernas com atraso fluido de cotovelo (<= 0)
    const armL = -hipL * 0.84 - 0.05 * weight;
    const armR = -hipR * 0.84 - 0.05 * weight;
    const elbowFollow = Math.sin(phase - 0.4);
    const elbowL = (-0.26 - 0.28 * (0.5 + 0.5 * elbowFollow)) * weight;
    const elbowR = (-0.26 - 0.28 * (0.5 - 0.5 * elbowFollow)) * weight;

    // Arco suave de passada: mais alto na passagem da perna de apoio, assentando no toque do pe
    out.bobY = (0.004 + 0.018 * (1 + doubleC)) * weight;
    out.swayX = -0.022 * c * weight;
    out.legL = hipL;
    out.legR = hipR;
    out.kneeL = kneeL;
    out.kneeR = kneeR;
    out.armL = armL;
    out.armR = armR;
    out.elbowL = elbowL;
    out.elbowR = elbowR;
    out.armSplay = (0.075 + 0.02 * Math.sin(2 * phase)) * weight;
    out.torsoLean = (0.095 + 0.024 * doubleC) * weight;
    out.torsoTwist = s * 0.125 * weight;
    out.torsoRoll = (0.036 * c + turnBank) * weight;
    out.headPitch = (-0.045 - 0.018 * doubleC) * weight;
    out.headYaw = (-s * 0.05 + lookAhead) * weight;
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
    this.bodyGroup.position.x = p.swayX;
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
    if (this.cutsceneControlled) return;
    const m = this.member;
    this._time += dt;

    const p = sampleSmoothRoute(m.route, m.distance, m.routeLength);
    // Keep ambient walkers in separate lanes so they do not overlap at shared rail nodes.
    const lane = m.stationary ? 0 : (m.id % 2 === 0 ? -0.22 : 0.22);
    const targetX = p.x + Math.cos(p.heading) * lane;
    const targetZ = p.z - Math.sin(p.heading) * lane;
    if (!this._posInit || dt <= 0) {
      this._posInit = true;
      this.group.position.set(targetX, FLOOR_Y, targetZ);
    } else {
      const posAlpha = dampAlpha(16, dt);
      this.group.position.x += (targetX - this.group.position.x) * posAlpha;
      this.group.position.y = FLOOR_Y;
      this.group.position.z += (targetZ - this.group.position.z) * posAlpha;
    }

    let handoffWeight = 0;
    let shakeWeight = 0;
    let shakePhase = 0;
    let targetHeading = m.state === 'walking' ? p.heading : (NODE_FACING[m.node] ?? p.heading);
    const activeReaction = this._handoff ?? this._headShake;
    if (activeReaction) {
      activeReaction.elapsed += dt;
      const progress = Math.min(1, activeReaction.elapsed / activeReaction.duration);
      const dx = activeReaction.targetX - this.group.position.x;
      const dz = activeReaction.targetZ - this.group.position.z;
      if (Math.hypot(dx, dz) > 0.05) targetHeading = Math.atan2(dx, dz);
      if (activeReaction === this._handoff) {
        // Smooth bell curve: quick reach forward, steady offer, gentle return
        if (progress < 0.25) handoffWeight = Math.sin((progress / 0.25) * Math.PI * 0.5);
        else if (progress < 0.72) handoffWeight = 1;
        else handoffWeight = Math.cos(((progress - 0.72) / 0.28) * Math.PI * 0.5);
        if (progress >= 1) this._handoff = null;
      } else {
        shakeWeight = Math.sin(progress * Math.PI);
        shakePhase = progress * Math.PI * 5;
        if (progress >= 1) this._headShake = null;
      }
    }

    if (this._heading === null || dt <= 0) {
      this._heading = targetHeading;
    }
    const angleDiff = shortestAngleDiff(this._heading, targetHeading);
    this._heading += angleDiff * dampAlpha(activeReaction ? 14 : 7.5, dt);
    this.group.rotation.y = this._heading;

    // Transicao suave entre caminhar e parar (desacelera a cadencia junto com o passo)
    const targetWalk = m.state === 'walking' ? 1 : 0;
    this._walkBlend += (targetWalk - this._walkBlend) * dampAlpha(7.5, dt);
    if (this._walkBlend > 0.005) {
      this._walkPhase += dt * WALK_RATE * this._tempo * (0.35 + 0.65 * this._walkBlend);
    }

    const turnBank = THREE.MathUtils.clamp(angleDiff * 0.2, -0.11, 0.11);
    const lookAhead = THREE.MathUtils.clamp(angleDiff * 0.42, -0.35, 0.35);
    const pose = this._pose;
    this._setWalkPose(pose, this._walkPhase, this._walkBlend, turnBank, lookAhead);
    this._addIdlePose(pose, m.state, 1 - this._walkBlend);
    if (this._walkBlend > 0.02) {
      pose.headYaw += Math.sin(this._time * 1.35) * 0.065 * this._walkBlend;
    }
    if (handoffWeight > 0) {
      pose.armR = pose.armR * (1 - handoffWeight) + (-1.18) * handoffWeight;
      pose.elbowR = pose.elbowR * (1 - handoffWeight) + (-0.28) * handoffWeight;
      pose.torsoLean += 0.1 * handoffWeight;
      pose.torsoTwist += -0.16 * handoffWeight;
      pose.headPitch = pose.headPitch * (1 - handoffWeight) + 0.09 * handoffWeight;
      pose.headYaw *= (1 - handoffWeight);
    } else if (shakeWeight > 0) {
      pose.headYaw = pose.headYaw * (1 - shakeWeight) + Math.sin(shakePhase) * 0.42 * shakeWeight;
      pose.headPitch = pose.headPitch * (1 - shakeWeight) + 0.06 * shakeWeight;
      pose.elbowL = pose.elbowL * (1 - shakeWeight) + (-0.55) * shakeWeight;
      pose.elbowR = pose.elbowR * (1 - shakeWeight) + (-0.55) * shakeWeight;
      pose.armSplay += 0.08 * shakeWeight;
    }
    this._applyJoints(pose);

    const isWeak = m.state === 'weak' || m.state === 'bedridden';
    this.suitMat.color.copy(isWeak ? WEAK_COLOR : SUIT_COLOR);
    this.statusLightMat.color.setHex(isWeak ? 0xef4444 : 0x4ade80);
    this.statusLightMat.emissive.setHex(isWeak ? 0xb91c1c : 0x16a34a);
  }

  // Animacoes: poe o tripulante andando num ponto qualquer do mundo, fora dos trilhos da base.
  // O proximo update() devolve o avatar ao lugar e a pose do tripulante.
  poseWalking(x, y, z, heading, dt, overrides = null) {
    this._time += dt;
    this._walkPhase += dt * WALK_RATE * this._tempo;
    this._walkBlend = 1;
    this._heading = heading;
    this._posInit = true;
    this.group.visible = true;
    this.group.position.set(x, y, z);
    this.group.rotation.y = heading;

    this._setWalkPose(this._pose, this._walkPhase, 1, 0, 0);
    if (overrides) Object.assign(this._pose, overrides);
    this._applyJoints(this._pose);
  }

  // Animacoes: poe o tripulante parado em pose personalizada (cutscenes).
  poseStanding(x, y, z, heading, overrides = null) {
    this._walkBlend = 0;
    this._heading = heading;
    this._posInit = true;
    this.group.visible = true;
    this.group.position.set(x, y, z);
    this.group.rotation.y = heading;

    const p = this._pose;
    p.bobY = 0;
    p.swayX = 0;
    p.legL = 0;
    p.legR = 0;
    p.kneeL = 0;
    p.kneeR = 0;
    p.armL = 0;
    p.armR = 0;
    p.elbowL = -0.18;
    p.elbowR = -0.18;
    p.armSplay = 0.06;
    p.torsoLean = 0;
    p.torsoTwist = 0;
    p.torsoRoll = 0;
    p.headPitch = 0;
    p.headYaw = 0;
    if (overrides) Object.assign(p, overrides);
    this._applyJoints(p);
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
