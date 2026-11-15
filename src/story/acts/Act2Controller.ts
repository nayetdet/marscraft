import * as THREE from 'three';
import { BLOCK_IDS } from '../../config/blockTypes.ts';
import { ACT2_CONFIG, WORLD_CONFIG } from '../../config/constants.ts';
import { getScanEntry } from '../../data/scanCatalog.ts';
import { JournalLessonHud } from '../../ui/JournalLessonHud.ts';
import { SOLAR_FIELD, SOLAR_FIELD_CENTER } from '../../world/habitatLayout.ts';
import { ActController, type StorySnapshot, type Waypoint } from './actTypes.ts';
import { ACT2_ENGINEER_NAME, ACT2_PLACES } from './act2Steps.ts';
import { ACT2_CARDS, ACT2_TEXT, JournalLesson, WINDOW_SCAN_ENTRIES } from './act2Text.ts';

// Ato 2 (issue #408): liga os passos de act2Steps.ts ao jogo. Ver actTypes.ts.
//   clean-panels   comeca a tempestade de poeira roteirizada; no meio dela o redemoinho cruza o
//                  campo solar e limpa parte dos paineis
//   get-scope      uma janela racha (vazamento lento e escondido) e o engenheiro entrega a luneta
//   find-leak      escanear um vidro responde se esta inteiro ou rachado
//   fix-window     o engenheiro entrega 1 vidro; [F] na janela rachada troca o vidro
//   scan-three     um alvo de Marte, um do ceu e um da base
//   journal-lesson 3 vinhetas sobre a tela do diario
// O GameEngine chama, alem dos metodos de ActController: interactionPrompt/interact (o [F]),
// scanWindow (a luneta num vidro) e leakAlert (o alerta sem marcador).

interface Leak {
  x: number;
  y: number;
  z: number;
  pane: Set<number>; // blocos de vidro da janela rachada (blockKey)
  found: boolean;
  fixed: boolean;
}

const C = ACT2_CONFIG;
const NEIGHBORS = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
const MARS_CATEGORIES = new Set(['terrain', 'landscape']);
const SLOW_LEAK = Object.freeze({ rate: C.STORY_LEAK_RATE, floor: C.STORY_LEAK_FLOOR });
const STORM_SCRIPT = Object.freeze({
  stormHours: C.STORY_DUST_STORM_HOURS,
  rampHours: C.STORY_DUST_STORM_RAMP_HOURS,
  peakTau: C.STORY_DUST_STORM_PEAK_TAU,
  dustPerHour: C.STORY_DUST_STORM_DUST_PER_HOUR,
});

// Chave numerica de um bloco (sem alocar string a cada frame)
const blockKey = (x: number, y: number, z: number) => ((x + 512) * 1024 + y) * 1024 + (z + 512);

export class Act2Controller extends ActController {
  stepId: string | null = null;
  // Tempestade roteirizada
  stormStarted = false;
  stormSeen = false;
  stormOver = false;
  devilSent = false;
  private weatherParked = false;
  // Vazamento, luneta e conserto
  leak: Leak | null = null;
  repairWait = 0; // segundos ate o engenheiro chegar com o vidro
  // Tres scans
  scans = { mars: false, sky: false, base: false };
  private scanCountSeen = -1;
  private checklist = [
    { icon: 'rock', state: 'todo' },
    { icon: 'moon', state: 'todo' },
    { icon: 'home', state: 'todo' },
  ];
  // Aula do diario
  lesson = new JournalLesson();
  private lessonHud: { isVisible: boolean; onNext: () => void; show: Function; hide: Function; reposition: Function } | null = null;
  private lessonClock = 0;

