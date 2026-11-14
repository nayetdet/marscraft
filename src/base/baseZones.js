// Zonas internas da base em coordenadas de bloco. Sem Three.js nem DOM, para testar com Vitest.
// O piso da base fica em y = 10 (nasaModelsBuilder: floorTopY).

// Abrigo de tempestade: fica no caminho entre o hub e o tunel da estufa, sob bolsas de agua
// e sacos de regolito (baseDecor.js desenha o teto, a parede e a marca no piso desta zona).
export const STORM_SHELTER_ZONE = { minX: -3, maxX: -1, minZ: -0.8, maxZ: 1.8 };

export function isInsideStormShelter(pos) {
  const z = STORM_SHELTER_ZONE;
  return pos.x > z.minX && pos.x < z.maxX && pos.z > z.minZ && pos.z < z.maxZ;
}
