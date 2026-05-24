// Instant replay — records and replays the last throw trajectory
import { Vector3 } from '@iwsdk/core';

interface ReplayFrame {
  position: Vector3;
  time: number;
}

interface ReplayData {
  frames: ReplayFrame[];
  hitPosition: Vector3 | null;
  score: number;
  multiplier: number;
  segment: number;
  duration: number;
}

const MAX_FRAMES = 120; // 2 seconds at 60fps
const REPLAY_SPEED_MULTIPLIER = 0.4; // Slow-mo replay

export class ThrowReplaySystem {
  private recording = false;
  private recordFrames: ReplayFrame[] = [];
  private recordTimer = 0;

  private replaying = false;
  private replayData: ReplayData | null = null;
  private replayTimer = 0;
  private replayCallback: ((position: Vector3, progress: number) => void) | null = null;
  private replayCompleteCallback: (() => void) | null = null;

  private lastReplay: ReplayData | null = null;

  constructor() {}

  startRecording(): void {
    this.recording = true;
    this.recordFrames = [];
    this.recordTimer = 0;
  }

  recordFrame(position: Vector3): void {
    if (!this.recording) return;

    this.recordFrames.push({
      position: position.clone(),
      time: this.recordTimer,
    });

    if (this.recordFrames.length > MAX_FRAMES) {
      this.recordFrames.shift();
    }
  }

  stopRecording(hitPos: Vector3 | null, score: number, multiplier: number, segment: number): ReplayData {
    this.recording = false;
    const data: ReplayData = {
      frames: [...this.recordFrames],
      hitPosition: hitPos ? hitPos.clone() : null,
      score,
      multiplier,
      segment,
      duration: this.recordTimer,
    };
    this.lastReplay = data;
    this.recordFrames = [];
    return data;
  }

  playReplay(
    onFrame: (position: Vector3, progress: number) => void,
    onComplete: () => void
  ): boolean {
    if (!this.lastReplay || this.lastReplay.frames.length < 2) return false;

    this.replaying = true;
    this.replayData = this.lastReplay;
    this.replayTimer = 0;
    this.replayCallback = onFrame;
    this.replayCompleteCallback = onComplete;
    return true;
  }

  isRecording(): boolean {
    return this.recording;
  }

  isReplaying(): boolean {
    return this.replaying;
  }

  hasReplay(): boolean {
    return this.lastReplay !== null && this.lastReplay.frames.length >= 2;
  }

  getLastReplayScore(): number {
    return this.lastReplay?.score ?? 0;
  }

  update(dt: number): void {
    if (this.recording) {
      this.recordTimer += dt;
    }

    if (this.replaying && this.replayData) {
      this.replayTimer += dt * REPLAY_SPEED_MULTIPLIER;
      const totalDuration = this.replayData.duration;

      if (this.replayTimer >= totalDuration) {
        this.replaying = false;
        this.replayCompleteCallback?.();
        this.replayCallback = null;
        this.replayCompleteCallback = null;
        return;
      }

      const progress = this.replayTimer / totalDuration;

      // Interpolate position from recorded frames
      const targetTime = this.replayTimer;
      const frames = this.replayData.frames;
      let frameIdx = 0;
      for (let i = 0; i < frames.length - 1; i++) {
        if (frames[i + 1].time >= targetTime) {
          frameIdx = i;
          break;
        }
        frameIdx = i;
      }

      const f1 = frames[frameIdx];
      const f2 = frames[Math.min(frameIdx + 1, frames.length - 1)];
      const frameDt = f2.time - f1.time;
      const t = frameDt > 0 ? (targetTime - f1.time) / frameDt : 0;

      const pos = new Vector3().lerpVectors(f1.position, f2.position, Math.min(1, Math.max(0, t)));
      this.replayCallback?.(pos, progress);
    }
  }

  cancelReplay(): void {
    this.replaying = false;
    this.replayCallback = null;
    this.replayCompleteCallback = null;
  }

  clearHistory(): void {
    this.lastReplay = null;
  }
}
