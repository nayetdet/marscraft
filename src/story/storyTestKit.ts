// Ajuda dos testes da historia: atravessa os passos guiados que faltam usando o `example` de
// cada passo (a mudanca no retrato que conclui o passo). Assim um ato novo nao obriga a reescrever
// os testes dos outros: basta cada passo declarar o seu `example`.

interface Walkable {
  act: number;
  step: { id: string; example?: unknown } | null;
  update: (snapshot: Record<string, unknown>) => void;
}

// `makeSnap(extra)`: monta o retrato do teste com os campos de `extra` por cima.
// Devolve o retrato acumulado (o que os passos mudaram), para o teste seguir dele.
export function playGuidedSteps(
  director: Walkable,
  makeSnap: (extra: Record<string, unknown>) => Record<string, unknown>,
  limit = 200,
): Record<string, unknown> {
  const state: Record<string, unknown> = {};
  for (let i = 0; i < limit && director.act === 1 && director.step; i++) {
    const step = director.step;
    if (step.example === undefined) throw new Error(`Step ${step.id} has no example`);
    const current = makeSnap(state);
    const patch = typeof step.example === 'function' ? step.example(current) : step.example;
    Object.assign(state, patch);
    director.update(makeSnap(state));
    if (director.step === step) throw new Error(`Step ${step.id} did not finish with its example`);
  }
  return state;
}
