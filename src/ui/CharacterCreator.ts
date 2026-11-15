import {
  DEFAULT_PLAYER_APPEARANCE,
  PLAYER_GENDERS,
  PLAYER_HAIR_COLORS,
  PLAYER_HAIR_LENGTHS,
  PLAYER_HAIR_TYPES,
  PLAYER_SKIN_TONES,
  buildPlayerCadetProfile,
  normalizePlayerAppearance,
  type PlayerAppearance,
  type PlayerGender,
  type PlayerHairLength,
  type PlayerHairType,
} from '../crew/playerAppearance.ts';
import { InventorySuitPreview } from './InventorySuitPreview.ts';

export interface CharacterCreatorOptions {
  initialAppearance?: PlayerAppearance;
  onChange?: (appearance: PlayerAppearance) => void;
  onUiClick?: () => void;
  createPreview?: (canvas: HTMLCanvasElement, container: HTMLElement | null) => {
    start(): void;
    stop(): void;
    setState(state: { equipped: boolean; upgraded?: boolean; dustPct?: number; integrityTone?: string }): void;
    setAppearance(profile: ReturnType<typeof buildPlayerCadetProfile>): void;
  };
}

function genderTemplateSvg(gender: PlayerGender): string {
  const lashes = gender === 'woman'
    ? '<rect x="5" y="10" width="1" height="2" fill="#1e293b"/><rect x="18" y="10" width="1" height="2" fill="#1e293b"/>'
    : '';
  const brows = gender === 'woman'
    ? '<rect x="5" y="7" width="4" height="1" fill="#2d1e17"/><rect x="6" y="6" width="2" height="1" fill="#2d1e17"/><rect x="15" y="7" width="4" height="1" fill="#2d1e17"/><rect x="16" y="6" width="2" height="1" fill="#2d1e17"/>'
    : '<rect x="5" y="7" width="5" height="2" fill="#2d1e17"/><rect x="14" y="7" width="5" height="2" fill="#2d1e17"/>';
  const hairTop = gender === 'woman'
    ? '<path d="M3 2h18v4H3zM2 5h3v11H2zM19 5h3v11h-3z" fill="var(--tpl-hair, #462f24)"/>'
    : '<path d="M3 2h18v4H3zM3 6h2v3H3zM19 6h2v3h-2z" fill="var(--tpl-hair, #462f24)"/>';

  return `<svg class="char-tpl-svg" viewBox="0 0 24 24" aria-hidden="true">
    <rect x="4" y="4" width="16" height="16" fill="var(--tpl-skin, #f2c2a2)"/>
    ${hairTop}
    ${brows}
    <rect x="6" y="9" width="3" height="4" fill="#1c2541"/>
    <rect x="15" y="9" width="3" height="4" fill="#1c2541"/>
    ${lashes}
    <rect x="9" y="16" width="6" height="2" fill="#9c4f3d"/>
  </svg>`;
}

