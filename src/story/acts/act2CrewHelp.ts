import { ACT2_CONFIG } from '../../config/constants.ts';
import { SPEAKERS } from '../radioSpeakers.ts';

// Trade-off do ato 2 (issue #415): quem sai do posto para ajudar. No passo FIX THE WINDOW um card
// de radio pergunta quem traz o vidro novo, e o que essa pessoa cuida para enquanto ela ajuda:
//   WATER TECH  quem fica no reciclador de agua: a agua cinza se acumula e nao volta ao tanque
//               (UtilityModule.recyclerPaused)
//   BOTANIST    quem fica na estufa: as plantas nao crescem (UtilityModule.greenhousePaused)
// Quem a crianca chama e quem esta de fato na maquina que para: `memberIndex` segue a ordem dos
// postos fixos de CrewManager (0 gerador de O2, 1 estufa, 2 reciclador), conferida em teste. A
// engenheira (posto 0, gerador de O2) so faz a pergunta pelo radio e nao sai do posto.
// A parada dura ACT2_CONFIG.CREW_HELP_HOURS de jogo e acaba sozinha. Sem resposta, vem quem cuida
// da agua (a opcao padrao): o passo nunca trava.
// Logica pura (sem DOM nem Three.js): quem mostra o card e pausa as maquinas e o Act2Controller.
//
// O fato real e que o tempo da tripulacao e escasso na Estacao Espacial (docs/data/numeros-reais.md).
// A parada de 1 h e quem cuida de cada maquina sao regra de jogo, e o card diz isso.

export const HELP_WATER_ID = 'help-water';
export const HELP_BOTANIST_ID = 'help-botanist';

export type HelpStation = 'recycler' | 'greenhouse';

export interface CrewHelper {
  id: string;
  memberIndex: number; // posicao em CrewManager.members
  task: string; // posto fixo dessa pessoa (CrewMember.task)
  station: HelpStation; // o que para enquanto a pessoa ajuda
  waypointLabel: string;
  coming: string; // fala ao sair do posto
  promptGlass: string; // texto do [F]
  glassGiven: string; // fala ao entregar o vidro
  stopped: string; // aviso na hora da escolha
  warning: string; // aviso que fica no HUD durante a ajuda
  resumed: string; // aviso quando a pessoa volta ao posto
}

export const CREW_HELPERS: Record<string, CrewHelper> = {
  [HELP_WATER_ID]: {
    id: HELP_WATER_ID,
    memberIndex: 2,
    task: 'water',
    station: 'recycler',
    waypointLabel: 'WATER TECH',
    coming: 'Water tech: I am getting new glass. Come and take it!',
    promptGlass: '[F] Get the new window glass from the water tech',
    glassGiven: 'Water tech: Here is the glass. Put it on the cracked window!',
    stopped: 'Water recycler stopped: the water tech is helping you.',
    warning: 'WATER RECYCLER STOPPED: the water tech is helping',
    resumed: 'The water tech is back: the water recycler runs again.',
  },
  [HELP_BOTANIST_ID]: {
    id: HELP_BOTANIST_ID,
    memberIndex: 1,
    task: 'greenhouse',
    station: 'greenhouse',
    waypointLabel: 'BOTANIST',
    coming: 'Botanist: I am getting new glass. Come and take it!',
    promptGlass: '[F] Get the new window glass from the botanist',
    glassGiven: 'Botanist: Here is the glass. Put it on the cracked window!',
    stopped: 'Greenhouse stopped: the botanist is helping you.',
    warning: 'GREENHOUSE STOPPED: the botanist is helping',
    resumed: 'The botanist is back: the plants grow again.',
  },
};

export const DEFAULT_HELPER_ID = HELP_WATER_ID;

