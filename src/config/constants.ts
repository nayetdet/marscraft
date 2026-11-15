// @ts-nocheck
import { marsSurfaceMedian } from '../data/radlabSummary.ts';

export const WORLD_CONFIG = {
  SIZE_X: 224,
  SIZE_Y: 48,
  SIZE_Z: 224,
  GROUND_LEVEL: 8,
};

// Disco nivelado sob a base (terrainGenerator.js). O nivel de referencia do terreno real
// (src/data/marsTerrain.js) e a media das alturas reais dentro do raio plano.
export const TERRAIN_CONFIG = {
  BASE_CENTER: { x: -4, z: 0 },
  BASE_FLAT_RADIUS: 28,
  BASE_BLEND_RADIUS: 36,
};

const DUST_STORM_MAP_EDGE_RADIUS = Math.min(
  WORLD_CONFIG.SIZE_X / 2 - Math.abs(TERRAIN_CONFIG.BASE_CENTER.x),
  WORLD_CONFIG.SIZE_Z / 2 - Math.abs(TERRAIN_CONFIG.BASE_CENTER.z)
);

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

// Modo "Shaders" (src/graphics/shaderMode/): sombra do Sol em tempo real, lampadas da base com
// sombra, brilho (bloom), raios de luz e tone mapping (comprime o claro sem mudar as cores). Sao
// escolhas visuais, nao dados da NASA. Fica desligado em GPU por
// software e em telas de toque, e se desliga sozinho se o jogo ficar lento.
export const GRAPHICS_CONFIG = {
  STORAGE_KEY: 'marscraft.shaders',
  // Sombra do Sol: mapa quadrado que acompanha a camera
  SHADOW_MAP_SIZE: 2048,
  // Meio lado (em blocos) da area que recebe sombra
  SHADOW_EXTENT: 52,
  // A area de sombra fica adiantada na direcao do olhar (fracao do meio lado)
  SHADOW_LOOK_AHEAD: 0.45,
  // Distancia da luz ate o centro da area (so precisa cobrir o relevo inteiro)
  SHADOW_LIGHT_DISTANCE: 170,
  // Altura minima da luz (componente y da direcao): evita sombras infinitas no por do sol.
  // A noite a luz vem espelhada de cima, como um luar fraco.
  SHADOW_MIN_ELEVATION: 0.2,
  // O mapa de sombra do Sol e refeito a cada N quadros (a area so anda junto com ele)
  SUN_SHADOW_FRAMES: 2,
  // Raio minimo (em blocos) para um objeto fazer sombra. Pecas menores (bracos da tripulacao,
  // itens das cestas, botoes) custavam centenas de desenhos por quadro e quase nao apareciam.
  SHADOW_CASTER_MIN_RADIUS: 0.4,
  SHADOW_BIAS: -0.0004,
  SHADOW_NORMAL_BIAS: 0.045,
  // Com sombra de verdade o Sol pode ser mais forte e a luz ambiente mais fraca (mais contraste)
  SUN_SCALE_DAY: 2.3,
  SUN_SCALE_NIGHT: 0.6,
  AMBIENT_SCALE: 0.5,
  HEMISPHERE_SCALE: 0.7,
  // Lampadas da base (luz primaria dos interiores): sem o Sol atravessando o teto, elas e que
  // iluminam os comodos. Fazem sombra propria (moveis, tripulacao) e a luz sai pelas janelas.
  // DECAY menor que o fisico (2) espalha a luz ate os cantos do comodo.
  ROOM_LIGHT_SCALE: 3.8,
  ROOM_LIGHT_DECAY: 1.15,
  // Alcance maximo de cada lampada com o modo ligado. Cada pixel dentro do alcance paga a conta
  // da sombra daquela lampada, entao alcance curto (so o comodo) e o que mais alivia a GPU.
  ROOM_LIGHT_MAX_DISTANCE: 20,
  ROOM_SHADOW_MAP_SIZE: 512,
  ROOM_SHADOW_BIAS: -0.003,
  ROOM_SHADOW_NORMAL_BIAS: 0.03,
  // Longe de todas as lampadas (a mais de RANGE vezes o alcance da mais proxima), nenhuma sombra
  // de lampada e refeita
  ROOM_SHADOW_RANGE: 2,
  // Dentro da base a luz ambiente cai (as lampadas e o Sol das janelas passam a mandar)
  INDOOR_AMBIENT_SCALE: 0.5,
  INDOOR_BLEND_SPEED: 1.8,
  // Blocos que brilham (luminaria, farol): mais fortes, para passarem do limiar do bloom
  EMISSIVE_SCALE: 2.4,
  // Disco do Sol em HDR: precisa ser mais claro que o ceu em volta para o bloom pegar nele
  SUN_DISC_BOOST: 5,
  // Exposicao da "camera": abre dentro da base e a noite, fecha no Sol (por segundo, suavizado)
  EXPOSURE_OUTSIDE: 0.95,
  EXPOSURE_INSIDE: 1.3,
  EXPOSURE_NIGHT_BOOST: 1.45,
  EXPOSURE_SPEED: 1.6,
  // Acabamento da imagem ja pronta: cor um pouco mais viva, mais contraste e cantos escurecidos
  GRADE_SATURATION: 1.14,
  GRADE_CONTRAST: 1.08,
  GRADE_VIGNETTE: 0.22,
  BLOOM_STRENGTH: 0.32,
  BLOOM_RADIUS: 0.55,
  BLOOM_THRESHOLD: 0.92,
  // Raios de luz: amostras por pixel (em meia resolucao), alcance, queda e forca
  GODRAYS_SAMPLES: 40,
  GODRAYS_DENSITY: 0.92,
  GODRAYS_DECAY: 0.955,
  GODRAYS_STRENGTH: 0.3,
  // Distancia (em blocos) a partir da qual um pixel conta como ceu aberto
  GODRAYS_SKY_DISTANCE: 300,
  // Protecao de desempenho (so no modo automatico): media abaixo de MIN_FPS por
  // GUARD_SECONDS desliga os shaders. Os primeiros segundos sao ignorados (compilacao).
  GUARD_MIN_FPS: 26,
  GUARD_SECONDS: 6,
  GUARD_WARMUP_SECONDS: 4,
};

export const INPUT_CONFIG = {
  MOUSE_SENSITIVITY: 0.0021, // radianos por pixel
  ZOOM_SENSITIVITY: 0.00055, // mais fina ao usar a luneta
  // Deltas acima disso num unico mousemove sao picos falsos do pointer lock (~60 graus de giro).
  MAX_MOUSE_DELTA: 500,
};

