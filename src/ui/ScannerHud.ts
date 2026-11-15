// @ts-nocheck
import { SCAN_CATEGORIES, SCAN_CATALOG, getCategoryLabel, getScanEntry, listCatalogSources } from '../data/scanCatalog.ts';
import { getJournalIcon } from '../graphics/journalIcons.ts';
import { missionLogHtml, realVsGameHtml, studiesHtml } from './missionJournalView.ts';
import { UnseenFinds, journalRank } from './journalProgress.ts';
import { hideModal, showModal } from './modalTransition.ts';

const BAR_SEGMENTS = 20; // a barra enche em degraus, como as barras pixeladas do jogo
const CARD_DURATION_MS = 6000;
const DISCOVERY_DURATION_MS = 4200;
const SLIDE_OUT_MS = 300; // igual à animação scan-slide-out do CSS

const JOURNAL_ICONS = {
  star: '<svg class="gh-mini-icon power" viewBox="0 0 8 8" shape-rendering="crispEdges"><path fill="currentColor" d="M3 0h2v2h3v2H6v2h1v2H5V7H3v1H1V6h1V4H0V2h3Z"/></svg>',
  scope: '<svg class="gh-mini-icon water" viewBox="0 0 8 8" shape-rendering="crispEdges"><path fill="currentColor" d="M1 2h6v4H1Z M0 3h1v2H0Z M7 1h1v6H7Z M3 6h2v2H3Z"/></svg>',
};

// Abas do diario (issue #106): descobertas do scanner, diario de bordo, estudos reais e real x jogo
const JOURNAL_MODES = [
  { id: 'discoveries', label: 'FINDS' },
  { id: 'log', label: 'LOG' },
  { id: 'studies', label: 'NASA STUDIES' },
  { id: 'real', label: 'REAL VS GAME' },
];

const TAB_LABELS = {
  sky: 'PLANETS',
  terrain: 'ROCKS',
  base: 'BASE',
  landscape: 'MARS',
};

