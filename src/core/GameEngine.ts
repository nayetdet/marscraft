// @ts-nocheck
import { GREENHOUSE_CENTER, GARDEN_CROP_BED, GREENHOUSE_MONITOR_POS, GREENHOUSE_BASKETS } from '../world/greenhouseLayout.ts';
import { createCropItemModel, createCropPlantModel } from '../graphics/cropModels.ts';
import { createSpaceRationModel } from '../graphics/rationModel.ts';
import * as THREE from 'three';
import { CAMERA_CONFIG, CROP_CONFIG, DOSE_CONFIG, MISSION_CONFIG, STATION_CONFIG, CREW_CONFIG, MAV_CONFIG, RADIATION_CONFIG, WATER_SYSTEM_CONFIG, CUTSCENE_CONFIG, PHYSICS_CONFIG, SURVIVAL_CONFIG, WORLD_CONFIG, MISSION_LOG_CONFIG } from '../config/constants.ts';
import { separateCrew } from '../crew/separateCrew.ts';
import { CrewManager } from '../crew/CrewManager.ts';
import { CrewAvatar } from '../crew/CrewAvatar.ts';
import { CrewInstances } from '../crew/crewInstances.ts';
import { buildIvaAstronautRig, buildSpacesuitRig } from '../graphics/spacesuitModel.ts';
import { createBaseStock } from '../crew/baseStock.ts';
import { createStations, problemText } from '../crew/stations.ts';
import { EMBEDDED_SPACE_WEATHER } from '../data/spaceWeather.ts';
import { MissionSystem, oxygenPointsToKg } from '../mission/MissionSystem.ts';
import { NO_STORM_DATA_TEXT, donkiCredit, donkiLabel, formatDateDMY, formatDose, formatHours, stormEventMessage } from '../mission/missionText.ts';
import { doseEventMessage, doseVictoryRows, evaBlockMessage, roverMavBlocks } from '../mission/doseBudget.ts';
import { discoveryItem, pointsStillNeeded, pointsWord, sampleItem, scienceCountText, scienceStep, uploadResultText } from '../mission/sciencePackage.ts';
import { placeSampleSites } from '../world/sampleSites.ts';
import { SampleSiteMarkers } from '../world/SampleSiteMarkers.ts';
import { naturalGroundTop } from '../world/surfaceRocks.ts';
import { isBuildZone } from '../world/terrainGenerator.ts';
import { sampleFactView, sampleLogText, sampleTypeById } from '../data/sampleTypes.ts';
import { journalRank } from '../ui/journalProgress.ts';
import { MissionHud } from '../ui/MissionHud.ts';
import { missionReport } from '../mission/missionReport.ts';
import { renderReportCard } from '../ui/ReportCard.ts';
import { requestRawPointerLock } from '../player/mouseLook.ts';
import { createCarrotTexture } from '../graphics/carrotTexture.ts';
import { BLOCK_IDS } from '../config/blockTypes.ts';
import { createBlockMaterials } from '../graphics/blockMaterials.ts';
import { MarsSkySystem } from '../sky/MarsSkySystem.ts';
import { DustStormEffect } from '../sky/DustStormEffect.ts';
import { MarsWindEffect } from '../sky/MarsWindEffect.ts';
import { createWindState, updateWindState } from '../sky/windState.ts';
import { VoxelWorld } from '../world/VoxelWorld.ts';
import { PlayerFootprints } from '../world/PlayerFootprints.ts';
import { buildNasaCustomModels } from '../world/nasaModelsBuilder.ts';
import { targetCrop } from '../world/cropInteraction.ts';
import { PlayerPhysics } from '../player/PlayerPhysics.ts';
import { PlayerHand } from '../player/PlayerHand.ts';
import { SurvivalSystem } from '../player/SurvivalSystem.ts';
import { getSuitTelemetryView } from '../player/suitTelemetry.ts';
import { InputController } from '../player/InputController.ts';
import { HudManager } from '../ui/HudManager.ts';
import { DebugOverlay } from '../ui/DebugOverlay.ts';
import { ResolutionScaler, isSoftwareRenderer } from '../graphics/resolutionScaler.ts';
import { ShaderMode } from '../graphics/shaderMode/ShaderMode.ts';
import { RoverController } from '../rover/RoverController.ts';
import { GymEquipmentController } from '../player/GymEquipmentController.ts';
import { ExpeditionState } from './ExpeditionState.ts';
import { isGameSimulationRunning } from './gameSimulation.ts';
import { Airlock } from '../world/Airlock.ts';
import { StationSystem } from './StationSystem.ts';
import { StationPanel } from '../ui/StationPanel.ts';
import { AdminPanel } from '../ui/AdminPanel.ts';
import { UtilityModule } from './UtilityModule.ts';
import { BUNK_INTERACTIONS, SleepController } from './SleepController.ts';
import { CommsLink } from '../mission/commsLink.ts';
import { passiveDemandFactor } from '../mission/pacing.ts';
import { oxygenModeWarning } from '../mission/oxygenPlant.ts';
import { AudioManager } from '../audio/AudioManager.ts';
import { SAMPLE_CATEGORY, getCategoryLabel, getScanEntry } from '../data/scanCatalog.ts';
import { ScanJournal } from '../scanner/scanJournal.ts';
import { MissionLog } from '../story/missionLog.ts';
import { MissionLogFeed } from '../story/missionLogFeed.ts';
import { StudyReveals } from '../story/studyReveals.ts';
import { solSummaryLines } from '../ui/missionJournalView.ts';
import { ScannerSystem, applyDiscoveryReward } from '../scanner/ScannerSystem.ts';
import { resolveScanTarget, collectScanBlocks } from '../scanner/scanTargeting.ts';
import { ScanHighlight } from '../scanner/scanHighlight.ts';
import { isInsideShieldZone, SHIELD_ZONE } from '../mission/shieldZone.ts';
import { HABITAT_LAYOUT, SOLAR_FIELD, SOLAR_FIELD_CENTER, isInsideKitchen, isInsideShelter } from '../world/habitatLayout.ts';
import { rationDeliveryCropOnEntry } from './rationDeliveryTrigger.ts';
import { ShieldBubble } from '../graphics/shieldBubble.ts';
import { IceSensorEffect } from '../scanner/iceSensor.ts';
import { ScannerHud } from '../ui/ScannerHud.ts';
import { buildBaseDecor } from '../base/baseDecor.ts';
import { SuitportStation } from '../base/SuitportStation.ts';
import { buildGreenhouseFields, createSproutModel, cropGrowthLook } from '../base/greenhouseFields.ts';
import { EarthFacts, earthFactLogText, earthFactView, plantsStalled } from '../base/greenhouseCare.ts';
import { FirstTimeHud } from '../ui/FirstTimeHud.ts';
import { TradeoffHud } from '../ui/TradeoffHud.ts';
import { FirstTimeMoments, momentLogText } from '../story/firstTimeMoments.ts';
import { MenuScreens } from '../ui/MenuScreens.ts';
import { StoryDirector } from '../story/StoryDirector.ts';
import { objectiveView } from '../story/objectiveView.ts';
import { WAYPOINT_LABELS, objectiveTarget, routeWaypoint } from '../story/waypoints.ts';
import { WaypointBeacon } from '../story/WaypointBeacon.ts';
import { WaypointHud } from '../ui/WaypointHud.ts';
import { StoryHud } from '../ui/StoryHud.ts';
import { CutsceneHud } from '../ui/CutsceneHud.ts';
import { CutscenePlayer } from '../story/cutscene/CutscenePlayer.ts';
import { EngineFlame, ParticlePuffs } from '../story/cutscene/effects.ts';
import { DUST_WEATHER_CONFIG, WEATHER_CONFIG } from '../config/constants.ts';
import { outsideTemperatureC, solWeather } from '../data/marsWeather.ts';
import { DUST_WARNING_CARD, dustEventMessage, weatherReportCard } from '../mission/weatherText.ts';
import { clampToPlayArea, distanceFromBaseCenter } from '../world/dustStormZone.ts';
import { WeatherHud } from '../ui/WeatherHud.ts';
import { LANDER_NOZZLE_Y, createLander, landerCollider } from '../story/cutscene/landerModel.ts';
import { createArrivalCutscene } from '../story/cutscene/arrivalCutscene.ts';
import { earthFarewell } from '../story/storyChapters.ts';
import { MAV_NOZZLE_Y, createLaunchCutscene } from '../story/cutscene/launchCutscene.ts';
import { createRationDeliveryCutscene } from '../story/cutscene/rationDeliveryCutscene.ts';
import { EventDirector, inWindow, seedFromSearch } from '../mission/eventDirector.ts';
import { DUST_DEVIL_HIT_TOAST, ECLIPSE_END_TOAST, compassDirection, dustDevilPanelsToast, eventCard, eventsSummary, meteorToast, quakeToast } from '../mission/eventText.ts';
import { MarsEventEffects } from '../sky/MarsEventEffects.ts';
import { EventHud } from '../ui/EventHud.ts';
import { carveImpactCrater, findImpactSite, hideRocksNear } from '../world/impactCrater.ts';
import { EVENTS_CONFIG, GRAPHICS_CONFIG, SAMPLE_SITE_CONFIG, SCIENCE_CONFIG, TERRAIN_CONFIG } from '../config/constants.ts';

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
    this.isThirdPerson = false;
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
    // Resolucao adaptativa: baixa o pixel ratio se o FPS ficar baixo (maquina sem placa de video)
    this.resolution = new ResolutionScaler({
      maxRatio: Math.min(window.devicePixelRatio || 1, GRAPHICS_CONFIG.MAX_PIXEL_RATIO),
      steps: GRAPHICS_CONFIG.RES_STEPS,
      minFps: GRAPHICS_CONFIG.RES_MIN_FPS,
      seconds: GRAPHICS_CONFIG.RES_SECONDS,
      warmupSeconds: GRAPHICS_CONFIG.RES_WARMUP_SECONDS,
      software: isSoftwareRenderer(DebugOverlay.detectGpu(this.renderer)),
    });
    this._applyPixelRatio(this.resolution.ratio);
    this.renderer.toneMapping = THREE.NoToneMapping;
    this.renderer.localClippingEnabled = true;
    this.container.appendChild(this.renderer.domElement);

    const { materials, previews, atlas } = createBlockMaterials();
    const carrot = createCarrotTexture();
    previews[BLOCK_IDS.HYDRO_PLANT] = carrot.dataUrl;
    this.sky = new MarsSkySystem(this.scene);
    this.dustStorm = new DustStormEffect(this.scene, this.renderer);
    this.world = new VoxelWorld(this.scene, materials, atlas, carrot.texture);
    this._windState = createWindState();
    this._windInput = { time: 0, haze: 0, edgeStrength: 0, windAvgMs: 6, gustMs: 14 };
    this.windEffect = new MarsWindEffect(this.scene, (x, z) => this._groundSurfaceY(x, z));
    // Amostras cientificas espalhadas pelo mapa (issue #270): os mesmos lugares para a mesma
    // semente, sempre em chao natural, longe das areas construidas e da borda do mapa
    const mapEdge = SURVIVAL_CONFIG.DUST_STORM_FATAL_RADIUS - 8;
    this.sampleSites = new SampleSiteMarkers(placeSampleSites({
      groundTop: (x, z) => (isBuildZone(x, z) || distanceFromBaseCenter(x, z) > mapEdge ? -1 : naturalGroundTop(this.world, x, z)),
    }));
    this.scene.add(this.sampleSites.group);
    // Itens de ciencia desta partida (descobertas + amostras analisadas), refeitos so quando mudam
    this._scienceItems = [];
    this._scienceItemsKey = '';
    this._scienceStatus = null;
    this._scienceStatusKey = '';

    // Modelos 3D detalhados estilo Mod de Minecraft + Caixas de Colisão AABB
    const { group: customModels, colliders, plants, rover, roverWheels, rocket, solarPanelMaterial } = buildNasaCustomModels(this.scene);
    // Paineis do campo solar: ficam avermelhados com a poeira (issue #103)
    this.solarPanelMaterial = solarPanelMaterial;
    this.mavRocket = rocket;
    this.customModels = customModels;
    this.plants = plants;
    this.customColliders = colliders;

    // Zonas, placas, posteres e telas vivas da base (as caixas de colisao entram em `colliders`)
    // Clima espacial: comeca no dado embutido; o ao vivo do DONKI entra em applySpaceWeather (#100)
    this.spaceWeather = EMBEDDED_SPACE_WEATHER;
    // Ultima resposta ao vivo do polling do DONKI (applyLiveSpaceWeather); null sem rede
    this._liveSpaceWeather = null;
    this.baseDecor = buildBaseDecor(this.scene, colliders);
    for (const point of this.baseDecor.infoPoints) point.type = 'info';
    this.suitport = new SuitportStation(this.scene, colliders);
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
    this.playerFootprints = new PlayerFootprints(this.scene);
    this.survival = new SurvivalSystem();
    this._savedArrivalPlayed = false;
    try {
      const saved = JSON.parse(window.localStorage.getItem('marscraft-save-v1') || 'null');
      this._savedArrivalPlayed = saved?.arrivalPlayed === true;
      if (saved?.survival) {
        Object.assign(this.survival, saved.survival);
        if (Array.isArray(saved.survival.inventorySlots)) {
          this.survival.slots = this.survival.inventorySlots.slice(0, 9);
        }
      }
      if (saved?.player) this.player.pos.set(saved.player.x, saved.player.y, saved.player.z);
    } catch { /* Ignore unavailable or malformed saves. */ }
    this._saveTimer = 0;
    this._wasSuitEquipped = this.survival.suitEquipped;
    // As tempestades solares so comecam no ato 2 da historia (StoryDirector)
    this.mission = new MissionSystem({ cmes: this.spaceWeather.cmes, seps: this.spaceWeather.seps, startHours: this._skyHours(), stormsStarted: false });
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
    this.airlock.survival = this.survival;
    this.airlock.onEvent = (type) => this._onAirlockEvent(type);
    // Dose acima do limite (issue #104): a medica de voo segura o comandante dentro da base
    this.airlock.exitBlock = () => evaBlockMessage({ grounded: this.mission.grounded, mavReady: this.mission.progress.ready });
    this.stationPanel = new StationPanel(this);
    this.adminPanel = new AdminPanel(this); // F8 no dev ou ?admin: testes (tempestade, agua, teleporte)
    this._buildStationMarkers();
    this._interactionDir = new THREE.Vector3();
    this._interactionOffset = new THREE.Vector3();
    this._interactionPoint = new THREE.Vector3();
    this._lastStorm = false;
    this._lastStormWarning = false;
    this.audio = new AudioManager();
    document.addEventListener('click', (event) => {
      const control = event.target?.closest?.('button, [role="button"], a, [data-journal-entry]');
      if (!control || control.disabled || control.closest('[data-action], [data-gym-step], [data-touch-action]')) return;
      this.audio.playUiClick();
    });

    // Maozinha 3D do jogador em primeira pessoa
    this.playerHand = new PlayerHand(this.camera, materials, carrot.texture);
    this.playerHand.setSuitEquipped(this.survival.suitEquipped);
    this.suitport.setEquipped(this.survival.suitEquipped, false);
    const firstSlot = this.survival.slots[0];
    this.playerHand.setHeldBlock(firstSlot?.id, firstSlot?.count ?? 0);

    this.hud = new HudManager(previews, this.survival.slots, {
      onUiClick: () => this.audio.playUiClick(),
      onOpenJournal: () => this.input.openJournal(),
      getSuitState: () => this._suitContext(),
      onSuitportEquip: () => this._handleSuitportEquip(),
      onSuitportRepair: () => this._handleSuitportRepair(),
      onSuitportClean: () => this._handleSuitportClean(),
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
      survival: this.survival,
      hud: this.hud,
      onPlaySound: (f1, d, f2) => this._playGymTone(f1, d, f2),
      onDismount: () => {
        this.playerHand.handGroup.visible = !this.isZoomed && !this.isThirdPerson && !this.roverController.isActive;
        this.hud.showToast('Stepped off gym equipment');
      },
    });

    this._initBaseLights();
    this._initHighlightWireframe();
    this._initScanner();

    // Missao: energia, tempestades solares (CMEs reais do DONKI) e o MAV
    this.shieldBubble = new ShieldBubble(this.scene, SHIELD_ZONE);
    this.missionHud = new MissionHud({
      donkiFetched: this.spaceWeather,
      onLoadIce: (count) => this._loadIceIntoMav(count),
      onLoadSample: () => this._loadSampleTube(true),
      onUnloadSample: () => this._loadSampleTube(false),
      onToggleFactory: () => this.mission.toggleFactory(),
      onIgnite: () => this._launchMav(),
      onClose: () => this._closeMavPanel(),
    });
    this._wasDead = false;
    this.deathCount = 0; // para o boletim do cadete (issue #90)
    this._startHours = this._skyHours();
    this._initStory();
    this._initWeather();
    this._initEvents();

    // Tripulacao NPC (issues #47 e #48): o tamanho e escolhido no menu antes do primeiro Play
    this.crewStock = createBaseStock({ survival: this.survival, mission: this.mission });
    // Modulo norte (issue #56, parte B): energia/aquecimento, cozinha, banheiro e oficina
    this.utility = new UtilityModule({ mission: this.mission, survival: this.survival, stations: this.stations, base: this.crewStock });
    this._utilityHours = null;
    // Diario de bordo por sol e estudos reais do OSDR (issue #106). Outros sistemas podem
    // escrever com this.missionLog.add({ text, kind, hours }).
    this.missionLog = new MissionLog();
    this.studyReveals = new StudyReveals();
    this.earthFacts = new EarthFacts();
    // Animacoes de "primeira vez" (beber, pegar gelo, ligar para a Terra...) e fatos da estufa:
    // entram numa fila e aparecem uma de cada vez, com o jogo rodando (nenhum painel aberto)
    this.firstTimeMoments = new FirstTimeMoments();
    this._momentQueue = [];
    this._momentBusyUntil = 0;
    this.missionLogFeed = new MissionLogFeed({
      log: this.missionLog,
      reveals: this.studyReveals,
      sources: { utility: this.utility, mission: this.mission, survival: this.survival, stations: this.stations, comms: this.comms },
    });
    this.scannerHud.attachMissionLog({ log: this.missionLog, reveals: this.studyReveals });
    this.stationPanel.studyReveals = this.studyReveals;
    this.crewAvatars = [];
    this._buildCrew(CREW_CONFIG.NAMES.length);
    this._initRationVisuals();
    this.menuScreens = new MenuScreens({
      donkiDate: formatDateDMY(this.spaceWeather.fetchedAt),
      onDemo: (action) => this._runDemo(action),
      volume: this.audio.masterVolume,
      onVolumeChange: (volume) => this.audio.setMasterVolume(volume),
    });

    this.input = new InputController({
      domElement: this.renderer.domElement,
      player: this.player,
      playerHand: this.playerHand,
      survival: this.survival,
      world: this.world,
      sky: this.sky,
      hud: this.hud,
      onUiClick: () => this.audio.playUiClick(),
      onToggleZoom: (scannerOpen, zoomed) => {
        this.isScannerOpen = scannerOpen;
        this.isZoomed = zoomed;
        if (!this.roverController.isActive && !this.gymController.isActive) {
          this.playerHand.handGroup.visible = !zoomed && !this.isThirdPerson;
        }
      },
      onToggleThirdPerson: () => {
        this.isThirdPerson = !this.isThirdPerson;
        this.playerHand.handGroup.visible = !this.isThirdPerson && !this.isZoomed;
        this.playerAvatar.group.visible = this.isThirdPerson;
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
      onSaveGame: () => this._saveGame(),
      onRoverAction: () => this.handleRoverAction(),
      onRoverLook: (dx, dy) => this.roverController.look(dx, dy),
      onToggleShield: () => this._toggleShield(),
      onSendData: () => this._sendScienceData(),
      onBlockPlaced: (blockId) => {
        if (blockId === BLOCK_IDS.REGOLITH) this.audio.playRegolithPlace();
      },
      onStartRegolithBreak: () => this.audio.playRegolithBreak(),
      onStopRegolithBreak: () => this.audio.stopRegolithBreak(),
      onStartShipBlockBreak: () => this.audio.playShipBlockBreak(),
      onStopShipBlockBreak: () => this.audio.stopShipBlockBreak(),
      onBlockBroken: (blockId) => this.audio.playBlockBreakImpact(blockId === BLOCK_IDS.REGOLITH),
      onFoodConsumed: () => this.audio.playUiConfirm(),
      onSuitportAction: (action) => this._handleSuitportShortcut(action),
      isMissionModalOpen: () =>
        this.missionHud.isMavPanelOpen || this.missionHud.isVictoryShown
        || this.storyHud.isWindowClosedShown,
      isInputBlocked: () => this.cutscenes.isActive || Boolean(this.sleep?.isSleeping) || Boolean(this.tradeoffHud?.isOpen),
      getInteraction: () => this._getInteraction(),
      isStationOpen: () => this.stationPanel.isOpen || this.adminPanel.isOpen || Boolean(this.sleep?.isPanelOpen),
      getWorkSpeed: () => (this.stations.fitness < 40 || this.stations.boneDensity < 40 || !this.stations.freshFood || this.sleep?.isTired ? 0.6 : 1) * (this.stations.toolUpgraded ? 1.4 : 1),
    });
    // Dormir no beliche (issue #109): passa o tempo com custo, no lugar da antiga tecla T
    this.sleep = new SleepController(this);

    this._lookDir = new THREE.Vector3();
    this._thirdPersonBack = new THREE.Vector3();
    this._thirdPersonCameraOffset = new THREE.Vector3();

    this.debug = new DebugOverlay(this.renderer);
    this.crewInstances = CrewInstances.for(this.scene);
    this.playerAvatar = new CrewAvatar(this.scene, {
      id: 99,
      name: '',
      state: 'idle',
      route: [],
      distance: 0,
      routeLength: 0,
      stationary: true,
    }, CREW_CONFIG.SUIT_COLORS[0]);
    this.playerAvatar.label.visible = false;
    this.playerAvatar.group.visible = false;
    this.playerHand.attachThirdPersonHeldItems(this.playerAvatar.elbowR);
    this.playerHand.onThirdPersonAction = (action) => {
      if (this.isThirdPerson && !this.roverController.isActive && !this.gymController.isActive) {
        this.playerAvatar.triggerPlayerAction(action);
      }
    };

    // Modo Shaders começa desligado; o botao do menu permite ligar. Criado antes do compile para
    // os shaders com sombra ja sairem prontos quando o jogador escolher ativa-los.
    this.shaderMode = new ShaderMode({
      renderer: this.renderer,
      scene: this.scene,
      camera: this.camera,
      sky: this.sky,
      glowMaterials: [atlas.material],
      storage: getLocalStorage(),
      onChange: (enabled) => this.menuScreens?.setShadersEnabled(enabled),
    });
    this.menuScreens.bindShaders({
      enabled: this.shaderMode.enabled,
      onToggle: () => this.shaderMode.toggle(),
    });

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
    this._maybePlayRationDeliveryCutscene();
    this.stations.update(dt, insideCore, this.survival, !inside);
    this.stations.updateCrewHarvest(dt, this.crew.members.some(member => member.task === 'greenhouse' && member.stationary && member.canWork));
    this.utility.updateRations(dt, this.crew.members.some(member => member.task === 'kitchen' && member.stationary && member.canWork));
    this._updateShelterWater();
    this.sampleSites.update(this.lastTime / 1000);
    this.updateCropVisuals();
    this.airlock.update(dt, this.player.pos);
    this._syncSuitVisualState();
    if (this.survival.health <= 0) this.survival.isDead = true;
    const aimed = this._getInteraction();
    const showSuitportHolo = aimed?.type === 'suitport' && !this.roverController.isActive && !this.gymController.isActive;
    this.hud.updateSuitportHolo(showSuitportHolo, this._suitContext());
    const hasPriorityInteraction = ['crew', 'water_dispenser', 'rover_terminal', 'mav', 'greenhouse', 'info'].includes(this.currentInteraction);
    document.getElementById('interaction-hint').textContent = (hasPriorityInteraction || this.gymController.isActive) ? '' : (aimed?.label ?? '');
    document.getElementById('mission-status').textContent = `POWER ${Math.round(this.expedition.energy)}%`;
    document.getElementById('co2-overlay').style.opacity = String(Math.max(0, (this.stations.co2 - 40) / 150));
    const tiredWarning = this.sleep.updateWarning();
    document.getElementById('station-warning').textContent = this.stations.contaminated ? 'DUST IN HABITAT: clean at life support' : this.stations.co2 >= 40 ? `CO2 ${Math.round(this.stations.co2)}%: replace filter` : (this.stations.fitness < 40 || this.stations.boneDensity < 40) ? 'Low bone density / fitness: work is slower. Train in the Gym Wing!' : tiredWarning;
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
    if (m.dustWeather.phase === 'warning' || m.dustWeather.phase === 'storm') return 'A dust storm will hide the Sun for hours. Turn off the fuel factory and the greenhouse lights, and keep the heater on.';
    if (m.dustWeather.panelDust >= 0.5) return 'Your solar panels are dusty. Clean them at the solar field, west of the power room.';
    if (m.battery.percent < 30) return 'Your battery is low. Turn off the fuel factory or the greenhouse lights until the Sun is back, but keep the heater on at night.';
    if (m.shelterWaterL < 20 && this.survival.baseWater > 30) return 'Put some water in the storm shelter wall before the next storm.';
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

  _suitContext() {
    return {
      survival: this.survival,
      outsideTempC: outsideTemperatureC(this._skyHours()),
      batteryPercent: this.mission?.battery?.percent ?? 100,
      suitUpgraded: this.stations.upgraded,
      dirtySuit: this.stations.dirtySuit,
      airlockPressurized: this.airlock.pressurized,
      airlockDoorOpen: Boolean(this.airlock.doors?.[1]?.openness > 0),
    };
  }

  _handleSuitportEquip() {
    if (!this.airlock.pressurized || this.airlock.pending || this.airlock.doors[1].openness > 0) {
      this.suitport.flashLocked();
      this.hud.showToast('Close the outer door and pressurize the airlock first.');
      return;
    }
    if (!this.survival.suitEquipped) {
      const view = getSuitTelemetryView(this.survival, this._suitContext());
      if (!view.minSystemsReady) {
        this.suitport.flashLocked();
        const reason = this.survival.suitIntegrity <= 0
          ? 'Suit seal integrity is 0%! Press R to repair the EVA suit at the Suitport first.'
          : `EVA suit below minimum launch levels (${Math.round(this.survival.suitOxygen)}% O2 / ${Math.round(this.survival.suitThermal)}% Heat). Wait for recharge.`;
        this.hud.showToast(reason, 4500);
        return;
      }
      this._setSuitEquippedAnimated(true);
      this.hud.showToast('EVA suit equipped. Ready to cycle the outer door.');
      return;
    }
    this._setSuitEquippedAnimated(false);
    this.hud.showToast('EVA suit docked in Suitport. Recharging O2 & cleaning scrubber.');
  }

  _handleSuitportRepair() {
    const result = this.survival.repairSuit(this.expedition);
    if (result.ok) {
      this.hud.updateSuitportHolo(true, this._suitContext());
    } else {
      this.suitport.flashLocked();
    }
    this.hud.showToast(result.message, 4500);
  }

  _handleSuitportClean() {
    const hadDirty = this.stations.dirtySuit || this.survival.suitDust >= 1;
    const result = this.survival.cleanSuitDust(this.expedition);
    if (result.ok) {
      this.stations.dirtySuit = false;
      this.stations.contaminated = false;
      this.hud.updateSuitportHolo(true, this._suitContext());
      this.hud.showToast(result.message, 4500);
    } else if (hadDirty && this.stations.dirtySuit) {
      this.stations.dirtySuit = false;
      this.hud.updateSuitportHolo(true, this._suitContext());
      this.hud.showToast('Electrostatic perchlorate cleaning complete.', 3500);
    } else {
      this.suitport.flashLocked();
      this.hud.showToast(result.message, 4000);
    }
  }

  _handleSuitportShortcut(action) {
    if (this._getInteraction()?.type !== 'suitport') return;
    if (action === 'repair') this._handleSuitportRepair();
    else if (action === 'clean') this._handleSuitportClean();
  }

  _syncSuitVisualState() {
    this.playerHand.setSuitUpgraded(this.stations.upgraded);
    const equipped = Boolean(this.survival.suitEquipped);
    if (equipped === this._wasSuitEquipped) return;
    this._setSuitEquippedAnimated(equipped);
  }

  _setSuitEquippedAnimated(equipped) {
    this.survival.suitEquipped = Boolean(equipped);
    this._wasSuitEquipped = this.survival.suitEquipped;
    if (this.survival.suitEquipped) {
      this.suitport.triggerEquip();
      this.playerHand.triggerSuitEquip();
      this.hud.triggerSuitSequence('equip');
      this.audio.playSuitEquip();
    } else {
      this.suitport.triggerDock();
      this.playerHand.triggerSuitDock();
      this.hud.triggerSuitSequence('dock');
      this.audio.playSuitDock();
    }
  }

  // Pontos de interacao fixos: montados uma vez (antes a lista era refeita 2+ vezes por quadro)
  _interactionCandidates() {
    if (!this._staticInteractions) {
      this._doorInteractions = this.airlock.doors.map(door => ({ type: 'door', door, x: 0.5, y: 11.4, z: door.z, label: 'Press F: cycle airlock' }));
      this._suitportInteraction = { type: 'suitport', x: -0.68, y: 11.35, z: 7.5, minDot: 0.72, label: '' };
      this._staticInteractions = [
        { type: 'power', x: 10.6, y: 11.4, z: -3, label: 'Press F: life support' },
        { type: 'science', x: 9.75, y: 11.5, z: -10.8, label: 'Press F: science & radio to Earth (call Earth) · [G] send science' },
        { type: 'shelter', x: 5.7, y: 11.3, z: 4.825, label: 'Press F: storm shelter water wall' },
        { type: 'powerroom', x: -15.5, y: 11.5, z: -16.5, label: 'Press F: power & heat control' },
        { type: 'powerroom', x: -15.5, y: 10.8, z: -24.4, label: 'Press F: power & heat control' },
        { type: 'galley', x: 13.1, y: 11.35, z: -16.2, label: 'Press F: kitchen' },
        { type: 'galley', x: 16.1, y: 11.3, z: -21.0, label: 'Press F: pantry & kitchen' },
        { type: 'greenhouse', x: GREENHOUSE_MONITOR_POS.x, y: GREENHOUSE_MONITOR_POS.y, z: GREENHOUSE_MONITOR_POS.z, minDot: 0.72, label: 'Click or press F: Food Monitor' },
        ...GREENHOUSE_BASKETS.map(basket => ({ ...basket, cropType: basket.type, type: 'basket', minDot: 0.95, label: `Press F or tap: collect ${basket.type}` })),
        { type: 'treadmill', x: -9.2, y: 11.2, z: 10.2, label: 'Press F or Click: get on space treadmill (bone density)' },
        { type: 'bike', x: -5.8, y: 11.2, z: 10.4, label: 'Press F or Click: get on exercise bike (muscle & cardio)' },
        ...BUNK_INTERACTIONS,
      ];
      this._interactionList = [];
    }
    // Ordem de antes (portas, traje, estacoes): no empate de distancia vence o primeiro
    const list = this._interactionList;
    list.length = 0;
    for (const candidate of this._doorInteractions) {
      candidate.z = candidate.door.z;
      list.push(candidate);
    }
    const pos = this.player.pos;
    if (pos.z > 6.15 && pos.z < 8.85 && pos.x > -1 && pos.x < 2) {
      this._suitportInteraction.label = this.survival.suitEquipped ? 'Press F: dock EVA suit' : 'Press F: put on EVA suit';
      list.push(this._suitportInteraction);
    }
    for (const candidate of this._staticInteractions) list.push(candidate);
    return list;
  }

  _getInteraction() {
    const dir = this.player.getLookDirection(this._interactionDir);
    let best = null, bestDistance = 4;
    const candidates = this._interactionCandidates();
    for (const candidate of candidates) {
      this._interactionPoint.set(candidate.x, candidate.y, candidate.z);
      this._interactionOffset.copy(this._interactionPoint).sub(this.player.pos);
      const distance = this._interactionOffset.length();
      const minDot = candidate.minDot ?? 0.8;
      if (distance < bestDistance && distance > 0 && this._interactionOffset.dot(dir) / distance > minDot) {
        best = candidate; bestDistance = distance;
      }
    }
    // Amostras do mapa (issue #270): de perto e olhando para o facho de luz
    if (this.sampleSites && !this.survival.insidePressurizedShip) {
      for (const site of this.sampleSites.sites) {
        if (this.sampleSites.isCollected(site.id)) continue;
        this._interactionOffset.set(site.x + 0.5, site.y + 0.9, site.z + 0.5).sub(this.player.pos);
        const distance = this._interactionOffset.length();
        if (distance < Math.min(bestDistance, SAMPLE_SITE_CONFIG.INTERACT_RADIUS) && distance > 0 && this._interactionOffset.dot(dir) / distance > 0.5) {
          best = this._sampleInteraction(site); bestDistance = distance;
        }
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
    if (target.type === 'info') { this.hud.showToast(target.text(this._baseState()), 8000); return; }
    if (target.type === 'basket') { this.hud.showToast(this.stations.collectBasket(target.cropType, this.survival)); return; }
    if (target.type === 'bunk') { this._tradeoff('sleep', () => this.sleep.openChooser()); return; }
    if (target.type === 'sample') { this._collectSample(target.site); return; }
    if (target.type === 'door') {
      const msg = this.airlock.request(target.door, this.player.pos);
      if (msg.includes('Suitport')) this.suitport.flashLocked();
      this.hud.showToast(msg);
      return;
    }
    if (target.type === 'suitport') {
      this._handleSuitportEquip();
      return;
    }
    else if (target.type === 'treadmill' || target.type === 'bike') {
      this.mountGym(target.type);
      return;
    } else {
      this.stationPanel.open(target.type);
      return;
    }
  }

  mountGym(mode) {
    this.gymController.mount(mode);
    this.playerHand.handGroup.visible = false;
    this.playerAvatar.group.visible = false;
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
    if (freq <= 260) this.audio.playUiError();
    else this.audio.playUiConfirm();
  }

  _onAirlockEvent(type) {
    this.missionLogFeed?.onAirlockEvent(type, this._skyHours());
    if (type === 'door-open') {
      this.audio.playDoorOpen();
    } else if (type === 'door-close') {
      this.audio.playDoorClose();
    } else if (type === 'depressurize') {
      this.audio.playDecompression();
    } else if (type === 'manual-open') {
      this.audio.playManualCrank();
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
    this.stationSprout = createSproutModel(); this.stationSprout.visible = false; this.stationCrop.add(this.stationSprout);
    this.stationCrop.position.set(GREENHOUSE_CENTER.x + GARDEN_CROP_BED.dx + 0.5, WORLD_CONFIG.GROUND_LEVEL + 2, GREENHOUSE_CENTER.z + GARDEN_CROP_BED.dz + 0.5); this.stationCrop.visible = false; this.scene.add(this.stationCrop);
    const colors = { treadmill: 0x38bdf8, bike: 0x4ade80 };
    for (const [type, x, z] of [['treadmill', -9.2, 9.2], ['bike', -5.8, 9.5]]) {
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

    const airlockLight = new THREE.PointLight(0xe0f2fe, 1.1, 7);
    airlockLight.position.set(0.5, 12.6, 7.5);
    this.scene.add(airlockLight);
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

  // Com o botão de scan pressionado, resolve o alvo na mira e avança até aplicar a descoberta.
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
    const isScanning = this.input.isScanButtonHeld;
    const state = this.scanner.update(dt, target?.id ?? null, isScanning);
    this._updateScanHighlight(isScanning ? target : null, state, dt);
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
    this.audio.playUiConfirm();
    this.scannerHud.showCard(entry, discovery);
    if (discovery.missionNew) {
      const item = discoveryItem(entry);
      this.hud.showToast(`+${pointsWord(item.points)} of science: ${entry.title}${item.rare ? ' (rare find!)' : ''}. Send it home from the science & radio terminal.`, 4500);
    }
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
    if (this.isThirdPerson) {
      this.playerAvatar.group.visible = true;
      this.playerAvatar.group.position.set(
        this.player.pos.x,
        this.player.pos.y - this.player.height,
        this.player.pos.z
      );
      this.playerAvatar.group.rotation.y = this.player.yaw + Math.PI;

      const back = this._thirdPersonBack.set(Math.sin(this.player.yaw), 0, Math.cos(this.player.yaw));
      const obstruction = this.world.raycast(this.player.pos, back, CAMERA_CONFIG.THIRD_PERSON_DISTANCE);
      const distance = obstruction.hit
        ? Math.max(CAMERA_CONFIG.THIRD_PERSON_MIN_DISTANCE, obstruction.distance - 0.2)
        : CAMERA_CONFIG.THIRD_PERSON_DISTANCE;
      this.camera.position.copy(this.player.pos)
        .addScaledVector(back, distance)
        .add(this._thirdPersonCameraOffset.set(0, CAMERA_CONFIG.THIRD_PERSON_CAMERA_HEIGHT, 0));
      this.camera.rotation.order = 'YXZ';
      this.camera.rotation.y = this.player.yaw;
      this.camera.rotation.x = this.player.pitch;
    } else {
      this.playerAvatar.group.visible = false;
      this.camera.position.copy(this.player.pos);
      this.camera.rotation.order = 'YXZ';
      this.camera.rotation.y = this.player.yaw;
      this.camera.rotation.x = this.player.pitch;
    }

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
    this.audio.playUiClick();
    this.missionHud.openMavPanel();
    this._refreshMavPanel();
    document.exitPointerLock();
  }

  _closeMavPanel() {
    this.missionHud.closeMavPanel();
    requestRawPointerLock(this.renderer.domElement);
  }

  // [G] no terminal de ciencia e radio: o mesmo envio do botao do painel (que e o caminho no toque)
  _sendScienceData() {
    if (this._getInteraction()?.type !== 'science') {
      this.audio.playUiError();
      this.hud.showToast('Go to the science & radio terminal inside the base to send your science to Earth.');
      return;
    }
    const message = this.sendSciencePackage();
    this.audio.playUiFeedback(!/radio silent|after the solar conjunction|nothing new|not enough|need more/i.test(message));
    this.hud.showToast(message, 6000);
  }

  // Alvo de interacao de um local de amostra (um objeto por local, reaproveitado)
  _sampleInteraction(site) {
    this._sampleTargets ??= new Map();
    let target = this._sampleTargets.get(site.id);
    if (!target) {
      const type = sampleTypeById(site.typeId);
      target = { type: 'sample', site, label: `Press F: collect ${type.name} (+${type.points} science in the lab)` };
      this._sampleTargets.set(site.id, target);
    }
    return target;
  }

  // Coleta uma amostra do mapa: ocupa um lugar na mochila e so vira ciencia depois da analise no
  // laboratorio. O custo e o passeio la fora: ar do traje e dose de radiacao.
  _collectSample(site) {
    const type = sampleTypeById(site.typeId);
    if (!type || this.sampleSites.isCollected(site.id)) return;
    if (!this.survival.addBlockToInventory(type.itemId)) {
      this.hud.showToast('Your bag is full. Make room to carry this sample.');
      return;
    }
    this.sampleSites.collect(site.id);
    this.hud.renderHotbar(this.survival.slots);
    const heldSlot = this.survival.slots[this.hud.selectedSlot];
    this.playerHand.setHeldBlock(heldSlot?.id, heldSlot?.count ?? 0);
    this.missionLog.add({ text: `Collected a sample outside: ${type.name}.`, kind: 'study', hours: this._skyHours() });
    this.hud.showToast(`Sample collected: ${type.name}. Analyze it at the science & radio terminal for +${pointsWord(type.points)}. ${this.sampleSites.remaining} sample spots left on the map.`, 6000);
  }

  // Uma amostra do mapa acabou de ser analisada (StationPanel): fato real na tela, ficha no
  // diario [J] e linha no diario de bordo
  onSampleAnalyzed(type) {
    if (!type) return;
    const found = this.scanJournal.record(type.id, { mission: false });
    if (found.isNew) this.scannerHud.unseen.add(type.id, SAMPLE_CATEGORY);
    this.missionLog.add({ text: sampleLogText(type), kind: 'study', hours: this._skyHours() });
    this._momentQueue.push(sampleFactView(type));
  }

  // Tudo o que a crianca achou nesta partida, como itens de ciencia com pontos (issue #269):
  // descobertas do scanner (na ordem em que foram escaneadas) e amostras analisadas
  scienceItems() {
    const key = `${this.scanJournal.missionCount}:${this.stations.analyzed.length}`;
    if (key !== this._scienceItemsKey) {
      this._scienceItemsKey = key;
      const items = [];
      for (const id of this.scanJournal.missionScans) {
        const entry = getScanEntry(id);
        if (entry) items.push(discoveryItem(entry));
      }
      this.stations.analyzed.forEach((sample, order) => items.push(sampleItem(order, sample)));
      this._scienceItems = items;
    }
    return this._scienceItems;
  }

  // O que espera o envio, o que ja foi e o que foi gasto (refeito so quando algo muda)
  scienceStatus() {
    const items = this.scienceItems();
    const key = `${this._scienceItemsKey}:${this.mission.sentScienceIds.size}:${this.mission.usedScienceIds.size}`;
    if (key !== this._scienceStatusKey) {
      this._scienceStatusKey = key;
      this._scienceStatus = this.mission.scienceStatus(items);
    }
    return this._scienceStatus;
  }

  currentSciencePackage() {
    return this.mission.sciencePackage(this.scienceItems());
  }

  // Envia a ciencia para a Terra (issues #105 e #269). Devolve a frase para o painel ou o aviso.
  sendSciencePackage() {
    if (this.comms.blackout) return 'Radio silent: the Sun is between Mars and Earth. Send your science after the solar conjunction.';
    return uploadResultText(this.mission.sendData(this.scienceItems()));
  }

  // Melhorias do laboratorio: gastam pontos que ainda nao foram enviados. Devolve os pontos gastos.
  spendSciencePoints(cost) {
    return this.mission.spendScience(this.scienceItems(), cost);
  }

  // Tubo de amostra analisada entra (ou sai) do foguete: cada tubo pede mais gelo no tanque
  _loadSampleTube(load) {
    const result = load ? this.mission.loadSampleTube(this.stations.analyzedSamples) : this.mission.unloadSampleTube();
    if (result === 'no-samples') this.hud.showToast('Analyze a sample at the science & radio terminal first.');
    this._refreshMavPanel();
  }

  // Sobrevivencia com o O2 do habitat pago pela bateria
  _updateSurvival(dt) {
    // Gerador de O2 (issue #102): na eletrolise o ar tambem gasta agua do tanque da base
    this.survival.update(
      dt,
      this.player.pos,
      this.mission.oxygenRefillBudget(this.crewStock),
      this.world.brokenBaseBlocks.size > 0,
      { isMoving: this.player.isMoving }
    );
    this.survival.oxygenShortage = this.mission.oxygenPlant.limitedBy;
    this.mission.chargeOxygen(this.survival.lastOxygenRefilled, this.crewStock);
    this.survival.updateSuitThermal(dt, this.player.pos, outsideTemperatureC(this._skyHours()), this.expedition);
    if (this.survival.suitDust >= 10 && !this.survival.insidePressurizedShip) {
      this.stations.dirtySuit = true;
    }
  }

  _refreshMavPanel() {
    this.missionHud.updateMavPanel(this.mission, this.survival.countItem(BLOCK_IDS.MARS_ICE), this.stations.analyzedSamples, this.scienceStatus());
  }

  _toggleShield() {
    if (!this.mission.toggleShield()) {
      this.audio.playUiError();
      this.hud.showToast('The battery is empty: the shield cannot turn on.');
      return;
    }
    this.audio.playUiConfirm();
    this.hud.showToast(this.mission.shieldOn
      ? 'Radiation shield ON: a magnetic field around the base deflects solar particles. Stay inside the bubble! Uses energy.'
      : 'Radiation shield OFF.');
  }

  // Escolha feita num card de radio sem parar o jogo (issue #135). Devolve false para o card
  // continuar aberto. O escudo liga pelo mesmo caminho do Shield Remote: gasta a mesma bateria.
  _onCardChoice(id) {
    if (id === 'hide') {
      this.hud.showToast('Follow the arrow to the base. Hide in the storm shelter and fill its water wall!', 6000);
      return true;
    }
    if (id === 'shield') {
      if (!this.mission.shieldOn) this._toggleShield();
      return this.mission.shieldOn;
    }
    return true;
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
      ...doseVictoryRows(m.doseBreakdown),
      ['Solar storms survived', String(m.stormsSurvived)],
      ['Science sent home', `${pointsWord(m.sentPoints)} (${scienceCountText(m.sentDiscoveries, m.sentSamples)})`],
      ['Rock sample tubes on the rocket', String(m.sampleTubes)],
      ['Oxygen made by the base', `${oxygenPointsToKg(m.oxygenProducedPoints).toFixed(2)} kg`],
      ['Ice turned into rocket fuel', `${m.iceDelivered} blocks`],
      ['Solar energy collected', `${(m.solarEnergyCollected / m.battery.capacity).toFixed(1)} full batteries`],
      ['Time left in the launch window', formatHours(this.story.windowHoursLeft ?? 0)],
      ['Mars events you saw', eventsSummary(this.events.history)],
      ['Mission seed', `${this.events.seed} (replay: ?seed=${this.events.seed})`],
    ];
    const sources = `Solar storms: real CMEs that NASA predicted would reach Mars, from NASA DONKI (${donkiLabel(this.spaceWeather)}). ` +
      (this.spaceWeather.seps.length ? 'Fast particle alerts: real SEPs (bursts of super fast particles from the Sun) from NASA DONKI; their strength is a game rule. ' : '') +
      'Radiation: Curiosity RAD on the Mars surface (NASA RadLab); how strong each storm is in the game is a game rule, never above the biggest storm Curiosity measured. ' +
      'Trip dose: Curiosity RAD inside its spacecraft on the way to Mars, 1.8 mSv per day (Zeitlin et al., Science, 2013), for a 203-day trip like Mars 2020. ' +
      'Sunlight on Mars: 43% of Earth (NASA Mars Fact Sheet). ' +
      'Weather: real data from the NASA InSight lander, October 2020. Dust storms: opacity (tau) 0.5 on a clear day and 10.8 in the 2018 storm, from the NASA Opportunity rover (NASA JPL); storm timing and power loss are game rules. ' +
      'Crew needs: NASA Baseline Values and Assumptions Document. Water recycling: 98%, like the Space Station. ' +
      'Storm shelter water wall: PREDICCS shielding model (University of New Hampshire, Curiosity RAD data) and NASA storm shelter studies. ' +
      'Radio delay: Earth-Mars distance from NASA/JPL planet orbits; solar conjunction rules from NASA/JPL. ' +
      'Trip time, thin air and launch windows: NASA Mars facts. ' +
      'Science sent through orbiters: NASA Mars Relay Network. Rock sample tubes: NASA Perseverance; science points, upload costs and extra ice per tube are game rules. ' +
      'Map samples: real finds by NASA Curiosity in Gale Crater (dune sand, mudstone, sulfur, iron meteorite) and by NASA Phoenix (buried ice); where they sit on the map is a game rule. ' +
      'Mars events: NASA InSight (marsquakes and the 2021 meteor impact), MRO, Perseverance (Phobos eclipse, aurora), Spirit (dust devils) and Viking 2 (frost); when and how strong they are is a game rule.';
    this.missionHud.showVictory(rows, sources, earthFarewell({
      sentPoints: m.sentPoints,
      discoveries: m.sentDiscoveries,
      samples: m.sentSamples,
      oneWayMinutes: Math.round(this.comms.lightMinutes),
    }));
    renderReportCard(document.getElementById('victory-report'), missionReport(this._reportStats()));
    document.exitPointerLock();
  }

  // O que o boletim do cadete (issue #90) avalia, lido dos sistemas no fim da partida
  _reportStats() {
    const m = this.mission;
    const s = this.stations;
    return {
      hoursPlayed: this._skyHours() - (this._startHours ?? 0),
      sols: this.sky.solCount,
      deaths: this.deathCount,
      stormHours: m.stormHours,
      protectedStormHours: m.protectedStormHours,
      totalDoseMsv: m.realDoseMsv,
      boneDensity: s.boneDensity,
      muscleStrength: s.muscleStrength,
      workoutCount: s.workoutCount,
      harvestCount: s.harvestCount,
      cropVariety: s.cropCollection.size,
      iceDelivered: m.iceDelivered,
      standbyHours: m.standbyHours,
      ...this._scienceReportStats(),
    };
  }

  // Ciencia para o boletim (issue #271): o que a crianca descobriu nesta partida e a patente do
  // diario [J] (o diario e guardado no navegador, entao conta tambem partidas antigas)
  _scienceReportStats() {
    const journal = this.scanJournal;
    const status = this.scienceStatus();
    const rank = journalRank(journal.count, journal.total);
    // As descobertas mais legais: as que valem mais pontos (as mais raras) primeiro
    const topFinds = [...this.scienceItems()].sort((a, b) => b.points - a.points).slice(0, 3).map((item) => ({ name: item.name, points: item.points }));
    return {
      discoveries: journal.missionCount,
      // Alvos que a luneta alcanca (as fichas de amostra abrem no laboratorio)
      scanTotal: journal.catalog.filter((entry) => entry.category !== SAMPLE_CATEGORY).length,
      journalFound: journal.count,
      journalTotal: journal.total,
      journalRank: rank.label,
      samplesAnalyzed: this.stations.analyzedSamples,
      sampleTypes: new Set(this.stations.analyzed.map((sample) => sample.typeId)).size,
      sciencePointsSent: status.sentPoints,
      sciencePointsGoal: SCIENCE_CONFIG.POINTS_TO_LAUNCH,
      topFinds,
    };
  }

  _updateMission(dt, isGameRunning = this.input.isLocked) {
    // Com o painel do MAV aberto o jogador continua la fora: a radiacao conta
    const playing = isGameRunning || this.missionHud.isMavPanelOpen;
    const active = playing && !this.survival.isDead && !this.missionHud.isVictoryShown
      && !this.cutscenes.isActive && !this.storyHud.isWindowClosedShown;
    const damage = this.mission.update(this._skyHours(), {
      insideHabitat: this.survival.insidePressurizedShip,
      insideShield: isInsideShieldZone(this.player.pos),
      insideShelter: this.survival.insidePressurizedShip && isInsideShelter(this.player.pos.x, this.player.pos.z),
      active,
      suitUpgraded: this.stations.upgraded,
    });
    if (active) this.survival.takeDamage(
      damage * (this.stations.upgraded && !this.survival.insidePressurizedShip ? STATION_CONFIG.SUIT_RADIATION_DAMAGE_FACTOR : 1),
      'RADIATION_OVERDOSE',
      'solar-radiation',
    );

    if (this.survival.isDead && !this._wasDead) {
      this.deathCount++;
      this.mission.markDeath();
      this.missionHud.closeMavPanel(); // a tela de morte precisa aparecer por cima
      this.hud.showDeathScreen(this.survival); // a radiacao pode matar depois do hud.update deste frame
    }
    this._wasDead = this.survival.isDead;

    for (const event of this.mission.drainEvents()) {
      if (event.type === 'storm-survived') this.events.requestAurora(this._skyHours());
      const message = stormEventMessage(event, this.spaceWeather) || doseEventMessage(event.type);
      // O aviso e o inicio da tempestade ja aparecem no card de alerta (com a contagem e a fonte
      // do dado): a legenda repetia o mesmo recado por cima. Eles continuam no diario da missao.
      if (event.type === 'storm-warning') this._tradeoff('storm-warning');
      else if (event.type === 'sunset-soon') this._tradeoff('sunset');
      const onAlertCard = event.type === 'storm-warning' || event.type === 'storm-start';
      if (message && !onAlertCard) this.hud.showToast(message, event.type.startsWith('dose-') ? 8000 : 4500);
      this.missionLogFeed.onMissionEvent(event, this._skyHours());
    }
    this._updateWeather(dt);
    this._updateMissionLog();

    this.missionHud.update(this.mission, { survival: this.survival, stations: this.stations, world: this.world });
    this._panelRefreshTimer = (this._panelRefreshTimer ?? 0) + dt;
    if (this.missionHud.isMavPanelOpen && this._panelRefreshTimer > 0.25) {
      this._panelRefreshTimer = 0;
      this._refreshMavPanel();
    }
  }

  // ---------- Clima: tempestade de poeira (#103) e clima real do InSight (#108) ----------

  _initWeather() {
    this.weatherHud = new WeatherHud();
    // Lido pelo DustStormEffect a cada frame (objeto reaproveitado)
    this._weatherFx = { haze: 0, front: 0, indoors: false };
    // Relatorio do tempo: um por sol, no nascer do Sol, so depois do tutorial
    this._weatherReportSol = this.sky.solCount;
    this._panelColorClean = new THREE.Color(0xffffff);
    this._panelColorDusty = new THREE.Color(0xb98a6a);
    // A poeira cobre o vidro azul escuro: brilho proprio cor de ferrugem, para aparecer
    this._panelDustGlow = new THREE.Color(0x9a5530);
    this._panelDustShown = -1;
    this._solarLookDir = new THREE.Vector3();
    this.panelCleanDustPuffs = new ParticlePuffs(this.scene, { count: 48, color: 0xc47e54 });
    this._panelCleanAnim = {
      active: false,
      elapsed: 0,
      duration: DUST_WEATHER_CONFIG.CLEAN_ANIM_DURATION,
      dustBefore: 0,
      dustAfter: 0,
      panelX: SOLAR_FIELD_CENTER.x,
      panelY: WORLD_CONFIG.GROUND_LEVEL + 2.47,
      panelZ: SOLAR_FIELD.z,
      emitDebt: 0,
    };
  }

  _updateWeather(dt) {
    const dust = this.mission.dustWeather;
    for (const event of dust.drainEvents()) {
      const message = dustEventMessage(event.type);
      if (message) this.hud.showToast(message, event.type === 'dust-warning' ? 9000 : 6000);
      if (event.type === 'dust-warning') {
        this.storyHud.showCard(DUST_WARNING_CARD);
        this._tradeoff('dust-warning');
      }
    }

    // Visual: ceu, Sol, neblina e particulas (sem alocar: so numeros)
    const fx = this._weatherFx;
    fx.haze = dust.haze;
    fx.front = dust.frontProgress;
    fx.indoors = this.survival.isPlayerInsideShip(this.camera.position);
    this.sky.dustHaze = dust.haze;

    // Paineis avermelhados com a poeira: so troca a cor quando muda 1 %
    const visualDust = this._updatePanelCleanAnim(dt);
    const shown = Math.round(visualDust * 100);
    if (shown !== this._panelDustShown && this.solarPanelMaterial) {
      this._panelDustShown = shown;
      this.solarPanelMaterial.color.copy(this._panelColorClean).lerp(this._panelColorDusty, visualDust);
      this.solarPanelMaterial.emissive.copy(this._panelDustGlow).multiplyScalar(visualDust);
    }

    const hours = this._skyHours();
    this.weatherHud.update(outsideTemperatureC(hours), dust);
    this._maybeWeatherReport(hours);
  }

  _groundSurfaceY(x, z) {
    const ix = Math.floor(x);
    const iz = Math.floor(z);
    for (let y = this.world.sizeY - 1; y > 0; y--) {
      if (this.world.getBlock(ix, y, iz) !== BLOCK_IDS.AIR) return y + 1;
    }
    return WORLD_CONFIG.GROUND_LEVEL + 1;
  }

  _nearestSolarPanelPos() {
    const look = this.player.getLookDirection(this._solarLookDir);
    const aimX = this.player.pos.x + look.x * 2.0;
    const aimZ = this.player.pos.z + look.z * 2.0;
    let bestX = SOLAR_FIELD.xFirst;
    let bestDist = Infinity;
    for (let i = 0; i < SOLAR_FIELD.count; i++) {
      const px = SOLAR_FIELD.xFirst + i * SOLAR_FIELD.spacing;
      const dist = Math.hypot(aimX - px, aimZ - SOLAR_FIELD.z);
      if (dist < bestDist) {
        bestDist = dist;
        bestX = px;
      }
    }
    return {
      x: bestX,
      y: WORLD_CONFIG.GROUND_LEVEL + 1 + 1.47,
      z: SOLAR_FIELD.z,
    };
  }

  _updatePanelCleanAnim(dt) {
    const anim = this._panelCleanAnim;
    let visualDust = this.mission.dustWeather.panelDust;
    if (anim.active) {
      anim.elapsed += dt;
      const p = Math.min(1, anim.elapsed / anim.duration);
      visualDust = anim.dustBefore + (anim.dustAfter - anim.dustBefore) * p;
      if (p >= 0.08 && p <= 0.90) {
        anim.emitDebt += dt * 36;
        const sweep = Math.sin(p * Math.PI * 5);
        const sweepDir = Math.cos(p * Math.PI * 5) >= 0 ? 1 : -1;
        while (anim.emitDebt >= 1) {
          anim.emitDebt -= 1;
          const localZ = (Math.random() - 0.5) * 1.1;
          const px = anim.panelX + sweep * 1.15 + (Math.random() - 0.5) * 0.35;
          const pz = anim.panelZ + localZ;
          const py = anim.panelY + 0.08 - Math.sin(0.38) * localZ;
          this.panelCleanDustPuffs.spawn(
            px, py, pz,
            sweepDir * (0.45 + Math.random() * 0.75),
            0.55 + Math.random() * 0.75,
            0.3 + Math.random() * 0.65,
            0.45 + Math.random() * 0.35,
            0.14 + Math.random() * 0.11
          );
        }
      }
      if (p >= 1) {
        anim.active = false;
        visualDust = this.mission.dustWeather.panelDust;
      }
    }
    this.panelCleanDustPuffs.update(dt);
    return visualDust;
  }

  // Relatorio do tempo no nascer do Sol, com o sol real do InSight. Nunca no tutorial.
  _maybeWeatherReport(hours) {
    const sol = this.sky.solCount;
    if (this.story.act < 2) {
      this._weatherReportSol = sol;
      return;
    }
    if (sol === this._weatherReportSol || this.sky.timeOfDay < WEATHER_CONFIG.REPORT_HOUR) return;
    this._weatherReportSol = sol;
    const weather = solWeather(hours);
    // Rajada forte do dia (dado real) tira um pouco da poeira dos paineis
    const windCleaned = this.mission.dustWeather.applyWindGust(weather.gustMs);
    this.storyHud.showCard(weatherReportCard({ weather, windCleaned, dustPhase: this.mission.dustWeather.phase }));
  }

  _isAtSolarField() {
    if (this.survival.insidePressurizedShip) return false;
    const dx = this.player.pos.x - SOLAR_FIELD_CENTER.x;
    const dz = this.player.pos.z - SOLAR_FIELD_CENTER.z;
    return Math.hypot(dx, dz) <= DUST_WEATHER_CONFIG.CLEAN_RADIUS;
  }

  // Limpar os paineis a mao: restaura a geracao, mas gasta ar do traje (issue #103)
  _cleanSolarPanels() {
    if (this._panelCleanAnim?.active) return;
    const dust = this.mission.dustWeather;
    const cost = DUST_WEATHER_CONFIG.CLEAN_O2_COST;
    if (dust.panelDust < 0.01) {
      this.hud.showToast('The solar panels are already clean.');
      return;
    }
    if (!this.survival.hasBreathableOxygen(cost + 1)) {
      this.hud.showToast('Your suit air is too low to keep working. Go back inside!', 4500);
      return;
    }
    const dustBefore = dust.panelDust;
    this.survival.spendBreathableOxygen(cost);
    const removed = dust.cleanPanels();
    const dustAfter = dust.panelDust;
    const panelPos = this._nearestSolarPanelPos();
    const anim = this._panelCleanAnim;
    anim.active = true;
    anim.elapsed = 0;
    anim.duration = DUST_WEATHER_CONFIG.CLEAN_ANIM_DURATION;
    anim.dustBefore = dustBefore;
    anim.dustAfter = dustAfter;
    anim.panelX = panelPos.x;
    anim.panelY = panelPos.y;
    anim.panelZ = panelPos.z;
    anim.emitDebt = 0;
    this.playerHand.triggerCleanSolar();
    this.audio.playSolarClean();
    const left = Math.round(dust.panelDust * 100);
    const storm = dust.phase === 'storm' ? ' The storm keeps adding more dust!' : '';
    let message = `Brushed ${Math.round(removed * 100)}% of the dust off the panels (used suit air). Panel dust: ${left}%.${storm}`;
    if (!this._panelCleanFactShown) {
      this._panelCleanFactShown = true;
      message += ' Real case: gusts of wind cleaned the panels of NASA rovers Spirit and Opportunity.';
    }
    this.hud.showToast(message, 6000);
  }

  // Diario de bordo (issue #106): le as mudancas do frame e mostra os cards novos.
  // So aloca quando algo muda (uma decisao, um evento, o fim do sol).
  _updateMissionLog() {
    this.missionLogFeed.observe(this._skyHours());
    for (const card of this.missionLogFeed.drainCards()) {
      if (card.type === 'summary') {
        const n = card.entry.numbers;
        this.scannerHud.showDiscovery(card.entry.text.toUpperCase(), n.topDecision ? `Biggest choice: ${n.topDecision}` : 'Full report in your journal [J]', solSummaryLines(n), MISSION_LOG_CONFIG.SUMMARY_CARD_MS);
      } else if (card.type === 'study') {
        this.scannerHud.showDiscovery('NEW REAL NASA STUDY', `${card.study.id}: ${card.study.explanation}`, ['Read it in your journal [J], NASA STUDIES'], MISSION_LOG_CONFIG.STUDY_CARD_MS);
      }
    }
  }

  // O que esta plantado na estufa: o canteiro do jardim (campo 0) e os campos da redoma.
  // Tambem chamado pelo monitor de comida, que faz as plantas crescerem com o jogo pausado.
  updateCropVisuals() {
    const crop = this.stations.plots[0].crop;
    this.stationCrop.visible = Boolean(crop);
    if (crop) {
      const look = cropGrowthLook(crop.progress, CROP_CONFIG[crop.type].seconds);
      this.stationCrop.scale.setScalar(look.scale);
      this.stationSprout.visible = look.stage === 'sprout';
      for (const [type, model] of Object.entries(this.stationCropModels)) model.visible = look.stage !== 'sprout' && type === crop.type;
    }
    this.greenhouseFields.update(this.stations.plots, {
      stalled: this.stations.hasGrowingCrops() && plantsStalled(this.greenhouseState()),
      stock: this.stations.harvestBaskets,
    });
  }

  // O jogador colheu `type` no monitor da estufa. A primeira colheita de cada planta ganha um
  // fato "Ciencia espacial na Terra" com animacao de descoberta, uma vez por partida, e ele fica
  // no diario de bordo [J]. A colheita da tripulacao nao chama isto (issue #216).
  onPlayerHarvest(type) {
    const card = this.earthFacts.onPlayerHarvest(type);
    if (!card) return;
    this.missionLog.add({ text: earthFactLogText(card), kind: 'study', hours: this._skyHours() });
    this._momentQueue.push(earthFactView(card));
  }

  // Chamado a cada quadro com o jogo rodando (sem painel aberto, sem animacao da historia):
  // percebe a primeira vez de cada acao principal e mostra a proxima animacao da fila.
  _updateMoments() {
    const moment = this.firstTimeMoments.observe(this._storySnapshot);
    if (moment) {
      this.missionLog.add({ text: momentLogText(moment), kind: 'study', hours: this._skyHours() });
      this._momentQueue.push(moment);
    }
    if (!this._momentQueue.length) return;
    const now = performance.now();
    if (now < this._momentBusyUntil) return;
    const view = this._momentQueue.shift();
    const C = MISSION_LOG_CONFIG;
    const cardMs = C.MOMENT_CARD_MS + C.MOMENT_CARD_MS_PER_LINE * view.lines.length;
    this.firstTimeHud ??= new FirstTimeHud();
    this.firstTimeHud.show(view, C.MOMENT_INTRO_MS, cardMs);
    this._momentBusyUntil = now + C.MOMENT_INTRO_MS + cardMs + C.MOMENT_GAP_MS;
  }

  // Os 3 cuidados da estufa (luz, agua reciclada, sem poeira) para o monitor e para as plantas
  greenhouseState() {
    return {
      lightsOn: this.utility.greenhouseLightsOn,
      powered: this.expedition.greenhousePowered,
      cold: this.utility.cold,
      waterL: this.survival.baseWater,
      thirsty: this.stations.cropsThirsty,
      recovery: this.utility.waterRecovery,
      contaminated: this.stations.contaminated,
    };
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
      oxygenMode: m.oxygenPlant.mode,
      oxygenBlocked: m.oxygenPlant.limitedBy,
      greenhousePowered: this.expedition.greenhousePowered,
      dusty: this.stations.contaminated,
      storm: {
        phase: storm.phase,
        hoursUntil: storm.hoursUntil,
        hoursLeft: storm.hoursLeft ?? 0,
        speedKmS: storm.storm?.cme?.speedKmS ?? 0,
        date: storm.storm?.cme ? formatDateDMY(storm.storm.cme.startTime) : '',
      },
      doseRate: m.doseRate,
      totalDose: m.totalDoseMsv,
      water: this.survival.baseWater,
      maxWater: this.survival.maxBaseWater,
      fields: { planted: this.stations.plantedPlotCount(), ready: this.stations.readyPlotCount(), total: this.stations.plots.length },
      inShelter: m.insideShelter,
      shelterWaterL: m.shelterWaterL,
      donkiDate: formatDateDMY(this.spaceWeather.fetchedAt),
      donkiCredit: donkiCredit(this.spaceWeather),
      // Clima (issues #103 e #108)
      outsideC: outsideTemperatureC(this._skyHours()),
      dust: {
        phase: m.dustWeather.phase,
        hoursUntilStorm: m.dustWeather.hoursUntilStorm,
        solarFactor: m.dustWeather.solarFactor,
        panelDust: m.dustWeather.panelDust,
      },
    };
  }

  // Clima espacial ao vivo do DONKI (issue #100), carregado em main.js. So vale antes do primeiro
  // Play e antes de a fila de tempestades comecar: se chegar depois, fica para a proxima partida
  // (o cache do spaceWeather.js guarda). Nunca e chamado dentro do loop.
  applySpaceWeather(spaceWeather) {
    if (!spaceWeather?.live || this.input.hasStarted || this.mission.stormsStarted) return false;
    this.spaceWeather = spaceWeather;
    this.mission.cmes = spaceWeather.cmes;
    this.mission.seps = spaceWeather.seps;
    this.missionHud.donkiFetched = spaceWeather;
    const label = donkiLabel(spaceWeather);
    this.menuScreens.setDonkiSource(label);
    return true;
  }

  // Polling do DONKI (pollSpaceWeather, em main.ts): guarda a resposta ao vivo e, se a historia
  // ja soltou as tempestades, poe na fila as que estao acontecendo agora na vida real.
  // Nunca e chamado dentro do loop.
  applyLiveSpaceWeather(spaceWeather) {
    if (!spaceWeather?.live) return [];
    this._liveSpaceWeather = spaceWeather;
    return this.mission.queueLiveStorms(spaceWeather);
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
    if (action === 'dust') {
      const phase = this.mission.dustWeather.force('warning');
      if (phase === 'storm') return 'A dust storm is already over the base.';
      return 'Dust storm warning sent. Press Back, then Play: the dust storm arrives in about 10 seconds.';
    }
    if (action === 'night' || action === 'noon') {
      const target = action === 'night' ? 21 : 12;
      this.sky.advanceTime((target - this.sky.timeOfDay + 24) % 24);
      return action === 'night'
        ? 'It is now night on Mars: the solar panels make no power.'
        : 'It is now noon on Mars: the solar panels are charging the battery.';
    }
    if (action === 'skip-training') {
      if (this.story.skipTraining()) return 'Tutorial skipped. Press Back, then Play: fill the rocket with ice.';
      return this.story.act === 0
        ? 'The tutorial has only 5 steps: enter the base, call Earth, get 1 ice, load the rocket, scan 1 thing.'
        : 'The tutorial is already done or skipped.';
    }
    if (action.startsWith('event:')) return this.triggerEvent(action.slice(6));
    if (action === 'battery') {
      this.mission.battery.charge = Math.min(this.mission.battery.charge, this.mission.battery.capacity * 0.1);
      return 'Battery drained to 10%. Watch what the base has to give up.';
    }
    return '';
  }

  // ---------- Historia em 3 atos e animacoes (src/story) ----------

  _initStory() {
    // A historia usa o mesmo radio do terminal da base (CommsLink): distancia e atraso de hoje
    // Vezes que o jogador abriu o painel de energia (certificado de engenharia, issue #88)
    this.powerChecks = 0;
    // O que o jogador ja fez, para os passos do tutorial guiado (src/story/tutorialSteps.ts).
    // Beber, comer e lavar contam a tentativa: quem esta sem sede nao fica preso no passo.
    this.tutorialCounts = { drink: 0, meal: 0, earthCalls: 0, roverDrives: 0, roverIceKg: 0 };
    this.story = new StoryDirector({
      training: false, // tutorial padrao: so os 5 passos que a missao usa (CORE_STEPS)
      replyDelayHours: this.comms.roundTripGameSeconds * MISSION_CONFIG.GAME_HOURS_PER_SECOND,
      comms: {
        millionKm: Math.round(this.comms.distanceKm / 1e6),
        oneWayMinutes: Math.round(this.comms.lightMinutes),
        dateIso: this.comms.date.toISOString(),
      },
    });
    this.storyHud = new StoryHud();
    // Escolha rapida dos cards de radio ([1] HIDE / [2] SHIELD): so com o jogo rodando
    this.storyHud.canChoose = () => Boolean(this._wasGameRunning);
    this.storyHud.onChoice = (id) => this._onCardChoice(id);
    this._objectiveText = '';
    // Retrato do jogo que o diretor le a cada frame (objeto reaproveitado)
    this._storySnapshot = {
      hours: 0, insideHabitat: false, iceCount: 0, iceNeeded: 0,
      stormPhase: 'calm', stormsSurvived: 0, propellantPct: 0, dataSent: false, launched: false,
      needsBase: false, iceForFullTank: MAV_CONFIG.ICE_BLOCKS_FOR_FULL_TANK, scienceStep: null, sciencePointsLeft: 0, sciencePointsSent: 0,
      powerChecks: 0, harvestCount: 0, workoutCount: 0, shelterWaterL: 0,
      drinkCount: 0, mealCount: 0, earthCalls: 0, plantCount: 0,
      roverDrives: 0, roverIceKg: 0, scanCount: 0, iceDelivered: 0,
      // Recursos da base, para os desvios do tutorial (issue #237, tutorialDetours.ts)
      baseWaterL: 0, batteryCharge: 0, foodStock: 0, roverBattery: 0, roverActive: false,
    };
    this._scienceState = { pendingPoints: 0, sentPoints: 0, rawSamples: 0 };

    // Setas do objetivo: uma flutua no mundo e a outra fica na tela (aponta mesmo atraves das paredes)
    this.waypoints = this._buildWaypoints();
    this._brokenWindowIndex = null;
    this._brokenWindowWaypoint = { x: 0, y: 0, z: 0, label: 'BASE BREACH' };
    this.waypointBeacon = new WaypointBeacon(this.scene);
    this.waypointHud = new WaypointHud();

    this.cutsceneHud = new CutsceneHud({ onSkip: () => this.cutscenes.skip() });
    this.cutscenes = new CutscenePlayer({ hud: this.cutsceneHud });
    this._arrivalPlayed = this._savedArrivalPlayed;

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
      // Lugares do tutorial guiado: bebedouro e cozinha
      water: { x: WATER_SYSTEM_CONFIG.WATER_DISPENSER_POS.x, y: ground + 3, z: WATER_SYSTEM_CONFIG.WATER_DISPENSER_POS.z, label: WAYPOINT_LABELS.water },
      kitchen: { x: 13.1, y: ground + 3, z: -16.2, label: WAYPOINT_LABELS.kitchen },
      science: { x: 9.75, y: ground + 3, z: -10.8, label: WAYPOINT_LABELS.science },
      ice: { x: ice.x + 0.5, y: iceTop + 1.6, z: ice.z + 0.5, label: WAYPOINT_LABELS.ice },
      mav: { x: pad.x, y: ground + 9.2, z: pad.z, label: WAYPOINT_LABELS.mav },
      shelter: { x: shelterX, y: ground + 2.2, z: shelterZ, label: 'STORM SHELTER' },
      powerroom: { x: -15.5, y: ground + 2.5, z: -16.5, label: 'POWER & HEAT CONTROL' },
      lifeSupport: { x: 10.6, y: ground + 2.5, z: -3, label: 'LIFE SUPPORT' },
      // Treino de cadete (issue #88): monitor da estufa e academia
      greenhouse: { x: GREENHOUSE_MONITOR_POS.x, y: ground + 3, z: GREENHOUSE_MONITOR_POS.z, label: WAYPOINT_LABELS.greenhouse },
      gym: { x: -7.5, y: ground + 3, z: 10.2, label: WAYPOINT_LABELS.gym },
    };
  }

  // Pede o modal de trade-off de uma situacao (gatilhos em src/story/tradeoffScenes.ts). Cada
  // cena aparece uma vez por partida; `onClose` roda quando ela fecha (ou na hora, se ja foi vista).
  _tradeoff(trigger, onClose = null) {
    this.tradeoffHud ??= new TradeoffHud();
    this.tradeoffHud.request(trigger, onClose);
  }

  _playArrival() {
    this._arrivalPlayed = true;
    this._saveGame();
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
    this.story.start(this._storySnapshot);
  }

  _initRationVisuals() {
    this._wasInsideRationKitchen = false;
    this._rationObserver = new THREE.Group();
    this._rationObserver.visible = false;
    this._rationObserverEva = buildSpacesuitRig({
      accentColor: 0xea580c,
      suitColor: 0xf8fafc,
      includeUpgradeTrim: true,
    });
    this._rationObserverIva = buildIvaAstronautRig({ accentColor: 0xea580c });
    for (const rig of [this._rationObserverEva, this._rationObserverIva]) {
      rig.armL.rotation.set(-0.08, 0, -0.1);
      rig.armR.rotation.set(-0.08, 0, 0.1);
      rig.elbowL.rotation.x = -0.16;
      rig.elbowR.rotation.x = -0.16;
      this._rationObserver.add(rig.bodyGroup);
    }
    this._syncRationObserverAppearance();
    this.scene.add(this._rationObserver);
    this._rationDeliveryCropProps = Object.fromEntries(
      ['potato', 'lettuce', 'soy'].map((type) => {
        const model = createCropItemModel(type);
        model.visible = false;
        this.scene.add(model);
        return [type, model];
      })
    );
    this._rationCutsceneProp = createSpaceRationModel();
    this._rationCutsceneProp.visible = false;
    this.scene.add(this._rationCutsceneProp);

    this._handoffRationProp = createSpaceRationModel();
    this._handoffRationProp.scale.setScalar(0.38);
    this._handoffRationProp.visible = false;
    this.scene.add(this._handoffRationProp);

    this._activeRationHandoff = null;
    this._handoffStart = new THREE.Vector3();
    this._handoffEnd = new THREE.Vector3();
    this._handoffForward = new THREE.Vector3();
    this._handoffRight = new THREE.Vector3();
  }

  // Usa o mesmo rig duplo do inventario e da bicicleta (IVA dentro da base, EVA com traje)
  _syncRationObserverAppearance() {
    if (!this._rationObserverEva || !this._rationObserverIva) return;
    const suited = Boolean(this.survival?.suitEquipped);
    this._rationObserverEva.bodyGroup.visible = suited;
    this._rationObserverIva.bodyGroup.visible = !suited;
    for (const mesh of this._rationObserverEva.upgradeTrimMeshes) {
      mesh.visible = suited && Boolean(this.stations?.upgraded);
    }
  }

  _maybePlayRationDeliveryCutscene() {
    const inside = isInsideKitchen(this.player.pos.x, this.player.pos.y, this.player.pos.z);
    const crop = rationDeliveryCropOnEntry(this._wasInsideRationKitchen, inside, this.stations.harvestBaskets, this.utility.base.food, this.utility.lastRationCrop);
    if (!crop) { this._wasInsideRationKitchen = inside; return; }
    if (!this._arrivalPlayed || this.cutscenes.isActive) return;
    if (this.mission.storm?.phase === 'active') return;
    if (!this.input.isLocked || this.input.isPortraitRequired || this.survival.isDead) return;
    if (this.roverController.isActive || this.gymController.isActive) return;
    if (this.stationPanel.isOpen || this.hud.isInventoryOpen || this.scannerHud.isJournalOpen) return;
    this._wasInsideRationKitchen = inside;
    this._playRationDeliveryCutscene(crop);
  }

  _playRationDeliveryCutscene(cropType) {
    this._finishRationHandoffEarly();
    this.input.keys = {};
    this.playerHand.handGroup.visible = false;
    this.highlightBox.visible = false;
    this.hud.setInteractionPrompt(false);

    const botanist =
      this.crewAvatars.find((avatar) => avatar.member.task === 'greenhouse') ??
      this.crewAvatars[1] ??
      this.crewAvatars[0];
    const cook =
      this.crewAvatars.find((avatar) => avatar.member.task === 'kitchen') ??
      this.crewAvatars[4] ??
      this.crewAvatars[0];
    if (!botanist || !cook) return;

    const cropProp = this._rationDeliveryCropProps[cropType] ?? this._rationDeliveryCropProps.potato;
    this._syncRationObserverAppearance();

    this.cutscenes.play(
      createRationDeliveryCutscene({
        camera: this.camera,
        botanist,
        cook,
        cropProp,
        rationProp: this._rationCutsceneProp,
        observer: this._rationObserver,
        observerPosition: { x: this.player.pos.x, z: this.player.pos.z },
        cropType,
        botanistName: botanist.member.name,
        cookName: cook.member.name,
        floorY: WORLD_CONFIG.GROUND_LEVEL + 2,
        onHandoff: () => this._playGymTone(460, 0.08, 600),
        onPacked: () => this._playGymTone(560, 0.12, 780),
        onEnd: () => this._endRationDeliveryCutscene(),
      })
    );
  }

  _endRationDeliveryCutscene() {
    for (const avatar of this.crewAvatars) {
      avatar.cutsceneControlled = false;
      avatar.update(0);
    }
    separateCrew(this.crewAvatars);
    this.input.keys = {};
    this.playerHand.handGroup.visible = !this.isZoomed;
    this.camera.rotation.set(0, 0, 0);
    this._updateCamera();
  }

  _finishRationHandoffEarly() {
    if (!this._activeRationHandoff) return;
    this._handoffRationProp.visible = false;
    if (!this._activeRationHandoff.delivered) {
      this._activeRationHandoff.delivered = true;
      this.hud.renderHotbar(this.survival.slots);
      const heldSlot = this.survival.slots[this.hud.selectedSlot];
      this.playerHand.setHeldBlock(heldSlot?.id, heldSlot?.count ?? 0);
    }
    this._activeRationHandoff = null;
  }

  _giveRationFromCook(member) {
    if (this._activeRationHandoff) return;
    const cookAvatar = this.crewAvatars.find((avatar) => avatar.member === member);
    const res = this.utility.takeRation();
    if (!res.ok) {
      this.audio.playUiError();
      if (res.reason === 'empty') {
        cookAvatar?.startHeadShake(this.player.pos, 1.0);
        this.hud.showCaption(`${member.name}: No food! Grow some in the greenhouse.`);
      } else {
        this.hud.showToast(res.message);
      }
      return;
    }
    this.audio.playUiConfirm();

    if (!cookAvatar) {
      this.hud.renderHotbar(this.survival.slots);
      const heldSlot = this.survival.slots[this.hud.selectedSlot];
      this.playerHand.setHeldBlock(heldSlot?.id, heldSlot?.count ?? 0);
      this.hud.showToast(res.message);
      return;
    }

    cookAvatar.startHandoff(this.player.pos, 1.2);
    cookAvatar.getRightHandWorldPosition(this._handoffStart);
    this._handoffRationProp.position.copy(this._handoffStart);
    this._handoffRationProp.rotation.set(0.1, cookAvatar.group.rotation.y, 0);
    this._handoffRationProp.visible = true;
    this.hud.showCaption(`${member.name}: Here is a ration! ${res.remaining} left.`);
    this._activeRationHandoff = {
      cookAvatar,
      elapsed: 0,
      duration: 0.85,
      delivered: false,
      message: res.message,
    };
  }

  _updateRationHandoff(dt) {
    const h = this._activeRationHandoff;
    if (!h) return;
    h.elapsed += dt;
    const t = Math.min(1, h.elapsed / h.duration);

    if (t < 0.28) {
      h.cookAvatar.getRightHandWorldPosition(this._handoffStart);
      this._handoffRationProp.position.copy(this._handoffStart);
      this._handoffRationProp.rotation.set(0.15, h.cookAvatar.group.rotation.y, 0);
    } else {
      const flight = (t - 0.28) / 0.72;
      const eased = flight * flight * (3 - 2 * flight);
      this.player.getLookDirection(this._handoffForward);
      this._handoffRight.set(-this._handoffForward.z, 0, this._handoffForward.x).normalize();
      this._handoffEnd
        .copy(this.player.pos)
        .addScaledVector(this._handoffForward, 0.55)
        .addScaledVector(this._handoffRight, 0.34);
      this._handoffEnd.y -= 0.26;

      this._handoffRationProp.position.lerpVectors(this._handoffStart, this._handoffEnd, eased);
      this._handoffRationProp.position.y += Math.sin(flight * Math.PI) * 0.2;
      this._handoffRationProp.rotation.y += dt * 5.2;
      this._handoffRationProp.rotation.x = 0.2 * (1 - eased);
    }

    if (t >= 1) {
      this._handoffRationProp.visible = false;
      h.delivered = true;
      this.playerHand.triggerReceive();
      this.hud.renderHotbar(this.survival.slots);
      const heldSlot = this.survival.slots[this.hud.selectedSlot];
      this.playerHand.setHeldBlock(heldSlot?.id, heldSlot?.count ?? 0);
      this._playGymTone(560, 0.09, 760);
      this.hud.showToast(h.message);
      this._activeRationHandoff = null;
    }
  }

  _updateStory(dt) {
    const s = this._storySnapshot;
    s.hours = this._skyHours();
    s.insideHabitat = this.survival.insidePressurizedShip;
    s.iceCount = this.survival.countItem(BLOCK_IDS.MARS_ICE);
    s.iceNeeded = this.mission.iceNeeded();
    s.stormPhase = this.mission.storm.phase;
    s.stormsSurvived = this.mission.stormCredit;
    s.propellantPct = this.mission.propellant;
    s.dataSent = this.mission.dataSent;
    s.launched = this.mission.launched;
    s.powerChecks = this.powerChecks;
    s.harvestCount = this.stations.harvestCount;
    s.workoutCount = this.stations.workoutCount;
    s.shelterWaterL = this.mission.shelterWaterL;
    s.baseWaterL = this.survival.baseWater;
    s.batteryCharge = this.mission.battery.charge;
    s.foodStock = this.crewStock.food + this.survival.countItem(BLOCK_IDS.HYDRO_PLANT);
    s.roverBattery = this.roverController.battery;
    s.roverActive = this.roverController.isActive;
    const done = this.tutorialCounts;
    s.drinkCount = done.drink;
    s.mealCount = done.meal;
    s.earthCalls = done.earthCalls;
    s.roverDrives = done.roverDrives;
    s.roverIceKg = done.roverIceKg;
    s.iceDelivered = this.mission.iceDelivered; // animacao de primeira vez (firstTimeMoments)
    s.plantCount = this.stations.plantCount;
    s.scanCount = this.scanJournal.missionCount;
    s.iceForFullTank = this.mission.iceForFullTank();
    const sci = this._scienceState;
    const science = this.scienceStatus();
    sci.pendingPoints = science.pendingPoints;
    sci.sentPoints = science.sentPoints;
    sci.rawSamples = this.stations.rawSampleCount(this.survival);
    s.scienceStep = scienceStep(sci);
    s.sciencePointsLeft = pointsStillNeeded(sci);
    s.sciencePointsSent = science.sentPoints;
    this.story.update(s);

    for (const event of this.story.drainEvents()) {
      if (event.type === 'card') {
        this.storyHud.showCard(event.card);
        if (event.card.stepId) this._tradeoff(`step:${event.card.stepId}`);
      }
      else if (event.type === 'certificate') {
        this.events.start(s.hours); // primeiro selo do tutorial: os eventos de Marte ja podem acontecer
        this.storyHud.showCertificate(event.badge);
        this._playGymTone(520, 0.22, 780);
      }
      else if (event.type === 'step-done') this._playGymTone(440, 0.16, 660);
      else if (event.type === 'start-storms') {
        this.mission.startStorms(s.hours);
        // Depois da tempestade do tutorial, so as reais: o que o DONKI ja mostrou acontecendo agora entra na fila
        this.mission.queueLiveStorms(this._liveSpaceWeather);
        this.events.start(s.hours); // eventos aleatorios so depois do tutorial (issue #107)
        if (this.mission.noStormData) this.hud.showToast(`Space weather is calm. ${NO_STORM_DATA_TEXT}`, 6000);
      }
      else if (event.type === 'window-closed') {
        this.storyHud.showWindowClosed();
        renderReportCard(document.getElementById('window-report'), missionReport(this._reportStats()));
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
      const windows = this.world.brokenBaseBlocks;
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
    this.player.crewAvatars = this.crewAvatars;
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
    if (active) this._warnOxygenMode(dt);

    this.mission.oxygenCostMultiplier = 1;
    // Numa animacao quem posiciona a tripulacao e a propria animacao (o embarque no foguete)
    for (const avatar of this.crewAvatars) {
      if (!avatar.cutsceneControlled) avatar.update(dt);
    }
    if (this.isThirdPerson && !this.roverController.isActive && !this.gymController.isActive) {
      const canMove = active
        && !this.hud.isInventoryOpen
        && !this.scannerHud.isJournalOpen
        && !this.stationPanel.isOpen
        && !this.adminPanel.isOpen
        && !this.sleep?.isSleeping
        && !this.tradeoffHud?.isOpen;
      const sprinting = this.input.keys.Sprint || this.input.keys.ShiftLeft || this.input.keys.ShiftRight;
      this.playerAvatar.posePlayer(dt, canMove && this.player.isMoving, sprinting ? 1.28 : 1);
    }
    if (!this.cutscenes.isActive) {
      separateCrew(this.crewAvatars, active && !this.roverController.isActive && !this.gymController.isActive ? this.player : null);
    }
    if (active) {
      this._crewChatterTimer = (this._crewChatterTimer ?? 0) + dt;
      if (this._crewChatterTimer >= 35 && this.crew.members.length > 1) {
        this._crewChatterTimer = 0;
        const pair = this.crew.members;
        const speaker = pair[Math.floor(Math.random() * pair.length)];
        const replies = {
          Ana: 'The habitat feels quiet today.', Leo: 'I was just checking on the plants.', Maya: 'The view of Mars never gets old.',
          Sam: 'Checking the base!', Noor: 'The corridor is clear!', Kai: 'I spotted dust outside!',
          Iris: 'Look at those Mars rocks!', Ravi: 'Our message will reach Earth!',
        };
        this.hud.showCaption(`${speaker.name}: ${replies[speaker.name]}`);
      }
    }
  }

  // Issue #102: quem cuida do gerador de O2 avisa quando o modo escolhido gasta o recurso que
  // esta acabando (agua com eletrolise, bateria com MOXIE). Mesmo intervalo dos avisos da tripulacao.
  _warnOxygenMode(dt) {
    this._oxygenWarnTimer = (this._oxygenWarnTimer ?? CREW_CONFIG.ALERT_COOLDOWN_S) + dt;
    if (this._oxygenWarnTimer < CREW_CONFIG.ALERT_COOLDOWN_S) return;
    const problem = oxygenModeWarning(this.mission.oxygenPlant, {
      water: this.survival.baseWater, batteryPct: this.mission.battery.percent,
    });
    const station = this.crew.stationFor('oxygen');
    if (!problem || !station) return;
    this._oxygenWarnTimer = 0;
    const speaker = this.crew.members.find((m) => m.task === 'oxygen') ?? this.crew.members[0];
    this.hud.showToast(`${speaker.name}: ${problemText(station, problem)}`, 6000);
  }

  // Abaixo de 1 a imagem e ampliada pelo navegador: pixelada (como os blocos), nao borrada
  _applyPixelRatio(ratio) {
    this.renderer.setPixelRatio(ratio);
    this.renderer.domElement.style.imageRendering = ratio < 1 ? 'pixelated' : '';
    this.shaderMode?.setSize();
  }

  _onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.shaderMode.setSize();
  }

  handleRoverAction() {
    if (!this.roverController.isActive) return;
    if (this._roverFuelsMav()) return;

    if (this.roverController.canUnloadIce()) {
      const res = this.roverController.unloadIce();
      if (res.success) {
        this.survival.addBaseWater(
          res.amount * WATER_SYSTEM_CONFIG.LITERS_PER_KG_ICE
        );
        this._playGymTone(520, 0.14, 380);
      } else if (res.reason) {
        this.audio.playUiError();
        this.hud.showToast(res.reason);
      }
    } else if (this.roverController.canCollectIce()) {
      const res = this.roverController.collectIce();
      if (res.success) {
        this.tutorialCounts.roverIceKg += res.amount ?? 1;
        this._playGymTone(520, 0.14, 480);
      } else if (res.reason) {
        // Cacamba cheia ou bateria baixa: dizer por que a broca nao ligou
        this.audio.playUiError();
        this.hud.showToast(res.reason);
      }
    }
  }

  // Comandante acima do limite de dose (issue #104): parado na plataforma do MAV, o rover
  // descarrega o gelo direto no tanque do foguete, para a missao continuar sem saidas a pe.
  _roverFuelsMav() {
    const rover = this.roverController;
    if (!this.mission.grounded || rover.iceCargo <= 0) return false;
    const { x, z } = MAV_CONFIG.PAD_POSITION;
    if (Math.hypot(rover.pos.x - x, rover.pos.z - z) > DOSE_CONFIG.ROVER_MAV_REACH) return false;
    const blocks = roverMavBlocks(rover.iceCargo, this.mission.iceNeeded());
    if (blocks <= 0) {
      this.audio.playUiError();
      this.hud.showToast(this.mission.iceNeeded() > 0
        ? `The rocket takes ice in loads of ${DOSE_CONFIG.ROVER_ICE_KG_PER_MAV_BLOCK} kg. Drill more first.`
        : 'The rocket does not need more ice.');
      return true;
    }
    const accepted = this.mission.deliverIce(blocks);
    rover.iceCargo -= accepted * DOSE_CONFIG.ROVER_ICE_KG_PER_MAV_BLOCK;
    this._playGymTone(520, 0.14, 380);
    this.hud.showToast(`Rover loaded ${accepted} ice into the rocket. No walk outside needed!`);
    return true;
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
      if (member.task === 'kitchen') {
        const count = Math.floor(this.crewStock.food);
        const prompt = count >= 1
          ? `[F] Get space ration from ${member.name} (${count} in pantry)`
          : `[F] Talk to ${member.name} (pantry empty)`;
        this.hud.setInteractionPrompt(true, prompt);
      } else {
        this.hud.setInteractionPrompt(true, `[F] Talk to ${member.name}`);
      }
      return;
    }

    // Poster ou equipamento explicativo na mira: ler vem antes das acoes por proximidade
    const aimed = this._getInteraction();
    if (aimed?.type === 'info') {
      this.currentInteraction = 'info';
      this.hud.setInteractionPrompt(true, aimed.label);
      return;
    }

    // Campo solar (issue #103): limpar a poeira dos paineis gasta ar do traje
    if (this._isAtSolarField()) {
      this.currentInteraction = 'solar_panels';
      if (this._panelCleanAnim?.active) {
        this.hud.setInteractionPrompt(true, 'Cleaning solar panels...');
        return;
      }
      const dust = Math.round(this.mission.dustWeather.panelDust * 100);
      this.hud.setInteractionPrompt(true, `[F] Clean the solar panels (dust ${dust}%, uses suit air)`);
      return;
    }

    // 1. Console de Comando do Rover (x: 4, z: -9.6, y: ~11)
    const distConsole = Math.hypot(this.player.pos.x - 4, this.player.pos.z - (-9.6));
    const dyConsole = Math.abs(this.player.pos.y - 11.0);
    if (distConsole < 2.6 && dyConsole < 2.2) {
      this.currentInteraction = 'rover_terminal';
      this.hud.setInteractionPrompt(true, '[F] Operate Rover Remote Terminal');
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
      if (this.talkTarget.task === 'kitchen') {
        this._giveRationFromCook(this.talkTarget);
      } else {
        this.hud.showCaption(`${this.talkTarget.name}: ${this.talkTarget.dialogue}`);
      }
      return;
    }
    if (this.missionHud.isMavPanelOpen) {
      this.audio.playUiClick();
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
    if (station && !['water_dispenser', 'rover_terminal', 'greenhouse', 'solar_panels'].includes(this.currentInteraction) && station.type !== 'mav') {
      this._interact();
      return;
    }
    if (this.currentInteraction === 'solar_panels') {
      this._cleanSolarPanels();
    } else if (this.currentInteraction === 'rover_terminal') {
      this.toggleRoverMode();
    } else if (this.currentInteraction === 'water_dispenser') {
      const res = this.survival.drinkFromBaseDispenser();
      this.audio.playUiFeedback(Boolean(res.success));
      this.tutorialCounts.drink++;
      this.hud.showToast(res.message);
    } else if (this.currentInteraction === 'greenhouse') {
      this.stationPanel.open('greenhouse');
    }
  }

  toggleRoverMode() {
    this.audio.playUiClick();
    if (this.roverController.isActive) {
      this.roverController.deactivate();
      this.hud.setRoverMode(false);
      this.playerHand.handGroup.visible = !this.isZoomed && !this.isThirdPerson;
      this.hud.showToast('Disconnected from Rover Remote Terminal');
    } else if (this.currentInteraction === 'rover_terminal') {
      this.roverController.activate();
      this.tutorialCounts.roverDrives++;
      this.hud.setRoverMode(true);
      this.playerHand.handGroup.visible = false;
      this.playerAvatar.group.visible = false;
      this.highlightBox.visible = false;
      this.hud.showToast('Rover ready. Head to the ice crater to collect water.');
    }
  }

  // ---------- Eventos aleatorios de Marte (issue #107) ----------

  _initEvents() {
    // ?seed=123 repete a partida; sem ela, a semente e sorteada so aqui (o resto e deterministico)
    const seed = seedFromSearch(window.location.search) ?? 1 + Math.floor(Math.random() * 999999);
    this.events = new EventDirector({ seed });
    this.eventHud = new EventHud();
    this.eventEffects = new MarsEventEffects(this.scene, this.sky, {
      onImpact: (site) => this._meteorImpact(site),
      onDevilReachedTarget: () => this._dustDevilAtTarget(),
      onDevilHitsPlayer: () => {
        this.eventHud.blind(EVENTS_CONFIG.DUST_DEVIL_BLIND_SECONDS);
        this.hud.showToast(DUST_DEVIL_HIT_TOAST, 3500);
      },
    }, this.world.atlas?.material);
    this._eventPlayer = { pos: this.player.pos, insideHabitat: false };
  }

  // Botoes de demo e de admin: comeca o evento ja. Eclipse, geada e aurora precisam da hora certa
  // do dia, entao o relogio pula ate ela (como os botoes de dia e noite).
  triggerEvent(type) {
    const jump = { eclipse: 11, frost: 5.5, aurora: 21 }[type];
    if (jump !== undefined && !inWindow(type, this.sky.timeOfDay)) {
      this.sky.advanceTime((jump - this.sky.timeOfDay + 24) % 24);
    }
    if (!this.events.trigger(type, this._skyHours())) return '';
    return `${eventCard(type).title}: close this screen and play. It starts right away.`;
  }

  _updateEvents(dt, isGameRunning) {
    const hours = this._skyHours();
    if (isGameRunning) {
      this.events.update(hours, { blocked: this.mission.storm.phase !== 'calm' });
      for (const e of this.events.drainEvents()) {
        if (e.type === 'event-start') this._startEvent(e.event);
        else this._endEvent(e.event);
      }
    }
    const player = this._eventPlayer;
    player.insideHabitat = this.survival.insidePressurizedShip;
    // O tremor mexe na camera so a pe: no rover e no aparelho da academia a camera e de outro dono
    const shakeCamera = isGameRunning && !this.roverController.isActive && !this.gymController.isActive ? this.camera : null;
    this.eventEffects.update(dt, this.events.progress(hours), shakeCamera, player);
    this.mission.sunlightFactor = this.eventEffects.sunlightFactor;
    this.eventHud.update(dt);
  }

  _startEvent(event) {
    const { type, params } = event;
    this._tradeoff(`event:${type}`);
    let info;
    let cardInfo;
    if (type === 'meteor') {
      const site = findImpactSite(this.world, params, [this.player.pos, this.roverController.pos]);
      if (!site) return; // sem chao livre: o meteoro nao cai (raro)
      let y = this.world.sizeY - 1;
      while (y > 0 && this.world.getBlock(site.x, y, site.z) === BLOCK_IDS.AIR) y--;
      info = { site: { x: site.x, y: y + 1, z: site.z } };
    } else if (type === 'marsquake') {
      // O tremor balanca uma estacao da tripulacao (sorteada pela semente)
      const stations = this.crew?.stations ?? [];
      const station = stations[Math.min(stations.length - 1, Math.floor(params.pick * stations.length))];
      if (station) {
        const before = station.health;
        station.health = Math.max(0, station.health - EVENTS_CONFIG.QUAKE_STATION_DAMAGE);
        this.hud.showToast(quakeToast({ stationName: station.name, lostPct: Math.round((before - station.health) * 100) }), 7000);
      }
      cardInfo = { stationName: station?.name ?? 'base' };
    } else if (type === 'dustDevil') {
      // O redemoinho passa pelo campo solar ou ao lado dele (sorteado pela semente)
      const side = params.crossesPanels ? 0 : 16;
      const target = {
        x: SOLAR_FIELD_CENTER.x - Math.sin(params.angle) * side,
        z: SOLAR_FIELD_CENTER.z + Math.cos(params.angle) * side,
      };
      this._devilCrossesPanels = params.crossesPanels;
      info = { target, world: this.world };
    }
    this.eventEffects.start(event, info);
    this.storyHud.showCard(eventCard(type, cardInfo));
  }

  _endEvent(event) {
    this.eventEffects.stop();
    if (event.type === 'eclipse') this.hud.showToast(ECLIPSE_END_TOAST, 4000);
  }

  // O meteoro tocou o chao: cratera nova com gelo exposto, que o sensor de gelo marca
  _meteorImpact(site) {
    const x = Math.floor(site.x);
    const z = Math.floor(site.z);
    const { iceBlocks, cells } = carveImpactCrater(this.world, { x, z });
    this.world.rebuildColumns(cells);
    hideRocksNear(this.world.surfaceRocks, x, z, EVENTS_CONFIG.METEOR_CRATER_RADIUS + 2);
    hideRocksNear(this.world.surfaceOutcrops, x, z, EVENTS_CONFIG.METEOR_CRATER_RADIUS + 2);
    this.iceSensor.activate(this.world, { x, z });
    const me = this.player.pos;
    this.hud.showToast(meteorToast({
      iceBlocks,
      distance: Math.round(Math.hypot(x - me.x, z - me.z)),
      direction: compassDirection(x - TERRAIN_CONFIG.BASE_CENTER.x, z - TERRAIN_CONFIG.BASE_CENTER.z),
    }), 8000);
  }

  // Redemoinho no ponto mais perto do campo solar. Limpar os paineis depende da poeira neles,
  // que chega com a issue #103: se a missao tiver `cleanPanels(fracao)`, ela e chamada aqui.
  _dustDevilAtTarget() {
    if (!this._devilCrossesPanels) return;
    const cleaned = this.mission.dustWeather?.cleanPanels(EVENTS_CONFIG.DUST_DEVIL_PANEL_CLEAN);
    this.hud.showToast(dustDevilPanelsToast(typeof cleaned === 'number' ? Math.round(cleaned * 100) : 0), 6000);
  }

  _saveGame() {
    try {
      const survival = {};
      for (const key of ['health','oxygen','suitEquipped','suitThermal','suitOxygen','suitScrubber','suitDust','suitIntegrity','baseOxygen','baseBreached','water','food','baseWater','maxBaseWater','graywater','inventorySlots','isDead']) survival[key] = this.survival[key];
      window.localStorage.setItem('marscraft-save-v1', JSON.stringify({ worldEdits: this.world.exportSave(), player: { x: this.player.pos.x, y: this.player.pos.y, z: this.player.pos.z }, survival, arrivalPlayed: this._arrivalPlayed }));
      return true;
    } catch { return false; }
  }

  start() {
    const loop = () => {
      requestAnimationFrame(loop);

      const now = performance.now();
      const frameMs = now - this.lastTime;
      const dt = Math.min(frameMs / 1000, 0.05);
      this.lastTime = now;
      this._saveTimer += dt;
      if (this._saveTimer >= 5) {
        this._saveTimer = 0;
        this._saveGame();
      }

      // Primeiro Play: a historia abre com a animacao de chegada
      if (!this._arrivalPlayed && this.input.isLocked && !this.input.isPortraitRequired) this._playArrival();
      const cutsceneActive = this.cutscenes.isActive;

      const isGameRunning = isGameSimulationRunning({
        inputLocked: this.input.isLocked,
        portraitRequired: this.input.isPortraitRequired,
        isDead: this.survival.isDead,
        inventoryOpen: this.hud.isInventoryOpen,
        journalOpen: this.scannerHud.isJournalOpen,
        stationOpen: this.stationPanel.isOpen,
        victoryShown: this.missionHud.isVictoryShown,
        cutsceneActive,
        storyWindowClosedShown: this.storyHud.isWindowClosedShown,
        sleepPanelOpen: this.sleep.isPanelOpen,
        sleeping: this.sleep.isSleeping,
        tradeoffOpen: Boolean(this.tradeoffHud?.isOpen),
      });
      // Modal de trade-off na fila: so abre com o jogo rodando e o mouse no jogo
      if (isGameRunning && this.input.isLocked && !this.hud.isInventoryOpen && !this.scannerHud.isJournalOpen) this.tradeoffHud?.pump();
      if (this._wasGameRunning && !isGameRunning) this.player.stopJumpMomentum();
      this._wasGameRunning = isGameRunning;
      if (isGameRunning) {
        if (this.roverController.isActive) {
          if (this.scanHighlight.mesh) this.scanHighlight.clear();
          this.roverController.update(dt, this.input.keys);
          clampToPlayArea(this.roverController.pos);
          this.sky.update(dt, this.roverController.pos);
          this._updateSurvival(dt);
          this.highlightBox.visible = false;
          const outsideTempC = outsideTemperatureC(this._skyHours());
          this.hud.update({ player: this.player, survival: this.survival, sky: this.sky, camera: this.camera, isScopeOpen: false, isRoverActive: true, roverTelemetry: this.roverController.getTelemetry(), mission: this.mission, airlock: this.airlock, outsideTempC, suitUpgraded: this.stations.upgraded, dirtySuit: this.stations.dirtySuit });
        } else if (this.gymController.isActive) {
          if (this.scanHighlight.mesh) this.scanHighlight.clear();
          this.gymController.update(dt);
          this.sky.update(dt, this.player.pos);
          this._updateSurvival(dt);
          this.highlightBox.visible = false;
          const outsideTempC = outsideTemperatureC(this._skyHours());
          this.hud.update({ player: this.player, survival: this.survival, sky: this.sky, camera: this.camera, isScopeOpen: false, isRoverActive: false, mission: this.mission, airlock: this.airlock, outsideTempC, suitUpgraded: this.stations.upgraded, dirtySuit: this.stations.dirtySuit });
        } else {
          const preserveHorizontalVelocity = this.hud.isInventoryOpen || this.scannerHud.isJournalOpen;
          this.player.update(dt, this.input.keys, preserveHorizontalVelocity);
          clampToPlayArea(this.player.pos); // parede invisivel na borda, sem dano (issue #103)
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

          this.hud.update({ player: this.player, survival: this.survival, sky: this.sky, camera: this.camera, isScopeOpen: this.isScannerOpen, isRoverActive: false, mission: this.mission, airlock: this.airlock, outsideTempC: outsideTemperatureC(this._skyHours()), suitUpgraded: this.stations.upgraded, dirtySuit: this.stations.dirtySuit });
          this._updateScanner(dt);
        }
      } else if (cutsceneActive) {
        // A animacao comanda a camera. Ela espera se o mouse soltar ou o aparelho for para retrato.
        if (!this.input.isPortraitRequired && (this.input.isLocked || this.cutscenes.runsUnlocked)) {
          this.cutscenes.update(dt);
        }
        this.sky.update(dt, this.camera.position);
      } else if (this.sleep.isSleeping) {
        // Dormindo: o relogio anda pelo sono (em passos), nao pelo quadro
        this.sleep.update(dt);
        this._updateCamera();
        this.sky.update(0, this.player.pos);
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
        outdoorFactor: this.dustStorm.outdoorBlend,
        windIntensity: this._windState.intensity,
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
      this.suitport.update(dt, {
        suitEquipped: this.survival.suitEquipped,
        pressurized: this.airlock.pressurized,
        doorOpen: this.airlock.doors[1].openness > 0,
        suitUpgraded: this.stations.upgraded,
        dirtySuit: this.stations.dirtySuit,
      });
      if (!isGameRunning && !this.roverController.isActive) this.playerHand.update(dt, false);
      this._updateMission(dt, isGameRunning);
      this._updateCrew(dt);
      this._updateRationHandoff(dt);
      this._updateBaseDisplays(dt);
      if (isGameRunning && !this.roverController.isActive) this._updateExpedition(dt);
      if (isGameRunning) {
        this._updateStory(dt);
        this._updateMoments();
      }

      const focusPos = this.roverController.isActive ? this.roverController.pos : this.player.pos;
      this._weatherFx.indoors = this.survival.isPlayerInsideShip(this.camera.position);
      const insightNow = solWeather(this._skyHours());
      this._windInput.time = this.dustStorm.time + dt;
      this._windInput.haze = this._weatherFx.haze;
      this._windInput.edgeStrength = this.dustStorm.strength;
      this._windInput.windAvgMs = insightNow.windAvgMs;
      this._windInput.gustMs = insightNow.gustMs;
      updateWindState(this._windState, this._windInput);

      this.dustStorm.update(
        dt,
        focusPos,
        this.camera,
        this._weatherFx,
        this._windState,
        this.sky.twilightStrength,
      );
      this.windEffect.update(
        dt,
        focusPos,
        this.camera,
        this._windState,
        this.dustStorm.outdoorBlend,
        this._weatherFx.haze,
      );
      this.playerFootprints.update(
        dt,
        this.player,
        this.world,
        isGameRunning
          && !this.roverController.isActive
          && !this.gymController.isActive
          && !this.survival.isPlayerInsideShip(this.player.pos)
      );
      this._updateEvents(dt, isGameRunning);
      // Trajes da tripulacao: copia a pose de cada peca para o desenho unico (instancing)
      this.crewInstances.sync();
      this.shaderMode.update(dt, { inside: this.survival.isPlayerInsideShip(this.camera.position) });
      this.shaderMode.render();
      if (isGameRunning && this.shaderMode.sampleFrame(frameMs)) {
        this.hud.showToast('Shaders turned off to keep the game smooth. Turn them back on in the menu.');
      }
      if (isGameRunning) {
        const ratio = this.resolution.sample(frameMs);
        if (ratio !== null) this._applyPixelRatio(ratio);
      }
      this.debug.frame(frameMs);
    };

    loop();
  }
}
