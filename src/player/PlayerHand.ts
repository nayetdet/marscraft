// @ts-nocheck
import { createCropItemModel } from '../graphics/cropModels.ts';
import { createSpaceRationModel } from '../graphics/rationModel.ts';
import * as THREE from 'three';
import { BLOCK_IDS, CROP_TYPES_BY_ID } from '../config/blockTypes.ts';
import { BLOCK_INTERACTION_CONFIG, DUST_WEATHER_CONFIG } from '../config/constants.ts';
import { makeCanvasTexture } from '../graphics/textureGenerator.ts';

export class PlayerHand {
  constructor(camera, materials, carrotTexture) {
    this.camera = camera;
    this.materials = materials;
    this.carrotTexture = carrotTexture;
    this.eatTime = 0;
    this.cleanTime = 0;
    this.receiveTime = 0;
    this.pendingHeldBlock = null;
    this._currentHeld = { blockId: null, count: 0 };

    this.handGroup = new THREE.Group();
    this.basePos = new THREE.Vector3(0.56, -0.46, -0.72);
    this.baseRot = new THREE.Euler(0.35, -0.45, -0.22);

    this.handGroup.position.copy(this.basePos);
    this.handGroup.rotation.copy(this.baseRot);

    this.walkTime = 0;
    this.swingProgress = 0;
    this.isSwinging = false;
    this.suitEquipped = true;
    this.suitUpgraded = false;
    this._suitAnimMode = null; // 'equip' | 'dock' | null
    this._suitAnimTime = 0;

    this._buildArmMesh();
    this._buildSuitAnimProps();
    this._buildHeldBlockMesh();
    this._buildScopeMesh();
    this._buildShieldRemoteMesh();
    this._buildJournalMesh();
    this._buildBrushMesh();

    this.heldRationMesh = createSpaceRationModel();
    this.heldRationMesh.scale.setScalar(0.36);
    this.heldRationMesh.position.set(-0.08, 0.15, -0.22);
    this.heldRationMesh.rotation.set(0.2, 0.45, -0.18);
    this.heldRationMesh.visible = false;
    this.heldRationMesh.traverse((node) => { node.renderOrder = 999; });
    this.handGroup.add(this.heldRationMesh);

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

    // Sleek navy flight suit sleeve for inside the pressurized habitat (IVA)
    const { texture: ivaTexture } = makeCanvasTexture((ctx) => {
      ctx.fillStyle = '#1e3a5f';
      ctx.fillRect(0, 0, 16, 10);
      ctx.fillStyle = '#2563eb';
      ctx.fillRect(0, 0, 2, 10);
      ctx.fillRect(14, 0, 2, 10);
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(0, 4, 16, 2);
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(0, 9, 16, 1);
      // Natural hand inside the habitat
      ctx.fillStyle = '#eab696';
      ctx.fillRect(0, 10, 16, 6);
      ctx.fillStyle = '#d49a79';
      ctx.fillRect(0, 14, 16, 2);
    });

    this.evaArmMat = new THREE.MeshLambertMaterial({
      map: texture,
      transparent: false,
      opacity: 1,
      depthTest: true,
      depthWrite: true,
    });
    this.ivaArmMat = new THREE.MeshLambertMaterial({
      map: ivaTexture,
      transparent: false,
      opacity: 1,
      depthTest: true,
      depthWrite: true,
    });
    const cuffMat = new THREE.MeshLambertMaterial({ color: 0x0284c7 });
    const screenCaseMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });
    this.wristScreenMat = new THREE.MeshLambertMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.55,
    });
    this.ivaThumbMat = new THREE.MeshLambertMaterial({ color: 0xd49a79 });
    this.evaThumbMat = new THREE.MeshLambertMaterial({ color: 0x334155 });
    const upgradeGoldMat = new THREE.MeshLambertMaterial({
      color: 0xf59e0b,
      emissive: 0x78350f,
      emissiveIntensity: 0.25,
    });

    this.armMesh = new THREE.Group();
    this.armMesh.rotation.x = -Math.PI * 0.32;

    this.sleeveMesh = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.68, 0.24), this.evaArmMat);
    this.sleeveMesh.renderOrder = 999;
    this.armMesh.add(this.sleeveMesh);

    // Anel metálico de pressurização do punho
    this.wristRingMesh = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.06, 0.26), cuffMat);
    this.wristRingMesh.position.set(0, 0.14, 0);
    this.wristRingMesh.renderOrder = 999;
    this.armMesh.add(this.wristRingMesh);

    // Computador de pulso EVA no antebraço
    this.wristPadMesh = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.18, 0.05), screenCaseMat);
    this.wristPadMesh.position.set(-0.02, 0.0, 0.13);
    this.wristPadMesh.renderOrder = 999;
    this.armMesh.add(this.wristPadMesh);

    this.wristScreenMesh = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.13, 0.02), this.wristScreenMat);
    this.wristScreenMesh.position.set(-0.02, 0.0, 0.155);
    this.wristScreenMesh.renderOrder = 999;
    this.armMesh.add(this.wristScreenMesh);

    // Gold radiation-shield trim visible when the EVA suit is upgraded
    this.upgradeArmPlate = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.07, 0.26), upgradeGoldMat);
    this.upgradeArmPlate.position.set(0, -0.06, 0);
    this.upgradeArmPlate.renderOrder = 999;
    this.upgradeArmPlate.visible = false;
    this.armMesh.add(this.upgradeArmPlate);

    // Polegar articulado da luva espacial
    this.thumbMesh = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.12, 0.09), this.evaThumbMat);
    this.thumbMesh.position.set(-0.13, 0.25, 0.05);
    this.thumbMesh.renderOrder = 999;
    this.armMesh.add(this.thumbMesh);

    this.handGroup.add(this.armMesh);
  }

  _buildSuitAnimProps() {
    // Left EVA arm shown briefly while sealing/unsealing the helmet in 1st person
    this.leftArmGroup = new THREE.Group();
    this.leftArmGroup.visible = false;
    const leftArm = new THREE.Group();
    leftArm.rotation.x = -Math.PI * 0.32;
    const lSleeve = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.68, 0.24), this.evaArmMat);
    lSleeve.renderOrder = 999;
    leftArm.add(lSleeve);
    const lRing = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.06, 0.26), new THREE.MeshLambertMaterial({ color: 0x0284c7 }));
    lRing.position.set(0, 0.14, 0);
    lRing.renderOrder = 999;
    leftArm.add(lRing);
    const lThumb = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.12, 0.09), this.evaThumbMat);
    lThumb.position.set(0.13, 0.25, 0.05);
    lThumb.renderOrder = 999;
    leftArm.add(lThumb);
    this.leftArmGroup.add(leftArm);
    this.camera.add(this.leftArmGroup);

    // 3D voxel EVA helmet shell that drops smoothly over the camera during suit-up
    this.helmetGroup = new THREE.Group();
    this.helmetGroup.visible = false;
    const whiteMat = new THREE.MeshLambertMaterial({ color: 0xf8fafc, depthTest: false });
    const crestMat = new THREE.MeshLambertMaterial({ color: 0xea580c, depthTest: false });
    const darkMat = new THREE.MeshLambertMaterial({ color: 0x1e293b, depthTest: false });
    const lampMat = new THREE.MeshLambertMaterial({
      color: 0x7dd3fc,
      emissive: 0x0284c7,
      emissiveIntensity: 0.75,
      depthTest: false,
    });
    const visorRimMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.28,
      depthTest: false,
    });

    const addHelmetPart = (w, h, d, mat, x, y, z) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      mesh.position.set(x, y, z);
      mesh.renderOrder = 1002;
      this.helmetGroup.add(mesh);
      return mesh;
    };

    // Upper brow shell, commander crest, side ear pods with headlamps, and subtle visor edge
    addHelmetPart(0.84, 0.16, 0.34, whiteMat, 0, 0.28, -0.45);
    addHelmetPart(0.2, 0.05, 0.36, crestMat, 0, 0.37, -0.45);
    addHelmetPart(0.86, 0.05, 0.1, darkMat, 0, 0.19, -0.34);
    addHelmetPart(0.82, 0.08, 0.03, visorRimMat, 0, 0.14, -0.34);
    for (const sx of [-0.43, 0.43]) {
      addHelmetPart(0.08, 0.24, 0.22, darkMat, sx, 0.14, -0.42);
      addHelmetPart(0.09, 0.07, 0.09, lampMat, sx, 0.22, -0.34);
    }

    this.camera.add(this.helmetGroup);
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

  // Controle do escudo de radiacao: caixinha com antena, tela e botao vermelho
  _buildShieldRemoteMesh() {
    const remote = new THREE.Group();
    const caseMat = new THREE.MeshLambertMaterial({ color: 0xb8c5cc });
    const screenMat = new THREE.MeshLambertMaterial({ color: 0x38bdf8, emissive: 0x075985, emissiveIntensity: 0.5 });
    const buttonMat = new THREE.MeshLambertMaterial({ color: 0xef4444, emissive: 0x7f1d1d, emissiveIntensity: 0.4 });
    const antennaMat = new THREE.MeshLambertMaterial({ color: 0xd4a017 });
    remote.add(new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.06, 0.26), caseMat));
    const screen = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.012, 0.08), screenMat);
    screen.position.set(0, 0.034, -0.06);
    remote.add(screen);
    const button = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.02, 0.06), buttonMat);
    button.position.set(0, 0.038, 0.05);
    remote.add(button);
    const antenna = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 0.14), antennaMat);
    antenna.position.set(0.05, 0.02, -0.19);
    remote.add(antenna);
    remote.position.set(-0.06, 0.12, -0.2);
    remote.rotation.set(0.5, 0.1, 0.2);
    remote.traverse((node) => { if (node.isMesh) node.renderOrder = 999; });
    this.heldShieldRemoteMesh = remote;
    this.heldShieldRemoteMesh.visible = false;
    this.handGroup.add(remote);
  }

  _buildJournalMesh() {
    const book = new THREE.Group();
    const part = (w, h, d, color, x, y, z) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color }));
      mesh.position.set(x, y, z);
      mesh.renderOrder = 999;
      book.add(mesh);
    };
    part(0.32, 0.42, 0.08, 0x152b30, 0, 0, 0);
    part(0.27, 0.37, 0.085, 0x0e2329, 0.02, 0, 0);
    part(0.07, 0.42, 0.1, 0x0284c7, -0.13, 0, 0);
    part(0.11, 0.11, 0.012, 0xea580c, 0.03, 0.03, 0.05);
    part(0.18, 0.03, 0.014, 0xfacc15, 0.03, 0.03, 0.05);
    book.position.set(-0.08, 0.14, -0.22);
    book.rotation.set(-0.3, 0.1, 0.25);
    book.visible = false;
    this.heldJournalMesh = book;
    this.handGroup.add(book);
  }

  // Escova eletrostatica usada para varrer a poeira dos paineis solares em 1a pessoa
  _buildBrushMesh() {
    const brush = new THREE.Group();
    const handleMat = new THREE.MeshLambertMaterial({ color: 0xf1f5f9 });
    const gripMat = new THREE.MeshLambertMaterial({ color: 0xea580c });
    const mountMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });
    const stripMat = new THREE.MeshLambertMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.45,
    });
    const bristleMat = new THREE.MeshLambertMaterial({ color: 0x64748b });
    const addPart = (w, h, d, mat, x, y, z) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      mesh.position.set(x, y, z);
      mesh.renderOrder = 999;
      brush.add(mesh);
    };
    addPart(0.055, 0.055, 0.34, handleMat, 0, 0, 0.04);
    addPart(0.065, 0.065, 0.08, gripMat, 0, 0, 0.14);
    addPart(0.36, 0.055, 0.09, mountMat, 0, 0, -0.15);
    addPart(0.32, 0.02, 0.03, stripMat, 0, 0.035, -0.15);
    addPart(0.34, 0.065, 0.08, bristleMat, 0, -0.055, -0.15);
    brush.position.set(-0.08, 0.15, -0.24);
    brush.rotation.set(0.15, 0.15, 0.05);
    brush.visible = false;
    this.heldBrushMesh = brush;
    this.handGroup.add(brush);
  }

  _hideHeldItems() {
    this.heldBlockMesh.visible = false;
    this.heldCarrotMesh.visible = false;
    this.heldRationMesh.visible = false;
    this.heldJournalMesh.visible = false;
    this.heldScopeMesh.visible = false;
    this.heldShieldRemoteMesh.visible = false;
    this.heldBrushMesh.visible = false;
    for (const model of Object.values(this.heldCrops)) model.visible = false;
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
    if (this.eatTime > 0 || this.cleanTime > 0) {
      this.pendingHeldBlock = { blockId, count };
      return;
    }
    this._currentHeld = { blockId, count };
    this._hideHeldItems();
    this.heldJournalMesh.visible = blockId === BLOCK_IDS.JOURNAL && count > 0;
    this.heldScopeMesh.visible = blockId === BLOCK_IDS.SCOPE && count > 0;
    this.heldShieldRemoteMesh.visible = blockId === BLOCK_IDS.SHIELD_REMOTE && count > 0;
    if (this.heldScopeMesh.visible || this.heldShieldRemoteMesh.visible || this.heldJournalMesh.visible) {
      this.armMesh.position.set(0.08, -0.06, 0.08);
      return;
    }
    if (!blockId || count <= 0) {
      this.armMesh.position.set(0, 0, 0);
      return;
    }

    if (blockId === BLOCK_IDS.RATION) {
      this.heldRationMesh.visible = true;
      this.armMesh.position.set(0.08, -0.06, 0.08);
      return;
    }

    if (this.heldCrops[blockId]) {
      this.heldCrops[blockId].visible = true;
      this.armMesh.position.set(.08, -.06, .08);
      return;
    }
    if (blockId === BLOCK_IDS.HYDRO_PLANT) {
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

  setSuitEquipped(equipped) {
    this.suitEquipped = Boolean(equipped);
    this.sleeveMesh.material = this.suitEquipped ? this.evaArmMat : this.ivaArmMat;
    this.wristRingMesh.visible = this.suitEquipped;
    this.wristPadMesh.visible = this.suitEquipped;
    this.wristScreenMesh.visible = this.suitEquipped;
    this.thumbMesh.material = this.suitEquipped ? this.evaThumbMat : this.ivaThumbMat;
    this.upgradeArmPlate.visible = this.suitEquipped && this.suitUpgraded;
  }

  setSuitUpgraded(upgraded) {
    this.suitUpgraded = Boolean(upgraded);
    this.upgradeArmPlate.visible = this.suitEquipped && this.suitUpgraded;
  }

  triggerSuitEquip() {
    this._suitAnimMode = 'equip';
    this._suitAnimTime = 0;
  }

  triggerSuitDock() {
    this._suitAnimMode = 'dock';
    this._suitAnimTime = 0;
  }

  triggerEat() {
    this.cleanTime = 0;
    this.heldBrushMesh.visible = false;
    this.eatTime = BLOCK_INTERACTION_CONFIG.EAT_ANIMATION_DURATION;
    this.isSwinging = false;
  }

  triggerCleanSolar() {
    this.pendingHeldBlock ??= { ...this._currentHeld };
    this.cleanTime = DUST_WEATHER_CONFIG.CLEAN_ANIM_DURATION;
    this.eatTime = 0;
    this.isSwinging = false;
    this._hideHeldItems();
    this.heldBrushMesh.visible = true;
    this.armMesh.position.set(0.08, -0.06, 0.08);
  }

  triggerReceive() {
    this.receiveTime = 0.42;
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
    let swingRotY = 0;
    let swingRotZ = 0;
    let swingOffsetX = 0;
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

    if (this.cleanTime > 0) {
      this.cleanTime = Math.max(0, this.cleanTime - dt);
      const p = 1 - this.cleanTime / DUST_WEATHER_CONFIG.CLEAN_ANIM_DURATION;
      const env = Math.sin(p * Math.PI);
      const sweep = Math.sin(p * Math.PI * 5) * env;
      swingOffsetX += -0.24 * env + 0.28 * sweep;
      swingOffsetY += 0.08 * env - 0.05 * Math.abs(sweep);
      swingOffsetZ += -0.26 * env;
      swingRotX += -0.42 * env;
      swingRotY += 0.35 * env + 0.45 * sweep;
      swingRotZ += 0.25 * sweep;
      if (this.cleanTime === 0) {
        this.heldBrushMesh.visible = false;
        const next = this.pendingHeldBlock ?? this._currentHeld;
        this.pendingHeldBlock = null;
        this.setHeldBlock(next.blockId, next.count);
      }
    }

    if (this.receiveTime > 0) {
      this.receiveTime = Math.max(0, this.receiveTime - dt);
      const rp = 1 - this.receiveTime / 0.42;
      const lift = Math.sin(rp * Math.PI);
      swingOffsetY += -0.06 * lift + 0.08 * Math.sin(rp * Math.PI * 0.5);
      swingOffsetZ += -0.08 * lift;
      swingRotX += 0.22 * lift;
    }

    if (!this.handGroup.visible) {
      this.helmetGroup.visible = false;
      this.leftArmGroup.visible = false;
    } else if (this._suitAnimMode === 'equip') {
      this._suitAnimTime += dt;
      const p = Math.min(1, this._suitAnimTime / 1.15);
      // Swap from IVA sleeve to pressurized EVA sleeve as the suit wraps on
      if (p >= 0.35 && !this.suitEquipped) this.setSuitEquipped(true);

      const raise = Math.sin(Math.min(1, p / 0.85) * Math.PI);
      swingOffsetX += -0.14 * raise;
      swingOffsetY += 0.26 * raise;
      swingOffsetZ += 0.04 * raise;
      swingRotX += 0.32 * raise;
      swingRotY += 0.45 * raise;
      swingRotZ += 0.42 * raise;

      // Left EVA arm mirrors the helmet-pull gesture
      this.leftArmGroup.visible = p >= 0.25 && p < 0.95;
      if (this.leftArmGroup.visible) {
        const lp = Math.sin(((p - 0.25) / 0.7) * Math.PI);
        this.leftArmGroup.position.set(-0.44 + 0.08 * lp, -0.58 + 0.36 * lp, -0.66);
        this.leftArmGroup.rotation.set(0.35 + 0.3 * lp, 0.38, 0.24 - 0.35 * lp);
      }

      // 3D voxel helmet drops smoothly from above onto the camera, then clears out
      this.helmetGroup.visible = p >= 0.28 && p < 0.98;
      if (this.helmetGroup.visible) {
        const hp = (p - 0.28) / 0.7;
        const drop = hp < 0.7 ? Math.sin((hp / 0.7) * Math.PI * 0.5) : 1 - ((hp - 0.7) / 0.3);
        this.helmetGroup.position.set(0, 0.48 - drop * 0.42, 0);
        this.helmetGroup.rotation.x = -0.12 + drop * 0.14;
      }

      // Briefly flash wrist computer screen green when sealed
      this.wristScreenMat.color.setHex(p > 0.65 ? 0x4ade80 : 0x38bdf8);
      this.wristScreenMat.emissive.setHex(p > 0.65 ? 0x16a34a : 0x0284c7);

      if (p >= 1) {
        this._suitAnimMode = null;
        this.helmetGroup.visible = false;
        this.leftArmGroup.visible = false;
        this.wristScreenMat.color.setHex(0x38bdf8);
        this.wristScreenMat.emissive.setHex(0x0284c7);
      }
    } else if (this._suitAnimMode === 'dock') {
      this._suitAnimTime += dt;
      const p = Math.min(1, this._suitAnimTime / 0.85);
      if (p >= 0.45 && this.suitEquipped) this.setSuitEquipped(false);

      const lift = Math.sin(p * Math.PI);
      swingOffsetX += -0.1 * lift;
      swingOffsetY += 0.2 * lift;
      swingRotX += 0.22 * lift;
      swingRotZ += 0.32 * lift;

      this.leftArmGroup.visible = p < 0.65;
      if (this.leftArmGroup.visible) {
        const lp = Math.sin((p / 0.65) * Math.PI);
        this.leftArmGroup.position.set(-0.44, -0.58 + 0.34 * lp, -0.66);
        this.leftArmGroup.rotation.set(0.35 + 0.25 * lp, 0.35, 0.22 - 0.3 * lp);
      }

      this.helmetGroup.visible = p < 0.75;
      if (this.helmetGroup.visible) {
        const hp = p / 0.75;
        this.helmetGroup.position.set(0, 0.06 + hp * 0.44, 0);
        this.helmetGroup.rotation.x = -0.14 * hp;
      }

      if (p >= 1) {
        this._suitAnimMode = null;
        this.helmetGroup.visible = false;
        this.leftArmGroup.visible = false;
      }
    } else {
      this.helmetGroup.visible = false;
      this.leftArmGroup.visible = false;
    }

    this.handGroup.position.set(
      this.basePos.x + bobX + swingOffsetX,
      this.basePos.y - bobY + swingOffsetY,
      this.basePos.z + swingOffsetZ
    );

    this.handGroup.rotation.set(
      this.baseRot.x + swingRotX,
      this.baseRot.y + swingRotY,
      this.baseRot.z + swingRotZ
    );
  }
}
