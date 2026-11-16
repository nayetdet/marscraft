import { CREW_CONFIG } from '../../config/constants.ts';
import type { StorySnapshot, StoryStep } from './actTypes.ts';

// Passos guiados do ato 2 (issue #408): tempestade de poeira, paineis, vazamento, luneta e diario.
// Spec: docs/superpowers/specs/2026-11-15-act2-story-design.md. Formato em actTypes.ts.
//
// Os campos `act2...` do retrato sao preenchidos pelo Act2Controller (fillSnapshot):
//   act2StormOver        a tempestade de poeira roteirizada ja passou
//   act2PanelsClean      todos os paineis com menos de ACT2_CONFIG.PANELS_CLEAN_BELOW de poeira
//   act2HasScope         a luneta esta no inventario
//   act2LeakFound        a crianca achou a janela rachada com a luneta
//   act2LeakFixed        a janela foi trocada e o ar parou de vazar
//   act2ScanMars/Sky/Base  um alvo de cada tipo ja escaneado nesta partida
//   act2ScanChecklist    os 3 alvos, para o painel do objetivo marcar cada um
//   act2JournalLessonDone  a aula do diario foi vista ate o fim

// Quem entrega a luneta e o vidro: o engenheiro de voo, o primeiro da tripulacao
export const ACT2_ENGINEER_NAME: string = CREW_CONFIG.NAMES[0];

// Lugares da seta que so este ato conhece (Act2Controller.waypoint)
export const ACT2_PLACES = {
  panels: 'act2-panels',
  engineer: 'act2-engineer',
  repair: 'act2-repair', // o engenheiro (buscar o vidro) ou a janela rachada (trocar)
};

// Passo com uma lista de alvos no painel do objetivo (objectiveView.ts le `checklist`)
export type Act2Step = StoryStep & {
  checklist?: (s: StorySnapshot) => { icon: string; state: string }[] | null;
};

export const ACT2_STEPS: Act2Step[] = [
  {
    id: 'clean-panels',
    act: 2,
    zone: 'power',
    icon: 'dust',
    label: 'CLEAN THE PANELS',
    hint: 'Solar field outside: press F on each dusty panel',
    place: ACT2_PLACES.panels,
    objective: 'Clean the dust off every solar panel, now or after the storm',
    lines: [
      { icon: 'dust', text: 'A dust storm is covering the solar panels' },
      { icon: 'wrench', text: 'Clean now: your suit wears out faster' },
      { icon: 'clock', text: 'Or wait inside: the battery keeps dropping' },
    ],
    done: (s) => Boolean(s.act2StormOver && s.act2PanelsClean),
    example: { act2StormOver: true, act2PanelsClean: true },
  },
  {
    id: 'get-scope',
    act: 2,
    zone: 'science',
    icon: 'scope',
    label: 'GET THE SCOPE',
    hint: `Follow the arrow to ${ACT2_ENGINEER_NAME}, the engineer: press F`,
    place: ACT2_PLACES.engineer,
    objective: `Get the scope from ${ACT2_ENGINEER_NAME}, the flight engineer`,
    lines: [
      { icon: 'air', text: 'Alert: the base is losing air' },
      { icon: 'scope', text: `${ACT2_ENGINEER_NAME}, the engineer, has a scope for you` },
      { icon: 'check', text: 'Follow the arrow: press F' },
    ],
    done: (s) => Boolean(s.act2HasScope),
    example: { act2HasScope: true },
  },
  {
    id: 'find-leak',
    act: 2,
    zone: 'science',
    icon: 'scope',
    label: 'FIND THE LEAK',
    hint: 'Pick the scope and scan the base windows',
    place: null,
    objective: 'Scan the base windows with the scope to find the cracked one',
    lines: [
      { icon: 'scope', text: 'Pick the SCOPE in your hotbar' },
      { icon: 'check', text: 'Hold left-click on a window to scan' },
      { icon: 'air', text: 'One window is cracked: find it' },
    ],
    done: (s) => Boolean(s.act2LeakFound),
    example: { act2LeakFound: true },
  },
  {
    id: 'fix-window',
    act: 2,
    zone: 'airlock',
    icon: 'wrench',
    label: 'FIX THE WINDOW',
    hint: 'Get glass from your helper (F), then press F on the window',
    place: ACT2_PLACES.repair,
    objective: 'Get new glass from a crew helper and replace the cracked window',
    lines: [
      { icon: 'wrench', text: 'A crew helper brings new window glass' },
      { icon: 'check', text: 'Take the glass: press F on the helper' },
      { icon: 'air', text: 'Then press F on the cracked window' },
    ],
    done: (s) => Boolean(s.act2LeakFixed),
    example: { act2LeakFixed: true },
  },
  {
    id: 'scan-three',
    act: 2,
    zone: 'science',
    icon: 'scope',
    label: 'SCAN 3 THINGS',
    hint: 'Scope: scan Mars ground, Earth in the sky and the base',
    place: null,
    objective: 'Scan 3 things: the ground of Mars, Earth in the sky and a part of the base',
    lines: [
      { icon: 'rock', text: 'Scan the ground or a rock of Mars' },
      { icon: 'moon', text: 'Scan Earth, or anything in the sky' },
      { icon: 'home', text: 'Scan a part of your base' },
    ],
    checklist: (s) => s.act2ScanChecklist ?? null,
    done: (s) => Boolean(s.act2ScanMars && s.act2ScanSky && s.act2ScanBase),
    example: { act2ScanMars: true, act2ScanSky: true, act2ScanBase: true },
  },
  {
    id: 'journal-lesson',
    act: 2,
    zone: 'science',
    icon: 'medal',
    label: 'OPEN THE JOURNAL',
    hint: 'Open your journal, then follow the circles',
    place: null,
    objective: 'Open your journal and follow the 3 tips',
    lines: [
      { icon: 'check', text: 'Select the journal in your hotbar, then right-click or tap USE' },
      { icon: 'scope', text: 'It keeps everything you scan' },
      { icon: 'medal', text: 'Follow the circles: 3 quick tips' },
    ],
    done: (s) => Boolean(s.act2JournalLessonDone),
    example: { act2JournalLessonDone: true },
  },
];