export const BLOCK_INTERACTION_CONFIG = {
  BREAK_TIME: 0.6,
  BREAK_PARTICLE_COUNT: 12,
  BREAK_PARTICLE_LIFETIME: 0.45,
  SURFACE_ROCK_BREAK_PARTICLE_COUNT: 4,
  SURFACE_ROCK_BREAK_PARTICLE_MIN_SIZE: 0.18,
  SURFACE_ROCK_BREAK_PARTICLE_SIZE_VARIANCE: 0.1,
  SURFACE_ROCK_BREAK_PARTICLE_HORIZONTAL_SPEED: 2.4,
  SURFACE_ROCK_BREAK_PARTICLE_UPWARD_SPEED: 1.8,
  SURFACE_ROCK_BREAK_PARTICLE_MIN_UPWARD_SPEED: 0.4,
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
  NO_SUIT_BASE_OXYGEN_DRAIN_RATE: 2, // tanque pessoal cheio dura 10 segundos sem traje na base
  BREACH_OXYGEN_DRAIN_RATE: 1.0, // pontos de O2 do jogador por segundo
  BASE_OXYGEN_LEAK_RATE: 5, // porcentagem por segundo, para qualquer abertura
  BASE_OXYGEN_REFILL_RATE: 2, // porcentagem por segundo após vedar a base
  WATER_DRAIN_RATE: 20 / 600, // hidratacao cheia dura 10 minutos
  FOOD_DRAIN_RATE: 0.11,
  STARVE_DAMAGE_RATE: 0.8,
  DANGER_THRESHOLD: 5,
  DAMAGE_FEEDBACK_SECONDS: 0.8,
  DAMAGE_SHAKE_AMPLITUDE: 0.09,
  DAMAGE_SHAKE_RATE: 42,
  // Abaixo deste O2 o corpo nao se recupera: nem a regeneracao natural nem a comida curam.
  HEAL_MIN_OXYGEN: 5,
  // Game balance, not measured suit specifications. Colder InSight temperatures increase use.
  SUIT_THERMAL_DRAIN_PER_SECOND: 100 / 720,
  SUIT_THERMAL_COLD_REFERENCE_C: -60,
  SUIT_THERMAL_COLD_RANGE_C: 100,
  SUIT_THERMAL_MAX_COLD_MULTIPLIER: 2,
  SUIT_THERMAL_CHARGE_PER_SECOND: 5,
  SUIT_THERMAL_ENERGY_PER_PERCENT: 0.02,
  SUIT_THERMAL_DAMAGE_PER_SECOND: 0.8,
  // Suit telemetry, CO2 scrubber, perchlorate dust, and armor-style wear (issue #167).
  SUIT_OXYGEN_DRAIN_PER_SECOND: 100 / 240, // 4 min full EVA tank -> 94% ~= 3m 45s
  SUIT_OXYGEN_RECHARGE_PER_SECOND: 15, // % per second while docked or inside pressurized base
  SUIT_OXYGEN_WARN_THRESHOLD: 30, // % outside warning trigger
  SUIT_OXYGEN_MIN_READY: 20, // minimum % to start EVA from Suitport
  SUIT_THERMAL_MIN_READY: 20,
  SUIT_SCRUBBER_DRAIN_PER_SECOND: 100 / 480, // ~8 min EVA CO2 scrubber capacity
  SUIT_SCRUBBER_CLEAN_PER_SECOND: 20, // % per second auto-cleaned when docked at Suitport
  SUIT_SCRUBBER_MIN_READY: 20,
  SUIT_SCRUBBER_LOW_THRESHOLD: 25, // below this, O2 consumption increases up to 1.5x
  SUIT_DUST_ACCUM_PER_SECOND: 0.35,
  SUIT_DUST_MOVE_MULTIPLIER: 2.0,
  SUIT_WEAR_PER_SECOND: 100 / 420, // ~7 min continuous EVA before suit wears out
  SUIT_WEAR_DUST_MULTIPLIER: 1.75,
  SUIT_REPAIR_POWER_COST: 4,
  SUIT_CLEAN_POWER_COST: 2,
  SUIT_NO_SUIT_O2_DRAIN_MULTIPLIER: 2.0,
  // Borda da area jogavel (parede de poeira), medida a partir de TERRAIN_CONFIG.BASE_CENTER.
  // Issue #103: a borda nao machuca mais. O vento de Marte nao derruba ninguem (o ar e fino
  // demais); quem limita a distancia e o ar do traje. No raio FATAL fica uma parede invisivel.
  DUST_STORM_FATAL_RADIUS: DUST_STORM_MAP_EDGE_RADIUS,
};

// Visual da nevoa na borda do mapa (src/sky/DustStormEffect.js); nao causa dano.
export const DUST_STORM_VISUAL_CONFIG = {
  OUTER_WALL_OPACITY: 1,
  EDGE_FOG_LEAD: 24,
  EDGE_FOG_MAX_DENSITY: 0.11,
  EDGE_DOME_MAX_OPACITY: 0.93,
  EDGE_WIND_PUSH: 0.45,
  WALL_BOTTOM_Y: -4,
  WALL_HEIGHT: 44,
  // A parede some perto da camera (entre estas distancias, em blocos) para nao virar um plano duro
  WALL_FADE_NEAR: 1.5,
  WALL_FADE_FAR: 8,
  DOME_RADIUS: 26,
  FOG_BASE_DENSITY: 0.0015,
  PARTICLE_COUNT: 1400,
  PARTICLE_BOX: { x: 36, y: 16, z: 36 },
  WIND_SPEED: 11, // blocos/s
  AMBIENT_PARTICLE_OPACITY: 0.22, // poeira baixa e constante ao ar livre, mesmo sem tempestade
  AMBIENT_WIND_SPEED: 1.4, // vento ambiente mais fraco que as rajadas da tempestade
};

export const WATER_SYSTEM_CONFIG = {
  MAX_BASE_WATER: 100, // Litros
  INITIAL_BASE_WATER: 25,
  ICE_CARGO_MAX: 50, // kg de gelo na caçamba do rover
  ICE_PER_DRILL: 10, // kg coletados por perfuração
  LITERS_PER_KG_ICE: 1.0, // 1 kg de gelo = 1 L de água purificada
  // Estufa (issue #101): a planta bebe do tanque so enquanto cresce e devolve quase tudo pelo ar
  // (transpiracao), que vira agua cinza para o reciclador. So o que fica na comida sai do ciclo.
  // [Ref] No Advanced Plant Habitat da ISS a agua transpirada e recuperada por condensacao e
  // volta ao reservatorio (Monje et al., 2020). A fracao de 90 % e escala de jogo.
  CROP_WATER_RETURN: 0.9,
  DRINK_AMOUNT_FROM_DISPENSER: 2.0, // L consumidos por gole no purificador da base
  ICE_CRATER_CENTER: { x: 30, z: -22 },
  ICE_DEPOT_POS: { x: 5.5, y: 9.0, z: 9.5 },
  WATER_DISPENSER_POS: { x: 10.4, y: 10.0, z: 1.5 },
};

