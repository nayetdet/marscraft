import { ACT5_CONFIG, MAV_CONFIG } from '../../config/constants.ts';
import { requestRawPointerLock } from '../../player/mouseLook.ts';
import { HANDOVER_CHOICES, handoverCard, type BaseState } from './act5Handover.ts';
import { ActController, type StorySnapshot } from './actTypes.ts';

// Ato 5 (issue #411): a corrida final e o que vem depois dela (Continue). Ver actTypes.ts.
// A corrida em si (janela, rotina do gelo, IGNITE) e do StoryDirector; aqui fica o que precisa do
// motor: o botao Continue das duas telas finais, a volta ao modo livre numa partida salva e a
// escolha de como deixar a base antes do IGNITE (#423, textos e regras em act5Handover.ts).
export class Act5Controller extends ActController {
  // Partida reaberta em modo livre: tempestades e eventos voltam no primeiro frame de jogo
  private _worldStartPending = false;
  // Como deixar a base (#423): o card de escolha aparece uma vez, quando o foguete fica pronto
  private _handoverShown = false;
  private _tidied = false;

  // Continue na tela de vitoria: fecha a tela e o jogo segue no mesmo mundo, em modo livre (sem
  // objetivo, sem janela e sem prazo). O foguete foi embora: a plataforma fica vazia.
  continueAfterVictory(): boolean {
    const e = this.engine;
    if (!e.missionHud.isVictoryShown) return false;
    e.missionHud.hideVictory();
    e.story.enterFreePlay();
    this._removeRocket();
    this._resumePlay();
    e._saveGame(); // o save guarda que a partida ja decolou
    return true;
  }

  // Continue na tela de janela fechada: a tripulacao esperou a proxima janela (~26 meses na vida
  // real). O jogo segue no mesmo mundo com uma janela nova inteira.
  continueAfterWindowClosed(): boolean {
    const e = this.engine;
    if (!e.storyHud.isWindowClosedShown) return false;
    e.storyHud.hideWindowClosed();
    e.story.reopenWindow(e._skyHours());
    this._resumePlay();
    return true;
  }

  // Partida salva depois da decolagem (GameEngine le `freePlay` do save): abre direto no modo
  // livre, sem tela final e sem historia nova. Chamado uma vez, na montagem do jogo.
  restoreFreePlay(): void {
    const e = this.engine;
    e.mission.launched = true;
    e.story.enterFreePlay();
    this._removeRocket();
    this._worldStartPending = true;
  }

  update(_dt: number, s: StorySnapshot, running: boolean): void {
    if (!running) return;
    const e = this.engine;
    if (this._worldStartPending) {
      this._worldStartPending = false;
      // O mesmo que o fim dos passos guiados liga (GameEngine, evento 'start-storms'): o clima
      // espacial, a poeira e os eventos de Marte continuam no modo livre
      e.mission.startStorms(s.hours);
      e.onTutorialComplete();
      e.mission.queueLiveStorms(e._liveSpaceWeather);
      e.events.start(s.hours);
    }
    // Foguete pronto pela primeira vez: antes do IGNITE, a escolha de como deixar a base (#423)
    if (!this._handoverShown && e.story?.objectiveId === 'ignite') {
      this._handoverShown = true;
      e.storyHud.showCard(handoverCard(this.baseState()));
    }
  }

  // A base agora, nos 3 itens do card e do boletim (#423)
  baseState(): BaseState {
    const e = this.engine;
    const plots: { crop: unknown }[] = e.stations.plots;
    let planted = 0;
    for (const plot of plots) if (plot.crop) planted++;
    return {
      waterL: e.survival.baseWater,
      maxWaterL: e.survival.maxBaseWater,
      panelDust: e.mission.dustWeather.panelDust,
      fieldsPlanted: planted,
      fieldsTotal: plots.length,
    };
  }

  // Para o boletim final: a base na hora da decolagem e se a crianca escolheu arruma-la
  handoverStats(): BaseState & { tidied: boolean } {
    return { ...this.baseState(), tidied: this._tidied };
  }

  // Escolha do card LEAVING THE BASE (GameEngine._onCardChoice). Devolve null se a escolha nao e
  // deste ato, true para fechar o card e false para ele continuar aberto.
  onCardChoice(id: string): boolean | null {
    const e = this.engine;
    if (id === HANDOVER_CHOICES.FLY_NOW) {
      e.hud.showToast('Go to the rocket and press IGNITE. The base stays as it is.', 6000);
      return true;
    }
    if (id !== HANDOVER_CHOICES.TIDY) return null;
    const dust = e.mission.dustWeather;
    if (dust.panelDust <= 0) {
      e.hud.showToast('The solar panels are already clean. Nothing to pay.', 6000);
      return true;
    }
    const hours = ACT5_CONFIG.HANDOVER_WINDOW_HOURS;
    if (!e.story.spendWindow(hours)) {
      e.audio.playUiError();
      e.hud.showToast('Not enough launch window left to tidy the base.', 6000);
      return false;
    }
    dust.cleanPanels(1);
    this._tidied = true;
    e.audio.playUiConfirm();
    e.hud.showToast(`The crew cleaned the solar panels for the next crew. The launch window lost ${hours} h.`, 6000);
    return true;
  }

  // Tira o foguete da plataforma: o modelo e a caixa de colisao dele
  private _removeRocket(): void {
    const e = this.engine;
    e.mavRocket.visible = false;
    const { x, z } = MAV_CONFIG.PAD_POSITION;
    const colliders: any[] = e.customColliders;
    const index = colliders.findIndex((c) => c.scanId === e.mavRocket.userData.scanId
      && c.minX <= x && c.maxX >= x && c.minZ <= z && c.maxZ >= z);
    if (index >= 0) colliders.splice(index, 1);
  }

  // Volta para o jogo depois de uma tela final. A animacao de decolagem deixa a camera rolada e a
  // mao escondida; o clique no botao e o gesto que deixa o mouse voltar preso ao jogo.
  private _resumePlay(): void {
    const e = this.engine;
    const input = e.input;
    input.keys = {};
    e.playerHand.handGroup.visible = !e.isZoomed;
    e.camera.rotation.set(0, 0, 0);
    e._updateCamera();
    if (input.isTouchMode) input.isLocked = true;
    else requestRawPointerLock(input.domElement, () => input._showPauseMenu?.());
  }
}
