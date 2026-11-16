import { PHYSICS_CONFIG } from '../config/constants.ts';
import { HABITAT_LAYOUT, isInsideShelter } from './habitatLayout.ts';

// Open once per entry; closing the panel while staying inside must not reopen it.
export class ShelterEntry {
  private inside = false;

  update(pos: { x: number; y: number; z: number }): boolean {
    const floor = HABITAT_LAYOUT.FLOOR_Y + 1;
    const feet = pos.y - PHYSICS_CONFIG.PLAYER_HEIGHT;
    const inside = isInsideShelter(pos.x, pos.z)
      && pos.y > floor && feet < floor + HABITAT_LAYOUT.SHELTER_HEIGHT;
    const entered = inside && !this.inside;
    this.inside = inside;
    return entered;
  }
}
