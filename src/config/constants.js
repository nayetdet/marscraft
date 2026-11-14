export const WORLD_CONFIG = {
  SIZE_X: 112,
  SIZE_Y: 48,
  SIZE_Z: 112,
  GROUND_LEVEL: 8,
  CRATER_RADIUS: 50, // Borda suave da cratera para nao bloquear a visao do ceu e dos planetas
};

export const PHYSICS_CONFIG = {
  MARS_GRAVITY: 12.0,
  JUMP_SPEED: 6.4,
  WALK_SPEED: 6.2,
  PLAYER_HEIGHT: 1.7,
  PLAYER_RADIUS: 0.34,
  SPAWN_POS: { x: 0, y: 11.0, z: 24.0 },
  SPAWN_YAW: 0.0,
  SPAWN_PITCH: 0.1,
};

export const CAMERA_CONFIG = {
  BASE_FOV: 72,
  ZOOM_FOV: 14,
  NEAR: 0.1,
  FAR: 900,
  REACH_DISTANCE: 6.5,
};

export const SURVIVAL_CONFIG = {
  MAX_STAT: 20,
  OXYGEN_DRAIN_RATE: 0.32,
  OXYGEN_REFILL_RATE: 4.5,
  WATER_DRAIN_RATE: 0.14,
  FOOD_DRAIN_RATE: 0.11,
  STARVE_DAMAGE_RATE: 0.8,
};
