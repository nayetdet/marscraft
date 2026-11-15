import { describe, expect, it } from 'vitest';
import { EVENTS_CONFIG } from '../config/constants.ts';
import { hasPixelSprite } from '../ui/pixelSprites.ts';
import { TRADEOFF_LIMITS, TRADEOFF_SCENES, TradeoffLedger, sceneForTrigger } from './tradeoffScenes.ts';
import { TUTORIAL_STEPS, stepCard } from './tutorialSteps.ts';

const words = (text: string) => text.trim().split(/\s+/).length;

describe('trade-off scenes', () => {
  it('keeps every scene short enough for a child to read fast', () => {
    for (const scene of TRADEOFF_SCENES) {
      expect(words(scene.word), scene.id).toBeLessThanOrEqual(TRADEOFF_LIMITS.WORD_WORDS);
      expect(words(scene.line), scene.id).toBeLessThanOrEqual(TRADEOFF_LIMITS.LINE_WORDS);
      expect(scene.targets.length, scene.id).toBeGreaterThanOrEqual(TRADEOFF_LIMITS.MIN_TARGETS);
      expect(scene.targets.length, scene.id).toBeLessThanOrEqual(TRADEOFF_LIMITS.MAX_TARGETS);
      for (const target of scene.targets) {
        expect(target.label.length, `${scene.id}: ${target.label}`).toBeLessThanOrEqual(TRADEOFF_LIMITS.LABEL_CHARS);
      }
    }
  });

  it('has a colored sprite for every drawing', () => {
    for (const scene of TRADEOFF_SCENES) {
      expect(hasPixelSprite(scene.source), `${scene.id}: ${scene.source}`).toBe(true);
      for (const target of scene.targets) expect(hasPixelSprite(target.art), `${scene.id}: ${target.art}`).toBe(true);
    }
  });

  it('never shows a free choice: a scene is all "pick one", or it has a cost', () => {
    for (const scene of TRADEOFF_SCENES) {
      const tones = scene.targets.map((target) => target.tone);
      const allPick = tones.every((tone) => tone === 'pick');
      expect(allPick || tones.includes('cost'), scene.id).toBe(true);
    }
  });

  it('uses unique ids, a valid accent color and one scene per trigger', () => {
    expect(new Set(TRADEOFF_SCENES.map((scene) => scene.id)).size).toBe(TRADEOFF_SCENES.length);
    const triggers = TRADEOFF_SCENES.flatMap((scene) => scene.triggers);
    expect(new Set(triggers).size).toBe(triggers.length);
    for (const scene of TRADEOFF_SCENES) {
      expect(scene.accent, scene.id).toMatch(/^#[0-9a-f]{6}$/);
      expect(scene.triggers.length, scene.id).toBeGreaterThan(0);
    }
  });

  it('does not explain the same trade-off twice: no two scenes share drawing and targets', () => {
    const shape = (scene: (typeof TRADEOFF_SCENES)[number]) => `${scene.source}>${scene.targets.map((t) => `${t.tone}:${t.art}`).sort().join(',')}`;
    expect(new Set(TRADEOFF_SCENES.map(shape)).size).toBe(TRADEOFF_SCENES.length);
    // meteoro = gelo la fora, o mesmo trade-off de OUTSIDE: sem cena propria
    expect(sceneForTrigger('event:meteor')).toBeNull();
  });

  it('points every trigger at a tutorial step or a Mars event that exists', () => {
    const stepIds = TUTORIAL_STEPS.map((step) => step.id);
    for (const scene of TRADEOFF_SCENES) {
      for (const trigger of scene.triggers) {
        if (trigger.startsWith('step:')) expect(stepIds, trigger).toContain(trigger.slice(5));
        if (trigger.startsWith('event:')) expect(EVENTS_CONFIG.RANDOM_TYPES, trigger).toContain(trigger.slice(6));
      }
    }
    // o balao do passo carrega o id, que o GameEngine usa como gatilho
    expect(stepCard(TUTORIAL_STEPS[0], 0, 1).stepId).toBe(TUTORIAL_STEPS[0].id);
    expect(sceneForTrigger('step:collect-ice')?.id).toBe('outside');
    expect(sceneForTrigger('step:drink')).toBeNull();
  });
});

describe('trade-off ledger', () => {
  it('shows each scene once, in the order the situations arrive', () => {
    const ledger = new TradeoffLedger();
    expect(ledger.request('step:cert-power')).toBe(true);
    expect(ledger.request('step:cert-power')).toBe(false); // ja na fila
    expect(ledger.request('sunset')).toBe(true);
    expect(ledger.request('step:drink')).toBe(false); // sem cena
    expect(ledger.hasPending).toBe(true);
    expect(ledger.next()?.id).toBe('power');
    expect(ledger.next()?.id).toBe('night');
    expect(ledger.next()).toBeNull();
    expect(ledger.hasPending).toBe(false);
    // a segunda vez que a situacao chega, a crianca resolve sozinha
    expect(ledger.request('step:cert-power')).toBe(false);
    expect(ledger.request('sunset')).toBe(false);
    expect(ledger.seenIds).toEqual(['power', 'night']);
  });

  it('remembers what a saved game already showed', () => {
    const ledger = new TradeoffLedger(['dust']);
    expect(ledger.request('dust-warning')).toBe(false);
    expect(ledger.request('storm-warning')).toBe(true);
    expect(ledger.next()?.id).toBe('solar');
    expect(ledger.seenIds.sort()).toEqual(['dust', 'solar']);
  });
});
