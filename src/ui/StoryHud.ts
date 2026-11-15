// @ts-nocheck
import { MAV_CONFIG, STORY_CONFIG } from '../config/constants.ts';
import { WINDOW_CLOSED } from '../story/storyChapters.ts';
import { cardSpeaker, speakerFaceSvg } from '../story/radioSpeakers.ts';
import { pixelIconSvg } from './pixelIcons.ts';
import { typedChars } from './typewriter.ts';

// Tempo minimo de um card na tela quando ja existe outro na fila
const MIN_CARD_SECONDS = 5;

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function iconEl(name, className) {
  const node = el('span', className);
  node.innerHTML = pixelIconSvg(name);
  return node;
}

// So escreve no DOM quando o valor muda (o painel do objetivo e atualizado a cada frame)
function setText(node, text) {
  if (node._text !== text) {
    node._text = text;
    node.textContent = text;
  }
}

function setClass(node, className) {
  if (node._cls !== className) {
    node._cls = className;
    node.className = className;
  }
}

function setIcon(node, name) {
  if (node._icon !== name) {
    node._icon = name;
    node.innerHTML = pixelIconSvg(name);
  }
}

function setWidth(node, fraction) {
  const width = `${Math.round(Math.max(0, Math.min(1, fraction)) * 100)}%`;
  if (node._width !== width) {
    node._width = width;
    node.style.width = width;
  }
}

