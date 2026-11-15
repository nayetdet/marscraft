import { describe, it, expect } from 'vitest';
import { MissionSystem, mavProgress, oxygenPointsToKg } from './MissionSystem.js';
import { DOSE_CONFIG, ENERGY_CONFIG, MAV_CONFIG, SCIENCE_CONFIG, MISSION_CONFIG, RADIATION_CONFIG, STORM_CONFIG, SURVIVAL_CONFIG } from '../config/constants.js';
import { TRANSIT_DOSE_MSV } from './doseBudget.js';

// CME com impacto direto previsto em Marte 3 dias depois (3 horas de jogo de aviso)
const cmes = [{
  id: 'cme', startTime: '2026-11-05T20:00Z', speedKmS: 900,
  headedToMars: true, marsArrivalTime: '2026-11-08T20:00Z', isGlancingBlow: false,
}];

function createMission(startHours = 12) {
  return new MissionSystem({ cmes, startHours });
}

describe('mavProgress', () => {
  it('averages the three requirements and is ready only when all are done', () => {
    expect(mavProgress({ propellant: 0, stormsSurvived: 0, dataSent: false }).overallPct).toBe(0);
    const half = mavProgress({ propellant: 50, stormsSurvived: 0, dataSent: true });
    expect(half.overallPct).toBeCloseTo(50);
    expect(half.ready).toBe(false);
    expect(mavProgress({ propellant: 100, stormsSurvived: 3, dataSent: true }).ready).toBe(true);
  });
});

describe('MissionSystem energy', () => {
  it('charges in daylight and not at night', () => {
    const day = createMission(12);
    day.battery.charge = 10;
    day.update(13);
    expect(day.battery.charge).toBeGreaterThan(10);

    const night = createMission(0);
    night.battery.charge = 10;
    night.update(2);
    expect(night.battery.charge).toBe(10);
  });

  it('a dust storm cuts the solar charge and nobody gets hurt by it (issue #103)', () => {
    const clear = createMission(10);
    clear.dustWeather.panelDust = 0;
    clear.update(11);
    const dusty = createMission(10);
    dusty.dustWeather.panelDust = 0;
    dusty.dustWeather.force('storm');
    const damage = dusty.update(11);
    expect(dusty.dustWeather.phase).toBe('storm');
    expect(dusty.chargeRate).toBeLessThan(clear.chargeRate * 0.7);
    expect(dusty.chargeRate).toBeGreaterThan(0); // de dia nunca zera
    expect(damage).toBe(0);
  });

  it('worn air filters (crew oxygen generator) make habitat oxygen cost more', () => {
    const mission = createMission(0);
    mission.battery.charge = 6;
    mission.oxygenCostMultiplier = 2;
    expect(mission.oxygenRefillBudget()).toBeCloseTo(6 / (2 * ENERGY_CONFIG.OXYGEN_COST_PER_POINT));
    mission.chargeOxygen(1);
    expect(mission.battery.charge).toBeCloseTo(6 - 2 * ENERGY_CONFIG.OXYGEN_COST_PER_POINT);
  });

  it('oxygen refill is limited by the battery and costs energy', () => {
    const mission = createMission(0);
    mission.battery.charge = 3;
    expect(mission.oxygenRefillBudget()).toBeCloseTo(3 / ENERGY_CONFIG.OXYGEN_COST_PER_POINT);
    mission.chargeOxygen(2);
    expect(mission.battery.charge).toBeCloseTo(0);
    expect(mission.oxygenProducedPoints).toBe(2);
  });

  it('the shield only lowers the dose of a player inside its bubble', () => {
    const mission = createMission(12);
    mission.battery.charge = 100;
    mission.update(12.1, { insideShield: true });
    const unshielded = mission.doseRate;
    mission.toggleShield();
    mission.update(12.2, { insideShield: true });
    expect(mission.doseRate).toBeLessThan(unshielded);
    mission.update(12.3, { insideShield: false });
    expect(mission.doseRate).toBeCloseTo(unshielded);
    expect(mission.insideShield).toBe(false);
  });

  it('the shield drains energy and turns itself off when the battery is empty', () => {
    const mission = createMission(0);
    mission.battery.charge = 5;
    mission.toggleShield();
    mission.update(2);
    expect(mission.shieldOn).toBe(false);
    expect(mission.drainEvents().some((e) => e.type === 'shield-off-no-energy')).toBe(true);
  });

});

