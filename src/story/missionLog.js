import { MISSION_LOG_CONFIG as C } from '../config/constants.js';

// Diario de bordo por sol (issue #106). Sem DOM nem Three.js: so guarda o que aconteceu na
// partida, para a aba MISSION LOG do diario [J] e para testar com Vitest.
//
// Tipos de registro (`kind`):
//   'decision'    escolha do jogador (desligar o aquecedor, encher a parede do abrigo...)
//   'consequence' o que aconteceu por causa de uma decisao (`causeId` aponta para ela)
//   'event'       fato da missao sem decisao ligada (tempestade, conjuncao, poeira...)
//   'study'       estudo real da NASA revelado no diario
//   'summary'     resumo do fim do sol, com os 3 numeros em `numbers`
//
// Outros sistemas podem escrever direto: `log.add({ text, kind, hours })`.

// Horas de jogo desde o inicio (sol 1, 00:00) -> numero do sol (1, 2, ...)
export function solOf(hours) {
  return Math.floor(Math.max(0, hours) / 24) + 1;
}

// Horas de jogo -> "Sol 2, 21:10"
export function formatSolTime(hours) {
  const h = Math.max(0, hours);
  const minutesOfDay = Math.floor((h % 24) * 60 + 1e-6);
  const hh = String(Math.floor(minutesOfDay / 60)).padStart(2, '0');
  const mm = String(minutesOfDay % 60).padStart(2, '0');
  return `Sol ${solOf(h)}, ${hh}:${mm}`;
}

const round1 = (x) => Math.round(x * 10) / 10;

export class MissionLog {
  constructor({ maxEntries = C.MAX_ENTRIES } = {}) {
    this.maxEntries = maxEntries;
    this.entries = [];
    this.lastHours = 0;
    this._nextId = 1;
    // Decisao aberta por chave ('heater', 'shelter'...): a consequencia seguinte liga nela
    this._open = new Map();
    // Contador de mudancas, para a tela so redesenhar quando algo novo entrou
    this.version = 0;
  }

  // Registra uma linha. `key` (so decisao) abre a decisao para consequencias futuras;
  // `causeKey` liga esta linha a ultima decisao aberta com essa chave. `mergeHours`: se a
  // ultima decisao com a mesma chave foi ha menos que isso e ainda nao teve consequencia,
  // atualiza o texto dela em vez de criar outra (varios cliques viram uma decisao so).
  add({ text, kind = 'event', hours = this.lastHours, key = null, causeKey = null, weight = 1, mergeHours = 0, numbers = null, link = null }) {
    this.lastHours = Math.max(this.lastHours, hours);
    if (kind === 'decision' && key && mergeHours > 0) {
      const open = this._open.get(key);
      if (open && !open.effectIds.length && hours - open.hours <= mergeHours) {
        open.text = text;
        this.version++;
        return open;
      }
    }
    const entry = {
      id: this._nextId++,
      hours,
      sol: solOf(hours),
      time: formatSolTime(hours),
      kind,
      text,
      weight,
      causeId: null,
      effectIds: [],
      numbers,
      link,
    };
    if (causeKey) {
      const cause = this._open.get(causeKey);
      if (cause) {
        entry.causeId = cause.id;
        cause.effectIds.push(entry.id);
        cause.weight += weight;
      }
    }
    if (kind === 'decision' && key) this._open.set(key, entry);
    this.entries.push(entry);
    if (this.entries.length > this.maxEntries) this.entries.splice(0, this.entries.length - this.maxEntries);
    this.version++;
    return entry;
  }

  decision(text, { hours, key, weight = 1, mergeHours = 0 } = {}) {
    return this.add({ text, kind: 'decision', hours, key, weight, mergeHours });
  }

  // Consequencia de uma decisao. Sem decisao aberta com essa chave vira um evento solto.
  consequence(text, { hours, causeKey, weight = 2 } = {}) {
    const linked = causeKey && this._open.has(causeKey);
    return this.add({ text, kind: linked ? 'consequence' : 'event', hours, causeKey: linked ? causeKey : null, weight });
  }

  // A decisao deixou de valer (ex.: aquecedor religado): nada mais se liga a ela
  closeDecision(key) {
    this._open.delete(key);
  }

  hasOpenDecision(key) {
    return this._open.has(key);
  }

  get(id) {
    return this.entries.find((e) => e.id === id) ?? null;
  }

  causeOf(entry) {
    return entry?.causeId ? this.get(entry.causeId) : null;
  }

  entriesForSol(sol) {
    return this.entries.filter((e) => e.sol === sol);
  }

  // Sols que tem registro, do mais recente para o mais antigo
  sols() {
    return [...new Set(this.entries.map((e) => e.sol))].sort((a, b) => b - a);
  }

  // A decisao do sol que mais pesou: a de maior peso (consequencias somam peso)
  topDecision(sol) {
    let best = null;
    for (const e of this.entries) {
      if (e.sol !== sol || e.kind !== 'decision') continue;
      if (!best || e.weight > best.weight) best = e;
    }
    return best;
  }

  // Fecha o sol `sol` com os totais dele e grava o resumo. `totals`: energia ganha e gasta
  // (% de bateria), agua que entrou e saiu do tanque (L) e dose do sol (mSv).
  // O resumo fica no fim do proprio sol (23:59), mesmo que seja gravado ja no sol seguinte.
  endSol(sol, { energyIn = 0, energyOut = 0, waterIn = 0, waterOut = 0, doseMsv = 0 } = {}) {
    const hours = sol * 24 - 1 / 60;
    const top = this.topDecision(sol);
    const numbers = {
      energyIn: Math.round(energyIn),
      energyOut: Math.round(Math.max(0, energyOut)),
      waterIn: round1(Math.max(0, waterIn)),
      waterOut: round1(Math.max(0, waterOut)),
      doseMsv: Math.max(0, doseMsv),
      topDecision: top ? top.text : null,
    };
    return this.add({ text: `Sol ${sol} report`, kind: 'summary', hours, numbers });
  }
}
