// @ts-nocheck
import { describe, it, expect } from 'vitest';
import {
  BLOCK_INTERACTION_CONFIG, CREW_CONFIG, ENERGY_CONFIG, MAV_CONFIG, MISSION_CONFIG, PACING_CONFIG,
  PHYSICS_CONFIG, RADIATION_CONFIG, STATION_CONFIG, STORM_CONFIG, SURVIVAL_CONFIG, UTILITY_CONFIG, WATER_SYSTEM_CONFIG,
  SAMPLE_SITE_CONFIG, SCIENCE_CONFIG,
} from './constants.ts';
import { SAMPLE_TYPES } from '../data/sampleTypes.ts';
import { isClueType } from '../mission/clues.ts';
import { pickForSpend, pointsOf, sampleItem, sciencePackage, scienceStatus } from '../mission/sciencePackage.ts';
import { UtilityModule } from '../core/UtilityModule.ts';
import { CrewManager } from '../crew/CrewManager.ts';
import { createStations } from '../crew/stations.ts';
import { Battery, solarChargePerHour } from '../mission/energy.ts';
import { passiveDemandFactor } from '../mission/pacing.ts';

// Ritmo do jogo (issue #81): os criterios de aceite escritos como contas sobre as constantes.
// Se um numero de balanceamento mudar e a base voltar a "zerar tudo junto", estes testes avisam.

const NIGHT_HOURS = 12; // o Sol fica abaixo do horizonte das 18h as 6h (MISSION_CONFIG.SUNRISE_HOUR)
const STEP_HOURS = 0.05;

// Base com a tripulacao padrao nos postos em que ela comeca (engenheiro no O2, botanica na estufa)
function makeBase({ charge = 100, water = 100, food = CREW_CONFIG.MAX_FOOD, demandFactor = 1 } = {}) {
  const battery = new Battery(charge);
  const base = {
    battery, water, maxWater: WATER_SYSTEM_CONFIG.MAX_BASE_WATER, food, maxFood: CREW_CONFIG.MAX_FOOD,
    graywater: 0, playerDoseRate: 0, playerHealth: 20, playerHeal: 0, demandFactor,
  };
  const crew = new CrewManager({ size: CREW_CONFIG.DEFAULT_CREW, stations: createStations(), base });
  const mission = { battery, chargeRate: 0, factoryOn: false, iceStock: 0, propellant: 0, shieldOn: false };
  const utility = new UtilityModule({ mission, survival: {}, stations: {}, base });
  utility.demandFactor = demandFactor;
  return { battery, base, crew, utility, mission };
}

// Roda `hours` horas de jogo com tudo ligado como no inicio da partida (aquecedor e luz da estufa)
function runBase(sim, hours, { night }) {
  sim.mission.chargeRate = night ? 0 : 10;
  for (let done = 0; done < hours - 1e-9; done += STEP_HOURS) {
    sim.crew.update(STEP_HOURS, 0);
    sim.utility.update(STEP_HOURS);
    sim.battery.drain(sim.utility.greenhouseLightsCost(STEP_HOURS / MISSION_CONFIG.GAME_HOURS_PER_SECOND));
  }
}

// % de bateria por hora de jogo que a base padrao gasta parada, lida do painel da sala de energia
function passiveDrawPerHour({ night }) {
  const sim = makeBase();
  sim.mission.chargeRate = night ? 0 : 10;
  const loads = sim.utility.loads({ crewSize: CREW_CONFIG.DEFAULT_CREW, operatingStations: CREW_CONFIG.DEFAULT_CREW });
  return loads.reduce((sum, [, rate, on]) => sum + (on ? rate : 0), 0);
}

// % de bateria que os paineis geram em um sol inteiro
function solarPerSol() {
  let total = 0;
  for (let hour = 0; hour < 24; hour += 0.01) total += solarChargePerHour(hour + 0.005) * 0.01;
  return total;
}

