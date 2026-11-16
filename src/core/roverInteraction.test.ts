import { describe, expect, it, vi } from 'vitest';
import { GameEngine } from './GameEngine.ts';

describe('rover interaction notice', () => {
  it('shows the remote-control instruction nearby and does not open a station', () => {
    const engine = Object.create(GameEngine.prototype);
    const prompt = vi.fn();
    Object.assign(engine, {
      roverController: { isActive: false, pos: { x: 20, y: 0, z: 20 } },
      gymController: { isActive: false }, player: { pos: { x: 22, y: 1.7, z: 20 } },
      hud: { setInteractionPrompt: prompt }, _isNearMav: () => false,
      _nearestCrewMember: () => null, act2: { interactionPrompt: () => null },
      _getInteraction: vi.fn(() => null), _isAtSolarField: () => false,
      missionHud: { isVictoryShown: false },
    });

    engine._checkAstronautInteractions();
    expect(prompt).toHaveBeenCalledWith(true, 'Drive the rover from the computer inside the base.');
    expect(engine.currentInteraction).toBe('rover_notice');
    engine.handlePlayerInteract();
    expect(engine._getInteraction).toHaveBeenCalledOnce();
  });
});