describe('MissionSystem science package (issue #105)', () => {
  const { UPLOAD_BASE_COST: BASE, UPLOAD_COST_PER_ITEM: PER_ITEM, MIN_DISCOVERIES, MIN_SAMPLES, MAX_ITEMS_PER_UPLOAD } = SCIENCE_CONFIG;

  it('cannot complete the science goal with nothing scanned or analyzed this mission', () => {
    const mission = createMission(0);
    mission.battery.charge = 100;
    const result = mission.sendData({ discoveries: 0, samples: 0 });
    expect(result.status).toBe('empty');
    expect(mission.dataSent).toBe(false);
    expect(mission.battery.charge).toBe(100);
    expect(mission.progress.ready).toBe(false);
  });

  it('costs more energy for a bigger package', () => {
    const mission = createMission(0);
    const small = mission.sciencePackage({ discoveries: 1, samples: 0 });
    const big = mission.sciencePackage({ discoveries: 4, samples: 2 });
    expect(small.cost).toBe(BASE + PER_ITEM);
    expect(big.cost).toBe(BASE + 6 * PER_ITEM);
    expect(big.cost).toBeGreaterThan(small.cost);
  });

  it('needs enough charge for the whole upload', () => {
    const mission = createMission(0);
    mission.battery.charge = BASE + 2 * PER_ITEM - 1;
    const result = mission.sendData({ discoveries: 2, samples: 0 });
    expect(result).toMatchObject({ status: 'no-energy', cost: BASE + 2 * PER_ITEM });
    expect(mission.sentDiscoveries).toBe(0);
  });

  it('allows partial uploads, each paying the radio start again, until the minimum is home', () => {
    const mission = createMission(0);
    mission.battery.charge = 100;
    const first = mission.sendData({ discoveries: MIN_DISCOVERIES - 2, samples: 0 });
    expect(first).toMatchObject({ status: 'sent', discoveries: MIN_DISCOVERIES - 2, samples: 0, dataSent: false });
    expect(mission.dataSent).toBe(false);
    // Nada novo: o mesmo pacote nao e enviado duas vezes
    expect(mission.sendData({ discoveries: MIN_DISCOVERIES - 2, samples: 0 }).status).toBe('empty');

    const second = mission.sendData({ discoveries: MIN_DISCOVERIES, samples: 0 });
    expect(second).toMatchObject({ status: 'sent', discoveries: 2, dataSent: true });
    expect(mission.dataSent).toBe(true);
    expect(mission.uploads).toBe(2);
    expect(mission.battery.charge).toBeCloseTo(100 - (2 * BASE + MIN_DISCOVERIES * PER_ITEM));
  });

  it('also counts analyzed samples, which go first, and caps one upload at an orbiter pass', () => {
    const mission = createMission(0);
    mission.battery.charge = 100;
    const result = mission.sendData({ discoveries: MAX_ITEMS_PER_UPLOAD, samples: MIN_SAMPLES });
    expect(result).toMatchObject({ samples: MIN_SAMPLES, discoveries: MAX_ITEMS_PER_UPLOAD - MIN_SAMPLES, leftAfter: MIN_SAMPLES, dataSent: true });
    expect(mission.sciencePackage({ discoveries: MAX_ITEMS_PER_UPLOAD, samples: MIN_SAMPLES }).items).toBe(MIN_SAMPLES);
  });
});

