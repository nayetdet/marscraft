// Abrir e fechar os paineis (estacoes e diario) com uma animacao curta, em vez de aparecerem seco (issue #139).
// A entrada e so CSS (.station-overlay:not(.hidden)); a saida precisa esperar a animacao antes do `hidden`.

export const MODAL_CLOSE_MS = 120; // igual a animacao modal-out em modal.css

export function showModal(el) {
  if (!el) return;
  clearTimeout(el._modalCloseTimer);
  el.classList.remove('hidden', 'is-closing');
}

export function hideModal(el) {
  if (!el || el.classList.contains('hidden')) return;
  clearTimeout(el._modalCloseTimer);
  el.classList.add('is-closing');
  el._modalCloseTimer = setTimeout(() => {
    el.classList.remove('is-closing');
    el.classList.add('hidden');
  }, MODAL_CLOSE_MS);
}
