import * as THREE from 'three';
import { modelKey } from './baseDisplayText.js';

// Texturas em canvas das placas, posteres e telas da base (arte gerada em codigo, sem logos).
const FONT = '"Courier New", Courier, monospace';
const INK = '#0d1420';

function createCanvas(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function toTexture(canvas, { mipmaps = true } = {}) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = mipmaps;
  texture.minFilter = mipmaps ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter;
  texture.anisotropy = 4;
  return texture;
}

function setFont(ctx, size, bold = true) {
  ctx.font = `${bold ? 'bold ' : ''}${size}px ${FONT}`;
}

// Maior fonte (ate `max`) em que `text` cabe em `width`
function fitFont(ctx, text, width, max, min = 10) {
  let size = max;
  setFont(ctx, size);
  while (size > min && ctx.measureText(text).width > width) {
    size -= 1;
    setFont(ctx, size);
  }
  return size;
}

export function wrapText(ctx, text, maxWidth) {
  const lines = [];
  let line = '';
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// Placa de modulo: faixa colorida com o codigo (CMD-1) e o nome em branco
export function signTexture({ code, name, color }, aspect) {
  const W = 512;
  const H = Math.round(W / aspect);
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = color;
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, W - 6, H - 6);

  ctx.textBaseline = 'middle';
  setFont(ctx, Math.round(H * 0.5));
  const codeW = ctx.measureText(code).width + H * 0.5;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, codeW, H);
  ctx.fillStyle = INK;
  ctx.fillText(code, H * 0.25, H / 2 + 2);

  const room = W - codeW - H * 0.5;
  fitFont(ctx, name, room, Math.round(H * 0.5));
  ctx.fillStyle = '#ffffff';
  ctx.fillText(name, codeW + H * 0.25, H / 2 + 2);
  return toTexture(canvas);
}

// Etiqueta pequena de equipamento (texto claro em fundo escuro)
export function labelTexture(text, aspect, color = '#e6ebf5') {
  const W = 256;
  const H = Math.round(W / aspect);
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, W, H);
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  fitFont(ctx, text, W - 16, Math.round(H * 0.62));
  ctx.fillStyle = color;
  ctx.fillText(text, W / 2, H / 2 + 1);
  return toTexture(canvas);
}

// Poster educativo: titulo, frases curtas e um quadro "REAL DATA" com a fonte
export function posterTexture(poster, aspect) {
  const W = 512;
  const H = Math.round(W / aspect);
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  const margin = 26;

  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = poster.color;
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, W - 8, H - 8);

  const headerH = Math.round(H * 0.135);
  ctx.fillStyle = poster.color;
  ctx.fillRect(4, 4, W - 8, headerH);
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  fitFont(ctx, poster.title, W - margin * 2, Math.round(headerH * 0.52));
  ctx.fillStyle = INK;
  ctx.fillText(poster.title, W / 2, 4 + headerH / 2 + 2);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  // Quadro de dado real, ancorado embaixo
  const factSize = 20;
  setFont(ctx, factSize);
  const factLines = wrapText(ctx, poster.fact, W - margin * 2 - 24);
  const factH = factLines.length * (factSize + 5) + 40;
  const footerH = 30;
  const factTop = H - footerH - factH - 10;
  ctx.fillStyle = '#1b2540';
  ctx.fillRect(margin, factTop, W - margin * 2, factH);
  ctx.fillStyle = '#ffd166';
  ctx.fillRect(margin, factTop, 6, factH);
  setFont(ctx, 15);
  ctx.fillText('REAL DATA', margin + 16, factTop + 9);
  setFont(ctx, factSize);
  ctx.fillStyle = '#fff3c4';
  factLines.forEach((line, i) => ctx.fillText(line, margin + 16, factTop + 30 + i * (factSize + 5)));

  setFont(ctx, 14, false);
  ctx.fillStyle = '#8f9bb8';
  const source = `Source: ${poster.source}`;
  fitFont(ctx, source, W - margin * 2, 15, 9);
  ctx.fillText(source, margin, H - footerH + 4);

  // Frases: a maior fonte que couber entre o titulo e o quadro
  const bodyTop = 4 + headerH + 16;
  const bodyRoom = factTop - bodyTop - 8;
  const textX = margin + 22;
  const textW = W - textX - margin;
  let size = 26;
  let wrapped = [];
  for (; size >= 14; size -= 1) {
    setFont(ctx, size);
    wrapped = poster.lines.map((line) => wrapText(ctx, line, textW));
    const total = wrapped.reduce((sum, lines) => sum + lines.length * (size + 5) + size * 0.5, 0);
    if (total <= bodyRoom) break;
  }
  let y = bodyTop;
  for (const lines of wrapped) {
    ctx.fillStyle = poster.color;
    ctx.fillRect(margin, y + size * 0.3, 10, 10);
    ctx.fillStyle = '#e6ebf5';
    for (const line of lines) {
      ctx.fillText(line, textX, y);
      y += size + 5;
    }
    y += size * 0.5;
  }
  return toTexture(canvas);
}