describe('EVA oxygen budget (issue #81)', () => {
  const secondsPerTank = SURVIVAL_CONFIG.MAX_STAT / SURVIVAL_CONFIG.OXYGEN_DRAIN_RATE;

  it('a full suit tank lasts at least 4 minutes of walking outside', () => {
    expect(secondsPerTank).toBeGreaterThanOrEqual(240);
  });

  it('walking to the ice crater, mining a full rocket load and coming back uses at most 60% of the tank', () => {
    const outerDoor = { x: 0.5, z: 8.85 }; // porta de fora do airlock (src/world/Airlock.js)
    const ice = WATER_SYSTEM_CONFIG.ICE_CRATER_CENTER;
    const straight = Math.hypot(ice.x - outerDoor.x, ice.z - outerDoor.z);
    // A crianca nao anda em linha reta: conta o dobro do caminho, na ida e na volta
    const walking = (2 * straight * 2) / PHYSICS_CONFIG.WALK_SPEED;
    // 10 blocos de gelo com a ferramenta mais lenta (sem comida fresca nem treino: 60% da velocidade)
    const mining = MAV_CONFIG.ICE_BLOCKS_FOR_FULL_TANK * (BLOCK_INTERACTION_CONFIG.BREAK_TIME / 0.6);
    // Folga para olhar em volta, mirar e passar duas vezes pelo airlock
    const slack = 60;
    const used = (walking + mining + slack) / secondsPerTank;
    expect(used).toBeLessThanOrEqual(0.6);
  });

  it('the rocket pad is also inside a comfortable round trip', () => {
    const pad = MAV_CONFIG.PAD_POSITION;
    const walking = (2 * Math.hypot(pad.x - 0.5, pad.z - 8.85) * 2) / PHYSICS_CONFIG.WALK_SPEED;
    expect((walking + 60) / secondsPerTank).toBeLessThanOrEqual(0.5);
  });
});

describe('storm shelter water wall (issue #228)', () => {
  it('the full wall is the 10 g/cm2 shelter of PREDICCS, whatever its size in liters', () => {
    const curve = RADIATION_CONFIG.SHELTER_WATER_CURVE;
    const fullGcm2 = curve[curve.length - 1][0];
    expect(RADIATION_CONFIG.SHELTER_WALL_MAX_L * RADIATION_CONFIG.SHELTER_G_CM2_PER_L).toBeCloseTo(fullGcm2);
  });

  it('filling it is a real choice: it fits in the base tank, but not in the starting water', () => {
    expect(RADIATION_CONFIG.SHELTER_WALL_MAX_L).toBeLessThanOrEqual(WATER_SYSTEM_CONFIG.MAX_BASE_WATER);
    expect(RADIATION_CONFIG.SHELTER_WALL_MAX_L).toBeGreaterThan(WATER_SYSTEM_CONFIG.INITIAL_BASE_WATER);
    // O passo do tutorial so pede um pouco de agua na parede: a agua inicial precisa dar
    expect(WATER_SYSTEM_CONFIG.INITIAL_BASE_WATER).toBeGreaterThanOrEqual(RADIATION_CONFIG.SHELTER_FILL_MIN_L);
  });
});

describe('solar storm warning (playtest of 15/11/2026)', () => {
  const secondsPerGameHour = 1 / MISSION_CONFIG.GAME_HOURS_PER_SECOND;

  it('even the shortest warning lets a child walk back from the ice crater into the shelter', () => {
    const outerDoor = { x: 0.5, z: 8.85 };
    const ice = WATER_SYSTEM_CONFIG.ICE_CRATER_CENTER;
    const shelter = { x: 4.3, z: 4.8 }; // meio do abrigo (HABITAT_LAYOUT.SHELTER_*)
    const straight = Math.hypot(ice.x - outerDoor.x, ice.z - outerDoor.z);
    const reading = 4; // ler o alerta e decidir
    const walking = (straight * 1.5) / PHYSICS_CONFIG.WALK_SPEED; // sem correr, sem linha reta
    const airlock = 4; // duas portas e a limpeza do traje
    const inside = Math.hypot(shelter.x - outerDoor.x, shelter.z - outerDoor.z) / PHYSICS_CONFIG.WALK_SPEED;
    const needed = reading + walking + airlock + inside;
    expect(STORM_CONFIG.MIN_WARNING_HOURS * secondsPerGameHour).toBeGreaterThanOrEqual(needed);
  });

  it('but the warning stays short: nobody waits more than 45 seconds for a storm', () => {
    // A CME mais lenta do DONKI embutido leva ~173 h reais ate Marte
    const slowest = 173 / STORM_CONFIG.WARNING_REAL_HOURS_PER_GAME_HOUR;
    expect(Math.max(slowest, STORM_CONFIG.MIN_WARNING_HOURS) * secondsPerGameHour).toBeLessThanOrEqual(45);
  });
});

