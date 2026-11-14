import { WORLD_CONFIG } from '../config/constants.js';

// Zona protegida pelo escudo de radiação ativo: uma meia esfera sobre a base.
// Escudos magnéticos ativos (conceito NASA NIAC: bobinas supercondutoras em volta do habitat)
// desviam partículas carregadas só na região do campo, perto das bobinas. Por isso a proteção
// do escudo vale apenas dentro desta bolha, e não no mapa inteiro.
// Centro e raio cobrem a área que o terreno aplaina para a base (terrainGenerator: centro
// x = -4, z = 0): habitat, túnel, estufa, foguete, painéis, usina de gelo e rover estacionado.
export const SHIELD_ZONE = {
  CENTER: { x: -4, y: WORLD_CONFIG.GROUND_LEVEL + 1, z: 0 },
  RADIUS: 23,
};

export function isInsideShieldZone(pos) {
  const { CENTER, RADIUS } = SHIELD_ZONE;
  // Abaixo do chão conta como dentro (a meia esfera fica apoiada no solo).
  const dy = Math.max(0, pos.y - CENTER.y);
  return Math.hypot(pos.x - CENTER.x, dy, pos.z - CENTER.z) <= RADIUS;
}
