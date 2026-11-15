// Efeito de maquina de escrever dos cards de radio (issue #135): quantas letras ja apareceram
// depois de `elapsed` segundos. A velocidade normal e `charsPerSecond`; texto comprido acelera
// para o card inteiro nunca passar de `maxSeconds`.
export function typedChars(elapsed: number, total: number, charsPerSecond: number, maxSeconds: number): number {
  if (total <= 0 || elapsed <= 0) return 0;
  const speed = Math.max(charsPerSecond, total / maxSeconds);
  return Math.min(total, Math.floor(elapsed * speed + 1e-9));
}