describe('MissionSystem sample tubes on the MAV', () => {
  const { ICE_PER_SAMPLE_TUBE, MAX_SAMPLE_TUBES } = SCIENCE_CONFIG;

  it('only loads analyzed samples, up to the rack size', () => {
    const mission = createMission(0);
    expect(mission.loadSampleTube(0)).toBe('no-samples');
    for (let i = 0; i < MAX_SAMPLE_TUBES; i++) expect(mission.loadSampleTube(99)).toBe('loaded');
    expect(mission.loadSampleTube(99)).toBe('full');
    expect(mission.sampleTubes).toBe(MAX_SAMPLE_TUBES);
  });

  it('asks for more ice for every tube loaded', () => {
    const mission = createMission(0);
    expect(mission.iceNeeded()).toBe(MAV_CONFIG.ICE_BLOCKS_FOR_FULL_TANK);
    mission.loadSampleTube(2);
    mission.loadSampleTube(2);
    expect(mission.iceForFullTank()).toBe(MAV_CONFIG.ICE_BLOCKS_FOR_FULL_TANK + 2 * ICE_PER_SAMPLE_TUBE);
    expect(mission.iceNeeded()).toBe(MAV_CONFIG.ICE_BLOCKS_FOR_FULL_TANK + 2 * ICE_PER_SAMPLE_TUBE);
  });

  it('turns a full tank into a partly full one, and gives the fuel back when the tube comes out', () => {
    const mission = createMission(0);
    mission.propellant = 100;
    mission.loadSampleTube(1);
    const full = MAV_CONFIG.ICE_BLOCKS_FOR_FULL_TANK;
    expect(mission.propellant).toBeCloseTo((100 * full) / (full + ICE_PER_SAMPLE_TUBE));
    expect(mission.iceNeeded()).toBe(ICE_PER_SAMPLE_TUBE);
    expect(mission.progress.ready).toBe(false);
    expect(mission.unloadSampleTube()).toBe('unloaded');
    expect(mission.propellant).toBeCloseTo(100);
    expect(mission.unloadSampleTube()).toBe('empty');
  });

  it('fills the heavier rocket with the extra ice through the factory', () => {
    const mission = createMission(12);
    mission.battery.charge = 100;
    mission.loadSampleTube(1);
    const need = mission.iceNeeded();
    expect(mission.deliverIce(need + 3)).toBe(need);
    mission.update(12 + need * MAV_CONFIG.ISRU_HOURS_PER_ICE_BLOCK + 0.1);
    expect(mission.propellant).toBe(100);
  });
});

describe('MissionSystem propellant', () => {
  it('turns delivered ice into propellant using energy', () => {
    const mission = createMission(0);
    mission.battery.charge = 100;
    expect(mission.deliverIce(2)).toBe(2);
    mission.update(2 * MAV_CONFIG.ISRU_HOURS_PER_ICE_BLOCK);
    expect(mission.propellant).toBeCloseTo(200 / MAV_CONFIG.ICE_BLOCKS_FOR_FULL_TANK);
    expect(mission.battery.charge).toBeLessThan(100);
  });

  it('stops without energy and when the factory is off', () => {
    const mission = createMission(0);
    mission.battery.charge = 0;
    mission.deliverIce(1);
    mission.update(1);
    expect(mission.propellant).toBe(0);

    mission.battery.charge = 100;
    mission.toggleFactory();
    mission.update(2);
    expect(mission.propellant).toBe(0);
  });

  it('does not accept more ice than the tank needs', () => {
    const mission = createMission(0);
    expect(mission.deliverIce(50)).toBe(MAV_CONFIG.ICE_BLOCKS_FOR_FULL_TANK);
    expect(mission.deliverIce(1)).toBe(0);
  });
});

