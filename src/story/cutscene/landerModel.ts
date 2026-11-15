// @ts-nocheck
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// Capsula de pouso da tripulacao, em caixas (estilo voxel, sem logos). A origem fica no chao.
// Depois da animacao de chegada ela continua no cenario como objeto solido.

export const LANDER_SIZE = { halfWidth: 2.3, height: 5.5 };
// Altura (acima da origem) de onde sai a chama do motor
export const LANDER_NOZZLE_Y = 0.75;

const COLORS = {
  white: 0xf8fafc,
  gray: 0xcbd5e1,
  dark: 0x1e293b,
  gold: 0xf59e0b,
  orange: 0xea580c,
  glass: 0x38bdf8,
};

// [largura, altura, profundidade, cor, x, y, z, rotacao x, rotacao z]
function boxes() {
  const list = [
    // Motor e escudo termico
    [0.9, 0.5, 0.9, 'dark', 0, 1.0, 0],
    [4.0, 0.4, 4.0, 'dark', 0, 1.45, 0],
    [3.5, 0.3, 3.5, 'gold', 0, 1.8, 0],
    // Corpo em degraus
    [3.4, 1.2, 3.4, 'white', 0, 2.55, 0],
    [3.46, 0.2, 3.46, 'orange', 0, 3.05, 0],
    [2.8, 1.0, 2.8, 'white', 0, 3.65, 0],
    [2.0, 0.8, 2.0, 'white', 0, 4.55, 0],
    [1.1, 0.5, 1.1, 'gray', 0, 5.2, 0],
    // Escotilha e janela (lado +z, virado para a base)
    [0.8, 1.0, 0.08, 'dark', 0, 2.5, 1.72],
    [0.9, 0.5, 0.08, 'glass', 0, 3.7, 1.42],
  ];
  // Pernas de pouso inclinadas, com sapatas
  for (const [lx, lz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    list.push([0.22, 1.7, 0.22, 'gray', lx * 1.75, 0.8, lz * 1.75, lz * 0.32, -lx * 0.32]);
    list.push([0.7, 0.12, 0.7, 'dark', lx * 2.0, 0.06, lz * 2.0]);
  }
  return list;
}

// Uma unica malha com cor por vertice (um draw call)
export function createLander() {
  const color = new THREE.Color();
  const transform = new THREE.Matrix4();
  const rotation = new THREE.Euler();
  const quaternion = new THREE.Quaternion();
  const position = new THREE.Vector3();
  const scale = new THREE.Vector3(1, 1, 1);

  const geometries = boxes().map(([w, h, d, colorName, x, y, z, rx = 0, rz = 0]) => {
    const geometry = new THREE.BoxGeometry(w, h, d);
    rotation.set(rx, 0, rz);
    transform.compose(position.set(x, y, z), quaternion.setFromEuler(rotation), scale);
    geometry.applyMatrix4(transform);

    color.setHex(COLORS[colorName]);
    const colors = new Float32Array(geometry.attributes.position.count * 3);
    for (let i = 0; i < colors.length; i += 3) {
      colors[i] = color.r;
      colors[i + 1] = color.g;
      colors[i + 2] = color.b;
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geometry;
  });

  const merged = mergeGeometries(geometries, false);
  geometries.forEach((geometry) => geometry.dispose());

  const group = new THREE.Group();
  group.add(new THREE.Mesh(merged, new THREE.MeshLambertMaterial({ vertexColors: true })));
  return group;
}

// Caixa de colisao da capsula pousada em (x, groundY, z), no formato dos colisores do jogo
export function landerCollider(x, groundY, z) {
  return {
    // The opening arrival capsule shares the Ascent Vehicle scan entry with the MAV.
    scanId: 'lander',
    minX: x - LANDER_SIZE.halfWidth,
    maxX: x + LANDER_SIZE.halfWidth,
    minY: groundY,
    maxY: groundY + LANDER_SIZE.height,
    minZ: z - LANDER_SIZE.halfWidth,
    maxZ: z + LANDER_SIZE.halfWidth,
  };
}