function hairTypeTemplateSvg(type: PlayerHairType): string {
  if (type === 'straight') {
    return `<svg class="char-tpl-svg" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="3" width="14" height="4" fill="var(--tpl-hair, #462f24)"/>
      <rect x="5" y="7" width="3" height="14" fill="var(--tpl-hair, #462f24)"/>
      <rect x="10.5" y="7" width="3" height="14" fill="var(--tpl-hair, #462f24)"/>
      <rect x="16" y="7" width="3" height="14" fill="var(--tpl-hair, #462f24)"/>
      <rect x="8" y="4" width="8" height="2" fill="var(--tpl-hair-hi, #6b4c3b)"/>
    </svg>`;
  }
  if (type === 'wavy') {
    return `<svg class="char-tpl-svg" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 3h14v4H5zM4 7h4v4h3v4H7v4H4v-4h2v-4H4zm12 0h4v4h-2v4h2v4h-3v-4h-3v-4h3zM10 8h4v3h-2v4h3v4h-4v-4h2v-4h-3z" fill="var(--tpl-hair, #462f24)"/>
      <rect x="6" y="4" width="9" height="2" fill="var(--tpl-hair-hi, #6b4c3b)"/>
    </svg>`;
  }
  if (type === 'curly') {
    return `<svg class="char-tpl-svg" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="6" y="2" width="12" height="5" fill="var(--tpl-hair, #462f24)"/>
      <rect x="3" y="5" width="6" height="6" fill="var(--tpl-hair, #462f24)"/>
      <rect x="15" y="5" width="6" height="6" fill="var(--tpl-hair, #462f24)"/>
      <rect x="1" y="10" width="6" height="6" fill="var(--tpl-hair, #462f24)"/>
      <rect x="17" y="10" width="6" height="6" fill="var(--tpl-hair, #462f24)"/>
      <rect x="4" y="15" width="6" height="6" fill="var(--tpl-hair, #462f24)"/>
      <rect x="14" y="15" width="6" height="6" fill="var(--tpl-hair, #462f24)"/>
      <rect x="8" y="6" width="8" height="5" fill="var(--tpl-hair-hi, #6b4c3b)"/>
    </svg>`;
  }
  return `<svg class="char-tpl-svg" viewBox="0 0 24 24" aria-hidden="true">
    <rect x="5" y="1" width="14" height="4" fill="var(--tpl-hair, #462f24)"/>
    <rect x="2" y="4" width="20" height="10" fill="var(--tpl-hair, #462f24)"/>
    <rect x="1" y="7" width="22" height="6" fill="var(--tpl-hair, #462f24)"/>
    <rect x="3" y="14" width="18" height="4" fill="var(--tpl-hair, #462f24)"/>
    <rect x="7" y="3" width="3" height="2" fill="var(--tpl-hair-hi, #6b4c3b)"/>
    <rect x="14" y="6" width="3" height="2" fill="var(--tpl-hair-hi, #6b4c3b)"/>
    <rect x="5" y="10" width="3" height="2" fill="var(--tpl-hair-hi, #6b4c3b)"/>
  </svg>`;
}

function hairLengthTemplateSvg(length: PlayerHairLength): string {
  const hairBack = length === 'short'
    ? '<rect x="6" y="2" width="12" height="5" fill="var(--tpl-hair, #462f24)"/>'
    : length === 'medium'
      ? '<rect x="5" y="2" width="14" height="14" fill="var(--tpl-hair, #462f24)"/>'
      : '<rect x="4" y="2" width="16" height="20" fill="var(--tpl-hair, #462f24)"/>';

  return `<svg class="char-tpl-svg" viewBox="0 0 24 24" aria-hidden="true">
    <rect x="5" y="16" width="14" height="6" fill="#1e3a5f"/>
    <rect x="5" y="18" width="14" height="2" fill="#ea580c"/>
    ${hairBack}
    <rect x="7" y="5" width="10" height="10" fill="var(--tpl-skin, #f2c2a2)"/>
    <rect x="7" y="3" width="10" height="3" fill="var(--tpl-hair, #462f24)"/>
  </svg>`;
}

/**
 * Interactive astronaut character customization screen shown when clicking Play from the start menu.
 */
export class CharacterCreator {
  private appearance: PlayerAppearance;
  private previewSuitEquipped = false;
  private onConfirm: ((appearance: PlayerAppearance) => void) | null = null;
  private onChange?: (appearance: PlayerAppearance) => void;
  private onUiClick?: () => void;

  private menuMain: HTMLElement | null;
  private screen: HTMLElement | null;
  private optionsRoot: HTMLElement | null;
  private backBtn: HTMLElement | null;
  private startBtn: HTMLElement | null;
  private suitIvaBtn: HTMLElement | null;
  private suitEvaBtn: HTMLElement | null;
  private preview: ReturnType<NonNullable<CharacterCreatorOptions['createPreview']>> | null = null;