describe('MissionSystem storms', () => {
  it('warns, starts, and counts a storm as survived when the player lives', () => {
    const mission = createMission(0);
    const storm = mission.schedule[0];
    mission.update(storm.warningStart + 0.01);
    const warning = mission.drainEvents().find((e) => e.type === 'storm-warning');
    expect(warning.storm).toBe(storm);
    // O aviso dura a viagem que a NASA previu para a CME
    expect(warning.hoursUntil).toBeCloseTo(3, 1);

    mission.update(storm.arrival + 0.01, { insideHabitat: true });
    expect(mission.drainEvents().map((e) => e.type)).toContain('storm-start');
    expect(mission.doseRate).toBeGreaterThan(0.1);

    mission.update(storm.end + 0.01, { insideHabitat: true });
    expect(mission.drainEvents().map((e) => e.type)).toContain('storm-survived');
    expect(mission.stormsSurvived).toBe(1);
  });

  it('dying during the storm does not count', () => {
    const mission = createMission(0);
    const storm = mission.schedule[0];
    mission.update(storm.arrival + 0.01);
    mission.markDeath();
    mission.update(storm.end + 0.01);
    expect(mission.stormsSurvived).toBe(0);
    expect(mission.drainEvents().map((e) => e.type)).toContain('storm-failed');
  });

  it('a storm outside without shield hurts, and the dose adds up', () => {
    const mission = createMission(0);
    const storm = mission.schedule[0];
    mission.update(storm.arrival + 0.01);
    const damage = mission.update(storm.arrival + 0.51);
    expect(damage).toBeGreaterThan(0);
    expect(mission.totalDoseMsv).toBeGreaterThan(1);
  });

  it('a big time jump (T key) still goes through the storm', () => {
    const mission = createMission(0);
    mission.update(mission.schedule[0].end + 0.5, { insideHabitat: true });
    const types = mission.drainEvents().map((e) => e.type);
    expect(types).toEqual(expect.arrayContaining(['storm-warning', 'storm-start', 'storm-survived']));
  });

  it('paused time moves storms but does not add dose, and a paused storm does not count', () => {
    const mission = createMission(0);
    const storm = mission.schedule[0];
    const damage = mission.update(storm.end - 0.1, { active: false });
    expect(damage).toBe(0);
    expect(mission.totalDoseMsv).toBe(TRANSIT_DOSE_MSV);
    mission.update(storm.end + 0.1, { active: false });
    expect(mission.stormsSurvived).toBe(0);
    expect(mission.drainEvents().map((e) => e.type)).toContain('storm-missed');
  });
});

describe('MissionSystem without storms headed to Mars (issue #99)', () => {
  const elsewhere = [{ id: 'to-earth', startTime: '2026-11-05T20:00Z', speedKmS: 1500, headedToMars: false }];

  it('keeps the queue empty instead of using CMEs that went somewhere else', () => {
    const mission = new MissionSystem({ cmes: elsewhere, startHours: 0 });
    expect(mission.schedule).toEqual([]);
    expect(mission.noStormData).toBe(true);
    mission.update(100);
    expect(mission.storm.phase).toBe('calm');
    expect(mission.drainEvents().some((e) => e.type.startsWith('storm'))).toBe(false);
    expect(mission.triggerStormSoon()).toBe(false);
  });

  it('does not lock the rocket behind storms that will never come', () => {
    const mission = new MissionSystem({ cmes: elsewhere, startHours: 0 });
    mission.propellant = 100;
    mission.dataSent = true;
    expect(mission.stormsSurvived).toBe(0);
    expect(mission.stormCredit).toBe(MAV_CONFIG.STORMS_TO_SURVIVE);
    expect(mission.progress.ready).toBe(true);
  });

  it('still asks for the storms while the story has not started them', () => {
    const mission = new MissionSystem({ cmes: elsewhere, startHours: 0, stormsStarted: false });
    expect(mission.noStormData).toBe(false);
    expect(mission.stormCredit).toBe(0);
  });
});

describe('MissionSystem launch', () => {
  it('ignites only when everything is ready', () => {
    const mission = createMission(0);
    expect(mission.ignite()).toBe(false);
    mission.propellant = 100;
    mission.stormsSurvived = 3;
    mission.dataSent = true;
    expect(mission.ignite()).toBe(true);
    expect(mission.launched).toBe(true);
  });
});

