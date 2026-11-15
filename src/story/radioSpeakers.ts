import { CREW_CONFIG } from '../config/constants.ts';

// Quem fala em cada card de radio (issue #135). So dados: o StoryHud desenha o rosto e o nome.
// Nome, papel e cor do traje vem da tripulacao de verdade (CREW_CONFIG), para o rosto do card
// ser o mesmo astronauta que anda pela base.

export interface RadioSpeaker {
  name: string;
  role: string; // papel completo (CREW_CONFIG.ROLES)
  tag: string; // papel em uma palavra, para o cabecalho do card
  color: string; // cor do traje, em #rrggbb
}

function crewSpeaker(roleTitle: string, tag: string): RadioSpeaker {
  const roles: { title: string }[] = CREW_CONFIG.ROLES;
  const index = roles.findIndex((role) => role.title === roleTitle);
  if (index < 0) throw new Error(`Unknown crew role: ${roleTitle}`);
  const color: number = CREW_CONFIG.SUIT_COLORS[index];
  return Object.freeze({
    name: CREW_CONFIG.NAMES[index],
    role: roleTitle,
    tag,
    color: `#${color.toString(16).padStart(6, '0')}`,
  });
}

export const SPEAKERS = Object.freeze({
  engineer: crewSpeaker('Flight Engineer', 'ENGINEER'),
  botanist: crewSpeaker('Botanist', 'BOTANIST'),
  medic: crewSpeaker('Medical Officer', 'MEDIC'),
  comms: crewSpeaker('Communications Officer', 'COMMS'),
});

// Avisos de radio em geral (clima, eventos, resposta da Terra) chegam pelo oficial de comunicacao
export const DEFAULT_SPEAKER: RadioSpeaker = SPEAKERS.comms;

// Tutorial: quem ensina cada secao da base (zonas de STEP_COLORS, em tutorialSteps.ts).
// Saude e radiacao sao da medica, planta e comida sao do botanico, radio e ciencia sao do
// oficial de comunicacao; o resto (ar, agua, energia, rover, foguete) e do engenheiro de voo.
const ZONE_SPEAKERS: Record<string, RadioSpeaker> = {
  greenhouse: SPEAKERS.botanist,
  kitchen: SPEAKERS.botanist,
  gym: SPEAKERS.medic,
  shelter: SPEAKERS.medic,
  radio: SPEAKERS.comms,
  science: SPEAKERS.comms,
};

export function speakerForZone(zone: string): RadioSpeaker {
  return ZONE_SPEAKERS[zone] ?? SPEAKERS.engineer;
}

export function cardSpeaker(card: object): RadioSpeaker {
  return (card as { speaker?: RadioSpeaker }).speaker ?? DEFAULT_SPEAKER;
}

// Rosto em pixel art 8x8: capacete na cor do traje (H), sombra do capacete (S), visor escuro (V)
// e o brilho do visor (G)
export const FACE_ROWS: readonly string[] = Object.freeze([
  '.HHHHHH.',
  'HHHHHHHH',
  'HVVVVVVH',
  'HVGGVVVH',
  'HVGVVVVH',
  'HVVVVVVH',
  'HHHHHHHS',
  '.SSSSSS.',
]);

const FACE_FIXED: Record<string, string> = { V: '#16212b', G: '#9fd4ff', S: 'rgba(0,0,0,0.35)' };
const faceCache = new Map<string, string>();

export function speakerFaceSvg(color: string): string {
  let svg = faceCache.get(color);
  if (!svg) {
    const rects: string[] = [];
    FACE_ROWS.forEach((row, y) => {
      [...row].forEach((c, x) => {
        if (c === '.') return;
        // A sombra e um escuro por cima da cor do traje
        if (c !== 'V' && c !== 'G') rects.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="${color}"/>`);
        if (c !== 'H') rects.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="${FACE_FIXED[c]}"/>`);
      });
    });
    svg = `<svg viewBox="0 0 8 8" shape-rendering="crispEdges" aria-hidden="true">${rects.join('')}</svg>`;
    faceCache.set(color, svg);
  }
  return svg;
}