// Card de radio com a escolha ([1] ou [2], ou toque). Formato dos cards em storyChapters.ts.
export const CREW_HELP_CARD = {
  title: 'WHO BRINGS THE GLASS?',
  speaker: SPEAKERS.engineer,
  seconds: ACT2_CONFIG.CREW_HELP_CARD_SECONDS,
  lines: [{ icon: 'wrench', text: 'The helper leaves a job behind' }],
  choices: [
    { id: HELP_WATER_ID, key: '1', icon: 'drop', name: 'WATER TECH', good: 'Plants keep growing', bad: 'Water recycler stops 1 hour' },
    { id: HELP_BOTANIST_ID, key: '2', icon: 'plant', name: 'BOTANIST', good: 'Water keeps recycling', bad: 'Plants stop growing 1 hour' },
  ],
  source: 'Real: astronaut time is scarce on the Space Station (NASA Inspector General, IG-20-005). The 1 hour stop is a game rule.',
};

// Estado da escolha e da parada. Sem alocar por frame.
export class CrewHelp {
  helper: CrewHelper | null = null; // quem traz o vidro (null: ainda nao escolhido)
  asking = false; // o card esta esperando a resposta
  paused: CrewHelper | null = null; // de quem e a maquina parada agora
  private askLeft = 0; // segundos ate valer a opcao padrao
  private hoursLeft = 0; // horas de jogo ate a maquina voltar
  private lastHours: number | null = null;

  // Posicao na tripulacao de quem entrega o vidro (antes da escolha: a opcao padrao)
  get memberIndex(): number {
    return (this.helper ?? CREW_HELPERS[DEFAULT_HELPER_ID]).memberIndex;
  }

  // Aviso do HUD enquanto a maquina esta parada, ou null
  get warning(): string | null {
    return this.paused ? this.paused.warning : null;
  }

  // O card apareceu: comeca a contar o tempo da resposta
  ask(seconds: number = ACT2_CONFIG.CREW_HELP_DEFAULT_SECONDS): void {
    this.helper = null;
    this.asking = true;
    this.askLeft = seconds;
  }

  // Anda o tempo da resposta. Devolve true quando ele acaba (vale a opcao padrao)
  tickChoice(dt: number): boolean {
    if (!this.asking) return false;
    this.askLeft -= dt;
    return this.askLeft <= 0;
  }

  // A escolha foi feita (ou o tempo acabou): a maquina de quem vem para. Devolve quem vem, ou
  // null se o id nao e uma opcao ou a escolha ja estava feita.
  choose(id: string, hours: number = ACT2_CONFIG.CREW_HELP_HOURS): CrewHelper | null {
    const helper = CREW_HELPERS[id];
    if (!helper || this.helper) return null;
    this.helper = helper;
    this.asking = false;
    this.paused = helper;
    this.hoursLeft = hours;
    return helper;
  }

  // O passo foi pulado com o card aberto: ninguem vem, nada para
  cancel(): void {
    this.asking = false;
  }

  // Anda a parada no relogio da missao (`hours` = horas de jogo desde o comeco). Devolve, uma
  // vez, de quem e a maquina que acabou de voltar; senao null.
  update(hours: number): CrewHelper | null {
    const previous = this.lastHours;
    this.lastHours = hours;
    if (!this.paused || previous === null) return null;
    this.hoursLeft -= Math.max(0, hours - previous);
    if (this.hoursLeft > 0) return null;
    const back = this.paused;
    this.paused = null;
    return back;
  }

  // Parada em andamento, para a partida salva (GameEngine._saveGame). null: nada parado.
  saveState(): { id: string; hoursLeft: number } | null {
    return this.paused ? { id: this.paused.id, hoursLeft: this.hoursLeft } : null;
  }

  // Partida recarregada com uma maquina parada: a parada continua pelo tempo que faltava.
  // Devolve de quem e a maquina, ou null se o save nao tinha uma parada valida.
  restore(state: { id?: unknown; hoursLeft?: unknown } | null | undefined): CrewHelper | null {
    const helper = typeof state?.id === 'string' ? CREW_HELPERS[state.id] : undefined;
    const hoursLeft = Number(state?.hoursLeft);
    if (!helper || !(hoursLeft > 0)) return null;
    this.helper = helper;
    this.paused = helper;
    this.hoursLeft = Math.min(hoursLeft, ACT2_CONFIG.CREW_HELP_HOURS);
    this.lastHours = null;
    return helper;
  }
}
