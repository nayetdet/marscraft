import * as THREE from 'three';
import { MISSION_CONFIG as C, STATION_CONFIG, WORLD_CONFIG } from '../config/constants.js';

export class Airlock {
  constructor(scene, colliders, mission) {
    this.mission = mission;
    this.colliders = colliders;
    // Ciclo como na vida real (ver docs/data/airlock-e-poeira.md): a porta so abre depois que o
    // airlock chega a pressao certa. Para sair, o ar e bombeado para fora; para entrar, o airlock
    // enche de ar e, se o traje estiver sujo, a poeira e limpa (eletrostatica, gasta energia).
    // Sem energia a porta nunca tranca: o ciclo roda no modo manual, com uma etapa a mais
    // (girar a manivela), e o traje sujo entra sem limpeza (issue #79).
    this.pending = null; // porta que vai abrir no fim do ciclo
    this.steps = [];
    this.stepIndex = 0;
    this.stepTime = 0;
    this.pressurized = true; // o airlock comeca com ar, do lado da base
    this.manual = false; // ciclo atual (ou o ultimo) aberto na manivela, sem energia
    this.cleanNeeded = false;
    this.cleanPossible = true;
    this.stations = null; // StationSystem, ligado pelo GameEngine (traje sujo e limpeza)
    this.onEvent = null; // Emits door and suit-cleaning events.
    // () => texto ou null, ligado pelo GameEngine: com texto, a porta externa nao abre para quem
    // esta do lado da base (dose acima do limite, issue #104). Quem esta la fora sempre entra.
    this.exitBlock = null;
    this.survival = null;
    this.previousPlayerZ = null;
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
    // Sliding leaves retract into wall pockets. Clip the moving panels to the
    // doorway so their thin geometry cannot emerge through adjacent voxel walls.
    const pocketPlanes = [
      new THREE.Plane(new THREE.Vector3(1, 0, 0), 1),
      new THREE.Plane(new THREE.Vector3(-1, 0, 0), 2),
    ];
    const panelMaterials = [material, dark, amber].map(base => {
      const panelMaterial = base.clone();
      panelMaterial.clippingPlanes = pocketPlanes;
      panelMaterial.clipShadows = true;
      return panelMaterial;
    });
    const [panelMetal, panelDark, panelAmber] = panelMaterials;
    const left = new THREE.Group(), right = new THREE.Group();
    group.add(left, right);
    for (const [panel, x] of [[left, -0.72], [right, 0.72]]) {
      box(panel, 1.42, 2.9, 0.22, x, 1.45, 0, panelMetal);
      box(panel, 1.15, 0.18, 0.26, x, 0.38, 0, panelAmber);
      box(panel, 1.1, 0.15, 0.26, x, 2.4, 0, panelDark);
      box(panel, 0.48, 0.48, 0.26, x, 1.65, 0, panelDark);
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
      door.target = 0;
      this.onEvent?.('door-close');
      return 'Closing airlock door.';
    }
    if (door.name === 'outer' && player.z < door.z) {
      if (this.survival && !this.survival.suitEquipped) return 'Equip EVA Suit at Suitport [F] before exiting.';
      const blocked = this.exitBlock?.();
      if (blocked) return blocked;
    }
    const other = this.doors.find(d => d !== door);
    if (other.openness > 0 && Math.abs(player.z - other.z) < 0.8 && player.x > -1.4 && player.x < 2.4) return 'Move clear of the other door.';
    // Bateria vazia: o ciclo nao e pago, e a porta abre na manivela (mais devagar)
    this.manual = !this.mission.spend(C.AIRLOCK_COST);
    if (other.target !== 0) this.onEvent?.('door-close');
    other.target = 0;
    this.pending = door;
    this.stepIndex = 0;
    this.stepTime = 0;
    const toInside = door.name === 'inner';
    const inChamber = player.z > this.doors[0].z && player.z < this.doors[1].z;
    this.steps = ['close'];
    if (toInside && !this.pressurized) this.steps.push('pressurize');
    if (!toInside && this.pressurized) this.steps.push('depressurize');
    if (toInside && inChamber) this.steps.push('clean');
    if (this.manual) this.steps.push('manual');
    this._startStep();
    if (this.manual) return 'No power: opening the airlock by hand. It takes longer.';
    return toInside ? 'Opening airlock: filling it with air first.' : 'Opening airlock: pumping the air out first.';
  }

