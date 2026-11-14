// Trilhas de keyframes das animacoes (chegada e decolagem). Funcoes puras, sem Three.js.

export const EASE = {
  linear: (k) => k,
  in: (k) => k * k,
  out: (k) => 1 - (1 - k) * (1 - k),
  inOut: (k) => k * k * (3 - 2 * k),
};

// Acha o trecho [a, b] que contem `t` e devolve o progresso 0..1 ja com o easing de `b`.
// O easing de um keyframe vale para o trecho que CHEGA nele.
let _a = null;
let _b = null;
function segment(keys, t) {
  const last = keys.length - 1;
  if (t <= keys[0].t) {
    _a = _b = keys[0];
    return 0;
  }
  if (t >= keys[last].t) {
    _a = _b = keys[last];
    return 0;
  }
  let i = 0;
  while (i < last - 1 && t >= keys[i + 1].t) i++;
  _a = keys[i];
  _b = keys[i + 1];
  const k = (t - _a.t) / (_b.t - _a.t);
  return _b.ease ? _b.ease(k) : k;
}

// keys: [{ t, v: number[], ease? }] em ordem de tempo. Escreve o valor em `out` (sem alocar).
export function sampleKeys(keys, t, out) {
  const k = segment(keys, t);
  const a = _a.v;
  const b = _b.v;
  for (let i = 0; i < a.length; i++) out[i] = a[i] + (b[i] - a[i]) * k;
  return out;
}

// keys: [{ t, v: number, ease? }]
export function sampleScalar(keys, t) {
  const k = segment(keys, t);
  return _a.v + (_b.v - _a.v) * k;
}

// captions: [{ from, to, text, sub?, big?, side? }]. Devolve a legenda de `t` ou null.
export function activeCaption(captions, t) {
  for (const caption of captions) {
    if (t >= caption.from && t < caption.to) return caption;
  }
  return null;
}
