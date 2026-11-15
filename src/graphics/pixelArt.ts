export type PixelPalette = Record<string, string>;

/**
 * Draws a character-indexed pixel art sprite onto a 2D canvas.
 * '.' and ' ' represent transparent pixels.
 */
export function drawPixelGrid(
  ctx: CanvasRenderingContext2D,
  rows: readonly string[],
  palette: PixelPalette,
): void {
  for (let y = 0; y < rows.length; y++) {
    const row = rows[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '.' || ch === ' ') continue;
      const color = palette[ch];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    }
  }
}

/**
 * Builds crisp `<rect>` SVG markup from a character-indexed pixel grid,
 * merging horizontal runs of matching color for compact output.
 */
export function pixelGridToSvgRects(
  rows: readonly string[],
  palette: PixelPalette,
): string {
  const rects: string[] = [];
  for (let y = 0; y < rows.length; y++) {
    const row = rows[y];
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      if (ch === '.' || ch === ' ' || !palette[ch]) {
        x++;
        continue;
      }
      let end = x + 1;
      while (end < row.length && row[end] === ch) end++;
      rects.push(`<rect fill="${palette[ch]}" x="${x}" y="${y}" width="${end - x}" height="1"/>`);
      x = end;
    }
  }
  return rects.join('');
}

/**
 * Converts a character-indexed pixel art grid into a crisp-edges SVG data URL.
 */
export function pixelGridToSvgDataUrl(
  rows: readonly string[],
  palette: PixelPalette,
): string {
  const h = rows.length;
  const w = rows[0]?.length ?? 16;
  const body = pixelGridToSvgRects(rows, palette);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges">${body}</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
