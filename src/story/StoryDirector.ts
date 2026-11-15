// @ts-nocheck
import { MAV_CONFIG, MISSION_CONFIG, STORY_CONFIG } from '../config/constants.ts';
import { CARDS, OBJECTIVES, certificateBadge, certificateById, commsCard, replyCard } from './storyChapters.ts';
import { findDetours } from './tutorialDetours.ts';
import { CORE_STEPS, TUTORIAL_STEPS, detourCard, stepCard } from './tutorialSteps.ts';

// A historia do jogo em 2 atos: chegada (tutorial) e a missao, com a janela de lancamento ja
// aberta. Antes eram 3 (a janela so abria depois da tempestade); a espera parava o jogo.
// O ato 1 e o tutorial guiado (src/story/tutorialSteps.ts): um passo por vez, cada um com um
// balao proprio, do basico (entrar, beber, comer, avisar a Terra) ao avancado (rover, gelo,
// foguete, luneta). A resposta da Terra chega sozinha, com o jogador ja no passo seguinte.
// No ato 2 o jogo tem uma rotina que se repete ate o tanque encher: buscar gelo, levar ao foguete
// e voltar a base para recarregar o ar (`needsBase` marca esse ultimo passo). A tempestade solar
// chega no meio da janela: e um obstaculo da missao, nao uma espera antes dela.
// Logica pura, sem DOM nem Three.js: o GameEngine entrega um retrato do jogo a cada frame
// (`update(snapshot)`) e aplica os eventos que saem em `drainEvents()`.
//
// snapshot = { hours, insideHabitat, iceCount, iceNeeded, stormPhase, stormsSurvived,
//              propellantPct, dataSent, launched,
//              drinkCount, mealCount, earthCalls, powerChecks, plantCount, harvestCount,
//              workoutCount, washCount, shelterWaterL, roverDrives, roverIceKg, scanCount }
//              (a segunda parte so e lida pelos passos do tutorial)
//            + { baseWaterL, batteryCharge, foodStock, roverBattery, roverActive }: recursos da
//              base, lidos pelos desvios do tutorial (issue #237, tutorialDetours.ts)
//
// `training: true` = passeio completo pela base. Sem ele sobram os passos centrais (entrar,
// avisar a Terra, buscar gelo, carregar o foguete e escanear): e o tutorial padrao do jogo. 4 passos entregam um certificado (issue #88): evento 'certificate' com o
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
    stormsNeeded = MAV_CONFIG.STORMS_TO_SURVIVE,
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
    // Desvio do tutorial (issue #237): falta um recurso para o passo atual, entao a tarefa vira
    // buscar esse recurso. null = o passo normal. O passo (stepIndex) e a base de comparacao
    // (_stepBaseline) nao mudam durante o desvio: quando o recurso volta, o passo continua.
    this.detour = null;
    this._detourResources = new Set();
    this.replyDelayHours = replyDelayHours;
    this.comms = comms;
    this.gameHoursPerSecond = gameHoursPerSecond;
    this.windowHours = windowHours;
    // Tempestades que o foguete pede antes do IGNITE (a do tutorial, que cai no meio da janela)
    this.stormsNeeded = stormsNeeded;

    this.act = 0; // 0 = a historia ainda nao comecou
    this.objectiveId = null;
    this.objectiveText = '';
    this.windowHoursLeft = null; // so existe no ato 2
    // Segundos reais ate a resposta da Terra chegar; null quando nao ha mensagem a caminho
    this.replySecondsLeft = null;
    // Rotina de trabalho: true depois de entregar gelo no foguete, ate o jogador voltar a base
    this.needsBase = false;

    this._lastIceNeeded = null;
    this._replyAt = null;
    this._guideShown = false;
    this._guiding = false;
    this._windowClosesAt = 0;
    this._lastSnapshot = {}; // ultimo retrato visto (o menu que pula o tutorial nao tem um)
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
    this._lastSnapshot = s;

    if (s.launched) {
      // Guarda quanto da janela sobrou na hora da decolagem (vai para a tela de vitoria)
      if (this.act === 2) this.windowHoursLeft = Math.max(0, this._windowClosesAt - s.hours);
      this._finished = true;
      this.replySecondsLeft = null;
      this._setObjective('done');
      return;
    }

    this._updateReply(s);
    this._updateRoutine(s);
    if (this.act === 1) this._updateArrival(s);
    else this._updateMission(s);
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
    if (!step) return;
    if (!step.done(s, this._stepBaseline)) {
      this._updateDetour(step, s);
      return;
    }
    // O passo acabou, mesmo no meio de um desvio: segue normalmente
    this._clearDetour();

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
    else this._finishTutorial(s);
  }

  _startStep(index, s) {
    this.stepIndex = index;
    this._stepBaseline = { ...s };
    this._clearDetour();
    const step = this.steps[index];
    // Ja comeca no desvio se a base nao tem o que o passo pede (so o balao do desvio aparece)
    this._updateDetour(step, s);
    if (this.detour) return;
    this._setObjective(step.id, step.objective);
    this._card(stepCard(step, index, this.steps.length));
  }

  _clearDetour() {
    this.detour = null;
    this._detourResources.clear();
  }

  // Falta um recurso para o passo? Entao o painel, a seta e o balao mostram onde busca-lo. Quando
  // o recurso volta, o passo volta com o seu balao. Cada troca mostra um balao, uma vez so.
  _updateDetour(step, s) {
    const chain = findDetours(step.needs, s, this._detourResources);
    const next = chain.length > 0 ? chain[chain.length - 1] : null;
    this._detourResources.clear();
    for (const detour of chain) this._detourResources.add(detour.resource);
    if (next === this.detour) return;
    this.detour = next;
    if (next) {
      this._setObjective(next.id, next.objective);
      this._card(detourCard(next));
    } else {
      this._setObjective(step.id, step.objective);
      this._card(stepCard(step, this.stepIndex, this.steps.length));
    }
  }

  // Fim do tutorial: comeca o ato 2, a missao. A janela de lancamento abre na hora e as
  // tempestades comecam a valer.
  _finishTutorial(s = {}) {
    this._clearDetour();
    this.stepIndex = -1;
    this.act = 2;
    this._windowClosesAt = (s.hours ?? 0) + this.windowHours;
    this.windowHoursLeft = this.windowHours;
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
    if (was) this._finishTutorial(this._lastSnapshot);
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

  // Ato 2: a janela esta aberta e a tempestade solar chega no meio dela
  _updateMission(s) {
    const left = this._windowClosesAt - s.hours;
    if (left <= 0) {
      this.windowHoursLeft = 0;
      this._finished = true;
      this._setObjective('failed');
      this._events.push({ type: 'window-closed' });
      return;
    }
    this.windowHoursLeft = left;

    // So a primeira tempestade e guiada: card com o trade-off e objetivo de se proteger
    if (!this._guideShown && s.stormPhase === 'warning') {
      this._guideShown = true;
      this._guiding = true;
      this._card(CARDS.stormGuide);
    }
    if (this._guiding && s.stormPhase === 'calm') this._guiding = false;

    // Com a tempestade em Marte o objetivo e um so: ficar seguro. O gelo espera (teste com
    // jogadores de 15/11/2026: o painel pedia gelo enquanto o alerta mandava para o abrigo).
    if (this._guiding || s.stormPhase === 'active') {
      this._setObjective('storm-guide');
      return;
    }
    // Tanque cheio e ciencia enviada, mas a tempestade ainda nao passou: 'fuel' deixa o painel
    // mostrar o trabalho que falta (nextRocketJob devolve 'storms')
    const stormsLeft = (s.stormsSurvived ?? 0) < this.stormsNeeded;
    this._setObjective(s.propellantPct < 100 ? 'fuel' : !s.dataSent ? 'send-data' : stormsLeft ? 'fuel' : 'ignite');
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
