import { STORY_CONFIG } from '../config/constants.ts';
import { TradeoffLedger, sceneForTrigger } from '../story/tradeoffScenes.ts';
import type { TradeoffScene, TradeoffTarget } from '../story/tradeoffScenes.ts';
import { pixelSpriteSvg } from './pixelSprites.ts';
import './styles/tradeoff.css';

// Modal de trade-off (src/story/tradeoffScenes.ts): aparece no meio da tela na hora da tarefa
// ou do evento, pausa o jogo e mostra uma cena animada. O recurso fica a esquerda e manda
// pontinhos para as pontas; nas cenas "pick" as pontas acendem uma de cada vez (so da para
// pagar uma). Fecha com Enter, com o botao OK ou com um clique (o mouse fica travado no jogo).
// Cada cena aparece uma vez por partida: as vistas ficam guardadas no navegador.

export const TRADEOFF_SEEN_KEY = 'marscraft-tradeoffs-seen-v1';
const CLOSE_GUARD_MS = 700; // quem estava segurando o clique (minerando) nao fecha sem ver
const CLOSE_KEYS = new Set(['Enter', 'NumpadEnter', 'Space']);
const TONE_SIGN: Record<TradeoffTarget['tone'], string> = { pick: '', gain: '+', cost: '-' };

function el(tag: string, className: string, text = ''): HTMLElement {
  const node = document.createElement(tag);
  node.className = className;
  if (text) node.textContent = text;
  return node;
}

function artEl(name: string, className: string): HTMLElement {
  const art = el('span', className);
  art.setAttribute('aria-hidden', 'true');
  art.innerHTML = pixelSpriteSvg(name);
  return art;
}

function loadSeen(): string[] {
  try {
    const saved = JSON.parse(window.localStorage.getItem(TRADEOFF_SEEN_KEY) || '[]');
    return Array.isArray(saved) ? saved.filter((id) => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export class TradeoffHud {
  private root: HTMLElement;
  private sceneEl: HTMLElement;
  private okBtn: HTMLButtonElement;
  private ledger = new TradeoffLedger(loadSeen());
  private openedAt = 0;
  private onClose: (() => void) | null = null;
  private autoCloseTimer = 0;
  private closeCallbacks = new Map<string, () => void>();

  constructor() {
    this.root = document.getElementById('tradeoff-modal') as HTMLElement;
    this.sceneEl = this.root.querySelector('.to-body') as HTMLElement;
    this.okBtn = this.root.querySelector('.to-ok') as HTMLButtonElement;
    // Na captura: com o modal aberto, tecla e clique nao chegam ao jogo nem aos outros cards
    document.addEventListener('keydown', (e) => this.onKey(e), true);
    document.addEventListener('mousedown', (e) => this.onPointer(e), true);
    this.okBtn.addEventListener('click', () => this.close());
  }

  get isOpen(): boolean {
    return !this.root.classList.contains('hidden');
  }

  // Pede a cena do gatilho (ver tradeoffScenes.ts). Cena ja vista nao volta. `onClose` roda
  // quando a crianca fecha a cena; se a cena nao entrar, roda na hora.
  request(trigger: string, onClose: (() => void) | null = null): void {
    const scene = sceneForTrigger(trigger);
    if (!scene || !this.ledger.request(trigger)) {
      onClose?.();
      return;
    }
    if (onClose) this.closeCallbacks.set(scene.id, onClose);
  }

  // Abre a proxima cena da fila. O GameEngine chama so com o jogo rodando e o mouse no jogo.
  pump(): void {
    if (this.isOpen || !this.ledger.hasPending) return;
    const scene = this.ledger.next();
    if (!scene) return;
    try { window.localStorage.setItem(TRADEOFF_SEEN_KEY, JSON.stringify(this.ledger.seenIds)); } catch { /* sem armazenamento: so nao lembra */ }
    this.onClose = this.closeCallbacks.get(scene.id) ?? null;
    this.closeCallbacks.delete(scene.id);
    this.render(scene);
    this.root.classList.remove('hidden');
    this.openedAt = performance.now();
    // Cena de emergencia nao segura ninguem: sem resposta, fecha sozinha e o jogo volta
    if (scene.urgent) this.autoCloseTimer = window.setTimeout(() => this.close(), STORY_CONFIG.URGENT_TRADEOFF_SECONDS * 1000);
  }

  close(): void {
    window.clearTimeout(this.autoCloseTimer);
    if (!this.isOpen) return;
    this.root.classList.add('hidden');
    const done = this.onClose;
    this.onClose = null;
    done?.();
  }

  private get canClose(): boolean {
    return performance.now() - this.openedAt >= CLOSE_GUARD_MS;
  }

  private onKey(e: KeyboardEvent): void {
    if (!this.isOpen || e.code === 'Escape' || !CLOSE_KEYS.has(e.code)) return; // Esc abre o menu de pausa
    e.preventDefault();
    e.stopImmediatePropagation();
    if (!e.repeat && this.canClose) this.close();
  }

  // Com o mouse travado no jogo nao ha cursor para mirar no OK: qualquer clique fecha
  private onPointer(e: MouseEvent): void {
    if (!this.isOpen || !document.pointerLockElement) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if (this.canClose) this.close();
  }

  private render(scene: TradeoffScene): void {
    const rows = el('div', 'to-rows');
    scene.targets.forEach((target, i) => {
      const row = el('div', `to-row is-${target.tone}`);
      row.style.setProperty('--i', String(i));
      row.style.setProperty('--n', String(scene.targets.length));
      const track = el('span', 'to-track');
      track.append(el('i', ''));
      const sign = TONE_SIGN[target.tone];
      row.append(track, artEl(target.art, 'to-art'), el('b', '', sign ? `${sign} ${target.label}` : target.label));
      rows.append(row);
    });
    const stage = el('div', 'to-stage');
    stage.append(artEl(scene.source, 'to-source'), rows);

    const text = el('div', 'to-text');
    const word = el('h2', 'to-word', scene.word);
    word.classList.toggle('is-long', scene.word.length > 8);
    text.append(word, el('p', 'to-line', scene.line));

    this.root.style.setProperty('--to-accent', scene.accent);
    this.root.setAttribute('aria-label', `${scene.word}: ${scene.line}`);
    this.sceneEl.replaceChildren(stage, text);
    this.root.classList.remove('is-in');
    void this.root.offsetWidth; // reinicia a animacao de entrada
    this.root.classList.add('is-in');
  }
}