  // Luneta num vidro
  private windowState = { targetId: 'act2-window', entry: WINDOW_SCAN_ENTRIES.scanning, progress: 0, done: false, known: false, completed: null };
  private windowAim = { x: 0, y: -1, z: 0 };
  // Objetos reaproveitados (nada e alocado por frame)
  private look = new THREE.Vector3();
  private skyPos = new THREE.Vector3();
  private crackMesh: THREE.Mesh | null = null;
  private panelsWaypoint: Waypoint = { x: SOLAR_FIELD_CENTER.x, y: WORLD_CONFIG.GROUND_LEVEL + 4.2, z: SOLAR_FIELD.z, label: 'SOLAR FIELD' };
  private engineerWaypoint: Waypoint = { x: 0, y: 0, z: 0, label: `${ACT2_ENGINEER_NAME.toUpperCase()}, ENGINEER` };
  private windowWaypoint: Waypoint = { x: 0, y: 0, z: 0, label: 'CRACKED WINDOW' };

  // ---------- Retrato para os passos ----------

  fillSnapshot(s: StorySnapshot): void {
    const dust = this.engine.mission?.dustWeather;
    s.act2StormOver = this.stormOver;
    s.act2PanelsClean = dust ? dust.panelsBelow(C.PANELS_CLEAN_BELOW) : false;
    s.act2HasScope = this.hasItem(BLOCK_IDS.SCOPE);
    s.act2LeakFound = Boolean(this.leak?.found);
    s.act2LeakFixed = Boolean(this.leak?.fixed);
    this.updateScans();
    s.act2ScanMars = this.scans.mars;
    s.act2ScanSky = this.scans.sky;
    s.act2ScanBase = this.scans.base;
    s.act2ScanChecklist = this.checklist;
    s.act2JournalLessonDone = this.lesson.done;
  }

  private hasItem(blockId: number): boolean {
    const slots = this.engine.survival?.inventorySlots;
    if (!slots) return false;
    for (let i = 0; i < slots.length; i++) if (slots[i]?.id === blockId && slots[i].count > 0) return true;
    return false;
  }

  // Um alvo de Marte, um do ceu e um da base ja escaneados nesta partida. So refaz a conta
  // quando um scan novo entra.
  private updateScans(): void {
    const journal = this.engine.scanJournal;
    if (!journal || journal.missionCount === this.scanCountSeen) return;
    this.scanCountSeen = journal.missionCount;
    const scans = this.scans;
    scans.mars = scans.sky = scans.base = false;
    for (const id of journal.missionScans) {
      const category: string = getScanEntry(id)?.category ?? '';
      if (MARS_CATEGORIES.has(category)) scans.mars = true;
      else if (category === 'sky') scans.sky = true;
      else if (category === 'base') scans.base = true;
    }
    this.checklist[0].state = scans.mars ? 'done' : 'todo';
    this.checklist[1].state = scans.sky ? 'done' : 'todo';
    this.checklist[2].state = scans.base ? 'done' : 'todo';
  }

  // ---------- Passos ----------

  onStepStart(id: string, s: StorySnapshot): void {
    this.stepId = id;
    if (id === 'clean-panels') this.startStorm();
    else if (id === 'get-scope') this.startLeak();
    else if (id === 'fix-window') {
      this.repairWait = C.STORY_REPAIR_FETCH_SECONDS;
      this.engine.hud?.showCaption(ACT2_TEXT.glassComing, 5000);
    } else if (id === 'scan-three' && !this.scans.sky && !this.earthIsUp()) {
      this.engine.storyHud?.showCard(ACT2_CARDS.earthHidden);
    }
    void s;
  }

  onStepDone(id: string, _s: StorySnapshot): void {
    if (id === 'clean-panels') this.startLeak();
    else if (id === 'find-leak') this.engine.storyHud?.showCard(ACT2_CARDS.leakFound);
    else if (id === 'journal-lesson') this.lessonHud?.hide();
  }

  // Tutorial pulado (ou os passos guiados acabaram): quem pulou tambem recebe a luneta, e nada
  // do roteiro fica pendurado (vazamento aberto, aula no meio).
  onMissionStart(_s: StorySnapshot): void {
    this.stepId = null;
    if (this.engine.survival && !this.hasItem(BLOCK_IDS.SCOPE)) {
      this.giveItem(BLOCK_IDS.SCOPE);
      this.engine.hud?.showToast(ACT2_TEXT.scopeAdded, 4000);
    }
    if (this.leak && !this.leak.fixed) this.closeLeak();
    this.lessonHud?.hide();
  }

