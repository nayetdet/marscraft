// @ts-nocheck
import { EVENTS_CONFIG, MISSION_CONFIG } from '../config/constants.ts';

// Diretor de eventos aleatorios de Marte (issue #107). Logica pura, sem DOM nem Three.js.
// Recebe uma semente e as horas de jogo e decide quando cada evento comeca e termina.
// O sorteio usa um gerador proprio com semente (nunca Math.random), entao a mesma semente
// sempre da a mesma agenda: da para repetir uma partida (?seed=123) e testar com Vitest.
//
// Regras de ritmo:
// - nada antes de `start()`, que o GameEngine chama no primeiro selo do tutorial (os primeiros
//   passos ficam calmos) ou, com o tutorial pulado, no inicio do ato 2;
// - no maximo um evento ativo por vez e uma folga minima (MIN_GAP_HOURS) entre eles;
// - nenhum evento comeca durante uma tempestade solar (`blocked`), para nao somar dois perigos;
// - eclipse so com o Sol alto, geada so no nascer do Sol e aurora so de noite (WINDOWS).
//
// O GameEngine aplica os efeitos dos eventos que saem em `drainEvents()`:
//   { type: 'event-start', event }  e  { type: 'event-end', event }
// event = { id, type, hours, endHours, durationHours, params, manual }

const TAU = Math.PI * 2;

// Gerador pseudoaleatorio mulberry32: rapido, 32 bits, sempre a mesma sequencia para a mesma semente
export function createRng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Semente valida: inteiro de 1 a 999999 (curta, para a crianca anotar). null se nao der.
export function normalizeSeed(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Math.floor(Math.abs(Number(value)));
  if (!Number.isFinite(n) || n <= 0) return null;
  return ((n - 1) % 999999) + 1;
}

// Le `?seed=123` da URL (string de location.search). null se nao houver semente valida.
export function seedFromSearch(search) {
  if (!search) return null;
  return normalizeSeed(new URLSearchParams(search).get('seed'));
}

function between(rng, [min, max]) {
  return min + (max - min) * rng();
}

export function durationHours(type, config = EVENTS_CONFIG) {
  return config.DURATION_SECONDS[type] * MISSION_CONFIG.GAME_HOURS_PER_SECOND;
}

// Hora do dia (0..24) dentro da janela [de, ate) do evento. Janela que passa de 24 h vira a noite.
export function inWindow(type, hours, config = EVENTS_CONFIG) {
  const window = config.WINDOWS[type];
  if (!window) return true;
  const tod = ((hours % 24) + 24) % 24;
  const [from, to] = window;
  return to > 24 ? tod >= from || tod < to - 24 : tod >= from && tod < to;
}

// Primeira hora a partir de `hours` que cai na janela do evento
export function nextWindowHours(type, hours, config = EVENTS_CONFIG) {
  if (inWindow(type, hours, config)) return hours;
  const [from] = config.WINDOWS[type];
  const dayStart = Math.floor(hours / 24) * 24;
  const opens = dayStart + from + 1e-6; // folga contra o arredondamento da hora do dia
  return opens > hours ? opens : opens + 24;
}

// Parametros sorteados de cada evento. Sempre 4 sorteios, qualquer que seja o tipo, para a
// sequencia da agenda nao depender de quais tipos sairam antes.
function drawParams(rng) {
  return {
    angle: rng() * TAU, // meteoro e redemoinho: de que lado da base
    distance: rng(), // meteoro: 0 = perto da area construida, 1 = perto da borda segura
    crossesPanels: rng() < 0.65, // redemoinho: passa ou nao pelo campo solar
    pick: rng(), // tremor: qual estacao da tripulacao balanca mais
  };
}

// Agenda inteira da partida a partir de `startHours` (inicio do ato 2). Funcao pura.
export function buildEventSchedule(seed, startHours = 0, config = EVENTS_CONFIG) {
  const rng = createRng(seed);
  const types = config.RANDOM_TYPES;
  const events = [];
  const end = startHours + config.HORIZON_HOURS;
  let t = startHours + between(rng, config.FIRST_DELAY_HOURS);
  let last = null;
  while (t < end) {
    // Nunca o mesmo evento duas vezes seguidas
    const options = types.filter((type) => type !== last);
    const type = options[Math.floor(rng() * options.length)];
    const hours = nextWindowHours(type, t, config);
    const length = durationHours(type, config);
    events.push({ id: events.length, type, hours, durationHours: length, params: drawParams(rng) });
    last = type;
    t = hours + length + between(rng, config.GAP_HOURS);
  }
  return events;
}

