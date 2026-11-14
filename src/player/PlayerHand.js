import * as THREE from 'three';
import { makeCanvasTexture } from '../graphics/textureGenerator.js';

export class PlayerHand {
  constructor(camera, materials) {
    this.camera = camera;
    this.materials = materials;

    this.handGroup = new THREE.Group();
    this.basePos = new THREE.Vector3(0.56, -0.46, -0.72);
    this.baseRot = new THREE.Euler(0.35, -0.45, -0.22);

    this.handGroup.position.copy(this.basePos);
    this.handGroup.rotation.copy(this.baseRot);

    this.walkTime = 0;
    this.swingProgress = 0;
    this.isSwinging = false;

    this._buildArmMesh();
    this._buildHeldBlockMesh();

    this.camera.add(this.handGroup);
  }

  _buildArmMesh() {
    // Textura pixelada do braço/mão do jogador (estilo Minecraft com manga de astronauta)
    const { texture } = makeCanvasTexture((ctx) => {
      // Manga do traje (branco/cinza com faixa laranja)
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(0, 0, 16, 10);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(0, 7, 16, 2);
      // Mão / Luva na ponta
      ctx.fillStyle = '#d6a17c';
      ctx.fillRect(0, 10, 16, 6);
      ctx.fillStyle = '#b8825e';
      ctx.fillRect(0, 14, 16, 2);
    });

    const armGeo = new THREE.BoxGeometry(0.24, 0.68, 0.24);
    const armMat = new THREE.MeshLambertMaterial({
      map: texture,
      transparent: false,
      opacity: 1,
      depthTest: true,
      depthWrite: true,
    });

    this.armMesh = new THREE.Mesh(armGeo, armMat);
    this.armMesh.renderOrder = 999;
    this.armMesh.rotation.x = -Math.PI * 0.32;
    this.handGroup.add(this.armMesh);
  }

  _buildHeldBlockMesh() {
    const blockGeo = new THREE.BoxGeometry(0.32, 0.32, 0.32);
    this.heldBlockMesh = new THREE.Mesh(blockGeo, this.materials[1]);
    this.heldBlockMesh.position.set(-0.08, 0.14, -0.22);
    this.heldBlockMesh.rotation.set(0.2, 0.65, 0.1);
    this.heldBlockMesh.renderOrder = 999;
    this.handGroup.add(this.heldBlockMesh);
  }

  setHeldBlock(blockId, count) {
    if (!blockId || count <= 0) {
      this.heldBlockMesh.visible = false;
      this.armMesh.position.set(0, 0, 0);
      return;
    }

    const baseMat = this.materials[blockId];
    if (baseMat) {
      const cloned = baseMat.clone();
      // Keep opaque held items solid; preserve transparency for glass blocks.
      cloned.depthTest = true;
      cloned.depthWrite = !cloned.transparent;
      this.heldBlockMesh.material = cloned;
      this.heldBlockMesh.visible = true;
      this.armMesh.position.set(0.08, -0.06, 0.08);
    }
  }

  triggerSwing() {
    this.isSwinging = true;
    this.swingProgress = 0;
  }

  update(dt, isMoving) {
    if (isMoving) {
      this.walkTime += dt * 9.5;
    } else {
      this.walkTime += dt * 1.8;
    }

    const bobX = isMoving ? Math.cos(this.walkTime) * 0.035 : Math.cos(this.walkTime) * 0.006;
    const bobY = isMoving
      ? Math.abs(Math.sin(this.walkTime)) * 0.045
      : Math.sin(this.walkTime) * 0.008;

    let swingRotX = 0;
    let swingRotZ = 0;
    let swingOffsetZ = 0;
    let swingOffsetY = 0;

    if (this.isSwinging) {
      this.swingProgress += dt * 5.8;
      if (this.swingProgress >= 1) {
        this.swingProgress = 0;
        this.isSwinging = false;
      } else {
        const s = Math.sin(this.swingProgress * Math.PI);
        swingRotX = -s * 0.95;
        swingRotZ = s * 0.35;
        swingOffsetZ = -s * 0.18;
        swingOffsetY = -s * 0.08;
      }
    }

    this.handGroup.position.set(
      this.basePos.x + bobX,
      this.basePos.y - bobY + swingOffsetY,
      this.basePos.z + swingOffsetZ
    );

    this.handGroup.rotation.set(
      this.baseRot.x + swingRotX,
      this.baseRot.y,
      this.baseRot.z + swingRotZ
    );
  }
}