  update(dt: number, s: StorySnapshot, running: boolean): void {
    const dust = this.engine.mission?.dustWeather;
    const survival = this.engine.survival;
    // A poeira da tempestade gasta o traje mais rapido la fora (vale para toda tempestade de poeira)
    if (survival && dust) survival.suitWearFactor = dust.phase === 'storm' ? C.STORM_SUIT_WEAR_MULTIPLIER : 1;
    if (dust) this.updateStorm(dust, s);
    if (running && this.stepId === 'fix-window' && this.repairWait > 0) this.repairWait -= dt;
    this.updateLesson(dt);
  }

  // ---------- Tempestade de poeira roteirizada ----------

  private startStorm(): void {
    const dust = this.engine.mission?.dustWeather;
    if (!dust || this.stormStarted) return;
    this.stormStarted = true;
    dust.force('warning', C.STORY_DUST_STORM_LEAD_HOURS, STORM_SCRIPT);
    this.engine.storyHud?.showCard(ACT2_CARDS.cleanChoice);
  }

  private updateStorm(dust: any, s: StorySnapshot): void {
    if (!this.stormStarted) return;
    if (!this.stormOver) {
      if (dust.phase === 'storm') {
        this.stormSeen = true;
        // No meio dela, o redemoinho cruza o campo solar e limpa parte dos paineis
        const length = dust.phaseEnd - dust.phaseStart;
        const progress = length > 0 ? (dust.hours - dust.phaseStart) / length : 1;
        if (!this.devilSent && progress >= C.STORY_DUST_DEVIL_AT) {
          this.devilSent = true;
          this.engine.events?.trigger('dustDevil', s.hours ?? dust.hours, { crossesPanels: true });
        }
      } else if (this.stormSeen || dust.phase === 'clear') {
        // A tempestade acabou (ou foi cancelada pelo admin): os paineis ja podem ficar limpos de vez
        this.stormOver = true;
      }
    }
    // Com o ceu limpo de novo, o clima sorteado so volta quando a missao comeca (DustWeather.start)
    if (this.stormOver && !this.weatherParked && dust.phase === 'clear') {
      this.weatherParked = true;
      if (this.engine.story?.inTraining) {
        dust.started = false;
        dust.nextStormAt = Infinity;
      }
    }
  }

  // ---------- Vazamento: uma janela racha ----------

  get leakAlert(): 'hidden' | 'found' | null {
    if (!this.leak || this.leak.fixed) return null;
    return this.leak.found ? 'found' : 'hidden';
  }

  private startLeak(): void {
    if (this.leak) return;
    const world = this.engine.world;
    if (!world?.getBlock) return;
    const windows = C.STORY_LEAK_WINDOWS.filter((w) => world.getBlock(w.x, w.y, w.z) === BLOCK_IDS.HAB_GLASS);
    const seed = this.engine.events?.seed ?? 0;
    const spot = windows[seed % Math.max(1, windows.length)];
    if (!spot) {
      // Sem nenhuma janela da lista no mundo (partida salva com a base mexida): o roteiro segue
      this.leak = { x: 0, y: 0, z: 0, pane: new Set(), found: true, fixed: true };
      return;
    }
    this.leak = { ...spot, pane: this.paneAt(world, spot.x, spot.y, spot.z), found: false, fixed: false };
    if (this.engine.survival) this.engine.survival.slowLeak = SLOW_LEAK;
    this.windowWaypoint.x = spot.x + 0.5;
    this.windowWaypoint.y = spot.y + 1.6;
    this.windowWaypoint.z = spot.z + 0.5;
    this.showCrack(world);
    this.engine.hud?.showToast(ACT2_TEXT.leakStarted, 7000);
  }

