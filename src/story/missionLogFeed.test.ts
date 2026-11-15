// @ts-nocheck
import { describe, expect, it } from 'vitest';
import { UtilityModule } from '../core/UtilityModule.ts';
import { MissionSystem } from '../mission/MissionSystem.ts';
import { MissionLog } from './missionLog.ts';
import { MissionLogFeed } from './missionLogFeed.ts';
import { StudyReveals } from './studyReveals.ts';

function setup(startHours = 30) {
  const mission = new MissionSystem({ cmes: [], startHours, stormsStarted: false });
  const survival = { baseWater: 25, maxBaseWater: 100 };
  const stations = { workoutCount: 0, treatmentCount: 0, harvestCount: 0, plots: [{ crop: null }, { crop: null }] };
  const utility = new UtilityModule({ mission, survival, stations, base: {} });
  const comms = { blackout: false };
  const log = new MissionLog();
  const reveals = new StudyReveals();
  const feed = new MissionLogFeed({ log, reveals, sources: { utility, mission, survival, stations, comms } });
  let hours = startHours;
  const advance = (h) => {
    const before = hours;
    hours += h;
    mission.update(hours, { active: true });
    utility.update(hours - before);
    feed.observe(hours);
  };
  feed.observe(hours);
  return { mission, survival, stations, utility, comms, log, reveals, feed, advance, now: () => hours };
}

describe('MissionLogFeed', () => {
  it('heater off at night gives a decision and a linked consequence', () => {
    const t = setup(24 + 20); // sol 2, 20:00 (night)
    t.advance(0.5);
    t.utility.toggle('heater'); // desliga
    t.feed.observe(t.now()); // o jogo observa a cada frame
    t.advance(0.5);
    const decision = t.log.entries.find((e) => e.kind === 'decision');
    const froze = t.log.entries.find((e) => e.kind === 'consequence');
    expect(decision.text).toMatch(/heater off/);
    expect(froze.text).toMatch(/pipes froze/);
    expect(froze.causeId).toBe(decision.id);
    expect(decision.time).toBe('Sol 2, 20:30');
  });

  it('writes nothing when nothing changed', () => {
    const t = setup(10);
    t.advance(0.1);
    t.advance(0.1);
    expect(t.log.entries).toHaveLength(0);
  });

  it('merges shelter wall clicks and links the storm result to them', () => {
    const t = setup(10);
    t.mission.fillShelterWall(t.survival);
    t.advance(0.01);
    t.mission.fillShelterWall(t.survival);
    t.advance(0.01);
    const decisions = t.log.entries.filter((e) => e.kind === 'decision');
    expect(decisions).toHaveLength(1);
    expect(decisions[0].text).toMatch(/now 20 L/);

    t.feed.onMissionEvent({ type: 'storm-start' }, t.now());
    t.mission.totalDoseMsv += 0.4;
    t.feed.onMissionEvent({ type: 'storm-survived' }, t.now());
    const result = t.log.entries.find((e) => e.kind === 'consequence');
    expect(result.causeId).toBe(decisions[0].id);
    expect(result.text).toMatch(/20 L in the shelter wall.*0\.40 mSv/);
    // Sobreviver a tempestade revela um estudo de radiacao
    expect(t.log.entries.some((e) => e.kind === 'study')).toBe(true);
    expect(t.feed.drainCards().map((c) => c.type)).toEqual(['study']);
  });

  it('a finished treadmill workout reveals a real bone study', () => {
    const t = setup(10);
    t.stations.workoutCount = 1;
    t.stations.lastWorkoutMode = 'treadmill';
    t.advance(0.01);
    const study = t.log.entries.find((e) => e.kind === 'study');
    expect(study.text).toMatch(/OSD-\d+/);
    expect(study.link).toMatch(/^https:\/\/osdr\.nasa\.gov\/bio\/repo\/data\/studies\/OSD-\d+$/);
    expect(t.reveals.count).toBe(1);
  });

  it('closes the sol with energy, water and dose numbers', () => {
    const t = setup(20);
    t.survival.baseWater = 20; // 5 L saiu
    t.advance(1);
    t.survival.baseWater = 23; // 3 L entrou
    t.advance(4); // passa da meia-noite
    const summary = t.log.entries.find((e) => e.kind === 'summary');
    expect(summary.sol).toBe(1);
    expect(summary.numbers.waterOut).toBe(5);
    expect(summary.numbers.waterIn).toBe(3);
    expect(summary.numbers.energyIn).toBeGreaterThanOrEqual(0);
    expect(summary.numbers.energyOut).toBeGreaterThan(0); // aquecedor de noite
    expect(summary.numbers.doseMsv).toBeGreaterThan(0);
    expect(t.feed.drainCards()[0].type).toBe('summary');
  });

  it('plant is a decision and harvest a consequence linked to it', () => {
    const t = setup(10);
    t.stations.plots[1].crop = { type: 'potato', progress: 0 };
    t.advance(0.01);
    t.stations.plots[1].crop = null;
    t.stations.harvestCount = 1;
    t.advance(0.01);
    const plant = t.log.entries.find((e) => e.kind === 'decision');
    const harvest = t.log.entries.find((e) => e.kind === 'consequence');
    expect(plant.text).toMatch(/planted potato/);
    expect(harvest.causeId).toBe(plant.id);
  });

  it('shield turned off by an empty battery is a consequence, not a decision', () => {
    const t = setup(10);
    t.mission.shieldOn = true;
    t.advance(0.01);
    t.mission.shieldOn = false;
    t.feed.onMissionEvent({ type: 'shield-off-no-energy' }, t.now());
    t.advance(0.01);
    expect(t.log.entries.map((e) => e.kind)).toEqual(['decision', 'consequence']);
  });
});
