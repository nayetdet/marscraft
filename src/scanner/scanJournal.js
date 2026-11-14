import { SCAN_CATALOG, SCAN_CATEGORIES } from '../data/scanCatalog.js';

// Diário de descobertas do scanner: o que já foi escaneado, marcos por categoria e persistência.
// A morte não apaga o diário; só o localStorage do navegador guarda o progresso.

export const SCAN_JOURNAL_CONFIG = {
  STORAGE_KEY: 'minemars.scanJournal.v1',
  BASE_SCAN_DURATION: 1.5, // segundos mirando para completar um scan
  MIN_SCAN_DURATION: 0.8, // com todas as categorias completas
  BASE_SCAN_RANGE: 80, // blocos
  RANGE_PER_CATEGORY: 10,
};

function readStorage(storage, key) {
  try {
    const raw = storage?.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export class ScanJournal {
  constructor({ storage = null, catalog = SCAN_CATALOG, categories = SCAN_CATEGORIES } = {}) {
    this.storage = storage;
    this.catalog = catalog;
    this.categories = categories;
    this.validIds = new Set(catalog.map((e) => e.id));
    this.discovered = new Set(
      readStorage(storage, SCAN_JOURNAL_CONFIG.STORAGE_KEY).filter((id) => this.validIds.has(id))
    );
  }

  get total() {
    return this.catalog.length;
  }

  get count() {
    return this.discovered.size;
  }

  has(id) {
    return this.discovered.has(id);
  }

  categoryProgress(categoryId) {
    const entries = this.catalog.filter((e) => e.category === categoryId);
    const found = entries.filter((e) => this.discovered.has(e.id)).length;
    return { found, total: entries.length };
  }

  isCategoryComplete(categoryId) {
    const { found, total } = this.categoryProgress(categoryId);
    return total > 0 && found === total;
  }

  completedCategoryCount() {
    return this.categories.filter((c) => this.isCategoryComplete(c.id)).length;
  }

  isComplete() {
    return this.count === this.total;
  }

  // Cada categoria completa deixa o scan mais rápido; com todas, chega ao mínimo.
  scanDuration() {
    const { BASE_SCAN_DURATION, MIN_SCAN_DURATION } = SCAN_JOURNAL_CONFIG;
    const ratio = this.completedCategoryCount() / this.categories.length;
    return BASE_SCAN_DURATION - (BASE_SCAN_DURATION - MIN_SCAN_DURATION) * ratio;
  }

  scanRange() {
    return SCAN_JOURNAL_CONFIG.BASE_SCAN_RANGE + this.completedCategoryCount() * SCAN_JOURNAL_CONFIG.RANGE_PER_CATEGORY;
  }

  /**
   * Registra um scan. Só a primeira vez de cada alvo é descoberta nova.
   * @returns {{isNew: boolean, count: number, total: number, completedCategory: string|null, completedAll: boolean}}
   */
  record(id) {
    if (!this.validIds.has(id) || this.discovered.has(id)) {
      return { isNew: false, count: this.count, total: this.total, completedCategory: null, completedAll: false };
    }
    this.discovered.add(id);
    this._save();
    const entry = this.catalog.find((e) => e.id === id);
    return {
      isNew: true,
      count: this.count,
      total: this.total,
      completedCategory: this.isCategoryComplete(entry.category) ? entry.category : null,
      completedAll: this.isComplete(),
    };
  }

  _save() {
    try {
      this.storage?.setItem(SCAN_JOURNAL_CONFIG.STORAGE_KEY, JSON.stringify([...this.discovered]));
    } catch {
      // Sem storage (aba privada, cota cheia): o diário vale só nesta sessão.
    }
  }
}