  // Blocos de vidro vizinhos: a janela inteira conta como rachada, nao so um bloco
  private paneAt(world: any, x: number, y: number, z: number): Set<number> {
    const pane = new Set<number>([blockKey(x, y, z)]);
    const queue = [[x, y, z]];
    while (queue.length > 0 && pane.size < C.WINDOW_PANE_MAX_BLOCKS) {
      const [cx, cy, cz] = queue.pop()!;
      for (const [dx, dy, dz] of NEIGHBORS) {
        const key = blockKey(cx + dx, cy + dy, cz + dz);
        if (pane.has(key) || world.getBlock(cx + dx, cy + dy, cz + dz) !== BLOCK_IDS.HAB_GLASS) continue;
        pane.add(key);
        queue.push([cx + dx, cy + dy, cz + dz]);
      }
    }
    return pane;
  }

  // O desenho de rachadura que o jogo ja usa ao quebrar blocos, parado sobre o vidro
  private showCrack(world: any): void {
    const material = world.breakMaterials?.[7];
    if (!material || !this.engine.scene || !this.leak) return;
    this.crackMesh = new THREE.Mesh(new THREE.BoxGeometry(1.014, 1.014, 1.014), material);
    this.crackMesh.position.set(this.leak.x + 0.5, this.leak.y + 0.5, this.leak.z + 0.5);
    this.crackMesh.renderOrder = 10;
    this.engine.scene.add(this.crackMesh);
  }

  private closeLeak(): void {
    if (!this.leak) return;
    this.leak.found = true;
    this.leak.fixed = true;
    if (this.engine.survival) this.engine.survival.slowLeak = null;
    if (this.crackMesh) {
      this.engine.scene?.remove(this.crackMesh);
      this.crackMesh.geometry.dispose();
      this.crackMesh = null;
    }
  }

  // ---------- Luneta num vidro: inteiro ou rachado? ----------

  // Chamado pelo GameEngine com a luneta aberta. Devolve o estado para o ScannerHud quando a
  // mira esta num vidro durante a busca do vazamento; senao null (o scanner normal segue).
  scanWindow(dt: number, target: { hit?: { x: number; y: number; z: number } | null } | null, isScanning: boolean) {
    const leak = this.leak;
    const hit = target?.hit ?? this.glassBehindObject(target);
    const state = this.windowState;
    const aim = this.windowAim;
    // Achada a rachadura, a resposta fica na luneta enquanto a mira nao sair da janela
    const holding = state.done && state.entry === WINDOW_SCAN_ENTRIES.cracked;
    const searching = this.stepId === 'find-leak' && leak && !leak.found;
    if (!leak || !(searching || holding) || !isScanning || !hit
      || this.engine.world.getBlock(hit.x, hit.y, hit.z) !== BLOCK_IDS.HAB_GLASS) {
      aim.y = -1;
      state.done = false;
      state.progress = 0;
      return null;
    }
    // Blocos vizinhos sao a mesma janela: a mira pode passear por ela sem zerar o scan
    const sameWindow = aim.y >= 0 && Math.abs(hit.x - aim.x) + Math.abs(hit.y - aim.y) + Math.abs(hit.z - aim.z) <= 1;
    aim.x = hit.x;
    aim.y = hit.y;
    aim.z = hit.z;
    if (!sameWindow) {
      if (!searching) {
        aim.y = -1;
        state.done = false;
        return null;
      }
      state.progress = 0;
      state.done = false;
      state.entry = WINDOW_SCAN_ENTRIES.scanning;
    }
    if (state.done) return state;
    state.progress = Math.min(1, state.progress + dt / C.WINDOW_SCAN_SECONDS);
    if (state.progress < 1) return state;

    state.done = true;
    if (leak.pane.has(blockKey(hit.x, hit.y, hit.z))) {
      leak.found = true;
      state.entry = WINDOW_SCAN_ENTRIES.cracked;
      this.engine.audio?.playUiConfirm();
      this.engine.hud?.showToast(ACT2_TEXT.windowCracked, 5000);
    } else {
      // Como o detector de vazamento: o som da pista da distancia (regra de jogo)
      const blocks = Math.round(Math.hypot(hit.x - leak.x, hit.y - leak.y, hit.z - leak.z));
      WINDOW_SCAN_ENTRIES.ok.status = ACT2_TEXT.windowOk(blocks);
      state.entry = WINDOW_SCAN_ENTRIES.ok;
      this.engine.audio?.playUiClick();
      this.engine.hud?.showToast(WINDOW_SCAN_ENTRIES.ok.status, 4000);
    }
    return state;
  }

