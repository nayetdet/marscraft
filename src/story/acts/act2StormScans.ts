import { ACT2_CONFIG } from '../../config/constants.ts';

// Trade-off do ato 2 (issue #419): descoberta que so existe na tempestade. A parede de poeira e
// o redemoinho sao fichas raras (2 pontos, categoria `landscape` em scanCatalog.ts) que a luneta
// so registra la fora e com o evento acontecendo:
//   - parede de poeira: o ceu, enquanto a tempestade de poeira dura (dustWeather.phase 'storm');
//   - redemoinho: uma caixa em volta dele, enquanto o evento `dustDevil` esta ativo.
// Aqui moram a regra (quando cada ficha existe), o aviso da chance e a linha do boletim final
// com as fichas que ficaram para tras. Logica pura: quem liga ao jogo e o Act2Controller.
//
// Nenhuma opcao e de graca: sair para escanear gasta o ar do traje e, na tempestade, a poeira
// gasta o traje STORM_SUIT_WEAR_MULTIPLIER vezes mais rapido; ficar dentro perde a ficha nesta
// partida. Quando e onde a ficha pode ser escaneada e regra de jogo.

export const STORM_WALL_ID = 'dust-storm-wall';
export const DUST_DEVIL_ID = 'dust-devil';
export const STORM_SCAN_IDS = [STORM_WALL_ID, DUST_DEVIL_ID] as const;
export type StormScanId = (typeof STORM_SCAN_IDS)[number];

// Nome de cada ficha na linha do boletim (o mesmo titulo do catalogo)
export const STORM_SCAN_NAMES: Record<StormScanId, string> = {
  [STORM_WALL_ID]: 'Dust Storm Wall',
  [DUST_DEVIL_ID]: 'Dust Devil',
};

// Aviso da chance: uma frase com a regra e uma com o custo
export const STORM_WALL_NOTICE =
  'Rare scan outside, only during the storm: scan the dusty sky. '
  + `Dust wears your suit ${ACT2_CONFIG.STORM_SUIT_WEAR_MULTIPLIER}x faster.`;
export const DUST_DEVIL_NOTICE =
  'Rare scan outside, only while it spins: scan the dust devil. Going out spends suit air.';

const NOTICES: Record<StormScanId, string> = { [STORM_WALL_ID]: STORM_WALL_NOTICE, [DUST_DEVIL_ID]: DUST_DEVIL_NOTICE };

// O que a luneta tem na mira (formato de resolveScanTarget, em scanTargeting.ts)
export interface ScanTarget {
  id: string;
  distance: number;
  hit: { x: number; y: number; z: number } | null;
}

interface ScanBox {
  scanId: string;
  minX: number; maxX: number;
  minY: number; maxY: number;
  minZ: number; maxZ: number;
}

// Longe de tudo: sem o redemoinho, a caixa fica onde nenhuma mira alcanca
const PARKED_Y = -1e6;

export class StormScans {
  // O evento esta acontecendo agora? (lido do jogo a cada frame por `sync`)
  stormActive = false;
  devilActive = false;
  outside = false;
  // Caixa de mira do redemoinho, reaproveitada (nada e alocado por frame)
  readonly devilBox: ScanBox = { scanId: DUST_DEVIL_ID, minX: 0, maxX: 0, minY: PARKED_Y, maxY: PARKED_Y, minZ: 0, maxZ: 0 };
  // A crianca teve a chance nesta partida (evento ativo e a luneta na mochila)
  private chances: Record<StormScanId, boolean> = { [STORM_WALL_ID]: false, [DUST_DEVIL_ID]: false };
  // O aviso ja saiu neste evento (volta a false quando o evento acaba)
  private noticed: Record<StormScanId, boolean> = { [STORM_WALL_ID]: false, [DUST_DEVIL_ID]: false };
  // Segundos desde que o evento comecou (o aviso espera STORM_SCAN_NOTICE_DELAY_SECONDS)
  private activeFor: Record<StormScanId, number> = { [STORM_WALL_ID]: 0, [DUST_DEVIL_ID]: 0 };
  private readonly wallTarget: ScanTarget = { id: STORM_WALL_ID, distance: Infinity, hit: null };

