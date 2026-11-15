import * as THREE from 'three';
import { pointAlong } from './crewRails.js';

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
// Passo de caminhada: frequencia do ciclo e amplitude do balanco das pernas
const WALK_RATE = 9;
const WALK_SWING = 0.58;
const SUIT_COLOR = new THREE.Color(0xf8fafc);
const WEAK_COLOR = new THREE.Color(0xb8c0cc);

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

// Astronauta 3D detalhado em estilo voxel NASA xEMU (capacete com visor dourado reflexivo,
// modulo peitoral DCM, mochila PLSS com cilindros de O2, juntas articuladas, luvas e botas EVA)
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

    const addPart = (parent, w, h, d, mat, x, y, z, rx = 0, ry = 0, rz = 0) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      mesh.position.set(x, y, z);
      if (rx || ry || rz) mesh.rotation.set(rx, ry, rz);
      parent.add(mesh);
      return mesh;
    };

    // Pernas articuladas no quadril (y = 0.72) com joelheira e bota espacial EVA
    const createLeg = (x) => {
      const pivot = new THREE.Group();
      pivot.position.set(x, 0.72, 0);
      // Coxa do traje pressurizado
      addPart(pivot, 0.21, 0.3, 0.22, this.suitMat, 0, -0.15, 0);
      // Anel articular do joelho + faixa da cor do tripulante
      addPart(pivot, 0.22, 0.07, 0.23, darkJoint, 0, -0.33, 0.005);
      addPart(pivot, 0.225, 0.04, 0.235, accent, 0, -0.27, 0);
      // Canela
      addPart(pivot, 0.2, 0.22, 0.21, this.suitMat, 0, -0.47, 0);
      // Bota EVA blindada (avanca levemente em +Z para formar o bico da bota)
      addPart(pivot, 0.21, 0.09, 0.27, silver, 0, -0.62, 0.025);
      addPart(pivot, 0.22, 0.06, 0.29, charcoal, 0, -0.69, 0.03);
      this.bodyGroup.add(pivot);
      return pivot;
    };

    this.legL = createLeg(-0.13);
    this.legR = createLeg(0.13);

    // Tronco superior articulado na cintura (y = 0.72)
    this.upperBody = new THREE.Group();
    this.upperBody.position.set(0, 0.72, 0);
    this.bodyGroup.add(this.upperBody);

    // Cintura pressurizada e cinto de ferramentas
    addPart(this.upperBody, 0.5, 0.09, 0.3, darkJoint, 0, 0.045, 0);
    addPart(this.upperBody, 0.14, 0.07, 0.32, silver, 0, 0.045, 0);
    // Torso principal rigido (HUT - Hard Upper Torso)
    addPart(this.upperBody, 0.52, 0.52, 0.3, this.suitMat, 0, 0.34, 0);
    // Ombreiras anatomicas e faixas de identificacao da missao
    addPart(this.upperBody, 0.58, 0.1, 0.32, this.suitMat, 0, 0.55, 0);
    addPart(this.upperBody, 0.54, 0.08, 0.315, accent, 0, 0.44, 0);
    addPart(this.upperBody, 0.12, 0.5, 0.31, accent, -0.18, 0.34, 0);
    addPart(this.upperBody, 0.12, 0.5, 0.31, accent, 0.18, 0.34, 0);
    // Anel metalico de acoplamento do pescoco
    addPart(this.upperBody, 0.34, 0.05, 0.34, darkJoint, 0, 0.62, 0);

    // Modulo Peitoral de Controle e Display (DCM) na frente (+Z)
    addPart(this.upperBody, 0.28, 0.25, 0.08, dcmMat, 0, 0.34, 0.18);
    addPart(this.upperBody, 0.06, 0.06, 0.03, this.statusLightMat, 0, 0.43, 0.225);

    // Mochila de Suporte de Vida (PLSS) detalhada nas costas (-Z)
    addPart(this.upperBody, 0.44, 0.54, 0.18, this.suitMat, 0, 0.35, -0.23);
    addPart(this.upperBody, 0.4, 0.1, 0.2, accent, 0, 0.56, -0.23);
    addPart(this.upperBody, 0.14, 0.42, 0.08, silver, -0.11, 0.33, -0.32);
    addPart(this.upperBody, 0.14, 0.42, 0.08, silver, 0.11, 0.33, -0.32);
    addPart(this.upperBody, 0.42, 0.1, 0.2, darkJoint, 0, 0.12, -0.23);
    addPart(this.upperBody, 0.08, 0.05, 0.06, this.statusLightMat, 0, 0.63, -0.23);

    // Bracos articulados no ombro com cotoveleira, computador de pulso e luvas EVA
    const createArm = (x, isLeft) => {
      const pivot = new THREE.Group();
      pivot.position.set(x, 0.54, 0);
      // Ombro e braçadeira na cor do tripulante
      addPart(pivot, 0.17, 0.22, 0.19, this.suitMat, 0, -0.1, 0);
      addPart(pivot, 0.18, 0.06, 0.2, accent, 0, -0.12, 0);
      // Junta do cotovelo
      addPart(pivot, 0.16, 0.06, 0.18, darkJoint, 0, -0.24, 0);
      // Antebraco
      addPart(pivot, 0.16, 0.19, 0.18, this.suitMat, 0, -0.36, 0);
      if (isLeft) {
        // Mini-display de telemetria no pulso esquerdo
        addPart(pivot, 0.04, 0.09, 0.1, lampMat, -0.085, -0.37, 0.02);
      }
      // Anel de punho e luva pressurizada com polegar
      addPart(pivot, 0.165, 0.04, 0.185, darkJoint, 0, -0.47, 0);
      addPart(pivot, 0.16, 0.13, 0.19, silver, 0, -0.55, 0.01);
      addPart(pivot, 0.05, 0.07, 0.07, charcoal, isLeft ? 0.07 : -0.07, -0.54, 0.06);
      this.upperBody.add(pivot);
      return pivot;
    };

    this.armL = createArm(-0.35, true);
    this.armR = createArm(0.35, false);

    // Capacete articulado no pescoco (y = 0.64 relativo a cintura)
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 0.64, 0);
    this.upperBody.add(this.headGroup);

    // Casco branco do capacete + aba superior de protecao solar
    addPart(this.headGroup, 0.44, 0.42, 0.44, this.suitMat, 0, 0.21, 0);
    addPart(this.headGroup, 0.46, 0.07, 0.46, this.suitMat, 0, 0.4, 0.01);
    addPart(this.headGroup, 0.14, 0.05, 0.38, accent, 0, 0.435, 0);
    // Visor panoramico dourado reflexivo + moldura lateral
    addPart(this.headGroup, 0.38, 0.25, 0.05, charcoal, 0, 0.22, 0.21);
    addPart(this.headGroup, 0.35, 0.22, 0.06, visorMat, 0, 0.22, 0.22);
    // Modulos auriculares, lanternas LED laterais e antena de radio
    for (const sx of [-0.23, 0.23]) {
      addPart(this.headGroup, 0.05, 0.16, 0.16, darkJoint, sx, 0.21, 0);
      addPart(this.headGroup, 0.05, 0.07, 0.1, lampMat, sx, 0.28, 0.12);
    }
    addPart(this.headGroup, 0.03, 0.18, 0.03, silver, 0.22, 0.46, -0.08);
    addPart(this.headGroup, 0.05, 0.05, 0.05, lampMat, 0.22, 0.56, -0.08);

    this.label = makeNameLabel(member.name, accentColor);
    this.label.position.y = 2.08;
    this.group.add(this.label);

    scene.add(this.group);
    this._time = Math.random() * 10;
  }

  get position() {
    return this.group.position;
  }

  update(dt) {
    const m = this.member;

    this._time += dt;
    const p = pointAlong(m.route, m.distance);
    // Keep ambient walkers in separate lanes so they do not overlap at shared rail nodes.
    const lane = m.stationary ? 0 : (m.id % 2 === 0 ? -0.22 : 0.22);
    this.group.position.set(p.x + Math.cos(p.heading) * lane, FLOOR_Y, p.z - Math.sin(p.heading) * lane);
    this.group.rotation.y = m.state === 'walking' ? p.heading : (NODE_FACING[m.node] ?? p.heading);

    let legSwing = 0;
    let armSwingL = 0;
    let armSwingR = 0;
    let torsoLean = 0;
    let torsoTwist = 0;
    let headPitch = 0;
    let headYaw = 0;
    let bobY = 0;

    if (m.state === 'walking') {
      const phase = this._time * WALK_RATE;
      legSwing = Math.sin(phase) * WALK_SWING;
      armSwingL = -legSwing * 0.78;
      armSwingR = legSwing * 0.78;
      bobY = Math.abs(Math.sin(phase)) * 0.035;
      torsoTwist = Math.sin(phase) * 0.08;
      torsoLean = 0.05;
      headYaw = Math.sin(this._time * 2.2) * 0.1;
    } else if (m.state === 'working') {
      armSwingL = -0.85 + Math.sin(this._time * 5.2) * 0.22;
      armSwingR = -0.85 + Math.cos(this._time * 5.2) * 0.22;
      torsoLean = 0.08;
      headPitch = 0.14 + Math.sin(this._time * 3) * 0.05;
      headYaw = Math.sin(this._time * 1.8) * 0.14;
    } else if (m.state === 'weak') {
      torsoLean = 0.3;
      headPitch = 0.22;
      armSwingL = -0.25;
      armSwingR = -0.25;
      bobY = -0.02;
    } else if (m.state === 'bedridden') {
      // De repouso na enfermaria: bem curvado, cabeca baixa, respiracao lenta
      torsoLean = 0.55;
      headPitch = 0.4;
      armSwingL = -0.45;
      armSwingR = -0.45;
      bobY = -0.05 + Math.sin(this._time * 1.2) * 0.008;
    } else {
      // Descansando / em espera: respiracao sutil e olhar calmo ao redor
      bobY = Math.sin(this._time * 2.4) * 0.012;
      armSwingL = Math.sin(this._time * 1.8) * 0.04;
      armSwingR = -armSwingL;
      headYaw = Math.sin(this._time * 1.1) * 0.18;
    }

    this.bodyGroup.position.y = bobY;
    this.legL.rotation.x = legSwing;
    this.legR.rotation.x = -legSwing;
    this.armL.rotation.x = armSwingL;
    this.armR.rotation.x = armSwingR;
    this.upperBody.rotation.x = torsoLean;
    this.upperBody.rotation.y = torsoTwist;
    this.headGroup.rotation.x = headPitch;
    this.headGroup.rotation.y = headYaw;

    const isWeak = m.state === 'weak' || m.state === 'bedridden';
    this.suitMat.color.copy(isWeak ? WEAK_COLOR : SUIT_COLOR);
    this.statusLightMat.color.setHex(isWeak ? 0xef4444 : 0x4ade80);
    this.statusLightMat.emissive.setHex(isWeak ? 0xb91c1c : 0x16a34a);
  }

  // Animacoes: poe o tripulante andando num ponto qualquer do mundo, fora dos trilhos da base.
  // O proximo update() devolve o avatar ao lugar e a pose do tripulante.
  poseWalking(x, y, z, heading, dt) {
    this._time += dt;
    this.group.visible = true;
    this.group.position.set(x, y, z);
    this.group.rotation.y = heading;

    const phase = this._time * WALK_RATE;
    const legSwing = Math.sin(phase) * WALK_SWING;
    this.bodyGroup.position.y = Math.abs(Math.sin(phase)) * 0.035;
    this.legL.rotation.x = legSwing;
    this.legR.rotation.x = -legSwing;
    this.armL.rotation.x = -legSwing * 0.78;
    this.armR.rotation.x = legSwing * 0.78;
    this.upperBody.rotation.x = 0.05;
    this.upperBody.rotation.y = Math.sin(phase) * 0.08;
    this.headGroup.rotation.x = 0;
    this.headGroup.rotation.y = 0;
  }

  // Animacoes: o tripulante saiu de cena (entrou no foguete). O proximo update() o traz de volta.
  hide() {
    this.group.visible = false;
  }

  dispose() {
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
