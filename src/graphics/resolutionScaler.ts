// Resolucao adaptativa: em maquina fraca (sem placa de video, celular, navegador sem aceleracao)
// quase todo o tempo do quadro vai em pintar pixels. Se o FPS medio fica baixo, o jogo desenha com
// menos pixels e o navegador amplia a imagem (pixelada, combina com o visual voxel). So desce,
// nunca sobe sozinha, para nao ficar oscilando; recarregar a pagina volta ao maximo.

export type ResolutionOptions = {
  /** Pixel ratio inicial (o do aparelho, ja limitado). */
  maxRatio: number;
  /** Degraus abaixo do maximo, do maior para o menor (ex.: [1, 0.75, 0.5]). */
  steps: readonly number[];
  minFps: number;
  seconds: number;
  warmupSeconds: number;
  /** Render por software (SwiftShader etc.): ja comeca no menor degrau. */
  software?: boolean;
};

const SOFTWARE_GPU = /swiftshader|llvmpipe|softpipe|software|basic render|microsoft basic/i;

/** O nome da GPU (WEBGL_debug_renderer_info) indica render pela CPU? */
export function isSoftwareRenderer(gpuName: string): boolean {
  return SOFTWARE_GPU.test(gpuName);
}

export class ResolutionScaler {
  /** Pixel ratios possiveis, do maior para o menor. */
  readonly levels: number[];
  private level: number;
  private warmup = 0;
  private time = 0;
  private frames = 0;
  private readonly minFps: number;
  private readonly seconds: number;
  private readonly warmupSeconds: number;

  constructor({ maxRatio, steps, minFps, seconds, warmupSeconds, software = false }: ResolutionOptions) {
    this.levels = [maxRatio, ...steps.filter((ratio) => ratio < maxRatio)];
    this.level = software ? this.levels.length - 1 : 0;
    this.minFps = minFps;
    this.seconds = seconds;
    this.warmupSeconds = warmupSeconds;
  }

  get ratio(): number {
    return this.levels[this.level];
  }

  /**
   * Um quadro com o jogo rodando. Devolve o novo pixel ratio quando ele deve baixar, senao null.
   * Quadros muito longos (aba em segundo plano, carregamento) nao contam.
   */
  sample(frameMs: number): number | null {
    if (!(frameMs > 0) || frameMs > 400 || this.level >= this.levels.length - 1) return null;
    const seconds = frameMs / 1000;
    if (this.warmup < this.warmupSeconds) {
      this.warmup += seconds;
      return null;
    }
    this.time += seconds;
    this.frames++;
    if (this.time < this.seconds) return null;
    const fps = this.frames / this.time;
    this.time = 0;
    this.frames = 0;
    if (fps >= this.minFps) return null;
    this.level++;
    // O quadro seguinte a troca de tamanho e lento; espera assentar antes de medir de novo
    this.warmup = 0;
    return this.ratio;
  }
}
