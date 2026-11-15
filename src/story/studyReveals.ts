// @ts-nocheck
import { OSDR_STUDIES } from '../data/osdrStudies.ts';

// Qual estudo real do OSDR cada acao revela (issue #106). Sem DOM, para testar com Vitest.
// Cada gatilho tenta os temas na ordem; revela o primeiro estudo ainda escondido.
export const STUDY_TRIGGERS = {
  'workout:treadmill': ['bone', 'muscle'],
  'workout:bike': ['muscle', 'bone'],
  treatment: ['radiation', 'immune'],
  'storm-survived': ['radiation'],
  sleep: ['sleep'], // issue #109 (beliche) pode chamar reveal('sleep')
};

export class StudyReveals {
  constructor(studies = OSDR_STUDIES) {
    this.studies = studies;
    this.revealed = []; // ids, na ordem em que apareceram
  }

  isRevealed(id) {
    return this.revealed.includes(id);
  }

  get count() {
    return this.revealed.length;
  }

  get total() {
    return this.studies.length;
  }

  // Revela o proximo estudo do gatilho. Devolve o estudo novo ou null (tudo ja revelado).
  reveal(trigger) {
    const topics = STUDY_TRIGGERS[trigger] ?? [trigger];
    for (const topic of topics) {
      const study = this.studies.find((s) => s.topic === topic && !this.isRevealed(s.id));
      if (study) {
        this.revealed.push(study.id);
        return study;
      }
    }
    return null;
  }
}
