export const WORLD_CONFIG = {
  SIZE_X: 224,
  SIZE_Y: 48,
  SIZE_Z: 224,
  GROUND_LEVEL: 8,
};

export const PHYSICS_CONFIG = {
  MARS_GRAVITY: 12.0,
  JUMP_SPEED: 6.4,
  WALK_SPEED: 6.2,
  SPRINT_SPEED: 8.7,
  PLAYER_HEIGHT: 1.7,
  PLAYER_RADIUS: 0.34,
  SPAWN_POS: { x: 0, y: 10.75, z: 11.5 },
  SPAWN_YAW: 0.0,
  SPAWN_PITCH: 0.1,
};

export const CAMERA_CONFIG = {
  BASE_FOV: 72,
  ZOOM_FOV: 14,
  NEAR: 0.1,
  FAR: 1200,
  REACH_DISTANCE: 6.5,
};

export const INPUT_CONFIG = {
  MOUSE_SENSITIVITY: 0.0021, // radianos por pixel
  ZOOM_SENSITIVITY: 0.00055, // mais fina com a luneta (Z)
  // Deltas acima disso num unico mousemove sao picos falsos do pointer lock (~60 graus de giro).
  MAX_MOUSE_DELTA: 500,
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
  OXYGEN_DRAIN_RATE: 20 / 360, // tanque cheio dura 6 minutos fora da base
  OXYGEN_REFILL_RATE: 4.5,
  BREACH_OXYGEN_DRAIN_RATE: 1.0, // pontos de O2 do jogador por segundo
  BASE_OXYGEN_LEAK_RATE: 5, // porcentagem por segundo, para qualquer abertura
  BASE_OXYGEN_REFILL_RATE: 2, // porcentagem por segundo após vedar a base
  WATER_DRAIN_RATE: 20 / 600, // hidratacao cheia dura 10 minutos
  FOOD_DRAIN_RATE: 0.11,
  STARVE_DAMAGE_RATE: 0.8,
  DANGER_THRESHOLD: 5,
  // Abaixo deste O2 o corpo nao se recupera: nem a regeneracao natural nem a comida curam.
  HEAL_MIN_OXYGEN: 5,
  DUST_STORM_START_RADIUS: 52,
  DUST_STORM_FATAL_RADIUS: 82,
  DUST_STORM_DAMAGE_RATE: 20,
};

export const WATER_SYSTEM_CONFIG = {
  MAX_BASE_WATER: 100, // Litros
  INITIAL_BASE_WATER: 25,
  ICE_CARGO_MAX: 50, // kg de gelo na caçamba do rover
  ICE_PER_DRILL: 10, // kg coletados por perfuração
  LITERS_PER_KG_ICE: 1.0, // 1 kg de gelo = 1 L de água purificada
  GREENHOUSE_WATER_CONSUMPTION: 0.04, // L/s de irrigação na estufa
  DRINK_AMOUNT_FROM_DISPENSER: 2.0, // L consumidos por gole no purificador da base
  ICE_CRATER_CENTER: { x: 30, z: -22 },
  ICE_DEPOT_POS: { x: 5.5, y: 9.0, z: 9.5 },
  WATER_DISPENSER_POS: { x: 10.4, y: 10.0, z: 1.5 },
};

// Missao: energia, tempestades solares e o MAV (issue #30).
// Taxas "por hora de jogo": com GAME_HOURS_PER_SECOND = 0.01, 1 hora de jogo = 100 s reais.
// Fontes dos numeros reais em docs/data/numeros-reais.md.
export const MISSION_CONFIG = {
  MAX_ENERGY: 100, START_ENERGY: 80, SOLAR_RATE: 0.22,
  GREENHOUSE_RATE: 0.025, OXYGEN_ENERGY_RATE: 0.18,
  AIRLOCK_COST: 1, AIRLOCK_CYCLE: 0.8, DOOR_SPEED: 10,
  // Limpeza eletrostatica do traje no airlock (segundos). Sem energia, o aviso fica na tela
  // SUIT_CLEAN_SKIP_TIME e a poeira entra na base. Ver docs/data/airlock-e-poeira.md
  SUIT_CLEAN_TIME: 0.8, SUIT_CLEAN_SKIP_TIME: 0.6,
  CROP_GROWTH_TIME: 90, STORM_INTERVAL: 240, STORM_DURATION: 35, STORM_WARNING: 20,
  RADIATION_RATE: 0.04, STORM_RADIATION_RATE: 0.25,

  // Hora de jogo por segundo real (igual a MarsSkySystem.autoAdvanceSpeed)
  GAME_HOURS_PER_SECOND: 0.01,
  // Passo maximo de simulacao, para avancos de tempo grandes (tecla T) nao pularem eventos
  MAX_STEP_HOURS: 0.05,
  // Hora do nascer do sol no relogio do jogo (MarsSkySystem: sol no horizonte as 6h e 18h)
  SUNRISE_HOUR: 6,
};