describe('oxygenPointsToKg', () => {
  it('one sol of breathing outside equals 0.84 kg of O2', () => {
    expect(oxygenPointsToKg(SURVIVAL_CONFIG.OXYGEN_DRAIN_RATE * 24 / MISSION_CONFIG.GAME_HOURS_PER_SECOND)).toBeCloseTo(0.84);
  });

  it('keeps space weather calm until the story starts the storms', () => {
    const mission = new MissionSystem({ cmes, startHours: 0, stormsStarted: false });
    mission.update(60, { insideHabitat: false });
    expect(mission.storm.phase).toBe('calm');
    expect(mission.stormsSurvived).toBe(0);
    expect(mission.drainEvents().some((e) => e.type.startsWith('storm'))).toBe(false);
  });

  it('schedules the first warning from the hour the storms start, only once', () => {
    const mission = new MissionSystem({ cmes, startHours: 0, stormsStarted: false });
    mission.update(30);
    mission.startStorms(30);
    expect(mission.schedule[0].warningStart).toBe(30 + STORM_CONFIG.FIRST_WARNING_AFTER_HOURS);

    mission.startStorms(50);
    expect(mission.schedule[0].warningStart).toBe(30 + STORM_CONFIG.FIRST_WARNING_AFTER_HOURS);

    mission.update(30 + STORM_CONFIG.FIRST_WARNING_AFTER_HOURS + 0.01);
    expect(mission.storm.phase).toBe('warning');
  });
});

describe('MissionSystem demo storm control', () => {
  it('brings the next real CME forward: warning now, storm after the short lead', () => {
    const mission = createMission(12);
    expect(mission.storm.phase).toBe('calm');
    expect(mission.triggerStormSoon(0.2)).toBe(true);

    mission.update(12.05);
    expect(mission.storm.phase).toBe('warning');
    expect(mission.drainEvents().map((e) => e.type)).toContain('storm-warning');

    mission.update(12.3);
    expect(mission.storm.phase).toBe('active');
    expect(mission.storm.storm.cme.id).toBe('cme');
  });

  it('refuses while a storm is already active and never delays a storm', () => {
    const mission = createMission(12);
    mission.triggerStormSoon(0.2);
    mission.update(12.3);
    expect(mission.triggerStormSoon(0.2)).toBe(false);

    const other = createMission(12);
    other.triggerStormSoon(0.2);
    const arrival = other.schedule[0].arrival;
    other.triggerStormSoon(5);
    expect(other.schedule[0].arrival).toBe(arrival);
  });

  it('the demo storm works with the shelter water wall', () => {
    const mission = createMission(12);
    mission.triggerStormSoon(0.2);
    mission.shelterWaterL = 40;
    mission.update(12.3, { insideHabitat: true });
    const habitat = mission.doseRate;
    mission.update(12.4, { insideHabitat: true, insideShelter: true });
    expect(mission.doseRate).toBeLessThan(habitat);
  });
});

describe('MissionSystem with live SEPs (issue #100)', () => {
  it('builds the storm queue with the real SEPs it was given, only when storms start', () => {
    const seps = [{ id: 'sep', eventTime: '2025-11-15T03:42Z', seenBy: ['STEREO A'] }];
    const mission = new MissionSystem({ cmes, seps, startHours: 12, stormsStarted: false });
    expect(mission.schedule).toEqual([]);
    mission.startStorms(12);
    expect(mission.schedule.some((s) => s.sep === seps[0])).toBe(true);
    expect(createMission().schedule.some((s) => s.sep)).toBe(false);
  });
});