  // A mira pode parar numa caixa de cenario encostada na parede (o alvo vem sem bloco): procura
  // um vidro logo atras do ponto atingido, na direcao do olhar.
  private glassHit = { x: 0, y: 0, z: 0 };
  private glassBehindObject(target: any): { x: number; y: number; z: number } | null {
    const engine = this.engine;
    const distance = target?.distance;
    if (!Number.isFinite(distance) || !engine.camera || !engine.player?.getLookDirection || !engine.world) return null;
    const origin = engine.camera.position;
    const dir = engine.player.getLookDirection(this.look);
    for (let extra = 0.05; extra <= 2; extra += 0.25) {
      const x = Math.floor(origin.x + dir.x * (distance + extra));
      const y = Math.floor(origin.y + dir.y * (distance + extra));
      const z = Math.floor(origin.z + dir.z * (distance + extra));
      if (engine.world.getBlock(x, y, z) !== BLOCK_IDS.HAB_GLASS) continue;
      this.glassHit.x = x;
      this.glassHit.y = y;
      this.glassHit.z = z;
      return this.glassHit;
    }
    return null;
  }

  // ---------- [F]: o engenheiro entrega a luneta e o vidro; a janela rachada e trocada ----------

  private get engineer() {
    return this.engine.crew?.members?.[0] ?? null;
  }

  // Texto do [F] quando a acao e deste ato, ou null. `member`: tripulante na mira do jogador.
  interactionPrompt(member: unknown): string | null {
    if (this.stepId === 'get-scope') return member && member === this.engineer ? ACT2_TEXT.promptScope : null;
    if (this.stepId !== 'fix-window' || !this.leak || this.leak.fixed) return null;
    if (this.hasItem(BLOCK_IDS.HAB_GLASS)) return this.nearCrackedWindow() ? ACT2_TEXT.promptRepair : null;
    return member && member === this.engineer && this.repairWait <= 0 ? ACT2_TEXT.promptGlass : null;
  }

  interact(): void {
    if (this.stepId === 'get-scope') {
      this.handOver(BLOCK_IDS.SCOPE, ACT2_TEXT.scopeGiven);
    } else if (this.stepId === 'fix-window' && this.leak && !this.leak.fixed) {
      if (this.hasItem(BLOCK_IDS.HAB_GLASS)) this.replaceWindow();
      else this.handOver(BLOCK_IDS.HAB_GLASS, ACT2_TEXT.glassGiven);
    }
  }

  private handOver(blockId: number, caption: string): void {
    const engine = this.engine;
    if (!this.giveItem(blockId)) {
      engine.audio?.playUiError?.();
      engine.hud?.showToast('Your bag is full. Free a slot first.');
      return;
    }
    this.engineerAvatar()?.startHandoff(engine.player.pos, 1.2);
    engine.audio?.playUiConfirm();
    engine.hud?.showCaption(caption, 5000);
  }

  private giveItem(blockId: number): boolean {
    const engine = this.engine;
    if (!engine.survival.addBlockToInventory(blockId)) return false;
    engine.hud?.renderHotbar(engine.survival.slots);
    engine.input?._syncHandWithSlot?.();
    return true;
  }

  private nearCrackedWindow(): boolean {
    const leak = this.leak;
    const player = this.engine.player;
    if (!leak || !player) return false;
    const dx = leak.x + 0.5 - player.pos.x;
    const dz = leak.z + 0.5 - player.pos.z;
    const distance = Math.hypot(dx, dz);
    if (distance > C.REPAIR_REACH) return false;
    const look = player.getLookDirection(this.look);
    return distance < 1 || (dx * look.x + dz * look.z) / distance > 0.5;
  }

