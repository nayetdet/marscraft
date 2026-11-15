// @ts-nocheck
import * as THREE from 'three';
import { BLOCK_IDS } from '../config/blockTypes.ts';
import { EVENTS_CONFIG, TERRAIN_CONFIG } from '../config/constants.ts';
import { isBuildZone } from './terrainGenerator.ts';

// Cratera nova do evento de meteoro (issue #107). Como a cratera real de 24/12/2021, ela expoe
// gelo que estava logo abaixo do chao e joga pedacos de gelo na borda. O tamanho e escala de jogo.
// As funcoes recebem o mundo ({ getBlock, setBlock, sizeY }) e nao usam Three.js, salvo hideRocksNear.

const NATURAL = new Set([
  BLOCK_IDS.REGOLITH,
  BLOCK_IDS.SANDSTONE,
  BLOCK_IDS.BASALT,
  BLOCK_IDS.DARK_BASALT,
  BLOCK_IDS.MARS_ICE,
  BLOCK_IDS.METEOR_ICE,
]);
const TRIES = 24;

// y do bloco solido mais alto da coluna, ou -1 se for ar ate o fundo
function topSolid(world, x, z) {
  for (let y = world.sizeY - 1; y >= 0; y--) {
    if (world.getBlock(x, y, z) !== BLOCK_IDS.AIR) return y;
  }
  return -1;
}

function naturalTop(world, x, z) {
  const y = topSolid(world, x, z);
  return y >= 0 && NATURAL.has(world.getBlock(x, y, z)) ? y : -1;
}

// Lugar da cratera: um anel em volta da base, fora de tudo que foi construido, longe do jogador
// e do rover (`avoid`). `params` vem do diretor de eventos ({ angle, distance } sorteados).
// Devolve { x, z } (inteiros) ou null.
export function findImpactSite(world, { angle, distance }, avoid = [], config = EVENTS_CONFIG) {
  const center = TERRAIN_CONFIG.BASE_CENTER;
  const reach = config.METEOR_CRATER_RADIUS + 2;
  for (let k = 0; k < TRIES; k++) {
    // Gira em volta da base e alterna a distancia ate achar chao livre
    const a = angle + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * (Math.PI * 2 / TRIES);
    const f = (distance + k * 0.37) % 1;
    const r = config.METEOR_MIN_DISTANCE + (config.METEOR_MAX_DISTANCE - config.METEOR_MIN_DISTANCE) * f;
    const x = Math.round(center.x + Math.cos(a) * r);
    const z = Math.round(center.z + Math.sin(a) * r);
    if (avoid.some((p) => p && Math.hypot(p.x - x, p.z - z) < config.METEOR_MIN_PLAYER_DISTANCE)) continue;
    let free = !isBuildZone(x, z) && naturalTop(world, x, z) >= 0;
    for (let i = 0; free && i < 8; i++) {
      const px = x + Math.cos(i * Math.PI / 4) * reach;
      const pz = z + Math.sin(i * Math.PI / 4) * reach;
      free = !isBuildZone(px, pz) && naturalTop(world, Math.round(px), Math.round(pz)) >= 0;
    }
    if (free) return { x, z };
  }
  return null;
}

