// Trilhos fixos por onde os tripulantes andam dentro da base (sem pathfinding no voxel).
// Coordenadas em blocos; o piso da base fica em y = 10 (nasaModelsBuilder: floorTopY).
export const RAIL_NODES = {
  quarters: { x: -3.4, z: -1.2 }, // ao lado dos beliches (-4.4, -2.5)
  hub: { x: 0, z: 1 },
  oxygen: { x: 3.2, z: -1.5 }, // em frente ao gerador MOXIE (4.6, -1.5)
  water: { x: 3.0, z: 2.4 }, // em frente a bancada de purificacao (4.4, 2.4)
  tunnelEast: { x: -6.5, z: 0 },
  tunnelWest: { x: -12.5, z: 0 },
  greenhouse: { x: -15, z: 2.5 }, // entre os canteiros da estufa (-18, 0)
};

const EDGES = [
  ['quarters', 'hub'],
  ['hub', 'oxygen'],
  ['hub', 'water'],
  ['hub', 'tunnelEast'],
  ['tunnelEast', 'tunnelWest'],
  ['tunnelWest', 'greenhouse'],
];

export const TASK_NODE = {
  greenhouse: 'greenhouse',
  water: 'water',
  oxygen: 'oxygen',
  rest: 'quarters',
};

const NEIGHBORS = {};
for (const [a, b] of EDGES) {
  (NEIGHBORS[a] ??= []).push(b);
  (NEIGHBORS[b] ??= []).push(a);
}

// Caminho mais curto em numero de trechos (BFS), incluindo origem e destino
export function findRoute(from, to) {
  const previous = { [from]: null };
  const queue = [from];
  while (queue.length) {
    const node = queue.shift();
    if (node === to) break;
    for (const next of NEIGHBORS[node] ?? []) {
      if (next in previous) continue;
      previous[next] = node;
      queue.push(next);
    }
  }
  if (!(to in previous)) return [from];
  const route = [];
  for (let node = to; node !== null; node = previous[node]) route.unshift(node);
  return route;
}

function segmentLength(a, b) {
  return Math.hypot(b.x - a.x, b.z - a.z);
}

export function routeLength(route) {
  let total = 0;
  for (let i = 1; i < route.length; i++) total += segmentLength(RAIL_NODES[route[i - 1]], RAIL_NODES[route[i]]);
  return total;
}

// Ponto a `distance` blocos do inicio da rota, com a direcao do trecho (radianos, para o avatar)
export function pointAlong(route, distance) {
  let left = Math.max(0, distance);
  for (let i = 1; i < route.length; i++) {
    const a = RAIL_NODES[route[i - 1]];
    const b = RAIL_NODES[route[i]];
    const len = segmentLength(a, b);
    const heading = Math.atan2(b.x - a.x, b.z - a.z);
    if (left <= len || i === route.length - 1) {
      const t = len > 0 ? Math.min(1, left / len) : 1;
      return { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t, heading };
    }
    left -= len;
  }
  const only = RAIL_NODES[route[0]];
  return { x: only.x, z: only.z, heading: 0 };
}
