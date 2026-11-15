// @ts-nocheck
// A workout is local to the open panel. Rewards are applied by StationSystem.
export class GymWorkout {
  constructor(mode) {
    this.mode = mode;
    this.progress = 0;
    this.nextSide = 'left';
    this.lastInput = -Infinity;
  }
  step(input, position, now) {
    if (now - this.lastInput < 180) return { status: 'wait', message: 'Find your rhythm.' };
    this.lastInput = now;
    if (this.mode === 'treadmill') {
      if (input !== 'step') return { status: 'wait', message: 'Press Space to step.' };
      if (position < 34 || position > 66) return { status: 'miss', message: 'Wait for the green zone.' };
      this.progress = Math.min(100, this.progress + 25);
      return { status: 'hit', message: 'Nice step!' };
    }
    if (input !== this.nextSide) return { status: 'miss', message: `Now pedal ${this.nextSide}.` };
    this.nextSide = this.nextSide === 'left' ? 'right' : 'left';
    this.progress = Math.min(100, this.progress + 20);
    return { status: 'hit', message: `Good! Now pedal ${this.nextSide}.` };
  }
}
