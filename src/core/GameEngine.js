import * as THREE from 'three';
import { CAMERA_CONFIG, MAV_CONFIG, RADIATION_CONFIG, WATER_SYSTEM_CONFIG } from '../config/constants.js';
import donkiCme from '../data/donkiCme.json';
import { MissionSystem, oxygenPointsToKg } from '../mission/MissionSystem.js';
import { formatDateDMY, formatDose, stormEventMessage } from '../mission/missionText.js';
import { MissionHud } from '../ui/MissionHud.js';
import { requestRawPointerLock } from '../player/mouseLook.js';
import { createCarrotTexture } from '../graphics/carrotTexture.js';
import { BLOCK_IDS } from '../config/blockTypes.js';
import { createBlockMaterials } from '../graphics/blockMaterials.js';
import { MarsSkySystem } from '../sky/MarsSkySystem.js';
import { VoxelWorld } from '../world/VoxelWorld.js';
import { buildNasaCustomModels } from '../world/nasaModelsBuilder.js';
import { targetCrop, removeCrop } from '../world/cropInteraction.js';
import { PlayerPhysics } from '../player/PlayerPhysics.js';
import { PlayerHand } from '../player/PlayerHand.js';
import { SurvivalSystem } from '../player/SurvivalSystem.js';
import { InputController } from '../player/InputController.js';
import { HudManager } from '../ui/HudManager.js';
import { DebugOverlay } from '../ui/DebugOverlay.js';
import { RoverController } from '../rover/RoverController.js';

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

    const { materials, previews, atlas } = createBlockMaterials();
    const carrot = createCarrotTexture();
    previews[BLOCK_IDS.HYDRO_PLANT] = carrot.dataUrl;
    this.sky = new MarsSkySystem(this.scene);
    this.world = new VoxelWorld(this.scene, materials, atlas, carrot.texture);

    // Modelos 3D detalhados estilo Mod de Minecraft + Caixas de Colisão AABB
    const { group: customModels, colliders, plants, rover, roverWheels } = buildNasaCustomModels(this.scene);
    this.customModels = customModels;
    this.plants = plants;
    this.customColliders = colliders;

    this.roverController = new RoverController({
      roverGroup: rover,
      wheels: roverWheels,
      world: this.world,
      camera: this.camera,
    });
    this.canInteractWithConsole = false;

    this.player = new PlayerPhysics(this.world, colliders);
    this.survival = new SurvivalSystem();

    // Maozinha 3D do jogador em primeira pessoa
    this.playerHand = new PlayerHand(this.camera, materials, carrot.texture);
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

    // Missao: energia, tempestades solares (CMEs reais do DONKI) e o MAV
    this.mission = new MissionSystem({ cmes: donkiCme.cmes, startHours: this._skyHours() });
    this.missionHud = new MissionHud({
      donkiFetched: donkiCme.fetched,
      onLoadIce: (count) => this._loadIceIntoMav(count),
      onToggleFactory: () => this.mission.toggleFactory(),
      onIgnite: () => this._launchMav(),
      onClose: () => this._closeMavPanel(),
    });
    this._wasDead = false;

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
        if (!this.roverController.isActive) {
          this.playerHand.handGroup.visible = !zoomed;
        }
      },
      getTargetedBlock: () => this._getTargetedBlock(),
      harvestCrop: (plant) => removeCrop(plant, this.plants, this.customColliders),
      isRoverActive: () => this.roverController.isActive,
      onInteract: () => this.handlePlayerInteract(),
      onRoverAction: () => this.handleRoverAction(),
      onToggleRoverCamera: () => {
        this.roverController.toggleCameraMode();
        const modeName =
          this.roverController.cameraMode === 'mastcam'
            ? 'Mastcam (1st-person)'
            : 'Tactical 3rd-person';
        this.hud.showToast(`Camera: ${modeName}`);
      },
      onToggleShield: () => this._toggleShield(),
      onSendData: () => this._sendScienceData(),
      isMissionModalOpen: () => this.missionHud.isMavPanelOpen || this.missionHud.isVictoryShown,
    });

    this._lookDir = new THREE.Vector3();

    this.debug = new DebugOverlay(this.renderer);

    // Compila todos os shaders agora, em vez de travar na primeira vez que algo entra na tela
    this.renderer.compile(this.scene, this.camera);

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
    const dir = this.player.getLookDirection(this._lookDir);
    const voxelHit = this.world.raycast(this.player.pos, dir, CAMERA_CONFIG.REACH_DISTANCE);
    return targetCrop(this.plants, this.player.pos, dir, CAMERA_CONFIG.REACH_DISTANCE, voxelHit);
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

  // Horas de jogo desde o inicio do sol 1
  _skyHours() {
    return (this.sky.solCount - 1) * 24 + this.sky.timeOfDay;
  }

  _isNearMav() {
    const { x, z } = MAV_CONFIG.PAD_POSITION;
    return Math.hypot(this.player.pos.x - x, this.player.pos.z - z) <= MAV_CONFIG.INTERACT_RADIUS;
  }

  _openMavPanel() {
    this.missionHud.openMavPanel();
    this._refreshMavPanel();
    document.exitPointerLock();
  }

  _closeMavPanel() {
    this.missionHud.closeMavPanel();
    requestRawPointerLock(this.renderer.domElement);
  }

  // [G] no console de comando da base: envia o pacote de dados cientificos para a Terra
  _sendScienceData() {
    if (this.currentInteraction !== 'rover_terminal') {
      this.hud.showToast('Go to the command console inside the base to send science data.');
      return;
    }
    const result = this.mission.sendData();
    const messages = {
      sent: 'Science data sent! Radio waves take 3 to 22 minutes to reach Earth, so Mission Control cannot help you right away.',
      'no-energy': 'Not enough energy to power the radio. Wait for the Sun to charge the battery.',
      'already-sent': 'Your science data is already on its way to Earth.',
    };
    this.hud.showToast(messages[result], 5000);
  }

  // Sobrevivencia com o O2 do habitat pago pela bateria
  _updateSurvival(dt) {
    this.survival.update(dt, this.player.pos, this.mission.oxygenRefillBudget());
    this.mission.chargeOxygen(this.survival.lastOxygenRefilled);
  }

  _refreshMavPanel() {
    this.missionHud.updateMavPanel(this.mission, this.survival.countItem(BLOCK_IDS.MARS_ICE));
  }

  _toggleShield() {
    if (!this.mission.toggleShield()) {
      this.hud.showToast('The battery is empty: the shield cannot turn on.');
      return;
    }
    this.hud.showToast(this.mission.shieldOn
      ? 'Radiation shield ON: it blocks solar particles but uses energy.'
      : 'Radiation shield OFF.');
  }

  _loadIceIntoMav(count) {
    const inBag = this.survival.countItem(BLOCK_IDS.MARS_ICE);
    const accepted = this.mission.deliverIce(Math.min(count, inBag));
    if (accepted <= 0) return;
    this.survival.removeItems(BLOCK_IDS.MARS_ICE, accepted);
    this.hud.renderHotbar(this.survival.slots);
    const heldSlot = this.survival.slots[this.hud.selectedSlot];
    this.playerHand.setHeldBlock(heldSlot?.id, heldSlot?.count ?? 0);
    this._refreshMavPanel();
  }

  _launchMav() {
    if (!this.mission.ignite()) return;
    const m = this.mission;
    const rows = [
      ['Sols on Mars (1 sol = 1 Mars day)', String(this.sky.solCount)],
      ['Radiation dose you got', `${formatDose(m.totalDoseMsv)} (NASA career limit: ${RADIATION_CONFIG.CAREER_LIMIT_MSV} mSv)`],
      ['Solar storms survived', String(m.stormsSurvived)],
      ['Oxygen made by the base', `${oxygenPointsToKg(m.oxygenProducedPoints).toFixed(2)} kg`],
      ['Ice turned into rocket fuel', `${m.iceDelivered} blocks`],
      ['Solar energy collected', `${(m.solarEnergyCollected / m.battery.capacity).toFixed(1)} full batteries`],
    ];
    const sources = `Solar storms: real CMEs from NASA DONKI (real data from ${formatDateDMY(donkiCme.fetched)}). ` +
      'Radiation: Curiosity RAD on the Mars surface (NASA RadLab). Sunlight on Mars: 43% of Earth (NASA Mars Fact Sheet).';
    this.missionHud.showVictory(rows, sources);
    document.exitPointerLock();
  }

  _updateMission(dt) {
    // Com o painel do MAV aberto o jogador continua la fora: a radiacao conta
    const playing = this.input.isLocked || this.missionHud.isMavPanelOpen;
    const active = playing && !this.survival.isDead && !this.missionHud.isVictoryShown;
    const damage = this.mission.update(this._skyHours(), {
      insideHabitat: this.survival.insidePressurizedShip,
      active,
    });
    if (active) this.survival.takeDamage(damage);

    if (this.survival.isDead && !this._wasDead) {
      this.mission.markDeath();
      this.missionHud.closeMavPanel(); // a tela de morte precisa aparecer por cima
      this.hud.showDeathScreen(); // a radiacao pode matar depois do hud.update deste frame
    }
    this._wasDead = this.survival.isDead;

    for (const event of this.mission.drainEvents()) {
      const message = stormEventMessage(event, donkiCme.fetched);
      if (message) this.hud.showToast(message, event.type === 'storm-warning' ? 8000 : 4500);
    }

    this.missionHud.update(this.mission);
    this._panelRefreshTimer = (this._panelRefreshTimer ?? 0) + dt;
    if (this.missionHud.isMavPanelOpen && this._panelRefreshTimer > 0.25) {
      this._panelRefreshTimer = 0;
      this._refreshMavPanel();
    }
  }

  _onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  handleRoverAction() {
    if (!this.roverController.isActive) return;

    if (this.roverController.canUnloadIce()) {
      const res = this.roverController.unloadIce();
      if (res.success) {
        const added = this.survival.addBaseWater(
          res.amount * WATER_SYSTEM_CONFIG.LITERS_PER_KG_ICE
        );
        this.hud.showToast(`Offloaded ${res.amount}kg ice! +${added}L purified water into habitat.`);
      }
    } else if (this.roverController.canCollectIce()) {
      const res = this.roverController.collectIce();
      this.hud.showToast(res.message || res.reason);
    } else {
      this.hud.showToast('No ice deposits nearby or not at habitat water intake bay');
    }
  }

  _checkAstronautInteractions() {
    if (this.roverController.isActive) {
      this.currentInteraction = null;
      this.hud.setInteractionPrompt(false);
      return;
    }

    // 0. MAV na plataforma de lancamento
    if (this._isNearMav()) {
      this.currentInteraction = 'mav';
      this.hud.setInteractionPrompt(true, '[F] Open the MAV rocket panel');
      return;
    }

    // 1. Console de Comando do Rover (x: 0, z: -3.6, y: ~11)
    const distConsole = Math.hypot(this.player.pos.x - 0, this.player.pos.z - (-3.6));
    const dyConsole = Math.abs(this.player.pos.y - 11.0);
    if (distConsole < 3.2 && dyConsole < 2.2) {
      this.currentInteraction = 'rover_terminal';
      const dataHint = this.mission.dataSent ? '' : ' · [G] Send science data to Earth';
      this.hud.setInteractionPrompt(true, `[F] Operate Rover Remote Terminal${dataHint}`);
      return;
    }

    // 2. Purificador / Dispensador de Água do Laboratório (x: 4.4, z: 2.4, y: ~11)
    const distWater = Math.hypot(
      this.player.pos.x - WATER_SYSTEM_CONFIG.WATER_DISPENSER_POS.x,
      this.player.pos.z - WATER_SYSTEM_CONFIG.WATER_DISPENSER_POS.z
    );
    const dyWater = Math.abs(this.player.pos.y - 11.0);
    if (distWater < 2.5 && dyWater < 2.2) {
      this.currentInteraction = 'water_dispenser';
      this.hud.setInteractionPrompt(true, '[F] Drink Clean Water (Habitat Reservoir)');
      return;
    }

    // 3. Estufa / Plantações de Batata (x: -18, z: 0)
    const distGreenhouse = Math.hypot(this.player.pos.x + 18, this.player.pos.z);
    const dyGreenhouse = Math.abs(this.player.pos.y - 11.0);
    if (distGreenhouse < 5.8 && dyGreenhouse < 2.2) {
      this.currentInteraction = 'greenhouse';
      this.hud.setInteractionPrompt(true, '[F] Harvest Potato (Irrigated Greenhouse)');
      return;
    }

    this.currentInteraction = null;
    this.hud.setInteractionPrompt(false);
  }

  handlePlayerInteract() {
    if (this.missionHud.isVictoryShown) return;
    if (this.missionHud.isMavPanelOpen) {
      this._closeMavPanel();
      return;
    }
    if (this.currentInteraction === 'mav' && this.input.isLocked) {
      this._openMavPanel();
      return;
    }

    if (this.roverController.isActive) {
      this.toggleRoverMode();
      return;
    }

    if (this.currentInteraction === 'rover_terminal') {
      this.toggleRoverMode();
    } else if (this.currentInteraction === 'water_dispenser') {
      const res = this.survival.drinkFromBaseDispenser();
      this.hud.showToast(res.message);
    } else if (this.currentInteraction === 'greenhouse') {
      const res = this.survival.harvestGreenhouseCrop();
      this.hud.showToast(res.message);
      this.hud.renderHotbar(this.survival.slots);
    }
  }

  toggleRoverMode() {
    if (this.roverController.isActive) {
      this.roverController.deactivate();
      this.hud.setRoverMode(false);
      this.playerHand.handGroup.visible = !this.isZoomed;
      this.hud.showToast('Disconnected from Rover Remote Terminal');
    } else if (this.currentInteraction === 'rover_terminal') {
      this.roverController.activate();
      this.hud.setRoverMode(true);
      this.playerHand.handGroup.visible = false;
      this.highlightBox.visible = false;
      this.hud.showToast('Connected: NASA Mars Rover (RF Link Active)');
    }
  }

  start() {
    const loop = () => {
      requestAnimationFrame(loop);

      const now = performance.now();
      const frameMs = now - this.lastTime;
      const dt = Math.min(frameMs / 1000, 0.05);
      this.lastTime = now;

      const isGameRunning = this.input.isLocked && !this.survival.isDead && !this.missionHud.isVictoryShown;
      if (isGameRunning) {
        if (this.roverController.isActive) {
          this.roverController.update(dt, this.input.keys);
          this.sky.update(dt, this.roverController.pos);
          this._updateSurvival(dt);
          this.highlightBox.visible = false;
          this.hud.update({ player: this.player, survival: this.survival, sky: this.sky, camera: this.camera, isZoomed: false, isRoverActive: true, roverTelemetry: this.roverController.getTelemetry(), mission: this.mission });
        } else {
          this.player.update(dt, this.input.keys);
          this._updateSurvival(dt);
          this.input.update(dt);
          this.roverController.update(dt, {});
          this.playerHand.update(dt, this.player.isMoving);
          this._updateCamera();
          this.sky.update(dt, this.player.pos);
          this._checkAstronautInteractions();

          const hit = this._getTargetedBlock();
          if (hit.hit) {
            this.highlightBox.visible = true;
            if (hit.type === 'crop') {
              const bounds = new THREE.Box3().setFromObject(hit.plant);
              bounds.getCenter(this.highlightBox.position);
              bounds.getSize(this.highlightBox.scale);
            } else {
              this.highlightBox.scale.set(1, 1, 1);
              this.highlightBox.position.set(hit.x + 0.5, hit.y + 0.5, hit.z + 0.5);
            }
          } else {
            this.highlightBox.visible = false;
          }

          this.hud.update({ player: this.player, survival: this.survival, sky: this.sky, camera: this.camera, isZoomed: this.isZoomed, isRoverActive: false, mission: this.mission });
        }
      } else {
        if (this.roverController.isActive) this.roverController.update(dt, {});
        this._updateCamera();
        this.sky.update(dt, this.player.pos);
      }

      const pickedUpBlocks = this.world.updateDrops(dt, this.player.pos, (id) => id === BLOCK_IDS.HYDRO_PLANT ? this.survival.addHarvestedCrop() : this.survival.addBlockToInventory(id));
      if (pickedUpBlocks.length > 0) {
        this.hud.renderHotbar(this.survival.slots);
        const heldSlot = this.survival.slots[this.hud.selectedSlot];
        this.playerHand.setHeldBlock(heldSlot?.id, heldSlot?.count ?? 0);
        this.hud.showToast(pickedUpBlocks.every((id) => id === BLOCK_IDS.HYDRO_PLANT) ? 'Picked up a Mars carrot' : `Picked up ${pickedUpBlocks.length} item${pickedUpBlocks.length > 1 ? 's' : ''}`);
      }

      if (!isGameRunning && !this.roverController.isActive) this.playerHand.update(dt, false);
      this._updateMission(dt);

      this.renderer.render(this.scene, this.camera);
      this.debug.frame(frameMs);
    };

    loop();
  }
}
