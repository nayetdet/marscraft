import { MAV_CONFIG } from '../../config/constants.ts';
import { requestRawPointerLock } from '../../player/mouseLook.ts';
import { ActController, type StorySnapshot } from './actTypes.ts';

// Ato 5 (issue #411): a corrida final e o que vem depois dela (Continue). Ver actTypes.ts.
// A corrida em si (janela, rotina do gelo, IGNITE) e do StoryDirector; aqui fica o que precisa do
// motor: o botao Continue das duas telas finais e a volta ao modo livre numa partida salva.
export class Act5Controller extends ActController {
  // Partida reaberta em modo livre: tempestades e eventos voltam no primeiro frame de jogo
  private _worldStartPending = false;

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
    if (!this._worldStartPending || !running) return;
    this._worldStartPending = false;
    // O mesmo que o fim dos passos guiados liga (GameEngine, evento 'start-storms'): o clima
    // espacial, a poeira e os eventos de Marte continuam no modo livre
    const e = this.engine;
    e.mission.startStorms(s.hours);
    e.onTutorialComplete();
    e.mission.queueLiveStorms(e._liveSpaceWeather);
    e.events.start(s.hours);
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