// Concise, 7-year-old-friendly card titles, key NASA facts, and 1-line takeaway
const KID_CARD_META = {
  sun: {
    title: 'THE SUN',
    stat: '43% SUN',
    pills: ['228M km away', '43% Earth sun (590 W/m²)', '12.7 min light'],
    tip: 'Our star! Less sun on Mars means solar panels make less power.',
  },
  earth: {
    title: 'EARTH',
    stat: '3-22m RADIO',
    pills: ['55-401M km away', '3-22 min radio delay', 'Blue ocean planet'],
    tip: 'Home! Radio messages take up to 22 minutes to arrive.',
  },
  moon: {
    title: 'THE MOON',
    stat: '0.17g PULL',
    pills: ['384,400 km from Earth', '0.17g gravity', '9.2 µGy/h radiation'],
    tip: "Earth's Moon! Artemis astronauts train there before Mars.",
  },
  phobos: {
    title: 'PHOBOS',
    stat: '22 KM WIDE',
    pills: ['22 km wide', '3 orbits a day', 'Draws 1.8m closer/100y'],
    tip: "Mars' bigger potato moon! Circles Mars 3 times a day.",
  },
  deimos: {
    title: 'DEIMOS',
    stat: '12 KM WIDE',
    pills: ['12 km wide', '30h orbit', '23,460 km from Mars'],
    tip: "Mars' smaller far moon! Looks like a bright star from Mars.",
  },
  regolith: {
    title: 'REGOLITH',
    stat: 'RUST DUST',
    pills: ['Iron oxide (rust)', 'Fine as talcum powder', 'Global dust storms'],
    tip: 'Red rusty dust! Covers solar panels and lowers your power.',
  },
  sandstone: {
    title: 'SANDSTONE',
    stat: 'OLD WATER',
    pills: ['Pressed sand & mud', 'Ancient water layers', 'Gale Crater rock'],
    tip: 'Layered rock that proves water once flowed on Mars!',
  },
  'crater-rock': {
    title: 'BASALT',
    stat: 'LAVA ROCK',
    pills: ['Cooled volcanic lava', 'Olympus Mons: 3x Everest', 'Radiation shield'],
    tip: 'Dark volcanic rock! Thick rock walls block space radiation.',
  },
  'water-ice': {
    title: 'WATER ICE',
    stat: '-62 °C ICE',
    pills: ['Poles & underground', 'Air avg: -62 °C', 'Water, O2 & fuel'],
    tip: 'Frozen water under the ground! Melts into drinking water.',
  },
  'meteor-ice': {
    title: 'METEOR ICE',
    stat: 'FRESH IMPACT',
    pills: ['Exposed by impact', 'Shallow water ice', 'Water, O2 & fuel'],
    tip: 'A meteor impact uncovered fresh water ice beneath the surface.',
  },
  base: {
    title: 'OUTPOST',
    stat: '-98 TO -4°C',
    pills: ['0.7% Earth air', '-98 to -4 °C outside', '6.9 µGy/h radiation'],
    tip: 'Your Mars home gives the crew air, water and power.',
  },
  habitat: {
    title: 'HABITAT',
    stat: '0.84 KG O2',
    pills: ['0.84 kg O2/day', '2.5-3.5 kg water/day', 'Pressurized home'],
    tip: 'Warm home with breathable air so you can take off your suit.',
  },
  airlock: {
    title: 'AIRLOCK',
    stat: '2 DOORS',
    pills: ['2 sealed doors', '0.7% air outside', 'Keeps base air in'],
    tip: 'Two-door room so the air inside the base never escapes!',
  },
  tunnel: {
    title: 'TUNNEL',
    stat: 'SEALED WAY',
    pills: ['Pressurized hallway', 'Links base & dome', 'No suit needed'],
    tip: 'Sealed walkway connecting the habitat to the greenhouse.',
  },
  greenhouse: {
    title: 'GREENHOUSE',
    stat: '1.8 KG FOOD',
    pills: ['1.8 kg food/day', 'ISS Veggie lettuce', '43% Earth sunlight'],
    tip: 'Uses water and power to grow fresh food on Mars!',
  },
  cupola: {
    title: 'CUPOLA',
    stat: '7 WINDOWS',
    pills: ['7 sky windows', 'Like ISS Cupola', 'Storm lookout'],
    tip: 'Top window dome to scan planets and spot dust storms.',
  },
  'solar-panels': {
    title: 'SOLAR PANEL',
    stat: '590 W/m²',
    pills: ['590 W/m² sunlight', '0% power at night', 'Dust blocks light'],
    tip: 'Turns sunlight into power! Needs batteries at night.',
  },
  antenna: {
    title: 'ANTENNA',
    stat: '3-22m DELAY',
    pills: ['3-22 min one-way', 'Orbiter relay link', 'Sends science home'],
    tip: 'Dish that sends your Mars discoveries back to Earth!',
  },
  'ice-depot': {
    title: 'ICE PLANT',
    stat: '1 KG = 1 L',
    pills: ['1 kg ice = 1 L water', '2.5-3.5 kg/day need', 'ISRU Mars tech'],
    tip: 'Melts ice from the rover into clean drinking water!',
  },
  rover: {
    title: 'MARS ROVER',
    stat: '899 KG CAR',
    pills: ['899 kg robot car', '0.14 km/h top speed', 'Drills Mars ice'],
    tip: 'Robot car that drives outside and drills water ice for you.',
  },
  lander: {
    title: 'ROCKET MAV',
    stat: '5.0 KM/S',
    pills: ['5.0 km/s escape speed', '0.38g Mars gravity', 'Takes crew home'],
    tip: 'Rocket that launches your crew back to orbit to go home!',
  },
  'mav-panel': {
    title: 'MAV SCREEN',
    stat: '3 CHECKS',
    pills: ['Ice-made fuel', '3 storm checks', 'Science sent'],
    tip: 'Checks fuel, storms, and science before rocket launch.',
  },
  gym: {
    title: 'MARS GYM',
    stat: '0.38g FIT',
    pills: ['0.38g low gravity', 'Treadmill & bike', 'Protects bones'],
    tip: 'Daily exercise keeps your muscles and bones strong in 0.38g!',
  },
  'crater-rim': {
    title: 'CRATER RIM',
    stat: '154 KM WIDE',
    pills: ['Gale Crater: 154 km', 'Mount Sharp: 5 km tall', 'Ancient rock layers'],
    tip: 'High crater walls around your base that block some wind.',
  },
  atmosphere: {
    title: 'MARS SKY',
    stat: '95% CO2',
    pills: ['95% CO2 gas', '0.7% Earth pressure', 'Blue Mars sunsets'],
    tip: 'Thin CO2 air with blue sunsets! Always wear a spacesuit outside.',
  },
};

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
    this.activeCategory = 'sky';
    this.selectedEntryId = null;
    this._lastJournal = null;
    this.journalMode = 'discoveries';
    this.missionLog = null; // MissionLog e StudyReveals (attachMissionLog)
    this.studyReveals = null;
    this.unseen = new UnseenFinds(); // selos NEW! nas abas (issue #139)
    this._seenWhileOpen = new Set();
    this._shownRank = null;

    this.journalOverlayEl?.addEventListener('click', (event) => {
      const modeBtn = event.target.closest('[data-journal-mode]');
      if (modeBtn && this._lastJournal) {
        this.journalMode = modeBtn.dataset.journalMode;
        this.renderJournal(this._lastJournal);
      }
    });

    if (this.journalBodyEl) {
      this.journalBodyEl.addEventListener('click', (event) => {
        const tabBtn = event.target.closest('[data-journal-cat]');
        if (tabBtn && this._lastJournal) {
          this.activeCategory = tabBtn.dataset.journalCat;
          this.selectedEntryId = null;
          this.renderJournal(this._lastJournal);
          return;
        }
        const cardEl = event.target.closest('[data-journal-entry]');
        if (cardEl && this._lastJournal) {
          this.selectedEntryId = cardEl.dataset.journalEntry;
          this.renderJournal(this._lastJournal);
        }
      });
    }

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
      this._setText(this.statusEl, 'status', 'Aim at an object · hold left click to scan');
      this._setText(this.nameEl, 'name', '');
      return;
    }

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
    if (discovery.isNew) this.unseen.add(entry.id, entry.category);
    const badge = discovery.isNew
      ? `<span class="scan-badge new">NEW ${discovery.count}/${discovery.total}</span>`
      : '<span class="scan-badge">FOUND</span>';
    const message = KID_CARD_META[entry.id]?.tip ?? entry.summary;
    this.cardEl.innerHTML = `
      <div class="scan-card-head">
        <h3 class="scan-title">${escapeHtml(entry.title)}</h3>
        ${badge}
      </div>
      <p class="scan-summary">${escapeHtml(message)}</p>
      <p class="scan-more">More in your journal</p>
    `;
    this._slideIn(this.cardEl, CARD_DURATION_MS);
  }

  _slideIn(el, duration) {
    clearTimeout(el._showTimer);
    clearTimeout(el._hideTimer);
    el.classList.remove('hidden', 'is-leaving', 'is-entering');
    void el.offsetWidth;
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

  attachMissionLog({ log, reveals }) {
    this.missionLog = log;
    this.studyReveals = reveals;
  }

  showDiscovery(title, subtitle, lines = [], duration = DISCOVERY_DURATION_MS) {
    this.discoveryEl.innerHTML = `
      <div class="scan-discovery-title">${escapeHtml(title)}</div>
      <div class="scan-discovery-name">${escapeHtml(subtitle)}</div>
      ${lines.map((l) => `<div class="scan-discovery-line">${escapeHtml(l)}</div>`).join('')}
    `;
    this._slideIn(this.discoveryEl, duration);
  }

  openJournal(journal) {
    this.isJournalOpen = true;
    // Abre direto na aba com descoberta nova, se a aba atual nao tiver nenhuma
    if (!this.unseen.hasNew(this.activeCategory)) {
      const withNew = this.unseen.firstCategoryWithNew(SCAN_CATEGORIES.map((c) => c.id));
      if (withNew) {
        this.journalMode = 'discoveries';
        this.activeCategory = withNew;
        this.selectedEntryId = null;
      }
    }
    this._seenWhileOpen.clear();
    this.renderJournal(journal);
    showModal(this.journalOverlayEl);
  }

  closeJournal() {
    this.isJournalOpen = false;
    // As abas que a crianca abriu deixam de ser novidade; as outras continuam com NEW!
    this._seenWhileOpen.forEach((category) => this.unseen.markSeen(category));
    this._seenWhileOpen.clear();
    hideModal(this.journalOverlayEl);
  }

  // Barra de patente CADET -> SPECIALIST -> COMMANDER, que enche com as descobertas (issue #139)
  _renderRank(journal) {
    const rank = journalRank(journal.count, journal.total);
    const ticks = rank.thresholds.slice(1)
      .map((t) => `<i class="journal-rank-tick" style="left:${(t / journal.total) * 100}%"></i>`)
      .join('');
    const hint = rank.next ? `${rank.toNext} more finds to ${rank.next}` : rank.complete ? 'Every find in the journal!' : `${rank.toNext} finds left`;
    this.journalRankEl.innerHTML = `${JOURNAL_ICONS.star} <span class="journal-rank-label">${rank.label}</span>`
      + `<span class="journal-rank-bar" aria-hidden="true"><span class="journal-rank-fill" style="width:${rank.fill * 100}%"></span>${ticks}</span>`;
    this.journalRankEl.parentElement?.setAttribute('title', `Astronaut rank: ${rank.label}. ${hint}`);
    this.journalRankEl.classList.toggle('is-complete', rank.complete);
    // Subiu de patente desde a ultima vez que o diario foi desenhado: brilho rapido
    if (this._shownRank !== null && rank.index > this._shownRank) {
      const pill = this.journalRankEl.parentElement;
      pill?.classList.remove('is-rank-up');
      void pill?.offsetWidth;
      pill?.classList.add('is-rank-up');
    }
    this._shownRank = rank.index;
  }

  renderJournal(journal) {
    this._lastJournal = journal;
    this.journalProgressEl.innerHTML = `${JOURNAL_ICONS.scope} ${journal.count}/${journal.total}`;
    this._renderRank(journal);

    const topBarEl = this.journalOverlayEl?.querySelector('.journal-top-bar');
    if (topBarEl && !topBarEl.querySelector('.gym-learn')) {
      const sourcesHtml = listCatalogSources()
        .map((s) => (s.url ? `<a href="${escapeHtml(s.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(s.name)}</a>` : escapeHtml(s.name)))
        .join(' · ');
      const infoEl = document.createElement('details');
      infoEl.className = 'gym-learn';
      infoEl.innerHTML = `<summary aria-label="NASA info" title="NASA info">i</summary><p>Real NASA data (saved in game).<br/>${sourcesHtml}</p>`;
      topBarEl.appendChild(infoEl);
    }
    this._renderModes(topBarEl);
    this.journalBodyEl.classList.toggle('is-scroll', this.journalMode !== 'discoveries');
    if (this.journalMode !== 'discoveries') {
      this._renderExtraMode();
      return;
    }

    const tabsHtml = SCAN_CATEGORIES.map((cat) => {
      const { found, total } = journal.categoryProgress(cat.id);
      const isActive = cat.id === this.activeCategory;
      const isDone = found === total;
      const label = TAB_LABELS[cat.id] ?? cat.label.toUpperCase();
      const hasNew = this.unseen.hasNew(cat.id);
      const newBadge = hasNew && !isActive ? '<b class="journal-new-badge">NEW!</b>' : '';
      return `<button type="button" class="gym-tab journal-tab ${isActive ? 'active' : ''} ${isDone ? 'done' : ''} ${hasNew ? 'has-new' : ''}" data-journal-cat="${escapeHtml(cat.id)}" aria-pressed="${isActive}"${hasNew ? ' aria-label="' + escapeHtml(label) + ', new find"' : ''}>
        <span>${escapeHtml(label)}</span>
        <small>${found}/${total}</small>
        ${newBadge}
      </button>`;
    }).join('');

    if (this.isJournalOpen) this._seenWhileOpen.add(this.activeCategory);
    const entries = SCAN_CATALOG.filter((entry) => entry.category === this.activeCategory);
    const activeEntry = entries.find((e) => e.id === this.selectedEntryId) ?? entries[0] ?? null;

    const cardsHtml = entries.map((entry) => {
      const discovered = journal.has(entry.id);
      const isSelected = activeEntry?.id === entry.id;
      const meta = KID_CARD_META[entry.id] ?? {
        title: entry.title.toUpperCase(),
        stat: entry.facts[0]?.value ?? '',
      };

      const isNew = this.unseen.isNew(entry.id);
      return `
        <article class="gh-card journal-card ${discovered ? 'ready' : 'locked'} ${isSelected ? 'selected' : ''} ${isNew ? 'is-new' : ''}" data-journal-entry="${escapeHtml(entry.id)}">
          ${isNew ? '<b class="journal-new-badge">NEW!</b>' : ''}
          <img class="gh-crop-art journal-art ${escapeHtml(entry.category)}" src="${getJournalIcon(entry.id)}" alt="${escapeHtml(entry.title)}" />
          <h3>${escapeHtml(meta.title)}</h3>
          <span class="gh-food-gain">${JOURNAL_ICONS.star} ${escapeHtml(meta.stat)}</span>
        </article>`;
    }).join('');

    const activeMeta = activeEntry ? KID_CARD_META[activeEntry.id] : null;
    const pills = activeMeta?.pills ?? (activeEntry ? activeEntry.facts.map((f) => `${f.label}: ${f.value}`) : []);
    const pillsHtml = pills.map((p) => `<span class="journal-pill">${escapeHtml(p)}</span>`).join('');
    const tipText = activeMeta?.tip ?? activeEntry?.summary ?? '';

    this.journalBodyEl.innerHTML = `
      <div class="gym-tabs journal-tabs" role="group" aria-label="Journal categories">${tabsHtml}</div>
      <div class="gh-cards journal-cards">${cardsHtml}</div>
      <div class="journal-fact-bar" role="status">
        <div class="journal-pills-row">${pillsHtml}</div>
        <div class="journal-tip-line"><strong>${escapeHtml(activeMeta?.title ?? '')}:</strong> ${escapeHtml(tipText)}</div>
      </div>
    `;
  }

  // Abas do topo do diario (issue #106). Os contadores de descobertas so aparecem em FINDS.
  _renderModes(topBarEl) {
    if (!topBarEl) return;
    let modesEl = topBarEl.querySelector('.journal-modes');
    if (!modesEl) {
      modesEl = document.createElement('div');
      modesEl.className = 'journal-modes';
      modesEl.setAttribute('role', 'tablist');
      modesEl.setAttribute('aria-label', 'Journal pages');
      topBarEl.prepend(modesEl);
    }
    const studies = this.studyReveals ? ` ${this.studyReveals.count}/${this.studyReveals.total}` : '';
    modesEl.innerHTML = JOURNAL_MODES.map((mode) => {
      const active = mode.id === this.journalMode;
      const count = mode.id === 'studies' ? `<small>${studies}</small>` : '';
      return `<button type="button" role="tab" class="gym-tab journal-mode ${active ? 'active' : ''}" data-journal-mode="${mode.id}" aria-selected="${active}">${mode.label}${count}</button>`;
    }).join('');
  }

  _renderExtraMode() {
    let html = '';
    if (this.journalMode === 'log') html = this.missionLog ? missionLogHtml(this.missionLog) : '';
    else if (this.journalMode === 'studies') html = this.studyReveals ? studiesHtml(this.studyReveals) : '';
    else if (this.journalMode === 'real') html = realVsGameHtml();
    this.journalBodyEl.innerHTML = `<div class="journal-page journal-page-${escapeHtml(this.journalMode)}">${html}</div>`;
    this.journalBodyEl.scrollTop = 0;
  }
}