export const ENERGY_CONFIG = {
  BATTERY_CAPACITY: 100, // %
  START_CHARGE: 80, // %
  // Carga por hora com o Sol a pino, se os paineis estivessem na Terra
  PANEL_PEAK_CHARGE_EARTH_PER_HOUR: 50,
  // [Ref] Marte recebe ~43 % da luz do Sol que chega a Terra (~590 W/m2), NASA Mars Fact Sheet
  MARS_SUNLIGHT_FRACTION: 0.43,
  // Custos (em % de bateria)
  OXYGEN_COST_PER_POINT: 1.5, // reciclar 1 ponto de O2 no habitat (MOXIE + reciclagem)
  SHIELD_DRAIN_PER_HOUR: 12.5, // blindagem contra radiacao ligada
  ISRU_DRAIN_PER_HOUR: 25, // fabrica de combustivel ligada
  DATA_UPLOAD_COST: 35, // enviar o pacote de dados cientificos para a Terra
};

export const RADIATION_CONFIG = {
  // [API, RadLab] Curiosity MSL-RAD, Cratera Gale: mediana 6,93 uGy/h (16/11-10/12/2022)
  MARS_SURFACE_DOSE_UGY_PER_HOUR: 6.93,
  // [Ref] Fator de qualidade medio na superficie de Marte ~3,05 (0,21 mGy/dia -> 0,64 mSv/dia),
  // Hassler et al., Science 343 (2014), dados do MSL-RAD
  QUALITY_FACTOR: 3.05,
  // [API, numeros-reais] pico de tempestade = centenas a mil vezes a dose normal.
  // Mapeamento do jogo: multiplicador = velocidade da CME em km/s, limitado a essa faixa.
  STORM_MULTIPLIER_PER_KMS: 1,
  STORM_MULTIPLIER_MIN: 250,
  STORM_MULTIPLIER_MAX: 1000,
  HABITAT_FACTOR: 0.25, // paredes do habitat seguram parte das particulas
  SHIELD_FACTOR: 0.2, // blindagem ligada
  // Dose acima desta taxa (mSv/h) machuca; abaixo, o corpo aguenta durante a tempestade
  HARM_THRESHOLD_MSV_PER_HOUR: 3,
  DAMAGE_PER_EXCESS_MSV: 1.5, // pontos de vida por mSv acima do limite
  // [Ref] limite de carreira de astronautas da NASA: 600 mSv (NASA-STD-3001, 2022)
  CAREER_LIMIT_MSV: 600,
  // Abrigo de tempestade com parede de agua (issue #56, A1).
  // [Ref] PREDICCS (Quinn et al., UNH, dados MSL/RAD): reducao media da dose das tempestades
  // solares de 2012 com agua: 1 g/cm2 -> 42 %, 5 g/cm2 -> 79 %, 10 g/cm2 (abrigo) -> 83 %.
  // Pares [g/cm2 de agua, fracao da dose que ainda passa].
  SHELTER_WATER_CURVE: [[0, 1], [1, 0.58], [5, 0.21], [10, 0.17]],
  // Escala de jogo: a parede cheia (40 L do tanque da base) vale 10 g/cm2, o abrigo do PREDICCS
  SHELTER_WALL_MAX_L: 40,
  SHELTER_G_CM2_PER_L: 0.25,
  SHELTER_FILL_STEP_L: 10,
};

export const STORM_CONFIG = {
  // [Ref] distancia media Sol-Marte: 227,9 milhoes de km (semieixo maior, NASA Mars Fact Sheet)
  SUN_MARS_DISTANCE_KM: 227.9e6,
  // 1 dia real de viagem da CME = 1 hora de jogo de aviso
  REAL_HOURS_PER_GAME_HOUR: 24,
  // So CMEs a partir de 500 km/s (classe C ou mais) viram tempestade no jogo
  MIN_SPEED_KMS: 500,
  FIRST_WARNING_AFTER_HOURS: 1,
  GAP_BETWEEN_STORMS_HOURS: 2,
  DURATION_HOURS: 3,
  // Controle de demo (menu "Demo controls"): aviso curto antes da tempestade chegar (~10 s reais)
  DEMO_LEAD_HOURS: 0.2,
};

