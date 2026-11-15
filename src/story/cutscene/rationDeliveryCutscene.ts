import { EASE, sampleKeys } from './timeline.ts';

export interface VectorKey {
  t: number;
  v: number[];
  ease?: (k: number) => number;
}

export interface FadeKey {
  t: number;
  v: number;
  ease?: (k: number) => number;
}

export interface CaptionItem {
  from: number;
  to: number;
  text: string;
  sub?: string;
  big?: boolean;
  place?: boolean;
  side?: boolean;
}

export interface Vec3Like {
  x: number;
  y: number;
  z: number;
  set(x: number, y: number, z: number): void;
}

export interface CutsceneCameraLike {
  position: Vec3Like;
  lookAt(x: number, y: number, z: number): void;
}

export interface CutscenePropLike {
  visible: boolean;
  position: Vec3Like;
  rotation: Vec3Like;
  scale: Vec3Like;
}

export interface CutsceneCrewActorLike {
  cutsceneControlled: boolean;
  poseWalking(
    x: number,
    y: number,
    z: number,
    heading: number,
    dt: number,
    overrides?: Record<string, number> | null
  ): void;
  poseStanding(
    x: number,
    y: number,
    z: number,
    heading: number,
    overrides?: Record<string, number> | null
  ): void;
}

export interface RationDeliveryCutsceneOptions {
  camera: CutsceneCameraLike;
  botanist: CutsceneCrewActorLike;
  cook: CutsceneCrewActorLike;
  cropProp: CutscenePropLike;
  rationProp: CutscenePropLike;
  observer?: { visible: boolean; position: Vec3Like; rotation: Vec3Like };
  observerPosition?: { x: number; z: number };
  cropType?: string;
  botanistName?: string;
  cookName?: string;
  floorY?: number;
  onHandoff?: () => void;
  onPacked?: () => void;
  onEnd?: () => void;
}

export interface RationDeliveryCutsceneDef {
  duration: number;
  fadeColor: string;
  fade: FadeKey[];
  captions: CaptionItem[];
  update(t: number, dt: number): void;
  onEnd(): void;
}

const LANE_Z = -22.2;
const BOTANIST_START_X = 4.6;
const BOTANIST_STOP_X = 10.75;
const COOK_X = 12.1;

const WALK_END = 2.6;
const HANDOFF_TRANSFER = 3.2;
const HANDOFF_ARRIVE = 3.9;
const PACK_START = 4.9;
const PACK_POP = 5.55;
const DURATION = 7.6;

const HALF_PI = Math.PI / 2;

const _camPos = [0, 0, 0];
const _camLook = [0, 0, 0];
const _botanistPose: Record<string, number> = {};
const _cookPose: Record<string, number> = {};

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function resetPose(target: Record<string, number>): Record<string, number> {
  target.bobY = 0;
  target.armL = 0;
  target.armR = 0;
  target.elbowL = -0.18;
  target.elbowR = -0.18;
  target.armSplay = 0.06;
  target.torsoLean = 0;
  target.torsoTwist = 0;
  target.torsoRoll = 0;
  target.headPitch = 0;
  target.headYaw = 0;
  return target;
}

/**
 * 3D cutscene inside the kitchen showing the greenhouse botanist delivering
 * freshly harvested food to the cook, who packs it into a space ration.
 */