  constructor(options: CharacterCreatorOptions = {}) {
    this.appearance = normalizePlayerAppearance(options.initialAppearance ?? DEFAULT_PLAYER_APPEARANCE);
    this.onChange = options.onChange;
    this.onUiClick = options.onUiClick;

    this.menuMain = typeof document !== 'undefined' ? document.getElementById('menu-main') : null;
    this.screen = typeof document !== 'undefined' ? document.getElementById('character-screen') : null;
    this.optionsRoot = typeof document !== 'undefined' ? document.getElementById('character-options') : null;
    this.backBtn = typeof document !== 'undefined' ? document.getElementById('character-back-btn') : null;
    this.startBtn = typeof document !== 'undefined' ? document.getElementById('character-start-btn') : null;
    this.suitIvaBtn = typeof document !== 'undefined' ? document.getElementById('char-suit-iva') : null;
    this.suitEvaBtn = typeof document !== 'undefined' ? document.getElementById('char-suit-eva') : null;

    const canvas = typeof document !== 'undefined'
      ? (document.getElementById('character-preview-canvas') as HTMLCanvasElement | null)
      : null;
    if (canvas) {
      this.preview = options.createPreview
        ? options.createPreview(canvas, canvas.parentElement)
        : new InventorySuitPreview(canvas, canvas.parentElement, buildPlayerCadetProfile(this.appearance));
    }

    this._renderOptions();
    this._bindEvents();
    this._syncSelectionUi();
  }

  getAppearance(): PlayerAppearance {
    return { ...this.appearance };
  }

  setAppearance(next: Partial<PlayerAppearance>): void {
    this.appearance = normalizePlayerAppearance({ ...this.appearance, ...next });
    this._syncSelectionUi();
    this.preview?.setAppearance(buildPlayerCadetProfile(this.appearance));
    this.onChange?.(this.getAppearance());
  }

  isOpen(): boolean {
    return Boolean(this.screen && !this.screen.classList.contains('hidden'));
  }

  open(initialAppearance?: PlayerAppearance, onConfirm?: (appearance: PlayerAppearance) => void): void {
    if (initialAppearance) {
      this.appearance = normalizePlayerAppearance(initialAppearance);
    }
    this.onConfirm = onConfirm ?? null;
    this._syncSelectionUi();
    this.preview?.setAppearance(buildPlayerCadetProfile(this.appearance));
    this.preview?.setState({ equipped: this.previewSuitEquipped });

    if (this.menuMain && this.screen) {
      this.menuMain.classList.add('hidden');
      this.screen.classList.remove('hidden');
      this.menuMain.closest('.mc-menu')?.classList.add('is-character');
      this.menuMain.closest('.mc-overlay')?.classList.add('menu-info-open');
    }
    this.preview?.start();
  }

  close(): void {
    this.preview?.stop();
    if (this.screen && this.menuMain) {
      this.screen.classList.add('hidden');
      this.menuMain.classList.remove('hidden');
      this.menuMain.closest('.mc-menu')?.classList.remove('is-character');
      this.menuMain.closest('.mc-overlay')?.classList.remove('menu-info-open');
    }
  }

