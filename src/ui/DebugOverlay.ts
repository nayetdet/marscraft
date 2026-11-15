// @ts-nocheck
// F3 diagnostics: WebGL GPU, FPS, frame time, and render cost.
// Refreshes twice per second to keep the overlay lightweight.
const REFRESH_MS = 500;

export class DebugOverlay {
  constructor(renderer) {
    this.renderer = renderer;
    this.gpuName = DebugOverlay.detectGpu(renderer);

    this.el = document.createElement('div');
    this.el.style.cssText =
      'position:fixed;top:8px;right:8px;z-index:50;padding:6px 8px;' +
      'background:rgba(0,0,0,0.6);color:#fff;font:12px/1.4 monospace;' +
      'white-space:pre;pointer-events:none;display:none;';
    document.body.appendChild(this.el);

    this.visible = new URLSearchParams(window.location.search).has('debug');
    this.el.style.display = this.visible ? 'block' : 'none';

    this._frames = 0;
    this._sumMs = 0;
    this._maxMs = 0;
    this._windowStart = performance.now();

    window.addEventListener('keydown', (e) => {
      if (e.code === 'F3') {
        e.preventDefault();
        this.visible = !this.visible;
        this.el.style.display = this.visible ? 'block' : 'none';
      }
    });
  }

  static detectGpu(renderer) {
    const gl = renderer.getContext();
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const name = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
    return String(name);
  }

  // Chamado depois de renderer.render(), com o intervalo real entre frames
  frame(frameMs) {
    if (!this.visible) return;
    this._frames++;
    this._sumMs += frameMs;
    if (frameMs > this._maxMs) this._maxMs = frameMs;

    const now = performance.now();
    if (now - this._windowStart < REFRESH_MS) return;

    const { calls, triangles } = this.renderer.info.render;
    const avgMs = this._sumMs / this._frames;
    const fps = (this._frames * 1000) / (now - this._windowStart);
    this.el.textContent =
      `FPS: ${fps.toFixed(0)}\n` +
      `Frame: ${avgMs.toFixed(1)} ms (worst ${this._maxMs.toFixed(1)} ms)\n` +
      `Draw calls: ${calls}  Triangles: ${triangles}\n` +
      `Pixel ratio: ${this.renderer.getPixelRatio()}\n` +
      `GPU: ${this.gpuName}`;

    this._frames = 0;
    this._sumMs = 0;
    this._maxMs = 0;
    this._windowStart = now;
  }
}
