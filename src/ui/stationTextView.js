// Texto das estacoes -> blocos de tela (teste com jogadores de 15/11/2026: os paineis eram um
// paredao de texto do mesmo tamanho e da mesma cor). As estacoes continuam escrevendo texto puro
// (facil de testar); aqui ele vira: numeros em destaque, listas, explicacao em letra menor e o
// "Real case" numa caixa propria. Funcoes puras.

const STAT = /^([A-Z0-9][A-Z0-9 &'/.()-]{1,34}):\s+(\S.*)$/;
const HEADING = /^([A-Z0-9][A-Z0-9 &'/.()-]{2,40}):$/;
const FACT = /^(Real case|Real model|Real data|Real study|NASA fact)\b/i;

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
const escapeHtml = (text) => text.replace(/[&<>"]/g, (c) => ESCAPES[c]);

// Uma linha "BATTERY: 85%   OXYGEN: 20/20" traz dois numeros: separa por 3 ou mais espacos
function statsIn(line) {
  const parts = line.split(/\s{3,}/).map((part) => part.trim()).filter(Boolean);
  const first = parts[0]?.match(STAT);
  if (!first) return null;
  const stats = [{ label: first[1], value: first[2] }];
  for (const part of parts.slice(1)) {
    const match = part.match(STAT);
    // O que nao e "NOME: valor" e um aviso colado ao numero anterior (ex.: "(FROZEN)")
    if (match) stats.push({ label: match[1], value: match[2] });
    else stats[stats.length - 1].value += ` ${part}`;
  }
  return stats;
}

// text -> [{ type: 'stats', stats } | { type: 'heading', text } | { type: 'list', items }
//          | { type: 'fact', text } | { type: 'text', text }]
export function stationTextBlocks(text) {
  const blocks = [];
  const last = () => blocks[blocks.length - 1];
  for (const raw of String(text ?? '').split('\n')) {
    const line = raw.trimEnd();
    if (!line.trim()) continue;
    if (/^\s{2,}\S/.test(line)) {
      if (last()?.type === 'list') last().items.push(line.trim());
      else blocks.push({ type: 'list', items: [line.trim()] });
      continue;
    }
    const trimmed = line.trim();
    if (FACT.test(trimmed)) {
      blocks.push({ type: 'fact', text: trimmed });
      continue;
    }
    const heading = trimmed.match(HEADING);
    if (heading) {
      blocks.push({ type: 'heading', text: heading[1] });
      continue;
    }
    const stats = statsIn(trimmed);
    if (stats) {
      if (last()?.type === 'stats') last().stats.push(...stats);
      else blocks.push({ type: 'stats', stats });
      continue;
    }
    blocks.push({ type: 'text', text: trimmed });
  }
  return blocks;
}

export function stationTextHtml(text) {
  return stationTextBlocks(text).map((block) => {
    if (block.type === 'stats') {
      return `<dl class="st-stats">${block.stats.map((s) => `<div><dt>${escapeHtml(s.label)}</dt><dd>${escapeHtml(s.value)}</dd></div>`).join('')}</dl>`;
    }
    if (block.type === 'heading') return `<h3 class="st-head">${escapeHtml(block.text)}</h3>`;
    if (block.type === 'list') return `<ul class="st-list">${block.items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
    if (block.type === 'fact') return `<p class="st-fact">${escapeHtml(block.text)}</p>`;
    return `<p class="st-text">${escapeHtml(block.text)}</p>`;
  }).join('');
}
