import { MAV_CONFIG, STORY_CONFIG } from '../config/constants.js';
import { WINDOW_CLOSED } from '../story/storyChapters.js';
import { pixelIconSvg } from './pixelIcons.js';

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
// (mensagens do Controle da Missao, nao pausa o jogo) e a tela de janela de lancamento fechada.
export class StoryHud {
  constructor({ cardSeconds = STORY_CONFIG.CARD_SECONDS, stormsNeeded = STORY_CONFIG.STORMS_FOR_WINDOW } = {}) {
    const $ = (id) => document.getElementById(id);
    this.cardSeconds = cardSeconds;

    this.cardEl = $('story-card');
    this.titleEl = $('story-card-title');
    this.bodyEl = $('story-card-body');
    this.sourceEl = $('story-card-source');
    this.windowOverlayEl = $('window-overlay');

    this.panelEl = $('story-objective');
    this.goalTitleEl = $('story-goal-title');
    this.rocketEl = $('story-rocket');
    this.rocketCountEl = $('story-rocket-count');
    this.taskIconEl = $('story-task-icon');
    this.taskLabelEl = $('story-objective-text');
    this.taskKeyEl = $('story-task-key');
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

    $('story-card-ok').addEventListener('click', () => this.dismiss());
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Enter' && this.current) this.dismiss();
    });
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
      const { storms, stormsNeeded, dataSent } = view.goals;
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

  // Passos do painel: 3 no tutorial e na volta de trabalho, 4 no treino de cadete
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
  showCard(card) {
    this.queue.push(card);
    if (!this.current) {
      this._next();
      return;
    }
    // Com outro card esperando, o atual so fica o tempo minimo de leitura
    const shown = this.cardSeconds - this.timer;
    this.timer = Math.min(this.timer, Math.max(0, MIN_CARD_SECONDS - shown));
  }

  // Conta o tempo do card so enquanto o jogo roda, para ninguem perder a mensagem no pause
  update(dt) {
    if (!this.current) return;
    this.timer -= dt;
    if (this.timer <= 0) this._next();
  }

  dismiss() {
    if (this.current) this._next();
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
    this.timer = this.current.seconds ?? this.cardSeconds; // cards com fato real ficam mais tempo
    this.titleEl.textContent = this.current.title;
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

    if (card.link) {
      // Sinal de radio saindo de Marte e chegando na Terra, com o tempo real de viagem
      const link = el('div', 'story-link');
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
        const tile = el('div', 'story-choice');
        const name = el('strong', '', choice.name);
        if (choice.key) name.append(' ', el('span', 'story-key', `[${choice.key}]`));
        tile.append(iconEl(choice.icon, 'story-choice-icon'), name, el('span', 'good', `+ ${choice.good}`), el('span', 'bad', `- ${choice.bad}`));
        row.append(tile);
      });
      body.append(row);
    }

    for (const line of card.lines ?? []) {
      const row = el('div', 'story-line');
      row.append(iconEl(line.icon, 'story-line-icon'), el('span', '', line.text));
      body.append(row);
    }

    // Fato real dos eventos aleatorios (issue #107): data e fonte vao no rodape do card
    if (card.fact) body.append(el('p', 'story-fact', card.fact));
  }
}
