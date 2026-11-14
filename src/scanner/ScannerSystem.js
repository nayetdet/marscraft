import { getScanEntry } from '../data/scanCatalog.js';
import { BLOCK_IDS } from '../config/blockTypes.js';

// Progresso do "mirar e segurar": o alvo precisa ficar na mira até o anel encher.
// Trocar de alvo ou fechar a luneta zera o progresso. Depois de completar, o mesmo alvo não
// reescaneia até a mira sair dele.

export class ScannerSystem {
  constructor(journal) {
    this.journal = journal;
    this.reset();
  }

  reset() {
    this.targetId = null;
    this.progress = 0;
    this.completedTargetId = null;
    this.targetWasKnown = false;
  }

  /**
   * @param {number} dt
   * @param {string|null} targetId alvo resolvido neste frame (null = nada escaneável)
   * @returns {{targetId: string|null, progress: number, done: boolean, known: boolean, completed: object|null}}
   *   known: o alvo já estava no diário quando a mira chegou nele.
   *   completed vem preenchido só no frame em que o scan termina: {entry, discovery}
   */
  update(dt, targetId) {
    if (targetId !== this.targetId) {
      this.targetId = targetId;
      this.targetWasKnown = targetId ? this.journal.has(targetId) : false;
      // Previously discovered targets are identified immediately; only new science
      // requires holding the scope steady for a full scan.
      this.progress = this.targetWasKnown ? 1 : 0;
      this.completedTargetId = this.targetWasKnown ? targetId : null;
    }

    const known = this.targetWasKnown;
    if (!targetId) return { targetId: null, progress: 0, done: false, known, completed: null };

    if (this.completedTargetId === targetId) {
      return { targetId, progress: 1, done: true, known, completed: null };
    }

    this.progress = Math.min(1, this.progress + dt / this.journal.scanDuration());
    if (this.progress < 1) return { targetId, progress: this.progress, done: false, known, completed: null };

    this.completedTargetId = targetId;
    const entry = getScanEntry(targetId);
    const discovery = this.journal.record(targetId);
    return { targetId, progress: 1, done: true, known, completed: { entry, discovery } };
  }
}

/**
 * Aplica a recompensa da primeira descoberta. Devolve o que aconteceu para a UI mostrar.
 * @returns {{messages: string[], iceSensor: boolean, inventoryChanged: boolean}}
 */
export function applyDiscoveryReward(entry, survival) {
  const result = { messages: [], iceSensor: false, inventoryChanged: false };
  const reward = entry?.reward;
  if (!reward) return result;

  for (const { blockId, count } of reward.items ?? []) {
    let added = 0;
    for (let i = 0; i < count; i++) {
      const ok = blockId === BLOCK_IDS.HYDRO_PLANT ? survival.addHarvestedCrop() : survival.addBlockToInventory(blockId);
      if (ok) added++;
    }
    if (added > 0) {
      result.inventoryChanged = true;
      const name = blockId === BLOCK_IDS.HYDRO_PLANT ? 'Mars carrot' : 'Martian ice block';
      result.messages.push(`+${added} ${name}${added > 1 ? 's' : ''}`);
    }
  }

  if (reward.iceSensor) {
    result.iceSensor = true;
    result.messages.push('Ice sensor online: nearby ice deposits highlighted');
  }
  return result;
}