function drawHazard(ctx, x, y, w, h, stripe = 18) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.fillStyle = '#f2b632';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#1b1b1b';
  for (let i = -h; i < w + h; i += stripe * 2) {
    ctx.beginPath();
    ctx.moveTo(x + i, y + h);
    ctx.lineTo(x + i + stripe, y + h);
    ctx.lineTo(x + i + stripe + h, y);
    ctx.lineTo(x + i + h, y);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

// Faixa amarela e preta de aviso (soleira do airlock)
export function hazardTexture(aspect) {
  const H = 48;
  const W = Math.round(H * aspect);
  const canvas = createCanvas(W, H);
  drawHazard(canvas.getContext('2d'), 0, 0, W, H, 16);
  return toTexture(canvas);
}

// Marca do abrigo no piso: moldura de aviso e o nome da zona (fundo transparente)
export function shelterFloorTexture(aspect) {
  const W = 512;
  const H = Math.round(W / aspect);
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  const edge = 26;
  drawHazard(ctx, 0, 0, W, H, 18);
  ctx.clearRect(edge, edge, W - edge * 2, H - edge * 2);
  ctx.fillStyle = 'rgba(244, 114, 182, 0.2)';
  ctx.fillRect(edge, edge, W - edge * 2, H - edge * 2);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  const text = (label, y, max) => {
    fitFont(ctx, label, W - edge * 2 - 30, max);
    ctx.lineWidth = 8;
    ctx.strokeStyle = INK;
    ctx.strokeText(label, W / 2, y);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(label, W / 2, y);
  };
  text('STORM SHELTER', H * 0.4, 58);
  text('STAND HERE IN A SOLAR STORM', H * 0.64, 26);
  return toTexture(canvas);
}

const SCREEN_THEMES = {
  ok: { bg: '#04201f', accent: '#2bd4c0', text: '#d8fff9', dim: '#7fbdb5' },
  warn: { bg: '#241a04', accent: '#facc15', text: '#fff4c2', dim: '#c9b56a' },
  alert: { bg: '#2a0508', accent: '#ff4d6d', text: '#ffd0da', dim: '#d08a97' },
};
const TONE_COLORS = { warn: '#facc15', alert: '#ff6b81', water: '#60a5fa' };

// Tela viva: so redesenha (e so reenvia a textura para a GPU) quando o conteudo muda
export class ScreenCanvas {
  constructor(width, height) {
    this.canvas = createCanvas(width, height);
    this.ctx = this.canvas.getContext('2d');
    this.texture = toTexture(this.canvas, { mipmaps: false });
    this._key = '';
  }

  draw(model) {
    const key = modelKey(model);
    if (key === this._key) return false;
    this._key = key;

    const { ctx } = this;
    const W = this.canvas.width;
    const H = this.canvas.height;
    const theme = SCREEN_THEMES[model.mode] ?? SCREEN_THEMES.ok;
    const pad = Math.round(H * 0.06);

    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, W - 6, H - 6);

    const titleH = Math.round(H * 0.15);
    ctx.fillStyle = theme.accent;
    ctx.fillRect(3, 3, W - 6, titleH);
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    setFont(ctx, Math.round(titleH * 0.72));
    ctx.fillStyle = theme.bg;
    ctx.fillText(model.title, pad, 3 + titleH / 2 + 1);

    const footerSize = Math.max(11, Math.round(H * 0.052));
    setFont(ctx, footerSize, false);
    const footerLines = wrapText(ctx, model.footer, W - pad * 2).slice(0, 2);
    const footerH = footerLines.length * (footerSize + 3) + 6;
    ctx.fillStyle = theme.dim;
    footerLines.forEach((line, i) => {
      ctx.fillText(line, pad, H - footerH - 4 + footerSize / 2 + i * (footerSize + 3));
    });

    const top = 3 + titleH + 6;
    const rowH = (H - footerH - 8 - top) / model.rows.length;
    const size = Math.round(Math.min(rowH * 0.74, H * 0.13));
    model.rows.forEach((row, i) => {
      const mid = top + rowH * i + rowH * 0.42;
      setFont(ctx, size);
      ctx.textAlign = 'left';
      ctx.fillStyle = theme.dim;
      ctx.fillText(row.label, pad, mid);
      const labelW = ctx.measureText(row.label).width;

      const color = TONE_COLORS[row.tone] ?? theme.text;
      fitFont(ctx, row.value, W - pad * 3 - labelW, size, 9);
      ctx.textAlign = 'right';
      ctx.fillStyle = color;
      ctx.fillText(row.value, W - pad, mid);

      if (row.bar !== undefined) {
        const barH = Math.max(3, Math.round(rowH * 0.1));
        const barY = top + rowH * (i + 1) - barH - 2;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.fillRect(pad, barY, W - pad * 2, barH);
        ctx.fillStyle = color;
        ctx.fillRect(pad, barY, (W - pad * 2) * Math.max(0, Math.min(1, row.bar)), barH);
      }
    });

    this.texture.needsUpdate = true;
    return true;
  }
}