// Bateria do rover (issue #111). Valores de jogo: a ficha do scanner cita os numeros reais do
// Curiosity. O rover so carrega estacionado no deposito da base, puxando da bateria da base:
// buscar gelo custa energia que tambem serve para o O2, a blindagem e a fabrica de combustivel.
// Uma viagem completa de gelo (ir a cratera, 5 perfuracoes, voltar) gasta cerca de um quarto
// a um terco da bateria do rover.
export const ROVER_CONFIG = {
  // Frente local do rover aponta para -Z; yaw PI deixa a doca e segue para fora da base (+Z).
  SPAWN_YAW: Math.PI,
  MAX_STEP_HEIGHT: 2.15, // blocos que o rover consegue subir, com margem para a suspensao
  START_BATTERY: 100, // %
  DRIVE_DRAIN_PER_SECOND: 0.5, // % por segundo real acelerando (frente ou re)
  DRILL_DRAIN: 4, // % por perfuracao
  // Abaixo disso o rover anda devagar e nao perfura. Ele ainda se arrasta com 0 %, para o
  // jogador nunca ficar preso longe da base.
  LOW_BATTERY: 15,
  LOW_BATTERY_SPEED_FACTOR: 0.35,
  CHARGE_PER_SECOND: 8, // % da bateria do rover por segundo real, parado no deposito
  // % da bateria da base por 1 % do rover: uma carga completa do rover custa 10 % da base
  BASE_COST_PER_ROVER_PERCENT: 0.1,
  // Mesmo raio da doca onde o rover descarrega o gelo (WATER_SYSTEM_CONFIG.ICE_DEPOT_POS)
  CHARGE_RADIUS: 5.8,
};

// Missao: energia, tempestades solares e o MAV (issue #30).
// Taxas "por hora de jogo": com GAME_HOURS_PER_SECOND = 0.02, 1 hora de jogo = 50 s reais.
// Fontes dos numeros reais em docs/data/numeros-reais.md.
export const MISSION_CONFIG = {
  AIRLOCK_COST: 1, AIRLOCK_CYCLE: 0.8, DOOR_SPEED: 10,
  // Limpeza eletrostatica do traje no airlock (segundos). Sem energia, o aviso fica na tela
  // SUIT_CLEAN_SKIP_TIME e a poeira entra na base. Ver docs/data/airlock-e-poeira.md
  SUIT_CLEAN_TIME: 0.8, SUIT_CLEAN_SKIP_TIME: 0.6,
  // Sem energia para o ciclo (AIRLOCK_COST), a porta abre na manivela: nunca tranca o jogador
  // la fora, mas demora estes segundos a mais (issue #79). Escala de jogo.
  AIRLOCK_MANUAL_EXTRA_SECONDS: 3,

  // Hora de jogo por segundo real (igual a MarsSkySystem.autoAdvanceSpeed): 1 hora de jogo
  // = 50 s reais e 1 sol de 24 h = 20 min reais. Toda taxa "por hora" do jogo usa este relogio.
  GAME_HOURS_PER_SECOND: 0.02,
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
  // Blindagem contra radiacao ligada. Anda junto com STORM_CONFIG.DURATION_HOURS: com a
  // tempestade de 0,2 h (10 s reais) uma tempestade inteira custa 22 % da bateria (era 25 %
  // com a tempestade de 1 h e 25 %/h). Esquecida ligada, esvazia a bateria em ~45 s.
  SHIELD_DRAIN_PER_HOUR: 110,
  // Fabrica de combustivel ligada. Anda junto com MAV_CONFIG.ISRU_HOURS_PER_ICE_BLOCK: um bloco
  // de gelo custa 7,5 % da bateria (era 15 % com 0,6 h por bloco e 25 %/h).
  ISRU_DRAIN_PER_HOUR: 50,
  // Gerador nuclear (issue #85). [Ref] O MMRTG do Curiosity e do Perseverance gera ~110 W de
  // eletricidade de dia e de noite, com calor do plutonio (NASA). Na base ele so paga o suporte
  // de vida minimo (O2 do jogador e da tripulacao, filtro de CO2): fabrica, blindagem, luz da
  // estufa e aquecedor continuam na bateria. Potencia em escala de jogo (% de bateria por hora).
  RTG_LIFE_SUPPORT_PER_HOUR: 2,
  // Quanto do RTG fica guardado para o suporte de vida, em horas de producao (sobra e perdida)
  RTG_BUFFER_HOURS: 0.25,
  // Reator de fissao tipo Kilopower: energia de dia e de noite, para a base toda.
  // [Ref] NASA Kilopower / KRUSTY (teste em Nevada, nov/2017 a mar/2018): 1 a 10 kW de eletricidade
  // por pelo menos 10 anos; 4 unidades dariam conta de um posto avancado (NASA, 02/05/2018).
  // Potencia em escala de jogo: paga o gasto parado da base a noite (~6 %/h), mas nao a fabrica
  // nem a blindagem. O custo dele e dose de radiacao: DOSE_CONFIG.REACTOR_MSV_PER_HOUR.
  REACTOR_CHARGE_PER_HOUR: 8,
  // Hora do aviso de por do sol (o Sol se poe as 18h): hora de conferir a bateria
  SUNSET_WARNING_HOUR: 16.5,
  // Abaixo disso (%) a bateria esta vazia: maquinas em espera, so o RTG mantem o ar
  STANDBY_BELOW: 1,
};

