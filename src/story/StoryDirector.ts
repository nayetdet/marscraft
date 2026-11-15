// @ts-nocheck
import { MISSION_CONFIG, STORY_CONFIG } from '../config/constants.ts';
import { CARDS, OBJECTIVES, certificateBadge, certificateById, commsCard, replyCard } from './storyChapters.ts';
import { CORE_STEPS, TUTORIAL_STEPS, stepCard } from './tutorialSteps.ts';

// A historia do jogo em 3 atos: chegada (tutorial), preparar a volta e janela de lancamento.
// O ato 1 e o tutorial guiado (src/story/tutorialSteps.ts): um passo por vez, cada um com um
// balao proprio, do basico (entrar, beber, comer, avisar a Terra) ao avancado (rover, gelo,
// foguete, luneta). A resposta da Terra chega sozinha, com o jogador ja no passo seguinte.
// Do ato 2 em diante o jogo tem uma rotina que se repete ate o tanque encher: buscar gelo, levar
// ao foguete e voltar a base para recarregar o ar (`needsBase` marca esse ultimo passo).
// Logica pura, sem DOM nem Three.js: o GameEngine entrega um retrato do jogo a cada frame
// (`update(snapshot)`) e aplica os eventos que saem em `drainEvents()`.
//
// snapshot = { hours, insideHabitat, iceCount, iceNeeded, stormPhase, stormsSurvived,
//              propellantPct, dataSent, launched,
//              drinkCount, mealCount, earthCalls, powerChecks, plantCount, harvestCount,
//              workoutCount, washCount, shelterWaterL, roverDrives, roverIceKg, scanCount }
//              (a segunda parte so e lida pelos passos do tutorial)
//
// `training: true` = tutorial completo. Sem ele sobram os 3 passos centrais (entrar, avisar a
// Terra, buscar gelo). 4 passos entregam um certificado (issue #88): evento 'certificate' com o
// selo. `skipTraining()` pula o que falta (menu Demo Tools).
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
    // Passos do tutorial desta partida e onde a crianca esta neles (-1 = fora do tutorial)
    this.steps = training ? TUTORIAL_STEPS : CORE_STEPS;
    this.stepIndex = -1;
    // Certificados ja ganhos (ids de CERTIFICATES), na ordem
    this.certificates = [];
    // Copia do retrato tirada quando o passo atual comecou
    this._stepBaseline = {};
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
    this._guideShown = false;
    this._guiding = false;
    this._windowClosesAt = 0;
    this._finished = false;
    this._events = [];
  }

  // `s`: retrato do jogo na hora em que a historia comeca (para o primeiro passo comparar)
  start(s = {}) {
    if (this.act !== 0) return;
    this.act = 1;
    this._startStep(0, s);
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

  // Passo atual do tutorial, ou null fora dele
  get step() {
    return this.steps[this.stepIndex] ?? null;
  }

  get inTraining() {
    return this.act === 1 && this.step !== null;
  }

  // Ato 1: um passo por vez. Um passo por frame, para cada balao ter a sua vez.
  _updateArrival(s) {
    const step = this.step;
    if (!step || !step.done(s, this._stepBaseline)) return;

    if (step.id === 'report') {
      this._replyAt = s.hours + this.replyDelayHours;
      this._updateReply(s);
      this._card(commsCard(this.comms));
    }
    if (step.certificate) {
      this.certificates.push(step.certificate);
      this._events.push({ type: 'certificate', badge: certificateBadge(certificateById(step.certificate), s) });
    } else {
      this._events.push({ type: 'step-done', id: step.id });
    }

    if (this.stepIndex + 1 < this.steps.length) this._startStep(this.stepIndex + 1, s);
    else this._finishTutorial();
  }

  _startStep(index, s) {
    this.stepIndex = index;
    this._stepBaseline = { ...s };
    const step = this.steps[index];
    this._setObjective(step.id, step.objective);
    this._card(stepCard(step, index, this.steps.length));
  }

  // Fim do tutorial: comeca o ato 2, com as tempestades e a rotina de encher o foguete
  _finishTutorial() {
    this.stepIndex = -1;
    this.act = 2;
    this._events.push({ type: 'start-storms' });
    if (this.training) this._card(CARDS.trainingDone);
    this._card(CARDS.act2);
    this._setObjective('act2');
  }

  // Menu Demo Tools: pula o tutorial (para demonstracoes rapidas). Antes de a historia comecar,
  // sobram os 3 passos centrais; no meio dele, o jogo vai direto para o ato 2.
  skipTraining() {
    const was = this.inTraining;
    this.training = false;
    if (was) this._finishTutorial();
    else if (this.act === 0) this.steps = CORE_STEPS;
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

    // Com a tempestade em Marte o objetivo e um so: ficar seguro. O gelo espera (teste com
    // jogadores de 15/11/2026: o painel pedia gelo enquanto o alerta mandava para o abrigo).
    this._setObjective(this._guiding || s.stormPhase === 'active' ? 'storm-guide' : 'act2');
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
    if (s.stormPhase === 'active') {
      this._setObjective('storm-guide');
      return;
    }
    this._setObjective(s.propellantPct < 100 ? 'fuel' : !s.dataSent ? 'send-data' : 'ignite');
  }

  _setObjective(id, text = OBJECTIVES[id]) {
    this.objectiveId = id;
    this.objectiveText = text;
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
