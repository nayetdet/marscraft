import { ActController, type StorySnapshot } from './actTypes.ts';
import { ACT3_FIRST_STEP_ID } from './act3Steps.ts';

// Modal de trade-off (src/story/tradeoffScenes.ts) dos passos do ato que ensinam o mesmo que um
// passo do passeio completo: o gatilho e o do passo antigo, para a cena continuar uma so
const TRADEOFF_TRIGGERS: Record<string, string> = {
  'shelter-wall': 'step:cert-shelter', // WATER: cada gota tem tres trabalhos
  'plant-seed': 'step:plant', // FOOD: a planta bebe e gasta bateria antes de alimentar
};

// Ato 3 (issue #409): liga os passos de act3Steps.ts ao jogo. Ver actTypes.ts.
//   - a tempestade solar roteirizada: a do tutorial (CME real do DONKI, MissionSystem) passa a
//     ser marcada quando o primeiro passo do ato comeca, e nao no fim dos passos guiados. As
//     tempestades reais (ao vivo) continuam so depois deles (evento `start-storms` do GameEngine);
//   - os campos do retrato que os passos do ato leem;
//   - o modal de trade-off dos passos de agua e de comida.
export class Act3Controller extends ActController {
  fillSnapshot(s: StorySnapshot): void {
    const { mission, utility } = this.engine;
    s.scriptedStormOver = Boolean(mission?.tutorialStormOver);
    s.plantInBag = Boolean(utility?.playerCrop());
    s.rationsMade = utility?.playerRationsMade ?? 0;
  }

  onStepStart(id: string, s: StorySnapshot): void {
    const trigger = TRADEOFF_TRIGGERS[id];
    if (trigger) this.engine._tradeoff?.(trigger);
    if (id === ACT3_FIRST_STEP_ID) this.engine.mission?.startTutorialStorm(s.hours);
  }
}
