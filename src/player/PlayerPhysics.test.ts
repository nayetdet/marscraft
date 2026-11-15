// @ts-nocheck
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { PlayerPhysics } from './PlayerPhysics.ts';
import { BLOCK_IDS } from '../config/blockTypes.ts';
import { PHYSICS_CONFIG } from '../config/constants.ts';

function createMockWorld(blocks = {}) {
  return {
    getBlock(x, y, z) {
      const key = `${Math.floor(x)},${Math.floor(y)},${Math.floor(z)}`;
      return blocks[key] ?? BLOCK_IDS.AIR;
    },
  };
}

describe('PlayerPhysics', () => {
  it('reports a landing after a jump but not after an ordinary fall', () => {
    const floorWorld = {
      getBlock(_x, y) {
        return y === 9 ? BLOCK_IDS.REGOLITH : BLOCK_IDS.AIR;
      },
    };
    const player = new PlayerPhysics(floorWorld);
    player.pos.set(0, 10 + PHYSICS_CONFIG.PLAYER_HEIGHT, 0);
    player.onGround = true;

    player.update(0.05, { Space: true });
    expect(player.justLandedFromJump).toBe(false);

    let frames = 0;
    while (!player.onGround && frames < 100) {
      player.update(0.05, {});
      frames += 1;
    }

    expect(player.onGround).toBe(true);
    expect(player.justLandedFromJump).toBe(true);
    player.update(0.05, {});
    expect(player.justLandedFromJump).toBe(false);

    const fallingPlayer = new PlayerPhysics(floorWorld);
    fallingPlayer.pos.set(0, 10 + PHYSICS_CONFIG.PLAYER_HEIGHT, 0);
    fallingPlayer.vel.y = -1;
    fallingPlayer.update(0.05, {});

    expect(fallingPlayer.onGround).toBe(true);
    expect(fallingPlayer.justLandedFromJump).toBe(false);
  });

  it('sprints with the sprint flag or Shift, and walks otherwise', () => {
    const player = new PlayerPhysics(createMockWorld());
    player.yaw = 0;
    player.update(0, { KeyW: true, Sprint: true });
    expect(player.vel.z).toBeCloseTo(-PHYSICS_CONFIG.SPRINT_SPEED);

    player.update(0, { KeyW: true, Sprint: true, ShiftLeft: true });
    expect(player.vel.z).toBeCloseTo(-PHYSICS_CONFIG.SPRINT_SPEED);

    player.update(0, { KeyW: true, ShiftRight: true });
    expect(player.vel.z).toBeCloseTo(-PHYSICS_CONFIG.SPRINT_SPEED);

    player.update(0, { KeyW: true });
    expect(player.vel.z).toBeCloseTo(-PHYSICS_CONFIG.WALK_SPEED);
  });

  it('blocks horizontal movement into custom 3D object colliders without auto-stepping over them', () => {
    const world = createMockWorld();
    const deskCollider = {
      minX: -1.8,
      maxX: 1.8,
      minY: 10.0,
      maxY: 12.0,
      minZ: -4.2,
      maxZ: -3.0,
    };
    const player = new PlayerPhysics(world, [deskCollider]);
    player.pos.set(0, 11.7, -2.7);
    player.yaw = 0; // Olhando para -Z
    player.onGround = true;

    player.update(0.05, { KeyW: true });

    // Jogador deve ser bloqueado na frente do painel (z = -2.7) e não subir nele
    expect(player.pos.z).toBeCloseTo(-2.7, 3);
    expect(player.pos.y).toBeLessThanOrEqual(11.7);
  });

  it('prevents placing blocks that overlap custom 3D object colliders', () => {
    const world = createMockWorld();
    const chairCollider = {
      minX: -1.1,
      maxX: -0.5,
      minY: 10.0,
      maxY: 11.5,
      minZ: -2.6,
      maxZ: -2.0,
    };
    const player = new PlayerPhysics(world, [chairCollider]);
    player.pos.set(0, 11.7, 5);

    expect(player.overlapsBlock(-1, 10, -3)).toBe(true);
    expect(player.overlapsBlock(3, 10, 3)).toBe(false);
  });

  it('does not use an invisible radial boundary away from solid terrain', () => {
    const world = createMockWorld();
    const player = new PlayerPhysics(world, []);
    player.pos.set(0, 15, -54);
    player.yaw = 0;
    player.onGround = true;

    player.update(0.1, { KeyW: true });
    expect(player.pos.z).toBeLessThan(-54);
  });
});

describe('PlayerPhysics.getLookDirection', () => {
  it('reaproveita o vetor passado e devolve direcao unitaria', () => {
    const player = new PlayerPhysics(createMockWorld());
    player.yaw = 0;
    player.pitch = 0;
    const target = new THREE.Vector3(9, 9, 9);

    const dir = player.getLookDirection(target);

    expect(dir).toBe(target);
    expect(dir.x).toBeCloseTo(0, 6);
    expect(dir.y).toBeCloseTo(0, 6);
    expect(dir.z).toBeCloseTo(-1, 6);
  });

  it('segue yaw e pitch e cria um vetor novo quando nenhum e passado', () => {
    const player = new PlayerPhysics(createMockWorld());
    player.yaw = Math.PI / 2; // virado para -X
    player.pitch = Math.PI / 4; // olhando 45 graus para cima

    const dir = player.getLookDirection();

    expect(dir.length()).toBeCloseTo(1, 6);
    expect(dir.x).toBeCloseTo(-Math.SQRT1_2, 6);
    expect(dir.y).toBeCloseTo(Math.SQRT1_2, 6);
    expect(dir.z).toBeCloseTo(0, 6);
  });
});
