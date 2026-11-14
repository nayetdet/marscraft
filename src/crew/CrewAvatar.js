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
const SUIT_COLOR = new THREE.Color(0xf1f5f9);
const WEAK_COLOR = new THREE.Color(0x8a8f96);

function makeNameLabel(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.fillRect(0, 0, 128, 32);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 64, 17);
  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthWrite: false }));
  sprite.scale.set(0.9, 0.225, 1);
  return sprite;
}

// Boneco voxel de traje espacial que segue os trilhos (sem colisao com o mundo)
export class CrewAvatar {
  constructor(scene, member, accentColor) {
    this.member = member;
    this.group = new THREE.Group();
    this.suitMat = new THREE.MeshLambertMaterial({ color: SUIT_COLOR.clone() });
    const accent = new THREE.MeshLambertMaterial({ color: accentColor });
    const visor = new THREE.MeshLambertMaterial({ color: 0xd4a017, emissive: 0x3b2a00 });

    const box = (w, h, d, mat, x, y, z) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      mesh.position.set(x, y, z);
      this.group.add(mesh);
      return mesh;
    };
    // Pernas e bracos giram a partir do quadril/ombro: o pivo e um grupo
    const limb = (w, h, d, x, y) => {
      const pivot = new THREE.Group();
      pivot.position.set(x, y, 0);
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), this.suitMat);
      mesh.position.y = -h / 2;
      pivot.add(mesh);
      this.group.add(pivot);
      return pivot;
    };

    this.legL = limb(0.22, 0.7, 0.24, -0.13, 0.7);
    this.legR = limb(0.22, 0.7, 0.24, 0.13, 0.7);
    box(0.56, 0.62, 0.32, this.suitMat, 0, 1.0, 0); // tronco
    box(0.58, 0.12, 0.34, accent, 0, 1.12, 0); // faixa na cor do tripulante
    box(0.38, 0.42, 0.22, accent, 0, 1.02, -0.27); // mochila de suporte de vida
    this.armL = limb(0.16, 0.6, 0.2, -0.37, 1.28);
    this.armR = limb(0.16, 0.6, 0.2, 0.37, 1.28);
    box(0.44, 0.42, 0.44, this.suitMat, 0, 1.53, 0); // capacete
    box(0.34, 0.22, 0.06, visor, 0, 1.55, 0.22); // visor dourado (frente = +z)

    this.label = makeNameLabel(member.name);
    this.label.position.y = 2.0;
    this.group.add(this.label);

    scene.add(this.group);
    this._time = Math.random() * 10;
  }

  get position() {
    return this.group.position;
  }

  update(dt) {
    const m = this.member;
    this.group.visible = m.state !== 'evacuated';
    if (!this.group.visible) return;

    this._time += dt;
    const p = pointAlong(m.route, m.distance);
    this.group.position.set(p.x, FLOOR_Y, p.z);
    this.group.rotation.y = m.state === 'walking' ? p.heading : (NODE_FACING[m.node] ?? p.heading);

    let legSwing = 0;
    let armSwing = 0;
    let lean = 0;
    if (m.state === 'walking') {
      legSwing = Math.sin(this._time * 9) * 0.6;
      armSwing = -legSwing * 0.8;
    } else if (m.state === 'working') {
      armSwing = -0.9 + Math.sin(this._time * 5) * 0.25; // bracos a frente, mexendo na estacao
    } else if (m.state === 'weak') {
      lean = 0.35; // curvado de cansaco
    }
    this.legL.rotation.x = legSwing;
    this.legR.rotation.x = -legSwing;
    this.armL.rotation.x = m.state === 'working' ? armSwing : -armSwing;
    this.armR.rotation.x = armSwing;
    this.group.rotation.x = lean;
    this.suitMat.color.copy(m.state === 'weak' ? WEAK_COLOR : SUIT_COLOR);
  }

  dispose() {
    this.group.removeFromParent();
    this.group.traverse((obj) => {
      obj.geometry?.dispose();
      obj.material?.map?.dispose();
      obj.material?.dispose();
    });
  }
}