  private _renderOptions(): void {
    if (!this.optionsRoot) return;

    const genderHtml = PLAYER_GENDERS.map((g) => `
      <button type="button" class="char-opt-btn char-tpl-btn" data-char-field="gender" data-char-val="${g.id}" aria-pressed="false">
        ${genderTemplateSvg(g.id)}
        <span class="char-opt-label">${g.label}</span>
      </button>
    `).join('');

    const skinHtml = PLAYER_SKIN_TONES.map((s) => `
      <button type="button" class="char-opt-btn char-swatch-btn" data-char-field="skinTone" data-char-val="${s.id}" aria-label="${s.label}" title="${s.label}" aria-pressed="false">
        <span class="char-swatch" style="background:${s.skin}"></span>
      </button>
    `).join('');

    const hairTypeHtml = PLAYER_HAIR_TYPES.map((t) => `
      <button type="button" class="char-opt-btn char-tpl-btn" data-char-field="hairType" data-char-val="${t.id}" aria-pressed="false">
        ${hairTypeTemplateSvg(t.id)}
        <span class="char-opt-label">${t.label}</span>
      </button>
    `).join('');

    const hairLengthHtml = PLAYER_HAIR_LENGTHS.map((l) => `
      <button type="button" class="char-opt-btn char-tpl-btn" data-char-field="hairLength" data-char-val="${l.id}" aria-pressed="false">
        ${hairLengthTemplateSvg(l.id)}
        <span class="char-opt-label">${l.label}</span>
      </button>
    `).join('');

    const hairColorHtml = PLAYER_HAIR_COLORS.map((c) => `
      <button type="button" class="char-opt-btn char-swatch-btn" data-char-field="hairColor" data-char-val="${c.id}" aria-label="${c.label}" title="${c.label}" aria-pressed="false">
        <span class="char-swatch" style="background:${c.hair}"></span>
      </button>
    `).join('');

    this.optionsRoot.innerHTML = `
      <div class="char-group">
        <span class="char-group-title">Sex</span>
        <div class="char-group-row cols-2">${genderHtml}</div>
      </div>
      <div class="char-group">
        <span class="char-group-title">Skin Color</span>
        <div class="char-group-row swatches">${skinHtml}</div>
      </div>
      <div class="char-group">
        <span class="char-group-title">Hair Type</span>
        <div class="char-group-row cols-4">${hairTypeHtml}</div>
      </div>
      <div class="char-group">
        <span class="char-group-title">Hair Length</span>
        <div class="char-group-row cols-3">${hairLengthHtml}</div>
      </div>
      <div class="char-group">
        <span class="char-group-title">Hair Color</span>
        <div class="char-group-row swatches">${hairColorHtml}</div>
      </div>
    `;
  }

  private _bindEvents(): void {
    this.optionsRoot?.addEventListener('click', (event) => {
      const btn = (event.target as Element | null)?.closest?.('[data-char-field]') as HTMLElement | null;
      if (!btn) return;
      const field = btn.dataset.charField as keyof PlayerAppearance | undefined;
      const val = btn.dataset.charVal;
      if (!field || !val) return;
      this.onUiClick?.();
      this.setAppearance({ [field]: val } as Partial<PlayerAppearance>);
    });

    const setSuitPreview = (equipped: boolean) => {
      this.previewSuitEquipped = equipped;
      this.onUiClick?.();
      this.preview?.setState({ equipped });
      this.suitIvaBtn?.classList.toggle('is-selected', !equipped);
      this.suitEvaBtn?.classList.toggle('is-selected', equipped);
      this.suitIvaBtn?.setAttribute('aria-pressed', String(!equipped));
      this.suitEvaBtn?.setAttribute('aria-pressed', String(equipped));
    };

    this.suitIvaBtn?.addEventListener('click', () => setSuitPreview(false));
    this.suitEvaBtn?.addEventListener('click', () => setSuitPreview(true));

    this.backBtn?.addEventListener('click', () => {
      this.onUiClick?.();
      this.close();
    });

    this.startBtn?.addEventListener('click', () => {
      this.onUiClick?.();
      const chosen = this.getAppearance();
      const confirm = this.onConfirm;
      this.close();
      confirm?.(chosen);
    });
  }

  private _syncSelectionUi(): void {
    const profile = buildPlayerCadetProfile(this.appearance);
    if (this.optionsRoot) {
      this.optionsRoot.style.setProperty('--tpl-skin', profile.skin);
      this.optionsRoot.style.setProperty('--tpl-hair', profile.hair);
      this.optionsRoot.style.setProperty('--tpl-hair-hi', profile.hairHi);
      this.optionsRoot.querySelectorAll<HTMLElement>('[data-char-field]').forEach((btn) => {
        const field = btn.dataset.charField as keyof PlayerAppearance;
        const selected = this.appearance[field] === btn.dataset.charVal;
        btn.classList.toggle('is-selected', selected);
        btn.setAttribute('aria-pressed', String(selected));
      });
    }
    this.suitIvaBtn?.classList.toggle('is-selected', !this.previewSuitEquipped);
    this.suitEvaBtn?.classList.toggle('is-selected', this.previewSuitEquipped);
    this.suitIvaBtn?.setAttribute('aria-pressed', String(!this.previewSuitEquipped));
    this.suitEvaBtn?.setAttribute('aria-pressed', String(this.previewSuitEquipped));
  }
}
