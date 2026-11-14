import * as THREE from 'three';

// Seta amarela que flutua no mundo, em cima do lugar do objetivo atual. Ela sobe e desce,
// gira devagar e cresce com a distancia, para dar para ver de longe.
const NEAR_DISTANCE = 12; // ate aqui a seta tem o tamanho normal
const MAX_SCALE = 4.5;

export class WaypointBeacon {
  constructor(scene) {
    this.group = new THREE.Group();
    const yellow = new THREE.MeshBasicMaterial({ color: 0xffcf3a, fog: false });
    const dark = new THREE.MeshBasicMaterial({ color: 0x4a3200, fog: false });

    // Ponta (piramide de 4 lados virada para baixo) com a haste em cima
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.8, 4), yellow);
    tip.rotation.x = Math.PI;
    tip.position.y = 0.4;
    const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.7, 0.28), yellow);
    shaft.position.y = 1.15;
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.1, 0.34), dark);
    cap.position.y = 1.55;
    this.group.add(tip, shaft, cap);

    this.group.visible = false;
    this.time = 0;
    scene.add(this.group);
  }

  // target: { x, y, z } (a ponta da seta fica um pouco acima desse ponto) ou null
  update(dt, target, viewerPos) {
    if (!target) {
      this.group.visible = false;
      return;
    }
    this.time += dt;
    const distance = Math.hypot(target.x - viewerPos.x, target.y - viewerPos.y, target.z - viewerPos.z);
    const scale = Math.min(MAX_SCALE, Math.max(1, distance / NEAR_DISTANCE));
    this.group.visible = true;
    this.group.scale.setScalar(scale);
    this.group.position.set(target.x, target.y + 0.35 + Math.sin(this.time * 3.2) * 0.22 * scale, target.z);
    this.group.rotation.y = this.time * 1.4;
  }

  hide() {
    this.group.visible = false;
  }
}