export const MAV_CONFIG = {
  // Plataforma de lancamento, longe da base e da cratera de gelo
  PAD_POSITION: { x: 24, z: 20 },
  PAD_RADIUS: 4,
  INTERACT_RADIUS: 6,
  ICE_BLOCKS_FOR_FULL_TANK: 10,
  ISRU_HOURS_PER_ICE_BLOCK: 0.6,
  STORMS_TO_SURVIVE: 3,
  // [Ref] um astronauta consome ~0,84 kg de O2 por dia (NASA BVAD), usado para converter
  // os pontos de O2 do jogo em kg no resumo da vitoria
  OXYGEN_KG_PER_DAY: 0.84,
};

// Tripulacao NPC (issue #47). Taxas por hora de jogo (1 hora de jogo = 50 s reais).
// Agua : comida por tripulante segue o NASA BVAD (~3 kg : ~1,8 kg por pessoa/dia).
// O O2 do tripulante e pago em energia, como o O2 do jogador no habitat (reciclagem + MOXIE).
export const CREW_CONFIG = {
  MAX_CREW: 3,
  DEFAULT_CREW: 2,
  NAMES: ['Ana', 'Leo', 'Maya'],
  // Papeis da issue #48: escolher 1, 2 ou 3 tripulantes leva o engenheiro, depois a botanica,
  // depois a medica. Cada um comeca na sua estacao e rende mais nela.
  ROLES: [
    { title: 'Flight Engineer', specialties: ['oxygen', 'water'] },
    { title: 'Botanist', specialties: ['greenhouse'] },
    { title: 'Medical Officer', specialties: ['medbay'] },
  ],
  SPECIALIST_EFFORT: 1.5,
  SUIT_COLORS: [0xf97316, 0x22c55e, 0x3b82f6],
  OXYGEN_ENERGY_PER_HOUR: 1.5, // % de bateria por tripulante
  WATER_L_PER_HOUR: 0.5,
  FOOD_PER_HOUR: 0.3, // racoes
  START_FOOD: 15,
  MAX_FOOD: 40,
  EVACUATE_AFTER_HOURS: 12, // horas seguidas sem recurso ate voltar para a Terra
  ALERT_COOLDOWN_S: 30, // segundos reais entre avisos da mesma estacao
  WALK_SPEED: 2.2, // blocos por segundo real
  TALK_RADIUS: 2.6,
  TALK_FACING_DOT: 0.8, // precisa olhar para o tripulante (~37 graus) para conversar
  MAX_STEP_HOURS: 0.05,
};

// Modulo norte (issue #56, parte B): energia/aquecimento, cozinha, banheiro e oficina.
// Custos em % de bateria; "por hora" = hora de jogo (50 s reais). Fontes em docs/data/numeros-reais.md.
export const UTILITY_CONFIG = {
  // B2 aquecedor: gasta mais a noite, quando faz mais frio la fora e os paineis nao geram.
  // [Ref] InSight: media ~-62 C, minima -97,7 C (Elysium Planitia). Potencia em escala de jogo.
  HEATER_DAY_PER_HOUR: 1,
  HEATER_NIGHT_PER_HOUR: 4,
  // B3 cozinha: racao da despensa (compartilhada com a tripulacao) x refeicao fresca da estufa
  RATION_FOOD: 6,
  MEAL_WATER_L: 1,
  MEAL_POWER: 2,
  MEAL_HEAL: 2,
  // B4 banheiro: lavar gasta agua limpa, que vira agua cinza para o reciclador.
  // [Ref] ISS recupera ~98 % da agua (STATION_CONFIG.WATER_RECOVERY); filtro gasto recupera menos.
  WASH_WATER_L: 2,
  WASH_HEAL: 1,
  FILTER_WEAR_PER_HOUR: 2, // % do filtro do processador de agua por hora de jogo
  WORN_FILTER: 25, // abaixo disso a recuperacao cai
  WORN_RECOVERY: 0.7,
  FILTER_SERVICE_POWER: 3,
  // B5 oficina: impressora 3D transforma regolito em peca de reposicao
  PRINT_REGOLITH: 3,
  PRINT_POWER: 6,
  // Consumo exibido no painel de distribuicao (estimado a partir das regras do jogo)
  GAME_SECONDS_PER_HOUR: 50,
};