export class EventDirector {
  constructor({ seed, config = EVENTS_CONFIG } = {}) {
    this.seed = normalizeSeed(seed) ?? 1;
    this.config = config;
    this.started = false;
    this.queue = []; // agenda que ainda nao comecou, em ordem de hora
    this.active = null;
    this.history = []; // eventos que ja comecaram, para o diario e a tela de vitoria
    this._manual = [];
    this._lastEnd = null;
    this._nextId = 1000;
    // Sorteios dos eventos pedidos na hora (botoes de demo e aurora): outra sequencia da mesma semente
    this._extraRng = createRng(this.seed ^ 0x5bd1e995);
    this._events = [];
  }

  // Inicio do ato 2: monta a agenda a partir de agora. Chamar de novo nao refaz nada.
  start(hours) {
    if (this.started) return;
    this.started = true;
    this.queue = buildEventSchedule(this.seed, hours, this.config);
  }

  get nextEvent() {
    return this.queue[0] ?? null;
  }

  // Progresso do evento ativo de 0 a 1
  progress(hours) {
    const e = this.active;
    if (!e) return 0;
    return Math.max(0, Math.min(1, (hours - e.hours) / e.durationHours));
  }

  // `blocked`: ha uma tempestade solar a caminho ou passando; nada novo comeca agora
  update(hours, { blocked = false } = {}) {
    if (this.active && hours >= this.active.endHours) this._end(hours);
    if (this.active) return;

    // Botoes de demo e admin: comecam ja, sem as regras de ritmo
    if (this._manual.length) {
      this._begin(this._manual.shift(), hours, true);
      return;
    }

    const next = this.queue[0];
    if (!next || hours < next.hours) return;
    if (blocked) return this._postpone(next, hours + this.config.POSTPONE_HOURS);
    if (this._lastEnd !== null && hours - this._lastEnd < this.config.MIN_GAP_HOURS) {
      return this._postpone(next, this._lastEnd + this.config.MIN_GAP_HOURS);
    }
    if (!inWindow(next.type, hours, this.config)) {
      return this._postpone(next, nextWindowHours(next.type, hours, this.config));
    }
    this.queue.shift();
    this._begin(next, hours, false);
  }

  // Comeca um evento agora (botoes de demo e de admin). Termina o que estiver ativo.
  // `params`: troca parte do sorteio (a historia pede um redemoinho que cruza os paineis, #408)
  trigger(type, hours, params = null) {
    if (!this.config.DURATION_SECONDS[type]) return false;
    if (this.active) this._end(hours);
    const event = this._extraEvent(type, hours);
    if (params) Object.assign(event.params, params);
    this._manual.push(event);
    return true;
  }

  // Aurora: recompensa por sobreviver a uma tempestade solar, na proxima noite
  requestAurora(hours) {
    if (this.queue.some((e) => e.type === 'aurora') || this.active?.type === 'aurora') return;
    const event = this._extraEvent('aurora', nextWindowHours('aurora', hours, this.config));
    this.queue.push(event);
    this._sortQueue();
  }

  _extraEvent(type, hours) {
    return {
      id: this._nextId++,
      type,
      hours,
      durationHours: durationHours(type, this.config),
      params: drawParams(this._extraRng),
    };
  }

  _postpone(event, hours) {
    event.hours = Math.max(event.hours, hours);
    this._sortQueue();
  }

  _sortQueue() {
    this.queue.sort((a, b) => a.hours - b.hours || a.id - b.id);
  }

  _begin(event, hours, manual) {
    const active = { ...event, hours, endHours: hours + event.durationHours, manual };
    this.active = active;
    this.history.push(active);
    this._events.push({ type: 'event-start', event: active });
  }

  _end(hours) {
    const event = this.active;
    this.active = null;
    this._lastEnd = Math.min(hours, event.endHours);
    this._events.push({ type: 'event-end', event });
  }

  drainEvents() {
    if (this._events.length === 0) return this._events;
    const events = this._events;
    this._events = [];
    return events;
  }
}