// Cava a cratera e devolve { iceBlocks, cells } (cells = colunas mudadas, para refazer a malha).
// So mexe em colunas de chao natural: nunca derruba nada construido.
export function carveImpactCrater(world, { x, z }, config = EVENTS_CONFIG) {
  const R = config.METEOR_CRATER_RADIUS;
  const rimOuter = R + 1.5;
  const cells = [];
  const changed = new Set();
  const addCell = (cx, cz) => {
    const key = `${cx},${cz}`;
    if (changed.has(key)) return;
    changed.add(key);
    cells.push([cx, cz]);
  };
  let iceBlocks = 0;
  const span = Math.ceil(rimOuter);
  for (let dx = -span; dx <= span; dx++) {
    for (let dz = -span; dz <= span; dz++) {
      const d = Math.hypot(dx, dz);
      if (d >= rimOuter) continue;
      const cx = x + dx;
      const cz = z + dz;
      const top = naturalTop(world, cx, cz);
      if (top < 1) continue;
      if (d < R) {
        // Bacia: mais funda no meio
        const depth = Math.max(1, Math.round(config.METEOR_CRATER_DEPTH * (1 - (d / R) ** 2)));
        const floor = Math.max(1, top - depth);
        for (let y = top; y > floor; y--) world.setBlock(cx, y, cz, BLOCK_IDS.AIR, false);
        world.setBlock(cx, floor, cz, BLOCK_IDS.DARK_BASALT, false);
        if (floor > 1) world.setBlock(cx, floor - 1, cz, BLOCK_IDS.DARK_BASALT, false);
        const iceBand = d >= config.METEOR_ICE_RADIUS * 0.45 && d <= config.METEOR_ICE_RADIUS;
        const icePatch = (Math.abs(dx * 7 + dz * 13) % 4) !== 0;
        if (iceBand && icePatch) {
          // Veios brancos de gelo fresco contrastam com o basalto escuro da bacia.
          world.setBlock(cx, floor, cz, BLOCK_IDS.METEOR_ICE, false);
          if (floor > 1) world.setBlock(cx, floor - 1, cz, BLOCK_IDS.METEOR_ICE, false);
          iceBlocks++;
        }
      } else {
        // Borda de material jogado para fora, com alguns pedacos de gelo
        const chunk = ((dx * 7 + dz * 13) % 5 + 5) % 5 === 0;
        world.setBlock(cx, top + 1, cz, chunk ? BLOCK_IDS.METEOR_ICE : BLOCK_IDS.REGOLITH, false);
        if (chunk) iceBlocks++;
      }
      addCell(cx, cz);
    }
  }

  // Raios curtos de ejecta claro irradiam para fora da borda sem criar meshes adicionais:
  // todos os blocos continuam no atlas compartilhado do terreno.
  const rayCount = 8;
  for (let ray = 0; ray < rayCount; ray++) {
    const angle = (ray * Math.PI * 2) / rayCount + (ray % 2 ? 0.06 : -0.04);
    const length = 3 + (ray % 3);
    for (let step = 1; step <= length; step++) {
      const distance = rimOuter + step * 0.85;
      const side = step <= Math.ceil(length / 2) ? (ray % 2 ? 1 : -1) * 0.7 : 0;
      const cx = Math.round(x + Math.cos(angle) * distance - Math.sin(angle) * side);
      const cz = Math.round(z + Math.sin(angle) * distance + Math.cos(angle) * side);
      if (isBuildZone(cx, cz)) continue;
      const top = naturalTop(world, cx, cz);
      if (top < 1 || top + 1 >= world.sizeY) continue;
      world.setBlock(cx, top + 1, cz, BLOCK_IDS.SANDSTONE, false);
      addCell(cx, cz);
    }
  }

  return { iceBlocks, cells };
}

// Esconde as pedras decorativas (InstancedMesh de surfaceRocks.js) que ficariam flutuando na cratera
const _m = new THREE.Matrix4();
const _p = new THREE.Vector3();
const _zero = new THREE.Matrix4().makeScale(0, 0, 0);
export function hideRocksNear(mesh, x, z, radius) {
  if (!mesh) return;
  let changed = false;
  for (let i = 0; i < mesh.count; i++) {
    mesh.getMatrixAt(i, _m);
    _p.setFromMatrixPosition(_m);
    if (Math.hypot(_p.x - (x + 0.5), _p.z - (z + 0.5)) < radius) {
      mesh.setMatrixAt(i, _zero);
      changed = true;
    }
  }
  if (changed) mesh.instanceMatrix.needsUpdate = true;
}