// Issue #104: dose acumulada como orcamento da missao
describe('MissionSystem dose budget', () => {
  // Sem tempestades na fila: so a dose normal de Marte
  const calmMission = (startHours = 12) => new MissionSystem({ cmes, startHours, stormsStarted: false });

  it('starts with the real trip dose: 203 days x 1.8 mSv = ~365 of 600 mSv', () => {
    const mission = calmMission();
    expect(TRANSIT_DOSE_MSV).toBeCloseTo(365.4, 1);
    expect(mission.totalDoseMsv).toBeCloseTo(365.4, 1);
    expect(mission.doseBreakdown.fraction).toBeCloseTo(0.609, 3);
    expect(mission.grounded).toBe(false);
  });

  it('a long walk outside on a calm day fills the bar visibly, more than staying inside', () => {
    const outside = calmMission();
    outside.update(18); // 6 horas de jogo = 10 minutos reais
    const evaDose = outside.doseBreakdown.eva;
    expect(evaDose / RADIATION_CONFIG.CAREER_LIMIT_MSV).toBeGreaterThan(0.03);

    const inside = calmMission();
    inside.update(18, { insideHabitat: true });
    expect(inside.doseBreakdown.habitat).toBeGreaterThan(0);
    expect(inside.doseBreakdown.habitat).toBeCloseTo(evaDose * RADIATION_CONFIG.HABITAT_FACTOR, 6);
  });

  it('the dose never goes down, whatever the player does', () => {
    const mission = createMission(0);
    let last = mission.totalDoseMsv;
    const places = [{}, { insideHabitat: true }, { insideHabitat: true, insideShelter: true }, { active: false }];
    for (let h = 0.5; h < 30; h += 0.5) {
      mission.update(h, places[Math.floor(h * 2) % places.length]);
      expect(mission.totalDoseMsv).toBeGreaterThanOrEqual(last);
      last = mission.totalDoseMsv;
    }
    const b = mission.doseBreakdown;
    expect(b.transit + b.eva + b.storm + b.habitat).toBeCloseTo(mission.totalDoseMsv, 6);
    expect(b.storm).toBeGreaterThan(0);
  });

  it('the water wall shelter cuts the storm dose that adds up', () => {
    const stormDose = (wallL) => {
      const mission = createMission(0);
      mission.shelterWaterL = wallL;
      const storm = mission.schedule[0];
      mission.update(storm.arrival, { insideHabitat: true, insideShelter: true });
      const before = mission.doseBreakdown.storm;
      mission.update(storm.end - 0.01, { insideHabitat: true, insideShelter: true });
      return mission.doseBreakdown.storm - before;
    };
    const empty = stormDose(0);
    const full = stormDose(RADIATION_CONFIG.SHELTER_WALL_MAX_L);
    expect(empty).toBeGreaterThan(0);
    expect(full).toBeCloseTo(empty * 0.17, 3);
  });

  it('the suit upgrade cuts the dose that adds up outside', () => {
    const plain = calmMission();
    plain.update(16);
    const upgraded = calmMission();
    upgraded.update(16, { suitUpgraded: true });
    expect(upgraded.doseBreakdown.eva).toBeCloseTo(plain.doseBreakdown.eva * DOSE_CONFIG.SUIT_FACTOR, 6);
  });

  it('passing the limit grounds the commander, warns once, and the mission can still be won', () => {
    const mission = calmMission();
    mission.addDose(RADIATION_CONFIG.CAREER_LIMIT_MSV * DOSE_CONFIG.WARN_FRACTION - mission.totalDoseMsv + 0.1);
    expect(mission.drainEvents().map((e) => e.type)).toEqual(['dose-warning']);
    mission.addDose(RADIATION_CONFIG.CAREER_LIMIT_MSV);
    mission.addDose(10);
    expect(mission.drainEvents().map((e) => e.type)).toEqual(['dose-limit']);
    expect(mission.grounded).toBe(true);
    expect(mission.doseBreakdown.grounded).toBe(true);

    // Nao e game over: o rover entrega o gelo, a fabrica enche o tanque e o foguete decola
    mission.battery.charge = 100;
    mission.deliverIce(MAV_CONFIG.ICE_BLOCKS_FOR_FULL_TANK);
    let hours = 12;
    while (mission.propellant < 100 && hours < 60) {
      hours += 1;
      mission.battery.charge = 100;
      mission.update(hours, { insideHabitat: true });
    }
    expect(mission.propellant).toBe(100);
    mission.stormsSurvived = MAV_CONFIG.STORMS_TO_SURVIVE;
    mission.battery.charge = 100;
    expect(mission.sendData()).toBe('sent');
    expect(mission.ignite()).toBe(true);
  });

  it('admin reset goes back to the trip dose only', () => {
    const mission = calmMission();
    mission.update(20);
    mission.resetDose();
    expect(mission.totalDoseMsv).toBe(TRANSIT_DOSE_MSV);
    expect(mission.doseBreakdown.eva).toBe(0);
  });
});

