import { describe, expect, it } from 'vitest';
import { StoryDirector } from './StoryDirector.js';
import { objectiveView } from './objectiveView.js';
import { objectiveTarget } from './waypoints.js';
import { CERTIFICATES, certificateBadge } from './storyChapters.js';

// Issue #88: treino de cadete com 4 certificados entre avisar a Terra e buscar o gelo
function snap(overrides = {}) {
  return {
    hours: 15, insideHabitat: true, iceCount: 0, iceNeeded: 10, atConsole: false, stormPhase: 'calm',
    stormsSurvived: 0, propellantPct: 0, dataSent: false, launched: false,
    powerChecks: 0, harvestCount: 0, workoutCount: 0, shelterWaterL: 0,
    ...overrides,
  };
}

function inTraining() {
  const director = new StoryDirector({ training: true, replyDelayHours: 0.5 });
  director.start();
  director.update(snap());
  director.update(snap({ atConsole: true }));
  return director;
}

describe('cadet training (issue #88)', () => {
  it('starts the 4 certificates after calling Earth, instead of going straight to the ice', () => {
    const director = inTraining();
    expect(director.objectiveId).toBe('cert-power');
    const titles = director.drainEvents().filter((e) => e.type === 'card').map((e) => e.card.title);
    expect(titles).toContain('CADET TRAINING');
  });

  it('awards each certificate in order, then sends the cadet to the ice', () => {
    const director = inTraining();
    director.drainEvents();
    const s = snap();
    director.update(s);
    expect(director.objectiveId).toBe('cert-power');

    s.powerChecks = 1;
    director.update(s);
    expect(director.objectiveId).toBe('cert-greenhouse');
    s.harvestCount = 1;
    director.update(s);
    expect(director.objectiveId).toBe('cert-gym');
    s.workoutCount = 1;
    director.update(s);
    expect(director.objectiveId).toBe('cert-shelter');
    s.shelterWaterL = 10;
    director.update(s);
    expect(director.objectiveId).toBe('collect-ice');
    expect(director.certificates).toEqual(CERTIFICATES.map((c) => c.id));

    const events = director.drainEvents();
    const badges = events.filter((e) => e.type === 'certificate').map((e) => e.badge.name);
    expect(badges).toEqual(['ENGINEERING', 'SPACE BOTANY', 'HEALTH IN 0.38g', 'RADIATION SHIELDING']);
    expect(events.some((e) => e.type === 'card' && e.card.title === 'CADET CERTIFIED')).toBe(true);
    // As tempestades so comecam depois do gelo, nunca no meio do treino
    expect(events.some((e) => e.type === 'start-storms')).toBe(false);
  });

  it('only counts what the cadet does after the training starts', () => {
    const director = new StoryDirector({ training: true });
    director.start();
    director.update(snap());
    director.update(snap({ atConsole: true, powerChecks: 3 }));
    director.update(snap({ powerChecks: 3 }));
    expect(director.objectiveId).toBe('cert-power');
  });

  it('can be skipped from the demo menu, before or during the training', () => {
    const during = inTraining();
    expect(during.skipTraining(snap())).toBe(true);
    expect(during.objectiveId).toBe('collect-ice');

    const before = new StoryDirector({ training: true });
    expect(before.skipTraining()).toBe(false);
    before.start();
    before.update(snap());
    before.update(snap({ atConsole: true }));
    expect(before.objectiveId).toBe('collect-ice');
  });

  it('shows the 4 certificates as steps and points the arrow to each station', () => {
    const director = inTraining();
    const view = objectiveView(director, snap());
    expect(view.steps).toHaveLength(4);
    expect(view.steps[0].state).toBe('now');
    expect(view.task.label).toBe('CHECK THE BATTERY');
    expect(objectiveTarget('cert-power')).toBe('powerroom');
    expect(objectiveTarget('cert-shelter')).toBe('shelter');
  });

  it('runs a simulated radiation pulse on the shielding certificate', () => {
    const shelter = CERTIFICATES.find((c) => c.id === 'cert-shelter');
    expect(certificateBadge(shelter, { shelterWaterL: 10 }).line).toMatch(/10 L wall blocks 56%/);
  });
});

describe('cadet training stations', () => {
  it('routes the training stations through the airlock from outside', async () => {
    const { routeWaypoint } = await import('./waypoints.js');
    for (const place of ['powerroom', 'greenhouse', 'gym', 'shelter']) {
      expect(routeWaypoint(place, false)).toBe('airlock');
      expect(routeWaypoint(place, true)).toBe(place);
    }
  });
});
