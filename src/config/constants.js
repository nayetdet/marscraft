export const WORLD_CONFIG = {
  SIZE_X: 96,
  SIZE_Y: 56,
  SIZE_Z: 96,
  GROUND_LEVEL: 10,
  CRATER_RADIUS: 43, // Raio da cratera que limita o mundo com paredões íngremes
};

export const PHYSICS_CONFIG = {
  MARS_GRAVITY: 12.0,
  JUMP_SPEED: 6.4,
  WALK_SPEED: 5.8,
  JETPACK_SPEED: 10.0,
  PLAYER_HEIGHT: 1.7,
  PLAYER_RADIUS: 0.34,
  SPAWN_POS: { x: 0, y: 13.0, z: 19.5 },
  SPAWN_YAW: 0.0,
  SPAWN_PITCH: 0.12,
};

export const CAMERA_CONFIG = {
  BASE_FOV: 72,
  ZOOM_FOV: 14,
  NEAR: 0.1,
  FAR: 900,
  REACH_DISTANCE: 6.0,
};

export const SURVIVAL_CONFIG = {
  MAX_STAT: 20, // 10 ícones (cada ícone vale 2 pontos, igual ao Minecraft)
  OXYGEN_DRAIN_RATE: 0.38, // Drena fora da nave
  OXYGEN_REFILL_RATE: 3.5, // Recarrega rápido dentro da Nave pressurizada
  WATER_DRAIN_RATE: 0.16,
  FOOD_DRAIN_RATE: 0.12,
  STARVE_DAMAGE_RATE: 0.8,
};