export const RADIATION_CONFIG = {
  // [API, RadLab] Curiosity MSL-RAD, Cratera Gale: mediana ~6,93 uGy/h (16/11-10/12/2022), lida de
  // src/data/radlabSummary.json (scripts/fetch-radlab-summary.mjs, issue #106)
  MARS_SURFACE_DOSE_UGY_PER_HOUR: marsSurfaceMedian(),
  // [Ref] Fator de qualidade medio na superficie de Marte ~3,05 (0,21 mGy/dia -> 0,64 mSv/dia),
  // Hassler et al., Science 343 (2014), dados do MSL-RAD
  QUALITY_FACTOR: 3.05,
  // Tempestade solar (issue #99). A dose TOTAL de uma tempestade, la fora e sem protecao, fica
  // entre dois eventos reais medidos pelo Curiosity (RAD) na superficie de Marte:
  // [Ref] 11/09/2017: a dose na superficie dobrou e ficou alta por ~2 dias (NASA JPL, 2017).
  //       No jogo: 2 x 6,93 uGy/h x 48 h = ~665 uGy
  STORM_DOSE_MIN_UGY: 665,
  // [Ref] 20/05/2024 (flare X12): 8.100 uGy, a maior tempestade ja medida em Marte, igual a
  //       "30 raios-X de torax" e nao letal (NASA, 2024). Nenhuma tempestade do jogo passa disso.
  STORM_DOSE_MAX_UGY: 8100,
  // Regra do jogo (nao e medida): CME mais rapida = tempestade mais forte, do minimo em
  // STORM_SPEED_MIN_KMS ate o recorde em STORM_SPEED_MAX_KMS. Golpe de raspao em Marte vale menos.
  STORM_SPEED_MIN_KMS: 300,
  STORM_SPEED_MAX_KMS: 1200,
  STORM_GLANCING_FACTOR: 0.75,
  HABITAT_FACTOR: 0.25, // paredes do habitat seguram parte das particulas
  SHIELD_FACTOR: 0.2, // blindagem ligada
  // Escala de jogo: dose acima desta taxa (mSv por hora de jogo) machuca. Calibrado para que
  // toda tempestade machuque la fora, as fortes machuquem dentro do habitat sem abrigo, e o
  // abrigo com a parede cheia ou a blindagem dentro do habitat protejam em qualquer tempestade.
  // Anda junto com STORM_CONFIG.DURATION_HOURS: a tempestade entrega a mesma dose total em menos
  // horas de jogo, entao a taxa por hora sobe na mesma proporcao (era 0,5 com 3 h de tempestade
  // e 1,5 com 1 h; agora a tempestade dura 0,2 h).
  HARM_THRESHOLD_MSV_PER_HOUR: 7.5,
  // Acima desta taxa o HUD mostra radiacao alta (ainda sem dano)
  WARN_MSV_PER_HOUR: 1.5, // era 0,1 com 3 h de tempestade e 0,3 com 1 h
  DAMAGE_PER_EXCESS_MSV: 3, // pontos de vida por mSv acima do limite (escala de jogo)
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
  // So entram na fila CMEs com impacto previsto em Marte pelo modelo WSA-ENLIL da NASA (DONKI).
  // Relogio da dose de radiacao: 1 hora de jogo = 1 dia real em Marte (radiation.ts)
  REAL_HOURS_PER_GAME_HOUR: 24,
  // O tempo de aviso e a viagem prevista da CME (saida do Sol ate a chegada em Marte), encolhida.
  // Teste com jogadores em 15/11/2026: esperar minutos pelo aviso parava o jogo. Agora 250 horas
  // reais de viagem = 1 hora de jogo. CME mais lenta da mais aviso: as do DONKI (38 a 173 h de
  // viagem) dao de 20 a 35 s reais.
  WARNING_REAL_HOURS_PER_GAME_HOUR: 250,
  // Aviso minimo: 0,4 h de jogo = 20 s reais. E o tempo justo para a crianca que esta no lugar
  // mais longe (a cratera de gelo, ~43 blocos da porta) ler o alerta (~4 s), voltar andando sem
  // correr e sem ir em linha reta (~10 s), passar pelo airlock (~4 s) e entrar no abrigo (~1 s).
  // balance.test.ts refaz essa conta: se a base ou a velocidade mudarem, o teste avisa.
  MIN_WARNING_HOURS: 0.4,
  // Calmaria antes do primeiro aviso e entre tempestades: 2 h de jogo = 100 s reais
  FIRST_WARNING_AFTER_HOURS: 0.4,
  GAP_BETWEEN_STORMS_HOURS: 2,
  // Horas de jogo de tempestade. Na mesma escala do aviso sao ~3 dias reais; a tempestade de
  // 2017 ficou alta por mais de 2 dias (NASA JPL)
  // Teste com jogadores em 15/11/2026: 3 h de jogo (2,5 min reais) parado no abrigo cansava.
  // Passou a 1 h (50 s reais) e, no mesmo dia, a 0,2 h (10 s reais): a espera ainda era longa.
  // A dose total da tempestade nao muda, so chega mais rapido: por isso HARM_THRESHOLD e WARN de
  // RADIATION_CONFIG sobem na mesma proporcao.
  DURATION_HOURS: 0.2,
  // Controle de demo (menu "Demo controls"): aviso curto antes da tempestade chegar (~10 s reais)
  DEMO_LEAD_HOURS: 0.2,
};

// Clima espacial ao vivo do NASA DONKI (issue #100). O fetch acontece uma vez, ao abrir o jogo,
// e cai no JSON embutido (src/data/donkiCme.json) se qualquer coisa der errado.
export const SPACE_WEATHER_CONFIG = {
  // Janelas pedidas ao DONKI. A API recusa (HTTP 400) janelas acima de 60 dias.
  CME_WINDOW_DAYS: 30,
  SEP_WINDOW_DAYS: 60,
  BULLETIN_WINDOW_DAYS: 7,
  // A DEMO_KEY aguenta ~10 pedidos por hora; cada abertura sem cache faz 3
  CACHE_TTL_MINUTES: 45,
  FETCH_TIMEOUT_MS: 5000,
  // SEP (particulas solares energeticas) so entra quando o fetch ao vivo trouxe uma; nunca inventamos.
  // Regras do jogo: a cada 3 tempestades, a 3a e um pico de SEP. As particulas voam quase na
  // velocidade da luz, entao o aviso e curto (15 s reais, menor que o de qualquer CME: da tempo correndo ou com a blindagem). O DONKI nao da a forca da SEP em Marte:
  // o pico usa a menor tempestade que o Curiosity mediu (RADIATION_CONFIG.STORM_DOSE_MIN_UGY).
  SEP_EVERY_N_STORMS: 3,
  SEP_WARNING_HOURS: 0.3,
};

export const MAV_CONFIG = {
  // Plataforma de lancamento, longe da base e da cratera de gelo
  PAD_POSITION: { x: 24, z: 20 },
  PAD_RADIUS: 4,
  INTERACT_RADIUS: 6,
  ICE_BLOCKS_FOR_FULL_TANK: 10,
  // Horas de jogo para a fabrica transformar 1 bloco de gelo em combustivel: 0,15 h = 7,5 s
  // reais (era 0,6 h = 30 s; teste com jogadores de 15/11/2026). Escala de jogo.
  ISRU_HOURS_PER_ICE_BLOCK: 0.15,
  STORMS_TO_SURVIVE: 3,
  // [Ref] um astronauta consome ~0,84 kg de O2 por dia (NASA BVAD), usado para converter
  // os pontos de O2 do jogo em kg no resumo da vitoria
  OXYGEN_KG_PER_DAY: 0.84,
};