  // `devilPos`: onde o redemoinho esta, ou null sem o evento
  sync(stormActive: boolean, devilPos: { x: number; y: number; z: number } | null, outside: boolean): void {
    this.stormActive = stormActive;
    this.devilActive = devilPos !== null;
    this.outside = outside;
    const box = this.devilBox;
    if (!devilPos) {
      box.minY = box.maxY = PARKED_Y;
      return;
    }
    const half = ACT2_CONFIG.STORM_SCAN_DEVIL_HALF_WIDTH;
    box.minX = devilPos.x - half;
    box.maxX = devilPos.x + half;
    box.minY = devilPos.y;
    box.maxY = devilPos.y + ACT2_CONFIG.STORM_SCAN_DEVIL_HEIGHT;
    box.minZ = devilPos.z - half;
    box.maxZ = devilPos.z + half;
  }

  // A ficha pode ser escaneada agora? So la fora e com o evento acontecendo.
  available(id: string): boolean {
    if (!this.outside) return false;
    if (id === STORM_WALL_ID) return this.stormActive;
    if (id === DUST_DEVIL_ID) return this.devilActive;
    return false;
  }

  // Corrige o alvo da luneta: la fora, na tempestade, o ceu e a parede de poeira; e uma ficha
  // de tempestade fora da hora nao e alvo nenhum.
  retarget(target: ScanTarget | null): ScanTarget | null {
    if (!target) return null;
    if (target.id === 'atmosphere' && this.available(STORM_WALL_ID)) return this.wallTarget;
    if (isStormScan(target.id) && !this.available(target.id)) return null;
    return target;
  }

  // Aviso da chance, uma vez por evento, so para quem tem a luneta e ainda nao escaneou a ficha
  // nesta partida. Devolve o texto do aviso ou null. `scanned`: fichas ja escaneadas na partida.
  // `dt`: segundos do frame (o aviso espera um pouco depois de o evento comecar).
  notice(hasScope: boolean, scanned: { has(id: string): boolean } | null | undefined, dt: number = ACT2_CONFIG.STORM_SCAN_NOTICE_DELAY_SECONDS): string | null {
    // Um aviso por vez: se os dois eventos comecam juntos, o do redemoinho sai no frame seguinte
    return this.offer(STORM_WALL_ID, this.stormActive, hasScope, scanned, dt)
      ?? this.offer(DUST_DEVIL_ID, this.devilActive, hasScope, scanned, dt);
  }

  private offer(id: StormScanId, active: boolean, hasScope: boolean, scanned: { has(id: string): boolean } | null | undefined, dt: number): string | null {
    if (!active) {
      this.noticed[id] = false;
      this.activeFor[id] = 0;
      return null;
    }
    this.activeFor[id] += dt;
    if (this.activeFor[id] < ACT2_CONFIG.STORM_SCAN_NOTICE_DELAY_SECONDS) return null;
    if (!hasScope || this.noticed[id] || scanned?.has(id)) return null;
    this.noticed[id] = true;
    this.chances[id] = true;
    return NOTICES[id];
  }

  // Fichas que a crianca teve a chance de escanear e deixou passar nesta partida
  missed(scanned: { has(id: string): boolean } | null | undefined): StormScanId[] {
    return STORM_SCAN_IDS.filter((id) => this.chances[id] && !scanned?.has(id));
  }
}

export function isStormScan(id: string): id is StormScanId {
  return id === STORM_WALL_ID || id === DUST_DEVIL_ID;
}

export interface StormScansSummary {
  missed: StormScanId[];
  text: string;
}

export function stormScansMissedText(missed: readonly StormScanId[]): string {
  return `Science you let pass: ${missed.map((id) => STORM_SCAN_NAMES[id]).join(', ')} (storm-only scans)`;
}

// Linha do boletim final: "science you let pass". null quando nao houve chance ou a crianca
// pegou todas as fichas (e quando o boletim nao recebeu os dados).
export function stormScansSummary(stats: { stormScansMissed?: readonly string[] }): StormScansSummary | null {
  const missed = Array.isArray(stats?.stormScansMissed) ? STORM_SCAN_IDS.filter((id) => stats.stormScansMissed!.includes(id)) : [];
  if (missed.length === 0) return null;
  return { missed, text: stormScansMissedText(missed) };
}