describe('base energy pacing (issue #81)', () => {
  const day = passiveDrawPerHour({ night: false });
  const night = passiveDrawPerHour({ night: true });
  const passivePerSol = day * (24 - NIGHT_HOURS) + night * NIGHT_HOURS;
  const solar = solarPerSol();
  const shieldThroughOneStorm = ENERGY_CONFIG.SHIELD_DRAIN_PER_HOUR * STORM_CONFIG.DURATION_HOURS;
  const oneIceBlockOfFuel = ENERGY_CONFIG.ISRU_DRAIN_PER_HOUR * MAV_CONFIG.ISRU_HOURS_PER_ICE_BLOCK;
  const fullRocketTank = oneIceBlockOfFuel * MAV_CONFIG.ICE_BLOCKS_FOR_FULL_TANK;

  it('passive demand is 40% to 50% lower than before the fix (10.5 %/h by day, 13.5 %/h at night)', () => {
    expect(day / 10.5).toBeGreaterThanOrEqual(0.5);
    expect(day / 10.5).toBeLessThanOrEqual(0.6);
    expect(night / 13.5).toBeGreaterThanOrEqual(0.5);
    expect(night / 13.5).toBeLessThanOrEqual(0.6);
  });

  it('a battery that is full at dusk gets the default base through the night, with a small margin', () => {
    const sim = makeBase({ charge: ENERGY_CONFIG.BATTERY_CAPACITY });
    runBase(sim, NIGHT_HOURS, { night: true });
    expect(sim.battery.charge).toBeGreaterThan(10);
    // Margem pequena: a fabrica ligada a noite inteira ainda derruba a base
    expect(sim.battery.charge).toBeLessThan(30);
    expect(sim.battery.charge).toBeLessThan(fullRocketTank);
    expect(sim.crew.members.every((member) => member.state === 'working')).toBe(true);
  });

  it('the Sun pays for the whole sol of passive demand, so the base can be kept stable', () => {
    expect(solar).toBeGreaterThan(passivePerSol);
    // Antes da correcao: 12 x 10,5 + 12 x 13,5 = 288 % por sol contra ~164 % de Sol
    expect(solar).toBeLessThan(288);
  });

  // Em 15/11/2026 a fabrica e a blindagem ficaram pela metade: a sobra de um sol paga a blindagem
  // de uma tempestade, mas nao o foguete inteiro.
  it('the surplus pays for one storm shield, but not for the whole rocket: something must be turned off', () => {
    const surplus = solar - passivePerSol;
    expect(surplus).toBeGreaterThan(oneIceBlockOfFuel); // da para comecar a encher o foguete
    expect(surplus).toBeGreaterThan(shieldThroughOneStorm); // da para a blindagem de uma tempestade
    expect(surplus).toBeLessThan(fullRocketTank);
    expect(surplus).toBeLessThan(shieldThroughOneStorm + fullRocketTank / 2);
  });

  it('turning systems off still matters: what can be switched off pays for a real choice', () => {
    const lights = UTILITY_CONFIG.GREENHOUSE_LIGHTS_PER_HOUR * 24;
    const crewAtWork = CREW_CONFIG.DEFAULT_CREW * STATION_CONFIG.WORK_ENERGY_PER_HOUR * 24;
    expect(lights + crewAtWork).toBeGreaterThan(shieldThroughOneStorm);
    expect(lights).toBeGreaterThan(oneIceBlockOfFuel);
  });

  it('the first night is gentler than a normal one, and still costs power', () => {
    const first = makeBase({ demandFactor: passiveDemandFactor(18) });
    const normal = makeBase({ demandFactor: 1 });
    runBase(first, NIGHT_HOURS, { night: true });
    runBase(normal, NIGHT_HOURS, { night: true });
    const firstUsed = 100 - first.battery.charge;
    const normalUsed = 100 - normal.battery.charge;
    expect(firstUsed).toBeCloseTo(normalUsed * PACING_CONFIG.FIRST_SOL_DEMAND_FACTOR, 1);
    expect(firstUsed).toBeGreaterThan(30);
  });
});

