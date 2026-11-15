// @ts-nocheck
import { describe, it, expect } from 'vitest';
import {
  BLOCK_INTERACTION_CONFIG, CREW_CONFIG, ENERGY_CONFIG, MAV_CONFIG, MISSION_CONFIG, PACING_CONFIG,
  PHYSICS_CONFIG, STATION_CONFIG, STORM_CONFIG, SURVIVAL_CONFIG, UTILITY_CONFIG, WATER_SYSTEM_CONFIG,
} from './constants.ts';
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
    // Margem pequena: ligar a blindagem ou a fabrica a noite ainda derruba a base
    expect(sim.battery.charge).toBeLessThan(30);
    expect(sim.battery.charge).toBeLessThan(shieldThroughOneStorm);
    expect(sim.crew.members.every((member) => member.state === 'working')).toBe(true);
  });

  it('the Sun pays for the whole sol of passive demand, so the base can be kept stable', () => {
    expect(solar).toBeGreaterThan(passivePerSol);
    // Antes da correcao: 12 x 10,5 + 12 x 13,5 = 288 % por sol contra ~164 % de Sol
    expect(solar).toBeLessThan(288);
  });

  it('but the surplus does not pay for the choices: something must be turned off', () => {
    const surplus = solar - passivePerSol;
    expect(surplus).toBeGreaterThan(oneIceBlockOfFuel); // da para comecar a encher o foguete
    expect(surplus).toBeLessThan(shieldThroughOneStorm); // nao da para a blindagem de uma tempestade
    expect(surplus).toBeLessThan(fullRocketTank);
    expect(surplus).toBeLessThan(shieldThroughOneStorm + oneIceBlockOfFuel);
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

describe('base water pacing (issue #81)', () => {
  // Meio sol = 20 minutos reais: cabe o ato 1 inteiro e a primeira viagem do rover ate o gelo
  const HOURS_WITHOUT_HELP = 12;
  // Pior caso para a agua: tripulacao comendo e trabalhando o tempo todo, com espaco na despensa
  // para a estufa produzir sem parar. A partida agora comeca com a despensa vazia
  // (CREW_CONFIG.START_FOOD = 0, as racoes saem da cozinha); sem comida a tripulacao para e gasta
  // menos agua, o que esconderia o ritmo da agua. Por isso a despensa aqui e fixa.
  const PANTRY_FOOD = 15;
  const start = () => makeBase({ water: WATER_SYSTEM_CONFIG.INITIAL_BASE_WATER, food: PANTRY_FOOD });

  it('the starting tank lasts at least half a sol with nobody at the recycler and no ice', () => {
    const sim = start();
    runBase(sim, HOURS_WITHOUT_HELP, { night: false });
    expect(sim.base.water).toBeGreaterThan(STATION_CONFIG.LOW_WATER_L);
    expect(sim.crew.members.every((member) => member.state === 'working')).toBe(true);
  });

  it('but it does not last a whole sol: water still needs the recycler or the rover', () => {
    const sim = start();
    runBase(sim, 24, { night: false });
    expect(sim.base.water).toBeLessThan(STATION_CONFIG.LOW_WATER_L);
  });

  it('most of the used water is waiting as gray water, and the recycler is fast enough to keep up', () => {
    const sim = start();
    runBase(sim, HOURS_WITHOUT_HELP, { night: false });
    const used = WATER_SYSTEM_CONFIG.INITIAL_BASE_WATER - sim.base.water;
    expect(sim.base.graywater / used).toBeGreaterThan(0.8);
    const grayPerHour = sim.base.graywater / HOURS_WITHOUT_HELP;
    expect(STATION_CONFIG.WATER_RECYCLE_L_PER_HOUR).toBeGreaterThan(grayPerHour);
  });
});