// UI da historia: o painel do objetivo (meta, foguete em degraus, tarefa e passos), o card de radio
// (mensagens da tripulacao e do Controle da Missao, nao pausa o jogo) e a tela de janela de
// lancamento fechada.
// Card de radio (issue #135): mostra o rosto de quem fala, o texto aparece letra por letra e as
// escolhas com tecla ([1] HIDE / [2] SHIELD) sao feitas na hora, sem soltar o teclado nem parar.
export class StoryHud {
  constructor({ cardSeconds = STORY_CONFIG.CARD_SECONDS, stormsNeeded = MAV_CONFIG.STORMS_TO_SURVIVE } = {}) {
    const $ = (id) => document.getElementById(id);
    this.cardSeconds = cardSeconds;

    this.cardEl = $('story-card');
    this.titleEl = $('story-card-title');
    this.bodyEl = $('story-card-body');
    this.sourceEl = $('story-card-source');
    this.faceEl = $('story-card-face');
    this.speakerEl = $('story-card-speaker');
    // Escolha rapida de um card: o GameEngine diz se o jogo esta rodando (`canChoose`) e aplica a
    // escolha (`onChoice(id)`; devolve false para o card continuar aberto, ex.: bateria vazia)
    this.canChoose = () => true;
    this.onChoice = () => true;
    // Maquina de escrever: as letras do card atual (um <span> por letra, montados na troca do card)
    this._typeChars = [];
    this._typed = 0;
    this._typeTime = 0;
    this._reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    this._cardSeconds = cardSeconds; // tempo total do card atual
    this.windowOverlayEl = $('window-overlay');

    this.panelEl = $('story-objective');
    this.goalTitleEl = $('story-goal-title');
    this.rocketEl = $('story-rocket');
    this.rocketCountEl = $('story-rocket-count');
    this.taskIconEl = $('story-task-icon');
    this.taskLabelEl = $('story-objective-text');
    this.taskKeyEl = $('story-task-key');
    this.taskHintEl = $('story-task-hint');
    this.stepCountEl = $('story-step-count');
    this.stepsEl = $('story-steps');
    this.stepEls = [...this.stepsEl.querySelectorAll('.story-step')];

    // Selo de certificado do treino de cadete (issue #88)
    this.certEl = $('cert-badge');
    this.certIconEl = $('cert-badge-icon');
    this.certNameEl = $('cert-badge-name');
    this.certMentorEl = $('cert-badge-mentor');
    this.certLineEl = $('cert-badge-line');
    this.certSourceEl = $('cert-badge-source');
    this._certTimer = null;
    this.goalsEl = $('story-goals');
    this.stormsGoalEl = $('story-goal-storms');
    this.dataGoalEl = $('story-goal-data');
    this.dataPointsEl = $('story-goal-points');
    this.timerEl = $('story-timer');
    this.timerIconEl = $('story-timer-icon');
    this.timerFillEl = this.timerEl.querySelector('.story-bar i');
    this.timerLabelEl = $('story-timer-label');

    this.signalEl = $('story-signal');
    this.signalDotEl = $('story-signal-dot');
    this.signalLabelEl = $('story-signal-label');
    this._signal = false;

    for (const node of this.panelEl.querySelectorAll('[data-icon]')) node.innerHTML = pixelIconSvg(node.dataset.icon);
    // Um degrau por bloco de gelo que o tanque pede
    const segs = $('story-rocket-segs');
    this.segsEl = segs;
    this.segEls = Array.from({ length: MAV_CONFIG.ICE_BLOCKS_FOR_FULL_TANK }, () => segs.appendChild(el('i')));
    $('story-goal-data').querySelector('.story-tick').innerHTML = pixelIconSvg('check');
    // Uma bolinha por tempestade que a missao pede
    const pips = this.stormsGoalEl.querySelector('.story-pips');
    this.pipEls = Array.from({ length: stormsNeeded }, () => pips.appendChild(el('i')));
    this._panelShown = false;

    this.queue = [];
    this.current = null;
    this.timer = 0;
    this.isWindowClosedShown = false;

    $('story-card-ok').addEventListener('click', () => this._close());
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Enter' && this.current) this._close();
    });
    // Na captura: com um card de escolha na tela, [1] e [2] vao para o card e nao trocam o item da mao
    document.addEventListener('keydown', (e) => this._onChoiceKey(e), true);
    $('window-play-again-btn').addEventListener('click', () => window.location.reload());
  }

  // view: resultado de objectiveView() (src/story/objectiveView.js) ou null para esconder o painel
  updateObjective(view) {
    const shown = Boolean(view);
    if (shown !== this._panelShown) {
      this._panelShown = shown;
      this.panelEl.classList.toggle('hidden', !shown);
    }
    this._updateSignal(view?.signal ?? null);
    if (!view) return;

    setText(this.goalTitleEl, view.goal);
    const { loaded, fuel, total } = view.rocket;
    // Tubos de amostra no foguete pedem mais gelo: um degrau a mais por bloco (issue #105)
    while (this.segEls.length < total) this.segEls.push(this.segsEl.appendChild(el('i')));
    while (this.segEls.length > total) this.segEls.pop().remove();
    this.segEls.forEach((node, i) => setClass(node, i < fuel ? 'fuel' : i < loaded ? 'ice' : ''));
    setText(this.rocketCountEl, `${loaded}/${total}`);
    setClass(this.rocketEl, fuel >= total ? 'story-rocket done' : 'story-rocket');

    setIcon(this.taskIconEl, view.task.icon);
    setText(this.taskLabelEl, view.task.label);
    setText(this.taskKeyEl, view.task.key ? `[${view.task.key}]` : '');
    // Tutorial guiado: a dica do passo e "STEP 4/15" (vazios fora do tutorial: o CSS esconde)
    setText(this.taskHintEl, view.task.hint ?? '');
    setText(this.stepCountEl, view.progress ? `STEP ${view.progress.now}/${view.progress.total}` : '');
    // Cor da secao da base do passo: pinta o icone, o numero do passo e a borda do painel
    const color = view.color ?? '';
    if (this.panelEl._color !== color) {
      this.panelEl._color = color;
      this.panelEl.classList.toggle('is-step', Boolean(color));
      this.panelEl.style.setProperty('--step-color', color || 'var(--hud-accent)');
    }

    setClass(this.stepsEl, !view.steps ? 'story-steps hidden' : view.loop ? 'story-steps is-loop' : 'story-steps');
    if (view.steps) {
      if (view.steps.length !== this.stepEls.length) this._buildSteps(view.steps.length);
      view.steps.forEach((step, i) => {
        const node = this.stepEls[i];
        // No tutorial o passo feito vira um "certo"; na volta de trabalho o icone fica, porque
        // o passo volta a valer na proxima volta
        setIcon(node, step.state === 'done' && !view.loop ? 'check' : step.icon);
        setClass(node, `story-step ${step.state}`);
      });
    }

    setClass(this.goalsEl, view.goals ? 'story-goals' : 'story-goals hidden');
    if (view.goals) {
      const { storms, stormsNeeded, dataSent, sciencePoints = 0, scienceGoal = 0 } = view.goals;
      setText(this.dataPointsEl, scienceGoal > 0 ? `${sciencePoints}/${scienceGoal}` : '');
      this.pipEls.forEach((node, i) => setClass(node, i < storms ? 'on' : ''));
      setClass(this.stormsGoalEl, storms >= stormsNeeded ? 'story-goal done' : 'story-goal');
      setClass(this.dataGoalEl, dataSent ? 'story-goal done' : 'story-goal');
    }

    setClass(this.timerEl, view.timer ? `story-timer ${view.timer.tone}` : 'story-timer hidden');
    if (view.timer) {
      setIcon(this.timerIconEl, view.timer.icon);
      setWidth(this.timerFillEl, view.timer.fill);
      setText(this.timerLabelEl, view.timer.label);
    }
  }

  // Passos do painel (a volta de trabalho tem 3)
  _buildSteps(count) {
    this.stepsEl.replaceChildren();
    this.stepEls = [];
    for (let i = 0; i < count; i++) {
      if (i > 0) this.stepsEl.append(el('i'));
      this.stepEls.push(this.stepsEl.appendChild(el('span', 'story-step')));
    }
  }

  // badge: certificateBadge() de storyChapters.js. Fica alguns segundos e some sozinho.
  showCertificate(badge, seconds = 5) {
    this.certIconEl.innerHTML = pixelIconSvg(badge.icon);
    this.certNameEl.textContent = badge.name;
    this.certMentorEl.textContent = `Signed: ${badge.mentor}`;
    this.certLineEl.textContent = badge.line;
    this.certSourceEl.textContent = badge.source ?? '';
    this.certEl.classList.remove('hidden', 'is-entering');
    void this.certEl.offsetWidth;
    this.certEl.classList.add('is-entering');
    clearTimeout(this._certTimer);
    this._certTimer = setTimeout(() => this.certEl.classList.add('hidden'), seconds * 1000);
  }

  // Card do radio recolhido: fechado o card (Enter, OK ou tempo), sobra uma faixa fina no mesmo
  // lugar com o sinal indo ate a Terra e a resposta voltando, ate ela chegar.
  _updateSignal(signal) {
    this._signal = Boolean(signal);
    setClass(this.signalEl, signal && !this.current ? `story-signal${signal.returning ? ' returning' : ''}` : 'story-signal hidden');
    if (!signal) return;
    const left = `${Math.round(signal.position * 100)}%`;
    if (this.signalDotEl._left !== left) {
      this.signalDotEl._left = left;
      this.signalDotEl.style.left = left;
    }
    setText(this.signalLabelEl, `${signal.label}: ${signal.seconds} s`);
  }

  // card: { title, lines?, choices?, link?, source? } (storyChapters.js). Um card por vez, em fila.
  // Balao de passo do tutorial (`card.step`) troca o do passo anterior na hora: sem fila, a
  // crianca nunca le uma instrucao que ja cumpriu.
  showCard(card) {
    if (card.step) this.queue = this.queue.filter((queued) => !queued.step);
    this.queue.push(card);
    if (!this.current || (card.step && this.current.step)) {
      this._next();
      if (this.queue.length > 0) this.timer = Math.min(this.timer, MIN_CARD_SECONDS);
      return;
    }
    // Com outro card esperando, o atual so fica o tempo minimo de leitura
    const shown = this._cardSeconds - this.timer;
    this.timer = Math.min(this.timer, Math.max(0, MIN_CARD_SECONDS - shown));
  }

  // Conta o tempo do card so enquanto o jogo roda, para ninguem perder a mensagem no pause
  update(dt) {
    if (!this.current) return;
    if (this._typed < this._typeChars.length) {
      this._typeTime += dt;
      this._revealChars(typedChars(this._typeTime, this._typeChars.length, STORY_CONFIG.CARD_TYPE_CHARS_PER_SECOND, STORY_CONFIG.CARD_TYPE_MAX_SECONDS));
    }
    this.timer -= dt;
    if (this.timer <= 0) this._next();
  }

  dismiss() {
    if (this.current) this._next();
  }

  // Enter ou OK: com o texto ainda aparecendo, a primeira vez mostra tudo; a segunda fecha
  _close() {
    if (this._typed < this._typeChars.length) this._revealChars(this._typeChars.length);
    else this.dismiss();
  }

  _revealChars(count) {
    for (; this._typed < count; this._typed++) this._typeChars[this._typed].className = '';
  }

  _onChoiceKey(e) {
    const choices = this.current?.choices;
    if (!choices || e.ctrlKey || e.altKey || e.metaKey) return;
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    const choice = choices.find((c) => c.id && c.key && (e.code === `Digit${c.key}` || e.code === `Numpad${c.key}`));
    if (!choice || !this.canChoose()) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if (!e.repeat) this._choose(choice);
  }

  // A escolha fecha o card, a nao ser que o jogo recuse (onChoice devolve false)
  _choose(choice) {
    if (!this.current?.choices?.includes(choice) || !this.canChoose()) return;
    if (this.onChoice(choice.id) !== false) this.dismiss();
  }

  clearCards() {
    this.queue.length = 0;
    this.current = null;
    this.cardEl.classList.add('hidden');
    this._showSignalStrip();
  }

  // Sem card aberto, a faixa do sinal aparece na hora (sem esperar o proximo frame)
  _showSignalStrip() {
    if (this._signal) this.signalEl.classList.remove('hidden');
    this.signalEl._cls = undefined;
  }

  showWindowClosed() {
    this.isWindowClosedShown = true;
    this.clearCards();
    document.getElementById('window-title').textContent = WINDOW_CLOSED.title;
    document.getElementById('window-text').textContent = WINDOW_CLOSED.text;
    document.getElementById('window-source').textContent = WINDOW_CLOSED.source;
    this.windowOverlayEl.classList.remove('hidden');
  }

  _next() {
    this.current = this.queue.shift() ?? null;
    if (!this.current) {
      this.cardEl.classList.add('hidden');
      this._showSignalStrip();
      return;
    }
    this.signalEl.classList.add('hidden');
    this.signalEl._cls = undefined;
    this._cardSeconds = this.current.seconds ?? this.cardSeconds; // cada card pode ter o seu tempo
    this.timer = this._cardSeconds;
    this.titleEl.textContent = this.current.title;
    // Quem fala: rosto de capacete na cor do traje e o nome (radioSpeakers.ts)
    const speaker = cardSpeaker(this.current);
    setText(this.speakerEl, `${speaker.name.toUpperCase()} - ${speaker.tag}`);
    if (this.faceEl._color !== speaker.color) {
      this.faceEl._color = speaker.color;
      this.faceEl.innerHTML = speakerFaceSvg(speaker.color);
    }
    // Balao de passo do tutorial: faixa do titulo e icones na cor da secao da base
    this.cardEl.classList.toggle('is-step', Boolean(this.current.color));
    this.cardEl.style.setProperty('--step-color', this.current.color ?? 'var(--hud-accent)');
    this._renderBody(this.current);
    this.sourceEl.textContent = this.current.source ?? '';
    this.cardEl.classList.remove('hidden');
    // Reinicia a animacao de entrada quando um card troca pelo seguinte
    this.cardEl.classList.remove('is-entering');
    void this.cardEl.offsetWidth;
    this.cardEl.classList.add('is-entering');
  }

  // Monta o desenho do card. So roda quando o card troca, nunca a cada frame.
  _renderBody(card) {
    const body = this.bodyEl;
    body.replaceChildren();
    this._typeChars.length = 0;
    this._typed = 0;
    this._typeTime = 0;
    // Card com escolha por tecla nao tem OK: a resposta e a propria escolha (ou o tempo do card)
    this.cardEl.classList.toggle('has-picks', Boolean(card.choices?.some((choice) => choice.id)));

    if (card.link) {
      // Pacote de radio saindo de Marte e chegando na Terra, com o tempo real de viagem. A viagem
      // do desenho dura o tempo do card: ele fecha quando o pacote chega.
      const link = el('div', 'story-link');
      link.style.setProperty('--link-seconds', `${this._cardSeconds}s`);
      const mars = el('span', 'story-planet mars');
      mars.append(el('i'), el('b', '', 'MARS'));
      const track = el('span', 'story-link-track');
      track.append(el('i'), el('b', '', `${card.link.minutes} min`), el('small', '', `${card.link.millionKm} million km`));
      const earth = el('span', 'story-planet earth');
      earth.append(el('i'), el('b', '', 'EARTH'));
      link.append(mars, track, earth);
      body.append(link);
    }

    if (card.choices) {
      // Duas saidas lado a lado: o que cada uma da (verde) e o que cada uma custa (vermelho)
      const row = el('div', 'story-choices');
      card.choices.forEach((choice, i) => {
        if (i > 0) row.append(el('span', 'story-choice-or', 'OR'));
        // Opcao com `id` e um botao: tecla no teclado, toque no celular
        const tile = el(choice.id ? 'button' : 'div', choice.id ? 'story-choice is-pick' : 'story-choice');
        if (choice.id) {
          tile.type = 'button';
          tile.addEventListener('click', () => this._choose(choice));
        }
        const name = el('strong', '', choice.name);
        if (choice.key) name.prepend(el('span', 'story-key', `[${choice.key}]`), ' ');
        tile.append(iconEl(choice.icon, 'story-choice-icon'), name, el('span', 'good', `+ ${choice.good}`), el('span', 'bad', `- ${choice.bad}`));
        row.append(tile);
      });
      body.append(row);
    }

    for (const line of card.lines ?? []) {
      const row = el('div', 'story-line');
      row.append(iconEl(line.icon, 'story-line-icon'), this._typedText(line.text));
      body.append(row);
    }

    // Fato real dos eventos aleatorios (issue #107): data e fonte vao no rodape do card
    if (card.fact) body.append(el('p', 'story-fact', card.fact));
  }

  // Frase do card com uma letra por <span>, escondidas ate a maquina de escrever chegar nelas
  // (o lugar do texto ja fica reservado: o card nao muda de tamanho enquanto escreve)
  _typedText(text) {
    if (this._reducedMotion) return el('span', '', text);
    const span = el('span');
    span.setAttribute('aria-label', text);
    for (const ch of text) this._typeChars.push(span.appendChild(el('span', 'story-type-off', ch)));
    return span;
  }
}
