import { SCAN_CATEGORIES, SCAN_CATALOG, getCategoryLabel, getScanEntry, listCatalogSources } from '../data/scanCatalog.js';

const BAR_SEGMENTS = 20; // a barra enche em degraus, como as barras pixeladas do jogo
const CARD_DURATION_MS = 6000;
const DISCOVERY_DURATION_MS = 4200;
const SLIDE_OUT_MS = 300; // igual à animação scan-slide-out do CSS

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

function renderFacts(facts) {
  return `<ul class="scan-facts">${facts
    .map((f) => `<li><span class="scan-fact-label">${escapeHtml(f.label)}:</span> <span class="scan-fact-value">${escapeHtml(f.value)}</span></li>`)
    .join('')}</ul>`;
}

function renderSourceLine(entry) {
  const names = [...new Set(entry.facts.map((f) => f.source.name))];
  return `<p class="scan-source">Source: ${names.map(escapeHtml).join(' · ')} (reference data, not live)</p>`;
}

// HUD do scanner no estilo Minecraft do jogo: barra de progresso sob a mira, ficha como tooltip de
// item, toast de descoberta (como o de conquista) e diário como janela de inventário.
export class ScannerHud {
  constructor() {
    this.overlayEl = document.getElementById('zoom-overlay');
    this.barFillEl = document.getElementById('scan-bar-fill');
    this.statusEl = document.getElementById('scan-status');
    this.nameEl = document.getElementById('scan-name');
    this.cardEl = document.getElementById('scan-card');
    this.discoveryEl = document.getElementById('scan-discovery');
    this.journalOverlayEl = document.getElementById('journal-overlay');
    this.journalProgressEl = document.getElementById('journal-progress');
    this.journalRankEl = document.getElementById('journal-rank');
    this.journalBodyEl = document.getElementById('journal-body');
    this.isJournalOpen = false;

    this._last = { mode: null, status: null, name: null, fill: null };
    this.update({ targetId: null, progress: 0, done: false, known: false });
  }

  _setText(el, key, text) {
    if (this._last[key] === text) return;
    this._last[key] = text;
    el.textContent = text;
  }

  /** Chamado a cada frame com a luneta aberta. state vem do ScannerSystem.update. */
  update(state) {
    const alreadyKnown = Boolean(state.known);
    const entry = state.targetId ? getScanEntry(state.targetId) : null;
    const mode = !entry ? 'idle' : state.done ? 'locked' : 'scanning';
    if (this._last.mode !== mode) {
      this._last.mode = mode;
      this.overlayEl.classList.toggle('is-scanning', mode === 'scanning');
      this.overlayEl.classList.toggle('is-locked', mode === 'locked');
    }

    const steps = entry ? Math.floor(state.progress * BAR_SEGMENTS) : 0;
    const fill = `${(steps / BAR_SEGMENTS) * 100}%`;
    if (this._last.fill !== fill) {
      this._last.fill = fill;
      this.barFillEl.style.width = fill;
    }

    if (!entry) {
      this._setText(this.statusEl, 'status', 'Aim at something to scan it · scroll to zoom');
      this._setText(this.nameEl, 'name', '');
      return;
    }

    // O nome aparece letra a letra e termina um pouco antes da barra encher.
    const letters = state.done ? entry.title.length : Math.ceil(entry.title.length * Math.min(1, state.progress * 1.35));
    this._setText(this.nameEl, 'name', entry.title.slice(0, letters));

    if (state.done) {
      this._setText(this.statusEl, 'status', alreadyKnown ? 'Scan complete · in journal [J]' : 'Scan complete!');
    } else {
      const pct = Math.floor(state.progress * 100);
      this._setText(this.statusEl, 'status', `${alreadyKnown ? 'Re-scanning' : 'Scanning'} ${getCategoryLabel(entry.category).toLowerCase()}... ${pct}%`);
    }
  }

