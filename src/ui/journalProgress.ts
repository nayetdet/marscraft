// @ts-nocheck
// Logica pura do diario [J] (issue #139): patente pelas descobertas e os selos NEW! das abas.

export const JOURNAL_RANKS = ['CADET', 'SPECIALIST', 'COMMANDER'];

/**
 * Patente do diario. As descobertas se dividem em tres faixas iguais: CADET, SPECIALIST e COMMANDER.
 * @returns {{label: string, index: number, fill: number, next: string|null, toNext: number, complete: boolean, thresholds: number[]}}
 */
export function journalRank(count, total) {
  const safeTotal = Math.max(1, total);
  const found = Math.min(Math.max(0, count), safeTotal);
  const thresholds = JOURNAL_RANKS.map((_, i) => Math.ceil((safeTotal * i) / JOURNAL_RANKS.length));
  let index = 0;
  thresholds.forEach((min, i) => {
    if (found >= min) index = i;
  });
  const next = index + 1 < JOURNAL_RANKS.length ? JOURNAL_RANKS[index + 1] : null;
  return {
    label: JOURNAL_RANKS[index],
    index,
    fill: found / safeTotal,
    next,
    toNext: next ? thresholds[index + 1] - found : safeTotal - found,
    complete: found === safeTotal,
    thresholds,
  };
}

/** Descobertas novas que a crianca ainda nao viu no diario, por aba (categoria). */
export class UnseenFinds {
  constructor() {
    this.byCategory = new Map(); // categoria -> Set de ids
  }

  add(id, category) {
    if (!this.byCategory.has(category)) this.byCategory.set(category, new Set());
    this.byCategory.get(category).add(id);
  }

  isNew(id) {
    for (const ids of this.byCategory.values()) if (ids.has(id)) return true;
    return false;
  }

  hasNew(category) {
    return (this.byCategory.get(category)?.size ?? 0) > 0;
  }

  get size() {
    let n = 0;
    for (const ids of this.byCategory.values()) n += ids.size;
    return n;
  }

  /** Primeira aba (na ordem dada) com novidade, ou null. */
  firstCategoryWithNew(order) {
    return order.find((category) => this.hasNew(category)) ?? null;
  }

  markSeen(category) {
    this.byCategory.delete(category);
  }
}
