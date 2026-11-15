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

  it('says the door is being opened by hand when there is no power (issue #79)', () => {
    const view = airlockProgress(status({ step: 'manual', stepIndex: 2, stepCount: 3, manual: true }));
    expect(view).toEqual({ title: 'AIRLOCK 3/3', fill: 0.5, tone: 'warn', text: 'No power: cranking the door open by hand...' });
  });
});
