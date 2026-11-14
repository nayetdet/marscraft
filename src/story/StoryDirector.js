import { STORY_CONFIG } from '../config/constants.js';
import { COMMS_DELAY } from '../data/commsDelay.js';
import { formatHours } from '../mission/missionText.js';
import { CARDS, OBJECTIVES } from './storyChapters.js';

// A historia do jogo em 3 atos: chegada (tutorial), preparar a volta e janela de lancamento.
// Logica pura, sem DOM nem Three.js: o GameEngine entrega um retrato do jogo a cada frame
// (`update(snapshot)`) e aplica os eventos que saem em `drainEvents()`.
//
// snapshot = { hours, insideHabitat, iceCount, atConsole, stormPhase, stormsSurvived,
//              propellantPct, dataSent, launched }
export class StoryDirector {
  constructor({
    replyDelayHours = COMMS_DELAY.roundTripMinutes / 60,
    windowHours = STORY_CONFIG.WINDOW_HOURS,
    stormsForWindow = STORY_CONFIG.STORMS_FOR_WINDOW,
  } = {}) {
    this.replyDelayHours = replyDelayHours;
    this.windowHours = windowHours;
    this.stormsForWindow = stormsForWindow;

    this.act = 0; // 0 = a historia ainda nao comecou
    this.objectiveId = null;
    this.objectiveText = '';
    this.windowHoursLeft = null; // so existe no ato 3

    this._replyAt = 0;
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
      this._setObjective('done');
      return;
    }

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
          this._card(CARDS.comms);
          this._setAwaitText(s.hours);
        }
        break;
      case 'await-reply':
        if (s.hours >= this._replyAt) {
          this._iceBaseline = s.iceCount;
          this._setObjective('collect-ice');
          this._card(CARDS.firstJob);
        } else {
          this._setAwaitText(s.hours);
        }
        break;
      case 'collect-ice':
        // Gelo gasto baixa a base de comparacao: o que vale e pegar gelo novo depois do pedido
        if (s.iceCount < this._iceBaseline) this._iceBaseline = s.iceCount;
        if (s.iceCount > this._iceBaseline) this._setObjective('return-base');
        break;
      case 'return-base':
        if (s.insideHabitat) {
          this.act = 2;
          this._events.push({ type: 'start-storms' });
          this._card(CARDS.act2);
          this._setBuildText(s);
        }
        break;
      default:
        break;
    }
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

    if (this._guiding) this._setObjective('storm-guide');
    else this._setBuildText(s);
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

    const id = s.propellantPct < 100 ? 'fuel' : !s.dataSent ? 'send-data' : 'ignite';
    this.objectiveId = id;
    this.objectiveText = `${OBJECTIVES[id]} · Window closes in ${formatHours(left)}`;
  }

  _setObjective(id) {
    this.objectiveId = id;
    this.objectiveText = OBJECTIVES[id];
  }

  // "Waiting for Earth to answer: 15 min" (minutos de jogo que faltam para a resposta chegar)
  _setAwaitText(hours) {
    const minutes = Math.max(1, Math.ceil((this._replyAt - hours) * 60 - 1e-6));
    this.objectiveId = 'await-reply';
    this.objectiveText = `${OBJECTIVES['await-reply']}: ${minutes} min`;
  }

  _setBuildText(s) {
    const storms = Math.min(s.stormsSurvived, this.stormsForWindow);
    this.objectiveId = 'act2';
    this.objectiveText = `${OBJECTIVES.act2} · Fuel ${Math.floor(s.propellantPct)}% · Storms ${storms}/${this.stormsForWindow}`;
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
