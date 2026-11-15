import { MISSION_CONFIG, STORY_CONFIG } from '../config/constants.js';
import { CARDS, CERTIFICATE_IDS, OBJECTIVES, certificateBadge, certificateById, commsCard, replyCard } from './storyChapters.js';

// A historia do jogo em 3 atos: chegada (tutorial), preparar a volta e janela de lancamento.
// O tutorial tem 3 passos, um por ideia: entrar na base (ar), avisar a Terra (radio com atraso)
// e buscar gelo. A resposta da Terra chega sozinha, com o jogador ja no passo seguinte.
// Do ato 2 em diante o jogo tem uma rotina que se repete ate o tanque encher: buscar gelo, levar
// ao foguete e voltar a base para recarregar o ar (`needsBase` marca esse ultimo passo).
// Logica pura, sem DOM nem Three.js: o GameEngine entrega um retrato do jogo a cada frame
// (`update(snapshot)`) e aplica os eventos que saem em `drainEvents()`.
//
// snapshot = { hours, insideHabitat, iceCount, iceNeeded, atConsole, stormPhase, stormsSurvived,
//              propellantPct, dataSent, launched,
//              powerChecks, harvestCount, workoutCount, shelterWaterL }  (os 4 ultimos: treino #88)
//
// Treino de cadete (issue #88, `training: true`): entre avisar a Terra e buscar o gelo, 4
// certificados curtos dentro da base (energia, estufa, academia e abrigo). Cada um solta um
// evento 'certificate' com o selo. `skipTraining()` pula o que falta (menu Demo Controls).
// O diretor escreve `needsBase` de volta no retrato, para o painel e a seta lerem a mesma rotina.
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
    training = false,
  } = {}) {
    this.training = training;
    // Certificados ja ganhos (ids de CERTIFICATES), na ordem
    this.certificates = [];
    this._trainingBaseline = null;
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
    // Rotina de trabalho: true depois de entregar gelo no foguete, ate o jogador voltar a base
    this.needsBase = false;

    this._lastIceNeeded = null;
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
    this._updateRoutine(s);
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
          this._card(commsCard(this.comms, { training: this.training }));
          if (this.training) {
            // O que o cadete fizer daqui em diante conta para os certificados
            this._trainingBaseline = {
              powerChecks: s.powerChecks ?? 0,
              harvestCount: s.harvestCount ?? 0,
              workoutCount: s.workoutCount ?? 0,
              shelterWaterL: s.shelterWaterL ?? 0,
            };
            this._card(CARDS.training);
            this._setObjective(CERTIFICATE_IDS[0]);
          } else {
            this._startIce(s);
          }
        }
        break;
      case 'cert-power':
      case 'cert-greenhouse':
      case 'cert-gym':
      case 'cert-shelter':
        if (this._certificateDone(this.objectiveId, s)) this._award(this.objectiveId, s);
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

  _startIce(s) {
    this._iceBaseline = s.iceCount;
    this._setObjective('collect-ice');
  }

  // O cadete fez a tarefa do certificado depois de o treino comecar?
  _certificateDone(id, s) {
    const b = this._trainingBaseline;
    switch (id) {
      case 'cert-power': return (s.powerChecks ?? 0) > b.powerChecks;
      case 'cert-greenhouse': return (s.harvestCount ?? 0) > b.harvestCount;
      case 'cert-gym': return (s.workoutCount ?? 0) > b.workoutCount;
      case 'cert-shelter': return (s.shelterWaterL ?? 0) > b.shelterWaterL + 1e-6;
      default: return false;
    }
  }

  _award(id, s) {
    this.certificates.push(id);
    this._events.push({ type: 'certificate', badge: certificateBadge(certificateById(id), s) });
    const next = CERTIFICATE_IDS[CERTIFICATE_IDS.indexOf(id) + 1];
    if (next) {
      this._setObjective(next);
      return;
    }
    this._card(CARDS.trainingDone);
    this._startIce(s);
  }

  get inTraining() {
    return CERTIFICATE_IDS.includes(this.objectiveId);
  }

  // Menu Demo Controls: pula o treino (para demonstracoes rapidas). No meio dele, vai direto ao gelo.
  skipTraining(s = { iceCount: 0 }) {
    const was = this.inTraining;
    this.training = false;
    if (was) this._startIce(s);
    return was;
  }

  // Rotina de trabalho (atos 2 e 3). Entregar gelo pede a volta a base; entrar nela, ou pegar
  // mais gelo antes disso, fecha o passo. E so um guia: nada trava se a crianca seguir outra ordem.
  _updateRoutine(s) {
    // O tanque pede menos gelo so quando o jogador entrega algum (a fabrica gasta o que ja entrou)
    const delivered = this._lastIceNeeded !== null && s.iceNeeded < this._lastIceNeeded;
    this._lastIceNeeded = s.iceNeeded;
    if (this.act >= 2) {
      if (s.insideHabitat || s.iceCount > 0) this.needsBase = false;
      else if (delivered) this.needsBase = true;
    }
    s.needsBase = this.needsBase;
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
