// Save do mundo: so os blocos que o jogador mudou, nao o mundo inteiro. O mundo tem
// 224 x 48 x 224 = ~2,4 milhoes de blocos; salvar tudo em JSON a cada 5 s travava o jogo por
// ~100 ms (e ~5 MB no localStorage, perto do limite). O terreno e a base saem iguais do gerador a
// cada carga, entao basta guardar as mudancas.
//
// Formato: lista plana [indice, bloco, indice, bloco, ...], indice = posicao em VoxelWorld.data.

/** Lista plana [indice, bloco, ...] com o valor atual de cada bloco que mudou. */
export function encodeWorldEdits(data: Uint8Array, edited: Iterable<number>): number[] {
  const out: number[] = [];
  for (const idx of edited) out.push(idx, data[idx]);
  return out;
}

/**
 * Aplica no mundo recem-gerado as mudancas salvas e marca cada uma em `edited`, para continuarem
 * no proximo save. Aceita o formato novo (`worldEdits`) e o antigo (`world` = o mundo inteiro).
 * Devolve quantos blocos mudaram.
 */
export function restoreWorldEdits(
  data: Uint8Array,
  saved: { worldEdits?: unknown; world?: unknown } | null | undefined,
  edited: Set<number>,
): number {
  if (!saved) return 0;
  let changed = 0;
  const edits = saved.worldEdits;
  if (Array.isArray(edits)) {
    for (let i = 0; i + 1 < edits.length; i += 2) {
      const idx = edits[i];
      const id = edits[i + 1];
      if (!Number.isInteger(idx) || idx < 0 || idx >= data.length) continue;
      if (!Number.isInteger(id) || id < 0 || id > 255) continue;
      data[idx] = id;
      edited.add(idx);
      changed++;
    }
    return changed;
  }
  // Save antigo: o mundo inteiro. Guarda so a diferenca para o gerado, como o formato novo.
  const world = saved.world;
  if (Array.isArray(world) && world.length === data.length) {
    for (let idx = 0; idx < data.length; idx++) {
      const id = world[idx];
      if (id === data[idx] || !Number.isInteger(id) || id < 0 || id > 255) continue;
      data[idx] = id;
      edited.add(idx);
      changed++;
    }
  }
  return changed;
}
