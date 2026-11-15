// @ts-nocheck
import { WORLD_CONFIG } from '../config/constants.ts';

// Zona protegida pelo escudo de radiação ativo: meias esferas apoiadas no chão sobre a base.
// Escudos magnéticos ativos (conceito NASA NIAC: bobinas supercondutoras em volta do habitat)
// desviam partículas carregadas só na região do campo, perto das bobinas. Por isso a proteção
// do escudo vale apenas dentro das bolhas, e não no mapa inteiro.
// A base cresceu em alas separadas, então cada grupo de módulos tem a sua bobina (uma bolha).
// Uma bolha única grande o bastante para tudo engoliria a cratera de gelo (30, -22), que precisa
// ficar fora: minerar gelo durante a tempestade continua sendo um risco.
// Centros e raios saíram de um ajuste que cobre os cantos de cada módulo na altura do telhado,
// com um bloco de folga; shieldZone.test.js confere isso contra habitatLayout.js.
const GROUND_Y = WORLD_CONFIG.GROUND_LEVEL + 1;
const dome = (id, x, z, radius) => Object.freeze({ id, CENTER: Object.freeze({ x, y: GROUND_Y, z }), RADIUS: radius });

export const SHIELD_ZONE = Object.freeze({
  DOMES: Object.freeze([
    dome('habitat', 1, 1, 21), // habitat principal, cúpula, academia, airlock, depósito de gelo e antena
    dome('greenhouse', -27, 0, 16), // redoma da estufa
    dome('north-wing', -5, -27.5, 28), // corredor norte, os dois módulos e os painéis solares
    dome('crew-quarters', 21.5, -6, 12.5), // dormitório da tripulação (ala leste)
    dome('launch-pad', 24, 20, 10), // foguete de subida e fábrica de combustível
  ]),
});

// Abaixo do chão conta como dentro (a meia esfera fica apoiada no solo).
export function isInsideDome(pos, { CENTER, RADIUS }) {
  const dy = Math.max(0, pos.y - CENTER.y);
  return Math.hypot(pos.x - CENTER.x, dy, pos.z - CENTER.z) <= RADIUS;
}

export function isInsideShieldZone(pos) {
  return SHIELD_ZONE.DOMES.some((d) => isInsideDome(pos, d));
}
