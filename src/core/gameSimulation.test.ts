import { describe, expect, it } from 'vitest';
import { isGameSimulationRunning, type GameSimulationState } from './gameSimulation.ts';

const activeState: GameSimulationState = {
  inputLocked: true,
  portraitRequired: false,
  isDead: false,
  inventoryOpen: false,
  journalOpen: false,
  stationOpen: false,
  victoryShown: false,
  cutsceneActive: false,
  storyWindowClosedShown: false,
  sleepPanelOpen: false,
  sleeping: false,
};

describe('isGameSimulationRunning', () => {
  it.each([
    ['inventory', { inputLocked: false, inventoryOpen: true }],
    ['journal', { inputLocked: false, journalOpen: true }],
  ])('keeps simulation active while the %s is open', (_screen, state) => {
    expect(isGameSimulationRunning({ ...activeState, ...state })).toBe(true);
  });

  it.each([
    ['portrait orientation', { portraitRequired: true }],
    ['death screen', { isDead: true }],
    ['station panel', { stationOpen: true }],
    ['victory screen', { victoryShown: true }],
    ['cutscene', { cutsceneActive: true }],
    ['sleep panel', { sleepPanelOpen: true }],
    ['sleep', { sleeping: true }],
  ])('keeps simulation paused for the %s', (_screen, state) => {
    expect(isGameSimulationRunning({ ...activeState, ...state })).toBe(false);
  });

  it('pauses when no gameplay screen has focus', () => {
    expect(isGameSimulationRunning({ ...activeState, inputLocked: false })).toBe(false);
  });
});
