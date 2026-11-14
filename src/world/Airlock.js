import * as THREE from 'three';
import { MISSION_CONFIG as C, WORLD_CONFIG } from '../config/constants.js';

export class Airlock {
  constructor(scene, colliders, mission) {
    this.mission = mission;
    this.colliders = colliders;
    this.cycle = 0;
    this.pending = null;
    this.doors = [this.makeDoor(scene, 6.15, 'inner'), this.makeDoor(scene, 8.85, 'outer')];
    this.vapor = new THREE.Group();
    const vaporMaterial = new THREE.MeshBasicMaterial({ color: 0xbfe2ed, transparent: true, opacity: 0.5, depthWrite: false });
    const geometry = new THREE.BoxGeometry(0.13, 0.13, 0.13);
    for (let i = 0; i < 16; i++) {
      const particle = new THREE.Mesh(geometry, vaporMaterial);
      particle.userData.phase = i / 16;
      this.vapor.add(particle);
    }
    this.vapor.visible = false;
    scene.add(this.vapor);
  }
  makeDoor(scene, z, name) {
    const group = new THREE.Group();
    group.position.set(0.5, WORLD_CONFIG.GROUND_LEVEL + 2, z);
    const material = new THREE.MeshLambertMaterial({ color: 0xb9c8cd });
    const dark = new THREE.MeshLambertMaterial({ color: 0x334657 });
    const amber = new THREE.MeshLambertMaterial({ color: 0xe2ad3b });
    const lamp = new THREE.MeshLambertMaterial({ color: 0xe34434, emissive: 0x661100 });
    const box = (parent, w, h, d, x, y, zz, mat) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, zz); parent.add(m); return m; };
    const left = new THREE.Group(), right = new THREE.Group();
    group.add(left, right);
    for (const [panel, x] of [[left, -0.72], [right, 0.72]]) {
      box(panel, 1.42, 2.9, 0.22, x, 1.45, 0, material);
      box(panel, 1.15, 0.18, 0.26, x, 0.38, 0, amber);
      box(panel, 1.1, 0.15, 0.26, x, 2.4, 0, dark);
      box(panel, 0.48, 0.48, 0.26, x, 1.65, 0, dark);
    }
    box(group, 3.1, 0.18, 0.35, 0, 2.95, 0, dark);
    const indicator = box(group, 0.35, 0.15, 0.38, 0, 2.95, 0, lamp);
    scene.add(group);
    const collider = { minX: -1, maxX: 2, minY: group.position.y, maxY: group.position.y + 3, minZ: z - 0.16, maxZ: z + 0.16 };
    this.colliders.push(collider);
    return { group, left, right, indicator, collider, z, name, openness: 0, target: 0, solid: true };
  }
  request(door, player) {
    if (this.pending) return 'Airlock cycling. Please wait.';
    if (door.target === 1) {
      if (Math.abs(player.z - door.z) < 0.8 && player.x > -1.4 && player.x < 2.4) return 'Move clear of the door.';
      door.target = 0; return 'Closing airlock door.';
    }
    const other = this.doors.find(d => d !== door);
    if (other.openness > 0 && Math.abs(player.z - other.z) < 0.8 && player.x > -1.4 && player.x < 2.4) return 'Move clear of the other door.';
    if (!this.mission.spend(C.AIRLOCK_COST)) return 'Not enough energy for the airlock.';
    this.cycle = C.AIRLOCK_CYCLE;
    other.target = 0;
    if (other.openness === 0) {
      door.target = 1;
      return 'Opening airlock door.';
    }
    this.pending = door;
    return 'Closing the other airlock door first.';
  }
  update(dt, player) {
    this.vapor.visible = this.cycle > 0;
    if (this.vapor.visible) {
      const time = C.AIRLOCK_CYCLE - this.cycle;
      for (const particle of this.vapor.children) {
        const phase = (particle.userData.phase + time * 0.6) % 1;
        particle.position.set(0.5 + Math.sin(particle.userData.phase * 37) * phase * 1.2, 10.4 + phase * 1.8, 7.45 + Math.cos(particle.userData.phase * 29) * phase * 0.7);
        particle.scale.setScalar(0.5 + phase);
      }
      this.cycle = Math.max(0, this.cycle - dt);
    }
    if (this.pending && this.doors.every(d => d === this.pending || d.openness === 0)) {
      this.pending.target = 1;
      this.pending = null;
    }
    for (const d of this.doors) {
      if (d.target === 0 && d.openness > 0 && Math.abs(player.z - d.z) < 0.55 && player.x > -1.4 && player.x < 2.4) continue;
      d.openness = THREE.MathUtils.clamp(d.openness + Math.sign(d.target - d.openness) * C.DOOR_SPEED * dt, 0, 1);
      d.left.position.x = -d.openness * 1.5;
      d.right.position.x = d.openness * 1.5;
      d.indicator.material.color.setHex(this.cycle ? 0xffb52e : d.openness === 1 ? 0x4eea80 : 0xe34434);
      const shouldBeSolid = d.openness < 0.95;
      if (shouldBeSolid !== d.solid) {
        if (shouldBeSolid) this.colliders.push(d.collider);
        else { const index = this.colliders.indexOf(d.collider); if (index >= 0) this.colliders.splice(index, 1); }
        d.solid = shouldBeSolid;
      }
    }
  }
}