// Ritmo do jogo (issue #81). Escala de jogo, nao e dado real.
// O primeiro sol e mais brando: os consumos passivos da base (ar, agua e comida da tripulacao,
// trabalho nas estacoes, aquecedor e luz da estufa) comecam em FIRST_SOL_DEMAND_FACTOR do normal
// e sobem em linha reta ate 100 % ao longo de RAMP_SOLS sols depois do primeiro.
// A producao nao muda: so o que a base gasta parada.
export const PACING_CONFIG = {
  FIRST_SOL_DEMAND_FACTOR: 0.6,
  RAMP_SOLS: 1,
  HOURS_PER_SOL: 24,
};

// Tripulacao NPC (issue #47). Taxas por hora de jogo (1 hora de jogo = 100 s reais).
// Agua : comida por tripulante segue o NASA BVAD (~3 kg : ~1,8 kg por pessoa/dia).
// Issue #81: ar, agua e comida cortados em 40-50 % (eram 1,5 / 0,5 / 0,3), mantendo a proporcao.
// O O2 do tripulante e pago em energia, como o O2 do jogador no habitat (reciclagem + MOXIE).
export const CREW_CONFIG = {
  COLLISION_DISTANCE: 0.9,
  MAX_CREW: 8,
  DEFAULT_CREW: 2,
  NAMES: ['Ana', 'Leo', 'Maya', 'Sam', 'Noor', 'Kai', 'Iris', 'Ravi'],
  // Papeis da issue #48: escolher 1, 2 ou 3 tripulantes leva o engenheiro, depois a botanica,
  // depois a medica. Cada um comeca na sua estacao e rende mais nela.
  ROLES: [
    { title: 'Flight Engineer', specialties: ['oxygen', 'water'] },
    { title: 'Botanist', specialties: ['greenhouse'] },
    { title: 'Medical Officer', specialties: ['medbay'] },
    { title: 'Power Engineer', specialties: ['oxygen'] },
    { title: 'Water Specialist', specialties: ['water'] },
    { title: 'Mission Specialist', specialties: ['rest'] },
    { title: 'Geologist', specialties: ['greenhouse'] },
    { title: 'Communications Officer', specialties: ['oxygen'] },
  ],
  SPECIALIST_EFFORT: 1.5,
  GREENHOUSE_HARVEST_INTERVAL: 20, // segundos de jogo ativo entre colheitas do tripulante
  SUIT_COLORS: [0xf97316, 0x22c55e, 0x3b82f6, 0xeab308, 0xec4899, 0x06b6d4, 0xa855f7, 0xf43f5e],
  OXYGEN_ENERGY_PER_HOUR: 0.75, // % de bateria por tripulante
  WATER_L_PER_HOUR: 0.3,
  FOOD_PER_HOUR: 0.18, // racoes
  START_FOOD: 15,
  MAX_FOOD: 40,
  // Horas seguidas sem ar, agua ou comida ate o tripulante ficar de repouso na enfermaria.
  // Ninguem volta para a Terra fora do foguete: a janela de lancamento so abre a cada ~26 meses.
  BEDRIDDEN_AFTER_HOURS: 12,
  // Horas de repouso, com ar, agua e comida em dia, ate voltar ao trabalho (escala de jogo)
  BED_REST_HOURS: 6,
  // Com alguem de plantao na enfermaria o repouso rende em dobro
  MEDIC_RECOVERY_SPEED: 2,
  // Blocos entre o posto da enfermaria e quem esta de repouso (no trilho, rumo ao hub),
  // para o avatar nao ficar em cima de quem trabalha ali
  BED_REST_OFFSET: 0.9,
  ALERT_COOLDOWN_S: 30, // segundos reais entre avisos da mesma estacao
  WALK_SPEED: 2.2, // blocos por segundo real
  TALK_RADIUS: 2.6,
  TALK_FACING_DOT: 0.8, // precisa olhar para o tripulante (~37 graus) para conversar
  MAX_STEP_HOURS: 0.05,
};

// Modulo norte (issue #56, parte B): energia/aquecimento, cozinha, banheiro e oficina.
// Custos em % de bateria; "por hora" = hora de jogo (100 s reais). Fontes em docs/data/numeros-reais.md.
export const UTILITY_CONFIG = {
  // B2 aquecedor: gasta mais quanto mais frio estiver la fora (issue #108). DAY = gasto no ar
  // mais quente do InSight (src/data/insightWeather.json), NIGHT = no mais frio; entre os dois,
  // proporcional a temperatura. Potencia em escala de jogo.
  // Issue #81: cortado pela metade (era 1 / 4) para a bateria cheia aguentar a noite.
  HEATER_DAY_PER_HOUR: 0.5,
  HEATER_NIGHT_PER_HOUR: 2,
  // Luz de cultivo da estufa: so gasta com a luz ligada (escala de jogo; era 2,5 antes da #81)
  GREENHOUSE_LIGHTS_PER_HOUR: 1.25,
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
  // Escala de jogo: cada minuto real de viagem da luz vira 0,35 s de espera. Com Marte a 11
  // minutos-luz, a resposta volta em ~8 s (era 3 s por minuto = ~66 s; teste de 15/11/2026).
  // O card do radio continua mostrando o atraso real em minutos.
  GAME_SECONDS_PER_LIGHT_MINUTE: 0.35,
  // Conjuncao encenada uma vez por partida (a real so volta em 2028): comeca depois de
  // ~1,5 sol de jogo e dura 6 horas de jogo (5 min reais)
  GAME_CONJUNCTION_START_HOURS: 36,
  GAME_CONJUNCTION_HOURS: 6,
};

export const STATION_CONFIG = {
  WORK_ENERGY_PER_HOUR: 1, // % de bateria por estacao operada (era 2 antes da #81)
  DEGRADE_PER_HOUR: 0.08, // sem operador a estacao estraga devagar
  REPAIR_PER_HOUR: 0.5,
  LOW_HEALTH: 0.5,
  GREENHOUSE_FOOD_PER_HOUR: 1.2,
  // Litros do tanque que a estufa da tripulacao usa por racao (escala de jogo; era 1 antes da
  // #81). Abaixo disso no tanque ela para: a ultima agua fica para beber.
  GREENHOUSE_WATER_L_PER_FOOD: 0.5,
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
  EXERCISE_COST: 3, TREATMENT_COST: 5,
  COMMS_COST: 3, COMMS_DELAY: 40, SCIENCE_PER_SAMPLE: 2, UPGRADE_COST: 4,
  FITNESS_DECAY: 0.015, FRESH_FOOD_DURATION: 120,
  TOOL_UPGRADE_COST: 4,
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
  // Passeio pela base depois do pouso: segundos em cada lugar. As frases tem ate 5 palavras e
  // ficam na tela a no maximo 2 palavras por segundo (regra do jogo, para dar tempo de ler)
  TOUR_STOP_SECONDS: 3,
  // Segundos da frase da rotina (gelo, foguete, base), no fim do passeio
  TOUR_ROUTINE_SECONDS: 4.4,
  // Segundos da previa da missao: a tripulacao embarca e o foguete parte rumo a Terra
  TOUR_MISSION_SECONDS: 6.6,
  // Aceleracao do foguete nessa previa, em blocos/s^2: mais forte que a da decolagem de verdade
  // (LAUNCH_ACCEL), porque a previa dura poucos segundos
  PREVIEW_LAUNCH_ACCEL: 7,
  LAUNCH_SECONDS: 15.5,
  // Aceleracao do MAV na decolagem, em blocos/s^2 (escala de jogo)
  LAUNCH_ACCEL: 2.2,
};

