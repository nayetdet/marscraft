import { describe, expect, it } from 'vitest';
import { pixelIconSvg } from '../ui/pixelIcons.ts';
import { FIRST_TIME_MOMENTS, FirstTimeMoments, momentLogText, type MomentCounts } from './firstTimeMoments.ts';

const ZERO: MomentCounts = {
  iceCount: 0, roverIceKg: 0, drinkCount: 0, mealCount: 0, earthCalls: 0, powerChecks: 0, plantCount: 0,
  workoutCount: 0, shelterWaterL: 0, roverDrives: 0, suitUps: 0, iceDelivered: 0, stormsSurvived: 0,
};

describe('first-time moments', () => {
  it('gives every main action its own stamp, scene, sourced fact and icons', () => {
    const ids = FIRST_TIME_MOMENTS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(FIRST_TIME_MOMENTS.map((m) => m.stamp)).size).toBe(ids.length);
    for (const moment of FIRST_TIME_MOMENTS) {
      expect(moment.source).toBeTruthy();
      expect(moment.lines.length).toBeGreaterThanOrEqual(2);
      for (const line of moment.lines) expect(pixelIconSvg(line.icon)).toContain('<rect');
      expect(momentLogText(moment)).toContain(moment.lines[0].text);
    }
  });

  it('shows nothing on the first read, whatever the counters already are', () => {
    const moments = new FirstTimeMoments();
    expect(moments.observe({ ...ZERO, drinkCount: 4, iceCount: 9 })).toBeNull();
    expect(moments.observe({ ...ZERO, drinkCount: 4, iceCount: 9 })).toBeNull();
  });

  it('fires once, the first time a counter goes up', () => {
    const moments = new FirstTimeMoments();
    moments.observe(ZERO);
    expect(moments.observe(ZERO)).toBeNull();
    expect(moments.observe({ ...ZERO, drinkCount: 1 })?.id).toBe('drink');
    expect(moments.observe({ ...ZERO, drinkCount: 1 })).toBeNull();
    expect(moments.observe({ ...ZERO, drinkCount: 7 })).toBeNull();
  });

  it('counts ice dug by hand or drilled by the rover as the same first ice', () => {
    const byRover = new FirstTimeMoments();
    byRover.observe(ZERO);
    expect(byRover.observe({ ...ZERO, roverIceKg: 2 })?.id).toBe('ice');
    expect(byRover.observe({ ...ZERO, roverIceKg: 2, iceCount: 1 })).toBeNull();
  });

  it('hands out two moments of the same frame one after the other', () => {
    const moments = new FirstTimeMoments();
    moments.observe(ZERO);
    const both = { ...ZERO, mealCount: 1, workoutCount: 1 };
    expect(moments.observe(both)?.id).toBe('meal');
    expect(moments.observe(both)?.id).toBe('workout');
    expect(moments.observe(both)).toBeNull();
  });

  it('reaches every moment and never repeats one', () => {
    const moments = new FirstTimeMoments();
    moments.observe(ZERO);
    const all = Object.fromEntries(Object.keys(ZERO).map((key) => [key, 5])) as unknown as MomentCounts;
    const fired: string[] = [];
    for (let i = 0; i < 40; i++) {
      const moment = moments.observe(all);
      if (moment) fired.push(moment.id);
    }
    expect(fired).toEqual(FIRST_TIME_MOMENTS.map((m) => m.id));
  });

  it('ignores a counter that goes down (ice used up)', () => {
    const moments = new FirstTimeMoments();
    moments.observe({ ...ZERO, iceCount: 3 });
    expect(moments.observe({ ...ZERO, iceCount: 1 })).toBeNull();
  });
});
