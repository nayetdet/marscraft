import { describe, expect, it } from 'vitest';
import {
  CREW_CONFIG, CROP_CONFIG, ENERGY_CONFIG, MISSION_CONFIG, SURVIVAL_CONFIG, TIME_SCALE_CONFIG,
} from './constants.ts';
import { REAL_VS_GAME } from '../data/realVsGame.ts';
import { BATTERY_KWH, RTG_IN_REAL_MMRTGS, SOLAR_PEAK_KW, percentPerHourToKw, percentToKwh } from '../mission/powerUnits.ts';

// Issue #229: uma regra unica de compressao do tempo. O que gasta ou produz "por hora" segue o
// relogio do jogo; o que foge dele e uma excecao com nome e aparece na aba REAL VS GAME.

const HOUR_SECONDS = 1 / MISSION_CONFIG.GAME_HOURS_PER_SECOND;

describe('one game clock (issue #229)', () => {
  it('has one clock: 1 game hour = 50 real seconds, 1 sol = 20 minutes', () => {
    expect(TIME_SCALE_CONFIG.GAME_HOURS_PER_SECOND).toBe(MISSION_CONFIG.GAME_HOURS_PER_SECOND);
    expect(HOUR_SECONDS).toBe(50);
    expect((24 * HOUR_SECONDS) / 60).toBe(20);
  });

  it('gives the crew 30 L of water (all uses) and the real BVAD food per person per sol', () => {
    expect(CREW_CONFIG.WATER_L_PER_HOUR * 24).toBeCloseTo(30); // uso total: beber, comida, higiene e lavagem (agua vezes 10)
    expect(CREW_CONFIG.FOOD_PER_HOUR * 24 * CREW_CONFIG.KG_PER_RATION).toBeCloseTo(1.8); // ~1,8 kg de comida
  });

  it('makes the player hungry and thirsty on the game clock, in the same order as the crew', () => {
    const foodHours = SURVIVAL_CONFIG.MAX_STAT / SURVIVAL_CONFIG.FOOD_DRAIN_RATE / HOUR_SECONDS;
    const waterHours = SURVIVAL_CONFIG.MAX_STAT / SURVIVAL_CONFIG.WATER_DRAIN_RATE / HOUR_SECONDS;
    expect(foodHours).toBeCloseTo(TIME_SCALE_CONFIG.PLAYER_FOOD_HOURS);
    expect(waterHours).toBeCloseTo(TIME_SCALE_CONFIG.PLAYER_WATER_HOURS);
    // Horas ou um sol, como a tripulacao (que cai de cama depois de BEDRIDDEN_AFTER_HOURS)
    expect(foodHours).toBeGreaterThanOrEqual(CREW_CONFIG.BEDRIDDEN_AFTER_HOURS);
    expect(foodHours).toBeLessThanOrEqual(24);
    // Ainda e um custo: a barra de comida nao dura a partida inteira
    expect(foodHours * HOUR_SECONDS).toBeLessThanOrEqual(10 * 60);
  });

  it('never lets you get hungry faster than the fastest plant grows', () => {
    const fastest = Math.min(...Object.values(CROP_CONFIG).map((crop) => crop.seconds));
    expect(SURVIVAL_CONFIG.MAX_STAT / SURVIVAL_CONFIG.FOOD_DRAIN_RATE).toBeGreaterThan(fastest);
  });
});

describe('declared exceptions to the clock (issue #229)', () => {
  it('speeds up every crop by the same named factor, so the order between crops is real', () => {
    for (const crop of Object.values(CROP_CONFIG)) {
      expect(crop.seconds).toBe(Math.round(crop.realDays / TIME_SCALE_CONFIG.CROP_REAL_DAYS_PER_GAME_SECOND));
    }
    // NASA KSC: alface 28 a 30 dias, soja 90 a 97, batata 90 a 105
    expect(CROP_CONFIG.lettuce.realDays).toBe(28);
    expect(CROP_CONFIG.soy.realDays).toBeGreaterThanOrEqual(90);
    expect(CROP_CONFIG.potato.realDays).toBeLessThanOrEqual(105);
    expect(CROP_CONFIG.lettuce.seconds).toBeLessThan(CROP_CONFIG.soy.seconds);
    expect(CROP_CONFIG.soy.seconds).toBeLessThan(CROP_CONFIG.potato.seconds);
  });

  it('keeps a trade-off between crops: none is the best at everything', () => {
    const crops = Object.entries(CROP_CONFIG);
    const best = (score: (crop: (typeof crops)[number][1]) => number) => crops.reduce((a, b) => (score(b[1]) > score(a[1]) ? b : a))[0];
    expect(best((c) => -c.seconds)).toBe('lettuce'); // a mais rapida
    expect(best((c) => c.nutrition)).toBe('soy'); // mais comida por colheita
    expect(best((c) => c.nutrition / c.water)).toBe('potato'); // mais comida por litro
    expect(best((c) => c.nutrition / c.energy)).toBe('potato'); // mais comida por % de bateria
  });

  it('measures power with one declared ruler: the game reactor is a 10 kW Kilopower', () => {
    expect(percentPerHourToKw(ENERGY_CONFIG.REACTOR_CHARGE_PER_HOUR)).toBeCloseTo(TIME_SCALE_CONFIG.REACTOR_KW);
    expect(BATTERY_KWH).toBeCloseTo(125);
    expect(percentToKwh(ENERGY_CONFIG.BATTERY_CAPACITY)).toBeCloseTo(BATTERY_KWH);
    expect(SOLAR_PEAK_KW).toBeCloseTo(26.875);
    expect(RTG_IN_REAL_MMRTGS).toBeGreaterThan(1);
  });

  it('shows every exception to the child in the REAL VS GAME tab', () => {
    const topics = REAL_VS_GAME.map((row) => row.topic);
    for (const topic of ['One day (sol)', 'Plants', 'Rocket fuel', 'Battery', 'Nuclear generator (RTG)', 'Crew food and water', 'Your hunger and thirst', 'Suit air', 'Solar storm', 'Storm shelter wall', 'Radio to Earth']) {
      expect(topics, topic).toContain(topic);
    }
    for (const row of REAL_VS_GAME) {
      for (const field of [row.game, row.real, row.why, row.source]) expect(field.length).toBeGreaterThan(3);
    }
    const plants = REAL_VS_GAME.find((row) => row.topic === 'Plants')!;
    expect(plants.real).toMatch(/lettuce 28, soy 90, potato 105/);
    expect(plants.why).toContain(String(TIME_SCALE_CONFIG.CROP_REAL_DAYS_PER_GAME_SECOND));
    expect(REAL_VS_GAME.find((row) => row.topic === 'Crew food and water')!.game).toMatch(/30 L of water.*1\.8 kg of food/);
    expect(REAL_VS_GAME.find((row) => row.topic === 'Battery')!.game).toMatch(/125 kWh/);
  });
});