// Issue #102: o gerador de O2 do habitat tem dois modos com custos opostos
describe('MissionSystem oxygen modes (issue #102)', () => {
  // Recarrega `points` de O2 em passos pequenos, como o motor faz a cada frame
  function breathe(mission, tank, points) {
    let delivered = 0;
    while (delivered < points - 1e-9) {
      const give = Math.min(0.5, points - delivered, mission.oxygenRefillBudget(tank));
      if (give <= 1e-9) break;
      mission.chargeOxygen(give, tank);
      delivered += give;
    }
    return delivered;
  }

  const pointsPerSol = (24 / MISSION_CONFIG.GAME_HOURS_PER_SECOND) * SURVIVAL_CONFIG.OXYGEN_DRAIN_RATE; // pontos de O2 por sol

  it('electrolysis drains the base tank at the real ratio while oxygen refills', () => {
    const mission = createMission(12);
    mission.battery.charge = 100;
    const tank = { water: 20 };
    // 0,84 kg de O2 (um sol de ar) pedem 0,945 L de agua
    mission.chargeOxygen(pointsPerSol, tank);
    expect(20 - tank.water).toBeCloseTo(0.945, 3);
    expect(mission.oxygenPlant.waterUsedL).toBeCloseTo(0.945, 3);
  });

  it('with an empty tank electrolysis stops refilling oxygen and says the tank is the reason', () => {
    const mission = createMission(12);
    mission.battery.charge = 100;
    expect(mission.oxygenRefillBudget({ water: 0 })).toBe(0);
    expect(mission.oxygenPlant.limitedBy).toBe('water');
  });

  it('MOXIE keeps the tank full but each oxygen point costs more power', () => {
    const water = createMission(12);
    const moxie = createMission(12);
    moxie.oxygenPlant.setMode('moxie');
    expect(moxie.oxygenEnergyPerPoint()).toBeGreaterThan(water.oxygenEnergyPerPoint());
    moxie.battery.charge = 100;
    const tank = { water: 20 };
    moxie.chargeOxygen(10, tank);
    expect(tank.water).toBe(20);
    expect(moxie.battery.charge).toBeCloseTo(100 - 10 * moxie.oxygenEnergyPerPoint());
    expect(moxie.oxygenRefillBudget({ water: 0 })).toBeGreaterThan(0);
  });

  it('night with no sun: air from water is the right choice', () => {
    const run = (mode) => {
      const mission = createMission(0); // meia-noite: os paineis nao geram
      mission.oxygenPlant.setMode(mode);
      mission.battery.charge = 30;
      mission.update(6);
      expect(mission.chargeRate).toBe(0);
      return breathe(mission, { water: 30 }, 15);
    };
    expect(run('electrolysis')).toBeCloseTo(15);
    expect(run('moxie')).toBeLessThan(15);
  });

  it('tank almost empty: air from Mars air is the right choice', () => {
    const run = (mode) => {
      const mission = createMission(12);
      mission.oxygenPlant.setMode(mode);
      mission.battery.charge = 100;
      const tank = { water: 0.05 };
      const delivered = breathe(mission, tank, 20);
      return { delivered, water: tank.water };
    };
    const water = run('electrolysis');
    expect(water.delivered).toBeLessThan(20);
    expect(water.water).toBeCloseTo(0);
    const moxie = run('moxie');
    expect(moxie.delivered).toBeCloseTo(20);
    expect(moxie.water).toBe(0.05);
  });
});
