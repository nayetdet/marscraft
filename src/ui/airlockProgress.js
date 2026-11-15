// Barra do ciclo do airlock no centro da tela. Recebe `airlock.status()` e mostra a etapa atual
// em palavras simples: fechar a outra porta, tirar ou colocar ar, limpar a poeira do traje e,
// sem energia, abrir a porta na manivela.
const STEP_TEXT = {
  close: 'Closing the other door...',
  depressurize: 'Pumping the air out, so the door can open to Mars...',
  pressurize: 'Filling the airlock with air...',
};

export function airlockProgress(status) {
  if (!status) return null;
  const title = `AIRLOCK ${status.stepIndex + 1}/${status.stepCount}`;
  const fill = Math.max(0, Math.min(1, status.fill));
  if (status.step === 'clean') {
    if (!status.cleanNeeded) return { title, fill, tone: 'ok', text: 'Suit is clean. Opening...' };
    if (!status.cleanPossible) return { title, fill, tone: 'warn', text: 'No power to clean your suit! Mars dust will get inside.' };
    return { title, fill, tone: 'clean', text: 'Cleaning Mars dust off your suit (uses power)...' };
  }
  if (status.step === 'manual') return { title, fill, tone: 'warn', text: 'No power: cranking the door open by hand...' };
  return { title, fill, tone: 'ok', text: STEP_TEXT[status.step] };
}
