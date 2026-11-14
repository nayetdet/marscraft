import { MISSION_CONFIG, STORY_CONFIG } from '../config/constants.js';
import { CARDS, OBJECTIVES, commsCard, replyCard } from './storyChapters.js';

// A historia do jogo em 3 atos: chegada (tutorial), preparar a volta e janela de lancamento.
// O tutorial tem 3 passos, um por ideia: entrar na base (ar), avisar a Terra (radio com atraso)
// e buscar gelo. A resposta da Terra chega sozinha, com o jogador ja no passo seguinte.
// Logica pura, sem DOM nem Three.js: o GameEngine entrega um retrato do jogo a cada frame
// (`update(snapshot)`) e aplica os eventos que saem em `drainEvents()`.
//
// snapshot = { hours, insideHabitat, iceCount, atConsole, stormPhase, stormsSurvived,
//              propellantPct, dataSent, launched }
export class StoryDirector {
  // `replyDelayHours`: horas de jogo ate a resposta da Terra chegar (ida e volta do sinal).
  // `comms`: { millionKm, oneWayMinutes, dateIso } para o card do radio.
  // Os dois vem do CommsLink, o mesmo radio do terminal da base.
  constructor({
    replyDelayHours = 1,
    comms = { millionKm: 0, oneWayMinutes: 0, dateIso: '2026-11-14' },
    gameHoursPerSecond = MISSION_CONFIG.GAME_HOURS_PER_SECOND,
    windowHours = STORY_CONFIG.WINDOW_HOURS,
    stormsForWindow = STORY_CONFIG.STORMS_FOR_WINDOW,
  } = {}) {
    this.replyDelayHours = replyDelayHours;
    this.comms = comms;
    this.gameHoursPerSecond = gameHoursPerSecond;
    this.windowHours = windowHours;
    this.stormsForWindow = stormsForWindow;

    this.act = 0; // 0 = a historia ainda nao comecou
    this.objectiveId = null;
    this.objectiveText = '';
    this.windowHoursLeft = null; // so existe no ato 3
    // Segundos reais ate a resposta da Terra chegar; null quando nao ha mensagem a caminho
    this.replySecondsLeft = null;

    this._replyAt = null;
    this._iceBaseline = 0;
    this._guideShown = false;
    this._guiding = false;
    this._windowClosesAt = 0;
    this._finished = false;
    this._events = [];
  }

  start() {
    if (this.act !== 0) return;
    this.act = 1;
    this._setObjective('enter-base');
    this._card(CARDS.welcome);
  }

  update(s) {
    if (this.act === 0 || this._finished) return;

    if (s.launched) {
      // Guarda quanto da janela sobrou na hora da decolagem (vai para a tela de vitoria)
      if (this.act === 3) this.windowHoursLeft = Math.max(0, this._windowClosesAt - s.hours);
      this._finished = true;
      this.replySecondsLeft = null;
      this._setObjective('done');
      return;
    }

    this._updateReply(s);
    if (this.act === 1) this._updateArrival(s);
    else if (this.act === 2) this._updateBuild(s);
    else this._updateWindow(s);
  }

  _updateArrival(s) {
    switch (this.objectiveId) {
      case 'enter-base':
        if (s.insideHabitat) {
          this._setObjective('report');
          this._card(CARDS.inside);
        }
        break;
      case 'report':
        if (s.atConsole) {
          this._replyAt = s.hours + this.replyDelayHours;
          this._updateReply(s);
          this._iceBaseline = s.iceCount;
          this._setObjective('collect-ice');
          this._card(commsCard(this.comms));
        }
        break;
      case 'collect-ice':
        // Gelo gasto baixa a base de comparacao: o que vale e pegar gelo novo depois do pedido
        if (s.iceCount < this._iceBaseline) this._iceBaseline = s.iceCount;
        if (s.iceCount > this._iceBaseline) {
          // O gelo vai direto para o foguete, que fica la fora: nada de voltar pelo airlock antes
          this.act = 2;
          this._events.push({ type: 'start-storms' });
          this._card(CARDS.act2);
          this._setObjective('act2');
        }
        break;
      default:
        break;
    }
  }

  // A mensagem viaja enquanto o jogo segue; quando a ida e volta do sinal acaba, a Terra responde
  _updateReply(s) {
    if (this._replyAt === null) return;
    const left = this._replyAt - s.hours;
    if (left <= 0) {
      this._replyAt = null;
      this.replySecondsLeft = null;
      this._card(replyCard(this.comms));
      return;
    }
    this.replySecondsLeft = Math.max(1, Math.ceil(left / this.gameHoursPerSecond - 1e-6));
  }

  _updateBuild(s) {
    if (s.stormsSurvived >= this.stormsForWindow) {
      this.act = 3;
      this._windowClosesAt = s.hours + this.windowHours;
      this._card(CARDS.window);
      this._updateWindow(s);
      return;
    }

    // So a primeira tempestade e guiada: card com o trade-off e objetivo de se proteger
    if (!this._guideShown && s.stormPhase === 'warning') {
      this._guideShown = true;
      this._guiding = true;
      this._card(CARDS.stormGuide);
    }
    if (this._guiding && s.stormPhase === 'calm') this._guiding = false;

    this._setObjective(this._guiding ? 'storm-guide' : 'act2');
  }

  _updateWindow(s) {
    const left = this._windowClosesAt - s.hours;
    if (left <= 0) {
      this.windowHoursLeft = 0;
      this._finished = true;
      this._setObjective('failed');
      this._events.push({ type: 'window-closed' });
      return;
    }
    this.windowHoursLeft = left;
    this._setObjective(s.propellantPct < 100 ? 'fuel' : !s.dataSent ? 'send-data' : 'ignite');
  }

  _setObjective(id) {
    this.objectiveId = id;
    this.objectiveText = OBJECTIVES[id];
  }

  _card(card) {
    this._events.push({ type: 'card', card });
  }

  drainEvents() {
    if (this._events.length === 0) return this._events;
    const events = this._events;
    this._events = [];
    return events;
  }
}
