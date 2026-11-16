import * as THREE from 'three';
import { SAMPLE_SITE_CONFIG } from '../config/constants.ts';
import { sampleTypeById } from '../data/sampleTypes.ts';
import type { SampleSite } from './sampleSites.ts';

// Desenha as amostras do mapa (issue #270): em cada local, um montinho de pedras na cor do tipo
// e um facho de luz fino que pulsa, para a crianca achar de longe. Tudo com instancing: 2 draw
// calls para todos os locais (um para as pedras, um para os fachos). Amostra coletada some.

const PIECES_PER_SITE = 3;
// Montinho: [dx, dz, tamanho, altura relativa] de cada pedra, em blocos
const PIECES: [number, number, number, number][] = [
  [0, 0, 0.42, 0.7],
  [0.34, 0.12, 0.26, 0.8],
  [-0.2, 0.3, 0.2, 0.9],
];
const BEACON_WIDTH = 0.16;
const PULSE_SPEED = 2.4; // rad/s
const BEACON_OPACITY = 0.32;
const BEACON_PULSE = 0.18;

export class SampleSiteMarkers {
  readonly group = new THREE.Group();
  readonly sites: SampleSite[];
  private collected = new Set<string>();
  private rocks: THREE.InstancedMesh;
  private beacons: THREE.InstancedMesh;
  private beaconMaterial: THREE.MeshBasicMaterial;
  private dummy = new THREE.Object3D();

  constructor(sites: SampleSite[]) {
    this.sites = sites;
    const height = SAMPLE_SITE_CONFIG.BEACON_HEIGHT;

    this.rocks = new THREE.InstancedMesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshLambertMaterial({ flatShading: true }),
      sites.length * PIECES_PER_SITE,
    );
    this.beaconMaterial = new THREE.MeshBasicMaterial({
      transparent: true, opacity: BEACON_OPACITY, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    });
    this.beacons = new THREE.InstancedMesh(new THREE.BoxGeometry(BEACON_WIDTH, height, BEACON_WIDTH), this.beaconMaterial, sites.length);

    const color = new THREE.Color();
    sites.forEach((site, i) => {
      const type = sampleTypeById(site.typeId);
      this.placeSite(i, 1);
      color.setHex(type?.color ?? 0xffffff);
      for (let p = 0; p < PIECES_PER_SITE; p += 1) this.rocks.setColorAt(i * PIECES_PER_SITE + p, color);
      this.beacons.setColorAt(i, color.setHex(type?.glow ?? 0xffffff));
    });
    for (const mesh of [this.rocks, this.beacons]) {
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.computeBoundingSphere();
    }
    this.rocks.name = 'sample-site-rocks';
    this.beacons.name = 'sample-site-beacons';
    this.beacons.renderOrder = 2;
    this.group.add(this.rocks, this.beacons);
  }

  // Posiciona (scale = 1) ou esconde (scale = 0) as pecas de um local
  private placeSite(index: number, scale: number): void {
    const site = this.sites[index];
    const cx = site.x + 0.5;
    const cz = site.z + 0.5;
    PIECES.forEach(([dx, dz, size, squash], p) => {
      this.dummy.position.set(cx + dx, site.y + (size * squash) / 2 - 0.04, cz + dz);
      this.dummy.rotation.set(0, (index + p) * 0.9, 0);
      this.dummy.scale.set(size * scale, size * squash * scale, size * scale);
      this.dummy.updateMatrix();
      this.rocks.setMatrixAt(index * PIECES_PER_SITE + p, this.dummy.matrix);
    });
    this.dummy.position.set(cx, site.y + 0.5 + SAMPLE_SITE_CONFIG.BEACON_HEIGHT / 2, cz);
    this.dummy.rotation.set(0, 0, 0);
    this.dummy.scale.setScalar(scale);
    this.dummy.updateMatrix();
    this.beacons.setMatrixAt(index, this.dummy.matrix);
  }

  isCollected(siteId: string): boolean {
    return this.collected.has(siteId);
  }

  get remaining(): number {
    return this.sites.length - this.collected.size;
  }

  // Bounds cover the rock pile only, not its tall decorative beacon.
  scanBoxes() {
    return this.sites.filter((site) => !this.collected.has(site.id)).map((site) => ({
      scanId: site.typeId, siteId: site.id,
      minX: site.x + 0.05, maxX: site.x + 1.05,
      minY: site.y - 0.04, maxY: site.y + 0.35,
      minZ: site.z + 0.05, maxZ: site.z + 0.95,
    }));
  }

  collect(siteId: string): void {
    const index = this.sites.findIndex((site) => site.id === siteId);
    if (index < 0 || this.collected.has(siteId)) return;
    this.collected.add(siteId);
    this.placeSite(index, 0);
    this.rocks.instanceMatrix.needsUpdate = true;
    this.beacons.instanceMatrix.needsUpdate = true;
  }

  // O facho pulsa devagar. `seconds` = relogio do jogo em segundos reais.
  update(seconds: number): void {
    this.beaconMaterial.opacity = BEACON_OPACITY + BEACON_PULSE * Math.sin(seconds * PULSE_SPEED);
  }
}