// Ato 4 (issue #410): 3 amostras de cada um dos 5 tipos, meta de 30 pontos enviados. Tudo regra
// de jogo: os testes so garantem que a meta fecha com a coleta e que a bateria paga a ciencia.
describe('act 4 science goal (issue #410)', () => {
  const { POINTS_TO_LAUNCH, MAX_ITEMS_PER_UPLOAD, ANALYZE_POWER_COST, SUIT_UPGRADE_POINTS, TOOL_UPGRADE_POINTS } = SCIENCE_CONFIG;
  // As 15 amostras do mapa, ja analisadas, na ordem dos campos
  const mapSamples = () => SAMPLE_TYPES.flatMap((type, t) =>
    Array.from({ length: SAMPLE_SITE_CONFIG.PER_TYPE }, (_, i) => sampleItem(t * SAMPLE_SITE_CONFIG.PER_TYPE + i, { typeId: type.id, name: type.name, points: type.points })));
  // Envia tudo o que espera, uma passagem do orbitador por vez: devolve o custo de cada envio
  const uploadAll = (items, usedIds = new Set()) => {
    const sentIds = new Set();
    const costs = [];
    for (let pass = 0; pass < 20; pass += 1) {
      const pkg = sciencePackage(items, { sentIds, usedIds });
      if (pkg.items === 0) break;
      for (const item of pkg.upload) sentIds.add(item.id);
      costs.push(pkg.cost);
    }
    return { costs, status: scienceStatus(items, { sentIds, usedIds }) };
  };

  it('the 15 map samples alone reach the goal, and the goal cannot be met without collecting', () => {
    const samples = mapSamples();
    expect(samples).toHaveLength(SAMPLE_SITE_CONFIG.COUNT);
    expect(pointsOf(samples)).toBe(42);
    expect(pointsOf(samples)).toBeGreaterThanOrEqual(POINTS_TO_LAUNCH);
    const { status } = uploadAll(samples);
    expect(status).toMatchObject({ met: true, cluesSent: true, sentPoints: 42 });
    // So as 3 pistas (27 pontos) nao fecham a meta: areia ou meteorito tambem precisam ir
    const cluePoints = pointsOf(samples.filter((item) => isClueType(item.icon)));
    expect(cluePoints).toBeLessThan(POINTS_TO_LAUNCH);
    // Um campo inteiro a menos de qualquer pista: o foguete nao decola
    for (const type of SAMPLE_TYPES.filter((t) => isClueType(t.id))) {
      expect(uploadAll(samples.filter((item) => item.icon !== type.id)).status.met, type.id).toBe(false);
    }
  });

  it('the two lab upgrades still leave enough samples for the goal, and never take a clue sample', () => {
    const samples = mapSamples();
    const usedIds = new Set();
    for (const cost of [SUIT_UPGRADE_POINTS, TOOL_UPGRADE_POINTS]) {
      const pending = samples.filter((item) => !usedIds.has(item.id));
      const picked = pickForSpend(pending, cost);
      expect(picked).not.toBeNull();
      for (const item of picked) {
        expect(isClueType(item.icon)).toBe(false);
        usedIds.add(item.id);
      }
    }
    const { status } = uploadAll(samples, usedIds);
    expect(status.sentPoints).toBeGreaterThanOrEqual(POINTS_TO_LAUNCH);
    expect(status.met).toBe(true);
  });

  it('sending needs at least 2 orbiter passes, and the science of the act fits in the battery over one sol', () => {
    const { costs } = uploadAll(mapSamples());
    expect(costs.length).toBe(Math.ceil(SAMPLE_SITE_CONFIG.COUNT / MAX_ITEMS_PER_UPLOAD));
    expect(costs.length).toBeGreaterThanOrEqual(2);
    // Cada envio cabe com folga numa bateria cheia
    for (const cost of costs) expect(cost).toBeLessThan(ENERGY_CONFIG.BATTERY_CAPACITY / 2);
    const analysis = SAMPLE_SITE_CONFIG.COUNT * ANALYZE_POWER_COST;
    const uploads = costs.reduce((sum, cost) => sum + cost, 0);
    const science = analysis + uploads;
    // Uma bateria cheia paga toda a ciencia do ato (analisar as 15 e enviar)...
    expect(science).toBeLessThanOrEqual(ENERGY_CONFIG.BATTERY_CAPACITY);
    // ...e o Sol de um sol paga a base parada e a ciencia juntas
    const passivePerSol = passiveDrawPerHour({ night: false }) * (24 - NIGHT_HOURS) + passiveDrawPerHour({ night: true }) * NIGHT_HOURS;
    expect(solarPerSol() - passivePerSol).toBeGreaterThan(0);
    expect(solarPerSol() + ENERGY_CONFIG.BATTERY_CAPACITY - passivePerSol).toBeGreaterThan(science);
    // Mas nao e de graca: a ciencia custa mais que um bloco de gelo virando combustivel
    expect(science).toBeGreaterThan(ENERGY_CONFIG.ISRU_DRAIN_PER_HOUR * MAV_CONFIG.ISRU_HOURS_PER_ICE_BLOCK);
  });
});

