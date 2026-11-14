import { createCropItemModel } from '../graphics/cropModels.js';
import * as THREE from 'three';
import { BLOCK_IDS, CROP_TYPES_BY_ID } from '../config/blockTypes.js';
import { BLOCK_INTERACTION_CONFIG } from '../config/constants.js';
import { makeCanvasTexture } from '../graphics/textureGenerator.js';

export class PlayerHand {
  constructor(camera, materials, carrotTexture) {
    this.camera = camera;
    this.materials = materials;
    this.carrotTexture = carrotTexture;
    this.eatTime = 0;
    this.pendingHeldBlock = null;

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
    this._buildScopeMesh();

    this.heldCrops = {};
    for (const [id, type] of Object.entries(CROP_TYPES_BY_ID)) {
      const model = createCropItemModel(type);
      model.scale.setScalar(.5); model.position.set(-.08, .14, -.22);
      model.rotation.set(.2, .4, -.3); model.visible = false;
      model.traverse(node => { node.renderOrder = 999; });
      this.handGroup.add(model); this.heldCrops[id] = model;
    }
    this.camera.add(this.handGroup);
  }

  _buildArmMesh() {
    // Textura pixelada da manga pressurizada e luva EVA do astronauta NASA
    const { texture } = makeCanvasTexture((ctx) => {
      // Manga térmica branca com costuras técnicas
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(0, 0, 16, 10);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(0, 0, 2, 10);
      ctx.fillRect(14, 0, 2, 10);
      // Faixa vermelha/laranja de comandante + anel azul de acoplamento do punho
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(0, 3, 16, 2);
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(0, 8, 16, 2);
      // Luva pressurizada EVA cinza-prata com palma aderente escura
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(0, 10, 16, 4);
      ctx.fillStyle = '#334155';
      ctx.fillRect(0, 14, 16, 2);
    });

    const armMat = new THREE.MeshLambertMaterial({
      map: texture,
      transparent: false,
      opacity: 1,
      depthTest: true,
      depthWrite: true,
    });
    const cuffMat = new THREE.MeshLambertMaterial({ color: 0x0284c7 });
    const screenCaseMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });
    const screenGlowMat = new THREE.MeshLambertMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.55,
    });
    const gloveGripMat = new THREE.MeshLambertMaterial({ color: 0x334155 });

    this.armMesh = new THREE.Group();
    this.armMesh.rotation.x = -Math.PI * 0.32;

    const sleeve = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.68, 0.24), armMat);
    sleeve.renderOrder = 999;
    this.armMesh.add(sleeve);

    // Anel metálico de pressurização do punho
    const wristRing = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.06, 0.26), cuffMat);
    wristRing.position.set(0, 0.14, 0);
    wristRing.renderOrder = 999;
    this.armMesh.add(wristRing);

    // Computador de pulso EVA no antebraço
    const wristPad = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.18, 0.05), screenCaseMat);
    wristPad.position.set(-0.02, 0.0, 0.13);
    wristPad.renderOrder = 999;
    this.armMesh.add(wristPad);

    const wristScreen = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.13, 0.02), screenGlowMat);
    wristScreen.position.set(-0.02, 0.0, 0.155);
    wristScreen.renderOrder = 999;
    this.armMesh.add(wristScreen);

    // Polegar articulado da luva espacial
    const thumb = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.12, 0.09), gloveGripMat);
    thumb.position.set(-0.13, 0.25, 0.05);
    thumb.renderOrder = 999;
    this.armMesh.add(thumb);

    this.handGroup.add(this.armMesh);
  }

  _buildHeldBlockMesh() {
    const blockGeo = new THREE.BoxGeometry(0.32, 0.32, 0.32);
    this.heldBlockMesh = new THREE.Mesh(blockGeo, this.materials[1]);
    this.heldBlockMesh.position.set(-0.08, 0.14, -0.22);
    this.heldBlockMesh.rotation.set(0.2, 0.65, 0.1);
    this.heldBlockMesh.renderOrder = 999;
    this.handGroup.add(this.heldBlockMesh);
    this.heldCarrotMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.42, 0.42),
      new THREE.MeshLambertMaterial({ map: this.carrotTexture, transparent: true, alphaTest: 0.1, side: THREE.DoubleSide })
    );
    this.heldCarrotMesh.position.set(-0.08, 0.14, -0.22);
    this.heldCarrotMesh.rotation.z = -0.5;
    this.heldCarrotMesh.renderOrder = 999;
    this.heldCarrotMesh.visible = false;
    this.handGroup.add(this.heldCarrotMesh);
  }

  _buildScopeMesh() {
    const scope = new THREE.Group();
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0x263746 });
    const metalMat = new THREE.MeshLambertMaterial({ color: 0xb8c5cc });
    const lensMat = new THREE.MeshLambertMaterial({ color: 0x38bdf8, emissive: 0x075985, emissiveIntensity: 0.5 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.09, 0.48, 8), bodyMat);
    body.rotation.x = Math.PI / 2;
    scope.add(body);
    for (const [z, radius] of [[-0.22, 0.115], [0.2, 0.105]]) {
      const ring = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 0.045, 8), metalMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.z = z;
      scope.add(ring);
    }
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.082, 8), lensMat);
    lens.position.z = -0.245;
    scope.add(lens);
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.055, 0.25), metalMat);
    rail.position.set(0, 0.11, 0);
    scope.add(rail);
    scope.position.set(-0.08, 0.14, -0.22);
    scope.rotation.set(-0.3, 0.1, 0.25);
    scope.traverse((node) => { if (node.isMesh) node.renderOrder = 999; });
    this.heldScopeMesh = scope;
    this.heldScopeMesh.visible = false;
    this.handGroup.add(scope);
  }

  // Um clone por tipo de bloco, reaproveitado (antes clonava a cada troca de slot e vazava)
  _getHandMaterial(blockId) {
    if (!this._handMaterials) this._handMaterials = {};
    if (!this._handMaterials[blockId]) {
      const baseMat = this.materials[blockId];
      if (!baseMat) return null;
      const cloned = baseMat.clone();
      cloned.depthTest = true;
      cloned.depthWrite = !cloned.transparent;
      this._handMaterials[blockId] = cloned;
    }
    return this._handMaterials[blockId];
  }

  setHeldBlock(blockId, count) {
    if (this.eatTime > 0) {
      this.pendingHeldBlock = { blockId, count };
      return;
    }
    this.heldCarrotMesh.visible = false;
    for (const model of Object.values(this.heldCrops)) model.visible = false;
    this.heldScopeMesh.visible = blockId === BLOCK_IDS.SCOPE && count > 0;
    if (this.heldScopeMesh.visible) {
      this.heldBlockMesh.visible = false;
      this.armMesh.position.set(0.08, -0.06, 0.08);
      return;
    }
    if (!blockId || count <= 0) {
      this.heldBlockMesh.visible = false;
      this.armMesh.position.set(0, 0, 0);
      return;
    }

    if (this.heldCrops[blockId]) {
      this.heldBlockMesh.visible = false;
      this.heldCrops[blockId].visible = true;
      this.armMesh.position.set(.08, -.06, .08);
      return;
    }
    if (blockId === BLOCK_IDS.HYDRO_PLANT) {
      this.heldBlockMesh.visible = false;
      this.heldCarrotMesh.visible = true;
      this.armMesh.position.set(0.08, -0.06, 0.08);
      return;
    }
    const handMat = this._getHandMaterial(blockId);
    if (handMat) {
      this.heldBlockMesh.material = handMat;
      this.heldBlockMesh.visible = true;
      this.armMesh.position.set(0.08, -0.06, 0.08);
    }
  }

  triggerEat() {
    this.eatTime = BLOCK_INTERACTION_CONFIG.EAT_ANIMATION_DURATION;
    this.isSwinging = false;
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

    if (this.eatTime > 0) {
      this.eatTime = Math.max(0, this.eatTime - dt);
      const progress = 1 - this.eatTime / BLOCK_INTERACTION_CONFIG.EAT_ANIMATION_DURATION;
      const bite = Math.sin(progress * Math.PI) * (0.7 + 0.3 * Math.sin(progress * Math.PI * 6));
      swingOffsetY += bite * 0.28;
      swingOffsetZ += bite * 0.12;
      swingRotX -= bite * 0.65;
      swingRotZ += bite * 0.35;
      if (this.eatTime === 0 && this.pendingHeldBlock) {
        const { blockId, count } = this.pendingHeldBlock;
        this.pendingHeldBlock = null;
        this.setHeldBlock(blockId, count);
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
