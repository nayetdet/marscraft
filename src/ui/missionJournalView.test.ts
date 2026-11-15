// @ts-nocheck
import { describe, expect, it } from 'vitest';
import { MissionLog } from '../story/missionLog.ts';
import { StudyReveals } from '../story/studyReveals.ts';
import { missionLogHtml, radlabChartHtml, realVsGameHtml, solSummaryLines, studiesHtml } from './missionJournalView.ts';

describe('missionJournalView', () => {
  it('shows an empty log message', () => {
    expect(missionLogHtml(new MissionLog())).toMatch(/Nothing yet/);
  });

  it('shows the cause next to a consequence and escapes text', () => {
    const log = new MissionLog();
    log.decision('Heater <off>', { hours: 45, key: 'heater' });
    log.consequence('Pipes froze', { hours: 47, causeKey: 'heater' });
    const html = missionLogHtml(log);
    expect(html).toMatch(/SOL 2/);
    expect(html).toMatch(/Because: Heater &lt;off&gt;/);
    expect(html).toMatch(/LED TO/);
  });

  it('summary card has the 3 numbers', () => {
    const lines = solSummaryLines({ energyIn: 160, energyOut: 140, waterIn: 3, waterOut: 12.5, doseMsv: 0.5 });
    expect(lines).toEqual(['Power: made 160%, used 140%', 'Water tank: in 3 L, out 12.5 L', 'Radiation today: 0.50 mSv']);
  });

  it('studies page shows the RadLab chart, the honesty note and locked studies', () => {
    const reveals = new StudyReveals();
    const study = reveals.reveal('workout:treadmill');
    const html = studiesHtml(reveals);
    expect(html).toMatch(/MARS: ABOUT 1\.5 TIMES THE SPACE STATION/);
    expect(html).toMatch(/real data from \d{2}\/\d{2}\/\d{4}/);
    expect(html).toMatch(/many with mice/);
    expect(html).toContain(study.url);
    expect(html).toMatch(/\?\?\?/);
  });

  it('the RadLab chart has 4 bars and no unit', () => {
    const html = radlabChartHtml();
    expect(html.match(/class="radlab-row/g)).toHaveLength(4);
    expect(html).not.toMatch(/Gy/);
  });

  it('real vs game page lists rows', () => {
    expect(realVsGameHtml()).toMatch(/GRAVITY/);
  });
});