  // Estado do ciclo para o HUD (null quando parado)
  status() {
    if (!this.pending) return null;
    const step = this.steps[this.stepIndex];
    const duration = this._stepDuration(step);
    const stepFill = step === 'close' ? 1 - this.doors.find(d => d !== this.pending).openness : Math.min(1, this.stepTime / Math.max(0.01, duration));
    return {
      step,
      stepIndex: this.stepIndex,
      stepCount: this.steps.length,
      fill: (this.stepIndex + stepFill) / this.steps.length,
      cleanNeeded: this.cleanNeeded,
      cleanPossible: this.cleanPossible,
      manual: this.manual,
    };
  }

  _stepDuration(step) {
    if (step === 'pressurize' || step === 'depressurize') return C.AIRLOCK_CYCLE;
    if (step === 'manual') return C.AIRLOCK_MANUAL_EXTRA_SECONDS;
    if (step === 'clean') {
      if (!this.cleanNeeded) return 0;
      return this.cleanPossible ? C.SUIT_CLEAN_TIME : C.SUIT_CLEAN_SKIP_TIME;
    }
    return 0;
  }

  _startStep() {
    const step = this.steps[this.stepIndex];
    if (step === 'depressurize') this.onEvent?.('depressurize');
    if (step === 'manual') this.onEvent?.('manual-open');
    if (step !== 'clean') return;
    this.cleanNeeded = Boolean(this.stations?.dirtySuit);
    this.cleanPossible = this.mission.energy >= STATION_CONFIG.DECONTAMINATION_COST;
  }

  _finishStep(step) {
    if (step === 'pressurize') this.pressurized = true;
    if (step === 'depressurize') this.pressurized = false;
    if (step === 'clean' && this.cleanNeeded) {
      // cleanSuit() gasta a energia e limpa; devolve outro texto se faltar energia no ultimo instante
      const cleaned = this.cleanPossible && Boolean(this.stations?.dirtySuit) && this.stations.cleanSuit().startsWith('Electrostatic');
      if (cleaned && this.survival) this.survival.suitDust = 0;
      this.onEvent?.(cleaned ? 'suit-cleaned' : 'clean-skipped');
    }
  }

  _advance(dt) {
    const step = this.steps[this.stepIndex];
    if (step === 'close') {
      if (this.doors.some((door) => door.openness > 0)) return;
    } else {
      this.stepTime += dt;
      if (this.stepTime < this._stepDuration(step)) return;
    }
    this._finishStep(step);
    this.stepIndex += 1;
    this.stepTime = 0;
    if (this.stepIndex >= this.steps.length) {
      this.pending.target = 1;
      this.onEvent?.('door-open');
      this.pending = null;
      this.steps = [];
      return;
    }
    this._startStep();
  }

  update(dt, player) {
    if (this.survival && this.previousPlayerZ !== null && this.previousPlayerZ >= this.doors[0].z && player.z < this.doors[0].z && player.x > -1 && player.x < 2 && this.pressurized) {
      this.survival.suitEquipped = false;
    }
    this.previousPlayerZ = player.z;
    if (this.pending) this._advance(dt);
    const step = this.pending ? this.steps[this.stepIndex] : null;
    this.vapor.visible = step === 'pressurize' || step === 'depressurize' || (step === 'clean' && this.cleanNeeded);
    if (this.vapor.visible) {
      this.vaporTime = (this.vaporTime ?? 0) + dt;
      for (const particle of this.vapor.children) {
        const phase = (particle.userData.phase + this.vaporTime * 0.6) % 1;
        particle.position.set(0.5 + Math.sin(particle.userData.phase * 37) * phase * 1.2, 10.4 + phase * 1.8, 7.45 + Math.cos(particle.userData.phase * 29) * phase * 0.7);
        particle.scale.setScalar(0.5 + phase);
      }
    }
    for (const d of this.doors) {
      if (d.target === 0 && d.openness > 0 && Math.abs(player.z - d.z) < 0.55 && player.x > -1.4 && player.x < 2.4) continue;
      d.openness = THREE.MathUtils.clamp(d.openness + Math.sign(d.target - d.openness) * C.DOOR_SPEED * dt, 0, 1);
      d.left.position.x = -d.openness * 1.5;
      d.right.position.x = d.openness * 1.5;
      d.indicator.material.color.setHex(this.pending ? 0xffb52e : d.openness === 1 ? 0x4eea80 : 0xe34434);
      const shouldBeSolid = d.openness < 0.95;
      if (shouldBeSolid !== d.solid) {
        if (shouldBeSolid) this.colliders.push(d.collider);
        else { const index = this.colliders.indexOf(d.collider); if (index >= 0) this.colliders.splice(index, 1); }
        d.solid = shouldBeSolid;
      }
    }
  }
}
