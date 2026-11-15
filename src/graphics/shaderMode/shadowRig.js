// Contas da sombra do Sol, sem depender do Three.js (aceitam qualquer objeto {x, y, z}).

// Direcao de onde vem a luz que faz sombra. De dia e a do Sol; com o Sol abaixo do horizonte ela
// vem espelhada de cima (luar fraco). A altura minima evita sombras infinitas no por do sol, e a
// passagem pelo horizonte e continua (a direcao do Sol e a espelhada coincidem em y = 0).
export function shadowLightDirection(sunDir, minElevation, out) {
  const y = Math.max(Math.abs(sunDir.y), minElevation);
  const len = Math.hypot(sunDir.x, y, sunDir.z) || 1;
  out.x = sunDir.x / len;
  out.y = y / len;
  out.z = sunDir.z / len;
  return out;
}

// Prende o centro da area de sombra a grade de texels do mapa (no plano perpendicular a luz).
// Sem isso, cada passo da camera desloca o mapa uma fracao de texel e a borda da sombra treme.
// Usa a mesma base da camera de sombra do Three.js (lookAt com "up" = +y).
export function snapShadowCenter(center, lightDir, texelSize, out) {
  // right = up × lightDir, com up = (0, 1, 0)
  let rx = lightDir.z;
  let rz = -lightDir.x;
  const rLen = Math.hypot(rx, rz);
  if (rLen < 1e-6) {
    out.x = center.x;
    out.y = center.y;
    out.z = center.z;
    return out;
  }
  rx /= rLen;
  rz /= rLen;
  // up2 = lightDir × right
  const ux = lightDir.y * rz;
  const uy = lightDir.z * rx - lightDir.x * rz;
  const uz = -lightDir.y * rx;

  const alongRight = center.x * rx + center.z * rz;
  const alongUp = center.x * ux + center.y * uy + center.z * uz;
  const dRight = Math.round(alongRight / texelSize) * texelSize - alongRight;
  const dUp = Math.round(alongUp / texelSize) * texelSize - alongUp;

  out.x = center.x + rx * dRight + ux * dUp;
  out.y = center.y + uy * dUp;
  out.z = center.z + rz * dRight + uz * dUp;
  return out;
}