export function createRationDeliveryCutscene({
  camera,
  botanist,
  cook,
  cropProp,
  rationProp,
  observer,
  observerPosition,
  cropType = 'potato',
  botanistName = 'Leo',
  cookName = 'Noor',
  floorY = 10,
  onHandoff,
  onPacked,
  onEnd,
}: RationDeliveryCutsceneOptions): RationDeliveryCutsceneDef {
  const camPosKeys: VectorKey[] = [
    { t: 0, v: [14.7, floorY + 2.15, -24.1] },
    { t: WALK_END, v: [13.5, floorY + 1.9, -24.0], ease: EASE.inOut },
    { t: PACK_START, v: [11.4, floorY + 1.75, -24.3], ease: EASE.inOut },
    { t: DURATION, v: [12.0, floorY + 1.65, -23.75], ease: EASE.out },
  ];

  const camLookKeys: VectorKey[] = [
    { t: 0, v: [8.2, floorY + 1.2, -22.2] },
    { t: WALK_END, v: [11.2, floorY + 1.22, -22.2], ease: EASE.inOut },
    { t: PACK_START, v: [11.45, floorY + 1.25, -22.2], ease: EASE.inOut },
    { t: DURATION, v: [11.65, floorY + 1.3, -22.2], ease: EASE.out },
  ];

  const fade: FadeKey[] = [
    { t: 0, v: 1 },
    { t: 0.35, v: 0, ease: EASE.out },
    { t: DURATION - 0.55, v: 0 },
    { t: DURATION, v: 1, ease: EASE.in },
  ];

  const cropLabel = cropType || 'harvest';
  const captions: CaptionItem[] = [
    { from: 0.25, to: 2.75, place: true, text: 'THE KITCHEN', sub: `${botanistName} brings ${cropLabel} from the greenhouse.` },
    { from: 2.75, to: 5.15, place: true, text: 'PACKING RATIONS', sub: 'Harvest and habitat power pack a ration.' },
    { from: 5.15, to: DURATION - 0.1, place: true, text: 'RATION READY', sub: `Talk to ${cookName} here to grab one.` },
  ];

  let handoffTriggered = false;
  let packedTriggered = false;

  return {
    duration: DURATION,
    fadeColor: '#000',
    fade,
    captions,

    update(t: number, dt: number): void {
      if (t === 0) {
        handoffTriggered = false;
        packedTriggered = false;
        botanist.cutsceneControlled = true;
        cook.cutsceneControlled = true;
        cropProp.visible = true;
        rationProp.visible = false;
        if (observer) {
          observer.position.set(observerPosition?.x ?? 6.2, floorY, observerPosition?.z ?? -21);
          observer.rotation.set(0, HALF_PI, 0);
          observer.visible = true;
        }
      }

      if (t >= HANDOFF_TRANSFER && !handoffTriggered) {
        handoffTriggered = true;
        onHandoff?.();
      }
      if (t >= PACK_POP && !packedTriggered) {
        packedTriggered = true;
        onPacked?.();
      }

      // 1. Botanist: walks in carrying the crop, hands it over, then celebrates
      const bp = resetPose(_botanistPose);
      if (t < WALK_END) {
        const walkK = EASE.out(clamp01(t / WALK_END));
        const bx = BOTANIST_START_X + (BOTANIST_STOP_X - BOTANIST_START_X) * walkK;
        bp.armL = -0.72;
        bp.armR = -0.72;
        bp.elbowL = -0.88;
        bp.elbowR = -0.88;
        bp.armSplay = -0.06;
        bp.torsoLean = 0.08;
        botanist.poseWalking(bx, floorY, LANE_Z, HALF_PI, dt, bp);
      } else if (t < PACK_START) {
        const reach =
          t < HANDOFF_TRANSFER
            ? EASE.out(clamp01((t - WALK_END) / (HANDOFF_TRANSFER - WALK_END)))
            : 1 - EASE.inOut(clamp01((t - HANDOFF_ARRIVE) / (PACK_START - HANDOFF_ARRIVE)));
        const nod = t >= HANDOFF_ARRIVE ? Math.sin((t - HANDOFF_ARRIVE) * 7) * 0.12 : 0;
        bp.armL = -0.72 - 0.36 * reach;
        bp.armR = -0.72 - 0.36 * reach;
        bp.elbowL = -0.88 + 0.5 * reach;
        bp.elbowR = -0.88 + 0.5 * reach;
        bp.armSplay = -0.04;
        bp.torsoLean = 0.08 * reach;
        bp.headPitch = nod;
        botanist.poseStanding(BOTANIST_STOP_X, floorY, LANE_Z, HALF_PI, bp);
      } else {
        const local = t - PACK_START;
        const cheer = t >= PACK_POP ? Math.abs(Math.sin((t - PACK_POP) * 6.5)) : 0;
        bp.bobY = cheer * 0.05;
        bp.armL = -0.45 - cheer * 0.85;
        bp.armR = -0.45 - cheer * 0.85;
        bp.elbowL = -0.65;
        bp.elbowR = -0.65;
        bp.armSplay = 0.14;
        bp.headPitch = -0.08 - cheer * 0.1;
        bp.headYaw = Math.sin(local * 2.5) * 0.08;
        botanist.poseStanding(BOTANIST_STOP_X, floorY, LANE_Z, HALF_PI * 0.9, bp);
      }

      // 2. Cook: waves greeting, receives crop, packs & proudly holds up space ration
      const cp = resetPose(_cookPose);
      let cookHeading = -HALF_PI;
      if (t < WALK_END) {
        const turnK = EASE.inOut(clamp01((t - 0.5) / 0.7));
        cookHeading = Math.PI * 0.35 + (-HALF_PI - Math.PI * 0.35) * turnK;
        const waveWindow = t >= 1.1 && t <= 2.3 ? Math.sin(((t - 1.1) / 1.2) * Math.PI) : 0;
        cp.armR = -2.15 * waveWindow;
        cp.elbowR = (-0.55 + Math.sin(t * 11) * 0.32) * waveWindow;
        cp.headPitch = -0.06 * waveWindow;
        cp.headYaw = 0.1 * waveWindow;
      } else if (t < PACK_START) {
        const receiveK = EASE.inOut(clamp01((t - WALK_END) / (HANDOFF_TRANSFER - WALK_END)));
        const cradleK = EASE.out(clamp01((t - HANDOFF_ARRIVE) / 0.5));
        cp.armL = -0.95 * receiveK + 0.25 * cradleK;
        cp.armR = -0.95 * receiveK + 0.25 * cradleK;
        cp.elbowL = -0.35 - 0.55 * cradleK;
        cp.elbowR = -0.35 - 0.55 * cradleK;
        cp.armSplay = -0.04;
        cp.torsoLean = 0.08 * receiveK * (1 - cradleK);
        cp.headPitch = 0.1 * Math.sin(clamp01((t - HANDOFF_ARRIVE) / 0.7) * Math.PI);
      } else if (t < PACK_POP) {
        const packK = clamp01((t - PACK_START) / (PACK_POP - PACK_START));
        const turnK = EASE.inOut(packK);
        cookHeading = -HALF_PI + (-Math.PI * 0.78 - -HALF_PI) * turnK;
        const mix = Math.sin(packK * Math.PI * 3);
        cp.armL = -0.78 + mix * 0.14;
        cp.armR = -0.78 - mix * 0.14;
        cp.elbowL = -0.95;
        cp.elbowR = -0.95;
        cp.armSplay = -0.08;
        cp.torsoLean = 0.12;
        cp.headPitch = 0.2;
      } else {
        cookHeading = -Math.PI * 0.78;
        const holdK = EASE.out(clamp01((t - PACK_POP) / 0.4));
        const sway = Math.sin((t - PACK_POP) * 3.2) * 0.06;
        cp.bobY = Math.sin((t - PACK_POP) * 6) * 0.015;
        cp.armR = -1.35 * holdK + sway;
        cp.elbowR = -0.35 * holdK;
        cp.armL = -0.25;
        cp.elbowL = -0.4;
        cp.headPitch = -0.08;
      }
      cook.poseStanding(COOK_X, floorY, LANE_Z, cookHeading, cp);

      // 3. Crop prop: rides with botanist, arcs into cook's hands, shrinks into ration
      if (t < HANDOFF_TRANSFER) {
        const bx =
          t < WALK_END
            ? BOTANIST_START_X + (BOTANIST_STOP_X - BOTANIST_START_X) * EASE.out(clamp01(t / WALK_END))
            : BOTANIST_STOP_X;
        const reach = t >= WALK_END ? EASE.out(clamp01((t - WALK_END) / (HANDOFF_TRANSFER - WALK_END))) : 0;
        cropProp.visible = true;
        cropProp.position.set(bx + 0.42 + reach * 0.14, floorY + 1.18 + Math.sin(t * 7) * 0.015, LANE_Z);
        cropProp.rotation.set(0, HALF_PI + Math.sin(t * 2) * 0.08, 0);
        cropProp.scale.set(0.65, 0.65, 0.65);
      } else if (t < HANDOFF_ARRIVE) {
        const k = EASE.inOut(clamp01((t - HANDOFF_TRANSFER) / (HANDOFF_ARRIVE - HANDOFF_TRANSFER)));
        const arcY = Math.sin(k * Math.PI) * 0.22;
        cropProp.visible = true;
        cropProp.position.set(11.31 + (11.58 - 11.31) * k, floorY + 1.2 + arcY, LANE_Z);
        cropProp.rotation.set(0, HALF_PI + k * Math.PI, 0);
        cropProp.scale.set(0.65, 0.65, 0.65);
      } else if (t < PACK_POP) {
        const shrink = t >= PACK_START ? 1 - EASE.in(clamp01((t - PACK_START) / (PACK_POP - PACK_START))) : 1;
        cropProp.visible = shrink > 0.02;
        const s = 0.65 * Math.max(0.01, shrink);
        cropProp.position.set(11.65, floorY + 1.16, LANE_Z - (t >= PACK_START ? 0.12 : 0));
        cropProp.rotation.set(0, -HALF_PI + (t >= PACK_START ? (t - PACK_START) * 4 : 0), 0);
        cropProp.scale.set(s, s, s);
      } else {
        cropProp.visible = false;
      }

      // 4. Space ration prop: pops into cook's raised right hand once packed
      if (t >= PACK_POP) {
        const popK = clamp01((t - PACK_POP) / 0.35);
        const bounce = popK < 0.7 ? (popK / 0.7) * 1.18 : 1.18 - ((popK - 0.7) / 0.3) * 0.18;
        const s = 0.62 * bounce;
        rationProp.visible = true;
        rationProp.position.set(11.58, floorY + 1.46 + Math.sin((t - PACK_POP) * 3.5) * 0.03, LANE_Z - 0.42);
        rationProp.rotation.set(0.15, Math.PI + Math.sin((t - PACK_POP) * 2.4) * 0.35, -0.08);
        rationProp.scale.set(s, s, s);
      } else {
        rationProp.visible = false;
      }

      // 5. Camera framing inside kitchen
      sampleKeys(camPosKeys, t, _camPos);
      sampleKeys(camLookKeys, t, _camLook);
      camera.position.set(_camPos[0], _camPos[1], _camPos[2]);
      camera.lookAt(_camLook[0], _camLook[1], _camLook[2]);
    },

    onEnd(): void {
      botanist.cutsceneControlled = false;
      cook.cutsceneControlled = false;
      cropProp.visible = false;
      rationProp.visible = false;
      if (observer) observer.visible = false;
      onEnd?.();
    },
  };
}
