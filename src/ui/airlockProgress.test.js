import { describe, expect, it } from 'vitest';
import { airlockProgress } from './airlockProgress.js';

const status = (overrides) => ({ step: 'pressurize', stepIndex: 1, stepCount: 3, fill: 0.5, cleanNeeded: false, cleanPossible: true, ...overrides });

describe('airlockProgress', () => {
  it('is hidden when the airlock is not cycling', () => {
    expect(airlockProgress(null)).toBeNull();
  });

  it('shows the step number and what is happening', () => {
    expect(airlockProgress(status())).toEqual({ title: 'AIRLOCK 2/3', fill: 0.5, tone: 'ok', text: 'Filling the airlock with air...' });
    expect(airlockProgress(status({ step: 'depressurize', stepCount: 2 })).text).toContain('Pumping the air out');
  });

  it('shows the suit cleaning, or warns when there is no power for it', () => {
    expect(airlockProgress(status({ step: 'clean', stepIndex: 2, cleanNeeded: true })).tone).toBe('clean');
    expect(airlockProgress(status({ step: 'clean', stepIndex: 2, cleanNeeded: true, cleanPossible: false })).tone).toBe('warn');
  });
});