// Tamanho de cada tipo de campo da estufa: multiplica o custo de plantar (agua e energia) e o
// numero de itens da colheita. Campo maior rende mais, mas bebe mais agua de uma vez.
export const GREENHOUSE_PLOT_YIELD = Object.freeze({ garden: 1, inner: 2, outer: 3 });

// Design choices, not NASA agronomic measurements. Seconds are accelerated.
// `water` = litros do tanque da base que a planta bebe ate ficar pronta, por unidade de tamanho
// do campo (GREENHOUSE_PLOT_YIELD); `energy` = % de bateria ao plantar.
export const CROP_CONFIG = Object.freeze({
  lettuce: { water: 1, energy: 2, seconds: 5, nutrition: 3, strategy: 'Quick snack, small harvest' },
  potato: { water: 2, energy: 3, seconds: 7, nutrition: 6, strategy: 'Balanced meal, longer wait' },
  soy: { water: 3, energy: 5, seconds: 9, nutrition: 10, strategy: 'Big harvest, thirsty plants' },
});

// Dose de radiacao acumulada como orcamento da missao (issue #104). Fontes em
// docs/data/numeros-reais.md, secao "Dose da missao".
export const DOSE_CONFIG = {
  // [Ref] Curiosity RAD medindo dentro da nave a caminho de Marte: 1,8 mSv por dia
  // (Zeitlin et al., Science 340, 2013; SwRI/NASA). So a ida e a volta: 0,66 +- 0,12 Sv.
  TRANSIT_MSV_PER_DAY: 1.8,
  // [Ref] Mars 2020: 30/07/2020 a 18/02/2021 = 203 dias de viagem. 203 x 1,8 = ~365 mSv
  // antes de pisar em Marte: a barra de dose ja abre em ~61 % do limite de 600 mSv.
  TRANSIT_DAYS: 203,
  // Escala de jogo (declarada, nao e medida). A dose normal da superficie usa o relogio das
  // tempestades (STORM_CONFIG.REAL_HOURS_PER_GAME_HOUR: 1 hora de jogo = 1 dia real), e toda a
  // dose que entra na barra (calmaria, tempestade, dentro e fora) e multiplicada por GAME_FACTOR.
  // Resultado: 1 hora de jogo vale ~8 dias reais em Marte, e ~60 horas de jogo (2,5 sols) somam
  // a dose de uma estadia real de ~500 dias. As proporcoes entre la fora, habitat, escudo e
  // abrigo sao as mesmas de radiation.js.
  GAME_FACTOR: 8,
  // Reator de fissao ligado (ENERGY_CONFIG.REACTOR_CHARGE_PER_HOUR): mSv por hora de jogo que
  // entram na barra, dentro ou fora da base. REGRA DO JOGO, nao e medida: o reator do jogo fica
  // perto da base para o cabo ser curto. Um reator de verdade fica longe ou atras de um escudo
  // pesado, e esse e o trade-off real (distancia e massa do escudo x dose da tripulacao).
  // Uma noite inteira (12 h) com ele ligado soma 24 mSv: ~10 % do que sobra da barra na chegada.
  REACTOR_MSV_PER_HOUR: 2,
  // Acima desta fracao do limite de carreira a barra fica amarela e a medica avisa
  WARN_FRACTION: 0.85,
  // Traje melhorado (StationSystem.upgrade): a mesma fracao que ele tira do dano la fora
  SUIT_FACTOR: STATION_CONFIG.SUIT_RADIATION_DAMAGE_FACTOR,
  // Comandante acima do limite: o rover leva o gelo direto para o MAV. Uma perfuracao do rover
  // (ICE_PER_DRILL kg) vale um bloco de gelo do tanque do foguete (escala de jogo).
  ROVER_ICE_KG_PER_MAV_BLOCK: WATER_SYSTEM_CONFIG.ICE_PER_DRILL,
  // Distancia do rover ao centro da plataforma do MAV para descarregar o gelo (blocos)
  ROVER_MAV_REACH: 8,
};

// Gerador de O2 com dois modos (issue #102). Fontes em docs/data/numeros-reais.md.
// "Air from water" = eletrolise, como o OGA da Estacao Espacial: 2 H2O -> 2 H2 + O2.
// "Air from Mars air" = MOXIE do rover Perseverance: tira o O2 do CO2 do ar de Marte.
export const OXYGEN_PLANT_CONFIG = {
  // [Ref] Quimica da eletrolise: 36 g de agua dao 32 g de O2 (NASA ICES 2024; OGA, NASA 2015)
  WATER_KG_PER_O2_KG: 36 / 32,
  // [Ref] NASA BVAD: 0,84 kg de O2 por pessoa por dia. Com a razao acima: 0,945 L de agua por
  // pessoa por sol. Agua e contada como 1 kg = 1 L, como no resto do jogo.
  O2_KG_PER_PERSON_DAY: 0.84,
  // Escala de jogo (nao ha potencia oficial para uma base): por ponto de O2, o MOXIE gasta
  // MOXIE_ENERGY_FACTOR vezes a energia da eletrolise. A eletrolise usa os custos que ja existiam
  // (ENERGY_CONFIG.OXYGEN_COST_PER_POINT e CREW_CONFIG.OXYGEN_ENERGY_PER_HOUR).
  ELECTROLYSIS_ENERGY_FACTOR: 1,
  MOXIE_ENERGY_FACTOR: 2,
  // [Ref] Sabatier (ISS): CO2 + 4 H2 -> CH4 + 2 H2O. O hidrogenio que sai no metano limita a
  // recuperacao a ~50 % (NASA ICES 2024): devolve metade da agua da eletrolise.
  SABATIER_WATER_RETURN: 0.5,
  // Custo de montar o reator de Sabatier na impressora 3D (escala de jogo)
  SABATIER_REGOLITH: 3,
  SABATIER_POWER: 8,
  // Avisos do tripulante: o modo escolhido esta gastando o recurso que esta acabando
  LOW_WATER_WARN_L: 10,
  LOW_BATTERY_WARN_PCT: 25,
};