  showCard(entry, discovery) {
    const badge = discovery.isNew
      ? `<span class="scan-badge new">New! ${discovery.count}/${discovery.total}</span>`
      : '<span class="scan-badge">In journal</span>';
    this.cardEl.innerHTML = `
      <div class="scan-card-head">
        <h3 class="scan-title">${escapeHtml(entry.title)}</h3>
        ${badge}
      </div>
      <p class="scan-category">${escapeHtml(getCategoryLabel(entry.category))}</p>
      <p class="scan-summary">${escapeHtml(entry.summary)}</p>
      ${renderFacts(entry.facts)}
      <p class="scan-why">Why it matters: ${escapeHtml(entry.why)}</p>
      ${renderSourceLine(entry)}
    `;
    this._slideIn(this.cardEl, CARD_DURATION_MS);
  }

  // Entra pela direita e, depois de `duration`, desliza de volta para a direita e some.
  _slideIn(el, duration) {
    clearTimeout(el._showTimer);
    clearTimeout(el._hideTimer);
    el.classList.remove('hidden', 'is-leaving', 'is-entering');
    void el.offsetWidth; // reinicia a animação de entrada
    el.classList.add('is-entering');
    el._showTimer = setTimeout(() => {
      el.classList.remove('is-entering');
      el.classList.add('is-leaving');
      el._hideTimer = setTimeout(() => {
        el.classList.remove('is-leaving');
        el.classList.add('hidden');
      }, SLIDE_OUT_MS);
    }, duration);
  }

  showDiscovery(title, subtitle, lines = []) {
    this.discoveryEl.innerHTML = `
      <div class="scan-discovery-title">${escapeHtml(title)}</div>
      <div class="scan-discovery-name">${escapeHtml(subtitle)}</div>
      ${lines.map((l) => `<div class="scan-discovery-line">${escapeHtml(l)}</div>`).join('')}
    `;
    this._slideIn(this.discoveryEl, DISCOVERY_DURATION_MS);
  }

  openJournal(journal) {
    this.isJournalOpen = true;
    this.renderJournal(journal);
    this.journalOverlayEl.classList.remove('hidden');
  }

  closeJournal() {
    this.isJournalOpen = false;
    this.journalOverlayEl.classList.add('hidden');
  }

  renderJournal(journal) {
    this.journalProgressEl.textContent = `${journal.count}/${journal.total} discovered`;
    const rank = journal.isComplete() ? 'Rank: Junior Astronaut!' : 'Rank: Cadet (scan everything to become a Junior Astronaut)';
    this.journalRankEl.textContent = `${rank} · Scope: ${journal.scanDuration().toFixed(1)}s scan, ${journal.scanRange()} block range`;
    this.journalRankEl.classList.toggle('is-complete', journal.isComplete());

    const sections = SCAN_CATEGORIES.map((cat) => {
      const { found, total } = journal.categoryProgress(cat.id);
      const done = found === total;
      const items = SCAN_CATALOG.filter((e) => e.category === cat.id)
        .map((entry) => {
          if (!journal.has(entry.id)) {
            return '<article class="journal-entry locked"><h4>?</h4><p>Not scanned yet. Use the scope [Z].</p></article>';
          }
          return `
            <article class="journal-entry">
              <h4>${escapeHtml(entry.title)}</h4>
              <p>${escapeHtml(entry.summary)}</p>
              ${renderFacts(entry.facts)}
              <p class="scan-why">Why it matters: ${escapeHtml(entry.why)}</p>
            </article>`;
        })
        .join('');
      return `
        <section class="journal-section">
          <h3>${escapeHtml(cat.label)} <span class="${done ? 'journal-done' : ''}">${found}/${total}${done ? ' · scope upgraded!' : ''}</span></h3>
          <div class="journal-grid">${items}</div>
        </section>`;
    }).join('');

    const sources = listCatalogSources()
      .map((s) => (s.url
        ? `<li><a href="${escapeHtml(s.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(s.name)}</a></li>`
        : `<li>${escapeHtml(s.name)}</li>`))
      .join('');

    this.journalBodyEl.innerHTML = `${sections}
      <section class="journal-section">
        <h3>NASA data sources</h3>
        <div class="journal-sources">
          <p>All numbers are built-in reference values from these sources. Nothing here is live data.</p>
          <ul>${sources}</ul>
        </div>
      </section>`;
  }
}
