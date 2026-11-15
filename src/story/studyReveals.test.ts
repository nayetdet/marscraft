// @ts-nocheck
import { describe, expect, it } from 'vitest';
import research from '../data/osdrTopics.json';
import { OSDR_STUDIES, STUDY_TOPICS, organismWords, studyHonestyNote, studyPlace } from '../data/osdrStudies.ts';
import { StudyReveals } from './studyReveals.ts';

describe('osdrTopics.json', () => {
  it('was written by the fetch script with a collection date and real OSDR ids', () => {
    expect(Number.isNaN(Date.parse(research.retrieved))).toBe(false);
    for (const topic of STUDY_TOPICS) {
      const data = research.topics[topic.id];
      expect(data.query).toMatch(/^https:\/\/osdr\.nasa\.gov\/osdr\/data\/search\?term=/);
      expect(data.studies.length).toBeGreaterThan(0);
      for (const s of data.studies) {
        expect(s.id).toMatch(/^OSD-\d+$/);
        expect(s.url).toBe(`https://osdr.nasa.gov/bio/repo/data/studies/${s.id}`);
        expect(s.title.length).toBeGreaterThan(0);
      }
    }
  });
});

describe('osdrStudies', () => {
  it('every study has a kid sentence and appears only once', () => {
    const ids = OSDR_STUDIES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of OSDR_STUDIES) expect(s.explanation).not.toMatch(/Explore this real/);
  });

  it('says where each study was done and that it did not measure Mars', () => {
    expect(studyPlace({ flightProgram: 'International Space Station (ISS)' })).toBe('on the Space Station');
    expect(studyPlace({ flightProgram: '', mission: '' })).toBe('in a lab on Earth');
    expect(organismWords('Mus musculus     Microbiota')).toBe('mice and tiny living things');
    expect(studyHonestyNote({ place: 'in a lab on Earth', organismWords: 'mice' })).toBe('Done in a lab on Earth with mice. It did not measure Mars.');
  });
});

describe('StudyReveals', () => {
  it('a treadmill workout reveals a bone study, then the next one', () => {
    const reveals = new StudyReveals();
    const first = reveals.reveal('workout:treadmill');
    expect(first.topic).toBe('bone');
    const second = reveals.reveal('workout:treadmill');
    expect(second.id).not.toBe(first.id);
    expect(reveals.isRevealed(first.id)).toBe(true);
  });

  it('a bike workout reveals a muscle study', () => {
    expect(new StudyReveals().reveal('workout:bike').topic).toBe('muscle');
  });

  it('treatment and storms reveal radiation studies first', () => {
    const reveals = new StudyReveals();
    expect(reveals.reveal('treatment').topic).toBe('radiation');
    expect(reveals.reveal('storm-survived').topic).toBe('radiation');
  });

  it('moves to the next topic, and returns null when everything is revealed', () => {
    const studies = [
      { id: 'OSD-1', topic: 'bone' },
      { id: 'OSD-2', topic: 'muscle' },
    ];
    const reveals = new StudyReveals(studies);
    expect(reveals.reveal('workout:treadmill').id).toBe('OSD-1');
    expect(reveals.reveal('workout:treadmill').id).toBe('OSD-2');
    expect(reveals.reveal('workout:treadmill')).toBeNull();
    expect(reveals.count).toBe(2);
  });
});
