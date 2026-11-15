import { Act2Controller } from './Act2Controller.ts';
import { Act3Controller } from './Act3Controller.ts';
import { Act4Controller } from './Act4Controller.ts';
import { Act5Controller } from './Act5Controller.ts';
import type { ActController } from './actTypes.ts';

// Um controlador por ato, na ordem dos atos (o ato 1 e o tutorial de tutorialSteps.ts)
export function createActControllers(engine: unknown): ActController[] {
  return [new Act2Controller(engine), new Act3Controller(engine), new Act4Controller(engine), new Act5Controller(engine)];
}