// Radio Terra-Marte (issue #56, A2). Fontes em docs/data/numeros-reais.md.
export const COMMS_CONFIG = {
  SPEED_OF_LIGHT_KM_S: 299792.458,
  AU_KM: 149597870.7,
  // [Ref] NASA/JPL: os comandos para Marte param quando o Sol fica a menos de ~2 graus de Marte
  // no ceu da Terra (conjuncao solar, a cada ~26 meses, ~2 semanas)
  CONJUNCTION_SUN_ANGLE_DEG: 2,
  // [Ref] 1 sol = 24 h 39 min = 1,0275 dia da Terra (Mars Fact Sheet): avanca a data real do jogo
  EARTH_DAYS_PER_SOL: 1.0275,
  // Escala de jogo: cada minuto real de viagem da luz vira 3 s de espera (ida e volta)
  GAME_SECONDS_PER_LIGHT_MINUTE: 3,
  // Conjuncao encenada uma vez por partida (a real so volta em 2028): comeca depois de
  // ~1,5 sol de jogo e dura 6 horas de jogo (5 min reais)
  GAME_CONJUNCTION_START_HOURS: 36,
  GAME_CONJUNCTION_HOURS: 6,
};

export const STATION_CONFIG = {
  WORK_ENERGY_PER_HOUR: 2, // % de bateria por estacao operada
  DEGRADE_PER_HOUR: 0.08, // sem operador a estacao estraga devagar
  REPAIR_PER_HOUR: 0.5,
  LOW_HEALTH: 0.5,
  GREENHOUSE_FOOD_PER_HOUR: 1.2,
  GREENHOUSE_MIN_HYDRATION: 20,
  // [Ref] O sistema de recuperacao de agua da ISS recupera ~98% da agua (NASA, 2023)
  WATER_RECOVERY: 0.98,
  WATER_RECYCLE_L_PER_HOUR: 3,
  LOW_WATER_L: 5,
  // Filtros de CO2 saturados: o O2 da base chega a custar o dobro de energia
  OXYGEN_MAX_COST_MULTIPLIER: 2,
  // Enfermaria: a medica cura o jogador dentro da base e avisa da radiacao alta
  MEDBAY_HEAL_PER_HOUR: 2, // pontos de vida por hora de jogo
  MEDBAY_LOW_HEALTH: 8,
  FILTER_DECAY: 0.2, CO2_RISE: 0.08, CO2_CLEAR: 0.12,
  DUST_DAMAGE: 0.015, DECONTAMINATION_COST: 2, FILTER_COST: 4,
  EXERCISE_COST: 3, TREATMENT_COST: 5, FOOD_COST: 3,
  COMMS_COST: 3, COMMS_DELAY: 40, SCIENCE_PER_SAMPLE: 2, UPGRADE_COST: 4,
  FITNESS_DECAY: 0.015, FRESH_FOOD_DURATION: 120,
  CROP_WATER_COST: 2, CROP_ENERGY_COST: 3, CROP_GROWTH_TIME: 60,
  CROP_NUTRITION: 5, TOOL_UPGRADE_COST: 4, MAV_REQUIRED_SAMPLES: 2,
  MAV_TRANSMISSION_COST: 5,
  SUIT_RADIATION_DAMAGE_FACTOR: 0.65,
};

// Historia em 3 atos (docs/superpowers/specs/2026-11-14-story-arc-design.md)
export const STORY_CONFIG = {
  // Horas de jogo que a janela de lancamento fica aberta depois da ultima tempestade (~6,7 min reais)
  WINDOW_HOURS: 8,
  // Tempestades sobrevividas que abrem a janela (o mesmo numero que o MAV exige)
  STORMS_FOR_WINDOW: MAV_CONFIG.STORMS_TO_SURVIVE,
  // Segundos reais que um card de radio fica na tela
  CARD_SECONDS: 12,
};

// Animacoes de chegada e de decolagem (docs/superpowers/plans/2026-11-14-story-arc.md)
export const CUTSCENE_CONFIG = {
  // Local de pouso da capsula: chao plano, a ~17 blocos da rampa onde o jogador nasce
  LANDING_SITE: { x: -13, z: 23 },
  ARRIVAL_SECONDS: 14.8,
  LAUNCH_SECONDS: 15.5,
  // Aceleracao do MAV na decolagem, em blocos/s^2 (escala de jogo)
  LAUNCH_ACCEL: 2.2,
};

// Design choices, not NASA agronomic measurements. Seconds are accelerated.
export const CROP_CONFIG = Object.freeze({
  lettuce: { water: 1, energy: 2, seconds: 7, nutrition: 3, strategy: 'Quick snack, small harvest' },
  potato: { water: 2, energy: 3, seconds: 12, nutrition: 6, strategy: 'Balanced meal, longer wait' },
  soy: { water: 3, energy: 5, seconds: 17, nutrition: 10, strategy: 'Big harvest, thirsty plants' },
});
