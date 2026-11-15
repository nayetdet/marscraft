import { ACT3_CONFIG } from '../../config/constants.ts';
import { BOARDING_CAPTIONS } from '../acts/act3Gym.ts';
import { EASE, sampleKeys } from './timeline.ts';
import type { CaptionItem, CutsceneCameraLike, CutsceneCrewActorLike, FadeKey, VectorKey } from './rationDeliveryCutscene.ts';

// Cena da ida ate o foguete (issue #421), logo antes da decolagem. Tem duas versoes, pela forma
// fisica da crianca na hora do IGNITE (act3Gym.isBodyWeak):
//   - corpo forte: a crianca vai andando ate o foguete, com dois tripulantes ao lado;
//   - corpo fraco: dois tripulantes a carregam sentada entre eles ("cadeirinha").
// Quanto osso se perde em 0,38 g ninguem mediu: a regra e do jogo, e a legenda diz isso.
// Sem Three.js aqui: a camera, a crianca e os tripulantes chegam prontos do GameEngine.

export interface JointLike {
  rotation: { x: number; y: number; z: number };
}

// As juntas do boneco da crianca (buildSpacesuitRig / buildIvaAstronautRig)
export interface ChildRigLike {
  legL: JointLike;
  legR: JointLike;
  kneeL: JointLike;
  kneeR: JointLike;
  armL: JointLike;
  armR: JointLike;
  elbowL: JointLike;
  elbowR: JointLike;
}

export interface ChildActorLike {
  visible: boolean;
  position: { set(x: number, y: number, z: number): void };
  rotation: { order?: string; set(x: number, y: number, z: number): void };
}

export interface BoardingCrewLike extends CutsceneCrewActorLike {
  hide?(): void;
}

export interface BoardingCutsceneOptions {
  camera: CutsceneCameraLike;
  child: ChildActorLike;
  rigs: readonly ChildRigLike[]; // os bonecos dentro de `child` (com e sem traje): todos recebem a pose
  crew: readonly BoardingCrewLike[]; // ate 2 tripulantes
  pad: { x: number; y: number; z: number };
  walks: boolean; // true = vai andando; false = e carregada
  onEnd?: () => void;
}

export interface BoardingCutsceneDef {
  duration: number;
  runsUnlocked: boolean;
  walks: boolean;
  fadeColor: string;
  fade: FadeKey[];
  captions: CaptionItem[];
  update(t: number, dt: number): void;
  onEnd(): void;
}

const DURATION = ACT3_CONFIG.BOARDING_SECONDS;
// A caminhada termina aqui; o resto da cena e a chegada ao pe do foguete
export const BOARDING_WALK_END = DURATION - 2.2;
const FADE_OUT_START = DURATION - 0.6;

// Caminho no chao, relativo ao centro da plataforma: comeca na borda dela, do lado da base, e
// para ao pe do foguete
export const BOARDING_PATH = Object.freeze({
  from: Object.freeze({ x: -3.3, z: -3.0 }),
  to: Object.freeze({ x: -1.9, z: 1.3 }),
});
// Altura (acima do chao) em que a crianca vai sentada nos bracos da tripulacao
export const CARRY_HEIGHT = 0.42;
const CARRY_LEAN = -0.32; // inclinada para tras
const CREW_SIDE_WALK = 0.95; // distancia lateral dos tripulantes, andando ao lado
const CREW_SIDE_CARRY = 0.52; // idem, carregando
const CREW_BACK_WALK = 0.75; // andando, vem um pouco atras
const CHILD_WALK_RATE = 7.5; // passos da crianca (rad/s)
const CHILD_WALK_SWING = 0.55;

const _camPos = [0, 0, 0];
const _camLook = [0, 0, 0];
const _carryPose: Record<string, number> = {};
const _standPose: Record<string, number> = {};

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

