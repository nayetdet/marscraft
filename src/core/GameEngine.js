import * as THREE from 'three';
import { CAMERA_CONFIG } from '../config/constants.js';
import { createBlockMaterials } from '../graphics/blockMaterials.js';
import { MarsSkySystem } from '../sky/MarsSkySystem.js';
import { VoxelWorld } from '../world/VoxelWorld.js';
import { buildNasaCustomModels } from '../world/nasaModelsBuilder.js';
import { PlayerPhysics } from '../player/PlayerPhysics.js';
import { PlayerHand } from '../player/PlayerHand.js';
import { SurvivalSystem } from '../player/SurvivalSystem.js';
import { InputController } from '../player/InputController.js';
import { HudManager } from '../ui/HudManager.js';

export class GameEngine {
  constructor(container) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.isZoomed = false;

    this.camera = new THREE.PerspectiveCamera(
      CAMERA_CONFIG.BASE_FOV,
      window.innerWidth / window.innerHeight,
      CAMERA_CONFIG.NEAR,
      CAMERA_CONFIG.FAR
    );
    this.scene.add(this.camera);

    // Renderizador fosco, claro e otimizado
    this.renderer = new THREE.WebGLRenderer({
      antialias: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.toneMapping = THREE.NoToneMapping;
    this.container.appendChild(this.renderer.domElement);

    const { materials, previews } = createBlockMaterials();
    this.sky = new MarsSkySystem(this.scene);
    this.world = new VoxelWorld(this.scene, materials);

    // Modelos 3D detalhados estilo Mod de Minecraft + Caixas de Colisão AABB
    const { group: customModels, colliders } = buildNasaCustomModels(this.scene);
    this.customModels = customModels;

    this.player = new PlayerPhysics(this.world, colliders);
    this.survival = new SurvivalSystem();

    // Maozinha 3D do jogador em primeira pessoa
    this.playerHand = new PlayerHand(this.camera, materials);
    const firstSlot = this.survival.slots[0];
    this.playerHand.setHeldBlock(firstSlot.id, firstSlot.count);

    this.hud = new HudManager(previews, this.survival.slots, {
      onInventorySwap: (fromIndex, toIndex) => {
        const inventorySlots = this.survival.swapInventorySlots(fromIndex, toIndex);
        this.hud.renderHotbar(this.survival.slots);
        const heldSlot = this.survival.slots[this.hud.selectedSlot];
        this.playerHand.setHeldBlock(heldSlot?.id, heldSlot?.count ?? 0);
        return inventorySlots;
      },
    });

    this._initBaseLights();
    this._initHighlightWireframe();

    this.input = new InputController({
      domElement: this.renderer.domElement,
      player: this.player,
      playerHand: this.playerHand,
      survival: this.survival,
      world: this.world,
      sky: this.sky,
      hud: this.hud,
      onToggleZoom: (zoomed) => {
        this.isZoomed = zoomed;
        this.playerHand.handGroup.visible = !zoomed;
      },
      getTargetedBlock: () => this._getTargetedBlock(),
    });

    window.addEventListener('resize', () => this._onResize());
    this.lastTime = performance.now();
  }

  _initBaseLights() {
    // Luz clara dentro do Módulo Hab Branco Principal
    const habLight = new THREE.PointLight(0xffffff, 1.6, 22);
    habLight.position.set(0, 13.0, 0);
    this.scene.add(habLight);

    // Luz clara dentro da Redoma de Estufa
    const domeLight = new THREE.PointLight(0xf0fdf4, 1.5, 18);
    domeLight.position.set(-18, 13.5, 0);
    this.scene.add(domeLight);
  }

  _initHighlightWireframe() {
    const hlGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.005, 1.005, 1.005));
    const hlMat = new THREE.LineBasicMaterial({ color: 0x000000 });
    this.highlightBox = new THREE.LineSegments(hlGeo, hlMat);
    this.highlightBox.visible = false;
    this.scene.add(this.highlightBox);
  }

  _getTargetedBlock() {
    const dir = this.player.getLookDirection();
    return this.world.raycast(this.player.pos, dir, CAMERA_CONFIG.REACH_DISTANCE);
  }

  _updateCamera() {
    this.camera.position.copy(this.player.pos);
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.player.yaw;
    this.camera.rotation.x = this.player.pitch;

    const targetFov = this.isZoomed ? CAMERA_CONFIG.ZOOM_FOV : CAMERA_CONFIG.BASE_FOV;
    if (Math.abs(this.camera.fov - targetFov) > 0.05) {
      this.camera.fov += (targetFov - this.camera.fov) * 0.18;
      this.camera.updateProjectionMatrix();
    }
  }

  _onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  start() {
    const loop = () => {
      requestAnimationFrame(loop);

      const now = performance.now();
      const dt = Math.min((now - this.lastTime) / 1000, 0.05);
      this.lastTime = now;

      if (this.input.isLocked && !this.survival.isDead) {
        this.player.update(dt, this.input.keys);
        this.survival.update(dt, this.player.pos);
        this.input.update(dt);
      }

      const pickedUpBlocks = this.world.updateDrops(dt, this.player.pos);
      if (pickedUpBlocks.length > 0) {
        pickedUpBlocks.forEach((blockId) => this.survival.addBlockToInventory(blockId));
        this.hud.renderHotbar(this.survival.slots);
        const heldSlot = this.survival.slots[this.hud.selectedSlot];
        this.playerHand.setHeldBlock(heldSlot?.id, heldSlot?.count ?? 0);
        this.hud.showToast(`Picked up ${pickedUpBlocks.length} block${pickedUpBlocks.length > 1 ? 's' : ''}`);
      }

      this.playerHand.update(dt, this.player.isMoving);
      this._updateCamera();
      this.sky.update(dt, this.player.pos);

      const hit = this._getTargetedBlock();
      if (hit.hit) {
        this.highlightBox.visible = true;
        this.highlightBox.position.set(hit.x + 0.5, hit.y + 0.5, hit.z + 0.5);
      } else {
        this.highlightBox.visible = false;
      }

      this.hud.update({
        player: this.player,
        survival: this.survival,
        sky: this.sky,
        camera: this.camera,
        isZoomed: this.isZoomed,
      });

      this.renderer.render(this.scene, this.camera);
    };

    loop();
  }
}
