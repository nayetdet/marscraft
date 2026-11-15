export interface GameSimulationState {
  inputLocked: boolean;
  portraitRequired: boolean;
  isDead: boolean;
  inventoryOpen: boolean;
  journalOpen: boolean;
  stationOpen: boolean;
  victoryShown: boolean;
  cutsceneActive: boolean;
  storyWindowClosedShown: boolean;
  sleepPanelOpen: boolean;
  sleeping: boolean;
}

export function isGameSimulationRunning(state: GameSimulationState): boolean {
  const gameHasFocus = state.inputLocked || state.inventoryOpen || state.journalOpen;
  return gameHasFocus
    && !state.portraitRequired
    && !state.isDead
    && !state.stationOpen
    && !state.victoryShown
    && !state.cutsceneActive
    && !state.storyWindowClosedShown
    && !state.sleepPanelOpen
    && !state.sleeping;
}