function setChildJoints(rigs: readonly ChildRigLike[], legL: number, legR: number, knee: number, armL: number, armR: number, splay: number, elbow: number): void {
  for (const rig of rigs) {
    rig.legL.rotation.x = legL;
    rig.legR.rotation.x = legR;
    rig.kneeL.rotation.x = knee;
    rig.kneeR.rotation.x = knee;
    rig.armL.rotation.x = armL;
    rig.armR.rotation.x = armR;
    rig.armL.rotation.z = -splay;
    rig.armR.rotation.z = splay;
    rig.elbowL.rotation.x = elbow;
    rig.elbowR.rotation.x = elbow;
  }
}

export function createBoardingCutscene({ camera, child, rigs, crew, pad, walks, onEnd }: BoardingCutsceneOptions): BoardingCutsceneDef {
  const ax = pad.x + BOARDING_PATH.from.x;
  const az = pad.z + BOARDING_PATH.from.z;
  const bx = pad.x + BOARDING_PATH.to.x;
  const bz = pad.z + BOARDING_PATH.to.z;
  const length = Math.hypot(bx - ax, bz - az);
  const dirX = (bx - ax) / length;
  const dirZ = (bz - az) / length;
  const heading = Math.atan2(dirX, dirZ);
  // Para a direita de quem anda
  const sideX = dirZ;
  const sideZ = -dirX;
  const actors = crew.slice(0, 2);

  // Camera na frente do grupo, um pouco de lado: ele vem na direcao dela, com o foguete a direita.
  // De frente da para ver quem anda e quem vai sentado entre os dois tripulantes.
  const camPosKeys: VectorKey[] = [
    { t: 0, v: [bx + dirX * 3.4 - sideX * 3.0, pad.y + 1.75, bz + dirZ * 3.4 - sideZ * 3.0] },
    { t: BOARDING_WALK_END, v: [bx + dirX * 2.6 - sideX * 2.2, pad.y + 1.5, bz + dirZ * 2.6 - sideZ * 2.2], ease: EASE.inOut },
    { t: DURATION, v: [bx + dirX * 2.3 - sideX * 2.0, pad.y + 1.4, bz + dirZ * 2.3 - sideZ * 2.0], ease: EASE.out },
  ];
  const camLookKeys: VectorKey[] = [
    { t: 0, v: [ax, pad.y + 1.0, az] },
    { t: BOARDING_WALK_END, v: [bx, pad.y + 1.05, bz], ease: EASE.inOut },
    { t: DURATION, v: [bx, pad.y + 1.15, bz], ease: EASE.out },
  ];

  const fade: FadeKey[] = [
    { t: 0, v: 1 },
    { t: 0.4, v: 0, ease: EASE.out },
    { t: FADE_OUT_START, v: 0 },
    { t: DURATION, v: 1, ease: EASE.in },
  ];

  const title = walks ? BOARDING_CAPTIONS.walkTitle : BOARDING_CAPTIONS.carryTitle;
  const captions: CaptionItem[] = [
    { from: 0.3, to: 3.6, place: true, text: title, sub: walks ? BOARDING_CAPTIONS.walkSub : BOARDING_CAPTIONS.carrySub },
    { from: 3.6, to: DURATION - 0.2, place: true, text: title, sub: BOARDING_CAPTIONS.rule },
  ];

  return {
    duration: DURATION,
    runsUnlocked: true,
    walks,
    fadeColor: '#000',
    fade,
    captions,

    update(t: number, dt: number): void {
      if (t === 0) {
        for (const actor of actors) actor.cutsceneControlled = true;
        child.visible = true;
        // A inclinacao de quem e carregado e no eixo do proprio corpo, depois do giro
        if ('order' in child.rotation) child.rotation.order = 'YXZ';
      }

      // Corpo fraco anda mais devagar: a tripulacao carrega peso
      const k = walks ? clamp01(t / BOARDING_WALK_END) : EASE.out(clamp01(t / BOARDING_WALK_END));
      const x = ax + (bx - ax) * k;
      const z = az + (bz - az) * k;
      const moving = t < BOARDING_WALK_END;
      const rest = t - BOARDING_WALK_END; // segundos parado ao pe do foguete

      if (walks) {
        // 1a. A crianca anda sozinha e, ao chegar, comemora com os bracos para cima
        if (moving) {
          const swing = Math.sin(t * CHILD_WALK_RATE) * CHILD_WALK_SWING;
          const bob = Math.abs(Math.cos(t * CHILD_WALK_RATE)) * 0.035;
          child.position.set(x, pad.y + bob, z);
          setChildJoints(rigs, swing, -swing, 0.18, -swing * 0.8, swing * 0.8, 0.1, -0.3);
        } else {
          const cheer = Math.abs(Math.sin(rest * 6.5));
          child.position.set(x, pad.y + cheer * 0.12, z);
          setChildJoints(rigs, 0, 0, 0, -2.4 - cheer * 0.3, -2.4 - cheer * 0.3, 0.25, -0.2);
        }
        child.rotation.set(0, heading, 0);
      } else {
        // 1b. A crianca vai sentada nos bracos da tripulacao: pernas para a frente, bracos nos ombros
        const sway = moving ? Math.sin(t * 6) * 0.025 : 0;
        child.position.set(x, pad.y + CARRY_HEIGHT + sway, z);
        child.rotation.set(CARRY_LEAN, heading, 0);
        setChildJoints(rigs, -1.25, -1.25, 1.15, -0.35, -0.35, 1.25, -0.25);
      }

      // 2. Tripulantes: um de cada lado. Andando, vem um pouco atras; carregando, colados na crianca
      const side = walks ? CREW_SIDE_WALK : CREW_SIDE_CARRY;
      const back = walks ? CREW_BACK_WALK : 0.05;
      for (let i = 0; i < actors.length; i++) {
        const sign = i === 0 ? -1 : 1;
        const cx = x + sideX * side * sign - dirX * back;
        const cz = z + sideZ * side * sign - dirZ * back;
        if (walks) {
          if (moving) {
            actors[i].poseWalking(cx, pad.y, cz, heading, dt, null);
          } else {
            // Parados, olham para a crianca e acenam
            const pose = _standPose;
            const wave = Math.sin(clamp01(rest / 1.6) * Math.PI);
            pose.armL = 0;
            pose.armR = -2.1 * wave;
            pose.elbowL = -0.18;
            pose.elbowR = -0.4 + Math.sin(rest * 11) * 0.3 * wave;
            pose.headYaw = -0.35 * sign;
            actors[i].poseStanding(cx, pad.y, cz, heading, pose);
          }
        } else {
          // Os dois bracos para a frente e para baixo, fazendo o assento
          const pose = _carryPose;
          pose.armL = -0.85;
          pose.armR = -0.85;
          pose.elbowL = -0.75;
          pose.elbowR = -0.75;
          pose.armSplay = -0.1;
          pose.torsoLean = 0.1;
          pose.headYaw = -0.25 * sign;
          if (moving) actors[i].poseWalking(cx, pad.y, cz, heading, dt * 0.7, pose);
          else actors[i].poseStanding(cx, pad.y, cz, heading, pose);
        }
      }

      // 3. Camera
      sampleKeys(camPosKeys, t, _camPos);
      sampleKeys(camLookKeys, t, _camLook);
      camera.position.set(_camPos[0], _camPos[1], _camPos[2]);
      camera.lookAt(_camLook[0], _camLook[1], _camLook[2]);
    },

    // Todos entram no foguete: somem da cena. O proximo update() de cada tripulante o traz de
    // volta ao seu posto (modo livre, depois da tela de vitoria).
    onEnd(): void {
      for (const actor of actors) {
        actor.cutsceneControlled = false;
        actor.hide?.();
      }
      child.visible = false;
      child.rotation.set(0, 0, 0);
      setChildJoints(rigs, 0, 0, 0, -0.08, -0.08, 0.1, -0.16);
      onEnd?.();
    },
  };
}
