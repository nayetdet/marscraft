import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest';
import * as THREE from 'three';
import { VoxelWorld } from './VoxelWorld.js';
import { BLOCK_IDS, CROP_ITEM_IDS } from '../config/blockTypes.js';

// O construtor desenha as texturas de rachadura num canvas; no Node basta um canvas que nao faz nada
beforeAll(() => {
  const ctx = new Proxy({}, { get: () => () => {} });
  vi.stubGlobal('document', {
    createElement: () => ({ getContext: () => ctx, toDataURL: () => '' }),
  });
});

afterAll(() => {
  vi.unstubAllGlobals();
});

// Atlas e materiais falsos: o meshing so precisa dos retangulos de UV, nao de canvas/WebGL
function createWorld() {
  const uvRects = {};
  for (const id of Object.values(BLOCK_IDS)) {
    if (id !== BLOCK_IDS.AIR && id !== BLOCK_IDS.HAB_GLASS) {
      uvRects[id] = { u0: 0, u1: 1, v0: 0, v1: 1 };
    }
  }
  const atlas = { material: new THREE.MeshBasicMaterial(), uvRects };
  // breakBlock clona o material do bloco para o drop e as particulas
  const materials = {};
  for (const id of Object.values(BLOCK_IDS)) materials[id] = new THREE.MeshBasicMaterial();
  return new VoxelWorld(new THREE.Scene(), materials, atlas, new THREE.Texture());
}

function chunkOf(world, x, z) {
  const cx = Math.floor((Math.floor(x) + world.halfX) / 16);
  const cz = Math.floor((Math.floor(z) + world.halfZ) / 16);
  return world.chunks[cz * world.chunksX + cx];
}

function faceCount(mesh) {
  return mesh ? mesh.geometry.index.count / 6 : 0;
}

// Cada face e um quad de 4 vertices com a mesma normal
function forEachFace(world, fn) {
  for (const mesh of world.worldGroup.children) {
    const pos = mesh.geometry.attributes.position;
    const nor = mesh.geometry.attributes.normal;
    for (let v = 0; v < pos.count; v += 4) {
      const xs = [0, 1, 2, 3].map((k) => pos.getX(v + k));
      const ys = [0, 1, 2, 3].map((k) => pos.getY(v + k));
      const zs = [0, 1, 2, 3].map((k) => pos.getZ(v + k));
      fn({
        normal: [nor.getX(v), nor.getY(v), nor.getZ(v)],
        min: [Math.min(...xs), Math.min(...ys), Math.min(...zs)],
        max: [Math.max(...xs), Math.max(...ys), Math.max(...zs)],
      });
    }
  }
}

function geometrySnapshot(world) {
  return world.worldGroup.children
    .map((m) => Array.from(m.geometry.attributes.position.array).join(','))
    .sort()
    .join('|');
}

// Altura livre bem acima do terreno e da base, dentro do mundo
const SKY_Y = 40;

