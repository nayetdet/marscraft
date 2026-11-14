import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { PlayerPhysics } from './PlayerPhysics.js';
import { BLOCK_IDS } from '../config/blockTypes.js';
import { PHYSICS_CONFIG, WORLD_CONFIG } from '../config/constants.js';

function createMockWorld(blocks = {}) {
  return {
    getBlock(x, y, z) {
      const key = `${Math.floor(x)},${Math.floor(y)},${Math.floor(z)}`;
      return blocks[key] ?? BLOCK_IDS.AIR;
    },
  };
}

describe('PlayerPhysics', () => {
  it('applies crouch and sprint speeds, with crouch taking precedence', () => {
    const player = new PlayerPhysics(createMockWorld());
    player.yaw = 0;
    player.update(0, { KeyW: true, Sprint: true });
    expect(player.vel.z).toBeCloseTo(-PHYSICS_CONFIG.SPRINT_SPEED);

    const feetY = player.pos.y - player.height;
    player.update(0, { KeyW: true, Sprint: true, ShiftLeft: true });
    expect(player.vel.z).toBeCloseTo(-PHYSICS_CONFIG.CROUCH_SPEED);
    expect(player.pos.y - player.height).toBeCloseTo(feetY);
    expect(player.isCrouching).toBe(true);

    player.update(0, { KeyW: true });
    expect(player.height).toBe(PHYSICS_CONFIG.PLAYER_HEIGHT);
    expect(player.pos.y - player.height).toBeCloseTo(feetY);
    expect(player.vel.z).toBeCloseTo(-PHYSICS_CONFIG.WALK_SPEED);
  });

  it('stays crouched under a low ceiling until there is room to stand', () => {
    const ceiling = { minX: -1, maxX: 1, minY: 11.3, maxY: 12, minZ: -1, maxZ: 1 };
    const player = new PlayerPhysics(createMockWorld(), [ceiling]);
    player.pos.set(0, 11.7, 0);
    player.update(0, { ShiftRight: true });
    player.update(0, {});
    expect(player.isCrouching).toBe(true);
    expect(player.height).toBe(PHYSICS_CONFIG.CROUCH_HEIGHT);

    player.customColliders = [];
    player.update(0, {});
    expect(player.isCrouching).toBe(false);
    expect(player.pos.y).toBeCloseTo(11.7);
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

  it('prevents player from crossing the outer crater rim boundary', () => {
    const world = createMockWorld();
    const player = new PlayerPhysics(world, []);
    const limit = WORLD_CONFIG.CRATER_RADIUS - 2.6;
    player.pos.set(0, 15, -limit);
    player.yaw = 0;
    player.onGround = true;

    player.update(0.1, { KeyW: true });
    expect(Math.hypot(player.pos.x, player.pos.z)).toBeLessThan(WORLD_CONFIG.CRATER_RADIUS - 2.4);
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
