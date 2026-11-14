import * as THREE from 'three';
import { CAMERA_CONFIG, MISSION_CONFIG, STATION_CONFIG, CREW_CONFIG, MAV_CONFIG, RADIATION_CONFIG, WATER_SYSTEM_CONFIG, SURVIVAL_CONFIG, CUTSCENE_CONFIG, PHYSICS_CONFIG, WORLD_CONFIG } from '../config/constants.js';
import { CrewManager } from '../crew/CrewManager.js';
import { CrewAvatar } from '../crew/CrewAvatar.js';
import { createBaseStock } from '../crew/baseStock.js';
import { createStations } from '../crew/stations.js';
import { crewEventMessage } from '../crew/crewText.js';
import { CrewPanel, CrewPicker } from '../ui/CrewPanel.js';
import donkiCme from '../data/donkiCme.json';
import { MissionSystem, oxygenPointsToKg } from '../mission/MissionSystem.js';
import { formatDateDMY, formatDose, formatHours, stormEventMessage } from '../mission/missionText.js';
import { MissionHud } from '../ui/MissionHud.js';
import { requestRawPointerLock } from '../player/mouseLook.js';
import { createCarrotTexture } from '../graphics/carrotTexture.js';
import { BLOCK_IDS } from '../config/blockTypes.js';
import { createBlockMaterials } from '../graphics/blockMaterials.js';
import { MarsSkySystem } from '../sky/MarsSkySystem.js';
import { VoxelWorld } from '../world/VoxelWorld.js';
import { buildNasaCustomModels } from '../world/nasaModelsBuilder.js';
import { targetCrop } from '../world/cropInteraction.js';
import { PlayerPhysics } from '../player/PlayerPhysics.js';
import { PlayerHand } from '../player/PlayerHand.js';
import { SurvivalSystem } from '../player/SurvivalSystem.js';
import { InputController } from '../player/InputController.js';
import { HudManager } from '../ui/HudManager.js';
import { DebugOverlay } from '../ui/DebugOverlay.js';
import { RoverController } from '../rover/RoverController.js';
import { MissionSystem as ExpeditionSystem } from './MissionSystem.js';
import { Airlock } from '../world/Airlock.js';
import { StationSystem } from './StationSystem.js';
import { StationPanel } from '../ui/StationPanel.js';
import { getCategoryLabel } from '../data/scanCatalog.js';
import { ScanJournal } from '../scanner/scanJournal.js';
import { ScannerSystem, applyDiscoveryReward } from '../scanner/ScannerSystem.js';
import { resolveScanTarget, collectScanBlocks } from '../scanner/scanTargeting.js';
import { ScanHighlight } from '../scanner/scanHighlight.js';
import { isInsideShieldZone, SHIELD_ZONE } from '../mission/shieldZone.js';
import { ShieldBubble } from '../graphics/shieldBubble.js';
import { IceSensorEffect } from '../scanner/iceSensor.js';
import { ScannerHud } from '../ui/ScannerHud.js';
import { COMMS_DELAY } from '../data/commsDelay.js';
import { StoryDirector } from '../story/StoryDirector.js';
import { ACT_TITLES } from '../story/storyChapters.js';
import { WAYPOINT_LABELS, objectiveTarget, routeWaypoint } from '../story/waypoints.js';
import { WaypointBeacon } from '../story/WaypointBeacon.js';
import { WaypointHud } from '../ui/WaypointHud.js';
import { StoryHud } from '../ui/StoryHud.js';
import { CutsceneHud } from '../ui/CutsceneHud.js';
import { CutscenePlayer } from '../story/cutscene/CutscenePlayer.js';
import { EngineFlame, ParticlePuffs } from '../story/cutscene/effects.js';
import { LANDER_NOZZLE_Y, createLander, landerCollider } from '../story/cutscene/landerModel.js';
import { createArrivalCutscene } from '../story/cutscene/arrivalCutscene.js';
import { MAV_NOZZLE_Y, createLaunchCutscene } from '../story/cutscene/launchCutscene.js';

// Raio angular (rad) em que a mira da luneta "pega" cada astro. A Lua fica a ~0,047 rad da
// Terra, então os dois raios precisam ser menores que isso para não se sobreporem.
const SKY_SCAN_RADII = { sun: 0.05, earth: 0.035, moon: 0.02, phobos: 0.04, deimos: 0.03 };
// Raio (em unidades da cena) da esfera verde do efeito de scan em volta de cada astro.
const SKY_HIGHLIGHT_RADII = { sun: 10, earth: 8.5, moon: 3, phobos: 7, deimos: 3.5 };
// Alvos de terreno pintam a mancha em volta do bloco mirado, então a chave inclui o bloco.
const TERRAIN_PATCH_IDS = new Set(['regolith', 'sandstone', 'crater-rock', 'water-ice', 'crater-rim']);

function getLocalStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export class GameEngine {
  constructor(container) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.isScannerOpen = false;
    this.scene.fog = new THREE.FogExp2(0x9a4d2e, 0.0015);
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
    const { group: customModels, colliders, plants, rover, roverWheels, rocket } = buildNasaCustomModels(this.scene);
    this.mavRocket = rocket;
    this.customModels = customModels;
    this.plants = plants;
    this.customColliders = colliders;

    this.roverController = new RoverController({
      roverGroup: rover,
      wheels: roverWheels,
      world: this.world,
      camera: this.camera,
      colliders,
    });
    this.canInteractWithConsole = false;

    this.player = new PlayerPhysics(this.world, colliders);
    this.survival = new SurvivalSystem();
    // As tempestades solares so comecam no ato 2 da historia (StoryDirector)
    this.mission = new MissionSystem({ cmes: donkiCme.cmes, startHours: this._skyHours(), stormsStarted: false });
    this.expedition = new ExpeditionSystem();
    Object.defineProperty(this.expedition, 'energy', {
      get: () => this.mission.battery.charge,
      set: (value) => { this.mission.battery.charge = value; },
    });
    this.airlock = new Airlock(this.scene, colliders, this.expedition);
    this.stations = new StationSystem(this.expedition);
    this.airlock.stations = this.stations;
    this.airlock.onEvent = (type) => this._onAirlockEvent(type);
    this.stationPanel = new StationPanel(this);
    this._buildStationMarkers();
    this.growingCrops = [];
    this._interactionDir = new THREE.Vector3();
    this._interactionOffset = new THREE.Vector3();
    this._interactionPoint = new THREE.Vector3();
    this._lastStorm = false;
    this._lastStormWarning = false;

    // Maozinha 3D do jogador em primeira pessoa
    this.playerHand = new PlayerHand(this.camera, materials, carrot.texture);
    const firstSlot = this.survival.slots[0];
    this.playerHand.setHeldBlock(firstSlot?.id, firstSlot?.count ?? 0);

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
    this._initScanner();

    // Missao: energia, tempestades solares (CMEs reais do DONKI) e o MAV
    this.shieldBubble = new ShieldBubble(this.scene, SHIELD_ZONE);
    this.missionHud = new MissionHud({
      donkiFetched: donkiCme.fetched,
      onLoadIce: (count) => this._loadIceIntoMav(count),
      onToggleFactory: () => this.mission.toggleFactory(),
      onIgnite: () => this._launchMav(),
      onClose: () => this._closeMavPanel(),
    });
    this._wasDead = false;
    this._initStory();

    // Tripulacao NPC (issues #47 e #48): o tamanho e escolhido no menu antes do primeiro Play
    this.crewStock = createBaseStock({ survival: this.survival, mission: this.mission });
    this.crewAvatars = [];
    this._buildCrew(CREW_CONFIG.DEFAULT_CREW);
    this.crewPanel = new CrewPanel({
      onAssign: (memberId, task) => this._assignCrew(memberId, task),
      onClose: () => this._closeCrewPanel(),
    });
    this.crewPicker = new CrewPicker({
      initial: CREW_CONFIG.DEFAULT_CREW,
      onChange: (size) => this._buildCrew(size),
    });
    this.talkTarget = null;

    this.input = new InputController({
      domElement: this.renderer.domElement,
      player: this.player,
      playerHand: this.playerHand,
      survival: this.survival,
      world: this.world,
      sky: this.sky,
      hud: this.hud,
      onToggleZoom: (scannerOpen, zoomed) => {
        this.isScannerOpen = scannerOpen;
        this.isZoomed = zoomed;
        if (!this.roverController.isActive) {
          this.playerHand.handGroup.visible = !zoomed;
        }
      },
      getTargetedBlock: () => this._getTargetedBlock(),
      harvestCrop: (plant) => this._harvestCrop(plant),
      isJournalOpen: () => this.scannerHud.isJournalOpen,
      onToggleJournal: (open) => {
        if (open) this.scannerHud.openJournal(this.scanJournal);
        else this.scannerHud.closeJournal();
      },
      isRoverActive: () => this.roverController.isActive,
      onInteract: () => this.handlePlayerInteract(),
      onRoverAction: () => this.handleRoverAction(),
      onRoverLook: (dx, dy) => this.roverController.look(dx, dy),
      onToggleShield: () => this._toggleShield(),
      onToggleCrewPanel: () => this._toggleCrewPanel(),
      onSendData: () => this._sendScienceData(),
      isMissionModalOpen: () =>
        this.missionHud.isMavPanelOpen || this.missionHud.isVictoryShown || this.crewPanel.isOpen
        || this.storyHud.isWindowClosedShown,
      isInputBlocked: () => this.cutscenes.isActive,
      getInteraction: () => this._getInteraction(),
      isStationOpen: () => this.stationPanel.isOpen,
      getWorkSpeed: () => (this.stations.fitness < 40 || this.stations.boneDensity < 40 || !this.stations.freshFood ? 0.6 : 1) * (this.stations.toolUpgraded ? 1.4 : 1),
    });

    this._lookDir = new THREE.Vector3();

    this.debug = new DebugOverlay(this.renderer);

    // Compila todos os shaders agora, em vez de travar na primeira vez que algo entra na tela
    this.renderer.compile(this.scene, this.camera);

    window.addEventListener('resize', () => this._onResize());
    this.lastTime = performance.now();
  }

  _updateExpedition(dt) {
    const inside = this.survival.isPlayerInsideShip(this.player.pos);
    const insideCore = inside && !(Math.abs(this.player.pos.x - 0.5) < 1.5 && this.player.pos.z >= 6);
    const shelter = insideCore && this.player.pos.x > -3 && this.player.pos.x < -1 && Math.abs(this.player.pos.z - 0.5) < 1.3;
    this.expedition.greenhousePowered = this.expedition.spend(MISSION_CONFIG.GREENHOUSE_RATE * dt);
    const storm = this.mission.storm.phase === 'active';
    this.stations.update(dt, insideCore, shelter, this.survival, storm, !inside);
    this.expedition.radiation = Math.min(100, this.mission.totalDoseMsv / RADIATION_CONFIG.CAREER_LIMIT_MSV * 100);
    const crop = this.stations.crop;
    this.stationCrop.visible = Boolean(crop);
    if (crop) {
      this.stationCrop.scale.y = 0.2 + 0.8 * crop.progress / STATION_CONFIG.CROP_GROWTH_TIME;
      this.stationCrop.material.color.setHex(({ potato: 0x69a63c, lettuce: 0x77d749, soy: 0x3b8551 })[crop.type]);
    }
    this.airlock.update(dt, this.player.pos);
    this._growCrops(dt);
    if (this.survival.health <= 0) this.survival.isDead = true;
    const hasPriorityInteraction = ['crew', 'water_dispenser', 'rover_terminal', 'mav', 'greenhouse'].includes(this.currentInteraction);
    document.getElementById('interaction-hint').textContent = hasPriorityInteraction ? '' : (this._getInteraction()?.label ?? '');
    document.getElementById('mission-status').textContent = `POWER ${Math.round(this.expedition.energy)}%`;
    document.getElementById('co2-overlay').style.opacity = String(Math.max(0, (this.stations.co2 - 40) / 150));
    document.getElementById('station-warning').textContent = this.stations.contaminated ? 'DUST IN HABITAT: clean at life support' : this.stations.co2 >= 40 ? `CO2 ${Math.round(this.stations.co2)}%: replace filter` : (this.stations.fitness < 40 || this.stations.boneDensity < 40) ? 'Low bone density / fitness: work is slower. Train in the Gym Wing!' : '';
  }

  _harvestCrop(plant) {
    const index = this.plants.indexOf(plant);
    if (index < 0) return false;
    this.plants.splice(index, 1);
    const collider = plant.userData.collider;
    const colliderIndex = this.customColliders.indexOf(collider);
    if (colliderIndex >= 0) this.customColliders.splice(colliderIndex, 1);
    plant.scale.setScalar(0.25);
    this.growingCrops.push({ plant, collider, elapsed: 0 });
    return true;
  }

  _growCrops(dt) {
    if (!this.expedition.greenhousePowered || this.stations?.contaminated) return;
    for (let i = this.growingCrops.length - 1; i >= 0; i--) {
      const crop = this.growingCrops[i];
      crop.elapsed += dt;
      const progress = Math.min(1, crop.elapsed / MISSION_CONFIG.CROP_GROWTH_TIME);
      crop.plant.scale.setScalar(0.25 + progress * 0.75);
      if (progress === 1) {
        this.plants.push(crop.plant);
        if (crop.collider) this.customColliders.push(crop.collider);
        this.growingCrops.splice(i, 1);
      }
    }
  }

  _getInteraction() {
    const dir = this.player.getLookDirection(this._interactionDir);
    let best = null, bestDistance = 4;
    const candidates = [
      ...this.airlock.doors.map(door => ({ type: 'door', door, x: 0.5, y: 11.4, z: door.z, label: 'Press F: cycle airlock' })),
      { type: 'power', x: 4.6, y: 11.4, z: -1.5, label: 'Press F: life support' },
      { type: 'greenhouse', x: -17, y: 11.4, z: 0, label: 'Press F: greenhouse' },
      { type: 'treadmill', x: -9.2, y: 11.2, z: 10.2, label: 'Press F or Click: space treadmill (bone density)' },
      { type: 'bike', x: -5.8, y: 11.2, z: 10.4, label: 'Press F or Click: exercise bike (muscle & cardio)' },
      { type: 'medical', x: -7.6, y: 11.3, z: 12.1, label: 'Press F or Click: medbay & bone scanner' },
    ];
    for (const candidate of candidates) {
      this._interactionPoint.set(candidate.x, candidate.y, candidate.z);
      this._interactionOffset.copy(this._interactionPoint).sub(this.player.pos);
      const distance = this._interactionOffset.length();
      if (distance < bestDistance && distance > 0 && this._interactionOffset.dot(dir) / distance > 0.8) {
        best = candidate; bestDistance = distance;
      }
    }
    return best;
  }

  _interact() {
    const target = this._getInteraction();
    if (!target) return;
    let message;
    if (target.type === 'door') message = this.airlock.request(target.door, this.player.pos);
    else { this.stationPanel.open(target.type); return; }
    this.hud.showToast(message);
    if (target.type === 'door' && (message.startsWith('Opening') || message.startsWith('Closing'))) this._playDoorSound();
  }

  // Fim da limpeza do traje no airlock: um fato real na primeira vez, aviso quando falta energia
  _onAirlockEvent(type) {
    if (type === 'clean-skipped') {
      this.hud.showToast('No power to clean your suit: Mars dust came inside with you!', 4500);
    } else if (type === 'suit-cleaned' && !this._dustFactShown) {
      this._dustFactShown = true;
      this.hud.showToast('Suit clean! Apollo astronauts got "lunar hay fever" from dust that came inside on their suits.', 6000);
    }
  }

  _playDoorSound() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    this._audioContext ??= new AudioContextClass();
    const audio = this._audioContext;
    if (audio.state === 'suspended') audio.resume();
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(110, audio.currentTime);
    oscillator.frequency.linearRampToValueAtTime(65, audio.currentTime + 0.25);
    gain.gain.setValueAtTime(0.025, audio.currentTime);
    gain.gain.linearRampToValueAtTime(0, audio.currentTime + 0.25);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start();
    oscillator.stop(audio.currentTime + 0.25);
  }

  _buildStationMarkers() {
    const dark = new THREE.MeshLambertMaterial({ color: 0x293b43 });
    // Voxel hydroponic tray and grow lights.
    this.stationCrop = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.7, 0.65), new THREE.MeshLambertMaterial({ color: 0x61b54c }));
    this.stationCrop.position.set(-16.5, 10.7, 0); this.stationCrop.visible = false; this.scene.add(this.stationCrop);
    const colors = { treadmill: 0x38bdf8, bike: 0x4ade80, medical: 0xe76b65 };
    for (const [type, x, z] of [['treadmill', -9.2, 9.2], ['bike', -5.8, 9.5], ['medical', -7.6, 12.4]]) {
      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.48, 0.12), dark);
      const screen = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.3, 0.14), new THREE.MeshLambertMaterial({ color: colors[type], emissive: colors[type], emissiveIntensity: 0.18 }));
      frame.position.set(x, 11.4, z); screen.position.set(x, 11.4, z + 0.04);
      this.scene.add(frame, screen);
    }
    // Glowing archway indicator above the Southwest Gym Wing corridor entrance
    const gymSign = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.22, 0.14), new THREE.MeshLambertMaterial({ color: 0x38bdf8, emissive: 0x0ea5e9, emissiveIntensity: 0.45 }));
    gymSign.position.set(-5.0, 13.2, 4.9);
    this.scene.add(gymSign);
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

    // Luz clara dentro do Módulo da Academia (Gym & MedBay)
    const gymLight = new THREE.PointLight(0xe0f2fe, 1.5, 16);
    gymLight.position.set(-8, 13.0, 10.5);
    this.scene.add(gymLight);
  }

  _initHighlightWireframe() {
    const hlGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.005, 1.005, 1.005));
    const hlMat = new THREE.LineBasicMaterial({ color: 0x000000 });
    this.highlightBox = new THREE.LineSegments(hlGeo, hlMat);
    this.highlightBox.visible = false;
    this.scene.add(this.highlightBox);
  }

  _initScanner() {
    this.scanJournal = new ScanJournal({ storage: getLocalStorage() });
    this.scanner = new ScannerSystem(this.scanJournal);
    this.scannerHud = new ScannerHud();
    this.iceSensor = new IceSensorEffect(this.scene);
    this.scanHighlight = new ScanHighlight(this.scene);
    this._scanDir = new THREE.Vector3();
    this._skyPos = new THREE.Vector3();
    this._skyBodies = Object.entries(SKY_SCAN_RADII).map(([id, radius]) => ({ id, radius, dir: new THREE.Vector3() }));
    this._skyGetters = {
      sun: (t) => this.sky.getSunWorldPosition(t),
      earth: (t) => this.sky.getEarthWorldPosition(t),
      moon: (t) => this.sky.getMoonWorldPosition(t),
      phobos: (t) => this.sky.getPhobosWorldPosition(t),
      deimos: (t) => this.sky.getDeimosWorldPosition(t),
    };
    this._roverScanBox = { scanId: 'rover', minX: 0, maxX: 0, minY: 0, maxY: 0, minZ: 0, maxZ: 0 };
  }

  // Scanner aberto (com ou sem zoom): resolve o alvo na mira, avança o scan e aplica a descoberta quando completa.
  _updateScanner(dt) {
    if (!this.isScannerOpen) {
      if (this.scanner.targetId) this.scanner.reset();
      this.scanHighlight.clear();
      return;
    }

    const origin = this.camera.position;
    const dir = this.player.getLookDirection(this._scanDir);
    for (const body of this._skyBodies) {
      this._skyGetters[body.id](this._skyPos);
      body.dir.copy(this._skyPos).sub(origin).normalize();
    }

    const rp = this.roverController.pos;
    const box = this._roverScanBox;
    box.minX = rp.x - 1.6; box.maxX = rp.x + 1.6;
    box.minY = rp.y; box.maxY = rp.y + 2.7;
    box.minZ = rp.z - 1.6; box.maxZ = rp.z + 1.6;

    const target = resolveScanTarget({
      world: this.world,
      origin,
      dir,
      objects: [...this.customColliders, box],
      skyBodies: this._skyBodies,
      maxDist: this.scanJournal.scanRange(),
    });
    const state = this.scanner.update(dt, target?.id ?? null);
    this._updateScanHighlight(target, state, dt);
    this.scannerHud.update(state);
    if (state.completed) this._onScanCompleted(state.completed);
  }

  // Pinta o alvo inteiro de verde (efeito LiDAR). A forma só é recalculada quando o alvo muda.
  _updateScanHighlight(target, state, dt) {
    if (!target) {
      this.scanHighlight.clear();
      return;
    }
    const h = target.hit;
    const key = TERRAIN_PATCH_IDS.has(target.id) && h ? `${target.id}@${h.x},${h.y},${h.z}` : target.id;
    if (key !== this.scanHighlight.key) this.scanHighlight.setTarget(key, this._scanHighlightShape(target));
    this.scanHighlight.update(dt, state);
  }

  _scanHighlightShape(target) {
    const { id } = target;
    if (SKY_HIGHLIGHT_RADII[id]) {
      return { sphere: { radius: SKY_HIGHLIGHT_RADII[id], getPosition: (t) => this._skyGetters[id](t) } };
    }
    const boxes = collectScanBlocks(this.world, target).map((b) => ({
      minX: b.x, maxX: b.x + 1, minY: b.y, maxY: b.y + 1, minZ: b.z, maxZ: b.z + 1,
    }));
    for (const c of this.customColliders) {
      if (c.scanId === id) boxes.push(c);
    }
    if (id === 'rover') boxes.push({ ...this._roverScanBox });
    return boxes.length ? { boxes } : null;
  }

  _onScanCompleted({ entry, discovery }) {
    this.scannerHud.showCard(entry, discovery);
    if (!discovery.isNew) return;

    const reward = applyDiscoveryReward(entry, this.survival);
    const lines = [...reward.messages];
    if (reward.iceSensor && this.iceSensor.activate(this.world, this.player.pos) === 0) {
      lines[lines.length - 1] = 'Ice sensor online: no exposed ice in range';
    }
    if (discovery.completedCategory) {
      lines.push(
        `${getCategoryLabel(discovery.completedCategory)} complete! Scope upgraded: ` +
          `${this.scanJournal.scanDuration().toFixed(1)}s scan, ${this.scanJournal.scanRange()} block range`
      );
    }
    if (discovery.completedAll) lines.push('Every target scanned: you are a Junior Astronaut!');
    this.scannerHud.showDiscovery(`New Discovery! (${discovery.count}/${discovery.total})`, entry.title, lines);

    if (reward.inventoryChanged) {
      this.hud.renderHotbar(this.survival.slots);
      const heldSlot = this.survival.slots[this.hud.selectedSlot];
      this.playerHand.setHeldBlock(heldSlot?.id, heldSlot?.count ?? 0);
    }
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
      ? 'Radiation shield ON: a magnetic field around the base deflects solar particles. Stay inside the bubble! Uses energy.'
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

  // IGNITE: toca a animacao de decolagem e so depois mostra a tela de vitoria
  _launchMav() {
    if (!this.mission.ignite()) return;
    this.missionHud.closeMavPanel();
    this.storyHud.clearCards();
    this._updateStory(0); // registra o lancamento e congela o tempo que sobrou da janela

    this.playerHand.handGroup.visible = false;
    this.highlightBox.visible = false;
    this.waypointBeacon.hide();
    const { x, z } = MAV_CONFIG.PAD_POSITION;
    const pad = { x, y: this.mavRocket.position.y, z };
    this.engineFlame.setSize(1.0, 5.5);
    this.engineFlame.group.position.set(0, MAV_NOZZLE_Y, 0);
    this.mavRocket.add(this.engineFlame.group);
    this.puffs.clear();
    this.puffs.setColor(0xd9d2c8);
    this.cutscenes.play(createLaunchCutscene({
      camera: this.camera,
      rocket: this.mavRocket,
      flame: this.engineFlame,
      smoke: this.puffs,
      pad,
      onEnd: () => this._showVictory(),
    }));
  }

  _showVictory() {
    this.mavRocket.visible = false;
    this.engineFlame.group.visible = false;
    this.puffs.clear();
    const m = this.mission;
    const rows = [
      ['Sols on Mars (1 sol = 1 Mars day)', String(this.sky.solCount)],
      ['Radiation dose you got', `${formatDose(m.totalDoseMsv)} (NASA career limit: ${RADIATION_CONFIG.CAREER_LIMIT_MSV} mSv)`],
      ['Solar storms survived', String(m.stormsSurvived)],
      ['Oxygen made by the base', `${oxygenPointsToKg(m.oxygenProducedPoints).toFixed(2)} kg`],
      ['Ice turned into rocket fuel', `${m.iceDelivered} blocks`],
      ['Solar energy collected', `${(m.solarEnergyCollected / m.battery.capacity).toFixed(1)} full batteries`],
      ['Time left in the launch window', formatHours(this.story.windowHoursLeft ?? 0)],
    ];
    const sources = `Solar storms: real CMEs from NASA DONKI (real data from ${formatDateDMY(donkiCme.fetched)}). ` +
      'Radiation: Curiosity RAD on the Mars surface (NASA RadLab). Sunlight on Mars: 43% of Earth (NASA Mars Fact Sheet). ' +
      'Crew needs: NASA Baseline Values and Assumptions Document. Water recycling: 98%, like the Space Station. ' +
      `Earth-Mars distance and radio delay: NASA JPL Horizons (real data from ${formatDateDMY(COMMS_DELAY.date)}). ` +
      'Trip time, thin air and launch windows: NASA Mars facts.';
    this.missionHud.showVictory(rows, sources);
    document.exitPointerLock();
  }

  _updateMission(dt) {
    // Com o painel do MAV aberto o jogador continua la fora: a radiacao conta
    const playing = this.input.isLocked || this.missionHud.isMavPanelOpen;
    const active = playing && !this.survival.isDead && !this.missionHud.isVictoryShown
      && !this.cutscenes.isActive && !this.storyHud.isWindowClosedShown;
    const damage = this.mission.update(this._skyHours(), {
      insideHabitat: this.survival.insidePressurizedShip,
      insideShield: isInsideShieldZone(this.player.pos),
      active,
    });
    if (active) this.survival.takeDamage(damage * (this.stations.upgraded && !this.survival.insidePressurizedShip ? STATION_CONFIG.SUIT_RADIATION_DAMAGE_FACTOR : 1));

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

    this.missionHud.update(this.mission, { survival: this.survival, stations: this.stations });
    this._panelRefreshTimer = (this._panelRefreshTimer ?? 0) + dt;
    if (this.missionHud.isMavPanelOpen && this._panelRefreshTimer > 0.25) {
      this._panelRefreshTimer = 0;
      this._refreshMavPanel();
    }
  }

  // ---------- Historia em 3 atos e animacoes (src/story) ----------

  _initStory() {
    this.story = new StoryDirector();
    this.storyHud = new StoryHud();
    this.objectivePanelEl = document.getElementById('story-objective');
    this.objectiveActEl = document.getElementById('story-objective-act');
    this.objectiveTextEl = document.getElementById('story-objective-text');
    this._objectiveText = '';
    this._objectiveAct = 0;
    // Retrato do jogo que o diretor le a cada frame (objeto reaproveitado)
    this._storySnapshot = {
      hours: 0, insideHabitat: false, iceCount: 0, iceNeeded: 0, atConsole: false,
      stormPhase: 'calm', stormsSurvived: 0, propellantPct: 0, dataSent: false, launched: false,
    };

    // Setas do objetivo: uma flutua no mundo e a outra fica na tela (aponta mesmo atraves das paredes)
    this.waypoints = this._buildWaypoints();
    this.waypointBeacon = new WaypointBeacon(this.scene);
    this.waypointHud = new WaypointHud();

    this.cutsceneHud = new CutsceneHud({ onSkip: () => this.cutscenes.skip() });
    this.cutscenes = new CutscenePlayer({ hud: this.cutsceneHud });
    this._arrivalPlayed = false;

    // Capsula de pouso, chama e poeira ja nascem na cena para os shaders compilarem no loading
    this.lander = createLander();
    this.lander.position.set(CUTSCENE_CONFIG.LANDING_SITE.x, WORLD_CONFIG.GROUND_LEVEL + 150, CUTSCENE_CONFIG.LANDING_SITE.z);
    this.scene.add(this.lander);
    this.engineFlame = new EngineFlame();
    this.puffs = new ParticlePuffs(this.scene, { count: 96, color: 0xc98a5a });
  }

  // Posicao no mundo de cada lugar para onde a seta do objetivo pode apontar
  _buildWaypoints() {
    const ground = WORLD_CONFIG.GROUND_LEVEL + 1;
    const outerDoor = this.airlock.doors.find((door) => door.name === 'outer');
    const ice = WATER_SYSTEM_CONFIG.ICE_CRATER_CENTER;
    let iceTop = this.world.sizeY - 1;
    while (iceTop > 0 && !this.world.getBlock(ice.x, iceTop, ice.z)) iceTop--;
    const pad = MAV_CONFIG.PAD_POSITION;
    return {
      airlock: { x: 0.5, y: ground + 3.2, z: outerDoor.z + 0.5, label: WAYPOINT_LABELS.airlock },
      console: { x: 0, y: ground + 3, z: -3.6, label: WAYPOINT_LABELS.console },
      ice: { x: ice.x + 0.5, y: iceTop + 1.6, z: ice.z + 0.5, label: WAYPOINT_LABELS.ice },
      mav: { x: pad.x, y: ground + 9.2, z: pad.z, label: WAYPOINT_LABELS.mav },
    };
  }

  _playArrival() {
    this._arrivalPlayed = true;
    const site = CUTSCENE_CONFIG.LANDING_SITE;
    this.playerHand.handGroup.visible = false;
    this.highlightBox.visible = false;
    this.engineFlame.setSize(1.3, 6);
    this.engineFlame.group.position.set(0, LANDER_NOZZLE_Y, 0);
    this.lander.add(this.engineFlame.group);
    this.cutscenes.play(createArrivalCutscene({
      camera: this.camera,
      lander: this.lander,
      flame: this.engineFlame,
      dust: this.puffs,
      site,
      groundY: WORLD_CONFIG.GROUND_LEVEL + 1,
      onEnd: () => this._endArrival(),
    }));
  }

  // Fim (ou pulo) da chegada: a capsula fica no chao como objeto solido e a historia comeca
  _endArrival() {
    const site = CUTSCENE_CONFIG.LANDING_SITE;
    const groundY = WORLD_CONFIG.GROUND_LEVEL + 1;
    this.lander.position.set(site.x, groundY, site.z);
    this.lander.rotation.set(0, 0, 0);
    this.engineFlame.group.removeFromParent();
    this.engineFlame.group.visible = false;
    this.puffs.clear();
    this.customColliders.push(landerCollider(site.x, groundY, site.z));

    this.input.keys = {};
    this.player.yaw = PHYSICS_CONFIG.SPAWN_YAW;
    this.player.pitch = PHYSICS_CONFIG.SPAWN_PITCH;
    this.playerHand.handGroup.visible = !this.isZoomed;
    // O lookAt da animacao deixa a camera rolada; _updateCamera so escreve yaw e pitch
    this.camera.rotation.set(0, 0, 0);
    this._updateCamera();
    this.story.start();
  }

  _updateStory(dt) {
    const s = this._storySnapshot;
    s.hours = this._skyHours();
    s.insideHabitat = this.survival.insidePressurizedShip;
    s.iceCount = this.survival.countItem(BLOCK_IDS.MARS_ICE);
    s.iceNeeded = this.mission.iceNeeded();
    s.atConsole = this.currentInteraction === 'rover_terminal';
    s.stormPhase = this.mission.storm.phase;
    s.stormsSurvived = this.mission.stormsSurvived;
    s.propellantPct = this.mission.propellant;
    s.dataSent = this.mission.dataSent;
    s.launched = this.mission.launched;
    this.story.update(s);

    for (const event of this.story.drainEvents()) {
      if (event.type === 'card') this.storyHud.showCard(event.card);
      else if (event.type === 'start-storms') this.mission.startStorms(s.hours);
      else if (event.type === 'window-closed') {
        this.storyHud.showWindowClosed();
        this.waypointBeacon.hide();
        document.exitPointerLock();
      }
    }
    this.storyHud.update(dt);

    const text = this.story.objectiveText;
    if (text !== this._objectiveText) {
      this._objectiveText = text;
      this.expedition.objective = text;
      this.objectiveTextEl.textContent = text;
      this.objectivePanelEl.classList.toggle('hidden', !text);
    }
    if (this.story.act !== this._objectiveAct) {
      this._objectiveAct = this.story.act;
      this.objectiveActEl.textContent = ACT_TITLES[this.story.act] ?? '';
    }

    // Seta do objetivo. Dirigindo o rover a camera esta la fora, entao a rota nao passa pelo airlock.
    const inside = s.insideHabitat && !this.roverController.isActive;
    const place = this._finishedStory() ? null : routeWaypoint(objectiveTarget(this.story.objectiveId, s), inside);
    const target = place ? this.waypoints[place] : null;
    this.waypointBeacon.update(dt, target, this.camera.position);
    this.waypointHud.update(this.camera, target);
  }

  _finishedStory() {
    return this.mission.launched || this.storyHud.isWindowClosedShown;
  }

  _buildCrew(size) {
    for (const avatar of this.crewAvatars) avatar.dispose();
    this.crew = new CrewManager({ size, stations: createStations(), base: this.crewStock });
    this.crewAvatars = this.crew.members.map(
      (member, i) => new CrewAvatar(this.scene, member, CREW_CONFIG.SUIT_COLORS[i])
    );
  }

  _openCrewPanel(memberId = null) {
    this.crewPanel.open(memberId);
    this.crewPanel.render(this.crew, this.crewStock);
    document.exitPointerLock();
  }

  _closeCrewPanel() {
    this.crewPanel.close();
    requestRawPointerLock(this.renderer.domElement);
  }

  _toggleCrewPanel() {
    if (this.crewPanel.isOpen) this._closeCrewPanel();
    else if (this.input.isLocked && !this.roverController.isActive) this._openCrewPanel(null);
  }

  _assignCrew(memberId, task) {
    const result = this.crew.assign(memberId, task);
    this.hud.showToast(result.ok ? result.message : result.reason, 3500);
    if (result.ok && this.crewPanel.focusId !== null) this._closeCrewPanel();
    else this.crewPanel.render(this.crew, this.crewStock);
  }

  // Tripulante para quem o jogador esta olhando, dentro do raio de conversa.
  // Exigir o olhar evita roubar o [F] do bebedouro ou da estufa quando alguem trabalha ao lado.
  _nearestCrewMember() {
    const look = this.player.getLookDirection(this._lookDir);
    const lookLen = Math.hypot(look.x, look.z) || 1;
    let best = null;
    let bestDist = CREW_CONFIG.TALK_RADIUS;
    for (const avatar of this.crewAvatars) {
      if (!avatar.member.isActive) continue;
      const p = avatar.position;
      const dx = p.x - this.player.pos.x;
      const dz = p.z - this.player.pos.z;
      const dist = Math.hypot(dx, dz);
      const facing = dist > 0 ? (dx * look.x + dz * look.z) / (dist * lookLen) : 1;
      if (dist < bestDist && facing > CREW_CONFIG.TALK_FACING_DOT && Math.abs(this.player.pos.y - (p.y + 1.6)) < 2.2) {
        best = avatar.member;
        bestDist = dist;
      }
    }
    return best;
  }

  _updateCrew(dt) {
    const hours = this._skyHours();
    const delta = hours - (this._crewLastHours ?? hours);
    this._crewLastHours = hours;

    if (this.input.isLocked && !this.crewPicker.locked) this.crewPicker.lock();
    const playing = this.input.isLocked || this.crewPanel.isOpen;
    const active = playing && !this.survival.isDead && !this.missionHud.isVictoryShown
      && !this.cutscenes.isActive && !this.storyHud.isWindowClosedShown;

    if (active && delta > 0) {
      this.crew.update(delta, performance.now() / 1000);
      // Cura da enfermaria: so vale com o comandante dentro da base e com ar suficiente
      if (this.survival.insidePressurizedShip && this.survival.canHeal()) {
        this.survival.health = Math.min(this.survival.maxStat, this.survival.health + this.crewStock.playerHeal);
      }
    }
    this.crewStock.playerHeal = 0;
    if (active) this.crew.updateMovement(dt);

    this.mission.oxygenCostMultiplier = this.crew.oxygenCostMultiplier();
    for (const avatar of this.crewAvatars) avatar.update(dt);

    for (const event of this.crew.drainEvents()) {
      const message = crewEventMessage(event);
      if (message) this.hud.showToast(message, 5000);
    }

    this._crewPanelTimer = (this._crewPanelTimer ?? 0) + dt;
    if (this.crewPanel.isOpen && this._crewPanelTimer > 0.25) {
      this._crewPanelTimer = 0;
      this.crewPanel.render(this.crew, this.crewStock);
    }
  }

  _onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  _updateStormFog(position) {
    const distance = Math.hypot(position.x + 4, position.z);
    const fogStart = SURVIVAL_CONFIG.DUST_STORM_START_RADIUS;
    const fogRange = SURVIVAL_CONFIG.DUST_STORM_FATAL_RADIUS - fogStart;
    const strength = Math.max(0, Math.min(1, (distance - fogStart) / fogRange));
    this.scene.fog.density = 0.0015 + strength * 0.14;
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

    // Tripulante por perto: [F] para dar uma ordem
    const member = this._nearestCrewMember();
    if (member) {
      this.currentInteraction = 'crew';
      this.talkTarget = member.id;
      this.hud.setInteractionPrompt(true, `[F] Talk to ${member.name} (${member.role}) · [C] Crew panel`);
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
      this.hud.setInteractionPrompt(true, '[F] Harvest Carrot (Irrigated Greenhouse)');
      return;
    }

    this.currentInteraction = null;
    this.hud.setInteractionPrompt(false);
  }

  handlePlayerInteract() {
    if (this.missionHud.isVictoryShown) return;
    if (this.crewPanel.isOpen) {
      this._closeCrewPanel();
      return;
    }
    if (this.currentInteraction === 'crew' && this.input.isLocked) {
      this._openCrewPanel(this.talkTarget);
      return;
    }
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

    const station = this._getInteraction();
    if (station && !['water_dispenser', 'rover_terminal', 'greenhouse'].includes(this.currentInteraction) && station.type !== 'mav') {
      this._interact();
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
      this.hud.showToast('Rover ready. Head to the ice crater to collect water.');
    }
  }

  start() {
    const loop = () => {
      requestAnimationFrame(loop);

      const now = performance.now();
      const frameMs = now - this.lastTime;
      const dt = Math.min(frameMs / 1000, 0.05);
      this.lastTime = now;

      // Primeiro Play: a historia abre com a animacao de chegada
      if (!this._arrivalPlayed && this.input.isLocked && !this.input.isPortraitRequired) this._playArrival();
      const cutsceneActive = this.cutscenes.isActive;

      const isGameRunning = this.input.isLocked
        && !this.input.isPortraitRequired
        && !this.survival.isDead
        && !this.hud.isInventoryOpen
        && !this.stationPanel.isOpen
        && !this.missionHud.isVictoryShown
        && !cutsceneActive
        && !this.storyHud.isWindowClosedShown;
      if (isGameRunning) {
        if (this.roverController.isActive) {
          if (this.scanHighlight.mesh) this.scanHighlight.clear();
          this.roverController.update(dt, this.input.keys);
          this.sky.update(dt, this.roverController.pos);
          this._updateSurvival(dt);
          this.highlightBox.visible = false;
          this.hud.update({ player: this.player, survival: this.survival, sky: this.sky, camera: this.camera, isScopeOpen: false, isRoverActive: true, roverTelemetry: this.roverController.getTelemetry(), mission: this.mission });
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

          this.hud.update({ player: this.player, survival: this.survival, sky: this.sky, camera: this.camera, isScopeOpen: this.isScannerOpen, isRoverActive: false, mission: this.mission, airlock: this.airlock });
          this._updateScanner(dt);
        }
      } else if (cutsceneActive) {
        // A animacao comanda a camera. Ela espera se o mouse soltar ou o aparelho for para retrato.
        if (!this.input.isPortraitRequired && (this.input.isLocked || this.cutscenes.runsUnlocked)) {
          this.cutscenes.update(dt);
        }
        this.sky.update(dt, this.camera.position);
      } else {
        if (this.roverController.isActive) this.roverController.update(dt, {});
        this._updateCamera();
        this.sky.update(dt, this.player.pos);
      }

      const pickedUpBlocks = this.world.updateDrops(dt, this.player.pos, (id) => id === BLOCK_IDS.HYDRO_PLANT ? this.survival.addHarvestedCrop() : this.survival.addBlockToInventory(id));
      if (pickedUpBlocks.length > 0) {
        if (pickedUpBlocks.includes(BLOCK_IDS.REGOLITH) && !this.survival.isPlayerInsideShip(this.player.pos)) {
          this.stations.samples += pickedUpBlocks.filter(id => id === BLOCK_IDS.REGOLITH).length;
        }
        this.hud.renderHotbar(this.survival.slots);
        const heldSlot = this.survival.slots[this.hud.selectedSlot];
        this.playerHand.setHeldBlock(heldSlot?.id, heldSlot?.count ?? 0);
        this.hud.showToast(pickedUpBlocks.every((id) => id === BLOCK_IDS.HYDRO_PLANT) ? 'Picked up a Mars carrot' : `Picked up ${pickedUpBlocks.length} item${pickedUpBlocks.length > 1 ? 's' : ''}`);
      }

      this.iceSensor.update(dt);
      this.shieldBubble.update(dt, { on: this.mission.shieldOn, storm: this.mission.storm.phase === 'active' });
      if (!isGameRunning && !this.roverController.isActive) this.playerHand.update(dt, false);
      this._updateMission(dt);
      this._updateCrew(dt);
      if (isGameRunning && !this.roverController.isActive) this._updateExpedition(dt);
      if (isGameRunning) this._updateStory(dt);

      this._updateStormFog(this.roverController.isActive ? this.roverController.pos : this.player.pos);
      this.renderer.render(this.scene, this.camera);
      this.debug.frame(frameMs);
    };

    loop();
  }
}
