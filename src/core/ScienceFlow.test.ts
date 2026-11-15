// @ts-nocheck
import { describe, expect, it, vi } from 'vitest';
import { GameEngine } from './GameEngine.ts';

describe('science flow while the terminal is open', () => {
  it('refreshes the story after analysis without queuing a full-screen fact popup', () => {
    const engine = Object.create(GameEngine.prototype);
    const type = {
      id: 'sample-mudstone', name: 'Layered Mudstone', points: 3,
      lines: ['A real Mars fact'], where: 'Yellowknife Bay', source: { name: 'NASA/JPL' },
    };
    engine.scanJournal = { record: vi.fn(() => ({ isNew: true })) };
    engine.scannerHud = { unseen: { add: vi.fn() } };
    engine.missionLog = { add: vi.fn() };
    engine._skyHours = vi.fn(() => 12);
    engine._updateStory = vi.fn();
    engine._momentQueue = [];

    engine.onSampleAnalyzed(type);

    expect(engine._updateStory).toHaveBeenCalledWith(0);
    expect(engine.missionLog.add).toHaveBeenCalledOnce();
    expect(engine._momentQueue).toEqual([]);
  });

  it('refreshes the story immediately after science is sent from the same terminal', () => {
    const engine = Object.create(GameEngine.prototype);
    engine.comms = { blackout: false };
    engine.mission = {
      sendData: vi.fn(() => ({ status: 'sent', items: 1, points: 3, cost: 10, leftAfter: 0, sentPoints: 3, dataSent: true })),
    };
    engine.scienceItems = () => [];
    engine._updateStory = vi.fn();

    const message = engine.sendSciencePackage();

    expect(message).toContain('Earth has enough of your science');
    expect(engine._updateStory).toHaveBeenCalledWith(0);
  });
});
