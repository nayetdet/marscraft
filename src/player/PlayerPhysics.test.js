import { describe, it, expect } from 'vitest';
import { PlayerPhysics } from './PlayerPhysics.js';
import { BLOCK_IDS } from '../config/blockTypes.js';
import { WORLD_CONFIG } from '../config/constants.js';

function createMockWorld(blocks = {}) {
  return {
    getBlock(x, y, z) {
      const key = `${Math.floor(x)},${Math.floor(y)},${Math.floor(z)}`;
      return blocks[key] ?? BLOCK_IDS.AIR;
    },
  };
}

describe('PlayerPhysics', () => {
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