describe('VoxelWorld meshing', () => {
  let world;

  beforeEach(() => {
    world = createWorld();
  });

  it('tracks broken base windows until every opening is sealed', () => {
    const indices = [...world.baseWindows].slice(0, 2);
    expect(indices).toHaveLength(2);
    const coords = (idx) => {
      const y = Math.floor(idx / (world.sizeX * world.sizeZ));
      const remainder = idx % (world.sizeX * world.sizeZ);
      return [remainder % world.sizeX - world.halfX, y, Math.floor(remainder / world.sizeX) - world.halfZ];
    };
    const [first, second] = indices.map(coords);
    world.breakBlock(...first);
    world.breakBlock(...second);
    expect(world.brokenBaseWindows.size).toBe(2);
    world.setBlock(...first, BLOCK_IDS.HAB_GLASS);
    expect(world.brokenBaseWindows.size).toBe(1);
    world.setBlock(...second, BLOCK_IDS.BASALT);
    expect(world.brokenBaseWindows.size).toBe(0);
    world.setBlock(40, SKY_Y, 40, BLOCK_IDS.HAB_GLASS);
    world.setBlock(40, SKY_Y, 40, BLOCK_IDS.AIR);
    expect(world.brokenBaseWindows.size).toBe(0);
  });

  it('nao gera faces voltadas para baixo no fundo do mundo', () => {
    const outward = [];
    forEachFace(world, ({ normal, min, max }) => {
      const [, ny] = normal;
      if (ny === -1 && min[1] === 0) outward.push('fundo');
    });
    expect(outward).toEqual([]);
  });

  it('gera os triangulos na ordem anti-horaria coerente com a normal (back-face culling)', () => {
    let bad = 0;
    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    const c = new THREE.Vector3();
    const n = new THREE.Vector3();
    for (const mesh of world.worldGroup.children) {
      const { position, normal } = mesh.geometry.attributes;
      const index = mesh.geometry.index;
      for (let i = 0; i < index.count; i += 3) {
        a.fromBufferAttribute(position, index.getX(i));
        b.fromBufferAttribute(position, index.getX(i + 1));
        c.fromBufferAttribute(position, index.getX(i + 2));
        n.fromBufferAttribute(normal, index.getX(i));
        const cross = b.clone().sub(a).cross(c.clone().sub(a));
        if (cross.dot(n) <= 0) bad++;
      }
    }
    expect(bad).toBe(0);
  });

  it('bloco isolado tem 6 faces e dois blocos encostados escondem a face em comum', () => {
    const chunk = chunkOf(world, 0, 0);
    const before = faceCount(chunk.opaqueMesh);

    world.setBlock(0, SKY_Y, 0, BLOCK_IDS.BASALT, true);
    expect(faceCount(chunk.opaqueMesh) - before).toBe(6);

    world.setBlock(1, SKY_Y, 0, BLOCK_IDS.BASALT, true);
    expect(faceCount(chunk.opaqueMesh) - before).toBe(10);
  });

  // Brilho (cor por vertice) dos 4 cantos da face de cima do bloco em (x, y, z)
  function topFaceShades(chunk, x, y, z) {
    const { position, color } = chunk.opaqueMesh.geometry.attributes;
    expect(color.count).toBe(position.count);
    for (let v = 0; v < position.count; v += 4) {
      const ks = [0, 1, 2, 3];
      const isTop = ks.every((k) => position.getY(v + k) === y + 1)
        && Math.min(...ks.map((k) => position.getX(v + k))) === x
        && Math.min(...ks.map((k) => position.getZ(v + k))) === z;
      if (isTop) return ks.map((k) => color.getX(v + k));
    }
    return null;
  }

  it('sombra de canto: um bloco vizinho escurece so os cantos encostados nele', () => {
    const chunk = chunkOf(world, 0, 0);

    // Casco isolado no ar: sem tinta e sem vizinhos, todos os cantos em brilho total
    world.setBlock(0, SKY_Y, 0, BLOCK_IDS.NASA_HULL, true);
    expect(topFaceShades(chunk, 0, SKY_Y, 0)).toEqual([1, 1, 1, 1]);

    // Um degrau a leste, uma camada acima: os dois cantos de x = 1 escurecem, os de x = 0 nao
    world.setBlock(1, SKY_Y + 1, 0, BLOCK_IDS.NASA_HULL, true);
    const { position } = chunk.opaqueMesh.geometry.attributes;
    const shades = topFaceShades(chunk, 0, SKY_Y, 0);
    expect(Math.min(...shades)).toBeLessThan(1);
    expect(Math.max(...shades)).toBe(1);
    expect(shades.filter((s) => s < 1)).toHaveLength(2);
    expect(position.count).toBeGreaterThan(0);
  });

  it('vidro esconde faces entre vidros, e o bloco opaco continua visivel atras do vidro', () => {
    const chunk = chunkOf(world, 0, 0);
    const opaqueBefore = faceCount(chunk.opaqueMesh);
    const glassBefore = faceCount(chunk.glassMesh);

    world.setBlock(0, SKY_Y, 0, BLOCK_IDS.HAB_GLASS, true);
    world.setBlock(1, SKY_Y, 0, BLOCK_IDS.HAB_GLASS, true);
    expect(faceCount(chunk.glassMesh) - glassBefore).toBe(10);

    world.setBlock(2, SKY_Y, 0, BLOCK_IDS.BASALT, true);
    // Vidro perde a face encostada no opaco; o opaco mantem as 6 (a que encosta no vidro aparece)
    expect(faceCount(chunk.glassMesh) - glassBefore).toBe(9);
    expect(faceCount(chunk.opaqueMesh) - opaqueBefore).toBe(6);
  });

  it('colocar bloco na borda de um chunk atualiza tambem o chunk vizinho', () => {
    // O mundo vai de -112 a 111 e os chunks tem 16 blocos: x = -16 e o primeiro bloco de um
    // chunk e x = -17 e o ultimo do chunk anterior
    const right = chunkOf(world, -16, 0);
    const left = chunkOf(world, -17, 0);
    expect(right).not.toBe(left);

    const rightBefore = faceCount(right.opaqueMesh);
    world.setBlock(-16, SKY_Y, 0, BLOCK_IDS.BASALT, true);
    expect(faceCount(right.opaqueMesh) - rightBefore).toBe(6);

    world.setBlock(-17, SKY_Y, 0, BLOCK_IDS.BASALT, true);
    expect(faceCount(right.opaqueMesh) - rightBefore).toBe(5);
  });

  it('reconstruir so os chunks alterados da o mesmo resultado que reconstruir tudo', () => {
    const edits = [
      [0, 9, 24, BLOCK_IDS.AIR],
      [-1, 9, 24, BLOCK_IDS.AIR],
      [15, 8, 15, BLOCK_IDS.REGOLITH],
      [-41, 9, 0, BLOCK_IDS.AIR],
      [3, 11, 30, BLOCK_IDS.NASA_HULL],
      [-18, 12, 0, BLOCK_IDS.AIR],
    ];
    for (const [x, y, z, id] of edits) world.setBlock(x, y, z, id, true);
    const partial = geometrySnapshot(world);

    world.rebuildMeshes();
    expect(partial).toBe(geometrySnapshot(world));
  });

  it('leaves a carrot on the ground until pickup is allowed and inventory accepts it', () => {
    const position = new THREE.Vector3(0, SKY_Y, 20);
    world.spawnCropDrop(position);
    const player = new THREE.Vector3(0, SKY_Y + 1.05, 20);
    expect(world.updateDrops(0.1, player, () => true)).toEqual([]);
    expect(world.drops).toHaveLength(1);
    world.drops[0].age = 1;
    expect(world.updateDrops(0, player, () => false)).toEqual([]);
    expect(world.drops).toHaveLength(1);
    expect(world.updateDrops(0, player, () => true)).toEqual([BLOCK_IDS.HYDRO_PLANT]);
    expect(world.drops).toHaveLength(0);
  });

  it.each(Object.entries(CROP_ITEM_IDS))('preserves %s identity through dropping, failed pickup and successful pickup', (type, id) => {
    const position = new THREE.Vector3(0, SKY_Y, 20);
    world.spawnPlayerDrop(position, 0, id);
    const drop = world.drops.at(-1);
    expect(drop.blockId).toBe(id);
    expect(drop.mesh.name).toBe(type + '-food');
    const material = drop.mesh.children[0].material;
    const disposed = vi.fn(); material.addEventListener('dispose', disposed);
    const player = drop.mesh.position.clone(); player.y += 1.05;
    drop.age = 10;
    expect(world.updateDrops(0, player, () => false)).toEqual([]);
    expect(world.drops).toHaveLength(1);
    expect(world.updateDrops(0, player, () => true)).toEqual([id]);
    expect(world.drops).toHaveLength(0);
    expect(disposed).not.toHaveBeenCalled();
    material.removeEventListener('dispose', disposed);
  });

  it('breakBlock reconstroi so o chunk do bloco, sem refazer o mundo inteiro', () => {
    // x = 8 e z = 24 ficam no meio de um chunk (longe das bordas, que caem nos multiplos de 16)
    world.setBlock(8, SKY_Y, 24, BLOCK_IDS.BASALT, true);
    const target = chunkOf(world, 8, 24);
    const geometriesBefore = new Map(world.chunks.map((c) => [c, c.opaqueMesh?.geometry]));

    expect(world.breakBlock(8, SKY_Y, 24)).toBe(BLOCK_IDS.BASALT);

    const rebuilt = world.chunks.filter((c) => c.opaqueMesh?.geometry !== geometriesBefore.get(c));
    expect(rebuilt).toEqual([target]);
    expect(world.getBlock(8, SKY_Y, 24)).toBe(BLOCK_IDS.AIR);
    expect(world.drops).toHaveLength(1);
  });

  it('quebrar o ultimo bloco de um chunk remove a malha em vez de deixar geometria vazia', () => {
    // Canto do mapa, longe da base: chunk sem nenhum vidro
    const chunk = chunkOf(world, 40, 40);
    expect(chunk.glassMesh).toBeNull();

    world.setBlock(40, SKY_Y, 40, BLOCK_IDS.HAB_GLASS, true);
    expect(chunk.glassMesh).not.toBeNull();
    world.setBlock(40, SKY_Y, 40, BLOCK_IDS.AIR, true);
    expect(chunk.glassMesh).toBeNull();
  });
});
