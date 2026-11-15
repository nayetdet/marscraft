import { GREENHOUSE_CENTER, GARDEN_CROP_BED, GREENHOUSE_MONITOR_POS, GREENHOUSE_BASKETS } from '../world/greenhouseLayout.js';
import { createCropPlantModel } from '../graphics/cropModels.js';
import * as THREE from 'three';
import { CAMERA_CONFIG, CROP_CONFIG, MISSION_CONFIG, STATION_CONFIG, CREW_CONFIG, MAV_CONFIG, RADIATION_CONFIG, WATER_SYSTEM_CONFIG, CUTSCENE_CONFIG, PHYSICS_CONFIG, SURVIVAL_CONFIG, WORLD_CONFIG } from '../config/constants.js';
import { separateCrew } from '../crew/separateCrew.js';
import { CrewManager } from '../crew/CrewManager.js';
import { CrewAvatar } from '../crew/CrewAvatar.js';
import { createBaseStock } from '../crew/baseStock.js';
import { createStations } from '../crew/stations.js';
import donkiCme from '../data/donkiCme.json';
import { MissionSystem, oxygenPointsToKg } from '../mission/MissionSystem.js';
import { NO_STORM_DATA_TEXT, formatDateDMY, formatDose, formatHours, stormEventMessage } from '../mission/missionText.js';
import { MissionHud } from '../ui/MissionHud.js';
import { requestRawPointerLock } from '../player/mouseLook.js';
import { createCarrotTexture } from '../graphics/carrotTexture.js';
import { BLOCK_IDS } from '../config/blockTypes.js';
import { createBlockMaterials } from '../graphics/blockMaterials.js';
import { MarsSkySystem } from '../sky/MarsSkySystem.js';
import { DustStormEffect } from '../sky/DustStormEffect.js';
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
import { GymEquipmentController } from '../player/GymEquipmentController.js';
import { ExpeditionState } from './ExpeditionState.js';
import { Airlock } from '../world/Airlock.js';
import { StationSystem } from './StationSystem.js';
import { StationPanel } from '../ui/StationPanel.js';
import { AdminPanel } from '../ui/AdminPanel.js';
import { UtilityModule } from './UtilityModule.js';
import { CommsLink } from '../mission/commsLink.js';
import { passiveDemandFactor } from '../mission/pacing.js';
import { AudioManager } from '../audio/AudioManager.js';
import { getCategoryLabel } from '../data/scanCatalog.js';
import { ScanJournal } from '../scanner/scanJournal.js';
import { ScannerSystem, applyDiscoveryReward } from '../scanner/ScannerSystem.js';
import { resolveScanTarget, collectScanBlocks } from '../scanner/scanTargeting.js';
import { ScanHighlight } from '../scanner/scanHighlight.js';
import { isInsideShieldZone, SHIELD_ZONE } from '../mission/shieldZone.js';
import { HABITAT_LAYOUT, SOLAR_FIELD_CENTER, isInsideShelter } from '../world/habitatLayout.js';
import { ShieldBubble } from '../graphics/shieldBubble.js';
import { IceSensorEffect } from '../scanner/iceSensor.js';
import { ScannerHud } from '../ui/ScannerHud.js';
import { buildBaseDecor } from '../base/baseDecor.js';
import { buildGreenhouseFields } from '../base/greenhouseFields.js';
import { MenuScreens } from '../ui/MenuScreens.js';
import { StoryDirector } from '../story/StoryDirector.js';
import { objectiveView } from '../story/objectiveView.js';
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
// Topo do piso do habitat (y = 10), onde a agua do abrigo comeca
const SHELTER_FLOOR_TOP = HABITAT_LAYOUT.FLOOR_Y + 1;

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
    this.renderer.localClippingEnabled = true;
    this.container.appendChild(this.renderer.domElement);

    const { materials, previews, atlas } = createBlockMaterials();
    const carrot = createCarrotTexture();
    previews[BLOCK_IDS.HYDRO_PLANT] = carrot.dataUrl;
    this.sky = new MarsSkySystem(this.scene);
    this.dustStorm = new DustStormEffect(this.scene, this.renderer);
    this.world = new VoxelWorld(this.scene, materials, atlas, carrot.texture);

    // Modelos 3D detalhados estilo Mod de Minecraft + Caixas de Colisão AABB
    const { group: customModels, colliders, plants, rover, roverWheels, rocket } = buildNasaCustomModels(this.scene);
    this.mavRocket = rocket;
    this.customModels = customModels;
    this.plants = plants;
    this.customColliders = colliders;

    // Zonas, placas, posteres e telas vivas da base (as caixas de colisao entram em `colliders`)
    this.baseDecor = buildBaseDecor(this.scene, colliders);
    for (const point of this.baseDecor.infoPoints) point.type = 'info';
    this._displayTimer = 1;

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
    // O rover carrega no deposito puxando da bateria da base (issue #111)
    this.roverController.basePower = this.mission.battery;
    // Radio Terra-Marte (issue #56, A2): atraso pela distancia real de hoje e conjuncao solar
    this.comms = new CommsLink({ startDate: new Date(), startHours: this._skyHours() });
    this._wasBlackout = false;
    // As estacoes da base gastam a mesma bateria da missao
    this.expedition = new ExpeditionState(this.mission.battery);
    this.airlock = new Airlock(this.scene, colliders, this.expedition);
    this.stations = new StationSystem(this.expedition);
    // Campos da estufa: plantas 3D por campo. O jardim ja comeca com uma batata pronta para colher
    // e um campo de dentro com alface crescendo.
    this.greenhouseFields = buildGreenhouseFields(this.scene);
    this.stations.plots[0].crop = { type: 'potato', progress: CROP_CONFIG.potato.seconds };
    this.stations.plots[1].crop = { type: 'lettuce', progress: CROP_CONFIG.lettuce.seconds / 2 };
    this.airlock.stations = this.stations;
    this.airlock.onEvent = (type) => this._onAirlockEvent(type);
    this.stationPanel = new StationPanel(this);
    this.adminPanel = new AdminPanel(this); // F8 no dev ou ?admin: testes (tempestade, agua, teleporte)
    this._buildStationMarkers();
    this._interactionDir = new THREE.Vector3();
    this._interactionOffset = new THREE.Vector3();
    this._interactionPoint = new THREE.Vector3();
    this._lastStorm = false;
    this._lastStormWarning = false;
    this.audio = new AudioManager();

    // Maozinha 3D do jogador em primeira pessoa
    this.playerHand = new PlayerHand(this.camera, materials, carrot.texture);
    const firstSlot = this.survival.slots[0];
    this.playerHand.setHeldBlock(firstSlot?.id, firstSlot?.count ?? 0);

    this.hud = new HudManager(previews, this.survival.slots, {
      onOpenJournal: () => this.input.openJournal(),
      onInventorySwap: (fromIndex, toIndex) => {
        const inventorySlots = this.survival.swapInventorySlots(fromIndex, toIndex);
        this.hud.renderHotbar(this.survival.slots);
        const heldSlot = this.survival.slots[this.hud.selectedSlot];
        this.playerHand.setHeldBlock(heldSlot?.id, heldSlot?.count ?? 0);
        return inventorySlots;
      },
    });

    this.gymController = new GymEquipmentController({
      scene: this.scene,
      camera: this.camera,
      player: this.player,
      stations: this.stations,
      expedition: this.expedition,
      hud: this.hud,
      onPlaySound: (f1, d, f2) => this._playGymTone(f1, d, f2),
      onDismount: () => {
        this.playerHand.handGroup.visible = !this.isZoomed && !this.roverController.isActive;
        this.hud.showToast('Stepped off gym equipment');
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
    // Modulo norte (issue #56, parte B): energia/aquecimento, cozinha, banheiro e oficina
    this.utility = new UtilityModule({ mission: this.mission, survival: this.survival, stations: this.stations, base: this.crewStock });
    this._utilityHours = null;
    this.crewAvatars = [];
    this._buildCrew(CREW_CONFIG.NAMES.length);
    this.menuScreens = new MenuScreens({
      donkiDate: formatDateDMY(donkiCme.fetched),
      onDemo: (action) => this._runDemo(action),
    });

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
        if (!this.roverController.isActive && !this.gymController.isActive) {
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
      isGymActive: () => this.gymController.isActive,
      onGymAction: () => this.gymController.triggerRep(),
      onGymLook: (dx, dy) => this.gymController.look(dx, dy),
      onInteract: () => this.handlePlayerInteract(),
      onRoverAction: () => this.handleRoverAction(),
      onRoverLook: (dx, dy) => this.roverController.look(dx, dy),
      onToggleShield: () => this._toggleShield(),
      onSendData: () => this._sendScienceData(),
      isMissionModalOpen: () =>
        this.missionHud.isMavPanelOpen || this.missionHud.isVictoryShown
        || this.storyHud.isWindowClosedShown,
      isInputBlocked: () => this.cutscenes.isActive,
      getInteraction: () => this._getInteraction(),
      isStationOpen: () => this.stationPanel.isOpen || this.adminPanel.isOpen,
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
    this._updateUtility();
    const greenhouseLit = this.utility.greenhouseLightsOn && !this.utility.cold;
    this.expedition.greenhousePowered = greenhouseLit && this.expedition.spend(this.utility.greenhouseLightsCost(dt));
    this.stations.update(dt, insideCore, this.survival, !inside);
    this.stations.updateCrewHarvest(dt, this.crew.members.some(member => member.task === 'greenhouse' && member.stationary && member.canWork));
    this._updateShelterWater();
    this.updateCropVisuals();
    this.airlock.update(dt, this.player.pos);
    if (this.survival.health <= 0) this.survival.isDead = true;
    const hasPriorityInteraction = ['crew', 'water_dispenser', 'rover_terminal', 'mav', 'greenhouse', 'info'].includes(this.currentInteraction);
    document.getElementById('interaction-hint').textContent = (hasPriorityInteraction || this.gymController.isActive) ? '' : (this._getInteraction()?.label ?? '');
    document.getElementById('mission-status').textContent = `POWER ${Math.round(this.expedition.energy)}%`;
    document.getElementById('co2-overlay').style.opacity = String(Math.max(0, (this.stations.co2 - 40) / 150));
    document.getElementById('station-warning').textContent = this.stations.contaminated ? 'DUST IN HABITAT: clean at life support' : this.stations.co2 >= 40 ? `CO2 ${Math.round(this.stations.co2)}%: replace filter` : (this.stations.fitness < 40 || this.stations.boneDensity < 40) ? 'Low bone density / fitness: work is slower. Train in the Gym Wing!' : '';
  }

  // Avanca o modulo norte no relogio do ceu e repassa o estado para a tripulacao
  _updateUtility() {
    const hours = this._skyHours();
    const delta = this._utilityHours === null ? 0 : Math.max(0, hours - this._utilityHours);
    this._utilityHours = hours;
    this.utility.update(delta);
    this.crewStock.frozen = this.utility.cold;
    this.crewStock.greenhouseDark = !this.utility.greenhouseLightsOn;
    this.crewStock.waterRecovery = this.utility.waterRecovery;

    this.comms.update(hours);
    this.mission.radioBlackout = this.comms.blackout;
    if (this.comms.blackout !== this._wasBlackout) {
      this._wasBlackout = this.comms.blackout;
      this.hud.showToast(this.comms.blackout
        ? 'SOLAR CONJUNCTION: the Sun is between Mars and Earth. The radio is silent, so you must decide on your own!'
        : 'The Sun moved away: radio contact with Earth is back.', 7000);
    }
    if (this.stations.arrived) {
      this.hud.showToast(this.stations.arrived, 8000);
      this.stations.arrived = null;
    }
  }

  // Resposta do Controle da Missao, montada com a situacao do momento do envio.
  // Ela chega atrasada: ate la, a situacao pode ter mudado.
  missionControlAdvice() {
    const m = this.mission;
    const phase = m.storm.phase;
    if (phase === 'active' || phase === 'warning') return 'A solar storm is on the way. Fill the shelter water wall and hide in the storm shelter.';
    if (m.battery.percent < 30) return 'Your battery is low. Turn off the fuel factory or the greenhouse lights until the Sun is back, but keep the heater on at night.';
    if (m.shelterWaterL < 20 && this.survival.baseWater > 30) return 'Put some water in the storm shelter wall before the next storm.';
    if (this.utility.waterFilter < 30) return 'Your water filter is dirty. Clean it in the bathroom so you get back more water.';
    if ((this.crew?.stations ?? []).some((st) => st.health < 0.5)) return 'A crew station is wearing out. Print a spare part in the workshop.';
    if (this.comms.hoursUntilConjunction < 12) return 'Solar conjunction is coming: the radio will go silent for a while. Plan ahead!';
    return 'Everything looks good from here. Keep collecting ice and science samples.';
  }

  // Opcoes de envio do radio no estado atual
  radioOptions(withAdvice = false) {
    return {
      delaySeconds: this.comms.roundTripGameSeconds,
      blackout: this.comms.blackout,
      advice: withAdvice ? this.missionControlAdvice() : null,
    };
  }

  _harvestCrop(plant) {
    const index = this.plants.indexOf(plant);
    if (index < 0) return false;
    this.plants.splice(index, 1);
    const collider = plant.userData.collider;
    const colliderIndex = this.customColliders.indexOf(collider);
    if (colliderIndex >= 0) this.customColliders.splice(colliderIndex, 1);
    plant.removeFromParent();
    return true;
  }

  _getInteraction() {
    const dir = this.player.getLookDirection(this._interactionDir);
    let best = null, bestDistance = 4;
    const candidates = [
      ...this.airlock.doors.map(door => ({ type: 'door', door, x: 0.5, y: 11.4, z: door.z, label: 'Press F: cycle airlock' })),
      { type: 'power', x: 10.6, y: 11.4, z: -3, label: 'Press F: life support' },
      { type: 'console', x: 8.25, y: 11.5, z: -10.8, label: 'Press F: mission computer' },
      { type: 'science', x: 9.75, y: 11.5, z: -10.8, label: 'Press F: science & radio to Earth' },
      { type: 'shelter', x: 5.7, y: 11.3, z: 4.825, label: 'Press F: storm shelter water wall' },
      { type: 'powerroom', x: -15.5, y: 11.5, z: -16.5, label: 'Press F: power & heat control' },
      { type: 'powerroom', x: -15.5, y: 10.8, z: -24.4, label: 'Press F: power & heat control' },
      { type: 'galley', x: 13.1, y: 11.35, z: -16.2, label: 'Press F: kitchen' },
      { type: 'galley', x: 16.1, y: 11.3, z: -21.0, label: 'Press F: pantry & kitchen' },
      { type: 'hygiene', x: -16.0, y: 11.1, z: -38.3, label: 'Press F: bathroom & water recycler' },
      { type: 'hygiene', x: -19.85, y: 11.6, z: -32.5, label: 'Press F: bathroom & water recycler' },
      { type: 'workshop', x: 11.5, y: 11.5, z: -38.1, label: 'Press F: 3D printer workshop' },
      { type: 'greenhouse', x: GREENHOUSE_MONITOR_POS.x, y: GREENHOUSE_MONITOR_POS.y, z: GREENHOUSE_MONITOR_POS.z, minDot: 0.72, label: 'Click or press F: Food Monitor' },
      ...GREENHOUSE_BASKETS.map(basket => ({ ...basket, cropType: basket.type, type: 'basket', minDot: 0.95, label: `Press F or tap: collect ${basket.type}` })),
      { type: 'treadmill', x: -9.2, y: 11.2, z: 10.2, label: 'Press F or Click: get on space treadmill (bone density)' },
      { type: 'bike', x: -5.8, y: 11.2, z: 10.4, label: 'Press F or Click: get on exercise bike (muscle & cardio)' },
      { type: 'medical', x: -7.6, y: 11.3, z: 12.1, label: 'Press F or Click: medbay & bone scanner' },
    ];
    for (const candidate of candidates) {
      this._interactionPoint.set(candidate.x, candidate.y, candidate.z);
      this._interactionOffset.copy(this._interactionPoint).sub(this.player.pos);
      const distance = this._interactionOffset.length();
      const minDot = candidate.minDot ?? 0.8;
      if (distance < bestDistance && distance > 0 && this._interactionOffset.dot(dir) / distance > minDot) {
        best = candidate; bestDistance = distance;
      }
    }
    // Posteres e equipamentos explicativos: cone de mira mais fechado, para nao roubar o [F] das estacoes
    for (const point of this.baseDecor.infoPoints) {
      this._interactionOffset.set(point.x, point.y, point.z).sub(this.player.pos);
      const distance = this._interactionOffset.length();
      if (distance < Math.min(bestDistance, 3.6) && distance > 0 && this._interactionOffset.dot(dir) / distance > 0.93) {
        best = point; bestDistance = distance;
      }
    }
    return best;
  }

  _interact() {
    const target = this._getInteraction();
    if (!target) return;
    let message;
    if (target.type === 'info') { this.hud.showToast(target.text(this._baseState()), 8000); return; }
    if (target.type === 'basket') { this.hud.showToast(this.stations.collectBasket(target.cropType, this.survival)); return; }
    if (target.type === 'door') message = this.airlock.request(target.door, this.player.pos);
    else if (target.type === 'treadmill' || target.type === 'bike') {
      this.mountGym(target.type);
      return;
    } else {
      this.stationPanel.open(target.type);
      return;
    }
    this.hud.showToast(message);
  }

  mountGym(mode) {
    this.gymController.mount(mode);
    this.playerHand.handGroup.visible = false;
    this.highlightBox.visible = false;
    this.currentInteraction = null;
    this.hud.setInteractionPrompt(false);
    document.getElementById('interaction-hint').textContent = '';
  }

  dismountGym() {
    if (!this.gymController.isActive) return;
    this.gymController.dismount();
  }

  _playGymTone(freq = 360, duration = 0.08, secondFreq = null) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    this._audioContext ??= new AudioContextClass();
    const audio = this._audioContext;
    if (audio.state === 'suspended') audio.resume();
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(freq, audio.currentTime);
    if (secondFreq) {
      oscillator.frequency.setValueAtTime(secondFreq, audio.currentTime + duration * 0.45);
    }
    gain.gain.setValueAtTime(0.03, audio.currentTime);
    gain.gain.linearRampToValueAtTime(0, audio.currentTime + duration);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start();
    oscillator.stop(audio.currentTime + duration);
  }

  // Fim da limpeza do traje no airlock: um fato real na primeira vez, aviso quando falta energia
  _onAirlockEvent(type) {
    if (type === 'door-open') {
      this.audio.playDoorOpen();
    } else if (type === 'door-close') {
      this.audio.playDoorClose();
    } else if (type === 'depressurize') {
      this.audio.playDecompression();
    } else if (type === 'manual-open') {
      this.audio.playManualCrank();
    } else if (type === 'clean-skipped') {
      this.hud.showToast('No power to clean your suit: Mars dust came inside with you!', 4500);
    } else if (type === 'suit-cleaned' && !this._dustFactShown) {
      this._dustFactShown = true;
      this.hud.showToast('Suit clean! Apollo astronauts got "lunar hay fever" from dust that came inside on their suits.', 6000);
    }
  }

  // Nivel da agua nas paredes do abrigo de tempestade (issue #56)
  _buildShelterWater() {
    const L = HABITAT_LAYOUT;
    const material = new THREE.MeshLambertMaterial({ color: 0x38bdf8, emissive: 0x0369a1, emissiveIntensity: 0.25, transparent: true, opacity: 0.75 });
    const floor = SHELTER_FLOOR_TOP;
    const midX = (L.SHELTER_X_MIN + L.SHELTER_X_MAX) / 2;
    const midZ = (L.SHELTER_Z_MIN + L.SHELTER_Z_MAX) / 2;
    const width = L.SHELTER_X_MAX - L.SHELTER_X_MIN;
    const depth = L.SHELTER_Z_MAX - L.SHELTER_Z_MIN;
    this.shelterWater = [
      [midX, L.SHELTER_Z_MIN + 0.07, width, 0.1],
      [midX, L.SHELTER_Z_MAX - 0.07, width, 0.1],
      [L.SHELTER_X_MAX - 0.07, midZ, 0.1, depth - 0.2],
    ].map(([x, z, w, d]) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, 1, d), material);
      mesh.position.set(x, floor, z);
      mesh.visible = false;
      this.scene.add(mesh);
      return mesh;
    });
    this._shelterWaterShown = -1;
  }

  _updateShelterWater() {
    const liters = this.mission.shelterWaterL;
    if (liters === this._shelterWaterShown) return;
    this._shelterWaterShown = liters;
    const height = 2.2 * liters / RADIATION_CONFIG.SHELTER_WALL_MAX_L;
    for (const mesh of this.shelterWater) {
      mesh.visible = height > 0.01;
      mesh.scale.y = Math.max(0.01, height);
      mesh.position.y = SHELTER_FLOOR_TOP + 0.05 + height / 2;
    }
  }

  _buildStationMarkers() {
    this._buildShelterWater();
    const dark = new THREE.MeshLambertMaterial({ color: 0x293b43 });
    // Voxel hydroponic tray and grow lights.
    this.stationCrop = new THREE.Group();
    this.stationCropModels = Object.fromEntries(Object.keys(CROP_CONFIG).map(type => {
      const model = createCropPlantModel(type); model.visible = false;
      this.stationCrop.add(model); return [type, model];
    }));
    this.stationCrop.position.set(GREENHOUSE_CENTER.x + GARDEN_CROP_BED.dx + 0.5, WORLD_CONFIG.GROUND_LEVEL + 2, GREENHOUSE_CENTER.z + GARDEN_CROP_BED.dz + 0.5); this.stationCrop.visible = false; this.scene.add(this.stationCrop);
    const colors = { treadmill: 0x38bdf8, bike: 0x4ade80, medical: 0xe76b65 };
    for (const [type, x, z] of [['treadmill', -9.2, 9.2], ['bike', -5.8, 9.5], ['medical', -7.6, 12.4]]) {
      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.48, 0.12), dark);
      const screen = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.3, 0.14), new THREE.MeshLambertMaterial({ color: colors[type], emissive: colors[type], emissiveIntensity: 0.18 }));
      frame.position.set(x, 11.4, z); screen.position.set(x, 11.4, z + 0.04);
      this.scene.add(frame, screen);
    }
  }

  _initBaseLights() {
    // Luz clara dentro do Módulo Hab Branco Principal
    const habLight = new THREE.PointLight(0xffffff, 1.8, 32);
    habLight.position.set(3.5, 13.0, -2.5);
    this.scene.add(habLight);

    // Luz clara dentro da Redoma de Estufa
    const domeLight = new THREE.PointLight(0xf0fdf4, 1.7, 38);
    domeLight.position.set(HABITAT_LAYOUT.DOME_X + 0.5, 18, HABITAT_LAYOUT.DOME_Z + 0.5);
    this.scene.add(domeLight);

    // Luz do Modulo Norte (issue #56)
    // Ala norte: uma luz para cada par de modulos (energia + cozinha, banheiro + oficina)
    for (const z of [-21, -35]) {
      const northLight = new THREE.PointLight(0xf8fafc, 1.8, 36);
      northLight.position.set(-2.5, 13.0, z);
      this.scene.add(northLight);
    }

    // Luz clara dentro do Módulo da Academia (Gym & MedBay)
    // Luz do dormitorio (ala leste)
    const dormLight = new THREE.PointLight(0xfef3c7, 1.5, 18);
    dormLight.position.set(23.5, 13.0, -5.5);
    this.scene.add(dormLight);

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
      if (c.scanId === id || (id === 'base' && !c.scanId)) boxes.push(c);
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
    if (lines.length) this.scannerHud.showDiscovery('Discovery reward!', entry.title, lines);

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

  _applyDamageScreenShake(now) {
    const s = this.survival;
    if (s.isDead || s.damageFeedbackTime <= 0) return;
    const strength = SURVIVAL_CONFIG.DAMAGE_SHAKE_AMPLITUDE
      * (s.damageFeedbackTime / SURVIVAL_CONFIG.DAMAGE_FEEDBACK_SECONDS);
    const phase = now * 0.001 * SURVIVAL_CONFIG.DAMAGE_SHAKE_RATE;
    this.camera.position.x += Math.sin(phase) * strength;
    this.camera.position.y += Math.cos(phase * 1.27) * strength * 0.6;
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
    if (this.comms.blackout) {
      this.hud.showToast('Radio silent: the Sun is between Mars and Earth. Send the data after the solar conjunction.', 5000);
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
    this.survival.update(dt, this.player.pos, this.mission.oxygenRefillBudget(), this.world.brokenBaseWindows.size > 0);
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
    const sources = `Solar storms: real CMEs that NASA predicted would reach Mars, from NASA DONKI (real data from ${formatDateDMY(donkiCme.fetched)}). ` +
      'Radiation: Curiosity RAD on the Mars surface (NASA RadLab); how strong each storm is in the game is a game rule, never above the biggest storm Curiosity measured. ' +
      'Sunlight on Mars: 43% of Earth (NASA Mars Fact Sheet). ' +
      'Crew needs: NASA Baseline Values and Assumptions Document. Water recycling: 98%, like the Space Station. ' +
      'Storm shelter water wall: PREDICCS shielding model (University of New Hampshire, Curiosity RAD data) and NASA storm shelter studies. ' +
      'Radio delay: Earth-Mars distance from NASA/JPL planet orbits; solar conjunction rules from NASA/JPL. ' +
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
      insideShelter: this.survival.insidePressurizedShip && isInsideShelter(this.player.pos.x, this.player.pos.z),
      active,
    });
    if (active) this.survival.takeDamage(
      damage * (this.stations.upgraded && !this.survival.insidePressurizedShip ? STATION_CONFIG.SUIT_RADIATION_DAMAGE_FACTOR : 1),
      'RADIATION_OVERDOSE',
      'solar-radiation',
    );

    if (this.survival.isDead && !this._wasDead) {
      this.mission.markDeath();
      this.missionHud.closeMavPanel(); // a tela de morte precisa aparecer por cima
      this.hud.showDeathScreen(this.survival); // a radiacao pode matar depois do hud.update deste frame
    }
    this._wasDead = this.survival.isDead;

    for (const event of this.mission.drainEvents()) {
      const message = stormEventMessage(event, donkiCme.fetched);
      if (message) this.hud.showToast(message, event.type === 'storm-warning' ? 8000 : 4500);
    }

    this.missionHud.update(this.mission, { survival: this.survival, stations: this.stations, world: this.world });
    this._panelRefreshTimer = (this._panelRefreshTimer ?? 0) + dt;
    if (this.missionHud.isMavPanelOpen && this._panelRefreshTimer > 0.25) {
      this._panelRefreshTimer = 0;
      this._refreshMavPanel();
    }
  }

  // O que esta plantado na estufa: o canteiro do jardim (campo 0) e os campos da redoma.
  // Tambem chamado pelo monitor de comida, que faz as plantas crescerem com o jogo pausado.
  updateCropVisuals() {
    const crop = this.stations.plots[0].crop;
    this.stationCrop.visible = Boolean(crop);
    if (crop) {
      this.stationCrop.scale.y = 0.2 + 0.8 * crop.progress / CROP_CONFIG[crop.type].seconds;
      for (const [type, model] of Object.entries(this.stationCropModels)) model.visible = type === crop.type;
    }
    this.greenhouseFields.update(this.stations.plots, this.stations.harvestBaskets);
  }

  // Estado do jogo que as telas e os pontos de informacao da base mostram
  _baseState() {
    const m = this.mission;
    const storm = m.storm;
    return {
      sol: this.sky.solCount,
      timeOfDay: Math.floor(this.sky.timeOfDay * 6) / 6, // relogio de 10 em 10 min: menos redesenhos
      batteryPct: m.battery.percent,
      chargeRate: m.chargeRate,
      shieldOn: m.shieldOn,
      factoryOn: m.factoryOn,
      factoryBusy: m.factoryOn && m.iceStock > 0 && m.propellant < 100,
      greenhousePowered: this.expedition.greenhousePowered,
      dusty: this.stations.contaminated,
      storm: {
        phase: storm.phase,
        hoursUntil: storm.hoursUntil,
        hoursLeft: storm.hoursLeft ?? 0,
        speedKmS: storm.storm?.cme.speedKmS ?? 0,
        date: storm.storm ? formatDateDMY(storm.storm.cme.startTime) : '',
      },
      doseRate: m.doseRate,
      totalDose: m.totalDoseMsv,
      water: this.survival.baseWater,
      maxWater: this.survival.maxBaseWater,
      fields: { planted: this.stations.plantedPlotCount(), ready: this.stations.readyPlotCount(), total: this.stations.plots.length },
      inShelter: m.insideShelter,
      shelterWaterL: m.shelterWaterL,
      donkiDate: formatDateDMY(donkiCme.fetched),
    };
  }

  _updateBaseDisplays(dt) {
    this._displayTimer += dt;
    if (this._displayTimer < 0.5) return;
    this._displayTimer = 0;
    this.baseDecor.displays.update(this._baseState());
  }

  // Controles de demo do menu (para jurados e para gravar o video): mexem so no relogio e na bateria
  _runDemo(action) {
    if (action === 'storm') {
      if (!this.mission.triggerStormSoon()) {
        return this.mission.noStormData ? NO_STORM_DATA_TEXT : 'A solar storm is already hitting the base.';
      }
      return 'Storm warning sent. Press Back, then Play: the solar storm hits in about 10 seconds.';
    }
    if (action === 'night' || action === 'noon') {
      const target = action === 'night' ? 21 : 12;
      this.sky.advanceTime((target - this.sky.timeOfDay + 24) % 24);
      return action === 'night'
        ? 'It is now night on Mars: the solar panels make no power.'
        : 'It is now noon on Mars: the solar panels are charging the battery.';
    }
    if (action === 'battery') {
      this.mission.battery.charge = Math.min(this.mission.battery.charge, this.mission.battery.capacity * 0.1);
      return 'Battery drained to 10%. Watch what the base has to give up.';
    }
    return '';
  }

  // ---------- Historia em 3 atos e animacoes (src/story) ----------

  _initStory() {
    // A historia usa o mesmo radio do terminal da base (CommsLink): distancia e atraso de hoje
    this.story = new StoryDirector({
      replyDelayHours: this.comms.roundTripGameSeconds * MISSION_CONFIG.GAME_HOURS_PER_SECOND,
      comms: {
        millionKm: Math.round(this.comms.distanceKm / 1e6),
        oneWayMinutes: Math.round(this.comms.lightMinutes),
        dateIso: this.comms.date.toISOString(),
      },
    });
    this.storyHud = new StoryHud();
    this._objectiveText = '';
    // Retrato do jogo que o diretor le a cada frame (objeto reaproveitado)
    this._storySnapshot = {
      hours: 0, insideHabitat: false, iceCount: 0, iceNeeded: 0, atConsole: false,
      stormPhase: 'calm', stormsSurvived: 0, propellantPct: 0, dataSent: false, launched: false,
      needsBase: false,
    };

    // Setas do objetivo: uma flutua no mundo e a outra fica na tela (aponta mesmo atraves das paredes)
    this.waypoints = this._buildWaypoints();
    this._brokenWindowIndex = null;
    this._brokenWindowWaypoint = { x: 0, y: 0, z: 0, label: 'BROKEN WINDOW' };
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
    // Chama do foguete na previa da missao, no fim da animacao de chegada
    this.previewFlame = new EngineFlame();
    this._mavHome = new THREE.Vector3();
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
    const shelterX = (HABITAT_LAYOUT.SHELTER_X_MIN + HABITAT_LAYOUT.SHELTER_X_MAX) / 2;
    const shelterZ = (HABITAT_LAYOUT.SHELTER_Z_MIN + HABITAT_LAYOUT.SHELTER_Z_MAX) / 2;
    return {
      airlock: { x: 0.5, y: ground + 3.2, z: outerDoor.z + 0.5, label: WAYPOINT_LABELS.airlock },
      console: { x: 4, y: ground + 3, z: -9.6, label: WAYPOINT_LABELS.console },
      ice: { x: ice.x + 0.5, y: iceTop + 1.6, z: ice.z + 0.5, label: WAYPOINT_LABELS.ice },
      mav: { x: pad.x, y: ground + 9.2, z: pad.z, label: WAYPOINT_LABELS.mav },
      shelter: { x: shelterX, y: ground + 2.2, z: shelterZ, label: 'STORM SHELTER' },
      powerroom: { x: -15.5, y: ground + 2.5, z: -16.5, label: 'POWER & HEAT CONTROL' },
      lifeSupport: { x: 10.6, y: ground + 2.5, z: -3, label: 'LIFE SUPPORT' },
      recycler: { x: -16, y: ground + 2.2, z: -38.3, label: 'WATER RECYCLER' },
    };
  }

  _playArrival() {
    this._arrivalPlayed = true;
    this.audio.playRocket();
    const site = CUTSCENE_CONFIG.LANDING_SITE;
    this.playerHand.handGroup.visible = false;
    this.highlightBox.visible = false;
    this.engineFlame.setSize(1.3, 6);
    this.engineFlame.group.position.set(0, LANDER_NOZZLE_Y, 0);
    this.lander.add(this.engineFlame.group);
    // A animacao termina com o foguete decolando; _endArrival o devolve a plataforma
    this._mavHome.copy(this.mavRocket.position);
    this.previewFlame.setSize(1.0, 5.5);
    this.previewFlame.group.position.set(0, MAV_NOZZLE_Y, 0);
    this.mavRocket.add(this.previewFlame.group);
    this.cutscenes.play(createArrivalCutscene({
      camera: this.camera,
      lander: this.lander,
      flame: this.engineFlame,
      dust: this.puffs,
      site,
      groundY: WORLD_CONFIG.GROUND_LEVEL + 1,
      millionKm: Math.round(this.comms.distanceKm / 1e6),
      places: this._tourPlaces(),
      rocket: this.mavRocket,
      rocketFlame: this.previewFlame,
      crew: this.crewAvatars,
      earthDir: this._earthDirection(this._mavHome),
      onTouchdown: () => this.audio.fadeOutRocket(),
      onEnd: () => this._endArrival(),
    }));
  }

  // Direcao unitaria de `from` ate a Terra no ceu, ou null se ela estiver baixa demais no horizonte
  _earthDirection(from) {
    const dir = this.sky.getEarthWorldPosition(new THREE.Vector3()).sub(from).normalize();
    return dir.y > 0.2 ? { x: dir.x, y: dir.y, z: dir.z } : null;
  }

  // Ponto do mundo de cada lugar que a animacao de chegada apresenta
  _tourPlaces() {
    const floor = WORLD_CONFIG.GROUND_LEVEL + 1;
    const { ice, mav } = this.waypoints;
    const pad = MAV_CONFIG.PAD_POSITION;
    return {
      base: { x: 0, y: floor, z: -2 },
      solar: { x: SOLAR_FIELD_CENTER.x, y: floor, z: SOLAR_FIELD_CENTER.z },
      greenhouse: { x: HABITAT_LAYOUT.DOME_X, y: floor, z: HABITAT_LAYOUT.DOME_Z },
      ice: { x: ice.x, y: ice.y - 1.6, z: ice.z },
      rocket: { x: pad.x, y: floor, z: pad.z },
    };
  }

  // Fim (ou pulo) da chegada: a capsula fica no chao como objeto solido e a historia comeca
  _endArrival() {
    this.audio.stopRocket();
    const site = CUTSCENE_CONFIG.LANDING_SITE;
    const groundY = WORLD_CONFIG.GROUND_LEVEL + 1;
    this.lander.position.set(site.x, groundY, site.z);
    this.lander.rotation.set(0, 0, 0);
    this.engineFlame.group.removeFromParent();
    this.engineFlame.group.visible = false;
    this.puffs.clear();
    this.customColliders.push(landerCollider(site.x, groundY, site.z));

    // A decolagem do fim da animacao era uma previa: o foguete volta vazio para a plataforma
    // e a tripulacao, para os seus lugares na base
    this.mavRocket.position.copy(this._mavHome);
    this.mavRocket.rotation.set(0, 0, 0);
    this.previewFlame.group.removeFromParent();
    this.previewFlame.group.visible = false;
    for (const avatar of this.crewAvatars) avatar.update(0);
    separateCrew(this.crewAvatars);

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
    s.stormsSurvived = this.mission.stormCredit;
    s.propellantPct = this.mission.propellant;
    s.dataSent = this.mission.dataSent;
    s.launched = this.mission.launched;
    this.story.update(s);

    for (const event of this.story.drainEvents()) {
      if (event.type === 'card') this.storyHud.showCard(event.card);
      else if (event.type === 'start-storms') {
        this.mission.startStorms(s.hours);
        if (this.mission.noStormData) this.hud.showToast(`Space weather is calm. ${NO_STORM_DATA_TEXT}`, 6000);
      }
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
      this.expedition.objective = text; // frase curta para o terminal da base
    }
    this.storyHud.updateObjective(objectiveView(this.story, s));

    // Seta do objetivo. Dirigindo o rover a camera esta la fora, entao a rota nao passa pelo airlock.
    const inside = s.insideHabitat && !this.roverController.isActive;
    const alertPlace = routeWaypoint(this.missionHud.activeAlertWaypoint, inside);
    const place = alertPlace ?? (this._finishedStory() ? null : routeWaypoint(objectiveTarget(this.story.objectiveId, s), inside));
    let target = place ? this.waypoints[place] : null;
    if (place === 'brokenWindow') {
      const windows = this.world.brokenBaseWindows;
      if (this._brokenWindowIndex === null || !windows.has(this._brokenWindowIndex)) {
        this._brokenWindowIndex = null;
        for (const index of windows) {
          this._brokenWindowIndex = index;
          break;
        }
      }
      if (this._brokenWindowIndex !== null) {
        const size = this.world.sizeX * this.world.sizeZ;
        const y = Math.floor(this._brokenWindowIndex / size);
        const inLayer = this._brokenWindowIndex - y * size;
        const blockZ = Math.floor(inLayer / this.world.sizeX) - this.world.halfZ;
        const blockX = inLayer % this.world.sizeX - this.world.halfX;
        this._brokenWindowWaypoint.x = blockX + 0.5;
        this._brokenWindowWaypoint.y = y + 1.6;
        this._brokenWindowWaypoint.z = blockZ + 0.5;
        target = this._brokenWindowWaypoint;
      }
    }
    this.waypointBeacon.update(dt, target, this.camera.position);
    this.waypointHud.update(this.camera, target);
  }

  _finishedStory() {
    return this.mission.launched || this.storyHud.isWindowClosedShown;
  }

  _buildCrew(size) {
    for (const avatar of this.crewAvatars) avatar.dispose();
    this.crew = new CrewManager({ size, stations: createStations(), base: this.crewStock, ambient: true });
    this.crewAvatars = this.crew.members.map(
      (member, i) => new CrewAvatar(this.scene, member, CREW_CONFIG.SUIT_COLORS[i])
    );
  }

  // Tripulante para quem o jogador esta olhando, dentro do raio de conversa.
  // Exigir o olhar evita roubar o [F] do bebedouro ou da estufa quando alguem trabalha ao lado.
  _nearestCrewMember() {
    const look = this.player.getLookDirection(this._lookDir);
    const lookLen = Math.hypot(look.x, look.z) || 1;
    let best = null;
    let bestDist = CREW_CONFIG.TALK_RADIUS;
    for (const avatar of this.crewAvatars) {
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

    // Ritmo (issue #81): o primeiro sol gasta menos; a exigencia sobe aos poucos depois dele
    const demandFactor = passiveDemandFactor(hours);
    this.crewStock.demandFactor = demandFactor;
    this.utility.demandFactor = demandFactor;

    const playing = this.input.isLocked;
    const active = playing && !this.survival.isDead && !this.missionHud.isVictoryShown
      && !this.cutscenes.isActive && !this.storyHud.isWindowClosedShown;

    if (active) this.crew.updateMovement(dt);

    this.mission.oxygenCostMultiplier = 1;
    // Numa animacao quem posiciona a tripulacao e a propria animacao (o embarque no foguete)
    for (const avatar of this.crewAvatars) avatar.update(dt);
    separateCrew(this.crewAvatars);
    if (active) {
      this._crewChatterTimer = (this._crewChatterTimer ?? 0) + dt;
      if (this._crewChatterTimer >= 35 && this.crew.members.length > 1) {
        this._crewChatterTimer = 0;
        const pair = this.crew.members;
        const speaker = pair[Math.floor(Math.random() * pair.length)];
        const replies = {
          Ana: 'The habitat feels quiet today.', Leo: 'I was just checking on the plants.', Maya: 'The view of Mars never gets old.',
          Sam: 'I am doing a quick habitat check.', Noor: 'The corridor is clear for the next shift.', Kai: 'I spotted a dust plume outside.',
          Iris: 'The rock layers outside look fascinating.', Ravi: 'Earth will get our message when the signal window opens.',
        };
        this.hud.showToast(`${speaker.name}: ${replies[speaker.name]}`, 3500);
      }
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
        this.survival.addBaseWater(
          res.amount * WATER_SYSTEM_CONFIG.LITERS_PER_KG_ICE
        );
        this._playGymTone(520, 0.14, 380);
      } else if (res.reason) {
        this.hud.showToast(res.reason);
      }
    } else if (this.roverController.canCollectIce()) {
      const res = this.roverController.collectIce();
      if (res.success) {
        this._playGymTone(260, 0.14, 480);
      } else if (res.reason) {
        // Cacamba cheia ou bateria baixa: dizer por que a broca nao ligou
        this.hud.showToast(res.reason);
      }
    }
  }

  _checkAstronautInteractions() {
    if (this.roverController.isActive || this.gymController.isActive) {
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

    const member = this._nearestCrewMember();
    if (member) {
      this.currentInteraction = 'crew';
      this.talkTarget = member;
      this.hud.setInteractionPrompt(true, `[F] Talk to ${member.name}`);
      return;
    }

    // Poster ou equipamento explicativo na mira: ler vem antes das acoes por proximidade
    const aimed = this._getInteraction();
    if (aimed?.type === 'info') {
      this.currentInteraction = 'info';
      this.hud.setInteractionPrompt(true, aimed.label);
      return;
    }

    // 1. Console de Comando do Rover (x: 4, z: -9.6, y: ~11)
    const distConsole = Math.hypot(this.player.pos.x - 4, this.player.pos.z - (-9.6));
    const dyConsole = Math.abs(this.player.pos.y - 11.0);
    if (distConsole < 2.6 && dyConsole < 2.2) {
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
    if (distWater < 1.6 && dyWater < 2.2) {
      this.currentInteraction = 'water_dispenser';
      this.hud.setInteractionPrompt(true, '[F] Drink Clean Water (Habitat Reservoir)');
      return;
    }

    this.currentInteraction = null;
    this.hud.setInteractionPrompt(false);
  }

  handlePlayerInteract() {
    if (this.missionHud.isVictoryShown) return;
    if (this.currentInteraction === 'crew' && this.talkTarget) {
      this.hud.showToast(`${this.talkTarget.name}: ${this.talkTarget.dialogue}`, 6500);
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

    if (this.gymController.isActive) {
      this.dismountGym();
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
      this.stationPanel.open('greenhouse');
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
        && !this.scannerHud.isJournalOpen
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
        } else if (this.gymController.isActive) {
          if (this.scanHighlight.mesh) this.scanHighlight.clear();
          this.gymController.update(dt);
          this.sky.update(dt, this.player.pos);
          this._updateSurvival(dt);
          this.highlightBox.visible = false;
          this.hud.update({ player: this.player, survival: this.survival, sky: this.sky, camera: this.camera, isScopeOpen: false, isRoverActive: false, mission: this.mission });
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
        else if (this.gymController.isActive) this.gymController.update(dt);
        else this._updateCamera();
        this.sky.update(dt, this.player.pos);
      }

      if (isGameRunning) this._applyDamageScreenShake(now);

      this.audio.update({
        dt,
        player: this.player,
        survival: this.survival,
        isGameRunning,
        isRoverActive: this.roverController.isActive,
        roverSpeed: this.roverController.speed,
        sprinting: Boolean(this.input.keys['Sprint']),
      });

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
      this._updateBaseDisplays(dt);
      if (isGameRunning && !this.roverController.isActive) this._updateExpedition(dt);
      if (isGameRunning) this._updateStory(dt);

      this.dustStorm.update(dt, this.roverController.isActive ? this.roverController.pos : this.player.pos, this.camera);
      this.renderer.render(this.scene, this.camera);
      this.debug.frame(frameMs);
    };

    loop();
  }
}