  private replaceWindow(): void {
    const engine = this.engine;
    const leak = this.leak!;
    engine.survival.removeItems(BLOCK_IDS.HAB_GLASS, 1);
    engine.hud?.renderHotbar(engine.survival.slots);
    engine.input?._syncHandWithSlot?.();
    // A janela continua sendo vidro; se alguem a quebrou no caminho, o vidro novo fecha o buraco
    if (engine.world.getBlock(leak.x, leak.y, leak.z) !== BLOCK_IDS.HAB_GLASS) engine.world.setBlock(leak.x, leak.y, leak.z, BLOCK_IDS.HAB_GLASS, true);
    this.closeLeak();
    engine.audio?.playUiConfirm();
    engine.hud?.showToast(ACT2_TEXT.windowFixed, 6000);
  }

  // ---------- Tres scans: a Terra esta no ceu? ----------

  private earthIsUp(): boolean {
    const sky = this.engine.sky;
    const camera = this.engine.camera;
    if (!sky?.getEarthWorldPosition || !camera) return true;
    return sky.getEarthWorldPosition(this.skyPos).y > camera.position.y;
  }

  // ---------- Aula do diario ----------

  private updateLesson(dt: number): void {
    if (this.stepId !== 'journal-lesson' || this.lesson.done) return;
    const scannerHud = this.engine.scannerHud;
    const hud = this.lessonHud ?? this.createLessonHud();
    if (!scannerHud || !hud) return;
    if (!scannerHud.isJournalOpen) {
      hud.hide();
      return;
    }
    if (!hud.isVisible) {
      // A aula e sobre a pagina das descobertas
      if (scannerHud.journalMode !== 'discoveries' && scannerHud._lastJournal) {
        scannerHud.journalMode = 'discoveries';
        scannerHud.renderJournal(scannerHud._lastJournal);
      }
      hud.show(this.lesson.vignette, this.lesson.index, this.lesson.total);
      this.lessonClock = 0;
      return;
    }
    // O diario abre com uma animacao: o circulo acompanha o alvo
    this.lessonClock += dt;
    if (this.lessonClock >= 0.25) {
      this.lessonClock = 0;
      hud.reposition();
    }
  }

  private createLessonHud() {
    // `journalLessonHud` no engine: testes. Sem DOM (Vitest), nao ha o que desenhar.
    const hud = this.engine.journalLessonHud ?? (typeof document === 'undefined' ? null : new JournalLessonHud());
    if (!hud) return null;
    hud.onNext = () => {
      if (this.lesson.next()) hud.hide();
      else hud.show(this.lesson.vignette, this.lesson.index, this.lesson.total);
      this.engine.audio?.playUiClick();
    };
    this.lessonHud = hud;
    return hud;
  }

  // ---------- Lugares da seta ----------

  waypoint(place: string): Waypoint | null {
    if (place === ACT2_PLACES.panels) return this.panelsWaypoint;
    if (place === ACT2_PLACES.engineer) return this.engineerPlace();
    if (place === ACT2_PLACES.repair) {
      // Com o vidro na mochila (ou enquanto o engenheiro ainda busca o vidro): a janela rachada
      const toWindow = this.hasItem(BLOCK_IDS.HAB_GLASS) || this.repairWait > 0;
      return toWindow && this.leak ? this.windowWaypoint : this.engineerPlace() ?? this.windowWaypoint;
    }
    return null;
  }

  // Boneco do engenheiro (procurado sem alocar: a seta pergunta por ele a cada frame)
  private engineerAvatar(): any {
    const engineer = this.engineer;
    const avatars = this.engine.crewAvatars;
    if (!engineer || !avatars) return null;
    for (let i = 0; i < avatars.length; i++) if (avatars[i].member === engineer) return avatars[i];
    return null;
  }

  private engineerPlace(): Waypoint | null {
    const avatar = this.engineerAvatar();
    if (!avatar) return null;
    this.engineerWaypoint.x = avatar.position.x;
    this.engineerWaypoint.y = avatar.position.y + 2.6;
    this.engineerWaypoint.z = avatar.position.z;
    return this.engineerWaypoint;
  }
}