// Tempestade de poeira como clima (issue #103): corta a energia solar, nao machuca ninguem.
// Fontes em docs/data/numeros-reais.md ("Poeira e tempestades de poeira").
export const DUST_WEATHER_CONFIG = {
  // [Ref] Opacidade (tau) media no local do Opportunity: ~0,5 (NASA JPL, recuperacao do
  // Opportunity, 08/2018). Tau alto = menos luz do Sol chega ao chao.
  TAU_CLEAR: 0.5,
  // [Ref] Opportunity, 10/06/2018: tau 10,8, o recorde na superficie (NASA JPL, 2018)
  TAU_RECORD: 10.8,
  // Escala de jogo: o pico de cada tempestade e sorteado entre isto e o recorde real
  PEAK_TAU_MIN: 7,
  // Regra de jogo: geracao solar com o tau no recorde (nunca zero de dia). Entre o ceu limpo e
  // o recorde a geracao cai em linha reta.
  SOLAR_FACTOR_AT_RECORD: 0.2,
  // Escala de jogo (horas de jogo; 1 h = 100 s reais). O clima so comeca no ato 2 da historia.
  FIRST_STORM_AFTER_HOURS: [8, 16],
  GAP_BETWEEN_STORMS_HOURS: [24, 36],
  WARNING_HOURS: 2,
  STORM_HOURS: [6, 9],
  RAMP_HOURS: 1.5, // o tau sobe ate o pico nas primeiras horas da tempestade
  CLEARING_HOURS: 3, // a poeira baixa devagar depois
  // Controle de demo / admin: aviso curto antes da tempestade chegar (~10 s reais)
  DEMO_LEAD_HOURS: 0.1,
  // Poeira nos paineis (0 = limpo, 1 = coberto). Escala de jogo: bem mais rapido que o real,
  // para o jogador ver o efeito numa partida curta.
  PANEL_DUST_PER_HOUR: 0.006,
  PANEL_DUST_STORM_PER_HOUR: 0.05,
  PANEL_DUST_MAX_LOSS: 0.7, // painel todo coberto ainda gera 30 %
  START_PANEL_DUST: 0.1,
  // Limpar os paineis a mao (no campo solar, a oeste da sala de energia): cada vez tira esta
  // poeira e gasta ar do traje (pontos de O2, de 20). Esperar custa energia; limpar custa ar.
  CLEAN_STEP: 0.25,
  CLEAN_O2_COST: 1,
  CLEAN_RADIUS: 10, // blocos do centro do campo solar
  // [Ref] Ventos e redemoinhos limparam os paineis do Spirit e do Opportunity ("cleaning
  // events", NASA JPL). Escala de jogo: rajada do sol (InSight) acima do limite tira poeira.
  WIND_CLEAN_GUST_MS: 20,
  WIND_CLEAN_PER_MS: 0.02,
  // Visual: tau em que o ceu fica marrom escuro de vez
  HAZE_FULL_TAU: 6,
  // Visual com a poeira no maximo (src/sky/DustStormEffect.js e MarsSkySystem.js)
  WEATHER_FOG_DENSITY: 0.035,
  WEATHER_DOME_OPACITY: 0.55,
  WEATHER_PARTICLE_OPACITY: 0.85,
  WEATHER_FRONT_OPACITY: 0.9, // frente de poeira no horizonte durante o aviso
  WEATHER_WIND: { x: -0.94, z: 0.34 }, // direcao do vento da tempestade (vem do leste)
  SUN_DIM: 0.65, // fracao da luz do Sol que some no pico
  SUN_SHRINK: 0.75, // o disco do Sol encolhe ate virar um ponto fraco
};

// Clima real do InSight por sol (issue #108). Os valores vem de src/data/insightWeather.json.
export const WEATHER_CONFIG = {
  // Forma da curva de temperatura dentro do sol (aproximacao de jogo): minima pouco antes do
  // nascer do Sol (SUNRISE_HOUR = 6) e maxima no comeco da tarde
  COLDEST_HOUR: 5,
  WARMEST_HOUR: 14,
  // Hora do relatorio do tempo (nascer do Sol)
  REPORT_HOUR: 6,
};

// Pacote de ciencia para a Terra e tubos de amostra no foguete (issue #105). Escala de jogo.
// [Ref] Os rovers mandam quase todo o dado por orbitadores (Mars Relay Network, NASA/JPL), em
// passagens que carregam um volume limitado: daqui vem o limite de itens por envio.
// [Ref] O Perseverance guarda amostras em tubos para uma futura missao de retorno, que usaria
// um foguete de subida (MAV); massa a mais no foguete pede mais combustivel.
export const SCIENCE_CONFIG = {
  // Minimo enviado para a vitoria: N descobertas do scanner OU M amostras analisadas
  MIN_DISCOVERIES: 5,
  MIN_SAMPLES: 2,
  // Custo do envio em % de bateria: base (ligar o radio e falar com o orbitador) + por item
  UPLOAD_BASE_COST: 8,
  UPLOAD_COST_PER_ITEM: 3,
  // Itens por envio (uma passagem do orbitador). O resto espera o proximo envio.
  MAX_ITEMS_PER_UPLOAD: 8,
  // Analisar 1 amostra de regolito no laboratorio (% de bateria)
  ANALYZE_POWER_COST: 2,
  // Cada tubo de amostra no MAV pede mais gelo para encher o tanque. Muito mais do que um tubo de
  // verdade pesa: regra de jogo, para a escolha "levar mais ciencia x buscar mais gelo" aparecer.
  ICE_PER_SAMPLE_TUBE: 1,
  MAX_SAMPLE_TUBES: 4,
};

// Diario de bordo por sol (issue #106). Escala de jogo, so de interface.
export const MISSION_LOG_CONFIG = {
  MAX_ENTRIES: 200, // linhas guardadas na partida (as mais antigas saem)
  // Cliques seguidos na mesma decisao (encher a parede do abrigo de 10 em 10 L) dentro deste
  // intervalo, em horas de jogo, viram uma linha so
  MERGE_HOURS: 1,
  SUMMARY_CARD_MS: 9000, // resumo do fim do sol na tela
  STUDY_CARD_MS: 7000, // estudo real da NASA revelado
  EARTH_FACT_INTRO_MS: 1900, // abertura "DISCOVERY!" no meio da tela, antes do card do fato (issue #216)
  EARTH_FACT_CARD_MS: 9000, // card do fato "Space science on Earth" ganho na estufa
  EARTH_FACT_GAP_MS: 600, // pausa entre dois fatos ganhos na mesma colheita
};

