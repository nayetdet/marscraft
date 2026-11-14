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
  SPRINT_SPEED: 8.7,
  CROUCH_SPEED: 3.1,
  PLAYER_HEIGHT: 1.7,
  CROUCH_HEIGHT: 1.15,
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

export const BLOCK_INTERACTION_CONFIG = {
  BREAK_TIME: 0.6,
  BREAK_PARTICLE_COUNT: 12,
  BREAK_PARTICLE_LIFETIME: 0.45,
  DROP_GRAVITY: 11,
  DROP_PICKUP_RADIUS: 1.35,
  DROP_SIZE: 0.32,
  DROP_LIFETIME: 45,
  CROP_PICKUP_DELAY: 0.8,
  PLAYER_DROP_PICKUP_DELAY: 1.5,
  EAT_ANIMATION_DURATION: 0.8,
};

export const SURVIVAL_CONFIG = {
  MAX_STAT: 20,
  OXYGEN_DRAIN_RATE: 0.32,
  OXYGEN_REFILL_RATE: 4.5,
  WATER_DRAIN_RATE: 0.14,
  FOOD_DRAIN_RATE: 0.11,
  STARVE_DAMAGE_RATE: 0.8,
};

export const WATER_SYSTEM_CONFIG = {
  MAX_BASE_WATER: 100, // Litros
  INITIAL_BASE_WATER: 25,
  ICE_CARGO_MAX: 50, // kg de gelo na caçamba do rover
  ICE_PER_DRILL: 10, // kg coletados por perfuração
  LITERS_PER_KG_ICE: 1.0, // 1 kg de gelo = 1 L de água purificada
  GREENHOUSE_WATER_CONSUMPTION: 0.04, // L/s de irrigação na estufa
  DRINK_AMOUNT_FROM_DISPENSER: 2.0, // L consumidos por gole no purificador da base
  ICE_CRATER_CENTER: { x: 22, z: -22 },
  ICE_DEPOT_POS: { x: 5.5, y: 9.0, z: 9.5 },
  WATER_DISPENSER_POS: { x: 4.4, y: 10.0, z: 2.4 },
};
