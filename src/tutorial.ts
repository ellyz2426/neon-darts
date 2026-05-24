// Tutorial system — step-by-step onboarding for new players
export interface TutorialStep {
  id: string;
  title: string;
  message: string;
  highlight?: string; // UI element to highlight
  action: 'wait' | 'throw' | 'click' | 'aim';
  targetScore?: number;
  targetSegment?: number;
  completed: boolean;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Neon Darts!',
    message: 'Let\'s learn the basics. Press anywhere to continue.',
    action: 'click',
    completed: false,
  },
  {
    id: 'aim',
    title: 'Aiming',
    message: 'Move your mouse (or VR controller) to aim at the dartboard. Try pointing at the 20 segment at the top.',
    action: 'aim',
    completed: false,
  },
  {
    id: 'throw1',
    title: 'Your First Throw',
    message: 'Click and hold to charge your throw. Release to throw! Try to hit any number.',
    action: 'throw',
    completed: false,
  },
  {
    id: 'power',
    title: 'Power Control',
    message: 'The longer you hold, the more power. A medium throw is usually best. Try another throw!',
    action: 'throw',
    completed: false,
  },
  {
    id: 'scoring',
    title: 'Scoring',
    message: 'Singles score face value. Doubles (outer ring) = 2×. Triples (inner ring) = 3×. Bullseye = 50! Throw once more.',
    action: 'throw',
    completed: false,
  },
  {
    id: 'modes',
    title: 'Game Modes',
    message: 'You\'re ready! Choose from 8 game modes. Start with 501 for the classic darts experience. Good luck!',
    action: 'click',
    completed: false,
  },
];

const STORAGE_KEY = 'neon-darts-tutorial';

export class TutorialManager {
  private steps: TutorialStep[];
  private currentStepIndex = 0;
  private active = false;
  private completed = false;
  private throwCount = 0;
  private onStepChange: ((step: TutorialStep) => void) | null = null;
  private onComplete: (() => void) | null = null;

  constructor() {
    this.steps = TUTORIAL_STEPS.map(s => ({ ...s }));
    this.load();
  }

  private load(): void {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        this.completed = parsed.completed === true;
      }
    } catch {}
  }

  private save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ completed: this.completed }));
    } catch {}
  }

  isCompleted(): boolean {
    return this.completed;
  }

  isActive(): boolean {
    return this.active;
  }

  getCurrentStep(): TutorialStep | null {
    if (!this.active || this.currentStepIndex >= this.steps.length) return null;
    return this.steps[this.currentStepIndex];
  }

  start(onStepChange: (step: TutorialStep) => void, onComplete: () => void): void {
    if (this.completed) {
      onComplete();
      return;
    }
    this.active = true;
    this.currentStepIndex = 0;
    this.throwCount = 0;
    this.steps.forEach(s => s.completed = false);
    this.onStepChange = onStepChange;
    this.onComplete = onComplete;
    onStepChange(this.steps[0]);
  }

  advanceOnClick(): void {
    const step = this.getCurrentStep();
    if (!step || step.action !== 'click') return;
    this.nextStep();
  }

  advanceOnThrow(): void {
    const step = this.getCurrentStep();
    if (!step || step.action !== 'throw') return;
    this.throwCount++;
    this.nextStep();
  }

  advanceOnAim(): void {
    const step = this.getCurrentStep();
    if (!step || step.action !== 'aim') return;
    this.nextStep();
  }

  private nextStep(): void {
    if (this.currentStepIndex >= this.steps.length) return;

    this.steps[this.currentStepIndex].completed = true;
    this.currentStepIndex++;

    if (this.currentStepIndex >= this.steps.length) {
      this.active = false;
      this.completed = true;
      this.save();
      this.onComplete?.();
      return;
    }

    this.onStepChange?.(this.steps[this.currentStepIndex]);
  }

  skip(): void {
    this.active = false;
    this.completed = true;
    this.save();
    this.onComplete?.();
  }

  reset(): void {
    this.completed = false;
    this.active = false;
    this.currentStepIndex = 0;
    this.throwCount = 0;
    this.steps.forEach(s => s.completed = false);
    this.save();
  }

  getProgress(): { current: number; total: number } {
    return { current: this.currentStepIndex + 1, total: this.steps.length };
  }
}
