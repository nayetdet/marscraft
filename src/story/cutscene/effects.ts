// @ts-nocheck
import * as THREE from 'three';

// Efeitos das animacoes: chama do motor e nuvens de poeira/fumaca. Tudo em caixas (estilo voxel)
// e sem luzes novas, para nao forcar a recompilacao dos shaders da cena.

// Chama que sai para baixo a partir da origem do grupo. `setPower(0..1, tempo)` a cada frame.
export class EngineFlame {
  constructor() {
    this.group = new THREE.Group();
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    geometry.translate(0, -0.5, 0); // o topo fica na origem e a chama cresce para baixo
    this.outer = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({ color: 0xff7a1a, transparent: true, opacity: 0.85, fog: false, depthWrite: false })
    );
    this.inner = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({ color: 0xfff2a8, transparent: true, opacity: 0.95, fog: false, depthWrite: false })
    );
    this.group.add(this.outer, this.inner);
    this.width = 1;
    this.length = 4;
    this.group.visible = false;
  }

  setSize(width, length) {
    this.width = width;
    this.length = length;
  }

  setPower(power, time) {
    if (power <= 0.01) {
      this.group.visible = false;
      return;
    }
    this.group.visible = true;
    const flicker = 1 + 0.16 * Math.sin(time * 43) + 0.09 * Math.sin(time * 71 + 1.3);
    const length = this.length * power * flicker;
    const width = this.width * (0.75 + 0.25 * power);
    this.outer.scale.set(width, length, width);
    this.inner.scale.set(width * 0.5, length * 0.62, width * 0.5);
  }
}

const _matrix = new THREE.Matrix4();

// Nuvem de particulas cubicas em um unico InstancedMesh (um draw call).
// Cada particula nasce pequena, cresce enquanto perde velocidade e encolhe no fim da vida.
export class ParticlePuffs {
  constructor(scene, { count = 96, color = 0xc98a5a } = {}) {
    this.count = count;
    this.material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.72, depthWrite: false });
    this.mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), this.material, count);
    this.mesh.frustumCulled = false;
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(this.mesh);

    // x, y, z, vx, vy, vz, vida, vida maxima, tamanho
    this.data = new Float32Array(count * 9);
    this.next = 0;
    this.alive = 0;
    this._emitDebt = 0;
    this._hideAll();
  }

  setColor(color) {
    this.material.color.setHex(color);
  }

  spawn(x, y, z, vx, vy, vz, life, size) {
    const o = this.next * 9;
    this.next = (this.next + 1) % this.count;
    const d = this.data;
    d[o] = x; d[o + 1] = y; d[o + 2] = z;
    d[o + 3] = vx; d[o + 4] = vy; d[o + 5] = vz;
    d[o + 6] = life; d[o + 7] = life; d[o + 8] = size;
  }

  // Anel de poeira que se abre no chao (toque da capsula no solo)
  burstRing(x, y, z, amount, speed) {
    for (let i = 0; i < amount; i++) {
      const angle = (i / amount) * Math.PI * 2 + Math.random() * 0.4;
      const s = speed * (0.55 + Math.random() * 0.7);
      this.spawn(
        x + Math.cos(angle) * 1.6, y + 0.3, z + Math.sin(angle) * 1.6,
        Math.cos(angle) * s, 0.5 + Math.random() * 1.6, Math.sin(angle) * s,
        1.6 + Math.random() * 1.2, 0.9 + Math.random() * 0.9
      );
    }
  }

  // Jato continuo: `rate` particulas por segundo saindo de (x, y, z) para os lados e para cima
  emit(dt, rate, x, y, z, spread, rise) {
    this._emitDebt += dt * rate;
    while (this._emitDebt >= 1) {
      this._emitDebt -= 1;
      const angle = Math.random() * Math.PI * 2;
      const s = spread * (0.4 + Math.random() * 0.8);
      this.spawn(
        x + Math.cos(angle) * 0.8, y, z + Math.sin(angle) * 0.8,
        Math.cos(angle) * s, rise * (0.3 + Math.random()), Math.sin(angle) * s,
        1.4 + Math.random() * 1.4, 0.8 + Math.random() * 1.1
      );
    }
  }

  update(dt) {
    const d = this.data;
    const drag = Math.max(0, 1 - 1.6 * dt);
    let alive = 0;
    for (let i = 0; i < this.count; i++) {
      const o = i * 9;
      if (d[o + 6] <= 0) continue;
      d[o + 6] -= dt;
      if (d[o + 6] <= 0) {
        _matrix.makeScale(0, 0, 0);
        this.mesh.setMatrixAt(i, _matrix);
        continue;
      }
      alive++;
      d[o] += d[o + 3] * dt;
      d[o + 1] += d[o + 4] * dt;
      d[o + 2] += d[o + 5] * dt;
      d[o + 3] *= drag;
      d[o + 5] *= drag;
      const age = 1 - d[o + 6] / d[o + 7]; // 0 ao nascer, 1 ao morrer
      const fade = Math.min(1, (1 - age) / 0.3);
      const scale = d[o + 8] * (0.45 + 1.5 * age) * fade;
      _matrix.makeScale(scale, scale, scale).setPosition(d[o], d[o + 1], d[o + 2]);
      this.mesh.setMatrixAt(i, _matrix);
    }
    if (alive > 0 || this.alive > 0) this.mesh.instanceMatrix.needsUpdate = true;
    this.alive = alive;
    this.mesh.visible = alive > 0;
  }

  clear() {
    this.data.fill(0);
    this._emitDebt = 0;
    this.alive = 0;
    this._hideAll();
  }

  _hideAll() {
    _matrix.makeScale(0, 0, 0);
    for (let i = 0; i < this.count; i++) this.mesh.setMatrixAt(i, _matrix);
    this.mesh.instanceMatrix.needsUpdate = true;
    this.mesh.visible = false;
  }
}
