import { ACT3_CONFIG, ENERGY_CONFIG, UTILITY_CONFIG } from '../../config/constants.ts';
import { batteryAtSunrise } from '../../mission/energy.ts';

// Trade-off do ato 3 (issue #420): luz da estufa a noite. No primeiro por do sol com uma planta
// da crianca crescendo, um card de radio pergunta LIGHTS ON x LIGHTS OFF e mostra a bateria
// prevista para o amanhecer em cada caso. A escolha vale na hora, sem ir ate a sala de energia.
// Nenhuma opcao e de graca: luz acesa gasta bateria a noite inteira; luz apagada para a planta.
// Logica pura (sem DOM nem Three.js): quem mostra o card e aplica a escolha e o Act3Controller.
//
// A previsao e uma conta com as constantes do jogo (energy.batteryAtSunrise): o Sol que ainda
// resta ate o por do sol, menos o que a base gasta por hora ate o Sol nascer. E regra de jogo, e
// o card diz "about": o que a crianca ligar ou desligar durante a noite muda o resultado.

export const LIGHTS_ON_ID = 'lights-on';
export const LIGHTS_OFF_ID = 'lights-off';

export interface NightLightsInput {
  charge: number; // bateria agora (%)
  timeOfDay: number; // hora do dia em Marte (0 a 24)
  // % por hora de jogo que a base gasta sem a luz da estufa, `elapsed` horas depois de agora
  // (o aquecedor gasta mais quando esfria)
  baseDrainPerHour: (elapsed: number) => number;
  lightsPerHour?: number; // gasto da luz da estufa (% por hora de jogo)
  weatherFactor?: number; // fracao do Sol que passa pela poeira
  chargePerHour?: number; // geracao que nao depende do Sol (reator ligado)
}

export interface NightLightsForecast {
  on: number; // % de bateria no amanhecer com a luz acesa a noite inteira
  off: number; // idem, com a luz apagada
}

// Bateria no amanhecer com a luz da estufa acesa e apagada, em % inteiros
export function nightLightsForecast({
  charge, timeOfDay, baseDrainPerHour, lightsPerHour = UTILITY_CONFIG.GREENHOUSE_LIGHTS_PER_HOUR, weatherFactor = 1, chargePerHour = 0,
}: NightLightsInput): NightLightsForecast {
  const at = (extra: number): number => Math.round(batteryAtSunrise({
    charge, timeOfDay, weatherFactor, chargePerHour,
    drainPerHour: (elapsed: number) => baseDrainPerHour(elapsed) + extra,
  }) / ENERGY_CONFIG.BATTERY_CAPACITY * 100);
  return { on: at(lightsPerHour), off: at(0) };
}

// O relogio acabou de passar pela hora do aviso do por do sol (a mesma do evento `sunset-soon` da
// missao)? `previous` = hora do dia no quadro anterior (null no primeiro quadro)
export function crossedSunset(previous: number | null, timeOfDay: number): boolean {
  if (previous === null) return false;
  const sunset = ENERGY_CONFIG.SUNSET_WARNING_HOUR;
  return previous < sunset && timeOfDay >= sunset;
}

// O card aparece uma vez por partida, no primeiro por do sol com uma planta que a crianca plantou
// ainda crescendo. Sem planta crescendo ele espera o proximo por do sol.
export function shouldAskNightLights({ asked, playerPlanted, cropGrowing }: {
  asked: boolean; playerPlanted: boolean; cropGrowing: boolean;
}): boolean {
  return !asked && playerPlanted && cropGrowing;
}

// Card de radio com a escolha ([1] ou [2], ou toque). Formato dos cards em storyChapters.ts.
export function nightLightsCard(forecast: NightLightsForecast) {
  return {
    title: 'NIGHT IS COMING',
    seconds: ACT3_CONFIG.NIGHT_LIGHTS_CARD_SECONDS,
    lines: [
      { icon: 'plant', text: 'Plants only grow with the lights on' },
      { icon: 'moon', text: 'No Sun at night: lights eat battery' },
    ],
    choices: [
      { id: LIGHTS_ON_ID, key: '1', icon: 'plant', name: 'LIGHTS ON', good: 'Plant keeps growing', bad: `Battery at sunrise: about ${forecast.on}%` },
      { id: LIGHTS_OFF_ID, key: '2', icon: 'bolt', name: 'LIGHTS OFF', good: `Battery at sunrise: about ${forecast.off}%`, bad: 'Plant stops until morning' },
    ],
    source: 'Battery numbers are a game forecast, not NASA data',
  };
}

// Aviso depois da escolha: o que ela custa
export function nightLightsToast(lightsOn: boolean): string {
  return lightsOn
    ? 'Greenhouse lights ON tonight: the plant grows, the battery drains faster.'
    : 'Greenhouse lights OFF tonight: the battery lasts longer, the plant waits. Turn them on in the power room.';
}