// Dormir no beliche do dormitorio (issue #109): substitui o avanco de tempo gratis da tecla T.
// Escala de jogo, exceto o que esta marcado [Ref]. Fontes em docs/data/numeros-reais.md.
export const SLEEP_CONFIG = {
  NAP_HOURS: 2,
  // "Sleep until sunrise" so de noite: o Sol fica abaixo do horizonte das 18h as 6h
  // (MarsSkySystem); o nascer do sol e MISSION_CONFIG.SUNRISE_HOUR.
  NIGHT_FROM_HOUR: 18,
  // Enquanto dorme o relogio corre 3 horas de jogo por segundo real (uma noite passa em ~3 s)
  CLOCK_HOURS_PER_SECOND: 3,
  // A cada passo (6 min de jogo) a base anda e o jogo checa se algo acorda o jogador
  STEP_HOURS: 0.1,
  // Fome e sede do jogador por hora de jogo dormindo (barras de 20 pontos). Escala de jogo:
  // acordado a barra de comida dura ~1,8 h de jogo, entao a mesma taxa matava qualquer um que
  // dormisse. Dormindo o corpo gasta menos (taxa de sono = 1,0x o metabolismo basal, contra
  // ~1,75x na media de um dia ativo, FAO/WHO/UNU 2004); aqui uma noite de 9 h gasta ~metade
  // da comida e ~1/3 da agua, entao comer e beber antes de deitar e parte da escolha.
  FOOD_PER_HOUR: 1.2,
  WATER_PER_HOUR: 0.8,
  // Com comida ou agua neste nivel o jogador acorda (e nao consegue pegar no sono)
  WAKE_NEED_LEVEL: 4,
  // Ar minimo da base (%) para poder dormir
  MIN_BASE_OXYGEN: 50,
  // CO2 do habitat (%) que dispara o alarme da tripulacao (igual ao aviso do HUD)
  CO2_ALARM: 40,
  // Mais de 1 sol (24 h de jogo) acordado: o trabalho fica mais lento (getWorkSpeed)
  TIRED_AFTER_HOURS: 24,
  // Cada hora dormida paga 3 horas acordado (8 h de sono "zeram" um dia inteiro). Escala de jogo.
  REST_PER_HOUR_SLEPT: 3,
  // [Ref] Barger et al., Lancet Neurology 2014: 64 astronautas do onibus espacial e 21 da
  // Estacao Espacial dormiram ~6 h por noite, com 8,5 h reservadas na agenda.
  ASTRONAUT_SLEEP_HOURS: 6,
  ASTRONAUT_SCHEDULED_SLEEP_HOURS: 8.5,
};

// Eventos aleatorios de Marte (issue #107): meteoro, tremor, eclipse de Fobos, redemoinho de poeira,
// geada e aurora. Quando e quanto duram e ESCALA DE JOGO; os fatos reais de cada evento estao em
// src/mission/eventText.js e docs/data/numeros-reais.md. A agenda sai de uma semente (eventDirector.js).
export const EVENTS_CONFIG = Object.freeze({
  // Eventos sorteados (a aurora nao entra: ela vem depois de uma tempestade solar sobrevivida)
  RANDOM_TYPES: Object.freeze(['meteor', 'marsquake', 'eclipse', 'dustDevil', 'frost']),
  // Horas de jogo do inicio do ato 2 ate o primeiro evento (1 h de jogo = 100 s reais)
  FIRST_DELAY_HOURS: Object.freeze([1, 2]),
  // Horas de jogo entre o fim de um evento e o inicio do proximo, na agenda sorteada
  GAP_HOURS: Object.freeze([2.5, 5]),
  // Intervalo minimo garantido entre dois eventos, mesmo depois de adiar um deles
  MIN_GAP_HOURS: 1.5,
  // Durante uma tempestade solar nenhum evento comeca: ele espera esta folga depois de checar de novo
  POSTPONE_HOURS: 0.5,
  // A agenda cobre este tanto de horas de jogo depois do ato 2 (bem mais que uma partida)
  HORIZON_HOURS: 240,
  // Duracao de cada evento em segundos reais. O eclipse usa os ~40 s do eclipse real filmado pelo
  // Perseverance; os outros sao escala de jogo, so o tempo de ver a animacao.
  DURATION_SECONDS: Object.freeze({ meteor: 12, marsquake: 8, eclipse: 40, dustDevil: 36, frost: 50, aurora: 60 }),
  // Janelas da hora do dia em que cada evento pode comecar: [de, ate). O eclipse precisa do Sol
  // alto; a geada aparece no nascer do Sol (MISSION_CONFIG.SUNRISE_HOUR = 6); a aurora, de noite.
  WINDOWS: Object.freeze({ eclipse: Object.freeze([9, 15]), frost: Object.freeze([5.4, 6.4]), aurora: Object.freeze([20, 28]) }),

  // Segundos do card do evento na tela (tem um fato real para ler; OK ou Enter fecham antes)
  CARD_SECONDS: 20,

  // Meteoro: cratera nova num ponto afastado da base, com gelo exposto no fundo
  METEOR_MIN_DISTANCE: 40, // blocos do centro da base (fora da area construida, raio 36)
  METEOR_MAX_DISTANCE: 46, // dentro da area segura (antes da tempestade da borda, raio 52)
  METEOR_MIN_PLAYER_DISTANCE: 14, // nunca cai em cima do jogador nem do rover
  METEOR_CRATER_RADIUS: 4, // blocos (a cratera real de 2021 tem ~150 m: aqui e escala de jogo)
  METEOR_CRATER_DEPTH: 3,
  METEOR_ICE_RADIUS: 2.4, // fundo da cratera que vira gelo exposto

  // Tremor: uma estacao da tripulacao perde saude (conserta com a impressora 3D da oficina)
  QUAKE_STATION_DAMAGE: 0.35,
  QUAKE_SHAKE: 0.11, // blocos de balanco da camera no pico
  METEOR_SHAKE: 0.06,

  // Eclipse de Fobos: fracao da luz do Sol e da carga solar cortada no meio do eclipse.
  // Escala de jogo: Fobos e menor que o Sol visto de Marte, entao a queda real e parcial.
  ECLIPSE_SUNLIGHT_DROP: 0.4,

  // Redemoinho: limpa esta fracao da poeira dos paineis se passar pelo campo solar (#103)
  DUST_DEVIL_PANEL_CLEAN: 0.3,
  DUST_DEVIL_SPEED: 2.6, // blocos/s
  DUST_DEVIL_HIT_RADIUS: 3, // perto disso o jogador fica no meio da poeira
  DUST_DEVIL_BLIND_SECONDS: 3,
});
