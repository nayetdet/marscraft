import { ENERGY_CONFIG, UTILITY_CONFIG } from '../../config/constants.ts';
import { ActController, type StorySnapshot } from './actTypes.ts';
import { ACT3_FIRST_STEP_ID } from './act3Steps.ts';
import { gymChoiceCard, shouldAskGym } from './act3Gym.ts';
import { crossedSunset, nightLightsCard, nightLightsForecast, shouldAskNightLights, type NightLightsForecast } from './act3NightLights.ts';

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
//   - o modal de trade-off dos passos de agua e de comida;
//   - o card da luz da estufa a noite (issue #420, act3NightLights.ts): no primeiro por do sol com
//     uma planta da crianca crescendo. Quem aplica a escolha e o GameEngine (_onCardChoice).
//   - o card da academia (issue #421, act3Gym.ts): TRAIN NOW x LATER quando o passo da academia
//     comeca, uma vez por partida, e as barras da crianca para o desvio de comer e beber.
export class Act3Controller extends ActController {
  nightLightsAsked = false;
  gymAsked = false;
  private timeOfDay: number | null = null;

  fillSnapshot(s: StorySnapshot): void {
    const { mission, utility } = this.engine;
    s.scriptedStormOver = Boolean(mission?.tutorialStormOver);
    s.plantInBag = Boolean(utility?.playerCrop());
    s.rationsMade = utility?.playerRationsMade ?? 0;
    // Barras da crianca (issue #421): o treino gasta comida e agua dela (desvios need-eat e need-drink)
    const survival = this.engine.survival;
    s.playerFood = survival?.food;
    s.playerWater = survival?.water;
  }

  onStepStart(id: string, s: StorySnapshot): void {
    const trigger = TRADEOFF_TRIGGERS[id];
    if (trigger) this.engine._tradeoff?.(trigger);
    if (id === ACT3_FIRST_STEP_ID) this.engine.mission?.startTutorialStorm(s.hours);
    // Academia agora ou depois (issue #421): o card entra na fila, depois do balao do passo
    if (shouldAskGym({ asked: this.gymAsked, stepId: id })) {
      this.gymAsked = true;
      this.engine.storyHud?.showCard(gymChoiceCard());
    }
  }

  update(_dt: number, s: StorySnapshot, _running: boolean): void {
    const hours = s.hours ?? 0;
    const timeOfDay = ((hours % 24) + 24) % 24;
    const previous = this.timeOfDay;
    this.timeOfDay = timeOfDay;
    if (this.nightLightsAsked || !crossedSunset(previous, timeOfDay)) return;
    const { stations, storyHud } = this.engine;
    if (!stations || !storyHud) return;
    const ask = shouldAskNightLights({
      asked: this.nightLightsAsked,
      playerPlanted: stations.plantCount > 0,
      cropGrowing: stations.hasGrowingCrops(),
    });
    if (!ask) return;
    this.nightLightsAsked = true;
    storyHud.showCard(nightLightsCard(this.nightForecast(hours)));
  }

  // Bateria prevista para o amanhecer com a luz acesa e apagada, com a base como esta agora
  nightForecast(hours: number): NightLightsForecast {
    const { mission, utility, crew } = this.engine;
    const steady = utility.steadyDrainPerHour({
      crewSize: crew?.members.length ?? 0,
      operatingStations: crew?.stations.filter((station: { operating: boolean }) => station.operating).length ?? 0,
    });
    const heaterOn = Boolean(utility.heaterOn);
    return nightLightsForecast({
      charge: mission.battery.charge,
      timeOfDay: ((hours % 24) + 24) % 24,
      baseDrainPerHour: (elapsed) => steady + (heaterOn ? utility.heaterRateAt(hours + elapsed) : 0),
      lightsPerHour: UTILITY_CONFIG.GREENHOUSE_LIGHTS_PER_HOUR * (utility.demandFactor ?? 1),
      weatherFactor: (mission.dustWeather?.solarFactor ?? 1) * (mission.sunlightFactor ?? 1),
      chargePerHour: mission.reactorOn ? ENERGY_CONFIG.REACTOR_CHARGE_PER_HOUR : 0,
    });
  }
}