// Agua vezes 10 (15/11/2026, spec do ato 1): os volumes da base sobem 10 vezes com os gastos
// junto; o que uma pessoa usa de uma vez fica no valor real e a energia por hora nao muda.
describe('base water times 10 (act 1 spec)', () => {
  it('the tank holds 1000 L and starts a quarter full', () => {
    expect(WATER_SYSTEM_CONFIG.MAX_BASE_WATER).toBe(1000);
    expect(WATER_SYSTEM_CONFIG.INITIAL_BASE_WATER).toBe(250);
  });

  it('the full shelter wall takes hundreds of liters, like a real one', () => {
    expect(RADIATION_CONFIG.SHELTER_WALL_MAX_L).toBe(600);
  });

  it('a full rover load fills half of the tank', () => {
    expect(WATER_SYSTEM_CONFIG.ICE_CARGO_MAX * WATER_SYSTEM_CONFIG.LITERS_PER_KG_ICE).toBe(WATER_SYSTEM_CONFIG.MAX_BASE_WATER / 2);
  });

  it('the recycler still costs 0.6% of battery per hour', () => {
    expect(STATION_CONFIG.WATER_RECYCLE_L_PER_HOUR * UTILITY_CONFIG.RECYCLER_POWER_PER_L).toBeCloseTo(0.6);
  });

  it('what one person uses at a time keeps its real size', () => {
    expect(WATER_SYSTEM_CONFIG.DRINK_AMOUNT_FROM_DISPENSER).toBe(2);
  });
});

describe('base water pacing (issue #81)', () => {
  // Meio sol = 20 minutos reais: cabe o ato 1 inteiro e a primeira viagem do rover ate o gelo
  const HOURS_WITHOUT_HELP = 12;
  // Pior caso para a agua: tripulacao comendo e trabalhando o tempo todo, com espaco na despensa
  // para a estufa produzir sem parar. A partida agora comeca com a despensa vazia
  // (CREW_CONFIG.START_FOOD = 0, as racoes saem da cozinha); sem comida a tripulacao para e gasta
  // menos agua, o que esconderia o ritmo da agua. Por isso a despensa aqui e fixa.
  const PANTRY_FOOD = 15;
  const start = () => makeBase({ water: WATER_SYSTEM_CONFIG.INITIAL_BASE_WATER, food: PANTRY_FOOD });

  it('the starting tank lasts at least half a sol with no ice', () => {
    const sim = start();
    runBase(sim, HOURS_WITHOUT_HELP, { night: false });
    expect(sim.base.water).toBeGreaterThan(STATION_CONFIG.LOW_WATER_L);
    expect(sim.crew.members.every((member) => member.state === 'working')).toBe(true);
  });

  // Canos congelados (aquecedor desligado de noite): o reciclador para, como se nao existisse
  const frozen = () => {
    const sim = start();
    sim.utility.heaterOn = false;
    return sim;
  };

  it('with the recycler stopped (frozen pipes) it does not last a whole sol', () => {
    const sim = frozen();
    runBase(sim, 24, { night: true });
    expect(sim.utility.cold).toBe(true);
    expect(sim.base.water).toBeLessThan(STATION_CONFIG.LOW_WATER_L);
  });

  it('with the recycler stopped, most of the used water waits as gray water, and the recycler is fast enough to keep up', () => {
    const sim = frozen();
    runBase(sim, HOURS_WITHOUT_HELP, { night: true });
    const used = WATER_SYSTEM_CONFIG.INITIAL_BASE_WATER - sim.base.water;
    expect(sim.base.graywater / used).toBeGreaterThan(0.8);
    const grayPerHour = sim.base.graywater / HOURS_WITHOUT_HELP;
    expect(STATION_CONFIG.WATER_RECYCLE_L_PER_HOUR).toBeGreaterThan(grayPerHour);
  });

  it('the automatic recycler keeps the tank going for a whole sol, paid by the battery', () => {
    const sim = start();
    runBase(sim, 24, { night: false });
    expect(sim.base.water).toBeGreaterThan(STATION_CONFIG.LOW_WATER_L);
    expect(sim.utility.waterRecycledL).toBeGreaterThan(0);
  });
});
