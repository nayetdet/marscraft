// @ts-nocheck
import { describe, it, expect } from 'vitest';
import { solWeather } from '../data/marsWeather.ts';
import { DUST_WARNING_CARD, dustEventMessage, dustStatus, solarReason, weatherReportCard } from './weatherText.ts';

describe('weather texts (issues #103 and #108)', () => {
  it('the weather report cites the real InSight sol and date and never says live or today', () => {
    const weather = solWeather(24);
    const card = weatherReportCard({ weather });
    const all = [card.title, card.source, ...card.lines.map((l) => l.text)].join(' ');
    expect(card.source).toContain(`sol ${weather.sol}`);
    expect(card.source).toContain(weather.date);
    expect(card.source).toMatch(/Real data: NASA InSight/);
    expect(all).not.toMatch(/live|today'?s data/i);
    expect(card.lines[0].text).toContain(String(Math.round(weather.minC)));
    expect(card.lines[1].text).toContain(String(Math.round(weather.gustMs)));
  });

  it('the advice line follows the decision of the day', () => {
    const weather = solWeather(0);
    expect(weatherReportCard({ weather }).lines[2].text).toMatch(/heater/);
    expect(weatherReportCard({ weather, windCleaned: 0.1 }).lines[2].text).toMatch(/10%/);
    expect(weatherReportCard({ weather, dustPhase: 'storm' }).lines[2].text).toMatch(/Dust storm/);
  });

  it('the dust warning explains that the danger is the dust, not the wind', () => {
    expect(dustEventMessage('dust-warning')).toMatch(/too thin to push you over/);
    expect(DUST_WARNING_CARD.source).toMatch(/game rule/);
    expect(dustEventMessage('unknown')).toBeNull();
  });

  it('says why the solar power dropped', () => {
    expect(solarReason({ night: true, phase: 'storm', panelDust: 0 })).toMatch(/night/);
    expect(solarReason({ night: false, phase: 'storm', panelDust: 0 })).toMatch(/dust storm/);
    expect(solarReason({ night: false, phase: 'clear', panelDust: 0.5 })).toMatch(/dust on the panels/);
    expect(dustStatus({ phase: 'storm', solarFactor: 0.25 }).value).toBe('DUST STORM: SUN 25%');
    expect(dustStatus({ phase: 'warning', hoursUntilStorm: 1.5 }).value).toBe('DUST STORM IN 90 MIN');
  });
});
