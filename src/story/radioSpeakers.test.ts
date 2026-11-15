import { describe, expect, it } from 'vitest';
import { CREW_CONFIG, STORY_CONFIG } from '../config/constants.ts';
import { DEFAULT_SPEAKER, FACE_ROWS, SPEAKERS, cardSpeaker, speakerFaceSvg, speakerForZone } from './radioSpeakers.ts';
import { CARDS, commsCard, replyCard } from './storyChapters.ts';
import { TUTORIAL_STEPS, stepCard } from './tutorialSteps.ts';
import { TRADEOFF_SCENES } from './tradeoffScenes.ts';

const comms = { millionKm: 197, oneWayMinutes: 11, dateIso: '2026-11-15T12:00:00.000Z' };

describe('radio speakers', () => {
  it('takes name and suit color from the real crew', () => {
    for (const speaker of Object.values(SPEAKERS)) {
      const index = CREW_CONFIG.NAMES.indexOf(speaker.name);
      expect(index, speaker.name).toBeGreaterThanOrEqual(0);
      expect(CREW_CONFIG.ROLES[index].title).toBe(speaker.role);
      expect(parseInt(speaker.color.slice(1), 16)).toBe(CREW_CONFIG.SUIT_COLORS[index]);
      expect(speaker.color).toMatch(/^#[0-9a-f]{6}$/);
      expect(speaker.tag).toMatch(/^[A-Z]+$/);
    }
  });

  it('puts the medical officer on the solar storm alert and the comms officer on the radio cards', () => {
    expect(CARDS.stormGuide.speaker).toBe(SPEAKERS.medic);
    expect(SPEAKERS.medic.role).toBe('Medical Officer');
    expect(commsCard(comms).speaker).toBe(SPEAKERS.comms);
    expect(replyCard(comms).speaker).toBe(SPEAKERS.comms);
    expect(SPEAKERS.comms.name).toBe('Ravi');
  });

  it('gives every card a speaker, even one that does not name it', () => {
    expect(cardSpeaker({})).toBe(DEFAULT_SPEAKER);
    for (const card of Object.values(CARDS)) expect(cardSpeaker(card).name).toBeTruthy();
    TUTORIAL_STEPS.forEach((step, i) => {
      const card = stepCard(step, i, TUTORIAL_STEPS.length);
      expect(card.speaker, step.id).toBe(speakerForZone(step.zone));
    });
    expect(speakerForZone('shelter')).toBe(SPEAKERS.medic);
    expect(speakerForZone('power')).toBe(SPEAKERS.engineer);
  });

  it('draws an 8x8 helmet in the suit color', () => {
    expect(FACE_ROWS).toHaveLength(8);
    for (const row of FACE_ROWS) expect(row).toMatch(/^[.HSVG]{8}$/);
    const svg = speakerFaceSvg(SPEAKERS.medic.color);
    expect(svg).toContain(`fill="${SPEAKERS.medic.color}"`);
    expect(speakerFaceSvg(SPEAKERS.medic.color)).toBe(svg);
  });
});

describe('holo-comms cards (issue #135)', () => {
  it('lets the storm alert be answered with keys 1 and 2, and no choice is free', () => {
    const { choices } = CARDS.stormGuide;
    expect(choices.map((choice) => [choice.key, choice.id, choice.name])).toEqual([['1', 'hide', 'HIDE'], ['2', 'shield', 'SHIELD']]);
    for (const choice of choices) {
      expect(choice.good).toBeTruthy();
      expect(choice.bad).toBeTruthy();
    }
  });

  it('closes MESSAGE SENT by itself after 4 seconds', () => {
    expect(STORY_CONFIG.COMMS_CARD_SECONDS).toBe(4);
    expect(commsCard(comms).seconds).toBe(STORY_CONFIG.COMMS_CARD_SECONDS);
    expect(commsCard(comms).link).toEqual({ minutes: 11, millionKm: 197 });
    // Os outros cards da historia ficam o tempo padrao
    expect(CARDS.stormGuide).not.toHaveProperty('seconds');
  });

  it('never lets the solar storm trade-off modal hold the player: it closes by itself', () => {
    const scene = TRADEOFF_SCENES.find((s) => s.triggers.includes('storm-warning'));
    expect(scene?.urgent).toBe(true);
    expect(STORY_CONFIG.URGENT_TRADEOFF_SECONDS).toBeGreaterThan(0);
    expect(STORY_CONFIG.URGENT_TRADEOFF_SECONDS).toBeLessThanOrEqual(STORY_CONFIG.CARD_SECONDS);
  });
});
