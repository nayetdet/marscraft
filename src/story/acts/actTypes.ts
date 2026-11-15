// Historia em 5 atos (issues #407 a #411). O ato 1 mora em src/story/tutorialSteps.ts; os atos
// 2, 3 e 4 sao listas de passos guiados nesta pasta (act2Steps.ts, act3Steps.ts, act4Steps.ts),
// no mesmo formato dos passos do ato 1; o ato 5 e a corrida final (a missao com a janela de
// lancamento, que o StoryDirector abre quando os passos guiados acabam).
//
// Cada ato tem um controlador (Act2Controller.ts...): e ele que liga os passos do ato ao jogo
// (eventos roteirizados, campos novos do retrato, lugares da seta). O GameEngine so chama os
// metodos abaixo, na ordem dos atos. Assim cada ato mexe nos seus arquivos e nao nos dos outros.

// Retrato do jogo que o StoryDirector le a cada frame (GameEngine._storySnapshot)
export type StorySnapshot = Record<string, any>;

export interface StoryStep {
  id: string; // objetivo do StoryDirector (objectiveId)
  act: number; // 2, 3 ou 4 (os passos do ato 1 nao tem o campo)
  zone: string; // cor do balao e do painel (STEP_COLORS em tutorialSteps.ts)
  icon: string; // icone do painel (src/ui/pixelIcons.ts)
  label: string; // 2 a 4 palavras, em letras grandes
  hint: string; // onde ir e o que apertar, ate 60 letras
  place: string | null; // lugar da seta (src/story/waypoints.ts ou ActController.waypoint)
  objective: string; // frase curta para o terminal da base
  lines: { icon: string; text: string }[]; // ate 3 frases de ate 8 palavras
  // O passo acabou? `s` e o retrato do jogo e `b` uma copia dele tirada quando o passo comecou
  done: (s: StorySnapshot, b: StorySnapshot) => boolean;
  // Mudanca no retrato que conclui o passo: usada pelos testes (storyTestKit.ts) para atravessar
  // os passos sem repetir a lista em cada arquivo de teste. Objeto ou funcao do retrato atual.
  example: StorySnapshot | ((s: StorySnapshot) => StorySnapshot);
  needs?: { resource: string; amount: number }[]; // desvios do tutorial (tutorialDetours.ts)
  certificate?: string;
}

export interface Waypoint {
  x: number;
  y: number;
  z: number;
  label: string;
}

// O que o GameEngine chama em cada controlador de ato. Todos os metodos sao opcionais na pratica:
// a classe base nao faz nada, e cada ato sobrescreve so o que usa.
export class ActController {
  engine: any;

  constructor(engine: any) {
    this.engine = engine;
  }

  // Campos extras do retrato do jogo, lidos pelos passos deste ato. Chamado a cada frame, antes
  // de o StoryDirector ler o retrato: nao alocar aqui.
  fillSnapshot(_s: StorySnapshot): void {}

  // Um passo guiado comecou ou terminou (de qualquer ato: confira o id)
  onStepStart(_id: string, _s: StorySnapshot): void {}
  onStepDone(_id: string, _s: StorySnapshot): void {}

  // Os passos guiados acabaram (ou o tutorial foi pulado): a corrida final comecou
  onMissionStart(_s: StorySnapshot): void {}

  // A cada frame, depois de o StoryDirector andar. `running`: o jogo nao esta pausado
  update(_dt: number, _s: StorySnapshot, _running: boolean): void {}

  // Posicao no mundo de um lugar da seta que so este ato conhece (null = nao e deste ato)
  waypoint(_place: string): Waypoint | null {
    return null;
  }
}
